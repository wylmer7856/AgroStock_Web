@echo off
echo ========================================
echo Configuracion de Variables de Entorno
echo Backend (API)
echo ========================================
echo.

cd api_movil

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
echo IMPORTANTE: Edita el archivo .env con tus credenciales:
echo   - DB_PASSWORD: Tu contraseña de MySQL
echo   - JWT_SECRET: Una clave secreta segura
echo.
echo Ubicacion: api_movil\.env
echo.
pause

:end

