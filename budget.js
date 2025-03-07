document.addEventListener('DOMContentLoaded', () => {
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize budget data from user profile or create default empty state
    let budgetData = {
        totalBudget: 0,
        spent: 0,
        remaining: 0,
        categories: []
    };

    // Load budget data if it exists
    if (currentUser.budgetData) {
        budgetData = currentUser.budgetData;
    } else if (currentUser.budgetCategories && currentUser.budgetCategories.length > 0) {
        // Convert from old format if needed
        budgetData.categories = currentUser.budgetCategories;
        calculateBudgetTotals();
    }

    // Initialize AI Budget System with current user data
    window.aiBudgetSystem.initFromUserData(currentUser);

    // Update budget summary
    function updateBudgetSummary() {
        const totalBudgetElement = document.getElementById('total-budget');
        const budgetSpentElement = document.getElementById('budget-spent');
        const budgetRemainingElement = document.getElementById('budget-remaining');
        const budgetProgressElement = document.getElementById('budget-progress');

        if (totalBudgetElement) totalBudgetElement.textContent = `₹${budgetData.totalBudget.toLocaleString()}`;
        if (budgetSpentElement) budgetSpentElement.textContent = `₹${budgetData.spent.toLocaleString()}`;
        if (budgetRemainingElement) budgetRemainingElement.textContent = `₹${budgetData.remaining.toLocaleString()}`;
        
        if (budgetProgressElement) {
            let progressPercentage = 0;
            if (budgetData.totalBudget > 0 && budgetData.spent > 0) {
                progressPercentage = (budgetData.spent / budgetData.totalBudget) * 100;
            }
            budgetProgressElement.style.width = `${progressPercentage}%`;
        }

        // Update date display
        const budgetDateElement = document.getElementById('budget-date');
        if (budgetDateElement) {
            if (budgetData.periodStart && budgetData.periodEnd) {
                const startDate = new Date(budgetData.periodStart).toLocaleDateString();
                const endDate = new Date(budgetData.periodEnd).toLocaleDateString();
                budgetDateElement.textContent = `${startDate} - ${endDate}`;
            } else {
                budgetDateElement.textContent = 'Set your budget period';
            }
        }
    }

    // Calculate budget totals from categories
    function calculateBudgetTotals() {
        let totalAllocated = 0;
        let totalSpent = 0;

        budgetData.categories.forEach(category => {
            totalAllocated += category.allocated || 0;
            totalSpent += category.spent || 0;
        });

        budgetData.totalBudget = totalAllocated;
        budgetData.spent = totalSpent;
        budgetData.remaining = totalAllocated - totalSpent;
    }

    // Initialize icon selector
    function initIconSelector() {
        const iconOptions = document.querySelectorAll('.icon-option');
        const iconInput = document.getElementById('category-icon');
        
        iconOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class from all options
                iconOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Update hidden input value
                iconInput.value = option.getAttribute('data-icon');
            });
        });
    }

    // Render budget categories with improved UI
    function renderBudgetCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        const categoriesEmptyState = document.getElementById('categories-empty-state');
        
        if (!categoriesGrid) return;

        // Clear existing categories except the empty state
        while (categoriesGrid.firstChild && categoriesGrid.firstChild !== categoriesEmptyState) {
            categoriesGrid.removeChild(categoriesGrid.firstChild);
        }

        // Show/hide empty state based on categories count
        if (budgetData.categories.length === 0) {
            if (categoriesEmptyState) {
                categoriesEmptyState.style.display = 'flex';
            }
        } else {
            if (categoriesEmptyState) {
                categoriesEmptyState.style.display = 'none';
            }
            
            // Add each category with improved UI
            budgetData.categories.forEach(category => {
                const categoryCard = document.createElement('div');
                categoryCard.className = 'category-card';
                categoryCard.setAttribute('data-id', category.id);

                const progressPercentage = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
                const iconClass = getCategoryIcon(category.name);
                const remaining = Math.max(0, category.allocated - category.spent);

                categoryCard.innerHTML = `
                    <div class="category-header">
                        <div class="category-icon">
                            <i class="${category.icon || iconClass}"></i>
                        </div>
                        <div class="category-info">
                            <h3>${category.name}</h3>
                            <div class="category-amount">
                                <span class="spent">₹${category.spent.toLocaleString()}</span>
                                <span class="divider">/</span>
                                <span class="total">₹${category.allocated.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${progressPercentage}%; background-color: ${progressPercentage > 90 ? '#e74c3c' : '#3498db'};"></div>
                    </div>
                    <div class="category-details">
                        <div class="detail-item">
                            <span class="detail-label">Allocated:</span>
                            <span class="detail-value allocated-amount">₹${category.allocated.toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Spent:</span>
                            <span class="detail-value spent-amount">₹${category.spent.toLocaleString()}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Remaining:</span>
                            <span class="detail-value remaining-amount">₹${remaining.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="category-actions">
                        <button class="btn-secondary edit-category">Edit</button>
                        <button class="btn-secondary remove-category">Remove</button>
                        <button class="btn-secondary add-expense">Add Expense</button>
                    </div>
                `;

                // Insert at the beginning of the grid (before empty state)
                categoriesGrid.insertBefore(categoryCard, categoriesGrid.firstChild);
            });
        }

        // Add a card to create new category
        const newCategoryCard = document.createElement('div');
        newCategoryCard.className = 'category-card new-category';
        newCategoryCard.innerHTML = `
            <div class="add-category-content">
                <div class="add-icon">
                    <i class="fas fa-plus"></i>
                </div>
                <h3>Add New Category</h3>
                <p>Create a new budget category to track your expenses</p>
            </div>
        `;

        // Insert at the end
        categoriesGrid.appendChild(newCategoryCard);

        // Add event listeners to new buttons
        addCategoryEventListeners();
        
        // Add click event to the new category card
        newCategoryCard.addEventListener('click', showAddCategoryModal);
    }

    // Get appropriate icon for category
    function getCategoryIcon(categoryName) {
        const categoryIcons = {
            'Housing': 'fas fa-home',
            'Food': 'fas fa-utensils',
            'Groceries': 'fas fa-shopping-basket',
            'Transportation': 'fas fa-car',
            'Entertainment': 'fas fa-film',
            'Utilities': 'fas fa-bolt',
            'Healthcare': 'fas fa-medkit',
            'Shopping': 'fas fa-shopping-bag',
            'Education': 'fas fa-graduation-cap',
            'Personal': 'fas fa-user',
            'Travel': 'fas fa-plane',
            'Dining': 'fas fa-utensils',
            'Subscriptions': 'fas fa-calendar-alt'
        };

        // Check if category name contains any of the keys
        for (const [key, icon] of Object.entries(categoryIcons)) {
            if (categoryName.toLowerCase().includes(key.toLowerCase())) {
                return icon;
            }
        }

        // Default icon
        return 'fas fa-money-bill-wave';
    }

    // Add event listeners to category buttons
    function addCategoryEventListeners() {
        // Edit category buttons
        document.querySelectorAll('.edit-category').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryCard = e.target.closest('.category-card');
                const categoryId = parseInt(categoryCard.getAttribute('data-id'));
                const category = budgetData.categories.find(c => c.id === categoryId);
                
                if (!category) return;
                
                showEditCategoryModal(category);
            });
        });

        // Add expense buttons
        document.querySelectorAll('.add-expense').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryCard = e.target.closest('.category-card');
                const categoryId = parseInt(categoryCard.getAttribute('data-id'));
                const category = budgetData.categories.find(c => c.id === categoryId);
                
                if (!category) return;
                
                showAddExpenseModal(category);
            });
        });

        // Remove category buttons
        document.querySelectorAll('.remove-category').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryCard = e.target.closest('.category-card');
                const categoryId = parseInt(categoryCard.getAttribute('data-id'));
                
                // Remove the category from the data
                budgetData.categories = budgetData.categories.filter(c => c.id !== categoryId);
                
                // Recalculate totals
                calculateBudgetTotals();
                
                // Save to user data
                saveUserBudgetData();
                
                // Update UI
                renderBudgetCategories();
                updateBudgetSummary();
            });
        });

        // Add new category button
        const addCategoryBtn = document.getElementById('add-category-btn');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                showAddCategoryModal();
            });
        }
    }

    // Set budget button
    const setBudgetBtn = document.getElementById('set-budget-btn');
    if (setBudgetBtn) {
        setBudgetBtn.addEventListener('click', () => {
            showSetBudgetModal();
        });
    }

    // Show modal to set overall budget
    function showSetBudgetModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Set Budget Period</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="budget-period-form">
                    <div class="form-group">
                        <label for="budget-start">Start Date</label>
                        <input type="date" id="budget-start" required>
                    </div>
                    <div class="form-group">
                        <label for="budget-end">End Date</label>
                        <input type="date" id="budget-end" required>
                    </div>
                    <button type="submit" class="btn-primary">Save Budget Period</button>
                </form>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Set default values if available
        if (budgetData.periodStart) {
            document.getElementById('budget-start').value = new Date(budgetData.periodStart).toISOString().split('T')[0];
        } else {
            document.getElementById('budget-start').value = new Date().toISOString().split('T')[0];
        }
        if (budgetData.periodEnd) {
            document.getElementById('budget-end').value = new Date(budgetData.periodEnd).toISOString().split('T')[0];
        } else {
            // Set end date to end of current month by default
            const endOfMonth = new Date();
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            endOfMonth.setDate(0);
            document.getElementById('budget-end').value = endOfMonth.toISOString().split('T')[0];
        }
        
        // Close modal on click
        modalOverlay.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Handle form submission
        document.getElementById('budget-period-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const startDate = document.getElementById('budget-start').value;
            const endDate = document.getElementById('budget-end').value;
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('Start date must be before end date');
                return;
            }
            
            budgetData.periodStart = startDate;
            budgetData.periodEnd = endDate;
            
            // Save to user data
            saveUserBudgetData();
            
            // Update UI
            updateBudgetSummary();
            
            // Close modal
            document.body.removeChild(modalOverlay);
        });
    }

    // Show modal to add a new category with icon selection
    function showAddCategoryModal() {
        const categoryDialog = document.getElementById('category-dialog');
        if (categoryDialog) {
            categoryDialog.style.display = 'block';
            
            // Initialize icon selector
            initIconSelector();
            
            // Focus on the first field
            setTimeout(() => {
                document.getElementById('category-name').focus();
            }, 100);
        } else {
            // Fallback to original implementation
            // ...existing code...
        }
    }

    // Handle the form submission to add a new category
    document.getElementById('category-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const categoryName = document.getElementById('category-name').value;
        const categoryLimit = parseFloat(document.getElementById('category-limit').value);
        const categoryIcon = document.getElementById('category-icon').value;
        
        if (!categoryName || isNaN(categoryLimit) || categoryLimit <= 0) {
            alert('Please enter a valid category name and limit amount');
            return;
        }
        
        // Create a new category
        const newCategory = {
            id: Date.now(),
            name: categoryName,
            allocated: categoryLimit,
            spent: 0,
            icon: `fas ${categoryIcon}`
        };
        
        // Add to budget data
        budgetData.categories.push(newCategory);
        
        // Update totals
        calculateBudgetTotals();
        
        // Save to user data
        saveUserBudgetData();
        
        // Update UI
        renderBudgetCategories();
        updateBudgetSummary();
        
        // Hide modal
        document.getElementById('category-dialog').style.display = 'none';
        
        // Reset form
        this.reset();
        
        // Show success message
        showNotification('Category added successfully!', 'success');
    });

    // Close button in modal
    document.querySelector('.close-button').addEventListener('click', function() {
        document.getElementById('category-dialog').style.display = 'none';
    });
    
    // Create first category button
    const createFirstCategoryBtn = document.getElementById('create-first-category-btn');
    if (createFirstCategoryBtn) {
        createFirstCategoryBtn.addEventListener('click', showAddCategoryModal);
    }

    // Add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryModal);
    }

    // Show modal to edit a category
    function showEditCategoryModal(category) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Edit Category</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="edit-category-form">
                    <div class="form-group">
                        <label for="edit-category-name">Category Name</label>
                        <input type="text" id="edit-category-name" value="${category.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-category-limit">Category Limit</label>
                        <input type="number" id="edit-category-limit" value="${category.allocated}" required>
                    </div>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </form>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Close modal on click
        modalOverlay.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Handle form submission
        document.getElementById('edit-category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const categoryName = document.getElementById('edit-category-name').value;
            const categoryLimit = document.getElementById('edit-category-limit').value;
            
            // Update category data
            const oldName = category.name;
            category.name = categoryName;
            category.allocated = parseFloat(categoryLimit);
            
            // Update AI Budget System expenses
            if (oldName !== categoryName) {
                // If name changed, remove old entry and create new one
                delete window.aiBudgetSystem.expenses[oldName];
            }
            
            window.aiBudgetSystem.expenses[categoryName] = {
                spent: category.spent,
                limit: parseFloat(categoryLimit)
            };
            
            // Save to user data
            saveUserBudgetData();
            
            // Update UI
            renderBudgetCategories();
            updateBudgetSummary();
            updateAIRecommendations();
            
            // Close modal
            document.body.removeChild(modalOverlay);
        });
    }

    // Show modal to add an expense to a category
    function showAddExpenseModal(category) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Add Expense</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="add-expense-form">
                    <div class="form-group">
                        <label for="expense-amount">Amount</label>
                        <input type="number" id="expense-amount" required>
                    </div>
                    <div class="form-group">
                        <label for="expense-description">Description</label>
                        <input type="text" id="expense-description" required>
                    </div>
                    <button type="submit" class="btn-primary">Add Expense</button>
                </form>
            </div>
        `;
        
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);
        
        // Close modal on click
        modalOverlay.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });
        
        // Handle form submission
        document.getElementById('add-expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const expenseAmount = parseFloat(document.getElementById('expense-amount').value);
            const expenseDescription = document.getElementById('expense-description').value;
            
            // Update category data
            category.spent += expenseAmount;
            
            // Update AI Budget System expenses
            if (window.aiBudgetSystem.expenses[category.name]) {
                window.aiBudgetSystem.expenses[category.name].spent += expenseAmount;
            } else {
                window.aiBudgetSystem.expenses[category.name] = {
                    spent: expenseAmount,
                    limit: category.allocated
                };
            }
            
            // Add to expense history
            window.aiBudgetSystem.expenseHistory.push({
                category: category.name,
                amount: expenseAmount,
                date: new Date()
            });
            
            // Save to user data
            saveUserBudgetData();
            
            // Update UI
            renderBudgetCategories();
            updateBudgetSummary();
            updateAIRecommendations();
            
            // Close modal
            document.body.removeChild(modalOverlay);
        });
    }

    // Save budget data to user profile
    function saveUserBudgetData() {
        currentUser.budgetData = budgetData;
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
    }

    // Update the AI recommendations using AI Budget System
    function updateAIRecommendations() {
        const recommendationElement = document.getElementById('ai-budget-recommendation');
        
        if (!recommendationElement) return;
        
        // Only provide recommendations if we have budget categories
        if (budgetData.categories.length === 0) {
            recommendationElement.textContent = "Add some budget categories to get personalized recommendations.";
            return;
        }
        
        // Get insights from AI Budget System
        const insights = window.aiBudgetSystem.generateInsights();
        
        if (insights.length > 0) {
            // Display first insight as recommendation
            recommendationElement.textContent = insights[0].message + ' ' + insights[0].action;
        } else {
            // Fallback to savings adjustment check
            const savingsResult = window.aiBudgetSystem.adjustSavings();
            
            if (savingsResult.alerts.length > 0) {
                recommendationElement.textContent = savingsResult.alerts[0].message;
            } else {
                // Default recommendation
                recommendationElement.textContent = "Your budget looks good! Continue monitoring your spending to stay on track.";
            }
        }
    }
    
    // Function to create and display expense charts
    function displayExpenseCharts() {
        if (!window.Chart) {
            console.error('Chart.js not loaded');
            return;
        }
        
        // Only proceed if we have categories
        if (budgetData.categories.length === 0) {
            return;
        }
        
        // Create container for charts if it doesn't exist
        let chartsSection = document.querySelector('.budget-charts');
        if (!chartsSection) {
            chartsSection = document.createElement('section');
            chartsSection.className = 'budget-charts';
            chartsSection.innerHTML = `
                <div class="container">
                    <h2 class="section-title">Expense Analysis</h2>
                    <div class="charts-grid">
                        <div class="chart-card">
                            <h3>Expenses vs Budget Limits</h3>
                            <canvas id="expenses-chart"></canvas>
                        </div>
                        <div class="chart-card">
                            <h3>Expense Distribution</h3>
                            <canvas id="distribution-chart"></canvas>
                        </div>
                    </div>
                </div>
            `;
            
            // Insert before budget tools section
            const toolsSection = document.querySelector('.budget-tools');
            if (toolsSection) {
                toolsSection.parentNode.insertBefore(chartsSection, toolsSection);
            } else {
                document.querySelector('main').appendChild(chartsSection);
            }
        }
        
        // Create bar chart for expenses vs limits
        const barChartData = window.aiBudgetSystem.getExpenseBarChartData();
        const barCtx = document.getElementById('expenses-chart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: barChartData.labels,
                datasets: barChartData.datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: barChartData.title
                    },
                    legend: {
                        position: 'top',
                    }
                }
            }
        });
        
        // Create pie chart for expense distribution
        const pieChartData = window.aiBudgetSystem.getExpensePieChartData();
        const pieCtx = document.getElementById('distribution-chart').getContext('2d');
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: pieChartData.labels,
                datasets: pieChartData.datasets
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: pieChartData.title
                    },
                    legend: {
                        position: 'right',
                    }
                }
            }
        });
    }
    
    // Add expense prediction function
    function addExpensePrediction() {
        // Create container for prediction if it doesn't exist
        const toolsGrid = document.querySelector('.tools-grid');
        if (!toolsGrid) return;
        
        const predictionCard = document.createElement('div');
        predictionCard.className = 'tool-card';
        predictionCard.innerHTML = `
            <div class="tool-icon">
                <i class="fas fa-robot"></i>
            </div>
            <h3>Expense Prediction</h3>
            <p id="prediction-message">Analyze your spending patterns to predict next month's expenses.</p>
            <div id="prediction-details" class="prediction-details" style="display:none;">
                <h4 id="prediction-month"></h4>
                <ul id="prediction-list"></ul>
            </div>
            <button class="btn-secondary" id="predict-btn">Predict Expenses</button>
        `;
        
        toolsGrid.appendChild(predictionCard);
        
        // Add event listener for prediction button
        document.getElementById('predict-btn').addEventListener('click', function() {
            const result = window.aiBudgetSystem.predictExpenses();
            const messageElement = document.getElementById('prediction-message');
            const detailsElement = document.getElementById('prediction-details');
            const monthElement = document.getElementById('prediction-month');
            const listElement = document.getElementById('prediction-list');
            
            messageElement.textContent = result.message;
            
            if (result.success) {
                // Display prediction details
                monthElement.textContent = `Predicted Expenses for ${result.nextMonthYear}:`;
                
                // Clear previous predictions
                listElement.innerHTML = '';
                
                // Add each prediction to the list
                Object.entries(result.predictions).forEach(([category, amount]) => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${category}:</strong> ₹${amount.toFixed(2)}`;
                    listElement.appendChild(li);
                });
                
                detailsElement.style.display = 'block';
            } else {
                // Hide details if prediction failed
                detailsElement.style.display = 'none';
            }
        });
    }
    
    // Refresh recommendation button
    const refreshRecommendationBtn = document.getElementById('refresh-recommendation');
    if (refreshRecommendationBtn) {
        refreshRecommendationBtn.addEventListener('click', updateAIRecommendations);
    }

    // Initialize the page
    function initPage() {
        renderBudgetCategories();
        updateBudgetSummary();
        updateAIRecommendations();
        
        // Add slight delay to ensure DOM is ready
        setTimeout(() => {
            displayExpenseCharts();
            addExpensePrediction();
        }, 500);
    }

    // Call init function
    initPage();

    // Add reference to new budget form elements
    const budgetStartInput = document.getElementById('budget-start');
    const budgetEndInput = document.getElementById('budget-end');
    const totalIncomeInput = document.getElementById('total-income');
    const savingsPercentageSlider = document.getElementById('savings-percentage');
    const savingsValueDisplay = document.getElementById('savings-value');
    const savingsAmountDisplay = document.getElementById('savings-amount');
    const updateBudgetBtn = document.getElementById('update-budget-btn');
    
    // Initialize budget settings from stored data
    function initializeBudgetSettings() {
        if (currentUser && currentUser.budgetSettings) {
            const settings = currentUser.budgetSettings;
            
            if (settings.periodStart) {
                budgetStartInput.value = settings.periodStart;
            } else {
                // Default to start of current month
                budgetStartInput.value = new Date().toISOString().split('T')[0].slice(0, 8) + '01';
            }
            
            if (settings.periodEnd) {
                budgetEndInput.value = settings.periodEnd;
            } else {
                // Default to end of current month
                const lastDay = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                budgetEndInput.value = lastDay.toISOString().split('T')[0];
            }
            
            if (settings.income) {
                totalIncomeInput.value = settings.income;
            }
            
            if (settings.savingsPercentage) {
                savingsPercentageSlider.value = settings.savingsPercentage;
                savingsValueDisplay.textContent = `${settings.savingsPercentage}%`;
                
                // Calculate savings amount
                const income = parseFloat(totalIncomeInput.value) || 0;
                const savingsAmount = income * (settings.savingsPercentage / 100);
                savingsAmountDisplay.textContent = savingsAmount.toLocaleString();
            }
        } else {
            // Set default values
            const today = new Date();
            
            // Start date - first day of current month
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            budgetStartInput.value = firstDay.toISOString().split('T')[0];
            
            // End date - last day of current month
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            budgetEndInput.value = lastDay.toISOString().split('T')[0];
            
            // Default savings percentage
            savingsValueDisplay.textContent = '20%';
        }
    }
    
    // Handle savings percentage slider change
    if (savingsPercentageSlider) {
        savingsPercentageSlider.addEventListener('input', function() {
            const value = this.value;
            savingsValueDisplay.textContent = `${value}%`;
            
            // Calculate savings amount based on income
            const income = parseFloat(totalIncomeInput.value) || 0;
            const savingsAmount = income * (value / 100);
            savingsAmountDisplay.textContent = savingsAmount.toLocaleString();
        });
    }
    
    // Handle income input change
    if (totalIncomeInput) {
        totalIncomeInput.addEventListener('input', function() {
            // Recalculate savings amount
            const income = parseFloat(this.value) || 0;
            const percentage = parseInt(savingsPercentageSlider.value);
            const savingsAmount = income * (percentage / 100);
            savingsAmountDisplay.textContent = savingsAmount.toLocaleString();
        });
    }
    
    // Handle budget settings update
    if (updateBudgetBtn) {
        updateBudgetBtn.addEventListener('click', function() {
            const startDate = budgetStartInput.value;
            const endDate = budgetEndInput.value;
            const income = parseFloat(totalIncomeInput.value) || 0;
            const savingsPercentage = parseInt(savingsPercentageSlider.value);
            
            // Validate inputs
            if (!startDate || !endDate) {
                alert('Please enter valid start and end dates');
                return;
            }
            
            if (new Date(startDate) > new Date(endDate)) {
                alert('Start date must be before end date');
                return;
            }
            
            // Create or update budget settings
            if (!currentUser.budgetSettings) {
                currentUser.budgetSettings = {};
            }
            
            currentUser.budgetSettings.periodStart = startDate;
            currentUser.budgetSettings.periodEnd = endDate;
            currentUser.budgetSettings.income = income;
            currentUser.budgetSettings.savingsPercentage = savingsPercentage;
            
            // Calculate available budget (after savings)
            const savingsAmount = income * (savingsPercentage / 100);
            const availableBudget = income - savingsAmount;
            
            currentUser.budgetSettings.savingsAmount = savingsAmount;
            currentUser.budgetSettings.availableBudget = availableBudget;
            
            // Update budget data
            budgetData.totalBudget = availableBudget;
            budgetData.remaining = availableBudget - budgetData.spent;
            budgetData.periodStart = startDate;
            budgetData.periodEnd = endDate;
            
            // Update financial summary as well
            if (!currentUser.financialSummary) {
                currentUser.financialSummary = {};
            }
            currentUser.financialSummary.income = income;
            
            // Update AI budget system with new data
            window.aiBudgetSystem.totalMoney = income;
            window.aiBudgetSystem.minSavingsLimit = savingsAmount;
            
            // Save to localStorage
            saveUserBudgetData();
            
            // Update UI
            updateBudgetSummary();
            updateAIRecommendations();
            
            // Show notification
            showNotification('Budget settings updated successfully!', 'success');
            
            // Generate AI recommendations based on new budget
            generateBudgetRecommendations();
        });
    }
    
    // Generate AI budget recommendations based on income
    function generateBudgetRecommendations() {
        if (!currentUser || !currentUser.budgetSettings || !currentUser.budgetSettings.income) {
            return;
        }
        
        const income = currentUser.budgetSettings.income;
        const savingsAmount = currentUser.budgetSettings.savingsAmount || 0;
        const availableBudget = income - savingsAmount;
        
        // Recommended budget allocations
        // These percentages are based on financial planning best practices
        const recommendedCategories = [
            { name: 'Housing', percentage: 30, limit: availableBudget * 0.30 },
            { name: 'Food', percentage: 15, limit: availableBudget * 0.15 },
            { name: 'Transportation', percentage: 15, limit: availableBudget * 0.15 },
            { name: 'Utilities', percentage: 10, limit: availableBudget * 0.10 },
            { name: 'Healthcare', percentage: 10, limit: availableBudget * 0.10 },
            { name: 'Entertainment', percentage: 10, limit: availableBudget * 0.10 },
            { name: 'Personal', percentage: 5, limit: availableBudget * 0.05 },
            { name: 'Miscellaneous', percentage: 5, limit: availableBudget * 0.05 }
        ];
        
        // Store recommendations
        currentUser.budgetRecommendations = recommendedCategories;
        
        // Update localStorage
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
        
        // Show recommendations if we have the button
        const aiRecommendationEl = document.getElementById('ai-budget-recommendation');
        if (aiRecommendationEl) {
            aiRecommendationEl.innerHTML = `
                Based on your monthly income of ₹${income.toLocaleString()}, I recommend the following allocations:
                <ul class="recommendation-list">
                    ${recommendedCategories.map(c => 
                        `<li>${c.name}: ₹${c.limit.toLocaleString()} (${c.percentage}%)</li>`
                    ).join('')}
                </ul>
                <button id="apply-recommendations" class="btn-secondary">Apply Recommendations</button>
            `;
            
            // Add event listener to apply recommendations button
            document.getElementById('apply-recommendations').addEventListener('click', function() {
                applyBudgetRecommendations();
            });
        }
    }
    
    // Apply budget recommendations and create categories
    function applyBudgetRecommendations() {
        if (!currentUser || !currentUser.budgetRecommendations) {
            return;
        }
        
        // Clear existing categories
        budgetData.categories = [];
        
        // Add recommended categories
        currentUser.budgetRecommendations.forEach(rec => {
            // Check if we already have this category
            const existingIndex = budgetData.categories.findIndex(c => c.name.toLowerCase() === rec.name.toLowerCase());
            
            if (existingIndex >= 0) {
                // Update existing category
                budgetData.categories[existingIndex].allocated = rec.limit;
            } else {
                // Create new category
                budgetData.categories.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    name: rec.name,
                    allocated: rec.limit,
                    spent: 0,
                    icon: `fas ${getCategoryIcon(rec.name)}`
                });
            }
        });
        
        // Update totals
        calculateBudgetTotals();
        
        // Save to user data
        saveUserBudgetData();
        
        // Update UI
        renderBudgetCategories();
        updateBudgetSummary();
        
        // Show success message
        showNotification('Budget categories created based on recommendations', 'success');
    }
    
    // Update original initPage function to include new budget settings initialization
    function initPage() {
        initializeBudgetSettings(); // Initialize budget settings first
        renderBudgetCategories();
        updateBudgetSummary();
        updateAIRecommendations();
        
        // Generate recommendations if we have income data
        if (currentUser && currentUser.budgetSettings && currentUser.budgetSettings.income) {
            generateBudgetRecommendations();
        }
        
        // Add slight delay to ensure DOM is ready
        setTimeout(() => {
            displayExpenseCharts();
            addExpensePrediction();
        }, 500);
    }

    // Call init function
    initPage();
});

