import sqlite3
from typing import List, Dict, Optional, Any
import json
import uuid
from datetime import datetime
from loguru import logger

from ..models.data_models import StudentProfile, LearningInteraction, LanguageCode, RegionalContext
from ..config.settings import Config

class StudentProfileService:
    def __init__(self):
        self.db_path = Config.STUDENT_PROFILES_DB_PATH
        self._init_database()
    
    def _init_database(self):
        """Initialize the student profiles database"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create student profiles table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS student_profiles (
                        student_id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        native_language TEXT NOT NULL,
                        regional_context TEXT NOT NULL,
                        state TEXT,
                        city TEXT,
                        age_group TEXT,
                        learning_preferences TEXT,
                        concept_mappings TEXT,
                        created_at TEXT,
                        updated_at TEXT
                    )
                ''')
                
                # Create learning interactions table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS learning_interactions (
                        interaction_id TEXT PRIMARY KEY,
                        student_id TEXT NOT NULL,
                        video_id TEXT NOT NULL,
                        concepts_encountered TEXT,
                        concepts_understood TEXT,
                        feedback_rating INTEGER,
                        time_spent REAL,
                        completion_rate REAL,
                        timestamp TEXT,
                        FOREIGN KEY (student_id) REFERENCES student_profiles (student_id)
                    )
                ''')
                
                conn.commit()
                logger.info("Student profiles database initialized")
                
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
    
    def create_student_profile(self, profile: StudentProfile) -> bool:
        """Create a new student profile"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO student_profiles 
                    (student_id, name, native_language, regional_context, state, city, 
                     age_group, learning_preferences, concept_mappings, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    profile.student_id,
                    profile.name,
                    profile.native_language.value,
                    profile.regional_context.value,
                    profile.state,
                    profile.city,
                    profile.age_group,
                    json.dumps(profile.learning_preferences),
                    json.dumps(profile.concept_mappings),
                    profile.created_at.isoformat(),
                    profile.updated_at.isoformat()
                ))
                
                conn.commit()
                logger.info(f"Created student profile: {profile.student_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error creating student profile: {e}")
            return False
    
    def get_student_profile(self, student_id: str) -> Optional[StudentProfile]:
        """Retrieve a student profile by ID"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM student_profiles WHERE student_id = ?
                ''', (student_id,))
                
                row = cursor.fetchone()
                if row:
                    return StudentProfile(
                        student_id=row[0],
                        name=row[1],
                        native_language=LanguageCode(row[2]),
                        regional_context=RegionalContext(row[3]),
                        state=row[4],
                        city=row[5],
                        age_group=row[6],
                        learning_preferences=json.loads(row[7]) if row[7] else {},
                        concept_mappings=json.loads(row[8]) if row[8] else {},
                        created_at=datetime.fromisoformat(row[9]),
                        updated_at=datetime.fromisoformat(row[10])
                    )
                return None
                
        except Exception as e:
            logger.error(f"Error retrieving student profile: {e}")
            return None
    
    def update_student_profile(self, profile: StudentProfile) -> bool:
        """Update an existing student profile"""
        try:
            profile.updated_at = datetime.now()
            
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    UPDATE student_profiles SET
                        name = ?, native_language = ?, regional_context = ?,
                        state = ?, city = ?, age_group = ?,
                        learning_preferences = ?, concept_mappings = ?, updated_at = ?
                    WHERE student_id = ?
                ''', (
                    profile.name,
                    profile.native_language.value,
                    profile.regional_context.value,
                    profile.state,
                    profile.city,
                    profile.age_group,
                    json.dumps(profile.learning_preferences),
                    json.dumps(profile.concept_mappings),
                    profile.updated_at.isoformat(),
                    profile.student_id
                ))
                
                conn.commit()
                logger.info(f"Updated student profile: {profile.student_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error updating student profile: {e}")
            return False
    
    def add_learning_interaction(self, interaction: LearningInteraction) -> bool:
        """Add a learning interaction record"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    INSERT INTO learning_interactions
                    (interaction_id, student_id, video_id, concepts_encountered,
                     concepts_understood, feedback_rating, time_spent, completion_rate, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    interaction.interaction_id,
                    interaction.student_id,
                    interaction.video_id,
                    json.dumps(interaction.concepts_encountered),
                    json.dumps(interaction.concepts_understood),
                    interaction.feedback_rating,
                    interaction.time_spent,
                    interaction.completion_rate,
                    interaction.timestamp.isoformat()
                ))
                
                conn.commit()
                logger.info(f"Added learning interaction: {interaction.interaction_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error adding learning interaction: {e}")
            return False
    
    def get_student_interactions(self, student_id: str, limit: int = 50) -> List[LearningInteraction]:
        """Get learning interactions for a student"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT * FROM learning_interactions 
                    WHERE student_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (student_id, limit))
                
                interactions = []
                for row in cursor.fetchall():
                    interactions.append(LearningInteraction(
                        interaction_id=row[0],
                        student_id=row[1],
                        video_id=row[2],
                        concepts_encountered=json.loads(row[3]) if row[3] else [],
                        concepts_understood=json.loads(row[4]) if row[4] else [],
                        feedback_rating=row[5],
                        time_spent=row[6],
                        completion_rate=row[7],
                        timestamp=datetime.fromisoformat(row[8])
                    ))
                
                return interactions
                
        except Exception as e:
            logger.error(f"Error retrieving student interactions: {e}")
            return []
    
    def update_concept_mappings(self, student_id: str, new_mappings: Dict[str, str]) -> bool:
        """Update concept mappings for a student based on successful adaptations"""
        try:
            profile = self.get_student_profile(student_id)
            if profile:
                profile.concept_mappings.update(new_mappings)
                return self.update_student_profile(profile)
            return False
            
        except Exception as e:
            logger.error(f"Error updating concept mappings: {e}")
            return False
    
    def get_learning_analytics(self, student_id: str) -> Dict[str, Any]:
        """Get learning analytics for a student"""
        try:
            interactions = self.get_student_interactions(student_id)
            
            if not interactions:
                return {"message": "No learning data available"}
            
            # Calculate analytics
            total_videos = len(set(i.video_id for i in interactions))
            avg_completion = sum(i.completion_rate for i in interactions if i.completion_rate) / len(interactions)
            avg_rating = sum(i.feedback_rating for i in interactions if i.feedback_rating) / len([i for i in interactions if i.feedback_rating])
            total_concepts_learned = len(set(concept for i in interactions for concept in i.concepts_understood))
            
            return {
                "student_id": student_id,
                "total_videos_watched": total_videos,
                "total_interactions": len(interactions),
                "average_completion_rate": round(avg_completion, 2),
                "average_rating": round(avg_rating, 2) if avg_rating else None,
                "total_concepts_learned": total_concepts_learned,
                "last_activity": interactions[0].timestamp.isoformat() if interactions else None
            }
            
        except Exception as e:
            logger.error(f"Error calculating learning analytics: {e}")
            return {"error": str(e)}