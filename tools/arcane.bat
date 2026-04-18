@echo off
:: arcane.bat — Windows wrapper for arcane.sh
:: Put this file (or a copy) somewhere in your PATH for easy access.
:: Or run directly: C:\Users\Educabot\Desktop\Personal\Claude-Code-Arcane\tools\arcane.bat activate core backend-go

set "SCRIPT_DIR=%~dp0"
bash "%SCRIPT_DIR%arcane.sh" %*
