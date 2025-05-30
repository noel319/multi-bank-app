"""
Transaction Manager Module
Handles transaction operations, imports, and balance calculations
"""

import pandas as pd


class TransactionManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager
    
    def get_recent_transactions(self, limit=10):
        """Get recent transactions for the current user"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT t.id, t.bank_name, t.account_name, t.price, t.state, t.fee,
                       t.cost_center_name, t.before_balance, t.after_balance, t.date,
                       b.color as bank_color
                FROM transaction t
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ?
                ORDER BY t.date DESC, t.created_at DESC
                LIMIT ?
            ''', (self.auth.current_user_id, limit))
            
            transactions = []
            for row in cursor.fetchall():
                transactions.append({
                    "id": row[0],
                    "bank_name": row[1],
                    "account_name": row[2],
                    "price": row[3],
                    "state": row[4],
                    "fee": row[5],
                    "cost_center_name": row[6],
                    "before_balance": row[7],
                    "after_balance": row[8],
                    "date": row[9],
                    "bank_color": row[10]
                })
            
            conn.close()
            return {"success": True, "transactions": transactions}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get transactions: {str(e)}"}
    
    def import_transactions_from_file(self, file_path):
        """Import transactions from Excel or CSV file"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            # Read file based on extension
            if file_path.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(file_path)
            elif file_path.endswith('.csv'):
                df = pd.read_csv(file_path)
            else:
                return {"success": False, "error": "Unsupported file format"}
            
            # Expected columns: date, bank_name, account_name, price, state, fee, cost_center_name
            required_columns = ['date', 'bank_name', 'account_name', 'price', 'state']
            
            # Check if required columns exist
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return {"success": False, "error": f"Missing required columns: {', '.join(missing_columns)}"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            imported_count = 0
            errors = []
            
            for index, row in df.iterrows():
                try:
                    # Get or create bank account
                    cursor.execute('''
                        SELECT id, current_balance FROM bank 
                        WHERE bank_name = ? AND account = ? AND user_id = ?
                    ''', (row['bank_name'], row['account_name'], self.auth.current_user_id))
                    
                    bank_result = cursor.fetchone()
                    if not bank_result:
                        # Create bank account if it doesn't exist
                        cursor.execute('''
                            INSERT INTO bank (bank_name, account, current_balance, user_id, role)
                            VALUES (?, ?, 0.0, ?, 'checking')
                        ''', (row['bank_name'], row['account_name'], self.auth.current_user_id))
                        bank_id = cursor.lastrowid
                        current_balance = 0.0
                    else:
                        bank_id = bank_result[0]
                        current_balance = bank_result[1]
                    
                    # Calculate balances
                    price = float(row['price'])
                    fee = float(row.get('fee', 0))
                    state = row['state'].lower()
                    
                    before_balance = current_balance
                    if state == 'income':
                        after_balance = before_balance + price - fee
                    else:  # outgoing
                        after_balance = before_balance - price - fee
                    
                    # Insert transaction
                    cursor.execute('''
                        INSERT INTO transaction (
                            bank_id, bank_name, account_name, price, state, fee,
                            cost_center_name, before_balance, after_balance, date
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        bank_id, row['bank_name'], row['account_name'], price, state, fee,
                        row.get('cost_center_name', ''), before_balance, after_balance,
                        pd.to_datetime(row['date']).date()
                    ))
                    
                    # Update bank balance
                    cursor.execute('''
                        UPDATE bank SET current_balance = ? WHERE id = ?
                    ''', (after_balance, bank_id))
                    
                    imported_count += 1
                    
                except Exception as e:
                    errors.append(f"Row {index + 1}: {str(e)}")
                    continue
            
            conn.commit()
            conn.close()
            
            result = {"success": True, "imported_count": imported_count}
            if errors:
                result["errors"] = errors
            
            return result
            
        except Exception as e:
            return {"success": False, "error": f"Failed to import transactions: {str(e)}"}
    
    def calculate_total_balance(self):
        """Calculate total balance across all user's bank accounts"""
        try:
            if not self.auth.current_user_id:
                return 0.0
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT SUM(current_balance) FROM bank WHERE user_id = ?
            ''', (self.auth.current_user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result[0] is not None else 0.0
            
        except Exception as e:
            print(f"Error calculating total balance: {e}")
            return 0.0
    
    def calculate_personal_balance(self):
        """Calculate personal account balance (excluding business accounts)"""
        try:
            if not self.auth.current_user_id:
                return 0.0
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT SUM(current_balance) FROM bank 
                WHERE user_id = ? AND role != 'business'
            ''', (self.auth.current_user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            return result[0] if result[0] is not None else 0.0
            
        except Exception as e:
            print(f"Error calculating personal balance: {e}")
            return 0.0