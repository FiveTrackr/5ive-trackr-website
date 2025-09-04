#!/usr/bin/env python3
"""
5ive Trackr Web Application Server
Serves static files and handles API endpoints for the webapp
"""

import json
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse
import sys
import mimetypes

class WebAppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the directory to serve files from (webapp directory)
        webapp_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)))
        super().__init__(*args, directory=webapp_dir, **kwargs)
    
    def do_POST(self):
        """Handle POST requests for saving data"""
        try:
            # Parse the URL
            parsed_path = urlparse(self.path)
            
            # Check if this is a data save request
            if parsed_path.path.startswith('/data/'):
                self.handle_data_save(parsed_path.path)
            else:
                self.send_error(404, "Not Found")
                
        except Exception as e:
            print(f"Error handling POST: {e}")
            self.send_error(500, "Internal Server Error")
    
    def handle_data_save(self, path):
        """Save JSON data to file"""
        try:
            # Get content length
            content_length = int(self.headers['Content-Length'])
            
            # Read the POST data
            post_data = self.rfile.read(content_length)
            
            # Parse JSON
            data = json.loads(post_data.decode('utf-8'))
            
            # Determine file path
            file_name = path.replace('/data/', '')
            file_path = os.path.join('data', file_name)
            
            # Ensure data directory exists
            os.makedirs('data', exist_ok=True)
            
            # Write data to file
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {'success': True, 'message': f'Data saved to {file_name}'}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
            print(f"Data saved to: {file_path}")
            
        except Exception as e:
            print(f"Error saving data: {e}")
            self.send_error(500, f"Error saving data: {str(e)}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def end_headers(self):
        # Add CORS headers to all responses
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

if __name__ == '__main__':
    # Get port from command line argument or default to 8000
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, DataHandler)
    
    print(f"5ive Trackr Data Server running on port {port}")
    print(f"Serving files from: {os.getcwd()}")
    print(f"Data will be saved to: {os.path.join(os.getcwd(), 'data')}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()
