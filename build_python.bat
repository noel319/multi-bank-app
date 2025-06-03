@echo off
echo ==========================================
echo   Building Python Backend
echo ==========================================

REM Navigate to python_backend directory
cd python_backend

REM Activate virtual environment if it exists
if exist myenv\Scripts\activate.bat (
    echo Activating virtual environment...
    . .\myenv\Scripts\Activate.ps1
) else (
    echo No virtual environment found, using system Python
)

REM Install/upgrade PyInstaller
echo Installing PyInstaller...
pip install --upgrade pyinstaller

REM Create dist directory if it doesn't exist
if not exist "..\dist" mkdir "..\dist"
if not exist "..\dist\python_runtime" mkdir "..\dist\python_runtime"

REM Build with PyInstaller - including all your manager modules
echo Building Python executable...
pyinstaller --onefile ^
    --name main_handler ^
    --distpath ../dist/python_runtime ^
    --workpath ../build/python_temp ^
    --hidden-import sqlite3 ^
    --hidden-import json ^
    --hidden-import argparse ^
    --hidden-import sys ^
    --hidden-import os ^
    --hidden-import traceback ^
    --hidden-import datetime ^
    --hidden-import pathlib ^
    --hidden-import auth_manager ^
    --hidden-import bank_manager ^
    --hidden-import billing_manager ^
    --hidden-import cost_center_manager ^
    --hidden-import dashboard_manager ^
    --hidden-import database_manager ^
    --hidden-import google_sheets_manager ^
    --hidden-import home_data_manager ^
    --hidden-import transaction_manager ^
    --add-data "auth_manager.py;." ^
    --add-data "bank_manager.py;." ^
    --add-data "billing_manager.py;." ^
    --add-data "cost_center_manager.py;." ^
    --add-data "dashboard_manager.py;." ^
    --add-data "database_manager.py;." ^
    --add-data "google_sheets_manager.py;." ^
    --add-data "home_data_manager.py;." ^
    --add-data "transaction_manager.py;." ^
    --add-data "requirements.txt;." ^
    --console ^
    main_handler.py

if errorlevel 1 (
    echo Python build failed!
    if exist myenv\Scripts\deactivate.bat call myenv\Scripts\deactivate.bat
    pause
    exit /b 1
)

REM Copy database if it exists
if exist "..\app_database.db" (
    echo Copying database...
    copy "..\app_database.db" "..\dist\python_runtime\"
)

REM Deactivate virtual environment
if exist myenv\Scripts\deactivate.bat call myenv\Scripts\deactivate.bat

echo Python backend build completed successfully!
cd ..