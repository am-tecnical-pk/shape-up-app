import path from "path";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cors from "cors"; // Imported here

const port = process.env.PORT || 9000;

// Import Routes
import userRoutes from "./routes/userRoutes.js";
import userStatusRoutes from "./routes/userStatusRoutes.js";
import UserMealPlanRoutes from "./routes/UserMealPlanRoutes.js";
import workoutRoutes from "./routes/workoutRoutes.js"; 
import dailyLogRoutes from "./routes/dailyLogRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js"; 
import aiRoutes from "./routes/aiRoutes.js"; 
import emailRoutes from "./routes/emailRoutes.js"; 

connectDB();

const app = express();

// ✅ FIX 1: USE CORS MIDDLEWARE
// We allow localhost (for testing) and we will allow your Vercel Frontend later.
// When you deploy your frontend, come back and replace "https://YOUR-FRONTEND.vercel.app" with your actual URL.
app.use(cors({
    origin: ["http://localhost:3000", "https://shape-up-frontend.vercel.app"], 
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Mount Routes
app.use("/api/users", userRoutes);
app.use("/api/user", userStatusRoutes);
app.use("/api/user", UserMealPlanRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/daily-logs", dailyLogRoutes);
app.use("/api/reminders", reminderRoutes); 
app.use("/api/ai", aiRoutes); 
app.use("/api/support", emailRoutes);

// ✅ FIX 2: REMOVE STATIC FILE SERVING
// Vercel hosting separates Frontend and Backend. The Backend does not serve the HTML.
app.get("/", (req, res) => res.send("API is running..."));

// Error Middleware (ALWAYS KEEP THESE AT THE BOTTOM)
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));

export default app;