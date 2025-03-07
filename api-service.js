/**
 * FinBuddy API Service
 * Handles all communication with the backend server
 */

class FinBuddyApi {
    constructor(apiUrl = 'https://api.finbuddy.com/v1') {
        this.apiUrl = apiUrl;
        this.token = localStorage.getItem('finbuddy_auth_token');
        this.userId = localStorage.getItem('finbuddy_user_id');
    }

    /**
     * Get authentication headers
     */
    getHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Handle API response
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'API request failed');
        }
        return response.json();
    }

    /**
     * Authenticate user
     */
    async login(email, password) {
        const response = await fetch(`${this.apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await this.handleResponse(response);
        
        // Store authentication data
        localStorage.setItem('finbuddy_auth_token', data.token);
        localStorage.setItem('finbuddy_user_id', data.userId);
        
        this.token = data.token;
        this.userId = data.userId;
        
        return data;
    }

    /**
     * Get user data
     */
    async getUserData() {
        const response = await fetch(`${this.apiUrl}/users/${this.userId}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }

    /**
     * Update user budget data
     */
    async updateBudget(budgetData) {
        const response = await fetch(`${this.apiUrl}/users/${this.userId}/budget`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(budgetData)
        });
        return this.handleResponse(response);
    }

    /**
     * Update user savings data
     */
    async updateSavings(savingsData) {
        const response = await fetch(`${this.apiUrl}/users/${this.userId}/savings`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(savingsData)
        });
        return this.handleResponse(response);
    }
}

// Initialize and expose as global
window.finbuddyApi = new FinBuddyApi();
