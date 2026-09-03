@echo off
echo ======================================================================
echo    SENTINEL-X: Cloudflare Global Edge Tunnel Launcher
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.
echo Starting secure HTTPS Cloudflare tunnel for Frontend & Backend...
echo.

cloudflared tunnel --url http://localhost:3000

pause
