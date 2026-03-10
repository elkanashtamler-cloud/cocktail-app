@echo off
echo Starting local server...
echo Open http://localhost:8080 in your browser
echo.
where python >nul 2>&1
if %errorlevel% equ 0 (
    python -m http.server 8080
) else (
    npx -y serve -p 8080
)
pause
