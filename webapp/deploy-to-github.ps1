# 5ive Trackr - Live Deployment to GitHub Script
# This script commits and pushes the live deployment to GitHub for DigitalOcean auto-deploy

param(
    [string]$CommitMessage = "Live deployment update - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    [switch]$Force = $false,
    [switch]$DryRun = $false
)

Write-Host "=====================================" -ForegroundColor Green
Write-Host "5ive Trackr - Live Deployment Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the correct directory
$currentPath = Get-Location
Write-Host "Current directory: $currentPath" -ForegroundColor Cyan
Write-Host "Commit message: $CommitMessage" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "DRY RUN MODE - No changes will be committed" -ForegroundColor Yellow
    Write-Host ""
}

# Check Git status
Write-Host "Checking Git status..." -ForegroundColor Blue
try {
    $gitStatus = & git status --porcelain 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Not a Git repository or Git not available" -ForegroundColor Red
        Write-Host "Git output: $gitStatus" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error checking Git status: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Check if there are changes to commit
if (-not $gitStatus) {
    Write-Host "No changes detected" -ForegroundColor Green
    Write-Host "Repository is up to date" -ForegroundColor Green
    
    if (-not $Force) {
        Write-Host ""
        Write-Host "Use -Force flag to push anyway (useful for triggering redeployment)" -ForegroundColor Yellow
        exit 0
    } else {
        Write-Host "Force flag detected - will create empty commit to trigger redeployment" -ForegroundColor Yellow
    }
}

# Display changes
if ($gitStatus) {
    Write-Host "Changes detected:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object {
        $status = $_.Substring(0, 2)
        $file = $_.Substring(3)
        
        $statusColor = switch ($status.Trim()) {
            "M" { "Yellow" }
            "A" { "Green" }
            "D" { "Red" }
            "R" { "Cyan" }
            "??" { "Magenta" }
            default { "White" }
        }
        
        Write-Host "  $status $file" -ForegroundColor $statusColor
    }
    Write-Host ""
}

# Validate key files exist
$keyFiles = @(
    "requirements.txt",
    "api/server.py",
    "index.html",
    "home.html"
)

Write-Host "Validating key deployment files..." -ForegroundColor Blue
$missingFiles = @()
foreach ($file in $keyFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    } else {
        Write-Host "  OK: $file" -ForegroundColor Green
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "Error: Missing critical deployment files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  Missing: $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "Run the sync script first: build-development\scripts\deploy.ps1" -ForegroundColor Yellow
    exit 1
}

# Check requirements.txt validity
Write-Host "Validating requirements.txt..." -ForegroundColor Blue
try {
    $requirements = Get-Content "requirements.txt" -Raw
    if ($requirements -and $requirements.Trim()) {
        $lineCount = ($requirements -split "`n").Count
        Write-Host "  requirements.txt is valid with $lineCount lines" -ForegroundColor Green
    } else {
        Write-Host "  Warning: requirements.txt is empty" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Error: Could not read requirements.txt" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get current branch
try {
    $currentBranch = & git branch --show-current 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error getting current branch: $currentBranch" -ForegroundColor Red
        exit 1
    }
    Write-Host "Current branch: $currentBranch" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting Git branch: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get remote info
try {
    $remoteUrl = & git remote get-url origin 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: No remote 'origin' configured" -ForegroundColor Red
        Write-Host "Git output: $remoteUrl" -ForegroundColor Red
        exit 1
    }
    Write-Host "Remote origin: $remoteUrl" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting remote URL: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host ""
    Write-Host "DRY RUN SUMMARY:" -ForegroundColor Yellow
    Write-Host "  - Would add all changes to Git" -ForegroundColor Yellow
    Write-Host "  - Would commit with message: '$CommitMessage'" -ForegroundColor Yellow
    Write-Host "  - Would push to: $remoteUrl" -ForegroundColor Yellow
    Write-Host "  - Branch: $currentBranch" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Dry run completed successfully" -ForegroundColor Green
    exit 0
}

# Confirm deployment
if (-not $Force) {
    Write-Host ""
    Write-Host "Ready to deploy to GitHub:" -ForegroundColor Green
    Write-Host "  Repository: $remoteUrl" -ForegroundColor White
    Write-Host "  Branch: $currentBranch" -ForegroundColor White
    Write-Host "  Commit: '$CommitMessage'" -ForegroundColor White
    Write-Host ""
    $response = Read-Host "Proceed with deployment? (y/N)"
    
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Deployment cancelled by user" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Starting deployment process..." -ForegroundColor Green

# Stage all changes
Write-Host "Adding all changes to Git..." -ForegroundColor Blue
try {
    & git add . 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error adding files to Git" -ForegroundColor Red
        exit 1
    }
    Write-Host "  All changes staged" -ForegroundColor Green
} catch {
    Write-Host "Error staging changes: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create commit
Write-Host "Creating commit..." -ForegroundColor Blue
try {
    if ($Force -and -not $gitStatus) {
        # Create empty commit to trigger redeployment
        $commitOutput = git commit --allow-empty -m "$CommitMessage" 2>&1
    } else {
        $commitOutput = git commit -m "$CommitMessage" 2>&1
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error creating commit:" -ForegroundColor Red
        Write-Host "$commitOutput" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Commit created successfully" -ForegroundColor Green
} catch {
    Write-Host "Error creating commit: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Push to remote
Write-Host "Pushing to GitHub..." -ForegroundColor Blue
try {
    $pushOutput = git push origin $currentBranch 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error pushing to GitHub:" -ForegroundColor Red
        Write-Host "$pushOutput" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Successfully pushed to GitHub" -ForegroundColor Green
} catch {
    Write-Host "Error pushing to GitHub: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get commit hash
try {
    $commitHash = git rev-parse HEAD
    $shortHash = $commitHash.Substring(0, 7)
    Write-Host "Commit hash: $shortHash" -ForegroundColor Cyan
} catch {
    Write-Host "Could not get commit hash" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host "Repository: $remoteUrl" -ForegroundColor White
Write-Host "Branch: $currentBranch" -ForegroundColor White
Write-Host "Commit: $shortHash" -ForegroundColor White
Write-Host "Message: '$CommitMessage'" -ForegroundColor White
Write-Host ""
Write-Host "DigitalOcean should auto-deploy from GitHub now" -ForegroundColor Cyan
Write-Host "Live app: https://five-trackr-yq6ly.ondigitalocean.app/" -ForegroundColor Cyan
Write-Host ""

# Final status check
Write-Host "Final Git status:" -ForegroundColor Blue
$finalStatus = git status --porcelain
if (-not $finalStatus) {
    Write-Host "  Working directory clean" -ForegroundColor Green
} else {
    Write-Host "  Still have uncommitted changes:" -ForegroundColor Yellow
    $finalStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "Deployment complete!" -ForegroundColor Green
