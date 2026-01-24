import express from "express";
import { getReviews, createReview } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getReviews)
  .post(protect, createReview); // Only logged in users can post

export default router;