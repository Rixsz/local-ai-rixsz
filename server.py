import http.server
import socketserver
import subprocess
import urllib.parse
import urllib.request
import json
import os
import zipfile
import time
from datetime import datetime

PORT = 8000
TOR_PROXY = "socks5h://127.0.0.1:9050"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/api/tor-status':
            # Check if Tor is running and accessible
            try:
                cmd = ["curl", "--socks5-hostname", "127.0.0.1:9050", "-s", "--max-time", "5", "https://check.torproject.org/api/ip"]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=6)
                
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    is_tor = data.get('IsTor', False)
                    
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "status": "success",
                        "tor_active": is_tor,
                        "message": "Tor is active" if is_tor else "Connected but not via Tor"
                    }).encode('utf-8'))
                else:
                    raise Exception("Cannot connect to Tor")
                    
            except Exception as e:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "error",
                    "tor_active": False,
                    "message": "Tor is not running or not accessible"
                }).encode('utf-8'))
        
        elif self.path == '/api/search-onion':
            # Dark web search using Ahmia
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            query = data.get('query')
            
            print(f"🧅 Searching Dark Web (.onion): {query}")
            
            try:
                # Ahmia is a search engine for .onion sites
                url = f"https://ahmia.fi/search/?q={urllib.parse.quote(query)}"
                
                cmd = [
                    "curl",
                    "--socks5-hostname", "127.0.0.1:9050",
                    "-s",
                    "-L",
                    "--max-time", "20",
                    "-A", "Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0",
                    url
                ]
                
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Curl failed: {result.stderr}")
                
                html = result.stdout
                
                # Parse Ahmia results
                from html.parser import HTMLParser
                
                class AhmiaParser(HTMLParser):
                    def __init__(self):
                        super().__init__()
                        self.results = []
                        self.in_result = False
                        self.in_title = False
                        self.in_snippet = False
                        self.current_title = ""
                        self.current_snippet = ""
                        self.current_url = ""
                    
                    def handle_starttag(self, tag, attrs):
                        attrs_dict = dict(attrs)
                        if tag == "li" and "result" in attrs_dict.get("class", ""):
                            self.in_result = True
                        elif self.in_result and tag == "h4":
                            self.in_title = True
                        elif self.in_result and tag == "p":
                            self.in_snippet = True
                        elif self.in_result and tag == "cite":
                            self.in_snippet = True
                        elif self.in_result and tag == "a" and "href" in attrs_dict:
                            self.current_url = attrs_dict["href"]
                    
                    def handle_endtag(self, tag):
                        if tag == "li" and self.in_result:
                            if self.current_title or self.current_snippet:
                                result_text = f"{self.current_title}\n{self.current_snippet}\nURL: {self.current_url}"
                                self.results.append(result_text.strip())
                            self.in_result = False
                            self.current_title = ""
                            self.current_snippet = ""
                            self.current_url = ""
                        elif tag == "h4":
                            self.in_title = False
                        elif tag == "p" or tag == "cite":
                            self.in_snippet = False
                    
                    def handle_data(self, data):
                        if self.in_title:
                            self.current_title += data
                        elif self.in_snippet:
                            self.current_snippet += data
                
                parser = AhmiaParser()
                parser.feed(html)
                
                snippet_text = "\n\n".join(parser.results[:5]) if parser.results else "No .onion results found. The dark web search may have timed out or no results exist for this query."
                
                response_data = {
                    "status": "success",
                    "results": snippet_text,
                    "source": "Ahmia (.onion)"
                }
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(response_data).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Dark Web Search Error: {e}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        
        elif self.path == '/api/generate-image':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            prompt = data.get('prompt')
            
            print(f"🎨 Generating Image: {prompt}")
            
            try:
                # Payload for Stable Diffusion WebUI API
                payload = {
                    "prompt": prompt,
                    "steps": 20,
                    "width": 512,
                    "height": 512
                }
                
                # Proxy to Local Stable Diffusion (Default Port 7860)
                sd_url = "http://127.0.0.1:7860/sdapi/v1/txt2img"
                req = urllib.request.Request(sd_url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})
                
                with urllib.request.urlopen(req) as response:
                    sd_response = json.loads(response.read().decode('utf-8'))
                    
                # Extract base64 image
                image_b64 = sd_response['images'][0]
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "image": image_b64}).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Generation Error: {e}")
                error_msg = str(e)
                
                # Handling Connection Refused with a Helpful Message (or Simulation)
                if "Connection refused" in error_msg:
                    # SIMULATION MODE: 
                    # If we can't connect, let's return a placeholder so the user sees the UI working.
                    # This is better than a hard error for a demo.
                    print("⚠️  Backend offline. Using Simulation Mode (Placeholder Image).")
                    
                    # 1x1 Transparent Pixel (or a placeholders link)
                    # Let's actually disable simulation by default to avoid confusion, 
                    # unless we explicitly want to "Mock" it. 
                    # User request implies they want it to "work" or "create a picture".
                    # Let's give them a clear error instructing them to turn on SD.
                    
                    error_msg = (
                        "Stable Diffusion is not running on port 7860! "
                        "Please launch 'webui-user.bat' (Windows) or './webui.sh' (Linux). " 
                        "Or ensure your local AI image generator is active."
                    )

                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": error_msg}).encode('utf-8'))

        elif self.path == '/api/search':
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
                snippet_text = "\n".join(parser.results[:5]) if parser.results else "No specific snippets found, but connection was successful."
                
                response_data = {
                    "status": "success",
                    "results": snippet_text,
                    "source": "DuckDuckGo (Tor)"
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
        if self.path == '/api/history':
            try:
                history_dir = "history"
                if not os.path.exists(history_dir):
                    files = []
                else:
                    # List all zip files, sorted by newest first
                    files = [f for f in os.listdir(history_dir) if f.endswith('.zip')]
                    files.sort(reverse=True)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "success", "files": files}).encode('utf-8'))
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode('utf-8'))
        else:
            return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"🚀 J.A.R.V.I.S. Server running at http://localhost:{PORT}")
print(f"🔒 Tor configured at {TOR_PROXY}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
