/**
 * FinBuddy API Service
 * Handles communication with the backend server
 */

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.token = localStorage.getItem('token');
    }

    // Helper method for HTTP requests
    async fetchData(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Set default headers with auth token
        if (this.token) {
            options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${this.token}`
            };
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Authentication methods
    async register(name, email, password) {
        return this.fetchData('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
    }

    async login(email, password) {
        const data = await this.fetchData('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        // Save token and user data
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            this.token = data.token;
        }
        
        return data;
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.token = null;
    }

    // Profile methods
    async getProfile() {
        return this.fetchData('/profile');
    }

    // Transaction methods
    async addTransaction(name, type, amount, category = null) {
        return this.fetchData('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type, amount, category })
        });
    }

    async getTransactions(limit = 50) {
        return this.fetchData(`/transactions?limit=${limit}`);
    }

    // Budget methods
    async setBudget(category, limit, period = 'monthly') {
        return this.fetchData('/budgets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, limit, period })
        });
    }

    async getBudgets() {
        return this.fetchData('/budgets');
    }

    // Savings goals methods
    async addSavingsGoal(name, target, icon) {
        return this.fetchData('/savings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, target, icon })
        });
    }

    async getSavingsGoals() {
        return this.fetchData('/savings');
    }

    async contributeToSavingsGoal(goalId, amount) {
        return this.fetchData(`/savings/${goalId}/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
    }
}

// Create and export API instance
const api = new APIService();
export default api;
