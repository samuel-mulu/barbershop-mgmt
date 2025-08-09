@echo off
echo 🔧 Setting up Local MongoDB Environment...

set MONGODB_URI=mongodb://localhost:27017/barbershop-mgmt
set JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
set NODE_ENV=development

echo ✅ Environment variables set
echo    MONGODB_URI: %MONGODB_URI%
echo    JWT_SECRET: Set
echo    NODE_ENV: %NODE_ENV%

echo.
echo 🚀 Starting development server...
echo    Press Ctrl+C to stop the server
echo    Server will be available at: http://localhost:3000

npm run dev

