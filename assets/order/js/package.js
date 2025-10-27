window.Package = (function () {
  // Biến quản lý số thứ tự các package-item
  let availableNumbers = [];
  let packageItemCounter = 1;
  "use strict";

  async function init() {
    const loaded = await PackageData.init();
    if (!loaded) {
      console.error("❌ Không thể load package data");
      return;
    }

    const productLoaded = await window.ProductData.init();
    if (!productLoaded) {
      console.warn('[Package] ProductData initialized but no products were loaded');
    }

    renderPackageTypes();
    renderPackageCharacteristics();

    initPackageTypeToggle();
    initAddPackageButton();
    initPackageEventListeners();
    initProductAutocomplete();
    updatePackageItemVisibility();
    updatePackageSummary();
  }

  function renderPackageTypes() {
    const packageTypes = PackageData.getPackageTypes();
    const container = document.querySelector(".d-flex.gap-3");

    if (!container || packageTypes.length === 0) {
      console.warn("Package types container not found or no types available");
      return;
    }

    // Clear existing content

      // ===== Lưu thông tin hàng hóa vào CreateOrderData để phục vụ tạo đơn =====
      function savePackageInfoToOrder() {
        // Loại hàng hóa
        const selectedTypeInput = document.querySelector('input[name="packageType"]:checked');
        let packageType = null;
        if (selectedTypeInput) {
          const code = selectedTypeInput.value.toUpperCase();
          const typeObj = window.PackageData.getPackageTypes().find(t => t.code === code);
          packageType = {
            code,
            name: typeObj?.name || "",
            features: [],
            totalPrice: 0
          };

          // Đặc tính hàng hóa đặc biệt
          const features = [];
          document.querySelectorAll('.special-characteristics-section input[type="checkbox"]:checked').forEach(cb => {
            const fcode = cb.getAttribute('data-code');
            const featureObj = window.PackageData.getPackageFeatures().find(f => f.code === fcode);
            if (featureObj) {
              features.push({
                code: featureObj.code,
                name: featureObj.name,
                cost: featureObj.cost,
                totalPrice: featureObj.cost
              });
            }
          });
          packageType.features = features;
          packageType.totalPrice = features.reduce((sum, f) => sum + (f.totalPrice || 0), 0);
        }

        // Danh sách hàng hóa
        const packages = [];
        document.querySelectorAll('.package-item').forEach(item => {
          const name = item.querySelector('.package-name')?.value?.trim() || "";
          const quantity = Number(item.querySelector('.package-quantity')?.value || 1);
          const weight = Number(item.querySelector('.package-weight')?.value || 0);
          const value = Number(item.querySelector('.package-value')?.value || 0);
          const totalPrice = value;
          if (name) {
            packages.push({ name, quantity, weight, value, totalPrice });
          }
        });

        window.CreateOrderData.packageType = packageType;
        window.CreateOrderData.packages = packages;
        // Phát event để các module khác cập nhật
        document.dispatchEvent(new CustomEvent('packageItemsChanged', { detail: { packageType, packages } }));
      }

      // Gọi hàm này mỗi khi có thay đổi thông tin hàng hóa
      document.addEventListener('input', savePackageInfoToOrder);
      document.addEventListener('change', savePackageInfoToOrder);
      document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-item-btn') || e.target.id === 'addPackageItemBtn') {
          setTimeout(savePackageInfoToOrder, 100);
        }
      });
    container.innerHTML = "";

    // Render package types from JSON
    packageTypes.forEach((type, index) => {
      const typeId = type.code.toLowerCase();
      const isChecked = index === 0; // First one is checked by default

      const typeHTML = `
        <div class="form-check">
          <input class="form-check-input" type="radio" name="packageType" value="${typeId}" id="package${type.code}" ${isChecked ? "checked" : ""}>
          <label class="form-check-label" for="package${type.code}">${type.name}</label>
        </div>
      `;
      container.insertAdjacentHTML("beforeend", typeHTML);
    });
  }

  function renderPackageCharacteristics() {
    const allFeatures = PackageData.getPackageFeatures();

    // Render mail/package characteristics
    const mailFeatures = allFeatures.filter(
      (f) => f.package_type_code === "PACKAGE"
    );
    const mailContainer = document.getElementById("mailCharacteristics");

    if (mailContainer && mailFeatures.length > 0) {
      mailContainer.innerHTML = renderCharacteristicRows(mailFeatures);
    }

    // Render document characteristics
    const docFeatures = allFeatures.filter(
      (f) => f.package_type_code === "DOCUMENT"
    );
    const docContainer = document.getElementById("documentCharacteristics");

    if (docContainer && docFeatures.length > 0) {
      docContainer.innerHTML = renderCharacteristicRows(docFeatures);
    }
  }

  function renderCharacteristicRows(features) {
    let html = '<div class="row">';

    features.forEach((feature, index) => {
      const featureId = feature.code.toLowerCase();
      const colClass = features.length <= 2 ? "col-md-6" : "col-md-4";

      html += `
        <div class="${colClass}">
          <div class="form-check mb-2">
            <input class="form-check-input" type="checkbox" id="${featureId}" data-code="${feature.code}" data-cost="${feature.cost}">
            <label class="form-check-label" for="${featureId}">${feature.name}</label>
          </div>
        </div>
      `;

      // Create new row after every 3 items (or 2 for documents)
      const itemsPerRow = features.length <= 2 ? 2 : 3;
      if ((index + 1) % itemsPerRow === 0 && index < features.length - 1) {
        html += '</div><div class="row">';
      }
    });

    html += "</div>";
    return html;
  }

  function initPackageTypeToggle() {
    // Package type switching
    const packageTypeInputs = document.querySelectorAll(
      'input[name="packageType"]'
    );
    const mailCharacteristics = document.getElementById("mailCharacteristics");
    const documentCharacteristics = document.getElementById(
      "documentCharacteristics"
    );

    if (
      !packageTypeInputs.length ||
      !mailCharacteristics ||
      !documentCharacteristics
    ) {
      console.log("⚠️ Package type elements not found");
      return;
    }

    packageTypeInputs.forEach((input) => {
      input.addEventListener("change", function () {
        if (this.value === "package" || this.value === "PACKAGE") {
          mailCharacteristics.style.display = "block";
          documentCharacteristics.style.display = "none";
        } else if (this.value === "document" || this.value === "DOCUMENT") {
          mailCharacteristics.style.display = "none";
          documentCharacteristics.style.display = "block";
        }
      });
    });
  }

  function initAddPackageButton() {
    const addPackageBtn = document.getElementById("addPackageItemBtn");
    if (addPackageBtn) {
      addPackageBtn.addEventListener("click", addPackageItem);
    }
  }

  function initPackageEventListeners() {
    // Add event listeners for calculation updates and validation
    document.addEventListener("input", function (e) {
      if (
        e.target.classList.contains("package-weight") ||
        e.target.classList.contains("package-value") ||
        e.target.classList.contains("package-quantity")
      ) {
        updatePackageSummary();
        // Notify pricing calculator
        notifyPackageChanged();
      }
    });

    // Add event listener for package feature checkboxes
    document.addEventListener("change", function (e) {
      if (e.target.type === "checkbox" && e.target.dataset.code) {
        // Package feature checkbox changed
        notifyPackageChanged();
      }

      // Validation for required fields
      if (e.target.classList.contains("package-name")) {
        validatePackageField(e.target, "package-name-error");
      } else if (e.target.classList.contains("package-weight")) {
        validatePackageField(e.target, "package-weight-error");
      } else if (e.target.classList.contains("dimension-length")) {
        validatePackageField(e.target, "dimension-length-error");
      } else if (e.target.classList.contains("dimension-width")) {
        validatePackageField(e.target, "dimension-width-error");
      } else if (e.target.classList.contains("dimension-height")) {
        validatePackageField(e.target, "dimension-height-error");
      }
    });

    // Validation on blur
    document.addEventListener(
      "blur",
      function (e) {
        if (
          e.target.classList.contains("package-name") ||
          e.target.classList.contains("package-weight") ||
          e.target.classList.contains("dimension-length") ||
          e.target.classList.contains("dimension-width") ||
          e.target.classList.contains("dimension-height")
        ) {
          const errorClass = e.target.className.includes("package-name")
            ? "package-name-error"
            : e.target.className.includes("package-weight")
            ? "package-weight-error"
            : e.target.className.includes("dimension-length")
            ? "dimension-length-error"
            : e.target.className.includes("dimension-width")
            ? "dimension-width-error"
            : "dimension-height-error";
          validatePackageField(e.target, errorClass);
        }
      },
      true
    );
  }

  function initProductAutocomplete() {
    // Handle input event for all package name fields
    document.addEventListener("input", function (e) {
      if (e.target.classList.contains("package-name")) {
        handleProductSearch(e.target);
      }
    });

    // Show suggestions on focus/click even when input is empty
    document.addEventListener('focusin', function (e) {
      if (e.target.classList && e.target.classList.contains('package-name')) {
        handleProductSearch(e.target, true);
      }
    });

    document.addEventListener('click', function (e) {
      if (e.target.classList && e.target.classList.contains('package-name')) {
        handleProductSearch(e.target, true);
      }
    });

    // Handle click outside to close dropdown
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".position-relative")) {
        closeAllProductDropdowns();
      }
    });
  }

  function handleProductSearch(input) {
    // If a product was just selected, suppress immediate reopen for a short time
    if (window.__suppressProductOpen) return;
    const query = input.value.trim();
    const wrapper = input.closest(".position-relative");
    const dropdown = wrapper?.querySelector(".product-dropdown");

    if (!dropdown) return;

    // If query is empty, show a short list of popular/all products
    let products = [];
    if (query.length === 0) {
      // Try to get all products and show top 10
      const all = window.ProductData.getAllProducts() || [];
      products = all.slice(0, 10);
    } else {
      // Search products
      products = window.ProductData.searchProducts(query);
    }
    populateProductDropdown(dropdown, products, input);

    // Show dropdown if there are results
    dropdown.style.display = products.length > 0 ? "block" : "none";
  }

  function populateProductDropdown(dropdown, products, input) {
    const list = dropdown.querySelector(".product-dropdown-list");
    if (!list) return;

    // Clear existing items
    list.innerHTML = "";

    if (products.length === 0) {
      list.innerHTML =
        '<div class="product-dropdown-item text-muted">Không tìm thấy sản phẩm</div>';
      return;
    }

    // Add product items
    products.forEach((product) => {
      const item = document.createElement("div");
      item.className = "product-dropdown-item";
      item.innerHTML = `
        <div class="product-name">${product.name}</div>
        <div class="product-details">
          <span class="product-value">${formatNumber(product.value)} đ</span>
        </div>
      `;

      // Handle product selection
      item.addEventListener("mousedown", function (e) {
        // Prevent outer click handlers from interfering
        e.stopPropagation();
        e.preventDefault();
        // Suppress reopening the dropdown for a short time
        window.__suppressProductOpen = true;
        setTimeout(() => { window.__suppressProductOpen = false; }, 300);

        // Fill product name
        input.value = product.name;
        // Find parent package item
        const packageItem = input.closest('.package-item');
        if (packageItem) {
          // Auto-fill weight and value
          const weightInput = packageItem.querySelector('.package-weight');
          const valueInput = packageItem.querySelector('.package-value');
          if (weightInput && product.weight) weightInput.value = product.weight;
          if (valueInput && product.value) valueInput.value = product.value;
          // Auto-fill dimensions if available
          if (product.dimensions) {
            const { length, width, height } = product.dimensions;
            const lInput = packageItem.querySelector('.dimension-length');
            const wInput = packageItem.querySelector('.dimension-width');
            const hInput = packageItem.querySelector('.dimension-height');
            if (lInput && length) lInput.value = length;
            if (wInput && width) wInput.value = width;
            if (hInput && height) hInput.value = height;
          }
        }
        // Hide dropdown
        dropdown.style.display = 'none';
        // Trigger input event to update data (still needed to persist selection)
        input.dispatchEvent(new Event('input', { bubbles: true }));
        updatePackageSummary();
      });

      list.appendChild(item);
    });
  }

  function selectProduct(input, product) {
    // Fill product name
    input.value = product.name;

    // Find parent package item
    const packageItem = input.closest(".package-item");
    if (!packageItem) return;

    // Auto-fill weight and value
    const weightInput = packageItem.querySelector(".package-weight");
    const valueInput = packageItem.querySelector(".package-value");

    if (weightInput) weightInput.value = product.weight;
    if (valueInput) valueInput.value = product.value;

    // Auto-fill dimensions if available
    if (product.dimensions) {
      const lengthInput = document.querySelector(".dimension-length");
      const widthInput = document.querySelector(".dimension-width");
      const heightInput = document.querySelector(".dimension-height");

      if (lengthInput) lengthInput.value = product.dimensions.length;
      if (widthInput) widthInput.value = product.dimensions.width;
      if (heightInput) heightInput.value = product.dimensions.height;
    }

    // Hide dropdown
    const wrapper = input.closest(".position-relative");
    const dropdown = wrapper?.querySelector(".product-dropdown");
    if (dropdown) {
      dropdown.style.display = "none";
    }

    // Update summary
    updatePackageSummary();
  }

  function closeAllProductDropdowns() {
    const dropdowns = document.querySelectorAll(".product-dropdown");
    dropdowns.forEach((dropdown) => {
      dropdown.style.display = "none";
    });
  }

  function addPackageItem() {
    // Get next available number
    let itemNumber;
    if (availableNumbers.length > 0) {
      // Reuse lowest available number
      availableNumbers.sort((a, b) => a - b);
      itemNumber = availableNumbers.shift();
    } else {
      // Use next sequential number
      packageItemCounter++;
      itemNumber = packageItemCounter;
    }

    const container = document.getElementById("packageItemsContainer");
    if (!container) {
      console.error("Package items container not found");
      return;
    }

    const newItem = document.createElement("div");
    newItem.className = "package-item";
    newItem.setAttribute("data-item", itemNumber);

    newItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tên hàng ${itemNumber}<span class="text-danger">*</span></h6>
            <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="mb-3 position-relative">
            <input type="text" class="form-control package-name" placeholder="Nhập tên hàng hóa" required autocomplete="off">
            <div class="package-name-error text-danger small mt-1" style="display: none;">Tên hàng hóa không được để trống</div>
            <div class="product-dropdown" style="display: none;">
                <div class="product-dropdown-list"></div>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-cube text-dark"></i> <span class="text-danger">*</span>
                </label>
                <input type="number" class="form-control package-quantity" value="1" min="1" required>
            </div>
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-balance-scale text-dark"></i> <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                    <input type="number" class="form-control package-weight" placeholder="Trọng lượng" min="0" step="0.01" required>
                    <span class="input-group-text">g</span>
                </div>
                <div class="package-weight-error text-danger small mt-1" style="display: none;">Trọng lượng không được để trống</div>
            </div>
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-money-bill text-dark"></i>
                </label>
                <div class="input-group">
                    <input type="number" class="form-control package-value" placeholder="Giá trị hàng" min="0">
                    <span class="input-group-text">đ</span>
                </div>
            </div>
        </div>
    `;

    container.appendChild(newItem);

    // Add remove functionality
    const removeBtn = newItem.querySelector(".remove-item-btn");
    removeBtn.addEventListener("click", function () {
      removePackageItem(newItem);
    });

    updatePackageItemVisibility();
    updatePackageSummary();

    // Focus on the new item's name field
    const nameInput = newItem.querySelector(".package-name");
    if (nameInput) {
      nameInput.focus();
    }
  }

  function removePackageItem(item) {
    // Get the item number before removing
    const itemNumber = parseInt(item.getAttribute("data-item"));

    // Add the number back to available numbers for reuse
    if (itemNumber > 1) {
      // Don't reuse number 1
      availableNumbers.push(itemNumber);
    }

    item.remove();
    updatePackageItemVisibility();
    updatePackageSummary();
  }

  function updatePackageItemVisibility() {
    const items = document.querySelectorAll(".package-item");
    items.forEach((item, index) => {
      const removeBtn = item.querySelector(".remove-item-btn");
      if (removeBtn) {
        removeBtn.style.display = items.length > 1 ? "flex" : "none";
      }
    });
  }

  function updatePackageSummary() {
    const items = document.querySelectorAll(".package-item");
    let totalWeight = 0;
    let totalValue = 0;

    items.forEach((item) => {
      const quantity =
        parseFloat(item.querySelector(".package-quantity").value) || 0;
      const weight =
        parseFloat(item.querySelector(".package-weight").value) || 0;
      const value = parseFloat(item.querySelector(".package-value").value) || 0;

      totalWeight += quantity * weight;
      totalValue += quantity * value;
    });

    // Update display
    const totalWeightEl = document.getElementById("totalWeight");
    const totalValueEl = document.getElementById("totalValue");

    if (totalWeightEl) {
      totalWeightEl.textContent = formatNumber(totalWeight) + " g";
    }

    if (totalValueEl) {
      totalValueEl.textContent = formatNumber(totalValue) + " đ";
    }
    notifyPackageChanged();
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("vi-VN").format(num);
  }

  function getSelectedCharacteristics() {
    const selectedFeatures = [];
    const checkboxes = document.querySelectorAll(
      '.special-characteristics-section input[type="checkbox"]:checked'
    );

    checkboxes.forEach((checkbox) => {
      const code = checkbox.dataset.code;
      const cost = parseFloat(checkbox.dataset.cost) || 0;
      const label = checkbox.parentElement.querySelector("label").textContent;

      selectedFeatures.push({
        code: code,
        name: label,
        cost: cost,
      });
    });

    return selectedFeatures;
  }

  function calculateCharacteristicsCost() {
    const selectedFeatures = getSelectedCharacteristics();
    return selectedFeatures.reduce((total, feature) => total + feature.cost, 0);
  }

  function validatePackageField(field, errorClass) {
    const container =
      field.closest(".package-item") ||
      field.closest(".dimensions-section") ||
      field.closest(".mb-3");
    const errorElement = container?.querySelector(`.${errorClass}`);

    if (!errorElement) return;

    const isEmpty = !field.value || field.value.trim() === "";
    const isInvalid =
      field.type === "number" &&
      (isNaN(field.value) || parseFloat(field.value) <= 0);

    if (isEmpty || isInvalid) {
      errorElement.style.display = "block";
      field.classList.add("is-invalid");
    } else {
      errorElement.style.display = "none";
      field.classList.remove("is-invalid");
    }
  }

  /**
   * Calculate total weight and value from all package items
   */
  function calculateTotals() {
    const items = document.querySelectorAll(".package-item");
    let totalWeight = 0;
    let totalValue = 0;

    items.forEach((item) => {
      const weightInput = item.querySelector(".package-weight");
      const valueInput = item.querySelector(".package-value");
      const quantityInput = item.querySelector(".package-quantity");

      const weight = parseFloat(weightInput?.value || 0);
      const value = parseFloat(valueInput?.value || 0);
      const quantity = parseInt(quantityInput?.value || 1);

      totalWeight += weight * quantity;
      totalValue += value * quantity;
    });

    // Get selected package features and their costs
    const selectedFeatures = getSelectedCharacteristics();
    const featuresCost = calculateCharacteristicsCost();

    return {
      totalWeight,
      totalValue,
      itemCount: items.length,
      selectedFeatures,
      featuresCost,
    };
  }

  /**
   * Dispatch event when package items change
   */
  function notifyPackageChanged() {
    const totals = calculateTotals();
    const event = new CustomEvent("packageItemsChanged", { detail: totals });
    document.dispatchEvent(event);
  }

  return {
    init,
    addPackageItem,
    removePackageItem,
    updatePackageSummary,
    validatePackageField,
    formatNumber,
    getSelectedCharacteristics,
    calculateCharacteristicsCost,
    calculateTotals,
    notifyPackageChanged,
  };
})();
