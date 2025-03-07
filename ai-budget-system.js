/**
 * AI Budget System - JavaScript implementation of the Python notebook functionality
 * This module provides the core budgeting intelligence for the FinBuddy application
 */

class AIBudgetSystem {
    constructor() {
        this.userName = '';
        this.monthYear = this.getCurrentMonthYear();
        this.totalMoney = 0;
        this.savings = 0;
        this.minSavingsLimit = 0;
        this.savingsGoalItem = '';
        this.savingsGoalCost = 0;
        this.expenses = {};
        this.expenseHistory = [];
    }

    // Initialize from user data
    initFromUserData(userData) {
        if (!userData) return;
        
        this.userName = userData.name || 'User';
        
        // Set financial data
        const financialSummary = userData.financialSummary || {};
        this.totalMoney = financialSummary.currentBalance || 0;
        
        // Set savings data
        const savingsData = userData.savings || {};
        this.savings = savingsData.totalSavings || 0;
        
        // Set minimum savings limit (default to 10% of total money)
        this.minSavingsLimit = this.totalMoney * 0.1;
        
        // Get primary savings goal if exists
        if (savingsData.goals && savingsData.goals.length > 0) {
            const primaryGoal = savingsData.goals[0];
            this.savingsGoalItem = primaryGoal.name;
            this.savingsGoalCost = primaryGoal.target;
        }
        
        // Set expense categories from budget data
        if (userData.budgetData && userData.budgetData.categories) {
            userData.budgetData.categories.forEach(category => {
                this.expenses[category.name] = {
                    spent: category.spent || 0,
                    limit: category.allocated || 0
                };
            });
        }
        
        // Set expense history from transactions
        if (userData.transactions) {
            this.expenseHistory = userData.transactions
                .filter(t => t.type === 'expense')
                .map(t => ({
                    category: t.category || 'Uncategorized',
                    amount: t.amount,
                    date: new Date(t.date)
                }));
        }
    }

    // Get current month/year in MM/YY format
    getCurrentMonthYear() {
        const date = new Date();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(2);
        return `${month}/${year}`;
    }

    // Adjust savings based on expenses exceeding budget limits
    adjustSavings() {
        let adjustedSavings = this.savings;
        const alerts = [];
        
        for (const [category, details] of Object.entries(this.expenses)) {
            if (details.spent > details.limit) {
                const overBudget = details.spent - details.limit;
                adjustedSavings -= overBudget;
                
                alerts.push({
                    type: 'warning',
                    message: `You exceeded your ${category} budget by ₹${overBudget.toFixed(2)}. Adjusted savings: ₹${adjustedSavings.toFixed(2)}`
                });
            }
        }
        
        if (adjustedSavings < this.minSavingsLimit) {
            alerts.push({
                type: 'danger',
                message: `Warning! Your savings (₹${adjustedSavings.toFixed(2)}) have dropped below your minimum limit (₹${this.minSavingsLimit.toFixed(2)}).`
            });
        }
        
        return {
            adjustedSavings,
            alerts
        };
    }

    // Check savings goal progress and return data for visualization
    checkSavingsGoalProgress() {
        if (!this.savingsGoalItem || this.savingsGoalItem.toLowerCase() === 'none') {
            return null;
        }
        
        const moneyNeeded = Math.max(0, this.savingsGoalCost - this.savings);
        
        const chartData = {
            labels: ['Current Savings', 'Amount Needed'],
            values: [this.savings, moneyNeeded],
            colors: ['green', 'red']
        };
        
        let message = '';
        let messageType = '';
        
        if (moneyNeeded > 0) {
            message = `You need ₹${moneyNeeded.toFixed(2)} more to buy ${this.savingsGoalItem}.`;
            messageType = 'warning';
        } else {
            message = `Congratulations! You have enough savings to buy ${this.savingsGoalItem}!`;
            messageType = 'success';
        }
        
        return {
            chartData,
            message,
            messageType
        };
    }

    // Create a DataFrame-like object for visualization
    createDataFrame() {
        const data = {
            User: [],
            Month_Year: [],
            Category: [],
            Spent: [],
            Limit: [],
            Over_Budget: []
        };
        
        for (const [category, details] of Object.entries(this.expenses)) {
            data.User.push(this.userName);
            data.Month_Year.push(this.monthYear);
            data.Category.push(category);
            data.Spent.push(details.spent);
            data.Limit.push(details.limit);
            data.Over_Budget.push(details.spent > details.limit);
        }
        
        return data;
    }

    // Get data for plotting expenses vs. limits bar chart
    getExpenseBarChartData() {
        const data = this.createDataFrame();
        
        return {
            labels: data.Category,
            datasets: [
                {
                    label: 'Spent',
                    data: data.Spent,
                    backgroundColor: 'blue'
                },
                {
                    label: 'Limit',
                    data: data.Limit,
                    backgroundColor: 'black',
                    alpha: 0.5
                }
            ],
            title: `${this.userName}'s Expenses vs Budget Limits for ${data.Month_Year[0]}`
        };
    }

    // Get data for plotting expense distribution pie chart
    getExpensePieChartData() {
        const data = this.createDataFrame();
        
        return {
            labels: data.Category,
            datasets: [{
                data: data.Spent,
                backgroundColor: ['blue', 'red', 'green', 'orange', 'purple']
            }],
            title: `${this.userName}'s Expense Distribution for ${data.Month_Year[0]}`
        };
    }

    // Get next month in MM/YY format
    getNextMonthDate() {
        const [month, year] = this.monthYear.split('/');
        const date = new Date(2000 + parseInt(year), parseInt(month) - 1, 1);
        date.setMonth(date.getMonth() + 1);
        
        const nextMonth = (date.getMonth() + 1).toString().padStart(2, '0');
        const nextYear = date.getFullYear().toString().slice(2);
        
        return `${nextMonth}/${nextYear}`;
    }

    // Predict future expenses
    predictExpenses() {
        // Group expenses by month
        const expensesByMonth = {};
        
        this.expenseHistory.forEach(expense => {
            const date = expense.date;
            const monthYear = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;
            
            if (!expensesByMonth[monthYear]) {
                expensesByMonth[monthYear] = {};
            }
            
            if (!expensesByMonth[monthYear][expense.category]) {
                expensesByMonth[monthYear][expense.category] = 0;
            }
            
            expensesByMonth[monthYear][expense.category] += expense.amount;
        });
        
        const months = Object.keys(expensesByMonth);
        
        // Not enough data for predictions
        if (months.length < 2) {
            return {
                success: false,
                message: "Not enough data to predict next month's expenses.",
                predictions: {}
            };
        }
        
        // Collect all unique categories
        const allCategories = new Set();
        months.forEach(month => {
            Object.keys(expensesByMonth[month]).forEach(category => {
                allCategories.add(category);
            });
        });
        
        // Create numeric representation of months for regression
        const monthsNumeric = Array.from({ length: months.length }, (_, i) => i + 1);
        
        // Predict for each category
        const nextMonthYear = this.getNextMonthDate();
        const predictions = {};
        
        allCategories.forEach(category => {
            const x = [];
            const y = [];
            
            // Gather data points for this category
            months.forEach((month, index) => {
                if (expensesByMonth[month][category]) {
                    x.push(monthsNumeric[index]);
                    y.push(expensesByMonth[month][category]);
                }
            });
            
            // Only predict if we have at least 2 data points
            if (x.length >= 2) {
                try {
                    const model = new LinearRegression();
                    model.fit(x, y);
                    predictions[category] = Math.max(0, model.predict(months.length + 1));
                } catch (error) {
                    console.error(`Error predicting for ${category}:`, error);
                    
                    // Fallback to last month's value
                    const lastMonth = months[months.length - 1];
                    predictions[category] = expensesByMonth[lastMonth][category] || 0;
                }
            } else if (expensesByMonth[months[months.length - 1]][category]) {
                // If only one data point, use last month's value
                predictions[category] = expensesByMonth[months[months.length - 1]][category];
            } else {
                predictions[category] = 0;
            }
        });
        
        return {
            success: true,
            message: `Predicted expenses for next month (${nextMonthYear}):`,
            predictions,
            nextMonthYear
        };
    }

    // Generate insights based on spending patterns
    generateInsights() {
        const insights = [];
        
        // Check for categories exceeding budget
        for (const [category, details] of Object.entries(this.expenses)) {
            if (details.spent > details.limit) {
                const overBudget = details.spent - details.limit;
                const percentage = (overBudget / details.limit) * 100;
                
                insights.push({
                    type: 'warning',
                    message: `Your ${category} spending is ${percentage.toFixed(1)}% over budget.`,
                    action: 'Review spending in this category and consider adjusting your budget.'
                });
            }
        }
        
        // Check savings goal progress
        if (this.savingsGoalItem && this.savingsGoalCost > 0) {
            const progress = (this.savings / this.savingsGoalCost) * 100;
            
            if (progress < 25) {
                insights.push({
                    type: 'info',
                    message: `You're at ${progress.toFixed(1)}% of your savings goal for ${this.savingsGoalItem}.`,
                    action: 'Consider increasing your monthly savings amount.'
                });
            } else if (progress >= 90) {
                insights.push({
                    type: 'success',
                    message: `You're almost at your savings goal for ${this.savingsGoalItem}!`,
                    action: 'Start thinking about your next savings goal.'
                });
            }
        }
        
        // Check minimum savings ratio
        const savingsRatio = this.savings / this.totalMoney;
        if (savingsRatio < 0.2) {
            insights.push({
                type: 'warning',
                message: 'Your savings are less than 20% of your total money.',
                action: 'Financial experts recommend keeping 20-30% of your money in savings.'
            });
        }
        
        return insights;
    }
}

// Create and export global instance
window.aiBudgetSystem = new AIBudgetSystem();
