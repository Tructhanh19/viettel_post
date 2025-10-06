# Viettel Post Dashboard

Giao diện dashboard cho hệ thống Viettel Post được xây dựng với HTML, CSS và JavaScript thuần.

## 📁 Cấu trúc dự án

```
viettel_post/
├── index.html              # File HTML chính
├── assets/
│   ├── style.css          # CSS chính cho layout và components
│   ├── notifications.css  # CSS cho hệ thống thông báo
│   ├── script.js          # JavaScript chính
│   ├── config.js          # Cấu hình ứng dụng
│   └── utils.js           # Các hàm tiện ích
└── README.md              # Tài liệu hướng dẫn
```

## 🚀 Tính năng

### Header
- Logo Viettel Post
- Thanh tìm kiếm đơn hàng
- Dropdown user menu với cài đặt và đăng xuất
- Menu toggle button

### Sidebar
- Menu điều hướng có thể thu gọn/mở rộng
- Submenu dropdown cho các mục chính
- Icon Font Awesome chuyên nghiệp
- Animation mượt mà

### Dashboard
- Thống kê đơn hàng với biểu đồ
- Cards hiển thị số liệu
- Top 10 sản lượng
- Date picker

## 🛠️ Cài đặt và Sử dụng

1. **Clone hoặc download dự án**
2. **Mở file `index.html` trong trình duyệt**
3. **Không cần cài đặt thêm gì khác**

## 📝 Cấu hình

### Thay đổi cấu hình
Chỉnh sửa file `assets/config.js` để thay đổi:
- Thông tin API endpoints
- Cấu hình UI (độ rộng sidebar, animation duration)
- Menu items và submenu
- Cài đặt charts và notifications

### Tùy chỉnh giao diện
Chỉnh sửa file `assets/style.css` để:
- Thay đổi màu sắc chủ đạo
- Điều chỉnh layout
- Tùy chỉnh responsive breakpoints

## 🧩 Các file chính

### `index.html`
- Cấu trúc HTML chính
- Import các file CSS và JS
- Không chứa inline JavaScript

### `assets/script.js`
- Logic chính của ứng dụng
- Xử lý sidebar toggle
- Quản lý dropdown menus
- Event handlers

### `assets/config.js`
- Cấu hình tập trung
- API endpoints
- Menu structure
- UI settings

### `assets/utils.js`
- Các hàm tiện ích
- Format date, currency
- Validation functions
- Notification system

### `assets/style.css`
- CSS chính cho tất cả components
- Responsive design
- Animation và transitions

### `assets/notifications.css`
- CSS riêng cho hệ thống thông báo
- Toast notifications
- Alert styles

## 🎨 Customization

### Thay đổi màu chủ đạo
Trong `assets/style.css`, tìm và thay đổi:
```css
:root {
  --primary-color: #e53e3e;  /* Màu đỏ Viettel */
  --secondary-color: #333;
  --success-color: #28a745;
  --error-color: #dc3545;
}
```

### Thêm menu item mới
Trong `assets/config.js`, thêm vào `MENU_ITEMS`:
```javascript
{
    id: 'new-menu',
    label: 'Menu mới',
    icon: 'fas fa-star',
    route: '/new-menu',
    hasSubmenu: false
}
```

### Tùy chỉnh API
Trong `assets/config.js`, cập nhật `API` section:
```javascript
API: {
    BASE_URL: 'https://your-api-domain.com',
    ENDPOINTS: {
        // Your endpoints here
    }
}
```

## 📱 Responsive Design

- **Desktop**: Sidebar mở rộng, full features
- **Tablet**: Sidebar có thể thu gọn
- **Mobile**: Sidebar overlay, touch-friendly

## 🔧 Maintenance

### Thêm tính năng mới
1. Cập nhật `config.js` nếu cần thêm cấu hình
2. Thêm utility functions vào `utils.js`
3. Implement logic chính trong `script.js`
4. Thêm styles vào `style.css`

### Debug
- Mở Developer Tools (F12)
- Check Console tab cho errors
- Sử dụng `Utils.showNotification()` để debug

### Performance
- Các file đã được tối ưu cho loading nhanh
- Sử dụng CDN cho Font Awesome
- CSS và JS được tách riêng cho caching tốt

## 🚀 Triển khai Production

1. **Minify CSS/JS files** cho performance tốt hơn
2. **Cấu hình proper API endpoints** trong `config.js`
3. **Thiết lập HTTPS** cho bảo mật
4. **Configure caching headers** cho static assets

## 📞 Hỗ trợ

Nếu có vấn đề hoặc cần hỗ trợ:
1. Check console errors
2. Xem lại configuration trong `config.js`
3. Đảm bảo tất cả files được load đúng thứ tự

---
*Được phát triển cho Viettel Post Dashboard*