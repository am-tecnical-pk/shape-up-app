import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";

const chatWithAI = asyncHandler(async (req, res) => {
  // 1. Get Data from Frontend
  const { message, userData } = req.body;
  
  // 2. Load API Key from Environment Variables (Secure)
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ Error: GEMINI_API_KEY is missing in .env file");
      return res.status(500).json({ reply: "Server Error: API Key missing." });
  }

  // 3. Prepare User Context (Personalization)
  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "General Fitness"; 
  const weight = userData?.weight ? `${userData.weight}kg` : "unknown weight";

  // 4. Create the Persona/Prompt
  const systemInstruction = `
    ROLE:
    You are "Shape Up AI", a world-class personal trainer embedded in the Shape Up app.
    You are talking to **${name}**.
    Their goal is **${goal}**.
    Their weight is **${weight}**.

    APP FEATURES (Guide the user here):
    - **Nutrition Checker**: For logging food calories.
    - **BMR Calculator**: For finding daily calorie needs.
    - **Workout Database**: For finding exercises.
    - **Dashboard**: For tracking progress.

    RULES:
    1. **Be Personalized:** If goal is "Cut", suggest calorie deficits/cardio. If "Bulk", suggest protein/weights.
    2. **Tone:** High energy, professional, use emojis 🏋️‍♂️🥗.
    3. **Brevity:** Keep answers SHORT (max 3 sentences) unless asked for a list.
    4. **Safety:** If asked about medical issues, advise seeing a doctor.

    USER QUESTION: "${message}"
  `;

  try {
    // 5. Initialize Google AI
    const genAI = new GoogleGenerativeAI(API_KEY);

    // ✅ KEY FIX: Use "gemini-1.5-flash"
    // This is the specific model that allows the free tier. 
    // Do not use "auto-detect" or "experimental" models to avoid errors.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 6. Generate Response
    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const botReply = response.text();
    
    // 7. Send back to Frontend
    res.json({ reply: botReply });

  } catch (error) {
    console.error("❌ Google AI Error:", error.message);
    
    // Fallback message if Google is down or key is invalid
    res.status(500).json({ 
        reply: "My brain is buffering 🧠. Please try again in a moment!" 
    });
  }
});

export { chatWithAI };