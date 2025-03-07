const { ObjectId } = require('mongodb');

const userSchema = {
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  joinDate: { type: Date, default: Date.now },
  lastLogin: Date,
  financialSummary: {
    currentBalance: { type: Number, default: 0 },
    income: { type: Number, default: 0 },
    expenses: { type: Number, default: 0 }
  },
  budgetCategories: [{ type: ObjectId, ref: 'BudgetCategory' }],
  savingsGoals: [{ type: ObjectId, ref: 'SavingsGoal' }],
  learningProgress: {
    currentCourse: String,
    completedCourses: [String],
    badges: [String]
  }
};

module.exports = userSchema;