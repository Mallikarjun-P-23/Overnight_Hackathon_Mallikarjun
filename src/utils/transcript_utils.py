import re
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

from ..models.data_models import VideoTranscript, TranscriptSegment, LanguageCode

def parse_srt_to_transcript(srt_content: str, video_id: str, title: str, subject: str) -> VideoTranscript:
    """Parse SRT subtitle file to VideoTranscript object"""
    segments = []
    
    # Split SRT into blocks
    blocks = re.split(r'\n\s*\n', srt_content.strip())
    
    for block in blocks:
        lines = block.strip().split('\n')
        if len(lines) >= 3:
            # Extract sequence number
            sequence = lines[0].strip()
            
            # Extract timestamps
            time_line = lines[1].strip()
            time_match = re.match(r'(\d{2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,\.]\d{3})', time_line)
            
            if time_match:
                start_time = _parse_timestamp(time_match.group(1))
                end_time = _parse_timestamp(time_match.group(2))
                
                # Extract text (may span multiple lines)
                text = ' '.join(lines[2:]).strip()
                
                segment = TranscriptSegment(
                    segment_id=f"{video_id}_seg_{sequence}",
                    original_text=text,
                    timestamp_start=start_time,
                    timestamp_end=end_time
                )
                segments.append(segment)
    
    return VideoTranscript(
        video_id=video_id,
        title=title,
        subject=subject,
        segments=segments
    )

def _parse_timestamp(timestamp_str: str) -> float:
    """Convert timestamp string to seconds (float)"""
    # Handle both comma and dot as decimal separator
    timestamp_str = timestamp_str.replace(',', '.')
    
    # Parse HH:MM:SS.mmm format
    parts = timestamp_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    seconds_parts = parts[2].split('.')
    seconds = int(seconds_parts[0])
    milliseconds = int(seconds_parts[1]) if len(seconds_parts) > 1 else 0
    
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000

def create_mock_transcript(video_id: str, title: str, subject: str) -> VideoTranscript:
    """Create a mock transcript for testing purposes"""
    segments = [
        TranscriptSegment(
            segment_id=f"{video_id}_seg_1",
            original_text="Today we'll learn about forces in physics. Imagine you're playing baseball - when you swing the bat, you apply force to hit the ball.",
            timestamp_start=0.0,
            timestamp_end=5.5
        ),
        TranscriptSegment(
            segment_id=f"{video_id}_seg_2", 
            original_text="The harder you swing, the more force you apply, and the farther the ball travels. This demonstrates Newton's second law of motion.",
            timestamp_start=5.5,
            timestamp_end=12.0
        ),
        TranscriptSegment(
            segment_id=f"{video_id}_seg_3",
            original_text="Let's also think about levers. A baseball bat works like a lever - your hands are the fulcrum, and the bat amplifies your force.",
            timestamp_start=12.0,
            timestamp_end=18.5
        ),
        TranscriptSegment(
            segment_id=f"{video_id}_seg_4",
            original_text="In chemistry, mixing ingredients is like combining elements. Just like baking a cake, you need the right proportions for the reaction to work properly.",
            timestamp_start=18.5,
            timestamp_end=26.0
        )
    ]
    
    return VideoTranscript(
        video_id=video_id,
        title=title,
        subject=subject,
        segments=segments,
        metadata={
            "duration": 26.0,
            "language": "en",
            "created_at": datetime.now().isoformat()
        }
    )

def extract_text_segments(transcript: VideoTranscript, max_length: int = 500) -> List[str]:
    """Extract text segments from transcript, combining short segments if needed"""
    segments = []
    current_segment = ""
    
    for segment in transcript.segments:
        if len(current_segment + " " + segment.original_text) <= max_length:
            if current_segment:
                current_segment += " " + segment.original_text
            else:
                current_segment = segment.original_text
        else:
            if current_segment:
                segments.append(current_segment)
            current_segment = segment.original_text
    
    if current_segment:
        segments.append(current_segment)
    
    return segments

def calculate_adaptation_metrics(original_transcript: VideoTranscript, adapted_transcript: VideoTranscript) -> Dict[str, Any]:
    """Calculate metrics for adaptation quality"""
    metrics = {
        "total_segments": len(original_transcript.segments),
        "adapted_segments": len([s for s in adapted_transcript.segments if s.localized_text]),
        "adaptation_rate": 0.0,
        "concepts_adapted": 0,
        "average_segment_length_change": 0.0
    }
    
    if metrics["total_segments"] > 0:
        metrics["adaptation_rate"] = metrics["adapted_segments"] / metrics["total_segments"]
    
    # Calculate concept adaptations
    total_concepts = sum(len(s.concepts_identified) for s in adapted_transcript.segments)
    adapted_concepts = sum(len(s.cultural_mappings) for s in adapted_transcript.segments)
    
    metrics["concepts_adapted"] = adapted_concepts
    metrics["concept_adaptation_rate"] = adapted_concepts / total_concepts if total_concepts > 0 else 0.0
    
    # Calculate length changes
    original_lengths = [len(s.original_text) for s in original_transcript.segments]
    adapted_lengths = [len(s.localized_text or s.original_text) for s in adapted_transcript.segments]
    
    if original_lengths and adapted_lengths:
        avg_original = sum(original_lengths) / len(original_lengths)
        avg_adapted = sum(adapted_lengths) / len(adapted_lengths)
        metrics["average_segment_length_change"] = (avg_adapted - avg_original) / avg_original
    
    return metrics

def validate_transcript_format(transcript_data: Dict[str, Any]) -> List[str]:
    """Validate transcript data format and return list of issues"""
    issues = []
    
    required_fields = ["video_id", "title", "subject", "segments"]
    for field in required_fields:
        if field not in transcript_data:
            issues.append(f"Missing required field: {field}")
    
    if "segments" in transcript_data:
        segments = transcript_data["segments"]
        if not isinstance(segments, list):
            issues.append("Segments must be a list")
        else:
            for i, segment in enumerate(segments):
                if not isinstance(segment, dict):
                    issues.append(f"Segment {i} must be a dictionary")
                    continue
                
                required_segment_fields = ["segment_id", "original_text", "timestamp_start", "timestamp_end"]
                for field in required_segment_fields:
                    if field not in segment:
                        issues.append(f"Segment {i} missing field: {field}")
    
    return issues

def export_transcript_to_srt(transcript: VideoTranscript, use_localized: bool = True) -> str:
    """Export transcript back to SRT format"""
    srt_content = []
    
    for i, segment in enumerate(transcript.segments, 1):
        text = segment.localized_text if use_localized and segment.localized_text else segment.original_text
        
        start_time = _seconds_to_timestamp(segment.timestamp_start)
        end_time = _seconds_to_timestamp(segment.timestamp_end)
        
        srt_content.append(f"{i}")
        srt_content.append(f"{start_time} --> {end_time}")
        srt_content.append(text)
        srt_content.append("")  # Empty line between segments
    
    return '\n'.join(srt_content)

def _seconds_to_timestamp(seconds: float) -> str:
    """Convert seconds to SRT timestamp format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    milliseconds = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{milliseconds:03d}"