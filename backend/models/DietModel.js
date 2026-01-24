import mongoose from "mongoose";

const dietSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    goal: { type: String, required: true },
    calories: { type: Number, required: true },
    macros: {
      protein: { type: Number },
      carbs: { type: Number },
      fats: { type: Number },
    },
    meals: [
      {
        name: { type: String, required: true }, // e.g., "Breakfast"
        foodItems: [{ type: String }], // e.g., ["2 Eggs", "1 Toast"]
        calories: { type: Number },
        protein: { type: Number },
        notes: { type: String }, // e.g., "Cook in olive oil"
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const Diet = mongoose.model("Diet", dietSchema);
export default Diet;