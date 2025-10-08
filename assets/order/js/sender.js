/**
 * SENDER INFO FUNCTIONALITY  
 * Handles sender information, COD, payment, post office selection
 */

window.Sender = (function() {
  'use strict';

  // Public methods
  function init() {
    initializeSenderComponents();
  }

  function initializeSenderComponents() {
    initCODFunctionality();
    initPaymentNotification();
    initPricingSummary();
    initQuantityControls();
    initSenderToggle();
    initNoteTemplate();
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