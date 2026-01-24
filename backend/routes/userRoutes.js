import express from "express";
const router = express.Router();
import {
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile, // Imported the new controller function
} from "../controllers/userController.js";
import {
  logWaterIntake,
  updateWaterIntake,
  getUserWaterIntake,
} from "../controllers/userWaterIntakeController.js";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/fileUpload.js"; 

router.post("/", registerUser);
router.post("/auth", authUser);
router.post("/logout", logoutUser);

router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, upload.single('image'), updateUserProfile)
  .delete(protect, deleteUserProfile); // Added DELETE route

router
  .route("/water-intake")
  .post(protect, logWaterIntake)
  .put(protect, updateWaterIntake);

router.route("/water-intake/:date").get(protect, getUserWaterIntake);

export default router;