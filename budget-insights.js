/**
 * Budget Insights Module for FinBuddy
 * Provides advanced analytics and visualizations based on AI Budgeting System
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize with a small delay to ensure budget data is loaded
    setTimeout(initBudgetInsights, 500);
});

function initBudgetInsights() {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) return;
    
    // Make sure AI Budget System is initialized
    if (!window.aiBudgetSystem) {
        console.error('AI Budget System not found');
        return;
    }
    
    // Generate and display insights
    generateInsights();
    
    // Add refresh button functionality
    const refreshBtn = document.getElementById('refresh-recommendation');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateInsights);
    }
    
    // Add event listener for prediction button if it exists
    const predictBtn = document.getElementById('generate-prediction-btn');
    if (predictBtn) {
        predictBtn.addEventListener('click', generatePredictions);
    }
}

/**
 * Generate and display AI budget insights
 */
function generateInsights() {
    const insightsContainer = document.getElementById('ai-budget-recommendation');
    if (!insightsContainer) return;
    
    // Get insights from AI Budget System
    const insights = window.aiBudgetSystem.generateInsights();
    
    if (!insights || insights.length === 0) {
        insightsContainer.innerHTML = 'No insights available. Add budget categories and transactions to get personalized recommendations.';
        return;
    }
    
    // Select top 3 insights to display
    const topInsights = insights.slice(0, 3);
    
    // Format insights with HTML
    let insightsHTML = '<ul class="insights-list">';
    topInsights.forEach(insight => {
        insightsHTML += `
            <li class="${insight.type}">
                <strong>${insight.message}</strong>
                <span>${insight.action}</span>
            </li>
        `;
    });
    insightsHTML += '</ul>';
    
    insightsContainer.innerHTML = insightsHTML;
}

/**
 * Generate and display AI expense predictions
 */
function generatePredictions() {
    const messageContainer = document.getElementById('prediction-message');
    const chartContainer = document.getElementById('prediction-chart-container');
    
    if (!messageContainer || !chartContainer) return;
    
    // Show loading message
    messageContainer.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Analyzing your spending patterns...</span>
        </div>
    `;
    
    // Get predictions from AI Budget System (with slight delay for UX)
    setTimeout(() => {
        const predictions = window.aiBudgetSystem.predictExpenses();
        
        if (!predictions.success) {
            messageContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${predictions.message}</span>
                </div>
            `;
            chartContainer.style.display = 'none';
            return;
        }
        
        // Show success message
        messageContainer.innerHTML = `
            <div class="success-message">
                <i class="fas fa-check-circle"></i>
                <span>${predictions.message}</span>
            </div>
        `;
        
        // Show chart container
        chartContainer.style.display = 'block';
        
        // Create chart (the actual chart creation is handled in budget-charts.js)
    }, 1000);
}

/**
 * Draw spending comparison between months
 */
function drawMonthlyComparisonChart() {
    const chartCanvas = document.getElementById('monthly-comparison-chart');
    if (!chartCanvas) return;
    
    // Get data from AI Budget System
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.transactions) {
        showEmptyChart(chartCanvas, 'No transaction data available');
        return;
    }
    
    // Get transactions and group by month
    const transactions = currentUser.transactions.filter(t => t.type === 'expense');
    
    // Group transactions by month
    const monthlyData = {};
    transactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        
        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
        }
        
        monthlyData[monthYear] += transaction.amount;
    });
    
    // Convert to arrays for Chart.js
    const months = Object.keys(monthlyData);
    const values = Object.values(monthlyData);
    
    // If no data, show empty chart
    if (months.length === 0) {
        showEmptyChart(chartCanvas, 'No transaction data available');
        return;
    }
    
    // Create chart
    new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [{
                label: 'Monthly Expenses',
                data: values,
                backgroundColor: 'rgba(52, 152, 219, 0.7)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Monthly Expense Comparison'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Expenses: ₹${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Amount (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Show empty chart with message
 */
function showEmptyChart(canvas, message) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set text style
    ctx.font = '16px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#95a5a6';
    
    // Draw message
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}
