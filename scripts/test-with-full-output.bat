@echo off
echo Running tests with full error output...
echo.

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Run tests and capture all output
npm test > logs\test-output.log 2>&1

REM Display the results
echo Test completed. Results saved to logs\test-output.log
echo.
echo === SUMMARY ===
findstr /C:"FAIL" /C:"PASS" /C:"Test Suites:" /C:"Tests:" logs\test-output.log

echo.
echo === ERRORS ===
findstr /C:"Error:" /C:"TypeError:" /C:"ReferenceError:" /C:"Failed" logs\test-output.log

echo.
echo Full output saved to: logs\test-output.log
echo To view full output: type logs\test-output.log
pause