// pdf-quiz-simple.mjs - Simplified PDF Quiz Generator using Gemini AI
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Check if API key is provided
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in the .env file");
    console.error("Please add your Gemini API key to the .env file:");
    console.error("GEMINI_API_KEY=your_api_key_here");
    process.exit(1);
}

// Initialize Google Generative AI with API key from environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Express app setup
const app = express();
const port = process.env.PORT || 9002;

// Configure multer for PDF uploads
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

app.use(express.static('./'));
app.use(express.json());

// Extract text from PDF using PDF.js
async function extractTextFromPdf(pdfPath) {
    try {
        console.log("📄 Starting PDF text extraction with PDF.js...");
        
        // Read the PDF file
        const pdfBuffer = fs.readFileSync(pdfPath);
        
        // Convert Buffer to Uint8Array as required by PDF.js
        const pdfData = new Uint8Array(pdfBuffer);
        
        // Load the PDF document
        const loadingTask = pdfjsLib.getDocument({
            data: pdfData,
            verbosity: 0
        });
        
        const pdfDoc = await loadingTask.promise;
        console.log("📄 PDF loaded successfully. Pages:", pdfDoc.numPages);
        
        let fullText = '';
        
        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            try {
                const page = await pdfDoc.getPage(pageNum);
                const textContent = await page.getTextContent();
                
                // Combine all text items from the page
                const pageText = textContent.items
                    .map(item => item.str)
                    .join(' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                if (pageText) {
                    fullText += pageText + '\n\n';
                }
                
                console.log(`📄 Page ${pageNum} processed - ${pageText.length} characters`);
                
            } catch (pageError) {
                console.error(`Error processing page ${pageNum}:`, pageError.message);
                continue; // Skip this page and continue with others
            }
        }
        
        // Clean up the extracted text
        fullText = fullText.trim();
        
        if (fullText.length < 100) {
            throw new Error("Could not extract meaningful text from PDF");
        }
        
        console.log("📄 ✅ Successfully extracted text from PDF");
        console.log("📄 Total text length:", fullText.length, "characters");
        console.log("📄 Text preview:", fullText.substring(0, 300) + "...");
        
        return fullText;
        
    } catch (error) {
        console.error("📄 PDF text extraction error:", error.message);
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
}

// Generate quiz from PDF text using Gemini
async function generateQuizFromText(pdfText) {
    try {
        console.log("🔄 Processing PDF content with Gemini...");
        
        const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
        
        const prompt = `
        Based on the following PDF content, create a comprehensive quiz with 10 multiple-choice questions.
        
        PDF Content:
        ${pdfText.substring(0, 8000)} // Limit content to avoid token limits
        
        For each question, provide:
        1. A clear, well-formulated question based on the content
        2. Four answer options (A, B, C, D)
        3. The correct answer
        4. A detailed explanation of why the answer is correct
        
        Format your response as a JSON object with this structure:
        {
            "quiz": [
                {
                    "id": 1,
                    "question": "Question text here?",
                    "options": {
                        "A": "Option A text",
                        "B": "Option B text", 
                        "C": "Option C text",
                        "D": "Option D text"
                    },
                    "correct_answer": "A",
                    "explanation": "Detailed explanation of why this answer is correct..."
                }
            ]
        }
        
        Make sure the questions cover the main topics and concepts from the document.
        Ensure all questions are answerable based on the provided content.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log("Raw AI Response:", text.substring(0, 500) + "...");
        
        // Clean up the response and extract JSON
        let cleanedText = text.trim();
        
        // Remove markdown code block markers if present
        cleanedText = cleanedText.replace(/```json\s*/, '');
        cleanedText = cleanedText.replace(/```\s*$/, '');
        
        // Find JSON object in the response
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                return parsed;
            } catch (parseError) {
                console.error("JSON parse error:", parseError);
                throw new Error("Failed to parse quiz JSON from AI response");
            }
        } else {
            throw new Error("Could not find valid JSON in AI response");
        }
        
    } catch (error) {
        console.error("Quiz generation error:", error);
        throw error;
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'quiz.html'));
});

app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No PDF file uploaded' });
        }

        console.log("📄 PDF uploaded:", req.file.originalname);
        console.log("📄 PDF size:", req.file.size, "bytes");
        
        // Extract text from PDF
        const pdfText = await extractTextFromPdf(req.file.path);
        console.log("📝 Extracted text length:", pdfText.length, "characters");
        
        if (pdfText.length < 100) {
            throw new Error("PDF appears to be empty or contains very little text");
        }
        
        // Generate quiz from text
        const quizData = await generateQuizFromText(pdfText);
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        
        res.json({
            success: true,
            quiz: quizData.quiz,
            message: `Quiz generated successfully from ${req.file.originalname}`
        });
        
    } catch (error) {
        console.error("Upload error:", error);
        
        // Clean up uploaded file on error
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            error: 'Failed to generate quiz from PDF',
            details: error.message
        });
    }
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Start server
app.listen(port, () => {
    console.log("🚀 PDF Quiz Generator Server");
    console.log("============================");
    console.log(`✅ Server running at: http://localhost:${port}`);
    console.log("📚 Upload PDFs to generate interactive quizzes!");
    console.log("🤖 Powered by Gemini AI");
    console.log("📝 Text extraction using pdf-parse");
});

export default app;
