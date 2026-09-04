"""SENTINEL-X: Cloudflare Global Edge Tunnel Launcher & Live Linker.

SIH26151 - National Technical Research Organisation (NTRO)

1. Verifies/Starts local FastAPI Backend on port 8000.
2. Launches Cloudflare Tunnel (cloudflared) exposing http://localhost:8000.
3. Automatically captures the https://xxxx.trycloudflare.com public URL.
4. Launches the live Cloudflare Pages frontend (https://sentinel-tor.pages.dev/)
   pre-configured with the live tunnel URL.
"""
import os
import sys
import time
import re
import subprocess
import urllib.request
import webbrowser

CLOUDFLARED_PATHS = [
    r"C:\Program Files (x86)\cloudflared\cloudflared.exe",
    r"C:\Program Files\cloudflared\cloudflared.exe",
    "cloudflared",
]


def find_cloudflared() -> str:
    for path in CLOUDFLARED_PATHS:
        if os.path.isabs(path) and os.path.exists(path):
            return path
    # Try which / where
    try:
        res = subprocess.run(["where", "cloudflared"], capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip().splitlines()[0]
    except Exception:
        pass
    return "cloudflared"


def check_backend_running(port: int = 8000) -> bool:
    try:
        with urllib.request.urlopen(f"http://localhost:{port}/api/health", timeout=1.5) as r:
            return r.status == 200
    except Exception:
        return False


def start_local_backend(port: int = 8000):
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backend_dir = os.path.join(repo_root, "backend")
    print(f"[*] Starting local FastAPI backend on port {port}...")
    cmd = f'start "SENTINEL-X Backend (Port {port})" cmd /k "cd /d {backend_dir} && python -m uvicorn app.main:app --port {port} --host 0.0.0.0"'
    subprocess.Popen(cmd, shell=True)
    # Wait for backend to come up
    for _ in range(12):
        time.sleep(1)
        if check_backend_running(port):
            print(f"[+] Local backend is UP and healthy on port {port}!")
            return True
    print(f"[!] Warning: Backend healthcheck timed out, continuing with tunnel...")
    return False


def main():
    print("=" * 70)
    print("   SENTINEL-X: CLOUDFLARE EDGE TUNNEL & LIVE CONNECTOR")
    print("   SIH26151 — National Threat Actor De-Anonymization Platform")
    print("=" * 70)
    print()

    # Step 1: Ensure Backend is running
    if not check_backend_running(8000):
        print("[*] Local backend is not currently running on port 8000.")
        start_local_backend(8000)
    else:
        print("[+] Local backend is ALREADY running and healthy on port 8000.")

    # Step 2: Locate cloudflared
    cf_exe = find_cloudflared()
    print(f"[*] Using Cloudflare tunnel executable: {cf_exe}")

    # Step 3: Launch Tunnel
    print("[*] Establishing secure HTTPS Cloudflare tunnel to http://localhost:8000...")
    proc = subprocess.Popen(
        [cf_exe, "tunnel", "--url", "http://localhost:8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    tunnel_url = None
    start_time = time.time()

    # Read output to detect trycloudflare.com URL
    while time.time() - start_time < 20:
        line = proc.stderr.readline()
        if not line:
            time.sleep(0.1)
            continue
        if "trycloudflare.com" in line:
            match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if match:
                tunnel_url = match.group(0)
                break

    if not tunnel_url:
        print("[!] Could not auto-detect tunnel URL within 20s.")
        print("[!] Waiting for manual output below...")
    else:
        live_frontend_url = f"https://sentinel-tor.pages.dev/?backend={tunnel_url}"

        # Copy to Windows clipboard
        try:
            subprocess.run(["clip"], input=live_frontend_url, text=True, check=True)
            copied = True
        except Exception:
            copied = False

        print()
        print("=" * 70)
        print("   ✓ CLOUDFLARE EDGE TUNNEL ESTABLISHED SUCCESSFULLY!")
        print("=" * 70)
        print(f"   [LOCAL BACKEND]        : http://localhost:8000")
        print(f"   [PUBLIC TUNNEL]        : {tunnel_url}")
        print(f"   [LIVE FRONTEND LINK]   : {live_frontend_url}")
        if copied:
            print("   [CLIPBOARD]            : Link copied to clipboard automatically!")
        print("=" * 70)
        print()

        # Step 4: Open in default browser
        print("[*] Opening live connected platform in your default browser...")
        try:
            webbrowser.open(live_frontend_url)
        except Exception:
            pass

    print("\n[*] Tunnel is active and relaying traffic. Press Ctrl+C to terminate.\n")
    try:
        while True:
            line = proc.stderr.readline()
            if line:
                # Filter out noisy keep-alive pings
                if "connIndex" in line or "Registered at" in line or "error" in line.lower():
                    sys.stdout.write(line)
                    sys.stdout.flush()
            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\n[*] Terminating Cloudflare Tunnel...")
        proc.terminate()
        proc.wait()
        print("[+] Tunnel closed cleanly.")


if __name__ == "__main__":
    main()
