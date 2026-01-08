import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  // Debug: Log if key is missing (First 4 chars only for safety)
  console.log("🔹 AI Request. Key starts with:", API_KEY ? API_KEY.substring(0, 4) : "MISSING");

  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ Configuration Error: Vercel missing GEMINI_API_KEY." });
  }

  const name = userData?.name || "Athlete";
  const fullPrompt = `
    ROLE: Personal Trainer. User: ${name}.
    Question: "${message}"
    Keep it short.
  `;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ TRYING THE MOST STANDARD MODEL ID FIRST
    // "gemini-1.5-flash" is the current standard. 
    // If this fails, the error message below will tell us why.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    
    res.json({ reply: text });

  } catch (error) {
    console.error("❌ Google AI Error:", error);
    
    // ⚠️ DEBUG MODE: Sending the REAL error to the frontend so you can read it.
    // Copy-paste the message you see in the chat window to me!
    res.status(500).json({ 
        reply: `⚠️ DEBUG ERROR: ${error.message}` 
    });
  }
});

export { chatWithAI };