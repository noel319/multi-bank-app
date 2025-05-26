import sys
import json
import argparse
import sqlite3
import hashlib
import secrets
import jwt
import datetime
import os
from google.oauth2 import id_token
from google.auth.transport import requests
import traceback

# Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this')
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', 'your-google-client-id')
TOKEN_EXPIRY_HOURS = 24
DB_PATH = 'app_database.db'

class AuthHandler:
    def __init__(self):
        self.init_database()
    
    def init_database(self):
        """Initialize the SQLite database with required tables"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Users table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    name TEXT NOT NULL,
                    google_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Sessions table for token management
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    token TEXT UNIQUE NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # App settings table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.commit()
            conn.close()
            return {"success": True, "message": "Database initialized"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def hash_password(self, password):
        """Hash password with salt"""
        salt = secrets.token_hex(16)
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return f"{salt}:{password_hash.hex()}"
    
    def verify_password(self, password, hashed_password):
        """Verify password against hash"""
        try:
            salt, password_hash = hashed_password.split(':')
            new_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return password_hash == new_hash.hex()
        except:
            return False
    
    def generate_token(self, user_id):
        """Generate JWT token for user"""
        payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS),
            'iat': datetime.datetime.utcnow()
        }
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    def verify_token(self, token):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def register(self, email, password, name):
        """Register new user"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                return {"success": False, "error": "User already exists"}
            
            # Hash password and create user
            password_hash = self.hash_password(password)
            cursor.execute('''
                INSERT INTO users (email, password_hash, name)
                VALUES (?, ?, ?)
            ''', (email, password_hash, name))
            
            user_id = cursor.lastrowid
            
            # Generate token
            token = self.generate_token(user_id)
            
            # Store session
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS)
            cursor.execute('''
                INSERT INTO sessions (user_id, token, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, token, expires_at))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "data": {
                    "user": {"id": user_id, "email": email, "name": name},
                    "token": token
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def login(self, email, password):
        """Login user with email and password"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get user
            cursor.execute('''
                SELECT id, email, password_hash, name 
                FROM users WHERE email = ?
            ''', (email,))
            
            user = cursor.fetchone()
            if not user or not self.verify_password(password, user[2]):
                return {"success": False, "error": "Invalid email or password"}
            
            user_id, email, _, name = user
            
            # Generate new token
            token = self.generate_token(user_id)
            
            # Clean old sessions and store new one
            cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS)
            cursor.execute('''
                INSERT INTO sessions (user_id, token, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, token, expires_at))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "data": {
                    "user": {"id": user_id, "email": email, "name": name},
                    "token": token
                }
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def google_login(self, credential):
        """Login user with Google OAuth"""
        try:
            # Verify Google token
            idinfo = id_token.verify_oauth2_token(
                credential, requests.Request(), GOOGLE_CLIENT_ID)
            
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo.get('name', email.split('@')[0])
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute('SELECT id, email, name FROM users WHERE google_id = ? OR email = ?', 
                         (google_id, email))
            user = cursor.fetchone()
            
            if user:
                user_id, email, name = user
                # Update google_id if not set
                cursor.execute('UPDATE users SET google_id = ? WHERE id = ?', (google_id, user_id))
            else:
                # Create new user
                cursor.execute('''
                    INSERT INTO users (email, name, google_id)
                    VALUES (?, ?, ?)
                ''', (email, name, google_id))
                user_id = cursor.lastrowid
            
            # Generate token
            token = self.generate_token(user_id)
            
            # Clean old sessions and store new one
            cursor.execute('DELETE FROM sessions WHERE user_id = ?', (user_id,))
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS)
            cursor.execute('''
                INSERT INTO sessions (user_id, token, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, token, expires_at))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "data": {
                    "user": {"id": user_id, "email": email, "name": name},
                    "token": token
                }
            }
        except Exception as e:
            return {"success": False, "error": f"Google authentication failed: {str(e)}"}
    
    def logout(self, token):
        """Logout user by invalidating token"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
            conn.commit()
            conn.close()
            return {"success": True, "message": "Logged out successfully"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def check_auth_status(self):
        """Check if there's an active session"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Get the most recent valid session
            cursor.execute('''
                SELECT s.token, s.user_id, u.email, u.name
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.expires_at > datetime('now')
                ORDER BY s.created_at DESC
                LIMIT 1
            ''')
            
            session = cursor.fetchone()
            conn.close()
            
            if session:
                token, user_id, email, name = session
                return {
                    "success": True,
                    "data": {
                        "authenticated": True,
                        "user": {"id": user_id, "email": email, "name": name},
                        "token": token
                    }
                }
            else:
                return {
                    "success": True,
                    "data": {"authenticated": False}
                }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def refresh_token(self, token):
        """Refresh user token"""
        try:
            payload = self.verify_token(token)
            if not payload:
                return {"success": False, "error": "Invalid token"}
            
            user_id = payload['user_id']
            new_token = self.generate_token(user_id)
            
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            
            # Update session with new token
            expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS)
            cursor.execute('''
                UPDATE sessions 
                SET token = ?, expires_at = ?
                WHERE token = ?
            ''', (new_token, expires_at, token))
            
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "data": {"token": new_token}
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

def main():
    """Main entry point for Python backend"""
    parser = argparse.ArgumentParser(description='Backend handler for Electron app')
    parser.add_argument('action', help='Action to perform')
    parser.add_argument('--payload', default='{}', help='JSON payload for the action')
    
    args = parser.parse_args()
    
    try:
        payload = json.loads(args.payload)
        auth_handler = AuthHandler()
        
        # Route actions
        if args.action == 'init_db_check':
            result = auth_handler.init_database()
        elif args.action == 'register':
            result = auth_handler.register(
                payload.get('email'),
                payload.get('password'),
                payload.get('name')
            )
        elif args.action == 'login':
            result = auth_handler.login(
                payload.get('email'),
                payload.get('password')
            )
        elif args.action == 'google_login':
            result = auth_handler.google_login(payload.get('credential'))
        elif args.action == 'logout':
            result = auth_handler.logout(payload.get('token'))
        elif args.action == 'check_auth_status':
            result = auth_handler.check_auth_status()
        elif args.action == 'refresh_token':
            result = auth_handler.refresh_token(payload.get('token'))
        else:
            result = {"success": False, "error": f"Unknown action: {args.action}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()