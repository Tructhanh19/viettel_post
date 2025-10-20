src="config.js">
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 feedback-data.js loaded");

  // --- Check API config ---
  if (!window.API_CONFIG) {
    console.error("❌ API_CONFIG chưa load!");
    return;
  }

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  // --- DOM elements ---
  const openModalBtn = document.getElementById("openModalBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const confirmModalBtn = document.getElementById("confirmModalBtn");
  const modal = document.getElementById("complaintModal");

  const tbody = document.querySelector("tbody");

  const orderCodeInput = document.querySelector(
    "#complaintModal input[placeholder='Nhập mã đơn hàng']"
  );
  const contentInput = document.querySelector(
    "#complaintModal textarea[placeholder='Nhập nội dung khiếu nại/ góp ý']"
  );
  const complaintTypeDisplay = document.querySelector(
    "#complaintTypeDropdown .dropdown-selected span"
  );
  const pickupAddressSelect = document.querySelector(
    "#complaintModal select"
  );

  // ========================
  // MODAL EVENTS
  // ========================
  function showModal() {
    modal.classList.remove("hidden");
  }

  function hideModal() {
    modal.classList.add("hidden");
    resetForm();
  }

  function resetForm() {
    orderCodeInput.value = "";
    contentInput.value = "";
    complaintTypeDisplay.textContent = "Chọn loại khiếu nại";
    pickupAddressSelect.selectedIndex = 0;
  }

  openModalBtn.addEventListener("click", showModal);
  closeModalBtn.addEventListener("click", hideModal);
  cancelModalBtn.addEventListener("click", hideModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  // ========================
  // LOAD FEEDBACK LIST
  // ========================
  async function loadFeedbackList() {
    console.log("📦 Đang tải danh sách khiếu nại...");
    const token = getAccessToken();

    try {
      const res = await fetch(`${API_BASE_URL}/feedbacks/get-all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      console.log("✅ Loaded feedback list:", data);

      if (!data.result || data.result.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="no-data">Không có bản ghi nào</td></tr>`;
        return;
      }

      tbody.innerHTML = data.result
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.code || "-"}</td>
          <td>${item.orderCode || "-"}</td>
          <td>${item.type || "-"}</td>
          <td>${item.content || "-"}</td>
          <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
          <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "-"}</td>
          <td>${item.status || "Đang xử lý"}</td>
        </tr>`
        )
        .join("");
    } catch (err) {
      console.error("❌ Lỗi tải danh sách khiếu nại:", err);
      tbody.innerHTML = `<tr><td colspan="8" class="no-data">Không thể tải dữ liệu</td></tr>`;
    }
  }

  // ========================
  // CREATE FEEDBACK
  // ========================
  async function createFeedback() {
    console.log("🧾 Gửi khiếu nại mới...");

    const orderCode = orderCodeInput.value.trim();
    const content = contentInput.value.trim();
    const type = complaintTypeDisplay.textContent.trim();
    const address = pickupAddressSelect.value.trim();

    if (!orderCode || !content || type === "Chọn loại khiếu nại" || !address) {
      alert("⚠️ Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    const feedback = {
      orderCode,
      type,
      content,
      address,
    };

    const token = getAccessToken();
const headers = { 'Content-Type': 'application/json' };

if (token) {
  // Nếu token đã chứa chữ "Bearer" sẵn thì giữ nguyên, không thêm lại
  headers['Authorization'] = token.startsWith('Bearer ')
    ? token
    : `Bearer ${token}`;
}

console.log('🔐 Header gửi đi:', headers);

  }

  confirmModalBtn.addEventListener("click", createFeedback);

  // ========================
  // INIT
  // ========================
  loadFeedbackList();
});
