@echo off
setlocal enabledelayedexpansion

REM Growth Mentor Grid - Workflow Setup Script (Windows)
REM This script helps set up the GitHub Actions workflows and configuration

echo 🚀 Growth Mentor Grid - Workflow Setup
echo ======================================
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo ✗ This script must be run from the root of a git repository
    pause
    exit /b 1
)

echo This script will help you set up the GitHub Actions workflows for your project.
echo.

REM Get repository information
for /f "tokens=*" %%i in ('git config --get remote.origin.url') do set REMOTE_URL=%%i
for /f "tokens=2 delims=/" %%i in ("%REMOTE_URL%") do set REPO_OWNER=%%i
for /f "tokens=3 delims=/" %%i in ("%REMOTE_URL%") do set REPO_NAME=%%i
set REPO_NAME=%REPO_NAME:.git=%

if "%REPO_OWNER%"=="" (
    echo ⚠ Could not determine repository owner. Please enter it manually:
    set /p REPO_OWNER="Repository owner (username or organization): "
)

echo ℹ Repository: %REPO_OWNER%/%REPO_NAME%
echo.

echo 📋 Prerequisites Check
echo ======================

REM Check Node.js version
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✓ Node.js: %NODE_VERSION%
)

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ npm is not installed. Please install npm first.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✓ npm: %NPM_VERSION%
)

REM Check if workflows directory exists
if not exist ".github\workflows" (
    echo ⚠ Creating .github\workflows directory...
    mkdir ".github\workflows" 2>nul
)

echo.
echo 🔐 Required Secrets Configuration
echo ================================
echo.

echo ℹ You'll need to add the following secrets to your GitHub repository:
echo.

echo Supabase Configuration:
echo   - VITE_SUPABASE_URL
echo   - VITE_SUPABASE_ANON_KEY
echo   - SUPABASE_ACCESS_TOKEN
echo   - SUPABASE_PROJECT_REF
echo.

echo Vercel Deployment:
echo   - VERCEL_TOKEN
echo   - VERCEL_ORG_ID
echo   - VERCEL_PROJECT_ID
echo.

echo Security Tools (Optional):
echo   - SNYK_TOKEN
echo.

REM Check if GitHub CLI is available
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo GitHub CLI detected. Would you like to set up secrets automatically?
    set /p SETUP_SECRETS="Set up secrets via GitHub CLI? (y/N): "
    if /i "!SETUP_SECRETS!"=="y" (
        echo.
        echo ℹ Setting up secrets via GitHub CLI...
        
        REM Check if user is authenticated
        gh auth status >nul 2>&1
        if %errorlevel% neq 0 (
            echo ⚠ Please authenticate with GitHub first:
            gh auth login
        )
        
        REM Get Supabase configuration
        echo.
        echo 📊 Supabase Configuration
        echo ------------------------
        set /p SUPABASE_URL="Supabase Project URL: "
        set /p SUPABASE_ANON_KEY="Supabase Anon Key: "
        set /p SUPABASE_ACCESS_TOKEN="Supabase Access Token: "
        set /p SUPABASE_PROJECT_REF="Supabase Project Reference: "
        
        REM Get Vercel configuration
        echo.
        echo 🚀 Vercel Configuration
        echo ----------------------
        set /p VERCEL_TOKEN="Vercel Token: "
        set /p VERCEL_ORG_ID="Vercel Organization ID: "
        set /p VERCEL_PROJECT_ID="Vercel Project ID: "
        
        REM Set secrets
        echo ℹ Setting GitHub secrets...
        
        gh secret set VITE_SUPABASE_URL --body "!SUPABASE_URL!"
        gh secret set VITE_SUPABASE_ANON_KEY --body "!SUPABASE_ANON_KEY!"
        gh secret set SUPABASE_ACCESS_TOKEN --body "!SUPABASE_ACCESS_TOKEN!"
        gh secret set SUPABASE_PROJECT_REF --body "!SUPABASE_PROJECT_REF!"
        gh secret set VERCEL_TOKEN --body "!VERCEL_TOKEN!"
        gh secret set VERCEL_ORG_ID --body "!VERCEL_ORG_ID!"
        gh secret set VERCEL_PROJECT_ID --body "!VERCEL_PROJECT_ID!"
        
        echo ✓ All secrets have been set successfully!
    )
) else (
    echo ⚠ GitHub CLI not available. Please set secrets manually:
    echo.
    echo 1. Go to your repository on GitHub
    echo 2. Navigate to Settings ^> Secrets and variables ^> Actions
    echo 3. Add each secret listed above
    echo.
)

echo.
echo 🔧 Workflow Configuration
echo =========================

REM Check if workflows are already present
if exist ".github\workflows\main.yml" (
    echo ✓ Main workflow already exists
) else (
    echo ⚠ Main workflow not found. Please ensure all workflow files are in place.
)

if exist ".github\workflows\security-scan.yml" (
    echo ✓ Security scanning workflow already exists
) else (
    echo ⚠ Security scanning workflow not found.
)

if exist ".github\workflows\dependency-updates.yml" (
    echo ✓ Dependency updates workflow already exists
) else (
    echo ⚠ Dependency updates workflow not found.
)

if exist ".github\workflows\release.yml" (
    echo ✓ Release management workflow already exists
) else (
    echo ⚠ Release management workflow not found.
)

echo.
echo 📝 Branch Protection Setup
echo ==========================

REM Check if GitHub CLI is available for branch protection
gh --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Would you like to set up branch protection rules?
    set /p SETUP_PROTECTION="Set up branch protection? (y/N): "
    if /i "!SETUP_PROTECTION!"=="y" (
        echo ℹ Setting up branch protection rules...
        
        REM Protect main branch
        gh api repos/%REPO_OWNER%/%REPO_NAME%/branches/main/protection --method PUT --field required_status_checks="{\"strict\":true,\"contexts\":[\"Code Quality & Security\",\"Run Tests\",\"Build Application\"]}" --field enforce_admins=true --field required_pull_request_reviews="{\"required_approving_review_count\":1,\"dismiss_stale_reviews\":true,\"require_code_owner_reviews\":false}" --field restrictions=null
        
        echo ✓ Main branch protection configured
        
        REM Protect develop branch
        gh api repos/%REPO_OWNER%/%REPO_NAME%/branches/develop/protection --method PUT --field required_status_checks="{\"strict\":true,\"contexts\":[\"Code Quality & Security\",\"Run Tests\",\"Build Application\"]}" --field enforce_admins=false --field restrictions=null
        
        echo ✓ Develop branch protection configured
    )
) else (
    echo ⚠ GitHub CLI not available. Please set up branch protection manually:
    echo.
    echo 1. Go to your repository on GitHub
    echo 2. Navigate to Settings ^> Branches
    echo 3. Add rule for 'main' branch with:
    echo    - Require status checks to pass
    echo    - Require pull request reviews
    echo    - Include administrators
    echo 4. Add rule for 'develop' branch with:
    echo    - Require status checks to pass
)

echo.
echo ✅ Setup Complete!
echo ================
echo.

echo ✓ Your GitHub Actions workflows are now configured!
echo.

echo ℹ Next steps:
echo 1. Push your code to trigger the first workflow run
echo 2. Check the Actions tab to monitor workflow execution
echo 3. Review the WorkflowGuide.md for detailed usage instructions
echo 4. Set up your deployment environments (Vercel, etc.)
echo.

echo ℹ Workflow files created:
echo   - .github\workflows\main.yml (Main CI/CD pipeline)
echo   - .github\workflows\security-scan.yml (Security scanning)
echo   - .github\workflows\dependency-updates.yml (Dependency management)
echo   - .github\workflows\release.yml (Release management)
echo.

echo ℹ Documentation:
echo   - docs\WorkflowGuide.md (Comprehensive workflow guide)
echo.

echo 🎉 Happy coding!
pause
