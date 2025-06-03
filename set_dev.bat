@echo off
echo ==========================================
echo   Setting up Development Environment
echo ==========================================

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install
cd app && npm install && cd ..

REM Setup Python virtual environment
echo Setting up Python environment...
cd python_backend

if exist myenv (
    echo Virtual environment already exists, activating...
    call myenv\Scripts\activate.bat
) else (
    echo Creating new virtual environment...
    python -m venv myenv
    call myenv\Scripts\activate.bat
)

REM Upgrade pip
python -m pip install --upgrade pip

REM Install Python dependencies
if exist requirements.txt (
    echo Installing Python dependencies...
    pip install -r requirements.txt
) else (
    echo No requirements.txt found, installing basic dependencies...
    pip install pandas numpy requests openpyxl python-dateutil
)

echo.
echo ==========================================
echo   Development environment setup complete!
echo ==========================================
echo.
echo To activate Python environment manually:
echo   cd python_backend
echo   myenv\Scripts\activate.bat
echo.
echo To run development server:
echo   npm run dev
echo.
pause

call myenv\Scripts\deactivate.bat
cd ..