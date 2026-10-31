@echo off
setlocal enabledelayedexpansion
title VidPulse - Push & Deploy to GitHub / Netlify

echo ========================================================
echo        VidPulse Studio - Git Push & CI/CD Deploy
echo ========================================================
echo.

:: 1. Check git status
echo [1/4] Checking repository status...
git status -s
echo.

:: 2. Prompt for custom commit message (defaults to timestamped update)
set "DEFAULT_MSG=update: %date% %time%"
set /p "COMMIT_MSG=Enter commit message (Press Enter for '%DEFAULT_MSG%'): "

if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=%DEFAULT_MSG%"
)

echo.
echo [2/4] Staging all tracked and new files...
git add .

echo.
echo [3/4] Creating commit: "!COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

echo.
echo [4/4] Pushing changes to GitHub (origin/main)...
echo This will automatically trigger Netlify to rebuild and deploy live!
echo.
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  [SUCCESS] Changes pushed to GitHub successfully!
    echo  Netlify is now automatically building your live site.
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  [ERROR] Git push failed. Please check your credentials
    echo  or network connection and try again.
    echo ========================================================
)

echo.
pause
