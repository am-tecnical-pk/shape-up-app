import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // --- PHYSICAL STATS (AI Needs This) ---
    gender: { type: String, enum: ["Male", "Female"], default: "Male" },
    age: { type: Number, default: 25 },
    height: { type: Number, default: 170 }, // cm
    weight: { type: Number, default: 70 }, // kg
    targetWeight: { type: Number, default: 70 },
    
    // --- STRATEGY ---
    goal: { type: String, enum: ["Lose Weight", "Maintain", "Gain Muscle"], default: "Maintain" },
    activityLevel: { 
      type: String, 
      enum: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"],
      default: "Moderately Active"
    },

    // --- CALCULATED METRICS (System will auto-calc these) ---
    bmr: { type: Number, default: 0 },   // Basal Metabolic Rate
    tdee: { type: Number, default: 0 },  // Total Daily Energy Expenditure
    
    // --- NUTRITION TARGETS ---
    macros: {
      calories: { type: Number, default: 2000 },
      protein: { type: Number, default: 150 },
      carbs: { type: Number, default: 200 },
      fats: { type: Number, default: 60 },
    },

    // --- PREFERENCES ---
    dietaryPreferences: { type: String, default: "None" }, // Vegan, Keto, etc.
    allergies: { type: String, default: "None" },
  },
  {
    timestamps: true,
  }
);

// Encrypt password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;