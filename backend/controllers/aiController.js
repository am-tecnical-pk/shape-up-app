import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  const API_KEY = process.env.GEMINI_API_KEY;

  // 1. Check if Key exists and looks valid
  if (!API_KEY) {
      return res.status(500).json({ reply: "❌ CRITICAL: GEMINI_API_KEY is missing from Vercel." });
  }
  if (!API_KEY.startsWith("AIza")) {
      return res.status(500).json({ reply: `❌ CRITICAL: Invalid Key format. It starts with '${API_KEY.substring(0,3)}...', but should start with 'AIza'. Check for spaces!` });
  }

  const name = userData?.name || "Athlete";
  const fullPrompt = `Trainer for ${name}. Question: "${message}". Keep it short.`;

  const genAI = new GoogleGenerativeAI(API_KEY);

  try {
    // 2. Try the Newest Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return res.json({ reply: response.text() });

  } catch (error1) {
    console.error("Attempt 1 Failed:", error1.message);

    try {
        // 3. Try the Older Stable Model
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await fallbackModel.generateContent(fullPrompt);
        const response = await result.response;
        return res.json({ reply: "✅ (Backup Model): " + response.text() });

    } catch (error2) {
        console.error("Attempt 2 Failed:", error2.message);
        
        // 4. RETURN BOTH ERRORS TO THE CHAT
        // Paste this output back to me!
        return res.status(500).json({ 
            reply: `🚫 ALL FAILED. \n\nErr1: ${error1.message} \n\nErr2: ${error2.message}` 
        });
    }
  }
});

export { chatWithAI };