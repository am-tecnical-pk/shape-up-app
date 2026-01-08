import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ CRITICAL: GEMINI_API_KEY is missing.");
      return res.status(500).json({ reply: "System Error: API Key missing." });
  }

  const name = userData?.name || "Athlete";
  const fullPrompt = `Role: Fitness Trainer. User: ${name}. Question: "${message}". Keep it short.`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ FIX: Use "gemini-1.5-flash" (Stable)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ VERCEL AI ERROR:", error);
    res.status(500).json({ 
        reply: "My brain is buffering 🧠. (Model/Quota Error)" 
    });
  }
});

export { chatWithAI };