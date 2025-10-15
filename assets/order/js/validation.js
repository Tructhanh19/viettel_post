/**
 * VALIDATION FUNCTIONALITY
 * Handles all form validation logic
 */

window.Validation = (function() {
  'use strict';

  // Public methods
  function init() {
    initFormValidation();
  }

  // Add real-time validation
  function initFormValidation() {
    // Real-time validation for phone
    const phone = document.getElementById("receiverPhone");
    if (phone) {
      phone.addEventListener("blur", function () {
        const phoneError = document.getElementById("phoneError");
        const phoneValue = this.value.trim();
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

        if (phoneValue === "") {
          showError(this, phoneError, "Điện thoại không được để trống");
        } else if (!phoneRegex.test(phoneValue)) {
          showError(this, phoneError, "Số điện thoại không hợp lệ");
        } else {
          hideError(this, phoneError);
        }
      });

      // Also check on input for immediate feedback
      phone.addEventListener("input", function () {
        setTimeout(() => {
          if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
            window.Receiver.checkReceiverInfoComplete();
          }
        }, 100);
      });
    }

    // Real-time validation for name
    const name = document.getElementById("receiverName");
    if (name) {
      name.addEventListener("blur", function () {
        const nameError = document.getElementById("nameError");
        if (this.value.trim() === "") {
          showError(this, nameError, "Họ tên không được để trống");
        } else {
          hideError(this, nameError);
        }
      });

      // Also check on input for immediate feedback
      name.addEventListener("input", function () {
        setTimeout(() => {
          if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
            window.Receiver.checkReceiverInfoComplete();
          }
        }, 100);
      });
    }

    // Real-time validation for address
    const address = document.getElementById("receiverAddress");
    if (address) {
      address.addEventListener("blur", function () {
        const addressError = document.getElementById("addressError");
        if (this.value.trim() === "") {
          showError(this, addressError, "Địa chỉ không được để trống");
        } else {
          hideError(this, addressError);
        }
      });

      address.addEventListener("input", function () {
        setTimeout(() => {
          if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
            window.Receiver.checkReceiverInfoComplete();
          }
        }, 100);
      });
    }

    // Real-time validation for new address
    const newAddress = document.getElementById("newReceiverAddress");
    if (newAddress) {
      newAddress.addEventListener("blur", function () {
        const newAddressError = document.getElementById("newAddressError");
        if (this.value.trim() === "") {
          showError(this, newAddressError, "Địa chỉ không được để trống");
        } else {
          hideError(this, newAddressError);
        }
      });

      newAddress.addEventListener("input", function () {
        setTimeout(() => {
          if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
            window.Receiver.checkReceiverInfoComplete();
          }
        }, 100);
      });
    }

    // Real-time validation for sender select
    const senderSelect = document.getElementById("senderSelect");
    if (senderSelect) {
      senderSelect.addEventListener("change", function () {
        const senderError = document.getElementById("senderError");
        if (this.value === "") {
          showError(this, senderError, "Người gửi không được để trống");
        } else {
          hideError(this, senderError);
        }
      });
    }

    // Add validation to create order button
    const createOrderBtn = document.getElementById("createOrderBtn");
    if (createOrderBtn) {
      createOrderBtn.addEventListener("click", function (e) {
        e.preventDefault();

        if (validateForm()) {
          // All validations passed
          alert("Tất cả thông tin hợp lệ! Đơn hàng sẽ được tạo.");
          // Here you would typically submit the form data
        } else {
          // Show error message
          alert("Vui lòng kiểm tra lại thông tin đã nhập!");

          // Scroll to first error
          const firstError = document.querySelector('.error, .text-danger[style*="block"]');
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      });
    }
  }

  // Form validation functions
  function validateSenderInfo() {
    const senderSelect = document.getElementById("senderSelect");
    const senderError = document.getElementById("senderError");
    let isValid = true;

    if (senderSelect && senderSelect.value === "") {
      showError(senderSelect, senderError, "Người gửi không được để trống");
      isValid = false;
    } else if (senderSelect) {
      hideError(senderSelect, senderError);
    }

    return isValid;
  }

  function validateReceiverInfo() {
    let isValid = true;

    // Validate phone number
    const phone = document.getElementById("receiverPhone");
    const phoneError = document.getElementById("phoneError");
    if (phone) {
      const phoneValue = phone.value.trim();
      const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

      if (phoneValue === "") {
        showError(phone, phoneError, "Điện thoại không được để trống");
        isValid = false;
      } else if (!phoneRegex.test(phoneValue)) {
        showError(phone, phoneError, "Số điện thoại không hợp lệ");
        isValid = false;
      } else {
        hideError(phone, phoneError);
      }
    }

    // Validate name
    const name = document.getElementById("receiverName");
    const nameError = document.getElementById("nameError");
    if (name) {
      if (name.value.trim() === "") {
        showError(name, nameError, "Họ tên không được để trống");
        isValid = false;
      } else {
        hideError(name, nameError);
      }
    }

    // Validate address based on mode
    const useNewAddress = document.getElementById("useNewAddress");
    const isNewAddressMode = useNewAddress && useNewAddress.checked;

    if (isNewAddressMode) {
      // Validate new address mode
      const newAddress = document.getElementById("newReceiverAddress");
      const newAddressError = document.getElementById("newAddressError");
      if (newAddress) {
        if (newAddress.value.trim() === "") {
          showError(newAddress, newAddressError, "Địa chỉ không được để trống");
          isValid = false;
        } else {
          hideError(newAddress, newAddressError);
        }
      }
    } else {
      // Validate normal address mode
      const address = document.getElementById("receiverAddress");
      const addressError = document.getElementById("addressError");
      if (address) {
        if (address.value.trim() === "") {
          showError(address, addressError, "Địa chỉ không được để trống");
          isValid = false;
        } else {
          hideError(address, addressError);
        }
      }
    }

    // Validate location selects
    isValid = validateLocationSelects() && isValid;

    return isValid;
  }

  function validateLocationSelects() {
    let isValid = true;

    // Check which address mode is active
    const useNewAddress = document.getElementById("useNewAddress");
    const isNewAddressMode = useNewAddress && useNewAddress.checked;

    if (isNewAddressMode) {
      // Validate new address mode
      isValid = validateNewAddressSelects() && isValid;
    } else {
      // Validate normal address mode
      isValid = validateNormalAddressSelects() && isValid;
    }

    return isValid;
  }

  function validateNormalAddressSelects() {
    let isValid = true;

    // Validate province
    const provinceSelect = document.getElementById("provinceSelect");
    const provinceError = document.getElementById("provinceError");
    if (provinceSelect) {
      const selectedOption = provinceSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(provinceSelect, provinceError, "Tỉnh/Thành phố không được để trống");
        isValid = false;
      } else {
        hideSelectError(provinceSelect, provinceError);
      }
    }

    // Validate district
    const districtSelect = document.getElementById("districtSelect");
    const districtError = document.getElementById("districtError");
    if (districtSelect) {
      const selectedOption = districtSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(districtSelect, districtError, "Huyện/Quận không được để trống");
        isValid = false;
      } else {
        hideSelectError(districtSelect, districtError);
      }
    }

    // Validate ward
    const wardSelect = document.getElementById("wardSelect");
    const wardError = document.getElementById("wardError");
    if (wardSelect) {
      const selectedOption = wardSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(wardSelect, wardError, "Xã/Phường không được để trống");
        isValid = false;
      } else {
        hideSelectError(wardSelect, wardError);
      }
    }

    // Validate street
    // const streetSelect = document.getElementById("streetSelect");
    // const streetError = document.getElementById("streetError");
    // if (streetSelect) {
    //   const selectedOption = streetSelect.querySelector(".dropdown-option.selected");
    //   if (!selectedOption) {
    //     showSelectError(streetSelect, streetError, "Đường/Thôn/Xóm không được để trống");
    //     isValid = false;
    //   } else {
    //     hideSelectError(streetSelect, streetError);
    //   }
    // }

    // return isValid;
  }

  function validateNewAddressSelects() {
    let isValid = true;

    // Validate new province
    const newProvinceSelect = document.getElementById("newProvinceSelect");
    const newProvinceError = document.getElementById("newProvinceError");
    if (newProvinceSelect) {
      const selectedOption = newProvinceSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(newProvinceSelect, newProvinceError, "Tỉnh/Thành phố không được để trống");
        isValid = false;
      } else {
        hideSelectError(newProvinceSelect, newProvinceError);
      }
    }

    // Validate new ward
    const newWardSelect = document.getElementById("newWardSelect");
    const newWardError = document.getElementById("newWardError");
    if (newWardSelect) {
      const selectedOption = newWardSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(newWardSelect, newWardError, "Xã/Phường/Đặc khu không được để trống");
        isValid = false;
      } else {
        hideSelectError(newWardSelect, newWardError);
      }
    }

    // Validate new street
    const newStreetSelect = document.getElementById("newStreetSelect");
    const newStreetError = document.getElementById("newStreetError");
    if (newStreetSelect) {
      const selectedOption = newStreetSelect.querySelector(".dropdown-option.selected");
      if (!selectedOption) {
        showSelectError(newStreetSelect, newStreetError, "Đường/Thôn/Xóm không được để trống");
        isValid = false;
      } else {
        hideSelectError(newStreetSelect, newStreetError);
      }
    }

    return isValid;
  }

  function showError(element, errorElement, message) {
    element.classList.add("error");
    element.classList.remove("success");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  function hideError(element, errorElement) {
    element.classList.remove("error");
    element.classList.add("success");
    if (errorElement) {
      errorElement.style.display = "none";
    }

    // Check if receiver info is complete after fixing error
    setTimeout(() => {
      if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
        window.Receiver.checkReceiverInfoComplete();
      }
    }, 100);
  }

  function showSelectError(selectElement, errorElement, message) {
    selectElement.classList.add("error");
    selectElement.classList.remove("success");
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  function hideSelectError(selectElement, errorElement) {
    selectElement.classList.remove("error");
    selectElement.classList.add("success");
    if (errorElement) {
      errorElement.style.display = "none";
    }

    // Check if receiver info is complete after fixing error
    setTimeout(() => {
      if (window.Receiver && window.Receiver.checkReceiverInfoComplete) {
        window.Receiver.checkReceiverInfoComplete();
      }
    }, 100);
  }

  function validateForm() {
    const senderValid = validateSenderInfo();
    const receiverValid = validateReceiverInfo();

    return senderValid && receiverValid;
  }

  // Public API
  return {
    init,
    validateSenderInfo,
    validateReceiverInfo,
    validateLocationSelects,
    validateNormalAddressSelects,
    validateNewAddressSelects,
    validateForm,
    showError,
    hideError,
    showSelectError,
    hideSelectError
  };
})();