document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 shipments-data.js loaded");

  // ===========================
  // Kiểm tra cấu hình API
  // ===========================
  if (!window.API_CONFIG) {
    console.error("❌ API_CONFIG chưa load!");
    return;
  }

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  // ===========================
  // Biến DOM
  // ===========================
  const tableArea = document.querySelector(".table-area");
  const statItems = document.querySelectorAll(".summary-stats .stat-item");
  const tabItems = document.querySelectorAll(".tab-item, .dropdown-item");
  const mainActionsContainer = document.getElementById("mainActions");

  let orders = [];
  let currentStatus = "Tất cả";

  // ===========================
  // Hàm lấy token hợp lệ
  // ===========================
  function getValidToken() {
    let token = getAccessToken();
    if (!token) return null;
    if (token.startsWith("Bearer ")) token = token.slice(7);
    return token;
  }

  // ===========================
  // Load danh sách đơn hàng
  // ===========================
  async function loadOrders() {
    tableArea.innerHTML = `<p>Đang tải dữ liệu...</p>`;

    const token = getValidToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE_URL}/orders/get-all`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      orders = data.result || [];
      console.log("✅ Đã tải đơn hàng:", orders);

      updateSummaryStats();
      updateTabsCount();
      renderTable(currentStatus);
    } catch (err) {
      console.error("❌ Lỗi tải danh sách đơn hàng:", err);
      tableArea.innerHTML = `<p>Không thể tải dữ liệu (mã lỗi ${err.message})</p>`;
    }
  }

  // ===========================
  // Cập nhật thống kê tổng số
  // ===========================
  function updateSummaryStats() {
    const total = orders.length;
    const success = orders.filter((o) => o.status === "Giao thành công").length;
    const waiting = orders.filter((o) => o.status === "Chờ lấy").length;
    const cancelled = orders.filter((o) => o.status === "Hủy lấy").length;
    const draft = orders.filter((o) => o.status === "Đơn nháp").length;

    statItems.forEach((item) => {
      const label = item.dataset.statusTarget;
      const count =
        label === "Tất cả"
          ? total
          : label === "Lấy thành công"
          ? success
          : label === "Chờ lấy"
          ? waiting
          : label === "Hủy lấy"
          ? cancelled
          : label === "Đơn nháp"
          ? draft
          : 0;
      item.querySelector("b").textContent = `${count} đơn`;
    });
  }

  // ===========================
  // Cập nhật số lượng ở các tab
  // ===========================
  function updateTabsCount() {
    tabItems.forEach((tab) => {
      const status = tab.dataset.status;
      const count =
        status === "Tất cả"
          ? orders.length
          : orders.filter((o) => o.status === status).length;

      const colorBox =
        tab.querySelector(".color-box")?.outerHTML ||
        `<span class="color-box"></span>`;
      const nameOnly = tab.textContent.replace(/\(.*\)/, "").trim();
      tab.innerHTML = `${colorBox} ${nameOnly} (${count})`;
    });
  }

  // ===========================
  // Hiển thị bảng đơn hàng
  // ===========================
  function renderTable(status) {
    currentStatus = status;
    const list =
      status === "Tất cả"
        ? orders
        : orders.filter((o) => o.status === status);

    if (list.length === 0) {
      tableArea.innerHTML = `<p>Không có bản ghi nào</p>`;
      return;
    }

    const html = `
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Mã vận đơn</th>
            <th>Người gửi</th>
            <th>Người nhận</th>
            <th>Địa chỉ</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${list
            .map(
              (o, i) => `
            <tr data-code="${o.code}">
              <td>${i + 1}</td>
              <td>${o.code || "-"}</td>
              <td>${o.senderName || "-"}</td>
              <td>${o.receiverName || "-"}</td>
              <td>${o.receiverAddress || "-"}</td>
              <td>${o.status || "-"}</td>
              <td>${
                o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString("vi-VN")
                  : "-"
              }</td>
              <td>
                <button class="btn-update" data-code="${o.code}">
                  <i class="fa-solid fa-pen"></i> Cập nhật
                </button>
              </td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
    `;
    tableArea.innerHTML = html;
  }

  // ===========================
  // Modal cập nhật trạng thái
  // ===========================
  const modalHTML = `
    <div class="modal-overlay hidden" id="statusModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Cập nhật trạng thái đơn hàng</h2>
          <button class="close-btn" id="closeModalBtn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Chọn trạng thái mới cho đơn hàng:</p>
          <select id="statusSelect">
            <option value="Đã tiếp nhận">Đã tiếp nhận</option>
            <option value="Đang lấy hàng">Đang lấy hàng</option>
            <option value="Đã lấy hàng">Đã lấy hàng</option>
            <option value="Đang vận chuyển">Đang vận chuyển</option>
            <option value="Đang giao hàng">Đang giao hàng</option>
            <option value="Giao thành công">Giao thành công</option>
            <option value="Hủy lấy">Hủy lấy</option>
            <option value="Đơn nháp">Đơn nháp</option>
          </select>
        </div>
        <div class="modal-footer">
          <button class="btn btn-confirm" id="confirmStatusBtn">Xác nhận</button>
          <button class="btn btn-cancel" id="cancelStatusBtn">Hủy</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const statusModal = document.getElementById("statusModal");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const cancelStatusBtn = document.getElementById("cancelStatusBtn");
  const confirmStatusBtn = document.getElementById("confirmStatusBtn");
  const statusSelect = document.getElementById("statusSelect");

  let selectedOrder = null;

  function openModal(orderCode) {
    selectedOrder = orderCode;
    statusModal.classList.remove("hidden");
  }

  function closeModal() {
    selectedOrder = null;
    statusModal.classList.add("hidden");
  }

  closeModalBtn.addEventListener("click", closeModal);
  cancelStatusBtn.addEventListener("click", closeModal);

  confirmStatusBtn.addEventListener("click", async () => {
    if (!selectedOrder) return alert("Chưa chọn đơn hàng!");
    const newStatus = statusSelect.value;
    const token = getValidToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/update-status/${selectedOrder}`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      console.log(`✅ Đã cập nhật ${selectedOrder} → ${newStatus}`);
      closeModal();
      await loadOrders();
    } catch (err) {
      console.error("❌ Lỗi cập nhật trạng thái:", err);
      alert("Cập nhật thất bại!");
    }
  });

  // ===========================
  // Sự kiện nút / tab / bảng
  // ===========================
  tableArea.addEventListener("click", (e) => {
    if (e.target.closest(".btn-update")) {
      const orderCode = e.target.closest(".btn-update").dataset.code;
      openModal(orderCode);
    }
  });

  tabItems.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      tabItems.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      renderTable(tab.dataset.status);
    });
  });

  statItems.forEach((item) => {
    item.addEventListener("click", () => {
      statItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      renderTable(item.dataset.statusTarget);
    });
  });

  // ===========================
  // Nút làm mới
  // ===========================
  const refreshBtn = document.createElement("button");
  refreshBtn.className = "btn btn-refresh";
  refreshBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Làm mới`;
  refreshBtn.addEventListener("click", loadOrders);
  mainActionsContainer.appendChild(refreshBtn);

  // ===========================
  // INIT
  // ===========================
  loadOrders();
});
