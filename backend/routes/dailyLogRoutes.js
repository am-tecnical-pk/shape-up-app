import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { 
  updateDailyLog, 
  getDailyLogs, 
  deleteFoodItem 
} from "../controllers/dailyLogController.js";

const router = express.Router();

router.route("/")
  .post(protect, updateDailyLog)
  .get(protect, getDailyLogs);

// 👇 CHANGE THIS FROM "/item" TO "/food" 👇
router.route("/food").delete(protect, deleteFoodItem); 

export default router;