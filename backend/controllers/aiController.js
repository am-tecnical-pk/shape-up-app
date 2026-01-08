import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ ERROR: GEMINI_API_KEY is missing.");
      return res.status(500).json({ reply: "System Error: API Key missing." });
  }

  // User Context
  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "General Fitness"; 
  const weight = userData?.weight ? `${userData.weight}kg` : "unknown";

  const fullPrompt = `
    ROLE: You are "Shape Up AI", a fitness trainer.
    USER: ${name}, Goal: ${goal}, Weight: ${weight}.
    RULES: Keep answers short (max 3 sentences). Be motivating!
    QUESTION: "${message}"
  `;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ FIX: Use the specific version ID "gemini-1.5-flash-001"
    // The short name "gemini-1.5-flash" was causing the 404 error.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ Flash Model Failed, trying Backup:", error.message);

    // 🔄 FALLBACK: If Flash fails, switch to the standard "gemini-pro"
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });

    } catch (fallbackError) {
        console.error("❌ Both Models Failed:", fallbackError);
        res.status(500).json({ reply: "I'm having trouble connecting to Google AI right now. Please try again later!" });
    }
  }
});

export { chatWithAI };