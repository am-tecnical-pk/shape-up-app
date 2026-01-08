import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ ERROR: GEMINI_API_KEY is missing.");
      return res.status(500).json({ reply: "System Error: API Key missing." });
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

    // ✅ FIX: Using a model explicitly allowed by your key
    // We selected "gemini-2.0-flash" from your list.
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ AI Error:", error);
    res.status(500).json({ reply: "I'm having trouble connecting right now. Please try again later!" });
  }
});

export { chatWithAI };