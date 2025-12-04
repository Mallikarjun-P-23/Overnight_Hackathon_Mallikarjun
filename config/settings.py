import os
from typing import List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

class Config:
    # LLM Configuration - Google Gemini Flash 2.5
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    
    # Validation Thresholds
    SEMANTIC_SIMILARITY_THRESHOLD: float = float(os.getenv("SEMANTIC_SIMILARITY_THRESHOLD", "0.85"))
    SCIENTIFIC_FIDELITY_THRESHOLD: float = float(os.getenv("SCIENTIFIC_FIDELITY_THRESHOLD", "0.90"))
    CULTURAL_RELEVANCE_THRESHOLD: float = float(os.getenv("CULTURAL_RELEVANCE_THRESHOLD", "0.80"))
    PEDAGOGICAL_CLARITY_THRESHOLD: float = float(os.getenv("PEDAGOGICAL_CLARITY_THRESHOLD", "0.85"))
    
    # Vector Database Configuration
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./data/chroma_db")
    COLLECTION_NAME: str = os.getenv("COLLECTION_NAME", "cultural_contexts")
    
    # Database Configuration
    CONTEXTS_DB_PATH: str = os.getenv("CONTEXTS_DB_PATH", "./data/contexts.db")
    STUDENT_PROFILES_DB_PATH: str = os.getenv("STUDENT_PROFILES_DB_PATH", "./data/student_profiles.db")
    
    # Language Support
    SUPPORTED_LANGUAGES: List[str] = os.getenv("SUPPORTED_LANGUAGES", "hindi,tamil,telugu,kannada,malayalam,bengali,gujarati,marathi,punjabi,odia").split(",")
    DEFAULT_LANGUAGE: str = os.getenv("DEFAULT_LANGUAGE", "hindi")
    
    # Cultural Context Categories
    CONTEXT_CATEGORIES: List[str] = os.getenv("CONTEXT_CATEGORIES", "games,sports,food,festivals,geography,history,mathematics,science").split(",")
    
    # API Configuration
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "./logs/personalization.log")
    
    @classmethod
    def ensure_directories(cls):
        """Create necessary directories if they don't exist"""
        directories = [
            Path(cls.CHROMA_DB_PATH).parent,
            Path(cls.CONTEXTS_DB_PATH).parent,
            Path(cls.STUDENT_PROFILES_DB_PATH).parent,
            Path(cls.LOG_FILE).parent,
        ]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def validate_config(cls) -> Dict[str, Any]:
        """Validate configuration and return status"""
        issues = []
        
        if not cls.GEMINI_API_KEY:
            issues.append("GEMINI_API_KEY is not set")
        
        if not all(lang in ["hindi", "tamil", "telugu", "kannada", "malayalam", "bengali", "gujarati", "marathi", "punjabi", "odia"] for lang in cls.SUPPORTED_LANGUAGES):
            issues.append("Invalid language codes in SUPPORTED_LANGUAGES")
        
        # Validate thresholds
        if not (0.0 <= cls.SEMANTIC_SIMILARITY_THRESHOLD <= 1.0):
            issues.append("SEMANTIC_SIMILARITY_THRESHOLD must be between 0.0 and 1.0")
        
        if not (0.0 <= cls.SCIENTIFIC_FIDELITY_THRESHOLD <= 1.0):
            issues.append("SCIENTIFIC_FIDELITY_THRESHOLD must be between 0.0 and 1.0")
        
        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "config": {
                "model": cls.GEMINI_MODEL,
                "supported_languages": cls.SUPPORTED_LANGUAGES,
                "context_categories": cls.CONTEXT_CATEGORIES,
                "debug_mode": cls.DEBUG,
                "validation_thresholds": {
                    "semantic_similarity": cls.SEMANTIC_SIMILARITY_THRESHOLD,
                    "scientific_fidelity": cls.SCIENTIFIC_FIDELITY_THRESHOLD,
                    "cultural_relevance": cls.CULTURAL_RELEVANCE_THRESHOLD,
                    "pedagogical_clarity": cls.PEDAGOGICAL_CLARITY_THRESHOLD
                }
            }
        }

# Initialize configuration on import
Config.ensure_directories()