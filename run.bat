@echo off
REM Run from the project folder and open the parser in the browser.
cd /d "%~dp0"
set PORT=3001
start "Parser Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
start "" "http://localhost:3001/candidateparsor.html"
echo If the browser does not open automatically, visit http://localhost:3001/candidateparsor.html
pause
