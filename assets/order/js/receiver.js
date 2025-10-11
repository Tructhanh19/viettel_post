/**
 * RECEIVER INFO FUNCTIONALITY
 * Handles receiver information, address modes, location cascading
 */

window.Receiver = (function () {
  "use strict";

  // Public methods
  function init() {
    initReceiverInfo();
    initSearchableSelects();
    initAddressSystem();
  }

  // Initialize address system
  async function initAddressSystem() {
    if (window.AddressData) {
      await window.AddressData.init();
      window.AddressData.setupAddressCascading();
    }
  }

  // Receiver info functionality
  function initReceiverInfo() {

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

  function checkReceiverInfoComplete() {
    const phone = document.getElementById("receiverPhone");
    const name = document.getElementById("receiverName");
    const address = document.getElementById("receiverAddress");
    const newAddress = document.getElementById("newReceiverAddress");
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

      addressValid = addressValid && provinceValid && districtValid && wardValid;
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
    checkReceiverInfoComplete,
  };
})();
