@echo off
REM 5ive Trackr - Quick Deploy to GitHub
REM Simple batch wrapper for the PowerShell deployment script

echo =====================================
echo 5ive Trackr - Quick GitHub Deploy
echo =====================================
echo.

REM Check if we're in live-build directory
if not "%CD:~-10%"=="live-build" (
    echo Error: This script must be run from the live-build directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

REM Get commit message or use default
set "commit_msg=🚀 Live deployment update - %date% %time%"
if not "%~1"=="" set "commit_msg=%~1"

echo Commit message: %commit_msg%
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "deploy-to-github.ps1" -CommitMessage "%commit_msg%"

if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ Deployment completed successfully!
) else (
    echo.
    echo ❌ Deployment failed with error code %ERRORLEVEL%
)

echo.
pause
