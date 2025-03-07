/**
 * Savings Charts Module for FinBuddy
 * Implements visualizations for the savings page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize savings charts
    initSavingsCharts();
});

function initSavingsCharts() {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings) return;
    
    // Create distribution pie chart
    createSavingsDistribution();
    
    // Create timeline chart
    createSavingsTimeline();
    
    // Create forecast chart
    createForecastChart();
    
    // Add charts to goal cards
    addGoalPieCharts();
}

/**
 * Creates a pie chart showing savings distribution across goals
 */
function createSavingsDistribution() {
    const chartCanvas = document.getElementById('savings-distribution-chart');
    if (!chartCanvas) return;
    
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings || !currentUser.savings.goals || currentUser.savings.goals.length === 0) {
        showEmptyChart(chartCanvas, 'No savings goals found');
        return;
    }
    
    const goals = currentUser.savings.goals;
    
    // Prepare chart data
    const labels = goals.map(goal => goal.name);
    const data = goals.map(goal => goal.saved);
    
    // Generate colors
    const colors = generateColors(goals.length);
    
    // Create chart
    new Chart(chartCanvas, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
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
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        padding: 15
                    }
                },
                title: {
                    display: true,
                    text: 'Savings Distribution by Goal',
                    font: {
                        size: 16
                    }
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
    });
}

/**
 * Creates a line chart showing savings growth over time
 */
function createSavingsTimeline() {
    const chartCanvas = document.getElementById('savings-timeline-chart');
    if (!chartCanvas) return;
    
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings) {
        showEmptyChart(chartCanvas, 'No savings data available');
        return;
    }
    
    // Generate or get monthly savings data
    // For this demo, we'll generate some sample data
    const monthlySavings = generateSampleTimelineData();
    
    // Create chart
    new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: monthlySavings.labels,
            datasets: [{
                label: 'Monthly Savings',
                data: monthlySavings.data,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointBackgroundColor: '#3498db',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Saved: ₹${context.parsed.y.toLocaleString()}`;
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
 * Creates a forecast chart showing projected goal completion
 */
function createForecastChart() {
    const chartCanvas = document.getElementById('forecast-chart');
    if (!chartCanvas) return;
    
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings || !currentUser.savings.goals || currentUser.savings.goals.length === 0) {
        showEmptyChart(chartCanvas, 'No savings goals found');
        return;
    }
    
    // Generate forecast data for each goal
    const forecastData = generateGoalForecastData(currentUser.savings.goals);
    
    // Create chart
    new Chart(chartCanvas, {
        type: 'bar',
        data: {
            labels: forecastData.labels,
            datasets: forecastData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${datasetLabel}: ₹${value.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    title: {
                        display: true,
                        text: 'Months'
                    }
                },
                y: {
                    stacked: false,
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
 * Add pie charts to individual goal cards
 */
function addGoalPieCharts() {
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser || !currentUser.savings || !currentUser.savings.goals || currentUser.savings.goals.length === 0) {
        return;
    }
    
    // Get all goal cards
    const goalCards = document.querySelectorAll('.goal-card');
    if (goalCards.length === 0) return;
    
    // Create chart for each goal
    goalCards.forEach(card => {
        const goalId = parseInt(card.getAttribute('data-id'));
        const goal = currentUser.savings.goals.find(g => g.id === goalId);
        
        if (!goal) return;
        
        // Create chart container if not exists
        let chartContainer = card.querySelector('.goal-chart');
        if (!chartContainer) {
            chartContainer = document.createElement('div');
            chartContainer.className = 'goal-chart';
            
            const canvas = document.createElement('canvas');
            canvas.id = `goal-pie-${goalId}`;
            chartContainer.appendChild(canvas);
            
            // Find where to insert the chart (before the footer)
            const footer = card.querySelector('.goal-footer');
            if (footer) {
                card.insertBefore(chartContainer, footer);
            } else {
                card.appendChild(chartContainer);
            }
        }
        
        // Calculate data for pie chart
        const moneyNeeded = Math.max(0, goal.target - goal.saved);
        
        // Create the chart
        new Chart(document.getElementById(`goal-pie-${goalId}`), {
            type: 'doughnut',
            data: {
                labels: ['Current Savings', 'Amount Needed'],
                datasets: [{
                    data: [goal.saved, moneyNeeded],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',  // Blue
                        'rgba(231, 76, 60, 0.7)'    // Red
                    ],
                    borderColor: [
                        'rgba(52, 152, 219, 1)',
                        'rgba(231, 76, 60, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                size: 10
                            },
                            boxWidth: 10
                        }
                    }
                }
            }
        });
    });
}

/**
 * Generate sample timeline data for the line chart
 */
function generateSampleTimelineData() {
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    const totalSavings = currentUser.savings.totalSavings || 0;
    
    // Generate 6 months of data
    const months = [];
    const data = [];
    
    // Create array of last 6 months
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        
        // Generate random data that adds up to total savings
        // Make the trend increase over time for realism
        const factor = (i + 1) / 21; // Adjusts distribution
        const value = totalSavings * factor;
        data.push(value);
    }
    
    return {
        labels: months,
        data: data
    };
}

/**
 * Generate forecast data for the goals
 */
function generateGoalForecastData(goals) {
    // Create datasets for each goal
    const datasets = [];
    const monthlyLabels = [];
    
    // Generate monthly labels (next 12 months)
    for (let i = 0; i < 12; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        monthlyLabels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
    }
    
    // Generate colors for datasets
    const colors = generateColors(goals.length);
    
    // Create a dataset for each goal
    goals.forEach((goal, index) => {
        // Estimate based on current savings rate
        const monthlyContribution = goal.saved * 0.1; // Estimated monthly contribution
        const dataPoints = [];
        
        // Generate forecast data points
        let currentSaved = goal.saved;
        for (let i = 0; i < 12; i++) {
            currentSaved += monthlyContribution;
            // Cap at target
            dataPoints.push(Math.min(currentSaved, goal.target));
        }
        
        datasets.push({
            label: goal.name,
            data: dataPoints,
            backgroundColor: colors[index],
            borderColor: colors[index].replace('0.7', '1'),
            borderWidth: 1
        });
    });
    
    return {
        labels: monthlyLabels,
        datasets: datasets
    };
}

/**
 * Show empty chart message
 */
function showEmptyChart(canvas, message) {
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw empty state message
    ctx.font = '14px Arial';
    ctx.fillStyle = '#95a5a6';
    ctx.textAlign = 'center';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

/**
 * Generate colors for chart elements
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
    
    // Generate colors
    const colors = [];
    for (let i = 0; i < count; i++) {
        colors.push(baseColors[i % baseColors.length]);
    }
    
    return colors;
}
