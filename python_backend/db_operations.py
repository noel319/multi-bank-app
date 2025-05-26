import sqlite3
from database_setup import get_db_connection
from datetime import datetime

# --- Account Operations ---
def add_account(account_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO accounts (account_name, bank_name, account_number_display, account_type, balance, currency, color_gradient, card_network_logo_url, card_expiry_date)
            VALUES (:account_name, :bank_name, :account_number_display, :account_type, :balance, :currency, :color_gradient, :card_network_logo_url, :card_expiry_date)
        ''', account_data)
        conn.commit()
        return {"id": cursor.lastrowid, **account_data}
    finally:
        conn.close()

def get_all_accounts():
    conn = get_db_connection()
    accounts = conn.execute("SELECT * FROM accounts ORDER BY id").fetchall()
    conn.close()
    return [dict(row) for row in accounts]

def get_account_by_id(account_id: int):
    conn = get_db_connection()
    account = conn.execute("SELECT * FROM accounts WHERE id = ?", (account_id,)).fetchone()
    conn.close()
    return dict(account) if account else None

def update_account(account_id: int, account_data: dict):
    # Construct SET clause dynamically based on provided keys in account_data
    set_clause = ", ".join([f"{key} = :{key}" for key in account_data.keys()])
    params = {**account_data, "id": account_id}
    
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE accounts SET {set_clause} WHERE id = :id", params)
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error updating account: {e}")
        return False
    finally:
        conn.close()

def delete_account(account_id: int):
    conn = get_db_connection()
    try:
        conn.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error deleting account: {e}")
        return False
    finally:
        conn.close()

def update_account_balance(account_id: int, amount_change: float):
    # This is a simple update; consider transaction safety for concurrent ops if needed
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", (amount_change, account_id))
        conn.commit()
        if cursor.rowcount == 0:
            return False # Account not found or not updated
        updated_account = get_account_by_id(account_id)
        return updated_account
    except sqlite3.Error as e:
        print(f"Error updating balance: {e}")
        return None
    finally:
        conn.close()


# --- Transaction Operations ---
def add_transaction(transaction_data: dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ensure date is in YYYY-MM-DD string format
    if 'transaction_date' not in transaction_data or not isinstance(transaction_data['transaction_date'], str):
        transaction_data['transaction_date'] = datetime.now().strftime('%Y-%m-%d')

    try:
        cursor.execute('''
            INSERT INTO transactions (account_id, cost_center_id, transaction_date, concept, amount, type, currency, notes)
            VALUES (:account_id, :cost_center_id, :transaction_date, :concept, :amount, :type, :currency, :notes)
        ''', transaction_data)
        conn.commit()
        transaction_id = cursor.lastrowid

        # Update account balance
        balance_change = transaction_data['amount'] if transaction_data['type'] == 'income' else -transaction_data['amount']
        updated_account = update_account_balance(transaction_data['account_id'], balance_change)

        return {"id": transaction_id, **transaction_data, "updated_account_balance": updated_account['balance'] if updated_account else None}
    except sqlite3.Error as e:
        print(f"Error adding transaction: {e}")
        return None
    finally:
        conn.close()

def get_transactions_for_account(account_id: int, limit=50, offset=0):
    conn = get_db_connection()
    query = """
        SELECT t.*, cc.name as cost_center_name 
        FROM transactions t
        LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
        WHERE t.account_id = ? 
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT ? OFFSET ?
    """
    transactions = conn.execute(query, (account_id, limit, offset)).fetchall()
    conn.close()
    return [dict(row) for row in transactions]

def get_all_transactions(limit=100, offset=0):
    conn = get_db_connection()
    query = """
        SELECT t.*, a.account_name, a.bank_name, cc.name as cost_center_name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT ? OFFSET ?
    """
    transactions = conn.execute(query, (limit, offset)).fetchall()
    conn.close()
    return [dict(row) for row in transactions]


# --- Cost Center Operations ---
def add_cost_center(name: str, type: str, color: str = None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("INSERT INTO cost_centers (name, type, color) VALUES (?, ?, ?)", (name, type, color))
        conn.commit()
        return {"id": cursor.lastrowid, "name": name, "type": type, "color": color}
    except sqlite3.IntegrityError: # Handles UNIQUE constraint on name
        print(f"Cost center '{name}' already exists.")
        return None
    finally:
        conn.close()

def get_all_cost_centers():
    conn = get_db_connection()
    cost_centers = conn.execute("SELECT * FROM cost_centers ORDER BY name").fetchall()
    conn.close()
    return [dict(row) for row in cost_centers]

def update_cost_center(cc_id: int, name: str, type: str, color: str = None):
    conn = get_db_connection()
    try:
        conn.execute("UPDATE cost_centers SET name = ?, type = ?, color = ? WHERE id = ?", (name, type, color, cc_id))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error updating cost center: {e}")
        return False
    finally:
        conn.close()

def delete_cost_center(cc_id: int):
    conn = get_db_connection()
    try:
        # Consider how to handle transactions linked to this cost center (ON DELETE SET NULL is used in schema)
        conn.execute("DELETE FROM cost_centers WHERE id = ?", (cc_id,))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error deleting cost center: {e}")
        return False
    finally:
        conn.close()


# --- Settings Operations ---
def get_setting(key: str):
    conn = get_db_connection()
    row = conn.execute("SELECT value FROM app_settings WHERE key = ?", (key,)).fetchone()
    conn.close()
    return row['value'] if row else None

def update_setting(key: str, value: str):
    conn = get_db_connection()
    try:
        conn.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", (key, value))
        conn.commit()
        return True
    except sqlite3.Error as e:
        print(f"Error updating setting: {e}")
        return False
    finally:
        conn.close()