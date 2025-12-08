#!/bin/bash
echo "📁 Monitoring processed videos in static folder..."
echo "Current contents:"
ls -la static/
echo ""
echo "🔄 Watching for new files... (Press Ctrl+C to stop)"
fswatch -o static/ | while read f; do
    echo "📈 New files detected in static folder:"
    ls -la static/ | grep -E "\.(mp4|srt)$" || echo "No video/subtitle files found yet"
    echo "---"
done
