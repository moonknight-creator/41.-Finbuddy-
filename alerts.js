document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize alerts data from user profile or create default
    let alertsData = {
        notifications: [],
        preferences: {
            budgetAlerts: true,
            savingsGoalAlerts: true,
            learningReminders: true,
            securityAlerts: true,
            marketUpdates: false,
            emailNotifications: true,
            pushNotifications: true
        },
        lastChecked: new Date().toISOString()
    };

    // Load alerts data if it exists
    if (currentUser.alertsData) {
        alertsData = currentUser.alertsData;
    }

    // Initialize alerts system
    initializeAlerts();

    // Set up real-time alert simulation (would be replaced with actual backend integration)
    setupRealTimeAlerts();

    // Add event listeners for alert interactions
    addAlertEventListeners();

    /**
     * Initialize the alerts system and render existing alerts
     */
    function initializeAlerts() {
        // Render existing alerts
        renderAlerts();
        
        // Render alert preferences if on settings page
        const preferencesSection = document.querySelector('.alert-preferences');
        if (preferencesSection) {
            renderAlertPreferences();
        }

        // Update notification badge in navbar
        updateNotificationBadge();
    }

    /**
     * Render alerts in the alerts grid
     */
    function renderAlerts() {
        const alertsGrid = document.querySelector('.alerts-grid');
        if (!alertsGrid) return;

        // Clear existing alerts
        alertsGrid.innerHTML = '';

        if (alertsData.notifications.length === 0) {
            // Show no alerts message
            alertsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No Alerts</h3>
                    <p>You don't have any notifications at the moment.</p>
                </div>
            `;
            return;
        }

        // Sort alerts by date (newest first)
        const sortedAlerts = [...alertsData.notifications].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        // Add each alert
        sortedAlerts.forEach(alert => {
            const alertCard = document.createElement('div');
            alertCard.className = `alert-card ${alert.read ? 'read' : 'unread'} ${alert.type}`;
            alertCard.setAttribute('data-id', alert.id);

            // Format the timestamp
            const alertDate = new Date(alert.timestamp);
            const formattedDate = alertDate.toLocaleDateString() + ' ' + alertDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

            // Get appropriate icon based on alert type
            const iconClass = getAlertIcon(alert.type);

            alertCard.innerHTML = `
                <div class="alert-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-header">
                        <h3>${alert.title}</h3>
                        <span class="alert-time">${formattedDate}</span>
                    </div>
                    <p>${alert.message}</p>
                    ${alert.actionLink ? `<a href="${alert.actionLink}" class="alert-action">View Details</a>` : ''}
                </div>
                <div class="alert-actions">
                    <button class="mark-read" title="${alert.read ? 'Mark as unread' : 'Mark as read'}">
                        <i class="fas ${alert.read ? 'fa-envelope' : 'fa-envelope-open'}"></i>
                    </button>
                    <button class="delete-alert" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            alertsGrid.appendChild(alertCard);
        });

        // Add event listeners to alert action buttons
        addAlertCardListeners();
    }

    /**
     * Get appropriate icon class based on alert type
     * @param {string} type - Alert type
     * @returns {string} - Font Awesome icon class
     */
    function getAlertIcon(type) {
        switch (type) {
            case 'budget':
                return 'fas fa-chart-pie';
            case 'savings':
                return 'fas fa-piggy-bank';
            case 'learning':
                return 'fas fa-graduation-cap';
            case 'security':
                return 'fas fa-shield-alt';
            case 'system':
                return 'fas fa-cog';
            case 'market':
                return 'fas fa-chart-line';
            default:
                return 'fas fa-bell';
        }
    }

    /**
     * Add event listeners to alert cards
     */
    function addAlertCardListeners() {
        // Mark as read/unread buttons
        document.querySelectorAll('.mark-read').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const alertCard = button.closest('.alert-card');
                const alertId = alertCard.getAttribute('data-id');
                toggleAlertReadStatus(alertId);
            });
        });

        // Delete alert buttons
        document.querySelectorAll('.delete-alert').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const alertCard = button.closest('.alert-card');
                const alertId = alertCard.getAttribute('data-id');
                deleteAlert(alertId);
            });
        });

        // Click on alert card to mark as read
        document.querySelectorAll('.alert-card.unread').forEach(card => {
            card.addEventListener('click', () => {
                const alertId = card.getAttribute('data-id');
                markAlertAsRead(alertId);
            });
        });
    }

    /**
     * Toggle alert read status
     * @param {string} alertId - ID of the alert to toggle
     */
    function toggleAlertReadStatus(alertId) {
        const alertIndex = alertsData.notifications.findIndex(alert => alert.id === alertId);
        if (alertIndex !== -1) {
            alertsData.notifications[alertIndex].read = !alertsData.notifications[alertIndex].read;
            saveAlertsData();
            renderAlerts();
            updateNotificationBadge();
        }
    }

    /**
     * Mark alert as read
     * @param {string} alertId - ID of the alert to mark as read
     */
    function markAlertAsRead(alertId) {
        const alertIndex = alertsData.notifications.findIndex(alert => alert.id === alertId);
        if (alertIndex !== -1 && !alertsData.notifications[alertIndex].read) {
            alertsData.notifications[alertIndex].read = true;
            saveAlertsData();
            renderAlerts();
            updateNotificationBadge();
        }
    }

    /**
     * Delete alert
     * @param {string} alertId - ID of the alert to delete
     */
    function deleteAlert(alertId) {
        alertsData.notifications = alertsData.notifications.filter(alert => alert.id !== alertId);
        saveAlertsData();
        renderAlerts();
        updateNotificationBadge();
    }

    /**
     * Update notification badge in navbar
     */
    function updateNotificationBadge() {
        const navAlertLink = document.querySelector('.nav-links a[href="alerts.html"]');
        if (!navAlertLink) return;

        // Remove existing badge if any
        const existingBadge = navAlertLink.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        // Count unread notifications
        const unreadCount = alertsData.notifications.filter(alert => !alert.read).length;
        
        // Add badge if there are unread notifications
        if (unreadCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            navAlertLink.appendChild(badge);
        }
    }

    /**
     * Render alert preferences
     */
    function renderAlertPreferences() {
        const preferencesSection = document.querySelector('.alert-preferences');
        if (!preferencesSection) return;

        preferencesSection.innerHTML = `
            <h3>Notification Preferences</h3>
            <div class="preferences-grid">
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Budget Alerts</h4>
                        <p>Get notified when you're approaching budget limits</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="budget-alerts" ${alertsData.preferences.budgetAlerts ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Savings Goal Alerts</h4>
                        <p>Get notified about your savings goal progress</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="savings-alerts" ${alertsData.preferences.savingsGoalAlerts ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Learning Reminders</h4>
                        <p>Get reminders to continue your financial education</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="learning-alerts" ${alertsData.preferences.learningReminders ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Security Alerts</h4>
                        <p>Get notified about important security events</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="security-alerts" ${alertsData.preferences.securityAlerts ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Market Updates</h4>
                        <p>Get notified about relevant market changes</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="market-alerts" ${alertsData.preferences.marketUpdates ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <h3>Delivery Methods</h3>
            <div class="preferences-grid">
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Email Notifications</h4>
                        <p>Receive notifications via email</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="email-notifications" ${alertsData.preferences.emailNotifications ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="preference-item">
                    <div class="preference-info">
                        <h4>Push Notifications</h4>
                        <p>Receive push notifications in browser</p>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" id="push-notifications" ${alertsData.preferences.pushNotifications ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>
            
            <button class="btn-primary save-preferences">Save Preferences</button>
        `;

        // Add event listener to save preferences button
        const saveButton = preferencesSection.querySelector('.save-preferences');
        if (saveButton) {
            saveButton.addEventListener('click', saveAlertPreferences);
        }
    }

    /**
     * Save alert preferences
     */
    function saveAlertPreferences() {
        alertsData.preferences = {
            budgetAlerts: document.getElementById('budget-alerts').checked,
            savingsGoalAlerts: document.getElementById('savings-alerts').checked,
            learningReminders: document.getElementById('learning-alerts').checked,
            securityAlerts: document.getElementById('security-alerts').checked,
            marketUpdates: document.getElementById('market-alerts').checked,
            emailNotifications: document.getElementById('email-notifications').checked,
            pushNotifications: document.getElementById('push-notifications').checked
        };

        saveAlertsData();
        showToast('Preferences saved successfully');
    }

    /**
     * Show toast notification
     * @param {string} message - Message to display
     */
    function showToast(message) {
        // Create toast element if it doesn't exist
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }

        // Set message and show toast
        toast.textContent = message;
        toast.classList.add('show');

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    /**
     * Save alerts data to localStorage
     */
    function saveAlertsData() {
        // Update last checked time
        alertsData.lastChecked = new Date().toISOString();

        // Save to current user data
        currentUser.alertsData = alertsData;
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
    }

    /**
     * Set up real-time alert simulation
     * This would be replaced with actual backend integration in production
     */
    function setupRealTimeAlerts() {
        // Check for new alerts every minute (simulating real-time updates)
        setInterval(() => {
            // Only generate alerts if user has preferences enabled
            if (shouldGenerateAlerts()) {
                checkForNewAlerts();
            }
        }, 60000); // Check every minute

        // Initial check for demo purposes
        setTimeout(() => {
            if (shouldGenerateAlerts() && alertsData.notifications.length === 0) {
                generateSampleAlert();
            }
        }, 5000); // Generate a sample alert after 5 seconds if no alerts exist
    }

    /**
     * Check if alerts should be generated based on user preferences
     * @returns {boolean} - Whether alerts should be generated
     */
    function shouldGenerateAlerts() {
        return alertsData.preferences.budgetAlerts || 
               alertsData.preferences.savingsGoalAlerts || 
               alertsData.preferences.learningReminders || 
               alertsData.preferences.securityAlerts || 
               alertsData.preferences.marketUpdates;
    }

    /**
     * Check for new alerts based on user activity and preferences
     */
    function checkForNewAlerts() {
        // In a real app, this would check with the backend for new alerts
        // For demo purposes, we'll randomly generate alerts based on preferences

        // Get user data for context-aware alerts
        const userData = JSON.parse(localStorage.getItem('finbuddy_current_user'));
        
        // Check for budget alerts
        if (alertsData.preferences.budgetAlerts && userData.budgetCategories) {
            checkBudgetAlerts(userData.budgetCategories);
        }
        
        // Check for savings goal alerts
        if (alertsData.preferences.savingsGoalAlerts && userData.savingsData && userData.savingsData.goals) {
            checkSavingsGoalAlerts(userData.savingsData.goals);
        }
        
        // Check for learning reminders
        if (alertsData.preferences.learningReminders && userData.learningProgress) {
            checkLearningReminders(userData.learningProgress);
        }
        
        // Occasionally generate security alerts
        if (alertsData.preferences.securityAlerts && Math.random() < 0.1) {
            generateSecurityAlert();
        }
        
        // Occasionally generate market updates
        if (alertsData.preferences.marketUpdates && Math.random() < 0.2) {
            generateMarketUpdate();
        }
    }

    /**
     * Check for budget alerts
     * @param {Array} budgetCategories - User's budget categories
     */
    function checkBudgetAlerts(budgetCategories) {
        // Find categories that are close to or over budget
        budgetCategories.forEach(category => {
            if (category.spent / category.limit > 0.9) {
                // Over 90% of budget used
                const percentUsed = Math.round((category.spent / category.limit) * 100);
                const isOverBudget = category.spent > category.limit;
                
                generateAlert({
                    type: 'budget',
                    title: isOverBudget ? `Budget Exceeded: ${category.name}` : `Budget Alert: ${category.name}`,
                    message: isOverBudget 
                        ? `You've exceeded your ${category.name} budget by ₹${(category.spent - category.limit).toFixed(2)}.` 
                        : `You've used ${percentUsed}% of your ${category.name} budget.`,
                    actionLink: 'budget.html'
                });
            }
        });
    }

    /**
     * Check for savings goal alerts
     * @param {Array} savingsGoals - User's savings goals
     */
    function checkSavingsGoalAlerts(savingsGoals) {
        savingsGoals.forEach(goal => {
            // Calculate progress percentage
            const progressPercent = (goal.saved / goal.total) * 100;
            
            // Generate milestone alerts
            if (progressPercent >= 25 && progressPercent < 26) {
                generateAlert({
                    type: 'savings',
                    title: `25% Milestone: ${goal.name}`,
                    message: `You've reached 25% of your savings goal for ${goal.name}!`,
                    actionLink: 'savings.html'
                });
            } else if (progressPercent >= 50 && progressPercent < 51) {
                generateAlert({
                    type: 'savings',
                    title: `Halfway There: ${goal.name}`,
                    message: `You've reached 50% of your savings goal for ${goal.name}!`,
                    actionLink: 'savings.html'
                });
            } else if (progressPercent >= 75 && progressPercent < 76) {
                generateAlert({
                    type: 'savings',
                    title: `75% Milestone: ${goal.name}`,
                    message: `You're 75% of the way to your ${goal.name} goal!`,
                    actionLink: 'savings.html'
                });
            } else if (progressPercent >= 100) {
                generateAlert({
                    type: 'savings',
                    title: `Goal Achieved: ${goal.name}`,
                    message: `Congratulations! You've reached your savings goal for ${goal.name}!`,
                    actionLink: 'savings.html'
                });
            }
            
            // Check if goal deadline is approaching
            if (goal.targetDate) {
                const targetDate = new Date(goal.targetDate);
                const today = new Date();
                const daysRemaining = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysRemaining > 0 && daysRemaining <= 7 && progressPercent < 100) {
                    generateAlert({
                        type: 'savings',
                        title: `Goal Deadline Approaching: ${goal.name}`,
                        message: `Your ${goal.name} goal deadline is in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`,
                        actionLink: 'savings.html'
                    });
                }
            }
        });
    }

    /**
     * Check for learning reminders
     * @param {Object} learningProgress - User's learning progress
     */
    function checkLearningReminders(learningProgress) {
        // If user has an in-progress course but hasn't completed it
        if (learningProgress.currentCourse && learningProgress.progress < 100) {
            // Calculate days since last activity
            const lastActivity = new Date(learningProgress.lastActivity || Date.now());
            const today = new Date();
            const daysSinceActivity = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
            
            // Remind after 3 days of inactivity
            if (daysSinceActivity >= 3) {
                generateAlert({
                    type: 'learning',
                    title: 'Continue Learning',
                    message: `It's been ${daysSinceActivity} days since you worked on your ${learningProgress.currentCourse.name} course.`,
                    actionLink: 'learn.html'
                });
            }
        }
        
        // Suggest new courses if user has completed courses or has none in progress
        if ((!learningProgress.currentCourse || learningProgress.progress === 100) && Math.random() < 0.3) {
            generateAlert({
                type: 'learning',
                title: 'New Learning Opportunity',
                message: 'Discover new financial courses to enhance your knowledge and skills.',
                actionLink: 'learn.html'
            });
        }
    }

    /**
     * Generate a security alert
     */
    function generateSecurityAlert() {
        const securityAlerts = [
            {
                title: 'Security Check',
                message: 'It\'s been 30 days since your last password change. Consider updating your password for better security.'
            },
            {
                title: 'New Device Login',
                message: 'Your account was accessed from a new device. If this wasn\'t you, please secure your account immediately.'
            },
            {
                title: 'Privacy Settings Review',
                message: 'We recommend reviewing your privacy settings to ensure your data is protected as you prefer.'
            }
        ];
        
        const randomAlert = securityAlerts[Math.floor(Math.random() * securityAlerts.length)];
        
        generateAlert({
            type: 'security',
            title: randomAlert.title,
            message: randomAlert.message
        });
    }

    /**
     * Generate a market update alert
     */
    function generateMarketUpdate() {
        const marketUpdates = [
            {
                title: 'Market Trend Alert',
                message: 'The stock market showed significant movement today. This might affect your investment strategy.'
            },
            {
                title: 'Interest Rate Update',
                message: 'Central bank has adjusted interest rates. This could impact your savings and loan rates.'
            },
            {
                title: 'Economic Indicator Report',
                message: 'New economic indicators suggest potential changes in the financial landscape.'
            }
        ];
        
        const randomUpdate = marketUpdates[Math.floor(Math.random() * marketUpdates.length)];
        
        generateAlert({
            type: 'market',
            title: randomUpdate.title,
            message: randomUpdate.message
        });
    }

    /**
     * Generate a sample alert for demonstration purposes
     */
    function generateSampleAlert() {
        generateAlert({
            type: 'system',
            title: 'Welcome to FinBuddy Alerts',
            message: 'This is where you\'ll receive important notifications about your finances, goals, and learning progress.'
        });
    }

    /**
     * Generate a new alert
     * @param {Object} alertData - Alert data
     */
    function generateAlert(alertData) {
        // Check if a similar alert already exists to prevent duplicates
        const similarAlertExists = alertsData.notifications.some(alert => 
            alert.title === alertData.title && 
            alert.message === alertData.message &&
            new Date(alert.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        );
        
        if (similarAlertExists) return;
        
        // Create new alert
        const newAlert = {
            id: generateUniqueId(),
            type: alertData.type || 'system',
            title: alertData.title,
            message: alertData.message,
            actionLink: alertData.actionLink || null,
            read: false,
            timestamp: new Date().toISOString()
        };
        
        // Add to notifications array
        alertsData.notifications.unshift(newAlert);
        
        // Limit to 50 notifications to prevent excessive storage
        if (alertsData.notifications.length > 50) {
            alertsData.notifications = alertsData.notifications.slice(0, 50);
        }
        
        // Save alerts data
        saveAlertsData();
        
        // Update UI if on alerts page
        renderAlerts();
        updateNotificationBadge();
        
        // Show browser notification if enabled
        if (alertsData.preferences.pushNotifications) {
            showBrowserNotification(newAlert);
        }
    }

    /**
     * Generate a unique ID for alerts
     * @returns {string} - Unique ID
     */
    function generateUniqueId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Show browser notification
     * @param {Object} alert - Alert data
     */
    function showBrowserNotification(alert) {
        // Check if browser notifications are supported and permitted
        if (!('Notification' in window)) {
            return;
        }
        
        // Request permission if not granted
        if (Notification.permission !== 'granted') {
            Notification.requestPermission();
            return;
        }
        
        // Create and show notification
        const notification = new Notification(alert.title, {
            body: alert.message,
            icon: '/favicon.ico' // Replace with your app's icon
        });
        
        // Add click handler to open relevant page
        if (alert.actionLink) {
            notification.onclick = function() {
                window.open(alert.actionLink, '_blank');
            };
        }
    }

    /**
     * Add event listeners for alert interactions
     */
    function addAlertEventListeners() {
        // Mark all as read button
        const markAllReadBtn = document.querySelector('.mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllAlertsAsRead);
        }
        
        // Clear all alerts button
        const clearAllBtn = document.querySelector('.clear-all-alerts');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAllAlerts);
        }
        
        // Filter alerts dropdown
        const filterDropdown = document.querySelector('.filter-alerts');
        if (filterDropdown) {
            filterDropdown.addEventListener('change', filterAlerts);
        }
    }

    /**
     * Mark all alerts as read
     */
    function markAllAlertsAsRead() {
        if (alertsData.notifications.length === 0) return;
        
        alertsData.notifications.forEach(alert => {
            alert.read = true;
        });
        
        saveAlertsData();
        renderAlerts();
        updateNotificationBadge();
        showToast('All notifications marked as read');
    }

    /**
     * Clear all alerts
     */
    function clearAllAlerts() {
        if (alertsData.notifications.length === 0) return;
        
        // Confirm before clearing
        if (confirm('Are you sure you want to delete all notifications?')) {
            alertsData.notifications = [];
            saveAlertsData();
            renderAlerts();
            updateNotificationBadge();
            showToast('All notifications cleared');
        }
    }

    /**
     * Filter alerts by type
     */
    function filterAlerts(e) {
        const filterValue = e.target.value;
        const alertCards = document.querySelectorAll('.alert-card');
        
        if (filterValue === 'all') {
            alertCards.forEach(card => card.style.display = 'flex');
        } else {
            alertCards.forEach(card => {
                if (card.classList.contains(filterValue)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        }
    }
})