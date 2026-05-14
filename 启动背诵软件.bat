@echo off
cd /d "%~dp0"
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:5173/'"
npm.cmd run dev
pause
