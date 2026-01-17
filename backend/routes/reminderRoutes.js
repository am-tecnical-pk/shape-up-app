import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getReminders, createReminder, deleteReminder } from "../controllers/reminderController.js";

const router = express.Router();

router.route("/").get(protect, getReminders).post(protect, createReminder);
router.route("/:id").delete(protect, deleteReminder);

export default router;