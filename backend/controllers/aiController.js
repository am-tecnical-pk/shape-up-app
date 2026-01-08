import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ CRITICAL: GEMINI_API_KEY is missing." });
  }

  const name = userData?.name || "Athlete";
  const fullPrompt = `Role: Fitness Trainer. User: ${name}. Question: "${message}". Keep it short.`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ FIX: Use "gemini-1.5-flash" (Stable & Free)
    // "gemini-2.0-flash-exp" has a 0 limit for many free accounts now.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Google AI Error:", error);

    // Fallback: Try "gemini-pro" if flash fails
    try {
        console.log("⚠️ Switching to Backup model...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (fallbackError) {
         res.status(500).json({ 
            reply: `⚠️ AI Service Unavailable: Please try again later. (Quota/Model Error)` 
        });
    }
  }
});

export { chatWithAI };