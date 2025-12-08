// List available models to check API key validity
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

async function listAvailableModels() {
    try {
        console.log("Checking available Gemini models...");
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY is not set in the .env file");
            return;
        }
        
        console.log("API Key found:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try to list models to verify API key validity
        const models = await genAI.listModels();
        
        console.log("✅ API key is valid! Available models:");
        models.forEach(model => {
            console.log("-", model.name);
        });
        
    } catch (error) {
        console.error("❌ API key check failed:");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('403')) {
            console.error("🔑 The API key appears to be invalid, blocked, or revoked");
            console.error("📝 This often happens when:");
            console.error("   - The API key was compromised and blocked by Google");
            console.error("   - The API key was leaked in a public repository");
            console.error("   - The API key has expired");
            console.error("   - The API key doesn't have proper permissions");
            console.error("");
            console.error("🔧 Solution: Generate a new API key from Google AI Studio:");
            console.error("   https://makersuite.google.com/app/apikey");
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error("🚫 Permission denied - API key may be restricted");
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error("📊 API quota exceeded");
        } else {
            console.error("🔍 Unexpected error - check network connection");
        }
    }
}

listAvailableModels();
