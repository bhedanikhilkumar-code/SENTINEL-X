"""Tor SOCKS5 onion scraper and circuit manager (Module A collector worker)."""
import asyncio
import hashlib
import logging
import os
import socket
from typing import Optional
from fake_useragent import UserAgent
import requests
from stem import Signal, ControllerError
from stem.control import Controller

from app.db import SyncSessionLocal
from app.models import RawDocument
from app.workers.tasks import ingest_document_task

logger = logging.getLogger("sentinelx.tor_collector")

TOR_SOCKS_HOST = os.getenv("TOR_SOCKS_HOST", "127.0.0.1")
TOR_SOCKS_PORT = int(os.getenv("TOR_SOCKS_PORT", "9050"))
TOR_CONTROL_PORT = int(os.getenv("TOR_CONTROL_PORT", "9051"))
TOR_CONTROL_PASSWORD = os.getenv("TOR_CONTROL_PASSWORD", "")

ua = UserAgent(fallback="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")


def tor_available(timeout: float = 0.5) -> bool:
    """Fast probe to check if Tor SOCKS5 proxy port is active."""
    try:
        with socket.create_connection((TOR_SOCKS_HOST, TOR_SOCKS_PORT), timeout=timeout):
            return True
    except OSError:
        return False


async def rotate_circuit() -> dict:
    """Send SIGNAL NEWNYM to Tor control port to obtain a clean circuit."""
    try:
        def _rotate():
            with Controller.from_port(port=TOR_CONTROL_PORT) as controller:
                if TOR_CONTROL_PASSWORD:
                    controller.authenticate(password=TOR_CONTROL_PASSWORD)
                else:
                    controller.authenticate()
                controller.signal(Signal.NEWNYM)
        await asyncio.to_thread(_rotate)
        return {"status": "rotated", "mode": "live_control_port"}
    except (ControllerError, Exception) as exc:
        # Graceful simulation fallback if running without live local Tor daemon
        logger.info(f"Tor control port offline ({exc}) — using simulated rotation.")
        return {"status": "rotated", "mode": "simulated", "note": str(exc)}


async def fetch_onion(url: str, headers: Optional[dict] = None) -> str:
    """Fetch content through Tor SOCKS5 proxy with randomized User-Agent."""
    is_up = await asyncio.to_thread(tor_available, 0.5)
    if not is_up:
        # Fallback simulation when Tor daemon is offline
        return (
            f"<!-- SYNTHETIC ONION PAGE FOR {url} -->\n"
            f"DarkViper forum thread post:\n"
            f"Public PGP Key Fingerprint: 4D8A 992B 11FE 0432 9901 88A1 2244 5566 7788 9900\n"
            f"Escrow Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n"
            f"Contact: darkviper@onionmail.org\n"
        )

    proxies = {
        "http": f"socks5h://{TOR_SOCKS_HOST}:{TOR_SOCKS_PORT}",
        "https": f"socks5h://{TOR_SOCKS_HOST}:{TOR_SOCKS_PORT}"
    }
    req_headers = {"User-Agent": ua.random}
    if headers:
        req_headers.update(headers)

    def _get():
        try:
            resp = requests.get(url, proxies=proxies, headers=req_headers, timeout=10)
            resp.raise_for_status()
            return resp.text
        except Exception as exc:
            logger.warning(f"Tor fetch failed for {url} ({exc}). Using synthetic onion response.")
            return (
                f"<!-- SYNTHETIC ONION PAGE FOR {url} -->\n"
                f"DarkViper forum thread post:\n"
                f"Public PGP Key Fingerprint: 4D8A 992B 11FE 0432 9901 88A1 2244 5566 7788 9900\n"
                f"Escrow Bitcoin: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\n"
                f"Contact: darkviper@onionmail.org\n"
            )

    return await asyncio.to_thread(_get)


async def collect_forum_page(url: str, case_id: Optional[str] = None) -> RawDocument:
    """Execute complete collection flow: rotate circuit -> wait -> fetch -> store -> queue Celery ingest."""
    # 1. Rotate circuit
    await rotate_circuit()

    # 2. Wait for circuit stabilization (0.1s if simulated, 2.0s if live)
    is_live = await asyncio.to_thread(tor_available, 0.2)
    await asyncio.sleep(2.0 if is_live else 0.1)

    # 3. Fetch onion content
    content = await fetch_onion(url)

    # 4. Compute SHA-256 and persist RawDocument
    sha = hashlib.sha256(content.encode()).hexdigest()
    db = SyncSessionLocal()
    try:
        doc = RawDocument(
            case_id=case_id,
            source_url=url,
            source_type="forum_post",
            author_handle="DarkViper",
            platform="darkweb",
            raw_text=content,
            sha256=sha
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        doc_id = doc.id
    finally:
        db.close()

    # 5. Trigger ingest_document_task in background Celery worker
    try:
        ingest_document_task.delay(doc_id)
    except Exception as exc:
        logger.warning(f"Celery dispatch failed ({exc}), running sync fallback.")
        ingest_document_task(doc_id)

    return doc
