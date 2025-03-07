/**
 * FinBuddy ML Model for Expense Categorization
 * This module provides AI-powered insights through transaction categorization,
 * spending pattern analysis, and personalized financial recommendations
 */

class FinBuddyMLModel {
    constructor() {
        // Pre-trained model weights for expense categorization
        this.categoryKeywords = {
            'groceries': ['supermarket', 'grocery', 'market', 'food', 'fruit', 'vegetable', 'meat', 'dairy'],
            'utilities': ['electricity', 'water', 'gas', 'internet', 'phone', 'bill', 'utility'],
            'entertainment': ['movie', 'theatre', 'concert', 'subscription', 'streaming', 'netflix', 'amazon', 'spotify'],
            'transportation': ['uber', 'lyft', 'taxi', 'train', 'bus', 'metro', 'fuel', 'petrol', 'gas', 'parking'],
            'dining': ['restaurant', 'cafe', 'coffee', 'takeout', 'food delivery', 'lunch', 'dinner', 'breakfast'],
            'shopping': ['clothing', 'apparel', 'mall', 'online shopping', 'retail', 'store', 'shoes'],
            'healthcare': ['medical', 'doctor', 'pharmacy', 'hospital', 'medicine', 'healthcare', 'dental'],
            'education': ['tuition', 'school', 'college', 'university', 'book', 'course', 'class', 'tutorial'],
        };
        
        // User spending pattern data
        this.userSpendingPatterns = {};
        
        // Personalization data
        this.userPreferences = {};
    }
    
    /**
     * Categorizes a transaction based on its description
     * @param {string} description - Transaction description
     * @param {number} amount - Transaction amount
     * @returns {string} - The predicted category
     */
    categorizeTransaction(description, amount) {
        description = description.toLowerCase();
        
        // Find matching category based on keywords
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            for (const keyword of keywords) {
                if (description.includes(keyword.toLowerCase())) {
                    this.updateSpendingPattern(category, amount);
                    return category;
                }
            }
        }
        
        // If no match found, return "miscellaneous"
        this.updateSpendingPattern('miscellaneous', amount);
        return 'miscellaneous';
    }
    
    /**
     * Updates the user's spending pattern data
     * @param {string} category - Expense category
     * @param {number} amount - Transaction amount
     */
    updateSpendingPattern(category, amount) {
        const month = new Date().toLocaleString('default', { month: 'long' });
        
        if (!this.userSpendingPatterns[month]) {
            this.userSpendingPatterns[month] = {};
        }
        
        if (!this.userSpendingPatterns[month][category]) {
            this.userSpendingPatterns[month][category] = 0;
        }
        
        this.userSpendingPatterns[month][category] += amount;
        
        // Also update AI Budget System if available
        if (window.aiBudgetSystem && window.aiBudgetSystem.expenses) {
            if (!window.aiBudgetSystem.expenses[category]) {
                window.aiBudgetSystem.expenses[category] = {
                    spent: amount,
                    limit: 0
                };
            } else {
                window.aiBudgetSystem.expenses[category].spent += amount;
            }
            
            // Add to expense history
            window.aiBudgetSystem.expenseHistory.push({
                category: category,
                amount: amount,
                date: new Date()
            });
        }
    }
    
    /**
     * Analyzes spending patterns and provides insights
     * @returns {Array} - Array of insights and recommendations
     */
    generateInsights() {
        const insights = [];
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        
        if (!this.userSpendingPatterns[currentMonth]) {
            return ["Not enough data to generate insights yet."];
        }
        
        // Find the category with highest spending
        let maxSpending = 0;
        let maxCategory = '';
        
        for (const [category, amount] of Object.entries(this.userSpendingPatterns[currentMonth])) {
            if (amount > maxSpending) {
                maxSpending = amount;
                maxCategory = category;
            }
        }
        
        if (maxCategory) {
            insights.push(`Your highest spending category this month is ${maxCategory} (₹${maxSpending}).`);
            insights.push(`Consider setting a budget limit for ${maxCategory} to control expenses.`);
        }
        
        // Add more personalized insights based on spending patterns
        if (this.userSpendingPatterns[currentMonth]['groceries'] > 5000) {
            insights.push("Your grocery spending is higher than average. Consider buying in bulk or using discount coupons.");
        }
        
        if (this.userSpendingPatterns[currentMonth]['entertainment'] > 2000) {
            insights.push("You might save money by switching to annual subscriptions instead of monthly payments.");
        }
        
        return insights;
    }
    
    /**
     * Predicts future expenses based on historical data
     * @param {Object} data - Transaction data
     * @returns {Object} - Predicted expenses by category
     */
    predictFutureExpenses(data) {
        const predictions = {};
        const months = Object.keys(this.userSpendingPatterns);
        
        // Need at least 2 months of data for predictions
        if (months.length < 2) {
            return null;
        }
        
        const lastMonth = months[months.length - 1];
        const allCategories = new Set();
        
        // Collect all categories
        for (const month of months) {
            for (const category of Object.keys(this.userSpendingPatterns[month])) {
                allCategories.add(category);
            }
        }
        
        // For each category, predict next month's expenses
        for (const category of allCategories) {
            // Collect historical data for this category
            const x = []; // Month numbers
            const y = []; // Expenses
            
            months.forEach((month, index) => {
                if (this.userSpendingPatterns[month][category]) {
                    x.push(index + 1);
                    y.push(this.userSpendingPatterns[month][category]);
                }
            });
            
            // Only predict if we have at least 2 data points
            if (x.length >= 2) {
                const model = new LinearRegression();
                model.fit(x, y);
                predictions[category] = Math.max(0, model.predict(x.length + 1));
            } else if (this.userSpendingPatterns[lastMonth]?.[category]) {
                // If only one month of data, use that value
                predictions[category] = this.userSpendingPatterns[lastMonth][category];
            } else {
                predictions[category] = 0;
            }
        }
        
        return predictions;
    }
    
    /**
     * Suggests savings goals based on spending patterns
     * @returns {Array} - Array of savings goal suggestions
     */
    suggestSavingsGoals() {
        const suggestions = [];
        const totalSpending = this.calculateTotalMonthlySpending();
        
        if (totalSpending > 0) {
            // Suggest emergency fund
            suggestions.push({
                name: "Emergency Fund",
                amount: totalSpending * 6, // 6 months of expenses
                description: "Build an emergency fund covering 6 months of expenses."
            });
            
            // Suggest savings for big ticket items
            suggestions.push({
                name: "Major Purchase Fund",
                amount: totalSpending * 0.1 * 12, // 10% of monthly expenses over a year
                description: "Save for major purchases by setting aside 10% of your monthly expenses."
            });
        }
        
        return suggestions;
    }
    
    /**
     * Calculate total monthly spending across all categories
     * @returns {number} - Total spending amount
     */
    calculateTotalMonthlySpending() {
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        let total = 0;
        
        if (this.userSpendingPatterns[currentMonth]) {
            for (const amount of Object.values(this.userSpendingPatterns[currentMonth])) {
                total += amount;
            }
        }
        
        return total;
    }
    
    /**
     * Provides personalized financial tips
     * @returns {string} - A personalized financial tip
     */
    getPersonalizedTip() {
        const tips = [
            "Try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings.",
            "Setting up automatic transfers to your savings account can help build savings consistently.",
            "Review your subscriptions monthly to avoid paying for services you don't use.",
            "Consider using the envelope budgeting system for better spending control.",
            "Track every expense for a month to identify areas where you can cut back."
        ];
        
        // In a real system, we would use user data to select the most relevant tip
        return tips[Math.floor(Math.random() * tips.length)];
    }

    /**
     * Answers financial questions for the chatbot
     * @param {string} question - User's financial question
     * @returns {string} - AI response
     */
    answerFinancialQuestion(question) {
        question = question.toLowerCase();
        
        // Predefined answers for common questions
        const answers = {
            "budget": "A budget is a plan for managing your money. Start by tracking income and expenses, then allocate funds to different categories like housing, food, and entertainment.",
            "saving": "To save effectively, try the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.",
            "invest": "Investing helps grow your money over time. Consider options like stocks, bonds, mutual funds, or real estate based on your risk tolerance.",
            "debt": "To manage debt, focus on high-interest debts first while making minimum payments on others. Consider the debt avalanche or debt snowball methods.",
            "credit score": "Improve your credit score by paying bills on time, reducing debt, maintaining low credit utilization, and avoiding opening too many new accounts.",
            "retirement": "For retirement planning, contribute to accounts like 401(k) or IRA and aim to save 15% of your income for retirement.",
            "emergency fund": "An emergency fund should cover 3-6 months of expenses and be kept in an easily accessible account for unexpected situations.",
            "compound interest": "Compound interest is when you earn interest on both the money you've saved and the interest you earn. It's like interest earning interest, helping your money grow faster over time."
        };
        
        // Check for keyword matches
        for (const [keyword, answer] of Object.entries(answers)) {
            if (question.includes(keyword)) {
                return answer;
            }
        }
        
        // Default response if no match
        return "I don't have information on that specific topic yet. Would you like to know about budgeting, saving, investing, debt management, or retirement planning instead?";
    }
}

// Initialize the ML model
const finBuddyML = new FinBuddyMLModel();

// Example usage:
// const category = finBuddyML.categorizeTransaction("Walmart Supermarket", 1500);
// const insights = finBuddyML.generateInsights();
// const tip = finBuddyML.getPersonalizedTip();

// Export the model
window.finBuddyML = finBuddyML;
