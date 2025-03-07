document.addEventListener('DOMContentLoaded', () => {
    // Get current user data or initialize empty data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user')) || { 
        name: 'Guest',
        savings: {
            totalSavings: 0,
            monthlyContribution: 0,
            goals: []
        }
    };

    // Initialize savings data
    let savingsData = currentUser.savings || {
        totalSavings: 0,
        monthlyContribution: 0,
        goals: []
    };

    // Update savings overview
    function updateSavingsOverview() {
        document.getElementById('total-savings').textContent = `₹${savingsData.totalSavings.toLocaleString()}`;
        document.getElementById('goals-count').textContent = savingsData.goals.length;
        document.getElementById('monthly-contribution').textContent = `₹${savingsData.monthlyContribution.toLocaleString()}`;
    }

    // Render savings goals
    function renderSavingsGoals() {
        const goalsContainer = document.getElementById('savings-goals-container');
        const noGoalsMessage = document.getElementById('no-goals-message');
        
        // Clear existing goals
        goalsContainer.innerHTML = '';
        
        // Show message if no goals
        if (savingsData.goals.length === 0) {
            if (noGoalsMessage) {
                goalsContainer.appendChild(noGoalsMessage);
            } else {
                const emptyMessage = document.createElement('p');
                emptyMessage.className = 'empty-state';
                emptyMessage.id = 'no-goals-message';
                emptyMessage.textContent = "You haven't created any savings goals yet. Use the form above to create your first goal.";
                goalsContainer.appendChild(emptyMessage);
            }
            return;
        } else {
            // Hide the no goals message
            if (noGoalsMessage) {
                noGoalsMessage.style.display = 'none';
            }
        }

        // Add each goal
        savingsData.goals.forEach(goal => {
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';
            goalCard.setAttribute('data-id', goal.id);

            const progressPercentage = goal.target > 0 ? (goal.saved / goal.target) * 100 : 0;
            const formattedDate = goal.targetDate ? new Date(goal.targetDate).toLocaleDateString() : 'Ongoing';

            goalCard.innerHTML = `
                <div class="goal-icon">
                    <i class="fas ${goal.icon || 'fa-piggy-bank'}"></i>
                </div>
                <div class="goal-details">
                    <h3>${goal.name}</h3>
                    <div class="progress-container">
                        <div class="label">
                            <span>Progress</span>
                            <span>${progressPercentage.toFixed(0)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress" style="width: ${progressPercentage}%"></div>
                        </div>
                        <div class="goal-amount">
                            <span>₹${goal.saved.toLocaleString()} / ₹${goal.target.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="goal-timeline">
                        <i class="fas fa-calendar"></i>
                        <span>Target date: ${formattedDate}</span>
                    </div>
                    <div class="goal-actions">
                        <button class="btn-secondary contribute-btn">Contribute</button>
                        <button class="btn-secondary edit-btn">Edit</button>
                        <button class="btn-secondary delete-btn">Delete</button>
                    </div>
                </div>
            `;

            goalsContainer.appendChild(goalCard);
        });

        // Add event listeners for goal actions
        addGoalEventListeners();
    }

    // Add event listeners to goal buttons
    function addGoalEventListeners() {
        // Contribute buttons
        document.querySelectorAll('.contribute-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.closest('.goal-card').getAttribute('data-id'));
                const goal = savingsData.goals.find(g => g.id === goalId);
                
                if (!goal) return;
                
                showContributeModal(goal);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.closest('.goal-card').getAttribute('data-id'));
                const goal = savingsData.goals.find(g => g.id === goalId);
                
                if (!goal) return;
                
                showEditGoalModal(goal);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const goalId = parseInt(e.target.closest('.goal-card').getAttribute('data-id'));
                
                if (confirm('Are you sure you want to delete this savings goal?')) {
                    // Remove the goal from data
                    savingsData.goals = savingsData.goals.filter(g => g.id !== goalId);
                    
                    // Save data
                    saveData();
                    
                    // Update UI
                    renderSavingsGoals();
                    updateSavingsOverview();
                }
            });
        });
    }

    // Save data to localStorage
    function saveData() {
        currentUser.savings = savingsData;
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
    }

    // Handle form submissions
    document.getElementById('savings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('goal-name').value;
        const amount = parseFloat(document.getElementById('goal-amount').value);
        const date = document.getElementById('goal-date').value;
        const icon = document.getElementById('goal-icon').value;
        
        // Validate
        if (!name || isNaN(amount) || amount <= 0) {
            alert('Please enter a valid goal name and amount');
            return;
        }
        
        // Create new goal
        const newGoal = {
            id: Date.now(),
            name,
            target: amount,
            saved: 0,
            targetDate: date,
            icon
        };
        
        // Add goal to data
        savingsData.goals.push(newGoal);
        
        // Save data
        saveData();
        
        // Update UI
        renderSavingsGoals();
        updateSavingsOverview();
        updateGoalDropdown();
        
        // Reset form
        this.reset();
    });

    document.getElementById('contribute-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const goalId = parseInt(document.getElementById('select-goal').value);
        const amount = parseFloat(document.getElementById('contribution-amount').value);
        
        // Validate
        if (!goalId || isNaN(amount) || amount <= 0) {
            alert('Please select a goal and enter a valid amount');
            return;
        }
        
        // Find the goal
        const goal = savingsData.goals.find(g => g.id === goalId);
        if (!goal) {
            alert('Goal not found');
            return;
        }
        
        // Update goal and savings data
        goal.saved += amount;
        savingsData.totalSavings += amount;
        savingsData.monthlyContribution += amount;
        
        // Save data
        saveData();
        
        // Update UI
        renderSavingsGoals();
        updateSavingsOverview();
        
        // Reset form
        this.reset();
        
        // Show success message
        alert(`Successfully contributed ₹${amount} to ${goal.name}`);
    });

    // Show modal to contribute to a goal
    function showContributeModal(goal) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Contribute to ${goal.name}</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="modal-contribute-form">
                    <div class="form-group">
                        <label for="modal-contribution-amount">Amount</label>
                        <input type="number" id="modal-contribution-amount" required>
                    </div>
                    <button type="submit" class="btn-primary">Make Contribution</button>
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
        document.getElementById('modal-contribute-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const amount = parseFloat(document.getElementById('modal-contribution-amount').value);
            
            // Validate
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount');
                return;
            }
            
            // Update goal and savings data
            goal.saved += amount;
            savingsData.totalSavings += amount;
            savingsData.monthlyContribution += amount;
            
            // Save data
            saveData();
            
            // Update UI
            renderSavingsGoals();
            updateSavingsOverview();
            
            // Close modal
            document.body.removeChild(modalOverlay);
            
            // Show success message
            alert(`Successfully contributed ₹${amount} to ${goal.name}`);
        });
    }

    // Show modal to edit a goal
    function showEditGoalModal(goal) {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Edit Goal</h2>
                <button class="close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="modal-edit-form">
                    <div class="form-group">
                        <label for="modal-goal-name">Goal Name</label>
                        <input type="text" id="modal-goal-name" value="${goal.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="modal-goal-target">Target Amount</label>
                        <input type="number" id="modal-goal-target" value="${goal.target}" required>
                    </div>
                    <div class="form-group">
                        <label for="modal-goal-date">Target Date</label>
                        <input type="date" id="modal-goal-date" value="${goal.targetDate || ''}">
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
        document.getElementById('modal-edit-form').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = document.getElementById('modal-goal-name').value;
            const target = parseFloat(document.getElementById('modal-goal-target').value);
            const date = document.getElementById('modal-goal-date').value;
            
            // Validate
            if (!name || isNaN(target) || target <= 0) {
                alert('Please enter a valid goal name and target amount');
                return;
            }
            
            // Update goal data
            goal.name = name;
            goal.target = target;
            goal.targetDate = date;
            
            // Save data
            saveData();
            
            // Update UI
            renderSavingsGoals();
            updateSavingsOverview();
            updateGoalDropdown();
            
            // Close modal
            document.body.removeChild(modalOverlay);
        });
    }

    // Update goal dropdown in the contribute form
    function updateGoalDropdown() {
        const goalSelect = document.getElementById('select-goal');
        if (!goalSelect) return;
        
        // Clear existing options
        goalSelect.innerHTML = '<option value="">Select a goal</option>';
        
        // Add each goal as an option
        savingsData.goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            goalSelect.appendChild(option);
        });
    }

    // Display savings goal pie chart (implemented from Python notebook)
    function displaySavingsGoalPie() {
        // Check if we need to add Chart.js
        if (!window.Chart && !document.getElementById('chart-js')) {
            const script = document.createElement('script');
            script.id = 'chart-js';
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = createPieCharts;
            document.head.appendChild(script);
        } else {
            createPieCharts();
        }

        function createPieCharts() {
            // Remove any existing charts
            const chartContainers = document.querySelectorAll('.goal-chart-container');
            chartContainers.forEach(container => container.remove());

            // Create charts for each goal
            savingsData.goals.forEach(goal => {
                const goalCard = document.querySelector(`[data-id="${goal.id}"]`);
                if (!goalCard) return;

                const chartContainer = document.createElement('div');
                chartContainer.className = 'goal-chart-container';
                chartContainer.style.width = '100%';
                chartContainer.style.height = '150px';
                chartContainer.style.marginTop = '15px';

                const canvas = document.createElement('canvas');
                canvas.id = `goal-chart-${goal.id}`;
                chartContainer.appendChild(canvas);
                
                goalCard.querySelector('.goal-details').appendChild(chartContainer);

                const moneyNeeded = Math.max(0, goal.target - goal.saved);
                
                // Create the chart
                new Chart(canvas, {
                    type: 'pie',
                    data: {
                        labels: ['Current Savings', 'Amount Needed'],
                        datasets: [{
                            data: [goal.saved, moneyNeeded],
                            backgroundColor: ['green', 'red']
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            },
                            title: {
                                display: true,
                                text: `Progress for ${goal.name}`
                            }
                        }
                    }
                });

                // Add message below chart
                const messageDiv = document.createElement('div');
                messageDiv.className = 'goal-status-message';
                messageDiv.style.marginTop = '10px';
                messageDiv.style.textAlign = 'center';
                messageDiv.style.fontStyle = 'italic';
                
                if (moneyNeeded > 0) {
                    messageDiv.textContent = `You need ₹${moneyNeeded.toLocaleString()} more to reach your goal.`;
                    messageDiv.style.color = '#e74c3c';
                } else {
                    messageDiv.textContent = `Congratulations! You have enough savings to achieve this goal!`;
                    messageDiv.style.color = '#27ae60';
                }
                
                chartContainer.appendChild(messageDiv);
            });
        }
    }

    // Initialize the page
    function init() {
        updateSavingsOverview();
        renderSavingsGoals();
        updateGoalDropdown();
        // Wait a bit for DOM to be ready for charts
        setTimeout(displaySavingsGoalPie, 500);
    }

    // Call init function
    init();
});