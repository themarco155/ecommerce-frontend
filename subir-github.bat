@echo off
chcp 65001 >nul
REM Sube el proyecto (con la evidencia) a GitHub
cd /d "%~dp0"
git config user.name "Marco José Mejía Tario"
git config user.email "marcostario47@gmail.com"
git config core.fileMode false
git add -A
git commit -m "Evidencia: capturas de Swagger, flujo de compra, Lighthouse y PDF"
git remote remove origin >nul 2>&1
git remote add origin https://github.com/themarco155/ecommerce-frontend.git
git branch -M main
git push -u origin main
echo.
echo FIN. Revisa https://github.com/themarco155/ecommerce-frontend
pause
