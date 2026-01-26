import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";
import DailyLog from "../models/dailyLogModel.js";
import UserMealPlan from "../models/UserMealPlanModel.js";
import UserWaterIntake from "../models/userWaterIntakeModel.js";

// --- HELPER: Calculation Logic ---
const calculateNutrition = (user) => {
  let { gender, weight, height, age, activityLevel, goal } = user;
  
  // Defaults if missing
  weight = weight || 70; height = height || 170; age = age || 25; 
  gender = gender || "Male"; activityLevel = activityLevel || "Moderately Active";

  // 1. BMR (Mifflin-St Jeor)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += (gender === "Male" ? 5 : -161);

  // 2. TDEE
  const multipliers = {
    "Sedentary": 1.2, "Lightly Active": 1.375, "Moderately Active": 1.55,
    "Very Active": 1.725, "Extra Active": 1.9
  };
  let tdee = Math.round(bmr * (multipliers[activityLevel] || 1.55));

  // 3. Goal Adjustment
  let targetCalories = tdee;
  if (goal === "Cut") targetCalories -= 500;
  else if (goal === "Bulk") targetCalories += 500;

  // 4. Macros
  const protein = Math.round(weight * 2.2); 
  const fats = Math.round(weight * 0.9);
  const carbs = Math.max(0, Math.round((targetCalories - (protein * 4 + fats * 9)) / 4));

  return { bmr, tdee, macros: { calories: targetCalories, protein, carbs, fats } };
};

// @desc    Update profile & RE-CALCULATE
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Update Fields
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    if (req.file) user.image = req.file.path;

    // Physical Stats
    if(req.body.age) user.age = Number(req.body.age);
    if(req.body.gender) user.gender = req.body.gender;
    if(req.body.height) user.height = Number(req.body.height);
    if(req.body.weight) user.weight = Number(req.body.weight);
    if(req.body.targetWeight) user.targetWeight = Number(req.body.targetWeight);
    if(req.body.stepGoal) user.stepGoal = Number(req.body.stepGoal);
    
    // IMPORTANT: Strategy Fields
    if(req.body.goal) user.goal = req.body.goal;
    if(req.body.activityLevel) user.activityLevel = req.body.activityLevel;

    // --- RE-CALCULATE ---
    const stats = calculateNutrition(user);
    user.bmr = stats.bmr;
    user.tdee = stats.tdee;
    user.macros = stats.macros;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      macros: updatedUser.macros, // Frontend gets updated macros here
      goal: updatedUser.goal,
      weight: updatedUser.weight,
      activityLevel: updatedUser.activityLevel
    });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json({
      _id: user._id, name: user.name, email: user.email, image: user.image,
      macros: user.macros, // Send macros on login
      goal: user.goal, weight: user.weight, activityLevel: user.activityLevel
    });
  } else { res.status(401); throw new Error("Invalid credentials"); }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error("User exists"); }
  const user = await User.create({ name, email, password });
  if (user) {
    const stats = calculateNutrition(user); // Initial Calc
    user.bmr = stats.bmr; user.tdee = stats.tdee; user.macros = stats.macros;
    await user.save();
    generateToken(res, user._id);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email });
  } else { res.status(400); throw new Error("Invalid data"); }
});

// Other functions unchanged...
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if(user) {
        res.json({
            _id: user._id, name: user.name, email: user.email, image: user.image,
            age: user.age, height: user.height, weight: user.weight,
            goal: user.goal, activityLevel: user.activityLevel,
            macros: user.macros, bmr: user.bmr
        });
    } else { res.status(404); throw new Error('User not found'); }
});

const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out" });
});

const deleteUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    await DailyLog.deleteMany({ user: user._id });
    await UserMealPlan.deleteMany({ user: user._id });
    await UserWaterIntake.deleteMany({ user: user._id });
    await user.deleteOne(); 
    res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ message: 'User deleted' });
  } else { res.status(404); throw new Error('User not found'); }
});

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, deleteUserProfile };