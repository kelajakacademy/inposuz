@echo off
echo Installing ProPOS System Dependencies...
npm install
echo.
echo Building Application...
npm run build
echo.
echo Setup Complete!
echo To start the application, run: npm run dev
pause
