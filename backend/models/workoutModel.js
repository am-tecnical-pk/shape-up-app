import mongoose from "mongoose";

const workoutSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    // --- AI TRACKING FIELDS ---
    duration: { type: Number, default: 0 }, // Total workout time (mins)
    rpe: { type: Number, default: 0 }, // Rate of Perceived Exertion (1-10)
    feedback: { type: String }, // User's verbal feedback
    soreness: { type: String, enum: ["None", "Low", "Medium", "High"], default: "None" },
    
    exercises: [
      {
        name: { type: String, required: true },
        category: { type: String, default: "General" }, 
        sets: { type: Number, default: 0 },
        reps: { type: Number, default: 0 },
        weight: { type: Number, default: 0 }, 
        
        // Cardio Fields
        distance: { type: Number, default: 0 }, // km
        cardioTime: { type: Number, default: 0 }, // mins
        
        notes: { type: String },
        completed: { type: Boolean, default: true }
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Workout = mongoose.model("Workout", workoutSchema);
export default Workout;