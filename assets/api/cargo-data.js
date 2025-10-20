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

    // --- Thêm kiểm tra config ---
    if (!window.API_CONFIG || !window.API_CONFIG.BASE_URL || typeof window.API_CONFIG.getAccessToken !== 'function') {
        console.error("❌ API_CONFIG chưa sẵn sàng trong CargoData.init!");
        showErrorUI("Lỗi cấu hình. Không thể tải dữ liệu.");
        return;
    }
    // --- Kết thúc kiểm tra config ---

    try {
      isLoading = true;
      console.log("🚀 Bắt đầu CargoData.init()..."); // Thêm log

      // Chờ token có sẵn (nếu login trễ)
      await waitForToken();

      // Tính range thời gian
      const picker = document.querySelector("#statsDatePicker");
      let from, to;

      // --- Thêm kiểm tra picker ---
      if (picker && picker._flatpickr && picker._flatpickr.selectedDates && picker._flatpickr.selectedDates.length === 2) {
        from = picker._flatpickr.selectedDates[0].toISOString();
        to = picker._flatpickr.selectedDates[1].toISOString();
        console.log("📅 Sử dụng date range từ picker:", from, "đến", to);
      } else {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000); // Sửa lỗi 7 ngày
        from = sevenDaysAgo.toISOString();
        to = now.toISOString();
        console.log("📅 Sử dụng date range mặc định (7 ngày):", from, "đến", to);
      }
      // --- Kết thúc kiểm tra picker ---

      // Gọi API
      // --- Sửa lỗi: Cần await cả Promise.all ---
      await Promise.all([loadCargoStatistics(from, to), loadCashBalance()]);
      console.log("✅ CargoData loaded thành công!");
    } catch (error) {
      console.error("❌ CargoData init failed:", error);
      showErrorUI(`Không thể tải dữ liệu dòng tiền (${error.message}). Vui lòng thử lại sau.`); // Hiển thị lỗi cụ thể hơn
    } finally {
      isLoading = false;
      console.log("🏁 Kết thúc CargoData.init()."); // Thêm log
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 2️⃣ Chờ token hợp lệ (tránh lỗi 401)
   * -----------------------------------------------------
   */
  async function waitForToken() {
    for (let i = 0; i < 10; i++) {
      // --- Đảm bảo gọi hàm getAccessToken đúng cách ---
      const token = (typeof getAccessToken === 'function') ? getAccessToken() : null;
      if (token) {
          console.log("🔑 Đã tìm thấy token.");
          return token; // Trả về token để sử dụng ngay
      }
      console.log(`⏳ Chờ token... (lần ${i + 1})`);
      await new Promise((r) => setTimeout(r, 500));
    }
    console.error("❌ Không tìm thấy token sau 5 giây.");
    throw new Error("Không tìm thấy token sau 5 giây. Hãy đăng nhập lại.");
  }

  /**
   * -----------------------------------------------------
   * 🔹 3️⃣ Lấy dữ liệu thống kê dòng tiền
   * -----------------------------------------------------
   */
  async function loadCargoStatistics(from, to) {
    let token; // Khai báo token ở phạm vi rộng hơn
    try {
      token = await waitForToken(); // Lấy token hợp lệ
      const headers = { "Content-Type": "application/json" };
      // --- Sửa lỗi Authorization header ---
      if (token) headers["Authorization"] = `Bearer ${token}`; // Luôn thêm "Bearer "

      const url = `${API_BASE_URL}/orders/statistics/cargo-value?from=${from}&to=${to}`;
      console.log("🔄 Fetching cargo stats:", url);

      const res = await fetch(url, { headers });

      // --- Xử lý lỗi chi tiết hơn ---
      if (res.status === 401) {
          console.error("❌ Lỗi 401 khi tải cargo stats.");
          return handle401(); // Gọi hàm xử lý 401
      }
      if (!res.ok) {
          const errorText = await res.text();
          console.error(`❌ HTTP ${res.status} khi tải cargo stats:`, errorText);
          throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
      // --- Kết thúc xử lý lỗi ---

      const data = await res.json();
      console.log("✅ Cargo statistics:", data);
      updateStatsUI(data.result || data); // Xử lý trường hợp data có result wrapper
    } catch (err) {
      console.error("❌ Lỗi khi tải thống kê dòng tiền:", err);
      showErrorUI(`Không thể tải dữ liệu thống kê (${err.message}).`); // Hiển thị lỗi
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 4️⃣ Lấy thông tin số dư tài khoản
   * -----------------------------------------------------
   */
  async function loadCashBalance() {
    let token;
    try {
      token = await waitForToken(); // Lấy token hợp lệ
      const headers = { "Content-Type": "application/json" };
       // --- Sửa lỗi Authorization header ---
      if (token) headers["Authorization"] = `Bearer ${token}`; // Luôn thêm "Bearer "

      const url = `${API_BASE_URL}/account/balance`; // Giả sử endpoint là /account/balance
      console.log("🔄 Fetching cash balance:", url);

      const res = await fetch(url, { headers });

      // --- Xử lý lỗi chi tiết hơn ---
       if (res.status === 401) {
          console.error("❌ Lỗi 401 khi tải cash balance.");
          return handle401(); // Gọi hàm xử lý 401
      }
      if (!res.ok) {
           const errorText = await res.text();
          console.error(`❌ HTTP ${res.status} khi tải cash balance:`, errorText);
          throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
      }
       // --- Kết thúc xử lý lỗi ---


      const data = await res.json();
      console.log("✅ Cash balance:", data);
      updateCashflowUI(data.result || data); // Xử lý trường hợp data có result wrapper
    } catch (err) {
      console.error("❌ Lỗi khi tải thông tin số dư:", err);
      showErrorUI(`Không thể tải thông tin số dư (${err.message}).`); // Hiển thị lỗi
    }
  }

  /**
   * -----------------------------------------------------
   * 🔹 5️⃣ Cập nhật UI phần thống kê
   * -----------------------------------------------------
   */
  function updateStatsUI(data) {
     console.log("📊 Cập nhật UI Thống kê với data:", data); // Thêm log
    // --- Thêm kiểm tra data ---
    if (!data) {
        console.warn("⚠️ Không có dữ liệu để cập nhật UI Thống kê.");
        return;
    }
    // --- Kết thúc kiểm tra ---

    const totalOrders = document.querySelector(".total-orders b");
    const codTotal = document.querySelector("#thong-ke .summary-item:nth-child(1) b"); // Chính xác hơn
    const feeTotal = document.querySelector("#thong-ke .summary-item:nth-child(2) b"); // Chính xác hơn

    if (totalOrders) totalOrders.textContent = data.totalOrders || 0;
    if (codTotal)
      codTotal.textContent =
        (data.totalCOD || 0).toLocaleString("vi-VN") + " ₫";
    if (feeTotal)
      feeTotal.textContent =
        (data.totalFee || 0).toLocaleString("vi-VN") + " ₫";

    // --- Cập nhật bảng chi tiết trạng thái ---
    const statusMapping = { // Ánh xạ tên trạng thái API với text trên UI nếu cần
        "Đối soát": "Đối soát",
        "Đang vận chuyển": "Đang vận chuyển",
        "Đang giao hàng": "Đang giao hàng",
        "Chờ phát lại": "Chờ phát lại",
        "Giao thành công": "Giao thành công",
        "Chờ xử lý": "Chờ xử lý",
        // Bảng 2
        "Tạo mới": "Tạo mới",
        "Đã tiếp nhận": "Đã tiếp nhận",
        "Đang lấy hàng": "Đang lấy hàng",
        "Tồn - Lấy không thành công": "Tồn - Lấy không thành công",
        "Đã hủy giao": "Đã hủy giao",
        "VTP hủy lấy": "VTP hủy lấy",
        "Shop hủy lấy": "Shop hủy lấy",
        "Đang xác minh bồi thường": "Đang xác minh bồi thường",
        "Đã bồi thường": "Đã bồi thường"
    };

    const rows1 = document.querySelectorAll("#thong-ke .table-card:nth-child(1) tbody tr");
    const rows2 = document.querySelectorAll("#thong-ke .table-card:nth-child(2) tbody tr");
    const allRows = [...rows1, ...rows2];

    if (Array.isArray(data.statusDetails)) {
       allRows.forEach(row => {
           const statusTextElement = row.querySelector("td:first-child");
           // Lấy text trạng thái, loại bỏ span.dot
           const statusText = statusTextElement ? statusTextElement.textContent.trim() : null;

           if (statusText) {
               const apiStatusData = data.statusDetails.find(item => statusMapping[item.status] === statusText);
               const ordersCell = row.children[1];
               const codCell = row.children[2];
               const feeCell = row.children[3];

               if (apiStatusData) {
                   if(ordersCell) ordersCell.textContent = apiStatusData.orders || 0;
                   if(codCell) codCell.textContent = (apiStatusData.cod || 0).toLocaleString("vi-VN") + " ₫";
                   if(feeCell) feeCell.textContent = (apiStatusData.fee || 0).toLocaleString("vi-VN") + " ₫";
               } else {
                   // Reset nếu không có data cho trạng thái này
                   if(ordersCell) ordersCell.textContent = 0;
                   if(codCell) codCell.textContent = "0 ₫";
                   if(feeCell) feeCell.textContent = "0 ₫";
               }
           }
       });
    } else {
        console.warn("⚠️ statusDetails không phải là array hoặc không tồn tại.");
         // Reset tất cả các dòng nếu không có statusDetails
         allRows.forEach(row => {
             const ordersCell = row.children[1];
             const codCell = row.children[2];
             const feeCell = row.children[3];
             if(ordersCell) ordersCell.textContent = 0;
             if(codCell) codCell.textContent = "0 ₫";
             if(feeCell) feeCell.textContent = "0 ₫";
         });
    }
    // --- Kết thúc cập nhật bảng ---
  }

  /**
   * -----------------------------------------------------
   * 🔹 6️⃣ Cập nhật UI phần dòng tiền
   * -----------------------------------------------------
   */
  function updateCashflowUI(data) {
    console.log("💰 Cập nhật UI Dòng tiền với data:", data); // Thêm log
    // --- Thêm kiểm tra data ---
     if (!data) {
        console.warn("⚠️ Không có dữ liệu để cập nhật UI Dòng tiền.");
        return;
    }
    // --- Kết thúc kiểm tra ---

    const balanceEl = document.querySelector("#dong-tien .cash-summary-item.blue b");
    const withdrawEl = document.querySelector("#dong-tien .cash-summary-item.red-outline b");
    const topupEl = document.querySelector("#dong-tien .cash-summary-item.white b"); // Sửa tên biến cho rõ ràng

    // --- Cập nhật Số dư, Rút tiền, Nạp cước ---
    if (balanceEl) balanceEl.textContent = (data.balance || 0).toLocaleString("vi-VN") + " ₫";
    // Giả sử API trả về withdrawPending hoặc tương tự
    if (withdrawEl) withdrawEl.textContent = (data.withdrawPending || data.withdraw || 0).toLocaleString("vi-VN") + " ₫";
    // Giả sử API trả về topupTotal hoặc tương tự
    if (topupEl) topupEl.textContent = (data.topupTotal || data.topup || 0).toLocaleString("vi-VN") + " ₫";
    // --- Kết thúc cập nhật ---


    // --- Cập nhật Tiền hàng: Đang luân chuyển, Chờ trả ---
    const movingEl = document.querySelector("#dong-tien .cashflow-column:nth-child(1) .info-card:nth-child(1) b");
    const waitingEl = document.querySelector("#dong-tien .cashflow-column:nth-child(1) .info-card:nth-child(2) b");
    // Giả sử API trả về cargoFlow { moving, waiting }
    if (data.cargoFlow) {
        if (movingEl) movingEl.textContent = (data.cargoFlow.moving || 0).toLocaleString("vi-VN") + " ₫";
        if (waitingEl) waitingEl.textContent = (data.cargoFlow.waiting || 0).toLocaleString("vi-VN") + " ₫";
    } else {
         if (movingEl) movingEl.textContent = "0 ₫";
         if (waitingEl) waitingEl.textContent = "0 ₫";
    }
    // --- Kết thúc cập nhật Tiền hàng ---

    // --- Cập nhật Cước phí: Nợ cước, Đã trả 7 ngày ---
    const debtEl = document.querySelector("#dong-tien .cashflow-column:nth-child(2) .info-card:nth-child(1) b");
    const paid7DaysEl = document.querySelector("#dong-tien .cashflow-column:nth-child(2) .info-card:nth-child(2) b");
     // Giả sử API trả về feeFlow { debt, paidLast7Days }
    if (data.feeFlow) {
        if (debtEl) debtEl.textContent = (data.feeFlow.debt || 0).toLocaleString("vi-VN") + " ₫";
        if (paid7DaysEl) paid7DaysEl.textContent = (data.feeFlow.paidLast7Days || 0).toLocaleString("vi-VN") + " ₫";
    } else {
        if (debtEl) debtEl.textContent = "0 ₫";
        if (paid7DaysEl) paid7DaysEl.textContent = "0 ₫";
    }
     // --- Kết thúc cập nhật Cước phí ---

     // --- Cập nhật Biểu đồ (Placeholder - cần logic vẽ biểu đồ thực tế) ---
     // Cập nhật biểu đồ Tiền hàng (line chart)
     // Cập nhật biểu đồ Cước phí (bar chart)
     console.log("📈 TODO: Cập nhật biểu đồ với dữ liệu (nếu có)");
     // --- Kết thúc cập nhật biểu đồ ---
  }


  /**
   * -----------------------------------------------------
   * 🔹 7️⃣ Xử lý khi bị 401 (hết hạn đăng nhập)
   * -----------------------------------------------------
   */
  function handle401() {
    console.warn("⚠️ Token không hợp lệ hoặc hết hạn. Đang xử lý...");
    showAuthWarning();
    localStorage.removeItem("accessToken"); // Xóa token cũ
    sessionStorage.removeItem("accessToken"); // Xóa token cũ (nếu có)
    // Cân nhắc chuyển hướng về trang login sau 1-2 giây
    // setTimeout(() => { window.location.href = '/login.html'; }, 2000);
    return false; // Trả về false để báo hiệu xử lý thất bại
  }

  /**
   * -----------------------------------------------------
   * 🔹 8️⃣ Hiển thị thông báo xác thực
   * -----------------------------------------------------
   */
  function showAuthWarning() {
    let warningDiv = document.querySelector(".auth-warning"); // Tìm div đã có
    if (!warningDiv) { // Nếu chưa có thì tạo mới
      warningDiv = document.createElement("div");
      warningDiv.className = "auth-warning";
      warningDiv.style.cssText =
        "background:#fff3cd; color:#856404; padding:15px; margin: 20px; text-align:center; border:1px solid #ffeeba; border-radius: 8px; font-weight: bold; position: sticky; top: 70px; z-index: 1001;"; // Style đẹp hơn
      warningDiv.textContent =
        "⚠️ Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Dữ liệu có thể không được cập nhật. Vui lòng đăng nhập lại.";

        // Chèn vào đầu thẻ main hoặc body nếu main không tồn tại
        const mainElement = document.querySelector('main') || document.body;
         if (mainElement.firstChild) {
            mainElement.insertBefore(warningDiv, mainElement.firstChild);
         } else {
            mainElement.appendChild(warningDiv);
         }
    }
  }


  /**
   * -----------------------------------------------------
   * 🔹 9️⃣ Hiển thị lỗi UI chung
   * -----------------------------------------------------
   */
  function showErrorUI(message) {
      // Tránh hiển thị nhiều lỗi trùng lặp
      if (document.querySelector(`.error-ui[data-message="${message}"]`)) return;

      const div = document.createElement("div");
      div.className = "error-ui"; // Thêm class để dễ quản lý
      div.setAttribute("data-message", message); // Lưu message để tránh trùng lặp
      div.style.cssText =
        "background:#f8d7da; color:#721c24; padding:10px 15px; margin:15px 20px; text-align:center; border:1px solid #f5c6cb; border-radius: 6px; font-size:14px;";
      div.textContent = `❌ ${message}`; // Thêm icon lỗi

      // Chèn vào cuối thẻ main hoặc body
      const mainElement = document.querySelector('main') || document.body;
      mainElement.appendChild(div);

      // Tự động xóa sau vài giây (tùy chọn)
      // setTimeout(() => div.remove(), 7000);
  }


  // =====================================================
  // Xuất module ra global để gọi thủ công nếu cần
  // =====================================================
  console.log("📦 CargoData module defined."); // Log khi module được định nghĩa
  return { init, refresh: init };
})();

// --- XÓA BỎ KHỐI document.addEventListener("DOMContentLoaded") Ở ĐÂY ---
// Logic khởi tạo sẽ được gọi từ file HTML tương ứng (cargo-value.html)
 console.log("🔧 cargo-data.js script finished execution. Waiting for init() call."); // Log cuối file