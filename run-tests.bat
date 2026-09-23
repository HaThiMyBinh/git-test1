@echo off
chcp 65001 > nul
echo   Đang chạy hệ thống kiểm thử tự động (Automated Tests)
echo   Task 1: Form Validation & Role Matrix UI
echo   Task 2: DB Schema & RBAC API Middleware
echo.
node --test tests/validation.test.js
node --test tests/db_schema.test.js
node --test tests/rbac.test.js
echo.
echo   Tất cả kịch bản kiểm thử đã hoàn tất!
echo.
pause
