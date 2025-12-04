from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum

class LanguageCode(str, Enum):
    HINDI = "hi"
    TAMIL = "ta"
    TELUGU = "te"
    KANNADA = "kn"
    MALAYALAM = "ml"
    BENGALI = "bn"
    GUJARATI = "gu"
    MARATHI = "mr"
    PUNJABI = "pa"
    ODIA = "or"
    ENGLISH = "en"

class RegionalContext(str, Enum):
    NORTH_INDIA = "north_india"
    SOUTH_INDIA = "south_india"
    WEST_INDIA = "west_india"
    EAST_INDIA = "east_india"
    NORTHEAST_INDIA = "northeast_india"
    CENTRAL_INDIA = "central_india"

class ConceptCategory(str, Enum):
    GAMES = "games"
    SPORTS = "sports"
    FOOD = "food"
    FESTIVALS = "festivals"
    GEOGRAPHY = "geography"
    HISTORY = "history"
    MATHEMATICS = "mathematics"
    SCIENCE = "science"
    DAILY_LIFE = "daily_life"

class StudentProfile(BaseModel):
    student_id: str
    name: str
    native_language: LanguageCode
    regional_context: RegionalContext
    state: Optional[str] = None
    city: Optional[str] = None
    age_group: Optional[str] = None  # e.g., "10-12", "13-15", "16-18"
    learning_preferences: Dict[str, Any] = Field(default_factory=dict)
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list)
    concept_mappings: Dict[str, str] = Field(default_factory=dict)  # unfamiliar -> familiar
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class CulturalContext(BaseModel):
    context_id: str
    original_concept: str
    localized_concept: str
    category: ConceptCategory
    language: LanguageCode
    regional_context: RegionalContext
    description: str
    examples: List[str] = Field(default_factory=list)
    analogies: List[str] = Field(default_factory=list)
    cultural_significance: Optional[str] = None
    age_appropriate: List[str] = Field(default_factory=list)  # age groups
    confidence_score: float = Field(default=1.0)

class TranscriptSegment(BaseModel):
    segment_id: str
    original_text: str
    timestamp_start: float
    timestamp_end: float
    concepts_identified: List[str] = Field(default_factory=list)
    localized_text: Optional[str] = None
    cultural_mappings: Dict[str, str] = Field(default_factory=dict)

class VideoTranscript(BaseModel):
    video_id: str
    title: str
    subject: str
    original_language: LanguageCode = LanguageCode.ENGLISH
    segments: List[TranscriptSegment]
    metadata: Dict[str, Any] = Field(default_factory=dict)

class PersonalizationRequest(BaseModel):
    student_id: str
    video_id: str
    transcript: VideoTranscript
    target_language: LanguageCode
    regional_context: RegionalContext
    additional_context: Optional[Dict[str, Any]] = None

class PersonalizationResponse(BaseModel):
    video_id: str
    student_id: str
    localized_transcript: VideoTranscript
    cultural_adaptations: List[Dict[str, str]]
    new_concepts_learned: List[str]
    confidence_scores: Dict[str, float]
    processing_time: float
    timestamp: datetime = Field(default_factory=datetime.now)

class LearningInteraction(BaseModel):
    interaction_id: str
    student_id: str
    video_id: str
    concepts_encountered: List[str]
    concepts_understood: List[str]
    feedback_rating: Optional[int] = None  # 1-5 scale
    time_spent: Optional[float] = None  # in seconds
    completion_rate: Optional[float] = None  # 0.0-1.0
    timestamp: datetime = Field(default_factory=datetime.now)