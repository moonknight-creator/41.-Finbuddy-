// AI Budgeting System - Converted from Python Jupyter Notebook

/**
 * AI Budget Prediction and Visualization Module for FinBuddy
 * This module implements the core functionality from the AI-budgeting-System notebook
 * including expense prediction, visualization, and budget analysis
 */

// Import Chart.js for visualizations
// Make sure to include Chart.js in your HTML: <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

const AIBudget = (function() {
    // Private variables and functions
    let userData = null;
    let predictionCharts = {};
    
    /**
     * Get the next month in MM/YY format
     * @param {string} monthYear - Current month in MM/YY format
     * @returns {string} - Next month in MM/YY format
     */
    function getNextMonthDate(monthYear) {
        const [month, year] = monthYear.split('/');
        let nextMonth = parseInt(month, 10) + 1;
        let nextYear = parseInt(year, 10);
        
        if (nextMonth > 12) {
            nextMonth = 1;
            nextYear++;
        }
        
        return `${nextMonth.toString().padStart(2, '0')}/${nextYear.toString().padStart(2, '0')}`;
    }
    
    /**
     * Predict future expenses based on historical data
     * @param {Array} budgetHistory - Array of budget data objects with category and spending info
     * @returns {Object} - Predicted spending by category
     */
    function predictExpenses(budgetHistory) {
        if (!budgetHistory || budgetHistory.length < 2) {
            console.warn("Not enough data to predict next month's expenses.");
            return {};
        }
        
        const predictions = {};
        const categories = {};
        
        // Group data by category
        budgetHistory.forEach((entry, index) => {
            entry.categories.forEach(category => {
                if (!categories[category.name]) {
                    categories[category.name] = [];
                }
                categories[category.name].push({
                    month: index + 1, // Convert to numerical value for regression
                    spent: category.spent
                });
            });
        });
        
        // Predict spending for each category using linear regression
        Object.keys(categories).forEach(categoryName => {
            const categoryData = categories[categoryName];
            
            if (categoryData.length < 2) {
                // Not enough data points, use the last value
                predictions[categoryName] = categoryData[categoryData.length - 1].spent;
                return;
            }
            
            // Simple linear regression
            const n = categoryData.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            
            categoryData.forEach(point => {
                sumX += point.month;
                sumY += point.spent;
                sumXY += point.month * point.spent;
                sumXX += point.month * point.month;
            });
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;
            
            // Predict next month
            const nextMonth = n + 1;
            const predictedValue = slope * nextMonth + intercept;
            
            predictions[categoryName] = Math.max(0, Math.round(predictedValue * 100) / 100);
        });
        
        return predictions;
    }
    
    /**
     * Create a bar chart for predicted expenses
     * @param {Object} predictedSpending - Predicted spending by category
     * @param {string} nextMonthYear - Next month in MM/YY format
     * @param {string} canvasId - ID of canvas element for chart
     */
    function createPredictedBarChart(predictedSpending, nextMonthYear, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const categories = Object.keys(predictedSpending);
        const values = categories.map(cat => predictedSpending[cat]);
        
        // Destroy existing chart if it exists
        if (predictionCharts[canvasId]) {
            predictionCharts[canvasId].destroy();
        }
        
        predictionCharts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [{
                    label: `Predicted Spending for ${nextMonthYear}`,
                    data: values,
                    backgroundColor: [
                        '#A9A9A9', '#D3D3D3', '#B0C4DE', '#778899', '#696969'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Predicted Spending (₹)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Category'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: `Predicted Expenses for ${nextMonthYear}`
                    }
                }
            }
        });
    }
    
    /**
     * Create a pie chart for predicted expense distribution
     * @param {Object} predictedSpending - Predicted spending by category
     * @param {string} nextMonthYear - Next month in MM/YY format
     * @param {string} canvasId - ID of canvas element for chart
     */
    function createPredictedPieChart(predictedSpending, nextMonthYear, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const categories = Object.keys(predictedSpending);
        const values = categories.map(cat => predictedSpending[cat]);
        
        // Destroy existing chart if it exists
        if (predictionCharts[canvasId]) {
            predictionCharts[canvasId].destroy();
        }
        
        predictionCharts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#D3D3D3', '#C0C0C0', '#B0C4DE', '#A9A9A9', '#778899'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Predicted Expense Distribution for ${nextMonthYear}`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₹${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    /**
     * Check if savings goal is achievable and visualize progress
     * @param {number} savings - Current savings amount
     * @param {Object} savingsGoal - Savings goal object with name and target amount
     * @param {string} canvasId - ID of canvas element for chart
     */
    function checkSavingsGoalProgress(savings, savingsGoal, canvasId) {
        if (!savingsGoal || !savingsGoal.name || !savingsGoal.targetAmount) return;
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const moneyNeeded = Math.max(0, savingsGoal.targetAmount - savings);
        
        // Destroy existing chart if it exists
        if (predictionCharts[canvasId]) {
            predictionCharts[canvasId].destroy();
        }
        
        predictionCharts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Current Savings', 'Amount Needed'],
                datasets: [{
                    data: [savings, moneyNeeded],
                    backgroundColor: ['#4CAF50', '#F44336'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Savings Goal Progress for ${savingsGoal.name}`
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = savingsGoal.targetAmount;
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ₹${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        return {
            isAchievable: savings >= savingsGoal.targetAmount,
            moneyNeeded: moneyNeeded
        };
    }
    
    /**
     * Update savings based on budget performance
     * @param {number} totalMoney - Total money for the period
     * @param {Object} expenses - Expenses by category
     * @param {number} currentSavings - Current savings amount
     * @param {number} minSavingsLimit - Minimum savings limit
     * @returns {Object} - Updated savings and status information
     */
    function updateSavingsWithAnalysis(totalMoney, expenses, currentSavings, minSavingsLimit) {
        let totalExpenses = 0;
        
        // Calculate total expenses
        Object.values(expenses).forEach(category => {
            totalExpenses += category.spent || 0;
        });
        
        const remainingMoney = totalMoney - totalExpenses;
        const updatedSavings = currentSavings + remainingMoney;
        const belowMinimum = updatedSavings < minSavingsLimit;
        
        return {
            previousSavings: currentSavings,
            updatedSavings: updatedSavings,
            totalExpenses: totalExpenses,
            remainingMoney: remainingMoney,
            belowMinimum: belowMinimum
        };
    }
    
    /**
     * Create a financial summary chart
     * @param {number} totalMoney - Total money for the period
     * @param {number} totalExpenses - Total expenses
     * @param {number} updatedSavings - Updated savings amount
     * @param {string} canvasId - ID of canvas element for chart
     */
    function createFinancialSummaryChart(totalMoney, totalExpenses, updatedSavings, canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (predictionCharts[canvasId]) {
            predictionCharts[canvasId].destroy();
        }
        
        predictionCharts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Total Money', 'Total Expenses', 'Updated Savings'],
                datasets: [{
                    label: 'Financial Summary',
                    data: [totalMoney, totalExpenses, updatedSavings],
                    backgroundColor: ['#A9A9A9', '#D3D3D3', '#B0C4DE'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount (₹)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Financial Categories'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'End-of-Month Financial Summary'
                    }
                }
            }
        });
    }
    
    // Public API
    return {
        /**
         * Initialize the AI Budget module with user data
         * @param {Object} user - User data object
         */
        init: function(user) {
            userData = user;
            console.log('AI Budget module initialized with user data:', user.name);
        },
        
        /**
         * Generate predictions for next month's expenses
         * @param {Array} budgetHistory - Array of budget data objects
         * @returns {Object} - Predicted spending by category
         */
        generatePredictions: function(budgetHistory) {
            const currentMonthYear = new Date().toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/');
            const nextMonthYear = getNextMonthDate(currentMonthYear);
            const predictions = predictExpenses(budgetHistory);
            
            return {
                predictions: predictions,
                nextMonthYear: nextMonthYear
            };
        },
        
        /**
         * Visualize predicted expenses with charts
         * @param {Object} predictions - Predicted spending by category
         * @param {string} nextMonthYear - Next month in MM/YY format
         * @param {string} barChartId - ID of canvas element for bar chart
         * @param {string} pieChartId - ID of canvas element for pie chart
         */
        visualizePredictions: function(predictions, nextMonthYear, barChartId, pieChartId) {
            createPredictedBarChart(predictions, nextMonthYear, barChartId);
            createPredictedPieChart(predictions, nextMonthYear, pieChartId);
        },
        
        /**
         * Analyze savings goal progress
         * @param {number} currentSavings - Current savings amount
         * @param {Object} savingsGoal - Savings goal object
         * @param {string} canvasId - ID of canvas element for chart
         * @returns {Object} - Goal progress information
         */
        analyzeSavingsGoal: function(currentSavings, savingsGoal, canvasId) {
            return checkSavingsGoalProgress(currentSavings, savingsGoal, canvasId);
        },
        
        /**
         * Update and analyze savings based on budget performance
         * @param {number} totalMoney - Total money for the period
         * @param {Object} expenses - Expenses by category
         * @param {number} currentSavings - Current savings amount
         * @param {number} minSavingsLimit - Minimum savings limit
         * @returns {Object} - Updated savings and status information
         */
        updateSavings: function(totalMoney, expenses, currentSavings, minSavingsLimit) {
            return updateSavingsWithAnalysis(totalMoney, expenses, currentSavings, minSavingsLimit);
        },
        
        /**
         * Create a financial summary chart
         * @param {number} totalMoney - Total money for the period
         * @param {number} totalExpenses - Total expenses
         * @param {number} updatedSavings - Updated savings amount
         * @param {string} canvasId - ID of canvas element for chart
         */
        createSummaryChart: function(totalMoney, totalExpenses, updatedSavings, canvasId) {
            createFinancialSummaryChart(totalMoney, totalExpenses, updatedSavings, canvasId);
        }
    };
})();