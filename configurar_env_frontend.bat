@echo off
echo ========================================
echo Configuracion de Variables de Entorno
echo Frontend
echo ========================================
echo.

cd Front_proyecto

if exist .env (
    echo El archivo .env ya existe.
    echo.
    choice /C SN /M "Deseas sobrescribirlo"
    if errorlevel 2 goto :end
    if errorlevel 1 goto :crear
) else (
    goto :crear
)

:crear
echo Creando archivo .env desde env.example...
copy env.example .env >nul
echo.
echo Archivo .env creado exitosamente!
echo.
echo IMPORTANTE: Verifica que VITE_API_URL apunte a:
echo   http://localhost:8000
echo.
echo Ubicacion: Front_proyecto\.env
echo.
pause

:end

