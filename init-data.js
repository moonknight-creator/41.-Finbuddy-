/**
 * Initialize empty user data structure on first load
 * This ensures all pages have the required data structure
 */
(function() {
    // Check if we already have user data
    if (!localStorage.getItem('finbuddy_current_user')) {
        // Create default user data
        const defaultUser = {
            name: 'User',
            email: '',
            financialSummary: {
                currentBalance: 0,
                income: 0,
                expenses: 0
            },
            transactions: [],
            budgetData: {
                totalBudget: 0,
                spent: 0,
                remaining: 0,
                periodStart: null,
                periodEnd: null,
                categories: []
            },
            savings: {
                totalSavings: 0,
                monthlyContribution: 0,
                goals: []
            },
            learningProgress: {
                completedCourses: 0,
                totalCourses: 5,
                currentModule: 'Introduction to Budgeting',
                completionPercentage: 0,
                badges: []
            }
        };
        
        // Save to localStorage
        localStorage.setItem('finbuddy_current_user', JSON.stringify(defaultUser));
    }
})();
