"""
Bank Manager Module
Handles bank account operations and management
"""


class BankManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager
    
    def add_bank(self, bank_data):
        """Add a new bank account"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Check if bank account already exists for this user
            cursor.execute('''
                SELECT id FROM bank WHERE bank_name = ? AND account = ? AND user_id = ?
            ''', (bank_data['bank_name'], bank_data['account'], self.auth.current_user_id))
            
            if cursor.fetchone():
                conn.close()
                return {"success": False, "error": "Bank account already exists"}
            
            # Insert new bank account
            cursor.execute('''
                INSERT INTO bank (bank_name, account, current_balance, endpoint, color, user_id, role)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                bank_data['bank_name'],
                bank_data['account'],
                bank_data['current_balance'],
                bank_data.get('endpoint', ''),
                bank_data.get('color', 'blue'),
                self.auth.current_user_id,
                bank_data.get('role', 'checking')
            ))
            
            bank_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "message": "Bank account added successfully",
                "bank_id": bank_id
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to add bank account: {str(e)}"}
    
    def update_bank(self, bank_data):
        """Update an existing bank account"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Verify bank belongs to current user
            cursor.execute('''
                SELECT id FROM bank WHERE id = ? AND user_id = ?
            ''', (bank_data['bank_id'], self.auth.current_user_id))
            
            if not cursor.fetchone():
                conn.close()
                return {"success": False, "error": "Bank account not found or access denied"}
            
            # Update bank account
            cursor.execute('''
                UPDATE bank SET 
                    bank_name = ?, account = ?, current_balance = ?, 
                    endpoint = ?, color = ?, role = ?
                WHERE id = ? AND user_id = ?
            ''', (
                bank_data['bank_name'],
                bank_data['account'],
                bank_data['current_balance'],
                bank_data.get('endpoint', ''),
                bank_data.get('color', 'blue'),
                bank_data.get('role', 'checking'),
                bank_data['bank_id'],
                self.auth.current_user_id
            ))
            
            conn.commit()
            conn.close()
            
            return {"success": True, "message": "Bank account updated successfully"}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to update bank account: {str(e)}"}
    
    def delete_bank(self, bank_id):
        """Delete a bank account and all associated transactions"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Verify bank belongs to current user
            cursor.execute('''
                SELECT id FROM bank WHERE id = ? AND user_id = ?
            ''', (bank_id, self.auth.current_user_id))
            
            if not cursor.fetchone():
                conn.close()
                return {"success": False, "error": "Bank account not found or access denied"}
            
            # Delete associated transactions first
            cursor.execute('DELETE FROM transaction WHERE bank_id = ?', (bank_id,))
            cursor.execute('DELETE FROM billing WHERE bank_id = ?', (bank_id,))
            
            # Delete bank account
            cursor.execute('DELETE FROM bank WHERE id = ? AND user_id = ?', (bank_id, self.auth.current_user_id))
            
            conn.commit()
            conn.close()
            
            return {"success": True, "message": "Bank account and associated data deleted successfully"}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to delete bank account: {str(e)}"}
    
    def get_user_banks(self):
        """Get all banks for the current user"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, bank_name, account, current_balance, endpoint, color, role, created_at
                FROM bank WHERE user_id = ?
                ORDER BY created_at DESC
            ''', (self.auth.current_user_id,))
            
            banks = []
            for row in cursor.fetchall():
                banks.append({
                    "id": row[0],
                    "bank_name": row[1],
                    "account": row[2],
                    "current_balance": row[3],
                    "endpoint": row[4],
                    "color": row[5],
                    "role": row[6],
                    "created_at": row[7]
                })
            
            conn.close()
            return {"success": True, "banks": banks}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get banks: {str(e)}"}