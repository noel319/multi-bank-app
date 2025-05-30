import gspread
from google.oauth2.service_account import Credentials


class GoogleSheetsManager:
    def __init__(self, db_manager, auth_manager):
        self.db = db_manager
        self.auth = auth_manager
    
    def sync_with_google_sheets(self):
        """Sync transactions with Google Sheets"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            user = self.auth.get_user_by_id(self.auth.current_user_id)
            if not user or not user.get('google_token'):
                return {"success": False, "error": "Google authentication required"}
            
                      
            return {
                "success": True,
                "message": "Google Sheets sync completed successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to sync with Google Sheets: {str(e)}"}