/**
 * USER PROFILE INFO CONTROLLER
 * Manages user profile information UI with MongoDB integration
 */

(function () {
  "use strict";

  console.log(
    "[DEBUG] Đã chạy receiver.js UI (AccountSetting/js) - User Profiles"
  );

  let currentUser = null;
  let currentProfiles = [];
  let filteredProfiles = [];
  let isEditing = false;
  let editingProfileIndex = -1;

  // Pagination variables
  let currentPage = 1;
  let itemsPerPage = 6;
  let totalPages = 1;

  /**
   * Initialize the user profile info page
   */
  async function init() {
    console.log("🎬 Initializing User Profile Info page...");

    // Initialize UserData module
    if (!window.UserData) {
      console.error("❌ UserData module not loaded");
      return;
    }

    // Get user ID from token
    const userId = window.API_CONFIG.getUserId();
    if (!userId) {
      showError("Không thể xác định user ID từ token");
      return;
    }

    try {
      // Load user data with profiles
      currentUser = await window.UserData.fetchUserById(userId);
      if (!currentUser || !currentUser.profiles) {
        showError("Không thể tải thông tin user hoặc profiles");
        return;
      }

      currentProfiles = currentUser.profiles;
      filteredProfiles = [...currentProfiles];

      // Initialize pagination
      totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
      currentPage = 1;

      // Render profiles with pagination
      renderProfilesWithPagination();

      // Setup event listeners
      setupEventListeners();

      // Khởi tạo AddressData và cascading custom-select-search
      if (window.AddressData) {
        await window.AddressData.init();
        window.AddressData.setupAddressCascading();
      }

      console.log("✅ User Profile Info page initialized");
    } catch (error) {
      showError("Lỗi khi tải dữ liệu user: " + error.message);
    }
  }

  /**
   * Render profile cards with pagination
   */
  function renderProfilesWithPagination() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const profilesToShow = filteredProfiles.slice(startIndex, endIndex);

    renderProfiles(profilesToShow);
    renderPagination();
  }

  /**
   * Render pagination controls
   */
  function renderPagination() {
    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";

    let paginationHtml = `
      <li class="page-item ${prevDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage - 1
        })">‹</a>
      </li>
    `;

    // Show page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      paginationHtml += `
        <li class="page-item ${activeClass}">
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    }

    paginationHtml += `
      <li class="page-item ${nextDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage + 1
        })">›</a>
      </li>
    `;

    paginationContainer.innerHTML = paginationHtml;
  }

  /**
   * Change page
   */
  window.changePage = function (page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderProfilesWithPagination();
  };

  /**
   * Render pagination controls
   */
  function renderPagination() {
    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";

    let paginationHtml = `
      <li class="page-item ${prevDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage - 1
        })">‹</a>
      </li>
    `;

    // Show page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      paginationHtml += `
        <li class="page-item ${activeClass}">
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    }

    paginationHtml += `
      <li class="page-item ${nextDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage + 1
        })">›</a>
      </li>
    `;

    paginationContainer.innerHTML = paginationHtml;
  }

  /**
   * Render profile cards with pagination
   */
  function renderProfilesWithPagination() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const profilesToShow = filteredProfiles.slice(startIndex, endIndex);

    renderProfiles(profilesToShow);
    renderPagination();
  }

  /**
   * Render pagination controls
   */
  function renderPagination() {
    const paginationContainer = document.querySelector(".pagination");
    if (!paginationContainer) return;

    const prevDisabled = currentPage === 1 ? "disabled" : "";
    const nextDisabled = currentPage === totalPages ? "disabled" : "";

    let paginationHtml = `
      <li class="page-item ${prevDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage - 1
        })">‹</a>
      </li>
    `;

    // Show page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === currentPage ? "active" : "";
      paginationHtml += `
        <li class="page-item ${activeClass}">
          <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        </li>
      `;
    }

    paginationHtml += `
      <li class="page-item ${nextDisabled}">
        <a class="page-link" href="#" onclick="changePage(${
          currentPage + 1
        })">›</a>
      </li>
    `;

    paginationContainer.innerHTML = paginationHtml;
  }

  /**
   * Render profile cards with pagination
   */
  function renderProfilesWithPagination() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const profilesToShow = filteredProfiles.slice(startIndex, endIndex);

    renderProfiles(profilesToShow, startIndex);
    renderPagination();
  }

  /**
   * Render profile cards
   */
  function renderProfiles(profiles, startIndex = 0) {
    if (profiles.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="text-muted mt-3">Không có profile nào</p>
        </div>
      `;
      return;
    }

    container.innerHTML = profiles
      .map((profile, index) => {
        const globalIndex = startIndex + index;
        // Format address
        const addressText = [
          profile.address?.other,
          profile.address?.ward,
          profile.address?.district,
          profile.address?.province,
        ]
          .filter(Boolean)
          .join(", ");

        return `
      <div class="col-md-6 mb-3">
        <div class="card sender-card h-100 ${
          profile.is_default ? "border-danger" : ""
        }">
          <div class="card-body">
            <div>
              <h6 class="mb-1">${escapeHtml(profile.name || "N/A")}</h6>
              <small class="text-muted">${escapeHtml(
                profile.phone_number || "N/A"
              )}</small>
              ${
                profile.is_default
                  ? '<span class="badge bg-danger ms-2">Mặc định</span>'
                  : ""
              }
            </div>
            <p class="mb-2">
              <i class="bi bi-geo-alt text-danger"></i>
              <small>${escapeHtml(addressText)}</small>
            </p>
            <div class="d-flex gap-2 mt-3">
              <button class="btn btn-sm btn-outline-primary flex-fill"
                      onclick="editProfile(${globalIndex})">
                <i class="bi bi-pencil"></i> Sửa
              </button>
              <button class="btn btn-sm btn-outline-danger flex-fill"
                      onclick="deleteProfile(${globalIndex})">
                <i class="bi bi-trash"></i> Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
      `;
      })
      .join("");
  }

  /**
   * Setup event listeners
   */
  function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        applyFilters();
      });
    }

    // Items per page select
    const itemsPerPageSelect = document.querySelector(
      ".d-flex.justify-content-between.align-items-center select"
    );
    if (itemsPerPageSelect) {
      itemsPerPageSelect.addEventListener("change", function () {
        itemsPerPage = parseInt(this.value);
        totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
        currentPage = 1;
        renderProfilesWithPagination();
      });
    }

    // Save profile button
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", handleSaveProfile);
    }

    // Khởi tạo custom-select-search (tìm kiếm, chọn, đóng/mở, sự kiện change)
    initSearchableSelects();
  }

  /**
   * Apply filters (search)
   */
  function applyFilters() {
    let results = [...currentProfiles];

    // Search by name or phone
    const searchInput = document.getElementById("searchInput");
    if (searchInput && searchInput.value.trim()) {
      const term = searchInput.value.trim().toLowerCase();
      results = results.filter(
        (profile) =>
          profile.name?.toLowerCase().includes(term) ||
          profile.phone_number?.includes(term)
      );
    }

    filteredProfiles = results;
    totalPages = Math.ceil(filteredProfiles.length / itemsPerPage);
    currentPage = 1; // Reset to first page when filtering
    renderProfilesWithPagination();
  }

  /**
   * Get selected value from custom select (returns text/name)
   */
  function getSelectedValue(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return "";

    const selectedOption = selectElement.querySelector(
      ".dropdown-option.selected"
    );
    if (selectedOption) {
      // Prioritize text content (name) over data-value (code)
      return (
        selectedOption.textContent.trim() ||
        selectedOption.getAttribute("data-value") ||
        ""
      );
    }

    return "";
  }

  /**
   * Get selected code from custom select (returns data-value/code)
   */
  function getSelectedCode(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement) return "";

    const selectedOption = selectElement.querySelector(
      ".dropdown-option.selected"
    );
    if (selectedOption) {
      // Return data-value (code) or fallback to text content
      return (
        selectedOption.getAttribute("data-value") ||
        selectedOption.textContent.trim() ||
        ""
      );
    }

    return "";
  }
  async function handleSaveProfile() {
    const form = document.getElementById("addProfileForm");
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const profileData = {
      name: document.getElementById("profileName").value.trim(),
      phone_number: document.getElementById("profilePhone").value.trim(),
      address: {
        province: getSelectedValue("provinceSelect"),
        district: getSelectedValue("districtSelect"),
        ward: getSelectedValue("wardSelect"),
        other: document.getElementById("profileFullAddress").value.trim(),
      },
      is_default: false,
    };

    // Check for duplicate profile (same name and phone number)
    if (!isEditing) {
      const isDuplicate = currentProfiles.some(
        (profile) =>
          profile.name === profileData.name &&
          profile.phone_number === profileData.phone_number
      );

      if (isDuplicate) {
        showError("Profile với tên và số điện thoại này đã tồn tại!");
        return;
      }
    }

    try {
      // Add or update profile using PATCH API
      const profileDataWithIndex = isEditing
        ? {
            ...profileData,
            index: editingProfileIndex,
          }
        : profileData;

      await window.UserData.updateProfile(currentUser.id, profileDataWithIndex);

      if (isEditing) {
        showSuccess("Cập nhật profile thành công!");
      } else {
        showSuccess("Thêm profile thành công!");
      }

      // Refresh data
      currentUser = await window.UserData.fetchUserById(currentUser.id);
      currentProfiles = currentUser.profiles;
      applyFilters();

      // Reset form and state
      form.reset();
      resetFormState();
    } catch (error) {
      showError("Lỗi khi lưu profile: " + error.message);
    }
  }

  /**
   * Reset form state after save
   */
  function resetFormState() {
    isEditing = false;
    editingProfileIndex = -1;
    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.textContent = "Thêm profile";

    // Reset address selects
    resetAddressSelects();
  }

  /**
   * Edit profile - DISABLED: API chỉ hỗ trợ thêm profile mới
   */
  window.editProfile = async function (index) {
    showError(
      "Chức năng chỉnh sửa profile hiện không khả dụng. API chỉ hỗ trợ thêm profile mới."
    );
    return;
  };

  /**
   * Set address selects for editing
   */
  async function setAddressSelects(address) {
    if (!address) return;

    // Wait for AddressData to be initialized and data loaded
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      if (window.AddressData) {
        const provinces = window.AddressData.getProvinces63();
        if (provinces && provinces.length > 0) {
          break; // Data is ready
        }
      }

      console.log(
        `[setAddressSelects] Waiting for AddressData... attempt ${attempts + 1}`
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error(
        "[setAddressSelects] AddressData not available after waiting"
      );
      return;
    }

    const provinceSelect = document.getElementById("provinceSelect");
    const districtSelect = document.getElementById("districtSelect");
    const wardSelect = document.getElementById("wardSelect");

    if (!provinceSelect || !districtSelect || !wardSelect) return;

    // Reset all selects first
    resetAddressSelects();

    // Find and set province
    if (address.province) {
      const provinces = window.AddressData.getProvinces63();
      if (!provinces || provinces.length === 0) {
        console.warn("[setAddressSelects] No provinces data available");
        return;
      }

      const province = provinces.find(
        (p) => p.name.trim() === address.province.trim()
      );
      if (province) {
        // Populate provinces and select the one
        window.AddressData.populateSelectOptions(
          provinceSelect,
          provinces,
          "Tỉnh/Thành phố"
        );
        const provinceOption = provinceSelect.querySelector(
          `.dropdown-option[data-value="${province.code}"]`
        );
        if (provinceOption) {
          provinceOption.classList.add("selected");
          provinceSelect.querySelector(".select-display span").textContent =
            province.name;
          provinceSelect
            .querySelector(".select-display")
            .classList.add("has-value");

          // Load and set districts
          const districts = window.AddressData.getDistricts63(province.code);
          if (districts && districts.length > 0) {
            window.AddressData.populateSelectOptions(
              districtSelect,
              districts,
              "Huyện/Quận"
            );

            if (address.district) {
              const district = districts.find(
                (d) => d.name.trim() === address.district.trim()
              );
              if (district) {
                const districtOption = districtSelect.querySelector(
                  `.dropdown-option[data-value="${district.code}"]`
                );
                if (districtOption) {
                  districtOption.classList.add("selected");
                  districtSelect.querySelector(
                    ".select-display span"
                  ).textContent = district.name;
                  districtSelect
                    .querySelector(".select-display")
                    .classList.add("has-value");

                  // Load and set wards
                  const wards = window.AddressData.getWards63(
                    province.code,
                    district.code
                  );
                  if (wards && wards.length > 0) {
                    window.AddressData.populateSelectOptions(
                      wardSelect,
                      wards,
                      "Xã/Phường"
                    );

                    if (address.ward) {
                      const ward = wards.find(
                        (w) => w.name.trim() === address.ward.trim()
                      );
                      if (ward) {
                        const wardOption = wardSelect.querySelector(
                          `.dropdown-option[data-value="${ward.code}"]`
                        );
                        if (wardOption) {
                          wardOption.classList.add("selected");
                          wardSelect.querySelector(
                            ".select-display span"
                          ).textContent = ward.name;
                          wardSelect
                            .querySelector(".select-display")
                            .classList.add("has-value");
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Reset address selects
   */
  function resetAddressSelects() {
    const provinceSelect = document.getElementById("provinceSelect");
    const districtSelect = document.getElementById("districtSelect");
    const wardSelect = document.getElementById("wardSelect");

    if (provinceSelect) {
      provinceSelect.querySelector(".select-display span").textContent =
        "Tỉnh/Thành phố";
      provinceSelect
        .querySelector(".select-display")
        .classList.remove("has-value");
      provinceSelect
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
    }

    if (districtSelect) {
      districtSelect.querySelector(".select-display span").textContent =
        "Huyện/Quận";
      districtSelect
        .querySelector(".select-display")
        .classList.remove("has-value");
      districtSelect
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
      districtSelect.querySelector(".options-container").innerHTML =
        '<div class="no-results">Vui lòng chọn Tỉnh/Thành phố trước</div>';
    }

    if (wardSelect) {
      wardSelect.querySelector(".select-display span").textContent =
        "Xã/Phường";
      wardSelect.querySelector(".select-display").classList.remove("has-value");
      wardSelect
        .querySelectorAll(".dropdown-option")
        .forEach((opt) => opt.classList.remove("selected"));
      wardSelect.querySelector(".options-container").innerHTML =
        '<div class="no-results">Vui lòng chọn Huyện/Quận trước</div>';
    }
  }

  /**
   * Delete profile
   */
  window.deleteProfile = async function (index) {
    if (index < 0 || index >= currentProfiles.length) {
      showError("Index profile không hợp lệ.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa profile này?")) {
      return;
    }
    try {
      if (
        !window.UserData ||
        typeof window.UserData.deleteProfile !== "function"
      ) {
        throw new Error("UserData.deleteProfile không khả dụng");
      }

      await window.UserData.deleteProfile(currentUser.id, index);

      // Refresh data
      currentUser = await window.UserData.fetchUserById(currentUser.id);
      currentProfiles = currentUser.profiles;
      applyFilters();

      showSuccess("Xóa profile thành công");
    } catch (err) {
      showError(
        "Lỗi khi xóa profile: " + (err && err.message ? err.message : err)
      );
    }
  };

  /**
   * Khởi tạo custom-select-search: tìm kiếm, chọn, đóng/mở, sự kiện change
   */
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
          optionsContainer
            .querySelectorAll(".dropdown-option")
            .forEach((opt) => {
              opt.classList.remove("selected");
            });
          e.target.classList.add("selected");
          const selectedText = e.target.textContent;
          const displaySpan = display.querySelector("span");
          if (displaySpan) {
            displaySpan.textContent = selectedText;
            display.classList.add("has-value");
          }
          searchInput.value = "";
          optionsContainer
            .querySelectorAll(".dropdown-option")
            .forEach((opt) => {
              opt.style.display = "block";
            });
          if (noResults) noResults.style.display = "none";
          dropdown.classList.remove("show");
          display.classList.remove("active");
          // Trigger change event for cascading selects
          const changeEvent = new CustomEvent("change", {
            detail: {
              value: e.target.getAttribute("data-value"),
              text: selectedText,
              selectId: selectElement.id,
            },
          });
          selectElement.dispatchEvent(changeEvent);
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

  /**
   * Utility: Escape HTML
   */
  function escapeHtml(text) {
    if (typeof text !== "string") {
      text = String(text ?? "");
    }
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    // Simple alert for now - can be replaced with toast notification
    alert("✅ " + message);
  }

  /**
   * Show error message
   */
  function showError(message) {
    alert("❌ " + message);
  }

  /**
   * Edit profile
   */
  window.editProfile = async function (index) {
    console.log("Edit profile at index:", index);
    isEditing = true;
    editingProfileIndex = index;

    const profileToEdit = currentProfiles[index];
    if (!profileToEdit) {
      showError("Không tìm thấy profile để sửa");
      return;
    }

    // Populate form with existing data
    document.getElementById("profileName").value = profileToEdit.name || "";
    document.getElementById("profilePhone").value =
      profileToEdit.phone_number || "";
    document.getElementById("profileFullAddress").value =
      profileToEdit.address?.other || "";

    // Ensure AddressData is ready before setting address selects
    if (!window.AddressData) {
      console.warn("[editProfile] AddressData not available, initializing...");
      // Try to initialize if not already done
      if (window.AddressData) {
        await window.AddressData.init();
      } else {
        showError("AddressData không khả dụng");
        return;
      }
    }

    // Set address selects with existing data (async)
    await setAddressSelects(profileToEdit.address);

    // Change button text
    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.textContent = "Cập nhật profile";
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Also load provinces when modal opens
  window.addEventListener("DOMContentLoaded", function () {
    const modalEl = document.getElementById("addProfileModal");
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", function () {
        console.log("[DEBUG] Sự kiện shown.bs.modal được kích hoạt");
        // Reset form when modal opens
        resetFormState();
      });
      console.log(
        "[DEBUG] Đã gán sự kiện shown.bs.modal cho modal addProfileModal"
      );
    } else {
      console.log("[DEBUG] Không tìm thấy modal với id addProfileModal");
    }
  });
})();
