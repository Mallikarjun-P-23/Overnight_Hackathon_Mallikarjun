import chromadb
from chromadb.utils import embedding_functions
from typing import List, Dict, Optional, Any
from sentence_transformers import SentenceTransformer
import json
import uuid
from loguru import logger

from ..models.data_models import CulturalContext, LanguageCode, RegionalContext, ConceptCategory
from ..config.settings import Config

class CulturalContextRAG:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=Config.CHROMA_DB_PATH)
        self.embedding_function = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self.collection = self._get_or_create_collection()
        
    def _get_or_create_collection(self):
        """Get or create the cultural contexts collection"""
        try:
            return self.client.get_collection(
                name=Config.COLLECTION_NAME,
                embedding_function=self.embedding_function
            )
        except ValueError:
            return self.client.create_collection(
                name=Config.COLLECTION_NAME,
                embedding_function=self.embedding_function,
                metadata={"description": "Cultural contexts for STEM concept localization"}
            )
    
    def add_cultural_context(self, context: CulturalContext) -> bool:
        """Add a cultural context to the RAG database"""
        try:
            # Create document text for embedding
            doc_text = f"{context.original_concept} -> {context.localized_concept}. {context.description}"
            
            # Add examples and analogies to the text
            if context.examples:
                doc_text += f" Examples: {'; '.join(context.examples)}"
            if context.analogies:
                doc_text += f" Analogies: {'; '.join(context.analogies)}"
            
            metadata = {
                "context_id": context.context_id,
                "original_concept": context.original_concept,
                "localized_concept": context.localized_concept,
                "category": context.category.value,
                "language": context.language.value,
                "regional_context": context.regional_context.value,
                "confidence_score": context.confidence_score,
                "age_appropriate": json.dumps(context.age_appropriate)
            }
            
            self.collection.add(
                documents=[doc_text],
                ids=[context.context_id],
                metadatas=[metadata]
            )
            
            logger.info(f"Added cultural context: {context.original_concept} -> {context.localized_concept}")
            return True
            
        except Exception as e:
            logger.error(f"Error adding cultural context: {e}")
            return False
    
    def search_cultural_contexts(
        self,
        query: str,
        language: LanguageCode,
        regional_context: RegionalContext,
        category: Optional[ConceptCategory] = None,
        age_group: Optional[str] = None,
        n_results: int = 5
    ) -> List[Dict[str, Any]]:
        """Search for relevant cultural contexts using RAG"""
        try:
            # Build where clause for filtering
            where_clause = {
                "language": language.value,
                "regional_context": regional_context.value
            }
            
            if category:
                where_clause["category"] = category.value
            
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_clause
            )
            
            contexts = []
            if results["documents"] and results["documents"][0]:
                for i, doc in enumerate(results["documents"][0]):
                    metadata = results["metadatas"][0][i]
                    distance = results["distances"][0][i] if results["distances"] else None
                    
                    # Filter by age group if specified
                    if age_group:
                        age_appropriate = json.loads(metadata.get("age_appropriate", "[]"))
                        if age_group not in age_appropriate and age_appropriate:
                            continue
                    
                    contexts.append({
                        "context_id": metadata["context_id"],
                        "original_concept": metadata["original_concept"],
                        "localized_concept": metadata["localized_concept"],
                        "category": metadata["category"],
                        "confidence_score": metadata["confidence_score"],
                        "relevance_score": 1 - distance if distance else 1.0,
                        "document": doc
                    })
            
            logger.info(f"Found {len(contexts)} cultural contexts for query: {query}")
            return contexts
            
        except Exception as e:
            logger.error(f"Error searching cultural contexts: {e}")
            return []
    
    def get_concept_mappings(
        self,
        concepts: List[str],
        language: LanguageCode,
        regional_context: RegionalContext,
        age_group: Optional[str] = None
    ) -> Dict[str, str]:
        """Get cultural mappings for a list of concepts"""
        mappings = {}
        
        for concept in concepts:
            contexts = self.search_cultural_contexts(
                query=concept,
                language=language,
                regional_context=regional_context,
                age_group=age_group,
                n_results=1
            )
            
            if contexts and contexts[0]["relevance_score"] > 0.7:  # Confidence threshold
                mappings[concept] = contexts[0]["localized_concept"]
        
        return mappings
    
    def bulk_add_contexts(self, contexts: List[CulturalContext]) -> int:
        """Add multiple cultural contexts in bulk"""
        success_count = 0
        for context in contexts:
            if self.add_cultural_context(context):
                success_count += 1
        
        logger.info(f"Successfully added {success_count}/{len(contexts)} cultural contexts")
        return success_count
    
    def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the cultural context collection"""
        try:
            count = self.collection.count()
            return {
                "total_contexts": count,
                "collection_name": Config.COLLECTION_NAME,
                "embedding_model": "all-MiniLM-L6-v2"
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"error": str(e)}