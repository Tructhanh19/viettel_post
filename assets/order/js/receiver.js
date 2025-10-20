/**
 * Receiver INFO FUNCTIONALITY
 * Handles Receiver information, address modes, location cascading
 */

window.Receiver = (function () {
  "use strict";

  // Public methods
  async function init() {
    initReceiverInfo();
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
    // setupTagModal();
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
    const primaryPhone = document.getElementById("receiverPhone");
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
    const receiverAddressTextarea = document.getElementById("receiverAddress");
    const newReceiverAddressTextarea =
      document.getElementById("newReceiverAddress");

    if (!deliveryAddressRadio || !deliveryPostRadio) return;

    // Handle delivery type change
    const handleDeliveryTypeChange = () => {
      const isPostOffice = deliveryPostRadio.checked;

      // Disable/enable address input
      if (receiverAddressTextarea) {
        receiverAddressTextarea.disabled = isPostOffice;
        if (isPostOffice) {
          receiverAddressTextarea.style.backgroundColor = "#f0f0f0";
          receiverAddressTextarea.style.cursor = "not-allowed";
        } else {
          receiverAddressTextarea.style.backgroundColor = "";
          receiverAddressTextarea.style.cursor = "";
        }
      }

      if (newReceiverAddressTextarea) {
        newReceiverAddressTextarea.disabled = isPostOffice;
        if (isPostOffice) {
          newReceiverAddressTextarea.style.backgroundColor = "#f0f0f0";
          newReceiverAddressTextarea.style.cursor = "not-allowed";
        } else {
          newReceiverAddressTextarea.style.backgroundColor = "";
          newReceiverAddressTextarea.style.cursor = "";
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
              // Phát sự kiện receiverChanged cho PricingCalculator
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
                new CustomEvent("receiverChanged", {
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
              // Phát sự kiện receiverChanged cho PricingCalculator (new address mode)
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
                new CustomEvent("receiverChanged", {
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
      // Emit branchId in receiverChanged event for CreateOrderData.receiver
      document.dispatchEvent(
        new CustomEvent("receiverChanged", {
          detail: {
            branchId: branch._id?.$oid || branch._id,
            name: document.getElementById("receiverName")?.value || "",
            phone: document.getElementById("receiverPhone")?.value || "",
            address: {
              province,
              district,
              ward,
              other: document.getElementById("receiverAddress")?.value || "",
            },
            tags: window.CreateOrderData?.receiver?.tags || [],
          },
        })
      );
    } else {
      showBranchNotFound();
      // Emit receiverChanged with branchId null
      document.dispatchEvent(
        new CustomEvent("receiverChanged", {
          detail: {
            branchId: null,
            name: document.getElementById("receiverName")?.value || "",
            phone: document.getElementById("receiverPhone")?.value || "",
            address: {
              province,
              district,
              ward,
              other: document.getElementById("receiverAddress")?.value || "",
            },
            tags: window.CreateOrderData?.receiver?.tags || [],
          },
        })
      );
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
      // Always use nested address object for matching
      const branchProvince = b.address?.province?.toLowerCase() || "";
      const branchDistrict = b.address?.district?.toLowerCase() || "";
      const branchWard = b.address?.ward?.toLowerCase() || "";

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

  function initReceiverInfo() {
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
    display.addEventListener("click", function (e) {
      e.stopPropagation();
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

    // Handle option selection
    optionsContainer.addEventListener("click", function (e) {
      if (e.target.classList.contains("dropdown-option")) {
        const options = optionsContainer.querySelectorAll(".dropdown-option");
        options.forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");

        const selectedText = e.target.textContent;
        const displaySpan = display.querySelector("span");
        if (displaySpan) {
          displaySpan.textContent = selectedText;
          display.classList.add("has-value");
        }

        searchInput.value = "";
        options.forEach((opt) => (opt.style.display = "block"));
        if (noResults) noResults.style.display = "none";
        dropdown.classList.remove("show");
        display.classList.remove("active");

        // Trigger change event
        const changeEvent = new CustomEvent("change", {
          detail: {
            value: e.target.getAttribute("data-value"),
            text: selectedText,
            selectId: selectElement.id,
          },
        });
        selectElement.dispatchEvent(changeEvent);

        // Trigger locationChange event
        const locationChangeEvent = new CustomEvent("locationChange", {
          detail: {
            value: e.target.getAttribute("data-value"),
            text: selectedText,
            selectId: selectElement.id,
          },
        });
        selectElement.dispatchEvent(locationChangeEvent);

        // Trigger validation
        const errorElement =
          selectElement.parentElement.querySelector(".text-danger");
        if (errorElement && window.Validation) {
          window.Validation.hideSelectError(selectElement, errorElement);
        }
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

      if (noResults) {
        noResults.style.display = hasVisibleOptions ? "none" : "block";
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

      addressValid =
        addressValid && provinceValid && districtValid && wardValid;
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

        // Auto-calculate and display customer tag based on phone number
        if (phone && phone.value.trim()) {
          // calculateAndDisplayCustomerTag(phone.value.trim());
          // Lấy tag từ window.CreateOrderData.receiver nếu có
          if (
            window.CreateOrderData &&
            window.CreateOrderData.receiver &&
            Array.isArray(window.CreateOrderData.receiver.tags)
          ) {
            renderReceiverTags(window.CreateOrderData.receiver.tags);
          }
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

  // Render receiver tags with icon and color
  function renderReceiverTags(tags) {
    const tagSection = document.getElementById("receiverTagSection");
    const tagsContainer = document.getElementById("tagsContainer");
    if (!tagsContainer) return;
    tagsContainer.innerHTML = "";
    if (!Array.isArray(tags) || tags.length === 0) {
      if (tagSection) tagSection.style.display = "none";
      return;
    }
    // Map code sang icon
    const tagIconMap = {
      CLOSE: "fa-heart",
      VIP: "fa-star",
      NEW: "fa-user-plus",
      BOM: "fa-bomb",
      LOW_EXPECTATION: "fa-exclamation-triangle",
    };
    let tagDataList = [];
    if (window.TagData && window.TagData.list) {
      tagDataList = window.TagData.list;
    }
    function getTagInfo(tag) {
      let code = tag.code || tag;
      let info = tagDataList.find((t) => t.code === code);
      return info || tag;
    }
    tags.forEach((tag) => {
      let info = getTagInfo(tag);
      let tagName = info.name || info.code || tag;
      let color = info.color_code || "#007bff";
      let iconClass = tagIconMap[info.code] || "fa-tag";
      const tagEl = document.createElement("span");
      tagEl.className = "badge me-2";
      tagEl.style.background = color;
      tagEl.style.color = "#fff";
      tagEl.style.borderRadius = "12px";
      tagEl.style.padding = "4px 12px";
      tagEl.style.marginRight = "8px";
      tagEl.style.fontSize = "13px";
      tagEl.style.fontWeight = "500";
      tagEl.style.boxShadow = "0 1px 3px rgba(0,0,0,0.07)";
      tagEl.style.letterSpacing = "0.5px";
      tagEl.style.verticalAlign = "middle";
      tagEl.innerHTML = `<i class='fas ${iconClass}' style='margin-right:6px'></i>${tagName}`;
      tagsContainer.appendChild(tagEl);
    });
    if (tagSection) tagSection.style.display = "";
  }

  // Public API
  return {
    init,
    checkReceiverInfoComplete,
    renderReceiverTags,
  };
})();
// Module con chỉ phát event, không ghi vào CreateOrderData.receiver
window.Receiver.getCurrentReceiver = function () {
  var nameInput = document.getElementById('receiverName');
  var name = nameInput && nameInput.value ? nameInput.value.trim() : '';
  if (!name) return {};

  var phone = '';
  var mainPhone = document.getElementById('receiverPhone');
  if (mainPhone && mainPhone.value && mainPhone.value.trim()) {
    phone = mainPhone.value.trim();
  } else {
    var extraPhone = document.querySelector('.additional-phone-input');
    if (extraPhone && extraPhone.value && extraPhone.value.trim()) {
      phone = extraPhone.value.trim();
    }
  }

  function clean(v) {
    return (v || '').replace(/\n|\t/g, '').replace(/\s+/g, ' ').trim();
  }
  var isPostOffice = document.getElementById('deliveryPost') && document.getElementById('deliveryPost').checked;
  var address = null, branchId = null;
  if (isPostOffice) {
    var selectedBranch = document.querySelector('.post-office-option.selected[data-id]');
    if (selectedBranch) {
      branchId = selectedBranch.getAttribute('data-id');
      // Tìm thông tin chi nhánh từ BranchData
      if (branchId && window.BranchData?.getAllBranches) {
        var allBranches = window.BranchData.getAllBranches();
        var branchInfo = allBranches.find(b => (b._id?.$oid || b._id) == branchId);
        if (branchInfo && branchInfo.address) {
          address = {
            province: clean(branchInfo.address.province),
            district: clean(branchInfo.address.district),
            ward: clean(branchInfo.address.ward),
            other: clean(branchInfo.address.other)
          };
        }
      }
    } else if (window.BranchData?.getAllBranches) {
      // Nếu chưa chọn chi nhánh, lấy branch đầu tiên
      var allBranches = window.BranchData.getAllBranches();
      if (allBranches.length > 0) {
        var branchInfo = allBranches[0];
        branchId = branchInfo._id?.$oid || branchInfo._id || null;
        if (branchInfo.address) {
          address = {
            province: clean(branchInfo.address.province),
            district: clean(branchInfo.address.district),
            ward: clean(branchInfo.address.ward),
            other: clean(branchInfo.address.other)
          };
        }
      }
    }
  // ...existing code...
  } else {
    var isNew = document.getElementById('useNewAddressToggle') && document.getElementById('useNewAddressToggle').checked;
    if (isNew) {
      var province = clean(document.getElementById('newProvinceSelect') && document.getElementById('newProvinceSelect').querySelector('.select-display span') ? document.getElementById('newProvinceSelect').querySelector('.select-display span').textContent : '');
      var ward = clean(document.getElementById('newWardSelect') && document.getElementById('newWardSelect').querySelector('.select-display span') ? document.getElementById('newWardSelect').querySelector('.select-display span').textContent : '');
      var detail = clean(document.getElementById('newReceiverAddress') && document.getElementById('newReceiverAddress').value ? document.getElementById('newReceiverAddress').value : '');
      address = { province: province, ward: ward, district: '', other: detail };
    } else {
      var province2 = clean(document.getElementById('provinceSelect') && document.getElementById('provinceSelect').querySelector('.select-display span') ? document.getElementById('provinceSelect').querySelector('.select-display span').textContent : '');
      var district = clean(document.getElementById('districtSelect') && document.getElementById('districtSelect').querySelector('.select-display span') ? document.getElementById('districtSelect').querySelector('.select-display span').textContent : '');
      var ward2 = clean(document.getElementById('wardSelect') && document.getElementById('wardSelect').querySelector('.select-display span') ? document.getElementById('wardSelect').querySelector('.select-display span').textContent : '');
      var detail2 = clean(document.getElementById('receiverAddress') && document.getElementById('receiverAddress').value ? document.getElementById('receiverAddress').value : '');
      address = { province: province2, district: district, ward: ward2, other: detail2 };
    }
    branchId = null;
  // ...existing code...
  }

  var tags = [];
  if (window.TagData && window.TagData.getTagByCode) {
    var tag = window.TagData.getTagByCode('NEW');
    if (tag) tags = [tag];
  }

  var pickTime = null;
  var deliveryTimeDisplay = document.getElementById('deliveryTimeDisplay');
  if (deliveryTimeDisplay) {
    var selectedOption = document.querySelector('#deliveryTimeDropdown .dropdown-option.selected');
    if (selectedOption) {
      pickTime = selectedOption.getAttribute('data-value') || selectedOption.textContent.trim();
    } else {
      var span = deliveryTimeDisplay.querySelector('span');
      pickTime = span && span.textContent ? span.textContent.trim() : null;
    }
  }

  var result = {
    name: name,
    phoneNumber: phone,
    address: address,
    branchId: branchId,
    tags: tags,
    pickTime: pickTime
  };
  // ...existing code...
  return result;
};
