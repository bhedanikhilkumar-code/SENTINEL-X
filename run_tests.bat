@echo off
echo ======================================================================
echo    SENTINEL-X: Automated Phase 6 Verification Test Suite
echo    SIH26151 - National Technical Research Organisation (NTRO)
echo ======================================================================
echo.
cd backend
python tests/test_e2e_demo_flow.py
cd ..
pause
