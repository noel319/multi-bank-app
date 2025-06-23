import gspread
import json
import os
import tempfile
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import webbrowser
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime, timedelta
import calendar

class GoogleSheetsManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager
        self.connection = None 
        self.SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ]
        
        self.CLIENT_CONFIG = {
            "installed": {
                "client_id": "724572603461-mqtembqr3tidbqgepksk1c8jrelkoi2b.apps.googleusercontent.com",
                "project_id": "evident-sunspot-461001-d6",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": "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",
                "redirect_uris": ["http://localhost:8080"]
            }
        }
    
    def get_google_credentials(self):        
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            user = self.auth.get_user_by_id(self.auth.current_user_id)
            if not user:
                return {"success": False, "error": "User not found"}
            
            creds = None
            
            # Check if user has stored credentials
            if user.get('google_token'):
                try:
                    # Load credentials from database
                    token_data = json.loads(user['google_token'])
                    creds = Credentials.from_authorized_user_info(token_data, self.SCOPES)
                except Exception as e:
                    print(f"Error loading stored credentials: {e}")
                    creds = None
            
            # If there are no valid credentials available, let the user log in
            if not creds or not creds.valid:
                if creds and creds.expired and creds.refresh_token:
                    try:
                        creds.refresh(Request())
                        # Save refreshed token
                        self._save_credentials_to_db(creds)
                    except Exception as e:
                        print(f"Error refreshing token: {e}")
                        creds = None
                
                if not creds:
                    # Start OAuth flow
                    return self._start_oauth_flow()
            
            return {"success": True, "credentials": creds}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get Google credentials: {str(e)}"}
    
    def _start_oauth_flow(self):
        """Start OAuth2 flow for desktop application"""
        try:
            # Create temporary file for client configuration
            with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                json.dump(self.CLIENT_CONFIG, f)
                client_secrets_file = f.name
            
            try:
                # Create flow instance
                flow = InstalledAppFlow.from_client_secrets_file(
                    client_secrets_file, self.SCOPES
                )
                
                # Use local server for OAuth callback
                flow.redirect_uri = 'http://localhost:8080'
                
                # Get authorization URL
                auth_url, _ = flow.authorization_url(prompt='consent')
                
                # Start local server to handle callback
                server_result = {'code': None, 'error': None}
                
                class CallbackHandler(BaseHTTPRequestHandler):
                    def do_GET(self):
                        parsed_url = urlparse(self.path)
                        query_params = parse_qs(parsed_url.query)
                        
                        if 'code' in query_params:
                            server_result['code'] = query_params['code'][0]
                            self.send_response(200)
                            self.send_header('Content-type', 'text/html')
                            self.end_headers()
                            self.wfile.write(b"""
                                <html><body>
                                <h1>Authorization successful!</h1>
                                <p>You can close this window and return to the application.</p>
                                </body></html>
                            """)
                        else:
                            server_result['error'] = query_params.get('error', ['Unknown error'])[0]
                            self.send_response(400)
                            self.send_header('Content-type', 'text/html')
                            self.end_headers()
                            self.wfile.write(b"""
                                <html><body>
                                <h1>Authorization failed!</h1>
                                <p>Please try again.</p>
                                </body></html>
                            """)
                    
                    def log_message(self, format, *args):
                        pass  # Suppress server logs
                
                # Start server in background
                server = HTTPServer(('localhost', 8080), CallbackHandler)
                server_thread = threading.Thread(target=server.handle_request)
                server_thread.start()
                
                # Open browser for authorization
                webbrowser.open(auth_url)
                
                # Wait for callback (with timeout)
                timeout = 120  # 2 minutes
                start_time = time.time()
                while server_result['code'] is None and server_result['error'] is None:
                    if time.time() - start_time > timeout:
                        server.server_close()
                        return {"success": False, "error": "Authorization timeout"}
                    time.sleep(0.5)
                
                server.server_close()
                
                if server_result['error']:
                    return {"success": False, "error": f"Authorization failed: {server_result['error']}"}
                
                if not server_result['code']:
                    return {"success": False, "error": "No authorization code received"}
                
                # Exchange code for token
                flow.fetch_token(code=server_result['code'])
                creds = flow.credentials
                
                # Save credentials to database
                self._save_credentials_to_db(creds)
                
                return {"success": True, "credentials": creds, "message": "Google Sheets connected successfully!"}
                
            finally:
                # Clean up temporary file
                try:
                    os.unlink(client_secrets_file)
                except:
                    pass
            
        except Exception as e:
            return {"success": False, "error": f"OAuth flow failed: {str(e)}"}
    
    def _save_credentials_to_db(self, creds):
        """Save Google credentials to database"""
        try:
            token_data = {
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'token_uri': creds.token_uri,
                'client_id': creds.client_id,
                'client_secret': creds.client_secret,
                'scopes': creds.scopes
            }
            
            # Get database connection
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user 
                SET google_token = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (json.dumps(token_data), self.auth.current_user_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Error saving credentials to database: {e}")  
    
    
    def _save_spreadsheet_id(self, spreadsheet_id):
        """Save spreadsheet ID to database"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user
                SET google_sheet_id = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (spreadsheet_id, self.auth.current_user_id))
            
            conn.commit()
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Error saving spreadsheet ID: {e}")

    def ensure_year_sheet_exists_and_store_id(self, year=None):
        """Ensure the Google Sheet for the given year exists, create if not, and always store the ID."""
        if not year:
            year = datetime.now().year
        # Try to get the spreadsheet ID from DB
        spreadsheet_id = self._get_yearly_spreadsheet_id(year)
        creds_result = self.get_google_credentials()
        if not creds_result['success']:
            return creds_result
        gc = gspread.authorize(creds_result['credentials'])
        spreadsheet = None
        if spreadsheet_id:
            try:
                spreadsheet = gc.open_by_key(spreadsheet_id)
            except Exception:
                spreadsheet = None
        if not spreadsheet:
            # Create and setup the sheet
            result = self._create_and_setup_yearly_sheet(gc, year)
            if result['success']:
                self._save_yearly_spreadsheet_id(year, result['spreadsheet_id'])
            return result
        # Always store the ID (in case it was missing)
        self._save_yearly_spreadsheet_id(year, spreadsheet.id)
        return {
            "success": True,
            "spreadsheet_id": spreadsheet.id,
            "spreadsheet_url": spreadsheet.url,
            "year": year
        }

    def _create_and_setup_yearly_sheet(self, gc, year):
        """Create a new yearly Google Sheet and setup all worksheets."""
        try:
            user = self.auth.get_user_by_id(self.auth.current_user_id)
            user_email = user.get('email') if user else None
            sheet_name = f"FinanceControl_{year}_{self.auth.current_user_id}"
            spreadsheet = gc.create(sheet_name)
            cost_centers = self._get_cost_centers()
            if not cost_centers['success']:
                return cost_centers
            for month in range(1, 13):
                worksheet = self._get_or_create_worksheet(spreadsheet, f"{year}/{month}")
                self._setup_monthly_sheet(worksheet, year, month, cost_centers['cost_centers'])
            summary_sheet = self._get_or_create_worksheet(spreadsheet, "Year Summary", rows=1000, cols=20)
            self._setup_year_summary_sheet(summary_sheet, year, cost_centers['cost_centers'])
            # Remove default Sheet1 if it exists and is empty
            try:
                default_sheet = spreadsheet.worksheet("Sheet1")
                if len(default_sheet.get_all_values()) <= 1:
                    spreadsheet.del_worksheet(default_sheet)
            except Exception:
                pass
            return {
                "success": True,
                "message": f"Yearly Google Sheet for {year} initialized successfully",
                "spreadsheet_id": spreadsheet.id,
                "spreadsheet_url": spreadsheet.url,
                "year": year
            }
        except Exception as e:
            return {"success": False, "error": f"Failed to create/setup yearly sheet: {str(e)}"}

    def _get_or_create_worksheet(self, spreadsheet, title, rows=1000, cols=50):
        """Get worksheet by title or create it if missing."""
        try:
            return spreadsheet.worksheet(title)
        except gspread.WorksheetNotFound:
            return spreadsheet.add_worksheet(title=title, rows=rows, cols=cols)

    def _get_or_create_spreadsheet(self, gc, sheet_name, user_email=None):
        """Get spreadsheet by name or create it if missing."""
        try:
            spreadsheet = gc.open(sheet_name)
        except gspread.SpreadsheetNotFound:
            spreadsheet = gc.create(sheet_name)
            # spreadsheet.share(user_email, perm_type='user')
        return spreadsheet

    def _save_yearly_spreadsheet_id(self, year, spreadsheet_id):
        """Save yearly spreadsheet ID to database (unified)."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO app_settings (key, value, user_id, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (f"google_sheet_{year}", spreadsheet_id, self.auth.current_user_id))
            conn.commit()
            cursor.close()
            conn.close()
        except Exception as e:
            print(f"Error saving yearly spreadsheet ID: {e}")

    def _get_yearly_spreadsheet_id(self, year):
        """Get yearly spreadsheet ID from database (unified)."""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT value FROM app_settings
                WHERE key = ? AND user_id = ?
            """, (f"google_sheet_{year}", self.auth.current_user_id))
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            return result[0] if result else None
        except Exception as e:
            print(f"Error getting yearly spreadsheet ID: {e}")
            return None

    def _get_cost_centers(self):
        """Get all cost centers for the current user"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT id, group_name, cost_center, area
                FROM cost_centers
                WHERE user_id = ?
                ORDER BY group_name, cost_center, area
            """, (self.auth.current_user_id,))
            
            rows = cursor.fetchall()
            cost_centers = []
            
            for row in rows:
                cost_centers.append({
                    'id': row[0],
                    'group_name': row[1],
                    'cost_center': row[2],
                    'area': row[3]
                })
            
            cursor.close()
            conn.close()
            
            return {"success": True, "cost_centers": cost_centers}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get cost centers: {str(e)}"}
    
    def _setup_monthly_sheet(self, worksheet, year, month, cost_centers):
        """Setup monthly sheet with cost center rows and date columns matching the provided style"""
        try:
            # Get number of days in the month
            days_in_month = calendar.monthrange(year, month)[1]
            
            # Clear the worksheet first
            worksheet.clear()
            
            # Create Spanish month names
            spanish_months = {
                1: "enero", 2: "febrero", 3: "marzo", 4: "abril", 5: "mayo", 6: "junio",
                7: "julio", 8: "agosto", 9: "septiembre", 10: "octubre", 11: "noviembre", 12: "diciembre"
            }
            
            # Spanish day names
            spanish_days = ["", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"]
            
            # Create month/year header row (row 1)
            month_headers = []
            for day in range(1, days_in_month + 1):
                month_headers.append(f"{spanish_months[month]} {year}")
            
            # Set the month/year headers starting from column D (index 3)
            if month_headers:
                worksheet.update('D1', [month_headers])
            
            # Create day names row (row 2)
            day_names = []
            for day in range(1, days_in_month + 1):
                # Get the day of week (0=Monday, 6=Sunday)
                day_obj = datetime(year, month, day)
                weekday = day_obj.weekday()
                # Convert to Sunday=0 format and get Spanish name
                spanish_weekday = spanish_days[(weekday + 1) % 7 + 1]
                day_names.append(spanish_weekday)
            
            if day_names:
                worksheet.update('D2', [day_names])
            
            # Create day numbers row (row 3)
            day_numbers = list(range(1, days_in_month + 1))
            if day_numbers:
                worksheet.update('D3', [day_numbers])
            
            # Set the main headers in row 4
            main_headers = ['COST CENTER GROUP', 'COST CENTER', 'AREA / DEPARTMENT / USER / PROJECT']
            worksheet.update('A4', [main_headers])
            
            # Group cost centers by group_name
            grouped_cost_centers = {}
            for cc in cost_centers:
                group = cc['group_name'].upper()
                if group not in grouped_cost_centers:
                    grouped_cost_centers[group] = []
                grouped_cost_centers[group].append(cc)
            
            # Add cost center rows starting from row 5
            current_row = 5
            for group_name, group_cost_centers in grouped_cost_centers.items():
                # Add group header row
                worksheet.update_cell(current_row, 1, group_name)
                current_row += 1
                
                # Add cost centers in this group
                for cc in group_cost_centers:
                    # Column A: Empty (group name only on first row of group)
                    # Column B: Cost Center
                    # Column C: Area/Department
                    worksheet.update_cell(current_row, 2, cc['cost_center'])
                    worksheet.update_cell(current_row, 3, cc['area'])
                    current_row += 1
            
            # Apply formatting to match the style
            self._apply_monthly_sheet_formatting(worksheet, year, month, days_in_month, current_row)
            
            # Fill existing transaction data
            self._fill_monthly_transaction_data(worksheet, year, month, cost_centers)
            
        except Exception as e:
            print(f"Error setting up monthly sheet: {str(e)}")
    
    def _apply_monthly_sheet_formatting(self, worksheet, year, month, days_in_month, last_row):
        """Apply formatting to match the provided style"""
        try:
            # Format month/year header (row 1)
            worksheet.format('D1:Z1', {
                'backgroundColor': {'red': 1.0, 'green': 0.8, 'blue': 0.8},  # Light red
                'textFormat': {'bold': True, 'fontSize': 10},
                'horizontalAlignment': 'CENTER'
            })
            
            # Format day names (row 2) - highlight weekends in red
            for day in range(1, days_in_month + 1):
                col_letter = chr(ord('D') + day - 1)
                day_obj = datetime(year, month, day)
                weekday = day_obj.weekday()
                
                if weekday in [5, 6]:  # Saturday, Sunday
                    worksheet.format(f'{col_letter}2', {
                        'backgroundColor': {'red': 1.0, 'green': 0.6, 'blue': 0.6},  # Red
                        'textFormat': {'bold': True, 'fontSize': 9},
                        'horizontalAlignment': 'CENTER'
                    })
                else:
                    worksheet.format(f'{col_letter}2', {
                        'backgroundColor': {'red': 0.8, 'green': 0.8, 'blue': 1.0},  # Light blue
                        'textFormat': {'bold': True, 'fontSize': 9},
                        'horizontalAlignment': 'CENTER'
                    })
            
            # Format day numbers (row 3)
            worksheet.format('D3:Z3', {
                'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9},  # Light gray
                'textFormat': {'bold': True, 'fontSize': 10},
                'horizontalAlignment': 'CENTER'
            })
            
            # Format main headers (row 4)
            worksheet.format('A4:C4', {
                'backgroundColor': {'red': 0.8, 'green': 0.8, 'blue': 0.8},  # Gray
                'textFormat': {'bold': True, 'fontSize': 10},
                'horizontalAlignment': 'CENTER'
            })
            
            # Format cost center group names (red background)
            # This would need to be applied to specific cells with group names
            
            # Add borders to all cells
            worksheet.format(f'A1:Z{last_row}', {
                'borders': {
                    'top': {'style': 'SOLID', 'width': 1},
                    'bottom': {'style': 'SOLID', 'width': 1},
                    'left': {'style': 'SOLID', 'width': 1},
                    'right': {'style': 'SOLID', 'width': 1}
                }
            })
            
        except Exception as e:
            print(f"Error applying formatting: {str(e)}")
    
    def _setup_year_summary_sheet(self, worksheet, year, cost_centers):
        """Setup year summary sheet with cost center rows and month columns"""
        try:
            # Create headers: Cost Center Group, Cost Center, Area, then months
            headers = ['Cost Center Group', 'Cost Center', 'Area']
            for month in range(1, 13):
                headers.append(f"{year}/{month}")
            
            # Clear and set headers
            worksheet.clear()
            worksheet.update('A1', [headers])
            
            # Add cost center rows
            if cost_centers:
                cost_center_data = []
                for cc in cost_centers:
                    row = [cc['group_name'], cc['cost_center'], cc['area']]
                    # Add empty cells for each month
                    row.extend([''] * 12)
                    cost_center_data.append(row)
                
                # Update cost center data starting from row 2
                if cost_center_data:
                    range_name = f'A2:A{len(cost_center_data) + 1}'
                    worksheet.update(range_name, cost_center_data)
            
            # Fill existing monthly transaction data
            self._fill_year_summary_data(worksheet, year, cost_centers)
            
        except Exception as e:
            print(f"Error setting up year summary sheet: {str(e)}")
    
    def _fill_monthly_transaction_data(self, worksheet, year, month, cost_centers):
        """Fill monthly sheet with existing transaction data"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get transactions for the specific month
            cursor.execute("""
                SELECT t.date, t.price, t.cost_center_id, t.state
                FROM transactions t
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ? 
                AND strftime('%Y', t.date) = ? 
                AND strftime('%m', t.date) = ?
            """, (self.auth.current_user_id, str(year), f"{month:02d}"))
            
            transactions = cursor.fetchall()
            
            # Process transactions and update cells
            for trans in transactions:
                trans_date, price, cost_center_id, state = trans
                
                if cost_center_id:
                    # Find cost center row
                    for i, cc in enumerate(cost_centers):
                        if cc['id'] == cost_center_id:
                            # Calculate column for the day
                            day = int(trans_date.split('-')[2])
                            col = 3 + day  # 3 for cost center columns + day
                            row = i + 2    # +2 because row 1 is header and we start from row 2
                            
                            # Get current value in cell
                            try:
                                current_val = worksheet.cell(row, col).value
                                current_val = float(current_val) if current_val else 0
                            except:
                                current_val = 0
                            
                            # Add transaction amount (negative for expenses, positive for income)
                            if state == "Expense":
                                new_val = current_val - abs(float(price))
                            else:
                                new_val = current_val + abs(float(price))
                            
                            # Update cell
                            worksheet.update_cell(row, col, new_val)
                            break
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Error filling monthly transaction data: {str(e)}")
    
    def _fill_year_summary_data(self, worksheet, year, cost_centers):
        """Fill year summary sheet with monthly transaction data"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get monthly transaction summaries
            cursor.execute("""
                SELECT 
                    strftime('%m', mt.month_date) as month,
                    mt.cost_center_id,
                    mt.total_income - mt.total_expenses as net_amount
                FROM month_transactions mt
                JOIN bank b ON mt.bank_id = b.id
                WHERE b.user_id = ? 
                AND strftime('%Y', mt.month_date) = ?
            """, (self.auth.current_user_id, str(year)))
            
            monthly_data = cursor.fetchall()
            
            # Process monthly data and update cells
            for data in monthly_data:
                month, cost_center_id, net_amount = data
                
                if cost_center_id:
                    # Find cost center row
                    for i, cc in enumerate(cost_centers):
                        if cc['id'] == cost_center_id:
                            # Calculate column for the month
                            col = 3 + int(month)  # 3 for cost center columns + month
                            row = i + 2           # +2 because row 1 is header and we start from row 2
                            
                            # Update cell
                            worksheet.update_cell(row, col, float(net_amount))
                            break
            
            cursor.close()
            conn.close()
            
        except Exception as e:
            print(f"Error filling year summary data: {str(e)}")

    # NEW FUNCTION 1: Initialize yearly Google Sheet with monthly and summary sheets
    def initialize_yearly_google_sheet(self, year=None):
        """Initialize Google Sheet for the current year with monthly sheets and year summary"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            if not year:
                year = datetime.now().year
            
            # Get credentials
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return creds_result
            
            creds = creds_result['credentials']
            gc = gspread.authorize(creds)
            
            # Create yearly spreadsheet
            sheet_name = f"FinanceControl_{year}_{self.auth.current_user_id}"
            
            try:
                # Try to open existing spreadsheet
                spreadsheet = gc.open(sheet_name)
            except gspread.SpreadsheetNotFound:
                # Create new spreadsheet
                spreadsheet = gc.create(sheet_name)
                
                # Set up initial headers
                worksheet = spreadsheet.sheet1
                worksheet.update('A1:H1', [[
                    'Date', 'Bank', 'Amount', 'Description', 
                    'Category', 'Cost Center', 'Transaction ID', 'Created At'
                ]])
            
            # Get cost centers from database
            cost_centers = self._get_cost_centers()
            if not cost_centers['success']:
                return cost_centers
            
            # Create monthly sheets (1-12)
            for month in range(1, 13):
                sheet_title = f"{year}/{month}"
                try:
                    # Try to get existing sheet
                    worksheet = spreadsheet.worksheet(sheet_title)
                except gspread.WorksheetNotFound:
                    # Create new sheet
                    worksheet = spreadsheet.add_worksheet(title=sheet_title, rows=1000, cols=50)
                
                # Setup monthly sheet
                self._setup_monthly_sheet(worksheet, year, month, cost_centers['cost_centers'])
            
            # Create year summary sheet
            try:
                summary_sheet = spreadsheet.worksheet("Year Summary")
            except gspread.WorksheetNotFound:
                summary_sheet = spreadsheet.add_worksheet(title="Year Summary", rows=1000, cols=20)
            
            self._setup_year_summary_sheet(summary_sheet, year, cost_centers['cost_centers'])
            
            # Remove default Sheet1 if it exists and is empty
            try:
                default_sheet = spreadsheet.worksheet("Sheet1")
                if len(default_sheet.get_all_values()) <= 1:  # Only header or empty
                    spreadsheet.del_worksheet(default_sheet)
            except:
                pass
            
            # Save yearly spreadsheet ID
            self._save_yearly_spreadsheet_id(year, spreadsheet.id)
            
            return {
                "success": True,
                "message": f"Yearly Google Sheet for {year} initialized successfully",
                "spreadsheet_id": spreadsheet.id,
                "spreadsheet_url": spreadsheet.url,
                "year": year
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to initialize yearly sheet: {str(e)}"}

    # NEW FUNCTION 2: Add value to specific cell in Google Sheet
    def add_value_to_sheet_cell(self, year, month, cost_center_id, day, amount, transaction_type):
        """Add value to specific cell in Google Sheet"""
        try:
            # Get yearly spreadsheet
            spreadsheet_id = self._get_yearly_spreadsheet_id(year)
            if not spreadsheet_id:
                # Initialize sheet if it doesn't exist
                init_result = self.initialize_yearly_google_sheet(year)
                if not init_result['success']:
                    return init_result
                spreadsheet_id = init_result['spreadsheet_id']
            
            # Get credentials and client
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return creds_result
            
            gc = gspread.authorize(creds_result['credentials'])
            spreadsheet = gc.open_by_key(spreadsheet_id)
            
            # Get monthly worksheet
            sheet_title = f"{year}/{month}"
            try:
                worksheet = spreadsheet.worksheet(sheet_title)
            except gspread.WorksheetNotFound:
                return {"success": False, "error": f"Sheet {sheet_title} not found"}
            
            # Get cost centers to find the row
            cost_centers_result = self._get_cost_centers()
            if not cost_centers_result['success']:
                return cost_centers_result
            
            cost_centers = cost_centers_result['cost_centers']
            
            # Find the row for this cost center
            target_row = None
            for i, cc in enumerate(cost_centers):
                if cc['id'] == cost_center_id:
                    target_row = i + 2  # +2 because row 1 is header and we start from row 2
                    break
            
            if target_row is None:
                return {"success": False, "error": "Cost center not found"}
            
            # Calculate column for the day (3 cost center columns + day)
            target_col = 3 + day
            
            # Get current value in cell
            try:
                current_val = worksheet.cell(target_row, target_col).value
                current_val = float(current_val) if current_val else 0
            except:
                current_val = 0
            
            # Calculate new value based on transaction type
            if transaction_type == "Expense":
                new_val = current_val - abs(float(amount))
            else:  # Income
                new_val = current_val + abs(float(amount))
            
            # Update cell
            worksheet.update_cell(target_row, target_col, new_val)
            
            # Also update year summary sheet
            self._update_year_summary_cell(spreadsheet, year, month, cost_center_id, amount, transaction_type, cost_centers)
            
            return {
                "success": True,
                "message": f"Successfully updated cell in {sheet_title}",
                "row": target_row,
                "col": target_col,
                "new_value": new_val
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to update sheet cell: {str(e)}"}
    
    def _update_year_summary_cell(self, spreadsheet, year, month, cost_center_id, amount, transaction_type, cost_centers):
        """Update corresponding cell in year summary sheet"""
        try:
            # Get year summary worksheet
            summary_sheet = spreadsheet.worksheet("Year Summary")
            
            # Find the row for this cost center
            target_row = None
            for i, cc in enumerate(cost_centers):
                if cc['id'] == cost_center_id:
                    target_row = i + 2  # +2 because row 1 is header and we start from row 2
                    break
            
            if target_row is None:
                return
            
            # Calculate column for the month (3 cost center columns + month)
            target_col = 3 + month
            
            # Get current value in cell
            try:
                current_val = summary_sheet.cell(target_row, target_col).value
                current_val = float(current_val) if current_val else 0
            except:
                current_val = 0
            
            # Calculate new value based on transaction type
            if transaction_type == "Expense":
                new_val = current_val - abs(float(amount))
            else:  # Income
                new_val = current_val + abs(float(amount))
            
            # Update cell
            summary_sheet.update_cell(target_row, target_col, new_val)
            
        except Exception as e:
            print(f"Error updating year summary cell: {str(e)}")

    # NEW FUNCTION 3: Update month_transactions table
    def update_month_transactions(self, bank_id, cost_center_id, month_date, amount, transaction_type):
        """Update or create month_transactions record"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Check if record exists
            cursor.execute("""
                SELECT id, total_income, total_expenses
                FROM month_transactions
                WHERE bank_id = ? AND cost_center_id = ? AND month_date = ?
            """, (bank_id, cost_center_id, month_date))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update existing record
                record_id, current_income, current_expenses = existing
                
                if transaction_type == "Income":
                    new_income = float(current_income) + float(amount)
                    new_expenses = float(current_expenses)
                else:  # Expense
                    new_income = float(current_income)
                    new_expenses = float(current_expenses) + float(amount)
                
                cursor.execute("""
                    UPDATE month_transactions
                    SET total_income = ?, total_expenses = ?
                    WHERE id = ?
                """, (new_income, new_expenses, record_id))
                
            else:
                # Create new record
                # Get bank and cost center info
                cursor.execute("""
                    SELECT bank_name, account
                    FROM bank
                    WHERE id = ?
                """, (bank_id,))
                bank_info = cursor.fetchone()
                
                cursor.execute("""
                    SELECT name
                    FROM cost_centers
                    WHERE id = ?
                """, (cost_center_id,))
                cost_center_info = cursor.fetchone()
                
                if bank_info and cost_center_info:
                    bank_name, account_name = bank_info
                    cost_center_name = cost_center_info[0]
                    
                    if transaction_type == "Income":
                        total_income = float(amount)
                        total_expenses = 0
                    else:  # Expense
                        total_income = 0
                        total_expenses = float(amount)
                    
                    cursor.execute("""
                        INSERT INTO month_transactions (
                            month_date, bank_id, cost_center_id, bank_name, 
                            account_name, state, cost_center_name, 
                            total_income, total_expenses, user_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        month_date, bank_id, cost_center_id, bank_name,
                        account_name, transaction_type, cost_center_name,
                        total_income, total_expenses, self.auth.current_user_id
                    ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Month transactions updated successfully"}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to update month transactions: {str(e)}"}

    # NEW FUNCTION 4: Add cost center to all sheets
    def add_cost_center_to_all_sheets(self, cost_center_data):
        """Add new cost center row to all existing Google Sheets"""
        try:
            current_year = datetime.now().year
            
            # Get all years that have spreadsheets
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT key, value FROM app_settings
                WHERE key LIKE 'google_sheet_%' AND user_id = ?
            """, (self.auth.current_user_id,))
            
            spreadsheet_records = cursor.fetchall()
            cursor.close()
            conn.close()
            
            if not spreadsheet_records:
                return {"success": True, "message": "No existing spreadsheets to update"}
            
            # Get credentials
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return creds_result
            
            gc = gspread.authorize(creds_result['credentials'])
            
            updated_sheets = []
            
            for record in spreadsheet_records:
                try:
                    # Extract year from key (format: 'google_sheet_YYYY')
                    year = int(record[0].split('_')[-1])
                    spreadsheet_id = record[1]
                    
                    spreadsheet = gc.open_by_key(spreadsheet_id)
                    
                    # Update monthly sheets (1-12)
                    for month in range(1, 13):
                        sheet_title = f"{year}/{month}"
                        try:
                            worksheet = spreadsheet.worksheet(sheet_title)
                            self._add_cost_center_row_to_sheet(worksheet, cost_center_data, year, month, is_monthly=True)
                            updated_sheets.append(sheet_title)
                        except gspread.WorksheetNotFound:
                            # Sheet doesn't exist, skip
                            continue
                    
                    # Update year summary sheet
                    try:
                        summary_sheet = spreadsheet.worksheet("Year Summary")
                        self._add_cost_center_row_to_sheet(summary_sheet, cost_center_data, year, None, is_monthly=False)
                        updated_sheets.append(f"{year} - Year Summary")
                    except gspread.WorksheetNotFound:
                        # Sheet doesn't exist, skip
                        continue
                        
                except Exception as e:
                    print(f"Error updating spreadsheet for year {year}: {str(e)}")
                    continue
            
            return {
                "success": True,
                "message": f"Cost center added to {len(updated_sheets)} sheets",
                "updated_sheets": updated_sheets
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to add cost center to sheets: {str(e)}"}
    
    def _add_cost_center_row_to_sheet(self, worksheet, cost_center_data, year, month, is_monthly=True):
        """Add cost center row to a specific sheet using the new format"""
        try:
            # Get all current values to understand the structure
            all_values = worksheet.get_all_values()
            
            if len(all_values) < 5:  # Not enough rows for the headers
                return
            
            # Find the appropriate group or add new group
            group_name = cost_center_data['group_name'].upper()
            insert_row = None
            
            # Look for existing group
            for i, row in enumerate(all_values[4:], start=5):  # Start from row 5
                if len(row) > 0 and row[0] == group_name:
                    # Found the group, find the end of this group
                    j = i + 1
                    while j < len(all_values) and (len(all_values[j]) == 0 or all_values[j][0] == ''):
                        j += 1
                    insert_row = j
                    break
            
            if insert_row is None:
                # Group doesn't exist, add at the end
                insert_row = len(all_values) + 1
                # First insert the group header
                group_row = [group_name, '', '']
                if is_monthly:
                    days_in_month = calendar.monthrange(year, month)[1]
                    group_row.extend([''] * days_in_month)
                else:
                    group_row.extend([''] * 12)
                worksheet.insert_row(group_row, insert_row)
                insert_row += 1
            
            # Prepare cost center row data
            new_row = ['', cost_center_data['cost_center'], cost_center_data['area']]
            
            if is_monthly:
                # Add empty cells for each day of the month
                days_in_month = calendar.monthrange(year, month)[1]
                new_row.extend([''] * days_in_month)
            else:
                # Add empty cells for each month (12 months)
                new_row.extend([''] * 12)
            
            # Insert the new cost center row
            worksheet.insert_row(new_row, insert_row)
            
            # Apply formatting to the new group if it was just created
            if all_values[insert_row-2][0] == group_name:  # New group was added
                worksheet.format(f'A{insert_row-1}', {
                    'backgroundColor': {'red': 1.0, 'green': 0.6, 'blue': 0.6},  # Red background for group
                    'textFormat': {'bold': True}
                })
            
        except Exception as e:
            print(f"Error adding cost center row to sheet: {str(e)}")

    # Integration methods for billing_manager.py
    def handle_billing_transaction(self, transaction_data):
        """Handle new billing transaction - update sheets and month_transactions"""
        try:
            # Extract data
            date_str = transaction_data['date']
            amount = float(transaction_data['price'])
            cost_center_id = transaction_data.get('cost_center_id')
            bank_id = transaction_data['bank_id']
            transaction_type = transaction_data['state']  # "Income" or "Expense"
            
            if not cost_center_id:
                return {"success": True, "message": "No cost center specified, skipping sheet update"}
            
            # Parse date
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            year = date_obj.year
            month = date_obj.month
            day = date_obj.day
            
            # Create month_date for month_transactions (first day of month)
            month_date = f"{year}-{month:02d}-01"
            
            # Update Google Sheets
            sheet_result = self.add_value_to_sheet_cell(
                year, month, cost_center_id, day, amount, transaction_type
            )
            
            # Update month_transactions table
            month_result = self.update_month_transactions(
                bank_id, cost_center_id, month_date, amount, transaction_type
            )
            
            return {
                "success": True,
                "message": "Billing transaction processed successfully",
                "sheet_update": sheet_result,
                "month_transactions_update": month_result
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to handle billing transaction: {str(e)}"}

    def sync_transactions_to_sheets(self):
        """Sync all transactions to Google Sheets"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            user = self.auth.get_user_by_id(self.auth.current_user_id)
            if not user or not user.get('google_token'):
                return {"success": False, "error": "Google Sheets not connected"}
            
            # Get credentials
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return creds_result
            
            creds = creds_result['credentials']
            gc = gspread.authorize(creds)
            
            # Open spreadsheet
            if user.get('google_sheet_id'):
                try:
                    spreadsheet = gc.open_by_key(user['google_sheet_id'])
                except:
                    # If can't open by ID, try to reconnect
                    connect_result = self.connect_to_google_sheets()
                    if not connect_result['success']:
                        return connect_result
                    spreadsheet = gc.open_by_key(connect_result['spreadsheet_id'])
            else:
                # Connect first
                connect_result = self.connect_to_google_sheets()
                if not connect_result['success']:
                    return connect_result
                spreadsheet = gc.open_by_key(connect_result['spreadsheet_id'])
            
            worksheet = spreadsheet.sheet1
            
            # Get all transactions for user - Fixed query to match actual schema
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                SELECT t.id, t.date, t.bank_name, t.price as amount, 
                       t.state as description, '' as category, 
                       t.cost_center_name, t.created_at
                FROM transactions t
                WHERE t.bank_id IN (
                    SELECT id FROM bank WHERE user_id = ?
                )
                ORDER BY t.date DESC
            """, (self.auth.current_user_id,))
            
            transactions = cursor.fetchall()
            cursor.close()
            conn.close()
            
            # Clear existing data (except headers)
            worksheet.clear()
            
            # Add headers
            headers = ['Date', 'Bank', 'Amount', 'Description', 'Category', 'Cost Center', 'Transaction ID', 'Created At']
            worksheet.update('A1:H1', [headers])
            
            # Add transaction data
            if transactions:
                data = []
                for trans in transactions:
                    # Handle both dict and tuple responses
                    if isinstance(trans, dict):
                        data.append([
                            trans.get('date', ''),
                            trans.get('bank_name', ''),
                            trans.get('amount', 0),
                            trans.get('description', ''),
                            trans.get('category', ''),
                            trans.get('cost_center_name', ''),
                            trans.get('id', ''),
                            trans.get('created_at', '')
                        ])
                    else:  # tuple
                        data.append([
                            trans[1] if len(trans) > 1 else '',  # date
                            trans[2] if len(trans) > 2 else '',  # bank_name
                            trans[3] if len(trans) > 3 else 0,   # amount
                            trans[4] if len(trans) > 4 else '',  # description
                            trans[5] if len(trans) > 5 else '',  # category
                            trans[6] if len(trans) > 6 else '',  # cost_center_name
                            trans[0] if len(trans) > 0 else '',  # id
                            trans[7] if len(trans) > 7 else ''   # created_at
                        ])
                
                # Batch update for better performance
                worksheet.update(f'A2:H{len(data) + 1}', data)
            
            return {
                "success": True, 
                "message": f"Successfully synced {len(transactions)} transactions to Google Sheets",
                "transactions_count": len(transactions)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to sync transactions: {str(e)}"}
    
    def check_connection_status(self):
        """Check if Google Sheets is connected and working"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "connected": False, "error": "User not authenticated"}
            
            user = self.auth.get_user_by_id(self.auth.current_user_id)
            if not user or not user.get('google_token'):
                return {"success": True, "connected": False, "message": "Google Sheets not connected"}
            
            # Try to verify connection
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return {"success": True, "connected": False, "error": creds_result['error']}
            
            # Test connection by trying to access Drive
            creds = creds_result['credentials']
            drive_service = build('drive', 'v3', credentials=creds)
            drive_service.about().get(fields="user").execute()
            
            return {
                "success": True, 
                "connected": True, 
                "message": "Google Sheets connected",
                "spreadsheet_id": user.get('google_sheet_id')
            }
            
        except Exception as e:
            return {"success": True, "connected": False, "error": f"Connection check failed: {str(e)}"}
    
    def disconnect_google_sheets(self):
        """Disconnect Google Sheets by removing tokens"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE user 
                SET google_token = NULL, google_sheet_id = NULL, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (self.auth.current_user_id,))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {"success": True, "message": "Successfully disconnected from Google Sheets"}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to disconnect: {str(e)}"}
    
    def sync_with_google_sheets(self):
        """Main sync method called from the frontend"""
        try:
            # Check if connected
            status = self.check_connection_status()
            if not status['connected']:
                # Try to connect first
                connect_result = self.connect_to_google_sheets()
                if not connect_result['success']:
                    return connect_result
            
            # Sync transactions
            return self.sync_transactions_to_sheets()
            
        except Exception as e:
            return {"success": False, "error": f"Sync failed: {str(e)}"}