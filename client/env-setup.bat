@echo off
echo Setting up client .env file...
if not exist .env (
    echo REACT_APP_API_URL=http://localhost:5000/api > .env
    echo .env file created successfully!
) else (
    echo .env file already exists, skipping...
)
pause

