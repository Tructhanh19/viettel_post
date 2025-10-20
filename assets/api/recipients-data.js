document.addEventListener("DOMContentLoaded", () => {
  if (!window.API_CONFIG) {
    console.error("❌ API_CONFIG chưa được load. Hãy chắc chắn file config.js nằm trước recipients-data.js.");
    return;
  }

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  // --- Elements ---
  const addNewBtn = document.getElementById("addNewBtn");
  const modal = document.getElementById("addRecipientModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const submitBtn = document.getElementById("submitRecipientBtn"); // ✅ nút thêm mới thật sự
  const tbody = document.querySelector("tbody");

  const fullNameInput = document.getElementById("fullName");
  const phoneInput = document.getElementById("phoneNumber");
  const addressInput = document.getElementById("address");

  let recipients = [];

  // ==========================
  // Load danh sách người nhận
  // ==========================
  async function loadRecipients() {
    try {
      const url = `${API_BASE_URL}/receivers/get-all`;
      const token = getAccessToken();
const headers = { 'Content-Type': 'application/json' };
if (token) headers['Authorization'] = token; // Không thêm chữ Bearer


      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      recipients = Array.isArray(data) ? data : data.data || data.receivers || [];
      renderTable();
    } catch (err) {
      console.error("❌ Lỗi tải danh sách người nhận:", err);
      tbody.innerHTML = `<tr><td colspan="6" class="no-data">Không thể tải dữ liệu</td></tr>`;
    }
  }

  // ==========================
  // Render bảng dữ liệu
  // ==========================
  function renderTable() {
    tbody.innerHTML = "";
    if (!recipients.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="no-data">Không có bản ghi nào</td></tr>`;
      return;
    }

    recipients.forEach((r, i) => {
      const address = r.address
        ? `${r.address.detail}, ${r.address.ward || ""}, ${r.address.district || ""}, ${r.address.province || ""}`
        : "—";
      const tagHTML =
        r.tags && r.tags.length
          ? r.tags.map((t) => `<span class="tag">${t.name}</span>`).join(" ")
          : "—";

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${r.name || "—"}</td>
        <td>${tagHTML}</td>
        <td>${(r.success_rate || 95).toFixed(1)}%</td>
        <td>${address}</td>
        <td><button class="btn btn-danger btn-sm" data-id="${r._id?.$oid || ""}">Xoá</button></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ==========================
  // Thêm mới người nhận
  // ==========================
  async function createRecipient() {
    const name = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || !phone || !address) {
      alert("⚠️ Vui lòng nhập đầy đủ Họ tên, SĐT và Địa chỉ!");
      return;
    }

    const newRecipient = {
      name,
      phone,
      address: {
        detail: address,
        province: "Hồ Chí Minh",
        district: "",
        ward: ""
      },
      tags: []
    };

    try {
      const url = `${API_BASE_URL}/receivers/insert`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(newRecipient)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      // Cập nhật danh sách hiển thị
      recipients.push(result);
      renderTable();

      hideModal();
      fullNameInput.value = "";
      phoneInput.value = "";
      addressInput.value = "";

      alert("✅ Đã thêm người nhận mới thành công!");
    } catch (err) {
      console.error("❌ Lỗi khi thêm người nhận:", err);
      alert("Thêm người nhận thất bại!");
    }
  }

  // ==========================
  // Modal show/hide
  // ==========================
  function showModal() {
    modal.classList.remove("hidden");
  }

  function hideModal() {
    modal.classList.add("hidden");
  }

  // ==========================
  // Event Listeners
  // ==========================
  addNewBtn.addEventListener("click", showModal);
  closeModalBtn.addEventListener("click", hideModal);
  cancelBtn.addEventListener("click", hideModal);
  submitBtn.addEventListener("click", createRecipient); // ✅ gắn sự kiện click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) hideModal();
  });

  // ==========================
  // Gọi load khi mở trang
  // ==========================
  loadRecipients();
});
