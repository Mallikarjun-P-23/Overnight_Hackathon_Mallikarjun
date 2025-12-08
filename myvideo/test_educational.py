#!/usr/bin/env python3
"""
Test script for the Educational Content Localization System
"""
import requests
import json

def test_educational_localization():
    """Test the educational localization endpoint"""
    
    # Sample STEM transcript
    sample_transcript = """
    Today we'll learn about gravity and how objects fall. Many people think that heavy objects like a baseball fall faster than light objects. But this is not correct! In physics, we know that all objects fall at the same rate in a vacuum, regardless of their mass. This was famously demonstrated by Galileo from the Leaning Tower of Pisa.
    
    The force of gravity acts on all objects equally. When you drop a baseball and a feather in a vacuum chamber, they hit the ground at the same time. The only reason a feather falls slower in air is because of air resistance, not because of its weight.
    
    This concept is fundamental to understanding motion and acceleration. The acceleration due to gravity on Earth is approximately 9.8 meters per second squared.
    """
    
    # Test for different regions
    regions_to_test = [
        {"region_id": "odisha", "lang_code": "hi"},
        {"region_id": "tamil_nadu", "lang_code": "ta"},
        {"region_id": "west_bengal", "lang_code": "bn"}
    ]
    
    print("🧠 Educational Content Localization Test")
    print("=" * 60)
    
    for region_data in regions_to_test:
        region_id = region_data["region_id"]
        lang_code = region_data["lang_code"]
        
        print(f"\n📍 Testing Region: {region_id.title().replace('_', ' ')}")
        print(f"🗣️  Language: {lang_code}")
        print("-" * 40)
        
        # Prepare the request
        payload = {
            "transcript_text": sample_transcript,
            "region_id": region_id,
            "lang_code": lang_code
        }
        
        try:
            # Make request to the educational localization endpoint
            response = requests.post(
                'http://localhost:3050/process_educational',
                json=payload,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ SUCCESS!")
                print(f"📚 STEM Concepts Extracted: {result.get('concepts', [])}")
                print(f"🔄 Cultural Analogies Used: {len(result.get('analogies_used', []))}")
                print(f"⚠️  Misconceptions Addressed: {len(result.get('misconceptions_addressed', []))}")
                
                if result.get('analogies_used'):
                    print("\n🌍 Cultural Adaptations:")
                    for analogy in result['analogies_used']:
                        print(f"   • {analogy['original_example']} → {analogy['replacement']}")
                
                if result.get('misconceptions_addressed'):
                    print("\n🎯 Misconceptions Corrected:")
                    for misc in result['misconceptions_addressed']:
                        print(f"   • {misc['misconception']}")
                        print(f"     → {misc['how_addressed']}")
                
                print(f"\n🔊 TTS Audio: {result.get('audio_url', 'Not generated')}")
                
                # Show a preview of the localized text
                localized_preview = result.get('localized_text', '')[:200]
                print(f"\n📝 Localized Content Preview:\n   {localized_preview}...")
                
            else:
                print(f"❌ ERROR: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ ERROR: Cannot connect to Flask server")
            print("Make sure the Flask app is running on http://localhost:3050")
            break
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 60)
    print("💡 To test with a YouTube video, use the web interface at:")
    print("   http://localhost:3050")
    print("💡 Select the 'YouTube Video' tab and add '&educational=true' to the URL")

def test_simple_localization():
    """Test the localization function directly (without Flask server)"""
    print("\n🔬 Direct Function Test")
    print("=" * 30)
    
    # Import the functions directly
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        from app import localize_educational_content
        
        sample_text = "Objects fall due to gravity. Heavy objects like baseball fall at same rate as light objects in vacuum."
        
        result = localize_educational_content(sample_text, "odisha", "hi")
        
        print("✅ Direct function test successful!")
        print(f"Concepts: {result['concepts']}")
        print(f"Analogies: {result['analogies_used']}")
        print(f"Misconceptions: {result['misconceptions_addressed']}")
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
    except Exception as e:
        print(f"❌ Function error: {e}")

if __name__ == "__main__":
    print("🎬 Educational Video Translation System Test")
    print("This will test the educational localization features\n")
    
    # Test direct function first
    test_simple_localization()
    
    # Test Flask endpoint
    test_educational_localization()
