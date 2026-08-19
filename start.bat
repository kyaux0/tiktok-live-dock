@echo off
title TikTok LIVE Dock

echo.
echo ========================================
echo           TikTok LIVE Dock
echo ========================================
echo.

if not exist "node_modules" (

    echo [SETUP] First launch detected.
    echo [SETUP] Installing required dependencies...
    echo.

    call npm install

    if errorlevel 1 (

        echo.
        echo [ERROR] npm install failed.
        echo Make sure Node.js and npm are installed.
        echo.

        pause

        exit /b 1

    )

    echo.
    echo [SETUP] Dependencies installed successfully.

)

echo.
echo [DOCK] Starting TikTok LIVE Dock...
echo.

call npm start

echo.
echo [DOCK] Server stopped.
echo.

pause