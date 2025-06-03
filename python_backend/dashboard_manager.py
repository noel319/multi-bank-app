import sqlite3
from datetime import datetime, timedelta
import calendar

class DashboardManager:
    def __init__(self, db_manager, auth_manager):
        self.db_manager = db_manager
        self.auth_manager = auth_manager

    def get_dashboard_data(self, month):
        """Get all dashboard data for a specific month"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Parse month (format: YYYY-MM)
            year, month_num = map(int, month.split('-'))
            
            # Get monthly data per bank
            monthly_bank_data = self._get_monthly_bank_data(cursor, current_user['id'], year, month_num)
            
            # Get annual cost center data per bank
            annual_bank_cost_center_data = self._get_annual_bank_cost_center_data(cursor, current_user['id'], year)
            
            # Get total annual cost center data
            total_annual_cost_center_data = self._get_total_annual_cost_center_data(cursor, current_user['id'], year)

            conn.close()

            return {
                "success": True,
                "data": {
                    "monthlyBankData": monthly_bank_data,
                    "annualBankCostCenterData": annual_bank_cost_center_data,
                    "totalAnnualCostCenterData": total_annual_cost_center_data
                }
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to get dashboard data: {str(e)}"}

    def get_bank_detail_data(self, bank_id, month):
        """Get detailed data for a specific bank and month"""
        current_user = self.auth_manager.get_current_user()
        if not current_user:
            return {"success": False, "error": "User not authenticated"}

        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()

            # Parse month (format: YYYY-MM)
            year, month_num = map(int, month.split('-'))
            
            # Get monthly balance data for chart
            monthly_balance_data = self._get_bank_monthly_balance_data(cursor, bank_id, year, month_num)
            
            # Get annual cost center data for this bank
            annual_cost_center_data = self._get_bank_annual_cost_center_data(cursor, bank_id, year)
            
            # Get monthly transactions for this bank
            monthly_transactions = self._get_bank_monthly_transactions(cursor, bank_id, year, month_num)
            
            # Get monthly statistics
            monthly_stats = self._get_bank_monthly_stats(cursor, bank_id, year, month_num)

            conn.close()

            return {
                "success": True,
                "data": {
                    "monthlyBalanceData": monthly_balance_data,
                    "annualCostCenterData": annual_cost_center_data,
                    "monthlyTransactions": monthly_transactions,
                    "monthlyStats": monthly_stats
                }
            }

        except Exception as e:
            return {"success": False, "error": f"Failed to get bank detail data: {str(e)}"}

    def _get_monthly_bank_data(self, cursor, user_id, year, month):
        """Get monthly income/expense data for each bank"""
        cursor.execute("""
            SELECT 
                b.id AS bank_id,
                b.bank_name,
                b.account,
                COALESCE(SUM(CASE WHEN t.state = 'Income' THEN t.price ELSE 0 END), 0) AS income,
                COALESCE(SUM(CASE WHEN t.state = 'Expense' THEN t.price ELSE 0 END), 0) AS expense,
                COALESCE(SUM(CASE 
                    WHEN t.state = 'Income' THEN t.price
                    WHEN t.state = 'Expense' THEN -t.price
                    ELSE 0
                END), 0) AS balance
            FROM bank b
            LEFT JOIN transactions t ON b.id = t.bank_id 
                AND strftime('%Y', t.date) = ? 
                AND strftime('%m', t.date) = ?
            WHERE b.user_id = ?
            GROUP BY b.id, b.bank_name, b.account
            ORDER BY b.bank_name
        """, (str(year), f"{month:02d}", user_id))

        banks_data = cursor.fetchall()
        
        result = []
        for bank_data in banks_data:
            monthly_data = [{
                "month": f"{year}-{month:02d}",
                "income": float(bank_data[3]),
                "expense": float(bank_data[4]),
                "balance": float(bank_data[5])
            }]
            
            result.append({
                "bank_id": bank_data[0],
                "bank_name": bank_data[1],
                "account": bank_data[2],
                "monthlyData": monthly_data
            })

        return result


    def _get_annual_bank_cost_center_data(self, cursor, user_id, year):
        """Get annual cost center data for each bank"""
        cursor.execute("""
            SELECT 
                b.id as bank_id,
                b.bank_name,
                COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                COALESCE(SUM(CASE WHEN t.price > 0 THEN t.price ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN t.price < 0 THEN ABS(t.price) ELSE 0 END), 0) as expense
            FROM bank b
            LEFT JOIN transactions t ON b.id = t.bank_id AND strftime('%Y', t.date) = ?
            LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
            WHERE b.user_id = ?
            GROUP BY b.id, b.bank_name, cc.name
            HAVING (income > 0 OR expense > 0)
            ORDER BY b.bank_name, expense DESC
        """, (str(year), user_id))

        data = cursor.fetchall()
        
        # Group by bank
        banks_data = {}
        for row in data:
            bank_id = row[0]
            if bank_id not in banks_data:
                banks_data[bank_id] = {
                    "bank_id": bank_id,
                    "bank_name": row[1],
                    "costCenterData": []
                }
            
            banks_data[bank_id]["costCenterData"].append({
                "name": row[2],
                "income": float(row[3]),
                "expense": float(row[4])
            })

        return list(banks_data.values())

    def _get_total_annual_cost_center_data(self, cursor, user_id, year):
        """Get total annual cost center data across all banks"""
        cursor.execute("""
            SELECT 
                COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                COALESCE(SUM(CASE WHEN t.price > 0 THEN t.price ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN t.price < 0 THEN ABS(t.price) ELSE 0 END), 0) as expense
            FROM transactions t
            JOIN bank b ON t.bank_id = b.id
            LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
            WHERE b.user_id = ? AND strftime('%Y', t.date) = ?
            GROUP BY cc.name
            HAVING (income > 0 OR expense > 0)
            ORDER BY expense DESC
        """, (user_id, str(year)))

        data = cursor.fetchall()
        
        return [{
            "name": row[0],
            "income": float(row[1]),
            "expense": float(row[2])
        } for row in data]

    def _get_bank_monthly_balance_data(self, cursor, bank_id, year, month):
        """Get monthly balance data for a specific bank (for chart)"""
        # Get daily balance changes for the month
        cursor.execute("""
            SELECT 
                date,
                SUM(CASE WHEN price > 0 THEN price ELSE 0 END) as daily_income,
                SUM(CASE WHEN price < 0 THEN ABS(price) ELSE 0 END) as daily_expense,
                SUM(price) as daily_balance
            FROM transactions 
            WHERE bank_id = ? 
                AND strftime('%Y', date) = ? 
                AND strftime('%m', date) = ?
            GROUP BY date
            ORDER BY date
        """, (bank_id, str(year), f"{month:02d}"))

        daily_data = cursor.fetchall()
        
        # Aggregate to monthly totals
        total_income = sum(row[1] for row in daily_data)
        total_expense = sum(row[2] for row in daily_data)
        total_balance = sum(row[3] for row in daily_data)

        return [{
            "month": f"{year}-{month:02d}",
            "income": float(total_income),
            "expense": float(total_expense),
            "balance": float(total_balance)
        }]

    def _get_bank_annual_cost_center_data(self, cursor, bank_id, year):
        """Get annual cost center data for a specific bank"""
        cursor.execute("""
            SELECT 
                COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                COALESCE(SUM(CASE WHEN t.price > 0 THEN t.price ELSE 0 END), 0) as income,
                COALESCE(SUM(CASE WHEN t.price < 0 THEN ABS(t.price) ELSE 0 END), 0) as expense
            FROM transactions t
            LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
            WHERE t.bank_id = ? AND strftime('%Y', t.date) = ?
            GROUP BY cc.name
            HAVING (income > 0 OR expense > 0)
            ORDER BY expense DESC
        """, (bank_id, str(year)))

        data = cursor.fetchall()
        
        return [{
            "name": row[0],
            "income": float(row[1]),
            "expense": float(row[2])
        } for row in data]

    def _get_bank_monthly_transactions(self, cursor, bank_id, year, month):
        """Get all transactions for a specific bank and month"""
        cursor.execute("""
            SELECT 
                t.id,
                t.date,
                t.price,
                t.state,
                t.fee,
                t.before_balance,
                t.after_balance,
                COALESCE(cc.name, 'Uncategorized') as cost_center_name,
                t.cost_center_id
            FROM transactions t
            LEFT JOIN cost_centers cc ON t.cost_center_id = cc.id
            WHERE t.bank_id = ? 
                AND strftime('%Y', t.date) = ? 
                AND strftime('%m', t.date) = ?
            ORDER BY t.date DESC, t.id DESC
        """, (bank_id, str(year), f"{month:02d}"))

        data = cursor.fetchall()
        
        return [{
            "id": row[0],
            "date": row[1],
            "price": float(row[2]),
            "state": row[3],
            "fee": float(row[4]) if row[4] else 0,
            "before_balance": float(row[5]),
            "after_balance": float(row[6]),
            "cost_center_name": row[7],
            "cost_center_id": row[8]
        } for row in data]

    def _get_bank_monthly_stats(self, cursor, bank_id, year, month):
        """Get monthly statistics for a specific bank"""
        cursor.execute("""
            SELECT 
                COALESCE(SUM(CASE WHEN price > 0 THEN price ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN price < 0 THEN price ELSE 0 END), 0) as total_expense,
                COALESCE(SUM(price), 0) as net_balance,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE bank_id = ? 
                AND strftime('%Y', date) = ? 
                AND strftime('%m', date) = ?
        """, (bank_id, str(year), f"{month:02d}"))

        data = cursor.fetchone()
        
        return {
            "totalIncome": float(data[0]),
            "totalExpense": float(data[1]),
            "netBalance": float(data[2]),
            "transactionCount": int(data[3])
        }