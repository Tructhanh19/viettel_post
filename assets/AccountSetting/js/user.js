/**
 * User INFO CONTROLLER
 * Manages user information UI with MongoDB integration
 */

(function () {
  "use strict";

  let currentUsers = [];
  let filteredUsers = [];
  let currentUser = null;
  let isEditing = false;
  let editingUserId = null;
  let editingProfileIndex = -1;

  /**
   * Initialize the user info page
   */
  async function init() {
    console.log("🎬 Initializing user Info page...");

    // Initialize UserData module
    if (!window.UserData) {
      console.error("❌ UserData module not loaded");
      return;
    }

    // Load data from MongoDB
    // 📝 Lấy user ID từ token hoặc session
    const userId = window.API_CONFIG.getUserId(); // hoặc decode token

    try {
      const user = await window.UserData.fetchUserById(userId);
      if (!user || !user.profiles || user.profiles.length === 0) {
        showError("❌ Không có địa chỉ gửi nào");
        return;
      }

      currentUsers = [user]; // vì chỉ có 1 user
      filteredUsers = [...currentUsers];

      // Render profile list của user này
      renderUsers(filteredUsers);
    } catch (error) {
      showError("Không thể tải thông tin người gửi: " + error.message);
    }

    // Render Users
    renderUsers(filteredUsers);

    // Setup event listeners
    setupEventListeners();

    // Khởi tạo AddressData và cascading custom-select-search
    if (window.AddressData) {
      await window.AddressData.init();
      window.AddressData.setupAddressCascading();
    }

    console.log("✅ user Info page initialized");
  }

  /**
   * Render user cards
   */
  function renderUsers(users) {
    const container = document.getElementById("user-list");
    if (!container) return;

    // Gom tất cả profile của tất cả user thành 1 mảng
    let allProfiles = [];
    users.forEach((user) => {
      if (Array.isArray(user.profiles)) {
        user.profiles.forEach((profile, index) => {
          allProfiles.push({
            ...profile,
            userId: user._id || user.id,
            profileIndex: index,
          });
        });
      }
    });

    if (allProfiles.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-inbox" style="font-size: 3rem; color: #ccc;"></i>
          <p class="text-muted mt-3">Không có địa chỉ gửi nào</p>
        </div>
      `;
      return;
    }

    container.innerHTML = allProfiles
      .map((profile) => {
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
            profile.is_default ? "bg-light border-danger" : ""
          }">
            <div class="card-body">
              <div><strong>${escapeHtml(profile.name || "N/A")}</strong></div>
              <small class="text-muted">${escapeHtml(
                profile.phone_number || ""
              )}</small>
              <div class="mt-2">
                <small class="text-muted"><i class="bi bi-geo-alt text-danger"></i> ${addressText}</small>
                ${
                  profile.is_default
                    ? '<span class="badge bg-danger ms-2">Mặc định</span>'
                    : ""
                }
              </div>
              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-sm btn-outline-primary flex-fill" onclick="editUser('${
                  profile.userId
                }', ${profile.profileIndex})">
                  <i class="bi bi-pencil"></i> Sửa
                </button>
                <button class="btn btn-sm btn-outline-danger flex-fill" onclick="deleteUser('${
                  profile.userId
                }', ${profile.profileIndex})">
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
    // Status filter
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", function () {
        applyFilters();
      });
    }

    // Search input
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        applyFilters();
      });
    }

    // Save user button
    const saveProfileBtn = document.getElementById("saveProfileBtn");
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener("click", function (e) {
        e.preventDefault(); // ✅ prevent form reload
        handleSaveUser();
      });
    }

    // Khởi tạo custom-select-search (tìm kiếm, chọn, đóng/mở, sự kiện change)
    initSearchableSelects();
  }

  /**
   * Apply filters (status + search)
   */
  function applyFilters() {
    let results = [...currentUsers];

    // Filter by status
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter && statusFilter.value) {
      results = window.UserData.filterByStatus(statusFilter.value);
    }

    // Search by name or phone
    const searchInput = document.getElementById("searchInput");
    if (searchInput && searchInput.value.trim()) {
      results = window.UserData.searchUsers(searchInput.value.trim());
    }

    filteredUsers = results;
    renderUsers(filteredUsers);
  }

  /**
   * Handle save user
   */
  async function handleSaveUser() {
    const form = document.getElementById("addUserForm");
    if (!form || !form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const userData = {
      name: document.getElementById("profileName").value.trim(),
      phone_number: document.getElementById("profilePhoneNumber").value.trim(),
      address: {
        province: getSelectedValue("provinceSelect"),
        district: getSelectedValue("districtSelect"),
        ward: getSelectedValue("wardSelect"),
        other: document.getElementById("userFullAddress").value.trim(),
      },
      is_default: false,
    };

    // Check for duplicate profile (same name and phone number)
    if (!isEditing) {
      const isDuplicate = currentUsers.some(
        (user) =>
          user.profiles &&
          user.profiles.some(
            (profile) =>
              profile.name === userData.name &&
              profile.phone_number === userData.phone_number
          )
      );

      if (isDuplicate) {
        showError("Địa chỉ với tên và số điện thoại này đã tồn tại!");
        return;
      }
    }

    try {
      if (isEditing) {
        // Update existing profile
        const profileDataWithIndex = {
          ...userData,
          index: editingProfileIndex,
        };
        await window.UserData.updateProfile(
          editingUserId,
          profileDataWithIndex
        );
        showSuccess("Cập nhật địa chỉ thành công!");
      } else {
        // Add new profile
        await window.UserData.updateProfile(editingUserId, userData);
        showSuccess("Thêm địa chỉ thành công!");
      }

      // Refresh data
      const userId = window.API_CONFIG.getUserId();
      const user = await window.UserData.fetchUserById(userId);
      currentUsers = [user];
      applyFilters();

      // Reset form and state
      form.reset();
      resetFormState();
    } catch (error) {
      showError("Lỗi khi lưu địa chỉ: " + error.message);
    }
  }

  /**
   * Reset form state after save
   */
  function resetFormState() {
    isEditing = false;
    editingUserId = null;
    editingProfileIndex = -1;
    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.textContent = "Thêm địa chỉ";
  }

  /**
   * Edit User Profile
   */
  window.editUser = function (userId, profileIndex) {
    console.log("Edit user profile:", userId, "index:", profileIndex);
    isEditing = true;
    editingUserId = userId;
    editingProfileIndex = profileIndex;

    // Find the user
    const user = currentUsers.find((u) => u.id === userId || u._id === userId);
    if (!user || !user.profiles || user.profiles.length <= profileIndex) {
      showError("Không tìm thấy thông tin người dùng hoặc profile");
      return;
    }

    const profileToEdit = user.profiles[profileIndex];

    // Populate form with existing data
    document.getElementById("profileName").value = profileToEdit.name || "";
    document.getElementById("profilePhoneNumber").value =
      profileToEdit.phone_number || "";
    document.getElementById("userFullAddress").value =
      profileToEdit.address?.other || "";

    // Set address selects
    if (window.AddressData && profileToEdit.address) {
      // This would need to be implemented based on how AddressData works
      // For now, we'll assume the selects are set manually or via a function
    }

    // Change button text
    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.textContent = "Cập nhật địa chỉ";
  };

  /**
   * Delete User Profile
   */
  window.deleteUser = async function (userId, profileIndex) {
    if (!userId) {
      showError("ID không hợp lệ.");
      return;
    }
    if (!confirm("Bạn có chắc muốn xóa địa chỉ này?")) {
      return;
    }
    try {
      if (
        !window.UserData ||
        typeof window.UserData.deleteProfile !== "function"
      ) {
        throw new Error("UserData.deleteProfile không khả dụng");
      }

      // Find the user
      const user = currentUsers.find(
        (u) => u.id === userId || u._id === userId
      );
      if (!user || !user.profiles || user.profiles.length <= profileIndex) {
        showError("Không tìm thấy thông tin người dùng hoặc profile");
        return;
      }

      await window.UserData.deleteProfile(userId, profileIndex);

      // Refresh data
      const refreshedUserId = window.API_CONFIG.getUserId();
      const refreshedUser = await window.UserData.fetchUserById(
        refreshedUserId
      );
      currentUsers = [refreshedUser];
      applyFilters();

      showSuccess("Xóa địa chỉ thành công");
    } catch (err) {
      showError(
        "Lỗi khi xóa địa chỉ: " + (err && err.message ? err.message : err)
      );
    }
  };

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
   * Load districts
   */
  async function loadDistricts(provinceCode) {
    if (!window.AddressData || !provinceCode) return;
    const districts = window.AddressData.getDistricts63(provinceCode);
    console.log("[DEBUG] Load districts for province", provinceCode, districts);
    const select = document.getElementById("userDistrict");
    if (select) {
      select.innerHTML =
        '<option value="">Huyện/Quận</option>' +
        districts
          .map((d) => `<option value="${d.code}">${d.name}</option>`)
          .join("");
    }
    // Reset wards
    const wardSelect = document.getElementById("userWard");
    if (wardSelect) {
      wardSelect.innerHTML = '<option value="">Xã/Phường</option>';
    }
  }

  /**
   * Load wards
   */
  async function loadWards(provinceCode, districtCode) {
    if (!window.AddressData) {
      console.warn("[DEBUG] window.AddressData chưa tồn tại");
      return;
    }
    if (!provinceCode) {
      console.warn("[DEBUG] provinceCode rỗng");
      return;
    }
    if (!districtCode) {
      console.warn("[DEBUG] districtCode rỗng");
      return;
    }
    const wards = window.AddressData.getWards63(provinceCode, districtCode);
    console.log(
      "[DEBUG] Load wards for province:",
      provinceCode,
      "| district:",
      districtCode,
      "| wards:",
      wards
    );
    const select = document.getElementById("userWard");
    if (select) {
      if (Array.isArray(wards) && wards.length > 0) {
        select.innerHTML =
          '<option value="">Xã/Phường</option>' +
          wards
            .map((w) => `<option value="${w.code}">${w.name}</option>`)
            .join("");
        console.log(
          "[DEBUG] Đã render dropdown xã/phường, số lượng:",
          wards.length
        );
      } else {
        select.innerHTML =
          '<option value="">Không có dữ liệu xã/phường</option>';
        console.warn(
          "[DEBUG] Không có dữ liệu xã/phường cho",
          provinceCode,
          districtCode
        );
      }
    } else {
      console.warn("[DEBUG] Không tìm thấy select userWard");
    }
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

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // // Also load provinces when modal opens
  // window.addEventListener('DOMContentLoaded', function() {
  //   const modalEl = document.getElementById('addUserModal');
  //   if (modalEl) {
  //     modalEl.addEventListener('shown.bs.modal', function() {
  //       console.log('[DEBUG] Sự kiện shown.bs.modal được kích hoạt');
  //       loadProvinces();
  //     });
  //     console.log('[DEBUG] Đã gán sự kiện shown.bs.modal cho modal addUserModal');
  //   } else {
  //     console.log('[DEBUG] Không tìm thấy modal với id addUserModal');
  //   }
  // });
})();
