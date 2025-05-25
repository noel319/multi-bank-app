import sqlite3
import os
from datetime import datetime

DATABASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'db')
DATABASE_PATH = os.path.join(DATABASE_DIR, 'finance_manager.sqlite')

def get_db_connection():
    if not os.path.exists(DATABASE_DIR):
        os.makedirs(DATABASE_DIR)
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    return conn

def create_tables():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Accounts Table (incorporates Bank and Account from your image)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_name TEXT NOT NULL,              -- e.g., "Aquaheiss", "Ahorro", "PC"
            bank_name TEXT NOT NULL,                 -- e.g., "ITAU", "ESTADO", "FONDOS"
            account_number_display TEXT,             -- e.g., "**** 3535" (for BankCard component)
            account_type TEXT DEFAULT 'checking',    -- 'checking', 'savings', 'credit', 'investment'
            balance REAL NOT NULL DEFAULT 0.00,
            currency TEXT NOT NULL DEFAULT 'CLP',    -- Default to Chilean Peso based on bank names
            color_gradient TEXT,                     -- For UI styling (e.g., 'gradient-blue')
            card_network_logo_url TEXT,              -- For UI
            card_expiry_date TEXT,                   -- For UI e.g., "05/25"
            api_integration_id TEXT UNIQUE,          -- Identifier for bank API integration (e.g., Plaid item_id)
            api_access_token TEXT,                   -- Store securely (encrypted)!
            last_synced_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    # Trigger to update 'updated_at'
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_accounts_updated_at
        AFTER UPDATE ON accounts
        FOR EACH ROW
        BEGIN
            UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    ''')


    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cost_centers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')), -- 'income' or 'expense'
            color TEXT, -- For UI visual cues
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            cost_center_id INTEGER,
            transaction_date TEXT NOT NULL, -- Store as ISO8601 string (YYYY-MM-DD)
            concept TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('income', 'expense')), -- 'income' or 'expense'
            currency TEXT NOT NULL DEFAULT 'CLP',
            bank_transaction_id TEXT, -- Optional, from bank statement/API for de-duplication
            notes TEXT,
            is_synced_to_gsheet INTEGER DEFAULT 0, -- Boolean (0 or 1)
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
            FOREIGN KEY (cost_center_id) REFERENCES cost_centers (id) ON DELETE SET NULL
        )
    ''')
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS update_transactions_updated_at
        AFTER UPDATE ON transactions
        FOR EACH ROW
        BEGIN
            UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    ''')
    # Initial settings (can be updated by the app)
    cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
                   ('current_year_gsheet_id', ''))
    cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)",
                   ('google_auth_tokens', '')) # Store Google OAuth tokens JSON here (encrypted)

    conn.commit()
    conn.close()
    print(f"Database tables created/verified at {DATABASE_PATH}")

if __name__ == '__main__':
    create_tables()
    # You can add seed data here if needed for initial setup
    # Example:
    # conn = get_db_connection()
    # cursor = conn.cursor()
    # initial_accounts = [
    #     (1, 'Aquaheiss', 'ITAU', '**** 1234', 'checking', 1500000.00, 'CLP', 'gradient-blue', '/path/to/itau-logo.png', '12/25'),
    #     (2, 'Flor del Viento', 'ESTADO', '**** 5678', 'checking', 850000.00, 'CLP', 'gradient-green', '/path/to/estado-logo.png', '10/24'),
    #     # ... add others based on your image
    #     (6, 'Ahorro', 'FONDOS', None, 'savings', 2500000.00, 'CLP', 'gradient-teal', None, None)
    # ]
    # for acc in initial_accounts:
    #     cursor.execute("INSERT OR IGNORE INTO accounts (id, account_name, bank_name, account_number_display, account_type, balance, currency, color_gradient, card_network_logo_url, card_expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", acc)
    # conn.commit()
    # conn.close()
    # print("Initial accounts seeded (if they didn't exist).")