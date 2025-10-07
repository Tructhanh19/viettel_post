/**
 * Viettel Post Configuration
 * Contains all configuration constants and settings
 */

const APP_CONFIG = {
    // Application Information
    APP_NAME: 'Viettel Post Dashboard',
    VERSION: '1.0.0',
    
    // API Configuration
    API: {
        BASE_URL: 'https://api.viettelpost.vn',
        TIMEOUT: 10000,
        ENDPOINTS: {
            ORDERS: '/api/orders',
            TRACKING: '/api/tracking',
            STATISTICS: '/api/statistics',
            USER: '/api/user'
        }
    },
    
    // UI Configuration
    UI: {
        SIDEBAR_WIDTH: {
            EXPANDED: '240px',
            COLLAPSED: '60px'
        },
        ANIMATION_DURATION: 300,
        SEARCH_DELAY: 500
    },
    
    // User Settings
    USER: {
        DEFAULT_DATE_RANGE: 30, // days
        ITEMS_PER_PAGE: 20,
        AUTO_REFRESH_INTERVAL: 300000 // 5 minutes
    },
    
    // Menu Configuration
    MENU_ITEMS: [
        {
            id: 'home',
            label: 'Trang chủ',
            icon: 'fas fa-home',
            route: '/',
            active: true
        },
        {
            id: 'create-order',
            label: 'Tạo đơn',
            icon: 'fas fa-plus-circle',
            route: '/create-order'
        },
        {
            id: 'management',
            label: 'Quản lý',
            icon: 'fas fa-tasks',
            hasSubmenu: true,
            submenu: [
                { id: 'order-management', label: 'Quản lý vận đơn', route: '/orders' },
                { id: 'operation-report', label: 'Báo cáo vận hành', route: '/reports/operation' },
                { id: 'revenue-stats', label: 'Thống kê tiền hàng', route: '/stats/revenue' },
                { id: 'sales-stats', label: 'Thống kê doanh thu', route: '/stats/sales' },
                { id: 'pending-orders', label: 'Đơn hàng cần xử lý', route: '/orders/pending' },
                { id: 'recipient-list', label: 'Danh sách người nhận', route: '/recipients' }
            ]
        },
        {
            id: 'tracking',
            label: 'Tra cứu',
            icon: 'fas fa-map-marker-alt',
            hasSubmenu: true,
            submenu: [
                { id: 'post-office-lookup', label: 'Tra cứu bưu cục', route: '/lookup/post-office' },
                { id: 'cost-estimate', label: 'Ước tính cước phí', route: '/lookup/cost' },
                { id: 'location-lookup', label: 'Tra cứu địa danh', route: '/lookup/location' }
            ]
        },
        {
            id: 'utilities',
            label: 'Tiện ích',
            icon: 'fas fa-th',
            hasSubmenu: true,
            submenu: [
                { id: 'print-labels', label: 'In nhãn cảnh báo', route: '/utilities/labels' },
                { id: 'refund-service', label: 'Dịch vụ hoàn cước', route: '/utilities/refund', icon: 'fas fa-cog' }
            ]
        },
        {
            id: 'settings',
            label: 'Cài đặt tài khoản',
            icon: 'fas fa-cog',
            route: '/settings'
        },
        {
            id: 'help',
            label: 'Hỏi đáp trợ giúp',
            icon: 'fas fa-life-ring',
            hasSubmenu: true,
            submenu: [
                { id: 'faq', label: 'Câu hỏi thường gặp FAQs', route: '/help/faq' },
                { id: 'terms', label: 'Điều khoản & quy định', route: '/help/terms' },
                { id: 'privacy', label: 'Chính sách bảo mật thông tin', route: '/help/privacy' }
            ]
        },
        {
            id: 'survey',
            label: 'Khảo sát',
            icon: 'fas fa-chart-bar',
            route: '/survey'
        }
    ],
    
    // Chart Configuration
    CHARTS: {
        ORDER_STATS: {
            type: 'line',
            backgroundColor: 'rgba(229, 62, 62, 0.1)',
            borderColor: '#e53e3e',
            borderWidth: 2
        },
        TOP_PRODUCTS: {
            type: 'doughnut',
            colors: ['#e53e3e', '#dc3545', '#28a745', '#17a2b8', '#ffc107']
        }
    },
    
    // Notification Settings
    NOTIFICATIONS: {
        POSITION: 'top-right',
        AUTO_DISMISS: true,
        DISMISS_TIMEOUT: 5000
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}