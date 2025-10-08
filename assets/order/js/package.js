/**
 * PACKAGE INFO FUNCTIONALITY
 * Handles package items, weight calculation, value calculation
 */

window.Package = (function() {
  'use strict';

  // Private variables
  let packageItemCounter = 1;
  let availableNumbers = []; // Array to store reusable numbers

  // Public methods
  function init() {
    initPackageTypeToggle();
    initAddPackageButton();
    initPackageEventListeners();
    updatePackageItemVisibility();
    updatePackageSummary();
  }

  function initPackageTypeToggle() {
    // Package type switching
    const packageTypeInputs = document.querySelectorAll('input[name="packageType"]');
    const mailCharacteristics = document.getElementById("mailCharacteristics");
    const documentCharacteristics = document.getElementById("documentCharacteristics");

    if (!packageTypeInputs.length || !mailCharacteristics || !documentCharacteristics) {
      console.log("⚠️ Package type elements not found");
      return;
    }

    packageTypeInputs.forEach((input) => {
      input.addEventListener("change", function () {
        if (this.value === "mail") {
          mailCharacteristics.style.display = "block";
          documentCharacteristics.style.display = "none";
        } else if (this.value === "document") {
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
    document.addEventListener("blur", function (e) {
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
    }, true);
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
        
        <div class="mb-3">
            <input type="text" class="form-control package-name" placeholder="Nhập tên hàng hóa" required>
            <div class="package-name-error text-danger small mt-1" style="display: none;">Tên hàng hóa không được để trống</div>
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
      const quantity = parseFloat(item.querySelector(".package-quantity").value) || 0;
      const weight = parseFloat(item.querySelector(".package-weight").value) || 0;  
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
  }

  function formatNumber(num) {
    return new Intl.NumberFormat("vi-VN").format(num);
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

  // Public API
  return {
    init,
    addPackageItem,
    removePackageItem,
    updatePackageSummary,
    validatePackageField,
    formatNumber
  };
})();