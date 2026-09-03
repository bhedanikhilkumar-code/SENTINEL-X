"""Module A — Live Tor Collector (PRD §3.A).

OPSEC-by-design per PRD §4.1:
- ALL egress routes through the Tor SOCKS proxy (9050) exclusively — the app
  itself never talks to onion infrastructure directly.
- Circuit rotation (NEWNYM) per request via the stem control port (9051) to
  avoid correlating the collector's own request pattern.
- Header scrubbing layer (in-code Privoxy-equivalent): strips/normalizes every
  collector-identifying header before egress.
- CAPTCHA/anti-bot challenges are NEVER auto-defeated (PRD boundary §1.3/§6.3):
  blocked URLs are queued for human-in-the-loop analyst resolution and the
  manual resolution is logged as an auditable event.

Graceful degradation: if Tor is not running (dev/demo machines), collect()
returns a structured tor_unavailable result instead of falling back to
direct connections — a direct fallback would be an OPSEC violation.
"""
import os
import re
import time

import requests

SOCKS_PORT = int(os.environ.get("SENTINELX_TOR_SOCKS", "9050"))
CONTROL_PORT = int(os.environ.get("SENTINELX_TOR_CONTROL", "9051"))
CONTROL_PASSWORD = os.environ.get("SENTINELX_TOR_PASSWORD", "")  # empty = CookieAuth
REQUEST_TIMEOUT = int(os.environ.get("SENTINELX_TOR_TIMEOUT", "45"))

# Headers scrubbed/normalized before ANY egress (Privoxy-layer equivalent).
# No investigator-identifying metadata, no real User-Agent, no header-order fingerprint.
_SCRUB_TEMPLATE = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0",  # Tor Browser's
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate",
    "Connection": "close",
    "Upgrade-Insecure-Requests": "1",
}
_FORBIDDEN_HEADERS = re.compile(r"^(x-forwarded|via|authorization|cookie$|x-real-ip)", re.I)

CAPTCHA_MARKERS = re.compile(
    r"(captcha|are you a robot|verify you are human|ddos guard|cloudflare challenge)", re.I)


def scrub_headers(extra: dict | None = None) -> dict:
    """Return the sanitized header set. Anything identity-revealing in `extra`
    is dropped — never forwarded."""
    headers = dict(_SCRUB_TEMPLATE)
    for k, v in (extra or {}).items():
        if _FORBIDDEN_HEADERS.match(k):
            continue  # OPSEC: identifying headers never leave the collector
        headers[k] = v
    return headers


def tor_available() -> bool:
    """Probe SOCKS port without leaking anything (local TCP connect only)."""
    import socket
    try:
        with socket.create_connection(("127.0.0.1", SOCKS_PORT), timeout=2):
            return True
    except OSError:
        return False


def rotate_circuit() -> bool:
    """Per-request circuit rotation via stem NEWNYM signal (PRD §3.A).
    Returns False (and never raises) when the control port is unavailable."""
    try:
        from stem import Signal
        from stem.control import Controller
        with Controller.from_port(port=CONTROL_PORT) as ctrl:
            if CONTROL_PASSWORD:
                ctrl.authenticate(password=CONTROL_PASSWORD)
            else:
                ctrl.authenticate()  # CookieAuth
            ctrl.signal(Signal.NEWNYM)
        time.sleep(2)  # let the new circuit settle before egress
        return True
    except Exception:
        return False


def _make_session() -> requests.Session:
    s = requests.Session()
    s.proxies = {
        "http": f"socks5h://127.0.0.1:{SOCKS_PORT}",
        "https": f"socks5h://127.0.0.1:{SOCKS_PORT}",
    }
    return s


def collect(url: str, rotate: bool = True) -> dict:
    """Fetch `url` through Tor. Returns a structured result — NEVER raises.
    All outcomes are caller-logged to the audit chain."""
    if not tor_available():
        # OPSEC: no direct fallback. The collector stays dark instead.
        return {"ok": False, "status": "tor_unavailable",
                "reason": f"Tor SOCKS port {SOCKS_PORT} not reachable — collector refuses direct egress (OPSEC §4.1)",
                "remedy": "Start the Tor service (tor.exe / 'tor --SocksPort 9050') and the control port on 9051"}
    circuit_rotated = rotate_circuit() if rotate else False
    try:
        resp = _make_session().get(url, headers=scrub_headers(), timeout=REQUEST_TIMEOUT)
    except Exception as e:
        return {"ok": False, "status": "fetch_error", "reason": f"{type(e).__name__}: {e}",
                "circuit_rotated": circuit_rotated}

    body = resp.text or ""
    partial = resp.status_code != 200  # PRD: non-200 / truncated capture must be flagged, not dropped
    return {
        "ok": True,
        "status": "captcha_blocked" if CAPTCHA_MARKERS.search(body) else "fetched",
        "http_status": resp.status_code,
        "raw_text": body[:200_000],  # cap blob size
        "partial_capture": partial or CAPTCHA_MARKERS.search(body) is not None,
        "circuit_rotated": circuit_rotated,
        "scrubbed_headers": sorted(_SCRUB_TEMPLATE),
    }
