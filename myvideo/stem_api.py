#!/usr/bin/env python3
"""
Flask API Server for STEM Learning Enhancer
Connects llm2.py functionality to the student dashboard
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os
import json
from datetime import datetime
import traceback

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the STEM Enhancer from llm2.py
try:
    from llm2 import DynamicSTEMEnhancer, Config
    print("✅ Successfully imported STEM Enhancer")
except ImportError as e:
    print(f"❌ Failed to import STEM Enhancer: {e}")
    sys.exit(1)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Global enhancer instance
enhancer = None

def init_enhancer():
    """Initialize the STEM enhancer"""
    global enhancer
    try:
        print("🚀 Initializing STEM Enhancer...")
        enhancer = DynamicSTEMEnhancer()
        print("✅ STEM Enhancer initialized successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize STEM Enhancer: {e}")
        traceback.print_exc()
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'STEM Learning API is running',
        'enhancer_ready': enhancer is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/stem/ask', methods=['POST'])
def ask_question():
    """Main endpoint for asking STEM questions"""
    try:
        if not enhancer:
            return jsonify({
                'error': 'STEM Enhancer not initialized',
                'message': 'The AI service is not ready. Please try again later.'
            }), 500
        
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'message': 'Please provide a JSON payload with your question'
            }), 400
        
        # Extract required fields
        query = data.get('query', '').strip()
        user_id = data.get('user_id', 'anonymous')
        mother_tongue = data.get('mother_tongue', 'english').lower().strip()
        
        if not query:
            return jsonify({
                'error': 'No question provided',
                'message': 'Please provide a question in the "query" field'
            }), 400
        
        # Validate mother tongue
        valid_languages = list(Config.CULTURAL_CONTEXTS.keys())
        if mother_tongue not in valid_languages:
            print(f"⚠️  Invalid language '{mother_tongue}', using 'english'")
            mother_tongue = 'english'
        
        print(f"📥 Processing question: '{query}' for user {user_id} ({mother_tongue})")
        
        # Process the query using the enhancer
        result = enhancer.process_query(user_id, query, mother_tongue)
        
        # Format response for frontend
        response = {
            'success': True,
            'answer': result['output_explanation'],
            'metadata': {
                'domain': result['domain'],
                'mother_tongue': result['mother_tongue'],
                'has_historical_connection': result['has_historical_connection'],
                'historical_connection': result.get('historical_connection', ''),
                'history_count': result['history_count'],
                'key_concepts': result.get('key_concepts', []),
                'difficulty_level': result.get('difficulty_level', 'beginner'),
                'explanation_length_words': result['explanation_length_words']
            },
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"✅ Successfully processed question (domain: {result['domain']}, words: {result['explanation_length_words']})")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error processing question: {e}")
        traceback.print_exc()
        
        return jsonify({
            'error': 'Internal server error',
            'message': f'Failed to process your question: {str(e)}',
            'success': False
        }), 500

@app.route('/api/stem/languages', methods=['GET'])
def get_supported_languages():
    """Get list of supported languages"""
    try:
        languages = []
        for lang_code, context in Config.CULTURAL_CONTEXTS.items():
            languages.append({
                'code': lang_code,
                'name': lang_code.title(),
                'region': context.get('region', 'India')
            })
        
        return jsonify({
            'success': True,
            'languages': languages,
            'default': 'english'
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get languages',
            'message': str(e)
        }), 500

@app.route('/api/stem/user/<user_id>/history', methods=['GET'])
def get_user_history(user_id):
    """Get user's learning history"""
    try:
        if not enhancer:
            return jsonify({'error': 'STEM Enhancer not initialized'}), 500
        
        # Get user profile
        profile = enhancer.user_manager.profiles.get(user_id)
        
        if not profile:
            return jsonify({
                'success': True,
                'history': [],
                'total_queries': 0,
                'message': 'No history found for this user'
            })
        
        # Format history for frontend
        history = profile.get('learning_history', [])
        recent_history = history[-10:]  # Last 10 interactions
        
        formatted_history = []
        for entry in recent_history:
            formatted_history.append({
                'timestamp': entry.get('timestamp', ''),
                'query': entry.get('query', ''),
                'domain': entry.get('domain', 'general'),
                'language': entry.get('mother_tongue', 'english'),
                'preview': entry.get('response_preview', '')
            })
        
        return jsonify({
            'success': True,
            'history': formatted_history,
            'total_queries': profile.get('total_queries', 0),
            'preferred_domains': profile.get('preferred_domains', []),
            'mother_tongue': profile.get('mother_tongue', 'english')
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get user history',
            'message': str(e)
        }), 500

@app.route('/api/stem/stats', methods=['GET'])
def get_stats():
    """Get general statistics"""
    try:
        if not enhancer:
            return jsonify({'error': 'STEM Enhancer not initialized'}), 500
        
        total_users = len(enhancer.user_manager.profiles)
        total_queries = sum(profile.get('total_queries', 0) for profile in enhancer.user_manager.profiles.values())
        
        # Language distribution
        language_stats = {}
        for profile in enhancer.user_manager.profiles.values():
            lang = profile.get('mother_tongue', 'english')
            language_stats[lang] = language_stats.get(lang, 0) + 1
        
        # Domain distribution
        domain_stats = {}
        for profile in enhancer.user_manager.profiles.values():
            for domain in profile.get('preferred_domains', []):
                domain_stats[domain] = domain_stats.get(domain, 0) + 1
        
        return jsonify({
            'success': True,
            'stats': {
                'total_users': total_users,
                'total_queries': total_queries,
                'language_distribution': language_stats,
                'domain_distribution': domain_stats,
                'gemini_enabled': enhancer.gemini_retriever.enabled
            }
        })
        
    except Exception as e:
        return jsonify({
            'error': 'Failed to get stats',
            'message': str(e)
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Not found',
        'message': 'The requested endpoint does not exist'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred'
    }), 500

if __name__ == '__main__':
    print("🚀 Starting STEM Learning API Server...")
    print("="*50)
    
    # Initialize the enhancer
    if init_enhancer():
        print("✅ Initialization complete!")
        print("\n📡 API Endpoints:")
        print("  GET  /health                     - Health check")
        print("  POST /api/stem/ask               - Ask STEM question")
        print("  GET  /api/stem/languages         - Get supported languages")
        print("  GET  /api/stem/user/<id>/history - Get user history")
        print("  GET  /api/stem/stats             - Get statistics")
        print("\n🌐 Starting server on http://localhost:5002")
        print("="*50)
        
        app.run(
            host='0.0.0.0',
            port=5002,
            debug=True,
            use_reloader=False  # Avoid double initialization
        )
    else:
        print("❌ Failed to initialize. Exiting...")
        sys.exit(1)
