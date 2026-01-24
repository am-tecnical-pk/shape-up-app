import asyncHandler from "express-async-handler";
import Routine from "../models/RoutineModel.js";
import DailyLog from "../models/dailyLogModel.js";
import Workout from "../models/workoutModel.js";
// Import Diet Functions from the new file
import { generateDietPlan, saveDietPlan, getMyDiet, analyzeFoodImage } from "./aiController_DietPart.js"; 

// --- HELPER ---
const getBestModel = async (apiKey) => {
  try {
    const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResponse.json();
    if (!listData.models) return "models/gemini-1.5-flash"; 
    const bestModel = listData.models.find(m => m.name.includes("flash")) || listData.models.find(m => m.name.includes("pro"));
    return bestModel ? bestModel.name : "models/gemini-1.5-flash";
  } catch (error) { return "models/gemini-1.5-flash"; }
};

// ==========================================
// 1. DAILY BRIEFING (MORNING COACH)
// ==========================================
const getDailyBriefing = asyncHandler(async (req, res) => {
  const API_KEY = process.env.GEMINI_API_KEY;
  const user = req.user;
  
  // Fetch Context
  const lastWorkout = await Workout.findOne({ user: user._id }).sort({ createdAt: -1 });
  const todayLog = await DailyLog.findOne({ user: user._id, date: new Date().toISOString().split("T")[0] });
  const modelName = await getBestModel(API_KEY);

  const systemInstruction = `
    ROLE: You are "Shape Up AI", a professional Personal Trainer for ${user.name}.
    CONTEXT:
    - Goal: ${user.goal}
    - Last Workout: ${lastWorkout ? `${lastWorkout.exercises.length} exercises (RPE: ${lastWorkout.rpe || 'N/A'})` : "None recently"}.
    - Today's Activity: ${todayLog ? todayLog.steps : 0} steps.
    
    TASK: Provide a very short, energetic 2-sentence morning briefing.
    1. Comment on recovery or consistency.
    2. Give one specific tip for today (nutrition or mindset).
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: systemInstruction }] }] })
    });
    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Let's crush today's goals! 💪";
    res.json({ message: reply });
  } catch (error) { res.json({ message: "Ready to train? Let's go!" }); }
});

// ==========================================
// 2. WORKOUT GENERATION
// ==========================================
const generateWorkoutPlan = asyncHandler(async (req, res) => {
  const { userData, preferences } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const modelName = await getBestModel(API_KEY);

  const systemInstruction = `
    ROLE: Strength Coach. Create a ${preferences.daysPerWeek}-day workout routine for ${userData.name}.
    GOAL: ${userData.goal}. EQUIPMENT: ${preferences.equipment}.
    OUTPUT: Strict JSON with summary and schedule array.
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
// 3. ANALYZE POST-WORKOUT (PROGRESSIVE OVERLOAD)
// ==========================================
const analyzeWorkoutSession = asyncHandler(async (req, res) => {
    const { workoutId, rpe, feedback } = req.body; // RPE 1-10
    const API_KEY = process.env.GEMINI_API_KEY;

    const workout = await Workout.findById(workoutId);
    if(!workout) return res.status(404).json({error: "Workout not found"});

    // Update Workout Record
    workout.rpe = rpe;
    workout.feedback = feedback;
    await workout.save();

    const modelName = await getBestModel(API_KEY);

    const systemInstruction = `
      ROLE: Expert Coach.
      TASK: Analyze completed workout.
      DATA: RPE ${rpe}/10, Feedback: "${feedback}".
      LOGIC:
      - RPE < 6: Suggest increasing weight/reps.
      - RPE > 9: Suggest recovery/deload.
      OUTPUT JSON: { "analysis": "Feedback text", "nextWeekAdjustments": [{"exercise": "Name", "adjustment": "Action"}] }
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
    } catch (error) {
        res.json({ analysis: "Great job! Rest well.", nextWeekAdjustments: [] });
    }
});

// ==========================================
// 4. EXISTING ROUTINE FUNCTIONS
// ==========================================
const saveWorkoutPlan = asyncHandler(async (req, res) => {
    const { plan, preferences } = req.body;
    await Routine.updateMany({ user: req.user._id }, { isActive: false });
    const routine = await Routine.create({
        user: req.user._id, goal: req.user.goal, limitations: preferences.injuries,
        schedule: plan.schedule, isActive: true
    });
    res.status(201).json(routine);
});

const getMyRoutine = asyncHandler(async (req, res) => {
    const routine = await Routine.findOne({ user: req.user._id, isActive: true });
    if (routine) res.json(routine);
    else res.status(404).json({ message: "No active routine found." });
});

const adjustRoutine = asyncHandler(async (req, res) => {
    const { dayName } = req.body; 
    // Logic to regenerate just one day (Keeping it simple for now)
    res.json({ message: "Adjustment feature coming soon" }); 
});

const chatWithAI = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;
  const modelName = await getBestModel(API_KEY);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: `Role: Trainer. Question: ${message}` }] }] })
    });
    const data = await response.json();
    res.json({ reply: data.candidates?.[0]?.content?.parts?.[0]?.text });
  } catch (error) { res.status(500).json({ reply: "Error" }); }
});

// EXPORT EVERYTHING
export { 
  chatWithAI, generateWorkoutPlan, saveWorkoutPlan, getMyRoutine, adjustRoutine,
  getDailyBriefing, analyzeWorkoutSession,
  generateDietPlan, saveDietPlan, getMyDiet, analyzeFoodImage
};