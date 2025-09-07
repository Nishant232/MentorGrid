# GitHub Actions Workflows

This directory contains the CI/CD workflows for the Growth Mentor Grid project.

## 📋 Available Workflows

### 1. Main CI/CD Pipeline (`main.yml`)
**Purpose**: Core development workflow that runs on every push and PR
**Triggers**: 
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual dispatch

**Stages**:
- Code Quality & Security
- Testing
- Build & Package
- Database Migrations
- Deployment (Staging/Production)
- Health Check

### 2. Security Scanning (`security-scan.yml`)
**Purpose**: Automated security vulnerability detection
**Triggers**:
- Daily at 2 AM UTC
- Security advisories
- Code pushes and PRs

**Tools**:
- npm audit
- Snyk security analysis
- OWASP Dependency Check

### 3. Dependency Updates (`dependency-updates.yml`)
**Purpose**: Automated dependency management and updates
**Triggers**:
- Weekly on Monday at 6 AM UTC
- Manual dispatch

**Update Types**:
- Security patches
- Minor version updates
- Major version updates

### 4. Release Management (`release.yml`)
**Purpose**: Version control and release automation
**Triggers**:
- Git tags (e.g., `v1.0.0`)
- Manual dispatch

**Features**:
- Automated changelog generation
- GitHub release creation
- Production deployment

## 🚀 Quick Start

1. **Setup**: Run the setup script to configure workflows
   ```bash
   # Linux/Mac
   ./scripts/setup-workflows.sh
   
   # Windows
   scripts\setup-workflows.bat
   ```

2. **Configure Secrets**: Add required secrets to your GitHub repository
   - Go to `Settings > Secrets and variables > Actions`
   - Add all required secrets (see `docs/WorkflowGuide.md`)

3. **Push Code**: Workflows will automatically trigger on pushes to `main` or `develop`

4. **Monitor**: Check the Actions tab to monitor workflow execution

## 📚 Documentation

- **Complete Guide**: `docs/WorkflowGuide.md`
- **Setup Scripts**: `scripts/setup-workflows.*`
- **Project README**: `README.md`

## 🔧 Customization

Each workflow can be customized by editing the corresponding YAML file:

- **Triggers**: Modify the `on` section
- **Jobs**: Add/remove/modify job steps
- **Environments**: Configure deployment targets
- **Notifications**: Add custom notification logic

## 🚨 Troubleshooting

Common issues and solutions:

1. **Workflow not running**: Check branch names and triggers
2. **Build failures**: Verify Node.js version and dependencies
3. **Deployment failures**: Check secrets and environment configuration
4. **Permission errors**: Verify GitHub token permissions

For detailed troubleshooting, see `docs/WorkflowGuide.md`.

## 🤝 Contributing

When modifying workflows:

1. Test changes locally first
2. Follow existing patterns and naming conventions
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
