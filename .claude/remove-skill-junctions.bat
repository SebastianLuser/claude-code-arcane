@echo off
REM Remueve todas las junctions de .claude/skills/ (NO toca los archivos reales).
REM Una junction se identifica porque apunta a otra carpeta (atributo <JUNCTION>).

setlocal
set TARGET=%~dp0skills

if not exist "%TARGET%" (
  echo No existe %TARGET%, nada que hacer.
  exit /b 0
)

for /D %%K in ("%TARGET%\*") do (
  fsutil reparsepoint query "%%K" >nul 2>&1
  if not errorlevel 1 (
    rmdir "%%K"
    echo   - %%~nxK
  )
)
echo.
echo Junctions removidas de %TARGET%
endlocal
