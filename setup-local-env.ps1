# Local MongoDB Environment Setup Script
# Run this script to set up your local MongoDB environment

Write-Host "🔧 Setting up Local MongoDB Environment..." -ForegroundColor Green

# Set environment variables
$env:MONGODB_URI = "mongodb://localhost:27017/barbershop-mgmt"
$env:JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production"
$env:NODE_ENV = "development"

Write-Host "✅ Environment variables set:" -ForegroundColor Green
Write-Host "   MONGODB_URI: $env:MONGODB_URI" -ForegroundColor Cyan
Write-Host "   JWT_SECRET: Set" -ForegroundColor Cyan
Write-Host "   NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan

# Test MongoDB connection
Write-Host "`n🔍 Testing MongoDB connection..." -ForegroundColor Yellow

try {
    $testScript = @"
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/barbershop-mgmt')
  .then(() => {
    console.log('✅ MongoDB connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
"@
    
    $testScript | node
    $connectionSuccess = $LASTEXITCODE -eq 0
} catch {
    $connectionSuccess = $false
}

if ($connectionSuccess) {
    Write-Host "`n🚀 Starting development server..." -ForegroundColor Green
    Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Yellow
    Write-Host "   Server will be available at: http://localhost:3000" -ForegroundColor Cyan
    
    # Start the development server
    npm run dev
} else {
    Write-Host "`n❌ MongoDB connection failed!" -ForegroundColor Red
    Write-Host "Please ensure MongoDB is running:" -ForegroundColor Yellow
    Write-Host "1. Check if MongoDB service is running" -ForegroundColor White
    Write-Host "2. Open Services (services.msc) and start 'MongoDB'" -ForegroundColor White
    Write-Host "3. Or run: Get-Service -Name 'MongoDB' | Start-Service" -ForegroundColor White
}

