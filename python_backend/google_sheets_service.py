from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request # For token refresh
import json
import db_operations # To get transactions
from datetime import datetime

SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

def get_service(tokens_json_string: str):
    creds = None
    if tokens_json_string:
        try:
            token_info = json.loads(tokens_json_string)
            creds = Credentials.from_authorized_user_info(token_info, SCOPES)
        except Exception as e:
            print(f"Error loading credentials from string: {e}")
            return None

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
                # After refresh, new tokens (including access_token) are in creds.
                # This updated token_info should be saved back to settings.
                updated_tokens_json = creds.to_json()
                db_operations.update_setting('google_auth_tokens', updated_tokens_json)
                print("Google OAuth token refreshed and saved.")
            except Exception as e:
                print(f"Error refreshing Google token: {e}")
                # Potentially trigger re-authentication in the frontend
                return None
        else:
            # No valid credentials and cannot refresh, user needs to authenticate.
            print("No valid Google credentials, authentication required.")
            return None # Indicate to frontend that re-auth is needed

    try:
        service = build('sheets', 'v4', credentials=creds)
        return service
    except Exception as e:
        print(f"Error building sheets service: {e}")
        return None

def get_month_sheet_name(date_str_or_obj):
    if isinstance(date_str_or_obj, str):
        dt_obj = datetime.strptime(date_str_or_obj, '%Y-%m-%d')
    else: # assume datetime object
        dt_obj = date_str_or_obj
    return dt_obj.strftime('%b') # Jan, Feb, Mar...

def format_transaction_for_sheet(transaction: dict):
    # Define the order of columns for your Google Sheet
    # Example: Date | Concept | Cost Center | Account | Income | Expense | Balance (of that account after this txn)
    # This needs to match your Google Sheet structure.
    return [
        transaction.get('transaction_date'),
        transaction.get('concept'),
        transaction.get('cost_center_name', ''), # Assuming cost_center_name is fetched
        f"{transaction.get('bank_name', '')} - {transaction.get('account_name', '')}",
        transaction['amount'] if transaction['type'] == 'income' else '',
        transaction['amount'] if transaction['type'] == 'expense' else '',
        # Running balance is tricky to maintain here; usually handled by Sheets formulas or a more complex sync
    ]

def append_transaction_to_gsheet(spreadsheet_id: str, transaction: dict, tokens_json_string: str):
    service = get_service(tokens_json_string)
    if not service:
        return {"success": False, "error": "Google Sheets service unavailable. Check authentication."}

    month_name = get_month_sheet_name(transaction['transaction_date'])
    values_to_append = [format_transaction_for_sheet(transaction)]
    body = {'values': values_to_append}
    
    try:
        result = service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=f"{month_name}!A1", # Appends to the specific month's sheet
            valueInputOption='USER_ENTERED',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()
        # Mark transaction as synced in SQLite
        # db_operations.mark_transaction_synced(transaction['id'], result.get('updates').get('updatedRange'))
        return {"success": True, "result": result}
    except Exception as e:
        print(f"Error appending to Google Sheet: {e}")
        return {"success": False, "error": str(e)}

def create_new_year_gsheet_file(year: int, tokens_json_string: str):
    service = get_service(tokens_json_string)
    if not service:
        return {"success": False, "error": "Google Sheets service unavailable."}

    spreadsheet_body = {
        'properties': {'title': f'IncomeExpenditure_{year}'},
        'sheets': [
            {'properties': {'title': month}} for month in 
            ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        ] + [{'properties': {'title': 'AnnualSummary'}}]
    }
    try:
        spreadsheet = service.spreadsheets().create(body=spreadsheet_body, fields='spreadsheetId,spreadsheetUrl').execute()
        spreadsheet_id = spreadsheet.get('spreadsheetId')
        spreadsheet_url = spreadsheet.get('spreadsheetUrl')
        
        # Save this new spreadsheet_id to app_settings in SQLite
        db_operations.update_setting('current_year_gsheet_id', spreadsheet_id)
        db_operations.update_setting(f'gsheet_id_{year}', spreadsheet_id) # Store per year too

        # Setup headers for each sheet (optional, but good practice)
        headers = ["Date", "Concept", "Cost Centre", "Account", "Income", "Expense", "Running Balance"]
        for sheet_title in [s['properties']['title'] for s in spreadsheet_body['sheets'] if s['properties']['title'] != 'AnnualSummary']:
            body = {'values': [headers]}
            service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id, range=f"{sheet_title}!A1",
                valueInputOption='USER_ENTERED', body=body).execute()
        
        # Setup AnnualSummary headers and basic formulas (can be complex)
        summary_headers = ["Month", "Total Income", "Total Expense", "Net Flow"]
        # Example formulas for AnnualSummary (assuming monthly data starts at row 2)
        # For Jan Income: =SUM(Jan!E2:E)
        # These formulas should be robust.
        # You might want to just set headers and let user add formulas, or use more advanced batchUpdate requests.
        body = {'values': [summary_headers]}
        service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id, range="AnnualSummary!A1",
                valueInputOption='USER_ENTERED', body=body).execute()


        return {"success": True, "spreadsheetId": spreadsheet_id, "spreadsheetUrl": spreadsheet_url}
    except Exception as e:
        print(f"Error creating new Google Sheet: {e}")
        return {"success": False, "error": str(e)}

