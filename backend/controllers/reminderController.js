import asyncHandler from "express-async-handler";
import Reminder from "../models/reminderModel.js";

// @desc    Get all reminders
// @route   GET /api/reminders
// @access  Private
const getReminders = asyncHandler(async (req, res) => {
  const reminders = await Reminder.find({ user: req.user._id }).sort({ date: 1, time: 1 });
  res.json(reminders);
});

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = asyncHandler(async (req, res) => {
  const { title, time, date, type, priority } = req.body;
  
  if (!title || !time || !date) {
    res.status(400);
    throw new Error("Please add title, date, and time");
  }

  const reminder = await Reminder.create({
    user: req.user._id,
    title,
    time,
    date,
    type,
    priority
  });

  res.status(201).json(reminder);
});

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = asyncHandler(async (req, res) => {
  const reminder = await Reminder.findById(req.params.id);

  if (reminder && reminder.user.equals(req.user._id)) {
    await reminder.deleteOne();
    res.json({ message: "Reminder removed" });
  } else {
    res.status(404);
    throw new Error("Reminder not found");
  }
});

export { getReminders, createReminder, deleteReminder };