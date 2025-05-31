"""
Transaction Manager Module
Handles transaction operations, imports, and balance calculations
"""

import pandas as pd
import json
from datetime import datetime, timedelta
import sqlite3
from typing import Dict, List, Optional, Any

class TransactionManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager

    def get_transactions_with_filters(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Get transactions with advanced filtering, sorting, and pagination
        """
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            filters = filters or {}
            
            # Extract pagination parameters
            page = filters.get('page', 1)
            limit = filters.get('limit', 10)
            offset = (page - 1) * limit
            
            # Extract sorting parameters
            sort_field = filters.get('sort_field', 'date')
            sort_direction = filters.get('sort_direction', 'desc')
            
            # Build the base query
            base_query = '''
                SELECT t.id, t.bank_name, t.account_name, t.price, t.state, t.fee,
                       t.cost_center_name, t.before_balance, t.after_balance, t.date,
                       b.color as bank_color, t.created_at
                FROM transactions t
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ?
            '''
            
            query_params = [self.auth.current_user_id]
            
            # Apply filters
            conditions = []
            
            # Search filter
            if filters.get('search') and filters['search'].strip():
                search_term = f"%{filters['search'].strip()}%"
                conditions.append('''
                    (t.cost_center_name LIKE ? OR 
                     t.bank_name LIKE ? OR 
                     t.account_name LIKE ?)
                ''')
                query_params.extend([search_term, search_term, search_term])
            
            # Date range filters
            if filters.get('dateRange') and filters['dateRange'] != 'all':
                date_condition = self._get_date_condition(filters['dateRange'])
                if date_condition:
                    conditions.append(date_condition)
            
            # Custom date range
            if filters.get('startDate') and filters['startDate'].strip():
                conditions.append('t.date >= ?')
                query_params.append(filters['startDate'])
            
            if filters.get('endDate') and filters['endDate'].strip():
                conditions.append('t.date <= ?')
                query_params.append(filters['endDate'])
            
            # Bank filter
            if filters.get('bank') and filters['bank'] != 'all':
                conditions.append('t.bank_name = ?')
                query_params.append(filters['bank'])
            
            # State filter (income/outgoing)
            if filters.get('state') and filters['state'] != 'all':
                conditions.append('t.state = ?')
                query_params.append(filters['state'])
            
            # Cost center filter
            if filters.get('costCenter') and filters['costCenter'] != 'all':
                conditions.append('t.cost_center_name = ?')
                query_params.append(filters['costCenter'])
            
            # Amount range filters
            if filters.get('minAmount') and filters['minAmount']:
                conditions.append('t.price >= ?')
                query_params.append(float(filters['minAmount']))
            
            if filters.get('maxAmount') and filters['maxAmount']:
                conditions.append('t.price <= ?')
                query_params.append(float(filters['maxAmount']))
            
            # Add conditions to query
            if conditions:
                base_query += ' AND ' + ' AND '.join(conditions)
            
            # Add sorting
            valid_sort_fields = ['date', 'price', 'state', 'bank_name', 'cost_center_name', 'created_at']
            if sort_field in valid_sort_fields:
                sort_direction = 'ASC' if sort_direction.lower() == 'asc' else 'DESC'
                base_query += f' ORDER BY t.{sort_field} {sort_direction}'
            else:
                base_query += ' ORDER BY t.date DESC, t.created_at DESC'
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get total count for pagination
            count_query = base_query.replace(
                'SELECT t.id, t.bank_name, t.account_name, t.price, t.state, t.fee, t.cost_center_name, t.before_balance, t.after_balance, t.date, b.color as bank_color, t.created_at',
                'SELECT COUNT(*)'
            ).split('ORDER BY')[0]  # Remove ORDER BY for count query
            
            cursor.execute(count_query, query_params)
            result = cursor.fetchone()
            total_count = result[0] if result is not None else 0
            
            # Get paginated results
            paginated_query = base_query + ' LIMIT ? OFFSET ?'
            query_params.extend([limit, offset])
            
            cursor.execute(paginated_query, query_params)
            rows = cursor.fetchall()
            
            transactions = []
            for row in rows:
                transactions.append({
                    "id": row[0],
                    "bank_name": row[1],
                    "account_name": row[2],
                    "price": float(row[3]) if row[3] is not None else 0.0,
                    "state": row[4],
                    "fee": float(row[5]) if row[5] else 0.0,
                    "cost_center_name": row[6] if row[6] else '',
                    "before_balance": float(row[7]) if row[7] is not None else 0.0,
                    "after_balance": float(row[8]) if row[8] is not None else 0.0,
                    "date": row[9],
                    "bank_color": row[10] if row[10] else '#6B7280',
                    "created_at": row[11]
                })
            
            conn.close()
            
            # Calculate pagination info
            total_pages = (total_count + limit - 1) // limit
            
            return {
                "success": True,
                "transactions": transactions,
                "pagination": {
                    "currentPage": page,
                    "totalPages": total_pages,
                    "totalItems": total_count,
                    "itemsPerPage": limit,
                    "hasNext": page < total_pages,
                    "hasPrev": page > 1
                }
            }
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to get transactions: {str(e)}",
                    "trackback": traceback.format_exc()
                    }

    def _get_date_condition(self, date_range: str) -> Optional[str]:
        """Generate SQL condition for date range filters"""
        try:
            today = datetime.now().date()
            
            if date_range == 'today':
                return f"t.date = '{today}'"
            elif date_range == 'week':
                week_start = today - timedelta(days=today.weekday())
                return f"t.date >= '{week_start}'"
            elif date_range == 'month':
                month_start = today.replace(day=1)
                return f"t.date >= '{month_start}'"
            elif date_range == 'quarter':
                quarter_month = ((today.month - 1) // 3) * 3 + 1
                quarter_start = today.replace(month=quarter_month, day=1)
                return f"t.date >= '{quarter_start}'"
            elif date_range == 'year':
                year_start = today.replace(month=1, day=1)
                return f"t.date >= '{year_start}'"
        except Exception as e:
            print(f"Error in date condition: {e}")    
        
        return None
    
    def get_banks_list(self) -> Dict[str, Any]:
        """Get list of banks for filter dropdown"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT DISTINCT id, bank_name, color
                FROM bank 
                WHERE user_id = ?
                ORDER BY bank_name
            ''', (self.auth.current_user_id,))
            
            banks = []
            for row in cursor.fetchall():
                banks.append({
                    "id": row[0],
                    "bank_name": row[1],
                    "color": row[2] or '#6B7280'
                })
            
            conn.close()
            return {"success": True, "banks": banks}
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to get banks: {str(e)}",
                    "traceback": traceback.format_exc(),
                    }
    
    def get_cost_centers_list(self) -> Dict[str, Any]:
        """Get list of cost centers for filter dropdown"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get cost centers from transactions (dynamic list)
            cursor.execute('''
                SELECT DISTINCT t.cost_center_name
                FROM transactions t
                JOIN bank b ON t.bank_id = b.id
                WHERE b.user_id = ? AND t.cost_center_name IS NOT NULL AND t.cost_center_name != ''
                ORDER BY t.cost_center_name
            ''', (self.auth.current_user_id,))
            
            cost_centers = []
            for row in cursor.fetchall():
                cost_centers.append({
                    "id": row[0],  # Using name as ID for simplicity
                    "cost_center_name": row[0]
                })
            
            conn.close()
            return {"success": True, "cost_centers": cost_centers}
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to get cost center: {str(e)}",
                    "traceback": traceback.format_exc(),
                    }
    def export_transactions(self, filters: Dict[str, Any] = None, format: str = 'csv') -> Dict[str, Any]:
        """Export transactions to CSV or Excel"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            # Get all transactions without pagination for export
            export_filters = filters.copy() if filters else {}
            export_filters.pop('page', None)
            export_filters.pop('limit', None)
            export_filters['limit'] = 999999
            
            result = self.get_transactions_with_filters(export_filters)
            if not result['success']:
                return result
            
            transactions = result['transactions']
            
            if not transactions:
                return {"success": False, "error": "No transactions to export"}
            
            # Convert to DataFrame
            df = pd.DataFrame(transactions)
            
            # Format the data for export
            df['amount'] = df.apply(lambda row: row['price'] if row['state'] == 'income' else -row['price'], axis=1)
            df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
            
            # Select and reorder columns for export
            export_columns = [
                'date', 'bank_name', 'account_name', 'cost_center_name',
                'state', 'amount', 'fee', 'before_balance', 'after_balance'
            ]
            df_export = df[export_columns]
            
            # Generate filename
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"transactions_export_{timestamp}"
            
            if format.lower() == 'excel':
                filepath = f"{filename}.xlsx"
                df_export.to_excel(filepath, index=False)
            else:
                filepath = f"{filename}.csv"
                df_export.to_csv(filepath, index=False)
            
            return {
                "success": True,
                "file_path": filepath,
                "records_exported": len(transactions)
            }
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to export transactions: {str(e)}",
                    "traceback": traceback.format_exc(),
                    }
    def get_transaction_statistics(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Get transaction statistics for dashboard/summary"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            stats_filters = filters.copy() if filters else {}
            stats_filters.pop('page', None)
            stats_filters.pop('limit', None)
            stats_filters['limit'] = 999999

            result = self.get_transactions_with_filters(filters)
            if not result['success']:
                return result
            
            transactions = result['transactions']
            
            # Calculate statistics
            total_income = sum(t['price'] for t in transactions if t['state'] == 'income')
            total_expenses = sum(t['price'] for t in transactions if t['state'] == 'outgoing')
            total_fees = sum(t['fee'] for t in transactions)
            net_amount = total_income - total_expenses - total_fees
            
            income_count = len([t for t in transactions if t['state'] == 'income'])
            expense_count = len([t for t in transactions if t['state'] == 'outgoing'])
            
            # Top categories by amount
            category_totals = {}
            for t in transactions:
                category = t['cost_center_name'] or 'Uncategorized'
                if category not in category_totals:
                    category_totals[category] = {'amount': 0, 'count': 0}
                category_totals[category]['amount'] += t['price']
                category_totals[category]['count'] += 1
            
            top_categories = sorted(
                category_totals.items(),
                key=lambda x: x[1]['amount'],
                reverse=True
            )[:5]
            
            return {
                "success": True,
                "statistics": {
                    "total_income": total_income,
                    "total_expenses": total_expenses,
                    "total_fees": total_fees,
                    "net_amount": net_amount,
                    "income_count": income_count,
                    "expense_count": expense_count,
                    "total_transactions": len(transactions),
                    "top_categories": [
                        {
                            "name": cat[0],
                            "amount": cat[1]['amount'],
                            "count": cat[1]['count']
                        } for cat in top_categories
                    ]
                }
            }
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to get statistics: {str(e)}",
                    "traceback": traceback.format_exc(),
                    }    
    def delete_transaction(self, transaction_id: int) -> Dict[str, Any]:
        """Delete a specific transaction"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Verify transaction belongs to user
            cursor.execute('''
                SELECT t.id, t.bank_id, t.price, t.state, t.fee, t.before_balance
                FROM transactions t
                JOIN bank b ON t.bank_id = b.id
                WHERE t.id = ? AND b.user_id = ?
            ''', (transaction_id, self.auth.current_user_id))
            
            transaction = cursor.fetchone()
            if not transaction:
                conn.close()
                return {"success": False, "error": "Transaction not found"}
            
            bank_id = transaction[1]
            price = transaction[2]
            state = transaction[3]
            fee = transaction[4]
            before_balance = transaction[5]
            
            # Delete transaction
            cursor.execute('DELETE FROM transactions WHERE id = ?', (transaction_id,))
            
            # Restore bank balance to before transaction
            cursor.execute('''
                UPDATE bank SET current_balance = ? WHERE id = ?
            ''', (before_balance, bank_id))
            
            conn.commit()
            conn.close()
            
            return {"success": True, "message": "Transaction deleted successfully"}
            
        except Exception as e:
            import traceback
            return {"success": False, 
                    "error": f"Failed to delete transactions: {str(e)}",
                    "traceback": traceback.format_exc(),
                    }
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
                FROM transactions t
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
                        INSERT INTO transactions (
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