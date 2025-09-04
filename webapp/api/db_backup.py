#!/usr/bin/env python3
"""
Database Backup and Migration Utility
Helps preserve data integrity across deployments
"""

import os
import json
import logging
from datetime import datetime
from .database_manager import DatabaseManager

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def export_users_to_json(db_manager):
    """Export all users to JSON format for backup"""
    try:
        conn, db_engine = db_manager.get_auth_connection()
        
        # Get all users
        users = db_manager.execute_query(conn, """
            SELECT user_id, username, email, password_hash, full_name, 
                   contact_number, user_role, parent_league_manager_id, 
                   is_active, created_at, last_login
            FROM users 
            ORDER BY user_id
        """, fetch='all')
        
        conn.close()
        
        # Create backup data structure
        backup_data = {
            'backup_timestamp': datetime.utcnow().isoformat(),
            'database_engine': db_engine,
            'user_count': len(users),
            'users': users
        }
        
        return backup_data
        
    except Exception as e:
        logger.error(f"Failed to export users: {e}")
        raise

def import_users_from_json(db_manager, backup_data):
    """Import users from JSON backup"""
    try:
        conn, db_engine = db_manager.get_auth_connection()
        
        # Ensure tables exist
        db_manager.create_auth_tables(conn)
        
        users = backup_data.get('users', [])
        imported_count = 0
        skipped_count = 0
        
        for user in users:
            try:
                # Check if user already exists
                existing = db_manager.execute_query(conn, 
                    "SELECT user_id FROM users WHERE email = ?", 
                    (user['email'],), fetch='one')
                
                if existing:
                    logger.info(f"Skipping existing user: {user['email']}")
                    skipped_count += 1
                    continue
                
                # Insert user
                db_manager.execute_query(conn, """
                    INSERT INTO users (username, email, password_hash, full_name, 
                                     contact_number, user_role, parent_league_manager_id, 
                                     is_active, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user['username'],
                    user['email'], 
                    user['password_hash'],
                    user['full_name'],
                    user['contact_number'],
                    user['user_role'],
                    user['parent_league_manager_id'],
                    user['is_active'],
                    user['created_at'],
                    user['last_login']
                ))
                
                imported_count += 1
                logger.info(f"Imported user: {user['email']}")
                
            except Exception as user_error:
                logger.error(f"Failed to import user {user.get('email', 'unknown')}: {user_error}")
        
        conn.commit()
        conn.close()
        
        logger.info(f"Import completed: {imported_count} imported, {skipped_count} skipped")
        return imported_count, skipped_count
        
    except Exception as e:
        logger.error(f"Failed to import users: {e}")
        raise

def create_database_backup():
    """Create a complete database backup"""
    try:
        # Determine data directory
        data_dir = os.environ.get('FIVETRACKR_DATA_DIR', '/app/data')
        
        # Initialize database manager
        db_manager = DatabaseManager(data_dir)
        logger.info(f"Creating database backup from {db_manager.db_engine}")
        
        # Export users
        backup_data = export_users_to_json(db_manager)
        
        # Save to backup file
        backup_filename = f"5ivetrackr_backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        backup_path = os.path.join(data_dir, backup_filename)
        
        with open(backup_path, 'w') as f:
            json.dump(backup_data, f, indent=2)
        
        logger.info(f"✅ Database backup created: {backup_path}")
        return backup_path
        
    except Exception as e:
        logger.error(f"❌ Database backup failed: {e}")
        raise

def restore_database_backup(backup_path):
    """Restore from a database backup"""
    try:
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup file not found: {backup_path}")
        
        # Load backup data
        with open(backup_path, 'r') as f:
            backup_data = json.load(f)
        
        # Determine data directory
        data_dir = os.environ.get('FIVETRACKR_DATA_DIR', '/app/data')
        
        # Initialize database manager
        db_manager = DatabaseManager(data_dir)
        logger.info(f"Restoring database backup to {db_manager.db_engine}")
        
        # Import users
        imported, skipped = import_users_from_json(db_manager, backup_data)
        
        logger.info(f"✅ Database restore completed: {imported} imported, {skipped} skipped")
        return imported, skipped
        
    except Exception as e:
        logger.error(f"❌ Database restore failed: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python db_backup.py backup")
        print("  python db_backup.py restore <backup_file>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "backup":
        backup_path = create_database_backup()
        print(f"Backup created: {backup_path}")
        
    elif command == "restore" and len(sys.argv) >= 3:
        backup_file = sys.argv[2]
        imported, skipped = restore_database_backup(backup_file)
        print(f"Restore completed: {imported} imported, {skipped} skipped")
        
    else:
        print("Invalid command")
        sys.exit(1)