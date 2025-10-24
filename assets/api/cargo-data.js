// ===============================
// ========== cargo-data.js ======
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

    if (
      !window.API_CONFIG ||
      !window.API_CONFIG.BASE_URL ||
      typeof window.API_CONFIG.getAccessToken !== "function"
    ) {
      console.error("❌ API_CONFIG chưa sẵn sàng trong CargoData.init!");
      showErrorUI("Lỗi cấu hình. Không thể tải dữ liệu.");
      return;
    }

    try {
      isLoading = true;
      console.log("🚀 Bắt đầu CargoData.init()...");

      await waitForToken();

      const picker = document.querySelector("#statsDatePicker");
      let from, to;

      if (
        picker &&
        picker._flatpickr &&
        picker._flatpickr.selectedDates &&
        picker._flatpickr.selectedDates.length === 2
      ) {
        from = picker._flatpickr.selectedDates[0].toISOString();
        to = picker._flatpickr.selectedDates[1].toISOString();
        console.log("📅 Sử dụng date range từ picker:", from, "đến", to);
      } else {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
        from = sevenDaysAgo.toISOString();
        to = now.toISOString();
        console.log("📅 Sử dụng date range mặc định (7 ngày):", from, "đến", to);
      }

      const codMode = getSelectedCODMode();
      await Promise.all([loadCargoStatistics(from, to, codMode), loadCashBalance()]);
      console.log("✅ CargoData loaded thành công!");

      attachComboBoxHandler();
    } catch (error) {
      console.error("❌ CargoData init failed:", error);
      showErrorUI(
        `Không thể tải dữ liệu dòng tiền (${error.message}). Vui lòng thử lại sau.`
      );
    } finally {
      isLoading = false;
      console.log("🏁 Kết thúc CargoData.init().");
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 2️⃣ Lấy chế độ COD từ combobox
   * -----------------------------------------------------
   */
  function getSelectedCODMode() {
    const select = document.querySelector(
      "#thong-ke .dropdown-wrapper select"
    );
    if (!select) return "include";
    const value = select.value.toLowerCase();
    return value.includes("không") ? "exclude" : "include";
  }

  /**
   * -----------------------------------------------------
   * 🔹 3️⃣ Gắn sự kiện cho combobox (lọc COD)
   * -----------------------------------------------------
   */
  function attachComboBoxHandler() {
    const select = document.querySelector("#thong-ke .dropdown-wrapper select");
    if (!select) return;

    select.removeEventListener("change", handleCODFilterChange);
    select.addEventListener("change", handleCODFilterChange);
  }

  async function handleCODFilterChange() {
    const picker = document.querySelector("#statsDatePicker");
    let from, to;

    if (
      picker &&
      picker._flatpickr &&
      picker._flatpickr.selectedDates &&
      picker._flatpickr.selectedDates.length === 2
    ) {
      from = picker._flatpickr.selectedDates[0].toISOString();
      to = picker._flatpickr.selectedDates[1].toISOString();
    } else {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
      from = sevenDaysAgo.toISOString();
      to = now.toISOString();
    }

    const mode = getSelectedCODMode();
    console.log("🔄 Lọc lại dữ liệu với chế độ COD:", mode);
    await loadCargoStatistics(from, to, mode);
  }

  /**
   * -----------------------------------------------------
   * 🔹 4️⃣ Chờ token hợp lệ (tránh lỗi 401)
   * -----------------------------------------------------
   */
  async function waitForToken() {
    for (let i = 0; i < 10; i++) {
      const token =
        typeof getAccessToken === "function" ? getAccessToken() : null;
      if (token) {
        console.log("🔑 Đã tìm thấy token.");
        return token;
      }
      console.log(`⏳ Chờ token... (lần ${i + 1})`);
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Không tìm thấy token sau 5 giây. Hãy đăng nhập lại.");
  }

  /**
   * -----------------------------------------------------
   * 🔹 5️⃣ Lấy dữ liệu thống kê dòng tiền (1 endpoint)
   * -----------------------------------------------------
   */
  async function loadCargoStatistics(from, to, codMode = "include") {
    let token;
    try {
      token = await waitForToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const includeReceiver = codMode === "include" ? "true" : "false";
      const url = `${API_BASE_URL}/orders/statistics/payment?from=${from}&to=${to}&includeReceiver=${includeReceiver}`;

      console.log(`🔄 Fetching cargo stats (includeReceiver=${includeReceiver}):`, url);

      const res = await fetch(url, { headers });
      if (res.status === 401) return handle401();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

      const data = await res.json();
      console.log("✅ Cargo statistics:", data);
      updateStatsUI(data.result || data, codMode);
    } catch (err) {
      console.error("❌ Lỗi khi tải thống kê dòng tiền:", err);
      showErrorUI(`Không thể tải dữ liệu thống kê (${err.message}).`);
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 6️⃣ Giả lập loadCashBalance (nếu API có)
   * -----------------------------------------------------
   */
  async function loadCashBalance() {
    console.log("ℹ️ Giả lập loadCashBalance()");
  }

  /**
   * -----------------------------------------------------
   * 🔹 7️⃣ Cập nhật UI phần thống kê + biểu đồ tròn
   * -----------------------------------------------------
   */
  function updateStatsUI(data, codMode) {
    console.log("📊 Cập nhật UI Thống kê với data:", data);
    if (!data) return;

    const totalOrders = document.querySelector(".total-orders b");
    const codTotal = document.querySelector(
      "#thong-ke .summary-item:nth-child(1) b"
    );
    const feeTotal = document.querySelector(
      "#thong-ke .summary-item:nth-child(2) b"
    );

    if (totalOrders)
      totalOrders.textContent = (data.totalOrders || 0).toLocaleString("vi-VN");

    const totalCOD = data.totalCod || data.totalCOD || 0;
    if (codTotal)
      codTotal.textContent = totalCOD.toLocaleString("vi-VN") + " ₫";

    if (feeTotal)
      feeTotal.textContent =
        (data.totalShippingCost || data.totalFee || 0).toLocaleString("vi-VN") +
        " ₫";

    // --- Cập nhật bảng trạng thái ---
    const byStatus = data.byStatus || [];

    // Ensure mapping includes DRAFT/draft -> 'Đơn nháp' (handled in mapStatusName below)
    // Ensure the status table contains a row for 'Đơn nháp' so it will be displayed
    try {
      const tableBody = document.querySelector(
        "#thong-ke .table-card:nth-child(1) tbody"
      );
      if (tableBody) {
        const hasDraftRow = Array.from(tableBody.querySelectorAll('tr')).some(r => {
          const t = r.querySelector('td:first-child')?.textContent?.trim();
          return t === 'Đơn nháp';
        });
        if (!hasDraftRow) {
          // Append a new row for Đơn nháp with zeroed columns (status, orders, COD, shipping)
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>Đơn nháp</td>
            <td>0</td>
            <td>0 ₫</td>
            <td>0 ₫</td>
          `;
          tableBody.appendChild(tr);
          console.log('ℹ️ Đã thêm hàng "Đơn nháp" vào bảng trạng thái.');
        }
      }
    } catch (e) {
      console.warn('Không thể đảm bảo hàng Đơn nháp trong bảng:', e);
    }

    const rows = document.querySelectorAll(
      "#thong-ke .table-card:nth-child(1) tbody tr"
    );

    rows.forEach((row) => {
      const statusText = row.querySelector("td:first-child")?.textContent.trim();
      const found = byStatus.find(
        (s) => mapStatusName(s.status) === statusText
      );
      if (found) {
        row.children[1].textContent = found.orders || 0;
        row.children[2].textContent =
          (found.cod || 0).toLocaleString("vi-VN") + " ₫";
        row.children[3].textContent =
          (found.shippingCost || 0).toLocaleString("vi-VN") + " ₫";
      } else {
        row.children[1].textContent = 0;
        row.children[2].textContent = "0 ₫";
        row.children[3].textContent = "0 ₫";
      }
    });

    renderPieChart(byStatus);
  }

  /**
   * -----------------------------------------------------
   * 🔹 8️⃣ Vẽ biểu đồ trạng thái đơn hàng
   * -----------------------------------------------------
   */
  function renderPieChart(byStatus) {
    try {
      const chartContainer = document.querySelector(".chart-container");
      if (chartContainer && Array.isArray(byStatus)) {
        chartContainer.innerHTML =
          '<canvas id="statusPieChart" width="300" height="300"></canvas>';
        const ctx = document.getElementById("statusPieChart").getContext("2d");

        const labels = byStatus.map((s) => mapStatusName(s.status));
        const values = byStatus.map((s) => s.orders);
        const colorMap = {
          "Đối soát": "#f0ad4e",
          "Đang vận chuyển": "#9b59b6",
          "Đang giao hàng": "#5bc0de",
          "Chờ phát lại": "#777",
          "Giao thành công": "#5cb85c",
          "Chờ xử lý": "#8d6e63",
        };
        const backgroundColors = labels.map((l) => colorMap[l] || "#ccc");

        const drawChart = () =>
          new Chart(ctx, {
            type: "pie",
            data: {
              labels,
              datasets: [{ data: values, backgroundColor: backgroundColors }],
            },
            options: {
              plugins: {
                legend: { position: "right" },
                title: { display: true, text: "Tỷ lệ trạng thái đơn hàng" },
              },
            },
          });

        if (typeof Chart === "undefined") {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/chart.js";
          script.onload = drawChart;
          document.body.appendChild(script);
        } else drawChart();
      }
    } catch (e) {
      console.error("❌ Lỗi khi vẽ biểu đồ tròn:", e);
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 9️⃣ Ánh xạ mã trạng thái sang tiếng Việt
   * -----------------------------------------------------
   */
  function mapStatusName(code) {
    const mapping = {
      DELIVERED: "Giao thành công",
      IN_TRANSIT: "Đang vận chuyển",
      PENDING: "Chờ xử lý",
      PROCESSING: "Đang giao hàng",
      RECONCILED: "Đối soát",
      RETURNED: "Chờ phát lại",
      DRAFT: "Đơn nháp",
      draft: "Đơn nháp"
    };
    if (!code && code !== 0) return code;
    // Normalize code to string and uppercase for matching common codes
    const key = String(code).toUpperCase();
    return mapping[code] || mapping[key] || mapping[String(code)] || code;
  }

  /**
   * -----------------------------------------------------
   * 🔹 🔟 401 handler & lỗi UI
   * -----------------------------------------------------
   */
  function handle401() {
    console.warn("⚠️ Token không hợp lệ hoặc hết hạn. Đang xử lý...");
    showAuthWarning();
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    return false;
  }

  function showAuthWarning() {
    let warningDiv = document.querySelector(".auth-warning");
    if (!warningDiv) {
      warningDiv = document.createElement("div");
      warningDiv.className = "auth-warning";
      warningDiv.style.cssText =
        "background:#fff3cd;color:#856404;padding:15px;margin:20px;text-align:center;border:1px solid #ffeeba;border-radius:8px;font-weight:bold;";
      warningDiv.textContent =
        "⚠️ Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.";
      const main = document.querySelector("main") || document.body;
      main.insertBefore(warningDiv, main.firstChild);
    }
  }

  function showErrorUI(message) {
    if (document.querySelector(`.error-ui[data-message="${message}"]`)) return;
    const div = document.createElement("div");
    div.className = "error-ui";
    div.setAttribute("data-message", message);
    div.style.cssText =
      "background:#f8d7da;color:#721c24;padding:10px 15px;margin:15px 20px;text-align:center;border:1px solid #f5c6cb;border-radius:6px;font-size:14px;";
    div.textContent = `❌ ${message}`;
    const main = document.querySelector("main") || document.body;
    main.appendChild(div);
  }

  console.log("📦 CargoData module defined.");
  return { init, refresh: init };
})();

console.log("🔧 cargo-data.js script finished execution. Waiting for init() call.");
