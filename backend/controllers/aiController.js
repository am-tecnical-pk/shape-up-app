import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ Error: GEMINI_API_KEY is missing in .env" });
  }

  const name = userData?.name || "Athlete";
  const systemInstruction = `Role: Fitness Trainer. User: ${name}. Keep it short. Question: "${message}"`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Using the stable free model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Google AI Error:", error);
    
    // 👇 THIS WILL SHOW THE REAL ERROR ON YOUR SCREEN
    res.status(500).json({ 
        reply: `⚠️ DEBUG ERROR: ${error.message}` 
    });
  }
});

export { chatWithAI };