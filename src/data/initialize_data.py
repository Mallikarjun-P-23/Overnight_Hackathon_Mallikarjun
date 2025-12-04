import uuid
from typing import List
from loguru import logger

from ..models.data_models import CulturalContext, LanguageCode, RegionalContext, ConceptCategory
from ..services.cultural_context_rag import CulturalContextRAG

def create_sample_cultural_contexts() -> List[CulturalContext]:
    """Create sample cultural contexts for different regions and languages"""
    
    contexts = []
    
    # Sports/Games mappings
    sports_contexts = [
        # Baseball -> Regional games
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="baseball",
            localized_concept="gilli danda",
            category=ConceptCategory.GAMES,
            language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            description="Traditional Indian game similar to baseball, played with wooden sticks",
            examples=["Hit the gilli with the danda", "Score runs by hitting the wooden piece"],
            analogies=["Like baseball but with traditional wooden equipment", "Village version of batting games"],
            age_appropriate=["10-12", "13-15", "16-18"],
            confidence_score=0.9
        ),
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="baseball",
            localized_concept="lagori",
            category=ConceptCategory.GAMES,
            language=LanguageCode.KANNADA,
            regional_context=RegionalContext.SOUTH_INDIA,
            description="Traditional game involving stacking stones and hitting them with a ball",
            examples=["Stack the seven stones", "Aim and throw the ball to knock down the pile"],
            analogies=["Team game like baseball but with stone targets", "Requires precision like batting"],
            age_appropriate=["10-12", "13-15"],
            confidence_score=0.85
        ),
        
        # Football -> Regional sports
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="american football",
            localized_concept="kabaddi",
            category=ConceptCategory.SPORTS,
            language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            description="Traditional contact sport requiring strength and strategy",
            examples=["Raider enters opponent territory", "Team defends their half"],
            analogies=["Like football but without equipment", "Strategy and physical strength combined"],
            age_appropriate=["13-15", "16-18"],
            confidence_score=0.9
        ),
    ]
    
    # Food analogies for chemistry/physics
    food_contexts = [
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="mixing ingredients",
            localized_concept="making roti dough",
            category=ConceptCategory.FOOD,
            language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            description="Process of combining flour and water to create dough, demonstrating chemical mixing",
            examples=["Add water gradually to flour", "Knead until smooth consistency"],
            analogies=["Like chemical reactions - proportions matter", "Transformation of ingredients"],
            age_appropriate=["10-12", "13-15", "16-18"],
            confidence_score=0.95
        ),
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="fermentation",
            localized_concept="making idli batter",
            category=ConceptCategory.FOOD,
            language=LanguageCode.TAMIL,
            regional_context=RegionalContext.SOUTH_INDIA,
            description="Traditional fermentation process demonstrating biological and chemical changes",
            examples=["Soak rice and urad dal", "Grind and let it ferment overnight"],
            analogies=["Natural chemical process", "Microorganisms working like catalysts"],
            age_appropriate=["13-15", "16-18"],
            confidence_score=0.9
        ),
    ]
    
    # Mathematical concepts
    math_contexts = [
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="pie chart",
            localized_concept="chapati divisions",
            category=ConceptCategory.MATHEMATICS,
            language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            description="Understanding fractions and percentages through chapati portions",
            examples=["Divide chapati into 4 equal parts", "Each piece is 1/4 or 25%"],
            analogies=["Like cutting a round chapati into equal shares", "Visual representation of parts of whole"],
            age_appropriate=["10-12", "13-15"],
            confidence_score=0.9
        ),
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="geometric patterns",
            localized_concept="kolam designs",
            category=ConceptCategory.MATHEMATICS,
            language=LanguageCode.TAMIL,
            regional_context=RegionalContext.SOUTH_INDIA,
            description="Traditional floor art demonstrating symmetry, patterns, and geometry",
            examples=["Draw dots in grid pattern", "Connect dots to form symmetric designs"],
            analogies=["Ancient mathematics in art form", "Geometry made beautiful and practical"],
            age_appropriate=["10-12", "13-15", "16-18"],
            confidence_score=0.95
        ),
    ]
    
    # Physics concepts
    physics_contexts = [
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="lever",
            localized_concept="hand pump",
            category=ConceptCategory.SCIENCE,
            language=LanguageCode.HINDI,
            regional_context=RegionalContext.NORTH_INDIA,
            description="Village hand pump demonstrating lever mechanism and mechanical advantage",
            examples=["Push down the handle to lift water", "Less force needed with longer handle"],
            analogies=["Simple machine everyone knows", "Effort at one end, load at another"],
            age_appropriate=["13-15", "16-18"],
            confidence_score=0.9
        ),
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="pendulum motion",
            localized_concept="temple bell swinging",
            category=ConceptCategory.SCIENCE,
            language=LanguageCode.KANNADA,
            regional_context=RegionalContext.SOUTH_INDIA,
            description="Temple bells demonstrating periodic motion and oscillation",
            examples=["Bell swings back and forth", "Regular time intervals between swings"],
            analogies=["Sacred example of physics in daily life", "Predictable motion pattern"],
            age_appropriate=["13-15", "16-18"],
            confidence_score=0.85
        ),
    ]
    
    # Geography/History contexts
    geography_contexts = [
        CulturalContext(
            context_id=str(uuid.uuid4()),
            original_concept="river delta",
            localized_concept="Ganga delta",
            category=ConceptCategory.GEOGRAPHY,
            language=LanguageCode.BENGALI,
            regional_context=RegionalContext.EAST_INDIA,
            description="Sunderbans delta formation demonstrating geographical processes",
            examples=["Rivers splitting into many channels", "Rich fertile land formation"],
            analogies=["Like tree branches spreading out", "Nature's way of distributing water and soil"],
            age_appropriate=["13-15", "16-18"],
            confidence_score=0.95
        ),
    ]
    
    # Combine all contexts
    contexts.extend(sports_contexts)
    contexts.extend(food_contexts)
    contexts.extend(math_contexts)
    contexts.extend(physics_contexts)
    contexts.extend(geography_contexts)
    
    return contexts

def initialize_cultural_database():
    """Initialize the cultural context database with sample data"""
    try:
        logger.info("Initializing cultural context database...")
        
        rag_service = CulturalContextRAG()
        sample_contexts = create_sample_cultural_contexts()
        
        # Add contexts to RAG database
        success_count = rag_service.bulk_add_contexts(sample_contexts)
        
        logger.info(f"Successfully initialized {success_count}/{len(sample_contexts)} cultural contexts")
        
        # Get collection stats
        stats = rag_service.get_collection_stats()
        logger.info(f"Database stats: {stats}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error initializing cultural database: {e}")
        return False

if __name__ == "__main__":
    initialize_cultural_database()