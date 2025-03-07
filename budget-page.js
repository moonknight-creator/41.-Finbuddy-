/**
 * Budget Page Controller for FinBuddy
 * Coordinates between different modules and enhances the budget page functionality
 */

// Backend service for API communication
const finbuddyBackend = {
    apiUrl: 'https://api.finbuddy.com/v1', // Replace with your actual backend URL
    
    // Get user data from backend
    async getUserData(userId) {
        try {
            const token = localStorage.getItem('finbuddy_auth_token');
            const response = await fetch(`${this.apiUrl}/users/${userId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) throw new Error('Failed to fetch user data');
            return await response.json();
        } catch (error) {
            console.error('Backend error:', error);
            // Fallback to local storage if backend fails
            return JSON.parse(localStorage.getItem('finbuddy_current_user')) || null;
        }
    },
    
    // Update user budget data
    async updateUserBudget(userId, budgetData) {
        try {
            const token = localStorage.getItem('finbuddy_auth_token');
            const response = await fetch(`${this.apiUrl}/users/${userId}/budget`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(budgetData)
            });
            
            if (!response.ok) throw new Error('Failed to update budget data');
            return await response.json();
        } catch (error) {
            console.error('Backend update error:', error);
            // Store locally as fallback
            const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user')) || {};
            Object.assign(currentUser, budgetData);
            localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
            return currentUser;
        }
    },
    
    // Sync local changes with backend
    async syncLocalChanges(userId) {
        try {
            const localData = JSON.parse(localStorage.getItem('finbuddy_current_user'));
            if (!localData) return null;
            
            const token = localStorage.getItem('finbuddy_auth_token');
            const response = await fetch(`${this.apiUrl}/users/${userId}/sync`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(localData)
            });
            
            if (!response.ok) throw new Error('Failed to sync data');
            return await response.json();
        } catch (error) {
            console.error('Sync error:', error);
            return null;
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the budget page
    initBudgetPage();
});

/**
 * Initialize the budget page
 */
async function initBudgetPage() {
    // Show loading indicator
    showLoadingState(true);
    
    // Get authentication info
    const authToken = localStorage.getItem('finbuddy_auth_token');
    const userId = localStorage.getItem('finbuddy_user_id');
    
    if (!authToken || !userId) {
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Get current user data from backend
        const currentUser = await finbuddyBackend.getUserData(userId);
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Cache user data locally for offline use
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
        
        // Update page header
        updatePageHeader();
        
        // Initialize tabs if they exist
        initTabs();
        
        // Connect budget module with savings module
        connectBudgetAndSavings();
        
        // Sync any local changes that might have happened offline
        finbuddyBackend.syncLocalChanges(userId);
    } catch (error) {
        console.error('Failed to initialize budget page:', error);
        showBudgetNotification('Failed to load budget data. Using offline data.', 'warning');
    } finally {
        showLoadingState(false);
    }
}

/**
 * Show or hide loading state
 */
function showLoadingState(isLoading) {
    const loadingElement = document.querySelector('.loading-indicator');
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'flex' : 'none';
    }
}

/**
 * Update the page header with user's name and budget period
 */
function updatePageHeader() {
    const headerTitleElem = document.querySelector('.page-header h1');
    const headerSubtitleElem = document.querySelector('.page-header p');
    
    if (headerTitleElem && headerSubtitleElem) {
        const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
        if (currentUser) {
            headerTitleElem.textContent = `${currentUser.name}'s Budget`;
            
            // Set budget period in subtitle if available
            if (currentUser.budgetSettings && currentUser.budgetSettings.periodStart && currentUser.budgetSettings.periodEnd) {
                const startDate = new Date(currentUser.budgetSettings.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const endDate = new Date(currentUser.budgetSettings.periodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                headerSubtitleElem.textContent = `Budget Period: ${startDate} - ${endDate}`;
            }
        }
    }
}

/**
 * Initialize tab navigation if present
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) return;
    
    // Add click handler to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding content
            const tabId = this.getAttribute('data-tab');
            const targetContent = document.querySelector(`.tab-content[data-tab="${tabId}"]`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Activate first tab by default
    if (tabButtons[0]) {
        tabButtons[0].click();
    }
}

/**
 * Connect budget data with savings functionality
 */
function connectBudgetAndSavings() {
    // Listen for budget updates
    document.addEventListener('budget:updated', function(e) {
        // Update savings goal in AI budget system
        updateSavingsGoalFromBudget();
    });
    
    // Initial update
    updateSavingsGoalFromBudget();
}

/**
 * Update savings goal data in the AI budget system based on the user's budget settings
 */
async function updateSavingsGoalFromBudget() {
    const userId = localStorage.getItem('finbuddy_user_id');
    if (!userId || !window.aiBudgetSystem) return;
    
    try {
        // Get latest user data from backend
        const currentUser = await finbuddyBackend.getUserData(userId);
        
        // Update savings amount from user data
        if (currentUser.savings) {
            window.aiBudgetSystem.savings = currentUser.savings.totalSavings || 0;
        }
        
        // Update savings goal from user data
        if (currentUser.savings && currentUser.savings.goals && currentUser.savings.goals.length > 0) {
            // Use first goal as primary
            const primaryGoal = currentUser.savings.goals[0];
            window.aiBudgetSystem.savingsGoalItem = primaryGoal.name;
            window.aiBudgetSystem.savingsGoalCost = primaryGoal.target;
        }
    } catch (error) {
        console.error('Failed to update savings data:', error);
        // Fall back to local storage
        const localUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
        if (localUser && localUser.savings) {
            window.aiBudgetSystem.savings = localUser.savings.totalSavings || 0;
            
            if (localUser.savings.goals && localUser.savings.goals.length > 0) {
                const primaryGoal = localUser.savings.goals[0];
                window.aiBudgetSystem.savingsGoalItem = primaryGoal.name;
                window.aiBudgetSystem.savingsGoalCost = primaryGoal.target;
            }
        }
    }
}

/**
 * Show notification when budget actions are completed
 */
async function showBudgetNotification(message, type = 'info') {
    // Use the notification system if available
    if (window.notifications) {
        window.notifications.show(message, type);
    } else {
        // Fallback to alert
        alert(message);
    }
    
    // Sync changes to backend
    const userId = localStorage.getItem('finbuddy_user_id');
    if (userId) {
        await finbuddyBackend.syncLocalChanges(userId);
    }
    
    // Trigger custom event for budget update
    document.dispatchEvent(new CustomEvent('budget:updated'));
}
