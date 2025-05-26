import json
import sqlite3
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

class DatabaseManager:
    def __init__(self, db_path: str = "banking.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Banks table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS banks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_name TEXT NOT NULL,
                    account_name TEXT NOT NULL,
                    account_number TEXT NOT NULL,
                    routing_number TEXT,
                    username TEXT NOT NULL,
                    password TEXT NOT NULL,
                    color TEXT DEFAULT 'blue',
                    balance REAL DEFAULT 0.0,
                    card_number TEXT,
                    api_endpoint TEXT,
                    bank_type TEXT DEFAULT 'checking',
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_id INTEGER,
                    date DATE NOT NULL,
                    description TEXT,
                    type TEXT NOT NULL, -- 'income' or 'expense'
                    amount REAL NOT NULL,
                    balance REAL NOT NULL,
                    category TEXT,
                    suppliers_payment REAL DEFAULT 0.0,
                    customer_deposit REAL DEFAULT 0.0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bank_id) REFERENCES banks (id)
                )
            ''')
            
            # Suppliers table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS suppliers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER,
                    date DATE NOT NULL,
                    category TEXT,
                    supplier_name TEXT,
                    invoice_number TEXT,
                    payment_amount REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (transaction_id) REFERENCES transactions (id)
                )
            ''')
            
            # Personal account table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS personal_account (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    balance REAL DEFAULT 0.0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # User profile table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_profile (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT,
                    avatar TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            
            # Initialize personal account if not exists
            cursor.execute('SELECT COUNT(*) FROM personal_account')
            if cursor.fetchone()[0] == 0:
                cursor.execute('INSERT INTO personal_account (balance) VALUES (0.0)')
                conn.commit()

class BankingHandler:
    def __init__(self):
        self.db = DatabaseManager()
    
    def handle_request(self, action: str, payload: Dict = None) -> Dict[str, Any]:
        """Main request handler"""
        try:
            if action == 'get_home_data':
                return self.get_home_data()
            elif action == 'add_bank':
                return self.add_bank(payload)
            elif action == 'update_bank':
                return self.update_bank(payload)
            elif action == 'delete_bank':
                return self.delete_bank(payload)
            elif action == 'get_bank_details':
                return self.get_bank_details(payload)
            elif action == 'fetch_transactions':
                return self.fetch_transactions(payload)
            else:
                return {
                    'success': False,
                    'error': f'Unknown action: {action}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_home_data(self) -> Dict[str, Any]:
        """Get all data needed for home page"""
        try:
            with sqlite3.connect(self.db.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Get banks
                cursor.execute('''
                    SELECT id, bank_name, account_name, account_number, 
                           balance, color, card_number, bank_type, is_active
                    FROM banks 
                    ORDER BY created_at DESC
                ''')
                banks = [dict(row) for row in cursor.fetchall()]
                
                # Calculate total balance
                cursor.execute('SELECT SUM(balance) FROM banks WHERE is_active = 1')
                total_balance = cursor.fetchone()[0] or 0.0
                
                # Get personal account balance
                cursor.execute('SELECT balance FROM personal_account LIMIT 1')
                personal_balance = cursor.fetchone()[0] or 0.0
                
                # Get recent transactions
                cursor.execute('''
                    SELECT t.id, t.date, t.description, t.type, t.amount, 
                           t.balance, t.suppliers_payment, t.customer_deposit,
                           b.bank_name, b.color
                    FROM transactions t
                    JOIN banks b ON t.bank_id = b.id
                    ORDER BY t.date DESC, t.created_at DESC
                    LIMIT 5
                ''')
                transactions = []
                for row in cursor.fetchall():
                    transaction = dict(row)
                    transaction['bank_name'] = row['bank_name']
                    transactions.append(transaction)
                
                # Get user profile
                cursor.execute('SELECT name, email, avatar FROM user_profile LIMIT 1')
                user_row = cursor.fetchone()
                user_profile = dict(user_row) if user_row else {'name': 'User', 'email': '', 'avatar': ''}
                
                return {
                    'success': True,
                    'data': {
                        'banks': banks,
                        'totalBalance': total_balance,
                        'personalBalance': personal_balance,
                        'recentTransactions': transactions,
                        'userProfile': user_profile
                    }
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to get home data: {str(e)}'
            }
    
    def add_bank(self, payload: Dict) -> Dict[str, Any]:
        """Add a new bank account"""
        try:
            # Validate required fields
            required_fields = ['bank_name', 'account_name', 'account_number', 'username', 'password']
            for field in required_fields:
                if not payload.get(field):
                    return {
                        'success': False,
                        'error': f'Missing required field: {field}'
                    }
            
            # Try to fetch account data from bank API
            bank_data = self.fetch_bank_data(payload)
            
            with sqlite3.connect(self.db.db_path) as conn:
                cursor = conn.cursor()
                
                # Generate card number (mock)
                card_number = self.generate_card_number()
                
                cursor.execute('''
                    INSERT INTO banks (
                        bank_name, account_name, account_number, routing_number,
                        username, password, color, balance, card_number, 
                        api_endpoint, bank_type
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    payload['bank_name'],
                    payload['account_name'],
                    payload['account_number'],
                    payload.get('routing_number', ''),
                    payload['username'],
                    self.hash_password(payload['password']),
                    payload.get('color', 'blue'),
                    bank_data.get('balance', 0.0),
                    card_number,
                    payload.get('api_endpoint', ''),
                    payload.get('bank_type', 'checking')
                ))
                
                bank_id = cursor.lastrowid
                
                # Add sample transactions if balance > 0
                if bank_data.get('balance', 0) > 0:
                    self.add_sample_transactions(cursor, bank_id, bank_data.get('balance', 0))
                
                conn.commit()
                
                return {
                    'success': True,
                    'data': {
                        'bank_id': bank_id,
                        'message': 'Bank account added successfully'
                    }
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to add bank: {str(e)}'
            }
    
    def update_bank(self, payload: Dict) -> Dict[str, Any]:
        """Update existing bank account"""
        try:
            bank_id = payload.get('bank_id')
            if not bank_id:
                return {
                    'success': False,
                    'error': 'Bank ID is required'
                }
            
            with sqlite3.connect(self.db.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if bank exists
                cursor.execute('SELECT id FROM banks WHERE id = ?', (bank_id,))
                if not cursor.fetchone():
                    return {
                        'success': False,
                        'error': 'Bank not found'
                    }
                
                # Update bank
                update_fields = []
                update_values = []
                
                for field in ['bank_name', 'account_name', 'color', 'bank_type']:
                    if field in payload:
                        update_fields.append(f"{field} = ?")
                        update_values.append(payload[field])
                
                if 'password' in payload:
                    update_fields.append("password = ?")
                    update_values.append(self.hash_password(payload['password']))
                
                update_fields.append("updated_at = CURRENT_TIMESTAMP")
                update_values.append(bank_id)
                
                cursor.execute(f'''
                    UPDATE banks 
                    SET {', '.join(update_fields)}
                    WHERE id = ?
                ''', update_values)
                
                conn.commit()
                
                return {
                    'success': True,
                    'data': {'message': 'Bank account updated successfully'}
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to update bank: {str(e)}'
            }
    
    def delete_bank(self, payload: Dict) -> Dict[str, Any]:
        """Delete a bank account"""
        try:
            bank_id = payload.get('bank_id')
            if not bank_id:
                return {
                    'success': False,
                    'error': 'Bank ID is required'
                }
            
            with sqlite3.connect(self.db.db_path) as conn:
                cursor = conn.cursor()
                
                # Delete transactions first (foreign key constraint)
                cursor.execute('DELETE FROM transactions WHERE bank_id = ?', (bank_id,))
                
                # Delete bank
                cursor.execute('DELETE FROM banks WHERE id = ?', (bank_id,))
                
                if cursor.rowcount == 0:
                    return {
                        'success': False,
                        'error': 'Bank not found'
                    }
                
                conn.commit()
                
                return {
                    'success': True,
                    'data': {'message': 'Bank account deleted successfully'}
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to delete bank: {str(e)}'
            }
    
    def fetch_bank_data(self, bank_info: Dict) -> Dict[str, Any]:
        """Fetch bank data from API (mock implementation)"""
        try:
            # Mock bank API call
            # In real implementation, this would connect to actual bank APIs
            
            # Simulate API delay
            import time
            time.sleep(1)
            
            # Mock response based on bank name
            mock_balances = {
                'Chase Bank': 5420.50,
                'Bank of America': 3200.75,
                'Wells Fargo': 1850.25,
                'Citibank': 7300.00,
                'US Bank': 2100.30
            }
            
            balance = mock_balances.get(bank_info.get('bank_name', ''), 1000.00)
            
            return {
                'success': True,
                'balance': balance,
                'account_status': 'active',
                'last_updated': datetime.now().isoformat()
            }
            
        except Exception as e:
            # Return mock data on API failure
            return {
                'success': False,
                'balance': 1000.00,
                'error': str(e)
            }
    
    def add_sample_transactions(self, cursor, bank_id: int, balance: float):
        """Add sample transactions for new bank account"""
        sample_transactions = [
            {
                'description': 'Initial Deposit',
                'type': 'income',
                'amount': balance * 0.8,
                'days_ago': 30
            },
            {
                'description': 'Salary Deposit',
                'type': 'income',
                'amount': balance * 0.2,
                'days_ago': 7
            },
            {
                'description': 'Grocery Store',
                'type': 'expense',
                'amount': 45.67,
                'days_ago': 3
            },
            {
                'description': 'Gas Station',
                'type': 'expense',
                'amount': 32.50,
                'days_ago': 1
            }
        ]
        
        current_balance = balance
        for transaction in reversed(sample_transactions):
            transaction_date = datetime.now() - timedelta(days=transaction['days_ago'])
            
            if transaction['type'] == 'expense':
                current_balance -= transaction['amount']
                suppliers_payment = transaction['amount']
                customer_deposit = 0.0
            else:
                current_balance += transaction['amount']
                suppliers_payment = 0.0
                customer_deposit = transaction['amount']
            
            cursor.execute('''
                INSERT INTO transactions (
                    bank_id, date, description, type, amount, balance,
                    suppliers_payment, customer_deposit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                bank_id,
                transaction_date.date(),
                transaction['description'],
                transaction['type'],
                transaction['amount'],
                current_balance,
                suppliers_payment,
                customer_deposit
            ))
    
    def generate_card_number(self) -> str:
        """Generate a mock card number"""
        import random
        return f"4{random.randint(100, 999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    
    def hash_password(self, password: str) -> str:
        """Hash password for storage"""
        return hashlib.sha256(password.encode()).hexdigest()

def handle_python_request(args):
    """Main entry point for Python requests from Electron"""
    handler = BankingHandler()
    
    action = args.get('action', '')
    payload = args.get('payload', {})
    
    return handler.handle_request(action, payload)