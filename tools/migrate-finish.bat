@echo off
REM Phase 2 of Arcane migration: handles skills/ + commands/ that were locked
REM by an active Claude Code session in phase 1.
REM
REM Run this from a regular cmd prompt OUTSIDE Claude Code:
REM   cd C:\Users\Educabot\Desktop\Personal\Claude-Code-Arcane
REM   tools\migrate-finish.bat

setlocal enabledelayedexpansion

set ARCANE=%~dp0..
if "%ARCANE:~-1%"=="\" set ARCANE=%ARCANE:~0,-1%
set GLOBAL=%USERPROFILE%\.claude

REM Timestamp for backup dir (PowerShell avoids wmic deprecation + locale issues)
for /f %%a in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set TS=%%a
set BACKUP=%USERPROFILE%\.claude-backup-%TS%

echo === Phase 2: skills + commands ===
echo   Source : %ARCANE%\.claude
echo   Target : %GLOBAL%
echo   Backup : %BACKUP%
echo.

REM Detect if Claude Code is still running
tasklist /FI "IMAGENAME eq claude.exe" 2>nul | find /I "claude.exe" >nul
if not errorlevel 1 (
  echo WARNING: claude.exe is running. Close ALL Claude Code instances first.
  pause
  exit /b 1
)
tasklist /FI "IMAGENAME eq node.exe" 2>nul | find /I "node.exe" >nul
if not errorlevel 1 (
  echo NOTE: node.exe is running. If Claude Code is one of those processes,
  echo       this script may fail. Consider closing all Claude sessions first.
  echo.
)

set /p ANS="Proceed? [y/N] "
if /i not "%ANS%"=="y" (
  echo Aborted.
  exit /b 0
)

REM Create backup dir
mkdir "%BACKUP%" 2>nul

REM Backup + junction for each
for %%d in (skills commands) do (
  if exist "%GLOBAL%\%%d" (
    echo   move "%GLOBAL%\%%d" -^> "%BACKUP%\%%d"
    move "%GLOBAL%\%%d" "%BACKUP%\%%d" >nul
    if errorlevel 1 (
      echo   ERROR: cannot move %GLOBAL%\%%d - is Claude Code closed?
      exit /b 1
    )
  )
)

REM Only create junction for skills (commands stays in backup, Arcane skills supersede)
echo   mklink /J "%GLOBAL%\skills" "%ARCANE%\.claude\skills"
mklink /J "%GLOBAL%\skills" "%ARCANE%\.claude\skills" >nul
if errorlevel 1 (
  echo   ERROR creating skills junction
  exit /b 1
)

echo.
echo === Verification ===
if exist "%GLOBAL%\skills" (
  echo   OK   %GLOBAL%\skills [junction]
) else (
  echo   FAIL %GLOBAL%\skills
)
if exist "%GLOBAL%\commands" (
  echo   WARN %GLOBAL%\commands still exists
) else (
  echo   OK   %GLOBAL%\commands removed (legacy, Arcane skills supersede)
)

echo.
echo Migration complete.
echo   Backup: %BACKUP%
echo.
echo Test: cd to any folder, run claude, try /scaffold-go or /audit-game
endlocal
