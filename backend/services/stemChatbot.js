const { GoogleGenerativeAI } = require('@google/generative-ai');
const UserProfile = require('../models/UserProfile');

class STEMChatbotService {
  constructor() {
    this.genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    this.culturalContexts = {
      kannada: {
        region: "Karnataka",
        examples: ["ಕಾವೇರಿ ನದಿ", "ರೈತರು", "ಎತ್ತು", "ಬಾವಿ", "ಹೊಲ", "ತೆಂಗಿನಕಾಯಿ"]
      },
      hindi: {
        region: "North India", 
        examples: ["गंगा नदी", "किसान", "बैल", "कुआँ", "खेत", "नारियल"]
      },
      english: {
        region: "India",
        examples: ["river flow", "farmers", "tractor", "well water", "fields", "coconut"]
      },
      telugu: {
        region: "Andhra Pradesh/Telangana",
        examples: ["గోదావరి నది", "రైతులు", "ట్రాక్టర్", "బావి నీరు", "చేలు", "కొబ్బరి"]
      },
      tamil: {
        region: "Tamil Nadu",
        examples: ["காவிரி ஆறு", "விவசாயிகள்", "டிராக்டர்", "கிணறு தண்ணீர்", "வயல்கள்", "தேங்காய்"]
      },
      bengali: {
        region: "West Bengal",
        examples: ["গঙ্গা নদী", "কৃষক", "ট্র্যাক্টর", "কূপের জল", "খেত", "নারকেল"]
      },
      marathi: {
        region: "Maharashtra",
        examples: ["गोदावरी नदी", "शेतकरी", "ट्रॅक्टर", "विहिरीचे पाणी", "शेत", "नारळ"]
      },
      gujarati: {
        region: "Gujarat",
        examples: ["નર્મદા નદી", "ખેડૂતો", "ટ્રેક્ટર", "કૂવાનું પાણી", "ખેતર", "નાળિયેર"]
      },
      punjabi: {
        region: "Punjab",
        examples: ["ਸਤਲੁਜ ਦਰਿਆ", "ਕਿਸਾਨ", "ਟ੍ਰੈਕਟਰ", "ਕੂਏਂ ਦਾ ਪਾਣੀ", "ਖੇਤ", "ਨਾਰੀਅਲ"]
      },
      malayalam: {
        region: "Kerala",
        examples: ["പെരിയാർ നദി", "കർഷകർ", "ട്രാക്ടർ", "ക്ഷേത്രക്കിണർ വെള്ളം", "വയലുകൾ", "തേങ്ങ"]
      },
      odia: {
        region: "Odisha",
        examples: ["ମହାନଦୀ", "କୃଷକ", "ଗାଈ", "କୂଅ", "ଖେତ", "ନଡିଆ"]
      }
    };
  }

  async getOrCreateProfile(userId, motherTongue = 'english') {
    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      // Create initial learning history for immediate historical connections
      const initialHistory = this.createInitialHistory(motherTongue);
      
      profile = new UserProfile({
        userId,
        motherTongue: motherTongue.toLowerCase(),
        learningHistory: initialHistory,
        preferredDomains: ['physics'],
        totalQueries: initialHistory.length,
        queryPatterns: []
      });
      
      await profile.save();
    }
    
    return profile;
  }

  createInitialHistory(motherTongue) {
    const historyTemplates = {
      kannada: [
        { query: "ವೇಗ ಎಂದರೇನು?", domain: "physics", responsePreview: "ವೇಗ ಎಂದರೆ ವಸ್ತುವಿನ ಚಲನೆಯ ದರ" },
        { query: "ಬಲ ಎಂದರೇನು?", domain: "physics", responsePreview: "ಬಲ ಎಂದರೆ ತಳ್ಳುವಿಕೆ ಅಥವಾ ಎಳೆಯುವಿಕೆ" }
      ],
      hindi: [
        { query: "वेग क्या है?", domain: "physics", responsePreview: "वेग वस्तु की गति की दर है" },
        { query: "बल क्या है?", domain: "physics", responsePreview: "बल धक्का या खींच है" }
      ],
      english: [
        { query: "What is velocity?", domain: "physics", responsePreview: "Velocity is the rate of motion" },
        { query: "What is force?", domain: "physics", responsePreview: "Force is push or pull" }
      ]
    };

    const template = historyTemplates[motherTongue] || historyTemplates.english;
    return template.map(item => ({
      ...item,
      motherTongue,
      timestamp: new Date()
    }));
  }

  async analyzeQueryWithHistory(query, motherTongue, userHistory) {
    try {
      const historyText = userHistory.slice(-5).map((h, i) => 
        `Interaction ${i + 1}:\n  Time: ${h.timestamp.toISOString().slice(0, 10)}\n  Domain: ${h.domain}\n  Query: ${h.query}\n  Language: ${h.motherTongue}`
      ).join('\n');

      const culturalContext = this.culturalContexts[motherTongue] || this.culturalContexts.english;
      
      const prompt = `You are analyzing a STEM learning query from a student. Find connections between the current query and the student's learning history.

STUDENT PROFILE:
- Mother tongue: ${motherTongue}
- Region: ${culturalContext.region}

CURRENT QUERY:
"${query}"

STUDENT'S LEARNING HISTORY:
${historyText || "No previous learning history available."}

Analyze and find ALL possible connections. Provide your analysis in this EXACT JSON format:
{
  "detected_domain": "physics/chemistry/math/general",
  "has_historical_connection": true/false,
  "historical_connection": "Detailed explanation of how this connects to past learning",
  "related_previous_queries": ["query1", "query2"],
  "build_on_concepts": ["concept1", "concept2"],
  "suggested_approach": "How to explain this while connecting to past learning",
  "difficulty_level": "beginner/intermediate/advanced",
  "key_concepts": ["main_concept1", "main_concept2"]
}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json|```/g, '').trim();
      
      let analysis = JSON.parse(responseText);
      
      // Force historical connection if there's history
      if (userHistory.length > 0) {
        analysis.has_historical_connection = true;
        if (!analysis.historical_connection || analysis.historical_connection.length < 20) {
          analysis.historical_connection = `This builds on your general science learning in ${motherTongue}. Each new concept helps strengthen your understanding of STEM subjects.`;
        }
      }
      
      return analysis;
    } catch (error) {
      console.error('Gemini analysis error:', error);
      return this.mockAnalysisWithHistory(query, motherTongue, userHistory);
    }
  }

  mockAnalysisWithHistory(query, motherTongue, userHistory) {
    const queryLower = query.toLowerCase();
    let domain = 'general';
    
    if (queryLower.includes('nacl') || queryLower.includes('sodium') || queryLower.includes('chemical')) {
      domain = 'chemistry';
    } else if (queryLower.includes('velocity') || queryLower.includes('force') || queryLower.includes('motion')) {
      domain = 'physics';
    } else if (queryLower.includes('calculate') || queryLower.includes('math') || queryLower.includes('equation')) {
      domain = 'math';
    }

    const hasConnection = userHistory.length > 0;
    let connectionText = "This is a great starting point for your STEM learning journey!";
    
    if (hasConnection) {
      connectionText = `This builds on your previous learning in ${motherTongue}. Your recent questions show your growing interest in science.`;
    }

    return {
      detected_domain: domain,
      has_historical_connection: hasConnection,
      historical_connection: connectionText,
      related_previous_queries: userHistory.slice(-2).map(h => h.query),
      build_on_concepts: [domain],
      suggested_approach: `Explain with ${motherTongue} examples and connect to daily life`,
      difficulty_level: "beginner",
      key_concepts: [domain]
    };
  }

  async generateExplanationWithHistory(query, domain, motherTongue, historicalContext, hasConnection, relatedQueries, buildConcepts) {
    try {
      const culturalContext = this.culturalContexts[motherTongue] || this.culturalContexts.english;
      
      let historySection = "";
      if (hasConnection && historicalContext) {
        historySection = `\n\nHISTORICAL CONTEXT TO INCORPORATE:\n${historicalContext}`;
        if (relatedQueries) {
          historySection += `\nRelated previous queries: ${relatedQueries.join(', ')}`;
        }
      }

      const prompt = `You are a STEM educator explaining ${domain} concepts to a ${motherTongue}-speaking student from ${culturalContext.region}.

STUDENT'S CURRENT QUERY:
"${query}"

${historySection || "This is a new topic for the student."}

INSTRUCTIONS:
1. Explain in clear, simple ${motherTongue} language
2. Use practical examples from daily life in ${culturalContext.region}
3. If there's historical context, EXPLICITLY connect to it in your explanation
4. Make the explanation engaging and relatable
5. Keep it concise but comprehensive (150-200 words)
6. Include ${motherTongue} terms for key concepts when helpful

FORMAT:
- Start with a clear answer to the query
- Provide 2-3 relevant examples from ${culturalContext.region}
- Explain the scientific concept simply
- If historical context exists, say something like "Building on what you learned before..." or "This relates to your previous question about..."
- End with a practical application or thought question

IMPORTANT: The student should feel their learning journey is continuous and connected.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error) {
      console.error('Gemini generation error:', error);
      return this.mockExplanationWithHistory(query, domain, motherTongue, hasConnection, historicalContext);
    }
  }

  mockExplanationWithHistory(query, domain, motherTongue, hasConnection, historicalContext) {
    const culturalContext = this.culturalContexts[motherTongue] || this.culturalContexts.english;
    
    let connectionPart = "";
    if (hasConnection && historicalContext) {
      connectionPart = `Building on your previous learning: ${historicalContext}\n\n`;
    }

    return `${connectionPart}This is a ${domain} concept: ${query}

In ${culturalContext.region}, you can observe this in:
• Objects falling from trees (gravity in action)
• Vehicles moving on roads (motion and force)  
• Water flowing in rivers (natural physics)

Understanding this helps explain everyday phenomena around you.

Think about: Where do you see this in your daily life in ${culturalContext.region}?`;
  }

  async updateHistory(userId, query, domain, motherTongue, responsePreview) {
    const profile = await UserProfile.findOne({ userId });
    if (!profile) return;

    const entry = {
      timestamp: new Date(),
      query: query.substring(0, 100),
      domain,
      motherTongue,
      responsePreview: responsePreview.substring(0, 80)
    };

    profile.learningHistory.push(entry);
    
    // Keep only last 50 entries
    if (profile.learningHistory.length > 50) {
      profile.learningHistory = profile.learningHistory.slice(-50);
    }

    // Update preferred domains
    if (!profile.preferredDomains.includes(domain)) {
      profile.preferredDomains.push(domain);
    }

    profile.totalQueries += 1;
    profile.updatedAt = new Date();

    await profile.save();
  }

  async processQuery(userId, query, motherTongue = 'english') {
    try {
      // Get or create user profile
      const profile = await this.getOrCreateProfile(userId, motherTongue);
      
      // Analyze query with history
      const analysis = await this.analyzeQueryWithHistory(query, motherTongue, profile.learningHistory);
      
      // Generate explanation with historical context
      const explanation = await this.generateExplanationWithHistory(
        query,
        analysis.detected_domain,
        motherTongue,
        analysis.historical_connection,
        analysis.has_historical_connection,
        analysis.related_previous_queries,
        analysis.build_on_concepts
      );

      // Update user history
      const responsePreview = explanation.substring(0, 80) + "...";
      await this.updateHistory(userId, query, analysis.detected_domain, motherTongue, responsePreview);

      return {
        query,
        explanation,
        domain: analysis.detected_domain,
        motherTongue,
        hasHistoricalConnection: analysis.has_historical_connection,
        historicalConnection: analysis.historical_connection,
        historyCount: profile.learningHistory.length,
        keyConcepts: analysis.key_concepts,
        difficultyLevel: analysis.difficulty_level
      };
    } catch (error) {
      console.error('STEM Chatbot processing error:', error);
      throw new Error('Failed to process STEM query');
    }
  }
}

module.exports = new STEMChatbotService();