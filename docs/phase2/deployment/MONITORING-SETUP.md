# Production Monitoring Setup - Phase 2
## Service Center Phase 2 - Workflow, Warranty & Warehouse

**Epic:** EPIC-01 - Service Center Phase 2
**Story:** 1.20 - Production Deployment and Monitoring Setup
**Last Updated:** 2025-10-24
**Owner:** Operations Team

---

## Table of Contents

1. [Overview](#overview)
2. [Performance Requirements](#performance-requirements)
3. [Supabase Logflare Configuration](#supabase-logflare-configuration)
4. [Alert Configuration](#alert-configuration)
5. [Performance Monitoring](#performance-monitoring)
6. [Dashboard Configuration](#dashboard-configuration)
7. [Metrics to Monitor](#metrics-to-monitor)
8. [Log Retention and Analysis](#log-retention-and-analysis)
9. [Incident Response Procedures](#incident-response-procedures)
10. [Health Check Integration](#health-check-integration)
11. [Monitoring Tools Setup](#monitoring-tools-setup)
12. [Automated Alerting Scripts](#automated-alerting-scripts)
13. [Troubleshooting Common Issues](#troubleshooting-common-issues)

---

## Overview

This document provides comprehensive guidance for setting up production monitoring for the Service Center Phase 2 application. The monitoring system ensures compliance with NFRs (Non-Functional Requirements) and enables rapid incident detection and response.

**Monitoring Strategy:**
- **Proactive:** Alerts before issues impact users
- **Comprehensive:** Database, API, email, rate limits
- **Actionable:** Clear ownership and response procedures
- **Automated:** Minimize manual monitoring overhead

**Key Monitoring Components:**
1. Supabase Logflare for centralized logging
2. Health check endpoint monitoring
3. Performance metrics tracking (P95 latency)
4. Error rate monitoring
5. Email delivery monitoring
6. Rate limit monitoring

---

## Performance Requirements

### NFR Compliance Targets

**NFR1: API Response Time**
- Target: P95 latency < 500ms
- Critical threshold: P95 > 1000ms
- Warning threshold: P95 > 500ms
- Measurement: All tRPC endpoints

**NFR5: System Uptime**
- Target: > 99% uptime (monthly)
- Allowed downtime: < 7.2 hours/month
- Critical: Uptime < 95%
- Warning: Uptime < 99%

**NFR14: Rate Limiting**
- Public portal: 10 requests/hour/IP
- Email: 100 emails/24h/customer
- Critical: Rate limit bypassed
- Warning: Rate limit hit rate > 10%

**Additional Targets:**
- Database query time: P95 < 200ms
- Error rate: < 1% of total requests
- Email delivery rate: > 95%
- Page load time: P95 < 2 seconds

---

## Supabase Logflare Configuration

### Step 1: Enable Logflare Integration

**Via Supabase Studio:**

1. Navigate to Supabase Studio: `https://app.supabase.com/project/[PROJECT_ID]`
2. Go to **Settings** → **Integrations**
3. Find **Logflare** integration
4. Click **Enable Integration**
5. Configure log retention period: **30 days** (recommended)

**Via CLI:**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref [PROJECT_ID]

# Enable Logflare (via project settings)
# Note: Logflare is enabled by default for Supabase projects
```

### Step 2: Configure Log Sources

**Enable logging for:**

1. **Postgres Logs**
   - SQL queries (including execution time)
   - Connection events
   - Error messages
   - Slow query logs (> 200ms)

2. **API Logs**
   - All REST API requests
   - Authentication requests
   - Real-time subscription events
   - Storage API requests

3. **Edge Function Logs** (if applicable)
   - Function invocations
   - Errors and exceptions
   - Performance metrics

**Configuration via Supabase Studio:**

1. Go to **Logs** → **Settings**
2. Enable all log sources:
   - ✓ Database Logs
   - ✓ API Logs
   - ✓ Auth Logs
   - ✓ Storage Logs
   - ✓ Realtime Logs

3. Set log level: **INFO** for production
4. Enable slow query logging: Threshold **200ms**

### Step 3: Create Custom Log Queries

**Navigate to Logs → Query Editor**

**Query 1: API Errors (Last 24 Hours)**

```sql
SELECT
  timestamp,
  event_message,
  metadata->>'method' as method,
  metadata->>'path' as path,
  metadata->>'status_code' as status_code,
  metadata->>'error' as error_message
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'status_code' NOT IN ('200', '201', '204', '304')
ORDER BY timestamp DESC
LIMIT 100;
```

**Query 2: Slow Database Queries**

```sql
SELECT
  timestamp,
  event_message,
  metadata->>'query' as query,
  (metadata->>'duration_ms')::float as duration_ms,
  metadata->>'user' as user
FROM postgres_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND (metadata->>'duration_ms')::float > 200
ORDER BY duration_ms DESC
LIMIT 50;
```

**Query 3: Authentication Failures**

```sql
SELECT
  timestamp,
  event_message,
  metadata->>'email' as email,
  metadata->>'error' as error,
  metadata->>'ip_address' as ip
FROM auth_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND event_message LIKE '%failed%'
ORDER BY timestamp DESC
LIMIT 100;
```

**Query 4: Rate Limit Hits**

```sql
SELECT
  timestamp,
  metadata->>'ip_address' as ip,
  metadata->>'endpoint' as endpoint,
  COUNT(*) as hit_count
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'status_code' = '429'
GROUP BY ip, endpoint, timestamp
ORDER BY hit_count DESC
LIMIT 20;
```

**Query 5: Email Delivery Status**

```sql
-- Note: This requires custom logging in your application
-- Log email events to a custom table or use external service
SELECT
  timestamp,
  metadata->>'email' as recipient,
  metadata->>'template' as template,
  metadata->>'status' as status,
  metadata->>'error' as error
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'event_type' = 'email_sent'
ORDER BY timestamp DESC
LIMIT 100;
```

**Save these queries for reuse:**
- Click **Save Query**
- Name each query descriptively
- Add to a collection: "Production Monitoring"

### Step 4: Configure Log Alerts

**Via Supabase Studio:**

1. Go to **Logs** → **Alerts**
2. Click **Create Alert**

**Alert Configuration Format:**

```json
{
  "name": "High Error Rate",
  "query": "SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '5 minutes' AND metadata->>'status_code' >= '500'",
  "threshold": 10,
  "interval": "5m",
  "notification_channels": ["email", "webhook"]
}
```

---

## Alert Configuration

### Critical Alerts (Immediate Response Required)

#### Alert 1: Database Errors

**Purpose:** Detect database connection failures or critical errors

**Configuration:**

```yaml
Name: Database Critical Errors
Severity: CRITICAL
Query: |
  SELECT COUNT(*) as error_count
  FROM postgres_logs
  WHERE
    timestamp > NOW() - INTERVAL '5 minutes'
    AND level IN ('ERROR', 'FATAL')
Threshold: error_count > 5
Interval: 5 minutes
Notification:
  - Email: ops-team@company.com
  - Slack: #alerts-critical
  - PagerDuty: P1 Incident
Actions:
  - Execute health check
  - Alert on-call engineer
  - Log to incident management system
```

**Implementation via Supabase:**

```bash
# Create alert via Supabase CLI
supabase alerts create \
  --name "Database Critical Errors" \
  --query "SELECT COUNT(*) FROM postgres_logs WHERE timestamp > NOW() - INTERVAL '5 minutes' AND level IN ('ERROR', 'FATAL')" \
  --threshold 5 \
  --interval 5m \
  --email ops-team@company.com
```

#### Alert 2: API Failures (5xx Errors)

**Purpose:** Detect server-side application errors

**Configuration:**

```yaml
Name: High API Error Rate
Severity: CRITICAL
Query: |
  SELECT
    COUNT(*) as error_count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '5 minutes') as error_rate
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '5 minutes'
    AND metadata->>'status_code' >= '500'
Threshold: error_rate > 5.0 OR error_count > 20
Interval: 5 minutes
Notification:
  - Email: dev-team@company.com
  - Slack: #alerts-critical
Actions:
  - Check application logs
  - Verify deployment status
  - Consider rollback if recent deployment
```

#### Alert 3: Email Delivery Failures

**Purpose:** Detect email service issues

**Configuration:**

```yaml
Name: Email Delivery Failure Rate High
Severity: HIGH
Query: |
  SELECT
    COUNT(*) FILTER (WHERE metadata->>'status' = 'failed') as failed_count,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE metadata->>'status' = 'failed') * 100.0 / COUNT(*) as failure_rate
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '15 minutes'
    AND metadata->>'event_type' = 'email_sent'
Threshold: failure_rate > 5.0 OR failed_count > 10
Interval: 15 minutes
Notification:
  - Email: ops-team@company.com
  - Slack: #alerts-high
Actions:
  - Check email service status
  - Verify email credentials
  - Review email queue
```

#### Alert 4: Rate Limit Breaches

**Purpose:** Detect potential abuse or DDoS attacks

**Configuration:**

```yaml
Name: Rate Limit Breach Detected
Severity: HIGH
Query: |
  SELECT
    metadata->>'ip_address' as ip,
    metadata->>'endpoint' as endpoint,
    COUNT(*) as attempts
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '10 minutes'
    AND metadata->>'status_code' = '429'
  GROUP BY ip, endpoint
  HAVING COUNT(*) > 50
Threshold: attempts > 50
Interval: 10 minutes
Notification:
  - Email: security-team@company.com
  - Slack: #alerts-security
Actions:
  - Review IP for blocking
  - Check for DDoS pattern
  - Verify rate limit configuration
```

#### Alert 5: High Latency

**Purpose:** Detect performance degradation (NFR1 compliance)

**Configuration:**

```yaml
Name: API Latency Exceeds Threshold
Severity: HIGH
Query: |
  SELECT
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95_latency
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '10 minutes'
    AND metadata->>'duration_ms' IS NOT NULL
Threshold: p95_latency > 500
Interval: 10 minutes
Notification:
  - Email: dev-team@company.com
  - Slack: #alerts-high
Actions:
  - Check database query performance
  - Review recent code changes
  - Check server resources
```

### Warning Alerts (Monitor Closely)

#### Alert 6: Elevated 4xx Error Rate

**Configuration:**

```yaml
Name: Client Error Rate Elevated
Severity: WARNING
Query: |
  SELECT
    COUNT(*) as error_count,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '15 minutes') as error_rate
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '15 minutes'
    AND metadata->>'status_code' BETWEEN '400' AND '499'
Threshold: error_rate > 10.0
Interval: 15 minutes
Notification:
  - Slack: #alerts-warning
Actions:
  - Review common error patterns
  - Check for API changes
```

#### Alert 7: Slow Database Queries

**Configuration:**

```yaml
Name: Slow Query Alert
Severity: WARNING
Query: |
  SELECT
    COUNT(*) as slow_query_count,
    AVG((metadata->>'duration_ms')::float) as avg_duration
  FROM postgres_logs
  WHERE
    timestamp > NOW() - INTERVAL '15 minutes'
    AND (metadata->>'duration_ms')::float > 200
Threshold: slow_query_count > 20
Interval: 15 minutes
Notification:
  - Slack: #alerts-warning
Actions:
  - Identify specific slow queries
  - Review indexes
  - Consider query optimization
```

#### Alert 8: Health Check Failures

**Configuration:**

```yaml
Name: Health Check Degraded
Severity: WARNING
Query: |
  SELECT COUNT(*) as failure_count
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '5 minutes'
    AND metadata->>'path' = '/api/health'
    AND metadata->>'status_code' = '503'
Threshold: failure_count > 2
Interval: 5 minutes
Notification:
  - Email: ops-team@company.com
  - Slack: #alerts-warning
Actions:
  - Check health endpoint details
  - Verify database connectivity
  - Review application status
```

### Setting Up Alerts via Script

**Create a shell script for alert automation:**

```bash
#!/bin/bash
# File: setup-alerts.sh
# Description: Automated alert configuration for Supabase

set -e

SUPABASE_PROJECT_ID="${SUPABASE_PROJECT_ID}"
SUPABASE_ACCESS_TOKEN="${SUPABASE_ACCESS_TOKEN}"

if [[ -z "$SUPABASE_PROJECT_ID" ]] || [[ -z "$SUPABASE_ACCESS_TOKEN" ]]; then
  echo "Error: SUPABASE_PROJECT_ID and SUPABASE_ACCESS_TOKEN must be set"
  exit 1
fi

echo "Setting up alerts for project: $SUPABASE_PROJECT_ID"

# Function to create alert
create_alert() {
  local name="$1"
  local query="$2"
  local threshold="$3"
  local interval="$4"
  local email="$5"

  echo "Creating alert: $name"

  curl -X POST \
    "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/alerts" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"${name}\",
      \"query\": \"${query}\",
      \"threshold\": ${threshold},
      \"interval\": \"${interval}\",
      \"notification_channels\": [\"email\"],
      \"email\": \"${email}\"
    }"

  echo "✓ Alert created: $name"
}

# Critical Alerts
create_alert \
  "Database Critical Errors" \
  "SELECT COUNT(*) FROM postgres_logs WHERE timestamp > NOW() - INTERVAL '5 minutes' AND level IN ('ERROR', 'FATAL')" \
  5 \
  "5m" \
  "ops-team@company.com"

create_alert \
  "High API Error Rate" \
  "SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '5 minutes' AND metadata->>'status_code' >= '500'" \
  20 \
  "5m" \
  "dev-team@company.com"

create_alert \
  "Email Delivery Failures" \
  "SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '15 minutes' AND metadata->>'event_type' = 'email_sent' AND metadata->>'status' = 'failed'" \
  10 \
  "15m" \
  "ops-team@company.com"

create_alert \
  "Rate Limit Breaches" \
  "SELECT COUNT(*) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '10 minutes' AND metadata->>'status_code' = '429'" \
  50 \
  "10m" \
  "security-team@company.com"

create_alert \
  "API Latency High" \
  "SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '10 minutes'" \
  500 \
  "10m" \
  "dev-team@company.com"

echo "✓ All alerts created successfully"
```

**Usage:**

```bash
# Set environment variables
export SUPABASE_PROJECT_ID="your-project-id"
export SUPABASE_ACCESS_TOKEN="your-access-token"

# Make script executable
chmod +x setup-alerts.sh

# Run script
./setup-alerts.sh
```

---

## Performance Monitoring

### Tracking NFR1: API Response Time (P95 < 500ms)

**Method 1: Supabase Logs Analysis**

```sql
-- P95 latency for all API endpoints (last 1 hour)
SELECT
  metadata->>'path' as endpoint,
  COUNT(*) as request_count,
  ROUND(AVG((metadata->>'duration_ms')::float), 2) as avg_latency,
  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float), 2) as p50_latency,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float), 2) as p95_latency,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float), 2) as p99_latency,
  ROUND(MAX((metadata->>'duration_ms')::float), 2) as max_latency
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'duration_ms' IS NOT NULL
GROUP BY endpoint
ORDER BY p95_latency DESC;
```

**Method 2: Custom Middleware Logging**

Add to your Next.js middleware or tRPC context:

```typescript
// src/server/trpc.ts (add to context creation)
import { performance } from 'perf_hooks';

export const createContext = async ({ req, res }) => {
  const startTime = performance.now();

  // ... existing context creation ...

  // Log request timing after response
  res.on('finish', () => {
    const duration = performance.now() - startTime;

    // Log to Supabase or external monitoring service
    if (duration > 500) {
      console.warn(`Slow request: ${req.url} took ${duration}ms`);
    }

    // Send to monitoring service
    logMetric({
      metric: 'api_response_time',
      value: duration,
      tags: {
        endpoint: req.url,
        method: req.method,
        status: res.statusCode
      }
    });
  });

  return context;
};
```

**Method 3: Health Check Endpoint Integration**

The existing `/api/health` endpoint already tracks response times. Monitor it:

```bash
# Automated health check monitoring script
#!/bin/bash
# File: monitor-health.sh

HEALTH_URL="${HEALTH_URL:-http://localhost:3025/api/health}"
ALERT_THRESHOLD=500
INTERVAL=60

while true; do
  START=$(date +%s%N)
  RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_URL")
  END=$(date +%s%N)

  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | head -n-1)

  DURATION=$(( (END - START) / 1000000 )) # Convert to ms

  if [ $DURATION -gt $ALERT_THRESHOLD ]; then
    echo "⚠️  Health check slow: ${DURATION}ms"
    # Send alert
  fi

  if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ Health check failed: HTTP $HTTP_CODE"
    # Send alert
  fi

  sleep $INTERVAL
done
```

### Tracking NFR5: System Uptime (> 99%)

**Method 1: External Uptime Monitoring (Recommended)**

Use services like:
- **UptimeRobot** (free tier available)
- **Pingdom**
- **StatusCake**
- **Better Uptime**

**Configuration Example (UptimeRobot):**

1. Create monitor for main application
   - URL: `https://your-domain.com/api/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Alert contacts: ops-team@company.com

2. Create monitor for database
   - URL: Custom health check endpoint
   - Interval: 5 minutes

3. Set up status page
   - Public URL for users
   - Shows uptime percentage
   - Incident history

**Method 2: Custom Uptime Tracking**

```bash
#!/bin/bash
# File: uptime-tracker.sh
# Description: Track application uptime

LOGFILE="/var/log/service-center-uptime.log"
HEALTH_URL="${HEALTH_URL:-http://localhost:3025/api/health}"
INTERVAL=300 # 5 minutes

while true; do
  TIMESTAMP=$(date -u +"%Y-%m-%d %H:%M:%S UTC")

  if curl -sf "$HEALTH_URL" > /dev/null; then
    echo "$TIMESTAMP,UP" >> "$LOGFILE"
  else
    echo "$TIMESTAMP,DOWN" >> "$LOGFILE"
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
      -H 'Content-Type: application/json' \
      -d "{\"text\": \"🚨 Service Center DOWN at $TIMESTAMP\"}"
  fi

  sleep $INTERVAL
done
```

**Calculate uptime from logs:**

```bash
#!/bin/bash
# File: calculate-uptime.sh

LOGFILE="/var/log/service-center-uptime.log"

TOTAL=$(wc -l < "$LOGFILE")
UP=$(grep ",UP" "$LOGFILE" | wc -l)

UPTIME_PERCENT=$(echo "scale=2; $UP * 100 / $TOTAL" | bc)

echo "Total checks: $TOTAL"
echo "Successful: $UP"
echo "Uptime: ${UPTIME_PERCENT}%"

if (( $(echo "$UPTIME_PERCENT < 99" | bc -l) )); then
  echo "⚠️  Uptime below target (99%)"
fi
```

### Tracking NFR14: Rate Limiting

**Monitor rate limit effectiveness:**

```sql
-- Rate limit hits by IP (last 24 hours)
SELECT
  metadata->>'ip_address' as ip,
  metadata->>'endpoint' as endpoint,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') as rate_limited,
  ROUND(COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') * 100.0 / COUNT(*), 2) as rate_limit_percentage
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'endpoint' LIKE '/api/public/%'
GROUP BY ip, endpoint
HAVING COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') > 0
ORDER BY rate_limited DESC
LIMIT 50;
```

**Email rate limiting monitoring:**

```sql
-- Check email rate limit compliance (100 emails/24h/customer)
SELECT
  metadata->>'recipient' as customer_email,
  COUNT(*) as emails_sent_24h,
  CASE
    WHEN COUNT(*) > 100 THEN 'EXCEEDED'
    WHEN COUNT(*) > 80 THEN 'WARNING'
    ELSE 'OK'
  END as status
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'event_type' = 'email_sent'
GROUP BY customer_email
HAVING COUNT(*) > 80
ORDER BY emails_sent_24h DESC;
```

---

## Dashboard Configuration

### Supabase Studio Dashboard

**Step 1: Access Dashboard**

1. Navigate to: `https://app.supabase.com/project/[PROJECT_ID]`
2. Go to **Logs** → **Dashboard**

**Step 2: Create Custom Dashboard**

**Dashboard: Production Health Overview**

**Panel 1: Request Volume (Last 24 Hours)**

```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as requests
FROM edge_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;
```

Chart Type: Line Chart
X-axis: hour
Y-axis: requests

**Panel 2: Error Rate by Status Code**

```sql
SELECT
  metadata->>'status_code' as status_code,
  COUNT(*) as count
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'status_code' >= '400'
GROUP BY status_code
ORDER BY count DESC;
```

Chart Type: Bar Chart

**Panel 3: API Latency Distribution (P50, P95, P99)**

```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p50,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p99
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'duration_ms' IS NOT NULL
GROUP BY hour
ORDER BY hour;
```

Chart Type: Multi-line Chart

**Panel 4: Database Query Performance**

```sql
SELECT
  DATE_TRUNC('minute', timestamp) as minute,
  AVG((metadata->>'duration_ms')::float) as avg_query_time,
  MAX((metadata->>'duration_ms')::float) as max_query_time
FROM postgres_logs
WHERE
  timestamp > NOW() - INTERVAL '6 hours'
  AND metadata->>'duration_ms' IS NOT NULL
GROUP BY minute
ORDER BY minute;
```

Chart Type: Area Chart

**Panel 5: Top Slow Queries**

```sql
SELECT
  LEFT(metadata->>'query', 100) as query,
  ROUND(AVG((metadata->>'duration_ms')::float), 2) as avg_duration,
  COUNT(*) as execution_count
FROM postgres_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND (metadata->>'duration_ms')::float > 100
GROUP BY LEFT(metadata->>'query', 100)
ORDER BY avg_duration DESC
LIMIT 10;
```

Chart Type: Table

**Panel 6: Email Delivery Metrics**

```sql
SELECT
  metadata->>'status' as status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'event_type' = 'email_sent'
GROUP BY status;
```

Chart Type: Pie Chart

**Panel 7: Rate Limit Activity**

```sql
SELECT
  DATE_TRUNC('hour', timestamp) as hour,
  COUNT(*) as rate_limit_hits
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'status_code' = '429'
GROUP BY hour
ORDER BY hour;
```

Chart Type: Line Chart

### External Dashboard (Grafana/Datadog)

**Option 1: Grafana Setup (Open Source)**

```bash
# Install Grafana
docker run -d \
  -p 3000:3000 \
  --name=grafana \
  grafana/grafana-oss

# Access Grafana
# URL: http://localhost:3000
# Default credentials: admin/admin
```

**Configure Supabase Data Source:**

1. Add PostgreSQL data source
2. Connection details:
   - Host: Your Supabase database host
   - Database: postgres
   - User: postgres
   - Password: Your database password
   - SSL Mode: require

**Import Dashboard Template:**

```json
{
  "dashboard": {
    "title": "Service Center Monitoring",
    "panels": [
      {
        "title": "API Response Time (P95)",
        "type": "graph",
        "targets": [
          {
            "rawSql": "SELECT timestamp, PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) FROM metrics WHERE $__timeFilter(timestamp) GROUP BY timestamp"
          }
        ]
      }
    ]
  }
}
```

---

## Metrics to Monitor

### 1. API Response Time (NFR1)

**Target:** P95 < 500ms

**Queries:**

```sql
-- Overall P95 latency
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95_latency_ms
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'duration_ms' IS NOT NULL;

-- P95 by endpoint
SELECT
  metadata->>'path' as endpoint,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95_latency_ms,
  COUNT(*) as request_count
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'duration_ms' IS NOT NULL
GROUP BY endpoint
ORDER BY p95_latency_ms DESC;
```

**Monitoring Script:**

```bash
#!/bin/bash
# File: monitor-api-latency.sh

THRESHOLD=500
INTERVAL=300 # 5 minutes

while true; do
  P95=$(psql "$DATABASE_URL" -t -c "
    SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float)
    FROM edge_logs
    WHERE timestamp > NOW() - INTERVAL '5 minutes'
    AND metadata->>'duration_ms' IS NOT NULL
  " | tr -d ' ')

  if (( $(echo "$P95 > $THRESHOLD" | bc -l) )); then
    echo "⚠️  P95 latency: ${P95}ms (threshold: ${THRESHOLD}ms)"
    # Send alert
  else
    echo "✓ P95 latency: ${P95}ms"
  fi

  sleep $INTERVAL
done
```

### 2. Error Rate

**Target:** < 1% of total requests

**Query:**

```sql
SELECT
  COUNT(*) FILTER (WHERE metadata->>'status_code' >= '500') as server_errors,
  COUNT(*) FILTER (WHERE metadata->>'status_code' BETWEEN '400' AND '499') as client_errors,
  COUNT(*) as total_requests,
  ROUND(COUNT(*) FILTER (WHERE metadata->>'status_code' >= '400') * 100.0 / COUNT(*), 2) as error_rate_percent
FROM edge_logs
WHERE timestamp > NOW() - INTERVAL '1 hour';
```

### 3. Database Query Time

**Target:** P95 < 200ms

**Query:**

```sql
SELECT
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) as p95_query_time_ms,
  COUNT(*) as total_queries,
  COUNT(*) FILTER (WHERE (metadata->>'duration_ms')::float > 200) as slow_queries,
  ROUND(COUNT(*) FILTER (WHERE (metadata->>'duration_ms')::float > 200) * 100.0 / COUNT(*), 2) as slow_query_percentage
FROM postgres_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'duration_ms' IS NOT NULL;
```

### 4. Email Delivery Rate

**Target:** > 95% delivery rate

**Query:**

```sql
SELECT
  COUNT(*) FILTER (WHERE metadata->>'status' = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE metadata->>'status' = 'failed') as failed,
  COUNT(*) as total_emails,
  ROUND(COUNT(*) FILTER (WHERE metadata->>'status' = 'delivered') * 100.0 / COUNT(*), 2) as delivery_rate_percent
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '24 hours'
  AND metadata->>'event_type' = 'email_sent';
```

### 5. Public Portal Rate Limit Hits

**Target:** Monitor for abuse patterns

**Query:**

```sql
SELECT
  metadata->>'ip_address' as ip,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') as rate_limited,
  ROUND(COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') * 100.0 / COUNT(*), 2) as rate_limit_hit_rate
FROM edge_logs
WHERE
  timestamp > NOW() - INTERVAL '1 hour'
  AND metadata->>'path' LIKE '/api/public/%'
GROUP BY ip
HAVING COUNT(*) FILTER (WHERE metadata->>'status_code' = '429') > 0
ORDER BY rate_limited DESC;
```

### 6. System Resource Metrics

**Memory Usage:**

```bash
# Monitor Node.js memory usage
#!/bin/bash
while true; do
  MEMORY=$(ps aux | grep 'node.*next' | grep -v grep | awk '{print $4}')
  echo "$(date): Memory usage: ${MEMORY}%"

  if (( $(echo "$MEMORY > 80" | bc -l) )); then
    echo "⚠️  High memory usage: ${MEMORY}%"
    # Send alert
  fi

  sleep 60
done
```

**CPU Usage:**

```bash
# Monitor CPU usage
#!/bin/bash
while true; do
  CPU=$(ps aux | grep 'node.*next' | grep -v grep | awk '{print $3}')
  echo "$(date): CPU usage: ${CPU}%"

  if (( $(echo "$CPU > 80" | bc -l) )); then
    echo "⚠️  High CPU usage: ${CPU}%"
    # Send alert
  fi

  sleep 60
done
```

### 7. Database Connection Pool

**Query:**

```sql
-- PostgreSQL connection metrics
SELECT
  count(*) as total_connections,
  count(*) FILTER (WHERE state = 'active') as active_connections,
  count(*) FILTER (WHERE state = 'idle') as idle_connections,
  count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity
WHERE datname = 'postgres';
```

---

## Log Retention and Analysis

### Log Retention Policy

**Supabase Logflare:**
- **Retention Period:** 30 days (configurable)
- **Storage:** Automatic compression after 7 days
- **Export:** Available via API or UI

**Configuration:**

1. Navigate to Supabase Studio → **Logs** → **Settings**
2. Set retention period: **30 days**
3. Enable automatic archiving (if available)

**Long-term Storage (Optional):**

Export logs to external storage for compliance:

```bash
#!/bin/bash
# File: export-logs.sh
# Export logs to S3 for long-term retention

DATE=$(date -u +"%Y-%m-%d")
EXPORT_FILE="logs-${DATE}.json"

# Export logs from Supabase (via API)
curl -X GET \
  "https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_ID}/logs/export?date=${DATE}" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -o "$EXPORT_FILE"

# Compress
gzip "$EXPORT_FILE"

# Upload to S3
aws s3 cp "${EXPORT_FILE}.gz" "s3://your-bucket/logs/${EXPORT_FILE}.gz"

# Cleanup
rm "${EXPORT_FILE}.gz"

echo "✓ Logs exported for $DATE"
```

**Schedule with cron:**

```bash
# Run daily at 2 AM
0 2 * * * /path/to/export-logs.sh >> /var/log/export-logs.log 2>&1
```

### Log Analysis

**Daily Log Summary:**

```bash
#!/bin/bash
# File: daily-log-summary.sh

DATE=$(date -u -d "yesterday" +"%Y-%m-%d")

echo "=== Log Summary for $DATE ==="

# Total requests
TOTAL=$(psql "$DATABASE_URL" -t -c "
  SELECT COUNT(*) FROM edge_logs WHERE DATE(timestamp) = '$DATE'
" | tr -d ' ')

echo "Total Requests: $TOTAL"

# Error breakdown
psql "$DATABASE_URL" -c "
  SELECT
    metadata->>'status_code' as status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / $TOTAL, 2) as percentage
  FROM edge_logs
  WHERE DATE(timestamp) = '$DATE'
  GROUP BY status
  ORDER BY count DESC
  LIMIT 10;
"

# Top endpoints
echo ""
echo "Top Endpoints:"
psql "$DATABASE_URL" -c "
  SELECT
    metadata->>'path' as endpoint,
    COUNT(*) as requests,
    ROUND(AVG((metadata->>'duration_ms')::float), 2) as avg_latency_ms
  FROM edge_logs
  WHERE DATE(timestamp) = '$DATE'
  GROUP BY endpoint
  ORDER BY requests DESC
  LIMIT 10;
"

# Errors
echo ""
echo "Top Errors:"
psql "$DATABASE_URL" -c "
  SELECT
    metadata->>'error' as error,
    COUNT(*) as occurrences
  FROM edge_logs
  WHERE
    DATE(timestamp) = '$DATE'
    AND metadata->>'status_code' >= '500'
  GROUP BY error
  ORDER BY occurrences DESC
  LIMIT 10;
"
```

**Email daily summary:**

```bash
# Schedule with cron to run daily at 8 AM
0 8 * * * /path/to/daily-log-summary.sh | mail -s "Service Center Daily Summary" ops-team@company.com
```

---

## Incident Response Procedures

### Incident Severity Levels

**P1 - Critical (Response: Immediate)**
- System completely down
- Database corruption
- Security breach
- Data loss

**P2 - High (Response: < 30 minutes)**
- Major feature broken
- High error rate (> 5%)
- Performance severely degraded
- Email service down

**P3 - Medium (Response: < 2 hours)**
- Minor feature broken
- Elevated error rate (1-5%)
- Moderate performance issues
- Non-critical service disruption

**P4 - Low (Response: < 24 hours)**
- Minor bugs
- UI issues
- Documentation errors
- Enhancement requests

### Incident Response Workflow

**Step 1: Detection**
- Alert triggered
- User report
- Monitoring dashboard anomaly
- Health check failure

**Step 2: Acknowledgment (within 5 minutes)**

```bash
# Acknowledge incident
echo "Incident acknowledged by $(whoami) at $(date)" >> incident-log.txt

# Notify team
curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\": \"🚨 Incident acknowledged: [INCIDENT_ID] - $(whoami) investigating\"}"
```

**Step 3: Assessment (within 15 minutes)**

**Run diagnostic commands:**

```bash
#!/bin/bash
# File: incident-diagnostics.sh

echo "=== Incident Diagnostics ==="
echo "Timestamp: $(date -u)"
echo ""

# Check health endpoint
echo "1. Health Check:"
curl -s http://localhost:3025/api/health | jq

# Check database
echo ""
echo "2. Database Connection:"
psql "$DATABASE_URL" -c "SELECT 1" && echo "✓ Database connected" || echo "❌ Database connection failed"

# Check recent errors
echo ""
echo "3. Recent Errors (last 5 minutes):"
psql "$DATABASE_URL" -c "
  SELECT timestamp, event_message, metadata
  FROM edge_logs
  WHERE timestamp > NOW() - INTERVAL '5 minutes'
  AND metadata->>'status_code' >= '500'
  ORDER BY timestamp DESC
  LIMIT 10;
"

# Check system resources
echo ""
echo "4. System Resources:"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"

# Check application process
echo ""
echo "5. Application Status:"
pm2 status || docker ps | grep service-center || echo "Process status unknown"
```

**Step 4: Communication**

```bash
# Update status page
curl -X POST "https://api.statuspage.io/v1/pages/[PAGE_ID]/incidents" \
  -H "Authorization: OAuth [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "incident": {
      "name": "Service Degradation",
      "status": "investigating",
      "body": "We are investigating reports of service issues.",
      "impact": "major"
    }
  }'

# Notify stakeholders
./send-incident-notification.sh "P2" "Database performance degraded"
```

**Step 5: Resolution**

Follow runbooks for specific incident types:

**Database Performance Issues:**

```bash
# 1. Check slow queries
psql "$DATABASE_URL" -c "
  SELECT pid, now() - query_start as duration, query
  FROM pg_stat_activity
  WHERE state = 'active' AND now() - query_start > interval '1 second'
  ORDER BY duration DESC;
"

# 2. Kill long-running queries if needed
# psql "$DATABASE_URL" -c "SELECT pg_terminate_backend(PID);"

# 3. Check database size
psql "$DATABASE_URL" -c "
  SELECT pg_size_pretty(pg_database_size('postgres'));
"

# 4. Vacuum if needed (non-blocking)
# psql "$DATABASE_URL" -c "VACUUM ANALYZE;"
```

**High Error Rate:**

```bash
# 1. Identify error patterns
psql "$DATABASE_URL" -c "
  SELECT
    metadata->>'error' as error,
    COUNT(*) as count
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '10 minutes'
    AND metadata->>'status_code' >= '500'
  GROUP BY error
  ORDER BY count DESC;
"

# 2. Check recent deployments
git log -5 --oneline

# 3. Consider rollback if recent deployment
# ./rollback.sh
```

**Email Service Issues:**

```bash
# 1. Check email service status
# (Service-specific - e.g., SendGrid, AWS SES)

# 2. Verify credentials
echo "Checking email service credentials..."

# 3. Review failed emails
psql "$DATABASE_URL" -c "
  SELECT
    metadata->>'recipient' as email,
    metadata->>'error' as error
  FROM edge_logs
  WHERE
    timestamp > NOW() - INTERVAL '1 hour'
    AND metadata->>'event_type' = 'email_sent'
    AND metadata->>'status' = 'failed'
  ORDER BY timestamp DESC
  LIMIT 20;
"
```

**Step 6: Post-Incident Review**

```markdown
# Incident Post-Mortem Template

**Incident ID:** INC-2025-XXX
**Date:** YYYY-MM-DD
**Severity:** P1/P2/P3/P4
**Duration:** X hours Y minutes
**Impact:** X users affected, Y requests failed

## Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored
- HH:MM - Incident closed

## Root Cause
[Detailed description]

## Resolution
[What was done to fix]

## Prevention
[Actions to prevent recurrence]

## Action Items
- [ ] Action 1 (Owner: NAME, Due: DATE)
- [ ] Action 2 (Owner: NAME, Due: DATE)
```

---

## Health Check Integration

### Using the /api/health Endpoint

**Endpoint:** `GET /api/health`

**Response Format:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection healthy (45ms)",
      "responseTime": 45
    },
    "supabase": {
      "status": "ok",
      "message": "Supabase services available"
    },
    "application": {
      "status": "ok",
      "message": "Application healthy (uptime: 86400s)",
      "uptime": 86400
    }
  },
  "environment": "production",
  "responseTime": 125
}
```

**Status Codes:**
- `200` - Healthy
- `503` - Degraded or Down

### Automated Health Monitoring

**Script: Continuous Health Monitoring**

```bash
#!/bin/bash
# File: health-monitor.sh
# Description: Continuous health check monitoring with alerting

HEALTH_URL="${HEALTH_URL:-http://localhost:3025/api/health}"
CHECK_INTERVAL=60 # seconds
ALERT_THRESHOLD=3 # failures before alerting
LOG_FILE="/var/log/health-monitor.log"

FAILURE_COUNT=0

log() {
  echo "[$(date -u +"%Y-%m-%d %H:%M:%S UTC")] $1" | tee -a "$LOG_FILE"
}

send_alert() {
  local message="$1"
  log "🚨 ALERT: $message"

  # Send to Slack
  curl -X POST "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" \
    -H 'Content-Type: application/json' \
    -d "{\"text\": \"🚨 Health Check Alert: $message\"}" \
    2>> "$LOG_FILE"

  # Send email
  echo "$message" | mail -s "Service Center Health Alert" ops-team@company.com
}

check_health() {
  local start_time=$(date +%s%N)

  # Make request
  response=$(curl -s -w "\n%{http_code}\n%{time_total}" "$HEALTH_URL" 2>/dev/null)
  local exit_code=$?

  local end_time=$(date +%s%N)
  local duration_ms=$(( (end_time - start_time) / 1000000 ))

  if [ $exit_code -ne 0 ]; then
    log "❌ Health check failed (connection error)"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    return 1
  fi

  # Parse response
  local body=$(echo "$response" | head -n-2)
  local http_code=$(echo "$response" | tail -n2 | head -n1)
  local time_total=$(echo "$response" | tail -n1)

  # Check HTTP status
  if [ "$http_code" != "200" ]; then
    log "❌ Health check failed (HTTP $http_code)"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    return 1
  fi

  # Parse JSON status
  local status=$(echo "$body" | jq -r '.status')
  local db_status=$(echo "$body" | jq -r '.checks.database.status')
  local response_time=$(echo "$body" | jq -r '.responseTime')

  # Check status
  if [ "$status" != "healthy" ]; then
    log "⚠️  Health check degraded: $status"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    return 1
  fi

  if [ "$db_status" != "ok" ]; then
    log "⚠️  Database check failed"
    FAILURE_COUNT=$((FAILURE_COUNT + 1))
    return 1
  fi

  # Check response time
  if (( $(echo "$response_time > 1000" | bc -l) )); then
    log "⚠️  Slow health check: ${response_time}ms"
  fi

  # Success
  log "✓ Health check passed (${response_time}ms)"
  FAILURE_COUNT=0
  return 0
}

log "Starting health monitoring for $HEALTH_URL"
log "Check interval: ${CHECK_INTERVAL}s, Alert threshold: $ALERT_THRESHOLD failures"

while true; do
  check_health

  # Alert if threshold reached
  if [ $FAILURE_COUNT -ge $ALERT_THRESHOLD ]; then
    send_alert "Service health checks failing (${FAILURE_COUNT} consecutive failures)"
    # Reset counter to avoid spam
    FAILURE_COUNT=0
    # Wait longer before next check
    sleep 300
  else
    sleep $CHECK_INTERVAL
  fi
done
```

**Run as systemd service:**

```ini
# /etc/systemd/system/health-monitor.service
[Unit]
Description=Service Center Health Monitor
After=network.target

[Service]
Type=simple
User=monitoring
Environment="HEALTH_URL=https://your-domain.com/api/health"
ExecStart=/usr/local/bin/health-monitor.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
```

**Enable and start:**

```bash
sudo systemctl enable health-monitor
sudo systemctl start health-monitor
sudo systemctl status health-monitor
```

### Load Balancer Integration

**AWS ALB Health Check:**

```terraform
resource "aws_lb_target_group" "service_center" {
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
  }
}
```

**NGINX Health Check:**

```nginx
upstream service_center {
  server 127.0.0.1:3025 max_fails=3 fail_timeout=30s;

  # Health check (NGINX Plus)
  check interval=10000 rise=2 fall=3 timeout=5000 type=http;
  check_http_send "HEAD /api/health HTTP/1.0\r\n\r\n";
  check_http_expect_alive http_2xx;
}
```

---

## Monitoring Tools Setup

### 1. Setting Up UptimeRobot (Free Tier)

**Steps:**

1. Sign up at https://uptimerobot.com
2. Create New Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: Service Center Production
   - URL: `https://your-domain.com/api/health`
   - Monitoring Interval: 5 minutes
   - Monitor Timeout: 30 seconds

3. Set up Alert Contacts:
   - Email: ops-team@company.com
   - SMS: (optional)
   - Slack: Configure webhook

4. Create Status Page:
   - Public status page for users
   - Custom domain (optional)

### 2. Setting Up Better Stack (formerly Better Uptime)

**Create uptime monitor:**

```bash
# Using Better Stack API
curl -X POST "https://uptime.betterstack.com/api/v2/monitors" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/health",
    "monitor_type": "status",
    "check_frequency": 60,
    "call": true,
    "sms": true,
    "email": true,
    "push": true
  }'
```

### 3. Custom Monitoring with Prometheus + Grafana

**Install Prometheus:**

```bash
# Docker Compose setup
cat > docker-compose.monitoring.yml <<EOF
version: '3'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin

volumes:
  prometheus-data:
  grafana-data:
EOF

# Start
docker-compose -f docker-compose.monitoring.yml up -d
```

**Prometheus configuration:**

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'service-center'
    static_configs:
      - targets: ['host.docker.internal:3025']
    metrics_path: '/api/metrics'
```

**Note:** You'll need to implement `/api/metrics` endpoint to expose Prometheus metrics.

---

## Automated Alerting Scripts

### Multi-Channel Alert Script

```bash
#!/bin/bash
# File: send-alert.sh
# Description: Send alerts via multiple channels

SEVERITY="$1"  # P1, P2, P3, P4
MESSAGE="$2"
DETAILS="$3"

# Slack
send_slack() {
  local emoji="ℹ️"
  case "$SEVERITY" in
    P1) emoji="🚨" ;;
    P2) emoji="⚠️" ;;
    P3) emoji="⚡" ;;
    P4) emoji="📝" ;;
  esac

  curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-Type: application/json' \
    -d "{
      \"text\": \"$emoji *[$SEVERITY]* $MESSAGE\",
      \"attachments\": [{
        \"text\": \"$DETAILS\",
        \"color\": \"${SEVERITY == 'P1' ? 'danger' : 'warning'}\"
      }]
    }"
}

# Email
send_email() {
  local to="ops-team@company.com"
  if [ "$SEVERITY" == "P1" ]; then
    to="ops-team@company.com,management@company.com"
  fi

  echo "$DETAILS" | mail -s "[$SEVERITY] Service Center Alert: $MESSAGE" "$to"
}

# PagerDuty (for P1 only)
send_pagerduty() {
  if [ "$SEVERITY" == "P1" ]; then
    curl -X POST "https://events.pagerduty.com/v2/enqueue" \
      -H 'Content-Type: application/json' \
      -d "{
        \"routing_key\": \"$PAGERDUTY_ROUTING_KEY\",
        \"event_action\": \"trigger\",
        \"payload\": {
          \"summary\": \"$MESSAGE\",
          \"severity\": \"critical\",
          \"source\": \"service-center\",
          \"custom_details\": {
            \"details\": \"$DETAILS\"
          }
        }
      }"
  fi
}

# Send via all channels
send_slack
send_email
send_pagerduty

echo "Alert sent: [$SEVERITY] $MESSAGE"
```

**Usage:**

```bash
./send-alert.sh "P1" "Database Connection Lost" "Database unavailable since $(date)"
```

---

## Troubleshooting Common Issues

### Issue 1: Logs Not Appearing in Supabase

**Symptoms:**
- Empty log views
- Queries return no results

**Solution:**

```bash
# 1. Verify Logflare is enabled
# Check in Supabase Studio → Settings → Integrations

# 2. Check if logs are being generated
curl https://your-domain.com/api/health

# 3. Wait 2-5 minutes for logs to propagate
# Logflare has slight delay

# 4. Verify log retention settings
# Ensure retention period is not 0 days
```

### Issue 2: Alerts Not Firing

**Symptoms:**
- No alerts despite issues
- Delayed alerts

**Solution:**

```bash
# 1. Check alert configuration
# Verify thresholds and intervals

# 2. Test query manually
# Run alert query in Logs → Query Editor

# 3. Verify notification channels
# Send test alert

# 4. Check email spam folder
# Alerts may be filtered
```

### Issue 3: High False Positive Rate

**Symptoms:**
- Too many alerts
- Alerts for non-issues

**Solution:**

```bash
# 1. Adjust thresholds
# Increase thresholds gradually

# 2. Add filtering to queries
# Exclude known patterns

# 3. Increase alert interval
# Reduce check frequency

# 4. Add alert aggregation
# Only alert if issue persists > X minutes
```

---

## Appendix: Complete Monitoring Setup Script

```bash
#!/bin/bash
# File: setup-complete-monitoring.sh
# Description: Complete monitoring setup automation

set -e

echo "=== Service Center Monitoring Setup ==="

# Variables
HEALTH_URL="${HEALTH_URL:-http://localhost:3025/api/health}"
ALERT_EMAIL="${ALERT_EMAIL:-ops-team@company.com}"
SLACK_WEBHOOK="${SLACK_WEBHOOK_URL}"

# 1. Verify health endpoint
echo "1. Verifying health endpoint..."
if curl -sf "$HEALTH_URL" > /dev/null; then
  echo "✓ Health endpoint accessible"
else
  echo "❌ Health endpoint not accessible"
  exit 1
fi

# 2. Setup log directories
echo "2. Setting up log directories..."
sudo mkdir -p /var/log/service-center
sudo chown $(whoami):$(whoami) /var/log/service-center
echo "✓ Log directories created"

# 3. Install monitoring scripts
echo "3. Installing monitoring scripts..."
sudo cp health-monitor.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/health-monitor.sh
echo "✓ Monitoring scripts installed"

# 4. Setup systemd service
echo "4. Setting up systemd service..."
cat > /tmp/health-monitor.service <<EOF
[Unit]
Description=Service Center Health Monitor
After=network.target

[Service]
Type=simple
User=$(whoami)
Environment="HEALTH_URL=$HEALTH_URL"
ExecStart=/usr/local/bin/health-monitor.sh
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/health-monitor.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable health-monitor
sudo systemctl start health-monitor
echo "✓ Systemd service configured"

# 5. Verify monitoring
echo "5. Verifying monitoring..."
sleep 5
if sudo systemctl is-active --quiet health-monitor; then
  echo "✓ Health monitor running"
else
  echo "❌ Health monitor not running"
  sudo systemctl status health-monitor
  exit 1
fi

# 6. Setup log rotation
echo "6. Setting up log rotation..."
cat > /tmp/service-center-logs <<EOF
/var/log/service-center/*.log {
  daily
  rotate 30
  compress
  delaycompress
  notifempty
  create 0644 $(whoami) $(whoami)
  sharedscripts
  postrotate
    systemctl reload health-monitor
  endscript
}
EOF

sudo mv /tmp/service-center-logs /etc/logrotate.d/
echo "✓ Log rotation configured"

echo ""
echo "=== Monitoring Setup Complete ==="
echo "Health Monitor: sudo systemctl status health-monitor"
echo "Logs: /var/log/service-center/"
echo ""
echo "Next steps:"
echo "1. Configure Supabase alerts (see documentation)"
echo "2. Setup external uptime monitoring (UptimeRobot, etc.)"
echo "3. Test alerts: ./send-alert.sh P2 'Test Alert' 'Testing monitoring'"
```

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Next Review:** After deployment
**Owner:** Operations Team

---

## Quick Reference

**Key Commands:**

```bash
# Check health
curl http://localhost:3025/api/health | jq

# View recent errors
psql "$DATABASE_URL" -c "SELECT * FROM edge_logs WHERE metadata->>'status_code' >= '500' ORDER BY timestamp DESC LIMIT 10"

# Check P95 latency
psql "$DATABASE_URL" -c "SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (metadata->>'duration_ms')::float) FROM edge_logs WHERE timestamp > NOW() - INTERVAL '1 hour'"

# Send test alert
./send-alert.sh "P2" "Test Alert" "Testing monitoring system"

# Monitor health continuously
watch -n 5 'curl -s http://localhost:3025/api/health | jq .status'
```

**Key Thresholds:**

- API P95 Latency: < 500ms (warning), < 1000ms (critical)
- Error Rate: < 1% (target), > 5% (critical)
- DB Query Time: < 200ms (target), > 500ms (warning)
- Email Delivery: > 95% (target), < 90% (critical)
- Uptime: > 99% (target), < 95% (critical)

---
