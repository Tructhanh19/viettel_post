/**
 * SENDER INFO FUNCTIONALITY
 * Handles sender information, address modes, location cascading
 */

window.Sender = (function () {
  "use strict";

  // Public methods
  async function init() {
    initSenderInfo();
    initSearchableSelects();
    await initAddressSystem();
    await initTagSystem();
  }

  // Initialize address system
  async function initAddressSystem() {
    if (window.AddressData) {
      await window.AddressData.init();
      window.AddressData.setupAddressCascading();
    }
  }

  // Initialize tag system
  async function initTagSystem() {
    if (!window.TagData) {
      console.error("TagData not available");
      return;
    }

    await window.TagData.init();
    setupTagModal();
  }

  // Initialize multiple phone numbers functionality
  function initMultiplePhoneNumbers() {
    const addPhoneBtn = document.getElementById("addPhoneBtn");
    const additionalPhonesContainer = document.getElementById(
      "additionalPhonesContainer"
    );

    if (!addPhoneBtn || !additionalPhonesContainer) return;

    let phoneCounter = 0;

    addPhoneBtn.addEventListener("click", function () {
      phoneCounter++;
      const phoneItem = document.createElement("div");
      phoneItem.className = "additional-phone-item";
      phoneItem.dataset.phoneId = phoneCounter;
      phoneItem.innerHTML = `
        <input
          type="tel"
          class="form-control additional-phone-input"
          placeholder="Nhập số điện thoại khác"
        />
        <button class="btn-remove-phone" type="button" onclick="this.closest('.additional-phone-item').remove()">
          <i class="fas fa-times-circle"></i>
        </button>
      `;

      additionalPhonesContainer.appendChild(phoneItem);
    });
  }

  // Get all phone numbers (primary + additional)
  function getAllPhoneNumbers() {
    const phones = [];

    // Primary phone
    const primaryPhone = document.getElementById("senderPhone");
    if (primaryPhone && primaryPhone.value.trim()) {
      phones.push(primaryPhone.value.trim());
    }

    // Additional phones
    const additionalPhones = document.querySelectorAll(
      ".additional-phone-input"
    );
    additionalPhones.forEach((input) => {
      if (input.value.trim()) {
        phones.push(input.value.trim());
      }
    });

    return phones;
  }

  /**
   * Initialize delivery type handling (address vs post office)
   */
  function initDeliveryTypeHandling() {
    const deliveryAddressRadio = document.getElementById("deliveryAddress");
    const deliveryPostRadio = document.getElementById("deliveryPost");
    const senderAddressTextarea = document.getElementById("senderAddress");
    const newSenderAddressTextarea =
      document.getElementById("newSenderAddress");

    if (!deliveryAddressRadio || !deliveryPostRadio) return;

    // Handle delivery type change
    const handleDeliveryTypeChange = () => {
      const isPostOffice = deliveryPostRadio.checked;

      // Disable/enable address input
      if (senderAddressTextarea) {
        senderAddressTextarea.disabled = isPostOffice;
        if (isPostOffice) {
          senderAddressTextarea.style.backgroundColor = "#f0f0f0";
          senderAddressTextarea.style.cursor = "not-allowed";
        } else {
          senderAddressTextarea.style.backgroundColor = "";
          senderAddressTextarea.style.cursor = "";
        }
      }

      if (newSenderAddressTextarea) {
        newSenderAddressTextarea.disabled = isPostOffice;
        if (isPostOffice) {
          newSenderAddressTextarea.style.backgroundColor = "#f0f0f0";
          newSenderAddressTextarea.style.cursor = "not-allowed";
        } else {
          newSenderAddressTextarea.style.backgroundColor = "";
          newSenderAddressTextarea.style.cursor = "";
        }
      }

      // If post office mode, try to find and display branch
      if (isPostOffice) {
        findAndDisplayBranch();
      } else {
        hideBranchCard();
      }
    };

    deliveryAddressRadio.addEventListener("change", handleDeliveryTypeChange);
    deliveryPostRadio.addEventListener("change", handleDeliveryTypeChange);

    // Also trigger when address selections change
    setupAddressChangeListeners();
  }

  /**
   * Setup listeners for address changes to auto-find branch
   */
  function setupAddressChangeListeners() {
    // Normal address mode
    const wardSelect = document.getElementById("wardSelect");
    const newWardSelect = document.getElementById("newWardSelect");

    if (wardSelect) {
      const optionsContainer = wardSelect.querySelector(".options-container");
      if (optionsContainer) {
        optionsContainer.addEventListener("click", (e) => {
          if (e.target.classList.contains("dropdown-option")) {
            setTimeout(() => {
              const deliveryPostRadio = document.getElementById("deliveryPost");
              if (deliveryPostRadio && deliveryPostRadio.checked) {
                findAndDisplayBranch();
              }
              // Phát sự kiện senderChanged cho PricingCalculator
              const provinceSelect = document.getElementById("provinceSelect");
              const districtSelect = document.getElementById("districtSelect");
              const wardSelect = document.getElementById("wardSelect");
              const province = provinceSelect?.querySelector(
                ".select-display span"
              )?.textContent;
              const district = districtSelect?.querySelector(
                ".select-display span"
              )?.textContent;
              const ward = wardSelect?.querySelector(
                ".select-display span"
              )?.textContent;
              document.dispatchEvent(
                new CustomEvent("senderChanged", {
                  detail: {
                    province,
                    district,
                    ward,
                  },
                })
              );
            }, 300);
          }
        });
      }
    }

    if (newWardSelect) {
      const optionsContainer =
        newWardSelect.querySelector(".options-container");
      if (optionsContainer) {
        optionsContainer.addEventListener("click", (e) => {
          if (e.target.classList.contains("dropdown-option")) {
            setTimeout(() => {
              const deliveryPostRadio = document.getElementById("deliveryPost");
              if (deliveryPostRadio && deliveryPostRadio.checked) {
                findAndDisplayBranch();
              }
              // Phát sự kiện senderChanged cho PricingCalculator (new address mode)
              const newProvinceSelect =
                document.getElementById("newProvinceSelect");
              const newWardSelect = document.getElementById("newWardSelect");
              const province = newProvinceSelect?.querySelector(
                ".select-display span"
              )?.textContent;
              const ward = newWardSelect?.querySelector(
                ".select-display span"
              )?.textContent;
              document.dispatchEvent(
                new CustomEvent("senderChanged", {
                  detail: {
                    province,
                    district: null,
                    ward,
                  },
                })
              );
            }, 300);
          }
        });
      }
    }
  }

  /**
   * Find and display branch based on selected address
   */
  async function findAndDisplayBranch() {
    const useNewAddress = document.getElementById(
      "useNewAddressToggle"
    ).checked;

    let province, district, ward;

    if (useNewAddress) {
      // New address mode
      const newProvinceSelect = document.getElementById("newProvinceSelect");
      const newWardSelect = document.getElementById("newWardSelect");

      province = newProvinceSelect?.querySelector(
        ".select-display span"
      )?.textContent;
      ward = newWardSelect?.querySelector(".select-display span")?.textContent;
    } else {
      // Normal address mode
      const provinceSelect = document.getElementById("provinceSelect");
      const districtSelect = document.getElementById("districtSelect");
      const wardSelect = document.getElementById("wardSelect");

      province = provinceSelect?.querySelector(
        ".select-display span"
      )?.textContent;
      district = districtSelect?.querySelector(
        ".select-display span"
      )?.textContent;
      ward = wardSelect?.querySelector(".select-display span")?.textContent;
    }

    // Check if required fields are selected
    if (
      !province ||
      province === "Tỉnh/Thành phố" ||
      !ward ||
      ward === "Xã/Phường" ||
      ward === "Xã/Phường/Đặc khu"
    ) {
      hideBranchCard();
      return;
    }

    // Find branch
    const branch = await findBranchByAddress(province, district, ward);

    if (branch) {
      displayBranchCard(branch);
    } else {
      showBranchNotFound();
    }
  }

  /**
   * Find branch by address from BranchData
   */
  async function findBranchByAddress(province, district, ward) {
    if (!window.BranchData) return null;

    await window.BranchData.init();
    const allBranches = window.BranchData.getAllBranches();

    // Search for matching branch
    const branch = allBranches.find((b) => {
      const branchProvince = b.province?.toLowerCase() || "";
      const branchDistrict = b.district?.toLowerCase() || "";
      const branchWard = b.ward?.toLowerCase() || "";

      const searchProvince = province?.toLowerCase() || "";
      const searchDistrict = district?.toLowerCase() || "";
      const searchWard = ward?.toLowerCase() || "";

      // Match province and ward (district optional for new address mode)
      const provinceMatch =
        branchProvince.includes(searchProvince) ||
        searchProvince.includes(branchProvince);
      const wardMatch =
        branchWard.includes(searchWard) || searchWard.includes(branchWard);

      if (district) {
        const districtMatch =
          branchDistrict.includes(searchDistrict) ||
          searchDistrict.includes(branchDistrict);
        return provinceMatch && districtMatch && wardMatch;
      } else {
        return provinceMatch && wardMatch;
      }
    });

    return branch || null;
  }

  /**
   * Display branch card with branch information
   */
  function displayBranchCard(branch) {
    const branchCard = document.getElementById("selectedBranchCard");
    const branchInfoContent = document.getElementById("branchInfoContent");
    const branchNotFoundWarning = document.getElementById(
      "branchNotFoundWarning"
    );

    if (!branchCard || !branchInfoContent) return;

    // Hide warning
    if (branchNotFoundWarning) {
      branchNotFoundWarning.style.display = "none";
    }

    // Extract address information (handle both direct properties and nested address object)
    const other = branch.address?.other || branch.other || "";
    const ward = branch.address?.ward || branch.ward || "";
    const district = branch.address?.district || branch.district || "";
    const province = branch.address?.province || branch.province || "";

    // Build full address string: "Tên bưu cục - Địa chỉ, Phường, Quận, Tỉnh"
    const addressParts = [other, ward, district, province].filter(
      (part) => part && part.trim() !== ""
    );
    const fullAddress = addressParts.join(", ");

    // Build branch info HTML - single line format (no icon)
    branchInfoContent.innerHTML = `
      <div class="branch-full-info">
        <span>${branch.name} - ${fullAddress}</span>
      </div>
    `;

    // Show card
    branchCard.style.display = "block";
  }

  /**
   * Show branch not found warning
   */
  function showBranchNotFound() {
    const branchCard = document.getElementById("selectedBranchCard");
    const branchNotFoundWarning = document.getElementById(
      "branchNotFoundWarning"
    );

    if (branchCard) {
      branchCard.style.display = "none";
    }

    if (branchNotFoundWarning) {
      branchNotFoundWarning.style.display = "flex";
    }
  }

  /**
   * Hide branch card and warning
   */
  function hideBranchCard() {
    const branchCard = document.getElementById("selectedBranchCard");
    const branchNotFoundWarning = document.getElementById(
      "branchNotFoundWarning"
    );

    if (branchCard) {
      branchCard.style.display = "none";
    }

    if (branchNotFoundWarning) {
      branchNotFoundWarning.style.display = "none";
    }
  }

  /**
   * Calculate and display customer tag based on delivery history
   * @param {string} customerPhone - Customer phone number
   */

  function initSenderInfo() {
    initMultiplePhoneNumbers();
    initDeliveryTypeHandling();

    // Custom delivery time select
    const deliveryTimeSelect = document.getElementById("deliveryTimeSelect");
    const deliveryTimeDisplay = document.getElementById("deliveryTimeDisplay");
    const deliveryTimeDropdown = document.getElementById(
      "deliveryTimeDropdown"
    );

    if (deliveryTimeSelect && deliveryTimeDisplay && deliveryTimeDropdown) {
      // Toggle dropdown
      deliveryTimeDisplay.addEventListener("click", function () {
        const isOpen = deliveryTimeDropdown.classList.contains("show");

        if (isOpen) {
          deliveryTimeDropdown.classList.remove("show");
          deliveryTimeDisplay.classList.remove("active");
        } else {
          deliveryTimeDropdown.classList.add("show");
          deliveryTimeDisplay.classList.add("active");
        }
      });

      // Handle option selection
      const options = deliveryTimeDropdown.querySelectorAll(".dropdown-option");
      options.forEach((option) => {
        option.addEventListener("click", function () {
          // Remove previous selection
          options.forEach((opt) => opt.classList.remove("selected"));

          // Add selection to clicked option
          this.classList.add("selected");

          // Update display
          const selectedText = this.textContent;
          const displaySpan = deliveryTimeDisplay.querySelector("span");
          if (displaySpan) {
            displaySpan.textContent = selectedText;
          }

          // Close dropdown
          deliveryTimeDropdown.classList.remove("show");
          deliveryTimeDisplay.classList.remove("active");
        });
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", function (event) {
        if (!deliveryTimeSelect.contains(event.target)) {
          deliveryTimeDropdown.classList.remove("show");
          deliveryTimeDisplay.classList.remove("active");
        }
      });
    }
  }

  // Searchable Select functionality
  function initSearchableSelects() {
    const searchableSelects = document.querySelectorAll(
      ".custom-select-search"
    );

    searchableSelects.forEach((selectElement) => {
      const display = selectElement.querySelector(".select-display");
      const dropdown = selectElement.querySelector(".select-dropdown");
      const searchInput = selectElement.querySelector(".search-input");
      const optionsContainer =
        selectElement.querySelector(".options-container");
      const noResults = selectElement.querySelector(".no-results");

      if (!display || !dropdown || !searchInput || !optionsContainer) return;

      // Toggle dropdown
      display.addEventListener("click", function () {
        const isOpen = dropdown.classList.contains("show");

        // Close all other dropdowns
        document
          .querySelectorAll(".custom-select-search .select-dropdown.show")
          .forEach((dd) => {
            dd.classList.remove("show");
            dd.parentElement
              .querySelector(".select-display")
              .classList.remove("active");
          });

        if (isOpen) {
          dropdown.classList.remove("show");
          display.classList.remove("active");
        } else {
          dropdown.classList.add("show");
          display.classList.add("active");
          searchInput.focus();
        }
      });

      // Search functionality
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        const options = optionsContainer.querySelectorAll(".dropdown-option");
        let hasVisibleOptions = false;

        options.forEach((option) => {
          const text = option.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            option.style.display = "block";
            hasVisibleOptions = true;
          } else {
            option.style.display = "none";
          }
        });

        // Show/hide no results message
        if (noResults) {
          if (hasVisibleOptions || searchTerm === "") {
            noResults.style.display = "none";
          } else {
            noResults.style.display = "block";
            noResults.textContent = "Không tìm thấy kết quả";
          }
        }
      });

      // Option selection
      optionsContainer.addEventListener("click", function (e) {
        if (e.target.classList.contains("dropdown-option")) {
          // Remove previous selection
          optionsContainer
            .querySelectorAll(".dropdown-option")
            .forEach((opt) => {
              opt.classList.remove("selected");
            });

          // Add selection to clicked option
          e.target.classList.add("selected");

          // Update display
          const selectedText = e.target.textContent;
          const displaySpan = display.querySelector("span");
          if (displaySpan) {
            displaySpan.textContent = selectedText;
            display.classList.add("has-value");
          }

          // Clear search
          searchInput.value = "";

          // Reset options visibility
          optionsContainer
            .querySelectorAll(".dropdown-option")
            .forEach((opt) => {
              opt.style.display = "block";
            });
          if (noResults) noResults.style.display = "none";

          // Close dropdown
          dropdown.classList.remove("show");
          display.classList.remove("active");

          // Trigger change event for cascading selects (for AddressData module)
          const changeEvent = new CustomEvent("change", {
            detail: {
              value: e.target.getAttribute("data-value"),
              text: selectedText,
              selectId: selectElement.id,
            },
          });
          selectElement.dispatchEvent(changeEvent);

          // Trigger locationChange event for backward compatibility
          const locationChangeEvent = new CustomEvent("locationChange", {
            detail: {
              value: e.target.getAttribute("data-value"),
              text: selectedText,
              selectId: selectElement.id,
            },
          });
          selectElement.dispatchEvent(locationChangeEvent);

          // Trigger validation for this select
          const errorElement =
            selectElement.parentElement.querySelector(".text-danger");
          if (errorElement && window.Validation) {
            window.Validation.hideSelectError(selectElement, errorElement);
          }
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", function (event) {
        if (!selectElement.contains(event.target)) {
          dropdown.classList.remove("show");
          display.classList.remove("active");
        }
      });

      // Prevent dropdown close when clicking on search input
      searchInput.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    });
  }

  function checkSenderInfoComplete() {
    const phone = document.getElementById("senderPhone");
    const name = document.getElementById("senderName");
    const address = document.getElementById("senderAddress");
    const newAddress = document.getElementById("newSenderAddress");
    const useNewAddressToggle = document.getElementById("useNewAddressToggle");

    // Check basic info
    const phoneValid = phone && phone.value.trim() !== "";
    const nameValid = name && name.value.trim() !== "";

    // Check address based on mode
    const isNewAddressMode = useNewAddressToggle && useNewAddressToggle.checked;
    let addressValid = false;

    if (isNewAddressMode) {
      addressValid = newAddress && newAddress.value.trim() !== "";
      const newProvince = document.getElementById("newProvinceSelect");
      const newWard = document.getElementById("newWardSelect");

      const newProvinceValid =
        newProvince && newProvince.querySelector(".dropdown-option.selected");
      const newWardValid =
        newWard && newWard.querySelector(".dropdown-option.selected");

      addressValid = addressValid && newProvinceValid && newWardValid;
    } else {
      addressValid = address && address.value.trim() !== "";
      const province = document.getElementById("provinceSelect");
      const district = document.getElementById("districtSelect");
      const ward = document.getElementById("wardSelect");

      const provinceValid =
        province && province.querySelector(".dropdown-option.selected");
      const districtValid =
        district && district.querySelector(".dropdown-option.selected");
      const wardValid = ward && ward.querySelector(".dropdown-option.selected");

      addressValid =
        addressValid && provinceValid && districtValid && wardValid;
    }

    const isComplete = phoneValid && nameValid && addressValid;

    // Show/hide rating and tag sections
    const ratingSection = document.getElementById("senderRatingSection");
    const tagSection = document.getElementById("senderTagSection");

    if (isComplete) {
      if (ratingSection && ratingSection.style.display === "none") {
        ratingSection.style.display = "block";
        setTimeout(() => ratingSection.classList.add("show"), 10);
      }
      if (tagSection && tagSection.style.display === "none") {
        tagSection.style.display = "block";
        setTimeout(() => tagSection.classList.add("show"), 100);

        // Auto-calculate and display customer tag based on phone number
        if (phone && phone.value.trim()) {
          calculateAndDisplayCustomerTag(phone.value.trim());
        }
      }
    } else {
      if (ratingSection) {
        ratingSection.classList.remove("show");
        setTimeout(() => (ratingSection.style.display = "none"), 300);
      }
      if (tagSection) {
        tagSection.classList.remove("show");
        setTimeout(() => (tagSection.style.display = "none"), 300);
      }
    }

    return isComplete;
  }

  // Public API
  return {
    init,
    checkSenderInfoComplete,
  };
})();
