@echo off
title VidPulse - YouTube Growth Engine
cd /d "c:\wamp64\www\YT_Analytics"

echo ========================================================
echo         Launching VidPulse Studio (Free VidIQ)
echo ========================================================
echo.
echo Starting Next.js Dev Server on http://localhost:3000...
echo.

:: Launch browser in background after 3 seconds
start "" powershell -Command "Start-Sleep -Seconds 3; Start-Process 'http://localhost:3000'"

:: Start the Next.js development server
npm run dev
pause
