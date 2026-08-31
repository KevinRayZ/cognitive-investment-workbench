@echo off
chcp 65001 >nul
title 认知投资工作台 - 使用期间请勿关闭此窗口
cd /d "%~dp0"

echo ============================================
echo   认知投资工作台 启动中...
echo   浏览器将自动打开 http://localhost:5173
echo   使用完毕后关闭本窗口即可退出
echo ============================================

start "" cmd /c "timeout /t 5 /nobreak >nul & start http://localhost:5173"
npm run dev -- --port 5173 --strictPort

echo.
echo 服务已停止。若浏览器未打开，请手动访问 http://localhost:5173
timeout /t 3 >nul
