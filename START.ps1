# Hackathon Platform Startup Script

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Hackathon Platform - Educational Hub" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB connection..." -ForegroundColor Yellow
try {
    $mongoTest = Invoke-Expression "mongosh --eval 'db.version()'" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MongoDB is running" -ForegroundColor Green
    } else {
        Write-Host "WARNING: MongoDB might not be running. Make sure MongoDB is started." -ForegroundColor Red
    }
} catch {
    Write-Host "WARNING: Could not connect to MongoDB. Start MongoDB first." -ForegroundColor Red
}

Write-Host ""
Write-Host "Starting Backend..." -ForegroundColor Yellow
Set-Location .\backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
Write-Host "Backend started on http://localhost:5000" -ForegroundColor Green

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Starting Frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
Write-Host "Frontend started on http://localhost:3000" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Platform is ready!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Principal: test@principal (any password)" -ForegroundColor Green
Write-Host "  Teacher: test@teacher (any password)" -ForegroundColor Green
Write-Host "  Student: test@student (any password)" -ForegroundColor Green
Write-Host ""
