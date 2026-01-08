import asyncHandler from "express-async-handler";

const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  
  // 1. Load Key Securely
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
      console.error("❌ CRITICAL: GEMINI_API_KEY is missing.");
      return res.status(500).json({ reply: "System Error: API Key missing." });
  }

  // 2. Prepare Context
  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "General Fitness"; 
  const weight = userData?.weight ? `${userData.weight}kg` : "unknown weight";

  const systemInstruction = `
    ROLE:
    You are "Shape Up AI", a world-class personal trainer embedded in the Shape Up app.
    You are talking to **${name}**.
    Their goal is **${goal}**.
    Their weight is **${weight}**.

    APP FEATURES:
    - Nutrition Checker, BMR Calculator, Workout Database, Dashboard.

    RULES:
    1. Be Personalized.
    2. Tone: High energy, professional 🏋️‍♂️🥗.
    3. Brevity: Short answers (max 3 sentences).
    4. Safety: Medical issues -> See a doctor.

    USER SAYS: "${message}"
  `;

  try {
    // 3. AUTO-DETECT MODEL (Your working logic)
    // First, ask Google which models are active for this key
    const modelListResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const listData = await modelListResponse.json();
    
    if (listData.error) {
        throw new Error(listData.error.message);
    }

    // Find a model that supports generating content (prefer Flash, then Pro)
    const validModel = listData.models?.find(m => 
        m.supportedGenerationMethods?.includes("generateContent") && 
        (m.name.includes("flash") || m.name.includes("pro"))
    );

    // Default to a safe fallback if auto-detect fails
    const modelName = validModel ? validModel.name : "models/gemini-1.5-flash";
    console.log(`🧠 AI Selected Model: ${modelName}`);

    // 4. GENERATE CONTENT (Direct Fetch)
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

    const botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's work out! 💪";
    
    res.json({ reply: botReply });

  } catch (error) {
    console.error("❌ AI Controller Error:", error.message);
    res.status(500).json({ reply: "My brain is buffering 🧠. Please try again!" });
  }
});

export { chatWithAI };