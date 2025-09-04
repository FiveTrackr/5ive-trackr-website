#!/usr/bin/env python3
"""
5ive Trackr API Server
Compliant with .github specifications for authentication, database schema, and REST API
"""

import json
import os
import sqlite3
import hashlib
import secrets
import jwt
import time
import urllib.parse
from datetime import datetime, timedelta
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import threading
import logging
import stripe

# Load environment variables from .env file if it exists
# Only load if the environment variable is not already set (don't override)
from pathlib import Path
env_file = Path(__file__).parent.parent.parent / '.env'
if env_file.exists():
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                key = key.strip()
                # Only set if not already in environment
                if key not in os.environ:
                    os.environ[key] = value.strip()
    print(f"Loaded environment variables from {env_file} (not overriding existing values)")

# Import database manager
try:
    from .database_manager import DatabaseManager
except ImportError:
    from database_manager import DatabaseManager

# Configuration
# Use stable secret key from environment in production; fallback only for local/dev
SECRET_KEY = os.environ.get('FIVETRACKR_SECRET_KEY') or secrets.token_hex(32)
TOKEN_EXPIRY_HOURS = 24
REFRESH_TOKEN_EXPIRY_DAYS = 30

# Stripe Configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_placeholder')
STRIPE_PUBLISHABLE_KEY = os.environ.get('STRIPE_PUBLISHABLE_KEY', 'pk_test_placeholder')
STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET', 'whsec_placeholder')

# Stripe Price IDs - Update these with your actual Stripe Price IDs after creating products
STRIPE_PRICE_IDS = {
    # Base subscription plans
    'starter_monthly': os.environ.get('STRIPE_PRICE_STARTER', 'price_placeholder_starter'),
    'growth_monthly': os.environ.get('STRIPE_PRICE_GROWTH', 'price_placeholder_growth'),
    'pro_monthly': os.environ.get('STRIPE_PRICE_PRO', 'price_placeholder_pro'),
    # Add-ons
    'extra_pitches': os.environ.get('STRIPE_PRICE_EXTRA_PITCHES', 'price_placeholder_pitches'),
    'extra_referees': os.environ.get('STRIPE_PRICE_EXTRA_REFEREES', 'price_placeholder_referees'),
    'extra_divisions': os.environ.get('STRIPE_PRICE_EXTRA_DIVISIONS', 'price_placeholder_divisions'),
    'extra_leagues': os.environ.get('STRIPE_PRICE_EXTRA_LEAGUES', 'price_placeholder_leagues')
}

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FiveTrackrAPIHandler(BaseHTTPRequestHandler):
    """
    5ive Trackr API Handler - Implements complete REST API specification
    Adheres to authentication system, database schema, and platform communication requirements
    """
    
    def serialize_datetime(self, obj):
        """Convert datetime objects to ISO string for JSON serialization"""
        if obj is None:
            return None
        if hasattr(obj, 'isoformat'):
            return obj.isoformat()
        return str(obj)
    
    # Tier-based pricing configuration
    TIER_CONFIG = {
        'starter': {
            'name': 'Starter', 'price': 49.99,
            'limits': {'pitches': 1, 'referees': 10, 'divisions': 1, 'leaguesPerDivision': 1, 'teams': 15}
        },
        'growth': {
            'name': 'Growth', 'price': 99.99,
            'limits': {'pitches': 3, 'referees': 25, 'divisions': 5, 'leaguesPerDivision': 3, 'teams': 150}
        },
        'pro': {
            'name': 'Pro', 'price': 179.99,
            'limits': {'pitches': 8, 'referees': 50, 'divisions': 10, 'leaguesPerDivision': 5, 'teams': 500}
        }
    }
    
    # Add-on pricing matrix (GBP per month)
    ADDON_PRICING = {
        'extra_pitch': {'starter': 20, 'growth': 25},  # Pro routes to sales
        'extra_referee': {'starter': 2, 'growth': 3},  # Pro routes to sales
        'extra_division': {'starter': 12, 'growth': 15},  # Pro routes to sales  
        'extra_lpd': {'starter': 8, 'growth': 8}  # Flat rate for starter/growth
    }
    
    # Anti-gaming threshold (80%)
    UPGRADE_THRESHOLD = 0.80
    
    def __init__(self, *args, **kwargs):
        # Resolve data directory with fallback for different deployment environments
        env_data_dir = os.environ.get('FIVETRACKR_DATA_DIR')
        
        if env_data_dir:
            # Environment override (production)
            self.data_dir = env_data_dir
        else:
            # Auto-detect deployment environment
            current_dir = os.path.dirname(__file__)  # /webapp/api/
            
            # Check if we're in development (build-development structure)
            potential_build_root = os.path.dirname(os.path.dirname(current_dir))
            if os.path.basename(potential_build_root) == 'build-development':
                # Development: use centralized data directory
                self.data_dir = os.path.join(os.path.dirname(potential_build_root), 'build-development', 'data')
            else:
                # Production: use data directory in deployment root
                deployment_root = potential_build_root
                self.data_dir = os.path.join(deployment_root, 'data')
        
        # Initialize database manager (handles directory creation)
        self.db_manager = DatabaseManager(self.data_dir)
        
        # Set webapp directory for static file serving
        current_dir = os.path.dirname(__file__)  # /webapp/api/
        self.webapp_dir = os.path.dirname(current_dir)  # /webapp/
        
        logger.info(f"📁 Data directory initialized: {self.data_dir}")
        logger.info(f"🗄️  Database info: {self.db_manager.get_database_info()}")
        logger.info(f"🌐 Webapp directory initialized: {self.webapp_dir}")
        super().__init__(*args, **kwargs)
    
    def parse_query_params(self):
        """Parse query parameters from URL"""
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(self.path)
        return parse_qs(parsed_url.query)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_path = urlparse(self.path)
            
            # API endpoints
            if parsed_path.path.startswith('/api/'):
                self.handle_api_get(parsed_path)
            else:
                # Serve static webapp files
                self.serve_static_file(parsed_path.path)
                
        except Exception as e:
            logger.error(f"GET request error: {e}")
            self.send_error_response(500, 'Internal server error')
    
    def do_POST(self):
        """Handle POST requests"""
        try:
            parsed_path = urlparse(self.path)
            
            if parsed_path.path.startswith('/api/'):
                self.handle_api_post(parsed_path)
            else:
                self.send_error_response(404, 'Not found')
                
        except Exception as e:
            logger.error(f"POST request error: {e}")
            self.send_error_response(500, 'Internal server error')
    
    def do_PUT(self):
        """Handle PUT requests"""
        try:
            parsed_path = urlparse(self.path)
            
            if parsed_path.path.startswith('/api/'):
                self.handle_api_put(parsed_path)
            else:
                self.send_error_response(404, 'Not found')
                
        except Exception as e:
            logger.error(f"PUT request error: {e}")
            self.send_error_response(500, 'Internal server error')
    
    def do_DELETE(self):
        """Handle DELETE requests"""
        try:
            parsed_path = urlparse(self.path)
            logger.info(f"DELETE request received: {self.path}")
            
            if parsed_path.path.startswith('/api/'):
                self.handle_api_delete(parsed_path)
            else:
                logger.error(f"Non-API DELETE request: {parsed_path.path}")
                self.send_error_response(404, 'Not found')
                
        except Exception as e:
            import traceback
            logger.error(f"DELETE request error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.send_error_response(500, 'Internal server error')
    
    def handle_api_get(self, parsed_path):
        """Handle API GET requests"""
        path = parsed_path.path
        
        if path == '/api/health':
            self.handle_health_check()
        elif path == '/api/auth/check-session':
            self.handle_check_session()
        elif path == '/api/auth/check-verification-status':
            self.handle_check_verification_status()
        elif path == '/api/auth/verify-email':
            self.handle_verify_email()
        elif path == '/api/auth/get-user-from-session':
            self.handle_get_user_from_session()
        elif path == '/api/auth/subscription-info':
            self.handle_subscription_info()
        elif path == '/api/auth/active-session':
            self.handle_active_session()
        elif path == '/api/users/profile':
            self.handle_get_profile()
        elif path == '/api/auth/current-user':
            self.handle_get_current_user()
        elif path == '/api/data/users':
            self.handle_get_users()
        elif path == '/api/admin/users':
            self.handle_admin_get_users()
        elif path == '/api/admin/tenants':
            self.handle_admin_get_tenants()
        elif path.startswith('/api/admin/tenant-venues/'):
            tenant_id = path.split('/')[-1]
            self.handle_admin_get_tenant_venues(tenant_id)
        elif path == '/api/admin/pricing-test':
            self.handle_pricing_test()
        elif path == '/api/teams':
            self.handle_get_teams()
        elif path == '/api/fixtures':
            self.handle_get_fixtures()
        elif path == '/api/referees':
            self.handle_get_referees()
        elif path == '/api/venues/available-packages':
            self.handle_get_available_packages()
        elif path == '/api/venues':
            self.handle_get_venues()
        elif path == '/api/pitches':
            self.handle_get_pitches()
        elif path == '/api/subscriptions/config':
            self.handle_get_stripe_config()
        elif path == '/api/signup/stripe-config':
            self.handle_get_stripe_config_public()
        elif path == '/api/signup/check-status':
            self.handle_check_signup_status()
        elif path == '/api/signup/simulate-webhook':
            self.handle_simulate_webhook()
        else:
            self.send_error_response(404, 'API endpoint not found')
    
    def handle_api_post(self, parsed_path):
        """Handle API POST requests"""
        path = parsed_path.path
        
        if path == '/api/auth/login':
            self.handle_login()
        elif path == '/api/auth/logout':
            self.handle_logout()
        elif path == '/api/auth/send-verification-email':
            self.handle_send_verification_email()
        elif path == '/api/auth/verify-email':
            self.handle_verify_email()
        elif path == '/api/auth/assign-package':
            self.handle_assign_package()
        elif path == '/api/auth/active-session':
            self.handle_active_session()
        elif path == '/api/auth/refresh':
            self.handle_refresh_token()
        elif path == '/api/auth/verify-password':
            self.handle_verify_password()
        elif path == '/api/data/users':
            self.handle_admin_create_user()
        elif path == '/api/admin/tenants':
            self.handle_admin_create_tenant()
        elif path == '/api/admin/pricing-test':
            self.handle_pricing_test()
        elif path == '/api/teams':
            self.handle_create_team()
        elif path == '/api/fixtures':
            self.handle_create_fixture()
        elif path == '/api/venues':
            self.handle_create_venue()
        elif path == '/api/pitches':
            self.handle_create_pitch()
        elif path == '/api/subscriptions/create-checkout-session':
            self.handle_create_checkout_session()
        elif path == '/api/subscriptions/modify-subscription':
            self.handle_modify_subscription()
        elif path == '/api/signup/create-tenant':
            self.handle_signup_create_tenant()
        elif path == '/api/webhooks/stripe':
            self.handle_stripe_webhook()
        else:
            self.send_error_response(404, 'API endpoint not found')
    
    def handle_api_put(self, parsed_path):
        """Handle API PUT requests"""
        path = parsed_path.path
        
        if path == '/api/data/users':
            self.handle_admin_update_user()
        elif path.startswith('/api/pitches/'):
            self.handle_update_pitch(parsed_path)
        else:
            self.send_error_response(404, 'API endpoint not found')
    
    def handle_api_delete(self, parsed_path):
        """Handle API DELETE requests"""
        path = parsed_path.path
        logger.info(f"DELETE request received for path: {path}")
        
        if path == '/api/data/users':
            self.handle_admin_delete_user()
        elif path.startswith('/api/admin/tenants/'):
            logger.info(f"Routing to tenant deletion handler for path: {path}")
            self.handle_admin_delete_tenant(parsed_path)
        elif path.startswith('/api/pitches/'):
            self.handle_delete_pitch(parsed_path)
        elif path.startswith('/api/venues/') and 'delete-with-recycle' in path:
            logger.info(f"🗑️  ROUTING to handle_delete_venue_with_recycle for path: {path}")
            self.handle_delete_venue_with_recycle(parsed_path)
        else:
            logger.error(f"No matching DELETE route for path: {path}")
            self.send_error_response(404, 'API endpoint not found')
    
    def handle_login(self):
        """
        POST /api/auth/login
        Implements JWT-based authentication as per AUTHENTICATION-SYSTEM-STAGE1.md
        """
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            email = data.get('email')
            password = data.get('password')  # Already hashed client-side
            
            if not email or not password:
                self.send_error_response(400, 'Email and password required')
                return
            
            # Authenticate user
            user = self.authenticate_user(email, password)
            if not user:
                self.send_error_response(401, 'Invalid credentials')
                return
            
            # Check if email is verified
            if not user.get('email_verified'):
                self.send_json_response({
                    'error': 'email_not_verified',
                    'message': 'Please verify your email address before logging in',
                    'user_id': user['user_id'],
                    'email': user['email']
                }, status_code=403)
                return
            
            # Generate JWT tokens
            access_token = self.generate_access_token(user)
            refresh_token = self.generate_refresh_token(user)
            
            # Store refresh token
            self.store_refresh_token(user['user_id'], refresh_token)
            
            response_data = {
                'success': True,
                'token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'user_role': user['user_role'],
                    'parent_league_manager_id': user['parent_league_manager_id']
                },
                'expires_in': TOKEN_EXPIRY_HOURS * 3600
            }
            
            self.send_json_response(200, response_data)
            logger.info(f"User logged in: {email}")
            
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON')
        except Exception as e:
            logger.error(f"Login error: {e}")
            self.send_error_response(500, 'Login failed')
    
    def handle_health_check(self):
        """
        GET /api/health
        Health check endpoint with database connectivity test
        """
        try:
            # Test database connectivity
            db_status = 'operational'
            db_info = {}
            
            try:
                conn, db_engine = self.db_manager.get_auth_connection()
                
                # Test query
                if db_engine == 'postgresql':
                    test_result = self.db_manager.execute_query(conn, "SELECT version() as version", fetch='one')
                    db_info = {'engine': 'PostgreSQL', 'version': test_result['version'][:50] + '...'}
                else:
                    test_result = self.db_manager.execute_query(conn, "SELECT sqlite_version() as version", fetch='one')
                    db_info = {'engine': 'SQLite', 'version': test_result['version']}
                
                # Test user count
                user_count = self.db_manager.execute_query(conn, "SELECT COUNT(*) as count FROM users", fetch='one')
                db_info['user_count'] = user_count['count']
                
                conn.close()
                
            except Exception as db_error:
                db_status = 'error'
                db_info = {'error': str(db_error)}
            
            health_data = {
                'status': 'healthy' if db_status == 'operational' else 'degraded',
                'service': '5ive Trackr API',
                'version': '1.0.0',
                'timestamp': datetime.utcnow().isoformat(),
                'database': {
                    'status': db_status,
                    'info': db_info
                },
                'multi_tenant': 'enabled',
                'data_dir': self.data_dir
            }
            
            status_code = 200 if db_status == 'operational' else 503
            self.send_json_response(status_code, health_data)
            logger.info("Health check completed successfully")
            
        except Exception as e:
            logger.error(f"Health check error: {e}")
            self.send_error_response(500, 'Health check failed')
    
    def handle_check_session(self):
        """
        GET /api/auth/check-session
        Validates JWT token and returns user info
        """
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Invalid or expired token')
                return
            
            response_data = {
                'success': True,
                'valid': True,
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'user_role': user['user_role'],
                    'parent_league_manager_id': user['parent_league_manager_id']
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Session check error: {e}")
            self.send_error_response(500, 'Session check failed')
    
    def handle_subscription_info(self):
        """
        GET /api/auth/subscription-info
        Returns tenant's subscription information including packages
        """
        try:
            # Authenticate the request
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Get auth connection
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Get subscription information
                subscription_data = self.db_manager.execute_query(conn, """
                    SELECT subscription_id, tier_id, plan_name, base_price,
                           pitches_limit, referees_limit, divisions_limit,
                           leagues_per_division_limit, teams_limit, user_limit,
                           venue_limit, pitch_per_venue_limit, storage_limit_gb,
                           status, billing_cycle, next_billing_date
                    FROM subscriptions 
                    WHERE tenant_id = ?
                """, (tenant_id,), fetch='one')
                
                if not subscription_data:
                    self.send_json_response(200, {
                        'success': True,
                        'subscription': None,
                        'message': 'No subscription found for this tenant'
                    })
                    return
                
                # Get subscription packages if they exist
                try:
                    packages_data = self.db_manager.execute_query(conn, """
                        SELECT id, package_tier as tier, package_name as name, 
                               package_price as price, package_description as description,
                               purchased, assigned
                        FROM subscription_packages 
                        WHERE subscription_id = ?
                        ORDER BY id
                    """, (subscription_data['subscription_id'],), fetch='all') or []
                except Exception as e:
                    # Table might not exist for legacy subscriptions
                    logger.warning(f"Could not fetch packages for subscription {subscription_data['subscription_id']}: {e}")
                    packages_data = []
                
                # Format packages data
                packages = []
                for pkg in packages_data:
                    packages.append({
                        'id': str(pkg['id']),  # Convert to string for consistency
                        'tier': pkg['tier'],
                        'name': pkg['name'],
                        'price': float(pkg['price']),
                        'description': pkg['description'],
                        'purchased': bool(pkg['purchased']),
                        'assigned': bool(pkg['assigned'])
                    })
                
                # Build response
                subscription_info = {
                    'id': subscription_data['subscription_id'],
                    'tier_id': subscription_data['tier_id'],
                    'plan_name': subscription_data['plan_name'],
                    'base_price': float(subscription_data['base_price']) if subscription_data['base_price'] else 0,
                    'pitches_limit': subscription_data['pitches_limit'],
                    'referees_limit': subscription_data['referees_limit'],
                    'divisions_limit': subscription_data['divisions_limit'],
                    'leagues_per_division_limit': subscription_data['leagues_per_division_limit'],
                    'teams_limit': subscription_data['teams_limit'],
                    'user_limit': subscription_data['user_limit'],
                    'venue_limit': subscription_data['venue_limit'],
                    'pitch_per_venue_limit': subscription_data['pitch_per_venue_limit'],
                    'storage_limit_gb': subscription_data['storage_limit_gb'],
                    'status': subscription_data['status'],
                    'billing_cycle': subscription_data['billing_cycle'],
                    'next_billing_date': self.serialize_datetime(subscription_data['next_billing_date']),
                    'packages': packages
                }
                
                self.send_json_response(200, {
                    'success': True,
                    'subscription': subscription_info,
                    'tenant_id': tenant_id
                })
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Subscription info error: {e}")
            self.send_error_response(500, 'Failed to get subscription information')
    
    def handle_assign_package(self):
        """
        POST /api/auth/assign-package
        Assigns a subscription package to a venue
        """
        try:
            # Authenticate the request
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            package_id = data.get('packageId')
            venue_id = data.get('venueId')
            assigned = data.get('assigned', True)
            assigned_at = data.get('assignedAt')
            
            if not package_id:
                self.send_error_response(400, 'Package ID required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Get auth connection
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Verify the package belongs to this tenant
                package_check = self.db_manager.execute_query(conn, """
                    SELECT sp.id, sp.subscription_id, sp.assigned, s.tenant_id
                    FROM subscription_packages sp
                    JOIN subscriptions s ON sp.subscription_id = s.subscription_id
                    WHERE sp.id = ? AND s.tenant_id = ?
                """, (package_id, tenant_id), fetch='one')
                
                if not package_check:
                    self.send_error_response(404, 'Package not found or not owned by tenant')
                    return
                
                if package_check['assigned'] and assigned:
                    self.send_error_response(400, 'Package is already assigned to a venue')
                    return
                
                # Update package assignment status
                update_fields = ['assigned = ?']
                update_values = [assigned]
                
                if venue_id:
                    # For PostgreSQL, we might need to add a venue_id column, but for now just track in assigned field
                    pass
                
                if assigned_at:
                    # Could add assigned_at column if needed for tracking
                    pass
                
                # Update the package
                self.db_manager.execute_query(conn, f"""
                    UPDATE subscription_packages 
                    SET assigned = ?
                    WHERE id = ?
                """, (assigned, package_id))
                
                conn.commit()
                
                logger.info(f"Package {package_id} {'assigned to' if assigned else 'unassigned from'} venue {venue_id} for tenant {tenant_id}")
                
                self.send_json_response(200, {
                    'success': True,
                    'message': f"Package {'assigned' if assigned else 'unassigned'} successfully",
                    'package_id': package_id,
                    'venue_id': venue_id,
                    'assigned': assigned
                })
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Assign package error: {e}")
            self.send_error_response(500, 'Failed to assign package')
    
    def handle_active_session(self):
        """
        GET/POST /api/auth/active-session
        Validates JWT token and returns session status (alias for check-session)
        """
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'No active session')
                return
            
            response_data = {
                'success': True,
                'active': True,
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'user_role': user['user_role'],
                    'parent_league_manager_id': user['parent_league_manager_id']
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Active session check error: {e}")
            self.send_error_response(500, 'Session check failed')
    
    def handle_logout(self):
        """
        POST /api/auth/logout
        Invalidates user token
        """
        try:
            user = self.authenticate_request()
            if user:
                # Invalidate refresh tokens for this user
                self.invalidate_refresh_tokens(user['user_id'])
                logger.info(f"User logged out: {user['email']}")
            
            response_data = {
                'success': True,
                'message': 'Successfully logged out'
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Logout error: {e}")
            self.send_error_response(500, 'Logout failed')
    
    def authenticate_user(self, email, password_hash):
        """
        Authenticate user against central auth database
        Returns user object if valid, None otherwise
        """
        try:
            # Get connection through database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Initialize central auth database if it doesn't exist
                self.db_manager.create_auth_tables(conn)
                
                # Find user by email
                user = self.db_manager.execute_query(conn, """
                    SELECT * FROM users 
                    WHERE email = ? AND is_active = TRUE
                """, (email,), fetch='one')
                
                # Enhanced logging for authentication debugging
                logger.info(f"🔐 Authentication attempt for: {email}")
                logger.info(f"🔍 User found in database: {bool(user)}")
                if user:
                    logger.info(f"📋 User role: {user.get('user_role')}")
                    logger.info(f"🔐 Provided hash: {password_hash}")
                    logger.info(f"🔐 Stored hash:   {user.get('password_hash')}")
                    logger.info(f"✅ Hash match: {password_hash == user.get('password_hash')}")
                
                if user and self.verify_password(password_hash, user['password_hash']):
                    user_dict = dict(user)
                    
                    # Check if this is the super-admin
                    is_super_admin = (user_dict.get('email') == 'admin@5ivetrackr.com' and 
                                     user_dict.get('user_role') == 'league_manager')
                    
                    if is_super_admin:
                        # Super-admin doesn't need tenant database - manages all tenants
                        user_dict['tenant_db'] = None
                        user_dict['tenant_manager_id'] = None
                        logger.info("✅ Super-admin login - skipping tenant schema creation")
                    else:
                        # Determine which tenant database this user belongs to
                        if user_dict['user_role'] == 'league_manager':
                            user_dict['tenant_db'] = f"5ive_trackr_tenant_{user_dict['user_id']}.db"
                            user_dict['tenant_manager_id'] = user_dict['user_id']
                        else:
                            # Assistant managers and referees use their parent manager's tenant database
                            user_dict['tenant_db'] = f"5ive_trackr_tenant_{user_dict['parent_league_manager_id']}.db"
                            user_dict['tenant_manager_id'] = user_dict['parent_league_manager_id']
                        
                        # Initialize tenant schema if it doesn't exist
                        try:
                            self.db_manager.create_tenant_schema(user_dict['tenant_manager_id'])
                        except Exception as schema_error:
                            logger.error(f"❌ Failed to create tenant schema: {schema_error}")
                            # Continue with login anyway - schema can be created later
                    
                    return user_dict
                
                return None
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return None
    
    
    
    
    def authenticate_request(self):
        """
        Authenticate current request using JWT token
        Returns user object if valid, None otherwise
        """
        try:
            auth_header = self.headers.get('Authorization')
            logger.info(f"AUTH DEBUG: Header received: {auth_header[:50] if auth_header else 'None'}...")
            if not auth_header or not auth_header.startswith('Bearer '):
                logger.info("AUTH DEBUG: No valid Bearer token found")
                return None
            
            token = auth_header.split(' ')[1]
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            
            user_id = payload.get('user_id')
            if not user_id:
                return None
            
            # Get user from central auth database using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure schema exists
                self.db_manager.create_auth_tables(conn)
                
                user = self.db_manager.execute_query(conn, """
                    SELECT * FROM users 
                    WHERE user_id = ? AND is_active = TRUE
                """, (user_id,), fetch='one')
                
                if not user:
                    return None
                
                user_dict = dict(user)
                # Derive league_manager_id
                if user_dict['user_role'] in ['league_manager', 'admin']:
                    user_dict['league_manager_id'] = user_dict['user_id']
                else:
                    user_dict['league_manager_id'] = user_dict.get('parent_league_manager_id')
                
                return user_dict
            finally:
                conn.close()
                
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception as e:
            logger.error(f"Token authentication error: {e}")
            return None
    
    def generate_access_token(self, user):
        """Generate JWT access token"""
        payload = {
            'user_id': user['user_id'],
            'email': user['email'],
            'user_role': user['user_role'],
            'tenant_id': user.get('league_manager_id') or user.get('parent_league_manager_id') or user.get('user_id'),
            'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
            'iat': datetime.utcnow()
        }
        
        return jwt.encode(payload, SECRET_KEY, algorithm='HS256')
    
    def generate_refresh_token(self, user):
        """Generate refresh token"""
        return secrets.token_urlsafe(32)
    
    def store_refresh_token(self, user_id, refresh_token):
        """Store refresh token in database"""
        try:
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
                expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRY_DAYS)
                
                self.db_manager.execute_query(conn, """
                    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                    VALUES (?, ?, ?)
                """, (user_id, token_hash, expires_at))
                
                conn.commit()
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Store refresh token error: {e}")
    
    def serve_static_file(self, path):
        """Serve static webapp, webpage, and website files"""
        try:
            if path == '/' or path == '':
                path = '/index.html'
            
            # URL rewrites for clean URLs
            if path == '/signup':
                path = '/signup.html'
            elif path == '/signup-success':
                # Redirect to simplified signup success page
                path = '/signup-success.html'
            elif path == '/email-verification':
                path = '/email-verification.html'
            
            # Handle website directory assets specially
            if path.startswith('/website/'):
                website_dir = os.path.join(os.path.dirname(self.webapp_dir), 'website')
                # Remove the '/website/' prefix and serve directly from website directory
                asset_path = path[9:]  # Remove '/website/' (9 characters)
                file_path = os.path.join(website_dir, asset_path)
            else:
                # First try webapp directory
                file_path = os.path.join(self.webapp_dir, path.lstrip('/'))
                
                # If not found, try webpage directory (for admin dashboard)
                if not os.path.exists(file_path) or not os.path.isfile(file_path):
                    webpage_dir = os.path.join(os.path.dirname(self.webapp_dir), 'webpage')
                    file_path = os.path.join(webpage_dir, path.lstrip('/'))
                
                # If not found, try website directory (for marketing/signup pages)
                if not os.path.exists(file_path) or not os.path.isfile(file_path):
                    website_dir = os.path.join(os.path.dirname(self.webapp_dir), 'website')
                    file_path = os.path.join(website_dir, path.lstrip('/'))
            
            if os.path.exists(file_path) and os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Determine content type
                content_type = self.get_content_type(file_path)
                
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.add_cors_headers()
                self.end_headers()
                self.wfile.write(content)
            else:
                logger.error(f"File not found: {path} (checked webapp, webpage, and website directories)")
                self.send_error_response(404, 'File not found')
                
        except Exception as e:
            logger.error(f"Static file error: {e}")
            self.send_error_response(500, 'File serve error')
    
    def get_content_type(self, file_path):
        """Get MIME type for file"""
        import mimetypes
        content_type, _ = mimetypes.guess_type(file_path)
        return content_type or 'application/octet-stream'
    
    def hash_password(self, password):
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_password(self, provided_hash, stored_hash):
        """Verify password hash"""
        return provided_hash == stored_hash
    
    def send_json_response(self, status_code, data):
        """Send JSON response with CORS headers"""
        json_data = json.dumps(data, ensure_ascii=False)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(json_data.encode('utf-8'))))
        self.add_cors_headers()
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """Send error response"""
        error_data = {
            'success': False,
            'error': message,
            'code': f'ERROR_{status_code}'
        }
        self.send_json_response(status_code, error_data)
    
    def add_cors_headers(self):
        """Add CORS headers to response"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    
    def log_message(self, format, *args):
        """Override to use our logger"""
        logger.info(f"{self.address_string()} - {format % args}")
    
    # Additional handler functions for frontend compatibility
    def handle_get_current_user(self):
        """
        GET /api/auth/current-user
        Legacy endpoint - redirects to check-session
        """
        self.handle_check_session()
    
    def handle_get_profile(self):
        """
        GET /api/users/profile
        Get current user profile information
        """
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            response_data = {
                'success': True,
                'user': {
                    'user_id': user['user_id'],
                    'username': user['username'],
                    'email': user['email'],
                    'full_name': user['full_name'],
                    'contact_number': user['contact_number'],
                    'user_role': user['user_role'],
                    'parent_league_manager_id': user['parent_league_manager_id'],
                    'created_at': user['created_at'],
                    'last_login': user['last_login']
                }
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Get profile error: {e}")
            self.send_error_response(500, 'Failed to get profile')
    
    def get_league_database_path(self, user):
        """Get the correct league database path for a user"""
        league_manager_id = user.get('league_manager_id', user.get('user_id'))
        return os.path.join(self.data_dir, f'5ive_trackr_league_{league_manager_id}.db')
    
    def handle_get_users(self):
        """
        GET /api/data/users
        Get all users in the same league (admin only)
        """
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Check if user has admin privileges
            if user['user_role'] not in ['league_manager', 'assistant_manager']:
                self.send_error_response(403, 'Insufficient permissions')
                return
            
            # Get users from central auth database using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure schema exists
                self.db_manager.create_auth_tables(conn)
                
                # Get all users that belong to this league manager
                league_manager_id = user['league_manager_id']
                users = self.db_manager.execute_query(conn, """
                    SELECT user_id, username, email, full_name, contact_number, 
                           user_role, parent_league_manager_id, is_active, 
                           created_at, last_login
                    FROM users 
                    WHERE (user_id = ? OR parent_league_manager_id = ?) AND is_active = TRUE
                    ORDER BY created_at DESC
                """, (league_manager_id, league_manager_id), fetch='all')
                
                response_data = {
                    'success': True,
                    'users': users,
                    'league_manager_id': league_manager_id
                }
                
                self.send_json_response(200, response_data)
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Get users error: {e}")
            self.send_error_response(500, 'Failed to get users')
    
    def handle_create_or_update_users(self):
        """
        POST /api/data/users
        Create or update users data
        """
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # For now, just return success (implement full user management later)
            response_data = {
                'success': True,
                'message': 'Users data updated successfully'
            }
            
            self.send_json_response(200, response_data)
            
        except Exception as e:
            logger.error(f"Update users error: {e}")
            self.send_error_response(500, 'Failed to update users')
    
    def handle_admin_get_users(self):
        """
        GET /api/admin/users
        Get all users for admin management interface
        """
        try:
            # Require authentication
            requester = self.authenticate_request()
            if not requester:
                self.send_error_response(401, 'Authentication required')
                return
            if requester['user_role'] not in ['league_manager', 'tenant_manager', 'assistant_manager', 'admin']:
                self.send_error_response(403, 'Insufficient permissions')
                return
            
            # Check if this is the super-admin (admin@5ivetrackr.com)
            is_super_admin = (requester.get('email') == 'admin@5ivetrackr.com' and 
                             requester.get('user_role') == 'league_manager')
            
            # Get tenant_id from query parameters for super-admin
            tenant_id = None
            if is_super_admin:
                query_params = self.parse_query_params()
                tenant_id = query_params.get('tenant_id', [None])[0]
                logger.info(f"Super-admin requesting tenant: {tenant_id}")
            else:
                # For tenant_manager and league_manager, use their own ID as tenant_id
                if requester['user_role'] in ['tenant_manager', 'league_manager']:
                    tenant_id = requester['user_id']
                else:
                    tenant_id = requester['league_manager_id'] or requester['parent_league_manager_id'] or requester['user_id']
            
            # Get users from central auth database using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Initialize central auth database if it doesn't exist
                self.db_manager.create_auth_tables(conn)
                
                # Super-admin can view all users or filter by tenant
                if is_super_admin:
                    if tenant_id:
                        # Filter by specific tenant
                        users_data = self.db_manager.execute_query(conn, """
                            SELECT user_id, username, email, full_name, contact_number, 
                                   user_role, parent_league_manager_id, is_active, 
                                   created_at, last_login
                            FROM users 
                            WHERE is_active = TRUE
                              AND (user_id = ? OR parent_league_manager_id = ?)
                            ORDER BY created_at DESC
                        """, (tenant_id, tenant_id), fetch='all')
                    else:
                        # Show all users across all tenants
                        users_data = self.db_manager.execute_query(conn, """
                            SELECT user_id, username, email, full_name, contact_number, 
                                   user_role, parent_league_manager_id, is_active, 
                                   created_at, last_login
                            FROM users 
                            WHERE is_active = TRUE
                            ORDER BY created_at DESC
                        """, fetch='all')
                else:
                    # Regular admin - only their tenant
                    users_data = self.db_manager.execute_query(conn, """
                        SELECT user_id, username, email, full_name, contact_number, 
                               user_role, parent_league_manager_id, is_active, 
                               created_at, last_login
                        FROM users 
                        WHERE is_active = TRUE
                          AND (user_id = ? OR parent_league_manager_id = ?)
                        ORDER BY created_at DESC
                    """, (tenant_id, tenant_id), fetch='all')
                
                users = []
                for user_dict in users_data:
                    # Convert to format expected by admin interface
                    users.append({
                        'id': user_dict['user_id'],
                        'email': user_dict['email'],
                        'fullName': user_dict['full_name'],
                        'role': user_dict['user_role'],
                        'createdAt': user_dict['created_at'],
                        'lastLogin': user_dict['last_login'],
                        'mobileAccess': True  # Default for now
                    })
                
                self.send_json_response(200, users)
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Admin get users error: {e}")
            self.send_error_response(500, 'Failed to get users')
    
    def handle_admin_get_tenants(self):
        """
        GET /api/admin/tenants
        Get list of all tenants (only for super-admin)
        """
        try:
            # Require authentication
            requester = self.authenticate_request()
            if not requester:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only super-admin can access this
            is_super_admin = (requester.get('email') == 'admin@5ivetrackr.com' and 
                             requester.get('user_role') == 'league_manager')
            
            if not is_super_admin:
                self.send_error_response(403, 'Super-admin access required')
                return
            
            # Get all league managers (tenant owners) from central auth database
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Initialize central auth database if it doesn't exist
                self.db_manager.create_auth_tables(conn)
                
                tenants_data = self.db_manager.execute_query(conn, """
                    SELECT u.user_id, u.username, u.email, u.full_name, u.created_at, u.user_role,
                           s.subscription_id, s.tier_id, s.plan_name, s.base_price, 
                           s.pitches_limit, s.referees_limit, s.divisions_limit, 
                           s.leagues_per_division_limit, s.teams_limit,
                           s.user_limit, s.venue_limit, s.pitch_per_venue_limit,
                           s.storage_limit_gb, s.status as subscription_status, s.billing_cycle,
                           s.next_billing_date
                    FROM users u
                    LEFT JOIN subscriptions s ON u.user_id = s.tenant_id
                    WHERE u.user_role IN ('league_manager', 'tenant_manager')
                      AND u.is_active = TRUE 
                      AND u.email != 'admin@5ivetrackr.com'
                    ORDER BY u.created_at DESC
                """, fetch='all')
                
                tenants = []
                for tenant_dict in tenants_data:
                    # Count users in this tenant
                    user_count_result = self.db_manager.execute_query(conn, """
                        SELECT COUNT(*) as user_count
                        FROM users 
                        WHERE (user_id = ? OR parent_league_manager_id = ?) 
                          AND is_active = TRUE
                    """, (tenant_dict['user_id'], tenant_dict['user_id']), fetch='one')
                    
                    user_count = user_count_result['user_count']
                    
                    # Count venues for this tenant
                    venue_count_result = self.db_manager.execute_query(conn, """
                        SELECT COUNT(*) as venue_count
                        FROM venues 
                        WHERE tenant_id = ? AND is_active = TRUE
                    """, (tenant_dict['user_id'],), fetch='one')
                    
                    venue_count = venue_count_result['venue_count'] if venue_count_result else 0
                    
                    # Get assistant manager data for this tenant
                    assistant_manager = self.db_manager.execute_query(conn, """
                        SELECT email, full_name, user_id
                        FROM users 
                        WHERE parent_league_manager_id = ? AND user_role = 'assistant_manager' AND is_active = TRUE
                        LIMIT 1
                    """, (tenant_dict['user_id'],), fetch='one')
                    
                    # Get subscription add-ons
                    addons_data = self.db_manager.execute_query(conn, """
                        SELECT addon_type, quantity, price_per_unit
                        FROM subscription_addons 
                        WHERE subscription_id = ?
                    """, (tenant_dict['subscription_id'],), fetch='all') if tenant_dict['subscription_id'] else []
                    
                    tenant = {
                        'id': tenant_dict['user_id'],
                        'user_id': tenant_dict['user_id'],
                        'name': tenant_dict['full_name'] or tenant_dict['username'],
                        'full_name': tenant_dict['full_name'],
                        'email': tenant_dict['email'],
                        'user_role': tenant_dict['user_role'],
                        'user_count': user_count,
                        'venue_count': venue_count,
                        'created_at': self.serialize_datetime(tenant_dict['created_at']),
                        'assistant_manager': {
                            'email': assistant_manager['email'] if assistant_manager else None,
                            'full_name': assistant_manager['full_name'] if assistant_manager else None,
                            'user_id': assistant_manager['user_id'] if assistant_manager else None
                        }
                    }
                    
                    # Add subscription information with package-based structure
                    if tenant_dict['subscription_id']:
                        # Get subscription packages (handle missing table gracefully)
                        try:
                            packages_data = self.db_manager.execute_query(conn, """
                                SELECT package_tier, package_name, package_price, package_description, 
                                       purchased, assigned
                                FROM subscription_packages 
                                WHERE subscription_id = ?
                                ORDER BY id
                            """, (tenant_dict['subscription_id'],), fetch='all') or []
                        except Exception as e:
                            # Table might not exist yet for existing tenants
                            logger.warning(f"Could not fetch packages for subscription {tenant_dict['subscription_id']}: {e}")
                            packages_data = []
                        
                        packages = []
                        if packages_data:
                            for pkg in packages_data:
                                packages.append({
                                    'tier': pkg['package_tier'],
                                    'name': pkg['package_name'],
                                    'price': float(pkg['package_price']),
                                    'description': pkg['package_description'],
                                    'purchased': bool(pkg['purchased']),
                                    'assigned': bool(pkg['assigned'])
                                })
                        elif tenant_dict['tier_id']:
                            # For legacy tenants without packages, create a single package from their tier
                            tier_info = self.TIER_CONFIG.get(tenant_dict['tier_id'], self.TIER_CONFIG['starter'])
                            packages = [{
                                'tier': tenant_dict['tier_id'],
                                'name': tenant_dict['plan_name'] or tier_info['name'],
                                'price': float(tenant_dict['base_price']) if tenant_dict['base_price'] else tier_info['price'],
                                'description': f"{tenant_dict['venue_limit'] or 1} venue(s), {tenant_dict['pitches_limit'] or 1} pitch(es), {tenant_dict['referees_limit'] or 10} referee(s)",
                                'purchased': True,
                                'assigned': False
                            }]
                        
                        tenant['subscription'] = {
                            'id': tenant_dict['subscription_id'],
                            'tier_id': tenant_dict['tier_id'],
                            'plan_name': tenant_dict['plan_name'],
                            'base_price': float(tenant_dict['base_price']) if tenant_dict['base_price'] else 0,
                            'pitches_limit': tenant_dict['pitches_limit'],
                            'referees_limit': tenant_dict['referees_limit'], 
                            'divisions_limit': tenant_dict['divisions_limit'],
                            'leagues_per_division_limit': tenant_dict['leagues_per_division_limit'],
                            'teams_limit': tenant_dict['teams_limit'],
                            'user_limit': tenant_dict['user_limit'],  # legacy compatibility
                            'venue_limit': tenant_dict['venue_limit'],
                            'pitch_per_venue_limit': tenant_dict['pitch_per_venue_limit'],  # legacy compatibility
                            'storage_limit_gb': tenant_dict['storage_limit_gb'],
                            'status': tenant_dict['subscription_status'],
                            'billing_cycle': tenant_dict['billing_cycle'],
                            'next_billing_date': self.serialize_datetime(tenant_dict['next_billing_date']),
                            'addons': addons_data,
                            'packages': packages  # Add packages array
                        }
                    else:
                        # Default starter tier subscription (no trial anymore)
                        tenant['subscription'] = {
                            'status': 'active',
                            'tier_id': 'starter',
                            'plan_name': 'Starter',
                            'base_price': 49.99,
                            'pitches_limit': 1,
                            'referees_limit': 10,
                            'divisions_limit': 1,
                            'leagues_per_division_limit': 1,
                            'teams_limit': 10,
                            'user_limit': 10,  # legacy compatibility
                            'venue_limit': 1,
                            'pitch_per_venue_limit': 1,  # legacy compatibility
                            'storage_limit_gb': 10,
                            'addons': [],
                            'packages': []  # Empty packages array for legacy tenants
                        }
                    
                    tenants.append(tenant)
                
                logger.info(f"Super-admin retrieved {len(tenants)} tenants")
                self.send_json_response(200, {
                    'success': True,
                    'tenants': tenants
                })
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Admin get tenants error: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            self.send_error_response(500, 'Failed to get tenants')
    
    def handle_admin_get_tenant_venues(self, tenant_id):
        """
        GET /api/admin/tenant-venues/{tenant_id}
        Get venue information for a specific tenant (only for super-admin)
        """
        try:
            # Require authentication
            requester = self.authenticate_request()
            if not requester:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only super-admin can access this
            is_super_admin = (requester.get('email') == 'admin@5ivetrackr.com' and 
                             requester.get('user_role') == 'league_manager')
            
            if not is_super_admin:
                self.send_error_response(403, 'Super-admin access required')
                return
            
            # Validate tenant_id
            if not tenant_id or not tenant_id.isdigit():
                self.send_error_response(400, 'Invalid tenant ID')
                return
            
            tenant_id = int(tenant_id)
            
            # Get venue information from central database
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Get venues for this tenant
                venues_data = self.db_manager.execute_query(conn, """
                    SELECT venue_id, venue_name, address, pitch_count, max_pitches, 
                           is_active, created_at, package_id, subscription_plan, subscription_tier
                    FROM venues 
                    WHERE tenant_id = ? AND is_active = TRUE
                    ORDER BY venue_name ASC
                """, (tenant_id,), fetch='all')
                
                venues = []
                for venue in venues_data:
                    # Get stats for each venue - these would come from tenant-specific databases
                    # For now, we'll return basic venue info and placeholder stats
                    venue_info = {
                        'venue_id': venue['venue_id'],
                        'venue_name': venue['venue_name'],
                        'address': venue['address'] or 'No address provided',
                        'pitch_count': venue['pitch_count'] or 0,
                        'max_pitches': venue['max_pitches'] or 0,
                        'is_active': venue['is_active'],
                        'created_at': self.serialize_datetime(venue['created_at']),
                        # These stats would need to be fetched from tenant-specific databases
                        # For now, returning 0 as placeholders
                        'leagues_count': 0,  
                        'divisions_count': 0,
                        'teams_count': 0,
                        'referees_count': 0
                    }
                    venues.append(venue_info)
                
                self.send_json_response(200, {
                    'success': True,
                    'venues': venues,
                    'tenant_id': tenant_id,
                    'venue_count': len(venues)
                })
                
            except Exception as e:
                logger.error(f"Database error getting tenant venues: {e}")
                raise
                
        except Exception as e:
            logger.error(f"Admin get tenant venues error: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            self.send_error_response(500, 'Failed to get tenant venues')
    
    def handle_admin_create_user(self):
        """
        POST /api/data/users
        Create a new user via admin interface
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract user data from admin interface format
            if 'action' in data and data['action'] == 'create' and 'user' in data:
                user_data = data['user']
            else:
                user_data = data
            
            # Hash password
            hashed_password = self.hash_password(user_data['password'])
            
            # Insert into central auth database using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure schema exists
                self.db_manager.create_auth_tables(conn)
                
                self.db_manager.execute_query(conn, """
                    INSERT INTO users (username, email, password_hash, full_name, 
                                     contact_number, user_role, parent_league_manager_id, 
                                     is_active, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_data['email'],  # Use email as username
                    user_data['email'],
                    hashed_password,
                    user_data['fullName'],
                    '',  # contact_number
                    user_data['role'],
                    None,  # parent_league_manager_id
                    True,  # is_active
                    user_data.get('createdAt', datetime.now().isoformat()),
                    None  # last_login
                ))
                
                conn.commit()
                
                # Get newly created user_id (database-specific method)
                if self.db_manager.db_engine == 'postgresql':
                    # For PostgreSQL, we need to get the last inserted ID differently
                    new_user_result = self.db_manager.execute_query(conn, 
                        "SELECT user_id FROM users WHERE email = ? ORDER BY user_id DESC LIMIT 1", 
                        (user_data['email'],), fetch='one')
                    new_user_id = new_user_result['user_id']
                else:
                    # For SQLite, use lastrowid
                    cursor = conn.cursor()
                    new_user_id = cursor.lastrowid

                # Initialize tenant schema if user is tenant_manager
                if user_data['role'] == 'tenant_manager':
                    self.db_manager.create_tenant_schema(new_user_id)
                    logger.info(f"Initialized tenant schema for tenant_manager user ID: {new_user_id}")

                response_data = {
                    'success': True,
                    'message': 'User created successfully',
                    'userId': new_user_id
                }
                
                self.send_json_response(200, response_data)
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Admin create user error: {e}")
            self.send_error_response(500, f'Failed to create user: {str(e)}')
    
    def handle_admin_update_user(self):
        """
        PUT /api/data/users
        Update an existing user via admin interface
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Extract user data from admin interface format
            if 'action' in data and data['action'] == 'update' and 'user' in data:
                user_data = data['user']
            else:
                user_data = data
            
            user_id = user_data['id']
            
            # Update in central auth database using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure schema exists
                self.db_manager.create_auth_tables(conn)
                
                # Prepare update query
                update_fields = []
                update_values = []
                
                if 'email' in user_data:
                    update_fields.append('email = ?')
                    update_fields.append('username = ?')  # Keep username in sync with email
                    update_values.extend([user_data['email'], user_data['email']])
                
                if 'fullName' in user_data:
                    update_fields.append('full_name = ?')
                    update_values.append(user_data['fullName'])
                
                if 'role' in user_data:
                    update_fields.append('user_role = ?')
                    update_values.append(user_data['role'])
                
                if 'password' in user_data and user_data['password']:
                    update_fields.append('password_hash = ?')
                    update_values.append(self.hash_password(user_data['password']))
                
                if update_fields:
                    update_values.append(user_id)
                    query = f"UPDATE users SET {', '.join(update_fields)} WHERE user_id = ?"
                    self.db_manager.execute_query(conn, query, tuple(update_values))
                    conn.commit()
                
                response_data = {
                    'success': True,
                    'message': 'User updated successfully'
                }
                
                self.send_json_response(200, response_data)
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Admin update user error: {e}")
            self.send_error_response(500, f'Failed to update user: {str(e)}')
    
    def handle_admin_delete_user(self):
        """
        DELETE /api/data/users
        Delete a user via admin interface
        """
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_id = data.get('userId')
            if not user_id:
                self.send_error_response(400, 'User ID required')
                return
            
            # Delete from central auth database (soft delete) using database manager
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure schema exists
                self.db_manager.create_auth_tables(conn)
                
                self.db_manager.execute_query(conn, """
                    UPDATE users SET is_active = FALSE 
                    WHERE user_id = ?
                """, (user_id,))
                
                conn.commit()
                
                response_data = {
                    'success': True,
                    'message': 'User deleted successfully'
                }
                
                self.send_json_response(200, response_data)
            finally:
                conn.close()
            
        except Exception as e:
            logger.error(f"Admin delete user error: {e}")
            self.send_error_response(500, f'Failed to delete user: {str(e)}')
    
    def handle_get_teams(self):
        """GET /api/teams - Get teams data from league database"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get teams from league-specific database
            league_db_path = self.get_league_database_path(user)
            
            with sqlite3.connect(league_db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT * FROM teams 
                    WHERE is_active = TRUE 
                    ORDER BY league_position ASC, team_name ASC
                """)
                
                teams = [dict(row) for row in cursor.fetchall()]
                
                self.send_json_response(200, {
                    'success': True, 
                    'teams': teams,
                    'league_manager_id': user['league_manager_id']
                })
                
        except Exception as e:
            logger.error(f"Get teams error: {e}")
            self.send_error_response(500, 'Failed to get teams')
    
    def handle_create_team(self):
        """POST /api/teams - Create team in league database"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only league managers and assistant managers can create teams
            if user['user_role'] not in ['league_manager', 'assistant_manager']:
                self.send_error_response(403, 'Insufficient permissions')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get league-specific database
            league_db_path = self.get_league_database_path(user)
            
            with sqlite3.connect(league_db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO teams (team_name, captain_name, captain_email, captain_contact)
                    VALUES (?, ?, ?, ?)
                """, (
                    data.get('team_name'),
                    data.get('captain_name'),
                    data.get('captain_email'),
                    data.get('captain_contact')
                ))
                
                conn.commit()
                team_id = cursor.lastrowid
                
                self.send_json_response(200, {
                    'success': True, 
                    'message': 'Team created successfully',
                    'team_id': team_id
                })
                
        except Exception as e:
            logger.error(f"Create team error: {e}")
            self.send_error_response(500, 'Failed to create team')
    
    def handle_get_fixtures(self):
        """GET /api/fixtures - Get fixtures data from league database"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get fixtures from league-specific database
            league_db_path = self.get_league_database_path(user)
            
            with sqlite3.connect(league_db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT f.*, 
                           ht.team_name as home_team_name,
                           at.team_name as away_team_name,
                           v.venue_name
                    FROM fixtures f
                    LEFT JOIN teams ht ON f.home_team_id = ht.team_id
                    LEFT JOIN teams at ON f.away_team_id = at.team_id
                    LEFT JOIN venues v ON f.venue_id = v.venue_id
                    ORDER BY f.fixture_date ASC, f.fixture_time ASC
                """)
                
                fixtures = [dict(row) for row in cursor.fetchall()]
                
                self.send_json_response(200, {
                    'success': True, 
                    'fixtures': fixtures,
                    'league_manager_id': user['league_manager_id']
                })
                
        except Exception as e:
            logger.error(f"Get fixtures error: {e}")
            self.send_error_response(500, 'Failed to get fixtures')
    
    def handle_create_fixture(self):
        """POST /api/fixtures - Create fixture in league database"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only league managers and assistant managers can create fixtures
            if user['user_role'] not in ['league_manager', 'assistant_manager']:
                self.send_error_response(403, 'Insufficient permissions')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Get league-specific database
            league_db_path = self.get_league_database_path(user)
            
            with sqlite3.connect(league_db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT INTO fixtures (home_team_id, away_team_id, venue_id, fixture_date, fixture_time)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    data.get('home_team_id'),
                    data.get('away_team_id'),
                    data.get('venue_id'),
                    data.get('fixture_date'),
                    data.get('fixture_time')
                ))
                
                conn.commit()
                fixture_id = cursor.lastrowid
                
                self.send_json_response(200, {
                    'success': True, 
                    'message': 'Fixture created successfully',
                    'fixture_id': fixture_id
                })
                
        except Exception as e:
            logger.error(f"Create fixture error: {e}")
            self.send_error_response(500, 'Failed to create fixture')
    
    def handle_get_referees(self):
        """GET /api/referees - Get referees data from league database"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get referees from league-specific database
            league_db_path = self.get_league_database_path(user)
            
            with sqlite3.connect(league_db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Join with central auth to get referee details
                auth_db_path = os.path.join(self.data_dir, '5ive_trackr_central_auth.db')
                cursor.execute(f"""
                    ATTACH DATABASE '{auth_db_path}' AS auth
                """)
                
                cursor.execute("""
                    SELECT r.*, u.full_name, u.email, u.contact_number
                    FROM referees r
                    JOIN auth.users u ON r.user_id = u.user_id
                    WHERE r.is_active = TRUE AND u.user_role = 'referee'
                    ORDER BY u.full_name ASC
                """)
                
                referees = [dict(row) for row in cursor.fetchall()]
                
                self.send_json_response(200, {
                    'success': True, 
                    'referees': referees,
                    'league_manager_id': user['league_manager_id']
                })
                
        except Exception as e:
            logger.error(f"Get referees error: {e}")
            self.send_error_response(500, 'Failed to get referees')
    
    def handle_get_venues(self):
        """GET /api/venues - Get venues data"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            logger.info(f"Getting venues for user: {user.get('email')} (ID: {user.get('user_id')}, tenant_id: {tenant_id})")
            
            # Get tenant venues from central database
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Debug: Check if venues table exists and what data is there
                all_venues = self.db_manager.execute_query(conn, """
                    SELECT venue_id, venue_name, tenant_id, is_active
                    FROM venues 
                    ORDER BY venue_id DESC
                    LIMIT 10
                """, fetch='all')
                logger.info(f"Recent venues in database: {all_venues}")
                
                venues_data = self.db_manager.execute_query(conn, """
                    SELECT venue_id, venue_name, address, pitch_count, max_pitches, 
                           is_active, created_at, package_id, subscription_plan, subscription_tier
                    FROM venues 
                    WHERE tenant_id = ? AND is_active = TRUE
                    ORDER BY venue_name ASC
                """, (tenant_id,), fetch='all')
                
                logger.info(f"Filtered venues for user {user['user_id']}: {venues_data}")
                
                # Get user and subscription info for this tenant
                manager_info = self.db_manager.execute_query(conn, """
                    SELECT full_name, email 
                    FROM users 
                    WHERE user_id = ? AND user_role = 'league_manager'
                    LIMIT 1
                """, (tenant_id,), fetch='one')
                
                # Get subscription info (simplified query without JOIN)
                subscription_info = self.db_manager.execute_query(conn, """
                    SELECT tier_id, status, plan_name
                    FROM subscriptions 
                    WHERE tenant_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (tenant_id,), fetch='one')
                
                # Get venue-package assignments (handle if table doesn't exist yet)
                venue_package_map = {}
                try:
                    venue_packages = self.db_manager.execute_query(conn, """
                        SELECT venue_id, package_id, tier_id, status
                        FROM venue_packages 
                        WHERE tenant_id = ?
                    """, (tenant_id,), fetch='all')
                    
                    # Create a mapping of venue_id to package info
                    if venue_packages:
                        for vp in venue_packages:
                            venue_package_map[vp['venue_id']] = {
                                'plan': vp.get('tier_id', 'Unknown').title(),
                                'status': vp.get('status', 'inactive')
                            }
                except Exception as e:
                    logger.info(f"venue_packages table not found, using fallback assignment: {e}")
                    venue_package_map = {}
                
                venues = []
                venue_index = 0
                for venue in venues_data or []:
                    # Use subscription data from venues table (stored during creation)
                    package_info = {
                        'plan': venue.get('subscription_plan', 'No Package'),
                        'status': 'active' if venue.get('subscription_plan') else 'inactive'
                    }
                    
                    venue_index += 1
                    
                    venues.append({
                        'id': venue['venue_id'],  # Add 'id' field for compatibility
                        'venue_id': venue['venue_id'],
                        'name': venue['venue_name'],  # Add 'name' field for compatibility
                        'venue_name': venue['venue_name'],
                        'address': venue['address'],
                        'city': venue['address'],  # Frontend expects 'city' field
                        'pitch_count': venue['pitch_count'],
                        'pitches': venue['pitch_count'] or 0,  # Frontend expects 'pitches' field
                        'max_pitches': venue['max_pitches'],
                        'is_active': venue['is_active'],
                        'created_at': self.serialize_datetime(venue['created_at']),
                        # Add subscription package info
                        'subscription': package_info or {
                            'plan': 'No Package',
                            'status': 'inactive'
                        },
                        # Add default fields that frontend expects
                        'stats': {
                            'leagues': 0,
                            'divisions': 0, 
                            'teams': 0,
                            'referees': 0
                        },
                        'managers': {
                            'leagueManager': manager_info.get('full_name') if manager_info else 'Unknown',
                            'leagueManagerEmail': manager_info.get('email') if manager_info else None,
                            'assistantManager': None
                        },
                        'operatingHours': {
                            'monday': {'open': '09:00', 'close': '21:00'},
                            'tuesday': {'open': '09:00', 'close': '21:00'},
                            'wednesday': {'open': '09:00', 'close': '21:00'},
                            'thursday': {'open': '09:00', 'close': '21:00'},
                            'friday': {'open': '09:00', 'close': '22:00'},
                            'saturday': {'open': '09:00', 'close': '22:00'},
                            'sunday': {'open': '10:00', 'close': '20:00'}
                        }
                    })
                
                self.send_json_response(200, {
                    'success': True, 
                    'venues': venues,
                    'tenant_id': user['user_id']
                })
                
            except Exception as e:
                logger.error(f"Database error getting venues: {e}")
                raise
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Get venues error: {e}")
            self.send_error_response(500, 'Failed to get venues')
    
    def handle_get_available_packages(self):
        """GET /api/venues/available-packages - Get available recycled subscription packages"""
        try:
            logger.info("📦 GET /api/venues/available-packages called")
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            logger.info(f"📦 Getting available packages for user: {user.get('email')} (user_id: {user.get('user_id')}, tenant_id: {tenant_id})")
            
            # Get auth connection
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Ensure table exists
                self.create_available_packages_table_if_not_exists(conn, db_engine)
                
                # Get available packages for this tenant
                packages = self.db_manager.execute_query(conn, """
                    SELECT package_id, subscription_plan, subscription_tier, expires_at, 
                           is_recycled, source_venue_name, created_at
                    FROM available_packages
                    WHERE tenant_id = %s AND expires_at > CURRENT_TIMESTAMP
                    ORDER BY expires_at DESC, created_at DESC
                """ if db_engine == 'postgresql' else """
                    SELECT package_id, subscription_plan, subscription_tier, expires_at, 
                           is_recycled, source_venue_name, created_at
                    FROM available_packages
                    WHERE tenant_id = ? AND expires_at > datetime('now')
                    ORDER BY expires_at DESC, created_at DESC
                """, (tenant_id,), fetch='all') or []
                
                logger.info(f"Found {len(packages)} available packages for tenant {tenant_id}")
                
                # Convert datetime objects to ISO strings for JSON serialization
                for package in packages:
                    if 'expires_at' in package and package['expires_at']:
                        package['expires_at'] = package['expires_at'].isoformat()
                    if 'created_at' in package and package['created_at']:
                        package['created_at'] = package['created_at'].isoformat()
                
                self.send_json_response(200, {
                    'packages': packages,
                    'total_count': len(packages)
                })
                
            except Exception as e:
                logger.error(f"Database error getting available packages: {e}")
                self.send_error_response(500, 'Database error')
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Get available packages error: {e}")
            self.send_error_response(500, 'Failed to get available packages')
    
    def handle_create_venue(self):
        """POST /api/venues - Create a new venue"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Parse request data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            
            venue_name = data.get('venue_name', '').strip()
            address = data.get('address', '').strip()
            max_pitches = data.get('max_pitches', 5)
            package_id = data.get('package_id')
            subscription_plan = data.get('subscription_plan', 'Starter')
            subscription_tier = data.get('subscription_tier', 'starter')
            
            if not venue_name:
                self.send_error_response(400, 'Venue name is required')
                return
            
            logger.info(f"Creating venue '{venue_name}' for user: {user.get('email')} (ID: {user.get('user_id')}, tenant_id: {tenant_id})")
            
            # Create venue in central database
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # If package_id is provided, check if it's from available_packages (recycled package)
                using_recycled_package = False
                if package_id:
                    # Ensure table exists
                    self.create_available_packages_table_if_not_exists(conn, db_engine)
                    
                    # Check if this package exists in available_packages
                    available_package = self.db_manager.execute_query(conn, """
                        SELECT package_id, subscription_plan, subscription_tier, expires_at
                        FROM available_packages
                        WHERE package_id = %s AND tenant_id = %s AND expires_at > CURRENT_TIMESTAMP
                    """ if db_engine == 'postgresql' else """
                        SELECT package_id, subscription_plan, subscription_tier, expires_at
                        FROM available_packages
                        WHERE package_id = ? AND tenant_id = ? AND expires_at > datetime('now')
                    """, (package_id, tenant_id), fetch='one')
                    
                    if available_package:
                        # Use the package details from available_packages
                        subscription_plan = available_package['subscription_plan']
                        subscription_tier = available_package['subscription_tier']
                        using_recycled_package = True
                        logger.info(f"Using recycled package: {package_id} ({subscription_plan})")
                    else:
                        logger.info(f"Package {package_id} not found in available packages, treating as new package")
                
                # Set max_pitches based on subscription tier
                if subscription_tier == 'starter':
                    max_pitches = 1
                elif subscription_tier == 'growth':
                    max_pitches = 3
                elif subscription_tier == 'professional':
                    max_pitches = 10
                else:
                    max_pitches = data.get('max_pitches', 5)  # Use provided value or default
                # Use database-agnostic query with execute_query
                if db_engine == 'postgresql':
                    query = """
                        INSERT INTO venues (tenant_id, venue_name, address, max_pitches, pitch_count, is_active, package_id, subscription_plan, subscription_tier)
                        VALUES (%s, %s, %s, %s, 0, TRUE, %s, %s, %s)
                        RETURNING venue_id
                    """
                    result = self.db_manager.execute_query(conn, query, 
                        (tenant_id, venue_name, address, max_pitches, package_id, subscription_plan, subscription_tier), 
                        fetch='one')
                    venue_id = result['venue_id']
                    logger.info(f"Successfully created venue ID {venue_id} for tenant {tenant_id} with package {subscription_plan} (PostgreSQL)")
                else:
                    # SQLite
                    query = """
                        INSERT INTO venues (tenant_id, venue_name, address, max_pitches, pitch_count, is_active, package_id, subscription_plan, subscription_tier)
                        VALUES (?, ?, ?, ?, 0, 1, ?, ?, ?)
                    """
                    result = self.db_manager.execute_query(conn, query, 
                        (tenant_id, venue_name, address, max_pitches, package_id, subscription_plan, subscription_tier))
                    venue_id = conn.lastrowid
                
                logger.info(f"Successfully created venue ID {venue_id} for tenant {tenant_id}")
                
                # If using recycled package, remove it from available_packages
                if using_recycled_package and package_id:
                    self.db_manager.execute_query(conn, """
                        DELETE FROM available_packages
                        WHERE package_id = %s AND tenant_id = %s
                    """ if db_engine == 'postgresql' else """
                        DELETE FROM available_packages
                        WHERE package_id = ? AND tenant_id = ?
                    """, (package_id, tenant_id))
                    logger.info(f"Removed recycled package {package_id} from available packages")
                
                # Commit the transaction to save the venue
                conn.commit()
                logger.info(f"Venue ID {venue_id} committed to database")
                
                self.send_json_response(201, {
                    'success': True,
                    'message': 'Venue created successfully',
                    'venue_id': venue_id,
                    'venue_name': venue_name
                })
                
            except Exception as e:
                logger.error(f"Database error creating venue: {e}")
                if conn:
                    conn.rollback()
                raise
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Create venue error: {e}")
            self.send_error_response(500, 'Failed to create venue')
    
    def handle_get_pitches(self):
        """GET /api/pitches - Get pitches for the authenticated user"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Get query parameters for venue filtering
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            venue_id = query_params.get('venue_id', [None])[0]
            
            logger.info(f"Getting pitches for tenant {tenant_id}, venue_id: {venue_id}")
            
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Build query with optional venue filtering
                if venue_id:
                    query = """
                        SELECT p.pitch_id, p.venue_id, p.pitch_name, p.pitch_size, 
                               p.status, p.availability, p.created_at, p.updated_at,
                               v.venue_name, v.address
                        FROM pitches p
                        JOIN venues v ON p.venue_id = v.venue_id
                        WHERE p.tenant_id = ? AND p.venue_id = ? AND p.is_active = TRUE
                        ORDER BY p.pitch_name ASC
                    """
                    params = (tenant_id, venue_id)
                else:
                    query = """
                        SELECT p.pitch_id, p.venue_id, p.pitch_name, p.pitch_size, 
                               p.status, p.availability, p.created_at, p.updated_at,
                               v.venue_name, v.address
                        FROM pitches p
                        JOIN venues v ON p.venue_id = v.venue_id
                        WHERE p.tenant_id = ? AND p.is_active = TRUE
                        ORDER BY p.pitch_name ASC
                    """
                    params = (tenant_id,)
                
                pitches_data = self.db_manager.execute_query(conn, query, params, fetch='all')
                logger.info(f"Found {len(pitches_data)} pitches for tenant {tenant_id}")
                
                pitches = []
                for pitch in pitches_data:
                    # Get availability (PostgreSQL JSONB is already parsed)
                    availability = pitch['availability'] if pitch['availability'] else {}
                    
                    # Extract kick_off_times from availability JSON
                    kick_off_times = []
                    if availability and 'kick_off_times' in availability:
                        kick_off_times = availability['kick_off_times'] or []
                    
                    pitch_info = {
                        'id': pitch['pitch_id'],
                        'pitch_id': pitch['pitch_id'],
                        'venue_id': pitch['venue_id'],
                        'name': pitch['pitch_name'],
                        'pitch_name': pitch['pitch_name'],
                        'size': pitch['pitch_size'],
                        'status': pitch['status'],
                        'availability': availability,
                        'kick_off_times': kick_off_times,
                        'kickOffTimes': kick_off_times,  # Compatibility
                        'venue_name': pitch['venue_name'],
                        'venue_address': pitch['address'],
                        'created_at': self.serialize_datetime(pitch['created_at']),
                        'updated_at': self.serialize_datetime(pitch['updated_at'])
                    }
                    pitches.append(pitch_info)
                
                self.send_json_response(200, {
                    'success': True,
                    'pitches': pitches,
                    'count': len(pitches)
                })
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Get pitches error: {e}")
            self.send_error_response(500, 'Failed to get pitches')
    
    def handle_create_pitch(self):
        """POST /api/pitches - Create a new pitch"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Parse request data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            
            venue_id = data.get('venue_id')
            pitch_name = data.get('name', '').strip()        # Pitch name
            pitch_size = data.get('size', '11v11')           # Pitch Size  
            status = data.get('status', 'available')         # Status
            availability = data.get('availability', {})      # Available Days
            kick_off_times = data.get('kickOffTimes', [])    # Kick off Times
            
            if not venue_id or not pitch_name:
                self.send_error_response(400, 'Venue ID and pitch name are required')
                return
            
            if not availability:
                self.send_error_response(400, 'Availability configuration is required')
                return
                
            if not kick_off_times:
                self.send_error_response(400, 'At least one kick-off time is required')
                return
            
            logger.info(f"Creating pitch '{pitch_name}' for venue {venue_id}, tenant {tenant_id} with {len(kick_off_times)} kick-off times")
            
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # First, verify the venue belongs to the tenant and get current pitch limits
                venue_query = """
                    SELECT venue_id, venue_name, pitch_count, max_pitches, subscription_plan
                    FROM venues 
                    WHERE venue_id = ? AND tenant_id = ? AND is_active = TRUE
                """
                venue_info = self.db_manager.execute_query(conn, venue_query, (venue_id, tenant_id), fetch='one')
                
                if not venue_info:
                    self.send_error_response(404, 'Venue not found or access denied')
                    return
                
                # Check pitch limits based on subscription plan
                subscription_plan = venue_info['subscription_plan'] or 'Starter'
                plan_limits = {
                    'Starter': 1,
                    'Growth': 3,
                    'Pro': 8,
                    'Professional': 8,
                    'Enterprise': 15
                }
                max_pitches_allowed = plan_limits.get(subscription_plan, 3)
                current_pitch_count = venue_info['pitch_count'] or 0
                
                logger.info(f"Venue {venue_info['venue_name']}: {current_pitch_count}/{max_pitches_allowed} pitches (plan: {subscription_plan})")
                
                if current_pitch_count >= max_pitches_allowed:
                    self.send_error_response(400, f'Maximum pitch limit reached for {subscription_plan} plan ({max_pitches_allowed} pitches)')
                    return
                
                # Create the pitch - include kick_off_times in availability
                availability['kick_off_times'] = kick_off_times
                availability_json = json.dumps(availability)
                
                if db_engine == 'postgresql':
                    query = """
                        INSERT INTO pitches (venue_id, tenant_id, pitch_name, pitch_size, status, availability)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING pitch_id
                    """
                    result = self.db_manager.execute_query(conn, query, 
                        (venue_id, tenant_id, pitch_name, pitch_size, status, availability_json), 
                        fetch='one')
                    pitch_id = result['pitch_id']
                else:
                    # SQLite
                    query = """
                        INSERT INTO pitches (venue_id, tenant_id, pitch_name, pitch_size, status, availability)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """
                    self.db_manager.execute_query(conn, query, 
                        (venue_id, tenant_id, pitch_name, pitch_size, status, availability_json))
                    pitch_id = conn.lastrowid
                
                # Update venue pitch count
                update_venue_query = """
                    UPDATE venues 
                    SET pitch_count = pitch_count + 1 
                    WHERE venue_id = ?
                """
                self.db_manager.execute_query(conn, update_venue_query, (venue_id,))
                
                conn.commit()
                logger.info(f"Successfully created pitch ID {pitch_id} and updated venue pitch count")
                
                self.send_json_response(201, {
                    'success': True,
                    'message': 'Pitch created successfully',
                    'pitch_id': pitch_id,
                    'pitch_name': pitch_name,
                    'venue_id': venue_id
                })
                
            except Exception as e:
                logger.error(f"Database error creating pitch: {e}")
                if conn:
                    conn.rollback()
                raise
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Create pitch error: {e}")
            self.send_error_response(500, 'Failed to create pitch')
    
    def handle_delete_pitch(self, parsed_path):
        """DELETE /api/pitches/{pitch_id} - Delete a pitch"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            
            # Extract pitch ID from path
            path_parts = parsed_path.path.split('/')
            if len(path_parts) < 4:
                self.send_error_response(400, 'Pitch ID is required')
                return
            
            try:
                pitch_id = int(path_parts[3])
            except ValueError:
                self.send_error_response(400, 'Invalid pitch ID')
                return
            
            logger.info(f"Deleting pitch {pitch_id} for tenant {tenant_id}")
            
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # First, verify the pitch belongs to the tenant and get venue info
                pitch_query = """
                    SELECT p.pitch_id, p.venue_id, p.pitch_name, v.venue_name
                    FROM pitches p
                    JOIN venues v ON p.venue_id = v.venue_id
                    WHERE p.pitch_id = ? AND p.tenant_id = ? AND p.is_active = TRUE
                """
                pitch_info = self.db_manager.execute_query(conn, pitch_query, (pitch_id, tenant_id), fetch='one')
                
                if not pitch_info:
                    self.send_error_response(404, 'Pitch not found or access denied')
                    return
                
                venue_id = pitch_info['venue_id']
                
                # Soft delete the pitch (set is_active to FALSE)
                delete_query = """
                    UPDATE pitches 
                    SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
                    WHERE pitch_id = ?
                """
                self.db_manager.execute_query(conn, delete_query, (pitch_id,))
                
                # Update venue pitch count
                update_venue_query = """
                    UPDATE venues 
                    SET pitch_count = pitch_count - 1 
                    WHERE venue_id = ? AND pitch_count > 0
                """
                self.db_manager.execute_query(conn, update_venue_query, (venue_id,))
                
                conn.commit()
                logger.info(f"Successfully deleted pitch {pitch_id} and updated venue pitch count")
                
                self.send_json_response(200, {
                    'success': True,
                    'message': 'Pitch deleted successfully',
                    'pitch_id': pitch_id
                })
                
            except Exception as e:
                logger.error(f"Database error deleting pitch: {e}")
                if conn:
                    conn.rollback()
                raise
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Delete pitch error: {e}")
            self.send_error_response(500, 'Failed to delete pitch')
    
    def handle_update_pitch(self, parsed_path):
        """PUT /api/pitches/{pitch_id} - Update a pitch"""
        try:
            user = self.authenticate_request()
            if not user:
                return
                
            tenant_id = user['user_id']
            
            # Extract pitch_id from URL
            path_parts = parsed_path.path.strip('/').split('/')
            if len(path_parts) < 3:
                self.send_error_response(400, 'Pitch ID is required')
                return
                
            try:
                pitch_id = int(path_parts[2])
            except ValueError:
                self.send_error_response(400, 'Invalid pitch ID')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length).decode('utf-8')
                data = json.loads(post_data)
            else:
                self.send_error_response(400, 'Request body is required')
                return
            
            # Validate required fields
            name = data.get('name', '').strip()
            size = data.get('size', '').strip()
            status = data.get('status', 'available').strip()
            availability = data.get('availability', {})
            kick_off_times = data.get('kickOffTimes', [])
            
            if not name:
                self.send_error_response(400, 'Pitch name is required')
                return
                
            if not size:
                self.send_error_response(400, 'Pitch size is required')
                return
            
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                # First, verify the pitch belongs to the tenant
                verify_query = """
                    SELECT p.pitch_id, p.venue_id, p.pitch_name, v.venue_name
                    FROM pitches p
                    JOIN venues v ON p.venue_id = v.venue_id
                    WHERE p.pitch_id = ? AND p.tenant_id = ? AND p.is_active = TRUE
                """
                pitch_info = self.db_manager.execute_query(conn, verify_query, (pitch_id, tenant_id), fetch='one')
                
                if not pitch_info:
                    self.send_error_response(404, 'Pitch not found or access denied')
                    return
                
                # Update the pitch - include kick_off_times in availability
                availability['kick_off_times'] = kick_off_times
                update_query = """
                    UPDATE pitches 
                    SET pitch_name = ?, pitch_size = ?, status = ?, 
                        availability = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE pitch_id = ?
                """
                availability_json = json.dumps(availability)
                self.db_manager.execute_query(conn, update_query, 
                    (name, size, status, availability_json, pitch_id))
                
                conn.commit()
                
                logger.info(f"Successfully updated pitch ID {pitch_id} for tenant {tenant_id}")
                
                self.send_json_response(200, {
                    'success': True,
                    'message': f'Successfully updated "{name}"',
                    'pitch_id': pitch_id
                })
                
            finally:
                conn.close()
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON in request body')
        except Exception as e:
            logger.error(f"Update pitch error: {e}")
            self.send_error_response(500, 'Failed to update pitch')

    def handle_admin_create_tenant(self):
        """
        POST /api/admin/tenants
        Create a new tenant with subscription (super-admin only)
        """
        try:
            logger.info("Starting tenant creation process...")
            # Require authentication
            requester = self.authenticate_request()
            if not requester:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only super-admin can create tenants
            is_super_admin = (requester.get('email') == 'admin@5ivetrackr.com' and 
                             requester.get('user_role') == 'league_manager')
            
            if not is_super_admin:
                self.send_error_response(403, 'Super-admin access required')
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            logger.info(f"Received tenant creation data: {json.dumps(data, default=str)}")
            logger.info("Validating request data structure...")
            
            # Validate required league_manager data
            if 'league_manager' not in data:
                self.send_error_response(400, 'League manager data required')
                return
                
            league_manager = data['league_manager']
            assistant_manager = data.get('assistant_manager', {})
            
            # Check if assistant manager is being created
            # If any field is provided, all fields are required
            assistant_fields_provided = any([
                assistant_manager.get('email'),
                assistant_manager.get('full_name'),
                assistant_manager.get('password')
            ])
            
            create_assistant = False
            if assistant_fields_provided:
                # If any field is provided, all must be provided
                required_fields = ['email', 'full_name', 'password']
                missing_fields = [field for field in required_fields if not assistant_manager.get(field)]
                if missing_fields:
                    self.send_error_response(400, f'Incomplete assistant manager data. Missing fields: {", ".join(missing_fields)}')
                    return
                create_assistant = True
            
            # Validate league manager required fields
            required_fields = ['email', 'full_name', 'password']
            for field in required_fields:
                if field not in league_manager:
                    self.send_error_response(400, f'Missing required league_manager field: {field}')
                    return
            
            # Validate email uniqueness if assistant is being created
            if create_assistant and league_manager['email'] == assistant_manager['email']:
                self.send_error_response(400, 'League Manager and Assistant Manager must have different email addresses')
                return
            
            # Get central auth connection
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # Initialize central auth database with schema migration
                self.db_manager.migrate_schema_if_needed(conn)
                self.db_manager.create_auth_tables(conn)
                
                # Check if emails already exist
                # Always check league manager
                existing_league_manager = self.db_manager.execute_query(conn, """
                    SELECT user_id FROM users WHERE email = ?
                """, (league_manager['email'],), fetch='one')
                
                if existing_league_manager:
                    self.send_error_response(400, 'League Manager email already exists')
                    return
                
                # Check assistant manager if being created
                if create_assistant:
                    existing_assistant = self.db_manager.execute_query(conn, """
                        SELECT user_id FROM users WHERE email = ?
                    """, (assistant_manager['email'],), fetch='one')
                    
                    if existing_assistant:
                        self.send_error_response(400, 'Assistant Manager email already exists')
                        return
                
                # Create League Manager
                league_manager_password_hash = hashlib.sha256(league_manager['password'].encode()).hexdigest()
                
                self.db_manager.execute_query(conn, """
                    INSERT INTO users (username, email, password_hash, full_name, 
                                     contact_number, user_role, parent_league_manager_id, 
                                     is_active, created_at, last_login)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    league_manager['email'],
                    league_manager['email'],
                    league_manager_password_hash,
                    league_manager['full_name'],
                    league_manager.get('contact_number', ''),
                    'league_manager',
                    None,
                    True,
                    datetime.now().isoformat(),
                    None
                ))
                
                # Get the league manager ID
                if db_engine == 'postgresql':
                    league_manager_id = self.db_manager.execute_query(conn, 
                        "SELECT user_id FROM users WHERE email = ?", 
                        (league_manager['email'],), fetch='one')['user_id']
                else:
                    league_manager_id = conn.lastrowid
                
                # Create Assistant Manager only if data provided
                if create_assistant:
                    assistant_manager_password_hash = hashlib.sha256(assistant_manager['password'].encode()).hexdigest()
                    
                    self.db_manager.execute_query(conn, """
                        INSERT INTO users (username, email, password_hash, full_name, 
                                         contact_number, user_role, parent_league_manager_id, 
                                         is_active, created_at, last_login)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        assistant_manager['email'],
                        assistant_manager['email'],
                        assistant_manager_password_hash,
                        assistant_manager['full_name'],
                        assistant_manager.get('contact_number', ''),
                        'assistant_manager',
                        league_manager_id,  # Parent is the league manager
                        True,
                        datetime.now().isoformat(),
                        None
                    ))
                    logger.info(f"Created assistant manager: {assistant_manager['email']}")
                else:
                    logger.info("No assistant manager created - data not provided")
                
                user_id = league_manager_id  # Use league manager ID for subscription
                
                # Create subscription with new package-based system
                subscription_data = data.get('subscription', {})
                packages = subscription_data.get('packages', [])
                
                if not packages:
                    self.send_error_response(400, 'At least one subscription package is required')
                    return
                
                logger.info(f"Creating subscription with {len(packages)} packages: {packages}")
                
                # Calculate aggregate limits from all packages
                total_pitches = 0
                total_referees = 0
                total_leagues = 0
                total_divisions = 0
                total_teams = 0
                total_price = 0
                venue_limit = len(packages)  # Each package = 1 venue
                
                # Get primary tier info from first package for base limits
                primary_tier = subscription_data.get('primary_tier', packages[0]['tier'] if packages else 'starter')
                primary_tier_info = self.TIER_CONFIG.get(primary_tier, self.TIER_CONFIG['starter'])
                
                # Sum up limits from all packages
                for package in packages:
                    tier_key = package['tier']
                    tier_info = self.TIER_CONFIG.get(tier_key, self.TIER_CONFIG['starter'])
                    
                    total_pitches += tier_info['limits']['pitches']
                    total_referees += tier_info['limits']['referees']
                    total_divisions += tier_info['limits']['divisions']
                    total_teams += tier_info['limits']['teams']
                    total_price += package['price']
                
                logger.info(f"Calculated totals - Venues: {venue_limit}, Pitches: {total_pitches}, Price: {total_price}")
                
                # Create subscription record with aggregated limits
                self.db_manager.execute_query(conn, """
                    INSERT INTO subscriptions (tenant_id, tier_id, plan_name, base_price,
                                             pitches_limit, referees_limit, divisions_limit, 
                                             leagues_per_division_limit, teams_limit,
                                             user_limit, venue_limit, pitch_per_venue_limit, 
                                             storage_limit_gb, status, billing_cycle, next_billing_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id,
                    primary_tier,  # Use primary tier as tier_id
                    f"Multi-Package Plan ({len(packages)} packages)",  # Descriptive plan name
                    total_price,  # Sum of all package prices
                    total_pitches,
                    total_referees,
                    total_divisions,
                    primary_tier_info['limits']['leaguesPerDivision'],  # Use primary tier for this
                    total_teams,
                    total_teams,  # user_limit mapped to teams (legacy)
                    venue_limit,  # Each package allows 1 venue
                    max(1, total_pitches // venue_limit if venue_limit > 0 else total_pitches),  # Distribute pitches across venues
                    subscription_data.get('storage_limit', 10 * len(packages)),  # Scale storage with packages
                    'active',  # All paid packages are active
                    'monthly',
                    (datetime.now() + timedelta(days=30)).isoformat()  # First billing in 30 days
                ))
                
                # Store individual packages in a separate table for detailed tracking
                subscription_id = None
                if db_engine == 'postgresql':
                    subscription_result = self.db_manager.execute_query(conn, 
                        "SELECT subscription_id FROM subscriptions WHERE tenant_id = ? ORDER BY subscription_id DESC LIMIT 1", 
                        (user_id,), fetch='one')
                    subscription_id = subscription_result['subscription_id'] if subscription_result else None
                else:
                    subscription_id = conn.lastrowid
                
                # Create packages table if it doesn't exist
                if db_engine == 'postgresql':
                    self.db_manager.execute_query(conn, """
                        CREATE TABLE IF NOT EXISTS subscription_packages (
                            id SERIAL PRIMARY KEY,
                            subscription_id INTEGER NOT NULL,
                            tenant_id INTEGER NOT NULL,
                            package_tier VARCHAR(50) NOT NULL,
                            package_name VARCHAR(100) NOT NULL,
                            package_price DECIMAL(10,2) NOT NULL,
                            package_description TEXT,
                            purchased BOOLEAN DEFAULT TRUE,
                            assigned BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id),
                            FOREIGN KEY (tenant_id) REFERENCES users (user_id)
                        )
                    """)
                else:
                    self.db_manager.execute_query(conn, """
                        CREATE TABLE IF NOT EXISTS subscription_packages (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            subscription_id INTEGER NOT NULL,
                            tenant_id INTEGER NOT NULL,
                            package_tier TEXT NOT NULL,
                            package_name TEXT NOT NULL,
                            package_price REAL NOT NULL,
                            package_description TEXT,
                            purchased BOOLEAN DEFAULT TRUE,
                            assigned BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (subscription_id) REFERENCES subscriptions (subscription_id),
                            FOREIGN KEY (tenant_id) REFERENCES users (user_id)
                        )
                    """)
                
                # Insert each package
                for package in packages:
                    self.db_manager.execute_query(conn, """
                        INSERT INTO subscription_packages 
                        (subscription_id, tenant_id, package_tier, package_name, package_price, 
                         package_description, purchased, assigned)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        subscription_id,
                        user_id,
                        package['tier'],
                        package['name'],
                        package['price'],
                        package.get('description', ''),
                        True,  # All packages are purchased at creation
                        False  # Not assigned to venues yet
                    ))
                    
                logger.info(f"Created subscription with ID {subscription_id} and {len(packages)} packages")
                
                conn.commit()
                
                # Build response based on what was created
                response_data = {
                    'success': True,
                    'message': 'Tenant created successfully' + (' with assistant manager' if create_assistant else ''),
                    'tenant_id': user_id,
                    'league_manager': {
                        'email': league_manager['email'],
                        'full_name': league_manager['full_name']
                    }
                }
                
                # Add assistant manager to response if created
                if create_assistant:
                    response_data['assistant_manager'] = {
                        'email': assistant_manager['email'],
                        'full_name': assistant_manager['full_name']
                    }
                
                # Add tier info
                response_data['tier'] = tier_info['name']
                response_data['limits'] = tier_info['limits']
                
                logger.info(f"Created new tenant - League Manager: {league_manager['email']}, " + 
                           (f"Assistant Manager: {assistant_manager['email']}, " if create_assistant else "No Assistant, ") +
                           f"Tier: {tier_info['name']}")
                
                self.send_json_response(201, response_data)
                
            finally:
                conn.close()
            
        except Exception as e:
            import traceback
            logger.error(f"Create tenant error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            logger.error(f"Request data: {json.dumps(data, default=str)}")
            self.send_error_response(500, f'Failed to create tenant: {str(e)}')

    def handle_admin_delete_tenant(self, parsed_path):
        """
        DELETE /api/admin/tenants/{tenant_id}
        Delete a tenant and all associated data (super-admin only)
        """
        try:
            logger.info("Starting tenant deletion process...")
            # Require authentication
            requester = self.authenticate_request()
            if not requester:
                self.send_error_response(401, 'Authentication required')
                return
            
            # Only super-admin can delete tenants
            is_super_admin = (requester.get('email') == 'admin@5ivetrackr.com' and 
                             requester.get('user_role') == 'league_manager')
            
            if not is_super_admin:
                self.send_error_response(403, 'Super-admin access required')
                return
            
            # Extract tenant ID from path
            # URL format: /api/admin/tenants/{id}
            # Split: ['', 'api', 'admin', 'tenants', '{id}']
            path_parts = parsed_path.path.split('/')
            if len(path_parts) < 5 or not path_parts[4]:
                self.send_error_response(400, 'Tenant ID required in URL')
                return
                
            tenant_id = path_parts[4]
            
            # Validate tenant_id is a number
            try:
                tenant_id = int(tenant_id)
            except ValueError:
                self.send_error_response(400, f'Invalid tenant ID: {tenant_id}')
                return
                
            logger.info(f"Attempting to delete tenant ID: {tenant_id}")
            
            # Get central auth connection
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                # First, verify the tenant exists
                tenant = self.db_manager.execute_query(conn, """
                    SELECT user_id, email, full_name FROM users 
                    WHERE user_id = ? AND user_role = 'league_manager' AND parent_league_manager_id IS NULL
                """, (tenant_id,), fetch='one')
                
                if not tenant:
                    self.send_error_response(404, 'Tenant not found')
                    return
                
                logger.info(f"Found tenant: {tenant['email']} ({tenant['full_name']})")
                
                # First get the subscription ID for this tenant
                subscription = self.db_manager.execute_query(conn, """
                    SELECT subscription_id FROM subscriptions 
                    WHERE tenant_id = ?
                """, (tenant_id,), fetch='one')
                
                if subscription:
                    # Delete subscription packages first (they reference subscription_id)
                    try:
                        packages_result = self.db_manager.execute_query(conn, """
                            DELETE FROM subscription_packages 
                            WHERE subscription_id = ?
                        """, (subscription['subscription_id'],))
                        logger.info(f"Deleted subscription packages for subscription {subscription['subscription_id']}")
                    except Exception as e:
                        # Table might not exist for older deployments
                        logger.warning(f"Could not delete subscription packages: {e}")
                    
                    # Now delete subscription (references tenant_id)
                    subscription_result = self.db_manager.execute_query(conn, """
                        DELETE FROM subscriptions 
                        WHERE tenant_id = ?
                    """, (tenant_id,))
                    logger.info(f"Deleted subscription for tenant {tenant_id}")
                else:
                    logger.info(f"No subscription found for tenant {tenant_id}")
                
                # Delete subscription addons if they exist
                if subscription:
                    try:
                        addons_result = self.db_manager.execute_query(conn, """
                            DELETE FROM subscription_addons 
                            WHERE subscription_id = ?
                        """, (subscription['subscription_id'],))
                        logger.info(f"Deleted subscription addons for subscription {subscription['subscription_id']}")
                    except Exception as e:
                        # Table might not exist
                        logger.warning(f"Could not delete subscription addons: {e}")
                
                # Delete venues for this tenant
                try:
                    venues_result = self.db_manager.execute_query(conn, """
                        DELETE FROM venues 
                        WHERE tenant_id = ?
                    """, (tenant_id,))
                    logger.info(f"Deleted venues for tenant {tenant_id}")
                except Exception as e:
                    logger.warning(f"Could not delete venues: {e}")
                
                # Delete assistant manager (has foreign key reference to league manager)
                assistant_result = self.db_manager.execute_query(conn, """
                    DELETE FROM users 
                    WHERE parent_league_manager_id = ? AND user_role = 'assistant_manager'
                """, (tenant_id,))
                
                logger.info(f"Deleted assistant manager for tenant {tenant_id}")
                
                # Delete any other users associated with this tenant
                other_users_result = self.db_manager.execute_query(conn, """
                    DELETE FROM users 
                    WHERE parent_league_manager_id = ?
                """, (tenant_id,))
                
                logger.info(f"Deleted other users for tenant {tenant_id}")
                
                # Finally, delete the tenant (league manager)
                tenant_result = self.db_manager.execute_query(conn, """
                    DELETE FROM users 
                    WHERE user_id = ? AND user_role = 'league_manager'
                """, (tenant_id,))
                
                logger.info(f"Deleted tenant {tenant_id}")
                
                # Delete tenant-specific database file if using SQLite
                if db_engine == 'sqlite':
                    tenant_db_path = os.path.join(os.path.dirname(__file__), 'data', f'tenant_{tenant_id}.db')
                    if os.path.exists(tenant_db_path):
                        os.remove(tenant_db_path)
                        logger.info(f"Deleted tenant database file: {tenant_db_path}")
                
                # Commit the transaction
                conn.commit()
                
                self.send_json_response(200, {
                    'status': 'success',
                    'message': f'Tenant {tenant["email"]} ({tenant["full_name"]}) deleted successfully',
                    'deleted_tenant_id': tenant_id
                })
                
            finally:
                conn.close()
            
        except Exception as e:
            import traceback
            logger.error(f"Delete tenant error: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.send_error_response(500, f'Failed to delete tenant: {str(e)}')

    def get_next_tier(self, current_tier_id):
        """Get the next tier for upgrade recommendations"""
        tier_order = ['starter', 'growth', 'pro']
        try:
            current_index = tier_order.index(current_tier_id)
            if current_index < len(tier_order) - 1:
                return tier_order[current_index + 1]
        except ValueError:
            pass
        return None
    
    def compute_addon_cost(self, current_tier_id, addons):
        """Compute total cost of add-ons for a given tier"""
        total_cost = 0
        
        for addon_type, quantity in addons.items():
            if quantity > 0:
                addon_prices = self.ADDON_PRICING.get(addon_type, {})
                price_per_unit = addon_prices.get(current_tier_id, float('inf'))
                
                # Pro tier routes to sales for add-ons
                if current_tier_id == 'pro' and price_per_unit == float('inf'):
                    return float('inf')  # Indicates need for sales consultation
                
                total_cost += quantity * price_per_unit
        
        return total_cost
    
    def would_meet_or_exceed_next_tier_capacity(self, current_tier, addons, next_tier):
        """Check if add-ons would meet or exceed next tier capacity"""
        current_limits = current_tier['limits']
        next_limits = next_tier['limits']
        
        effective_capacity = {
            'pitches': current_limits['pitches'] + addons.get('extra_pitch', 0),
            'referees': current_limits['referees'] + addons.get('extra_referee', 0),
            'divisions': current_limits['divisions'] + addons.get('extra_division', 0),
            'leaguesPerDivision': current_limits['leaguesPerDivision'] + addons.get('extra_lpd', 0),
            'teams': current_limits['teams']  # teams not add-on'd in this model
        }
        
        return (
            effective_capacity['pitches'] >= next_limits['pitches'] or
            effective_capacity['referees'] >= next_limits['referees'] or
            effective_capacity['divisions'] >= next_limits['divisions'] or
            effective_capacity['leaguesPerDivision'] >= next_limits['leaguesPerDivision'] or
            effective_capacity['teams'] >= next_limits['teams']
        )
    
    def quote_with_addons(self, current_tier_id, addons, mode='strict'):
        """Generate pricing quote with add-ons and upgrade recommendations"""
        tier = self.TIER_CONFIG[current_tier_id]
        addon_cost = self.compute_addon_cost(current_tier_id, addons)
        
        # Handle Pro tier or invalid pricing
        if addon_cost == float('inf'):
            return {
                'total_monthly': tier['price'],
                'recommend': 'sales',
                'reason': 'Custom enterprise pricing required',
                'actions': ['contact_sales']
            }
        
        total_monthly = tier['price'] + addon_cost
        
        next_tier_id = self.get_next_tier(current_tier_id)
        if next_tier_id is None:
            return {
                'total_monthly': total_monthly,
                'recommend': 'sales',
                'reason': 'Top tier - custom enterprise available',
                'actions': ['contact_sales']
            }
        
        next_tier = self.TIER_CONFIG[next_tier_id]
        threshold_for_next = next_tier['price'] * self.UPGRADE_THRESHOLD
        
        hits_capacity = self.would_meet_or_exceed_next_tier_capacity(tier, addons, next_tier)
        
        if total_monthly >= threshold_for_next or (mode == 'strict' and hits_capacity):
            return {
                'total_monthly': total_monthly,
                'recommend': 'upgrade',
                'upgrade_to': next_tier_id,
                'compare': {
                    'current_plus_addons': total_monthly,
                    'next_tier_price': next_tier['price'],
                    'savings': total_monthly - next_tier['price']
                },
                'actions': ['one_click_upgrade']
            }
        
        return {
            'total_monthly': total_monthly,
            'recommend': 'stay',
            'notes': 'Add-ons approved under threshold',
            'actions': ['confirm_add_ons'],
            'breakdown': {
                'base_price': tier['price'],
                'addon_cost': addon_cost,
                'next_tier_threshold': threshold_for_next
            }
        }

    def test_pricing_scenarios(self):
        """Test pricing scenarios from requirements"""
        test_cases = [
            # Test case 1: Starter + 2 extra pitches should recommend upgrade
            {
                'name': 'Starter + 2 extra pitches',
                'tier': 'starter',
                'addons': {'extra_pitch': 2},
                'expected_total': 89.99,  # 49.99 + (2*20)
                'expected_recommend': 'upgrade'
            },
            # Test case 2: Starter + 10 extra referees should allow
            {
                'name': 'Starter + 10 extra referees',
                'tier': 'starter',
                'addons': {'extra_referee': 10},
                'expected_total': 69.99,  # 49.99 + (10*2)
                'expected_recommend': 'stay'
            },
            # Test case 3: Growth + 25 extra referees should recommend upgrade
            {
                'name': 'Growth + 25 extra referees',
                'tier': 'growth',
                'addons': {'extra_referee': 25},
                'expected_total': 174.99,  # 99.99 + (25*3)
                'expected_recommend': 'upgrade'
            },
            # Test case 4: Growth + 5 extra pitches should recommend upgrade
            {
                'name': 'Growth + 5 extra pitches',
                'tier': 'growth',
                'addons': {'extra_pitch': 5},
                'expected_total': 224.99,  # 99.99 + (5*25)
                'expected_recommend': 'upgrade'
            },
            # Test case 5: Pro requests add-ons should route to sales
            {
                'name': 'Pro + any add-ons',
                'tier': 'pro',
                'addons': {'extra_pitch': 1},
                'expected_recommend': 'sales'
            }
        ]
        
        results = []
        for case in test_cases:
            quote = self.quote_with_addons(case['tier'], case['addons'])
            
            test_result = {
                'name': case['name'],
                'tier': case['tier'],
                'addons': case['addons'],
                'actual_total': quote.get('total_monthly'),
                'expected_total': case.get('expected_total'),
                'actual_recommend': quote['recommend'],
                'expected_recommend': case['expected_recommend'],
                'passed': quote['recommend'] == case['expected_recommend']
            }
            
            # Check total if expected is provided
            if 'expected_total' in case:
                test_result['total_match'] = abs(quote['total_monthly'] - case['expected_total']) < 0.01
                test_result['passed'] = test_result['passed'] and test_result['total_match']
            
            results.append(test_result)
        
        return results
    
    def handle_pricing_test(self):
        """GET /api/admin/pricing-test - Test pricing scenarios"""
        try:
            results = self.test_pricing_scenarios()
            all_passed = all(result['passed'] for result in results)
            
            self.send_json_response(200, {
                'success': True,
                'all_tests_passed': all_passed,
                'results': results,
                'summary': {
                    'total_tests': len(results),
                    'passed': sum(1 for r in results if r['passed']),
                    'failed': sum(1 for r in results if not r['passed'])
                }
            })
        except Exception as e:
            logger.error(f"Pricing test error: {e}")
            self.send_error_response(500, f'Pricing test failed: {str(e)}')

    def handle_refresh_token(self):
        """POST /api/auth/refresh - Refresh JWT token"""
        self.send_json_response(200, {'success': True, 'message': 'Token refresh not implemented yet'})
    
    def handle_verify_password(self):
        """POST /api/auth/verify-password - Verify user password for sensitive operations"""
        try:
            logger.info("🔐 Starting password verification process")
            # Authenticate the request
            user = self.authenticate_request()
            logger.info(f"🔐 Authentication result: {bool(user)}")
            if user:
                logger.info(f"🔐 Authenticated user: {user.get('email')} (ID: {user.get('user_id')})")
            if not user:
                logger.error("🔐 Authentication failed in password verification")
                return
            
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, 'Request body is required')
                return
                
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            password = data.get('password')
            if not password:
                self.send_error_response(400, 'Password is required')
                return
            
            # Get user from database to verify password
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                user_data = self.db_manager.execute_query(conn, """
                    SELECT password_hash FROM users WHERE user_id = ?
                """, (user['user_id'],), fetch='one')
                
                logger.info(f"🔐 Raw user_data result: {user_data}")
                logger.info(f"🔐 User_data type: {type(user_data)}")
                logger.info(f"🔐 User_data keys: {user_data.keys() if isinstance(user_data, dict) else 'Not a dict'}")
                
                if not user_data:
                    self.send_error_response(404, 'User not found')
                    return
                
                try:
                    stored_hash = user_data['password_hash']
                    logger.info(f"🔐 Successfully extracted stored_hash: {stored_hash}")
                except Exception as e:
                    logger.error(f"🔐 Error accessing password_hash: {e}")
                    logger.error(f"🔐 Available keys: {list(user_data.keys()) if isinstance(user_data, dict) else 'Not a dict'}")
                    self.send_error_response(500, f'Database access error: {e}')
                    return
                provided_hash = hashlib.sha256(password.encode()).hexdigest()
                
                logger.info(f"🔐 Verifying password for user {user['email']}")
                logger.info(f"🔐 Provided hash: {provided_hash}")
                logger.info(f"🔐 Stored hash:   {stored_hash}")
                
                password_valid = provided_hash == stored_hash
                logger.info(f"✅ Password match: {password_valid}")
                
                if password_valid:
                    self.send_json_response(200, {
                        'success': True,
                        'message': 'Password verified successfully'
                    })
                else:
                    self.send_json_response(200, {
                        'success': False,
                        'message': 'Invalid password'
                    })
                    
            finally:
                conn.close()
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON in request body')
        except Exception as e:
            logger.error(f"🔐 UPDATED CODE - Error verifying password: {e}")
            logger.error(f"🔐 Exception type: {type(e)}")
            logger.error(f"🔐 Exception details: {str(e)}")
            import traceback
            logger.error(f"🔐 Full traceback: {traceback.format_exc()}")
            self.send_error_response(500, f'Password verification error: {e}')
    
    def handle_delete_venue_with_recycle(self, parsed_path):
        """DELETE /api/venues/{id}/delete-with-recycle - Delete venue and recycle subscription package"""
        from datetime import datetime, timedelta
        logger.info("🗑️  ENTERED handle_delete_venue_with_recycle method")
        try:
            logger.info("🗑️  STARTING venue deletion with recycle process")
            logger.info(f"🗑️  Parsed path: {parsed_path}")
            logger.info(f"🗑️  Path string: {parsed_path.path}")
            
            # Authenticate the request
            user = self.authenticate_request()
            if not user:
                logger.error("🗑️  Authentication failed")
                return
            
            logger.info(f"🗑️  User authenticated: {user['email']}")
            
            # Extract venue ID from path
            path_parts = parsed_path.path.split('/')
            if len(path_parts) < 4:
                logger.error("🗑️  Invalid venue ID in path")
                self.send_error_response(400, 'Invalid venue ID in path')
                return
            
            venue_id = path_parts[3]  # /api/venues/{id}/delete-with-recycle
            logger.info(f"🗑️  Venue ID to delete: {venue_id}")
            
            # Get tenant ID (use league manager ID, or parent if assistant)
            tenant_id = user.get('parent_league_manager_id') or user.get('user_id')
            logger.info(f"🗑️  Tenant ID: {tenant_id}")
            
            # Parse request body for additional data
            content_length = int(self.headers.get('Content-Length', 0))
            data = {}
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            
            logger.info(f"Deleting venue {venue_id} with package recycling for user {user['email']}")
            
            # Get auth connection (venues are stored in central database)
            conn, db_engine = self.db_manager.get_auth_connection()
            if not conn:
                self.send_error_response(500, 'Database connection failed')
                return
            
            try:
                # Get venue details before deletion
                venue_data = self.db_manager.execute_query(conn, """
                    SELECT v.venue_name, v.package_id, v.subscription_plan
                    FROM venues v
                    WHERE v.venue_id = %s AND v.tenant_id = %s
                """ if db_engine == 'postgresql' else """
                    SELECT v.venue_name, v.package_id, v.subscription_plan
                    FROM venues v
                    WHERE v.venue_id = ? AND v.tenant_id = ?
                """, (venue_id, tenant_id), fetch='one')
                
                logger.info(f"🗑️  Venue data: {venue_data}")
                
                if not venue_data:
                    conn.rollback()
                    self.send_error_response(404, 'Venue not found')
                    return
                
                venue_name = venue_data['venue_name']
                package_id = venue_data['package_id']
                subscription_plan = venue_data['subscription_plan']
                
                # Set default monthly expiry if no expiry date exists
                expires_at = datetime.now() + timedelta(days=30)
                logger.info(f"🗑️  Setting default monthly expiry: {expires_at}")
                
                # Delete all pitches associated with this venue first
                self.db_manager.execute_query(conn, """
                    DELETE FROM pitches WHERE venue_id = %s AND tenant_id = %s
                """ if db_engine == 'postgresql' else """
                    DELETE FROM pitches WHERE venue_id = ? AND tenant_id = ?
                """, (venue_id, tenant_id))
                
                # Delete the venue
                self.db_manager.execute_query(conn, """
                    DELETE FROM venues WHERE venue_id = %s AND tenant_id = %s
                """ if db_engine == 'postgresql' else """
                    DELETE FROM venues WHERE venue_id = ? AND tenant_id = ?
                """, (venue_id, tenant_id))
                
                # Implement package recycling
                if package_id and subscription_plan:
                    try:
                        self.create_available_packages_table_if_not_exists(conn, db_engine)
                        logger.info(f"📦 Recycling package: tenant_id={tenant_id}, package_id={package_id}, plan={subscription_plan}")
                        
                        # Add package to available packages with preserved expiry
                        self.db_manager.execute_query(conn, """
                            INSERT INTO available_packages (tenant_id, package_id, subscription_plan, subscription_tier, expires_at, is_recycled, source_venue_name)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """ if db_engine == 'postgresql' else """
                            INSERT INTO available_packages (tenant_id, package_id, subscription_plan, subscription_tier, expires_at, is_recycled, source_venue_name)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, (
                            tenant_id, 
                            package_id, 
                            subscription_plan, 
                            subscription_plan.lower() if subscription_plan else 'starter',
                            expires_at,
                            True,  # Mark as recycled
                            venue_name
                        ))
                        
                        logger.info(f"✅ Successfully recycled package {package_id} ({subscription_plan}) with expiry {expires_at}")
                        
                        # Verify it was inserted
                        check_result = self.db_manager.execute_query(conn, """
                            SELECT COUNT(*) as count FROM available_packages WHERE package_id = %s AND tenant_id = %s
                        """ if db_engine == 'postgresql' else """
                            SELECT COUNT(*) as count FROM available_packages WHERE package_id = ? AND tenant_id = ?
                        """, (package_id, tenant_id), fetch='one')
                        
                        logger.info(f"📊 Verification: Found {check_result['count']} available packages with package_id={package_id}")
                        
                    except Exception as e:
                        logger.error(f"❌ Error recycling package: {e}")
                        logger.error(f"Details: tenant_id={tenant_id}, package_id={package_id}, plan={subscription_plan}, expires_at={expires_at}")
                        raise
                else:
                    logger.info(f"⚠️ No package to recycle: package_id={package_id}, subscription_plan={subscription_plan}")
                
                # Commit transaction
                conn.commit()
                
                logger.info(f"Successfully deleted venue {venue_name} and recycled subscription package")
                
                self.send_json_response(200, {
                    'success': True,
                    'message': f'Venue "{venue_name}" deleted successfully',
                    'package_recycled': bool(package_id),
                    'package_details': {
                        'package_id': package_id,
                        'subscription_plan': subscription_plan,
                        'expires_at': expires_at.isoformat() if expires_at else None
                    } if package_id else None
                })
                
            except Exception as e:
                conn.rollback()
                logger.error(f"Error during venue deletion with recycling: {e}")
                raise
            finally:
                conn.close()
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON in request body')
        except Exception as e:
            logger.error(f"🗑️  EXCEPTION in venue deletion: {e}")
            import traceback
            logger.error(f"🗑️  Full traceback: {traceback.format_exc()}")
            self.send_error_response(500, 'Failed to delete venue')
        
        logger.info("🗑️  EXITING handle_delete_venue_with_recycle method")
    
    def create_available_packages_table_if_not_exists(self, conn, db_engine):
        """Create available_packages table for recycled subscription packages"""
        try:
            self.db_manager.execute_query(conn, """
                CREATE TABLE IF NOT EXISTS available_packages (
                    package_id TEXT PRIMARY KEY,
                    tenant_id INTEGER NOT NULL,
                    subscription_plan TEXT NOT NULL,
                    subscription_tier TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_recycled BOOLEAN DEFAULT FALSE,
                    source_venue_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """ if db_engine == 'postgresql' else """
                CREATE TABLE IF NOT EXISTS available_packages (
                    package_id TEXT PRIMARY KEY,
                    tenant_id INTEGER NOT NULL,
                    subscription_plan TEXT NOT NULL,
                    subscription_tier TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    is_recycled BOOLEAN DEFAULT 0,
                    source_venue_name TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            logger.info("📦 Available packages table created/verified")
        except Exception as e:
            logger.error(f"Error creating available_packages table: {e}")
            raise
    
    def invalidate_refresh_tokens(self, user_id):
        """Invalidate all refresh tokens for a user"""
        try:
            conn, db_engine = self.db_manager.get_auth_connection()
            
            try:
                self.db_manager.execute_query(conn, """
                    UPDATE refresh_tokens 
                    SET is_active = FALSE 
                    WHERE user_id = ?
                """, (user_id,))
                conn.commit()
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error invalidating refresh tokens: {e}")

    def handle_get_stripe_config(self):
        """GET /api/subscriptions/config - Get Stripe publishable key"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            self.send_json_response({
                'publishable_key': STRIPE_PUBLISHABLE_KEY
            })
            
        except Exception as e:
            logger.error(f"Error getting Stripe config: {e}")
            self.send_error_response(500, 'Failed to get Stripe configuration')

    def handle_get_stripe_config_public(self):
        """GET /api/signup/stripe-config - Get Stripe publishable key (public endpoint)"""
        try:
            self.send_json_response(200, {
                'publishable_key': STRIPE_PUBLISHABLE_KEY,
                'success': True
            })
            
        except Exception as e:
            logger.error(f"Error getting public Stripe config: {e}")
            self.send_error_response(500, 'Failed to get Stripe configuration')

    def handle_check_signup_status(self):
        """GET /api/signup/check-status?email=xxx - Check if account has been created after payment"""
        try:
            # Parse query parameters
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            email = query_params.get('email', [None])[0]
            
            if not email:
                self.send_error_response(400, 'Email parameter is required')
                return
            
            # Check if user account exists and is active
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                user_result = self.db_manager.execute_query(
                    conn,
                    "SELECT user_id, is_active, created_at FROM users WHERE email = ?",
                    (email,),
                    fetch='one'
                )
                
                if user_result:
                    # Account exists - check status
                    account_created = True
                    is_active = bool(user_result['is_active'])
                    
                    self.send_json_response(200, {
                        'account_created': account_created,
                        'is_active': is_active,
                        'subscription_status': 'active' if is_active else 'inactive',
                        'plan_name': 'Subscription Plan',
                        'message': 'Account found' if is_active else 'Account exists but is not active',
                        'success': True
                    })
                else:
                    # Account doesn't exist yet
                    self.send_json_response(200, {
                        'account_created': False,
                        'is_active': False,
                        'subscription_status': 'pending',
                        'message': 'Account not created yet - payment may be processing',
                        'success': True
                    })
            finally:
                conn.close()
                    
        except Exception as e:
            logger.error(f"Error checking signup status: {e}")
            self.send_error_response(500, 'Failed to check signup status')

    def handle_simulate_webhook(self):
        """GET /api/signup/simulate-webhook?session_id=xxx - Simulate webhook for local testing"""
        try:
            # Parse query parameters
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            session_id = query_params.get('session_id', [None])[0]
            
            if not session_id:
                self.send_error_response(400, 'session_id parameter is required')
                return
            
            # Retrieve the checkout session from Stripe
            try:
                checkout_session = stripe.checkout.Session.retrieve(session_id)
                
                if checkout_session.payment_status == 'paid':
                    # Simulate the webhook call
                    logger.info(f"Simulating webhook for session {session_id}")
                    self.handle_checkout_session_completed(checkout_session)
                    
                    # Extract plan info from metadata
                    metadata = checkout_session.get('metadata', {})
                    plan = metadata.get('plan', 'starter')
                    user_email = metadata.get('email')  # Use signup form email, not Stripe auto-filled
                    
                    # Calculate next billing date (30 days from now for new subscriptions)
                    from datetime import datetime, timedelta
                    next_billing = (datetime.now() + timedelta(days=30)).isoformat()
                    
                    self.send_json_response(200, {
                        'success': True,
                        'message': f'Account created for {user_email}',
                        'session_id': session_id,
                        'payment_status': checkout_session.payment_status,
                        'plan': plan,
                        'next_billing_date': next_billing,
                        'email': user_email
                    })
                else:
                    self.send_error_response(400, f'Payment not completed. Status: {checkout_session.payment_status}')
                    
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error retrieving session: {str(e)}")
                self.send_error_response(400, f'Failed to retrieve session: {str(e)}')
                    
        except Exception as e:
            logger.error(f"Error simulating webhook: {e}")
            self.send_error_response(500, 'Failed to simulate webhook')

    def handle_create_checkout_session(self):
        """POST /api/subscriptions/create-checkout-session - Create Stripe Checkout Session for add-ons"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return

            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            request_body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(request_body)
            
            venue_id = data.get('venue_id')
            add_ons = data.get('add_ons', {})  # {'extra_pitches': 2, 'extra_referees': 5}
            
            if not venue_id:
                self.send_error_response(400, 'Venue ID required')
                return
                
            # Get venue details for context
            db = self.get_database_connection(user['tenant_id'])
            cursor = db.cursor()
            cursor.execute("SELECT name, subscription_plan FROM venues WHERE id = ?", (venue_id,))
            venue = cursor.fetchone()
            
            if not venue:
                self.send_error_response(404, 'Venue not found')
                return
                
            # Build line items using Stripe Price IDs
            line_items = []
            
            for addon_type, quantity in add_ons.items():
                if quantity > 0 and addon_type in STRIPE_PRICE_IDS:
                    price_id = STRIPE_PRICE_IDS[addon_type]
                    if price_id and not price_id.startswith('price_placeholder'):
                        line_items.append({
                            'price': price_id,
                            'quantity': quantity,
                        })
                    else:
                        logger.warning(f"No valid Stripe Price ID configured for {addon_type}")
            
            if not line_items:
                self.send_error_response(400, 'No valid add-ons specified or Stripe Price IDs not configured')
                return
                
            # Create Stripe Checkout Session
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=line_items,
                mode='subscription',
                success_url=f'{self.get_base_url()}/venues?session_id={{CHECKOUT_SESSION_ID}}',
                cancel_url=f'{self.get_base_url()}/venues',
                metadata={
                    'venue_id': venue_id,
                    'tenant_id': user['tenant_id'],
                    'user_id': user['user_id'],
                    'add_ons': json.dumps(add_ons)
                }
            )
            
            self.send_json_response({
                'checkout_url': session.url,
                'session_id': session.id
            })
            
        except Exception as e:
            logger.error(f"Error creating checkout session: {e}")
            self.send_error_response(500, 'Failed to create checkout session')

    def handle_modify_subscription(self):
        """POST /api/subscriptions/modify-subscription - Modify existing subscription (if needed)"""
        try:
            user = self.authenticate_request()
            if not user:
                self.send_error_response(401, 'Authentication required')
                return
            
            # This endpoint can be used for subscription modifications that don't require checkout
            # For now, return success - extend as needed
            self.send_json_response({
                'status': 'success',
                'message': 'Subscription modification endpoint ready'
            })
            
        except Exception as e:
            logger.error(f"Error modifying subscription: {e}")
            self.send_error_response(500, 'Failed to modify subscription')

    def handle_stripe_webhook(self):
        """POST /api/webhooks/stripe - Handle Stripe webhook events"""
        try:
            # Get the raw body for signature verification
            content_length = int(self.headers.get('Content-Length', 0))
            payload = self.rfile.read(content_length)
            sig_header = self.headers.get('Stripe-Signature')
            
            # Verify webhook signature
            event = None
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            except ValueError:
                logger.error("Invalid payload in Stripe webhook")
                self.send_error_response(400, 'Invalid payload')
                return
            except stripe.error.SignatureVerificationError:
                logger.error("Invalid signature in Stripe webhook")
                self.send_error_response(400, 'Invalid signature')
                return
            
            # Handle the event
            if event['type'] == 'checkout.session.completed':
                self.handle_checkout_session_completed(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                self.handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                self.handle_subscription_deleted(event['data']['object'])
            elif event['type'] == 'invoice.payment_succeeded':
                self.handle_payment_succeeded(event['data']['object'])
            else:
                logger.info(f"Unhandled Stripe event type: {event['type']}")
            
            self.send_json_response({'status': 'success'})
            
        except Exception as e:
            logger.error(f"Error handling Stripe webhook: {e}")
            self.send_error_response(500, 'Webhook handling failed')

    def handle_checkout_session_completed(self, session):
        """Handle successful checkout session completion - create user account after payment"""
        try:
            metadata = session.get('metadata', {})
            
            # Check if this is a signup flow
            if 'email' in metadata and 'password_hash' in metadata:
                self.create_tenant_after_payment(session)
            else:
                # Handle add-ons checkout for existing users
                venue_id = metadata.get('venue_id')
                tenant_id = metadata.get('tenant_id')
                add_ons = json.loads(metadata.get('add_ons', '{}'))
                
                if venue_id and tenant_id:
                    # Update venue with new add-ons
                    db = self.get_database_connection(tenant_id)
                cursor = db.cursor()
                
                # Store add-on information - you may want to create a separate add_ons table
                # For now, we'll log the successful purchase
                logger.info(f"Add-ons purchased for venue {venue_id}: {add_ons}")
                logger.info(f"Stripe session completed: {session['id']}")
                
                # You can extend this to update the database with add-on details
                # cursor.execute("UPDATE venues SET add_ons = ? WHERE id = ?", 
                #               (json.dumps(add_ons), venue_id))
                # db.commit()
                
        except Exception as e:
            logger.error(f"Error handling checkout session completion: {e}")

    def handle_subscription_updated(self, subscription):
        """Handle subscription updates from Stripe"""
        try:
            subscription_id = subscription['id']
            status = subscription['status']
            
            logger.info(f"Subscription updated: {subscription_id} - Status: {status}")
            
            # Update subscription status in database
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                # Find the tenant with this subscription ID
                tenant_result = self.db_manager.execute_query(
                    conn,
                    "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = %s" if self.db_manager.db_engine == 'postgresql' else 
                    "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = ?",
                    (subscription_id,),
                    fetch='one'
                )
                
                if tenant_result:
                    tenant_id = tenant_result['tenant_id']
                    
                    # Update subscription status
                    self.db_manager.execute_query(
                        conn,
                        "UPDATE subscriptions SET status = %s WHERE stripe_subscription_id = %s" if self.db_manager.db_engine == 'postgresql' else
                        "UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?",
                        (status, subscription_id)
                    )
                    
                    # If subscription is cancelled/unpaid, deactivate user account
                    if status in ['canceled', 'unpaid', 'past_due']:
                        self.db_manager.execute_query(
                            conn,
                            "UPDATE users SET is_active = FALSE WHERE user_id = %s" if self.db_manager.db_engine == 'postgresql' else
                            "UPDATE users SET is_active = 0 WHERE user_id = ?",
                            (tenant_id,)
                        )
                        logger.info(f"Deactivated user account for tenant {tenant_id} due to subscription status: {status}")
                    elif status == 'active':
                        # Reactivate account if subscription becomes active again
                        self.db_manager.execute_query(
                            conn,
                            "UPDATE users SET is_active = TRUE WHERE user_id = %s" if self.db_manager.db_engine == 'postgresql' else
                            "UPDATE users SET is_active = 1 WHERE user_id = ?",
                            (tenant_id,)
                        )
                        logger.info(f"Reactivated user account for tenant {tenant_id} - subscription active")
            finally:
                conn.close()
                        
        except Exception as e:
            logger.error(f"Error handling subscription update: {e}")

    def handle_subscription_deleted(self, subscription):
        """Handle subscription cancellation from Stripe"""
        try:
            subscription_id = subscription['id']
            
            logger.info(f"Subscription deleted: {subscription_id}")
            
            # Update subscription status and deactivate account
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                # Find and update the subscription
                tenant_result = self.db_manager.execute_query(
                    conn,
                    "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = %s" if self.db_manager.db_engine == 'postgresql' else 
                    "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = ?",
                    (subscription_id,),
                    fetch='one'
                )
                
                if tenant_result:
                    tenant_id = tenant_result['tenant_id']
                    
                    # Update subscription status
                    self.db_manager.execute_query(
                        conn,
                        "UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = %s" if self.db_manager.db_engine == 'postgresql' else
                        "UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?",
                        (subscription_id,)
                    )
                    
                    # Deactivate user account
                    self.db_manager.execute_query(
                        conn,
                        "UPDATE users SET is_active = FALSE WHERE user_id = %s" if self.db_manager.db_engine == 'postgresql' else
                        "UPDATE users SET is_active = 0 WHERE user_id = ?",
                        (tenant_id,)
                    )
                    
                    logger.info(f"Deactivated account for tenant {tenant_id} - subscription cancelled")
            finally:
                conn.close()
                        
        except Exception as e:
            logger.error(f"Error handling subscription deletion: {e}")

    def handle_payment_succeeded(self, invoice):
        """Handle successful payment"""
        try:
            subscription_id = invoice.get('subscription')
            
            logger.info(f"Payment succeeded: {invoice['id']} for subscription: {subscription_id}")
            
            if subscription_id:
                # Ensure account is active for successful payments
                conn, db_engine = self.db_manager.get_auth_connection()
                try:
                    tenant_result = self.db_manager.execute_query(
                        conn,
                        "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = %s" if self.db_manager.db_engine == 'postgresql' else 
                        "SELECT tenant_id FROM subscriptions WHERE stripe_subscription_id = ?",
                        (subscription_id,),
                        fetch='one'
                    )
                    
                    if tenant_result:
                        tenant_id = tenant_result['tenant_id']
                        
                        # Ensure user account is active
                        self.db_manager.execute_query(
                            conn,
                            "UPDATE users SET is_active = TRUE WHERE user_id = %s" if self.db_manager.db_engine == 'postgresql' else
                            "UPDATE users SET is_active = 1 WHERE user_id = ?",
                            (tenant_id,)
                        )
                        
                        logger.info(f"Ensured account is active for tenant {tenant_id} after successful payment")
                finally:
                    conn.close()
                        
        except Exception as e:
            logger.error(f"Error handling payment success: {e}")

    def handle_signup_create_tenant(self):
        """
        POST /api/signup/create-tenant - Create new tenant and redirect to Stripe Checkout
        Public endpoint - no authentication required
        """
        try:
            # Get signup data
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            signup_data = json.loads(post_data.decode('utf-8'))
            
            # Validate required fields
            required_fields = ['firstName', 'lastName', 'email', 'password', 'plan', 'stripePriceId', 'venueName', 'venueAddress', 'city', 'postcode']
            for field in required_fields:
                if field not in signup_data:
                    self.send_error_response(400, f'Missing required field: {field}')
                    return
            
            # Hash the password
            import hashlib
            import uuid
            password_hash = hashlib.sha256(signup_data['password'].encode()).hexdigest()
            
            # Check if email already exists
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                existing_user = self.db_manager.execute_query(
                    conn, 
                    "SELECT user_id FROM users WHERE email = ?",
                    (signup_data['email'],),
                    fetch='one'
                )
                
                if existing_user:
                    self.send_error_response(400, 'Email already registered')
                    return
            finally:
                conn.close()
            
            # Generate a unique session ID for this signup
            session_id = str(uuid.uuid4())
            
            # Store signup data temporarily (in a real implementation, use Redis or similar)
            # For now, we'll pass it through Stripe metadata
            try:
                # Create Stripe Checkout Session
                checkout_session = stripe.checkout.Session.create(
                    payment_method_types=['card'],
                    line_items=[{
                        'price': signup_data['stripePriceId'],
                        'quantity': 1,
                    }],
                    mode='subscription',
                    success_url=f"{os.environ.get('BASE_URL', 'http://localhost:8080')}/website/email-verification.html?session_id={{CHECKOUT_SESSION_ID}}",
                    cancel_url=f"{os.environ.get('BASE_URL', 'http://localhost:8080')}/signup",
                    customer_email=signup_data['email'],  # Explicitly set customer email from signup form
                    metadata={
                        'session_id': session_id,
                        'first_name': signup_data['firstName'],
                        'last_name': signup_data['lastName'],
                        'email': signup_data['email'],  # Store signup form email in metadata (primary source)
                        'password_hash': password_hash,
                        'phone': signup_data.get('phone', ''),
                        'plan': signup_data['plan'],
                        'venue_name': signup_data['venueName'],
                        'venue_address': signup_data['venueAddress'],
                        'city': signup_data['city'],
                        'postcode': signup_data['postcode'],
                        'pitch_count': signup_data.get('pitchCount', '1')
                    }
                )
                
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error during signup: {str(e)}")
                self.send_error_response(400, f'Payment setup failed: {str(e)}')
                return
                
            # Return checkout URL for redirect
            self.send_json_response(200, {
                'success': True,
                'checkout_url': checkout_session.url,
                'session_id': checkout_session.id
            })
            
            logger.info(f"Checkout session created for signup: {signup_data['email']} - Plan: {signup_data['plan']}")
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON data')
        except Exception as e:
            logger.error(f"Error in signup create tenant: {str(e)}")
            self.send_error_response(500, f'Signup failed: {str(e)}')
    
    def create_tenant_after_payment(self, session):
        """Create tenant account after successful Stripe payment"""
        try:
            metadata = session.get('metadata', {})
            subscription_id = session.get('subscription')
            customer_id = session.get('customer')
            
            # Verify subscription is active before creating account
            if not subscription_id:
                logger.error("No subscription ID in checkout session")
                return
            
            # Retrieve and validate subscription from Stripe
            try:
                subscription = stripe.Subscription.retrieve(subscription_id)
                if subscription.status not in ['active', 'trialing']:
                    logger.error(f"Subscription {subscription_id} is not active. Status: {subscription.status}")
                    return
                
                logger.info(f"Verified active subscription: {subscription_id} with status: {subscription.status}")
            except stripe.error.StripeError as e:
                logger.error(f"Failed to verify subscription {subscription_id}: {str(e)}")
                return
            
            # Extract signup data from metadata
            email = metadata.get('email')
            password_hash = metadata.get('password_hash')
            first_name = metadata.get('first_name')
            last_name = metadata.get('last_name')
            phone = metadata.get('phone', '')
            plan = metadata.get('plan')
            venue_name = metadata.get('venue_name')
            venue_address = metadata.get('venue_address')
            city = metadata.get('city')
            postcode = metadata.get('postcode')
            pitch_count = metadata.get('pitch_count', '1')
            
            # Get plan limits
            plan_limits = {
                'starter': {
                    'pitches_limit': 1,
                    'referees_limit': 10,
                    'divisions_limit': 1,
                    'leagues_per_division_limit': 1,
                    'teams_limit': 15,
                    'venue_limit': 1,
                    'base_price': 49.99
                },
                'growth': {
                    'pitches_limit': 3,
                    'referees_limit': 25,
                    'divisions_limit': 5,
                    'leagues_per_division_limit': 3,
                    'teams_limit': 150,
                    'venue_limit': 1,
                    'base_price': 99.99
                },
                'pro': {
                    'pitches_limit': 8,
                    'referees_limit': 50,
                    'divisions_limit': 10,
                    'leagues_per_division_limit': 5,
                    'teams_limit': 500,
                    'venue_limit': 1,
                    'base_price': 179.99
                }
            }
            
            limits = plan_limits.get(plan, plan_limits['starter'])
            
            # Create tenant in database
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                # Create user account (tenant manager)
                if self.db_manager.db_engine == 'postgresql':
                    user_result = self.db_manager.execute_query(
                        conn,
                        """
                        INSERT INTO users (username, email, password_hash, full_name, contact_number, user_role, is_active, email_verified)
                        VALUES (%s, %s, %s, %s, %s, 'league_manager', FALSE, FALSE)
                        RETURNING user_id
                        """,
                        (
                            email.split('@')[0],  # Use email prefix as username
                            email,
                            password_hash,
                            f"{first_name} {last_name}",
                            phone[:20] if phone else ""
                        ),
                        fetch='one'
                    )
                    user_id = user_result['user_id']
                else:
                    # For SQLite, we need to use cursor directly to get lastrowid
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        INSERT INTO users (username, email, password_hash, full_name, contact_number, user_role, is_active, email_verified)
                        VALUES (?, ?, ?, ?, ?, 'league_manager', 0, 0)
                        """,
                        (
                            email.split('@')[0],  # Use email prefix as username
                            email,
                            password_hash,
                            f"{first_name} {last_name}",
                            phone[:20] if phone else ""
                        )
                    )
                    user_id = cursor.lastrowid
                    conn.commit()
                
                # Create subscription record
                self.db_manager.execute_query(
                    conn,
                    """
                    INSERT INTO subscriptions (
                        tenant_id, tier_id, plan_name, base_price,
                        pitches_limit, referees_limit, divisions_limit, 
                        leagues_per_division_limit, teams_limit, venue_limit,
                        status, billing_cycle, stripe_subscription_id, stripe_customer_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active', 'monthly', %s, %s)
                    """ if self.db_manager.db_engine == 'postgresql' else """
                    INSERT INTO subscriptions (
                        tenant_id, tier_id, plan_name, base_price,
                        pitches_limit, referees_limit, divisions_limit, 
                        leagues_per_division_limit, teams_limit, venue_limit,
                        status, billing_cycle, stripe_subscription_id, stripe_customer_id
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'monthly', ?, ?)
                    """,
                    (
                        user_id,
                        plan,
                        f"{plan.title()} Plan",
                        limits['base_price'],
                        limits['pitches_limit'],
                        limits['referees_limit'],
                        limits['divisions_limit'],
                        limits['leagues_per_division_limit'],
                        limits['teams_limit'],
                        limits['venue_limit'],
                        subscription_id,
                        customer_id
                    )
                )
                
                # Create default venue
                self.db_manager.execute_query(
                    conn,
                    """
                    INSERT INTO venues (
                        tenant_id, venue_name, address, pitch_count, max_pitches, 
                        is_active, subscription_plan, subscription_tier
                    )
                    VALUES (%s, %s, %s, 0, %s, %s, %s, %s)
                    """ if self.db_manager.db_engine == 'postgresql' else """
                    INSERT INTO venues (
                        tenant_id, venue_name, address, pitch_count, max_pitches, 
                        is_active, subscription_plan, subscription_tier
                    )
                    VALUES (?, ?, ?, 0, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        venue_name,
                        f"{venue_address}, {city}, {postcode}",
                        limits['pitches_limit'],
                        True if self.db_manager.db_engine == 'postgresql' else 1,
                        f"{plan.title()} Plan",
                        plan
                    )
                )
                
                logger.info(f"Tenant created successfully after payment: {email} - Plan: {plan} - User ID: {user_id}")
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error creating tenant after payment: {str(e)}")

    def handle_send_verification_email(self):
        """POST /api/auth/send-verification-email - Send email verification"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            user_id = data.get('user_id')
            email = data.get('email')
            
            if not user_id or not email:
                self.send_error_response(400, 'User ID and email are required')
                return
            
            # Generate verification token
            verification_token = secrets.token_urlsafe(32)
            token_expires = datetime.now() + timedelta(hours=24)  # Token expires in 24 hours
            
            # Update user with verification token
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                self.db_manager.execute_query(conn, """
                    UPDATE users 
                    SET verification_token = ?, verification_token_expires = ?
                    WHERE user_id = ? AND email = ?
                """, (verification_token, token_expires, user_id, email))
                
                conn.commit()
                
                # For demo purposes, we'll log the verification link instead of sending email
                # In production, you would integrate with an email service like SendGrid, AWS SES, etc.
                base_url = self.get_base_url()
                verification_link = f"{base_url}/api/auth/verify-email?token={verification_token}"
                
                logger.info(f"📧 Verification email would be sent to {email}")
                logger.info(f"🔗 Verification link: {verification_link}")
                
                # Simulate email sending delay
                import time
                time.sleep(1)
                
                self.send_json_response({
                    'success': True,
                    'message': 'Verification email sent successfully'
                })
                
            finally:
                conn.close()
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON')
        except Exception as e:
            logger.error(f"Error sending verification email: {e}")
            self.send_error_response(500, 'Failed to send verification email')
    
    def handle_verify_email(self):
        """GET/POST /api/auth/verify-email - Verify email with token"""
        try:
            # Handle both GET (with query param) and POST (with JSON body)
            if self.command == 'GET':
                query_params = self.parse_query_params()
                token = query_params.get('token', [None])[0]
            else:  # POST
                content_length = int(self.headers.get('Content-Length', 0))
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                token = data.get('token')
            
            if not token:
                self.send_error_response(400, 'Verification token is required')
                return
            
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                # Find user with this token and check expiry
                user = self.db_manager.execute_query(conn, """
                    SELECT user_id, email, verification_token_expires
                    FROM users 
                    WHERE verification_token = ? AND verification_token_expires > ?
                """, (token, datetime.now()), fetch='one')
                
                if not user:
                    self.send_error_response(400, 'Invalid or expired verification token')
                    return
                
                # Mark email as verified and clear token
                self.db_manager.execute_query(conn, """
                    UPDATE users 
                    SET email_verified = ?, verification_token = NULL, verification_token_expires = NULL
                    WHERE user_id = ?
                """, (True, user['user_id']))
                
                conn.commit()
                
                logger.info(f"✅ Email verified for user: {user['email']} (ID: {user['user_id']})")
                
                if self.command == 'GET':
                    # Redirect to success page for GET requests (email link clicks)
                    self.send_response(302)
                    self.send_header('Location', f"{self.get_base_url()}/website/email-verification.html?verified=true")
                    self.end_headers()
                else:
                    # JSON response for POST requests
                    self.send_json_response({
                        'success': True,
                        'message': 'Email verified successfully'
                    })
                
            finally:
                conn.close()
                
        except json.JSONDecodeError:
            self.send_error_response(400, 'Invalid JSON')
        except Exception as e:
            logger.error(f"Error verifying email: {e}")
            self.send_error_response(500, 'Email verification failed')
    
    def handle_check_verification_status(self):
        """GET /api/auth/check-verification-status?user_id=xxx - Check if user's email is verified"""
        try:
            query_params = self.parse_query_params()
            user_id = query_params.get('user_id', [None])[0]
            
            if not user_id:
                self.send_error_response(400, 'User ID parameter is required')
                return
            
            conn, db_engine = self.db_manager.get_auth_connection()
            try:
                user = self.db_manager.execute_query(conn, """
                    SELECT email_verified
                    FROM users 
                    WHERE user_id = ?
                """, (user_id,), fetch='one')
                
                if not user:
                    self.send_error_response(404, 'User not found')
                    return
                
                self.send_json_response({
                    'success': True,
                    'verified': bool(user['email_verified'])
                })
                
            finally:
                conn.close()
                
        except Exception as e:
            logger.error(f"Error checking verification status: {e}")
            self.send_error_response(500, 'Failed to check verification status')

    def handle_get_user_from_session(self):
        """GET /api/auth/get-user-from-session?session_id=xxx - Get user info from Stripe session"""
        try:
            query_params = self.parse_query_params()
            session_id = query_params.get('session_id', [None])[0]
            
            if not session_id:
                self.send_error_response(400, 'Session ID parameter is required')
                return
            
            # Get session from Stripe
            try:
                checkout_session = stripe.checkout.Session.retrieve(session_id)
                metadata = checkout_session.get('metadata', {})
                email = metadata.get('email')
                
                if not email:
                    self.send_error_response(400, 'No email found in session metadata')
                    return
                
                # Get user from database
                conn, db_engine = self.db_manager.get_auth_connection()
                try:
                    user = self.db_manager.execute_query(conn, """
                        SELECT user_id, email, full_name, email_verified
                        FROM users 
                        WHERE email = ?
                    """, (email,), fetch='one')
                    
                    if not user:
                        self.send_error_response(404, 'User not found')
                        return
                    
                    self.send_json_response({
                        'success': True,
                        'user': {
                            'user_id': user['user_id'],
                            'email': user['email'],
                            'full_name': user['full_name'],
                            'email_verified': bool(user['email_verified'])
                        }
                    })
                    
                finally:
                    conn.close()
                    
            except stripe.error.StripeError as e:
                logger.error(f"Stripe error: {e}")
                self.send_error_response(400, 'Invalid session ID')
                
        except Exception as e:
            logger.error(f"Error getting user from session: {e}")
            self.send_error_response(500, 'Failed to get user information')

    def get_base_url(self):
        """Get the base URL for redirects"""
        # In production, use environment variable or detect from headers
        return os.environ.get('BASE_URL', 'http://localhost:8080')


def run_server(port=8002):
    """Run the 5ive Trackr API server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, FiveTrackrAPIHandler)
    
    logger.info(f"🚀 5ive Trackr API Server starting on port {port}")
    logger.info(f"📁 Data directory: {os.path.join(os.path.dirname(__file__), 'data')}")
    logger.info(f"🌐 Webapp directory: {os.path.join(os.path.dirname(os.path.dirname(__file__)))}")
    logger.info(f"🔐 JWT Secret generated: {'*' * 20}")
    logger.info("✅ Server ready - compliant with .github specifications")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("🛑 Shutting down server...")
        httpd.shutdown()


if __name__ == '__main__':
    import sys
    import os
    
    # Get port from command line, environment variable, or default
    port = 8002  # Default port
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
            logger.info(f"Using port from command line: {port}")
        except ValueError:
            logger.warning(f"Invalid port in command line: {sys.argv[1]}, using default: {port}")
    elif 'PORT' in os.environ:
        try:
            port = int(os.environ['PORT'])
            logger.info(f"Using port from environment: {port}")
        except ValueError:
            logger.warning(f"Invalid PORT environment variable: {os.environ['PORT']}, using default: {port}")
    else:
        logger.info(f"Using default port: {port}")
    
    # Ensure port is valid
    if not (1024 <= port <= 65535):
        logger.error(f"Invalid port {port}, must be between 1024-65535")
        sys.exit(1)
    
    logger.info(f"🚀 Starting 5ive Trackr API Server on port {port}")
    run_server(port)
