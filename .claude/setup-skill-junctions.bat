@echo off
REM Crea junctions de cada skill-stack a .claude/skills/ para que Claude Code las descubra.
REM Ejecutar desde .claude/ o darle double-click.

setlocal
set BASE=%~dp0
set TARGET=%BASE%skills

if not exist "%TARGET%" mkdir "%TARGET%"

for %%S in (skills-git skills-testing skills-docs skills-frontend skills-mobile skills-backend skills-devops skills-agile skills-design skills-gamedev skills-integrations skills-release skills-security skills-arcane) do (
  if exist "%BASE%%%S" (
    echo [%%S]
    for /D %%K in ("%BASE%%%S\*") do (
      if not exist "%TARGET%\%%~nxK" (
        mklink /J "%TARGET%\%%~nxK" "%%K" >nul
        echo   + %%~nxK
      )
    )
  )
)
echo.
echo Junctions creadas en %TARGET%
endlocal
