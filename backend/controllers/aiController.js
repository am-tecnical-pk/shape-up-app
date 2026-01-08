import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
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

    // ✅ FIX: Use "gemini-1.5-flash-001" or "gemini-pro" which are more stable
    // "gemini-1.5-flash" sometimes errors out on specific API versions.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    // Generate Response
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ AI Error:", error);
    
    // Fallback: If Flash fails, try the older robust model "gemini-pro" automatically
    try {
        if (error.message.includes("not found") || error.message.includes("404")) {
            console.log("⚠️ Retrying with gemini-pro...");
            const genAI = new GoogleGenerativeAI(API_KEY);
            const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await fallbackModel.generateContent(fullPrompt);
            const response = await result.response;
            res.json({ reply: response.text() });
            return;
        }
    } catch (fallbackError) {
        console.error("❌ Fallback Failed:", fallbackError);
    }

    res.status(500).json({ reply: "I'm having trouble connecting right now. Please try again later!" });
  }
});

export { chatWithAI };