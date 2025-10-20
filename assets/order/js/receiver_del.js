window.Receiver = (function() {
  'use strict';

  let isPostOfficeSetup = false;
  let currentReceivers = [];

  // ===== Public =====
  async function init() {
    await loadReceiverList();
    initializeReceiverComponents();
    initPostOfficeSelector();
    initPickupToggle();
  }

  // Load danh sách người GỬI (shop) từ ReceiverData API layer
  async function loadReceiverList() {
    console.log('[DEBUG] Bắt đầu loadReceiverList');
    if (!window.ReceiverData) {
      console.error('[DEBUG] Không tìm thấy window.ReceiverData');
      return;
    }

    try {
      const ok = await window.ReceiverData.init();
      console.log('[DEBUG] Kết quả ReceiverData.init:', ok);
    } catch (err) {
      console.error('[DEBUG] Lỗi khi gọi ReceiverData.init:', err);
      return;
    }

    const receiverSelect = document.getElementById('receiverSelect');
    if (!receiverSelect) {
      console.error('[DEBUG] Không tìm thấy #receiverSelect');
      return;
    }

    const allReceivers = window.ReceiverData.getAllReceivers();
    console.log('[DEBUG] Danh sách người gửi lấy được:', allReceivers);
    const activeReceivers = allReceivers.filter(r => r.isActive !== false);
    currentReceivers = activeReceivers;
    console.log('[DEBUG] Danh sách người gửi active:', activeReceivers);

    receiverSelect.innerHTML = '<option value="">Chọn thông tin người gửi</option>';
    let defaultReceiver = null;

    activeReceivers.forEach(receiver => {
      const option = document.createElement('option');
      option.value = String(receiver._id || receiver.id);

      let address = receiver.address;
      if (typeof address === 'object') {
        address = [address.detail, address.street, address.ward, address.district, address.province]
          .filter(Boolean)
          .join(', ');
      }
      option.textContent = `${receiver.name || ''} - ${address || ''} - ${receiver.phone || ''}`;

      if (receiver.isDefault) {
        option.selected = true;
        defaultReceiver = receiver;
      }
      receiverSelect.appendChild(option);
    });

    if (defaultReceiver) {
      console.log('[DEBUG] Default receiver:', defaultReceiver);
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

    console.log('[DEBUG] Đã render xong dropdown người gửi');
  }

  function initializeReceiverComponents() {
    initCODFunctionality();
    initPaymentNotification();
    initPricingSummary();
    initQuantityControls();
    initNoteTemplate();
    initReceiverSelectChange();
  }

  // Thay đổi người gửi → phát event receiverChanged
  function initReceiverSelectChange() {
    const receiverSelect = document.getElementById('receiverSelect');
    if (!receiverSelect) return;

    receiverSelect.addEventListener('change', function() {
      const selectedId = String(this.value || '');
      if (!selectedId) return;

      const receiver = currentReceivers.find(r => String(r._id || r.id) === selectedId);
      if (!receiver) return;

      document.dispatchEvent(new CustomEvent('receiverChanged', {
        detail: {
          id: receiver._id || receiver.id,
          name: receiver.name,
          province: receiver.province,
          district: receiver.district,
          ward: receiver.ward,
          address: receiver.address
        }
      }));
    });
  }

  // ===== Post office selector (giữ nguyên logic, chỉ format gọn) =====
  function initPostOfficeSelector() {
    const pickupToggle      = document.getElementById('pickupToggle');
    const postOfficeSection = document.getElementById('postOfficeSection');
    const display           = document.getElementById('postOfficeDisplay');
    const displayText       = display?.querySelector('.display-text');
    const dropdown          = document.getElementById('postOfficeDropdown');
    const optionsContainer  = document.getElementById('postOfficeOptions');
    const searchInput       = document.getElementById('postOfficeSearch');

    if (!pickupToggle || !postOfficeSection || !display || !dropdown || !optionsContainer || !searchInput) return;

    let hasLoaded = false;

    pickupToggle.addEventListener('change', () => {
      if (pickupToggle.checked) {
        postOfficeSection.style.display = 'block';
        dropdown.style.display = 'none';
        if (displayText) displayText.textContent = 'Tìm kiếm bưu cục...';
        optionsContainer.innerHTML = `<div class="no-results">Chưa có dữ liệu. Vui lòng click để tải danh sách.</div>`;
        hasLoaded = false;
      } else {
        postOfficeSection.style.display = 'none';
      }
    });

    display.addEventListener('click', async (e) => {
      e.stopPropagation();
      const isOpen = dropdown.style.display === 'block';
      dropdown.style.display = isOpen ? 'none' : 'block';

      if (!hasLoaded) {
        optionsContainer.innerHTML = `<div class="no-results">Đang tải danh sách bưu cục...</div>`;
        const branches = await window.BranchData.getAllBranches();
        renderPostOfficeOptions(branches, optionsContainer, displayText, dropdown);
        hasLoaded = true;
      }
    });

    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase();
      optionsContainer.querySelectorAll('.post-office-option').forEach(opt => {
        opt.style.display = opt.textContent.toLowerCase().includes(keyword) ? 'block' : 'none';
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#postOfficeSelect')) {
        dropdown.style.display = 'none';
      }
    });
  }

  function renderPostOfficeOptions(branches, container, displayText, dropdown) {
    if (!branches || branches.length === 0) {
      container.innerHTML = `<div class="no-results">Không tìm thấy bưu cục nào.</div>`;
      return;
    }

    container.innerHTML = branches.map(b => {
      const addressText = typeof b.address === 'object'
        ? Object.values(b.address).filter(Boolean).join(', ')
        : b.address || '';
      return `
        <div class="post-office-option" data-id="${b.id}">
          <strong>${b.name}</strong><br>
          <small>${addressText}</small>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.post-office-option').forEach(option => {
      option.addEventListener('click', () => {
        const name = option.querySelector('strong').textContent;
        if (displayText) displayText.textContent = name;
        dropdown.style.display = 'none';

        document.dispatchEvent(new CustomEvent('postOfficeSelected', {
          detail: { id: option.dataset.id, name }
        }));
      });
    });
  }

  // ===== COD =====
  function initCODFunctionality() {
    const codByGoodsCheckbox = document.getElementById('codByGoods');
    const codAmountInput     = document.getElementById('codAmount');

    if (!codByGoodsCheckbox || !codAmountInput) return;

    codByGoodsCheckbox.addEventListener('change', function () {
      if (this.checked) {
        codAmountInput.disabled = false;
        codAmountInput.focus();
      } else {
        codAmountInput.value = '0';
        codAmountInput.disabled = true;
      }
    });

    codAmountInput.disabled = true;
  }

  // ===== Payment notification =====
  function initPaymentNotification() {
    const senderPaymentRadio     = document.getElementById('senderPays');
    const receiverPaymentRadio   = document.getElementById('receiverPays');
    const senderAlert            = document.getElementById('senderPaymentAlert');
    const receiverPaymentModal   = document.getElementById('receiverPaymentModal');
    const confirmSenderPaymentBtn= document.getElementById('confirmSenderPayment');

    if (!senderPaymentRadio || !receiverPaymentRadio || !senderAlert) return;

    function updatePaymentNotification() {
      senderAlert.style.display = senderPaymentRadio.checked ? 'flex' : 'none';
    }

    receiverPaymentRadio.addEventListener('change', function () {
      if (this.checked && receiverPaymentModal) {
        const modal = new bootstrap.Modal(receiverPaymentModal);
        modal.show();
      }
    });

    if (confirmSenderPaymentBtn) {
      confirmSenderPaymentBtn.addEventListener('click', function () {
        senderPaymentRadio.checked = true;
        receiverPaymentRadio.checked = false;
        updatePaymentNotification();

        const modalInstance = bootstrap.Modal.getInstance(receiverPaymentModal);
        modalInstance?.hide();
      });
    }

    if (receiverPaymentModal) {
      receiverPaymentModal.addEventListener('hidden.bs.modal', function () {
        senderPaymentRadio.checked = true;
        receiverPaymentRadio.checked = false;
        updatePaymentNotification();
      });
    }

    senderPaymentRadio.addEventListener('change', updatePaymentNotification);
    updatePaymentNotification();
  }

  // ===== Floating pricing bar =====
  function initPricingSummary() {
    const basicSummary    = document.getElementById('basicSummary');
    const detailedSummary = document.getElementById('detailedSummary');

    if (basicSummary && detailedSummary) {
      window.showDetailedPricing = function () {
        basicSummary.style.display = 'none';
        detailedSummary.style.display = 'block';
      };
      window.showBasicPricing = function () {
        basicSummary.style.display = 'block';
        detailedSummary.style.display = 'none';
      };
    }

    const floatingBar = document.getElementById('pricingSummaryBar');
    if (floatingBar) {
      document.body.classList.add('has-floating-bar');
      setTimeout(() => floatingBar.classList.add('show'), 500);
    }
  }

  // ===== Qty controls =====
  function initQuantityControls() {
    document.querySelectorAll('.qty-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        const input = btn.parentElement.querySelector('.qty-input');
        if (!input) return;
        let value = parseInt(input.value, 10) || 0;
        if (btn.classList.contains('qty-plus')) value++;
        else if (btn.classList.contains('qty-minus')) value = Math.max(1, value - 1);
        input.value = value;
        input.dispatchEvent(new Event('change'));
      });
    });
  }

  // ===== Toggle Pickup vs Post Office =====
  function initPickupToggle() {
    const pickupToggle      = document.getElementById('pickupToggle');
    const pickupTimeSection = document.getElementById('pickupTimeSection');
    const postOfficeSection = document.getElementById('postOfficeSection');
    if (!pickupToggle || !pickupTimeSection || !postOfficeSection) return;

    const closePO = () => {
      const postOfficeSelect = document.getElementById('postOfficeSelect');
      const display  = postOfficeSelect?.querySelector('.select-display');
      const dropdown = postOfficeSelect?.querySelector('.select-dropdown');
      dropdown?.classList.remove('show');
      display?.classList.remove('active');
      if (dropdown) {
        dropdown.style.opacity = '';
        dropdown.style.visibility = '';
        dropdown.style.transform = '';
      }
    };

    const applyState = () => {
      if (pickupToggle.checked) {
        pickupTimeSection.style.display = 'none';
        postOfficeSection.style.display  = 'block';
      } else {
        pickupTimeSection.style.display = 'block';
        postOfficeSection.style.display  = 'none';
      }
      closePO();
    };

    applyState();
    pickupToggle.addEventListener('change', applyState);
  }

  // ===== Note template =====
  function initNoteTemplate() {
    const noteTemplateBtn   = document.getElementById('noteTemplateBtn');
    const noteTemplateModal = document.getElementById('noteTemplateModal');
    const selectNotesBtn    = document.getElementById('selectNotesBtn');
    const noteTextarea      = document.getElementById('noteTextarea');

    if (!noteTemplateBtn || !noteTemplateModal) return;

    noteTemplateBtn.addEventListener('click', function (e) {
      e.preventDefault();
      const modal = new bootstrap.Modal(noteTemplateModal);
      modal.show();
    });

    if (selectNotesBtn && noteTextarea) {
      selectNotesBtn.addEventListener('click', function () {
        const selectedNotes = [];
        const checkedOptions = document.querySelectorAll('.note-template-option:checked');
        checkedOptions.forEach((opt) => selectedNotes.push(opt.value));

        const currentText = (noteTextarea.value || '').trim();
        if (selectedNotes.length > 0) {
          const notesToAdd = selectedNotes.join('\n- ');
          noteTextarea.value = currentText ? `${currentText}\n- ${notesToAdd}` : `- ${notesToAdd}`;
        }

        const modalInstance = bootstrap.Modal.getInstance(noteTemplateModal);
        modalInstance?.hide();
        checkedOptions.forEach((opt) => (opt.checked = false));
      });
    }
  }

  // ===== Expose =====
  return {
    init,
    initCODFunctionality,
    initPaymentNotification,
    initPricingSummary,
    initQuantityControls,
    initPickupToggle,
    initReceiverSelectChange,
    initNoteTemplate
  };
})();