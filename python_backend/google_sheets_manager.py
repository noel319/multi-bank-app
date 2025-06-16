import gspread
import json
import os
import pickle
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

class GoogleSheetsManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager
        self.SCOPES = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
        ]
        
        # You'll need to get these from Google Cloud Console
        # Download the OAuth2 client configuration
        self.CLIENT_CONFIG = {
            "installed": {
                "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
                "project_id": "your-project-id",
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": "YOUR_CLIENT_SECRET",
                "redirect_uris": ["http://localhost:8080"]
            }
        }
    
    def get_google_credentials(self):
        """Get or refresh Google credentials for the current user"""
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
            
            # Update user record with Google token
            cursor = self.db.get_cursor()
            cursor.execute("""
                UPDATE users 
                SET google_token = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (json.dumps(token_data), self.auth.current_user_id))
            
            self.db.connection.commit()
            cursor.close()
            
        except Exception as e:
            print(f"Error saving credentials to database: {e}")
    
    def connect_to_google_sheets(self):
        """Connect to Google Sheets and verify access"""
        try:
            # Get credentials
            creds_result = self.get_google_credentials()
            if not creds_result['success']:
                return creds_result
            
            creds = creds_result['credentials']
            
            # Create gspread client
            gc = gspread.authorize(creds)
            
            # Try to access Google Drive to verify connection
            drive_service = build('drive', 'v3', credentials=creds)
            
            # Check if our app's spreadsheet exists
            app_sheet_name = f"FinanceControl_Transactions_{self.auth.current_user_id}"
            
            try:
                # Try to open existing spreadsheet
                spreadsheet = gc.open(app_sheet_name)
            except gspread.SpreadsheetNotFound:
                # Create new spreadsheet
                spreadsheet = gc.create(app_sheet_name)
                
                # Set up initial headers
                worksheet = spreadsheet.sheet1
                worksheet.update('A1:H1', [[
                    'Date', 'Bank', 'Amount', 'Description', 
                    'Category', 'Cost Center', 'Transaction ID', 'Created At'
                ]])
                
                # Share with user's email
                user = self.auth.get_user_by_id(self.auth.current_user_id)
                if user and user.get('email'):
                    spreadsheet.share(user['email'], perm_type='user', role='owner')
            
            # Store spreadsheet ID in database
            self._save_spreadsheet_id(spreadsheet.id)
            
            return {
                "success": True, 
                "message": "Successfully connected to Google Sheets!",
                "spreadsheet_id": spreadsheet.id,
                "spreadsheet_url": spreadsheet.url
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to connect to Google Sheets: {str(e)}"}
    
    def _save_spreadsheet_id(self, spreadsheet_id):
        """Save spreadsheet ID to database"""
        try:
            cursor = self.db.get_cursor()
            cursor.execute("""
                UPDATE users 
                SET google_sheet_id = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (spreadsheet_id, self.auth.current_user_id))
            
            self.db.connection.commit()
            cursor.close()
            
        except Exception as e:
            print(f"Error saving spreadsheet ID: {e}")
    
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
            
            # Get all transactions for user
            cursor = self.db.get_cursor()
            cursor.execute("""
                SELECT t.*, b.bank_name, cc.name as cost_center_name
                FROM transactions t
                LEFT JOIN banks b ON t.bank_id = b.id
                LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
                WHERE t.user_id = ?
                ORDER BY t.date DESC
            """, (self.auth.current_user_id,))
            
            transactions = cursor.fetchall()
            cursor.close()
            
            # Clear existing data (except headers)
            worksheet.clear()
            
            # Add headers
            headers = ['Date', 'Bank', 'Amount', 'Description', 'Category', 'Cost Center', 'Transaction ID', 'Created At']
            worksheet.update('A1:H1', [headers])
            
            # Add transaction data
            if transactions:
                data = []
                for trans in transactions:
                    data.append([
                        trans['date'],
                        trans['bank_name'] or '',
                        trans['amount'],
                        trans['description'] or '',
                        trans['category'] or '',
                        trans['cost_center_name'] or '',
                        trans['id'],
                        trans['created_at']
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
            
            cursor = self.db.get_cursor()
            cursor.execute("""
                UPDATE users 
                SET google_token = NULL, google_sheet_id = NULL, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            """, (self.auth.current_user_id,))
            
            self.db.connection.commit()
            cursor.close()
            
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