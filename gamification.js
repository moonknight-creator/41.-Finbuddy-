/**
 * Gamification Module for FinBuddy
 * Implements rewards, badges, and achievement tracking for the learning platform
 */

document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize gamification data from user profile or create default
    let gamificationData = {
        points: 0,
        level: 1,
        badges: [],
        achievements: [],
        streaks: {
            current: 0,
            longest: 0,
            lastActivity: null
        },
        rewards: []
    };

    // Load gamification data if it exists
    if (currentUser.gamificationData) {
        gamificationData = currentUser.gamificationData;
    }

    // Define available badges
    const availableBadges = [
        { id: 'first_login', name: 'First Steps', description: 'Log in to FinBuddy for the first time', icon: 'fas fa-shoe-prints', points: 10 },
        { id: 'budget_creator', name: 'Budget Master', description: 'Create your first budget', icon: 'fas fa-chart-pie', points: 20 },
        { id: 'savings_starter', name: 'Savings Starter', description: 'Create your first savings goal', icon: 'fas fa-piggy-bank', points: 20 },
        { id: 'goal_achiever', name: 'Goal Achiever', description: 'Reach a savings goal', icon: 'fas fa-trophy', points: 50 },
        { id: 'learning_beginner', name: 'Learning Beginner', description: 'Complete your first learning module', icon: 'fas fa-book', points: 30 },
        { id: 'learning_intermediate', name: 'Finance Student', description: 'Complete 5 learning modules', icon: 'fas fa-graduation-cap', points: 50 },
        { id: 'learning_advanced', name: 'Finance Expert', description: 'Complete all basic learning modules', icon: 'fas fa-user-graduate', points: 100 },
        { id: 'streak_week', name: 'Weekly Streak', description: 'Log in for 7 consecutive days', icon: 'fas fa-calendar-week', points: 30 },
        { id: 'streak_month', name: 'Monthly Dedication', description: 'Log in for 30 consecutive days', icon: 'fas fa-calendar-alt', points: 100 },
        { id: 'budget_adherence', name: 'Budget Adherent', description: 'Stay within budget for a full month', icon: 'fas fa-check-circle', points: 50 },
        { id: 'micro_saver', name: 'Micro Saver', description: 'Make 10 micro-savings transactions', icon: 'fas fa-coins', points: 40 },
        { id: 'investment_starter', name: 'Investment Starter', description: 'Learn about investments', icon: 'fas fa-chart-line', points: 30 }
    ];

    // Define level thresholds
    const levelThresholds = [
        0,      // Level 1
        100,    // Level 2
        250,    // Level 3
        500,    // Level 4
        1000,   // Level 5
        2000,   // Level 6
        3500,   // Level 7
        5000,   // Level 8
        7500,   // Level 9
        10000   // Level 10
    ];

    // Initialize gamification system
    initializeGamification();

    /**
     * Initialize the gamification system
     */
    function initializeGamification() {
        // Check for first login badge
        checkAndAwardBadge('first_login');
        
        // Check streak
        updateStreak();
        
        // Update UI elements
        updateGamificationUI();
        
        // Add event listeners for gamification interactions
        addGamificationEventListeners();
    }

    /**
     * Update streak information
     */
    function updateStreak() {
        const today = new Date().toDateString();
        
        if (!gamificationData.streaks.lastActivity) {
            // First activity
            gamificationData.streaks.current = 1;
            gamificationData.streaks.longest = 1;
            gamificationData.streaks.lastActivity = today;
        } else {
            const lastActivity = new Date(gamificationData.streaks.lastActivity).toDateString();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastActivity === today) {
                // Already logged in today, do nothing
                return;
            } else if (lastActivity === yesterdayString) {
                // Consecutive day
                gamificationData.streaks.current++;
                gamificationData.streaks.lastActivity = today;
                
                // Update longest streak if current is longer
                if (gamificationData.streaks.current > gamificationData.streaks.longest) {
                    gamificationData.streaks.longest = gamificationData.streaks.current;
                }
                
                // Check for streak badges
                if (gamificationData.streaks.current >= 7) {
                    checkAndAwardBadge('streak_week');
                }
                if (gamificationData.streaks.current >= 30) {
                    checkAndAwardBadge('streak_month');
                }
            } else {
                // Streak broken
                gamificationData.streaks.current = 1;
                gamificationData.streaks.lastActivity = today;
            }
        }
        
        saveGamificationData();
    }

    /**
     * Check if a badge should be awarded and award it if not already earned
     * @param {string} badgeId - ID of the badge to check
     * @returns {boolean} - Whether the badge was newly awarded
     */
    function checkAndAwardBadge(badgeId) {
        // Check if badge already earned
        if (gamificationData.badges.some(badge => badge.id === badgeId)) {
            return false;
        }
        
        // Find badge in available badges
        const badge = availableBadges.find(badge => badge.id === badgeId);
        if (!badge) return false;
        
        // Award badge
        gamificationData.badges.push({
            id: badge.id,
            name: badge.name,
            description: badge.description,
            icon: badge.icon,
            dateEarned: new Date().toISOString()
        });
        
        // Award points
        awardPoints(badge.points, `Earned ${badge.name} badge`);
        
        // Show badge earned notification
        showBadgeNotification(badge);
        
        saveGamificationData();
        return true;
    }

    /**
     * Award points to the user
     * @param {number} points - Number of points to award
     * @param {string} reason - Reason for awarding points
     */
    function awardPoints(points, reason) {
        gamificationData.points += points;
        
        // Check if user leveled up
        const newLevel = calculateLevel(gamificationData.points);
        const didLevelUp = newLevel > gamificationData.level;
        
        if (didLevelUp) {
            gamificationData.level = newLevel;
            showLevelUpNotification(newLevel);
        }
        
        // Add to achievements log
        gamificationData.achievements.push({
            type: 'points',
            points: points,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
        saveGamificationData();
        updateGamificationUI();
    }

    /**
     * Calculate level based on points
     * @param {number} points - Total points
     * @returns {number} - Current level
     */
    function calculateLevel(points) {
        let level = 1;
        for (let i = 1; i < levelThresholds.length; i++) {
            if (points >= levelThresholds[i]) {
                level = i + 1;
            } else {
                break;
            }
        }
        return level;
    }

    /**
     * Show badge earned notification
     * @param {Object} badge - Badge data
     */
    function showBadgeNotification(badge) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'badge-notification';
        notification.innerHTML = `
            <div class="badge-icon">
                <i class="${badge.icon}"></i>
            </div>
            <div class="badge-info">
                <h3>Badge Earned: ${badge.name}</h3>
                <p>${badge.description}</p>
                <p class="badge-points">+${badge.points} points</p>
            </div>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation class after a small delay to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add event listener to close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Show level up notification
     * @param {number} newLevel - New level achieved
     */
    function showLevelUpNotification(newLevel) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'level-notification';
        notification.innerHTML = `
            <div class="level-icon">
                <i class="fas fa-level-up-alt"></i>
            </div>
            <div class="level-info">
                <h3>Level Up!</h3>
                <p>You've reached level ${newLevel}</p>
            </div>
            <button class="close-notification"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Add animation class after a small delay to trigger animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add event listener to close button
        notification.querySelector('.close-notification').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    /**
     * Update gamification UI elements
     */
    function updateGamificationUI() {
        // Update points display
        const pointsDisplay = document.querySelector('.user-points');
        if (pointsDisplay) {
            pointsDisplay.textContent = gamificationData.points;
        }
        
        // Update level display
        const levelDisplay = document.querySelector('.user-level');
        if (levelDisplay) {
            levelDisplay.textContent = gamificationData.level;
        }
        
        // Update progress to next level
        const levelProgress = document.querySelector('.level-progress .progress');
        if (levelProgress) {
            const currentLevel = gamificationData.level;
            const nextLevelThreshold = currentLevel < levelThresholds.length ? levelThresholds[currentLevel] : levelThresholds[levelThresholds.length - 1] * 1.5;
            const prevLevelThreshold = levelThresholds[currentLevel - 1];
            const progress = ((gamificationData.points - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100;
            levelProgress.style.width = `${Math.min(100, progress)}%`;
        }
        
        // Update badges display
        const badgesContainer = document.querySelector('.badges-container');
        if (badgesContainer) {
            renderBadges(badgesContainer);
        }
        
        // Update achievements log
        const achievementsLog = document.querySelector('.achievements-log');
        if (achievementsLog) {
            renderAchievements(achievementsLog);
        }
    }

    /**
     * Render badges in the specified container
     * @param {HTMLElement} container - Container element for badges
     */
    function renderBadges(container) {
        // Clear container
        container.innerHTML = '';
        
        if (gamificationData.badges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-award"></i>
                    <p>No badges earned yet. Complete activities to earn badges!</p>
                </div>
            `;
            return;
        }
        
        // Sort badges by date earned (newest first)
        const sortedBadges = [...gamificationData.badges].sort((a, b) => {
            return new Date(b.dateEarned) - new Date(a.dateEarned);
        });
        
        // Add each badge
        sortedBadges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge-item';
            badgeElement.innerHTML = `
                <div class="badge-icon">
                    <i class="${badge.icon}"></i>
                </div>
                <div class="badge-details">
                    <h4>${badge.name}</h4>
                    <p>${badge.description}</p>
                    <span class="badge-date">${new Date(badge.dateEarned).toLocaleDateString()}</span>
                </div>
            `;
            container.appendChild(badgeElement);
        });
    }

    /**
     * Render achievements in the specified container
     * @param {HTMLElement} container - Container element for achievements
     */
    function renderAchievements(container) {
        // Clear container
        container.innerHTML = '';
        
        if (gamificationData.achievements.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <p>No achievements yet. Complete activities to earn achievements!</p>
                </div>
            `;
            return;
        }
        
        // Sort achievements by timestamp (newest first)
        const sortedAchievements = [...gamificationData.achievements].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        
        // Add each achievement
        sortedAchievements.forEach(achievement => {
            const achievementElement = document.createElement('div');
            achievementElement.className = 'achievement-item';
            
            // Format based on achievement type
            let icon, title, description;
            
            if (achievement.type === 'points') {
                icon = 'fas fa-star';
                title = `Earned ${achievement.points} points`;
                description = achievement.reason;
            } else if (achievement.type === 'level') {
                icon = 'fas fa-level-up-alt';
                title = `Reached Level ${achievement.level}`;
                description = 'Congratulations on leveling up!';
            } else {
                icon = 'fas fa-award';
                title = achievement.reason || 'Achievement Unlocked';
                description = '';
            }
            
            achievementElement.innerHTML = `
                <div class="achievement-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="achievement-details">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <span class="achievement-date">${new Date(achievement.timestamp).toLocaleDateString()}</span>
                </div>
            `;
            
            container.appendChild(achievementElement);
        });
    }
    
    /**
     * Save gamification data to user profile
     */
    function saveGamificationData() {
        // Get current user
        const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
        if (!currentUser) return;
        
        // Update gamification data
        currentUser.gamificationData = gamificationData;
        
        // Save back to localStorage
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
    }
    
    /**
     * Add event listeners for gamification interactions
     */
    function addGamificationEventListeners() {
        // Add event listeners for gamification-related UI elements
        const badgesTab = document.querySelector('.badges-tab');
        const achievementsTab = document.querySelector('.achievements-tab');
        const badgesContent = document.querySelector('.badges-content');
        const achievementsContent = document.querySelector('.achievements-content');
        
        if (badgesTab && achievementsTab && badgesContent && achievementsContent) {
            badgesTab.addEventListener('click', () => {
                badgesTab.classList.add('active');
                achievementsTab.classList.remove('active');
                badgesContent.style.display = 'block';
                achievementsContent.style.display = 'none';
            });
            
            achievementsTab.addEventListener('click', () => {
                achievementsTab.classList.add('active');
                badgesTab.classList.remove('active');
                achievementsContent.style.display = 'block';
                badgesContent.style.display = 'none';
            });
        }
    }
    
    // Make functions available globally for other modules
    window.checkAndAwardBadge = checkAndAwardBadge;
    window.awardPoints = awardPoints;
});
     