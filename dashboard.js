/**
 * Dashboard JavaScript functions for FinBuddy
 * Integrates with AI Budget System to provide intelligent insights
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize AI Budget System with current user data
    window.aiBudgetSystem.initFromUserData(currentUser);

    // Reference to dashboard elements
    const insightsContainer = document.getElementById('ml-insights');
    const categorizeBtn = document.getElementById('categorize-btn');
    const transactionDesc = document.getElementById('transaction-desc');
    const transactionAmount = document.getElementById('transaction-amount');
    const predictedCategory = document.getElementById('predicted-category');
    const personalizedTip = document.getElementById('personalized-tip');
    const categorizationResult = document.getElementById('categorization-result');
    
    // Handle view all budgets button
    const viewAllBudgetsBtn = document.getElementById('view-all-budgets');
    if (viewAllBudgetsBtn) {
        viewAllBudgetsBtn.addEventListener('click', () => {
            window.location.href = 'budget.html';
        });
    }

    // Initialize dashboard with user data
    function initDashboard() {
        // Update financial insights
        updateInsightsPanel();
        
        // Add smooth animations to cards
        animateDashboardCards();

        // Display budget progress
        displayBudgetProgress();
    }
    
    // Animate dashboard cards on load
    function animateDashboardCards() {
        const cards = document.querySelectorAll('.dashboard-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    // Update the AI insights panel with intelligent recommendations
    function updateInsightsPanel() {
        if (!insightsContainer) return;

        // Get insights from AI Budget System
        const insights = window.aiBudgetSystem.generateInsights();
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        if (!insights || insights.length === 0) {
            // Show default message if no insights available
            const p = document.createElement('p');
            p.className = 'insight-item';
            p.innerHTML = `<i class="fas fa-lightbulb"></i> Track your first few transactions to get personalized insights.`;
            insightsContainer.appendChild(p);
            return;
        }
        
        // Display each insight
        insights.forEach(insight => {
            const insightItem = document.createElement('p');
            insightItem.className = `insight-item ${insight.type}`;
            insightItem.innerHTML = `
                <i class="fas fa-lightbulb"></i> 
                <span>${insight.message}</span>
                <strong>${insight.action}</strong>
            `;
            insightsContainer.appendChild(insightItem);
        });
        
        // Add savings goal progress if applicable
        const savingsProgress = window.aiBudgetSystem.checkSavingsGoalProgress();
        if (savingsProgress) {
            const savingsItem = document.createElement('p');
            savingsItem.className = `insight-item ${savingsProgress.messageType}`;
            savingsItem.innerHTML = `
                <i class="fas fa-piggy-bank"></i> 
                <span>${savingsProgress.message}</span>
            `;
            insightsContainer.appendChild(savingsItem);
        }
    }

    // Handle AI expense categorization demo
    if (categorizeBtn) {
        categorizeBtn.addEventListener('click', () => {
            const description = transactionDesc.value;
            const amount = parseFloat(transactionAmount.value);
            
            if (!description || isNaN(amount) || amount <= 0) {
                alert('Please enter both a description and a valid amount');
                return;
            }
            
            // Use the ML model to categorize the transaction
            const category = window.finBuddyML.categorizeTransaction(description, amount);
            
            // Display the result
            if (predictedCategory) {
                predictedCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            }
            
            // Get personalized tip based on the category
            if (personalizedTip) {
                personalizedTip.textContent = window.finBuddyML.getPersonalizedTip();
            }
            
            // Show the result
            if (categorizationResult) {
                categorizationResult.classList.remove('hidden');
            }
            
            // Add this to the expense history for future predictions
            window.aiBudgetSystem.expenseHistory.push({
                category: category,
                amount: amount,
                date: new Date()
            });
            
            // Update insights based on new data
            updateInsightsPanel();
        });
    }

    // Display expense predictions
    function displayExpensePredictions() {
        const predictionsContainer = document.createElement('div');
        predictionsContainer.className = 'predictions-container';
        
        const predictions = window.aiBudgetSystem.predictExpenses();
        
        if (!predictions.success) {
            predictionsContainer.innerHTML = `
                <h4>Expense Predictions</h4>
                <p class="empty-state">${predictions.message}</p>
            `;
        } else {
            let predictionsHTML = `
                <h4>Predicted Expenses for ${predictions.nextMonthYear}</h4>
                <div class="predictions-list">
            `;
            
            Object.entries(predictions.predictions).forEach(([category, amount]) => {
                predictionsHTML += `
                    <div class="prediction-item">
                        <span class="category">${category}</span>
                        <span class="amount">₹${amount.toFixed(2)}</span>
                    </div>
                `;
            });
            
            predictionsHTML += '</div>';
            predictionsContainer.innerHTML = predictionsHTML;
        }
        
        // Add to insights card if it exists
        if (insightsContainer) {
            insightsContainer.appendChild(predictionsContainer);
        }
        
        // Add animated presentation of predictions
        if (insightsContainer && predictions.success) {
            const items = insightsContainer.querySelectorAll('.prediction-item');
            items.forEach((item, index) => {
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                
                setTimeout(() => {
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                }, 100 * index);
            });
        }
    }

    // Display budget progress on dashboard
    function displayBudgetProgress() {
        if (!currentUser || !currentUser.budgetSettings) return;
        
        const budgetDisplay = document.getElementById('budget-display');
        if (!budgetDisplay) return;
        
        const availableBudget = currentUser.budgetSettings.availableBudget || 0;
        const spentAmount = currentUser.budgetData?.spent || 0;
        const remainingAmount = availableBudget - spentAmount;
        const spentPercentage = availableBudget > 0 ? (spentAmount / availableBudget) * 100 : 0;
        
        budgetDisplay.innerHTML = `
            <div class="budget-progress-overview">
                <div class="budget-header">
                    <span>Budget Progress</span>
                    <span>₹${spentAmount.toLocaleString()} / ₹${availableBudget.toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: ${Math.min(100, spentPercentage)}%; 
                                               background-color: ${spentPercentage > 90 ? '#e74c3c' : '#3498db'}"></div>
                </div>
                <div class="budget-footer">
                    <span>Remaining: ₹${remainingAmount.toLocaleString()}</span>
                    <span>${currentUser.budgetSettings.periodStart.split('-').reverse().join('/')} - ${currentUser.budgetSettings.periodEnd.split('-').reverse().join('/')}</span>
                </div>
            </div>
        `;
    }

    // Initialize
    initDashboard();
    
    // Add expense predictions with a small delay to ensure all data is loaded
    setTimeout(displayExpensePredictions, 1000);
});
