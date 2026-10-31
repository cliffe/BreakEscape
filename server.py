#!/usr/bin/env python3
"""
HTTP Server with zero caching for development
- ALL files: No cache (always fresh)
"""

import http.server
import socketserver
import os
from datetime import datetime, timedelta
from email.utils import formatdate
import mimetypes

PORT = 8000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Disable all caching for ALL file types
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, private')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Last-Modified', formatdate(timeval=None, localtime=False, usegmt=True))
        
        # Add CORS headers for local development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        
        # Call parent to add any remaining headers
        super().end_headers()

if __name__ == '__main__':
    Handler = NoCacheHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"🚀 Development Server running at http://localhost:{PORT}/")
        print(f"📄 Cache policy: ZERO CACHING - all files always fresh")
        print(f"\n⌨️  Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")
