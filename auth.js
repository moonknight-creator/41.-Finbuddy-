// Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Password visibility toggle for all password fields
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Toggle for confirm password field
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    if (toggleConfirmPassword) {
        const confirmPasswordInput = document.getElementById('confirm-password');
        toggleConfirmPassword.addEventListener('click', function() {
            const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            confirmPasswordInput.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // Login form submission
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember').checked;
            
            // Validate login credentials
            if (!(await validateLogin(email, password))) {
                showNotification('Invalid email or password', 'error');
                return;
            }
            
            // Store user session
            if (rememberMe) {
                localStorage.setItem('finbuddy_remember_email', email);
            } else {
                localStorage.removeItem('finbuddy_remember_email');
            }
            
            // Store user data in MongoDB
            try {
                const db = await connectDB();
                const usersCollection = db.collection('users');
                const userData = await usersCollection.findOne({ email }) || createDefaultUserData(email);
                await usersCollection.updateOne(
                  { email },
                  { $set: userData },
                  { upsert: true }
                );
            } catch (error) {
                console.error('Database connection error:', error);
                showNotification('An error occurred while connecting to the database', 'error');
                return;
            }
            
            // AI-powered login analysis
            await analyzeLoginAttempt(email);
            
            // Show success message
            showNotification('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                try {
                    window.location.href = 'index.html';
                } catch (error) {
                    console.error('Redirect failed:', error);
                    showNotification('Failed to redirect to dashboard', 'error');
                }
            }, 1500);
        });
    }

    // Registration form submission
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const termsAgreed = document.getElementById('terms').checked;
            
            // Validate form inputs
            if (!validateRegistration(fullname, email, password, confirmPassword, termsAgreed)) {
                return; // Validation function will show appropriate error messages
            }
            
            // Create new user profile
            const userData = createNewUserProfile(fullname, email);
            
            try {
                // Store user data
                const db = await connectDB();
                const usersCollection = db.collection('users');
                await usersCollection.updateOne(
                  { email },
                  { $set: userData },
                  { upsert: true }
                );
                
                // AI-powered user profiling
                await createUserFinancialProfile(fullname, email);
                
                // Show success message
                showNotification('Account created successfully! Redirecting to dashboard...', 'success');
                
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } catch (error) {
                console.error('Database error:', error);
                showNotification('An error occurred during registration', 'error');
            }
        });
    }

    // Check for remembered email on login page
    if (loginForm) {
        const rememberedEmail = localStorage.getItem('finbuddy_remember_email');
        if (rememberedEmail) {
            document.getElementById('email').value = rememberedEmail;
            document.getElementById('remember').checked = true;
        }
    }

    // Add notification container if it doesn't exist
    if (!document.getElementById('notification-container')) {
        const notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
});

// Validation functions
async function validateLogin(email, password) {
    if (!email || !password) {
        showNotification('Please fill in all fields', 'error');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ email });
        if (!user) {
            showNotification('Account not found', 'error');
            return false;
        }
        
        // Set authentication state
        localStorage.setItem('finbuddy_authenticated', 'true');
        localStorage.setItem('finbuddy_current_user', JSON.stringify(user));
        
        return true;
    } catch (error) {
        console.error('Database error:', error);
        showNotification('An error occurred during login', 'error');
        return false;
    }
}

function validateRegistration(fullname, email, password, confirmPassword, termsAgreed) {
    if (!fullname || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    if (password.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return false;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return false;
    }
    
    if (!termsAgreed) {
        showNotification('You must agree to the Terms of Service', 'error');
        return false;
    }
    
    // Check if user already exists
    const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
    if (allUsers[email]) {
        showNotification('An account with this email already exists', 'error');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// User data functions
async function getUserData(email) {
    try {
        const db = await connectDB();
        const usersCollection = db.collection('users');
        return await usersCollection.findOne({ email });
    } catch (error) {
        console.error('Database connection error:', error);
        return null;
    }
}

function createDefaultUserData(email) {
    return {
        email: email,
        name: email.split('@')[0], // Default name from email
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        financialSummary: {
            currentBalance: 0,
            income: 0,
            expenses: 0
        },
        budgetCategories: [],
        savingsGoals: [],
        learningProgress: {
            currentCourse: null,
            completedCourses: [],
            badges: []
        }
    };
}

function createNewUserProfile(name, email) {
    return {
        email: email,
        name: name,
        joinDate: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        financialSummary: {
            currentBalance: 0,
            income: 0,
            expenses: 0
        },
        budgetCategories: [],
        savingsGoals: [],
        learningProgress: {
            currentCourse: null,
            completedCourses: [],
            badges: []
        }
    };
}

// Notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    const container = document.getElementById('notification-container');
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            container.removeChild(notification);
        }, 300);
    }, 5000);
}

// AI functions
async function analyzeLoginAttempt(email) {
    console.log('AI: Analyzing login patterns for security and personalization');
    
    // Get user data
    const userData = await getUserData(email);
    if (!userData) return;
    
    // Update last login time
    userData.lastLogin = new Date().toISOString();
    
    // Store login location and device info for security analysis
    userData.loginHistory = userData.loginHistory || [];
    userData.loginHistory.push({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        // In a real app, you would capture more security-relevant data
    });
    
    // Generate personalized recommendations based on user behavior
    const insights = generatePersonalizedRecommendations(userData);
    userData.insights = insights;
    
    // Update user data in storage
    const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
    allUsers[email] = userData;
    localStorage.setItem('finbuddy_users', JSON.stringify(allUsers));
    localStorage.setItem('finbuddy_current_user', JSON.stringify(userData));
}

async function createUserFinancialProfile(name, email) {
    console.log('AI: Creating initial financial profile for new user');
    
    // Get user data
    const userData = await getUserData(email);
    if (!userData) return;
    
    // Generate personalized budget categories based on user name/email patterns
    userData.budgetCategories = generateInitialBudgetCategories();
    
    // Generate starter savings goals
    userData.savingsGoals = generateInitialSavingsGoals();
    
    // Recommend initial learning path
    userData.learningProgress.currentCourse = 'Budgeting Basics';
    userData.learningProgress.badges = [{ name: 'Newcomer', earned: true }];
    
    // Generate AI-powered financial insights
    userData.insights = [
        {
            type: 'welcome',
            message: `Welcome to FinBuddy, ${name}! We recommend starting with setting up your budget categories and a savings goal.`,
            date: new Date().toISOString()
        }
    ];
    
    // Update user data in storage
    const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
    allUsers[email] = userData;
    localStorage.setItem('finbuddy_users', JSON.stringify(allUsers));
    localStorage.setItem('finbuddy_current_user', JSON.stringify(userData));
}

function generatePersonalizedRecommendations(userData) {
    // In a real app, this would use machine learning to analyze patterns
    // For demo purposes, we'll generate some simple recommendations
    
    const insights = [];
    
    // Check if user has set up budget categories
    if (!userData.budgetCategories || userData.budgetCategories.length === 0) {
        insights.push({
            type: 'suggestion',
            message: 'You haven\'t set up any budget categories yet. Setting up a budget is the first step to financial success!',
            action: 'Go to Budget',
            actionUrl: 'budget.html',
            date: new Date().toISOString()
        });
    }
    
    // Check if user has savings goals
    if (!userData.savingsGoals || userData.savingsGoals.length === 0) {
        insights.push({
            type: 'suggestion',
            message: 'Setting savings goals helps you stay motivated. Try creating your first savings goal!',
            action: 'Create Goal',
            actionUrl: 'savings.html',
            date: new Date().toISOString()
        });
    }
    
    return insights;
}

// Helper functions for initial data
function generateInitialBudgetCategories() {
    return [
        {
            id: 1,
            name: 'Housing',
            allocated: 1000,
            spent: 0
        },
        {
            id: 2,
            name: 'Food',
            allocated: 400,
            spent: 0
        },
        {
            id: 3,
            name: 'Transportation',
            allocated: 200,
            spent: 0
        }
    ];
}

function generateInitialSavingsGoals() {
    return [
        {
            id: 1,
            name: 'Emergency Fund',
            total: 5000,
            saved: 0,
            monthlyContribution: 200
        }
    ];
}

// Mock database implementation for browser environment
async function connectDB() {
    try {
        // For browser environment, we'll use a mock implementation using localStorage
        console.log('Using mock database implementation with localStorage');
        
        // Create a mock database object that mimics MongoDB API
        const mockDB = {
            collection: (collectionName) => {
                return {
                    findOne: async (query) => {
                        const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
                        return allUsers[query.email] || null;
                    },
                    updateOne: async (query, update, options) => {
                        const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
                        const userData = allUsers[query.email] || {};
                        
                        // Apply updates
                        if (update.$set) {
                            Object.assign(userData, update.$set);
                        }
                        
                        // Save back to localStorage
                        allUsers[query.email] = userData;
                        localStorage.setItem('finbuddy_users', JSON.stringify(allUsers));
                        
                        // Also update current user if this is the logged in user
                        localStorage.setItem('finbuddy_current_user', JSON.stringify(userData));
                        
                        return { acknowledged: true };
                    }
                };
            }
        };
        
        return mockDB;
        return mockDB;
    } catch (error) {
        console.error('Mock database connection error:', error);
        throw error;
    }
}
