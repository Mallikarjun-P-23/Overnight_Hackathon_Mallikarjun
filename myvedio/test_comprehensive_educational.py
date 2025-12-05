#!/usr/bin/env python3
"""
Comprehensive test script for educational content localization API
Tests the /localize_educational_content endpoint with various STEM transcripts
"""

import requests
import json
import sys

# Test server URL
BASE_URL = "http://localhost:3050"

def test_educational_localization():
    """Test the comprehensive educational localization endpoint"""
    
    # Test cases with different STEM topics and regions
    test_cases = [
        {
            "name": "Physics - Gravity (Odisha)",
            "data": {
                "transcript_text": "Today we'll learn about gravity. When you drop a baseball, it falls to the ground. This happens because of gravitational force. Heavy objects like rocks fall faster than light objects like feathers. The force of gravity pulls everything towards Earth's center.",
                "region_id": "odisha", 
                "lang_code": "or",
                "historic_json": json.dumps({
                    "additional_misconceptions": [
                        {"topic": "physics", "misconception": "Heavier things always fall faster", "correction": "In vacuum, all objects fall at the same rate"}
                    ]
                })
            }
        },
        {
            "name": "Chemistry - Acids (Tamil Nadu)", 
            "data": {
                "transcript_text": "Acids are chemical substances found in many places. You might have pizza with tomatoes that contain citric acid. All acids are dangerous and can burn your skin. Acids have a pH less than 7 and react with bases to form salts.",
                "region_id": "tamil_nadu",
                "lang_code": "ta"
            }
        },
        {
            "name": "Biology - Photosynthesis (West Bengal)",
            "data": {
                "transcript_text": "Plants are amazing organisms that can make their own food through photosynthesis. Like a cowboy working in the field, plants work during the day using sunlight. Plants don't breathe like animals do. They use carbon dioxide and water to create glucose and oxygen.",
                "region_id": "west_bengal", 
                "lang_code": "bn"
            }
        },
        {
            "name": "Mathematics - Division (Unsupported Language)",
            "data": {
                "transcript_text": "Division is a fundamental mathematical operation. When we divide by zero, we get infinity. This is an important concept in algebra and calculus.",
                "region_id": "tamil_nadu",
                "lang_code": "xyz"  # Unsupported language code
            }
        }
    ]
    
    print("🧪 Testing Educational Content Localization API")
    print("=" * 60)
    
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n📚 Test {i}: {test_case['name']}")
        print("-" * 40)
        
        try:
            response = requests.post(
                f"{BASE_URL}/localize_educational_content",
                json=test_case["data"],
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                
                print("✅ Request successful!")
                print(f"📝 Concepts extracted: {len(result.get('concepts', []))}")
                print(f"   {result.get('concepts', [])}")
                
                print(f"\n🌍 Analogies used: {len(result.get('analogies_used', []))}")
                for analogy in result.get('analogies_used', []):
                    print(f"   • {analogy['original_example']} → {analogy['replacement']}")
                
                print(f"\n🎯 Misconceptions addressed: {len(result.get('misconceptions_addressed', []))}")
                for misc in result.get('misconceptions_addressed', []):
                    print(f"   • {misc['misconception']}")
                    print(f"     How: {misc['how_addressed']}")
                
                print(f"\n📜 Localized text preview:")
                localized = result.get('localized_text', '')
                print(f"   {localized[:200]}{'...' if len(localized) > 200 else ''}")
                
                print(f"\n🔊 TTS text length: {len(result.get('tts_ready_text', '').split())} words")
                
                if 'note' in result:
                    print(f"⚠️  Note: {result['note']}")
                
            else:
                print(f"❌ Request failed with status {response.status_code}")
                print(f"   Error: {response.text}")
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            print("   Make sure the Flask server is running on port 3050")
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
    
    print(f"\n" + "=" * 60)
    print("✨ Testing completed!")

def test_function_directly():
    """Test the localize_educational_content function directly"""
    print("\n🔬 Direct Function Testing")
    print("=" * 30)
    
    # Import the function (assumes this script is run from the same directory)
    try:
        sys.path.append('.')
        from app import localize_educational_content
        
        test_transcript = "Gravity affects all objects equally. When you drop a baseball and a feather, many people think the baseball falls faster. This demonstrates the concept of gravitational acceleration."
        
        result = localize_educational_content(test_transcript, "odisha", "hi")
        
        print("✅ Direct function call successful!")
        print(f"📝 Result keys: {list(result.keys())}")
        print(f"🎯 Concepts: {result['concepts']}")
        print(f"🌍 Analogies: {len(result['analogies_used'])}")
        print(f"🎯 Misconceptions: {len(result['misconceptions_addressed'])}")
        
    except ImportError as e:
        print(f"❌ Cannot import function: {e}")
    except Exception as e:
        print(f"❌ Function test failed: {e}")

if __name__ == "__main__":
    print("🚀 Starting Educational Content Localization Tests")
    
    # Test the API endpoint
    test_educational_localization()
    
    # Test the function directly
    test_function_directly()
    
    print("\n🎉 All tests completed!")
    print("💡 To run the Flask app: python app.py")
