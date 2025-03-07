/**
 * Transaction handling for FinBuddy
 * This module provides functions for adding, categorizing, and managing transactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get elements
    const addTransactionBtn = document.getElementById('add-transaction');
    const transactionNameInput = document.getElementById('transaction-name');
    const transactionTypeSelect = document.getElementById('transaction-type');
    const transactionValueInput = document.getElementById('transaction-value');
    const transactionsList = document.getElementById('transactions-list');
    
    // Get current user data
    const currentUser = JSON.parse(localStorage.getItem('finbuddy_current_user'));
    
    // Initialize transaction data
    let userData = {
        transactions: currentUser?.transactions || [],
        balance: currentUser?.financialSummary?.currentBalance || 0,
        income: currentUser?.financialSummary?.income || 0,
        expenses: currentUser?.financialSummary?.expenses || 0
    };
    
    // Add transaction handler
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function() {
            const name = transactionNameInput.value;
            const type = transactionTypeSelect.value;
            const amount = parseFloat(transactionValueInput.value);
            
            if (!name || isNaN(amount) || amount <= 0) {
                alert('Please enter a valid transaction name and amount');
                return;
            }
            
            // Create transaction object
            const transaction = {
                id: Date.now(),
                name,
                type,
                amount,
                date: new Date()
            };
            
            // Add to transactions array
            userData.transactions.push(transaction);
            
            // Update financial summary
            if (type === 'income') {
                userData.income += amount;
                userData.balance += amount;
                
                // Update budget settings if this is an income transaction
                if (currentUser && currentUser.budgetSettings) {
                    // Add to monthly income in budget settings if within current budget period
                    const transactionDate = new Date(transaction.date);
                    const budgetStart = new Date(currentUser.budgetSettings.periodStart);
                    const budgetEnd = new Date(currentUser.budgetSettings.periodEnd);
                    
                    if (transactionDate >= budgetStart && transactionDate <= budgetEnd) {
                        // Add to period income
                        if (!currentUser.budgetSettings.periodIncome) {
                            currentUser.budgetSettings.periodIncome = 0;
                        }
                        currentUser.budgetSettings.periodIncome += amount;
                        
                        // Recalculate available budget
                        const savingsPercentage = currentUser.budgetSettings.savingsPercentage || 20;
                        const savingsAmount = currentUser.budgetSettings.periodIncome * (savingsPercentage / 100);
                        const availableBudget = currentUser.budgetSettings.periodIncome - savingsAmount;
                        
                        currentUser.budgetSettings.savingsAmount = savingsAmount;
                        currentUser.budgetSettings.availableBudget = availableBudget;
                        
                        // Update AI Budget System with new data
                        window.aiBudgetSystem.totalMoney = currentUser.budgetSettings.periodIncome;
                        window.aiBudgetSystem.minSavingsLimit = savingsAmount;
                    }
                }
            } else {
                userData.expenses += amount;
                userData.balance -= amount;
                
                // Use ML model to categorize expense
                if (window.finBuddyML) {
                    const category = window.finBuddyML.categorizeTransaction(name, amount);
                    transaction.category = category;
                    
                    // Update budget if exists for this category
                    updateBudgetCategory(category, amount);
                    
                    // Update AI Budget System
                    if (window.aiBudgetSystem && window.aiBudgetSystem.expenseHistory) {
                        window.aiBudgetSystem.expenseHistory.push({
                            category: category,
                            amount: amount,
                            date: new Date()
                        });
                    }
                }
            }
            
            // Save to currentUser data
            saveUserData();
            
            // Update display
            updateFinancialSummary();
            updateTransactionsList();
            updateBudgetDisplay();
            
            // Clear form
            transactionNameInput.value = '';
            transactionValueInput.value = '';
            
            // Update ML insights
            if (typeof updateInsights === 'function') {
                updateInsights();
            }
        });
    }
    
    // Update budget category with expense
    function updateBudgetCategory(category, amount) {
        if (!currentUser || !currentUser.budgetData) return;
        
        const categoryObj = currentUser.budgetData.categories.find(c => 
            c.name.toLowerCase() === category.toLowerCase());
        
        if (categoryObj) {
            categoryObj.spent += amount;
            currentUser.budgetData.spent += amount;
            currentUser.budgetData.remaining = currentUser.budgetData.totalBudget - currentUser.budgetData.spent;
        }
    }
    
    // Save user data to localStorage
    function saveUserData() {
        if (!currentUser) return;
        
        currentUser.transactions = userData.transactions;
        currentUser.financialSummary = {
            currentBalance: userData.balance,
            income: userData.income,
            expenses: userData.expenses
        };
        
        localStorage.setItem('finbuddy_current_user', JSON.stringify(currentUser));
    }
    
    // Update financial summary display
    function updateFinancialSummary() {
        const balanceElement = document.getElementById('current-balance');
        const incomeElement = document.getElementById('total-income');
        const expensesElement = document.getElementById('total-expenses');
        
        if (balanceElement) balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
        if (incomeElement) incomeElement.textContent = `+₹${userData.income.toFixed(2)}`;
        if (expensesElement) expensesElement.textContent = `-₹${userData.expenses.toFixed(2)}`;
    }
    
    // Update transactions list
    function updateTransactionsList() {
        if (!transactionsList) return;
        
        if (userData.transactions.length === 0) {
            transactionsList.innerHTML = '<p class="empty-state">No transactions yet</p>';
            return;
        }
        
        transactionsList.innerHTML = '';
        
        // Get the 5 most recent transactions
        const recentTransactions = [...userData.transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);
            
        recentTransactions.forEach(t => {
            const item = document.createElement('div');
            item.className = 'transaction-item';
            
            const icon = document.createElement('i');
            icon.className = t.type === 'income' ? 'fas fa-arrow-up positive' : 'fas fa-arrow-down negative';
            
            const details = document.createElement('div');
            details.className = 'transaction-details';
            details.innerHTML = `
                <p>${t.name}</p>
                <span>${new Date(t.date).toLocaleDateString()}</span>
            `;
            
            const amount = document.createElement('span');
            amount.className = t.type === 'income' ? 'positive' : 'negative';
            amount.textContent = `${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}`;
            
            item.appendChild(icon);
            item.appendChild(details);
            item.appendChild(amount);
            
            transactionsList.appendChild(item);
        });
    }
    
    // Update budget display
    function updateBudgetDisplay() {
        const budgetDisplay = document.getElementById('budget-display');
        if (!budgetDisplay || !currentUser || !currentUser.budgetData) return;
        
        const categories = currentUser.budgetData.categories;
        if (categories.length === 0) {
            budgetDisplay.innerHTML = '<p class="empty-state">No budgets set yet</p>';
            return;
        }
        
        budgetDisplay.innerHTML = '';
        
        categories.slice(0, 3).forEach(category => {
            const percentage = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'category-header';
            headerDiv.innerHTML = `
                <span>${category.name.charAt(0).toUpperCase() + category.name.slice(1)}</span>
                <span>₹${category.spent.toFixed(2)}/₹${category.allocated.toFixed(2)}</span>
            `;
            
            const progressBarDiv = document.createElement('div');
            progressBarDiv.className = 'progress-bar';
            
            const progressDiv = document.createElement('div');
            progressDiv.className = 'progress';
            progressDiv.style.width = `${Math.min(percentage, 100)}%`;
            
            // Change color if exceeding budget
            if (percentage > 90) {
                progressDiv.style.backgroundColor = '#e74c3c';
            }
            
            progressBarDiv.appendChild(progressDiv);
            categoryDiv.appendChild(headerDiv);
            categoryDiv.appendChild(progressBarDiv);
            
            budgetDisplay.appendChild(categoryDiv);
        });
    }
    
    // Initialize
    updateFinancialSummary();
    updateTransactionsList();
    updateBudgetDisplay();
});
