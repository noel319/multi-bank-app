import json
import sys
import traceback

# Import all manager modules
from database_manager import DatabaseManager
from auth_manager import AuthManager
from bank_manager import BankManager
from transaction_manager import TransactionManager
from google_sheets_manager import GoogleSheetsManager
from home_data_manager import HomeDataManager
from cost_center_manager import CostCenterManager
from dashboard_manager import DashboardManager
from billing_manager import BillingManager

def main():
    """Main handler function"""
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"success": False, "error": "No action provided"}))
            return
        
        action = sys.argv[1]
        payload = {}
        
        # Parse payload if provided - Fixed logic
        if len(sys.argv) >= 4 and sys.argv[2] == '--payload':
            try:
                payload = json.loads(sys.argv[3])
            except json.JSONDecodeError as e:
                print(json.dumps({"success": False, "error": f"Invalid JSON payload: {str(e)}"}))
                return
        elif len(sys.argv) == 3:
            # Handle case where payload might be passed without --payload flag
            try:
                payload = json.loads(sys.argv[2])
            except json.JSONDecodeError:
                # If it's not JSON, treat it as empty payload
                payload = {}
        
        # Initialize managers with error handling
        try:
            db_manager = DatabaseManager()
            auth_manager = AuthManager(db_manager)
            bank_manager = BankManager(db_manager, auth_manager)
            transaction_manager = TransactionManager(db_manager, auth_manager)
            google_sheets_manager = GoogleSheetsManager(db_manager, auth_manager)
            cost_center_manager = CostCenterManager(db_manager, auth_manager)
            home_data_manager = HomeDataManager(db_manager, auth_manager, bank_manager, transaction_manager)
            dashboard_manager = DashboardManager(db_manager, auth_manager)
            billing_manager = BillingManager(db_manager, auth_manager) 
        except Exception as init_error:
            print(json.dumps({
                "success": False,
                "error": f"Failed to initialize managers: {str(init_error)}",
                "traceback": traceback.format_exc()
            }))
            return
        
        # Debug logging to stderr only
        sys.stderr.write(f"Debug: Action={action}, Payload={payload}\n")
        sys.stderr.flush()
        
        # Handle different actions
        result = handle_action(action, payload, {
            'auth': auth_manager,
            'bank': bank_manager,
            'transaction': transaction_manager,
            'google_sheets': google_sheets_manager,
            'cost_center':cost_center_manager,
            'home_data': home_data_manager,
            'dashboard': dashboard_manager,
            'billing': billing_manager
        })
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": f"Python handler error: {str(e)}",
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))


def handle_action(action, payload, managers):
    """Route actions to appropriate manager methods"""
    
    # Database initialization
    if action == 'init_db_check':
        return {"success": True, "message": "Database initialized successfully"}
    
    # Authentication actions
    elif action == 'register_user':
        name = payload.get('name')
        email = payload.get('email')
        password = payload.get('password')
        
        if not all([name, email, password]):
            return {"success": False, "error": "Name, email, and password are required"}
        else:
            return managers['auth'].register_user(name, email, password)
    
    elif action == 'login_user':
        email = payload.get('email')
        password = payload.get('password')
        
        if not all([email, password]):
            return {"success": False, "error": "Email and password are required"}
        else:
            return managers['auth'].login_user(email, password)
    
    elif action == 'google_auth':
        credential = payload.get('credential')
        
        if not credential:
            return {"success": False, "error": "Google credential is required"}
        else:
            return managers['auth'].google_auth(credential)
    
    elif action == 'check_auth_status':
        return managers['auth'].check_auth_status()
    
    elif action == 'logout_user':
        return managers['auth'].logout_user()
    
    # Billing actions
    elif action == 'get_billing_data':
        return managers['billing'].get_billing_data()
    
    elif action == 'add_bill':
        required_fields = ['date', 'bank_id', 'price', 'state']
        if not all(field in payload for field in required_fields):
            return {"success": False, "error": "Date, bank, amount, and description are required"}
        return managers['billing'].add_bill(payload)
    
    elif action == 'delete_bill':
        bill_id = payload.get('bill_id')
        if not bill_id:
            return {"success": False, "error": "Bill ID is required"}
        return managers['billing'].delete_bill(bill_id)
    
    elif action == 'export_billing_data':
        export_format = payload.get('format', 'csv')
        filters = payload.get('filters', {})
        return managers['billing'].export_billing_data(export_format, filters)

    
    # Bank management actions
    elif action == 'add_bank':
        required_fields = ['bank_name', 'account', 'current_balance']
        if not all(field in payload for field in required_fields):
            return {"success": False, "error": "Bank name, account, and balance are required"}
        else:
            return managers['bank'].add_bank(payload)
    
    elif action == 'update_bank':
        required_fields = ['bank_id', 'bank_name', 'account', 'current_balance']
        if not all(field in payload for field in required_fields):
            return {"success": False, "error": "Bank ID, name, account, and balance are required"}
        else:
            return managers['bank'].update_bank(payload)
    
    elif action == 'delete_bank':
        bank_id = payload.get('bank_id')
        if not bank_id:
            return {"success": False, "error": "Bank ID is required"}
        else:
            return managers['bank'].delete_bank(bank_id)
    
    # Transaction actions
    elif action == 'import_transactions':
        file_path = payload.get('file_path')
        if not file_path:
            return {"success": False, "error": "File path is required"}
        else:
            return managers['transaction'].import_transactions_from_file(file_path)
    
    # Google Sheets actions
    elif action == 'sync_google_sheets':
        return managers['google_sheets'].sync_with_google_sheets()
    # Cost center actions
    elif action == 'add_cost_center':
        return managers['cost_center'].add_cost_center(payload)
    
    elif action == 'update_cost_center':
        return managers['cost_center'].update_cost_center(payload)
    
    elif action == 'delete_cost_center':
        cost_center_id = payload.get('cost_center_id')
        if not cost_center_id:
            return {"success": False, "error": "Cost center ID is required"}
        return managers['cost_center'].delete_cost_center(cost_center_id)
    
    elif action == 'get_cost_centers_list':
        return managers['cost_center'].get_cost_centers_list()
    
    elif action == 'get_cost_center_options':
        return managers['cost_center'].get_cost_center_options()
    
    elif action == 'get_cost_center_by_id':
        cost_center_id = payload.get('cost_center_id')
        if not cost_center_id:
            return {"success": False, "error": "Cost center ID is required"}
        return managers['cost_center'].get_cost_center_by_id(cost_center_id)
 
    # Home data action
    elif action == 'get_home_data':
        return managers['home_data'].get_home_data()
    # Dashboard actions
    elif action == 'get_dashboard_data':
        month = payload.get('month')
        if not month:
            return {"success": False, "error": "Month is required"}
        return managers['dashboard'].get_dashboard_data(month)
    
    elif action == 'get_bank_detail_data':
        bank_id = payload.get('bank_id')
        month = payload.get('month')
        if not bank_id or not month:
            return {"success": False, "error": "Bank ID and month are required"}
        return managers['dashboard'].get_bank_detail_data(bank_id, month)
    
    # Background sync action (for periodic updates)
    elif action == 'sync_background_data':
        return {"success": True, "message": "Background sync completed", "timestamp": str(sys.time.time()) if hasattr(sys, 'time') else "unknown"}
    
    elif action == 'get_transactions_filtered':
        return managers['transaction'].get_transactions_with_filters(payload)
    
    elif action == 'get_banks_list':
        return managers['transaction'].get_banks_list()
    
    elif action == 'get_cost_centers_list':
        return managers['transaction'].get_cost_centers_list()
    
    elif action == 'export_transactions':
        format_type = payload.get('format', 'csv')
        filters = payload.get('filters', {})
        return managers['transaction'].export_transactions(filters, format_type)
    
    elif action == 'get_transaction_statistics':
        filters = payload.get('filters', {})
        return managers['transaction'].get_transaction_statistics(filters)
    
    elif action == 'delete_transaction':
        transaction_id = payload.get('transaction_id')
        if not transaction_id:
            return {"success": False, "error": "Transaction ID is required"}
        return managers['transaction'].delete_transaction(transaction_id)
    
    else:
        return {"success": False, "error": f"Unknown enhanced action: {action}"}

if __name__ == "__main__":
    main()