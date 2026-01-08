import asyncHandler from "express-async-handler";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  // ✅ FIX 1: Use the Environment Variable (Secure)
  // If the env var is missing, it falls back to the hardcoded one (only for local testing)
  const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCQJykgDP-u-_NS0twzrAgyKPIDlb8HUQ4"; 

  // 1. EXTRACT CONTEXT
  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "General Fitness"; 
  const weight = userData?.weight ? `${userData.weight}kg` : "unknown weight";

  // 2. THE MASTER INSTRUCTION (PERSONA)
  const systemInstruction = `
    ROLE:
    You are "Shape Up AI", a world-class personal trainer embedded in the Shape Up app.
    You are talking to **${name}**.
    Their goal is **${goal}**.
    Their weight is **${weight}**.

    APP FEATURES (Guide the user here):
    - **Nutrition Checker**: For logging food calories. (Suggest for diet questions).
    - **BMR Calculator**: For finding daily calorie needs.
    - **Workout Database**: For finding exercises.
    - **Dashboard**: For tracking progress.

    RULES:
    1. **Be Personalized:** If goal is "Cut", suggest calorie deficits/cardio. If "Bulk", suggest protein/weights.
    2. **Tone:** High energy, professional, use emojis 🏋️‍♂️🥗.
    3. **Brevity:** Keep answers SHORT (max 3 sentences) unless asked for a list.
    4. **Safety:** If asked about medical issues, advise seeing a doctor.

    USER SAYS: "${message}"
  `;

  try {
    // ✅ FIX 2: Skip the "List Models" fetch. Just use the fastest model directly.
    // This prevents Vercel timeouts.
    const modelName = "models/gemini-1.5-flash";

    // 3. GENERATE CONTENT DIRECTLY
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemInstruction }] }],
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
        console.error("Google API Error:", JSON.stringify(data));
        throw new Error(data.error?.message || "Google Refused Connection");
    }

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's work out! 💪 (No text returned)";
    
    res.json({ reply: botReply });

  } catch (error) {
    console.error("❌ AI Controller Error:", error.message);
    // Return a friendly error so the frontend doesn't crash
    res.status(500).json({ reply: "My brain is buffering 🧠. Please try again in a moment!" });
  }
});

export { chatWithAI };