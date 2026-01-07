import path from "path";
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cors from "cors"; 

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

// ✅ UPDATED CORS CONFIGURATION
app.use(cors({
    origin: [
        "http://localhost:3000",                  // For local development
        "https://shape-up-app-gray.vercel.app"    // 👈 Your actual Vercel Frontend
    ], 
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

// Root Route
app.get("/", (req, res) => res.send("API is running..."));

// Error Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));

export default app;