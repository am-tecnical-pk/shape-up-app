import mongoose from "mongoose";

const dailyLogSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: String,
      required: true,
    },
    // --- BASIC STATS ---
    calories: { type: Number, default: 0 },
    water: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    steps: { type: Number, default: 0 },
    
    // --- NEW: AI Dynamic Goals (Aaj ka target kya hai?) ---
    targetCalories: { type: Number }, // AI set karega daily
    targetWater: { type: Number },
    recoveryScore: { type: Number, default: 100 }, // 0-100 (Recovery status)

    foods: [
        {
            name: { type: String, required: true },
            calories: { type: Number, required: true },
            protein: { type: Number, default: 0 },
            carbs: { type: Number, default: 0 },
            fat: { type: Number, default: 0 },
        }
    ]
  },
  {
    timestamps: true,
  }
);

dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
export default DailyLog;