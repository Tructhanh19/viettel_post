/**
 * RECEIVER INFO FUNCTIONALITY
 * Handles receiver information, address modes, location cascading
 */

window.Receiver = (function() {
  'use strict';

  // Public methods
  function init() {
    initReceiverInfo();
    initSearchableSelects();
    handleLocationCascading();
  }

  // Receiver info functionality  
  function initReceiverInfo() {
    // Address mode toggle
    const useNewAddressToggle = document.getElementById("useNewAddress");
    const normalMode = document.getElementById("normalAddressMode");
    const newMode = document.getElementById("newAddressMode");

    if (useNewAddressToggle && normalMode && newMode) {
      useNewAddressToggle.addEventListener("change", function () {
        if (this.checked) {
          normalMode.style.display = "none";
          newMode.style.display = "block";  
        } else {
          normalMode.style.display = "block";
          newMode.style.display = "none";
        }

        // Check receiver info completeness after mode change
        setTimeout(() => checkReceiverInfoComplete(), 100);
      });
    }

    // Custom delivery time select
    const deliveryTimeSelect = document.getElementById("deliveryTimeSelect");
    const deliveryTimeDisplay = document.getElementById("deliveryTimeDisplay");
    const deliveryTimeDropdown = document.getElementById("deliveryTimeDropdown");

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
    const searchableSelects = document.querySelectorAll(".custom-select-search");

    searchableSelects.forEach((selectElement) => {
      const display = selectElement.querySelector(".select-display");
      const dropdown = selectElement.querySelector(".select-dropdown");
      const searchInput = selectElement.querySelector(".search-input");
      const optionsContainer = selectElement.querySelector(".options-container");
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

          // Trigger change event for cascading selects
          const changeEvent = new CustomEvent("locationChange", {
            detail: {
              value: e.target.getAttribute("data-value"),
              text: selectedText,
              selectId: selectElement.id,
            },
          });
          selectElement.dispatchEvent(changeEvent);

          // Trigger validation for this select
          const errorElement = selectElement.parentElement.querySelector(".text-danger");
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

  // Handle location cascading (Province -> District -> Ward -> Street)
  function handleLocationCascading() {
    const provinceSelect = document.getElementById("provinceSelect");
    const districtSelect = document.getElementById("districtSelect");
    const wardSelect = document.getElementById("wardSelect");
    const streetSelect = document.getElementById("streetSelect");

    // New address mode selects
    const newProvinceSelect = document.getElementById("newProvinceSelect");
    const newWardSelect = document.getElementById("newWardSelect");
    const newStreetSelect = document.getElementById("newStreetSelect");

    // Sample data - in real app this would come from API
    const districts = {
      hanoi: ["Quận Ba Đình", "Quận Hoàn Kiếm", "Quận Tây Hồ", "Quận Long Biên"],
      hcm: ["Quận 1", "Quận 2", "Quận 3", "Quận 4", "Quận 5", "Quận 7"],
    };

    const wards = {
      "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho"],
      "Quận 2": ["Phường Thảo Điền", "Phường Bình An", "Phường Bình Trưng Đông"],
    };

    const streets = {
      "Phường Bến Nghé": ["Đường Nguyễn Huệ", "Đường Lê Lợi", "Đường Đồng Khởi"],
      "Phường Bến Thành": ["Đường Lê Thánh Tôn", "Đường Pasteur", "Đường Hai Bà Trưng"],
      "Phường Thảo Điền": ["Đường Xa Lộ Hà Nội", "Đường Nguyễn Văn Hưởng", "Đường Quốc Hương"],
    };

    // Normal address mode cascading
    if (provinceSelect) {
      provinceSelect.addEventListener("locationChange", function (e) {
        const provinceValue = e.detail.value;
        updateDistrictOptions(districtSelect, districts[provinceValue] || []);
        resetSelect(wardSelect, "Xã/Phường");
        resetSelect(streetSelect, "Đường/Thôn/Xóm");
      });
    }

    if (districtSelect) {
      districtSelect.addEventListener("locationChange", function (e) {
        const districtText = e.detail.text;
        updateWardOptions(wardSelect, wards[districtText] || []);
        resetSelect(streetSelect, "Đường/Thôn/Xóm");
      });
    }

    if (wardSelect) {
      wardSelect.addEventListener("locationChange", function (e) {
        const wardText = e.detail.text;
        updateStreetOptions(streetSelect, streets[wardText] || []);
      });
    }

    // New address mode cascading
    if (newProvinceSelect) {
      newProvinceSelect.addEventListener("locationChange", function (e) {
        const provinceValue = e.detail.value;
        updateWardOptions(
          newWardSelect,
          wards[Object.keys(districts[provinceValue] || {})[0]] || []
        );
        resetSelect(newStreetSelect, "Đường/Thôn/Xóm");
      });
    }

    if (newWardSelect) {
      newWardSelect.addEventListener("locationChange", function (e) {
        const wardText = e.detail.text;
        updateStreetOptions(newStreetSelect, streets[wardText] || []);
      });
    }
  }

  function updateDistrictOptions(selectElement, options) {
    if (!selectElement) return;

    const optionsContainer = selectElement.querySelector(".options-container");
    if (options.length > 0) {
      optionsContainer.innerHTML = options
        .map(
          (option) =>
            `<div class="dropdown-option" data-value="${option
              .toLowerCase()
              .replace(/\s+/g, "")}">${option}</div>`
        )
        .join("");
    } else {
      optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
  }

  function updateWardOptions(selectElement, options) {
    if (!selectElement) return;

    const optionsContainer = selectElement.querySelector(".options-container");
    if (options.length > 0) {
      optionsContainer.innerHTML = options
        .map(
          (option) =>
            `<div class="dropdown-option" data-value="${option
              .toLowerCase()
              .replace(/\s+/g, "")}">${option}</div>`
        )
        .join("");
    } else {
      optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
  }

  function updateStreetOptions(selectElement, options) {
    if (!selectElement) return;

    const optionsContainer = selectElement.querySelector(".options-container");
    if (options.length > 0) {
      optionsContainer.innerHTML = options
        .map(
          (option) =>
            `<div class="dropdown-option" data-value="${option
              .toLowerCase()
              .replace(/\s+/g, "")}">${option}</div>`
        )
        .join("");
    } else {
      optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
  }

  function resetSelect(selectElement, placeholder) {
    if (!selectElement) return;

    const display = selectElement.querySelector(".select-display");
    const span = display.querySelector("span");
    const optionsContainer = selectElement.querySelector(".options-container");

    span.textContent = placeholder;
    display.classList.remove("has-value");
    optionsContainer.innerHTML = `<div class="no-results">Vui lòng chọn cấp trên trước</div>`;
  }

  function checkReceiverInfoComplete() {
    const phone = document.getElementById("receiverPhone");
    const name = document.getElementById("receiverName");
    const address = document.getElementById("receiverAddress");
    const newAddress = document.getElementById("newReceiverAddress");
    const useNewAddress = document.getElementById("useNewAddress");

    // Check basic info
    const phoneValid = phone && phone.value.trim() !== "";
    const nameValid = name && name.value.trim() !== "";

    // Check address based on mode
    const isNewAddressMode = useNewAddress && useNewAddress.checked;
    let addressValid = false;

    if (isNewAddressMode) {
      addressValid = newAddress && newAddress.value.trim() !== "";
      // Also check if location selects are filled for new mode
      const newProvince = document.getElementById("newProvinceSelect");
      const newWard = document.getElementById("newWardSelect");
      const newStreet = document.getElementById("newStreetSelect");

      const newProvinceValid = newProvince && newProvince.querySelector(".dropdown-option.selected");
      const newWardValid = newWard && newWard.querySelector(".dropdown-option.selected");
      const newStreetValid = newStreet && newStreet.querySelector(".dropdown-option.selected");

      addressValid = addressValid && newProvinceValid && newWardValid && newStreetValid;
    } else {
      addressValid = address && address.value.trim() !== "";
      // Also check if location selects are filled for normal mode
      const province = document.getElementById("provinceSelect");
      const district = document.getElementById("districtSelect");
      const ward = document.getElementById("wardSelect");
      const street = document.getElementById("streetSelect");

      const provinceValid = province && province.querySelector(".dropdown-option.selected");
      const districtValid = district && district.querySelector(".dropdown-option.selected");
      const wardValid = ward && ward.querySelector(".dropdown-option.selected");
      const streetValid = street && street.querySelector(".dropdown-option.selected");

      addressValid = addressValid && provinceValid && districtValid && wardValid && streetValid;
    }

    const isComplete = phoneValid && nameValid && addressValid;

    // Show/hide rating and tag sections
    const ratingSection = document.getElementById("receiverRatingSection");
    const tagSection = document.getElementById("receiverTagSection");

    if (isComplete) {
      if (ratingSection && ratingSection.style.display === "none") {
        ratingSection.style.display = "block";
        setTimeout(() => ratingSection.classList.add("show"), 10);
      }
      if (tagSection && tagSection.style.display === "none") {
        tagSection.style.display = "block";
        setTimeout(() => tagSection.classList.add("show"), 100);
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
    initReceiverInfo,
    initSearchableSelects,
    handleLocationCascading,
    updateDistrictOptions,
    updateWardOptions,
    updateStreetOptions,
    resetSelect,
    checkReceiverInfoComplete
  };
})();