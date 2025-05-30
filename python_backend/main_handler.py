import json
import sys
import traceback
from database import DatabaseManager
from bankmanager import BankManager 
from auth import AuthManager
from homedata import HomeDataManager 
from googlesheet import GoogleSheetsManager 
from transaction import TransactionManager 

def main():
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "No action provided"}))
            return
        
        action = sys.argv[1]
        payload = {}
        
        # Parse payload if provided
        if len(sys.argv) > 3 and sys.argv[2] == '--payload':
            try:
                payload = json.loads(sys.argv[3])
            except json.JSONDecodeError:
                print(json.dumps({"success": False, "error": "Invalid JSON payload"}))
                return
        
        # Initialize managers
        db_manager = DatabaseManager()
        auth_manager = AuthManager(db_manager)
        bank_manager = BankManager(db_manager, auth_manager)
        transaction_manager = TransactionManager(db_manager, auth_manager)
        google_sheets_manager = GoogleSheetsManager(db_manager, auth_manager)
        home_data_manager = HomeDataManager(db_manager, auth_manager, bank_manager, transaction_manager)
        
        # Handle different actions
        if action == 'init_db_check':
            result = {"success": True, "message": "Database initialized successfully"}
        
        # Authentication actions
        elif action == 'register_user':
            name = payload.get('name')
            email = payload.get('email')
            password = payload.get('password')
            
            if not all([name, email, password]):
                result = {"success": False, "error": "Name, email, and password are required"}
            else:
                result = auth_manager.register_user(name, email, password)
        
        elif action == 'login_user':
            email = payload.get('email')
            password = payload.get('password')
            
            if not all([email, password]):
                result = {"success": False, "error": "Email and password are required"}
            else:
                result = auth_manager.login_user(email, password)
        
        elif action == 'google_auth':
            credential = payload.get('credential')
            
            if not credential:
                result = {"success": False, "error": "Google credential is required"}
            else:
                result = auth_manager.google_auth(credential)
        
        elif action == 'check_auth_status':
            result = auth_manager.check_auth_status()
        
        elif action == 'logout_user':
            result = auth_manager.logout_user()
        
        # Bank management actions
        elif action == 'add_bank':
            required_fields = ['bank_name', 'account', 'current_balance']
            if not all(field in payload for field in required_fields):
                result = {"success": False, "error": "Bank name, account, and balance are required"}
            else:
                result = bank_manager.add_bank(payload)
        
        elif action == 'update_bank':
            required_fields = ['bank_id', 'bank_name', 'account', 'current_balance']
            if not all(field in payload for field in required_fields):
                result = {"success": False, "error": "Bank ID, name, account, and balance are required"}
            else:
                result = bank_manager.update_bank(payload)
        
        elif action == 'delete_bank':
            bank_id = payload.get('bank_id')
            if not bank_id:
                result = {"success": False, "error": "Bank ID is required"}
            else:
                result = bank_manager.delete_bank(bank_id)
        
        # Transaction actions
        elif action == 'import_transactions':
            file_path = payload.get('file_path')
            if not file_path:
                result = {"success": False, "error": "File path is required"}
            else:
                result = transaction_manager.import_transactions_from_file(file_path)
        
        # Google Sheets actions
        elif action == 'sync_google_sheets':
            result = google_sheets_manager.sync_with_google_sheets()
        
        # Home data action
        elif action == 'get_home_data':
            result = home_data_manager.get_home_data()
        
        else:
            result = {"success": False, "error": f"Unknown action: {action}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Python handler error: {str(e)}",
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()