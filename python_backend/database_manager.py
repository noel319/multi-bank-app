import sqlite3
import os


class DatabaseManager:
    def __init__(self, db_path="app_database.db"):
        self.db_path = db_path
        self.connection = None  # Add connection attribute for consistency
        self.init_database()
    
    def init_database(self):
        """Initialize database and create tables if they don't exist"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row  # Enable dictionary-like access to rows
            cursor = conn.cursor()
            
            # Create user table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT,
                    google_id TEXT,
                    google_token TEXT,  
                    google_sheet_id TEXT,  
                    image_url TEXT,
                    role TEXT NOT NULL DEFAULT 'owner',
                    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')            
            # Also create singular 'bank' table for backward compatibility
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bank (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_name TEXT NOT NULL,
                    account TEXT NOT NULL,
                    current_balance REAL NOT NULL DEFAULT 0.0,
                    endpoint TEXT,
                    color TEXT DEFAULT 'blue',
                    user_id INTEGER NOT NULL,
                    role TEXT NOT NULL DEFAULT 'checking',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            ''')
            
            # Create area table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS area (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    area_name TEXT NOT NULL
                )
            ''')
            
            # Create cost_centers table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_centers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    group_name TEXT NOT NULL,
                    cost_center TEXT NOT NULL,
                    area TEXT NOT NULL,
                    state TEXT,
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            ''')
            
            # Create billing table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS billing (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    date DATE NOT NULL,
                    state TEXT NOT NULL,
                    bank_name TEXT NOT NULL,
                    account_name TEXT NOT NULL,
                    bank_id INTEGER NOT NULL,
                    price REAL NOT NULL,
                    fee REAL DEFAULT 0,
                    cost_center_id INTEGER,
                    current_balance REAL NOT NULL,
                    after_balance REAL NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bank_id) REFERENCES bank(id),
                    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
                )
            ''')
            
            # Create transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_id INTEGER NOT NULL,
                    cost_center_id INTEGER,
                    billing_id INTEGER,
                    bank_name TEXT NOT NULL,
                    account_name TEXT NOT NULL,
                    price REAL NOT NULL,
                    amount REAL,  
                    state TEXT NOT NULL,
                    description TEXT,  
                    category TEXT,     
                    fee REAL DEFAULT 0,
                    cost_center_name TEXT,
                    before_balance REAL NOT NULL,
                    after_balance REAL NOT NULL,
                    date DATE NOT NULL,
                    user_id INTEGER,   
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bank_id) REFERENCES bank(id),
                    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
                    FOREIGN KEY (billing_id) REFERENCES billing(id),
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            ''')
            
            # Create month_transactions table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS month_transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    month_date DATE NOT NULL,
                    bank_id INTEGER NOT NULL,
                    cost_center_id INTEGER,
                    bank_name TEXT NOT NULL,
                    account_name TEXT NOT NULL,                    
                    state TEXT NOT NULL,                    
                    cost_center_name TEXT,
                    total_income REAL NOT NULL,
                    total_expenses REAL NOT NULL,  
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bank_id) REFERENCES bank(id),
                    FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id),
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            ''')
            
            # Create app_settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    user_id INTEGER,  -- Add user-specific settings
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            ''')
            
            # Add indexes for better performance
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_transactions_bank_id ON transactions(bank_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_banks_user_id ON banks(user_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_bank_user_id ON bank(user_id)
            ''')
            
            conn.commit()
            cursor.close()
            conn.close()
            return True
        except Exception as e:
            print(f"Database initialization error: {e}")
            return False
    
    def get_connection(self):
        """Get database connection with row factory"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable dictionary-like access to rows
        return conn
    
    def get_cursor(self):
        """Get a cursor from a new connection"""
        conn = self.get_connection()
        return conn.cursor()
    
    def execute_query(self, query, params=None):
        """Execute a query and return results"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
            
            if query.strip().upper().startswith('SELECT'):
                results = cursor.fetchall()
                cursor.close()
                conn.close()
                return results
            else:
                conn.commit()
                cursor.close()
                conn.close()
                return True
                
        except Exception as e:
            print(f"Database query error: {e}")
            return None
    
    def close_connection(self):
        """Close database connection if exists"""
        if self.connection:
            self.connection.close()
            self.connection = None