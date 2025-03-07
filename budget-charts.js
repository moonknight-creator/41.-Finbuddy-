/**
 * Budget Charts Module for FinBuddy
 * Implements various data visualizations for the budget page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize chart functionality
    initBudgetCharts();
});

function initBudgetCharts() {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) return;
    
    // Create expense breakdown chart
    createExpenseBreakdownChart();
    
    // Create spending distribution pie chart
    createSpendingDistributionChart();
    
    // Create savings goal pie chart
    createSavingsGoalPie();
    
    // Setup prediction chart functionality
    setupPredictionChart();
    
    // Update savings details
    updateSavingsDetails();
}

/**
 * Creates bar chart showing expenses vs limits for each category
 */
function createExpenseBreakdownChart() {
    const chartCanvas = document.getElementById('expenses-chart');
    if (!chartCanvas) return;
    
    // Get chart data from AI Budget System
    const chartData = window.aiBudgetSystem.getExpenseBarChartData();
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: chartData.datasets.map((dataset, index) => {
                return {
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: index === 0 ? 
                        'rgba(52, 152, 219, 0.7)' : 'rgba(44, 62, 80, 0.5)',
                    borderColor: index === 0 ? 
                        'rgba(52, 152, 219, 1)' : 'rgba(44, 62, 80, 0.8)',
                    borderWidth: 1
                };
            })
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    };
    
    // Create chart instance
    const expensesChart = new Chart(chartCanvas, config);
}

/**
 * Creates pie chart showing expense distribution by category
 */
function createSpendingDistributionChart() {
    const chartCanvas = document.getElementById('distribution-chart');
    if (!chartCanvas) return;
    
    // Get chart data from AI Budget System
    const chartData = window.aiBudgetSystem.getExpensePieChartData();
    
    // Generate colors array for pie segments
    const colors = generateColors(chartData.labels.length);
    
    // Create chart configuration
    const config = {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.datasets[0].data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                            const percentage = ((value * 100) / total).toFixed(1);
                            return `${context.label}: ₹${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
    
    // Create chart instance
    const distributionChart = new Chart(chartCanvas, config);
}

/**
 * Creates a pie chart showing savings goal progress
 * Implementation of savings_goal_pie from the AI notebook
 */
function createSavingsGoalPie() {
    const chartCanvas = document.getElementById('savings-goal-pie');
    const goalStatus = document.getElementById('savings-goal-status');
    
    if (!chartCanvas || !goalStatus) return;
    
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings) return;
    
    // Get AI budget system data
    const savingsData = window.aiBudgetSystem.checkSavingsGoalProgress();
    
    // If no savings goal set
    if (!savingsData) {
        showEmptyChart(chartCanvas, 'No savings goal set');
        goalStatus.textContent = 'Set a savings goal to track your progress';
        return;
    }
    
    // Extract data from the AI budget system
    const chartData = savingsData.chartData;
    const message = savingsData.message;
    const messageType = savingsData.messageType;
    
    // Create pie chart
    new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.values,
                backgroundColor: chartData.colors,
                borderColor: chartData.colors.map(color => color === 'green' ? '#27ae60' : '#e74c3c'),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Savings Goal Progress',
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
    
    // Update goal status message
    goalStatus.textContent = message;
    goalStatus.className = `goal-status ${messageType}`;
}

/**
 * Update the savings details panel
 */
function updateSavingsDetails() {
    const currentSavingsElem = document.getElementById('current-savings-amount');
    const goalAmountElem = document.getElementById('savings-goal-amount');
    const goalItemElem = document.getElementById('savings-goal-item');
    const goalDateElem = document.getElementById('savings-goal-date');
    
    if (!currentSavingsElem || !goalAmountElem || !goalItemElem || !goalDateElem) return;
    
    // Get data from AI Budget System
    const savings = window.aiBudgetSystem.savings;
    const goalItem = window.aiBudgetSystem.savingsGoalItem;
    const goalCost = window.aiBudgetSystem.savingsGoalCost;
    
    // Update the UI elements
    currentSavingsElem.textContent = `₹${savings.toLocaleString()}`;
    
    if (goalItem && goalCost > 0) {
        goalAmountElem.textContent = `₹${goalCost.toLocaleString()}`;
        goalItemElem.textContent = goalItem;
        
        // Calculate estimated completion date
        // Simple calculation: assume monthly savings rate is 10% of current savings
        if (savings > 0) {
            const monthlySavingsRate = savings * 0.1;
            const remainingAmount = Math.max(0, goalCost - savings);
            const monthsNeeded = Math.ceil(remainingAmount / monthlySavingsRate);
            
            if (monthsNeeded <= 0) {
                goalDateElem.textContent = 'Goal Achieved!';
            } else {
                const futureDate = new Date();
                futureDate.setMonth(futureDate.getMonth() + monthsNeeded);
                goalDateElem.textContent = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            }
        } else {
            goalDateElem.textContent = 'Cannot calculate (no savings data)';
        }
    } else {
        goalAmountElem.textContent = 'Not Set';
        goalItemElem.textContent = 'Not Set';
        goalDateElem.textContent = 'N/A';
    }
}

/**
 * Sets up the AI prediction chart functionality
 */
function setupPredictionChart() {
    const generateBtn = document.getElementById('generate-prediction-btn');
    if (!generateBtn) return;
    
    // Add click handler for the generate button
    generateBtn.addEventListener('click', function() {
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        
        // Add slight delay to show the processing animation
        setTimeout(() => {
            generatePredictionChart();
            this.disabled = false;
            this.innerHTML = 'Regenerate Predictions';
        }, 1000);
    });
}

/**
 * Generates and displays the AI prediction chart
 */
function generatePredictionChart() {
    const chartContainer = document.getElementById('prediction-chart-container');
    const messageContainer = document.getElementById('prediction-message');
    const chartCanvas = document.getElementById('prediction-chart');
    
    if (!chartContainer || !messageContainer || !chartCanvas) return;
    
    // Get predictions from AI Budget System
    const predictions = window.aiBudgetSystem.predictExpenses();
    
    // Update message container with status
    messageContainer.innerHTML = `<p class="${predictions.success ? 'success' : 'error'}">${predictions.message}</p>`;
    
    // If prediction failed, hide the chart
    if (!predictions.success) {
        chartContainer.style.display = 'none';
        return;
    }
    
    // Show chart container
    chartContainer.style.display = 'block';
    
    // Prepare data for chart
    const labels = Object.keys(predictions.predictions);
    const data = Object.values(predictions.predictions);
    
    // Generate colors for chart bars
    const colors = generateColors(labels.length);
    
    // Destroy existing chart if there is one
    if (window.predictionChart) {
        window.predictionChart.destroy();
    }
    
    // Create chart configuration
    const config = {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: `Predicted Expenses for ${predictions.nextMonthYear}`,
                data: data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('0.7', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Predicted: ₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    };
    
    // Create chart instance and store reference
    window.predictionChart = new Chart(chartCanvas, config);
}

/**
 * Generates an array of colors for chart elements
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color strings
 */
function generateColors(count) {
    const baseColors = [
        'rgba(52, 152, 219, 0.7)',  // Blue
        'rgba(46, 204, 113, 0.7)',  // Green
        'rgba(155, 89, 182, 0.7)',  // Purple
        'rgba(52, 73, 94, 0.7)',    // Dark Blue
        'rgba(241, 196, 15, 0.7)',  // Yellow
        'rgba(231, 76, 60, 0.7)',   // Red
        'rgba(26, 188, 156, 0.7)',  // Turquoise
        'rgba(230, 126, 34, 0.7)',  // Orange
    ];
    
    // If we need more colors than we have in the base array,
    // we'll generate variations
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}
