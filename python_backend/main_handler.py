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
        
        # Initialize managers with error handling and proper dependencies
        try:
            db_manager = DatabaseManager()
            auth_manager = AuthManager(db_manager)
            bank_manager = BankManager(db_manager, auth_manager)
            transaction_manager = TransactionManager(db_manager, auth_manager)
            google_sheets_manager = GoogleSheetsManager(db_manager, auth_manager)
            cost_center_manager = CostCenterManager(db_manager, auth_manager, google_sheets_manager)
            home_data_manager = HomeDataManager(db_manager, auth_manager, bank_manager, transaction_manager)
            dashboard_manager = DashboardManager(db_manager, auth_manager)
            billing_manager = BillingManager(db_manager, auth_manager, google_sheets_manager) 
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
    
    # Enhanced Google Sheets actions
    elif action == 'connect_google_sheets':
        return managers['google_sheets'].connect_to_google_sheets()
    
    elif action == 'check_google_sheets_status':
        return managers['google_sheets'].check_connection_status()
    
    elif action == 'sync_google_sheets':
        return managers['google_sheets'].sync_with_google_sheets()
    
    elif action == 'sync_transactions_to_sheets':
        return managers['google_sheets'].sync_transactions_to_sheets()
    
    elif action == 'disconnect_google_sheets':
        return managers['google_sheets'].disconnect_google_sheets()
    
    # NEW: Google Sheets yearly initialization
    elif action == 'initialize_yearly_google_sheet':
        year = payload.get('year')
        return managers['google_sheets'].ensure_year_sheet_exists_and_store_id(year)
    
    elif action == 'add_value_to_sheet_cell':
        required_fields = ['year', 'month', 'cost_center_id', 'day', 'amount', 'transaction_type']
        if not all(field in payload for field in required_fields):
            return {"success": False, "error": "Year, month, cost center ID, day, amount, and transaction type are required"}
        return managers['google_sheets'].add_value_to_sheet_cell(
            payload['year'], payload['month'], payload['cost_center_id'], 
            payload['day'], payload['amount'], payload['transaction_type']
        )
    
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
    
    # NEW: Cost center Google Sheets sync
    elif action == 'sync_cost_centers_to_sheets':
        return managers['cost_center'].sync_cost_centers_to_sheets()
 
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
    
    # NEW: Year management actions
    elif action == 'check_new_year_initialization':
        """Check if Google Sheets need to be initialized for a new year"""
        try:
            from datetime import datetime
            current_year = datetime.now().year
            # Use the new method to ensure the sheet exists and store the ID
            result = managers['google_sheets'].ensure_year_sheet_exists_and_store_id(current_year)
            if result.get('success') and result.get('spreadsheet_id'):
                return {
                    "success": True,
                    "new_year_initialized": True,
                    "year": current_year,
                    "initialization_result": result
                }
            else:
                return {
                    "success": False,
                    "year": current_year,
                    "error": result.get('error', 'Unknown error')
                }
        except Exception as e:
            return {"success": False, "error": f"Failed to check new year initialization: {str(e)}"}
    
    elif action == 'force_initialize_year':
        """Force initialize Google Sheets for a specific year"""
        year = payload.get('year')
        if not year:
            return {"success": False, "error": "Year is required"}
        return managers['google_sheets'].ensure_year_sheet_exists_and_store_id(int(year))
    
    # NEW: Monthly summary actions
    elif action == 'update_month_transactions':
        """Manually update month_transactions table"""
        required_fields = ['bank_id', 'cost_center_id', 'month_date', 'amount', 'transaction_type']
        if not all(field in payload for field in required_fields):
            return {"success": False, "error": "Bank ID, cost center ID, month date, amount, and transaction type are required"}
        
        return managers['google_sheets'].update_month_transactions(
            payload['bank_id'], payload['cost_center_id'], payload['month_date'],
            payload['amount'], payload['transaction_type']
        )
    
    elif action == 'rebuild_month_transactions':
        """Rebuild month_transactions table from existing transactions"""
        try:
            from datetime import datetime
            
            # Clear existing month_transactions
            conn = managers['google_sheets'].db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("DELETE FROM month_transactions WHERE user_id IN (SELECT id FROM user WHERE id = ?)", 
                         (managers['google_sheets'].auth.current_user_id,))
            
            # Get all transactions grouped by month and cost center
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m-01', t.date) as month_date,
                    t.bank_id,
                    t.cost_center_id,
                    t.bank_name,
                    t.account_name,
                    t.state,
                    t.cost_center_name,
                    SUM(CASE WHEN t.state = 'Income' THEN t.price ELSE 0 END) as total_income,
                    SUM(CASE WHEN t.state = 'Expense' THEN t.price ELSE 0 END) as total_expenses
                FROM transactions t
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ? AND t.cost_center_id IS NOT NULL
                GROUP BY strftime('%Y-%m-01', t.date), t.bank_id, t.cost_center_id
                ORDER BY month_date, t.bank_id, t.cost_center_id
            """, (managers['google_sheets'].auth.current_user_id,))
            
            monthly_data = cursor.fetchall()
            
            # Insert into month_transactions
            for data in monthly_data:
                cursor.execute("""
                    INSERT INTO month_transactions (
                        month_date, bank_id, cost_center_id, bank_name, 
                        account_name, state, cost_center_name, 
                        total_income, total_expenses, user_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data[0], data[1], data[2], data[3], data[4], 
                    'Both', data[6], data[7], data[8], 
                    managers['google_sheets'].auth.current_user_id
                ))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                "success": True,
                "message": f"Rebuilt month_transactions table with {len(monthly_data)} records"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to rebuild month_transactions: {str(e)}"}
    
    # NEW: Google Sheets maintenance actions
    elif action == 'refresh_all_google_sheets':
        """Refresh all Google Sheets with current data"""
        try:
            # Get all years with spreadsheets
            conn = managers['google_sheets'].db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT key, value FROM app_settings
                WHERE key LIKE 'google_sheet_%' AND user_id = ?
            """, (managers['google_sheets'].auth.current_user_id,))
            
            spreadsheet_records = cursor.fetchall()
            cursor.close()
            conn.close()
            
            refresh_results = []
            
            for record in spreadsheet_records:
                try:
                    year = int(record[0].split('_')[-1])
                    spreadsheet_id = record[1]
                    
                    # Re-initialize the sheet (this will refresh all data)
                    result = managers['google_sheets'].ensure_year_sheet_exists_and_store_id(year)
                    refresh_results.append({
                        'year': year,
                        'result': result
                    })
                    
                except Exception as e:
                    refresh_results.append({
                        'year': year,
                        'result': {"success": False, "error": str(e)}
                    })
            
            return {
                "success": True,
                "message": f"Refreshed {len(refresh_results)} Google Sheets",
                "refresh_results": refresh_results
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to refresh Google Sheets: {str(e)}"}
    
    # NEW: Ensure year sheet exists and store its ID
    elif action == 'ensure_year_sheet_exists':
        year = payload.get('year')
        return managers['google_sheets'].ensure_year_sheet_exists_and_store_id(year)
    
    else:
        return {"success": False, "error": f"Unknown enhanced action: {action}"}

if __name__ == "__main__":
    main()