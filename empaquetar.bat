@echo off
title Empaquetar App IPTV LG webOS
echo ========================================================
echo     EMPAQUETADOR AUTOMATICO PARA LG WEBOS (LF6350)
echo ========================================================
echo.
echo Creando archivo .ipk listo para instalar...
call ares-package .
echo.
if exist "com.peru.canales.nacionales_1.0.0_all.ipk" (
    echo [EXITO] Archivo creado: com.peru.canales.nacionales_1.0.0_all.ipk
    echo Ya puedes instalarlo usando webOS Dev Manager o ares-install.
) else (
    echo [ERROR] No se pudo generar el archivo .ipk. Verifica que ares-package este instalado.
)
echo.
pause
