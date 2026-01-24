import asyncHandler from "express-async-handler";
import Diet from "../models/DietModel.js";

// Helper for AI Model Selection
const getBestModel = async (apiKey) => {
    try {
      const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const listData = await listResponse.json();
      if (!listData.models) return "models/gemini-1.5-flash"; 
      const bestModel = listData.models.find(m => m.name.includes("flash")) || listData.models.find(m => m.name.includes("pro"));
      return bestModel ? bestModel.name : "models/gemini-1.5-flash";
    } catch (error) { return "models/gemini-1.5-flash"; }
};

// 1. GENERATE DIET PLAN
const generateDietPlan = asyncHandler(async (req, res) => {
  const { userData, preferences } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API Key missing." });

  const name = userData?.name || "Athlete";
  const goal = userData?.goal || "Maintain";
  // Use Calculated Macros from User Profile if available
  const targetCalories = userData?.macros?.calories || 2000;
  const targetProtein = userData?.macros?.protein || 150;

  const modelName = await getBestModel(API_KEY);

  const systemInstruction = `
    ROLE: Elite Sports Nutritionist for ${name}.
    GOAL: ${goal} (Target: ${targetCalories} kcal, ${targetProtein}g Protein).
    
    PREFERENCES:
    - Type: ${preferences.dietType || "Standard"}
    - Cuisine: ${preferences.cuisine || "Mixed"}
    - Allergies: ${preferences.allergies || "None"}

    TASK: Create a 1-day meal plan strictly following the macro targets.
    OUTPUT FORMAT (Strict JSON):
    {
      "summary": "High protein plan strategy.",
      "macros": { "protein": ${targetProtein}, "carbs": 0, "fats": 0, "calories": ${targetCalories} },
      "meals": [
        {
          "name": "Breakfast",
          "foodItems": ["2 Eggs", "Oatmeal (50g)"],
          "calories": 350,
          "protein": 20,
          "notes": "Quick & Easy"
        },
        {
          "name": "Lunch",
          "foodItems": ["Chicken Breast (150g)", "Rice (100g)"],
          "calories": 500,
          "protein": 40,
          "notes": "Pre-cook batch"
        },
        { "name": "Dinner", "foodItems": [], "calories": 0, "protein": 0, "notes": "" },
        { "name": "Snack", "foodItems": [], "calories": 0, "protein": 0, "notes": "" }
      ]
    }
  `;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] }),
      }
    );

    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText.includes("```json")) rawText = rawText.replace(/```json/g, "").replace(/```/g, "");

    const dietPlan = JSON.parse(rawText);
    res.json(dietPlan);

  } catch (error) {
    console.error("Diet AI Error:", error);
    res.status(500).json({ error: "Failed to generate diet." });
  }
});

// 2. SAVE DIET
const saveDietPlan = asyncHandler(async (req, res) => {
    const { plan } = req.body;
    await Diet.updateMany({ user: req.user._id }, { isActive: false });

    const diet = await Diet.create({
        user: req.user._id,
        goal: req.user.goal,
        calories: plan.macros.calories,
        macros: plan.macros,
        meals: plan.meals,
        isActive: true
    });
    res.status(201).json(diet);
});

// 3. GET DIET
const getMyDiet = asyncHandler(async (req, res) => {
    const diet = await Diet.findOne({ user: req.user._id, isActive: true });
    if (diet) res.json(diet);
    else res.status(404).json({ message: "No active diet found." });
});

// 4. VISION AI
const analyzeFoodImage = asyncHandler(async (req, res) => {
  const { imageBase64 } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: "API Key missing." });
  
  const systemInstruction = `
    TASK: Analyze this food image. Estimate nutritional content for 1 serving.
    OUTPUT JSON: { "name": "Food Name", "calories": 0, "protein": 0, "carbs": 0, "fat": 0, "confidence": "High" }
  `;

  try {
    const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }, { inline_data: { mime_type: "image/jpeg", data: cleanBase64 } }] }] }),
      }
    );
    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText && rawText.includes("```json")) rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
    res.json(JSON.parse(rawText));
  } catch (error) {
    res.status(500).json({ error: "Failed to analyze image." });
  }
});

export { generateDietPlan, saveDietPlan, getMyDiet, analyzeFoodImage };