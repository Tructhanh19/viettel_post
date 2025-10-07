/**
 * Viettel Post Utilities
 * Common utility functions used throughout the application
 */

const Utils = {
    /**
     * Format date to Vietnamese format
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        return new Intl.DateTimeFormat('vi-VN', options).format(date);
    },

    /**
     * Format currency to Vietnamese format
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    },

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show notification
     * @param {string} message - Message to show
     * @param {string} type - Type of notification (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after timeout
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, APP_CONFIG.NOTIFICATIONS.DISMISS_TIMEOUT);
    },

    /**
     * Get notification icon based on type
     * @param {string} type - Notification type
     * @returns {string} Font Awesome icon class
     */
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate phone number (Vietnamese format)
     * @param {string} phone - Phone number to validate
     * @returns {boolean} True if valid phone number
     */
    isValidPhone(phone) {
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        return phoneRegex.test(phone);
    },

    /**
     * Generate random ID
     * @param {number} length - Length of ID
     * @returns {string} Random ID
     */
    generateId(length = 8) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    /**
     * Convert string to slug format
     * @param {string} str - String to convert
     * @returns {string} Slug format string
     */
    slugify(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Format file size
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobile() {
        return window.innerWidth <= 768;
    },

    /**
     * Smooth scroll to element
     * @param {string} elementId - ID of element to scroll to
     */
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Đã sao chép vào clipboard', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            this.showNotification('Không thể sao chép', 'error');
        }
    },

    /**
     * Get current date range for dashboard
     * @returns {Object} Start and end dates
     */
    getCurrentDateRange() {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - APP_CONFIG.USER.DEFAULT_DATE_RANGE);
        
        return {
            start: this.formatDate(start),
            end: this.formatDate(end)
        };
    },

    /**
     * Handle API errors
     * @param {Error} error - Error object
     */
    handleApiError(error) {
        console.error('API Error:', error);
        
        if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const message = error.response.data?.message || 'Đã xảy ra lỗi';
            
            switch (status) {
                case 401:
                    this.showNotification('Phiên đăng nhập đã hết hạn', 'error');
                    // Redirect to login
                    break;
                case 403:
                    this.showNotification('Bạn không có quyền thực hiện thao tác này', 'error');
                    break;
                case 404:
                    this.showNotification('Không tìm thấy dữ liệu', 'error');
                    break;
                case 500:
                    this.showNotification('Lỗi server, vui lòng thử lại sau', 'error');
                    break;
                default:
                    this.showNotification(message, 'error');
            }
        } else if (error.request) {
            // Network error
            this.showNotification('Không thể kết nối đến server', 'error');
        } else {
            // Other error
            this.showNotification('Đã xảy ra lỗi không xác định', 'error');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}