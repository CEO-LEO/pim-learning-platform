@echo off
echo Setting up server .env file...
if not exist .env (
    echo PORT=5000 > .env
    echo JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production_123456789 >> .env
    echo DATABASE_URL=sqlite:./database/pim_learning.db >> .env
    echo API_URL=http://localhost:5000/api >> .env
    echo .env file created successfully!
) else (
    echo .env file already exists, skipping...
)
pause

