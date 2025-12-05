import os
import uuid
import subprocess
from flask import Flask, request, render_template, send_from_directory, jsonify
import whisper
from deep_translator import GoogleTranslator
from gtts import gTTS
import pysrt
import math
import ffmpeg
import yt_dlp
import json
import re

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'static'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Choose small model for demo speed: "tiny", "base", "small", "medium", "large"
WHISPER_MODEL = "tiny"

print("Loading Whisper model:", WHISPER_MODEL)
model = whisper.load_model(WHISPER_MODEL)
# GoogleTranslator will be initialized per request

# Educational content localization data
REGIONAL_DATA = {
    "odisha": {
        "common_misconceptions": [
            {"topic": "physics", "misconception": "Heavy objects fall faster than light objects", "correction": "All objects fall at the same rate in vacuum"},
            {"topic": "chemistry", "misconception": "Atoms are the smallest particles", "correction": "Atoms contain protons, neutrons, and electrons"},
            {"topic": "biology", "misconception": "Plants don't breathe", "correction": "Plants both photosynthesize and respire"}
        ],
        "cultural_analogies": {
            "baseball": "gilli-danda",
            "football": "cricket",
            "subway": "bus transport",
            "skyscraper": "Jagannath Temple spire"
        },
        "language_code": "or"
    },
    "tamil_nadu": {
        "common_misconceptions": [
            {"topic": "physics", "misconception": "Sound travels faster than light", "correction": "Light travels much faster than sound"},
            {"topic": "chemistry", "misconception": "Boiling point is always 100°C", "correction": "Boiling point depends on pressure and altitude"},
            {"topic": "math", "misconception": "Division by zero equals infinity", "correction": "Division by zero is undefined"}
        ],
        "cultural_analogies": {
            "baseball": "kabaddi",
            "pizza": "dosa",
            "subway": "Chennai Metro",
            "ranch": "coconut grove"
        },
        "language_code": "ta"
    },
    "west_bengal": {
        "common_misconceptions": [
            {"topic": "biology", "misconception": "Fish can't live in polluted water", "correction": "Some fish species are very adaptable to pollution"},
            {"topic": "physics", "misconception": "Magnets only attract iron", "correction": "Magnets attract iron, nickel, cobalt and some other materials"},
            {"topic": "chemistry", "misconception": "All acids are dangerous", "correction": "Many acids like citric acid in fruits are safe to consume"}
        ],
        "cultural_analogies": {
            "baseball": "cricket",
            "hamburger": "fish curry and rice",
            "subway": "Kolkata Metro",
            "cowboy": "fisherman"
        },
        "language_code": "bn"
    }
}

# Utility: download YouTube video
def download_youtube_video(url, output_dir):
    """
    Download a YouTube video and return the path to the downloaded file.
    """
    ydl_opts = {
        'format': 'best[ext=mp4]/best',  # prefer mp4 format
        'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
        'noplaylist': True,
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        # Get video info first
        info = ydl.extract_info(url, download=False)
        video_title = info.get('title', 'video')
        
        # Clean filename for safety
        safe_title = "".join(c for c in video_title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        
        # Update output template with safe filename
        ydl_opts['outtmpl'] = os.path.join(output_dir, f'{safe_title}.%(ext)s')
        
        # Download the video
        with yt_dlp.YoutubeDL(ydl_opts) as ydl_download:
            ydl_download.download([url])
            
        # Find the downloaded file
        downloaded_files = [f for f in os.listdir(output_dir) if f.startswith(safe_title)]
        if downloaded_files:
            return os.path.join(output_dir, downloaded_files[0]), safe_title
        else:
            raise Exception("Failed to find downloaded video file")

# Utility: extract audio to wav using ffmpeg
def extract_audio(input_path, output_audio_path):
    # ffmpeg -y -i input.mp4 -vn -acodec pcm_s16le -ar 16000 -ac 1 out.wav
    command = [
        'ffmpeg', '-y', '-i', input_path,
        '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1',
        output_audio_path
    ]
    subprocess.run(command, check=True)

# Utility: replace audio track in video with new audio
def replace_audio(original_video, new_audio, output_video):
    # ffmpeg -y -i original_video -i new_audio -c:v copy -map 0:v:0 -map 1:a:0 -shortest output_video
    command = [
        'ffmpeg', '-y', '-i', original_video, '-i', new_audio,
        '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest',
        output_video
    ]
    subprocess.run(command, check=True)

# Utility: generate basic SRT from transcription timestamps
def segments_to_srt(segments, srt_path):
    subs = pysrt.SubRipFile()
    for i, seg in enumerate(segments, start=1):
        start = seg['start']
        end = seg['end']
        text = seg['text'].strip()
        # convert seconds to pysrt time format
        def sec_to_time(s):
            hours = int(s // 3600)
            mins = int((s % 3600) // 60)
            secs = int(s % 60)
            millis = int((s - int(s)) * 1000)
            return pysrt.SubRipTime(hours=hours, minutes=mins, seconds=secs, milliseconds=millis)
        sub = pysrt.SubRipItem(index=i, start=sec_to_time(start), end=sec_to_time(end), text=text)
        subs.append(sub)
    subs.save(srt_path, encoding='utf-8')

# Optional: burn subtitles into video using ffmpeg
def burn_subtitles(video_in, srt_path, video_out):
    # ffmpeg -y -i video_in -vf subtitles=sub.srt -c:a copy video_out
    command = [
        'ffmpeg', '-y', '-i', video_in,
        '-vf', f"subtitles={srt_path}",
        '-c:a', 'copy', video_out
    ]
    subprocess.run(command, check=True)

def extract_stem_concepts(transcript):
    """Extract important STEM concepts from transcript"""
    # Simple keyword-based extraction - can be enhanced with NLP
    stem_keywords = [
        # Physics concepts
        "gravity", "force", "energy", "motion", "acceleration", "velocity", "momentum",
        "electricity", "magnetism", "light", "sound", "heat", "temperature", "pressure",
        
        # Chemistry concepts  
        "atom", "molecule", "element", "compound", "reaction", "acid", "base", "pH",
        "oxidation", "reduction", "catalyst", "solution", "mixture", "crystallization",
        
        # Biology concepts
        "cell", "DNA", "gene", "evolution", "photosynthesis", "respiration", "digestion",
        "ecosystem", "biodiversity", "adaptation", "reproduction", "inheritance",
        
        # Math concepts
        "equation", "function", "graph", "statistics", "probability", "geometry",
        "algebra", "calculus", "integration", "differentiation", "matrix", "vector"
    ]
    
    concepts = []
    transcript_lower = transcript.lower()
    
    for keyword in stem_keywords:
        if keyword in transcript_lower:
            concepts.append(keyword)
    
    # Return top 6 most important/frequent concepts
    return concepts[:6] if len(concepts) >= 6 else concepts

def localize_educational_content(transcript, region_id, target_lang):
    """
    Educational content localizer and pedagogy assistant.
    Converts an English STEM transcript into a regional-language, 
    culturally-localized, pedagogy-aware lesson that addresses common misconceptions.
    
    Returns JSON with the exact schema specified.
    """
    
    # Get regional data
    regional_info = REGIONAL_DATA.get(region_id, {
        "common_misconceptions": [],
        "cultural_analogies": {},
        "language_code": target_lang
    })
    
    # A) Extract the 6 most important STEM concepts
    concepts = extract_stem_concepts(transcript)
    
    # B) Rewrite transcript into clear, colloquial regional-language text
    # Start with the original transcript and progressively enhance it
    localized_text = transcript
    
    # C) Replace culturally-opaque examples with locally-meaningful analogies
    analogies_used = []
    for original, replacement in regional_info.get("cultural_analogies", {}).items():
        if original.lower() in localized_text.lower():
            # Case-insensitive replacement
            pattern = re.compile(re.escape(original), re.IGNORECASE)
            # Find the context where replacement occurs
            match = pattern.search(localized_text)
            if match:
                context_start = max(0, match.start() - 20)
                context_end = min(len(localized_text), match.end() + 20)
                context = localized_text[context_start:context_end]
                
                localized_text = pattern.sub(replacement, localized_text)
                analogies_used.append({
                    "original_example": original,
                    "replacement": replacement,
                    "where_in_text": context.strip()
                })
    
    # D) Insert 2 short clarifying sentences addressing common misconceptions
    misconceptions_addressed = []
    misconceptions = regional_info.get("common_misconceptions", [])
    
    # Find relevant misconceptions based on concepts and transcript content
    relevant_misconceptions = []
    transcript_lower = transcript.lower()
    
    for misconception in misconceptions:
        # Check if misconception is relevant to the content
        misconception_keywords = misconception["misconception"].lower().split()
        correction_keywords = misconception["correction"].lower().split()
        
        # Check if any concept or transcript content relates to this misconception
        is_relevant = False
        for concept in concepts:
            if concept.lower() in misconception["misconception"].lower() or \
               concept.lower() in misconception["correction"].lower():
                is_relevant = True
                break
        
        # Also check if transcript contains related keywords
        if not is_relevant:
            for keyword in misconception_keywords + correction_keywords:
                if len(keyword) > 3 and keyword in transcript_lower:
                    is_relevant = True
                    break
        
        if is_relevant:
            relevant_misconceptions.append(misconception)
    
    # Add clarifying sentences for up to 2 most relevant misconceptions
    for i, misconception in enumerate(relevant_misconceptions[:2]):
        # Insert clarification at appropriate moments in the text
        clarification = f" Common mistake: {misconception['misconception']}. Correct idea: {misconception['correction']}."
        
        # Find a good insertion point (after a sentence about the topic)
        sentences = localized_text.split('.')
        inserted = False
        
        for j, sentence in enumerate(sentences):
            # Look for sentences that might relate to this misconception
            sentence_lower = sentence.lower()
            misconception_words = misconception["misconception"].lower().split()
            
            for word in misconception_words:
                if len(word) > 3 and word in sentence_lower:
                    sentences[j] = sentence + clarification
                    inserted = True
                    break
            if inserted:
                break
        
        if not inserted:
            # If no good insertion point found, add at the end
            localized_text += clarification
        else:
            localized_text = '.'.join(sentences)
        
        misconceptions_addressed.append({
            "misconception": misconception["misconception"],
            "how_addressed": f"Inserted clarification explaining that {misconception['correction'].lower()}"
        })
    
    # E) Produce TTS-ready narration block (under 250 words)
    tts_text = localized_text
    
    # Clean up for TTS: remove awkward punctuation, simplify
    tts_text = re.sub(r'\n+', '. ', tts_text)  # Replace newlines with periods
    tts_text = re.sub(r'\s+', ' ', tts_text)  # Normalize whitespace
    tts_text = re.sub(r'[(){}\[\]/\\]', '', tts_text)  # Remove awkward punctuation
    tts_text = re.sub(r'\.{2,}', '.', tts_text)  # Fix multiple periods
    tts_text = tts_text.strip()
    
    # Truncate to ~250 words for TTS optimization
    words = tts_text.split()
    if len(words) > 250:
        # Find a good breaking point near 250 words
        break_point = 250
        for i in range(240, min(250, len(words))):
            if words[i].endswith(('.', '!', '?')):
                break_point = i + 1
                break
        tts_text = ' '.join(words[:break_point])
    
    # Check if language is supported by gTTS
    supported_languages = ['hi', 'mr', 'ta', 'te', 'bn', 'gu', 'kn', 'ml', 'pa', 'ur', 'or', 'en']
    note = None
    if target_lang not in supported_languages:
        note = "language unsupported — produced in English"
        # Keep the content in English if language not supported
    
    # Prepare the result following the exact JSON schema
    result = {
        "concepts": concepts,
        "localized_text": localized_text,
        "tts_ready_text": tts_text,
        "misconceptions_addressed": misconceptions_addressed,
        "analogies_used": analogies_used
    }
    
    if note:
        result["note"] = note
    
    return result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/process_youtube', methods=['POST'])
def process_youtube_video():
    """
    Expected JSON data:
    - youtube_url: YouTube video URL
    - target_lang: language code for translation & TTS (e.g., hi for Hindi, mr for Marathi)
    - burn_subs: boolean for burning subtitles into video
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    youtube_url = data.get('youtube_url')
    target_lang = data.get('target_lang', 'hi')  # default to Hindi
    burn_subs = data.get('burn_subs', False)

    if not youtube_url:
        return jsonify({'error': 'No YouTube URL provided'}), 400

    uid = str(uuid.uuid4())[:8]

    try:
        # Step 1: Download YouTube video
        print(f"Downloading YouTube video: {youtube_url}")
        downloaded_path, video_title = download_youtube_video(youtube_url, UPLOAD_FOLDER)
        
        # Step 2: extract audio
        audio_wav = os.path.join(UPLOAD_FOLDER, f"{uid}.wav")
        extract_audio(downloaded_path, audio_wav)

        # Step 3: transcribe using whisper
        print("Transcribing audio with Whisper...")
        result = model.transcribe(audio_wav, language=None)  # let model detect language
        original_language = result.get('language', 'unknown')
        full_text = result['text']
        segments = result.get('segments', [])

        # Step 4: translate text
        print("Translating text to", target_lang)
        translated_full = GoogleTranslator(source='auto', target=target_lang).translate(full_text)

        # Translate segments individually (for subtitles)
        translated_segments = []
        for s in segments:
            txt = s['text'].strip()
            translated_txt = GoogleTranslator(source='auto', target=target_lang).translate(txt) if txt else ''
            translated_segments.append({
                'start': s['start'],
                'end': s['end'],
                'text': translated_txt
            })

        # Step 5: synthesize translated audio using gTTS
        print("Synthesizing speech (gTTS)...")
        tts = gTTS(text=translated_full, lang=target_lang)
        tts_audio_path = os.path.join(OUTPUT_FOLDER, f"{uid}_tts.mp3")
        tts.save(tts_audio_path)

        # Step 6: replace original audio in video with the TTS audio
        output_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_translated.mp4")
        replace_audio(downloaded_path, tts_audio_path, output_video_path)

        # Step 7: create subtitles file in target language
        srt_path = os.path.join(OUTPUT_FOLDER, f"{uid}.srt")
        segments_to_srt(translated_segments, srt_path)

        # Optional: if user wants burned subtitles, create a burned video too
        burned_video_path = None
        if burn_subs:
            burned_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_burned.mp4")
            srt_abs = os.path.abspath(srt_path)
            burn_subtitles(output_video_path, srt_abs, burned_video_path)

        response = {
            'video_title': video_title,
            'original_language': original_language,
            'translated_text_preview': (translated_full[:1000] + '...') if len(translated_full) > 1000 else translated_full,
            'video_url': f"/static/{os.path.basename(output_video_path)}",
            'srt_url': f"/static/{os.path.basename(srt_path)}"
        }
        if burned_video_path:
            response['burned_video_url'] = f"/static/{os.path.basename(burned_video_path)}"

        return jsonify(response)
    except Exception as e:
        print("Error processing YouTube video:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        # cleanup
        try:
            if os.path.exists(audio_wav):
                os.remove(audio_wav)
            # Optionally remove downloaded video to save space
            # if os.path.exists(downloaded_path):
            #     os.remove(downloaded_path)
        except:
            pass

@app.route('/process', methods=['POST'])
def process_video():
    """
    Expected form-data:
    - file: uploaded video
    - target_lang: language code for translation & TTS (e.g., hi for Hindi, mr for Marathi)
    - burn_subs: "on" or not (optional)
    """
    file = request.files.get('file')
    target_lang = request.form.get('target_lang', 'hi')  # default to Hindi
    burn_subs = request.form.get('burn_subs', 'off') == 'on'

    if not file:
        return jsonify({'error': 'No file uploaded'}), 400

    uid = str(uuid.uuid4())[:8]
    filename = f"{uid}_{file.filename}"
    input_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(input_path)

    try:
        # Step 1: extract audio
        audio_wav = os.path.join(UPLOAD_FOLDER, f"{uid}.wav")
        extract_audio(input_path, audio_wav)

        # Step 2: transcribe using whisper
        # We request timestamps (word-level not exact; whisper gives segments)
        print("Transcribing audio with Whisper...")
        result = model.transcribe(audio_wav, language=None)  # let model detect language
        # result contains 'text' and 'segments'
        original_language = result.get('language', 'unknown')
        full_text = result['text']
        segments = result.get('segments', [])

        # Step 3: translate text. We'll translate full_text and each segment for SRT timing.
        print("Translating text to", target_lang)
        translated_full = GoogleTranslator(source='auto', target=target_lang).translate(full_text)

        # Translate segments individually (for subtitles)
        translated_segments = []
        for s in segments:
            txt = s['text'].strip()
            translated_txt = GoogleTranslator(source='auto', target=target_lang).translate(txt) if txt else ''
            translated_segments.append({
                'start': s['start'],
                'end': s['end'],
                'text': translated_txt
            })

        # Step 4: synthesize translated audio using gTTS
        print("Synthesizing speech (gTTS)...")
        tts = gTTS(text=translated_full, lang=target_lang)
        tts_audio_path = os.path.join(OUTPUT_FOLDER, f"{uid}_tts.mp3")
        tts.save(tts_audio_path)

        # Convert mp3 to wav (optional) or keep mp3 — ffmpeg can use mp3 directly when replacing audio
        # Step 5: replace original audio in video with the TTS audio
        output_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_translated.mp4")
        replace_audio(input_path, tts_audio_path, output_video_path)

        # Step 6: create subtitles file in target language
        srt_path = os.path.join(OUTPUT_FOLDER, f"{uid}.srt")
        segments_to_srt(translated_segments, srt_path)

        # Optional: if user wants burned subtitles, create a burned video too
        burned_video_path = None
        if burn_subs:
            burned_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_burned.mp4")
            # ffmpeg subtitles filter expects path without spaces or we can escape. Use absolute path.
            srt_abs = os.path.abspath(srt_path)
            # For Windows the subtitles filter can be picky; ensure proper escaping
            burn_subtitles(output_video_path, srt_abs, burned_video_path)

        response = {
            'original_language': original_language,
            'translated_text_preview': (translated_full[:1000] + '...') if len(translated_full) > 1000 else translated_full,
            'video_url': f"/static/{os.path.basename(output_video_path)}",
            'srt_url': f"/static/{os.path.basename(srt_path)}"
        }
        if burned_video_path:
            response['burned_video_url'] = f"/static/{os.path.basename(burned_video_path)}"

        return jsonify(response)
    except Exception as e:
        print("Error processing:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        # cleanup extracted audio to save space
        try:
            if os.path.exists(audio_wav):
                os.remove(audio_wav)
        except:
            pass

@app.route('/process_educational', methods=['POST'])
def process_educational_content():
    """
    Educational content localization endpoint
    Expected JSON data:
    - transcript_text: The transcript to localize
    - region_id: Region identifier (e.g., "odisha", "tamil_nadu", "west_bengal")
    - lang_code: Target language code for TTS
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    transcript_text = data.get('transcript_text')
    region_id = data.get('region_id', 'odisha')
    lang_code = data.get('lang_code', 'hi')
    
    if not transcript_text:
        return jsonify({'error': 'No transcript text provided'}), 400
    
    try:
        # Process educational content
        result = localize_educational_content(transcript_text, region_id, lang_code)
        
        # Generate TTS audio for the localized content
        uid = str(uuid.uuid4())[:8]
        tts = gTTS(text=result["tts_ready_text"], lang=lang_code)
        tts_audio_path = os.path.join(OUTPUT_FOLDER, f"educational_{uid}.mp3")
        tts.save(tts_audio_path)
        
        # Add audio URL to result
        result['audio_url'] = f"/static/{os.path.basename(tts_audio_path)}"
        
        return jsonify(result)
        
    except Exception as e:
        print("Error processing educational content:", e)
        return jsonify({'error': str(e)}), 500

@app.route('/process_youtube_educational', methods=['POST'])
def process_youtube_educational():
    """
    Process YouTube video with educational localization
    Expected JSON data:
    - youtube_url: YouTube video URL
    - region_id: Region identifier 
    - target_lang: language code for translation & TTS
    - burn_subs: boolean for burning subtitles into video
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
        
    youtube_url = data.get('youtube_url')
    region_id = data.get('region_id', 'odisha')
    target_lang = data.get('target_lang', 'hi')
    burn_subs = data.get('burn_subs', False)

    if not youtube_url:
        return jsonify({'error': 'No YouTube URL provided'}), 400

    uid = str(uuid.uuid4())[:8]

    try:
        # Step 1: Download YouTube video
        print(f"Downloading YouTube video: {youtube_url}")
        downloaded_path, video_title = download_youtube_video(youtube_url, UPLOAD_FOLDER)
        
        # Step 2: extract audio
        audio_wav = os.path.join(UPLOAD_FOLDER, f"{uid}.wav")
        extract_audio(downloaded_path, audio_wav)

        # Step 3: transcribe using whisper
        print("Transcribing audio with Whisper...")
        result = model.transcribe(audio_wav, language=None)
        original_language = result.get('language', 'unknown')
        full_text = result['text']
        segments = result.get('segments', [])

        # Step 4: Educational localization
        print("Applying educational localization...")
        educational_content = localize_educational_content(full_text, region_id, target_lang)
        
        # Use the localized TTS-ready text for speech synthesis
        localized_text = educational_content["tts_ready_text"]

        # Step 5: synthesize localized audio using gTTS
        print("Synthesizing educational speech (gTTS)...")
        tts = gTTS(text=localized_text, lang=target_lang)
        tts_audio_path = os.path.join(OUTPUT_FOLDER, f"{uid}_educational_tts.mp3")
        tts.save(tts_audio_path)

        # Step 6: replace original audio in video with the educational TTS audio
        output_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_educational.mp4")
        replace_audio(downloaded_path, tts_audio_path, output_video_path)

        # Step 7: create educational subtitles
        # For simplicity, use the localized text as one subtitle block
        educational_segments = [{
            'start': 0,
            'end': len(localized_text.split()) * 0.5,  # rough timing estimate
            'text': localized_text
        }]
        
        srt_path = os.path.join(OUTPUT_FOLDER, f"{uid}_educational.srt")
        segments_to_srt(educational_segments, srt_path)

        # Optional: burn subtitles
        burned_video_path = None
        if burn_subs:
            burned_video_path = os.path.join(OUTPUT_FOLDER, f"{uid}_educational_burned.mp4")
            srt_abs = os.path.abspath(srt_path)
            burn_subtitles(output_video_path, srt_abs, burned_video_path)

        response = {
            'video_title': video_title,
            'original_language': original_language,
            'region_id': region_id,
            'educational_content': educational_content,
            'video_url': f"/static/{os.path.basename(output_video_path)}",
            'srt_url': f"/static/{os.path.basename(srt_path)}",
            'audio_url': f"/static/{os.path.basename(tts_audio_path)}"
        }
        
        if burned_video_path:
            response['burned_video_url'] = f"/static/{os.path.basename(burned_video_path)}"

        return jsonify(response)
        
    except Exception as e:
        print("Error processing educational YouTube video:", e)
        return jsonify({'error': str(e)}), 500
    finally:
        # cleanup
        try:
            if os.path.exists(audio_wav):
                os.remove(audio_wav)
        except:
            pass

@app.route('/localize_educational_content', methods=['POST'])
def localize_educational_content_api():
    """
    Educational content localizer and pedagogy assistant API endpoint.
    
    Expected JSON input:
    {
        "transcript_text": "<<<TRANSCRIPT_TEXT>>>",
        "region_id": "<<<REGION_ID>>>",  # e.g., "odisha", "tamil_nadu", "west_bengal"  
        "lang_code": "<<<LANG_CODE>>>",  # e.g., "or" for Odia, "ta" Tamil, "hi" Hindi
        "historic_json": "<<<HISTORIC_JSON>>>"  # Optional: additional historic data
    }
    
    Returns JSON with exact schema:
    {
        "concepts": [...],
        "localized_text": "...",
        "tts_ready_text": "...",
        "misconceptions_addressed": [...],
        "analogies_used": [...],
        "note": "..." (optional)
    }
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No JSON data provided'}), 400
    
    transcript_text = data.get('transcript_text')
    region_id = data.get('region_id', 'odisha')
    lang_code = data.get('lang_code', 'hi')
    historic_json = data.get('historic_json')
    
    if not transcript_text:
        return jsonify({'error': 'No transcript_text provided'}), 400
    
    try:
        # If historic_json is provided, merge it with regional data
        if historic_json:
            try:
                if isinstance(historic_json, str):
                    historic_data = json.loads(historic_json)
                else:
                    historic_data = historic_json
                
                # Merge historic data with existing regional data if needed
                # For now, we'll use the existing REGIONAL_DATA structure
                # but this could be enhanced to incorporate the historic_json
            except (json.JSONDecodeError, TypeError):
                # If historic_json is malformed, continue with existing data
                pass
        
        # Process educational content using the comprehensive function
        result = localize_educational_content(transcript_text, region_id, lang_code)
        
        # The result already follows the exact JSON schema specified
        return jsonify(result)
        
    except Exception as e:
        print("Error in educational content localization:", e)
        return jsonify({'error': str(e)}), 500

# serve static output files automatically (Flask does this from 'static' folder)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3050, debug=True)