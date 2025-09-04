#!/usr/bin/env python3
"""
5ive Trackr Data Storage API
Simple file-based data persistence for user data
"""

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
import threading
import time

class DataStorageHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        super().__init__(*args, **kwargs)
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests for loading data"""
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            
            if parsed_path.path == '/api/load-data':
                user_id = query_params.get('userId', [None])[0]
                data_type = query_params.get('dataType', [None])[0]
                
                if not user_id or not data_type:
                    self.send_error_response(400, 'Missing userId or dataType')
                    return
                
                data = self.load_user_data(user_id, data_type)
                self.send_json_response(200, {'success': True, 'data': data})
            
            elif parsed_path.path == '/api/load-all-data':
                user_id = query_params.get('userId', [None])[0]
                
                if not user_id:
                    self.send_error_response(400, 'Missing userId')
                    return
                
                data = self.load_all_user_data(user_id)
                self.send_json_response(200, {'success': True, 'data': data})
            
            else:
                self.send_error_response(404, 'Endpoint not found')
        
        except Exception as e:
            self.send_error_response(500, f'Server error: {str(e)}')
    
    def do_POST(self):
        """Handle POST requests for saving data"""
        try:
            parsed_path = urlparse(self.path)
            
            if parsed_path.path == '/api/save-data':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                request_data = json.loads(post_data.decode('utf-8'))
                
                user_id = request_data.get('userId')
                data_type = request_data.get('dataType')
                data = request_data.get('data')
                
                if not user_id or not data_type:
                    self.send_error_response(400, 'Missing userId or dataType')
                    return
                
                success = self.save_user_data(user_id, data_type, data)
                if success:
                    self.send_json_response(200, {'success': True, 'message': 'Data saved successfully'})
                else:
                    self.send_error_response(500, 'Failed to save data')
            
            else:
                self.send_error_response(404, 'Endpoint not found')
        
        except Exception as e:
            self.send_error_response(500, f'Server error: {str(e)}')
    
    def save_user_data(self, user_id, data_type, data):
        """Save user data to file"""
        try:
            user_dir = os.path.join(self.data_dir, 'users', user_id)
            os.makedirs(user_dir, exist_ok=True)
            
            file_path = os.path.join(user_dir, f'{data_type}.json')
            
            # Create data structure with metadata
            data_structure = {
                'data': data,
                'lastModified': time.strftime('%Y-%m-%dT%H:%M:%S.%fZ'),
                'version': self.get_next_version(file_path)
            }
            
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data_structure, f, indent=2, ensure_ascii=False)
            
            return True
        except Exception as e:
            print(f"Error saving data: {e}")
            return False
    
    def load_user_data(self, user_id, data_type):
        """Load user data from file"""
        try:
            file_path = os.path.join(self.data_dir, 'users', user_id, f'{data_type}.json')
            
            if not os.path.exists(file_path):
                return None
            
            with open(file_path, 'r', encoding='utf-8') as f:
                data_structure = json.load(f)
            
            return data_structure.get('data')
        except Exception as e:
            print(f"Error loading data: {e}")
            return None
    
    def load_all_user_data(self, user_id):
        """Load all user data types"""
        try:
            user_dir = os.path.join(self.data_dir, 'users', user_id)
            
            if not os.path.exists(user_dir):
                return {}
            
            all_data = {}
            for filename in os.listdir(user_dir):
                if filename.endswith('.json'):
                    data_type = filename[:-5]  # Remove .json extension
                    data = self.load_user_data(user_id, data_type)
                    if data is not None:
                        all_data[data_type] = data
            
            return all_data
        except Exception as e:
            print(f"Error loading all data: {e}")
            return {}
    
    def get_next_version(self, file_path):
        """Get the next version number for a file"""
        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
                return existing_data.get('version', 0) + 1
            return 1
        except:
            return 1
    
    def send_json_response(self, status_code, data):
        """Send JSON response with CORS headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def send_error_response(self, status_code, message):
        """Send error response with CORS headers"""
        self.send_json_response(status_code, {'success': False, 'error': message})
    
    def log_message(self, format, *args):
        """Override to customize logging"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def run_data_storage_server(port=8001):
    """Run the data storage server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DataStorageHandler)
    print(f"Data Storage API running on port {port}")
    print(f"Endpoints available:")
    print(f"  GET  /api/load-data?userId=X&dataType=Y")
    print(f"  GET  /api/load-all-data?userId=X")
    print(f"  POST /api/save-data (JSON body)")
    httpd.serve_forever()

if __name__ == '__main__':
    run_data_storage_server()
