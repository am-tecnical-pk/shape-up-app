import mongoose from "mongoose";

const routineSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    goal: { type: String, required: true },
    limitations: { type: String }, 
    
    // The Weekly Schedule Structure
    schedule: [
      {
        day: { type: String }, // e.g., "Day 1"
        focus: { type: String }, // e.g., "Chest & Triceps"
        warmup: { type: String }, 
        exercises: [
          {
            name: { type: String },
            sets: { type: String },
            reps: { type: String },
            rest: { type: String },
            notes: { type: String },
          },
        ],
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Routine = mongoose.model("Routine", routineSchema);
export default Routine;