#!/bin/bash
# Smart Campus Parking Database Backup Utility
BACKUP_DIR="./db_backups"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/campus_parking_backup_$TIMESTAMP.sql"

echo "=========================================================="
echo "💾 Backing up Campus Parking SQL Database"
echo "=========================================================="

# Trigger mysqldump inside the database container
if docker exec campus-parking-db mysqldump -u parking_user -pparking_secure_pass_2026 campus_parking_db > "$BACKUP_FILE" 2>/dev/null; then
    echo "✅ Backup written successfully to:"
    echo "   $BACKUP_FILE"
    echo "   Size: $(du -h "$BACKUP_FILE" | cut -f1)"
else
    echo "❌ Error: Database backup dump failed. Make sure database container is running."
    rm -f "$BACKUP_FILE"
    exit 1
fi

echo "=========================================================="
