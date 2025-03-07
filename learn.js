document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize learning data from user profile or create default
    let learningData = {
        currentCourse: null,
        progress: 0,
        modules: [],
        availableCourses: [
            {
                id: 1,
                name: 'Budgeting Basics',
                description: 'Learn how to create and maintain a budget that works for your lifestyle',
                progress: 0,
                status: 'not-started',
                icon: 'fas fa-piggy-bank'
            },
            {
                id: 2,
                name: 'Investing 101',
                description: 'Understand the fundamentals of investing and building wealth',
                progress: 0,
                status: 'not-started',
                icon: 'fas fa-chart-line'
            },
            {
                id: 3,
                name: 'Home Buying Guide',
                description: 'Everything you need to know about purchasing your first home',
                progress: 0,
                status: 'not-started',
                icon: 'fas fa-home'
            },
            {
                id: 4,
                name: 'Debt Management',
                description: 'Strategies for managing and eliminating debt effectively',
                progress: 0,
                status: 'not-started',
                icon: 'fas fa-credit-card'
            }
        ],
        badges: [
            { name: 'Newcomer', icon: 'fas fa-star', earned: true },
            { name: 'Saver', icon: 'fas fa-award', earned: false },
            { name: 'Investor', icon: 'fas fa-chart-line', earned: false },
            { name: 'Budgeter', icon: 'fas fa-piggy-bank', earned: false },
            { name: 'Debt-Free', icon: 'fas fa-credit-card', earned: false }
        ]
    };

    // Load learning data if it exists
    if (currentUser.learningProgress) {
        // Merge default courses with user's progress
        if (currentUser.learningProgress.availableCourses) {
            learningData.availableCourses = currentUser.learningProgress.availableCourses;
        } else if (currentUser.learningProgress.currentCourse) {
            // Update course status based on current course
            const courseIndex = learningData.availableCourses.findIndex(c => c.name === currentUser.learningProgress.currentCourse);
            if (courseIndex !== -1) {
                learningData.availableCourses[courseIndex].status = 'in-progress';
                learningData.availableCourses[courseIndex].progress = currentUser.learningProgress.progress || 0;
                learningData.currentCourse = learningData.availableCourses[courseIndex];
                learningData.progress = currentUser.learningProgress.progress || 0;
            }
        }

        // Load badges
        if (currentUser.learningProgress.badges) {
            learningData.badges = currentUser.learningProgress.badges;
        }

        // Load modules if available
        if (currentUser.learningProgress.modules) {
            learningData.modules = currentUser.learningProgress.modules;
        }
    }

    // Update learning progress display
    function updateLearningProgress() {
        const learningCard = document.querySelector('.learning-card');
        if (!learningCard) return;

        const courseProgress = learningCard.querySelector('.course-progress h4');
        if (courseProgress) {
            courseProgress.textContent = learningData.currentCourse.name;
        }

        const progressBar = learningCard.querySelector('.progress');
        if (progressBar) {
            progressBar.style.width = `${learningData.currentCourse.progress}%`;
        }

        const progressText = learningCard.querySelector('.progress-info span');
        if (progressText) {
            progressText.textContent = `${learningData.currentCourse.progress}% Complete`;
        }
    }

    // Update course cards
    function updateCourseCards() {
        const courseCards = document.querySelectorAll('.course-card');
        if (courseCards.length === 0) return;

        courseCards.forEach((card, index) => {
            if (index < learningData.availableCourses.length) {
                const course = learningData.availableCourses[index];
                
                // Update course status
                const statusElement = card.querySelector('.course-status');
                if (statusElement) {
                    statusElement.className = 'course-status';
                    if (course.status === 'in-progress') {
                        statusElement.classList.add('in-progress');
                        statusElement.querySelector('span').textContent = 'In Progress';
                    } else {
                        statusElement.querySelector('span').textContent = 'Not Started';
                    }
                }
                
                // Update button text
                const button = card.querySelector('.btn-secondary');
                if (button) {
                    button.textContent = course.status === 'in-progress' ? 'Continue' : 'Start Course';
                }
            }
        });
    }

    // Add event listeners to course buttons
    document.querySelectorAll('.course-card .btn-secondary').forEach((button, index) => {
        button.addEventListener('click', () => {
            const course = learningData.availableCourses[index];
            if (!course) return;
            
            if (course.status === 'not-started') {
                course.status = 'in-progress';
                course.progress = 0;
                alert(`Starting course: ${course.name}`);
            } else {
                alert(`Continuing course: ${course.name}`);
            }
            
            updateCourseCards();
        });
    });

    // Add event listeners to resource buttons
    document.querySelectorAll('.resource-card .btn-secondary').forEach((button) => {
        button.addEventListener('click', (e) => {
            const resourceType = e.target.closest('.resource-card').querySelector('h3').textContent;
            alert(`Opening resource: ${resourceType}`);
        });
    });

    // Initialize the page
    updateLearningProgress();
    updateCourseCards();
});