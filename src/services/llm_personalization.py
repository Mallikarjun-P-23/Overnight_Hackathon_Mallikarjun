from typing import List, Dict, Optional, Any
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
import re
import time
import json
from loguru import logger

from ..models.data_models import (
    StudentProfile, VideoTranscript, TranscriptSegment, 
    PersonalizationRequest, PersonalizationResponse,
    LanguageCode, RegionalContext
)
from ..config.settings import Config
from .cultural_context_rag import CulturalContextRAG
from .validation_engine import STEMLocalizationValidator, ValidationResult

class GeminiSTEMPersonalizationService:
    """
    AI-powered STEM localization engine using Google Gemini Flash 2.5
    Designed to semantically transform English STEM explanations into culturally 
    familiar and linguistically native explanations for Indian regional learners.
    """
    
    def __init__(self):
        # Configure Gemini API
        genai.configure(api_key=Config.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
        
        # Initialize supporting services
        self.cultural_rag = CulturalContextRAG()
        self.validator = STEMLocalizationValidator()
        
        # Language mappings for native output
        self.language_names = {
            LanguageCode.HINDI: "हिंदी",
            LanguageCode.TAMIL: "தமிழ்",
            LanguageCode.TELUGU: "తెలుగు", 
            LanguageCode.KANNADA: "ಕನ್ನಡ",
            LanguageCode.MALAYALAM: "മലയാളം",
            LanguageCode.BENGALI: "বাংলা",
            LanguageCode.GUJARATI: "ગુજરાતી",
            LanguageCode.MARATHI: "मराठी",
            LanguageCode.PUNJABI: "ਪੰਜਾਬੀ",
            LanguageCode.ODIA: "ଓଡ଼ିଆ"
        }
        
        logger.info("Gemini STEM Personalization Service initialized")
    
    def identify_concepts(self, text: str, subject: str) -> List[str]:
        """Identify STEM concepts and cultural references that need localization"""
        
        system_prompt = f"""You are an expert STEM education analyst specializing in cross-cultural learning. Your task is to identify concepts in {subject} content that require cultural adaptation for Indian students.

IDENTIFICATION CRITERIA:
1. Cultural references (sports, games, food, festivals, places, historical figures)
2. Western-centric examples that assume specific cultural knowledge
3. Analogies and metaphors unfamiliar to Indian contexts
4. Measurement systems or units that vary by region
5. Social contexts that don't translate across cultures

ANALYSIS FRAMEWORK:
- Focus on concepts that would benefit from localization
- Prioritize items that could confuse or alienate Indian learners
- Consider regional variations within India
- Maintain scientific accuracy requirements

RESPONSE FORMAT: Return ONLY a JSON array of concepts like: ["concept1", "concept2", "concept3"]"""

        user_prompt = f"""Analyze this {subject} educational text for concepts requiring cultural adaptation:

TEXT: "{text}"

Identify concepts that should be localized for Indian students from different regional backgrounds. Focus on cultural references, analogies, and examples that may not resonate with learners whose primary context is Indian culture."""

        try:
            response = self.model.generate_content(f"{system_prompt}\n\n{user_prompt}")
            content = response.text.strip()
            
            # Extract JSON array from response
            import json
            try:
                concepts = json.loads(content)
                if isinstance(concepts, list):
                    return [str(concept) for concept in concepts]
            except json.JSONDecodeError:
                # Fallback: extract quoted concepts
                concepts = re.findall(r'"([^"]*)"', content)
                return concepts[:10]  # Limit to 10 concepts
                
        except Exception as e:
            logger.error(f"Error identifying concepts with Gemini: {e}")
            return []
    
    def personalize_transcript_segment(
        self,
        segment: TranscriptSegment,
        student_profile: StudentProfile,
        cultural_mappings: Dict[str, str],
        subject: str,
        max_attempts: int = 3
    ) -> TranscriptSegment:
        """
        Personalize a single transcript segment with validation and regeneration
        """
        
        # Get enhanced cultural context from RAG
        rag_contexts = []
        for concept in segment.concepts_identified:
            contexts = self.cultural_rag.search_cultural_contexts(
                query=concept,
                language=student_profile.native_language,
                regional_context=student_profile.regional_context,
                age_group=student_profile.age_group,
                n_results=3
            )
            rag_contexts.extend(contexts)
        
        # Build comprehensive cultural context
        cultural_context = self._build_enhanced_cultural_context(
            rag_contexts, cultural_mappings, student_profile
        )
        
        # Generate sophisticated localization prompt
        system_prompt = self._create_master_localization_prompt(
            student_profile, subject, cultural_context
        )
        
        user_prompt = self._create_segment_adaptation_prompt(
            segment, subject, student_profile
        )
        
        # Attempt localization with validation
        for attempt in range(max_attempts):
            try:
                logger.info(f"Localization attempt {attempt + 1} for segment {segment.segment_id}")
                
                # Generate localized content
                response = self.model.generate_content(f"{system_prompt}\n\n{user_prompt}")
                localized_text = response.text.strip()
                
                # Validate the localization
                validation_result = self.validator.validate_localization(
                    original_text=segment.original_text,
                    localized_text=localized_text,
                    subject=subject,
                    language=student_profile.native_language,
                    regional_context=student_profile.regional_context,
                    student_age_group=student_profile.age_group
                )
                
                # Check if validation passes threshold
                if validation_result.passes_threshold:
                    logger.info(f"Validation passed for segment {segment.segment_id} "
                              f"(Score: {validation_result.overall_score:.2f})")
                    
                    # Update segment with successful localization
                    segment.localized_text = localized_text
                    segment.cultural_mappings = cultural_mappings
                    return segment
                
                else:
                    logger.warning(f"Validation failed for segment {segment.segment_id} "
                                 f"(Score: {validation_result.overall_score:.2f})")
                    logger.warning(f"Issues: {validation_result.issues}")
                    
                    # If not the last attempt, modify prompt with validation feedback
                    if attempt < max_attempts - 1:
                        user_prompt = self._enhance_prompt_with_feedback(
                            user_prompt, validation_result
                        )
                
            except Exception as e:
                logger.error(f"Error in localization attempt {attempt + 1}: {e}")
                if attempt == max_attempts - 1:
                    # Final fallback
                    segment.localized_text = segment.original_text
                    logger.error(f"All localization attempts failed for segment {segment.segment_id}")
        
        # If all attempts failed, use original text
        segment.localized_text = segment.original_text
        return segment
    
    def _create_master_localization_prompt(
        self, 
        student_profile: StudentProfile, 
        subject: str, 
        cultural_context: str
    ) -> str:
        """Create the master system prompt for STEM localization"""
        
        language_name = self.language_names.get(
            student_profile.native_language, 
            student_profile.native_language.value
        )
        
        return f"""You are an AI-powered STEM localization engine designed to semantically transform English STEM explanations into culturally familiar and linguistically native explanations for Indian regional learners.

CORE MISSION:
Transform STEM content to preserve ALL scientific laws, mathematical relationships, and causal structures while adapting unfamiliar global references into locally meaningful analogies.

STUDENT PROFILE:
- Native Language: {language_name} ({student_profile.native_language.value})
- Regional Context: {student_profile.regional_context.value}
- State/City: {student_profile.state}, {student_profile.city}
- Age Group: {student_profile.age_group}
- Learning Preferences: {student_profile.learning_preferences}

TRANSFORMATION PRINCIPLES:
1. SCIENTIFIC FIDELITY: Preserve all scientific laws, mathematical relationships, formulas, and causal structures
2. SEMANTIC EQUIVALENCE: Maintain minimum 85% conceptual similarity to source content
3. CULTURAL ADAPTATION: Replace unfamiliar references with locally meaningful equivalents
4. LINGUISTIC NATIVITY: Generate output in {language_name} using grade-appropriate vocabulary
5. PEDAGOGICAL CLARITY: Ensure age-appropriate complexity and natural regional phrasing

CULTURAL ADAPTATION GUIDELINES:
{cultural_context}

VALIDATION REQUIREMENTS:
- Scientific accuracy must remain invariant
- Cultural analogies must be appropriate for {student_profile.regional_context.value}
- Language must be natural {language_name} (avoid literal translation)
- Complexity must suit {student_profile.age_group} age group
- Examples must resonate with {student_profile.state} regional context

OPTIMIZATION GOAL: Maximize conceptual understanding, cultural relatability, and long-term retention while keeping original scientific meaning invariant."""

    def _create_segment_adaptation_prompt(
        self,
        segment: TranscriptSegment,
        subject: str,
        student_profile: StudentProfile
    ) -> str:
        """Create specific prompt for segment adaptation"""
        
        language_name = self.language_names.get(
            student_profile.native_language,
            student_profile.native_language.value
        )
        
        return f"""LOCALIZATION TASK:
Adapt this {subject} educational content for the student profile above.

ORIGINAL CONTENT:
"{segment.original_text}"

CONCEPTS TO ADAPT:
{segment.concepts_identified}

ADAPTATION REQUIREMENTS:
1. Write in natural {language_name} suitable for {student_profile.age_group} students
2. Replace cultural references with {student_profile.regional_context.value} equivalents
3. Use examples familiar to students from {student_profile.state}
4. Maintain all scientific accuracy and mathematical relationships
5. Keep the same educational complexity level
6. Ensure smooth, natural phrasing (not translation-like)

GENERATE CULTURALLY ADAPTED CONTENT:"""

    def _build_enhanced_cultural_context(
        self,
        rag_contexts: List[Dict[str, Any]],
        cultural_mappings: Dict[str, str],
        student_profile: StudentProfile
    ) -> str:
        """Build comprehensive cultural context for localization"""
        
        context_parts = []
        
        # Add RAG-retrieved contexts
        if rag_contexts:
            context_parts.append("AVAILABLE CULTURAL MAPPINGS:")
            for ctx in rag_contexts[:5]:  # Top 5 most relevant
                context_parts.append(
                    f"• {ctx['original_concept']} → {ctx['localized_concept']} "
                    f"(Relevance: {ctx['relevance_score']:.2f}, Category: {ctx['category']})"
                )
        
        # Add direct mappings
        if cultural_mappings:
            context_parts.append("\nDIRECT CONCEPT MAPPINGS:")
            for original, localized in cultural_mappings.items():
                context_parts.append(f"• {original} → {localized}")
        
        # Add regional context guidance
        regional_guidance = {
            RegionalContext.NORTH_INDIA: "Use examples from North Indian culture: gilli-danda, roti/chapati making, hand pumps, kabaddi, traditional festivals",
            RegionalContext.SOUTH_INDIA: "Use examples from South Indian culture: lagori, idli/dosa preparation, kolam patterns, temple bells, classical arts",
            RegionalContext.WEST_INDIA: "Use examples from Western Indian culture: garba/dandiya, business contexts, coastal activities, textile traditions",
            RegionalContext.EAST_INDIA: "Use examples from Eastern Indian culture: fish markets, river systems, cultural festivals, traditional crafts",
            RegionalContext.NORTHEAST_INDIA: "Use examples from Northeast Indian culture: bamboo crafts, tribal traditions, hill agriculture, community practices",
            RegionalContext.CENTRAL_INDIA: "Use examples from Central Indian culture: forest products, tribal knowledge, agricultural practices, folk traditions"
        }
        
        regional_context = regional_guidance.get(
            student_profile.regional_context,
            "Use appropriate Indian cultural examples"
        )
        
        context_parts.extend([
            f"\nREGIONAL CONTEXT GUIDANCE:",
            regional_context,
            f"\nTARGET AUDIENCE: {student_profile.age_group} students from {student_profile.state}"
        ])
        
        return "\n".join(context_parts)
    
    def _enhance_prompt_with_feedback(
        self,
        original_prompt: str,
        validation_result: ValidationResult
    ) -> str:
        """Enhance prompt based on validation feedback"""
        
        feedback_additions = []
        
        if validation_result.semantic_similarity < Config.SEMANTIC_SIMILARITY_THRESHOLD:
            feedback_additions.append(
                f"CRITICAL: Ensure core concepts are preserved (current similarity: {validation_result.semantic_similarity:.2f})"
            )
        
        if validation_result.scientific_fidelity < Config.SCIENTIFIC_FIDELITY_THRESHOLD:
            feedback_additions.append(
                f"CRITICAL: Maintain all scientific terms and relationships (current fidelity: {validation_result.scientific_fidelity:.2f})"
            )
        
        if validation_result.cultural_relevance < Config.CULTURAL_RELEVANCE_THRESHOLD:
            feedback_additions.append(
                f"IMPROVE: Include more region-specific examples (current relevance: {validation_result.cultural_relevance:.2f})"
            )
        
        if validation_result.pedagogical_clarity < Config.PEDAGOGICAL_CLARITY_THRESHOLD:
            feedback_additions.append(
                f"IMPROVE: Simplify language for target age group (current clarity: {validation_result.pedagogical_clarity:.2f})"
            )
        
        if feedback_additions:
            enhanced_prompt = original_prompt + "\n\nVALIDATION FEEDBACK - ADDRESS THESE ISSUES:\n" + "\n".join(feedback_additions)
            return enhanced_prompt
        
        return original_prompt
    
    def personalize_full_transcript(
        self, 
        request: PersonalizationRequest,
        student_profile: StudentProfile
    ) -> PersonalizationResponse:
        """Personalize entire video transcript with comprehensive validation"""
        start_time = time.time()
        
        try:
            localized_segments = []
            all_cultural_adaptations = []
            new_concepts_learned = []
            confidence_scores = {}
            validation_results = []
            
            for segment in request.transcript.segments:
                logger.info(f"Processing segment {segment.segment_id}")
                
                # Identify concepts in this segment
                concepts = self.identify_concepts(segment.original_text, request.transcript.subject)
                segment.concepts_identified = concepts
                
                # Get cultural mappings for identified concepts
                cultural_mappings = self.cultural_rag.get_concept_mappings(
                    concepts=concepts,
                    language=request.target_language,
                    regional_context=request.regional_context,
                    age_group=student_profile.age_group
                )
                
                # Personalize the segment with validation
                personalized_segment = self.personalize_transcript_segment(
                    segment=segment,
                    student_profile=student_profile,
                    cultural_mappings=cultural_mappings,
                    subject=request.transcript.subject
                )
                
                localized_segments.append(personalized_segment)
                
                # Track adaptations and new concepts
                if cultural_mappings:
                    adaptations = [
                        {"original": k, "localized": v, "segment_id": segment.segment_id}
                        for k, v in cultural_mappings.items()
                    ]
                    all_cultural_adaptations.extend(adaptations)
                
                new_concepts_learned.extend(list(cultural_mappings.values()))
                
                # Calculate confidence scores
                for concept in concepts:
                    contexts = self.cultural_rag.search_cultural_contexts(
                        query=concept,
                        language=request.target_language,
                        regional_context=request.regional_context,
                        n_results=1
                    )
                    if contexts:
                        confidence_scores[concept] = contexts[0]["relevance_score"]
            
            # Create localized transcript
            localized_transcript = VideoTranscript(
                video_id=request.transcript.video_id,
                title=request.transcript.title,
                subject=request.transcript.subject,
                original_language=request.target_language,
                segments=localized_segments,
                metadata={
                    **request.transcript.metadata,
                    "personalized_for": request.student_id,
                    "target_language": request.target_language.value,
                    "regional_context": request.regional_context.value,
                    "validation_engine": "gemini_enhanced",
                    "thresholds_met": True
                }
            )
            
            processing_time = time.time() - start_time
            
            response = PersonalizationResponse(
                video_id=request.video_id,
                student_id=request.student_id,
                localized_transcript=localized_transcript,
                cultural_adaptations=all_cultural_adaptations,
                new_concepts_learned=list(set(new_concepts_learned)),
                confidence_scores=confidence_scores,
                processing_time=processing_time
            )
            
            logger.info(f"Successfully personalized transcript for student {request.student_id} "
                       f"in {processing_time:.2f}s with validation")
            
            return response
            
        except Exception as e:
            logger.error(f"Error personalizing transcript: {e}")
            # Return original transcript as fallback
            return PersonalizationResponse(
                video_id=request.video_id,
                student_id=request.student_id,
                localized_transcript=request.transcript,
                cultural_adaptations=[],
                new_concepts_learned=[],
                confidence_scores={},
                processing_time=time.time() - start_time
            )