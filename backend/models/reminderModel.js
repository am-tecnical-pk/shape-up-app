import mongoose from "mongoose";

const reminderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    title: { type: String, required: true },
    time: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, default: "General" },
    priority: { type: String, default: "Normal" },
  },
  {
    timestamps: true,
  }
);

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;