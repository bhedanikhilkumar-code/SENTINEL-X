@echo off
echo ======================================================================
echo    SENTINEL-X: Enterprise Docker Compose Orchestrator
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.

docker compose up --build -d

echo.
echo ======================================================================
echo    Containers launched successfully!
echo      - Frontend Workbench:       http://localhost:3000
echo      - FastAPI Backend Engine:   http://localhost:8100
echo      - API Swagger Docs:         http://localhost:8100/docs
echo      - Neo4j Knowledge Browser:  http://localhost:7474
echo      - ChromaDB Vector Index:    http://localhost:8001
echo      - PostgreSQL Database:      localhost:5432 (db: sentinelx)
echo      - Redis Message Broker:     localhost:6379
echo      - Tor SOCKS5 Proxy:         localhost:9050 (Control: 9051)
echo ======================================================================
pause
