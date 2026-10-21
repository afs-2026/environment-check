@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 24 LTS, reopen this window, and try again.
  if not defined CI pause
  exit /b 1
)
node scripts\readiness.mjs prepare
set "CHECK_RESULT=%ERRORLEVEL%"
if not defined CI pause
exit /b %CHECK_RESULT%
