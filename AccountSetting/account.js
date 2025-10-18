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
 */
const renderProvinces = async (selectedProvinceName = "") => {
  const citySelect = document.getElementById("city");
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
 */
const renderDistricts = async (provinceCode, selectedDistrictName = "") => {
  const districtSelect = document.getElementById("district");
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
 */
const renderWards = async (districtCode, selectedWardName = "") => {
  const wardSelect = document.getElementById("ward");
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
