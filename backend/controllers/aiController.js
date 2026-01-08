import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  // 1. Check if Key exists in Vercel
  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ CRITICAL: GEMINI_API_KEY is missing in Vercel Settings." });
  }

  // 2. Check for Spaces in Key (Common Mistake)
  if (API_KEY.includes(" ")) {
      return res.status(500).json({ reply: "❌ CRITICAL: API Key contains spaces. Go to Vercel and remove spaces from the key." });
  }

  const name = userData?.name || "Athlete";
  const fullPrompt = `Role: Fitness Trainer. User: ${name}. Question: "${message}". Keep it short.`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // Try Standard Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Google AI Error:", error);

    // 🚨 DEBUG MODE: Show the REAL error to the user
    // Is error ko copy karke mujhe bhejein!
    res.status(500).json({ 
        reply: `⚠️ ERROR DETAILS:\n\n${error.message}\n\n(Paste this here!)` 
    });
  }
});

export { chatWithAI };