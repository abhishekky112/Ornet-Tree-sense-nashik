@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0download-images.ps1"
if errorlevel 1 (
    echo.
    echo Download failed. Check the Ornet GeoServer URL/network access.
    pause
    exit /b 1
)
echo.
echo Images downloaded successfully.
pause
