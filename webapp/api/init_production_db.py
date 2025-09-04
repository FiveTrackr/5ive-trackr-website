#!/usr/bin/env python3
"""
Production Database Initializer
Creates the admin user in production so it persists across deployments
"""

import os
import hashlib
import logging
from datetime import datetime
from .database_manager import DatabaseManager

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def initialize_production_database():
    """Initialize database with essential admin user"""
    
    # Determine data directory
    data_dir = os.environ.get('FIVETRACKR_DATA_DIR', '/app/data')
    
    # Print environment variables for debugging
    logger.info(f"🔍 Environment variables:")
    logger.info(f"   FIVETRACKR_DATA_DIR: {os.environ.get('FIVETRACKR_DATA_DIR', 'NOT SET')}")
    logger.info(f"   DATABASE_URL: {'SET' if os.environ.get('DATABASE_URL') else 'NOT SET'}")
    logger.info(f"   DB_ENGINE: {os.environ.get('DB_ENGINE', 'NOT SET')}")
    logger.info(f"   DEBUG_MODE: {os.environ.get('DEBUG_MODE', 'NOT SET')}")
    logger.info(f"   FIVETRACKR_SECRET_KEY: {'SET' if os.environ.get('FIVETRACKR_SECRET_KEY') else 'NOT SET'}")
    
    # Print ALL environment variables to see what DigitalOcean is providing
    logger.info("🔍 ALL Environment Variables:")
    db_related_vars = []
    for key, value in sorted(os.environ.items()):
        if 'PG' in key or 'DB' in key or 'DATABASE' in key or 'FIVETRACKR' in key:
            db_related_vars.append(f"   {key}: {'***REDACTED***' if 'PASSWORD' in key or 'SECRET' in key else value}")
    
    if db_related_vars:
        for var in db_related_vars:
            logger.info(var)
    else:
        logger.warning("   ❌ NO database-related environment variables found!")
        
    # Also show some key system variables for debugging
    logger.info("🔍 System Environment Variables:")
    system_vars = ['PORT', 'PATH', 'HOME', 'USER', 'HOSTNAME']
    for var in system_vars:
        if var in os.environ:
            logger.info(f"   {var}: {os.environ[var]}")
    
    # Check if we're on DigitalOcean by looking for specific env vars
    if os.environ.get('PORT') == '8080' and not os.environ.get('DATABASE_URL'):
        logger.warning("🚨 Detected DigitalOcean deployment but DATABASE_URL not set!")
        logger.info("📋 This suggests the database service may not be properly linked")
    
    os.makedirs(data_dir, exist_ok=True)
    
    logger.info(f"📁 Initializing production database in: {data_dir}")
    
    # Initialize database manager
    db_manager = DatabaseManager(data_dir)
    logger.info(f"🗄️  Database engine: {db_manager.db_engine}")
    
    if db_manager.db_engine == 'postgresql':
        logger.info(f"🐘 PostgreSQL connection configured")
        logger.info(f"   Host: {db_manager.pg_config['host']}:{db_manager.pg_config['port']}")
        logger.info(f"   Database: {db_manager.pg_config['database']}")
    else:
        logger.info(f"💽 SQLite database path: {db_manager.auth_db_path}")
    
    # Get connection through database manager
    try:
        conn, db_engine = db_manager.get_auth_connection()
        logger.info(f"✅ Database connection established successfully")
    except Exception as conn_error:
        logger.error(f"❌ Failed to connect to database: {conn_error}")
        raise
    
    try:
        # Set autocommit for PostgreSQL to avoid transaction issues during schema creation
        if db_engine == 'postgresql':
            conn.autocommit = True
        # Test the connection
        if db_engine == 'postgresql':
            test_result = db_manager.execute_query(conn, "SELECT version()", fetch='one')
            logger.info(f"🐘 PostgreSQL version: {test_result}")
        else:
            test_result = db_manager.execute_query(conn, "SELECT sqlite_version()", fetch='one')
            logger.info(f"💽 SQLite version: {test_result}")
        
        # Create auth tables using database manager with migration
        logger.info("🏗️  Creating database tables...")
        db_manager.migrate_schema_if_needed(conn)
        db_manager.create_auth_tables(conn)
        logger.info("✅ Database tables created successfully")
        
        # Check if admin user exists and force recreation for PostgreSQL fresh setup
        try:
            admin_exists = db_manager.execute_query(conn, 
                "SELECT COUNT(*) as count FROM users WHERE email = ?", 
                ('admin@5ivetrackr.com',), fetch='one')
            
            admin_count = admin_exists['count'] if admin_exists else 0
            logger.info(f"🔍 Found {admin_count} admin users in database")
            
            if admin_count == 0:
                # Create admin user
                logger.info("🔧 Creating default admin user...")
                admin_password_hash = hash_password('admin123')
                logger.info(f"🔐 Admin password hash: {admin_password_hash}")
                
                db_manager.execute_query(conn, """
                    INSERT INTO users (username, email, password_hash, full_name, contact_number, 
                                     user_role, parent_league_manager_id, is_active, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    'admin@5ivetrackr.com',
                    'admin@5ivetrackr.com', 
                    admin_password_hash,
                    'System Administrator',
                    '',
                    'league_manager',  # Super-admin uses league_manager role
                    None,
                    True,
                    datetime.now().isoformat(),
                    None
                ))
                logger.info("✅ Created default admin user (admin@5ivetrackr.com / admin123)")
            else:
                # Verify existing admin user
                admin_user = db_manager.execute_query(conn,
                    "SELECT email, user_role, is_active, password_hash FROM users WHERE email = ?",
                    ('admin@5ivetrackr.com',), fetch='one')
                if admin_user:
                    logger.info(f"ℹ️  Admin user exists: role={admin_user.get('user_role')}, active={admin_user.get('is_active')}")
                    logger.info(f"🔐 Stored password hash: {admin_user.get('password_hash')}")
                    
                    # Verify password hash matches expected
                    expected_hash = hash_password('admin123')
                    if admin_user.get('password_hash') != expected_hash:
                        logger.warning("⚠️  Admin password hash mismatch - updating password")
                        db_manager.execute_query(conn,
                            "UPDATE users SET password_hash = ? WHERE email = ?",
                            (expected_hash, 'admin@5ivetrackr.com'))
                        logger.info("✅ Admin password updated")
                else:
                    logger.warning("⚠️  Admin user count > 0 but user not found - database inconsistency")
                    
        except Exception as admin_error:
            logger.error(f"❌ Admin user creation/verification failed: {admin_error}")
            # Try to continue anyway
            pass
        
        # Commit changes (only needed for SQLite since PostgreSQL uses autocommit)
        if db_engine != 'postgresql':
            conn.commit()
        
        # Count total users
        user_count_result = db_manager.execute_query(conn, 
            "SELECT COUNT(*) as count FROM users WHERE is_active = TRUE", 
            fetch='one')
        user_count = user_count_result['count']
        logger.info(f"📊 Total active users in database: {user_count}")
        
    finally:
        conn.close()

if __name__ == "__main__":
    initialize_production_database()
    logger.info("🎉 Production database initialization complete!")