# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['main_handler.py'],
    pathex=[],
    binaries=[],
    datas=[('auth_manager.py', '.'), ('bank_manager.py', '.'), ('billing_manager.py', '.'), ('cost_center_manager.py', '.'), ('dashboard_manager.py', '.'), ('database_manager.py', '.'), ('google_sheets_manager.py', '.'), ('home_data_manager.py', '.'), ('transaction_manager.py', '.'), ('requirements.txt', '.')],
    hiddenimports=['sqlite3', 'json', 'argparse', 'sys', 'os', 'traceback', 'datetime', 'pathlib', 'auth_manager', 'bank_manager', 'billing_manager', 'cost_center_manager', 'dashboard_manager', 'database_manager', 'google_sheets_manager', 'home_data_manager', 'transaction_manager'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='main_handler',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
