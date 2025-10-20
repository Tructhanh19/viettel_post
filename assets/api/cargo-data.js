// ===============================
// ===============================

window.CargoData = (function () {
  "use strict";

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;
  let isLoading = false;

  /**
   * -----------------------------------------------------
   * 🔹 1️⃣ Hàm khởi tạo chính (gọi khi trang load)
   * -----------------------------------------------------
   */
  async function init() {
    if (isLoading) {
      console.log("⏳ CargoData đang load, bỏ qua...");
      return;
    }

    try {
      isLoading = true;

      // Chờ token có sẵn (nếu login trễ)
      await waitForToken();

      // Tính range thời gian
      const picker = document.querySelector("#statsDatePicker");
      let from, to;

      if (picker && picker._flatpickr?.selectedDates?.length === 2) {
        from = picker._flatpickr.selectedDates[0].toISOString();
        to = picker._flatpickr.selectedDates[1].toISOString();
      } else {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        from = sevenDaysAgo.toISOString();
        to = now.toISOString();
      }

      // Gọi API
      await Promise.all([loadCargoStatistics(from, to), loadCashBalance()]);
      console.log("✅ CargoData loaded thành công!");
    } catch (error) {
      console.error("❌ CargoData init failed:", error);
      showErrorUI("Không thể tải dữ liệu dòng tiền. Vui lòng thử lại sau.");
    } finally {
      isLoading = false;
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 2️⃣ Chờ token hợp lệ (tránh lỗi 401)
   * -----------------------------------------------------
   */
  async function waitForToken() {
    for (let i = 0; i < 10; i++) {
      const token = getAccessToken();
      if (token) return;
      console.log("⏳ Chờ token...");
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Không tìm thấy token sau 5 giây. Hãy đăng nhập lại.");
  }

  /**
   * -----------------------------------------------------
   * 🔹 3️⃣ Lấy dữ liệu thống kê dòng tiền
   * -----------------------------------------------------
   */
  async function loadCargoStatistics(from, to) {
    try {
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${API_BASE_URL}/orders/statistics/cargo-value?from=${from}&to=${to}`;
      console.log("🔄 Fetching cargo stats:", url);

      const res = await fetch(url, { headers });
      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("✅ Cargo statistics:", data);
      updateStatsUI(data);
    } catch (err) {
      console.error("❌ Lỗi khi tải thống kê dòng tiền:", err);
      showErrorUI("Không thể tải dữ liệu thống kê dòng tiền.");
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 4️⃣ Lấy thông tin số dư tài khoản
   * -----------------------------------------------------
   */
  async function loadCashBalance() {
    try {
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const url = `${API_BASE_URL}/account/balance`;
      console.log("🔄 Fetching cash balance:", url);

      const res = await fetch(url, { headers });
      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log("✅ Cash balance:", data);
      updateCashflowUI(data);
    } catch (err) {
      console.error("❌ Lỗi khi tải thông tin số dư:", err);
      showErrorUI("Không thể tải thông tin số dư tài khoản.");
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 5️⃣ Cập nhật UI phần thống kê
   * -----------------------------------------------------
   */
  function updateStatsUI(data) {
    const totalOrders = document.querySelector(".total-orders b");
    const codTotal = document.querySelector(".summary-item:nth-child(1) b");
    const feeTotal = document.querySelector(".summary-item:nth-child(2) b");

    if (totalOrders) totalOrders.textContent = data.totalOrders || 0;
    if (codTotal)
      codTotal.textContent =
        (data.totalCOD || 0).toLocaleString("vi-VN") + " ₫";
    if (feeTotal)
      feeTotal.textContent =
        (data.totalFee || 0).toLocaleString("vi-VN") + " ₫";

    const rows = document.querySelectorAll(".tables-container tbody tr");
    if (Array.isArray(data.statusDetails)) {
      data.statusDetails.forEach((item, i) => {
        if (rows[i]) {
          rows[i].children[1].textContent = item.orders || 0;
          rows[i].children[2].textContent =
            (item.cod || 0).toLocaleString("vi-VN") + " ₫";
          rows[i].children[3].textContent =
            (item.fee || 0).toLocaleString("vi-VN") + " ₫";
        }
      });
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 6️⃣ Cập nhật UI phần dòng tiền
   * -----------------------------------------------------
   */
  function updateCashflowUI(data) {
    const blue = document.querySelector(".cash-summary-item.blue b");
    const red = document.querySelector(".cash-summary-item.red-outline b");
    const white = document.querySelector(".cash-summary-item.white b");

    if (blue) blue.textContent = (data.balance || 0).toLocaleString("vi-VN") + " ₫";
    if (red) red.textContent = (data.withdraw || 0).toLocaleString("vi-VN") + " ₫";
    if (white) white.textContent = (data.topup || 0).toLocaleString("vi-VN") + " ₫";

    const rows = document.querySelectorAll(".cashflow-column:first-child .info-card b");
    if (data.goodsFlow && rows.length >= 2) {
      rows[0].textContent = (data.goodsFlow.moving || 0).toLocaleString("vi-VN") + " ₫";
      rows[1].textContent = (data.goodsFlow.waiting || 0).toLocaleString("vi-VN") + " ₫";
    }

    const rows2 = document.querySelectorAll(".cashflow-column:last-child .info-card b");
    if (data.feeFlow && rows2.length >= 2) {
      rows2[0].textContent = (data.feeFlow.debt || 0).toLocaleString("vi-VN") + " ₫";
      rows2[1].textContent = (data.feeFlow.paid7Days || 0).toLocaleString("vi-VN") + " ₫";
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 7️⃣ Xử lý khi bị 401 (hết hạn đăng nhập)
   * -----------------------------------------------------
   */
  function handle401() {
    console.warn("⚠️ Token không hợp lệ hoặc hết hạn.");
    showAuthWarning();
    localStorage.removeItem("accessToken");
    return false;
  }

  /**
   * -----------------------------------------------------
   * 🔹 8️⃣ Hiển thị thông báo xác thực
   * -----------------------------------------------------
   */
  function showAuthWarning() {
    if (!document.querySelector(".auth-warning")) {
      const div = document.createElement("div");
      div.className = "auth-warning";
      div.style.cssText =
        "background:#ffefef;color:#b00;padding:10px;margin:15px 0;text-align:center;border:1px solid #faa;";
      div.textContent =
        "⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.";
      document.body.prepend(div);
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 9️⃣ Hiển thị lỗi UI
   * -----------------------------------------------------
   */
  function showErrorUI(message) {
    const div = document.createElement("div");
    div.style.cssText =
      "background:#ffeaea;color:#c00;padding:8px;margin:10px 0;text-align:center;border-radius:6px;font-size:14px;";
    div.textContent = message;
    document.body.appendChild(div);
  }

  // =====================================================
  // Xuất module ra global để gọi thủ công nếu cần
  // =====================================================
  return { init, refresh: init };
})();

// Tự khởi chạy sau khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  console.log("🟢 cargo-data.js loaded");
  window.CargoData.init();
});
