@echo off
echo Starting PosiVibe development environment...

REM Start API server
start cmd /k "cd api && npm start"

REM Wait for API to start
timeout /t 5

REM Start React client with environment variables
start cmd /k "cd client && set REACT_APP_API_URL=http://localhost:8800/api && set REACT_APP_SOCKET_URL=http://localhost:8800 && npm start"

echo Development environment started!
echo API running at http://localhost:8800
echo Client running at http://localhost:3000
