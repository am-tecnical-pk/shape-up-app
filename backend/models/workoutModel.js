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
    exercises: [
      {
        name: { type: String, required: true },
        category: { type: String, default: "General" }, 
        sets: { type: Number, default: 0 },
        reps: { type: Number, default: 0 },
        weight: { type: Number, default: 0 }, 
        duration: { type: Number, default: 0 }, 
        distance: { type: Number, default: 0 }, 
        notes: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Workout = mongoose.model("Workout", workoutSchema);

export default Workout;