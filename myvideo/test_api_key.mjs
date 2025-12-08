// Test script to verify Gemini API key status
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

async function testApiKey() {
    try {
        console.log("Testing Gemini API key...");
        
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ GEMINI_API_KEY is not set in the .env file");
            return;
        }
        
        console.log("API Key found:", process.env.GEMINI_API_KEY.substring(0, 10) + "...");
        
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = "Hello, this is a test message. Please respond with 'API key is working correctly'.";
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("✅ API Response:", text);
        console.log("✅ API key is working correctly!");
        
    } catch (error) {
        console.error("❌ API key test failed:");
        console.error("Error type:", error.constructor.name);
        console.error("Error message:", error.message);
        
        if (error.message.includes('API_KEY_INVALID')) {
            console.error("🔑 The API key appears to be invalid or revoked");
        } else if (error.message.includes('PERMISSION_DENIED')) {
            console.error("🚫 Permission denied - API key may be blocked or restricted");
        } else if (error.message.includes('QUOTA_EXCEEDED')) {
            console.error("📊 API quota exceeded");
        } else {
            console.error("🔍 Unexpected error - check network connection and API key validity");
        }
    }
}

testApiKey();
