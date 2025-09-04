"""
5ive Trackr Database Manager
Handles both SQLite (development) and PostgreSQL (production) databases
© 2025 5ive Trackr. All rights reserved.
"""

import os
import sqlite3
import logging
from typing import Optional, Any, Dict, List, Tuple
from urllib.parse import urlparse

# Try to import PostgreSQL adapter
try:
    import psycopg2
    import psycopg2.extras
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

logger = logging.getLogger(__name__)

class DatabaseManager:
    """
    Database abstraction layer supporting SQLite and PostgreSQL
    """
    
    def __init__(self, data_dir: str):
        self.data_dir = data_dir
        self.db_engine = os.environ.get('DB_ENGINE', 'sqlite').lower()
        self.database_url = os.environ.get('DATABASE_URL')
        
        # Debug environment variables
        logger.info(f"🔍 DatabaseManager Environment Check:")
        logger.info(f"   DB_ENGINE: {os.environ.get('DB_ENGINE', 'NOT SET')} -> using: {self.db_engine}")
        logger.info(f"   DATABASE_URL: {'SET' if self.database_url else 'NOT SET'}")
        logger.info(f"   HAS_POSTGRES: {HAS_POSTGRES}")
        
        if self.db_engine == 'postgresql' and not HAS_POSTGRES:
            logger.error("PostgreSQL requested but psycopg2 not available. Falling back to SQLite.")
            self.db_engine = 'sqlite'
        
        logger.info(f"🗄️  Database engine: {self.db_engine}")
        
        if self.db_engine == 'postgresql' and self.database_url:
            self._setup_postgresql()
        else:
            self._setup_sqlite()
    
    def _setup_sqlite(self):
        """Setup SQLite database paths"""
        self.auth_db_path = os.path.join(self.data_dir, '5ive_trackr_central_auth.db')
        os.makedirs(self.data_dir, exist_ok=True)
    
    def _setup_postgresql(self):
        """Setup PostgreSQL connection parameters"""
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable required for PostgreSQL")
        
        parsed = urlparse(self.database_url)
        self.pg_config = {
            'host': parsed.hostname,
            'port': parsed.port or 5432,
            'database': parsed.path.lstrip('/'),
            'user': parsed.username,
            'password': parsed.password,
        }
        logger.info(f"PostgreSQL config: {self.pg_config['host']}:{self.pg_config['port']}/{self.pg_config['database']}")
    
    def get_auth_connection(self):
        """Get connection to central auth database"""
        if self.db_engine == 'postgresql':
            conn = psycopg2.connect(**self.pg_config)
            conn.autocommit = False
            return conn, 'postgresql'
        else:
            conn = sqlite3.connect(self.auth_db_path)
            conn.row_factory = sqlite3.Row
            return conn, 'sqlite'
    
    def get_tenant_connection(self, tenant_id: str):
        """Get connection to tenant-specific database"""
        if self.db_engine == 'postgresql':
            # For PostgreSQL, use schema-based multi-tenancy
            conn = psycopg2.connect(**self.pg_config)
            conn.autocommit = False
            # Set search path to tenant schema
            with conn.cursor() as cur:
                cur.execute(f"SET search_path TO tenant_{tenant_id}, public")
            return conn, 'postgresql'
        else:
            # For SQLite, use separate database files
            tenant_db_path = os.path.join(self.data_dir, f'5ive_trackr_tenant_{tenant_id}.db')
            conn = sqlite3.connect(tenant_db_path)
            conn.row_factory = sqlite3.Row
            return conn, 'sqlite'
    
    def execute_query(self, connection, query: str, params: tuple = None, fetch: str = None):
        """
        Execute query with database-specific handling
        
        Args:
            connection: Database connection
            query: SQL query (may contain placeholders)
            params: Query parameters
            fetch: 'one', 'all', or None
        """
        if self.db_engine == 'postgresql':
            # Convert SQLite ? placeholders to PostgreSQL %s placeholders
            pg_query = query.replace('?', '%s')
            
            with connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(pg_query, params or ())
                
                if fetch == 'one':
                    result = cur.fetchone()
                    return dict(result) if result else None
                elif fetch == 'all':
                    return [dict(row) for row in cur.fetchall()]
                else:
                    return cur.rowcount
        else:
            # SQLite
            cur = connection.cursor()
            cur.execute(query, params or ())
            
            if fetch == 'one':
                result = cur.fetchone()
                return dict(result) if result else None
            elif fetch == 'all':
                return [dict(row) for row in cur.fetchall()]
            else:
                return cur.rowcount
    
    def migrate_schema_if_needed(self, conn) -> None:
        """Migrate existing schema to support new tier-based system"""
        try:
            # Check if we need to migrate from old schema
            if self.db_engine == 'postgresql':
                # Check if subscriptions table exists first
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'subscriptions'
                    )
                """)
                table_exists = cursor.fetchone()[0]
                
                if table_exists:
                    # Check if tier_id column exists
                    cursor.execute("""
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name = 'subscriptions' AND column_name = 'tier_id'
                    """)
                    has_tier_id = cursor.fetchone()
                    
                    if not has_tier_id:
                        logger.info("🔄 Migrating existing subscriptions table to tier-based schema...")
                        # Add new tier columns if they don't exist
                        migrate_queries = [
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS tier_id VARCHAR(20) DEFAULT 'starter'",
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS pitches_limit INTEGER DEFAULT 1",
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS referees_limit INTEGER DEFAULT 10",
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS divisions_limit INTEGER DEFAULT 1",
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS leagues_per_division_limit INTEGER DEFAULT 1",
                            "ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS teams_limit INTEGER DEFAULT 10"
                        ]
                        
                        for query in migrate_queries:
                            cursor.execute(query)
                        
                        conn.commit()
                        logger.info("✅ Schema migration completed")
                        
                    # Also check and migrate venues table for subscription fields
                    cursor.execute("""
                        SELECT column_name FROM information_schema.columns 
                        WHERE table_name = 'venues' AND column_name = 'subscription_plan'
                    """)
                    has_subscription_fields = cursor.fetchone()
                    
                    if not has_subscription_fields:
                        logger.info("🔄 Adding subscription fields to venues table...")
                        venue_migrate_queries = [
                            "ALTER TABLE venues ADD COLUMN IF NOT EXISTS package_id VARCHAR(50)",
                            "ALTER TABLE venues ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'Starter'",
                            "ALTER TABLE venues ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) DEFAULT 'starter'"
                        ]
                        
                        for query in venue_migrate_queries:
                            cursor.execute(query)
                        
                        # Update existing venues with default subscription info
                        cursor.execute("""
                            UPDATE venues 
                            SET subscription_plan = 'Starter', subscription_tier = 'starter'
                            WHERE subscription_plan IS NULL
                        """)
                        
                        conn.commit()
                        logger.info("✅ Venues table migration completed")
                else:
                    logger.info("ℹ️  New database - subscriptions table will be created with tier schema")
                    
                cursor.close()
            else:
                # For SQLite, check if migration is needed
                cursor = conn.cursor()
                try:
                    cursor.execute("PRAGMA table_info(subscriptions)")
                    columns = {row[1] for row in cursor.fetchall()}
                    
                    if 'tier_id' not in columns and columns:  # Table exists but needs migration
                        logger.info("🔄 SQLite table has old schema - will be recreated")
                        # Drop old table to recreate with new schema
                        cursor.execute("DROP TABLE IF EXISTS subscription_addons")
                        cursor.execute("DROP TABLE IF EXISTS subscriptions")
                        conn.commit()
                        logger.info("✅ Old schema removed, new schema will be created")
                        
                    # Also check venues table for SQLite
                    try:
                        cursor.execute("PRAGMA table_info(venues)")
                        venue_columns = {row[1] for row in cursor.fetchall()}
                        
                        if 'subscription_plan' not in venue_columns and venue_columns:
                            logger.info("🔄 Adding subscription fields to venues table (SQLite)...")
                            cursor.execute("ALTER TABLE venues ADD COLUMN package_id VARCHAR(50)")
                            cursor.execute("ALTER TABLE venues ADD COLUMN subscription_plan VARCHAR(50) DEFAULT 'Starter'")
                            cursor.execute("ALTER TABLE venues ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'starter'")
                            
                            # Update existing venues
                            cursor.execute("""
                                UPDATE venues 
                                SET subscription_plan = 'Starter', subscription_tier = 'starter'
                                WHERE subscription_plan IS NULL
                            """)
                            
                            conn.commit()
                            logger.info("✅ Venues table migration completed (SQLite)")
                    except Exception as e:
                        logger.info(f"Venues table migration skipped: {e}")
                        
                except Exception:
                    # Table doesn't exist yet, that's fine
                    pass
                finally:
                    cursor.close()
                
        except Exception as e:
            logger.error(f"Schema migration error: {e}")
    
    def create_auth_tables(self, connection):
        """Create central auth database tables"""
        if self.db_engine == 'postgresql':
            # PostgreSQL table creation
            queries = [
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    contact_number VARCHAR(20),
                    user_role VARCHAR(50) CHECK(user_role IN ('admin', 'league_manager', 'tenant_manager', 'assistant_manager', 'referee', 'user', 'team_manager', 'venue_manager', 'team_captain')) NOT NULL,
                    parent_league_manager_id INTEGER REFERENCES users(user_id),
                    is_active BOOLEAN DEFAULT TRUE,
                    email_verified BOOLEAN DEFAULT FALSE,
                    verification_token VARCHAR(255),
                    verification_token_expires TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                "CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role)",
                "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",
                """
                CREATE TABLE IF NOT EXISTS subscriptions (
                    subscription_id SERIAL PRIMARY KEY,
                    tenant_id INTEGER REFERENCES users(user_id),
                    tier_id VARCHAR(20) CHECK(tier_id IN ('starter', 'growth', 'pro')) DEFAULT 'starter',
                    plan_name VARCHAR(100) NOT NULL,
                    base_price DECIMAL(10, 2) DEFAULT 0.00,
                    
                    -- Base tier limits
                    pitches_limit INTEGER DEFAULT 1,
                    referees_limit INTEGER DEFAULT 10,
                    divisions_limit INTEGER DEFAULT 1,
                    leagues_per_division_limit INTEGER DEFAULT 1,
                    teams_limit INTEGER DEFAULT 10,
                    
                    -- Legacy fields for compatibility
                    user_limit INTEGER DEFAULT 10,
                    venue_limit INTEGER DEFAULT 1,
                    pitch_per_venue_limit INTEGER DEFAULT 5,
                    storage_limit_gb INTEGER DEFAULT 10,
                    
                    status VARCHAR(20) CHECK(status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
                    billing_cycle VARCHAR(20) CHECK(billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
                    next_billing_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS subscription_addons (
                    addon_id SERIAL PRIMARY KEY,
                    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
                    addon_type VARCHAR(50) CHECK(addon_type IN ('extra_pitch', 'extra_referee', 'extra_division', 'extra_lpd')),
                    quantity INTEGER DEFAULT 1,
                    price_per_unit DECIMAL(10, 2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS venues (
                    venue_id SERIAL PRIMARY KEY,
                    tenant_id INTEGER REFERENCES users(user_id),
                    venue_name VARCHAR(100) NOT NULL,
                    address TEXT,
                    pitch_count INTEGER DEFAULT 0,
                    max_pitches INTEGER DEFAULT 5,
                    is_active BOOLEAN DEFAULT TRUE,
                    package_id VARCHAR(50),
                    subscription_plan VARCHAR(50) DEFAULT 'Starter',
                    subscription_tier VARCHAR(20) DEFAULT 'starter',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS pitches (
                    pitch_id SERIAL PRIMARY KEY,
                    venue_id INTEGER REFERENCES venues(venue_id) ON DELETE CASCADE,
                    tenant_id INTEGER REFERENCES users(user_id),
                    pitch_name VARCHAR(100) NOT NULL,
                    pitch_size VARCHAR(50) DEFAULT '11v11',
                    status VARCHAR(20) DEFAULT 'available',
                    is_active BOOLEAN DEFAULT TRUE,
                    availability JSONB,
                    kick_off_times JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_venues_tenant ON venues(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_pitches_venue ON pitches(venue_id)",
                "CREATE INDEX IF NOT EXISTS idx_pitches_tenant ON pitches(tenant_id)"
            ]
        else:
            # SQLite table creation
            queries = [
                """
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    full_name VARCHAR(100) NOT NULL,
                    contact_number VARCHAR(20),
                    user_role TEXT CHECK(user_role IN ('admin', 'league_manager', 'tenant_manager', 'assistant_manager', 'referee', 'user', 'team_manager', 'venue_manager', 'team_captain')) NOT NULL,
                    parent_league_manager_id INTEGER REFERENCES users(user_id),
                    is_active BOOLEAN DEFAULT TRUE,
                    email_verified BOOLEAN DEFAULT FALSE,
                    verification_token VARCHAR(255),
                    verification_token_expires TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                "CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role)", 
                "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",
                """
                CREATE TABLE IF NOT EXISTS subscriptions (
                    subscription_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tenant_id INTEGER REFERENCES users(user_id),
                    tier_id VARCHAR(20) CHECK(tier_id IN ('starter', 'growth', 'pro')) DEFAULT 'starter',
                    plan_name VARCHAR(100) NOT NULL,
                    base_price DECIMAL(10, 2) DEFAULT 0.00,
                    
                    -- Base tier limits
                    pitches_limit INTEGER DEFAULT 1,
                    referees_limit INTEGER DEFAULT 10,
                    divisions_limit INTEGER DEFAULT 1,
                    leagues_per_division_limit INTEGER DEFAULT 1,
                    teams_limit INTEGER DEFAULT 10,
                    
                    -- Legacy fields for compatibility
                    user_limit INTEGER DEFAULT 10,
                    venue_limit INTEGER DEFAULT 1,
                    pitch_per_venue_limit INTEGER DEFAULT 5,
                    storage_limit_gb INTEGER DEFAULT 10,
                    
                    status VARCHAR(20) CHECK(status IN ('active', 'suspended', 'cancelled')) DEFAULT 'active',
                    billing_cycle VARCHAR(20) CHECK(billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
                    next_billing_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS subscription_addons (
                    addon_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    subscription_id INTEGER REFERENCES subscriptions(subscription_id),
                    addon_type VARCHAR(50) CHECK(addon_type IN ('extra_pitch', 'extra_referee', 'extra_division', 'extra_lpd')),
                    quantity INTEGER DEFAULT 1,
                    price_per_unit DECIMAL(10, 2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS venues (
                    venue_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tenant_id INTEGER REFERENCES users(user_id),
                    venue_name VARCHAR(100) NOT NULL,
                    address TEXT,
                    pitch_count INTEGER DEFAULT 0,
                    max_pitches INTEGER DEFAULT 5,
                    is_active BOOLEAN DEFAULT TRUE,
                    package_id VARCHAR(50),
                    subscription_plan VARCHAR(50) DEFAULT 'Starter',
                    subscription_tier VARCHAR(20) DEFAULT 'starter',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                """
                CREATE TABLE IF NOT EXISTS pitches (
                    pitch_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    venue_id INTEGER REFERENCES venues(venue_id) ON DELETE CASCADE,
                    tenant_id INTEGER REFERENCES users(user_id),
                    pitch_name VARCHAR(100) NOT NULL,
                    pitch_size VARCHAR(50) DEFAULT '11v11',
                    status VARCHAR(20) DEFAULT 'available',
                    is_active BOOLEAN DEFAULT 1,
                    availability TEXT,
                    kick_off_times TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """,
                "CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant ON subscriptions(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_venues_tenant ON venues(tenant_id)",
                "CREATE INDEX IF NOT EXISTS idx_pitches_venue ON pitches(venue_id)",
                "CREATE INDEX IF NOT EXISTS idx_pitches_tenant ON pitches(tenant_id)"
            ]
        
        for query in queries:
            self.execute_query(connection, query)
        
        connection.commit()
        logger.info("Central auth database tables created/verified")
    
    def create_tenant_schema(self, tenant_id: str):
        """Create tenant-specific schema/database"""
        if self.db_engine == 'postgresql':
            # Create schema for tenant
            conn, _ = self.get_auth_connection()
            try:
                with conn.cursor() as cur:
                    cur.execute(f"CREATE SCHEMA IF NOT EXISTS tenant_{tenant_id}")
                conn.commit()
                logger.info(f"Created PostgreSQL schema for tenant {tenant_id}")
            finally:
                conn.close()
        else:
            # Create SQLite database file
            tenant_db_path = os.path.join(self.data_dir, f'5ive_trackr_tenant_{tenant_id}.db')
            conn = sqlite3.connect(tenant_db_path)
            conn.close()
            logger.info(f"Created SQLite database for tenant {tenant_id}")
    
    def get_database_info(self) -> Dict[str, Any]:
        """Get database configuration info for debugging"""
        return {
            'engine': self.db_engine,
            'has_postgres': HAS_POSTGRES,
            'database_url_set': bool(self.database_url),
            'data_dir': self.data_dir,
        }