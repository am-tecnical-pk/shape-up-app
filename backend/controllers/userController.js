import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";

// ... (authUser, registerUser functions same rahenge)

// @desc    Auth user/set token
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      // Return stats
      age: user.age,
      height: user.height,
      weight: user.weight,
      gender: user.gender,
      goal: user.goal, // <--- Return Goal
    });
  } else {
    res.status(401);
    throw new Error("Invalid user credentials");
  }
});

// @desc    Register a new user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({ name, email, password });

  if (user) {
    generateToken(res, user._id);
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      goal: user.goal,
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Logout user
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "user logged out" });
});

// @desc    Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    image: req.user.image,
    age: req.user.age,
    height: req.user.height,
    weight: req.user.weight,
    gender: req.user.gender,
    goal: req.user.goal, // <--- Include Goal
  };
  res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // --- Body Stats ---
    user.age = req.body.age || user.age;
    user.height = req.body.height || user.height;
    user.weight = req.body.weight || user.weight;
    user.gender = req.body.gender || user.gender;

    // 👇 MAIN FIX: Goal Check
    if (req.body.goal) {
        user.goal = req.body.goal; 
    }

    if (req.body.image) {
        user.image = req.body.image;
    }

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      age: updatedUser.age,
      height: updatedUser.height,
      weight: updatedUser.weight,
      gender: updatedUser.gender,
      goal: updatedUser.goal, // <--- Wapas bhejain updated goal
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile };