import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    
    // --- Profile Stats ---
    image: { type: String },
    age: { type: Number, default: 25 },
    height: { type: Number, default: 170 }, 
    weight: { type: Number, default: 70 }, 
    targetWeight: { type: Number, default: 70 },
    gender: { type: String, enum: ['Male', 'Female'], default: 'Male' },
    
    // --- Strategy ---
    goal: { type: String, enum: ['Cut', 'Bulk', 'Maintain'], default: 'Maintain' },
    activityLevel: { 
      type: String, 
      enum: ["Sedentary", "Lightly Active", "Moderately Active", "Very Active", "Extra Active"],
      default: "Moderately Active"
    },
    stepGoal: { type: Number, default: 8000 }, 

    // --- CALCULATED DATA (Missing in your file) ---
    bmr: { type: Number, default: 0 },
    tdee: { type: Number, default: 0 },
    macros: {
      calories: { type: Number, default: 2000 },
      protein: { type: Number, default: 150 },
      carbs: { type: Number, default: 200 },
      fats: { type: Number, default: 60 },
    },
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);
export default User;