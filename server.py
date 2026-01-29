import http.server
import socketserver
import subprocess
import urllib.parse
import json
import os
import zipfile
import time
from datetime import datetime

PORT = 8000
TOR_PROXY = "socks5h://127.0.0.1:9050"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/search':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            query = data.get('query')
            
            print(f"🕵️  Searching via Tor: {query}")
            
            try:
                # Use curl to request DuckDuckGo via Tor
                # Using html version to avoid JS requirements on the scraping side
                url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query)}"
                
                # Construct curl command
                cmd = [
                    "curl", 
                    "--socks5-hostname", "127.0.0.1:9050", 
                    "-s", # Silent
                    "-L", # Follow redirects
                    "--max-time", "15", # Timeout
                    "-A", "Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0", # User agent
                    url
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Curl failed: {result.stderr}")
                
                # Very simple parsing to extract text results (robust enough for simple queries)
                # In a real app we'd use BeautifulSoup, but we want zero dependencies
                html = result.stdout
                
                # Extract search results (simple approximation)
                # We look for "result__snippet" class generally found in DDG HTML
                from html.parser import HTMLParser

                class DDGParser(HTMLParser):
                    def __init__(self):
                        super().__init__()
                        self.recording = False
                        self.results = []
                        self.current_result = ""
                        self.in_snippet = False

                    def handle_starttag(self, tag, attrs):
                        attrs_dict = dict(attrs)
                        if tag == "a" and "result__snippet" in attrs_dict.get("class", ""):
                            self.in_snippet = True

                    def handle_endtag(self, tag):
                        if tag == "a" and self.in_snippet:
                            self.in_snippet = False
                            if self.current_result:
                                self.results.append(self.current_result.strip())
                                self.current_result = ""

                    def handle_data(self, data):
                        if self.in_snippet:
                            self.current_result += data

                parser = DDGParser()
                parser.feed(html)
                
                # Fallback if parser fails or layout changes, just send some raw text
                snippet_text = "\n".join(parser.results[:3]) if parser.results else "No specific snippets found, but connection was successful."
                
                response_data = {
                    "status": "success",
                    "results": snippet_text
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Search Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        
        elif self.path == '/api/archive':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            history = data.get('history', [])
            
            if not history:
                self.send_response(400)
                self.end_headers()
                return

            print(f"📦 Archiving session ({len(history)} messages)...")
            
            try:
                # Ensure history directory exists
                history_dir = "history"
                if not os.path.exists(history_dir):
                    os.makedirs(history_dir)
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                base_name = f"session_{timestamp}"
                json_filename = os.path.join(history_dir, f"{base_name}.json")
                zip_filename = os.path.join(history_dir, f"{base_name}.zip")
                
                # 1. Save to JSON
                with open(json_filename, 'w') as f:
                    json.dump(history, f, indent=2)
                
                # 2. Create ZIP
                with zipfile.ZipFile(zip_filename, 'w', compression=zipfile.ZIP_DEFLATED) as zipf:
                    zipf.write(json_filename, arcname=f"{base_name}.json")
                
                # 3. Delete raw JSON
                os.remove(json_filename)
                
                print(f"✅ Session archived to: {zip_filename}")
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "file": zip_filename}).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Archival Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            self.send_error(404)

    def do_GET(self):
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"🚀 J.A.R.V.I.S. Server running at http://localhost:{PORT}")
print(f"🔒 Tor configured at {TOR_PROXY}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
