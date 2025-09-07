# Growth Mentor Grid - Workflow Guide

This document provides a comprehensive guide to the CI/CD workflows and development processes for the Growth Mentor Grid project.

## 🚀 Overview

The project uses GitHub Actions for automated CI/CD with the following key workflows:

1. **Main CI/CD Pipeline** (`main.yml`) - Core development workflow
2. **Security Scanning** (`security-scan.yml`) - Security vulnerability detection
3. **Dependency Updates** (`dependency-updates.yml`) - Automated dependency management
4. **Release Management** (`release.yml`) - Version control and releases

## 📋 Prerequisites

Before using these workflows, ensure you have:

- GitHub repository with Actions enabled
- Required secrets configured (see [Secrets Configuration](#secrets-configuration))
- Vercel project set up for deployment
- Supabase project configured

## 🔐 Secrets Configuration

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

### Required Secrets

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_ACCESS_TOKEN=your-supabase-access-token
SUPABASE_PROJECT_REF=your-project-ref

# Vercel Deployment
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id

# Security Tools (Optional)
SNYK_TOKEN=your-snyk-token
```

### How to Get Secrets

#### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to `Settings > API`
4. Copy `Project URL` and `anon public` key
5. For access token: `Settings > Access Tokens`

#### Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to `Settings > Tokens`
3. Create a new token
4. Get org and project IDs from project settings

## 🔄 Main CI/CD Pipeline

### Triggers
- **Push** to `main` or `develop` branches
- **Pull Request** to `main` or `develop` branches
- **Manual dispatch** with environment selection

### Workflow Stages

#### 1. Code Quality & Security
- ESLint code linting
- TypeScript type checking
- Security audit with npm
- Secret scanning with TruffleHog

#### 2. Testing
- Unit test execution
- Coverage reporting
- Codecov integration

#### 3. Build & Package
- Application build
- Artifact upload
- Environment variable injection

#### 4. Database Migrations
- Supabase CLI setup
- Database schema updates
- Edge function deployment

#### 5. Deployment
- **Staging**: Auto-deploy on `develop` branch push
- **Production**: Auto-deploy on `main` branch push
- **Manual**: On-demand deployment to any environment

#### 6. Health Check
- Post-deployment verification
- API endpoint testing
- Deployment success confirmation

## 🛡️ Security Scanning

### Triggers
- **Daily** at 2 AM UTC
- **Security advisories**
- **Code pushes** and **PRs**

### Security Tools
- **npm audit** - Dependency vulnerability scanning
- **Snyk** - Advanced security analysis
- **OWASP Dependency Check** - Comprehensive security review

### Reports
- Security reports uploaded as artifacts
- 90-day retention period
- High severity issue notifications

## 📦 Dependency Updates

### Triggers
- **Weekly** on Monday at 6 AM UTC
- **Manual dispatch** with update type selection

### Update Types
- **Security** - Critical security patches only
- **Minor** - Minor version updates
- **Major** - Major version updates (breaking changes)

### Process
1. Check for outdated packages
2. Update dependencies based on type
3. Run tests to ensure compatibility
4. Create automated PR for review
5. Apply labels and descriptions

## 🏷️ Release Management

### Triggers
- **Git tags** (e.g., `v1.0.0`)
- **Manual dispatch** with version input

### Features
- Automated changelog generation
- GitHub release creation
- Production deployment
- Version tagging

### Release Types
- **Major** - Breaking changes
- **Minor** - New features
- **Patch** - Bug fixes
- **Pre-release** - Alpha/beta versions

## 🚀 Deployment Environments

### Staging
- **Branch**: `develop`
- **Auto-deploy**: Yes
- **URL**: `https://staging.your-domain.vercel.app`
- **Purpose**: Testing and validation

### Production
- **Branch**: `main`
- **Auto-deploy**: Yes
- **URL**: `https://your-domain.vercel.app`
- **Purpose**: Live application

### Manual Deployment
- **Trigger**: Workflow dispatch
- **Environment**: Selectable
- **Use case**: Hotfixes, testing, etc.

## 📝 Branch Strategy

```
main (production)
├── develop (staging)
├── feature/feature-name
├── bugfix/bug-description
└── hotfix/urgent-fix
```

### Branch Protection Rules
- **main**: Requires PR review and CI passing
- **develop**: Requires CI passing
- **Feature branches**: No restrictions

## 🔧 Local Development Workflow

### 1. Setup
```bash
git clone <repository-url>
cd growth-mentor-grid
npm install
```

### 2. Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

### 3. Feature Development
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
```

### 4. Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## 📊 Monitoring & Notifications

### Success Notifications
- Deployment confirmations
- Test pass notifications
- Security scan results

### Failure Notifications
- Build failures
- Test failures
- Security vulnerabilities
- Deployment issues

### Health Checks
- API endpoint monitoring
- Response time tracking
- Error rate monitoring

## 🚨 Troubleshooting

### Common Issues

#### Build Failures
1. Check Node.js version compatibility
2. Verify all dependencies are installed
3. Check for TypeScript compilation errors
4. Review ESLint configuration

#### Deployment Failures
1. Verify Vercel credentials
2. Check environment variables
3. Review build output
4. Check Vercel project settings

#### Security Scan Failures
1. Review vulnerability reports
2. Update vulnerable dependencies
3. Check for false positives
4. Review security tool configurations

### Debug Steps
1. Check workflow logs in GitHub Actions
2. Verify secrets are correctly configured
3. Test locally with same Node.js version
4. Review recent changes for breaking modifications

## 📚 Additional Resources

### Documentation
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)

### Tools
- [ESLint](https://eslint.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Best Practices
- Keep workflows focused and modular
- Use semantic versioning for releases
- Implement proper branch protection
- Regular security scanning and updates
- Comprehensive testing before deployment

## 🤝 Contributing

When contributing to the workflows:

1. Test changes locally first
2. Follow the existing workflow patterns
3. Update documentation for any changes
4. Ensure backward compatibility
5. Test in staging before production

## 📞 Support

For workflow-related issues:

1. Check the troubleshooting section
2. Review GitHub Actions logs
3. Consult the project documentation
4. Create an issue with detailed information
5. Contact the development team

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Maintainer**: Development Team
