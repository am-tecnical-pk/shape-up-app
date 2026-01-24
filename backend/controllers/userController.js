import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";

// --- HELPER: Calculate Fitness Metrics ---
const calculateNutrition = (user) => {
  let { gender, weight, height, age, activityLevel, goal } = user;
  
  // 1. Calculate BMR (Mifflin-St Jeor Equation)
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr += (gender === "Male" ? 5 : -161);

  // 2. Calculate TDEE (Activity Multiplier)
  const multipliers = {
    "Sedentary": 1.2,
    "Lightly Active": 1.375,
    "Moderately Active": 1.55,
    "Very Active": 1.725,
    "Extra Active": 1.9
  };
  let tdee = Math.round(bmr * (multipliers[activityLevel] || 1.2));

  // 3. Adjust for Goal
  let targetCalories = tdee;
  if (goal === "Lose Weight") targetCalories -= 500;
  else if (goal === "Gain Muscle") targetCalories += 500;

  // 4. Calculate Macros (Protein heavy for Shape Up)
  // Protein: 2g per kg bodyweight
  // Fats: 0.8g per kg bodyweight
  // Carbs: Remaining calories
  const protein = Math.round(weight * 2.2); 
  const fats = Math.round(weight * 0.9);
  const proteinCal = protein * 4;
  const fatsCal = fats * 9;
  const carbsCal = targetCalories - (proteinCal + fatsCal);
  const carbs = Math.max(0, Math.round(carbsCal / 4));

  return { bmr, tdee, macros: { calories: targetCalories, protein, carbs, fats } };
};

// @desc    Auth user & get token
// @route   POST /api/users/auth
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.json({ _id: user._id, name: user.name, email: user.email, goal: user.goal, macros: user.macros });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Register a new user
// @route   POST /api/users
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error("User already exists"); }

  const user = await User.create({ name, email, password });

  if (user) {
    // Initial Calc
    const stats = calculateNutrition(user);
    user.bmr = stats.bmr;
    user.tdee = stats.tdee;
    user.macros = stats.macros;
    await user.save();

    generateToken(res, user._id);
    res.status(201).json({ _id: user._id, name: user.name, email: user.email });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
const logoutUser = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      // Send all stats
      gender: user.gender,
      age: user.age,
      height: user.height,
      weight: user.weight,
      goal: user.goal,
      activityLevel: user.activityLevel,
      macros: user.macros,
      bmr: user.bmr,
      tdee: user.tdee
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    
    // Update Stats
    user.age = req.body.age || user.age;
    user.gender = req.body.gender || user.gender;
    user.height = req.body.height || user.height;
    user.weight = req.body.weight || user.weight;
    user.goal = req.body.goal || user.goal;
    user.activityLevel = req.body.activityLevel || user.activityLevel;
    user.dietaryPreferences = req.body.dietaryPreferences || user.dietaryPreferences;
    user.allergies = req.body.allergies || user.allergies;

    // RE-CALCULATE METRICS AUTOMATICALLY
    const stats = calculateNutrition(user);
    user.bmr = stats.bmr;
    user.tdee = stats.tdee;
    user.macros = stats.macros;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      macros: updatedUser.macros,
      goal: updatedUser.goal
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile };