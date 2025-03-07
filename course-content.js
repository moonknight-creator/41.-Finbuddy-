// Course Content JavaScript for FinBuddy

document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Get course ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = parseInt(urlParams.get('id'));
    
    if (!courseId) {
        window.location.href = 'learn.html';
        return;
    }

    // Initialize course data
    let courseData = null;
    let currentModuleIndex = 0;
    
    // Course modules data
    const coursesData = {
        1: { // Budgeting Basics
            id: 1,
            title: 'Budgeting Basics',
            description: 'Learn how to create and maintain a budget that works for your lifestyle',
            icon: 'fas fa-piggy-bank',
            modules: [
                {
                    id: 1,
                    title: 'Introduction to Budgeting',
                    description: 'Learn why budgeting is important and how it can help you achieve your financial goals.',
                    videoId: 'HQzoZfc3GwQ', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'What is the primary purpose of creating a budget?',
                        options: [
                            'To restrict your spending completely',
                            'To track income and expenses to achieve financial goals',
                            'To impress your friends with your financial knowledge',
                            'To qualify for more credit cards'
                        ],
                        correctAnswer: 1
                    }
                },
                {
                    id: 2,
                    title: 'Creating Your First Budget',
                    description: 'Step-by-step guide to creating a personalized budget that works for your income and lifestyle.',
                    videoId: 'sVKQn2I4HDM', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'Which of these is NOT a typical budget category?',
                        options: [
                            'Housing',
                            'Transportation',
                            'Stock Market Speculation',
                            'Groceries'
                        ],
                        correctAnswer: 2
                    }
                },
                {
                    id: 3,
                    title: 'Sticking to Your Budget',
                    description: 'Practical tips and strategies to help you maintain your budget over time.',
                    videoId: 'pN5wZC4CfR0', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'What is a good strategy for sticking to your budget?',
                        options: [
                            'Ignoring your expenses for the first month',
                            'Setting unrealistic savings goals',
                            'Regular tracking and adjusting as needed',
                            'Borrowing money when you exceed your budget'
                        ],
                        correctAnswer: 2
                    }
                }
            ]
        },
        2: { // Investing 101
            id: 2,
            title: 'Investing 101',
            description: 'Understand the fundamentals of investing and building wealth',
            icon: 'fas fa-chart-line',
            modules: [
                {
                    id: 1,
                    title: 'Investment Basics',
                    description: 'Learn the fundamental concepts of investing and different investment vehicles.',
                    videoId: 'gFQNPmLKj1k', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'Which of these is typically considered the least risky investment?',
                        options: [
                            'Individual stocks',
                            'Cryptocurrency',
                            'Government bonds',
                            'Startup companies'
                        ],
                        correctAnswer: 2
                    }
                },
                {
                    id: 2,
                    title: 'Understanding Risk and Return',
                    description: 'Learn about the relationship between risk and potential returns in investing.',
                    videoId: 'Aw16LPVnNco', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'What is the relationship between risk and potential return?',
                        options: [
                            'Higher risk typically offers lower potential returns',
                            'Risk and return are unrelated',
                            'Higher risk typically offers higher potential returns',
                            'All investments have the same risk-return profile'
                        ],
                        correctAnswer: 2
                    }
                }
            ]
        },
        3: { // Home Buying Guide
            id: 3,
            title: 'Home Buying Guide',
            description: 'Everything you need to know about purchasing your first home',
            icon: 'fas fa-home',
            modules: [
                {
                    id: 1,
                    title: 'Preparing for Homeownership',
                    description: 'Learn what you need to do before starting your home search.',
                    videoId: 'vAFQIciWsF4', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'What should you do first when preparing to buy a home?',
                        options: [
                            'Go to open houses',
                            'Check your credit score and financial health',
                            'Choose furniture for your new home',
                            'Tell your landlord youre moving out'
                        ],
                        correctAnswer: 1
                    }
                }
            ]
        },
        4: { // Debt Management
            id: 4,
            title: 'Debt Management',
            description: 'Strategies for managing and eliminating debt effectively',
            icon: 'fas fa-credit-card',
            modules: [
                {
                    id: 1,
                    title: 'Understanding Different Types of Debt',
                    description: 'Learn about different types of debt and their impact on your financial health.',
                    videoId: 'ZwBZRDKEkC0', // YouTube video ID
                    completed: false,
                    quiz: {
                        question: 'Which type of debt typically has the highest interest rate?',
                        options: [
                            'Mortgage',
                            'Auto loan',
                            'Student loan',
                            'Credit card debt'
                        ],
                        correctAnswer: 3
                    }
                }
            ]
        }
    };

    // Load course data
    loadCourseData();

    // Set up event listeners
    document.getElementById('prev-module').addEventListener('click', navigateToPrevModule);
    document.getElementById('next-module').addEventListener('click', navigateToNextModule);

    /**
     * Load course data and initialize the page
     */
    function loadCourseData() {
        // Get course data
        courseData = coursesData[courseId];
        if (!courseData) {
            window.location.href = 'learn.html';
            return;
        }

        // Update course header
        document.getElementById('course-title').textContent = courseData.title;
        document.getElementById('course-description').textContent = courseData.description;
        document.getElementById('course-icon').className = courseData.icon;

        // Load user progress for this course
        loadUserProgress();

        // Render modules
        renderModules();

        // Update navigation buttons
        updateNavigationButtons();
    }

    /**
     * Load user progress for the current course
     */
    function loadUserProgress() {
        // Check if user has progress data for this course
        if (currentUser.learningProgress && 
            currentUser.learningProgress.courses && 
            currentUser.learningProgress.courses[courseId]) {
            
            const courseProgress = currentUser.learningProgress.courses[courseId];
            
            // Update module completion status
            if (courseProgress.modules) {
                courseProgress.modules.forEach(module => {
                    const moduleIndex = courseData.modules.findIndex(m => m.id === module.id);
                    if (moduleIndex !== -1) {
                        courseData.modules[moduleIndex].completed = module.completed;
                    }
                });
            }
            
            // Set current module index
            if (courseProgress.currentModuleIndex !== undefined) {
                currentModuleIndex = courseProgress.currentModuleIndex;
            }
            
            // Update progress percentage
            updateProgressPercentage();
        } else {
            // Initialize user progress for this course
            if (!currentUser.learningProgress) {
                currentUser.learningProgress = {};
            }
            
            if (!currentUser.learningProgress.courses) {
                currentUser.learningProgress.courses = {};
            }
            
            currentUser.learningProgress.courses[courseId] = {
                id: courseId,
                currentModuleIndex: 0,
                modules: courseData.modules.map(module => ({
                    id: module.id,
                    completed: false
                }))
            };
            
            // Save updated user data
            saveUserData();
        }
    }

    /**
     * Render course modules
     */
    function renderModules() {
        const modulesContainer = document.getElementById('modules-container');
        modulesContainer.innerHTML = '';
        
        // Only render the current module
        const module = courseData.modules[currentModuleIndex];
        
        const moduleCard = document.createElement('div');
        moduleCard.className = 'module-card';
        
        // Module header
        const moduleHeader = document.createElement('div');
        moduleHeader.className = 'module-header';
        
        const moduleTitle = document.createElement('h3');
        moduleTitle.className = 'module-title';
        moduleTitle.textContent = `Module ${module.id}: ${module.title}`;
        
        const moduleStatus = document.createElement('div');
        moduleStatus.className = `module-status ${module.completed ? 'completed' : 'in-progress'}`;
        moduleStatus.innerHTML = `<span>${module.completed ? 'Completed' : 'In Progress'}</span>`;
        
        moduleHeader.appendChild(moduleTitle);
        moduleHeader.appendChild(moduleStatus);
        
        // Module content
        const moduleContent = document.createElement('div');
        moduleContent.className = 'module-content';
        
        // Video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        videoContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${module.videoId}" 
                title="${module.title}" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        // Module description
        const moduleDescription = document.createElement('div');
        moduleDescription.className = 'module-description';
        moduleDescription.textContent = module.description;
        
        // Quiz container
        const quizContainer = document.createElement('div');
        quizContainer.className = 'quiz-container';
        quizContainer.innerHTML = `
            <h4>Knowledge Check</h4>
            <div class="quiz-question">
                <p>${module.quiz.question}</p>
            </div>
            <div class="quiz-options">
                ${module.quiz.options.map((option, index) => `
                    <label class="quiz-option">
                        <input type="radio" name="quiz-${module.id}" value="${index}">
                        ${option}
                    </label>
                `).join('')}
            </div>
            <div class="module-actions">
                <button class="btn-primary" id="submit-quiz">Submit Answer</button>
            </div>
        `;
        
        // Assemble module card
        moduleContent.appendChild(videoContainer);
        moduleContent.appendChild(moduleDescription);
        moduleContent.appendChild(quizContainer);
        
        moduleCard.appendChild(moduleHeader);
        moduleCard.appendChild(moduleContent);
        
        modulesContainer.appendChild(moduleCard);
        
        // Add event listener for quiz submission
        const submitQuizButton = document.getElementById('submit-quiz');
        if (submitQuizButton) {
            submitQuizButton.addEventListener('click', submitQuizAnswer);
        }
    }
    
    /**
     * Update the course progress percentage display
     */
    function updateProgressPercentage() {
        const completedModules = courseData.modules.filter(module => module.completed).length;
        const totalModules = courseData.modules.length;
        const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
        
        // Update progress bar
        const progressBar = document.getElementById('course-progress');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
        
        // Update progress text
        const progressText = document.getElementById('progress-percentage');
        if (progressText) {
            progressText.textContent = `${progressPercentage}% Complete`;
        }
        
        // Update course progress in user data
        if (currentUser.learningProgress && currentUser.learningProgress.courses && currentUser.learningProgress.courses[courseId]) {
            currentUser.learningProgress.courses[courseId].progress = progressPercentage;
        }
    }
    
    /**
     * Navigate to the previous module
     */
    function navigateToPrevModule() {
        if (currentModuleIndex > 0) {
            currentModuleIndex--;
            updateCurrentModuleIndex();
            renderModules();
            updateNavigationButtons();
        }
    }
    
    /**
     * Navigate to the next module
     */
    function navigateToNextModule() {
        if (currentModuleIndex < courseData.modules.length - 1) {
            currentModuleIndex++;
            updateCurrentModuleIndex();
            renderModules();
            updateNavigationButtons();
        } else {
            // If this is the last module and it's completed, mark the course as completed
            if (courseData.modules[currentModuleIndex].completed) {
                completeCourse();
            }
        }
    }
    
    /**
     * Update navigation buttons based on current module index
     */
    function updateNavigationButtons() {
        const prevButton = document.getElementById('prev-module');
        const nextButton = document.getElementById('next-module');
        
        // Disable previous button if on first module
        if (prevButton) {
            prevButton.disabled = currentModuleIndex === 0;
        }
        
        // Update next button text if on last module
        if (nextButton) {
            if (currentModuleIndex === courseData.modules.length - 1) {
                nextButton.textContent = courseData.modules[currentModuleIndex].completed ? 'Complete Course' : 'Next Module';
            } else {
                nextButton.textContent = 'Next Module';
            }
        }
    }
    
    /**
     * Submit quiz answer and check if correct
     */
    function submitQuizAnswer() {
        const module = courseData.modules[currentModuleIndex];
        const selectedOption = document.querySelector(`input[name="quiz-${module.id}"]:checked`);
        
        if (!selectedOption) {
            alert('Please select an answer');
            return;
        }
        
        const selectedAnswer = parseInt(selectedOption.value);
        const isCorrect = selectedAnswer === module.quiz.correctAnswer;
        
        if (isCorrect) {
            // Mark module as completed
            module.completed = true;
            
            // Update module status display
            const moduleStatus = document.querySelector('.module-status');
            if (moduleStatus) {
                moduleStatus.className = 'module-status completed';
                moduleStatus.querySelector('span').textContent = 'Completed';
            }
            
            // Update progress
            updateProgressPercentage();
            
            // Save user progress
            updateUserProgress();
            
            // Show success message
            alert('Correct! Module completed.');
            
            // Check if this was the first module completed for badge
            checkForLearningBadge();
            
            // Update navigation buttons
            updateNavigationButtons();
        } else {
            // Show error message
            alert('Incorrect answer. Please try again.');
        }
    }
    
    /**
     * Update user progress in storage
     */
    function updateUserProgress() {
        if (currentUser.learningProgress && currentUser.learningProgress.courses) {
            // Update module completion status
            currentUser.learningProgress.courses[courseId].modules = courseData.modules.map(module => ({
                id: module.id,
                completed: module.completed
            }));
            
            // Update current module index
            currentUser.learningProgress.courses[courseId].currentModuleIndex = currentModuleIndex;
            
            // Save user data
            saveUserData();
        }
    }
    
    /**
     * Update current module index in user data
     */
    function updateCurrentModuleIndex() {
        if (currentUser.learningProgress && currentUser.learningProgress.courses && currentUser.learningProgress.courses[courseId]) {
            currentUser.learningProgress.courses[courseId].currentModuleIndex = currentModuleIndex;
            saveUserData();
        }
    }
    
    /**
     * Complete the course and award points/badges
     */
    function completeCourse() {
        // Check if all modules are completed
        const allCompleted = courseData.modules.every(module => module.completed);
        
        if (allCompleted) {
            // Mark course as completed in user data
            if (!currentUser.learningProgress.completedCourses) {
                currentUser.learningProgress.completedCourses = [];
            }
            
            if (!currentUser.learningProgress.completedCourses.includes(courseId)) {
                currentUser.learningProgress.completedCourses.push(courseId);
            }
            
            // Award points if gamification is enabled
            if (currentUser.gamificationData) {
                // Award 50 points for completing a course
                awardPoints(50, `Completed course: ${courseData.title}`);
            }
            
            // Save user data
            saveUserData();
            
            // Show completion message
            alert(`Congratulations! You've completed the ${courseData.title} course.`);
            
            // Redirect to learning page after a short delay
            setTimeout(() => {
                window.location.href = 'learn.html';
            }, 2000);
        }
    }
    
    /**
     * Check if user should be awarded a learning badge
     */
    function checkForLearningBadge() {
        // Only proceed if gamification data exists
        if (!currentUser.gamificationData) return;
        
        // Count total completed modules across all courses
        let totalCompletedModules = 0;
        
        if (currentUser.learningProgress && currentUser.learningProgress.courses) {
            Object.values(currentUser.learningProgress.courses).forEach(course => {
                if (course.modules) {
                    totalCompletedModules += course.modules.filter(module => module.completed).length;
                }
            });
        }
        
        // Check for learning badges based on completed modules count
        if (totalCompletedModules === 1) {
            awardBadge('learning_beginner');
        } else if (totalCompletedModules >= 5) {
            awardBadge('learning_intermediate');
        }
    }
    
    /**
     * Award points to the user (if gamification module exists)
     */
    function awardPoints(points, reason) {
        // Check if gamification module is loaded
        if (typeof checkAndAwardBadge === 'function') {
            // Use the gamification module's function
            window.awardPoints(points, reason);
        } else {
            // Fallback implementation
            if (!currentUser.gamificationData) {
                currentUser.gamificationData = {
                    points: 0,
                    level: 1,
                    badges: [],
                    achievements: []
                };
            }
            
            currentUser.gamificationData.points += points;
            
            // Add to achievements log
            currentUser.gamificationData.achievements.push({
                type: 'points',
                points: points,
                reason: reason,
                timestamp: new Date().toISOString()
            });
            
            saveUserData();
        }
    }
    
    /**
     * Award a badge to the user (if gamification module exists)
     */
    function awardBadge(badgeId) {
        // Check if gamification module is loaded
        if (typeof checkAndAwardBadge === 'function') {
            // Use the gamification module's function
            window.checkAndAwardBadge(badgeId);
        }
        // If not, we'll rely on the gamification module to award badges when it loads
    }
    
    /**
     * Save user data to localStorage
     */
    function saveUserData() {
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
        
        // Also update in the users collection
        const allUsers = JSON.parse(localStorage.getItem('finbuddy_users') || '{}');
        allUsers[currentUser.email] = currentUser;
        localStorage.setItem('finbuddy_users', JSON.stringify(allUsers));
    }});
