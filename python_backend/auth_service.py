import os
import json
import jwt
from datetime import datetime, timedelta
from google.oauth2 import id_token
from google.auth.transport import requests
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')  # In production, use a secure secret
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')

class AuthService:
    @staticmethod
    def verify_google_token(token):
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
            
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Invalid issuer')
                
            return {
                'success': True,
                'user': {
                    'email': idinfo['email'],
                    'name': idinfo.get('name', ''),
                    'picture': idinfo.get('picture', ''),
                    'sub': idinfo['sub']
                }
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def generate_jwt(user_data):
        try:
            payload = {
                'sub': user_data['sub'],
                'email': user_data['email'],
                'name': user_data['name'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
            return {'success': True, 'token': token}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    @staticmethod
    def verify_jwt(token):
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            return {'success': True, 'user': payload}
        except jwt.ExpiredSignatureError:
            return {'success': False, 'error': 'Token has expired'}
        except jwt.InvalidTokenError as e:
            return {'success': False, 'error': str(e)} 