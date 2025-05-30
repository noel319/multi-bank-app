class HomeDataManager:
    def __init__(self, db_manager, auth_manager, bank_manager, transaction_manager):
        self.db = db_manager
        self.auth = auth_manager
        self.bank_manager = bank_manager
        self.transaction_manager = transaction_manager
    
    def get_home_data(self):
        """Get all data needed for the home page"""
        try:
            if not self.auth.current_user_id:
                return {"success": False, "error": "User not authenticated"}
            
            # Get user profile
            user_profile = self.auth.get_user_by_id(self.auth.current_user_id)
            
            # Get banks
            banks_result = self.bank_manager.get_user_banks()
            banks = banks_result.get('banks', []) if banks_result['success'] else []
            
            # Get recent transactions
            transactions_result = self.transaction_manager.get_recent_transactions(10)
            recent_transactions = transactions_result.get('transactions', []) if transactions_result['success'] else []
            
            # Calculate balances
            total_balance = self.transaction_manager.calculate_total_balance()
            personal_balance = self.transaction_manager.calculate_personal_balance()
            
            return {
                "success": True,
                "data": {
                    "banks": banks,
                    "totalBalance": total_balance,
                    "personalBalance": personal_balance,
                    "recentTransactions": recent_transactions,
                    "userProfile": {
                        "name": user_profile.get('name'),
                        "email": user_profile.get('email'),
                        "avatar": None  # Add avatar support later if needed
                    }
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get home data: {str(e)}"}