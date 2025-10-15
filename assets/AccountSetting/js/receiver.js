/**
 * RECEIVER INFO CONTROLLER
 * Manages receiver information UI with MongoDB integration
 */

(function() {
  'use strict';

  console.log('[DEBUG] Đã chạy receiver.js UI (AccountSetting/js)');

  let currentReceivers = [];
  let filteredReceivers = [];

  /**
   * Initialize the receiver info page
   */
  async function init() {
    console.log('🎬 Initializing Receiver Info page...');
    
    // Initialize ReceiverData module
    if (!window.ReceiverData) {
      console.error('❌ ReceiverData module not loaded');
      return;
    }

    // Load data from MongoDB
    const success = await window.ReceiverData.init();
    if (!success) {
      showError('Không thể tải dữ liệu người nhận từ server');
      return;
    }

    // Get receivers
    currentReceivers = window.ReceiverData.getAllReceivers();
    filteredReceivers = [...currentReceivers];

  // Render receivers
  renderReceivers(filteredReceivers);

  // Setup event listeners
  setupEventListeners();

  // Khởi tạo AddressData và cascading custom-select-search
  if (window.AddressData) {
    await window.AddressData.init();
    window.AddressData.setupAddressCascading();
  }

  console.log('✅ Receiver Info page initialized');
  }

  /**
   * Render receiver cards
   */
  function renderReceivers(receivers) {
    const container = document.getElementById('sender-list');
    if (!container) return;

    if (receivers.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="text-muted mt-3">Không có người nhận nào</p>
        </div>
      `;
      return;
    }

    container.innerHTML = receivers.map(receiver => {
      // Format address if it's an object
      let address = 'N/A';
      if (receiver.address) {
        if (typeof receiver.address === 'object') {
          address = [receiver.address.detail, receiver.address.street, receiver.address.ward, receiver.address.district, receiver.address.province]
            .filter(Boolean)
            .join(', ');
        } else {
          address = receiver.address;
        }
      }
      return `
      <div class="col-md-6 mb-3">
        <div class="card sender-card h-100">
          <div class="card-body">
            <div>
              <h6 class="mb-1">${escapeHtml(receiver.name || 'N/A')}</h6>
              <small class="text-muted">${escapeHtml(receiver.phone || 'N/A')}</small>
            </div>
            <p class="mb-2">
              <i class="bi bi-geo-alt text-danger"></i>
              <small>${escapeHtml(address)}</small>
            </p>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-sm btn-outline-primary flex-fill" 
                      onclick="editReceiver('${receiver._id || receiver.id}')">
                <i class="bi bi-pencil"></i> Sửa
              </button>
              <button class="btn btn-sm btn-outline-danger flex-fill"
                      onclick="deleteReceiver('${receiver._id || receiver.id}')">
                <i class="bi bi-trash"></i> Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
      `;
    }).join('');
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', function() {
        applyFilters();
      });
    }

    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        applyFilters();
      });
    }

    // Save receiver button
    const saveSenderBtn = document.getElementById('saveSenderBtn');
    if (saveSenderBtn) {
      saveSenderBtn.addEventListener('click', handleSaveReceiver);
    }

    // Khởi tạo custom-select-search (tìm kiếm, chọn, đóng/mở, sự kiện change)
    initSearchableSelects();
  }

  /**
   * Apply filters (status + search)
   */
  function applyFilters() {
    let results = [...currentReceivers];

    // Filter by status
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter && statusFilter.value) {
      results = window.ReceiverData.filterByStatus(statusFilter.value);
    }

    // Search by name or phone
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
      results = window.ReceiverData.searchReceivers(searchInput.value.trim());
    }

    filteredReceivers = results;
    renderReceivers(filteredReceivers);
  }

  /**
   * Handle save receiver
   */
  async function handleSaveReceiver() {
    const form = document.getElementById('addSenderForm');
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const addressSelected = window.getSelectedAddress ? window.getSelectedAddress() : {};
    const receiverData = {
      name: document.getElementById('senderName').value.trim(),
      phone: document.getElementById('senderPhone').value.trim(),
      province: addressSelected.provinceName || '',
      district: addressSelected.districtName || '',
      ward: addressSelected.wardName || '',
      detail: document.getElementById('senderFullAddress').value.trim(),
      isActive: true
    };

    // Build full address
    receiverData.address = [
      receiverData.detail,
      receiverData.ward,
      receiverData.district,
      receiverData.province
    ].filter(x => x).join(', ');

    try {
      await window.ReceiverData.createReceiver(receiverData);
      
      // Refresh list
      currentReceivers = window.ReceiverData.getAllReceivers();
      applyFilters();

      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('addSenderModal'));
      modal.hide();

      // Reset form
      form.reset();

      showSuccess('Thêm người nhận thành công!');
    } catch (error) {
      showError('Lỗi khi thêm người nhận: ' + error.message);
    }
  }

  /**
   * Edit receiver (to be implemented)
   */
  window.editReceiver = function(id) {
    console.log('Edit receiver:', id);
    // TODO: Implement edit functionality
    alert('Chức năng sửa đang được phát triển');
  };

  /**
   * Delete receiver
   */
  window.deleteReceiver = async function(id) {
    if (!id) {
      showError('ID người nhận không hợp lệ.');
      return;
    }
    if (!confirm('Bạn có chắc muốn xóa người nhận này?')) {
      return;
    }
    try {
      if (!window.ReceiverData || typeof window.ReceiverData.deleteReceiver !== 'function') {
        throw new Error('ReceiverData.deleteReceiver không khả dụng');
      }
      await window.ReceiverData.deleteReceiver(id);

      // Refresh list
      currentReceivers = window.ReceiverData.getAllReceivers();
      applyFilters();

      showSuccess('Xóa người nhận thành công');
    } catch (err) {
      showError('Lỗi khi xóa người nhận: ' + (err && err.message ? err.message : err));
    }
  };

  /**
 * Khởi tạo custom-select-search: tìm kiếm, chọn, đóng/mở, sự kiện change
 */
function initSearchableSelects() {
  const searchableSelects = document.querySelectorAll('.custom-select-search');
  searchableSelects.forEach((selectElement) => {
    const display = selectElement.querySelector('.select-display');
    const dropdown = selectElement.querySelector('.select-dropdown');
    const searchInput = selectElement.querySelector('.search-input');
    const optionsContainer = selectElement.querySelector('.options-container');
    const noResults = selectElement.querySelector('.no-results');
    if (!display || !dropdown || !searchInput || !optionsContainer) return;
    // Toggle dropdown
    display.addEventListener('click', function () {
      const isOpen = dropdown.classList.contains('show');
      document.querySelectorAll('.custom-select-search .select-dropdown.show').forEach((dd) => {
        dd.classList.remove('show');
        dd.parentElement.querySelector('.select-display').classList.remove('active');
      });
      if (isOpen) {
        dropdown.classList.remove('show');
        display.classList.remove('active');
      } else {
        dropdown.classList.add('show');
        display.classList.add('active');
        searchInput.focus();
      }
    });
    // Search functionality
    searchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const options = optionsContainer.querySelectorAll('.dropdown-option');
      let hasVisibleOptions = false;
      options.forEach((option) => {
        const text = option.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
          option.style.display = 'block';
          hasVisibleOptions = true;
        } else {
          option.style.display = 'none';
        }
      });
      if (noResults) {
        if (hasVisibleOptions || searchTerm === '') {
          noResults.style.display = 'none';
        } else {
          noResults.style.display = 'block';
          noResults.textContent = 'Không tìm thấy kết quả';
        }
      }
    });
    // Option selection
    optionsContainer.addEventListener('click', function (e) {
      if (e.target.classList.contains('dropdown-option')) {
        optionsContainer.querySelectorAll('.dropdown-option').forEach((opt) => {
          opt.classList.remove('selected');
        });
        e.target.classList.add('selected');
        const selectedText = e.target.textContent;
        const displaySpan = display.querySelector('span');
        if (displaySpan) {
          displaySpan.textContent = selectedText;
          display.classList.add('has-value');
        }
        searchInput.value = '';
        optionsContainer.querySelectorAll('.dropdown-option').forEach((opt) => {
          opt.style.display = 'block';
        });
        if (noResults) noResults.style.display = 'none';
        dropdown.classList.remove('show');
        display.classList.remove('active');
        // Trigger change event for cascading selects
        const changeEvent = new CustomEvent('change', {
          detail: {
            value: e.target.getAttribute('data-value'),
            text: selectedText,
            selectId: selectElement.id,
          },
        });
        selectElement.dispatchEvent(changeEvent);
      }
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
      if (!selectElement.contains(event.target)) {
        dropdown.classList.remove('show');
        display.classList.remove('active');
      }
    });
    // Prevent dropdown close when clicking on search input
    searchInput.addEventListener('click', function (e) {
      e.stopPropagation();
    });
  });
}

  /**
   * Load districts
   */
  async function loadDistricts(provinceCode) {
    if (!window.AddressData || !provinceCode) return;
    const districts = window.AddressData.getDistricts63(provinceCode);
    console.log('[DEBUG] Load districts for province', provinceCode, districts);
    const select = document.getElementById('senderDistrict');
    if (select) {
      select.innerHTML = '<option value="">Huyện/Quận</option>' +
        districts.map(d => `<option value="${d.code}">${d.name}</option>`).join('');
    }
    // Reset wards
    const wardSelect = document.getElementById('senderWard');
    if (wardSelect) {
      wardSelect.innerHTML = '<option value="">Xã/Phường</option>';
    }
  }

  /**
   * Load wards
   */
  async function loadWards(provinceCode, districtCode) {
    if (!window.AddressData) {
      console.warn('[DEBUG] window.AddressData chưa tồn tại');
      return;
    }
    if (!provinceCode) {
      console.warn('[DEBUG] provinceCode rỗng');
      return;
    }
    if (!districtCode) {
      console.warn('[DEBUG] districtCode rỗng');
      return;
    }
    const wards = window.AddressData.getWards63(provinceCode, districtCode);
    console.log('[DEBUG] Load wards for province:', provinceCode, '| district:', districtCode, '| wards:', wards);
    const select = document.getElementById('senderWard');
    if (select) {
      if (Array.isArray(wards) && wards.length > 0) {
        select.innerHTML = '<option value="">Xã/Phường</option>' +
          wards.map(w => `<option value="${w.code}">${w.name}</option>`).join('');
        console.log('[DEBUG] Đã render dropdown xã/phường, số lượng:', wards.length);
      } else {
        select.innerHTML = '<option value="">Không có dữ liệu xã/phường</option>';
        console.warn('[DEBUG] Không có dữ liệu xã/phường cho', provinceCode, districtCode);
      }
    } else {
      console.warn('[DEBUG] Không tìm thấy select senderWard');
    }
  }

  /**
   * Utility: Escape HTML
   */
  function escapeHtml(text) {
    if (typeof text !== 'string') {
      text = String(text ?? '');
    }
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    // Simple alert for now - can be replaced with toast notification
    alert('✅ ' + message);
  }

  /**
   * Show error message
   */
  function showError(message) {
    alert('❌ ' + message);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Also load provinces when modal opens
  window.addEventListener('DOMContentLoaded', function() {
    const modalEl = document.getElementById('addSenderModal');
    if (modalEl) {
      modalEl.addEventListener('shown.bs.modal', function() {
        console.log('[DEBUG] Sự kiện shown.bs.modal được kích hoạt');
        loadProvinces();
      });
      console.log('[DEBUG] Đã gán sự kiện shown.bs.modal cho modal addSenderModal');
    } else {
      console.log('[DEBUG] Không tìm thấy modal với id addSenderModal');
    }
  });
})();
