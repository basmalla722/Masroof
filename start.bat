@echo off
title Masroof - dev server
cd /d "%~dp0"

echo.
echo   Starting Masroof...
echo   Keep this window OPEN while you work.
echo.

start "" cmd /c "timeout /t 4 >nul && start http://localhost:5173"

npm run dev

echo.
echo   Server stopped.
pause
