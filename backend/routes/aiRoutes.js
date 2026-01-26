import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  chatWithAI, 
  generateWorkoutPlan, 
  saveWorkoutPlan, 
  getMyRoutine, 
  adjustRoutine,
  getDailyBriefing, // NEW
  analyzeWorkoutSession, // NEW
  generateDietPlan, // NEW
  saveDietPlan, // NEW
  getMyDiet, // NEW
  analyzeFoodImage // NEW
} from "../controllers/aiController.js";

const router = express.Router();

// Chat
router.post("/chat", protect, chatWithAI);

// Workout
router.post("/generate", protect, generateWorkoutPlan);
router.post("/save-routine", protect, saveWorkoutPlan);
router.get("/my-routine", protect, getMyRoutine);
router.post("/adjust-routine", protect, adjustRoutine);
router.post("/analyze-workout", protect, analyzeWorkoutSession); // NEW ROUTE

// Dashboard
router.get("/daily-briefing", protect, getDailyBriefing); // NEW ROUTE

// Diet
router.post("/generate-diet", protect, generateDietPlan);
router.post("/save-diet", protect, saveDietPlan);
router.get("/my-diet", protect, getMyDiet);
router.post("/analyze-food", protect, analyzeFoodImage);

export default router;