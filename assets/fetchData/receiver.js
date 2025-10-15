/**
 * =====================================================
 * FETCH RECEIVER DATA (UI LAYER)
 * -----------------------------------------------------
 * - Gọi ReceiverData API layer
 * - Render dropdown người gửi / người nhận
 * - Gửi event receiverChanged cho các module khác (Sender)
 * =====================================================
 */

window.ReceiverUI = (function () {
  'use strict';

  let currentReceivers = [];

  /**
   * -----------------------------------------------------
   * Init module - load danh sách người nhận
   * -----------------------------------------------------
   */
  async function init() {
    if (!window.ReceiverData) {
      console.error('❌ ReceiverData module not found!');
      return;
    }

    await window.ReceiverData.init();
    renderReceiverDropdown();
    setupChangeHandler();
  }

  /**
   * -----------------------------------------------------
   * Render dropdown người gửi/nhận
   * -----------------------------------------------------
   */
  function renderReceiverDropdown() {
    const select = document.getElementById('senderSelect');
    if (!select) {
      console.warn('⚠️ Không tìm thấy #senderSelect');
      return;
    }

    const allReceivers = window.ReceiverData.getAllReceivers();
    currentReceivers = allReceivers.filter(r => r.isActive !== false);

    select.innerHTML = '<option value="">Chọn thông tin người gửi</option>';
    let defaultReceiver = null;

    currentReceivers.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r._id || r.id;
      const addr = typeof r.address === 'object'
        ? [r.address.detail, r.address.street, r.address.ward, r.address.district, r.address.province]
            .filter(Boolean)
            .join(', ')
        : r.address || '';
      opt.textContent = `${r.name || ''} - ${addr || ''} - ${r.phone || ''}`;
      if (r.isDefault) {
        opt.selected = true;
        defaultReceiver = r;
      }
      select.appendChild(opt);
    });

    // Nếu có người gửi mặc định -> phát event receiverChanged
    if (defaultReceiver) {
      document.dispatchEvent(new CustomEvent('receiverChanged', {
        detail: {
          id: defaultReceiver._id || defaultReceiver.id,
          name: defaultReceiver.name,
          province: defaultReceiver.province,
          district: defaultReceiver.district,
          ward: defaultReceiver.ward,
          address: defaultReceiver.address
        }
      }));
    }
  }

  /**
   * -----------------------------------------------------
   * Xử lý khi người dùng chọn người gửi khác
   * -----------------------------------------------------
   */
  function setupChangeHandler() {
    const select = document.getElementById('senderSelect');
    if (!select) return;

    select.addEventListener('change', e => {
      const id = e.target.value;
      if (!id) return;
      const r = currentReceivers.find(x => (x._id || x.id) === id);
      if (!r) return;

      document.dispatchEvent(new CustomEvent('receiverChanged', {
        detail: {
          id: r._id || r.id,
          name: r.name,
          province: r.province,
          district: r.district,
          ward: r.ward,
          address: r.address
        }
      }));
    });
  }

  return {
    init,
    renderReceiverDropdown
  };
})();

// Khởi chạy tự động khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  if (window.ReceiverUI) window.ReceiverUI.init();
});
