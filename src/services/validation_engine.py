import re
import json
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from loguru import logger

from ..models.data_models import LanguageCode, RegionalContext
from ..config.settings import Config

# Download NLTK data if not present
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

@dataclass
class ValidationResult:
    """Result of validation checks"""
    semantic_similarity: float
    scientific_fidelity: float
    cultural_relevance: float
    pedagogical_clarity: float
    overall_score: float
    passes_threshold: bool
    issues: List[str]
    suggestions: List[str]

class STEMLocalizationValidator:
    """
    Comprehensive validation engine for STEM content localization.
    Ensures scientific accuracy, semantic equivalence, cultural appropriateness,
    and pedagogical clarity in adapted content.
    """
    
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Scientific terms that must be preserved
        self.scientific_terms = {
            'physics': ['force', 'energy', 'momentum', 'velocity', 'acceleration', 'mass', 'weight', 
                       'newton', 'joule', 'watt', 'gravity', 'friction', 'pressure', 'density'],
            'chemistry': ['atom', 'molecule', 'element', 'compound', 'reaction', 'catalyst', 
                         'oxidation', 'reduction', 'ph', 'acid', 'base', 'ion', 'bond'],
            'mathematics': ['equation', 'function', 'variable', 'constant', 'derivative', 'integral',
                           'probability', 'statistics', 'geometry', 'algebra', 'theorem'],
            'biology': ['cell', 'organism', 'dna', 'protein', 'enzyme', 'photosynthesis', 
                       'respiration', 'evolution', 'genetics', 'chromosome']
        }
        
        # Cultural appropriateness keywords
        self.cultural_indicators = {
            'positive': ['traditional', 'local', 'familiar', 'regional', 'cultural', 'indigenous'],
            'negative': ['foreign', 'unknown', 'unfamiliar', 'western', 'alien']
        }
        
        logger.info("STEM Localization Validator initialized")
    
    def validate_localization(
        self,
        original_text: str,
        localized_text: str,
        subject: str,
        language: LanguageCode,
        regional_context: RegionalContext,
        student_age_group: str
    ) -> ValidationResult:
        """
        Comprehensive validation of localized STEM content
        
        Args:
            original_text: Original English text
            localized_text: Culturally adapted text
            subject: STEM subject (physics, chemistry, mathematics, biology)
            language: Target language
            regional_context: Regional context for cultural validation
            student_age_group: Age group for pedagogical validation
            
        Returns:
            ValidationResult with scores and recommendations
        """
        
        issues = []
        suggestions = []
        
        # 1. Semantic Similarity Check
        semantic_score = self._check_semantic_similarity(original_text, localized_text)
        if semantic_score < Config.SEMANTIC_SIMILARITY_THRESHOLD:
            issues.append(f"Semantic similarity too low: {semantic_score:.2f}")
            suggestions.append("Ensure core concepts are preserved in adaptation")
        
        # 2. Scientific Fidelity Check
        fidelity_score = self._check_scientific_fidelity(original_text, localized_text, subject)
        if fidelity_score < Config.SCIENTIFIC_FIDELITY_THRESHOLD:
            issues.append(f"Scientific fidelity compromised: {fidelity_score:.2f}")
            suggestions.append("Verify scientific terms and relationships are maintained")
        
        # 3. Cultural Relevance Check
        cultural_score = self._check_cultural_relevance(localized_text, regional_context)
        if cultural_score < Config.CULTURAL_RELEVANCE_THRESHOLD:
            issues.append(f"Cultural relevance insufficient: {cultural_score:.2f}")
            suggestions.append("Include more region-specific examples and analogies")
        
        # 4. Pedagogical Clarity Check
        clarity_score = self._check_pedagogical_clarity(localized_text, student_age_group)
        if clarity_score < Config.PEDAGOGICAL_CLARITY_THRESHOLD:
            issues.append(f"Pedagogical clarity below threshold: {clarity_score:.2f}")
            suggestions.append("Simplify language for target age group")
        
        # Calculate overall score (weighted average)
        weights = {
            'semantic': 0.3,
            'scientific': 0.35,
            'cultural': 0.20,
            'pedagogical': 0.15
        }
        
        overall_score = (
            semantic_score * weights['semantic'] +
            fidelity_score * weights['scientific'] +
            cultural_score * weights['cultural'] +
            clarity_score * weights['pedagogical']
        )
        
        # Check if all thresholds are met
        passes_threshold = all([
            semantic_score >= Config.SEMANTIC_SIMILARITY_THRESHOLD,
            fidelity_score >= Config.SCIENTIFIC_FIDELITY_THRESHOLD,
            cultural_score >= Config.CULTURAL_RELEVANCE_THRESHOLD,
            clarity_score >= Config.PEDAGOGICAL_CLARITY_THRESHOLD
        ])
        
        return ValidationResult(
            semantic_similarity=semantic_score,
            scientific_fidelity=fidelity_score,
            cultural_relevance=cultural_score,
            pedagogical_clarity=clarity_score,
            overall_score=overall_score,
            passes_threshold=passes_threshold,
            issues=issues,
            suggestions=suggestions
        )
    
    def _check_semantic_similarity(self, original: str, localized: str) -> float:
        """Check semantic similarity using TF-IDF and cosine similarity"""
        try:
            # Handle empty or very short texts
            if len(original.strip()) < 10 or len(localized.strip()) < 10:
                return 0.5
            
            # Create TF-IDF vectors
            texts = [original.lower(), localized.lower()]
            tfidf_matrix = self.vectorizer.fit_transform(texts)
            
            # Calculate cosine similarity
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            
            return float(similarity)
            
        except Exception as e:
            logger.warning(f"Semantic similarity calculation failed: {e}")
            return 0.5
    
    def _check_scientific_fidelity(self, original: str, localized: str, subject: str) -> float:
        """Ensure scientific terms and relationships are preserved"""
        try:
            subject_terms = self.scientific_terms.get(subject.lower(), [])
            if not subject_terms:
                return 0.8  # Default score for unknown subjects
            
            original_lower = original.lower()
            localized_lower = localized.lower()
            
            # Check for presence of key scientific terms or their equivalents
            scientific_concepts_found = 0
            total_scientific_concepts = 0
            
            for term in subject_terms:
                if term in original_lower:
                    total_scientific_concepts += 1
                    # Check if the concept is preserved (term itself or related concepts)
                    if (term in localized_lower or 
                        self._has_scientific_equivalent(term, localized_lower)):
                        scientific_concepts_found += 1
            
            if total_scientific_concepts == 0:
                return 0.9  # No scientific terms to preserve
            
            # Check for mathematical relationships preservation
            math_preservation = self._check_mathematical_relationships(original, localized)
            
            # Check for causal relationships preservation
            causal_preservation = self._check_causal_relationships(original, localized)
            
            # Weighted score
            concept_score = scientific_concepts_found / total_scientific_concepts
            fidelity_score = (concept_score * 0.5 + math_preservation * 0.3 + causal_preservation * 0.2)
            
            return min(fidelity_score, 1.0)
            
        except Exception as e:
            logger.warning(f"Scientific fidelity check failed: {e}")
            return 0.6
    
    def _has_scientific_equivalent(self, term: str, text: str) -> bool:
        """Check if scientific concept has equivalent representation"""
        # This is a simplified check - in production, you'd use more sophisticated mapping
        equivalents = {
            'force': ['bal', 'shakti', 'force'],
            'energy': ['urja', 'shakti', 'energy'],
            'motion': ['gati', 'harakat', 'motion'],
            'gravity': ['gurutvakarshan', 'gravity'],
            'acceleration': ['tvaran', 'acceleration']
        }
        
        term_equivalents = equivalents.get(term, [term])
        return any(equiv in text for equiv in term_equivalents)
    
    def _check_mathematical_relationships(self, original: str, localized: str) -> float:
        """Check if mathematical relationships are preserved"""
        # Look for mathematical operators and relationships
        math_patterns = [
            r'\d+\s*[\+\-\*\/\=]\s*\d+',  # Basic operations
            r'[Ff]ormula|[Ee]quation',     # Formula references
            r'[Pp]roportional|[Rr]atio',   # Proportional relationships
            r'[Ii]nversely|[Dd]irectly',   # Direct/inverse relationships
        ]
        
        original_math_count = sum(len(re.findall(pattern, original)) for pattern in math_patterns)
        localized_math_count = sum(len(re.findall(pattern, localized)) for pattern in math_patterns)
        
        if original_math_count == 0:
            return 1.0  # No math to preserve
        
        # Score based on preservation ratio
        preservation_ratio = min(localized_math_count / original_math_count, 1.0)
        return preservation_ratio
    
    def _check_causal_relationships(self, original: str, localized: str) -> float:
        """Check if causal relationships are preserved"""
        causal_indicators = [
            r'because|since|due to|as a result|therefore|thus|consequently',
            r'causes?|results? in|leads to|produces?|creates?',
            r'if.*then|when.*occurs?',
        ]
        
        original_causal = sum(len(re.findall(pattern, original, re.IGNORECASE)) 
                            for pattern in causal_indicators)
        localized_causal = sum(len(re.findall(pattern, localized, re.IGNORECASE)) 
                             for pattern in causal_indicators)
        
        if original_causal == 0:
            return 1.0  # No causal relationships to preserve
        
        # Score based on preservation ratio
        preservation_ratio = min(localized_causal / original_causal, 1.0)
        return preservation_ratio
    
    def _check_cultural_relevance(self, localized_text: str, regional_context: RegionalContext) -> float:
        """Check cultural appropriateness and relevance"""
        try:
            text_lower = localized_text.lower()
            
            # Regional context mappings
            regional_keywords = {
                RegionalContext.NORTH_INDIA: ['gilli', 'danda', 'roti', 'chapati', 'kabaddi', 'punjab', 'delhi', 'up'],
                RegionalContext.SOUTH_INDIA: ['lagori', 'idli', 'dosa', 'kolam', 'rangoli', 'tamil', 'kerala', 'karnataka'],
                RegionalContext.WEST_INDIA: ['garba', 'dandiya', 'gujarat', 'maharashtra', 'mumbai'],
                RegionalContext.EAST_INDIA: ['durga', 'puja', 'bengal', 'kolkata', 'fish'],
                RegionalContext.NORTHEAST_INDIA: ['bamboo', 'tribal', 'assam', 'manipur'],
                RegionalContext.CENTRAL_INDIA: ['madhya', 'pradesh', 'chhattisgarh', 'tribal']
            }
            
            relevant_keywords = regional_keywords.get(regional_context, [])
            
            # Count cultural relevance indicators
            cultural_score = 0.0
            
            # Check for positive cultural indicators
            positive_matches = sum(1 for word in self.cultural_indicators['positive'] 
                                 if word in text_lower)
            
            # Check for regional-specific terms
            regional_matches = sum(1 for keyword in relevant_keywords 
                                 if keyword in text_lower)
            
            # Check for negative indicators (reduce score)
            negative_matches = sum(1 for word in self.cultural_indicators['negative'] 
                                 if word in text_lower)
            
            # Calculate score
            base_score = 0.7  # Base cultural relevance
            positive_boost = min(positive_matches * 0.1, 0.2)
            regional_boost = min(regional_matches * 0.15, 0.3)
            negative_penalty = min(negative_matches * 0.1, 0.3)
            
            cultural_score = base_score + positive_boost + regional_boost - negative_penalty
            
            return min(max(cultural_score, 0.0), 1.0)
            
        except Exception as e:
            logger.warning(f"Cultural relevance check failed: {e}")
            return 0.7
    
    def _check_pedagogical_clarity(self, localized_text: str, age_group: str) -> float:
        """Check if content is appropriate for the target age group"""
        try:
            # Age-appropriate vocabulary complexity
            age_complexity = {
                '10-12': {'max_syllables': 3, 'max_sentence_length': 15, 'complex_words_threshold': 0.1},
                '13-15': {'max_syllables': 4, 'max_sentence_length': 20, 'complex_words_threshold': 0.15},
                '16-18': {'max_syllables': 5, 'max_sentence_length': 25, 'complex_words_threshold': 0.2}
            }
            
            complexity_rules = age_complexity.get(age_group, age_complexity['13-15'])
            
            # Tokenize sentences and words
            sentences = sent_tokenize(localized_text)
            words = word_tokenize(localized_text.lower())
            
            # Calculate metrics
            avg_sentence_length = np.mean([len(word_tokenize(sent)) for sent in sentences])
            
            # Syllable counting (simplified)
            def count_syllables(word):
                word = word.lower().strip()
                if len(word) <= 3:
                    return 1
                vowels = 'aeiouy'
                count = sum(1 for char in word if char in vowels)
                if word.endswith('e'):
                    count -= 1
                return max(count, 1)
            
            avg_syllables = np.mean([count_syllables(word) for word in words if word.isalpha()])
            
            # Complex words (more than threshold syllables)
            complex_words = [word for word in words 
                           if word.isalpha() and count_syllables(word) > complexity_rules['max_syllables']]
            complex_word_ratio = len(complex_words) / len(words) if words else 0
            
            # Calculate clarity score
            sentence_score = 1.0 if avg_sentence_length <= complexity_rules['max_sentence_length'] else \
                           max(0.5, 1.0 - (avg_sentence_length - complexity_rules['max_sentence_length']) / 10)
            
            syllable_score = 1.0 if avg_syllables <= complexity_rules['max_syllables'] else \
                           max(0.5, 1.0 - (avg_syllables - complexity_rules['max_syllables']) / 2)
            
            complexity_score = 1.0 if complex_word_ratio <= complexity_rules['complex_words_threshold'] else \
                             max(0.5, 1.0 - (complex_word_ratio - complexity_rules['complex_words_threshold']) / 0.1)
            
            # Weighted average
            clarity_score = (sentence_score * 0.4 + syllable_score * 0.3 + complexity_score * 0.3)
            
            return min(max(clarity_score, 0.0), 1.0)
            
        except Exception as e:
            logger.warning(f"Pedagogical clarity check failed: {e}")
            return 0.75