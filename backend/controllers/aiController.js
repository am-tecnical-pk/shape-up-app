import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ CRITICAL: GEMINI_API_KEY is missing in Vercel." });
  }

  // User Context
  const name = userData?.name || "Athlete";
  const fullPrompt = `Role: Fitness Trainer. User: ${name}. Question: "${message}". Keep it short.`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ FIX: Use "gemini-2.0-flash" 
    // Your account only has access to the newest V2 models.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Google AI Error:", error);

    // If 2.0 fails, try the generic "gemini-pro" as a last resort
    try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (fallbackError) {
         res.status(500).json({ 
            reply: `⚠️ All models failed. Your specific API Key doesn't support 1.5 or 2.0 Flash. Error: ${error.message}` 
        });
    }
  }
});

export { chatWithAI };