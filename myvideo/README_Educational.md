# Educational Content Localization System

A Flask-based video translation application enhanced with **educational content localization** for STEM transcripts. The system converts English STEM transcripts into regional-language, culturally-localized, pedagogy-aware lessons that address common misconceptions from historic data.

## 🎓 Educational Localization Features

### Core Functionality
The educational content localizer performs these tasks:

- **A)** Extract the 6 most important STEM concepts from transcripts
- **B)** Rewrite transcripts into clear, colloquial regional-language text (grades 6-10)
- **C)** Replace culturally-opaque examples with locally-meaningful analogies
- **D)** Insert 2 short clarifying sentences addressing regional misconceptions
- **E)** Produce TTS-ready narration (under 250 words)
- **F)** Return list of misconceptions addressed
- **G)** Return list of analogies used
- **H)** Output valid JSON with exact schema

### Supported Regions
- **Odisha** (Odia - `or`)
- **Tamil Nadu** (Tamil - `ta`) 
- **West Bengal** (Bengali - `bn`)

Each region includes:
- Common STEM misconceptions and corrections
- Cultural analogies (e.g., baseball → gilli-danda, pizza → dosa)
- Region-specific examples and contexts

## 🚀 Quick Start

### Prerequisites
```bash
# Install system dependencies
brew install ffmpeg  # macOS
# or: sudo apt install ffmpeg  # Linux

# Install Python packages
pip install flask openai-whisper deep-translator gtts pysrt ffmpeg-python yt-dlp requests
```

### Running the Application
```bash
cd myvedio
python3 app.py
```

The server will start on `http://localhost:3050`

## 📚 API Endpoints

### 1. Educational Content Localization
**Endpoint:** `POST /localize_educational_content`

**Input JSON:**
```json
{
  "transcript_text": "Your STEM transcript here...",
  "region_id": "odisha",
  "lang_code": "or", 
  "historic_json": "{\"additional_data\": \"...\"}"
}
```

**Output JSON:**
```json
{
  "concepts": ["gravity", "force", "motion"],
  "localized_text": "Full localized lesson text...",
  "tts_ready_text": "Audio-optimized text under 250 words...",
  "misconceptions_addressed": [
    {
      "misconception": "Heavy objects fall faster than light objects",
      "how_addressed": "Inserted clarification explaining equal acceleration"
    }
  ],
  "analogies_used": [
    {
      "original_example": "baseball",
      "replacement": "gilli-danda", 
      "where_in_text": "When you throw a gilli-danda..."
    }
  ],
  "note": "language unsupported — produced in English"
}
```

### 2. Regular Video Processing
**Endpoint:** `POST /process`
- Upload video files for translation and TTS

**Endpoint:** `POST /process_youtube`  
- Process YouTube videos with translation

### 3. Educational Video Processing
**Endpoint:** `POST /process_educational`
- Process uploaded videos with educational localization

**Endpoint:** `POST /process_youtube_educational`
- Process YouTube videos with educational localization

## 🧪 Testing

### Run Comprehensive Tests
```bash
python3 test_comprehensive_educational.py
```

### Run Demo
```bash  
python3 demo_educational.py
```

### Test Individual Functions
```python
from app import localize_educational_content

result = localize_educational_content(
    transcript="Your STEM transcript...", 
    region_id="odisha",
    target_lang="or"
)
print(result)
```

## 📁 Project Structure

```
myvedio/
├── app.py                              # Main Flask application
├── templates/
│   └── index.html                      # Web interface
├── static/                             # Output files (videos, audio)
├── uploads/                            # Temporary upload files
├── test_comprehensive_educational.py   # Test suite
├── demo_educational.py                 # Demo script
├── test_educational.py                 # Basic tests
├── check_processed_videos.py          # File monitoring
└── README.md                          # This file
```

## 🎯 Educational Data Structure

### Regional Misconceptions
Each region includes common STEM misconceptions:
```python
{
  "topic": "physics",
  "misconception": "Heavy objects fall faster than light objects", 
  "correction": "All objects fall at the same rate in vacuum"
}
```

### Cultural Analogies  
Region-specific replacements for culturally-opaque terms:
```python
{
  "baseball": "gilli-danda",      # Odisha
  "pizza": "dosa",                # Tamil Nadu  
  "cowboy": "fisherman"           # West Bengal
}
```

## 🔧 Configuration

### Language Support
Supported by gTTS: `hi`, `mr`, `ta`, `te`, `bn`, `gu`, `kn`, `ml`, `pa`, `ur`, `or`, `en`

### Whisper Models
Configure in `app.py`:
- `"tiny"` - Fast, less accurate
- `"base"` - Balanced
- `"small"` - Better accuracy  
- `"medium"` - High accuracy
- `"large"` - Best accuracy

## 🌟 Example Use Cases

1. **Physics Lesson (Odisha)**
   - Input: "When you drop a baseball..."
   - Output: "When you drop a gilli-danda..."
   - Addresses: Heavy vs light object misconception

2. **Chemistry Lesson (Tamil Nadu)**
   - Input: "Like eating pizza with acids..."
   - Output: "Like eating dosa with acids..."
   - Addresses: "All acids are dangerous" misconception

3. **Biology Lesson (West Bengal)**
   - Input: "Like a cowboy in the field..."
   - Output: "Like a fisherman by the river..."
   - Addresses: Plant respiration misconceptions

## 🛠️ Development

### Adding New Regions
1. Add region data to `REGIONAL_DATA` in `app.py`
2. Include misconceptions and cultural analogies
3. Test with the demo script

### Enhancing Concept Extraction
Current implementation uses keyword matching. Can be enhanced with:
- NLP libraries (spaCy, NLTK)
- Machine learning models  
- Domain-specific ontologies

## 🚨 Troubleshooting

### Common Issues
1. **"zsh: command not found: python"**
   - Use `python3` instead of `python`

2. **ImportError for whisper/ffmpeg**
   - Install system dependencies: `brew install ffmpeg`
   - Install Python packages: `pip install openai-whisper`

3. **Connection refused on port 3050**
   - Check if Flask server is running: `python3 app.py`
   - Verify no other service uses port 3050

4. **gTTS language not supported**
   - Check supported languages in function documentation
   - System will fall back to English with note

### Debug Mode
Set `debug=True` in `app.py` for detailed error messages.

## 📝 License

This project is for educational purposes. Please ensure compliance with YouTube's Terms of Service when processing videos.

---

**🎉 Ready to localize STEM education for regional learners!**
