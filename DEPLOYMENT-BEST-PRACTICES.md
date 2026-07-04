# ESCC Deployment Best Practices - Dual Environment Setup (Vercel + GitHub Pages)

## Overview
This document provides comprehensive deployment best practices for Fresh People Command Center (ESCC), implementing a dual-environment strategy with Vercel as primary and GitHub Pages as fallback to ensure zero downtime for the Solidsolutions.africa + SolidAI sites.

## Business Requirements

### Critical Rule
- **Zero Downtime:** Solidsolutions.africa and SolidAI sites must NEVER be down or blank
- **Two-Tier Deployment:** Primary (Vercel) + Fallback (GitHub Pages)
- **Automatic Failover:** Seamless switch to fallback when primary fails

### Strategic Objectives
1. **High Availability:** 99.99% uptime requirement
2. **Failover Automation:** Zero-touch failover mechanisms
3. **Performance Optimization:** Both environments optimized for speed
4. **Cost Efficiency:** Free GitHub Pages for backup, paid Vercel for primary
5. **Security:** Both environments hardened with same standards

## Environment Configuration

### Vercel Environment (Primary)

#### Configuration File
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "cleanUrls": true,
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": ".vercel/functions/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "dist/index.html"
    }
  ]
}
```

#### Environment Variables
```env
# Application
NODE_ENV=production
PORT=3000

# Vercel Specific
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# API Keys
VITE_GEMINI_API_KEY=your_gemini_key
VITE_FIREBASE_API_KEY=your_firebase_key

# Database
DATABASE_URL=postgresql://user:password@host:5432/db

# Monitoring
SENTRY_DSN=your_sentry_dsn
VERCEL_ANALYTICS_ID=your_analytics_id
```

#### Build Optimizations
```json
// vite.config.ts optimizations
export default defineConfig({
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'motion'],
          'routing': ['react-router-dom']
        }
      }
    }
  }
})
```

### GitHub Pages Environment (Fallback)

#### Configuration
```json
// vercel.json fallback settings
{
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/dist/index.html"
    }
  ],
  "headers": [
    {
      "source": "(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### GitHub Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: freshpeople-app.github.io
          keep_files: false
```

## Deployment Strategy

### Primary Deployment (Vercel)

#### Automated Deployment Pipeline
```bash
# Deployment script: deploy-to-vercel.sh
#!/bin/bash
set -euo pipefail

echo "Deploying to Vercel (Primary)..."

# Build application
npm run build

# Deploy to Vercel
vercel --prod --token "$VERCEL_TOKEN" \
       --scope "$VERCEL_ORG_ID" \
       --project "$VERCEL_PROJECT_ID"

# Deploy functions (if any)
vercel deploy-functions --prod --token "$VERCEL_TOKEN"

# Invalidate CDN cache
vercel pull --prod --token "$VERCEL_TOKEN" --yes

# Health check
curl -f "https://freshpeople-app.vercel.app/api/health" || exit 1

echo "✅ Vercel deployment completed successfully"
```

#### Environment-Specific Configuration
```javascript
// vercel/config.js
const envConfig = {
  development: {
    VERCEL_URL: 'http://localhost:3000',
    API_URL: 'http://localhost:3001',
    DATABASE_URL: 'file:./dev.db',
    ENABLE_ANALYTICS: 'false'
  },
  production: {
    VERCEL_URL: 'https://freshpeople-app.vercel.app',
    API_URL: 'https://api.freshpeople-app.vercel.app',
    DATABASE_URL: process.env.DATABASE_URL,
    ENABLE_ANALYTICS: 'true'
  },
  preview: {
    VERCEL_URL: 'https://freshpeople-app-vercel-preview.vercel.app',
    API_URL: 'https://api.freshpeople-app-vercel-preview.vercel.app',
    DATABASE_URL: process.env.DATABASE_URL,
    ENABLE_ANALYTICS: 'true'
  }
};

module.exports = envConfig[process.env.NODE_ENV] || envConfig.development;
```

### Fallback Deployment (GitHub Pages)

#### Automatic Deployment
```bash
# Deploy script: deploy-to-gh-pages.sh
#!/bin/bash
set -euo pipefail

echo "Deploying to GitHub Pages (Fallback)..."

# Build application
npm run build

# Configure git for deployment
git config --local user.name "github-actions"
git config --local user.email "github-actions@github.com"

# Commit and push to gh-pages branch
git add dist

git commit -m "Deploy to GitHub Pages $(date -Iseconds)" || true
git push origin main:gh-pages

echo "✅ GitHub Pages deployment completed successfully"
```

#### DNS Failover Configuration
```json
// CNAME file for GitHub Pages
cfreshpeople-app.github.io
```

#### Health Check Monitoring
```javascript
// health-check.js
const healthCheck = async () => {
  const checks = [];
  
  // Vercel health check
  try {
    const vercelResponse = await fetch('https://freshpeople-app.vercel.app/api/health');
    checks.push({
      environment: 'vercel',
      status: vercelResponse.ok ? 'healthy' : 'unhealthy',
      latency: Date.now() - performance.now(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    checks.push({
      environment: 'vercel',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  // GitHub Pages health check
  try {
    const ghPagesResponse = await fetch('https://yassinaliyassin.github.io/freshpeople-command-center/');
    checks.push({
      environment: 'github-pages',
      status: ghPagesResponse.ok ? 'healthy' : 'unhealthy',
      latency: Date.now() - performance.now(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    checks.push({
      environment: 'github-pages',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  return checks;
};
```

## Failover Strategy

### Automatic Failover Logic
```javascript
// failover-manager.js
class FailoverManager {
  constructor() {
    this.primaryURL = 'https://freshpeople-app.vercel.app';
    this.fallbackURL = 'https://yassinaliyassin.github.io/freshpeople-command-center/';
    this.healthCheckInterval = 30000; // 30 seconds
    this.consecutiveFailures = 0;
    this.maxFailures = 3;
    this.currentEnvironment = 'primary';
  }

  async performHealthCheck(url) {
    try {
      const startTime = Date.now();
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        headers: { 'User-Agent': 'ESCC-Failover-Manager/1.0' }
      });
      const latency = Date.now() - startTime;
      return {
        healthy: response.ok,
        latency,
        status: response.status
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        latency: Infinity
      };
    }
  }

  async monitorHealth() {
    const check = await this.performHealthCheck(
      this.currentEnvironment === 'primary' ? this.primaryURL : this.fallbackURL
    );

    if (!check.healthy || check.latency > 5000) {
      this.consecutiveFailures++;
      console.warn(`Health check failed: ${check.error || `HTTP ${check.status}`}`);

      if (this.consecutiveFailures >= this.maxFailures) {
        await this.triggerFailover();
      }
    } else {
      this.consecutiveFailures = 0;
      console.log(`Health check passed: latency ${check.latency}ms`);
    }
  }

  async triggerFailover() {
    console.log('Triggering failover...');
    this.currentEnvironment = this.currentEnvironment === 'primary' ? 'fallback' : 'primary';
    this.consecutiveFailures = 0;

    // Update global state
    window.location.href = this.currentEnvironment === 'primary' 
      ? this.primaryURL 
      : this.fallbackURL;
  }

  startMonitoring() {
    setInterval(() => this.monitorHealth(), this.healthCheckInterval);
  }
}

// Initialize failover manager
const failoverManager = new FailoverManager();
failoverManager.startMonitoring();
```

### Failover Decision Matrix

| Condition | Primary Failure | Action |
|-----------|----------------|--------|
| HTTP 5xx errors | 3 consecutive failures | Switch to fallback |
| High latency (>5s) | 2 consecutive failures | Switch to fallback |
| SSL certificate issues | 1 failure | Switch to fallback |
| DNS resolution failure | 1 failure | Switch to fallback |
| Successful response | N/A | Keep using current environment |

## Performance Optimization

### Vercel Optimizations

#### Bundle Analysis
```javascript
// bundle-analyzer.config.js
module.exports = {
  analyzerMode: 'static',
  openAnalyzer: false,
  generateStatsFile: true,
  statsFilename: './dist/stats.json'
};
```

#### Image Optimization
```javascript
// vite.config.ts image config
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    }
  }
})
```

#### Caching Strategy
```nginx
# nginx.conf for Vercel edge cache
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
  add_header Cache-Control "public, max-age=31536000, immutable";
  add_header X-Cache-Status "Edge-Cache";
}
```

### GitHub Pages Optimizations

#### Static Asset Optimization
```javascript
// scripts/optimize-gh-pages.js
const fs = require('fs-extra');
const BrotliCompress = require('brotli-compress');

async function optimizeAssets() {
  const distDir = 'dist';
  const files = await fs.readdir(distDir);

  for (const file of files) {
    if (file.endsWith('.html') || file.endsWith('.css') || file.endsWith('.js')) {
      const input = fs.createReadStream(`${distDir}/${file}`);
      const output = fs.createWriteStream(`${distDir}/${file}.br`);
      
      const brotli = BrotliCompress.createBrotliCompress();
      input.pipe(brotli).pipe(output);
    }
  }
}

optimizeAssets();
```

#### Mobile-First Design
```css
/* mobile-first.css */
@media (max-width: 768px) {
  /* Mobile optimizations */
  .container { padding: 1rem; }
  .card { padding: 1rem; }
  .text-display { font-size: 1.5rem; }
}

@media (min-width: 769px) {
  /* Desktop optimizations */
  .container { padding: 2rem; }
  .card { padding: 2rem; }
  .text-display { font-size: 2.5rem; }
}
```

## Monitoring & Reliability

### Health Check Endpoints

#### System Health
```javascript
// api/health.js
export default async function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // Database connectivity
  try {
    await db.query('SELECT 1');
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }

  // External services
  const services = ['google-calendar', 'firebase', 'supabase'];
  for (const service of services) {
    try {
      const response = await fetch(`https://status.${service}.com/health`);
      health.checks[service] = response.ok ? 'healthy' : 'degraded';
    } catch (error) {
      health.checks[service] = 'unhealthy';
      health.status = 'unhealthy';
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}
```

#### Monitoring Script
```bash
# monitoring/health-check.sh
#!/bin/bash
set -euo pipefail

PRIMARY_URL="https://freshpeople-app.vercel.app"
FALLBACK_URL="https://yassinaliyassin.github.io/freshpeople-command-center/"
API_ENDPOINT="/api/health"

log() {
    echo "$(date -Iseconds) - $1"
}

check_endpoint() {
    local url=$1
    local name=$2
    
    local start_time=$(date +%s%N)
    local response
    local http_code
    local end_time
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.json "$url" 2>/dev/null)
    http_code=${response: -3}
    end_time=$(date +%s%N)
    
    local latency_ms=$((($end_time - $start_time) / 1000000))
    
    if [ "$http_code" = "200" ]; then
        log "✅ $name: HTTP $http_code (${latency_ms}ms)"
        return 0
    else
        log "❌ $name: HTTP $http_code (${latency_ms}ms)"
        return 1
    fi
}

check_api_endpoint() {
    local url=$1
    local name=$2
    
    local start_time=$(date +%s%N)
    local response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json "$url$API_ENDPOINT" 2>/dev/null)
    local http_code=${response: -3}
    local end_time=$(date +%s%N)
    
    local latency_ms=$((($end_time - $start_time) / 1000000))
    
    if [ "$http_code" = "200" ]; then
        echo "$(cat /tmp/api_response.json)" | jq '.
            status,
            timestamp,
            checks'
        log "✅ $name API: HTTP $http_code (${latency_ms}ms)"
        return 0
    else
        log "❌ $name API: HTTP $http_code (${latency_ms}ms)"
        return 1
    fi
}

log "🔍 Starting health checks..."

# Check primary (Vercel)
if check_endpoint "$PRIMARY_URL" "Vercel Primary"; then
    check_api_endpoint "$PRIMARY_URL" "Vercel"
else
    log "⚠️  Primary environment unhealthy, checking fallback..."
fi

# Check fallback (GitHub Pages)
if check_endpoint "$FALLBACK_URL" "GitHub Pages Fallback"; then
    check_api_endpoint "$FALLBACK_URL" "GitHub Pages"
else
    log "⚠️  Fallback environment unhealthy"
fi

log "🏁 Health checks completed"
```

### Alerting Configuration

#### Alert Rules
```yaml
# prometheus-alerts.yml
groups:
  - name: escc-alerts
    rules:
      - alert: VercelDown
        expr: up{job="vercel"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Vercel deployment is down"
          description: "Vercel primary deployment failed health checks"

      - alert: GitHubPagesDown
        expr: up{job="github-pages"} == 0
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "GitHub Pages deployment is down"
          description: "GitHub Pages fallback deployment failed health checks"

      - alert: HighLatency
        expr: (http_request_duration_seconds * 1000) > 2000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request latency detected"
          description: "Average request latency exceeds 2 seconds"
```

## Security Hardening

### HTTPS Configuration
```nginx
# nginx-secure.conf
server {
    listen 443 ssl http2;
    server_name freshpeople-app.vercel.app;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Rate Limiting
```javascript
// middleware/rate-limit.js
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.'
  }
});

export { apiLimiter, authLimiter };
```

## Maintenance & Operations

### Daily Maintenance
```bash
# scripts/daily-maintenance.sh
#!/bin/bash
set -euo pipefail

echo "🔧 Starting daily maintenance..."

# Health checks
./scripts/monitoring/health-check.sh

# Clean up temporary files
find /path/to/app -name "*.tmp" -delete
find /path/to/app -name "*.cache" -mtime +7 -delete

# Log rotation
logrotate /etc/logrotate.d/escc

# Database optimization
./scripts/maintenance/optimize-database.sh

# Backup verification
./scripts/maintenance/verify-backups.sh

# Performance metrics
./scripts/monitoring/collect-metrics.sh

# Clean up npm cache
npm cache clean --force

# Update packages (dry run)
npm outdated || true

echo "✅ Daily maintenance completed"
```

### Weekly Maintenance
```bash
# scripts/weekly-maintenance.sh
#!/bin/bash
set -euo pipefail

echo "🔧 Starting weekly maintenance..."

# Dependency updates
npm update

# Security audit
npm audit fix

# Bundle analysis
npm run analyze

# Clean up old deployments
./scripts/deployment/cleanup-old-deployments.sh

# Performance optimization
./scripts/optimization/optimize-builds.sh

# Database backup
./scripts/maintenance/backup-database.sh

# Test failover
./scripts/monitoring/test-failover.sh

echo "✅ Weekly maintenance completed"
```

### Monthly Maintenance
```bash
# scripts/monthly-maintenance.sh
#!/bin/bash
set -euo pipefail

echo "🔧 Starting monthly maintenance..."

# Review deployments
./scripts/deployment/review-deployments.sh

# Archive old logs
./scripts/maintenance/archive-logs.sh

# Performance review
./scripts/monitoring/review-performance.sh

# Security scan
./scripts/security/scan-security.sh

# Documentation updates
./scripts/documentation/update-guides.sh

# Team training materials
./scripts/training/generate-reports.sh

echo "✅ Monthly maintenance completed"
```

## Continuous Improvement

### Performance Tracking
```javascript
// scripts/monitoring/collect-metrics.js
const metricsCollector = {
  async collectBuildMetrics() {
    const fs = require('fs').promises;
    const stats = await fs.readFile('./dist/stats.json', 'utf8');
    const bundleSize = calculateBundleSize(stats);
    const buildTime = await getBuildTime();
    
    return {
      bundleSize,
      buildTime,
      chunkCount: calculateChunkCount(stats),
      wastedBytes: calculateWastedBytes(stats),
      timestamp: new Date().toISOString()
    };
  },

  async collectPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    return {
      fcp: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      lcp: navigation?.loadEventEnd - navigation?.responseEnd,
      fid: calculateFID(),
      cls: calculateCLS(),
      timestamp: new Date().toISOString()
    };
  },

  async collectDependencyMetrics() {
    const packageJson = require('./package.json');
    const lockfile = require('./package-lock.json');
    
    return {
      dependencyCount: Object.keys(packageJson.dependencies).length,
      devDependencyCount: Object.keys(packageJson.devDependencies).length,
      outdatedPackages: await findOutdatedPackages(),
      vulnerabilityCount: await countVulnerabilities(),
      timestamp: new Date().toISOString()
    };
  },

  async collectAllMetrics() {
    return {
      build: await this.collectBuildMetrics(),
      performance: await this.collectPerformanceMetrics(),
      dependencies: await this.collectDependencyMetrics(),
      deployment: await this.collectDeploymentMetrics()
    };
  }
};

module.exports = metricsCollector;
```

## Configuration Management

### Environment Configuration
```javascript
// config/production.js
module.exports = {
  name: 'production',
  port: 3000,
  host: '0.0.0.0',
  database: {
    url: process.env.DATABASE_URL,
    ssl: true,
    poolSize: 10
  },
  cache: {
    redisUrl: process.env.REDIS_URL,
    ttl: 3600
  },
  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: 'info',
    metricsEnabled: true
  }
};
```

### Environment-Specific Overrides
```bash
# .env.production overrides
NODE_ENV=production
VERCEL_URL=https://freshpeople-app.vercel.app
API_URL=https://api.freshpeople-app.vercel.app

# Database configuration
DATABASE_URL=postgresql://user:password@host:5432/production_db

# External service credentials
GEMINI_API_KEY=production_gemini_key
FIREBASE_API_KEY=production_firebase_key
```

## Documentation & Training

### Quick Start Guide
```markdown
# ESCC Dual Environment Setup Quick Start

## Immediate Setup (5 minutes)

1. **Configure Primary (Vercel)**
   ```bash
   npm install -g vercel
   vercel login
   vercel link --yes
   vercel env add PRODUCTION
   vercel deploy
   ```

2. **Configure Fallback (GitHub Pages)**
   ```bash
   npm run build
   npx gh-pages -d dist -b gh-pages
   ```

3. **Configure Failover**
   ```javascript
   // Import in your app
   import { FailoverManager } from './failover-manager';
   const failover = new FailoverManager();
   failover.startMonitoring();
   ```

4. **Verify Deployment**
   ```bash
   curl -f https://freshpeople-app.vercel.app/api/health
   curl -f https://yassinaliyassin.github.io/freshpeople-command-center/
   ```

## Key Contacts

### Development Team
- **Lead Developer:** [Name]
- **Deployment Engineer:** [Name]
- **Performance Analyst:** [Name]

### Support
- **Emergency Contact:** [Phone Number]
- **On-call Rotation:** [Schedule]
- **PagerDuty:** [Link]

### Operations
- **SLA Monitoring:** [Dashboard Link]
- **Incident Response:** [Runbook Link]
- **Change Management:** [Jira Board]

## Legal & Compliance

### Data Protection
- **GDPR Compliance:** [Status] - Processing European user data
- **Data Residency:** [Location] - European data centers
- **Encryption:** TLS 1.3 required for all data transmission

### Terms of Service
- **Acceptable Use:** [Policy Link]
- **Data Processing:** [Agreement Link]
- **Liability Limits:** [Documentation Link]

### Security
- **Penetration Testing:** Quarterly
- **Vulnerability Scanning:** Daily
- **Incident Response:** [Testing Schedule]

## Version Control

### Git Workflow
```bash
# Development branch workflow
feature/[ticket-id]             # New features
bugfix/[ticket-id]             # Bug fixes
hotfix/[ticket-id]             # Emergency fixes
chore/                         # Maintenance/technical debt

# Release branches
release/[version]              # Production releases
```

### Commit Standards
```bash
# Conventional Commits
feat: add new dashboard widget
fix: resolve login issue for expired PINs
docs: update deployment guide
style: format code with Prettier
refactor: optimize database queries
perf: improve build performance
```

## Performance SLAs

### Service Level Agreements
| Metric | Primary (Vercel) | Fallback (GitHub Pages) |
|--------|------------------|-------------------------|
| Uptime | 99.99% | 99.9% |
| Response Time | < 2s | < 5s |
| Build Time | < 3min | < 5min |
| Bundle Size | < 2MB | < 3MB |
| Monitoring | Real-time | 5-minute intervals |

### Emergency Procedures

### Critical Incident Response
1. **Immediate Actions (First 5 minutes)**
   - Check health endpoints
   - Verify deployment status
   - Assess impact scope

2. **Containment (First 30 minutes)**
   - Isolate failing environment
   - Enable failover if needed
   - Notify stakeholders

3. **Recovery (First 2 hours)**
   - Restore service in best environment
   - Verify all functionality
   - Conduct post-mortem

### Rollback Procedures
```bash
# Rollback deployment
./scripts/deployment/rollback.sh [version]

# Emergency rollback
./scripts/deployment/emergency-rollback.sh

# Maintenance rollback
./scripts/deployment/maintenance-rollback.sh
```

## Contact Information

### 24/7 Support
- **Phone:** +27 11 123 4567
- **PagerDuty:** [Link]
- **Slack Channel:** #escc-emergency
- **Email:** emergency@freshpeople.co.za

### Business Hours Support
- **Phone:** +27 11 123 4567
- **Email:** support@freshpeople.co.za
- **Hours:** Monday-Friday, 9:00 AM - 5:00 PM SAST

### Technical Documentation
- **Wiki:** [Link]
- **Runbooks:** [Link]
- **APIs:** [Link]
- **Status Page:** [Link]

---

*This document is version 1.0 and will be reviewed quarterly.*
*Last Updated: [Date]*
*Next Review: [Date]*
