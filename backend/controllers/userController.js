import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";

// @desc    Auth user/set token
// @route   POST /api/users/auth
// @access  Public
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
      goal: user.goal, 
    });
  } else {
    res.status(401);
    throw new Error("Invalid user credentials");
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
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
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "user logged out" });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
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
    goal: req.user.goal,
  };
  res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // 1. Password Change Logic (Secure)
    if (req.body.password) {
       if (!req.body.currentPassword) {
          res.status(400);
          throw new Error("Please enter your current password to set a new one.");
       }

       const isMatch = await user.matchPassword(req.body.currentPassword);
       
       if (!isMatch) {
          res.status(401);
          throw new Error("Invalid current password! Please try again.");
       }

       user.password = req.body.password;
    }

    // 2. Update Basic Info
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    
    // 3. Update Body Stats
    if(req.body.age) user.age = req.body.age;
    if(req.body.gender) user.gender = req.body.gender;
    if(req.body.height) user.height = req.body.height;
    if(req.body.weight) user.weight = req.body.weight;
    if(req.body.goal) user.goal = req.body.goal;
    
    // 4. Update Image (if provided)
    if(req.body.image) user.image = req.body.image;

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
      goal: updatedUser.goal,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- EXPORT ALL FUNCTIONS ---
export { 
  authUser, 
  registerUser, 
  logoutUser, 
  getUserProfile, 
  updateUserProfile 
};