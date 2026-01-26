import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // 👈 THIS IMPORT IS CRITICAL
import { 
  chatWithAI, 
  generateWorkoutPlan, 
  saveWorkoutPlan, 
  getMyRoutine, 
  getDailyBriefing, 
  analyzeWorkoutSession, 
  generateDietPlan, 
  saveDietPlan, 
  getMyDiet, 
  analyzeFoodImage 
} from "../controllers/aiController.js";

const router = express.Router();

// --- 1. DAILY BRIEFING & CHAT ---
router.get("/daily-briefing", protect, getDailyBriefing);
router.post("/chat", protect, chatWithAI);

// --- 2. WORKOUT AI ---
router.post("/generate", protect, generateWorkoutPlan);
router.post("/save-routine", protect, saveWorkoutPlan);
router.get("/my-routine", protect, getMyRoutine);
router.post("/analyze-workout", protect, analyzeWorkoutSession);

// --- 3. DIET & VISION AI ---
router.post("/generate-diet", protect, generateDietPlan);
router.post("/save-diet", protect, saveDietPlan);
router.get("/my-diet", protect, getMyDiet);
router.post("/analyze-food", protect, analyzeFoodImage);

export default router;