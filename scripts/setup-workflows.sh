#!/bin/bash

# Growth Mentor Grid - Workflow Setup Script
# This script helps set up the GitHub Actions workflows and configuration

set -e

echo "🚀 Growth Mentor Grid - Workflow Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "This script must be run from the root of a git repository"
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI (gh) is not installed. Please install it first:"
    echo "  https://cli.github.com/"
    echo ""
    read -p "Continue without GitHub CLI? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "This script will help you set up the GitHub Actions workflows for your project."
echo ""

# Get repository information
REPO_NAME=$(basename -s .git $(git config --get remote.origin.url))
REPO_OWNER=$(git config --get remote.origin.url | sed -n 's/.*github\.com[:/]\([^/]*\)\/.*/\1/p')

if [ -z "$REPO_OWNER" ]; then
    print_warning "Could not determine repository owner. Please enter it manually:"
    read -p "Repository owner (username or organization): " REPO_OWNER
fi

print_info "Repository: $REPO_OWNER/$REPO_NAME"

echo ""
echo "📋 Prerequisites Check"
echo "======================"

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm: $NPM_VERSION"
else
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if workflows directory exists
if [ ! -d ".github/workflows" ]; then
    print_warning "Creating .github/workflows directory..."
    mkdir -p .github/workflows
fi

echo ""
echo "🔐 Required Secrets Configuration"
echo "================================"
echo ""

print_info "You'll need to add the following secrets to your GitHub repository:"
echo ""

echo "Supabase Configuration:"
echo "  - VITE_SUPABASE_URL"
echo "  - VITE_SUPABASE_ANON_KEY"
echo "  - SUPABASE_ACCESS_TOKEN"
echo "  - SUPABASE_PROJECT_REF"
echo ""

echo "Vercel Deployment:"
echo "  - VERCEL_TOKEN"
echo "  - VERCEL_ORG_ID"
echo "  - VERCEL_PROJECT_ID"
echo ""

echo "Security Tools (Optional):"
echo "  - SNYK_TOKEN"
echo ""

# Check if GitHub CLI is available for automatic setup
if command -v gh &> /dev/null; then
    echo "GitHub CLI detected. Would you like to set up secrets automatically?"
    read -p "Set up secrets via GitHub CLI? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        print_info "Setting up secrets via GitHub CLI..."
        
        # Check if user is authenticated
        if ! gh auth status &> /dev/null; then
            print_warning "Please authenticate with GitHub first:"
            gh auth login
        fi
        
        # Get Supabase configuration
        echo ""
        echo "📊 Supabase Configuration"
        echo "------------------------"
        read -p "Supabase Project URL: " SUPABASE_URL
        read -p "Supabase Anon Key: " SUPABASE_ANON_KEY
        read -p "Supabase Access Token: " SUPABASE_ACCESS_TOKEN
        read -p "Supabase Project Reference: " SUPABASE_PROJECT_REF
        
        # Get Vercel configuration
        echo ""
        echo "🚀 Vercel Configuration"
        echo "----------------------"
        read -p "Vercel Token: " VERCEL_TOKEN
        read -p "Vercel Organization ID: " VERCEL_ORG_ID
        read -p "Vercel Project ID: " VERCEL_PROJECT_ID
        
        # Set secrets
        print_info "Setting GitHub secrets..."
        
        gh secret set VITE_SUPABASE_URL --body "$SUPABASE_URL"
        gh secret set VITE_SUPABASE_ANON_KEY --body "$SUPABASE_ANON_KEY"
        gh secret set SUPABASE_ACCESS_TOKEN --body "$SUPABASE_ACCESS_TOKEN"
        gh secret set SUPABASE_PROJECT_REF --body "$SUPABASE_PROJECT_REF"
        gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
        gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
        gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
        
        print_status "All secrets have been set successfully!"
    fi
else
    print_warning "GitHub CLI not available. Please set secrets manually:"
    echo ""
    echo "1. Go to your repository on GitHub"
    echo "2. Navigate to Settings > Secrets and variables > Actions"
    echo "3. Add each secret listed above"
    echo ""
fi

echo ""
echo "🔧 Workflow Configuration"
echo "========================="

# Check if workflows are already present
if [ -f ".github/workflows/main.yml" ]; then
    print_status "Main workflow already exists"
else
    print_warning "Main workflow not found. Please ensure all workflow files are in place."
fi

if [ -f ".github/workflows/security-scan.yml" ]; then
    print_status "Security scanning workflow already exists"
else
    print_warning "Security scanning workflow not found."
fi

if [ -f ".github/workflows/dependency-updates.yml" ]; then
    print_status "Dependency updates workflow already exists"
else
    print_warning "Dependency updates workflow not found."
fi

if [ -f ".github/workflows/release.yml" ]; then
    print_status "Release management workflow already exists"
else
    print_warning "Release management workflow not found."
fi

echo ""
echo "📝 Branch Protection Setup"
echo "=========================="

if command -v gh &> /dev/null; then
    echo "Would you like to set up branch protection rules?"
    read -p "Set up branch protection? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Setting up branch protection rules..."
        
        # Protect main branch
        gh api repos/$REPO_OWNER/$REPO_NAME/branches/main/protection \
            --method PUT \
            --field required_status_checks='{"strict":true,"contexts":["Code Quality & Security","Run Tests","Build Application"]}' \
            --field enforce_admins=true \
            --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
            --field restrictions=null
        
        print_status "Main branch protection configured"
        
        # Protect develop branch
        gh api repos/$REPO_OWNER/$REPO_NAME/branches/develop/protection \
            --method PUT \
            --field required_status_checks='{"strict":true,"contexts":["Code Quality & Security","Run Tests","Build Application"]}' \
            --field enforce_admins=false \
            --field restrictions=null
        
        print_status "Develop branch protection configured"
    fi
else
    print_warning "GitHub CLI not available. Please set up branch protection manually:"
    echo ""
    echo "1. Go to your repository on GitHub"
    echo "2. Navigate to Settings > Branches"
    echo "3. Add rule for 'main' branch with:"
    echo "   - Require status checks to pass"
    echo "   - Require pull request reviews"
    echo "   - Include administrators"
    echo "4. Add rule for 'develop' branch with:"
    echo "   - Require status checks to pass"
fi

echo ""
echo "✅ Setup Complete!"
echo "================"
echo ""

print_status "Your GitHub Actions workflows are now configured!"
echo ""

print_info "Next steps:"
echo "1. Push your code to trigger the first workflow run"
echo "2. Check the Actions tab to monitor workflow execution"
echo "3. Review the WorkflowGuide.md for detailed usage instructions"
echo "4. Set up your deployment environments (Vercel, etc.)"
echo ""

print_info "Workflow files created:"
echo "  - .github/workflows/main.yml (Main CI/CD pipeline)"
echo "  - .github/workflows/security-scan.yml (Security scanning)"
echo "  - .github/workflows/dependency-updates.yml (Dependency management)"
echo "  - .github/workflows/release.yml (Release management)"
echo ""

print_info "Documentation:"
echo "  - docs/WorkflowGuide.md (Comprehensive workflow guide)"
echo ""

echo "🎉 Happy coding!"
