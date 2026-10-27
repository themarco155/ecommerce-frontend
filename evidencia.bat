@echo off
REM Genera capturas, reportes Lighthouse y PDF de evidencia
cd /d "%~dp0"
echo. > evidencia-log.txt

REM Si la API no responde, la levanta en otra ventana
curl -s -o nul http://127.0.0.1:8000/api/products
if errorlevel 1 (
  echo La API no responde. Levantandola en otra ventana...
  start "API Laravel" cmd /k "cd /d %~dp0..\ecommerce-api && php artisan serve"
  timeout /t 8 /nobreak > nul
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install >> evidencia-log.txt 2>&1
)
echo Generando evidencia, espera unos minutos...
call npm run evidencia >> evidencia-log.txt 2>&1
type evidencia-log.txt
echo.
echo FIN. Puedes cerrar esta ventana (deja abierta la de la API).
pause
