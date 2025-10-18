window.UserUI = (function () {
  'use strict';

  let currentUserProfiles = [];

  /**
   * -----------------------------------------------------
   * Init module - load danh sách user
   * -----------------------------------------------------
   */
  async function init() {
    if (!window.UserData) {
      console.error('❌ UserData module not found!');
      return;
    }

    const success = await window.UserData.init();
    if (!success) {
      console.error('❌ Không thể load UserData từ API');
      return;
    }

    renderUserDropdown();
    setupChangeHandler();
  }

  /**
   * -----------------------------------------------------
   * Render dropdown người dùng theo profile mặc định
   * -----------------------------------------------------
   */
  function renderUserDropdown() {
    const select = document.getElementById('userSelect');
    if (!select) {
      console.warn('⚠️ Không tìm thấy #userSelect');
      return;
    }

    const allUsers = window.UserData.getAllUsers();
    const activeUsers = allUsers.filter(u => u.is_active === true);

    select.innerHTML = '<option value="">Chọn thông tin người gửi</option>';

    currentUserProfiles = [];

    activeUsers.forEach(user => {
      if (!Array.isArray(user.profiles)) return;

      const defaultProfile = user.profiles.find(
        p => p.is_default === true || p.default === true
      );

      if (!defaultProfile) return;

      const addressObj = defaultProfile.address || {};
      const addressStr = [
        addressObj.other,
        addressObj.ward,
        addressObj.district,
        addressObj.province
      ]
        .filter(Boolean)
        .join(', ');

      const option = document.createElement('option');
      option.value = user._id?.$oid || user._id || user.id; // hỗ trợ cả Mongo _id object lẫn string
      option.textContent = `${defaultProfile.name || ''} - ${addressStr || ''} - ${defaultProfile.phone_number || ''}`;

      select.appendChild(option);

      currentUserProfiles.push({
        userId: option.value,
        user,
        profile: defaultProfile
      });
    });

    // Nếu có giá trị mặc định → kích hoạt event luôn
    if (select.options.length > 1) {
      select.selectedIndex = 1;
      triggerUserChanged(select.value);
    }
  }

  /**
   * -----------------------------------------------------
   * Xử lý khi người dùng chọn user khác
   * -----------------------------------------------------
   */
  function setupChangeHandler() {
    const select = document.getElementById('userSelect');
    if (!select) return;

    select.addEventListener('change', e => {
      const userId = e.target.value;
      if (!userId) return;
      triggerUserChanged(userId);
    });
  }

  /**
   * -----------------------------------------------------
   * Trigger sự kiện userChanged
   * -----------------------------------------------------
   */
  function triggerUserChanged(userId) {
    const selected = currentUserProfiles.find(p => p.userId === userId);
    if (!selected) return;

    const { user, profile } = selected;
    document.dispatchEvent(new CustomEvent('userChanged', {
      detail: {
        userId: userId,
        username: user.username,
        name: profile.name,
        phone_number: profile.phone_number,
        address: profile.address
      }
    }));
  }

  return {
    init,
    renderUserDropdown
  };
})();

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  if (window.UserUI) window.UserUI.init();
});
