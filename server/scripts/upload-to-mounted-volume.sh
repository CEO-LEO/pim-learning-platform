#!/bin/bash
# Script to copy video files to mounted Railway volume
# Usage: 
#   1. Run: railway volume mount
#   2. Note the mounted path (e.g., /tmp/railway-volume-xxxxx)
#   3. Run: ./upload-to-mounted-volume.sh <mounted-volume-path>

if [ -z "$1" ]; then
    echo "❌ Error: Mounted volume path required"
    echo ""
    echo "Usage:"
    echo "  1. Run: railway volume mount"
    echo "  2. Note the mounted path"
    echo "  3. Run: ./upload-to-mounted-volume.sh <mounted-volume-path>"
    echo ""
    echo "Example:"
    echo "  ./upload-to-mounted-volume.sh /tmp/railway-volume-abc123"
    exit 1
fi

VOLUME_MOUNT="$1"
SOURCE_DIR="$(dirname "$0")/../uploads/videos"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Error: Source directory not found: $SOURCE_DIR"
    exit 1
fi

if [ ! -d "$VOLUME_MOUNT" ]; then
    echo "❌ Error: Volume mount path not found: $VOLUME_MOUNT"
    echo "Make sure you've run: railway volume mount"
    exit 1
fi

echo "📤 Uploading video files to Railway Volume..."
echo "Source: $SOURCE_DIR"
echo "Destination: $VOLUME_MOUNT"
echo ""

# Count files
VIDEO_COUNT=$(find "$SOURCE_DIR" -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | wc -l)
echo "📹 Found $VIDEO_COUNT video files"
echo ""

# List files
echo "Files to upload:"
find "$SOURCE_DIR" -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | while read file; do
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

# Copy files
echo "🚀 Copying files..."
cp -r "$SOURCE_DIR"/* "$VOLUME_MOUNT/" 2>&1

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Upload complete!"
    echo ""
    echo "Verifying files..."
    ls -lh "$VOLUME_MOUNT" | head -20
    echo ""
    echo "📊 Summary:"
    echo "  Files in volume: $(find "$VOLUME_MOUNT" -type f | wc -l)"
    echo "  Total size: $(du -sh "$VOLUME_MOUNT" | cut -f1)"
    echo ""
    echo "💡 Next steps:"
    echo "1. Unmount volume (if needed)"
    echo "2. Verify files on Railway: railway shell → ls -lh /app/server/uploads/videos/"
    echo "3. Test video playback in the application"
else
    echo ""
    echo "❌ Upload failed. Please check the error messages above."
    exit 1
fi

