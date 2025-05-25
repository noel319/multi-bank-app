import sys
import json
import argparse
from . import db_operations
from . import google_sheets_service
from . import bank_api_service # Placeholder
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description="Python backend for Finance App")
    parser.add_argument("action", type=str, help="Action to perform")
    parser.add_argument("--payload", type=str, default="{}", help="JSON payload for the action")

    args = parser.parse_args()
    action = args.action
    try:
        payload = json.loads(args.payload)
    except json.JSONDecodeError:
        print(json.dumps({"success": False, "error": "Invalid JSON payload"}))
        sys.exit(1)

    result = {"success": False, "data": None, "error": None}

    try:
        # Account Actions
        if action == "get_all_accounts":
            result["data"] = db_operations.get_all_accounts()
            result["success"] = True
        elif action == "add_account":
            # Payload expected: {account_name, bank_name, balance, currency, ...other optional fields}
            new_account = db_operations.add_account(payload)
            if new_account:
                result["data"] = new_account
                result["success"] = True
            else: result["error"] = "Failed to add account"
        elif action == "update_account":
            # Payload: {id, ...fields_to_update}
            if db_operations.update_account(payload.pop('id'), payload):
                result["data"] = db_operations.get_account_by_id(payload['id']) # Return updated
                result["success"] = True
            else: result["error"] = "Failed to update account"
        elif action == "delete_account":
            if db_operations.delete_account(payload.get('id')):
                result["success"] = True
            else: result["error"] = "Failed to delete account"

        # Transaction Actions
        elif action == "add_transaction":
            # Payload: {account_id, concept, amount, type, transaction_date, cost_center_id, notes, currency}
            # Ensure date is handled correctly (string YYYY-MM-DD)
            if 'transaction_date' not in payload or not payload['transaction_date']:
                 payload['transaction_date'] = datetime.now().strftime('%Y-%m-%d') # Auto-assign if not provided

            new_transaction_result = db_operations.add_transaction(payload)
            if new_transaction_result:
                result["data"] = new_transaction_result
                result["success"] = True
                
                # Auto-sync to Google Sheets if configured
                gsheet_id = db_operations.get_setting('current_year_gsheet_id')
                g_tokens_json = db_operations.get_setting('google_auth_tokens')
                if gsheet_id and g_tokens_json:
                    # Fetch enriched transaction data if needed for sheet formatting
                    # For now, pass the result which contains necessary fields
                    gs_result = google_sheets_service.append_transaction_to_gsheet(
                        gsheet_id,
                        new_transaction_result, # The dict returned by add_transaction
                        g_tokens_json
                    )
                    if not gs_result.get("success"):
                        print(f"Warning: Transaction added to DB but failed to sync to GSheet: {gs_result.get('error')}")
                        # You might want to queue this for later sync
            else:
                result["error"] = "Failed to add transaction"
        elif action == "get_transactions_for_account":
            result["data"] = db_operations.get_transactions_for_account(
                payload.get('account_id'),
                payload.get('limit', 50),
                payload.get('offset', 0)
            )
            result["success"] = True
        elif action == "get_all_transactions":
            result["data"] = db_operations.get_all_transactions(
                payload.get('limit', 100),
                payload.get('offset', 0)
            )
            result["success"] = True

        # Cost Center Actions
        elif action == "get_all_cost_centers":
            result["data"] = db_operations.get_all_cost_centers()
            result["success"] = True
        elif action == "add_cost_center":
            # Payload: {name, type, color (optional)}
            cc = db_operations.add_cost_center(payload.get('name'), payload.get('type'), payload.get('color'))
            if cc:
                result["data"] = cc
                result["success"] = True
            else: result["error"] = "Failed to add cost center (name might exist)"
        # ... update_cost_center, delete_cost_center

        # Settings Actions
        elif action == "get_setting": # Payload: {key}
            result["data"] = {"key": payload.get('key'), "value": db_operations.get_setting(payload.get('key'))}
            result["success"] = True
        elif action == "update_setting": # Payload: {key, value}
            if db_operations.update_setting(payload.get('key'), payload.get('value')):
                result["success"] = True
            else: result["error"] = "Failed to update setting"

        # Google Sheets Actions
        elif action == "create_new_year_gsheet": # Payload: {year, tokens_json_string}
            gs_result = google_sheets_service.create_new_year_gsheet_file(
                payload.get('year'),
                payload.get('tokens_json_string') # Pass tokens from frontend/Electron
            )
            result.update(gs_result) # Merge success, data, error from gs_result

        # Bank API Actions (Placeholders - these are very complex)
        elif action == "sync_bank_account": # Payload: {account_id}
            # 1. Get account details (api_integration_id) from db_operations
            # 2. Retrieve secure access_token (e.g., from OS keychain, passed by Electron)
            # 3. Call bank_api_service.fetch_transactions_from_bank
            # 4. For each new transaction:
            #    - Check if bank_transaction_id already exists in SQLite (de-duplication)
            #    - If new, call db_operations.add_transaction (need to map/categorize concept)
            # 5. Update account balance in SQLite with bank_api_service.get_account_balance_from_bank
            # 6. Update last_synced_at for the account
            # This would likely be a background task triggered by Electron, notifying UI on completion.
            account_id_to_sync = payload.get('account_id')
            account_info = db_operations.get_account_by_id(account_id_to_sync)
            # Securely get access_token for account_info['api_integration_id']
            # For demo, assume it's directly in payload (NOT FOR PRODUCTION)
            access_token = payload.get('access_token')
            if account_info and account_info['api_integration_id'] and access_token:
                bank_data = bank_api_service.fetch_transactions_from_bank(
                    account_info['api_integration_id'],
                    access_token,
                    account_info.get('last_synced_at')
                )
                if bank_data and bank_data['success']:
                    # Process bank_data['transactions'] and update bank_data['new_balance']
                    # ... (complex logic for de-duplication, adding to SQLite) ...
                    db_operations.update_account(account_id_to_sync, {"balance": bank_data['new_balance'], "last_synced_at": datetime.now().isoformat()})
                    result["data"] = {"message": "Bank sync placeholder successful", "new_balance": bank_data['new_balance']}
                    result["success"] = True
                else:
                    result["error"] = "Bank sync failed"
            else:
                result["error"] = "Account not configured for API sync or missing token."


        else:
            result["error"] = f"Unknown action: {action}"

    except Exception as e:
        import traceback
        result["error"] = f"An unexpected error occurred: {str(e)}"
        result["traceback"] = traceback.format_exc() # For debugging

    print(json.dumps(result))

if __name__ == "__main__":
    # Ensure the database exists before running any actions
    from .database_setup import create_tables
    create_tables()
    main()