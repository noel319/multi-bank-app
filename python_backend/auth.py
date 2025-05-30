
import hashlib
from google.auth.transport import requests
from google.oauth2 import id_token

class AuthManager:
    def __init__(self, db_manager):
        self.db = db_manager
        self.current_user_id = None
        self.load_current_user()
    
    def load_current_user(self):
        """Load the current logged-in user from settings"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("SELECT value FROM app_settings WHERE key = 'current_user_id'")
            result = cursor.fetchone()
            conn.close()
            
            if result:
                self.current_user_id = int(result[0])
        except Exception as e:
            print(f"Error loading current user: {e}")
            self.current_user_id = None
    
    def save_current_user(self, user_id):
        """Save the current logged-in user to settings"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO app_settings (key, value, updated_at)
                VALUES ('current_user_id', ?, CURRENT_TIMESTAMP)
            ''', (str(user_id),))
            conn.commit()
            conn.close()
            self.current_user_id = user_id
        except Exception as e:
            print(f"Error saving current user: {e}")
    
    def clear_current_user(self):
        """Clear the current logged-in user"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute("DELETE FROM app_settings WHERE key = 'current_user_id'")
            conn.commit()
            conn.close()
            self.current_user_id = None
        except Exception as e:
            print(f"Error clearing current user: {e}")
    
    def hash_password(self, password):
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def register_user(self, name, email, password):
        """Register a new user"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id FROM user WHERE email = ?", (email,))
            if cursor.fetchone():
                conn.close()
                return {"success": False, "error": "User with this email already exists"}
            
            # Hash password
            hashed_password = self.hash_password(password)
            
            # Insert new user
            cursor.execute('''
                INSERT INTO user (name, email, password, role)
                VALUES (?, ?, ?, 'user')
            ''', (name, email, hashed_password))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            # Auto-login the new user
            self.save_current_user(user_id)
            user_data = self.get_user_by_id(user_id)
            
            return {
                "success": True,
                "message": "User registered successfully",
                "user": user_data
            }
            
        except Exception as e:
            return {"success": False, "error": f"Registration failed: {str(e)}"}
    
    def login_user(self, email, password):
        """Login user with email and password"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Get user by email
            hashed_password = self.hash_password(password)
            cursor.execute('''
                SELECT id, name, email, role FROM user 
                WHERE email = ? AND password = ?
            ''', (email, hashed_password))
            
            user = cursor.fetchone()
            
            if not user:
                conn.close()
                return {"success": False, "error": "Invalid email or password"}
            
            # Update last login
            cursor.execute('''
                UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE id = ?
            ''', (user[0],))
            
            conn.commit()
            conn.close()
            
            # Save current user
            self.save_current_user(user[0])
            
            user_data = {
                "id": user[0],
                "name": user[1],
                "email": user[2],
                "role": user[3]
            }
            
            return {
                "success": True,
                "message": "Login successful",
                "user": user_data
            }
            
        except Exception as e:
            return {"success": False, "error": f"Login failed: {str(e)}"}
    
    def google_auth(self, credential):
        """Handle Google OAuth authentication"""
        try:
            # Verify the Google ID token
            GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID"  # Replace with your actual client ID
            
            try:
                idinfo = id_token.verify_oauth2_token(
                    credential, requests.Request(), GOOGLE_CLIENT_ID)
            except ValueError:
                return {"success": False, "error": "Invalid Google token"}
            
            email = idinfo.get('email')
            name = idinfo.get('name')
            
            if not email:
                return {"success": False, "error": "No email provided by Google"}
            
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute("SELECT id, name, email, role FROM user WHERE email = ?", (email,))
            user = cursor.fetchone()
            
            if user:
                # Update Google token and last login
                cursor.execute('''
                    UPDATE user SET google_token = ?, last_login = CURRENT_TIMESTAMP 
                    WHERE id = ?
                ''', (credential, user[0]))
                
                user_data = {
                    "id": user[0],
                    "name": user[1],
                    "email": user[2],
                    "role": user[3],
                    "google_token": credential
                }
                user_id = user[0]
            else:
                # Create new user
                cursor.execute('''
                    INSERT INTO user (name, email, google_token, role)
                    VALUES (?, ?, ?, 'user')
                ''', (name, email, credential))
                
                user_id = cursor.lastrowid
                user_data = {
                    "id": user_id,
                    "name": name,
                    "email": email,
                    "role": "user",
                    "google_token": credential
                }
            
            conn.commit()
            conn.close()
            
            # Save current user
            self.save_current_user(user_data["id"])
            
            return {
                "success": True,
                "message": "Google authentication successful",
                "user": user_data
            }
            
        except Exception as e:
            return {"success": False, "error": f"Google authentication failed: {str(e)}"}
    
    def get_user_by_id(self, user_id):
        """Get user data by ID"""
        try:
            conn = self.db.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, name, email, role, google_sheet, google_token, last_login
                FROM user WHERE id = ?
            ''', (user_id,))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return {
                    "id": user[0],
                    "name": user[1],
                    "email": user[2],
                    "role": user[3],
                    "google_sheet": user[4],
                    "google_token": user[5],
                    "last_login": user[6]
                }
            return None
            
        except Exception as e:
            print(f"Error getting user: {e}")
            return None
    
    def check_auth_status(self):
        """Check if user is currently authenticated"""
        if self.current_user_id:
            user_data = self.get_user_by_id(self.current_user_id)
            if user_data:
                return {"success": True, "user": user_data}
        
        return {"success": False, "error": "No authenticated user"}
    
    def logout_user(self):
        """Logout current user"""
        self.clear_current_user()
        return {"success": True, "message": "Logged out successfully"}
