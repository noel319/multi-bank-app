# Complete Build Process for Multi-Bank App
# Run these commands in PowerShell from your project root directory

Write-Host "=========================================="
Write-Host "  Building Multi-Bank App for Windows"
Write-Host "=========================================="

# Clean previous builds
Write-Host "Cleaning previous builds..."
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "build") { Remove-Item -Recurse -Force "build" }
if (Test-Path "app\dist") { Remove-Item -Recurse -Force "app\dist" }

# Step 1: Install Node.js dependencies
Write-Host "Installing Node.js dependencies..."
npm install
Set-Location app
npm install
Set-Location ..

# Step 2: Setup and build Python backend
Write-Host "Setting up Python environment..."
Set-Location python_backend

# Activate virtual environment
if (Test-Path "myenv\Scripts\Activate.ps1") {
    Write-Host "Activating existing virtual environment..."
    .\myenv\Scripts\Activate.ps1
} else {
    Write-Host "Creating virtual environment..."
    python -m venv myenv
    .\myenv\Scripts\Activate.ps1
}

# Install Python dependencies
if (Test-Path "requirements.txt") {
    Write-Host "Installing Python dependencies..."
    pip install -r requirements.txt
}

# Install PyInstaller
pip install --upgrade pyinstaller

# Create build directories
if (!(Test-Path "..\dist")) { New-Item -ItemType Directory -Path "..\dist" }
if (!(Test-Path "..\dist\python_runtime")) { New-Item -ItemType Directory -Path "..\dist\python_runtime" }

# Build Python executable
Write-Host "Building Python backend..."
pyinstaller --onefile `
    --name main_handler `
    --distpath ../dist/python_runtime `
    --workpath ../build/python_temp `
    --specpath ../build `
    --hidden-import sqlite3 `
    --hidden-import json `
    --hidden-import argparse `
    --hidden-import sys `
    --hidden-import os `
    --hidden-import traceback `
    --hidden-import datetime `
    --hidden-import pathlib `
    --hidden-import auth_manager `
    --hidden-import bank_manager `
    --hidden-import billing_manager `
    --hidden-import cost_center_manager `
    --hidden-import dashboard_manager `
    --hidden-import database_manager `
    --hidden-import google_sheets_manager `
    --hidden-import home_data_manager `
    --hidden-import transaction_manager `
    --add-data "auth_manager.py;." `
    --add-data "bank_manager.py;." `
    --add-data "billing_manager.py;." `
    --add-data "cost_center_manager.py;." `
    --add-data "dashboard_manager.py;." `
    --add-data "database_manager.py;." `
    --add-data "google_sheets_manager.py;." `
    --add-data "home_data_manager.py;." `
    --add-data "transaction_manager.py;." `
    --add-data "requirements.txt;." `
    --console `
    main_handler.py

if ($LASTEXITCODE -ne 0) {
    Write-Host "Python build failed!" -ForegroundColor Red
    deactivate
    exit 1
}

# Copy database if it exists
if (Test-Path "..\app_database.db") {
    Write-Host "Copying database..."
    Copy-Item "..\app_database.db" "..\dist\python_runtime\"
}

# Deactivate virtual environment
deactivate
Set-Location ..

# Step 3: Build React frontend
Write-Host "Building React frontend..."
Set-Location app
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "React build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 4: Build Electron application
Write-Host "Building Electron application..."
npx electron-builder --win
if ($LASTEXITCODE -ne 0) {
    Write-Host "Electron build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "=========================================="
Write-Host "  Build completed successfully!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Files created:"
Get-ChildItem "dist\electron\*.exe" | ForEach-Object { Write-Host $_.Name }
Write-Host ""