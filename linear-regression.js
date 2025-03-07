/**
 * Simple Linear Regression implementation for expense prediction
 * Based on the functionality from the Python notebook
 */
class LinearRegression {
    constructor() {
        this.slope = 0;
        this.intercept = 0;
    }

    /**
     * Fits the model to the provided data
     * @param {Array} x - Array of independent variables (months)
     * @param {Array} y - Array of dependent variables (expenses)
     */
    fit(x, y) {
        // Check if arrays have the same length
        if (x.length !== y.length) {
            throw new Error('Input arrays must have the same length');
        }

        const n = x.length;

        // Calculate means
        const meanX = x.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;

        // Calculate slope (m)
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (x[i] - meanX) * (y[i] - meanY);
            denominator += (x[i] - meanX) ** 2;
        }
        
        this.slope = numerator / denominator;
        
        // Calculate intercept (b)
        this.intercept = meanY - (this.slope * meanX);
    }

    /**
     * Predicts values based on fitted model
     * @param {Array|number} x - Independent variable(s) to predict on
     * @returns {Array|number} - Predicted values
     */
    predict(x) {
        // Handle both single value and arrays
        if (Array.isArray(x)) {
            return x.map(xi => (this.slope * xi) + this.intercept);
        } else {
            return (this.slope * x) + this.intercept;
        }
    }
}

// Export the model
window.LinearRegression = LinearRegression;
