import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  // Vercel se nayi key uthayega
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ ERROR: GEMINI_API_KEY missing in Vercel.");
      return res.status(500).json({ reply: "Configuration Error: API Key missing." });
  }

  // User Context Setup
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

    // ✅ Naye Project ke liye "gemini-1.5-flash" best aur fast hai
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ Model Failed:", error.message);

    // Agar Flash fail ho, toh backup "gemini-pro" try karein
    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        res.json({ reply: response.text() });
    } catch (finalError) {
        console.error("❌ All Models Failed:", finalError.message);
        res.status(500).json({ 
            reply: "I'm having trouble connecting to the new AI brain. Please check your API Key settings." 
        });
    }
  }
});

export { chatWithAI };