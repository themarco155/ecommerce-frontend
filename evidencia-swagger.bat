@echo off
REM Rehace solo las capturas de Swagger y el PDF (sin repetir la compra ni Lighthouse)
cd /d "%~dp0"
curl -s -o nul http://127.0.0.1:8000/api/products
if errorlevel 1 (
  echo La API no responde. Levantandola en otra ventana...
  start "API Laravel" cmd /k "cd /d %~dp0..\ecommerce-api && php artisan serve"
  timeout /t 8 /nobreak > nul
)
call npm run evidencia:swagger > evidencia-log.txt 2>&1
type evidencia-log.txt
echo.
echo FIN. Puedes cerrar esta ventana.
pause
