#!/usr/bin/env python3
import http.server
import ssl
import socketserver

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

# Server konfigurieren
PORT = 8443
Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    # SSL Context erstellen
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('cert.pem', 'key.pem')
    
    # Socket mit SSL wrappen
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"HTTPS Server läuft auf https://192.168.2.113:{PORT}")
    print("Drücke Ctrl+C zum Beenden")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer gestoppt")
