#!/bin/bash

# Service Center Management - Backup Script
# Backs up database and uploads

set -e

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "📦 Service Center Management - Backup"
echo "======================================"
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Check if containers are running
if ! docker compose ps | grep -q "Up"; then
    echo "❌ Error: Containers are not running"
    echo "Start them with: docker compose up -d"
    exit 1
fi

echo "Backup started at: $(date)"
echo ""

# Backup PostgreSQL database
echo "1️⃣  Backing up PostgreSQL database..."
docker compose exec -T db pg_dump -U postgres postgres | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz
echo "   ✅ Database backup saved: $BACKUP_DIR/db_backup_$DATE.sql.gz"
echo ""

# Backup uploads directory
if [ -d "./uploads" ]; then
    echo "2️⃣  Backing up uploads directory..."
    tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz ./uploads
    echo "   ✅ Uploads backup saved: $BACKUP_DIR/uploads_backup_$DATE.tar.gz"
    echo ""
fi

# Backup .env file
if [ -f ".env" ]; then
    echo "3️⃣  Backing up .env file..."
    cp .env $BACKUP_DIR/env_backup_$DATE
    echo "   ✅ Environment backup saved: $BACKUP_DIR/env_backup_$DATE"
    echo ""
fi

# Calculate backup sizes
DB_SIZE=$(du -h $BACKUP_DIR/db_backup_$DATE.sql.gz | cut -f1)
if [ -f "$BACKUP_DIR/uploads_backup_$DATE.tar.gz" ]; then
    UPLOADS_SIZE=$(du -h $BACKUP_DIR/uploads_backup_$DATE.tar.gz | cut -f1)
fi

echo "======================================"
echo "✅ Backup completed successfully!"
echo ""
echo "Backup summary:"
echo "  - Database: $DB_SIZE"
if [ -n "$UPLOADS_SIZE" ]; then
    echo "  - Uploads: $UPLOADS_SIZE"
fi
echo "  - Location: $BACKUP_DIR/"
echo ""
echo "Backup finished at: $(date)"
echo ""

# Clean up old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last 7 days)..."
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +7 -delete
echo "   ✅ Cleanup complete"
echo ""

# Display remaining backups
echo "Remaining backups:"
ls -lh $BACKUP_DIR/ | grep backup
