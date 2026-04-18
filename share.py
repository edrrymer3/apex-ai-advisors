#!/usr/bin/env python3
import http.server
import socketserver
import socket

PORT = 8888

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

local_ip = get_local_ip()
url = f"http://{local_ip}:{PORT}"

print("\n" + "="*50)
print("🌐 WEBSITE READY TO VIEW ON YOUR PHONE")
print("="*50)
print(f"\n✅ Open this URL on your phone:")
print(f"\n   {url}")
print(f"\n   (Make sure your phone is on the same WiFi)")
print("\n" + "="*50)
print("\nPress Ctrl+C to stop the server\n")

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()