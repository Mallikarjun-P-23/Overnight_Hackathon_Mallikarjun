#!/usr/bin/env python3
"""
Educational Content Localization Demo

This script demonstrates the educational content localizer and pedagogy assistant
that converts English STEM transcripts into regional-language, culturally-localized,
pedagogy-aware lessons.

Usage Example:
    python demo_educational.py

The system performs these tasks:
A) Extract the 6 most important STEM concepts
B) Rewrite transcript into clear, colloquial regional-language text  
C) Replace culturally-opaque examples with locally-meaningful analogies
D) Insert 2 short clarifying sentences addressing regional misconceptions
E) Produce TTS-ready narration (under 250 words)
F) Return misconceptions_addressed list
G) Return analogies_used list
H) Output valid JSON with exact schema
"""

import json
import requests

def demo_educational_localization():
    """Demonstrate the educational content localization system"""
    
    print("🎓 Educational Content Localization Demo")
    print("=" * 50)
    
    # Example inputs following the specification format
    demo_cases = [
        {
            "title": "Physics: Forces and Motion",
            "transcript": """
            Forces and motion are fundamental concepts in physics. When you throw a baseball, 
            several forces act on it. Gravity pulls it down, while air resistance slows it down.
            Heavy objects fall faster than light objects due to their weight. The subway train
            also demonstrates these principles - it needs force to start moving and overcome inertia.
            Understanding motion helps us design better transportation systems.
            """,
            "region_id": "odisha",
            "lang_code": "or"
        },
        {
            "title": "Chemistry: Acids and Bases", 
            "transcript": """
            Acids and bases are important chemical substances. You encounter them daily - 
            when you eat pizza with tomatoes, you're consuming citric acid. All acids are
            dangerous chemicals that burn skin. Acids have pH less than 7, while bases
            have pH greater than 7. When acids and bases react, they form salts and water.
            This reaction is used in many industrial processes.
            """,
            "region_id": "tamil_nadu", 
            "lang_code": "ta"
        }
    ]
    
    server_url = "http://localhost:3050/localize_educational_content"
    
    for i, case in enumerate(demo_cases, 1):
        print(f"\n📚 Demo {i}: {case['title']}")
        print("-" * 40)
        
        # Prepare input data following the exact specification format
        input_data = {
            "transcript_text": case["transcript"].strip(),
            "region_id": case["region_id"],
            "lang_code": case["lang_code"],
            "historic_json": json.dumps({
                "additional_context": f"Demo for {case['region_id']} region",
                "source": "educational_demo"
            })
        }
        
        print("📝 Input:")
        print(f"   Transcript: {case['transcript'][:100]}...")
        print(f"   Region: {case['region_id']}")
        print(f"   Language: {case['lang_code']}")
        
        try:
            # Call the API
            response = requests.post(server_url, json=input_data, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                
                print("\n✅ Localization Result:")
                print(f"🎯 A) Concepts extracted ({len(result['concepts'])}):")
                for concept in result['concepts']:
                    print(f"      • {concept}")
                
                print(f"\n📝 B) Localized text preview:")
                localized = result['localized_text']
                print(f"      {localized[:200]}{'...' if len(localized) > 200 else ''}")
                
                print(f"\n🔄 C) Analogies used ({len(result['analogies_used'])}):")
                for analogy in result['analogies_used']:
                    print(f"      • {analogy['original_example']} → {analogy['replacement']}")
                    print(f"        Context: {analogy['where_in_text']}")
                
                print(f"\n⚠️  D) Misconceptions addressed ({len(result['misconceptions_addressed'])}):")
                for misc in result['misconceptions_addressed']:
                    print(f"      • Misconception: {misc['misconception']}")
                    print(f"        How addressed: {misc['how_addressed']}")
                
                print(f"\n🔊 E) TTS-ready text ({len(result['tts_ready_text'].split())} words):")
                print(f"      {result['tts_ready_text'][:150]}{'...' if len(result['tts_ready_text']) > 150 else ''}")
                
                if 'note' in result:
                    print(f"\n📌 Note: {result['note']}")
                
                print(f"\n✅ JSON Schema Validation:")
                required_keys = ['concepts', 'localized_text', 'tts_ready_text', 
                               'misconceptions_addressed', 'analogies_used']
                for key in required_keys:
                    status = "✓" if key in result else "✗"
                    print(f"      {status} {key}")
                
            else:
                print(f"❌ API Error: {response.status_code}")
                print(f"   {response.text}")
                
        except requests.exceptions.ConnectionError:
            print("❌ Connection failed. Make sure Flask server is running:")
            print("   python app.py")
        except Exception as e:
            print(f"❌ Error: {e}")

def show_regional_data():
    """Display available regional data"""
    print(f"\n🌍 Available Regional Data")
    print("=" * 30)
    
    regions = {
        "odisha": {
            "language": "Odia (or)",
            "sample_analogies": ["baseball → gilli-danda", "skyscraper → Jagannath Temple spire"],
            "sample_misconceptions": ["Heavy objects fall faster", "Atoms are smallest particles"]
        },
        "tamil_nadu": {
            "language": "Tamil (ta)", 
            "sample_analogies": ["baseball → kabaddi", "pizza → dosa"],
            "sample_misconceptions": ["Sound travels faster than light", "Boiling point always 100°C"]
        },
        "west_bengal": {
            "language": "Bengali (bn)",
            "sample_analogies": ["baseball → cricket", "cowboy → fisherman"], 
            "sample_misconceptions": ["Fish can't live in pollution", "All acids are dangerous"]
        }
    }
    
    for region_id, info in regions.items():
        print(f"\n📍 {region_id.title().replace('_', ' ')}")
        print(f"   Language: {info['language']}")
        print(f"   Analogies: {', '.join(info['sample_analogies'])}")
        print(f"   Addresses: {', '.join(info['sample_misconceptions'])}")

if __name__ == "__main__":
    print("🚀 Starting Educational Content Localization Demo\n")
    
    # Show available regional data
    show_regional_data()
    
    # Run the demonstration
    demo_educational_localization()
    
    print(f"\n" + "=" * 50)
    print("🎉 Demo completed!")
    print("\n💡 Tips:")
    print("   • Start Flask server with: python app.py")
    print("   • API endpoint: POST /localize_educational_content")
    print("   • Test with: python test_comprehensive_educational.py")
    print("   • View results at: http://localhost:3050")
