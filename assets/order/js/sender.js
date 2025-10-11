/**
 * SENDER INFO FUNCTIONALITY  
 * Handles sender information, COD, payment, post office selection
 */

window.Sender = (function() {
  'use strict';

  let isPostOfficeSetup = false;

  // Public methods
  function init() {
    initializeSenderComponents();
    initPostOfficeSelector();
  }

  function initializeSenderComponents() {
    initCODFunctionality();
    initPaymentNotification();
    initPricingSummary();
    initQuantityControls();
    initSenderToggle();
    initNoteTemplate();
  }

  async function initPostOfficeSelector() {
    if (window.BranchData) {
      await window.BranchData.init();
      // Chỉ setup nếu section đang hiển thị
      const postOfficeSection = document.getElementById("postOfficeSection");
      if (postOfficeSection && postOfficeSection.style.display !== "none") {
        setupPostOfficeDropdown();
      }
    }
  }

  function setupPostOfficeDropdown() {
    const postOfficeSelect = document.getElementById("postOfficeSelect");
    const searchInput = postOfficeSelect?.querySelector(".search-input");
    const optionsContainer = document.getElementById("postOfficeOptions");
    const display = postOfficeSelect?.querySelector(".select-display");
    const dropdown = postOfficeSelect?.querySelector(".select-dropdown");

    if (!postOfficeSelect || !window.BranchData) {
      console.warn("Post office setup failed - missing elements or BranchData");
      return;
    }

    // Tránh setup nhiều lần
    if (isPostOfficeSetup) {
      console.log("Post office already setup");
      return;
    }

    console.log("Setting up post office dropdown...");

    // Get sender address (you can customize this based on your sender selection logic)
    const senderAddress = "Hà Nội"; // Default or get from selected sender

    // Load nearest branches
    const nearestBranches = window.BranchData.getNearestBranches(senderAddress, 10);
    console.log("Nearest branches:", nearestBranches.length);
    renderPostOfficeOptions(nearestBranches, optionsContainer);

    // Toggle dropdown
    display?.addEventListener("click", function () {
      const isOpen = dropdown?.classList.contains("show");
      document.querySelectorAll(".custom-select-search .select-dropdown.show").forEach((dd) => {
        dd.classList.remove("show");
        dd.parentElement.querySelector(".select-display").classList.remove("active");
      });

      if (!isOpen) {
        dropdown?.classList.add("show");
        display.classList.add("active");
        searchInput?.focus();
      }
    });

    // Search functionality
    searchInput?.addEventListener("input", function () {
      const keyword = this.value;
      const filtered = window.BranchData.searchBranches(keyword, nearestBranches);
      renderPostOfficeOptions(filtered, optionsContainer);
    });

    // Option selection
    optionsContainer?.addEventListener("click", function (e) {
      const option = e.target.closest(".post-office-option");
      if (option) {
        optionsContainer.querySelectorAll(".post-office-option").forEach((opt) => {
          opt.classList.remove("selected");
        });

        option.classList.add("selected");

        const branchName = option.querySelector(".post-office-name")?.textContent.trim();
        const displaySpan = display?.querySelector("span");
        if (displaySpan && branchName) {
          displaySpan.textContent = branchName;
          display.classList.add("has-value");
        }

        if (searchInput) searchInput.value = "";
        renderPostOfficeOptions(nearestBranches, optionsContainer);

        dropdown?.classList.remove("show");
        display?.classList.remove("active");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", function (event) {
      if (!postOfficeSelect.contains(event.target)) {
        dropdown?.classList.remove("show");
        display?.classList.remove("active");
      }
    });

    isPostOfficeSetup = true;
    console.log("Post office setup complete");
  }

  function renderPostOfficeOptions(branches, container) {
    if (!container) return;

    if (branches.length === 0) {
      container.innerHTML = '<div class="no-results">Không tìm thấy bưu cục</div>';
      return;
    }

    container.innerHTML = branches
      .map((branch) => {
        const formatted = window.BranchData.formatBranchDisplay(branch);
        return `
          <div class="post-office-option" data-id="${formatted.id}">
            <div class="post-office-name">
              <span>${formatted.name}</span>
              <span class="post-office-distance">${formatted.distance} km</span>
            </div>
            <div class="post-office-address">
              <i class="fas fa-map-marker-alt"></i>
              <span>${formatted.address}</span>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function initCODFunctionality() {
    // COD functionality
    const codByGoodsCheckbox = document.getElementById("codByGoods");
    const codAmountInput = document.getElementById("codAmount");

    if (codByGoodsCheckbox && codAmountInput) {
      codByGoodsCheckbox.addEventListener("change", function () {
        if (this.checked) {
          // When checked, enable COD amount input and focus on it
          codAmountInput.disabled = false;
          codAmountInput.focus();
        } else {
          // When unchecked, reset amount to 0 and disable
          codAmountInput.value = "0";
          codAmountInput.disabled = true;
        }
      });

      // Initially disable COD amount input
      codAmountInput.disabled = true;
    }
  }

  function initPaymentNotification() {
    // Payment person notification logic
    const senderPaymentRadio = document.getElementById("senderPays");
    const receiverPaymentRadio = document.getElementById("receiverPays");
    const senderAlert = document.getElementById("senderPaymentAlert");
    const receiverPaymentModal = document.getElementById("receiverPaymentModal");
    const confirmSenderPaymentBtn = document.getElementById("confirmSenderPayment");

    if (senderPaymentRadio && receiverPaymentRadio && senderAlert) {
      function updatePaymentNotification() {
        if (senderPaymentRadio.checked) {
          senderAlert.style.display = "flex";
        } else {
          senderAlert.style.display = "none";
        }
      }

      // Handle receiver payment selection - show modal
      receiverPaymentRadio.addEventListener("change", function () {
        if (this.checked && receiverPaymentModal) {
          const modal = new bootstrap.Modal(receiverPaymentModal);
          modal.show();
        }
      });

      // Handle confirm sender payment button
      if (confirmSenderPaymentBtn) {
        confirmSenderPaymentBtn.addEventListener("click", function () {
          // Revert to sender payment
          senderPaymentRadio.checked = true;
          receiverPaymentRadio.checked = false;
          updatePaymentNotification();

          // Close modal
          const modalInstance = bootstrap.Modal.getInstance(receiverPaymentModal);
          if (modalInstance) {
            modalInstance.hide();
          }
        });
      }

      // Handle modal close - also revert to sender
      if (receiverPaymentModal) {
        receiverPaymentModal.addEventListener("hidden.bs.modal", function () {
          senderPaymentRadio.checked = true;
          receiverPaymentRadio.checked = false;
          updatePaymentNotification();
        });
      }

      senderPaymentRadio.addEventListener("change", updatePaymentNotification);

      // Initialize with sender selected
      updatePaymentNotification();
    }
  }

  function initPricingSummary() {
    // Pricing summary toggle (will be implemented when form is complete)
    const basicSummary = document.getElementById("basicSummary");
    const detailedSummary = document.getElementById("detailedSummary");

    if (basicSummary && detailedSummary) {
      // Function to show detailed view when form is complete
      window.showDetailedPricing = function () {
        basicSummary.style.display = "none";
        detailedSummary.style.display = "block";
      };

      // Function to show basic view (default)
      window.showBasicPricing = function () {
        basicSummary.style.display = "block";
        detailedSummary.style.display = "none";
      };
    }

    // Initialize floating pricing bar
    const floatingBar = document.getElementById("pricingSummaryBar");
    if (floatingBar) {
      // Add class to body to add padding
      document.body.classList.add("has-floating-bar");

      // Show floating bar after a short delay
      setTimeout(() => {
        floatingBar.classList.add("show");
      }, 500);
    }
  }

  function initQuantityControls() {
    // Quantity controls
    document.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const input = this.parentNode.querySelector(".qty-input");
        const isPlus = this.classList.contains("plus");
        let value = parseInt(input.value) || 1;

        if (isPlus) {
          value++;
        } else if (value > 1) {
          value--;
        }

        input.value = value;
      });
    });
  }

  function initSenderToggle() {
    // Sender toggle functionality
    const senderToggle = document.getElementById("saveToPostOffice");
    const pickupTimeSection = document.getElementById("pickupTimeSection");
    const postOfficeSection = document.getElementById("postOfficeSection");

    if (senderToggle && pickupTimeSection && postOfficeSection) {
      senderToggle.addEventListener("change", function () {
        if (this.checked) {
          // Khi tick: Hiện chọn bưu cục, ẩn thời gian hẹn lấy
          pickupTimeSection.style.display = "none";
          postOfficeSection.style.display = "block";
          
          // Setup dropdown khi section được hiển thị
          if (window.BranchData) {
            setupPostOfficeDropdown();
          }
        } else {
          // Khi không tick: Hiện thời gian hẹn lấy, ẩn chọn bưu cục
          pickupTimeSection.style.display = "block";
          postOfficeSection.style.display = "none";
        }
      });
    }
  }

  /**
   * NOTE TEMPLATE FUNCTIONALITY
   */
  function initNoteTemplate() {
    const noteTemplateBtn = document.getElementById("noteTemplateBtn");
    const noteTemplateModal = document.getElementById("noteTemplateModal");
    const selectNotesBtn = document.getElementById("selectNotesBtn");
    const noteTextarea = document.getElementById("noteTextarea");

    if (noteTemplateBtn && noteTemplateModal) {
      // Show modal when clicking "Ghi chú mẫu"
      noteTemplateBtn.addEventListener("click", function (e) {
        e.preventDefault();
        const modal = new bootstrap.Modal(noteTemplateModal);
        modal.show();
      });

      // Handle note selection
      if (selectNotesBtn && noteTextarea) {
        selectNotesBtn.addEventListener("click", function () {
          const selectedNotes = [];
          const checkedOptions = document.querySelectorAll(".note-template-option:checked");

          checkedOptions.forEach((option) => {
            selectedNotes.push(option.value);
          });

          // Add selected notes to textarea
          const currentText = noteTextarea.value.trim();
          let newText = currentText;

          if (selectedNotes.length > 0) {
            const notesToAdd = selectedNotes.join("\n- ");
            if (currentText) {
              newText += "\n- " + notesToAdd;
            } else {
              newText = "- " + notesToAdd;
            }
            noteTextarea.value = newText;
          }

          // Close modal
          const modalInstance = bootstrap.Modal.getInstance(noteTemplateModal);
          if (modalInstance) {
            modalInstance.hide();
          }

          // Clear selections for next time
          checkedOptions.forEach((option) => {
            option.checked = false;
          });
        });
      }
    }
  }

  // Public API
  return {
    init,
    initCODFunctionality,
    initPaymentNotification,
    initPricingSummary,
    initQuantityControls,
    initSenderToggle,
    initNoteTemplate
  };
})();