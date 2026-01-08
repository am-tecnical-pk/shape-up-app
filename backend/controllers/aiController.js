import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  // ✅ THIS LINE IS CRITICAL: It reads the key you just saved in Vercel
  const API_KEY = process.env.GEMINI_API_KEY;

  console.log("🔹 AI Request Received. Key exists?", !!API_KEY); 

  if (!API_KEY) {
      console.error("❌ ERROR: Vercel does not have the GEMINI_API_KEY set.");
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
    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate Response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ AI Error:", error);
    // Send the actual error to the frontend so we can see what's wrong
    res.status(500).json({ reply: `Error: ${error.message}` });
  }
});

export { chatWithAI };