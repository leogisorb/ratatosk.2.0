#!/usr/bin/env python3
import http.server
import ssl
import socketserver
import os

os.chdir('/Users/leopoldbrosig/Desktop/Programm')

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

with socketserver.TCPServer(('0.0.0.0', 8443), MyHandler) as httpd:
    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    context.load_cert_chain('cert.pem', 'key.pem')
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print('HTTPS Server läuft auf https://192.168.2.113:8443')
    httpd.serve_forever()
