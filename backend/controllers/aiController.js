import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ reply: "❌ Key missing." });

  // 1. Setup Context
  const name = userData?.name || "Athlete";
  const fullPrompt = `Role: Fitness Trainer. User: ${name}. Question: "${message}". Keep it short.`;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Try the standard model first
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return res.json({ reply: response.text() });

  } catch (error) {
    console.error("❌ Generation Failed. Fetching available models...");

    try {
        // 🚨 AUTO-DEBUGGER: Ask Google what models ARE available for this key
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const listData = await listResponse.json();

        if (listData.models) {
            // Filter for models that support "generateContent"
            const validModels = listData.models
                .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
                .map(m => m.name.replace("models/", "")) // Clean up names
                .join(", ");

            // 👇 RETURN THE LIST TO YOUR CHAT WINDOW
            return res.status(500).json({ 
                reply: `⚠️ YOUR KEY HAS ACCESS TO THESE MODELS ONLY:\n\n${validModels}\n\n(Tell me one of these names!)` 
            });
        } else {
            return res.status(500).json({ 
                reply: `❌ NO MODELS FOUND. Error: ${JSON.stringify(listData)}` 
            });
        }

    } catch (fetchError) {
        return res.status(500).json({ reply: `❌ CRITICAL FAILURE: ${fetchError.message}` });
    }
  }
});

export { chatWithAI };