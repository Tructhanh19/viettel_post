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
  }

  return {
    init
  };
})();

// Khởi chạy tự động khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  if (window.ReceiverUI) window.ReceiverUI.init();
});
