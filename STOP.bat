@echo off
title Word Editor - Stopping...

echo ========================================
echo   WORD EDITOR - STOPPING
echo ========================================
echo.

echo Dang dung tat ca Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo Dang dung MongoDB...
taskkill /F /IM mongod.exe >nul 2>&1

echo.
echo [OK] Tat ca servers da dung!
echo.
pause
