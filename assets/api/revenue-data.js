src="config.js">

 document.addEventListener("DOMContentLoaded", () => {
  // Đảm bảo API_CONFIG đã được load
  if (!window.API_CONFIG) {
    console.error("❌ API_CONFIG chưa được load. Hãy chắc chắn file config.js nằm trước revenue-data.js trong HTML.");
    return;
  }

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;
  const datePicker = document.querySelector("#date-range-picker");

  console.log("🟢 revenue-data.js loaded, base =", API_BASE_URL);

  async function loadRevenueStatistics(from, to) {
    try {
      const url = `${API_BASE_URL}/orders/statistics/revenue?from=${from}&to=${to}`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      console.log("🔄 Fetching revenue data:", url);
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log("✅ Revenue data:", data);
      updateUI(data);
    } catch (err) {
      console.error("❌ Lỗi khi tải thống kê doanh thu:", err);
    }
  }

  function updateUI(data) {
    // Update 3 cards
    document.querySelector(".value.blue").textContent = data.totalOrders || 0;
    document.querySelector(".value.cyan").textContent = data.totalProvinces || 0;
    document.querySelector(".value.yellow").textContent =
      (data.totalRevenue || 0).toLocaleString("vi-VN") + " ₫";

    // Update table
    const tbody = document.querySelector("tbody");
    tbody.innerHTML = "";
    if (!data.details || data.details.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Không có bản ghi nào</td></tr>`;
      return;
    }

    data.details.forEach((item, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${item.province || "—"}</td>
        <td>${item.orders || 0}</td>
        <td>${(item.revenue || 0).toLocaleString("vi-VN")} ₫</td>
        <td>${(item.percentage || 0).toFixed(2)}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Khi chọn lại khoảng thời gian trong Flatpickr
  datePicker._flatpickr.config.onChange = (selectedDates) => {
    if (selectedDates.length === 2) {
      const from = selectedDates[0].toISOString();
      const to = selectedDates[1].toISOString();
      loadRevenueStatistics(from, to);
    }
  };

  // Gọi API mặc định khi mở trang
  const defaultRange = datePicker._flatpickr.selectedDates;
  if (defaultRange.length === 2) {
    loadRevenueStatistics(
      defaultRange[0].toISOString(),
      defaultRange[1].toISOString()
    );
  }
});
