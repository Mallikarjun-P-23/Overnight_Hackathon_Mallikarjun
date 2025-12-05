#!/usr/bin/env python3
"""
Script to check processed videos in the static folder
"""
import os
import glob
from datetime import datetime

def check_processed_videos():
    static_folder = 'static'
    uploads_folder = 'uploads'
    
    print("🎬 Video Translation Status Check")
    print("=" * 50)
    
    # Check static folder for processed videos
    if os.path.exists(static_folder):
        video_files = glob.glob(os.path.join(static_folder, '*.mp4'))
        srt_files = glob.glob(os.path.join(static_folder, '*.srt'))
        audio_files = glob.glob(os.path.join(static_folder, '*.mp3'))
        
        print(f"\n📂 Static Folder ({static_folder}):")
        print(f"   📹 Video files: {len(video_files)}")
        print(f"   📝 Subtitle files: {len(srt_files)}")
        print(f"   🔊 Audio files: {len(audio_files)}")
        
        if video_files or srt_files or audio_files:
            print("\n📋 Files found:")
            all_files = video_files + srt_files + audio_files
            for file_path in sorted(all_files):
                file_name = os.path.basename(file_path)
                file_size = os.path.getsize(file_path)
                modified_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                # Determine file type
                if file_name.endswith('.mp4'):
                    if '_translated' in file_name:
                        file_type = "🎬 Translated Video"
                    elif '_burned' in file_name:
                        file_type = "🔥 Video with Burned Subs"
                    else:
                        file_type = "📹 Video"
                elif file_name.endswith('.srt'):
                    file_type = "📝 Subtitles"
                elif file_name.endswith('.mp3'):
                    file_type = "🔊 TTS Audio"
                else:
                    file_type = "📄 File"
                
                size_mb = file_size / (1024 * 1024)
                print(f"   {file_type}: {file_name}")
                print(f"      Size: {size_mb:.2f} MB")
                print(f"      Created: {modified_time.strftime('%Y-%m-%d %H:%M:%S')}")
                print()
        else:
            print("   ❌ No processed files found")
    else:
        print(f"❌ Static folder '{static_folder}' does not exist")
    
    # Check uploads folder
    if os.path.exists(uploads_folder):
        upload_files = glob.glob(os.path.join(uploads_folder, '*'))
        upload_files = [f for f in upload_files if os.path.isfile(f)]
        
        print(f"\n📥 Uploads Folder ({uploads_folder}):")
        print(f"   📁 Files: {len(upload_files)}")
        
        if upload_files:
            print("\n📋 Uploaded files:")
            for file_path in sorted(upload_files):
                file_name = os.path.basename(file_path)
                file_size = os.path.getsize(file_path)
                size_mb = file_size / (1024 * 1024)
                print(f"   📄 {file_name} ({size_mb:.2f} MB)")
        else:
            print("   ❌ No uploaded files found")
    else:
        print(f"❌ Uploads folder '{uploads_folder}' does not exist")
    
    print("\n" + "=" * 50)
    print("💡 To process a YouTube video, use the web interface at:")
    print("   http://localhost:3050")
    print("💡 Processed videos will appear in the 'static' folder")

if __name__ == "__main__":
    check_processed_videos()
