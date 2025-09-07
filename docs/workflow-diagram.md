# Growth Mentor Grid - Workflow Diagram

This document provides visual representations of the workflow system using Mermaid diagrams.

## 🔄 Main CI/CD Pipeline Flow

```mermaid
graph TD
    A[Code Push/PR] --> B{Trigger Type}
    
    B -->|Push to main| C[Code Quality & Security]
    B -->|Push to develop| C
    B -->|Pull Request| C
    B -->|Manual Dispatch| C
    
    C --> D[ESLint + TypeScript Check]
    D --> E[Security Audit + Secret Scan]
    E --> F{Code Quality Pass?}
    
    F -->|No| G[❌ Fail - Stop Pipeline]
    F -->|Yes| H[Run Tests]
    
    H --> I[Unit Tests + Coverage]
    I --> J{Tests Pass?}
    
    J -->|No| K[❌ Fail - Stop Pipeline]
    J -->|Yes| L[Build Application]
    
    L --> M[Vite Build + Artifacts]
    M --> N{Database Migrations?}
    
    N -->|main branch| O[Supabase Migrations]
    N -->|develop branch| P[Skip Migrations]
    
    O --> Q[Deploy Edge Functions]
    Q --> R[Deploy to Staging]
    
    P --> R
    
    R --> S{Environment}
    S -->|staging| T[Vercel Staging]
    S -->|production| U[Vercel Production]
    
    T --> V[Health Check]
    U --> V
    
    V --> W[API Endpoint Test]
    W --> X[Deployment Success ✅]
    
    style A fill:#e1f5fe
    style X fill:#c8e6c9
    style G fill:#ffcdd2
    style K fill:#ffcdd2
```

## 🛡️ Security Scanning Workflow

```mermaid
graph TD
    A[Security Trigger] --> B{Trigger Type}
    
    B -->|Daily 2 AM UTC| C[Schedule Trigger]
    B -->|Security Advisory| D[GitHub Advisory]
    B -->|Code Push/PR| E[Code Change]
    
    C --> F[Security Scan Job]
    D --> F
    E --> F
    
    F --> G[Install Dependencies]
    G --> H[npm Audit]
    H --> I[Snyk Security Scan]
    I --> J[OWASP Dependency Check]
    
    J --> K{High Severity Issues?}
    K -->|Yes| L[❌ Fail + Notify]
    K -->|No| M[✅ Pass + Upload Reports]
    
    M --> N[Security Reports Artifact]
    N --> O[90 Day Retention]
    
    style A fill:#fff3e0
    style L fill:#ffcdd2
    style M fill:#c8e6c9
```

## 📦 Dependency Updates Workflow

```mermaid
graph TD
    A[Dependency Trigger] --> B{Trigger Type}
    
    B -->|Weekly Monday 6 AM| C[Schedule Trigger]
    B -->|Manual Dispatch| D[User Input]
    
    C --> E[Security Updates Only]
    D --> F{Update Type}
    
    F -->|Security| G[Security Patches]
    F -->|Minor| H[Minor Version Updates]
    F -->|Major| I[Major Version Updates]
    
    E --> J[Check Outdated Packages]
    G --> J
    H --> J
    I --> J
    
    J --> K[Update Dependencies]
    K --> L[Run Tests]
    
    L --> M{Tests Pass?}
    M -->|No| N[❌ Fail + Notify]
    M -->|Yes| O[Create Pull Request]
    
    O --> P[Automated PR Creation]
    P --> Q[Apply Labels]
    Q --> R[Request Review]
    
    style A fill:#e8f5e8
    style N fill:#ffcdd2
    style R fill:#c8e6c9
```

## 🏷️ Release Management Workflow

```mermaid
graph TD
    A[Release Trigger] --> B{Trigger Type}
    
    B -->|Git Tag| C[Version Tag]
    B -->|Manual Dispatch| D[User Input]
    
    C --> E[Extract Version]
    D --> F[User Version Input]
    
    E --> G[Create Release Job]
    F --> G
    
    G --> H[Checkout Code]
    H --> I[Generate Changelog]
    I --> J[Create GitHub Release]
    
    J --> K{Release Created?}
    K -->|No| L[❌ Fail]
    K -->|Yes| M[Deploy Release Job]
    
    M --> N[Build Application]
    N --> O[Deploy to Production]
    
    O --> P{Deployment Success?}
    P -->|No| Q[❌ Fail + Notify]
    P -->|Yes| R[✅ Success + Notify]
    
    style A fill:#f3e5f5
    style L fill:#ffcdd2
    style Q fill:#ffcdd2
    style R fill:#c8e6c9
```

## 🚀 Complete Workflow System Overview

```mermaid
graph TB
    subgraph "Development Flow"
        A[Developer Push] --> B[Feature Branch]
        B --> C[Pull Request]
        C --> D[Code Review]
        D --> E[Merge to develop]
        E --> F[Staging Deployment]
        F --> G[Testing & Validation]
        G --> H[Merge to main]
        H --> I[Production Deployment]
    end
    
    subgraph "Automated Workflows"
        J[Main CI/CD Pipeline] --> K[Code Quality]
        K --> L[Testing]
        L --> M[Building]
        M --> N[Deployment]
        
        O[Security Scanning] --> P[Daily Scans]
        P --> Q[Vulnerability Detection]
        
        R[Dependency Updates] --> S[Weekly Updates]
        S --> T[Automated PRs]
        
        U[Release Management] --> V[Version Control]
        V --> W[Production Deploy]
    end
    
    subgraph "Environments"
        X[Development] --> Y[Staging]
        Y --> Z[Production]
    end
    
    subgraph "Tools & Services"
        AA[GitHub Actions]
        BB[Supabase]
        CC[Vercel]
        DD[Security Tools]
    end
    
    A --> J
    E --> J
    H --> J
    J --> O
    J --> R
    J --> U
    
    style A fill:#e3f2fd
    style I fill:#c8e6c9
    style X fill:#fff3e0
    style Z fill:#e8f5e8
```

## 📊 Workflow Timeline

```mermaid
gantt
    title Growth Mentor Grid - Workflow Timeline
    dateFormat  YYYY-MM-DD
    section Development
    Feature Development    :dev, 2024-01-01, 7d
    Code Review          :review, after dev, 2d
    Testing              :test, after review, 3d
    Staging Deploy      :staging, after test, 1d
    
    section Production
    Production Deploy    :prod, after staging, 1d
    Monitoring           :monitor, after prod, 7d
    
    section Maintenance
    Security Scans       :security, 2024-01-01, 1d
    Dependency Updates   :deps, 2024-01-08, 1d
    Release Management   :release, 2024-01-15, 1d
```

## 🔐 Secrets & Configuration Flow

```mermaid
graph LR
    A[GitHub Repository] --> B[Secrets Storage]
    
    B --> C[Supabase Config]
    B --> D[Vercel Config]
    B --> E[Security Tools]
    
    C --> F[Database Access]
    C --> G[Edge Functions]
    
    D --> H[Staging Deploy]
    D --> I[Production Deploy]
    
    E --> J[Snyk Security]
    E --> K[OWASP Checks]
    
    F --> L[Schema Migrations]
    G --> M[Function Deploy]
    
    H --> N[Staging Environment]
    I --> O[Production Environment]
    
    J --> P[Vulnerability Reports]
    K --> Q[Security Reports]
    
    style A fill:#fce4ec
    style B fill:#fff3e0
    style N fill:#e8f5e8
    style O fill:#c8e6c9
```

## 🚨 Error Handling & Notifications

```mermaid
graph TD
    A[Workflow Execution] --> B{Success?}
    
    B -->|Yes| C[✅ Success Path]
    B -->|No| D[❌ Error Handling]
    
    C --> E[Deployment Confirmation]
    C --> F[Health Check Pass]
    C --> G[Success Notification]
    
    D --> H[Error Analysis]
    H --> I{Error Type}
    
    I -->|Build Failure| J[Code Quality Issues]
    I -->|Test Failure| K[Test Coverage Issues]
    I -->|Deploy Failure| L[Environment Issues]
    I -->|Security Issues| M[Vulnerability Alerts]
    
    J --> N[Developer Notification]
    K --> N
    L --> N
    M --> N
    
    N --> O[Issue Creation]
    N --> P[Team Alert]
    N --> Q[Rollback if Needed]
    
    style A fill:#e3f2fd
    style C fill:#c8e6c9
    style D fill:#ffcdd2
    style Q fill:#fff3e0
```

## 📱 Branch Strategy & Protection

```mermaid
graph TD
    A[Feature Development] --> B[feature/* branch]
    B --> C[Local Development]
    C --> D[Push to Remote]
    D --> E[Create Pull Request]
    
    E --> F[Automated Checks]
    F --> G{All Checks Pass?}
    
    G -->|No| H[❌ Fix Issues]
    G -->|Yes| I[Code Review Required]
    
    H --> C
    I --> J{Review Approved?}
    
    J -->|No| K[❌ Request Changes]
    J -->|Yes| L[✅ Merge to develop]
    
    K --> C
    
    L --> M[Staging Deployment]
    M --> N[Testing & Validation]
    N --> O{Staging OK?}
    
    O -->|No| P[❌ Fix in develop]
    O -->|Yes| Q[✅ Merge to main]
    
    P --> C
    Q --> R[Production Deployment]
    
    style A fill:#e8f5e8
    style B fill:#f3e5f5
    style L fill:#c8e6c9
    style Q fill:#c8e6c9
    style R fill:#e8f5e8
```

---

## 📋 Diagram Legend

- **🟦 Blue**: Development and workflow triggers
- **🟩 Green**: Success states and production
- **🟥 Red**: Failures and errors
- **🟨 Yellow**: Warnings and notifications
- **🟪 Purple**: Configuration and setup
- **🟧 Orange**: Maintenance and monitoring

## 🔧 How to Use These Diagrams

1. **Copy the Mermaid code** from any diagram above
2. **Paste into**:
   - GitHub markdown files (GitHub supports Mermaid natively)
   - Mermaid Live Editor: https://mermaid.live/
   - VS Code with Mermaid extension
   - Any Mermaid-compatible viewer

3. **Customize** the diagrams by modifying the Mermaid code to match your specific workflow requirements

4. **Embed** in documentation, presentations, or team wikis

## 📚 Related Documentation

- **Complete Workflow Guide**: `WorkflowGuide.md`
- **Setup Instructions**: `scripts/setup-workflows.*`
- **Workflow Files**: `.github/workflows/*.yml`
