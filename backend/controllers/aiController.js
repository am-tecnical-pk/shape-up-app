import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing in Vercel Environment Variables.");
      return res.status(500).json({ reply: "System Error: API Key is missing." });
  }

  const name = userData?.name || "Athlete";
  // Create a context-aware prompt
  const fullPrompt = `
    Role: Fitness Trainer. 
    User Name: ${name}. 
    User Question: "${message}". 
    Keep the answer short, motivating, and helpful.
  `;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ FIX: Using "gemini-1.5-flash" 
    // This model is currently the most reliable Free Tier model on Vercel.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    res.json({ reply: response.text() });

  } catch (error) {
    // This log will appear in your Vercel Function Logs
    console.error("❌ VERCEL AI ERROR:", error);

    res.status(500).json({ 
        reply: "My brain is buffering 🧠. (Server Error: Check Vercel Logs)" 
    });
  }
});

export { chatWithAI };