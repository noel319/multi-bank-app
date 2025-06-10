import sqlite3
import os
import csv
from datetime import datetime
import json

class BillingManager:
    def __init__(self, db_manager, auth_manager):
        self.db_manager = db_manager
        self.auth_manager = auth_manager
        self.auto_save_folder = "auto_save"
        self._ensure_auto_save_folder()

    def _ensure_auto_save_folder(self):
        """Ensure auto-save folder exists"""
        if not os.path.exists(self.auto_save_folder):
            os.makedirs(self.auto_save_folder)

    def get_billing_data(self):
        """Get all billing data for the current user"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Get billing records with bank and cost center info
            cursor.execute("""
                SELECT 
                    b.id,
                    b.date,
                    b.state,
                    b.bank_name,
                    b.account_name,
                    b.price,
                    b.fee,
                    b.current_balance,
                    b.after_balance,
                    COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                    b.cost_center_id,
                    b.created_at
                FROM billing b
                LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
                JOIN bank bank_table ON b.bank_id = bank_table.id
                WHERE bank_table.user_id = ?
                ORDER BY b.date DESC, b.created_at DESC
            """, (current_user['id'],))

            billing_records = cursor.fetchall()

            # Get recent transactions (last 50)
            cursor.execute("""
                SELECT 
                    t.id,
                    t.date,
                    t.price,
                    t.state,
                    t.fee,
                    t.bank_name,
                    t.account_name,
                    t.before_balance,
                    t.after_balance,
                    COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                    t.cost_center_id,
                    t.created_at
                FROM transactions t
                LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ?
                ORDER BY t.date DESC, t.created_at DESC
                LIMIT 50
            """, (current_user['id'],))

            recent_transactions = cursor.fetchall()

            # Get bank options for dropdown
            cursor.execute("""
                SELECT id, bank_name, account, current_balance
                FROM bank
                WHERE user_id = ?
                ORDER BY bank_name
            """, (current_user['id'],))

            bank_options = cursor.fetchall()

            # Get cost center options
            cursor.execute("""
                SELECT id, name, group_name, cost_center, area
                FROM cost_centers
                WHERE user_id = ? OR user_id IS NULL
                ORDER BY name
            """, (current_user['id'],))

            cost_center_options = cursor.fetchall()

            conn.close()

            return {
                "success": True,
                "data": {
                    "billing_records": [
                        {
                            "id": row[0],
                            "date": row[1],
                            "state": row[2],
                            "bank_name": row[3],
                            "account_name": row[4],
                            "price": float(row[5]),
                            "fee": float(row[6]) if row[6] else 0,
                            "current_balance": float(row[7]),
                            "after_balance": float(row[8]),
                            "cost_center_name": row[9],
                            "cost_center_id": row[10],
                            "created_at": row[11]
                        } for row in billing_records
                    ],
                    "recent_transactions": [
                        {
                            "id": row[0],
                            "date": row[1],
                            "price": float(row[2]),
                            "state": row[3],
                            "fee": float(row[4]) if row[4] else 0,
                            "bank_name": row[5],
                            "account_name": row[6],
                            "before_balance": float(row[7]),
                            "after_balance": float(row[8]),
                            "cost_center_name": row[9],
                            "cost_center_id": row[10],
                            "created_at": row[11]
                        } for row in recent_transactions
                    ],
                    "bank_options": [
                        {
                            "id": row[0],
                            "bank_name": row[1],
                            "account": row[2],
                            "current_balance": float(row[3]),
                            "display_name": f"{row[1]}, {row[2]}"
                        } for row in bank_options
                    ],
                    "cost_center_options": [
                        {
                            "id": row[0],
                            "name": row[1],
                            "group_name": row[2],
                            "cost_center": row[3],
                            "area":row[4]
                        } for row in cost_center_options
                    ]
                }
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to get billing data: {str(e)}"}

    def add_bill(self, bill_data):
        """Add a new bill and create corresponding transaction"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        required_fields = ['date', 'bank_id', 'price', 'state']
        for field in required_fields:
            if field not in bill_data:
                return {"success": False, "error": f"{field} is required"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Get bank information
            cursor.execute("""
                SELECT bank_name, account, current_balance
                FROM bank
                WHERE id = ? AND user_id = ?
            """, (bill_data['bank_id'], current_user['id']))

            bank_info = cursor.fetchone()
            if not bank_info:
                return {"success": False, "error": "Invalid bank selected"}

            bank_name, account_name, current_balance = bank_info
            price = float(bill_data['price'])
            
            
            # Calculate balances
            if bill_data['state'] == "Income":
                after_balance = current_balance + price
            elif bill_data['state'] == "Expense":
                after_balance = current_balance - price

            # Insert billing record
            cursor.execute("""
                INSERT INTO billing (
                    date, state, bank_name, account_name, bank_id,
                    price, cost_center_id, current_balance, after_balance
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                bill_data['date'],
                bill_data['state'],
                bank_name,
                account_name,
                bill_data['bank_id'],
                price,                
                bill_data['cost_center_id'],
                current_balance,
                after_balance
            ))

            billing_id = cursor.lastrowid

            # Create corresponding transaction
            cursor.execute("""
                INSERT INTO transactions (
                    bank_id, cost_center_id, billing_id, bank_name, account_name,
                    price, state, cost_center_name, before_balance, after_balance, date
                )
                SELECT 
                    ?, ?, ?, ?, ?, ?, ?, 
                    COALESCE(cc.name, 'Uncategorized'), ?, ?, ?
                FROM (SELECT 1) dummy
                LEFT JOIN cost_centers cc ON cc.id = ?
            """, (
                bill_data['bank_id'],
                bill_data.get('cost_center_id'),
                billing_id,
                bank_name,
                account_name,
                price,  # Negative for expense
                bill_data['state'],               
                current_balance,
                after_balance,
                bill_data['date'],  
                bill_data.get('cost_center_id'),              
            ))

            transaction_id = cursor.lastrowid

            # Update bank balance
            cursor.execute("""
                UPDATE bank 
                SET current_balance = ?
                WHERE id = ?
            """, (after_balance, bill_data['bank_id']))

            conn.commit()

            # Create auto-save CSV file
            self._create_auto_save_csv(bill_data['date'], {
                'id': transaction_id,
                'date': bill_data['date'],
                'price': price,
                'state': bill_data['state'],                
                'bank_name': bank_name,
                'account_name': account_name,
                'before_balance': current_balance,
                'after_balance': after_balance,
                'cost_center_id': bill_data.get('cost_center_id')
            })

            conn.close()

            return {
                "success": True,
                "message": "Bill added successfully",
                "billing_id": billing_id,
                "transaction_id": transaction_id
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to add bill: {str(e)}"}
        finally:
            if conn:
                conn.close()

    def _create_auto_save_csv(self, transaction_date, transaction_data):
        """Create or append to monthly CSV file"""
        try:
            # Parse date to get year and month
            date_obj = datetime.strptime(transaction_date, '%Y-%m-%d')
            year_month = date_obj.strftime('%Y-%m')
            
            # Create filename
            filename = f"{year_month}.csv"
            filepath = os.path.join(self.auto_save_folder, filename)
            
            # Check if file exists
            file_exists = os.path.exists(filepath)
            
            # CSV headers
            headers = [
                'id', 'date', 'price', 'state', 'fee', 'bank_name', 
                'account_name', 'before_balance', 'after_balance', 'cost_center_id'
            ]
            
            # Write to CSV
            with open(filepath, 'a', newline='', encoding='utf-8') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=headers)
                
                # Write header if new file
                if not file_exists:
                    writer.writeheader()
                
                # Write transaction data
                writer.writerow(transaction_data)
                
        except Exception as e:
            print(f"Error creating auto-save CSV: {str(e)}")

    def export_billing_data(self, export_format='csv', filters=None):
        """Export billing data to CSV or Excel"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Build query with filters
            query = """
                SELECT 
                    b.id,
                    b.date,
                    b.state,
                    b.bank_name,
                    b.account_name,
                    b.price,
                    b.fee,
                    b.current_balance,
                    b.after_balance,
                    COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                    b.created_at
                FROM billing b
                LEFT JOIN cost_centers cc ON b.cost_center_id = cc.id
                JOIN bank bank_table ON b.bank_id = bank_table.id
                WHERE bank_table.user_id = ?
            """
            
            params = [current_user['id']]
            
            # Add filters if provided
            if filters:
                if filters.get('date_from'):
                    query += " AND b.date >= ?"
                    params.append(filters['date_from'])
                if filters.get('date_to'):
                    query += " AND b.date <= ?"
                    params.append(filters['date_to'])
                if filters.get('bank_id'):
                    query += " AND b.bank_id = ?"
                    params.append(filters['bank_id'])
            
            query += " ORDER BY b.date DESC, b.created_at DESC"
            
            cursor.execute(query, params)
            data = cursor.fetchall()
            
            # Create export file
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            if export_format.lower() == 'csv':
                filename = f"billing_export_{timestamp}.csv"
                filepath = os.path.join(self.auto_save_folder, filename)
                
                headers = [
                    'ID', 'Date', 'Description', 'Bank Name', 'Account Name',
                    'Amount', 'Fee', 'Balance Before', 'Balance After', 
                    'Cost Center', 'Created At'
                ]
                
                with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
                    writer = csv.writer(csvfile)
                    writer.writerow(headers)
                    writer.writerows(data)
                    
            elif export_format.lower() == 'excel':
                try:
                    import pandas as pd
                    
                    filename = f"billing_export_{timestamp}.xlsx"
                    filepath = os.path.join(self.auto_save_folder, filename)
                    
                    df = pd.DataFrame(data, columns=[
                        'ID', 'Date', 'Description', 'Bank Name', 'Account Name',
                        'Amount', 'Fee', 'Balance Before', 'Balance After',
                        'Cost Center', 'Created At'
                    ])
                    
                    df.to_excel(filepath, index=False)
                    
                except ImportError:
                    return {"success": False, "error": "pandas library required for Excel export"}
            
            conn.close()
            
            return {
                "success": True,
                "message": f"Data exported successfully",
                "filename": filename,
                "filepath": filepath,
                "record_count": len(data)
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to export data: {str(e)}"}

    def delete_bill(self, bill_id):
        """Delete a bill and its associated transaction"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Get bill information
            cursor.execute("""
                SELECT b.bank_id, b.price, b.fee
                FROM billing b
                JOIN bank bank_table ON b.bank_id = bank_table.id
                WHERE b.id = ? AND bank_table.user_id = ?
            """, (bill_id, current_user['id']))

            bill_info = cursor.fetchone()
            if not bill_info:
                return {"success": False, "error": "Bill not found"}

            bank_id, price, fee = bill_info
            total_amount = float(price) + float(fee or 0)

            # Delete associated transaction
            cursor.execute("""
                DELETE FROM transactions 
                WHERE billing_id = ?
            """, (bill_id,))

            # Delete billing record
            cursor.execute("""
                DELETE FROM billing 
                WHERE id = ?
            """, (bill_id,))

            # Restore bank balance
            cursor.execute("""
                UPDATE bank 
                SET current_balance = current_balance + ?
                WHERE id = ?
            """, (total_amount, bank_id))

            conn.commit()
            conn.close()

            return {"success": True, "message": "Bill deleted successfully"}

        except Exception as e:
            return {"success": False, "error": f"Failed to delete bill: {str(e)}"}