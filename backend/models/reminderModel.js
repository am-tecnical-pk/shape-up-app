import mongoose from "mongoose";

const reminderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true, // e.g., "Gym Time"
    },
    time: {
      type: String,
      required: true, // Format: "14:30" (24-hour format)
    },
    type: {
      type: String,
      enum: ["Workout", "Meal", "Water", "General"],
      default: "General",
    },
  },
  {
    timestamps: true,
  }
);

const Reminder = mongoose.model("Reminder", reminderSchema);
export default Reminder;