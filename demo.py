#!/usr/bin/env python3
"""
STEM Video Personalization Pipeline Demo - Gemini Flash 2.5 Enhanced

This script demonstrates the complete workflow for culturally adaptive STEM video localization:
1. Initialize the cultural context database
2. Create sample student profiles
3. Process video transcripts with Gemini LLM personalization
4. Validate adaptations with comprehensive quality checks
5. Generate detailed validation reports and analytics
"""

import uuid
import asyncio
from datetime import datetime
from loguru import logger
from pathlib import Path

# Import all our services and models
from src.models.data_models import (
    StudentProfile, VideoTranscript, PersonalizationRequest,
    LanguageCode, RegionalContext, LearningInteraction
)
from src.services.cultural_context_rag import CulturalContextRAG
from src.services.llm_personalization import GeminiSTEMPersonalizationService
from src.services.student_service import StudentProfileService
from src.services.validation_engine import STEMLocalizationValidator
from src.data.initialize_data import initialize_cultural_database
from src.utils.transcript_utils import create_mock_transcript, calculate_adaptation_metrics
from src.config.settings import Config

def setup_logging():
    """Setup logging configuration"""
    logger.add("logs/gemini_demo.log", rotation="1 day", retention="7 days", level="INFO")
    logger.info("Starting Enhanced STEM Video Personalization Demo with Gemini Flash 2.5")

def create_sample_students() -> list[StudentProfile]:
    """Create sample student profiles for different regions and languages"""
    students = [
        StudentProfile(
            student_id="student_001",
            name="Arjun Kumar",
            native_language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            state="Uttar Pradesh",
            city="Lucknow",
            age_group="13-15",
            learning_preferences={
                "preferred_pace": "medium",
                "visual_learner": True,
                "interactive_content": True,
                "cultural_examples": True
            }
        ),
        StudentProfile(
            student_id="student_002",
            name="Priya Nair",
            native_language=LanguageCode.TAMIL,
            regional_context=RegionalContext.SOUTH_INDIA,
            state="Tamil Nadu",
            city="Chennai",
            age_group="16-18",
            learning_preferences={
                "preferred_pace": "fast",
                "analytical_approach": True,
                "detailed_explanations": True,
                "traditional_examples": True
            }
        ),
        StudentProfile(
            student_id="student_003",
            name="Rahul Sharma",
            native_language=LanguageCode.KANNADA,
            regional_context=RegionalContext.SOUTH_INDIA,
            state="Karnataka",
            city="Bangalore",
            age_group="10-12",
            learning_preferences={
                "preferred_pace": "slow",
                "game_based_learning": True,
                "simple_analogies": True,
                "local_examples": True
            }
        )
    ]
    return students

def create_enhanced_mock_transcript() -> VideoTranscript:
    """Create a more comprehensive mock transcript for testing cultural adaptation"""
    from src.models.data_models import TranscriptSegment
    
    segments = [
        TranscriptSegment(
            segment_id="physics_forces_seg_1",
            original_text="Today we'll learn about forces in physics. Imagine you're playing baseball - when you swing the bat, you apply force to hit the ball.",
            timestamp_start=0.0,
            timestamp_end=5.5
        ),
        TranscriptSegment(
            segment_id="physics_forces_seg_2", 
            original_text="The harder you swing, the more force you apply, and the farther the ball travels. This demonstrates Newton's second law: F = ma.",
            timestamp_start=5.5,
            timestamp_end=12.0
        ),
        TranscriptSegment(
            segment_id="physics_forces_seg_3",
            original_text="Let's also think about levers. A baseball bat works like a lever - your hands are the fulcrum, and the bat amplifies your force.",
            timestamp_start=12.0,
            timestamp_end=18.5
        ),
        TranscriptSegment(
            segment_id="physics_forces_seg_4",
            original_text="In American football, when players collide, we see conservation of momentum. The total momentum before collision equals the total momentum after.",
            timestamp_start=18.5,
            timestamp_end=26.0
        ),
        TranscriptSegment(
            segment_id="physics_forces_seg_5",
            original_text="Think about ice skating - when you push off the wall, the wall pushes back with equal force. This is Newton's third law in action.",
            timestamp_start=26.0,
            timestamp_end=33.0
        )
    ]
    
    return VideoTranscript(
        video_id="physics_forces_enhanced_001",
        title="Understanding Forces and Motion in Physics",
        subject="Physics",
        segments=segments,
        metadata={
            "duration": 33.0,
            "language": "en",
            "created_at": datetime.now().isoformat(),
            "difficulty": "intermediate",
            "concepts": ["force", "newton's laws", "momentum", "levers"]
        }
    )

async def demonstrate_enhanced_personalization_pipeline():
    """Main demonstration with Gemini and validation engine"""
    
    print("🚀 Enhanced STEM Video Personalization with Gemini Flash 2.5")
    print("🔬 Featuring: Validation Engine, Cultural Adaptation & Quality Thresholds")
    print("=" * 80)
    
    # Step 1: Initialize services and validate configuration
    print("\n📊 Step 1: Initializing Enhanced Services...")
    
    # Check configuration
    config_status = Config.validate_config()
    if not config_status["valid"]:
        print(f"❌ Configuration issues: {config_status['issues']}")
        print("Please set up your .env file with GEMINI_API_KEY and other settings")
        return
    
    print("✅ Configuration validated")
    print(f"   • Model: {Config.GEMINI_MODEL}")
    print(f"   • Validation Thresholds:")
    print(f"     - Semantic Similarity: {Config.SEMANTIC_SIMILARITY_THRESHOLD}")
    print(f"     - Scientific Fidelity: {Config.SCIENTIFIC_FIDELITY_THRESHOLD}")
    print(f"     - Cultural Relevance: {Config.CULTURAL_RELEVANCE_THRESHOLD}")
    print(f"     - Pedagogical Clarity: {Config.PEDAGOGICAL_CLARITY_THRESHOLD}")
    
    # Initialize cultural context database
    print("\n📚 Initializing cultural context database...")
    if not initialize_cultural_database():
        print("❌ Failed to initialize cultural database")
        return
    print("✅ Cultural context database initialized")
    
    # Initialize services
    rag_service = CulturalContextRAG()
    gemini_service = GeminiSTEMPersonalizationService()
    student_service = StudentProfileService()
    validator = STEMLocalizationValidator()
    
    # Step 2: Create and store student profiles
    print("\n👥 Step 2: Creating Enhanced Student Profiles...")
    students = create_sample_students()
    
    for student in students:
        success = student_service.create_student_profile(student)
        if success:
            print(f"✅ Created profile for {student.name}")
            print(f"   • Language: {student.native_language.value}")
            print(f"   • Region: {student.regional_context.value}")
            print(f"   • Preferences: {len(student.learning_preferences)} settings")
        else:
            print(f"❌ Failed to create profile for {student.name}")
    
    # Step 3: Create enhanced video transcript
    print("\n🎥 Step 3: Processing Enhanced Video Transcript...")
    
    video_transcript = create_enhanced_mock_transcript()
    
    print(f"📝 Created enhanced transcript: '{video_transcript.title}'")
    print(f"   • {len(video_transcript.segments)} segments")
    print(f"   • Duration: {video_transcript.metadata.get('duration', 'N/A')} seconds")
    print(f"   • Concepts: {video_transcript.metadata.get('concepts', [])}")
    
    # Step 4: Enhanced personalization with validation
    print("\n🎯 Step 4: Enhanced Personalization with Validation...")
    
    results = []
    
    for student in students:
        print(f"\n🔄 Processing for {student.name} ({student.regional_context.value})...")
        
        # Create personalization request
        request = PersonalizationRequest(
            student_id=student.student_id,
            video_id=video_transcript.video_id,
            transcript=video_transcript,
            target_language=student.native_language,
            regional_context=student.regional_context
        )
        
        try:
            # Process with Gemini personalization + validation
            print(f"   🤖 Using Gemini Flash 2.5 for personalization...")
            response = gemini_service.personalize_full_transcript(request, student)
            
            # Calculate adaptation metrics
            metrics = calculate_adaptation_metrics(video_transcript, response.localized_transcript)
            
            # Get validation details for first adapted segment
            sample_validation = None
            adapted_segments = [s for s in response.localized_transcript.segments if s.localized_text and s.localized_text != s.original_text]
            if adapted_segments:
                sample_segment = adapted_segments[0]
                sample_validation = validator.validate_localization(
                    original_text=sample_segment.original_text,
                    localized_text=sample_segment.localized_text,
                    subject=video_transcript.subject,
                    language=student.native_language,
                    regional_context=student.regional_context,
                    student_age_group=student.age_group
                )
            
            results.append({
                "student": student,
                "response": response,
                "metrics": metrics,
                "validation": sample_validation
            })
            
            print(f"✅ Personalization completed in {response.processing_time:.2f}s")
            print(f"   • Cultural adaptations: {len(response.cultural_adaptations)}")
            print(f"   • New concepts: {len(response.new_concepts_learned)}")
            print(f"   • Adaptation rate: {metrics['adaptation_rate']:.1%}")
            
            if sample_validation:
                print(f"   • Validation score: {sample_validation.overall_score:.2f}")
                print(f"   • Passes thresholds: {'✅' if sample_validation.passes_threshold else '❌'}")
            
        except Exception as e:
            print(f"❌ Personalization failed: {e}")
            continue
    
    # Step 5: Detailed validation and quality report
    print("\n📋 Step 5: Comprehensive Quality & Validation Report...")
    print("=" * 80)
    
    for i, result in enumerate(results, 1):
        student = result["student"]
        response = result["response"]
        metrics = result["metrics"]
        validation = result["validation"]
        
        print(f"\n📊 Detailed Report {i}: {student.name}")
        print(f"🏠 Profile: {student.regional_context.value} | {student.native_language.value} | {student.age_group}")
        print(f"📍 Location: {student.city}, {student.state}")
        
        print(f"\n🎯 Personalization Performance:")
        print(f"   • Processing Time: {response.processing_time:.2f}s")
        print(f"   • Segments Processed: {len(response.localized_transcript.segments)}")
        print(f"   • Adaptation Rate: {metrics['adaptation_rate']:.1%}")
        print(f"   • Concepts Adapted: {metrics.get('concepts_adapted', 0)}")
        
        if validation:
            print(f"\n🔬 Validation Scores:")
            print(f"   • Semantic Similarity: {validation.semantic_similarity:.3f} {'✅' if validation.semantic_similarity >= Config.SEMANTIC_SIMILARITY_THRESHOLD else '❌'}")
            print(f"   • Scientific Fidelity: {validation.scientific_fidelity:.3f} {'✅' if validation.scientific_fidelity >= Config.SCIENTIFIC_FIDELITY_THRESHOLD else '❌'}")
            print(f"   • Cultural Relevance: {validation.cultural_relevance:.3f} {'✅' if validation.cultural_relevance >= Config.CULTURAL_RELEVANCE_THRESHOLD else '❌'}")
            print(f"   • Pedagogical Clarity: {validation.pedagogical_clarity:.3f} {'✅' if validation.pedagogical_clarity >= Config.PEDAGOGICAL_CLARITY_THRESHOLD else '❌'}")
            print(f"   • Overall Score: {validation.overall_score:.3f}")
            print(f"   • Quality Status: {'✅ PASSED' if validation.passes_threshold else '❌ FAILED - REGENERATED'}")
            
            if validation.issues:
                print(f"\n⚠️  Quality Issues Detected:")
                for issue in validation.issues:
                    print(f"   • {issue}")
            
            if validation.suggestions:
                print(f"\n💡 Improvement Suggestions:")
                for suggestion in validation.suggestions:
                    print(f"   • {suggestion}")
        
        print(f"\n🔄 Cultural Adaptations Made:")
        for adaptation in response.cultural_adaptations[:3]:  # Show first 3
            print(f"   • '{adaptation['original']}' → '{adaptation['localized']}'")
        
        if len(response.cultural_adaptations) > 3:
            print(f"   • ... and {len(response.cultural_adaptations) - 3} more adaptations")
        
        # Show sample adapted text
        adapted_segment = next((s for s in response.localized_transcript.segments 
                              if s.localized_text and s.localized_text != s.original_text), None)
        if adapted_segment:
            print(f"\n📝 Sample Cultural Adaptation:")
            print(f"   Original: '{adapted_segment.original_text[:80]}...'")
            print(f"   Adapted:  '{adapted_segment.localized_text[:80]}...'")
        
        print("-" * 60)
    
    # Step 6: System performance and quality metrics
    print(f"\n📈 Step 6: System Performance & Quality Metrics...")
    print("=" * 80)
    
    # Calculate overall system performance
    total_segments = sum(len(r["response"].localized_transcript.segments) for r in results)
    avg_processing_time = sum(r["response"].processing_time for r in results) / len(results)
    total_adaptations = sum(len(r["response"].cultural_adaptations) for r in results)
    
    validation_scores = [r["validation"] for r in results if r["validation"]]
    if validation_scores:
        avg_semantic = sum(v.semantic_similarity for v in validation_scores) / len(validation_scores)
        avg_scientific = sum(v.scientific_fidelity for v in validation_scores) / len(validation_scores)
        avg_cultural = sum(v.cultural_relevance for v in validation_scores) / len(validation_scores)
        avg_pedagogical = sum(v.pedagogical_clarity for v in validation_scores) / len(validation_scores)
        pass_rate = sum(1 for v in validation_scores if v.passes_threshold) / len(validation_scores)
        
        print(f"\n🎯 Quality Assurance Metrics:")
        print(f"   • Average Semantic Similarity: {avg_semantic:.3f}")
        print(f"   • Average Scientific Fidelity: {avg_scientific:.3f}")
        print(f"   • Average Cultural Relevance: {avg_cultural:.3f}")
        print(f"   • Average Pedagogical Clarity: {avg_pedagogical:.3f}")
        print(f"   • Validation Pass Rate: {pass_rate:.1%}")
    
    print(f"\n⚡ Performance Statistics:")
    print(f"   • Total Segments Processed: {total_segments}")
    print(f"   • Average Processing Time: {avg_processing_time:.2f}s per transcript")
    print(f"   • Total Cultural Adaptations: {total_adaptations}")
    print(f"   • Processing Rate: {total_segments / sum(r['response'].processing_time for r in results):.1f} segments/second")
    
    # Database statistics
    rag_stats = rag_service.get_collection_stats()
    print(f"\n🗄️  Cultural Context Database:")
    print(f"   • Total Contexts: {rag_stats.get('total_contexts', 0)}")
    print(f"   • Embedding Model: {rag_stats.get('embedding_model', 'N/A')}")
    
    print(f"\n🎉 Enhanced Demo Completed Successfully!")
    print("🔬 The system now features:")
    print("   • Gemini Flash 2.5 powered personalization")
    print("   • Multi-threshold validation engine") 
    print("   • Automatic quality assurance and regeneration")
    print("   • Cultural adaptation with scientific fidelity preservation")
    print("   • Comprehensive analytics and reporting")

if __name__ == "__main__":
    setup_logging()
    
    try:
        asyncio.run(demonstrate_enhanced_personalization_pipeline())
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        logger.error(f"Enhanced demo failed: {e}")
        print(f"❌ Demo failed: {e}")
        print("Check logs/gemini_demo.log for detailed error information")