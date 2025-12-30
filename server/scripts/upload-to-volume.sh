#!/bin/bash
# Script to upload video files to Railway Volume
# Usage: ./upload-to-volume.sh [volume-path]

VOLUME_PATH="${1:-/app/server/uploads/videos}"
VIDEOS_SOURCE="${2:-./server/uploads/videos}"

echo "📤 Uploading video files to Railway Volume..."
echo "Source: $VIDEOS_SOURCE"
echo "Destination: $VOLUME_PATH"
echo ""

# Check if source directory exists
if [ ! -d "$VIDEOS_SOURCE" ]; then
  echo "❌ Error: Source directory not found: $VIDEOS_SOURCE"
  exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  echo "❌ Railway CLI not found. Install it with: npm install -g @railway/cli"
  exit 1
fi

# Count video files
VIDEO_COUNT=$(find "$VIDEOS_SOURCE" -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | wc -l)
echo "📹 Found $VIDEO_COUNT video files to upload"
echo ""

# List files
echo "Files to upload:"
find "$VIDEOS_SOURCE" -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | while read file; do
  size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
  size_mb=$(echo "scale=2; $size / 1048576" | bc 2>/dev/null || echo "0")
  echo "  - $(basename "$file") (${size_mb} MB)"
done

echo ""
read -p "Continue with upload? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Upload cancelled."
  exit 0
fi

# Upload files using Railway CLI
echo "🚀 Starting upload..."
echo ""

# Method 1: Use railway run to copy files
railway run bash << EOF
# Create destination directory if it doesn't exist
mkdir -p "$VOLUME_PATH"

# Copy files
echo "Copying files from source to volume..."
cp -r "$VIDEOS_SOURCE"/* "$VOLUME_PATH/" 2>/dev/null || {
  echo "⚠️  Direct copy failed. Trying alternative method..."
  # Alternative: Use tar to transfer
  cd "$(dirname "$VIDEOS_SOURCE")"
  tar czf - "$(basename "$VIDEOS_SOURCE")" | (cd "$VOLUME_PATH" && tar xzf -)
}

# Verify files
echo ""
echo "✅ Upload complete. Verifying files..."
ls -lh "$VOLUME_PATH" | head -20
echo ""
echo "📊 Summary:"
echo "  Files in volume: \$(find "$VOLUME_PATH" -type f | wc -l)"
echo "  Total size: \$(du -sh "$VOLUME_PATH" | cut -f1)"
EOF

echo ""
echo "✅ Upload process completed!"
echo ""
echo "💡 Next steps:"
echo "1. Verify files in Railway Dashboard → Volume"
echo "2. Check /api/health endpoint to confirm files are accessible"
echo "3. Test video playback in the application"

