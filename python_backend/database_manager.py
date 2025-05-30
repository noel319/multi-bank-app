import sqlite3
import os


class DatabaseManager:
    def __init__(self, db_path="app_database.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize database and create tables if they don't exist"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create user table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT,
                    google_sheet TEXT,
                    google_token TEXT,
                    role TEXT NOT NULL DEFAULT 'user',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            ''')
            
            # Create bank table
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
            
            # Create cost_center table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_center (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    group_name TEXT NOT NULL,
                    cost_center_name TEXT NOT NULL,
                    state TEXT NOT NULL,
                    area_id INTEGER,
                    FOREIGN KEY (area_id) REFERENCES area(id)
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
                    FOREIGN KEY (cost_center_id) REFERENCES cost_center(id)
                )
            ''')
            
            # Create transaction table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bank_id INTEGER NOT NULL,
                    cost_center_id INTEGER,
                    billing_id INTEGER,
                    bank_name TEXT NOT NULL,
                    account_name TEXT NOT NULL,
                    price REAL NOT NULL,
                    state TEXT NOT NULL,
                    fee REAL DEFAULT 0,
                    cost_center_name TEXT,
                    before_balance REAL NOT NULL,
                    after_balance REAL NOT NULL,
                    date DATE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (bank_id) REFERENCES bank(id),
                    FOREIGN KEY (cost_center_id) REFERENCES cost_center(id),
                    FOREIGN KEY (billing_id) REFERENCES billing(id)
                )
            ''')
            
            # Create app_settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Database initialization error: {e}")
            return False
    
    def get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)