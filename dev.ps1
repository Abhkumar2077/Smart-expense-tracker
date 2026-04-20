# Smart Expense Tracker Development Script
# Run with: .\dev.ps1 <command>

param(
    [Parameter(Mandatory=$true)]
    [string]$Command
)

function Write-Header {
    param([string]$Text)
    Write-Host "=== $Text ===" -ForegroundColor Cyan
}

function Install-Backend {
    Write-Header "Installing Backend Dependencies"
    Set-Location backend
    npm install
    Set-Location ..
}

function Install-Frontend {
    Write-Header "Installing Frontend Dependencies"
    Set-Location frontend
    npm install
    Set-Location ..
}

function Setup-Database {
    Write-Header "Setting up Database"
    $dbScript = "database\setup.sql"

    if (!(Test-Path $dbScript)) {
        Write-Host "Database setup script not found at $dbScript" -ForegroundColor Red
        return
    }

    Write-Host "Creating databases..."
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS expense_tracker;"
    mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS expense_tracker_test;"

    Write-Host "Running setup script..."
    mysql -u root -p expense_tracker < $dbScript
}

function Setup-Environment {
    Write-Header "Setting up Environment Files"

    # Backend .env
    if (!(Test-Path "backend\.env")) {
        Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue
        if (Test-Path "backend\.env") {
            Write-Host "Created backend/.env - please edit with your values" -ForegroundColor Yellow
        } else {
            Write-Host "backend/.env.example not found, creating template..." -ForegroundColor Yellow
            @"
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=expense_tracker
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key
"@ | Out-File "backend\.env" -Encoding UTF8
        }
    }

    # Frontend .env
    if (!(Test-Path "frontend\.env.development.local")) {
        @"
REACT_APP_API_URL=http://localhost:5000/api
"@ | Out-File "frontend\.env.development.local" -Encoding UTF8
        Write-Host "Created frontend/.env.development.local" -ForegroundColor Green
    }
}

function Run-Backend {
    Write-Header "Starting Backend Server"
    Set-Location backend
    npm run dev
}

function Run-Frontend {
    Write-Header "Starting Frontend Server"
    Set-Location frontend
    npm start
}

function Test-Backend {
    Write-Header "Running Backend Tests"
    Set-Location backend
    npm test
}

function Test-Frontend {
    Write-Header "Running Frontend Tests"
    Set-Location frontend
    npm test
}

function Lint-Backend {
    Write-Header "Linting Backend Code"
    Set-Location backend
    npm run lint
}

function Lint-Frontend {
    Write-Header "Linting Frontend Code"
    Set-Location frontend
    npm run lint
}

function Format-Backend {
    Write-Header "Formatting Backend Code"
    Set-Location backend
    npm run format
}

function Format-Frontend {
    Write-Header "Formatting Frontend Code"
    Set-Location frontend
    npm run format
}

function Clean-Backend {
    Write-Header "Cleaning Backend"
    Set-Location backend
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
    if (Test-Path "coverage") { Remove-Item -Recurse -Force coverage }
    Set-Location ..
}

function Clean-Frontend {
    Write-Header "Cleaning Frontend"
    Set-Location frontend
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force node_modules }
    if (Test-Path "build") { Remove-Item -Recurse -Force build }
    Set-Location ..
}

function Build-Frontend {
    Write-Header "Building Frontend for Production"
    Set-Location frontend
    npm run build
    Set-Location ..
}

switch ($Command) {
    "install" {
        Install-Backend
        Install-Frontend
    }
    "install-backend" { Install-Backend }
    "install-frontend" { Install-Frontend }
    "setup-db" { Setup-Database }
    "setup-env" { Setup-Environment }
    "run-backend" { Run-Backend }
    "run-frontend" { Run-Frontend }
    "test" {
        Test-Backend
        Test-Frontend
    }
    "test-backend" { Test-Backend }
    "test-frontend" { Test-Frontend }
    "lint" {
        Lint-Backend
        Lint-Frontend
    }
    "lint-backend" { Lint-Backend }
    "lint-frontend" { Lint-Frontend }
    "format" {
        Format-Backend
        Format-Frontend
    }
    "format-backend" { Format-Backend }
    "format-frontend" { Format-Frontend }
    "clean" {
        Clean-Backend
        Clean-Frontend
    }
    "clean-backend" { Clean-Backend }
    "clean-frontend" { Clean-Frontend }
    "build" { Build-Frontend }
    default {
        Write-Host "Available commands:" -ForegroundColor Green
        Write-Host "  install          - Install all dependencies"
        Write-Host "  setup-db         - Setup database"
        Write-Host "  setup-env        - Setup environment files"
        Write-Host "  run-backend      - Run backend server"
        Write-Host "  run-frontend     - Run frontend server"
        Write-Host "  test             - Run all tests"
        Write-Host "  lint             - Run linting on all code"
        Write-Host "  format           - Format all code"
        Write-Host "  clean            - Clean all build artifacts"
        Write-Host "  build            - Build for production"
    }
}