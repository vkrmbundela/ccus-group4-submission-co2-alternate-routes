@echo off
setlocal

set "TARGET=E:\Carbon Capture - Utlization and Storage\v1-backup"
set "PORT=%~1"

if "%PORT%"=="" set "PORT=8080"

if not exist "%TARGET%" (
  echo [ERROR] Folder not found: %TARGET%
  exit /b 1
)

cd /d "%TARGET%"

echo Starting v1 from: %TARGET%
echo URL: http://localhost:%PORT%
echo Press Ctrl+C to stop.
echo.

where py >nul 2>&1
if not errorlevel 1 (
  py -m http.server %PORT%
  exit /b %errorlevel%
)

where python >nul 2>&1
if not errorlevel 1 (
  python -m http.server %PORT%
  exit /b %errorlevel%
)

where npx >nul 2>&1
if not errorlevel 1 (
  npx --yes serve . -l %PORT%
  exit /b %errorlevel%
)

echo [ERROR] No runtime found. Install Python or Node.js.
exit /b 1