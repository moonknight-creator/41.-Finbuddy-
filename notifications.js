/**
 * Notification System for FinBuddy
 * Provides consistent notification messages across the app
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.initContainer();
    }

    /**
     * Initialize notification container
     */
    initContainer() {
        // Check if container already exists
        this.container = document.getElementById('notification-container');
        
        if (!this.container) {
            // Create container
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            document.body.appendChild(this.container);
            
            // Add styles
            const style = document.createElement('style');
            style.textContent = `
                #notification-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    max-width: 350px;
                }
                
                .notification {
                    background-color: white;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    padding: 15px;
                    display: flex;
                    align-items: flex-start;
                    transform: translateX(120%);
                    transition: transform 0.3s ease;
                    overflow: hidden;
                }
                
                .notification.show {
                    transform: translateX(0);
                }
                
                .notification::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 4px;
                }
                
                .notification-icon {
                    margin-right: 12px;
                    font-size: 20px;
                }
                
                .notification-content {
                    flex: 1;
                }
                
                .notification-title {
                    font-weight: 600;
                    margin-bottom: 5px;
                    font-size: 14px;
                }
                
                .notification-message {
                    color: #4a4a4a;
                    font-size: 13px;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 14px;
                    cursor: pointer;
                    color: #aaa;
                    padding: 5px;
                    margin-left: 5px;
                }
                
                .notification-close:hover {
                    color: #555;
                }
                
                .notification.success::before {
                    background-color: #2ecc71;
                }
                
                .notification.success .notification-icon {
                    color: #2ecc71;
                }
                
                .notification.info::before {
                    background-color: #3498db;
                }
                
                .notification.info .notification-icon {
                    color: #3498db;
                }
                
                .notification.warning::before {
                    background-color: #f39c12;
                }
                
                .notification.warning .notification-icon {
                    color: #f39c12;
                }
                
                .notification.error::before {
                    background-color: #e74c3c;
                }
                
                .notification.error .notification-icon {
                    color: #e74c3c;
                }
                
                @media (max-width: 480px) {
                    #notification-container {
                        left: 20px;
                        right: 20px;
                    }
                    
                    .notification {
                        width: 100%;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Type of notification (success, info, warning, error)
     * @param {string} title - Optional title
     * @param {number} duration - Duration in milliseconds (0 for no auto-close)
     */
    show(message, type = 'info', title = '', duration = 3000) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Set icon based on type
        let icon;
        switch (type) {
            case 'success':
                icon = 'fa-check-circle';
                if (!title) title = 'Success';
                break;
            case 'warning':
                icon = 'fa-exclamation-triangle';
                if (!title) title = 'Warning';
                break;
            case 'error':
                icon = 'fa-times-circle';
                if (!title) title = 'Error';
                break;
            default:
                icon = 'fa-info-circle';
                if (!title) title = 'Information';
        }
        
        // Build notification content
        notification.innerHTML = `
            <i class="fas ${icon} notification-icon"></i>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to container
        this.container.appendChild(notification);
        
        // Show with animation
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Add close button handler
        notification.querySelector('.notification-close').addEventListener('click', () => {
            this.close(notification);
        });
        
        // Auto-close if duration is set
        if (duration > 0) {
            setTimeout(() => {
                this.close(notification);
            }, duration);
        }
        
        return notification;
    }
    
    /**
     * Helper methods for different notification types
     */
    success(message, title = '', duration = 3000) {
        return this.show(message, 'success', title, duration);
    }
    
    info(message, title = '', duration = 3000) {
        return this.show(message, 'info', title, duration);
    }
    
    warning(message, title = '', duration = 3000) {
        return this.show(message, 'warning', title, duration);
    }
    
    error(message, title = '', duration = 3000) {
        return this.show(message, 'error', title, duration);
    }
    
    /**
     * Close a notification
     * @param {HTMLElement} notification - The notification element to close
     */
    close(notification) {
        notification.classList.remove('show');
        
        // Remove after animation
        setTimeout(() => {
            if (notification.parentNode === this.container) {
                this.container.removeChild(notification);
            }
        }, 300);
    }
}

// Create global instance
window.notifications = new NotificationSystem();

// Compatibility function for existing code that uses showNotification
function showNotification(message, type = 'info') {
    if (window.notifications) {
        window.notifications.show(message, type);
    } else {
        console.log(`Notification (${type}): ${message}`);
    }
}
