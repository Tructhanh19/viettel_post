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
 * Load profiles của user và hiển thị danh sách người gửi.
 */
async function loadProfiles() {
  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;
  console.log("Loading profiles for userId:", userId);
  console.log("API URL:", apiUrl);

  try {
    const response = await callApi(apiUrl);
    console.log("Load profiles response:", response);
    if (response.code === 10000 && response.result) {
      const profiles = response.result.profiles || [];
      console.log("Loaded profiles:", profiles);
      displayProfiles(profiles);
    } else {
      console.error("Lỗi tải profiles:", response.message);
      document.getElementById("sender-list").innerHTML =
        "<p>Lỗi tải dữ liệu.</p>";
    }
  } catch (error) {
    console.error("Lỗi khi tải profiles:", error);
    document.getElementById(
      "sender-list"
    ).innerHTML = `<p>Lỗi tải dữ liệu: ${error.message}</p>`;
  }
}

/**
 * Hiển thị danh sách profiles dưới dạng cards.
 * @param {Array} profiles - Danh sách profiles.
 */
function displayProfiles(profiles) {
  const container = document.getElementById("sender-list");
  if (profiles.length === 0) {
    container.innerHTML = "<p>Chưa có người gửi nào.</p>";
    return;
  }

  container.innerHTML = profiles
    .map(
      (profile, index) => `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="card sender-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-title mb-0">${profile.name}</h6>
            ${
              profile.default
                ? '<span class="badge bg-primary">Mặc định</span>'
                : ""
            }
          </div>
          <p class="card-text mb-1"><i class="bi bi-telephone"></i> ${
            profile.phoneNumber
          }</p>
          <p class="card-text mb-2"><i class="bi bi-geo-alt"></i> ${
            profile.address.other
          }, ${profile.address.ward}, ${profile.address.district}, ${
        profile.address.province
      }</p>
          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-outline-danger" onclick="deleteProfile(${index})">Xóa</button>
          </div>
        </div>
      </div>
    </div>
  `
    )
    .join("");
}

/**
 * Thêm profile mới.
 */
async function addProfile(event) {
  event.preventDefault();
  const name = document.getElementById("senderName").value.trim();
  const phoneNumber = document.getElementById("senderPhone").value.trim();
  const province = document
    .getElementById("provinceSelect")
    .querySelector(".select-display")
    .textContent.trim();
  const district = document
    .getElementById("districtSelect")
    .querySelector(".select-display")
    .textContent.trim();
  const ward = document
    .getElementById("wardSelect")
    .querySelector(".select-display")
    .textContent.trim();
  const other = document.getElementById("senderFullAddress").value.trim();

  if (!name || !phoneNumber || !province || !district || !ward || !other) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  console.log("UserId:", userId);
  const apiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;
  console.log("API URL:", apiUrl);

  try {
    // Lấy profiles hiện tại
    console.log("Fetching current profiles...");
    const response = await callApi(apiUrl);
    console.log("Response:", response);
    if (response.code === 10000 && response.result) {
      let profiles = response.result.profiles || [];
      console.log("Current profiles:", profiles);
      // Thêm profile mới
      profiles.push({
        name,
        phoneNumber,
        address: { province, district, ward, other },
        default: profiles.length === 0, // Nếu là profile đầu tiên, set default
      });

      // Update profiles
      console.log("Updating profiles:", profiles);
      await updateProfiles(profiles);

      // Reset form
      document.getElementById("addSenderForm").reset();
      // Reset custom selects
      resetCustomSelect("provinceSelect", "Tỉnh/Thành phố");
      resetCustomSelect("districtSelect", "Huyện/Quận");
      resetCustomSelect("wardSelect", "Xã/Phường");

      // Reload
      loadProfiles();
      alert("Thêm người gửi thành công!");
    } else {
      console.error("API response error:", response);
      alert(`Lỗi API: ${response.message || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error adding profile:", error);
    alert(
      `Lỗi thêm người gửi: ${error.message}\n\nKiểm tra:\n1. Server backend có chạy trên localhost:8585?\n2. Bạn đã đăng nhập chưa?\n3. CORS settings?`
    );
  }
}

/**
 * Sửa profile.
 * @param {number} index - Index của profile trong array.
 */
async function editProfile(index) {
  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;

  try {
    const response = await callApi(apiUrl);
    if (response.code === 10000 && response.result) {
      const profiles = response.result.profiles || [];
      const profile = profiles[index];
      if (!profile) return;

      // Fill modal
      document.getElementById("editIndex").value = index;
      document.getElementById("editModalSenderName").value = profile.name;
      document.getElementById("editModalSenderPhone").value =
        profile.phoneNumber;
      // Note: Cần logic để set selects cho address, nhưng tạm thời chỉ set text
      document.getElementById("editModalSenderFullAddress").value =
        profile.address.other;

      // Show modal
      const modal = new bootstrap.Modal(
        document.getElementById("editSenderModal")
      );
      modal.show();
    }
  } catch (error) {
    alert(`Lỗi tải profile: ${error.message}`);
  }
}

/**
 * Cập nhật profile sau edit.
 */
async function updateProfile() {
  const index = parseInt(document.getElementById("editIndex").value);
  const name = document.getElementById("editModalSenderName").value.trim();
  const phoneNumber = document
    .getElementById("editModalSenderPhone")
    .value.trim();
  const other = document
    .getElementById("editModalSenderFullAddress")
    .value.trim();

  if (!name || !phoneNumber || !other) {
    alert("Vui lòng điền đầy đủ thông tin.");
    return;
  }

  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;

  try {
    const response = await callApi(apiUrl);
    if (response.code === 10000 && response.result) {
      let profiles = response.result.profiles || [];
      profiles[index] = {
        ...profiles[index],
        name,
        phoneNumber,
        address: { ...profiles[index].address, other },
      };

      await updateProfiles(profiles);

      const modal = bootstrap.Modal.getInstance(
        document.getElementById("editSenderModal")
      );
      modal.hide();

      loadProfiles();
    }
  } catch (error) {
    alert(`Lỗi cập nhật: ${error.message}`);
  }
}

/**
 * Xóa profile.
 * @param {number} index - Index của profile.
 */
async function deleteProfile(index) {
  if (!confirm("Bạn có chắc muốn xóa người gửi này?")) return;

  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/find?id=${userId}`;

  try {
    const response = await callApi(apiUrl);
    if (response.code === 10000 && response.result) {
      let profiles = response.result.profiles || [];
      profiles.splice(index, 1);

      await updateProfiles(profiles);

      loadProfiles();
    }
  } catch (error) {
    alert(`Lỗi xóa: ${error.message}`);
  }
}

/**
 * Update profiles qua API.
 * @param {Array} profiles - Profiles array mới.
 */
async function updateProfiles(profiles) {
  const userId = localStorage.getItem("userId") || "60d21b4667d0d8992e610a01";
  const apiUrl = `http://localhost:8585/api/v1/users/update/${userId}/profiles`;
  console.log("Updating profiles for userId:", userId);
  console.log("Update API URL:", apiUrl);
  console.log("Profiles to update:", profiles);

  try {
    const result = await callApi(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profiles),
    });
    console.log("Update result:", result);
    return result;
  } catch (error) {
    console.error("Error updating profiles:", error);
    throw error;
  }
}

/**
 * Reset custom select display
 */
function resetCustomSelect(selectId, placeholder) {
  const select = document.getElementById(selectId);
  if (select) {
    const display = select.querySelector(".select-display span");
    if (display) {
      display.textContent = placeholder;
    }
    select.querySelector(".select-display").classList.remove("has-value");
    // Clear selected options
    select
      .querySelectorAll(".dropdown-option.selected")
      .forEach((opt) => opt.classList.remove("selected"));
  }
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  loadProfiles();

  // Add profile
  document
    .getElementById("addSenderForm")
    .addEventListener("submit", addProfile);

  // Search
  document.getElementById("searchInput").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".sender-card");
    cards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? "" : "none";
    });
  });
});
