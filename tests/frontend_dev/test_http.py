"""
Specs for frontend-dev's _http.py, the stdlib replacement for `requests` in the
MiniMax scripts. Runs against a local HTTP server, no network.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import http.server
import json
import sys
import threading
import unittest
import urllib.error
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "skills" / "frontend-dev" / "scripts"))

import _http  # noqa: E402


class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        ok = self.headers["Content-Type"] == "application/json" and self.headers["Authorization"] == "Bearer k"
        self.send_response(200 if ok else 400)
        self.end_headers()
        self.wfile.write(json.dumps({"echo": body}).encode())

    def do_GET(self):
        if self.path.startswith("/err"):
            self.send_response(500)
            self.end_headers()
            return
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"\x00\x01" if self.path.startswith("/bin") else json.dumps({"path": self.path}).encode())


class HttpHelperTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.HTTPServer(("127.0.0.1", 0), Handler)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def test_post_json_sends_json_and_auth(self):
        self.assertEqual(_http.post_json(self.base + "/p", {"Authorization": "Bearer k"}, {"a": 1}, 5), {"echo": {"a": 1}})

    def test_get_json_encodes_params(self):
        self.assertEqual(_http.get_json(self.base + "/q", {}, {"task_id": "x y"}, 5), {"path": "/q?task_id=x+y"})

    def test_get_bytes_returns_raw_content(self):
        self.assertEqual(_http.get_bytes(self.base + "/bin", 5), b"\x00\x01")

    def test_http_errors_raise_like_raise_for_status(self):
        with self.assertRaises(urllib.error.HTTPError) as caught:
            _http.get_json(self.base + "/err", {}, {}, 5)
        self.assertEqual(caught.exception.code, 500)


if __name__ == "__main__":
    unittest.main()
