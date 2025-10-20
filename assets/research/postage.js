/**
 * POSTAGE ESTIMATION FUNCTIONALITY
 * Handles postage fee calculation and service display
 */

// Initialize immediately (for dynamic loading)
(async function initPostageEstimation() {
  "use strict";

  // Wait a bit to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100));

  // Initialize modules
  await initModules();

  // Initialize form
  initForm();

  /**
   * Initialize required modules
   */
  async function initModules() {
    if (window.ScopeData) {
      await window.ScopeData.init();
    }

    if (window.AddressData) {
      await window.AddressData.init();
      populateProvinces();
    }
  }

  /**
   * Populate province dropdowns with custom select
   */
  function populateProvinces() {
    const senderProvinceSelect = document.getElementById("senderProvinceSelect");
    const receiverProvinceSelect = document.getElementById("receiverProvinceSelect");

    if (!window.AddressData) return;

    // Use getProvinces63() to get 63 provinces
    const provinces = window.AddressData.getProvinces63();

    // Populate sender and receiver province selects
    if (senderProvinceSelect) {
      populateCustomSelect(senderProvinceSelect, provinces);
    }

    if (receiverProvinceSelect) {
      populateCustomSelect(receiverProvinceSelect, provinces);
    }
  }

  /**
   * Populate custom select with options
   */
  function populateCustomSelect(selectElement, options) {
    const optionsContainer = selectElement.querySelector(".options-container");
    if (!optionsContainer) return;

    // Clear existing options
    optionsContainer.innerHTML = "";

    // Add options
    options.forEach((option) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "dropdown-option";
      optionDiv.setAttribute("data-value", option.code);
      optionDiv.textContent = option.name;
      optionsContainer.appendChild(optionDiv);
    });
  }

  /**
   * Initialize form functionality
   */
  function initForm() {
    initCustomSelects();
    
    const lookupBtn = document.getElementById("lookupBtn");
    if (lookupBtn) {
      lookupBtn.addEventListener("click", handleLookup);
    }
  }

  /**
   * Initialize custom select dropdowns
   */
  function initCustomSelects() {
    // Initialize all custom select elements
    document.querySelectorAll(".custom-select-search").forEach((select) => {
      const selectDisplay = select.querySelector(".select-display");
      const dropdown = select.querySelector(".select-dropdown");
      const searchInput = select.querySelector(".search-input");
      const optionsContainer = select.querySelector(".options-container");

      // Toggle dropdown
      selectDisplay.addEventListener("click", (e) => {
        e.stopPropagation();
        
        // Close other dropdowns
        document.querySelectorAll(".select-dropdown.show").forEach((d) => {
          if (d !== dropdown) d.classList.remove("show");
        });
        document.querySelectorAll(".select-display.active").forEach((d) => {
          if (d !== selectDisplay) d.classList.remove("active");
        });

        dropdown.classList.toggle("show");
        selectDisplay.classList.toggle("active");
        
        if (dropdown.classList.contains("show") && searchInput) {
          setTimeout(() => searchInput.focus(), 100);
        }
      });

      // Search functionality
      if (searchInput) {
        searchInput.addEventListener("input", function () {
          const searchTerm = this.value.toLowerCase();
          const options = optionsContainer.querySelectorAll(".dropdown-option");
          
          let hasVisibleOption = false;
          options.forEach((option) => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
              option.style.display = "block";
              hasVisibleOption = true;
            } else {
              option.style.display = "none";
            }
          });

          // Show/hide no results message
          const noResults = optionsContainer.querySelector(".no-results");
          if (noResults && options.length > 0) {
            noResults.style.display = hasVisibleOption ? "none" : "block";
          }
        });
      }

      // Option selection
      optionsContainer.addEventListener("click", (e) => {
        if (e.target.classList.contains("dropdown-option")) {
          const value = e.target.getAttribute("data-value");
          const text = e.target.textContent;

          // Update display
          selectDisplay.querySelector("span").textContent = text;
          selectDisplay.classList.add("has-value");

          // Store selected value
          select.setAttribute("data-selected-value", value);

          // Remove selected class from all options
          optionsContainer.querySelectorAll(".dropdown-option").forEach((opt) => {
            opt.classList.remove("selected");
          });
          e.target.classList.add("selected");

          // Close dropdown
          dropdown.classList.remove("show");
          selectDisplay.classList.remove("active");

          // Reset search
          if (searchInput) searchInput.value = "";
          optionsContainer.querySelectorAll(".dropdown-option").forEach((opt) => {
            opt.style.display = "block";
          });

          // Trigger change event based on select ID
          if (select.id === "senderProvinceSelect") {
            handleProvinceChange(value, "senderDistrictSelect");
          } else if (select.id === "receiverProvinceSelect") {
            handleProvinceChange(value, "receiverDistrictSelect");
          }
        }
      });
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", () => {
      document.querySelectorAll(".select-dropdown.show").forEach((d) => {
        d.classList.remove("show");
      });
      document.querySelectorAll(".select-display.active").forEach((d) => {
        d.classList.remove("active");
      });
    });
  }

  /**
   * Handle province change and populate districts
   */
  function handleProvinceChange(provinceCode, districtSelectId) {
    const districtSelect = document.getElementById(districtSelectId);
    if (!districtSelect || !window.AddressData) return;

    // Get districts
    const districts = window.AddressData.getDistricts63(provinceCode);

    // Clear and populate district select
    const optionsContainer = districtSelect.querySelector(".options-container");
    if (optionsContainer) {
      optionsContainer.innerHTML = "";
      
      if (districts.length > 0) {
        districts.forEach((district) => {
          const optionDiv = document.createElement("div");
          optionDiv.className = "dropdown-option";
          optionDiv.setAttribute("data-value", district.code);
          optionDiv.textContent = district.name;
          optionsContainer.appendChild(optionDiv);
        });
      } else {
        optionsContainer.innerHTML = '<div class="no-results">Không tìm thấy quận/huyện</div>';
      }
    }

    // Reset district selection
    const selectDisplay = districtSelect.querySelector(".select-display");
    if (selectDisplay) {
      selectDisplay.querySelector("span").textContent = selectDisplay.getAttribute("data-placeholder");
      selectDisplay.classList.remove("has-value");
    }
    districtSelect.removeAttribute("data-selected-value");
  }



  /**
   * Handle lookup button click
   */
  function handleLookup() {
    // Get form values from custom selects
    const senderProvinceSelect = document.getElementById("senderProvinceSelect");
    const senderDistrictSelect = document.getElementById("senderDistrictSelect");
    const receiverProvinceSelect = document.getElementById("receiverProvinceSelect");
    const receiverDistrictSelect = document.getElementById("receiverDistrictSelect");
    const packageWeight = document.getElementById("packageWeight");
    const codAmount = document.getElementById("codAmount");

    // Get selected values from custom selects
    const senderProvinceValue = senderProvinceSelect?.getAttribute("data-selected-value");
    const senderDistrictValue = senderDistrictSelect?.getAttribute("data-selected-value");
    const receiverProvinceValue = receiverProvinceSelect?.getAttribute("data-selected-value");
    const receiverDistrictValue = receiverDistrictSelect?.getAttribute("data-selected-value");

    // Validate inputs
    if (!senderProvinceValue || !senderDistrictValue) {
      alert("Vui lòng chọn địa chỉ người gửi");
      return;
    }

    if (!receiverProvinceValue || !receiverDistrictValue) {
      alert("Vui lòng chọn địa chỉ người nhận");
      return;
    }

    const weight = parseInt(packageWeight.value) || 0;
    if (weight <= 0) {
      alert("Vui lòng nhập khối lượng bưu phẩm");
      return;
    }

    // Get selected text from custom selects
    const senderProvinceName = senderProvinceSelect.querySelector(".select-display span").textContent;
    const senderDistrictName = senderDistrictSelect.querySelector(".select-display span").textContent;
    const receiverProvinceName = receiverProvinceSelect.querySelector(".select-display span").textContent;
    const receiverDistrictName = receiverDistrictSelect.querySelector(".select-display span").textContent;

    // Determine scope
    const scopeCode = window.ScopeData.determineScope(
      senderProvinceName,
      senderDistrictName,
      receiverProvinceName,
      receiverDistrictName
    );

    // Calculate fee
    const baseFee = window.ScopeData.calculateShippingFee(scopeCode, weight);
    
    if (baseFee === null) {
      alert("Không thể tính cước phí cho tuyến đường này");
      return;
    }

    // Get estimate time
    const estimateTime = window.ScopeData.getEstimateTime(scopeCode);

    // Display results
    displayServices(baseFee, estimateTime, codAmount.value);
  }

  /**
   * Display service options
   */
  function displayServices(baseFee, estimateTime, codAmount) {
    const resultsSection = document.getElementById("resultsSection");
    const servicesContainer = document.getElementById("servicesContainer");

    if (!resultsSection || !servicesContainer) return;

    // Clear previous results
    servicesContainer.innerHTML = "";

    // Define shipping services (only Chuyển phát nhanh)
    const services = [
      {
        code: "SCN",
        name: "Chuyển phát nhanh",
        priceMultiplier: 1.0, // Base price
        timeMultiplier: 1.0, // Base time
        badge: "SCN"
      }
    ];

    // Create service cards
    services.forEach((service) => {
      const price = Math.round(baseFee * service.priceMultiplier);
      const time = Math.round(estimateTime * service.timeMultiplier * 10) / 10; // Round to 1 decimal

      const serviceCard = document.createElement("div");
      serviceCard.className = "service-card";
      serviceCard.innerHTML = `
        <div class="service-info">
          <div class="service-badge">${service.badge}</div>
          <div class="service-name">${service.name}</div>
          <div class="service-price">${formatCurrency(price)}</div>
          <div class="service-time">${time} ngày</div>
        </div>
      `;

      servicesContainer.appendChild(serviceCard);
    });

    // Show results section
    resultsSection.style.display = "block";

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /**
   * Format currency VND
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }
})();
