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

    // ✅ FIX: Use "gemini-2.0-flash-exp" (Experimental)
    // Stable version ka free quota 0 tha, lekin Experimental version free hota hai.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Google AI Error:", error);

    // Agar Exp bhi fail ho, toh Lite version try karein (Backup)
    try {
        console.log("⚠️ Switching to Lite model...");
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (fallbackError) {
         res.status(500).json({ 
            reply: `⚠️ Quota Error: It seems Google's Free Tier is full or restricted for your key right now. \nDetails: ${error.message}` 
        });
    }
  }
});

export { chatWithAI };