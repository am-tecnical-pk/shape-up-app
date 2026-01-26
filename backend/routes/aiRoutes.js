import express from "express";
import { protect } from "../middleware/authMiddleware.js"; // 👈 CRITICAL IMPORT
import { 
  chatWithAI, 
  generateWorkoutPlan, 
  saveWorkoutPlan, 
  getMyRoutine, 
  adjustRoutine, // Required for Progressive Overload
  getDailyBriefing, 
  analyzeWorkoutSession, 
  generateDietPlan, 
  saveDietPlan, 
  getMyDiet, 
  analyzeFoodImage 
} from "../controllers/aiController.js";

const router = express.Router();

// --- 1. CHAT & DASHBOARD ---
router.post("/chat", protect, chatWithAI);
router.get("/daily-briefing", protect, getDailyBriefing);

// --- 2. WORKOUT AI ---
router.post("/generate", protect, generateWorkoutPlan);
router.post("/save-routine", protect, saveWorkoutPlan);
router.get("/my-routine", protect, getMyRoutine);
router.post("/adjust-routine", protect, adjustRoutine);
router.post("/analyze-workout", protect, analyzeWorkoutSession);

// --- 3. DIET & VISION AI ---
router.post("/generate-diet", protect, generateDietPlan);
router.post("/save-diet", protect, saveDietPlan);
router.get("/my-diet", protect, getMyDiet);
router.post("/analyze-food", protect, analyzeFoodImage);

export default router;