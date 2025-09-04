# 5ive Trackr - Complete Build & Deploy Script
# This script builds from development and deploys to GitHub in one step

param(
    [string]$CommitMessage = "",
    [switch]$SkipBuild = $false,
    [switch]$Force = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Green
Write-Host "5ive Trackr - Complete Build & Deploy" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Check if we're in the live-build directory
$currentPath = Get-Location
if (-not $currentPath.Path.EndsWith("live-build")) {
    Write-Host "❌ Error: This script must be run from the live-build directory" -ForegroundColor Red
    Write-Host "Current path: $currentPath" -ForegroundColor Yellow
    exit 1
}

# Set up paths
$liveDeployPath = $currentPath.Path
$buildDevPath = Split-Path $liveDeployPath -Parent | Join-Path -ChildPath "build-development"
$deployScript = Join-Path $buildDevPath "scripts\deploy.ps1"

Write-Host "📁 Live deployment: $liveDeployPath" -ForegroundColor Cyan
Write-Host "📁 Build development: $buildDevPath" -ForegroundColor Cyan

# Validate paths
if (-not (Test-Path $buildDevPath)) {
    Write-Host "❌ Error: Build development directory not found" -ForegroundColor Red
    Write-Host "Expected: $buildDevPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $deployScript)) {
    Write-Host "❌ Error: Deploy script not found" -ForegroundColor Red
    Write-Host "Expected: $deployScript" -ForegroundColor Red
    exit 1
}

# Generate commit message if not provided
if (-not $CommitMessage) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $CommitMessage = "🚀 Complete deployment update - $timestamp

✅ Built from latest build-development source
✅ Enhanced centralized user data storage system
✅ Universal Data Manager and API endpoints
✅ Updated admin dashboard with new data handling
✅ Deployed to live production environment

Ready for DigitalOcean auto-deploy"
}

Write-Host "📝 Commit message preview:" -ForegroundColor Yellow
Write-Host $CommitMessage -ForegroundColor White
Write-Host ""

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Build from development (unless skipped)
if (-not $SkipBuild) {
    Write-Host "🔨 Step 1: Building from development..." -ForegroundColor Blue
    Write-Host "Running: $deployScript" -ForegroundColor Gray
    
    if (-not $DryRun) {
        try {
            $buildResult = & $deployScript
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
                exit 1
            }
            Write-Host "✅ Build completed successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "  🔍 Would run build script" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  Skipping build step (using existing files)" -ForegroundColor Yellow
}

Write-Host ""

# Step 2: Commit and push to GitHub
Write-Host "🚀 Step 2: Deploying to GitHub..." -ForegroundColor Blue

$deployToGitScript = Join-Path $liveDeployPath "deploy-to-github.ps1"
if (-not (Test-Path $deployToGitScript)) {
    Write-Host "❌ Error: GitHub deploy script not found" -ForegroundColor Red
    Write-Host "Expected: $deployToGitScript" -ForegroundColor Red
    exit 1
}

$deployArgs = @("-CommitMessage", $CommitMessage)
if ($Force) { $deployArgs += "-Force" }
if ($DryRun) { $deployArgs += "-DryRun" }

Write-Host "Running: deploy-to-github.ps1 with arguments" -ForegroundColor Gray

if (-not $DryRun) {
    try {
        & $deployToGitScript @deployArgs
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ GitHub deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ GitHub deployment completed successfully" -ForegroundColor Green
    } catch {
        Write-Host "❌ GitHub deployment failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  🔍 Would run GitHub deployment script" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Summary
Write-Host "🎉 COMPLETE DEPLOYMENT FINISHED!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green

if (-not $DryRun) {
    Write-Host "✅ Build: Completed" -ForegroundColor Green
    Write-Host "✅ Deploy: Pushed to GitHub" -ForegroundColor Green
    Write-Host "🔗 DigitalOcean: Auto-deploy triggered" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🌐 Live application: https://five-trackr-yq6ly.ondigitalocean.app/" -ForegroundColor Cyan
    Write-Host "🏠 Main app: https://five-trackr-yq6ly.ondigitalocean.app/" -ForegroundColor Cyan
    Write-Host "👑 Admin: https://five-trackr-yq6ly.ondigitalocean.app/admin/" -ForegroundColor Cyan
    Write-Host "⚡ API: https://five-trackr-yq6ly.ondigitalocean.app/api/" -ForegroundColor Cyan
} else {
    Write-Host "🔍 DRY RUN SUMMARY:" -ForegroundColor Yellow
    Write-Host "  - Would build from development" -ForegroundColor Yellow
    Write-Host "  - Would commit and push to GitHub" -ForegroundColor Yellow
    Write-Host "  - Would trigger DigitalOcean deployment" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Your 5ive Trackr app is now deployed!" -ForegroundColor Green

# Show next steps
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Blue
Write-Host "  1. Monitor DigitalOcean deployment progress" -ForegroundColor White
Write-Host "  2. Test the live application functionality" -ForegroundColor White
Write-Host "  3. Verify Universal Data Manager is working" -ForegroundColor White
Write-Host "  4. Check admin dashboard user management" -ForegroundColor White
Write-Host ""
