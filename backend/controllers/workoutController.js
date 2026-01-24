import asyncHandler from "express-async-handler";
import Workout from "../models/workoutModel.js";

// @desc    Create or Update workout for a specific date
// @route   POST /api/workouts
// @access  Private
const createWorkout = asyncHandler(async (req, res) => {
  const { date, exercises } = req.body;
  
  // Format date to YYYY-MM-DD to ignore time matching issues
  const workoutDate = new Date(date);
  const startOfDay = new Date(workoutDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(workoutDate.setHours(23, 59, 59, 999));

  // Check if a workout log already exists for this user on this date
  const workout = await Workout.findOne({
    user: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (workout) {
    // If exists, push new exercises to the list
    workout.exercises = [...workout.exercises, ...exercises];
    const updatedWorkout = await workout.save();
    res.status(200).json(updatedWorkout);
  } else {
    // If not, create a new workout log
    const newWorkout = await Workout.create({
      user: req.user._id,
      date: date,
      exercises: exercises,
    });
    res.status(201).json(newWorkout);
  }
});

// @desc    Get user workouts
// @route   GET /api/workouts
// @access  Private
const getWorkouts = asyncHandler(async (req, res) => {
  const workouts = await Workout.find({ user: req.user._id }).sort({ date: -1 });
  res.status(200).json(workouts);
});

// @desc    Get workout by specific date
// @route   GET /api/workouts/:date
// @access  Private
const getWorkoutByDate = asyncHandler(async (req, res) => {
  const date = new Date(req.params.date);
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const workout = await Workout.findOne({
    user: req.user._id,
    date: { $gte: startOfDay, $lte: endOfDay },
  });

  if (workout) {
    res.status(200).json(workout);
  } else {
    // Return empty structure if no workout found (easier for frontend)
    res.status(200).json({ exercises: [] });
  }
});

export { createWorkout, getWorkouts, getWorkoutByDate };