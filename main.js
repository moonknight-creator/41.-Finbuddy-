// Main JavaScript file for FinBuddy

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    
    // Initialize AI Budget System with user data
    if (window.aiBudgetSystem && currentUser) {
        window.aiBudgetSystem.initFromUserData(currentUser);
    }

    if (!currentUser && !window.location.href.includes('login.html') && !window.location.href.includes('register.html')) {
        // Redirect to login if not logged in and not already on login/register page
        window.location.href = 'login.html';
        return;
    }

    // Update user greeting in navbar
    updateUserGreeting();
    
    // Initialize dashboard with user data
    initializeDashboard();
    
    // Add event listeners for dashboard interactions
    addDashboardEventListeners();
    
    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
});

// Function to update user greeting in navbar
function updateUserGreeting() {
    const userGreeting = document.getElementById('user-greeting');
    const profileImage = document.getElementById('profile-image');
    
    if (userGreeting) {
        const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
        if (currentUser) {
            userGreeting.textContent = `Welcome, ${currentUser.name}`;
            
            // Generate profile image based on user's name (first letter)
            if (profileImage) {
                // If we have a real profile image, use it
                if (currentUser.profileImage) {
                    profileImage.src = currentUser.profileImage;
                } else {
                    // Otherwise, create a placeholder with user's initial
                    const canvas = document.createElement('canvas');
                    canvas.width = 40;
                    canvas.height = 40;
                    const ctx = canvas.getContext('2d');
                    
                    // Background color
                    ctx.fillStyle = '#3498db';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Text
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 20px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(currentUser.name.charAt(0).toUpperCase(), canvas.width/2, canvas.height/2);
                    
                    profileImage.src = canvas.toDataURL();
                }
            }
        } else {
            userGreeting.textContent = 'Welcome';
        }
    }
}

// Function to initialize dashboard with user data
function initializeDashboard() {
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) return;
    
    // Update financial summary
    updateFinancialSummary(currentUser.financialSummary);
    
    // Update budget overview
    updateBudgetOverview(currentUser.budgetCategories);
    
    // Update savings goals
    updateSavingsGoals(currentUser.savingsGoals);
    
    // Update learning progress
    updateLearningProgress(currentUser.learningProgress);
    
    // Display AI insights if available
    displayAIInsights(currentUser.insights);
}

// Function to update financial summary display
function updateFinancialSummary(financialSummary) {
    const summaryCard = document.querySelector('.summary-card');
    if (!summaryCard) return;
    
    if (financialSummary) {
        summaryCard.querySelector('.balance-info h4').textContent = `₹${(financialSummary.currentBalance || 0).toLocaleString()}`;
        summaryCard.querySelector('.quick-stats .positive').textContent = `+₹${(financialSummary.income || 0).toLocaleString()}`;
        summaryCard.querySelector('.quick-stats .negative').textContent = `-₹${(financialSummary.expenses || 0).toLocaleString()}`;
    } else {
        // If no data, show empty values
        summaryCard.querySelector('.balance-info h4').textContent = '₹0.00';
        summaryCard.querySelector('.quick-stats .positive').textContent = '+₹0.00';
        summaryCard.querySelector('.quick-stats .negative').textContent = '-₹0.00';
    }
}

// Function to update budget overview display
function updateBudgetOverview(budgetCategories) {
    const budgetCard = document.querySelector('.budget-card');
    if (!budgetCard) return;
    
    const categories = budgetCard.querySelectorAll('.category');
    
    // If user has budget categories, display them
    if (budgetCategories && budgetCategories.length > 0) {
        // Display up to 3 categories (or however many are in the UI)
        for (let i = 0; i < Math.min(categories.length, budgetCategories.length); i++) {
            const budget = budgetCategories[i];
            const categoryElement = categories[i];
            
            // Update category name
            const categoryHeader = categoryElement.querySelector('.category-header');
            categoryHeader.querySelector('span:first-child').textContent = budget.name;
            
            // Update amounts
            categoryHeader.querySelector('span:last-child').textContent = `₹${budget.spent || 0}/₹${budget.allocated || 0}`;
            
            // Update progress bar
            const progressBar = categoryElement.querySelector('.progress');
            const progressPercentage = budget.allocated ? (budget.spent / budget.allocated) * 100 : 0;
            progressBar.style.width = `${progressPercentage}%`;
        }
    } else {
        // If no budget categories, show empty state or default message
        categories.forEach(category => {
            const categoryHeader = category.querySelector('.category-header');
            categoryHeader.querySelector('span:first-child').textContent = 'No Category';
            categoryHeader.querySelector('span:last-child').textContent = '₹0/₹0';
            
            const progressBar = category.querySelector('.progress');
            progressBar.style.width = '0%';
        });
    }
}

// Function to update savings goals display
function updateSavingsGoals(savingsGoals) {
    const savingsCard = document.querySelector('.savings-card');
    if (!savingsCard) return;
    
    const goals = savingsCard.querySelectorAll('.goal');
    
    // If user has savings goals, display them
    if (savingsGoals && savingsGoals.length > 0) {
        // Display up to however many goal elements we have in the UI
        for (let i = 0; i < Math.min(goals.length, savingsGoals.length); i++) {
            const goal = savingsGoals[i];
            const goalElement = goals[i];
            
            // Update goal details
            goalElement.querySelector('.goal-name').textContent = goal.name;
            goalElement.querySelector('.goal-amount').textContent = 
                `₹${goal.saved || 0}/₹${goal.target || 0}`;
            
            // Update progress bar
            const progressBar = goalElement.querySelector('.progress');
            const progressPercentage = goal.target ? (goal.saved / goal.target) * 100 : 0;
            progressBar.style.width = `${progressPercentage}%`;
        }
    }
}
    
// Function to update learning progress display
function updateLearningProgress(learningProgress) {
    const learningCard = document.querySelector('.learning-card');
    if (!learningCard) return;
    
    if (learningProgress) {
        // Update completion percentage
        const completionElement = learningCard.querySelector('.completion-percentage');
        if (completionElement) {
            completionElement.textContent = `${learningProgress.completionPercentage || 0}%`;
        }
        
        // Update current module
        const currentModuleElement = learningCard.querySelector('.current-module');
        if (currentModuleElement) {
            currentModuleElement.textContent = learningProgress.currentModule || 'No module in progress';
        }
    }
}

// Function to display AI insights
function displayAIInsights(insights) {
    const insightsContainer = document.querySelector('.insights-container');
    if (!insightsContainer || !insights || insights.length === 0) return;
    
    // Clear existing insights
    insightsContainer.innerHTML = '';
    
    // Add each insight
    insights.forEach(insight => {
        const insightElement = document.createElement('div');
        insightElement.className = `insight-card ${insight.type}`;
        
        insightElement.innerHTML = `
            <div class="insight-content">
                <p>${insight.message}</p>
                ${insight.action ? `<a href="${insight.actionUrl}" class="btn-secondary">${insight.action}</a>` : ''}
            </div>
        `;
        
        insightsContainer.appendChild(insightElement);
    });
}
    
// Function to add event listeners for dashboard interactions
function addDashboardEventListeners() {
    // Budget button
    const budgetButton = document.querySelector('.budget-card .btn-secondary');
    if (budgetButton) {
        budgetButton.addEventListener('click', () => {
            window.location.href = 'budget.html';
        });
    }
    
    // Savings button
    const savingsButton = document.querySelector('.savings-card .btn-secondary');
    if (savingsButton) {
        savingsButton.addEventListener('click', () => {
            window.location.href = 'savings.html';
        });
    }
    
    // Learning button
    const learningButton = document.querySelector('.learning-card .btn-secondary');
    if (learningButton) {
        learningButton.addEventListener('click', () => {
            window.location.href = 'learn.html';
        });
    }
    
    // Budget progress bars animation
    const progressBars = document.querySelectorAll('.progress');
    
    if (progressBars && progressBars.length > 0) {
        // Animate progress bars on page load
        progressBars.forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0';
            
            setTimeout(() => {
                bar.style.transition = 'width 1s ease-in-out';
                bar.style.width = width;
            }, 300);
        });
    }
    
    // Add hover effects to dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    
    if (dashboardCards && dashboardCards.length > 0) {
        dashboardCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-10px)';
                this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.1)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.05)';
            });
        });
    }
    
    // Form submission handling
    const newsletterForm = document.querySelector('.footer-newsletter form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            
            if (emailInput.value) {
                // Here you would typically send this to your backend
                alert('Thank you for subscribing to our newsletter!');
                emailInput.value = '';
            }
        });
    }
}