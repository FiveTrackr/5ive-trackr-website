#!/usr/bin/env python3
"""
5ive Trackr - Main Application Entry Point
This file serves as the entry point for DigitalOcean App Platform deployment.
"""

import os
import sys
from http.server import HTTPServer

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the server handler
from api.server import FiveTrackrAPIHandler, run_server

# WSGI application for gunicorn (if needed)
def application(environ, start_response):
    """WSGI application entry point (not used with current HTTP server)"""
    start_response('200 OK', [('Content-Type', 'text/plain')])
    return [b'5ive Trackr WSGI not implemented - use direct server instead']

# Main entry point for direct execution
if __name__ == "__main__":
    # Get port from environment variable (DigitalOcean sets this)
    port = int(os.environ.get('PORT', 8000))
    
    print(f"🚀 5ive Trackr starting on port {port}")
    print("📡 Server: Python 3.11 with SQLite database")
    print("🌐 Environment: DigitalOcean App Platform")
    
    # Run the server
    run_server(port=port)
