"""Standard-library HTTP helpers for the MiniMax scripts, so they run without `requests`.

urlopen raises urllib.error.HTTPError on 4xx/5xx, like requests' raise_for_status().
"""

import json
import urllib.parse
import urllib.request


def post_json(url: str, headers: dict, payload: dict, timeout: float) -> dict:
    body = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        url, data=body, method="POST", headers={**headers, "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def get_json(url: str, headers: dict, params: dict, timeout: float) -> dict:
    request = urllib.request.Request(f"{url}?{urllib.parse.urlencode(params)}", headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def get_bytes(url: str, timeout: float) -> bytes:
    with urllib.request.urlopen(url, timeout=timeout) as response:
        return response.read()
