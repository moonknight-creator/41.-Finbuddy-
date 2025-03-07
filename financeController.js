const SavingsGoal = require('../models/SavingsGoal');

// Create Savings Goal
const createSavingsGoal = async (req, res) => {
  const { goalName, targetAmount } = req.body;
  const { userId } = req; // From auth middleware

  try {
    const newGoal = new SavingsGoal({ 
      goalName, 
      targetAmount, 
      userId 
    });
    await newGoal.save();
    res.status(201).json({ message: 'Savings goal created', goal: newGoal });
  } catch (error) {
    res.status(500).json({ message: 'Error creating savings goal' });
  }
};

// Get Savings Goals for Authenticated User
const getSavingsGoals = async (req, res) => {
  const { userId } = req; // From auth middleware

  try {
    const goals = await SavingsGoal.find({ userId });
    res.status(200).json({ savingsGoals: goals });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching goals' });
  }
};

module.exports = { createSavingsGoal, getSavingsGoals };