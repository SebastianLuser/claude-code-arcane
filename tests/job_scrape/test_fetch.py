"""
Specs for skills/job-scrape/scripts/_fetch.py, the HTTP helper both search scripts use.

Run from the repo root: python -m unittest discover -s tests -p "test_*.py"
"""

import io
import sys
import unittest
import urllib.error
from pathlib import Path
from unittest import mock

SCRIPTS = Path(__file__).resolve().parents[2] / "skills" / "job-scrape" / "scripts"
sys.path.insert(0, str(SCRIPTS))

import _fetch  # noqa: E402


def http_error(code):
    return urllib.error.HTTPError("https://x", code, "err", {}, io.BytesIO())


def ok(body):
    response = mock.MagicMock()
    response.__enter__.return_value.read.return_value = body.encode("utf-8")
    return response


@mock.patch("_fetch.time.sleep")
class FetchTest(unittest.TestCase):
    def test_retries_a_timeout_then_returns_the_body(self, _sleep):
        with mock.patch("_fetch.urllib.request.urlopen",
                        side_effect=[urllib.error.URLError("timed out"), ok("hola")]):
            self.assertEqual(_fetch.fetch("https://x", {}, 3), "hola")

    def test_404_is_none(self, _sleep):
        with mock.patch("_fetch.urllib.request.urlopen", side_effect=http_error(404)):
            self.assertIsNone(_fetch.fetch("https://x", {}, 3))

    def test_client_error_is_not_retried(self, _sleep):
        with mock.patch("_fetch.urllib.request.urlopen", side_effect=http_error(403)) as urlopen:
            with self.assertRaises(RuntimeError):
                _fetch.fetch("https://x", {}, 3)
            self.assertEqual(urlopen.call_count, 1)

    def test_gives_up_after_max_retries(self, _sleep):
        with mock.patch("_fetch.urllib.request.urlopen", side_effect=http_error(503)) as urlopen:
            with self.assertRaises(RuntimeError):
                _fetch.fetch("https://x", {}, 2)
            self.assertEqual(urlopen.call_count, 3)


if __name__ == "__main__":
    unittest.main()
