import sqlite3
import json
import traceback

class CostCenterManager:
    """Manages cost center operations including create, read, update, and delete"""
    
    def __init__(self, db_manager, auth_manager):
        """Initialize with database and authentication managers"""
        self.db_manager = db_manager
        self.auth_manager = auth_manager
        self._ensure_table_exists()
    
    def _ensure_table_exists(self):
        """Ensure the cost centers table exists in the database"""
        try:
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Create the cost_centers table if it doesn't exist
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cost_centers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    group_name TEXT NOT NULL,
                    cost_center TEXT NOT NULL,
                    area TEXT NOT NULL,
                    state TEXT,
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            ''')
            
            conn.commit()
        except Exception as e:
            print(f"Error ensuring cost_centers table exists: {str(e)}")
            traceback.print_exc()
            conn.rollback()
        finally:
            cursor.close()
    
    def add_cost_center(self, payload):
        """Add a new cost center to the database
        
        Args:
            payload (dict): Dictionary containing cost center data
                - group: Group name
                - cost_center: Cost center code
                - area: Area name
                - state: State (optional)
        
        Returns:
            dict: Result of the operation
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            # Extract data from payload
            group = payload.get('group')
            cost_center = payload.get('cost_center')
            area = payload.get('area')
            state = payload.get('state', '')
            
            # Validate required fields
            if not all([group, cost_center, area]):
                return {"success": False, "error": "Group, cost center, and area are required"}
            
            # Create the combined name field
            name = f"{group},{cost_center},{area}"
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Check if this cost center already exists
            cursor.execute(
                "SELECT id FROM cost_centers WHERE group_name = ? AND cost_center = ? AND area = ? AND user_id = ?",
                (group, cost_center, area, user_id)
            )
            existing = cursor.fetchone()
            
            if existing:
                return {"success": False, "error": "A cost center with these details already exists"}
            
            # Insert the new cost center
            cursor.execute(
                """
                INSERT INTO cost_centers 
                (name, group_name, cost_center, area, state, user_id) 
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (name, group, cost_center, area, state, user_id)
            )
            
            conn.commit()
            cost_center_id = cursor.lastrowid
            
            return {
                "success": True, 
                "message": "Cost center added successfully",
                "cost_center_id": cost_center_id
            }
            
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": f"Failed to add cost center: {str(e)}"}
        finally:
            cursor.close()
    
    def update_cost_center(self, payload):
        """Update an existing cost center
        
        Args:
            payload (dict): Dictionary containing cost center data
                - id: Cost center ID
                - group: Group name
                - cost_center: Cost center code
                - area: Area name
                - state: State (optional)
        
        Returns:
            dict: Result of the operation
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            # Extract data from payload
            cost_center_id = payload.get('id')
            group = payload.get('group')
            cost_center = payload.get('cost_center')
            area = payload.get('area')
            state = payload.get('state', '')
            
            # Validate required fields
            if not all([cost_center_id, group, cost_center, area]):
                return {"success": False, "error": "ID, group, cost center, and area are required"}
            
            # Create the combined name field
            name = f"{group},{cost_center},{area}"
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Check if the cost center exists and belongs to the user
            cursor.execute(
                "SELECT id FROM cost_centers WHERE id = ? AND user_id = ?",
                (cost_center_id, user_id)
            )
            existing = cursor.fetchone()
            
            if not existing:
                return {"success": False, "error": "Cost center not found or you don't have permission to edit it"}
            
            # Update the cost center
            cursor.execute(
                """
                UPDATE cost_centers 
                SET name = ?, group_name = ?, cost_center = ?, area = ?, state = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ? AND user_id = ?
                """,
                (name, group, cost_center, area, state, cost_center_id, user_id)
            )
            
            conn.commit()
            
            return {"success": True, "message": "Cost center updated successfully"}
            
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": f"Failed to update cost center: {str(e)}"}
        finally:
            cursor.close()
    
    def delete_cost_center(self, cost_center_id):
        """Delete a cost center by ID
        
        Args:
            cost_center_id (int): ID of the cost center to delete
        
        Returns:
            dict: Result of the operation
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Check if the cost center exists and belongs to the user
            cursor.execute(
                "SELECT id FROM cost_centers WHERE id = ? AND user_id = ?",
                (cost_center_id, user_id)
            )
            existing = cursor.fetchone()
            
            if not existing:
                return {"success": False, "error": "Cost center not found or you don't have permission to delete it"}
            
            # Delete the cost center
            cursor.execute(
                "DELETE FROM cost_centers WHERE id = ? AND user_id = ?",
                (cost_center_id, user_id)
            )
            
            conn.commit()
            
            return {"success": True, "message": "Cost center deleted successfully"}
            
        except Exception as e:
            conn.rollback()
            return {"success": False, "error": f"Failed to delete cost center: {str(e)}"}
        finally:
            cursor.close()
    
    def get_cost_centers_list(self):
        """Get a list of all cost centers for the current user
        
        Returns:
            dict: Result of the operation with cost centers data
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Get all cost centers for the user
            cursor.execute(
                """
                SELECT id, group_name, cost_center, area, state
                FROM cost_centers
                WHERE user_id = ?
                ORDER BY group_name, area, cost_center
                """,
                (user_id,)
            )
            
            rows = cursor.fetchall()
            
            # Format the results
            cost_centers = []
            for row in rows:
                cost_centers.append({
                    "id": row[0],
                    "group": row[1],
                    "cost_center": row[2],
                    "area": row[3],
                    "state": row[4] if row[4] else ""
                })
            
            return {"success": True, "cost_centers": cost_centers}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get cost centers: {str(e)}"}
        finally:
            cursor.close()
    
    def get_cost_center_options(self):
        """Get lists of unique groups, cost centers, and areas for dropdown options
        
        Returns:
            dict: Result with lists of options
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            # Get unique groups
            cursor.execute(
                "SELECT DISTINCT group_name FROM cost_centers WHERE user_id = ? ORDER BY group_name",
                (user_id,)
            )
            groups = [row[0] for row in cursor.fetchall()]
            
            # Get unique cost centers
            cursor.execute(
                "SELECT DISTINCT cost_center FROM cost_centers WHERE user_id = ? ORDER BY cost_center",
                (user_id,)
            )
            cost_centers = [row[0] for row in cursor.fetchall()]
            
            # Get unique areas
            cursor.execute(
                "SELECT DISTINCT area FROM cost_centers WHERE user_id = ? ORDER BY area",
                (user_id,)
            )
            areas = [row[0] for row in cursor.fetchall()]
            
            return {
                "success": True,
                "groups": groups,
                "cost_centers": cost_centers,
                "areas": areas
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get cost center options: {str(e)}"}
        finally:
            cursor.close()
    
    def get_cost_center_by_id(self, cost_center_id):
        """Get a single cost center by ID
        
        Args:
            cost_center_id (int): ID of the cost center
        
        Returns:
            dict: Result with cost center data
        """
        try:
            # Check user authentication
            auth_status = self.auth_manager.check_auth_status()
            if not auth_status.get('success'):
                return {"success": False, "error": "User not authenticated"}
            
            user_id = auth_status.get('user_id')
            
            conn = self.db_manager.get_connection()
            cursor = conn.cursor()
            
            cursor.execute(
                """
                SELECT id, group_name, cost_center, area, state
                FROM cost_centers
                WHERE id = ? AND user_id = ?
                """,
                (cost_center_id, user_id)
            )
            
            row = cursor.fetchone()
            
            if not row:
                return {"success": False, "error": "Cost center not found"}
            
            cost_center = {
                "id": row[0],
                "group": row[1],
                "cost_center": row[2],
                "area": row[3],
                "state": row[4] if row[4] else ""
            }
            
            return {"success": True, "cost_center": cost_center}
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get cost center: {str(e)}"}
        finally:
            cursor.close()