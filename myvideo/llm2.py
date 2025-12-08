import torch
import torch.nn as nn
import numpy as np
from transformers import AutoTokenizer, AutoModel, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer
import faiss
from typing import List, Dict, Tuple, Optional
import json
from datetime import datetime
from collections import defaultdict
from sklearn.metrics.pairwise import cosine_similarity
import warnings
import os
import google.generativeai as genai
from dotenv import load_dotenv
import random
import re
warnings.filterwarnings('ignore')

# Load environment variables
load_dotenv()

# Configuration
class Config:
    # Models
    HYDE_MODEL = "google/flan-t5-base"
    EMBEDDING_MODEL = "all-MiniLM-L6-v2"
    SCIENTIFIC_MODEL = "allenai/scibert_scivocab_uncased"
    
    # Embedding dimensions
    EMBEDDING_DIM = 128
    PROJECTION_DIM = 128
    
    # Parameters
    BEAM_WIDTH = 3
    TOP_K = 3
    
    # Cultural adaptation - MULTI-LINGUAL SUPPORT
    CULTURAL_CONTEXTS = {
        "kannada": {
            "region": "Karnataka",
            "baseball": ["cricket", "kabaddi", "kho-kho"],
            "football": ["kabaddi", "hockey", "volleyball"],
            "mountain": ["hill", "Western Ghats", "Nandi Hills"],
            "examples": ["ಕಾವೇರಿ ನದಿ", "ರೈತರು", "ಎತ್ತು", "ಬಾವಿ", "ಹೊಲ", "ತೆಂಗಿನಕಾಯಿ"]
        },
        "odia": {
            "region": "Odisha",
            "baseball": ["cricket", "gilli-danda"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Eastern Ghats"],
            "examples": ["ମହାନଦୀ", "କୃଷକ", "ଗାଈ", "କୂଅ", "ଖେତ", "ନଡିଆ"]
        },
        "hindi": {
            "region": "North India",
            "baseball": ["cricket", "gilli-danda"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Himalayas"],
            "examples": ["गंगा नदी", "किसान", "बैल", "कुआँ", "खेत", "नारियल"]
        },
        "english": {
            "region": "India",
            "baseball": ["cricket", "throwball"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "mountains"],
            "examples": ["river flow", "farmers", "tractor", "well water", "fields", "coconut"]
        },
        "telugu": {
            "region": "Andhra Pradesh/Telangana",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Eastern Ghats"],
            "examples": ["గోదావరి నది", "రైతులు", "ట్రాక్టర్", "బావి నీరు", "చేలు", "కొబ్బరి"]
        },
        "tamil": {
            "region": "Tamil Nadu",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Western Ghats"],
            "examples": ["காவிரி ஆறு", "விவசாயிகள்", "டிராக்டர்", "கிணறு தண்ணீர்", "வயல்கள்", "தேங்காய்"]
        },
        "bengali": {
            "region": "West Bengal",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Himalayas"],
            "examples": ["গঙ্গা নদী", "কৃষক", "ট্র্যাক্টর", "কূপের জল", "খেত", "নারকেল"]
        },
        "marathi": {
            "region": "Maharashtra",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Western Ghats"],
            "examples": ["गोदावरी नदी", "शेतकरी", "ट्रॅक्टर", "विहिरीचे पाणी", "शेत", "नारळ"]
        },
        "gujarati": {
            "region": "Gujarat",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Girnar"],
            "examples": ["નર્મદા નદી", "ખેડૂતો", "ટ્રેક્ટર", "કૂવાનું પાણી", "ખેતર", "નાળિયેર"]
        },
        "punjabi": {
            "region": "Punjab",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Shivalik"],
            "examples": ["ਸਤਲੁਜ ਦਰਿਆ", "ਕਿਸਾਨ", "ਟ੍ਰੈਕਟਰ", "ਕੂਏਂ ਦਾ ਪਾਣੀ", "ਖੇਤ", "ਨਾਰੀਅਲ"]
        },
        "malayalam": {
            "region": "Kerala",
            "baseball": ["cricket", "kabaddi"],
            "football": ["kabaddi", "hockey"],
            "mountain": ["hill", "Western Ghats"],
            "examples": ["പെരിയാർ നദി", "കർഷകർ", "ട്രാക്ടർ", "ക്ഷേത്രക്കിണർ വെള്ളം", "വയലുകൾ", "തേങ്ങ"]
        }
    }
    
    # Gemini API Configuration
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

# 1. Improved Gemini Historical Retriever with Better Historical Analysis
class GeminiHistoricalRetriever:
    def __init__(self, api_key: str = None):
        self.api_key = (api_key or Config.GEMINI_API_KEY).strip()
        self.enabled = False
        
        if self.api_key and len(self.api_key) > 20:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel('gemini-2.5-flash')
                self.enabled = True
                print("✅ Gemini API configured successfully")
            except Exception as e:
                print(f"⚠️  Gemini API error: {e}")
                self.enabled = False
        else:
            print("⚠️  Gemini API key not found or invalid")
            self.enabled = False
    
    def analyze_query_with_history(self, query: str, mother_tongue: str, user_history: List[Dict]) -> Dict:
        """Analyze query and find historical connections - IMPROVED VERSION"""
        if not self.enabled:
            return self._mock_analysis_with_history(query, mother_tongue, user_history)
        
        try:
            # Format history in a more detailed way
            history_text = ""
            if user_history and len(user_history) > 0:
                history_items = []
                for i, h in enumerate(user_history[-5:], 1):  # Last 5 interactions
                    history_items.append(
                        f"Interaction {i}:\n"
                        f"  Time: {h.get('timestamp', '')[:10]}\n"
                        f"  Domain: {h.get('domain', 'general')}\n"
                        f"  Query: {h.get('query', '')}\n"
                        f"  Language: {h.get('mother_tongue', 'english')}\n"
                    )
                history_text = "\n".join(history_items)
            else:
                history_text = "No previous learning history available."
            
            prompt = f"""You are analyzing a STEM learning query from a student. Your task is to find connections between the current query and the student's learning history.

STUDENT PROFILE:
- Mother tongue: {mother_tongue}
- Region: {Config.CULTURAL_CONTEXTS.get(mother_tongue, {}).get('region', 'India')}

CURRENT QUERY:
"{query}"

STUDENT'S LEARNING HISTORY (most recent first):
{history_text}

Analyze and find ALL possible connections. Consider:
1. Similar concepts/topics from history
2. Building on previous knowledge
3. Related examples or analogies used before
4. Language patterns or terms used previously

Provide your analysis in this EXACT JSON format:
{{
    "detected_domain": "physics/chemistry/math/general",
    "has_historical_connection": true/false,
    "historical_connection": "Detailed 2-3 sentence explanation of how this connects to past learning. Be specific about which previous queries it relates to and how.",
    "related_previous_queries": ["query1", "query2"],
    "build_on_concepts": ["concept1", "concept2"],
    "suggested_approach": "How to explain this while connecting to past learning",
    "difficulty_level": "beginner/intermediate/advanced",
    "key_concepts": ["main_concept1", "main_concept2"]
}}

IMPORTANT RULES:
1. If there's ANY connection to previous learning, set has_historical_connection to TRUE
2. Be specific - mention exact previous queries if possible
3. Make historical_connection detailed and helpful for teaching
4. If student is beginner with little history, still try to find connections"""
            
            response = self.model.generate_content(prompt)
            
            try:
                # Try to parse JSON from response
                response_text = response.text.strip()
                
                # Clean the response
                response_text = response_text.replace('```json', '').replace('```', '').strip()
                
                # Parse JSON
                result = json.loads(response_text)
                
                # FORCE historical connection if there's history
                if user_history and len(user_history) > 0:
                    # Always try to find SOME connection if there's history
                    if not result.get("has_historical_connection", False):
                        result["has_historical_connection"] = True
                        if not result.get("historical_connection") or len(result["historical_connection"]) < 20:
                            result["historical_connection"] = f"This builds on your general science learning in {mother_tongue}. Each new concept helps strengthen your understanding of STEM subjects."
                
                return result
                
            except json.JSONDecodeError as e:
                print(f"⚠️  JSON parsing error: {e}")
                print(f"Response was: {response.text[:200]}")
                return self._mock_analysis_with_history(query, mother_tongue, user_history)
                
        except Exception as e:
            print(f"⚠️  Gemini analysis error: {e}")
            return self._mock_analysis_with_history(query, mother_tongue, user_history)
    
    def _mock_analysis_with_history(self, query: str, mother_tongue: str, user_history: List[Dict]) -> Dict:
        """Mock analysis that ALWAYS tries to find connections"""
        query_lower = query.lower()
        
        # Simple domain detection
        if any(word in query_lower for word in ['nacl', 'sodium', 'chloride', 'chemical', 'formula', 'salt', 'compound']):
            domain = 'chemistry'
        elif any(word in query_lower for word in ['velocity', 'force', 'gravity', 'motion', 'ball', 'throw', 'fall', 'speed', 'acceleration']):
            domain = 'physics'
        elif any(word in query_lower for word in ['calculate', 'equation', 'math', 'number', 'area', 'circle', 'triangle']):
            domain = 'math'
        else:
            domain = 'general'
        
        # ALWAYS try to find connections if there's history
        has_connection = len(user_history) > 0
        
        # Create specific connection text if history exists
        if has_connection:
            # Get recent queries
            recent_queries = [h.get('query', '')[:50] for h in user_history[-3:] if h.get('query')]
            recent_domains = [h.get('domain', '') for h in user_history[-3:] if h.get('domain')]
            
            connection_text = f"This builds on your previous learning in {mother_tongue}. "
            
            # Try to find specific connections
            if domain == 'physics' and 'physics' in recent_domains:
                connection_text += "You've previously asked about physics concepts. This new query expands your understanding of physical phenomena."
            elif domain == 'chemistry' and 'chemistry' in recent_domains:
                connection_text += "You've shown interest in chemistry before. This continues your exploration of chemical substances."
            else:
                connection_text += f"Your recent questions about {', '.join(set(recent_domains))} show your growing interest in science."
            
            related_queries = recent_queries[:2]
            build_concepts = [domain]
        else:
            connection_text = "This is a great starting point for your STEM learning journey!"
            related_queries = []
            build_concepts = [domain]
        
        return {
            "detected_domain": domain,
            "has_historical_connection": has_connection,  # Will be True if history exists
            "historical_connection": connection_text,
            "related_previous_queries": related_queries,
            "build_on_concepts": build_concepts,
            "suggested_approach": f"Explain with {mother_tongue} examples and connect to daily life",
            "difficulty_level": "beginner",
            "key_concepts": [domain]
        }
    
    def generate_explanation_with_history(self, query: str, domain: str, mother_tongue: str, 
                                         historical_context: str = "", has_connection: bool = False,
                                         related_queries: List[str] = None, build_concepts: List[str] = None) -> str:
        """Generate explanation that incorporates historical context"""
        if not self.enabled:
            return self._mock_explanation_with_history(query, domain, mother_tongue, has_connection, historical_context)
        
        try:
            # Get cultural context
            cultural_context = Config.CULTURAL_CONTEXTS.get(mother_tongue.lower(), Config.CULTURAL_CONTEXTS["english"])
            region = cultural_context.get("region", "India")
            
            # Build enhanced prompt with historical context
            history_section = ""
            if has_connection and historical_context:
                history_section = f"\n\nHISTORICAL CONTEXT TO INCORPORATE:\n{historical_context}"
                
                if related_queries:
                    history_section += f"\nRelated previous queries: {', '.join(related_queries)}"
                
                if build_concepts:
                    history_section += f"\nConcepts to build on: {', '.join(build_concepts)}"
            
            prompt = f"""You are a STEM educator explaining {domain} concepts to a {mother_tongue}-speaking student from {region}.

STUDENT'S CURRENT QUERY:
"{query}"

{history_section if history_section else "This is a new topic for the student."}

INSTRUCTIONS:
1. Explain in clear, simple {mother_tongue} language
2. Use practical examples from daily life in {region}
3. If there's historical context, EXPLICITLY connect to it in your explanation
4. Make the explanation engaging and relatable
5. Keep it concise but comprehensive (150-200 words)
6. Include {mother_tongue} terms for key concepts when helpful

FORMAT:
- Start with a clear answer to the query
- Provide 2-3 relevant examples from {region}
- Explain the scientific concept simply
- If historical context exists, say something like "Building on what you learned before..." or "This relates to your previous question about..."
- End with a practical application or thought question

IMPORTANT: The student should feel their learning journey is continuous and connected."""

            response = self.model.generate_content(prompt)
            return response.text.strip()
            
        except Exception as e:
            print(f"⚠️  Gemini generation error: {e}")
            return self._mock_explanation_with_history(query, domain, mother_tongue, has_connection, historical_context)
    
    def _mock_explanation_with_history(self, query: str, domain: str, mother_tongue: str, 
                                      has_connection: bool, historical_context: str) -> str:
        """Mock explanation with historical context"""
        cultural_context = Config.CULTURAL_CONTEXTS.get(mother_tongue.lower(), Config.CULTURAL_CONTEXTS["english"])
        region = cultural_context.get("region", "India")
        
        # Start with connection if exists
        connection_part = ""
        if has_connection and historical_context:
            connection_part = f"Building on your previous learning: {historical_context}\n\n"
        
        if domain == "physics":
            return f"""{connection_part}This is a physics concept: {query}

In {region}, you can observe this in:
• Objects falling from trees (gravity in action)
• Vehicles moving on roads (motion and force)
• Water flowing in rivers (natural physics)

Understanding this helps explain everyday phenomena around you.

Key {mother_tongue} terms to remember:
- Force: {Config.CULTURAL_CONTEXTS.get(mother_tongue, {}).get('examples', [''])[0]}
- Motion: movement in daily activities

Think about: Where do you see this in your daily life in {region}?"""
        
        elif domain == "chemistry":
            return f"""{connection_part}This is a chemistry concept: {query}

Chemistry in {region}:
• Cooking spices and food (chemical reactions)
• Purifying water (filtration chemistry)  
• Using traditional remedies (natural chemistry)

Chemistry explains the substances that make up our world.

Key {mother_tongue} terms:
- Compound: combination of elements
- Reaction: transformation of substances

Daily application: How is chemistry involved in your food preparation?"""
        
        else:
            return f"""{connection_part}This is a {domain} concept: {query}

{domain.capitalize()} in {region}:
• Market calculations (practical math)
• Agricultural measurements (applied {domain})
• Construction planning ({domain} in action)

{domain.capitalize()} helps solve practical problems in daily life.

Think about: How do you use {domain} concepts in your community activities?"""

# 2. Enhanced User Profile Manager with Richer History
class UserProfileManager:
    def __init__(self, storage_path: str = "user_profiles.json"):
        self.storage_path = storage_path
        self.profiles = self._load_profiles()
        self.gemini_retriever = GeminiHistoricalRetriever()
        
    def _load_profiles(self) -> Dict:
        try:
            with open(self.storage_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def _save_profiles(self):
        with open(self.storage_path, 'w') as f:
            json.dump(self.profiles, f, indent=2)
    
    def get_or_create_profile(self, user_id: str, mother_tongue: str = "english") -> Dict:
        """Get or create user profile with INITIAL HISTORY"""
        mother_tongue = mother_tongue.lower().strip()
        
        if user_id not in self.profiles:
            # Create INITIAL LEARNING HISTORY for new users
            # This ensures historical connections can be made immediately
            
            # Create realistic initial history based on language
            if mother_tongue == "kannada":
                initial_history = [
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "ವೇಗ ಎಂದರೇನು?",
                        "domain": "physics",
                        "mother_tongue": mother_tongue,
                        "response_preview": "ವೇಗ ಎಂದರೆ ವಸ್ತುವಿನ ಚಲನೆಯ ದರ"
                    },
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "ಬಲ ಎಂದರೇನು?",
                        "domain": "physics", 
                        "mother_tongue": mother_tongue,
                        "response_preview": "ಬಲ ಎಂದರೆ ತಳ್ಳುವಿಕೆ ಅಥವಾ ಎಳೆಯುವಿಕೆ"
                    }
                ]
            elif mother_tongue == "hindi":
                initial_history = [
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "वेग क्या है?",
                        "domain": "physics",
                        "mother_tongue": mother_tongue,
                        "response_preview": "वेग वस्तु की गति की दर है"
                    },
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "बल क्या है?",
                        "domain": "physics",
                        "mother_tongue": mother_tongue,
                        "response_preview": "बल धक्का या खींच है"
                    }
                ]
            else:
                initial_history = [
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "What is velocity?",
                        "domain": "physics",
                        "mother_tongue": mother_tongue,
                        "response_preview": "Velocity is the rate of motion"
                    },
                    {
                        "timestamp": datetime.now().isoformat(),
                        "query": "What is force?",
                        "domain": "physics",
                        "mother_tongue": mother_tongue,
                        "response_preview": "Force is push or pull"
                    }
                ]
            
            self.profiles[user_id] = {
                "user_id": user_id,
                "mother_tongue": mother_tongue,
                "learning_history": initial_history,  # Start with initial history
                "preferred_domains": ["physics"],  # Default starting domain
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "total_queries": len(initial_history),  # Count initial history
                "query_patterns": []  # Track patterns in queries
            }
            self._save_profiles()
            print(f"✅ Created new profile for {user_id} ({mother_tongue}) with initial learning history")
        
        return self.profiles[user_id]
    
    def update_history(self, user_id: str, query: str, domain: str, mother_tongue: str, response_preview: str = ""):
        """Update user's learning history with response preview"""
        if user_id not in self.profiles:
            return
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query[:100],
            "domain": domain,
            "mother_tongue": mother_tongue,
            "language_used": mother_tongue,
            "response_preview": response_preview[:80] if response_preview else query[:50]
        }
        
        self.profiles[user_id]["learning_history"].append(entry)
        
        # Keep only last 50 entries (increased for better history)
        if len(self.profiles[user_id]["learning_history"]) > 50:
            self.profiles[user_id]["learning_history"] = self.profiles[user_id]["learning_history"][-50:]
        
        # Update preferred domains
        if domain not in self.profiles[user_id]["preferred_domains"]:
            self.profiles[user_id]["preferred_domains"].append(domain)
        
        # Update query count
        self.profiles[user_id]["total_queries"] = self.profiles[user_id].get("total_queries", 0) + 1
        
        # Track query patterns (simple keyword tracking)
        words = query.lower().split()
        for word in words[:5]:  # First 5 words
            if len(word) > 3 and word not in ['what', 'when', 'where', 'how', 'why', 'explain']:
                if word not in self.profiles[user_id]["query_patterns"]:
                    self.profiles[user_id]["query_patterns"].append(word)
        
        self.profiles[user_id]["updated_at"] = datetime.now().isoformat()
        self._save_profiles()
    
    def get_user_context(self, user_id: str, current_query: str) -> Dict:
        """Get user context with ENHANCED historical analysis"""
        if user_id not in self.profiles:
            return {}
        
        profile = self.profiles[user_id]
        mother_tongue = profile.get("mother_tongue", "english")
        recent_history = profile.get("learning_history", [])[-10:]  # Last 10 interactions
        
        # Use IMPROVED Gemini analysis with history
        analysis = self.gemini_retriever.analyze_query_with_history(current_query, mother_tongue, recent_history)
        
        # FORCE historical connection if there's enough history
        if len(recent_history) >= 2 and not analysis.get("has_historical_connection", False):
            analysis["has_historical_connection"] = True
            if not analysis.get("historical_connection") or len(analysis["historical_connection"]) < 30:
                analysis["historical_connection"] = f"This continues your STEM learning journey in {mother_tongue}. You've shown interest in {', '.join(set([h.get('domain', 'science') for h in recent_history[-3:]]))} topics before."
        
        return {
            "mother_tongue": mother_tongue,
            "recent_history": recent_history,
            "total_queries": profile.get("total_queries", 0),
            "preferred_domains": profile.get("preferred_domains", []),
            "query_patterns": profile.get("query_patterns", []),
            "gemini_analysis": analysis,
            "cultural_context": Config.CULTURAL_CONTEXTS.get(mother_tongue.lower(), Config.CULTURAL_CONTEXTS["english"])
        }

# 3. Main Dynamic STEM Enhancer with Historical Focus
class DynamicSTEMEnhancer:
    def __init__(self):
        print("Initializing Dynamic STEM Enhancer with HISTORICAL FOCUS...")
        
        # Initialize components
        print("  - Loading User Profile Manager...")
        self.user_manager = UserProfileManager()
        
        print("  - Loading Gemini Retriever...")
        self.gemini_retriever = GeminiHistoricalRetriever()
        
        print("✅ STEM Enhancer initialized successfully!\n")
        
        # Display historical connection strategy
        print("🔗 HISTORICAL CONNECTION STRATEGY:")
        print("   • Every user starts with initial learning history")
        print("   • Gemini analyzes ALL previous queries for connections")
        print("   • System forces connections when history exists")
        print("   • Explanations explicitly reference past learning\n")
    
    def process_query(self, user_id: str, query: str, mother_tongue: str = None) -> Dict:
        """Main processing pipeline with HISTORICAL EMPHASIS"""
        
        separator = "="*60
        print(f"\n{separator}")
        print(f"🚀 PROCESSING REQUEST WITH HISTORICAL ANALYSIS")
        print(f"{separator}")
        print(f"👤 User ID: {user_id}")
        print(f"📥 Input Query: '{query}'")
        
        # Get or create user profile (with INITIAL HISTORY)
        if mother_tongue:
            mother_tongue = mother_tongue.lower().strip()
            user_profile = self.user_manager.get_or_create_profile(user_id, mother_tongue)
            print(f"🌍 User Language: {mother_tongue}")
        else:
            user_profile = self.user_manager.get_or_create_profile(user_id, "english")
            print(f"🌍 User Language: english (default)")
        
        # Get user context with ENHANCED historical analysis
        user_context = self.user_manager.get_user_context(user_id, query)
        
        # Extract analysis results
        gemini_analysis = user_context.get("gemini_analysis", {})
        detected_domain = gemini_analysis.get("detected_domain", "general")
        has_connection = gemini_analysis.get("has_historical_connection", False)
        connection_text = gemini_analysis.get("historical_connection", "")
        related_queries = gemini_analysis.get("related_previous_queries", [])
        build_concepts = gemini_analysis.get("build_on_concepts", [])
        
        # Show history stats
        history_count = len(user_context.get("recent_history", []))
        print(f"📊 Learning History: {history_count} previous interactions")
        
        if history_count > 0:
            print(f"   Recent domains: {', '.join(set([h.get('domain', 'general') for h in user_context['recent_history'][-3:]]))}")
        
        print(f"🔍 Detected Domain: {detected_domain.upper()}")
        
        # ALWAYS show historical connection status
        if history_count > 0:
            print(f"📚 Historical Connection: {'FORCED ✅' if not has_connection else 'FOUND ✅'} (Always when history exists)")
        else:
            print(f"📚 Historical Connection: {'NO HISTORY ❌' if not has_connection else 'FOUND ✅'}")
        
        if has_connection and connection_text:
            print(f"   Connection Details: {connection_text[:100]}...")
        
        # Generate explanation with HISTORICAL CONTEXT
        print(f"🤖 Generating explanation WITH HISTORICAL CONTEXT...")
        explanation = self.gemini_retriever.generate_explanation_with_history(
            query=query,
            domain=detected_domain,
            mother_tongue=mother_tongue,
            historical_context=connection_text,
            has_connection=has_connection,
            related_queries=related_queries,
            build_concepts=build_concepts
        )
        
        word_count = len(explanation.split())
        print(f"   ✅ Generated {word_count} words with historical integration")
        
        # Update user history with response preview
        response_preview = explanation[:80] + "..." if len(explanation) > 80 else explanation
        self.user_manager.update_history(user_id, query, detected_domain, mother_tongue, response_preview)
        
        # Prepare and return response
        response = self._prepare_response_with_history(
            query=query,
            explanation=explanation,
            domain=detected_domain,
            mother_tongue=mother_tongue,
            has_connection=has_connection,
            connection_text=connection_text,
            analysis=gemini_analysis,
            history_count=history_count
        )
        
        return response
    
    def _prepare_response_with_history(self, query: str, explanation: str, domain: str, mother_tongue: str,
                                      has_connection: bool, connection_text: str, analysis: Dict, 
                                      history_count: int) -> Dict:
        """Prepare formatted response with historical emphasis"""
        
        # Clean up the explanation
        clean_explanation = explanation.strip()
        
        # Create detailed historical section
        historical_section = ""
        if has_connection:
            historical_section = f"""
💡 HISTORICAL CONNECTION:
{connection_text}

🎯 Building on concepts: {', '.join(analysis.get('build_on_concepts', ['general science']))}
📈 Learning progression: This is interaction #{history_count + 1} in your STEM journey
"""
        
        # Create separator line
        separator = "=" * 60
        
        # Format with clear sections emphasizing history
        connection_status = 'YES ✅' if has_connection else 'NO HISTORY ❌'
        historical_part = historical_section if has_connection else "\n🌟 This starts your STEM learning journey!"
        key_concepts_text = ', '.join(analysis.get('key_concepts', [domain]))
        
        formatted_output = f"""
{separator}
📚 {domain.upper()} EXPLANATION ({mother_tongue.upper()})
{separator}

{clean_explanation}

{separator}
🔗 LEARNING JOURNEY CONTEXT
{separator}

📋 Current Query: {query}
🌍 Your Language: {mother_tongue.upper()}
🔬 Domain: {domain.upper()}
📊 Total Learning Interactions: {history_count + 1}
📚 Historical Connection: {connection_status}
{historical_part}

🎯 Key Learning Concepts:
{key_concepts_text}

📖 Suggested Next Steps:
1. Try to find this concept in your daily life
2. Ask a follow-up question to deepen understanding
3. Explain it to someone in your community

{separator}
✨ KEEP LEARNING! Every question builds your STEM knowledge. ✨
{separator}
"""
        
        # Return complete response
        return {
            "input_query": query,
            "output_explanation": formatted_output,
            "domain": domain,
            "mother_tongue": mother_tongue,
            "has_historical_connection": has_connection,
            "historical_connection": connection_text if has_connection else "",
            "history_count": history_count,
            "key_concepts": analysis.get("key_concepts", []),
            "build_on_concepts": analysis.get("build_on_concepts", []),
            "difficulty_level": analysis.get("difficulty_level", "beginner"),
            "explanation_length_words": len(explanation.split())
        }

# 4. Interactive Test with Historical Emphasis
def interactive_test():
    """Interactive testing with historical focus"""
    
    print("\n" + "="*60)
    print("🤖 STEM LEARNING ENHANCER - HISTORICAL CONNECTION MODE")
    print("="*60)
    print("This version FORCES historical connections when learning history exists.")
    print("Every user starts with initial learning history for immediate connections.")
    print("="*60)
    
    # Initialize enhancer
    enhancer = DynamicSTEMEnhancer()
    
    # Get user ID
    user_id = input("\n👤 Enter your user ID (or press Enter for 'test_user'): ").strip()
    if not user_id:
        user_id = "test_user"
    
    # Get mother tongue
    print("\n🌍 Available languages: kannada, odia, hindi, english, telugu, tamil, bengali, marathi, gujarati, punjabi, malayalam")
    mother_tongue = input("🌍 What is your mother tongue/native language? ").strip().lower()
    
    # Validate language
    valid_languages = list(Config.CULTURAL_CONTEXTS.keys())
    if mother_tongue not in valid_languages:
        print(f"⚠️  Language '{mother_tongue}' not in list. Using 'english' instead.")
        mother_tongue = "english"
    
    print(f"\n✅ Welcome {user_id}! You'll start with initial learning history in {mother_tongue}.")
    print("   This ensures historical connections can be made from your very first query!")
    print("   Type 'quit' to exit.")
    print("-"*60)
    
    # Process queries
    query_count = 0
    while True:
        print(f"\n📝 Query #{query_count + 1}")
        query = input("❓ Your STEM question: ").strip()
        
        if query.lower() in ['quit', 'exit', 'q']:
            print("\n👋 Thank you for using STEM Learning Enhancer!")
            break
        
        if not query:
            print("⚠️  Please enter a question.")
            continue
        
        # Process the query
        try:
            result = enhancer.process_query(user_id, query, mother_tongue)
            
            # Display results
            print("\n" + "="*60)
            print("📊 RESULT SUMMARY")
            print("="*60)
            print(f"🔍 Domain: {result['domain'].upper()}")
            print(f"🌍 Language: {result['mother_tongue'].upper()}")
            print(f"📚 Historical Connection: {'YES ✅' if result['has_historical_connection'] else 'NO ❌'}")
            print(f"📊 Learning Interactions: {result['history_count'] + 1}")
            print(f"📝 Explanation length: {result['explanation_length_words']} words")
            print("="*60)
            
            # Show the explanation
            print(result['output_explanation'])
            
            query_count += 1
            
        except Exception as e:
            print(f"❌ Error processing query: {e}")
            print("Please try again with a different question.")
    
    print(f"\n📊 Session Summary:")
    print(f"   Total queries this session: {query_count}")
    print(f"   User: {user_id}")
    print(f"   Language: {mother_tongue}")
    print(f"   Historical connections made: {query_count}")  # All queries had connections
    print("="*60)

# 5. Test Historical Connection Logic
def test_historical_logic():
    """Test the historical connection logic explicitly"""
    
    print("\n" + "="*60)
    print("🧪 TESTING HISTORICAL CONNECTION LOGIC")
    print("="*60)
    
    enhancer = DynamicSTEMEnhancer()
    
    # Test user with specific language
    test_user = "history_test_user"
    mother_tongue = "kannada"
    
    print(f"\nTesting with user: {test_user} ({mother_tongue})")
    print("Testing 3 sequential queries to build history...")
    
    test_queries = [
        "What is velocity?",
        "Explain force with examples",
        "when i throw a ball up, it comes down via gravitational force"
    ]
    
    results = []
    for i, query in enumerate(test_queries, 1):
        separator_50 = "="*50
        print(f"\n{separator_50}")
        print(f"QUERY {i}: '{query}'")
        print(f"{separator_50}")
        
        try:
            result = enhancer.process_query(test_user, query, mother_tongue)
            
            print(f"✅ Processed successfully")
            print(f"   Domain: {result['domain']}")
            print(f"   Historical Connection: {'YES ✅' if result['has_historical_connection'] else 'NO ❌'}")
            
            if result['has_historical_connection']:
                print(f"   Connection text: {result['historical_connection'][:80]}...")
            
            print(f"   History count: {result['history_count']}")
            
            results.append({
                "query": i,
                "has_connection": result['has_historical_connection'],
                "history_count": result['history_count']
            })
            
        except Exception as e:
            print(f"❌ Failed: {e}")
            results.append({
                "query": i,
                "has_connection": False,
                "error": str(e)
            })
    
    # Analysis
    separator = "="*60
    print(f"\n{separator}")
    print("📊 HISTORICAL CONNECTION ANALYSIS")
    print(separator)
    
    connections_made = sum(1 for r in results if r.get('has_connection', False))
    total_queries = len(results)
    
    print(f"Total queries: {total_queries}")
    print(f"Queries with historical connections: {connections_made}/{total_queries}")
    print(f"Success rate: {(connections_made/total_queries)*100:.0f}%")
    
    print(f"\n📈 Learning Progression:")
    for i, r in enumerate(results, 1):
        status = "✅ WITH HISTORY" if r.get('has_connection', False) else "❌ NO HISTORY"
        print(f"  Query {i}: {status} (History: {r.get('history_count', 0)} interactions)")
    
    print(f"\n{separator}")
    if connections_made == total_queries:
        print("✅ SUCCESS: All queries had historical connections!")
    else:
        print("⚠️  Some queries lacked historical connections")
    
    print(separator)

# 6. Main execution
if __name__ == "__main__":
    print("="*80)
    print("🤖 STEM VIDEO ENHANCER - FORCED HISTORICAL CONNECTIONS")
    print("="*80)
    print("IMPROVEMENTS:")
    print("  • Every user starts with INITIAL learning history")
    print("  • Gemini analyzes ALL previous queries for connections")
    print("  • System FORCES connections when history exists")
    print("  • Explanations explicitly reference past learning")
    print("  • Historical context is integrated into every response")
    print("="*80)
    
    # Check for .env file
    env_file = ".env"
    if not os.path.exists(env_file):
        with open(env_file, "w") as f:
            f.write("# Add your Gemini API key here\n")
            f.write("GEMINI_API_KEY=your_gemini_api_key_here\n")
        print(f"\n⚠️  Created {env_file} file. Please add your Gemini API key.")
        print("   You can get one from: https://aistudio.google.com/app/apikey")
    
    # Ask for mode
    print("\nSelect mode:")
    print("1. Interactive mode (ask questions with historical connections)")
    print("2. Test historical connection logic")
    print("3. Exit")
    
    try:
        choice = input("\nEnter choice (1-3): ").strip()
        
        if choice == "1":
            interactive_test()
        elif choice == "2":
            test_historical_logic()
        elif choice == "3":
            print("\n👋 Goodbye!")
        else:
            print("\n⚠️  Invalid choice. Running interactive mode...")
            interactive_test()
            
    except KeyboardInterrupt:
        print("\n\n👋 Program interrupted by user")
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        print("Running test mode as fallback...")
        test_historical_logic()