document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".menu-link");
  const content = document.getElementById("accountContent");

  // Khi click vào menu
  links.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault(); // ❌ Ngăn load trang

      const url = link.getAttribute("href");

      try {
        // 🟢 Dùng fetch để tải file HTML con
        const response = await fetch(url);
        if (!response.ok) throw new Error("Không thể tải nội dung");
        const html = await response.text();

        // 🧩 Thay nội dung vào khu vực content
        content.innerHTML = html;

        // 🎨 Highlight menu đang chọn
        links.forEach((l) => l.parentElement.classList.remove("active"));
        link.parentElement.classList.add("active");
      } catch (error) {
        content.innerHTML = `<p class="text-danger">Lỗi tải nội dung: ${error.message}</p>`;
      }
    });
  });

  // Tự động load mục đầu tiên khi vào trang
  if (links.length > 0) {
    links[0].click();
  }
});

/**
 * API Host cho việc lấy dữ liệu địa chỉ hành chính Việt Nam.
 */
const ADDRESS_API_HOST = "https://provinces.open-api.vn/api/";

/**
 * Hàm gọi API chung, hỗ trợ JSON và các phương thức khác.
 * @param {string} url - URL đầy đủ của API cần gọi.
 * @param {object} options - (Tùy chọn) Các tùy chọn cho fetch (method, headers, body).
 * @returns {Promise<any>}
 */
const callApi = (url, options = {}) => {
  return fetch(url, options).then((response) => {
    if (!response.ok) {
      return response.json().then((err) => {
        throw new Error(err.message || "Lỗi không xác định");
      });
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    return response.text();
  });
};

/**
 * Hiển thị danh sách tỉnh/thành phố ra dropdown.
 * @param {string} selectedProvinceName - (Tùy chọn) Tên tỉnh cần được chọn sẵn.
 * @param {string} selectId - ID của select element (mặc định 'city').
 */
const renderProvinces = async (
  selectedProvinceName = "",
  selectId = "city"
) => {
  const citySelect = document.getElementById(selectId);
  if (!citySelect) return;
  try {
    const provinces = await callApi(ADDRESS_API_HOST + "?depth=1");
    let html = "<option value=''>Chọn Tỉnh/Thành phố</option>";
    provinces.forEach((province) => {
      const isSelected =
        province.name === selectedProvinceName ? "selected" : "";
      html += `<option value='${province.code}' ${isSelected}>${province.name}</option>`;
    });
    citySelect.innerHTML = html;
  } catch (error) {
    console.error("Lỗi khi tải danh sách tỉnh/thành:", error);
  }
};

/**
 * Hiển thị danh sách quận/huyện ra dropdown.
 * @param {string} provinceCode - Mã của tỉnh/thành phố.
 * @param {string} selectedDistrictName - (Tùy chọn) Tên quận/huyện cần được chọn sẵn.
 * @param {string} selectId - ID của select element (mặc định 'district').
 */
const renderDistricts = async (
  provinceCode,
  selectedDistrictName = "",
  selectId = "district"
) => {
  const districtSelect = document.getElementById(selectId);
  if (!districtSelect) return;
  try {
    const provinceData = await callApi(
      `${ADDRESS_API_HOST}p/${provinceCode}?depth=2`
    );
    let html = "<option value=''>Chọn Quận/Huyện</option>";
    provinceData.districts.forEach((district) => {
      const isSelected =
        district.name === selectedDistrictName ? "selected" : "";
      html += `<option value='${district.code}' ${isSelected}>${district.name}</option>`;
    });
    districtSelect.innerHTML = html;
  } catch (error) {
    console.error("Lỗi khi tải danh sách quận/huyện:", error);
  }
};

/**
 * Hiển thị danh sách phường/xã ra dropdown.
 * @param {string} districtCode - Mã của quận/huyện.
 * @param {string} selectedWardName - (Tùy chọn) Tên phường/xã cần được chọn sẵn.
 * @param {string} selectId - ID của select element (mặc định 'ward').
 */
const renderWards = async (
  districtCode,
  selectedWardName = "",
  selectId = "ward"
) => {
  const wardSelect = document.getElementById(selectId);
  if (!wardSelect) return;
  try {
    const districtData = await callApi(
      `${ADDRESS_API_HOST}d/${districtCode}?depth=2`
    );
    let html = "<option value=''>Chọn Phường/Xã</option>";
    districtData.wards.forEach((ward) => {
      const isSelected = ward.name === selectedWardName ? "selected" : "";
      html += `<option value='${ward.code}' ${isSelected}>${ward.name}</option>`;
    });
    wardSelect.innerHTML = html;
  } catch (error) {
    console.error("Lỗi khi tải danh sách phường/xã:", error);
  }
};

/**
 * Thiết lập các sự kiện 'change' cho các dropdown địa chỉ để tạo hiệu ứng nối tiếp.
 */
const setupAddressEvents = () => {
  const citySelect = document.getElementById("city");
  const districtSelect = document.getElementById("district");
  const wardSelect = document.getElementById("ward");
  if (!citySelect || !districtSelect || !wardSelect) return;
  citySelect.addEventListener("change", () => {
    if (citySelect.value) renderDistricts(citySelect.value);
    wardSelect.innerHTML = "<option value=''>Chọn Phường/Xã</option>";
  });
  districtSelect.addEventListener("change", () => {
    if (districtSelect.value) renderWards(districtSelect.value);
  });
};

/**
 * Hàm fetch thông tin người dùng và điền vào biểu mẫu.
 */
async function loadAccountDetails() {
  // Lấy userId từ localStorage (giả sử được lưu khi login)
  const userId = "60d21b4667d0d8992e610a02";
  // const userId = localStorage.getItem("userId"); // Fallback nếu không có
  const userApiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;
  try {
    const data = await callApi(userApiUrl);
    if (data.code === 10000 && data.result) {
      const userData = data.result;
      const userAddress = userData.address || {};
      document.getElementById("customerName").value = userData.name || "";
      document.getElementById("email").value = userData.email || "";
      document.getElementById("phone").value = userData.phoneNumber || "";
      document.getElementById("taxId").value = userData.taxId || "";
      document.getElementById("street").value = userAddress.other || "";
      document.getElementById("address").value = userAddress.other || "";
      await renderProvinces(userAddress.province);
      const citySelect = document.getElementById("city");
      if (citySelect.value) {
        await renderDistricts(citySelect.value, userAddress.district);
      }
      const districtSelect = document.getElementById("district");
      if (districtSelect.value) {
        await renderWards(districtSelect.value, userAddress.ward);
      }
    } else {
      console.error("API người dùng trả về lỗi:", data.message);
    }
  } catch (error) {
    console.error("Lỗi khi gọi API người dùng:", error);
    alert("Không thể tải dữ liệu người dùng. Vui lòng kiểm tra lại API.");
  }
}

/**
 * Thu thập dữ liệu từ form và gửi yêu cầu UPDATE lên API.
 * @param {Event} event - Sự kiện submit của form.
 */
async function handleUpdateUser(event) {
  event.preventDefault();
  // Lấy userId từ localStorage (giả sử được lưu khi login)
  const userId = "60d21b4667d0d8992e610a02";
  // const userId = localStorage.getItem("userId"); // Fallback nếu không có
  const updateUserApiUrl = `http://localhost:8585/api/v1/users/update/${userId}`;
  const citySelect = document.getElementById("city");
  const districtSelect = document.getElementById("district");
  const wardSelect = document.getElementById("ward");
  const updatedData = {
    name: document.getElementById("customerName").value,
    email: document.getElementById("email").value,
    phoneNumber: document.getElementById("phone").value,
    taxId: document.getElementById("taxId").value,
    address: {
      province: citySelect.options[citySelect.selectedIndex]?.text || "",
      district:
        districtSelect.options[districtSelect.selectedIndex]?.text || "",
      ward: wardSelect.options[wardSelect.selectedIndex]?.text || "",
      other: document.getElementById("street").value,
    },
  };
  console.log("Dữ liệu gửi đi:", JSON.stringify(updatedData, null, 2));
  try {
    const response = await callApi(updateUserApiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedData),
    });
    alert("Cập nhật thông tin thành công!");
    console.log("Phản hồi từ server:", response);
  } catch (error) {
    console.error("Lỗi khi cập nhật thông tin:", error);
    alert(`Có lỗi xảy ra khi cập nhật: ${error.message}`);
  }
}

/**
 * Gắn sự kiện 'submit' cho form để gọi hàm handleUpdateUser.
 */
const setupSaveButtonEvent = () => {
  const userForm = document.querySelector(".container form");
  if (userForm) {
    userForm.addEventListener("submit", handleUpdateUser);
  }
};

/**
 * Xử lý đổi mật khẩu.
 * @param {Event} event - Sự kiện submit của form.
 */
async function handleChangePassword(event) {
  event.preventDefault();
  const currentPassword = document.getElementById("currentPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Validate
  if (!currentPassword || !newPassword || !confirmPassword) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return;
  }
  if (newPassword !== confirmPassword) {
    alert("Mật khẩu mới và xác nhận không khớp.");
    return;
  }
  if (newPassword.length < 6) {
    alert("Mật khẩu mới phải ít nhất 6 ký tự.");
    return;
  }

  // Lấy userId
  const userId = "60d21b4667d0d8992e610a02"; // Hoặc localStorage.getItem("userId")
  const changePasswordApiUrl = `http://localhost:8585/api/v1/users/update/${userId}/password`;

  try {
    const response = await callApi(changePasswordApiUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldPassword: currentPassword,
        newPassword: newPassword,
      }),
    });
    alert("Đổi mật khẩu thành công!");
    // Reset form
    document.getElementById("changePasswordForm").reset();
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    alert(`Có lỗi xảy ra khi đổi mật khẩu: ${error.message}`);
  }
}

/**
 * Gắn sự kiện 'submit' cho form đổi mật khẩu.
 */
const setupChangePasswordEvent = () => {
  const changePasswordForm = document.getElementById("changePasswordForm");
  if (changePasswordForm) {
    changePasswordForm.addEventListener("submit", handleChangePassword);
  }
};

/**
 * Hàm khởi tạo cho trang accountDetail.html
 * Có thể được gọi từ DOMContentLoaded hoặc từ bên ngoài sau khi load qua AJAX
 */
async function initAccountPage() {
  if (document.getElementById("customerName")) {
    await loadAccountDetails(); // 1. Điền dữ liệu
    setupAddressEvents(); // 2. Gắn sự kiện cho dropdown
    setupSaveButtonEvent(); // 3. Gắn sự kiện cho nút "Lưu"
  }

  if (document.getElementById("changePasswordForm")) {
    setupChangePasswordEvent(); // Gắn sự kiện cho form đổi mật khẩu
  }

  if (document.getElementById("addStaffModal")) {
    initStaffManagerLogic(); // Khởi tạo logic quản lý nhân viên
  }
}

// Expose hàm initAccountPage ra global để có thể gọi từ assets/script.js
window.initAccountPage = initAccountPage;

// -----------------------------------------------------------------------------
// KHỐI LOGIC CHÍNH: CHỈ CÓ MỘT DOMCONTENTLOADED
// -----------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const sidebarLinks = document.querySelectorAll(".account-menu .menu-link");
  const contentArea = document.getElementById("accountContent");

  if (!sidebarLinks.length || !contentArea) {
    // Trường hợp chạy trực tiếp file accountDetail.html hoặc changePassword.html
    initAccountPage();

    return;
  }

  const loadContent = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      contentArea.innerHTML = await response.text();

      // QUAN TRỌNG: Sau khi tải HTML, mới gọi các hàm để thêm chức năng
      if (url.includes("accountDetail.html")) {
        await loadAccountDetails(); // 1. Điền dữ liệu
        setupAddressEvents(); // 2. Gắn sự kiện cho dropdown
        setupSaveButtonEvent(); // 3. Gắn sự kiện cho nút "Lưu" (cho form)
      }
    } catch (error) {
      contentArea.innerHTML = `<p class="text-danger">Lỗi tải nội dung: ${error.message}</p>`;
    }
  };

  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const url = link.getAttribute("href");
      sidebarLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      loadContent(url);
    });
  });

  // Tự động tải mục đầu tiên khi vào trang
  if (sidebarLinks.length > 0) {
    sidebarLinks[0].click();
  }
});

// Thêm nhân viên và gán leader
async function handleAddStaff() {
  const modal = document.getElementById("addStaffModal");
  const emailOrPhoneInput = modal.querySelector("#staffEmailPhone");
  const staffId = emailOrPhoneInput.value.trim();

  const leaderId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01"; // User đang đăng nhập

  if (!staffId) {
    return alert("Vui lòng nhập ID của nhân viên.");
  }

  try {
    // Tìm user bằng id
    const findUrl = `http://localhost:8585/api/v1/users/find?id=${encodeURIComponent(
      staffId
    )}`;

    const findResponse = await callApi(findUrl);
    if (!findResponse || findResponse.code !== 10000 || !findResponse.result) {
      throw new Error("Không tìm thấy nhân viên với ID đã nhập.");
    }

    // Gọi API update leader
    const updateUrl = `http://localhost:8585/api/v1/users/update/${staffId}/leader/${leaderId}`;
    const updateResponse = await callApi(updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}), // Có thể không cần body
    });

    alert("Thêm nhân viên và gán cấp trên thành công!");

    // Đóng modal và reset form
    const modalInstance = bootstrap.Modal.getInstance(modal);
    modalInstance.hide();
    emailOrPhoneInput.value = "";

    // Tải lại danh sách nhân viên
    loadStaffList();
  } catch (error) {
    alert(`Lỗi: ${error.message}`);
  }
}

/**
 * Khởi tạo logic cho trang quản lý nhân viên
 */
const initStaffManagerLogic = () => {
  const addStaffModal = document.getElementById("addStaffModal");
  if (addStaffModal) {
    const confirmButton = addStaffModal.querySelector(
      ".modal-footer .btn-danger"
    );
    if (confirmButton) {
      confirmButton.addEventListener("click", handleAddStaff);
    }
  }

  // Load danh sách nhân viên và cấp trên
  loadStaffList();
  loadLeaderInfo();

  // Add event listener for status filter
  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", filterStaffList);
  }
};

/**
 * Filter danh sách nhân viên theo trạng thái
 */
function filterStaffList() {
  const statusFilter = document.getElementById("statusFilter").value;
  let filtered = window.allStaffList || [];
  if (statusFilter === "active") {
    filtered = filtered.filter((s) => s.active);
  } else if (statusFilter === "inactive") {
    filtered = filtered.filter((s) => !s.active);
  }

  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">Không có nhân viên nào.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .map((staff) => {
      const address = staff.address
        ? `${staff.address.other}, ${staff.address.ward}, ${staff.address.district}, ${staff.address.province}`
        : "";
      const createdDate = staff.createdDate
        ? new Date(staff.createdDate).toLocaleDateString("vi-VN")
        : "";
      const status = staff.active
        ? '<span class="badge bg-success">Đang hoạt động</span>'
        : '<span class="badge bg-danger">Ngừng hoạt động</span>';
      const roles = staff.roles
        ? staff.roles.map((r) => r.name).join(", ")
        : "Nhân viên";

      return `
      <tr data-id="${staff.id}">
        <td>${staff.name || staff.username}</td>
        <td>${staff.email || ""}</td>
        <td>${staff.phoneNumber || ""}</td>
        <td>${roles}</td>
        <td>${address}</td>
        <td>${createdDate}</td>
        <td>${status}</td>
        <td>
          
          <i class="bi bi-trash text-danger" style="cursor: pointer"></i>
        </td>
      </tr>
    `;
    })
    .join("");

  // Add event listeners for delete buttons
  tbody.addEventListener("click", (e) => {
    if (e.target.classList.contains("bi-trash")) {
      const row = e.target.closest("tr");
      const staffId = row.dataset.id;
      if (confirm("Bạn có chắc muốn xóa nhân viên này khỏi danh sách?")) {
        handleDeleteStaff(staffId);
      }
    }
  });
}

/**
 * Load danh sách nhân viên dưới quyền
 */
async function loadStaffList() {
  const userId = "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/get-all`;

  try {
    const response = await callApi(apiUrl);
    console.log("Response from get-all:", response);
    if (response.code === 10000 && response.result) {
      // Filter users where leader_id matches current userId
      const allUsers = Array.isArray(response.result)
        ? response.result
        : [response.result];
      console.log("All users:", allUsers);
      const staffList = allUsers.filter((user) => user.leaderId === userId);
      window.allStaffList = staffList;
      filterStaffList();
      console.log("Filtered staff list:", staffList);
      console.log("Current userId:", userId);
      const tbody = document.getElementById("staffTableBody");
      if (!tbody) return;

      if (staffList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Không có nhân viên nào.</td></tr>`;
        return;
      }

      tbody.innerHTML = staffList
        .map((staff) => {
          const address = staff.address
            ? `${staff.address.other}, ${staff.address.ward}, ${staff.address.district}, ${staff.address.province}`
            : "";
          const createdDate = staff.createdDate
            ? new Date(staff.createdDate).toLocaleDateString("vi-VN")
            : "";
          const status = staff.active
            ? '<span class="badge bg-success">Đang hoạt động</span>'
            : '<span class="badge bg-danger">Ngừng hoạt động</span>';
          const roles = staff.roles
            ? staff.roles.map((r) => r.name).join(", ")
            : "Nhân viên";

          return `
          <tr data-id="${staff.id}">
            <td>${staff.name || staff.username}</td>
            <td>${staff.email || ""}</td>
            <td>${staff.phoneNumber || ""}</td>
            <td>${roles}</td>
            <td>${address}</td>
            <td>${createdDate}</td>
            <td>${status}</td>
            <td>
              
              <i class="bi bi-trash text-danger" style="cursor: pointer"></i>
            </td>
          </tr>
        `;
        })
        .join("");

      // Add event listeners for delete buttons
      tbody.addEventListener("click", (e) => {
        if (e.target.classList.contains("bi-trash")) {
          const row = e.target.closest("tr");
          const staffId = row.dataset.id;
          if (confirm("Bạn có chắc muốn xóa nhân viên này khỏi danh sách?")) {
            handleDeleteStaff(staffId);
          }
        }
      });
    } else {
      document.getElementById(
        "staffTableBody"
      ).innerHTML = `<tr><td colspan="8" class="text-center">Không thể tải danh sách nhân viên.</td></tr>`;
    }
  } catch (error) {
    console.error("Lỗi khi tải danh sách nhân viên:", error);
    document.getElementById(
      "staffTableBody"
    ).innerHTML = `<tr><td colspan="8" class="text-center">Lỗi tải dữ liệu.</td></tr>`;
  }
}

/**
 * Xóa nhân viên khỏi danh sách dưới quyền (set leaderId thành null)
 */
async function handleDeleteStaff(staffId) {
  const updateUrl = `http://localhost:8585/api/v1/users/update/${staffId}`;
  try {
    const response = await callApi(updateUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leader_id: null }),
    });
    alert("Xóa nhân viên thành công!");
    loadStaffList(); // Tải lại danh sách
  } catch (error) {
    alert(`Lỗi khi xóa nhân viên: ${error.message}`);
  }
}

/**
 * Load thông tin cấp trên
 */
async function loadLeaderInfo() {
  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const userApiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;

  try {
    const response = await callApi(userApiUrl);
    if (response.code === 10000 && response.result) {
      const user = response.result;
      const leaderId = user.leaderId;
      if (!leaderId) {
        document.getElementById(
          "leaderTableBody"
        ).innerHTML = `<tr><td colspan="5" class="text-center">Không có cấp trên.</td></tr>`;
        return;
      }

      const leaderApiUrl = `http://localhost:8585/api/v1/users/find?id=${leaderId}`;
      const leaderResponse = await callApi(leaderApiUrl);
      if (leaderResponse.code === 10000 && leaderResponse.result) {
        const leader = leaderResponse.result;
        const address = leader.address
          ? `${leader.address.other}, ${leader.address.ward}, ${leader.address.district}, ${leader.address.province}`
          : "";
        document.getElementById("leaderTableBody").innerHTML = `
          <tr>
            <td>${leader.name || leader.username}</td>
            <td>${leader.phoneNumber || ""}</td>
            <td>${leader.email || ""}</td>
            <td>${address}</td>
            <td></td>
          </tr>
        `;
      } else {
        document.getElementById(
          "leaderTableBody"
        ).innerHTML = `<tr><td colspan="5" class="text-center">Không thể tải thông tin cấp trên.</td></tr>`;
      }
    }
  } catch (error) {
    console.error("Lỗi khi tải thông tin cấp trên:", error);
    document.getElementById(
      "leaderTableBody"
    ).innerHTML = `<tr><td colspan="5" class="text-center">Lỗi tải dữ liệu.</td></tr>`;
  }
}
