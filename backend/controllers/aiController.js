import asyncHandler from "express-async-handler";
import Routine from "../models/RoutineModel.js";
import Diet from "../models/DietModel.js";
import DailyLog from "../models/dailyLogModel.js";
import Workout from "../models/workoutModel.js";
// Keep your existing diet imports
import { generateDietPlan, saveDietPlan, getMyDiet, analyzeFoodImage } from "./aiController_DietPart.js"; 

// --- HELPER: Get Best Available Gemini Model ---
const getBestModel = async (apiKey) => {
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();
    if (!listData.models) return "models/gemini-1.5-flash"; 
    // Prefer Flash for speed, or Pro for complex reasoning
    const bestModel = listData.models.find(m => m.name.includes("flash")) || listData.models.find(m => m.name.includes("pro"));
    return bestModel ? bestModel.name : "models/gemini-1.5-flash";
  } catch (error) { return "models/gemini-1.5-flash"; }
};

// ==========================================
// 1. DAILY BRIEFING (The "Planner")
// ==========================================
const getDailyBriefing = asyncHandler(async (req, res) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  const user = req.user;
  const todayDate = new Date().toISOString().split("T")[0];

  // 1. Fetch Context (History)
  const lastWorkout = await Workout.findOne({ user: user._id }).sort({ createdAt: -1 });
  
  // Find "Yesterday's" Log to see how they did
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLog = await DailyLog.findOne({ user: user._id, date: yesterday.toISOString().split("T")[0] });
  
  // Find or Create "Today's" Log
  let todayLog = await DailyLog.findOne({ user: user._id, date: todayDate });
  if (!todayLog) {
      todayLog = await DailyLog.create({ user: user._id, date: todayDate });
  }

  const modelName = await getBestModel(API_KEY);

  const systemInstruction = `
    ROLE: Elite Personal Trainer "Shape Up Coach".
    CLIENT: ${user.name}, Goal: ${user.goal} (${user.goal === 'Cut' ? 'Lose Fat' : 'Build Muscle'}).
    
    YESTERDAY'S PERFORMANCE:
    - Calories: ${yesterdayLog ? yesterdayLog.calories : "Unknown"}
    - Steps: ${yesterdayLog ? yesterdayLog.steps : "Unknown"}
    
    LAST WORKOUT:
    - ${lastWorkout ? `${lastWorkout.exercises.length} Exercises. Feedback: "${lastWorkout.feedback || 'None'}"` : "No recent workout."}
    
    TASK:
    1. Analyze recovery.
    2. SET GOALS for today (Target Calories & Steps) based on previous activity.
    3. Generate a short 2-sentence motivational briefing.
    
    OUTPUT JSON ONLY:
    { "message": "...", "targetCalories": 2000, "targetSteps": 8000 }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
    });
    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText.includes("```json")) rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
    
    const result = JSON.parse(rawText);

    // --- CRITICAL: SAVE AI GOALS TO DB ---
    todayLog.targetCalories = result.targetCalories || user.macros.calories;
    todayLog.targetSteps = result.targetSteps || 8000;
    await todayLog.save();

    res.json(result);

  } catch (error) { 
      console.error("AI Briefing Error:", error);
      res.json({ message: "Let's stay consistent today! I've updated your targets.", targetCalories: 2000, targetSteps: 8000 }); 
  }
});

// ==========================================
// 2. WORKOUT GENERATION (Adaptive)
// ==========================================
const generateWorkoutPlan = asyncHandler(async (req, res) => {
  const { userData, preferences } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const modelName = await getBestModel(API_KEY);

  // Check past performance/injury
  const lastWorkout = await Workout.findOne({ user: req.user._id }).sort({ createdAt: -1 });
  let adjustments = "";
  if(lastWorkout && lastWorkout.feedback) {
      adjustments = `User's last workout feedback was: "${lastWorkout.feedback}". User rated difficulty (RPE) as ${lastWorkout.rpe}/10. Adjust volume accordingly.`;
  }

  const systemInstruction = `
    ROLE: Strength & Conditioning Coach.
    CLIENT: ${userData.name}, Goal: ${userData.goal}.
    SCHEDULE: ${preferences.daysPerWeek} days/week.
    
    INJURIES/LIMITATIONS: ${preferences.injuries || "None"}.
    ADAPTATION NOTES: ${adjustments}
    
    TASK: Create a structured workout split.
    OUTPUT JSON: { "summary": "...", "schedule": [{ "day": "Day 1", "focus": "...", "warmup": "...", "exercises": [{ "name": "...", "sets": "3", "reps": "10-12" }] }] }
  `;
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
    });
    const data = await response.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (rawText.includes("```json")) rawText = rawText.replace(/```json/g, "").replace(/```/g, "");
    res.json(JSON.parse(rawText));
  } catch (error) { res.status(500).json({ error: "Generation Failed" }); }
});

// ==========================================
// 3. ANALYZE SESSION
// ==========================================
const analyzeWorkoutSession = asyncHandler(async (req, res) => {
    const { workoutId, rpe, feedback } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    const workout = await Workout.findById(workoutId);
    if(!workout) return res.status(404).json({error: "Workout not found"});

    workout.rpe = rpe;
    workout.feedback = feedback;
    await workout.save();

    const modelName = await getBestModel(API_KEY);
    const systemInstruction = `
      Analyze workout session. 
      RPE (Intensity): ${rpe}/10. 
      User Feedback: "${feedback}".
      
      Suggest 2 specific adjustments for next time (e.g., "Increase weight on bench press", "More warmup").
      Output JSON: { "analysis": "...", "nextWeekAdjustments": ["Tip 1", "Tip 2"] }
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
        });
        const data = await response.json();
        let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text.replace(/```json/g, "").replace(/```/g, "");
        res.json(JSON.parse(rawText));
    } catch (error) { res.json({ analysis: "Great effort! Recovery is key.", nextWeekAdjustments: [] }); }
});

// ==========================================
// 4. CHATBOT (The "Central Brain")
// ==========================================
const chatWithAI = asyncHandler(async (req, res) => {
  const { message, userData } = req.body;
  const user = req.user; // Auth middleware provides this
  const API_KEY = process.env.GEMINI_API_KEY;

  // 1. GATHER CONTEXT
  // (What did I eat today? What was my last workout?)
  const todayDate = new Date().toISOString().split("T")[0];
  const todayLog = await DailyLog.findOne({ user: user._id, date: todayDate });
  const lastWorkout = await Workout.findOne({ user: user._id }).sort({ createdAt: -1 });

  // 2. BUILD PROMPT
  const systemInstruction = `
    You are 'Shape Up AI', a friendly but professional fitness coach.
    
    USER PROFILE:
    - Name: ${user.name}
    - Goal: ${user.goal}
    - Weight: ${user.weight}kg
    
    TODAY'S STATUS (${todayDate}):
    - Calories Eaten: ${todayLog ? todayLog.calories : 0} kcal (Target: ${todayLog?.targetCalories || "Not set"})
    - Steps: ${todayLog ? todayLog.steps : 0}
    
    TRAINING CONTEXT:
    - Last Workout: ${lastWorkout ? `${lastWorkout.exercises.length} exercises on ${new Date(lastWorkout.createdAt).toDateString()}` : "No history"}
    
    USER MESSAGE: "${message}"
    
    RESPONSE GUIDELINES:
    - Be concise.
    - If they ask about food, refer to their calories today.
    - If they ask about training, refer to their last workout.
    - Keep it under 3 sentences unless asked for a list.
  `;

  try {
     const modelName = await getBestModel(API_KEY);
     const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
     });
     const data = await response.json();
     const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting to the server. Try again!";
     res.json({ reply });
  } catch (error) {
     console.error("Chatbot Error:", error);
     res.status(500).json({ reply: "My brain is offline momentarily. Please try again." });
  }
});

// ==========================================
// EXPORTS
// ==========================================
export { 
  chatWithAI, generateWorkoutPlan, saveWorkoutPlan, getMyRoutine, adjustRoutine,
  getDailyBriefing, analyzeWorkoutSession,
  generateDietPlan, saveDietPlan, getMyDiet, analyzeFoodImage
};