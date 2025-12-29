#!/bin/bash
# Script to pull Git LFS files on Railway
# This should be run during build or deployment

echo "📥 Pulling Git LFS files..."

# Check if git-lfs is installed
if ! command -v git-lfs &> /dev/null; then
    echo "⚠️  Git LFS not found, installing..."
    # Try to install git-lfs (adjust based on your system)
    # For Railway/Nixpacks, git-lfs should be available
    git lfs install || echo "❌ Failed to install Git LFS"
fi

# Pull LFS files
echo "📥 Pulling LFS objects..."
git lfs pull || echo "⚠️  Git LFS pull failed, continuing anyway..."

# Verify video files exist
if [ -d "server/uploads/videos" ]; then
    echo "✅ Video directory exists"
    VIDEO_COUNT=$(find server/uploads/videos -name "*.mp4" -o -name "*.webm" -o -name "*.mov" | wc -l)
    echo "📹 Found $VIDEO_COUNT video files"
else
    echo "⚠️  Video directory not found"
fi

echo "✅ Git LFS pull completed"

