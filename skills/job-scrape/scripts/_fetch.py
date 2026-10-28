"""HTTP GET with backoff, shared by the job-scrape search scripts."""

import random
import time
import urllib.error
import urllib.request


def fetch(url, headers, max_retries):
    """Body as text, or None on a 404. Retries 429, 5xx, timeouts and connection errors."""
    delay = 0.5
    for attempt in range(max_retries + 1):
        request = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if not (e.code == 429 or e.code >= 500) or attempt == max_retries:
                raise RuntimeError(f"Request failed: {e.code} {e.reason}") from None
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt == max_retries:
                raise RuntimeError(f"Request failed: {getattr(e, 'reason', e)}") from None
        time.sleep(delay + random.random() * 0.5)
        delay = min(delay * 2, 8)
    raise RuntimeError("Request failed after max retries")
