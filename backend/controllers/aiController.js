import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  console.log("🔹 AI Request Received"); // Debug Log

  // 1. SECURE KEY CHECK
  // We prioritize the Environment Variable. 
  // If it's missing, we log a critical error.
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ CRITICAL ERROR: GEMINI_API_KEY is missing in Vercel Environment Variables.");
      return res.status(500).json({ reply: "System Error: API Key is missing. Please check server settings." });
  }

  // 2. CONTEXT SETUP
  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "General Fitness"; 
  const weight = userData?.weight ? `${userData.weight}kg` : "unknown weight";

  const fullPrompt = `
    ROLE: You are "Shape Up AI", a personal trainer.
    USER: ${name}, Goal: ${goal}, Weight: ${weight}.
    
    YOUR RULES:
    1. Answer strictly about fitness/nutrition.
    2. Keep it short (max 3 sentences).
    3. Be encouraging! 🏋️‍♂️
    
    USER ASKED: "${message}"
  `;

  try {
    // 3. USE GOOGLE SDK (More Stable)
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("✅ AI Response Generated Successfully");
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ AI Generation Failed:", error); // This will show in Vercel Logs
    res.status(500).json({ reply: "My brain is buffering 🧠. Please try again!" });
  }
});

export { chatWithAI };