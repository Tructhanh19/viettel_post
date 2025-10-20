// Ensure config.js is loaded first in HTML

window.RevenueData = (function () {
    "use strict";

    // --- Check API config ---
    if (!window.API_CONFIG) {
        console.error("❌ API_CONFIG chưa được load! Ensure config.js is loaded before revenue-data.js.");
        return { // Return dummy object
            loadRevenueStatistics: () => console.error("RevenueData: API_CONFIG missing.")
        };
    }

    const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;

    // --- Helper Function ---
     function showErrorUI(message, containerSelector = ".report-content") {
        const container = document.querySelector(containerSelector);
        if (!container) return; // Exit if container not found

        // Remove previous error message if exists
        const oldError = container.querySelector('.error-ui-revenue');
        if(oldError) oldError.remove();

        const div = document.createElement("div");
        div.className = "error-ui-revenue"; // Specific class
        div.style.cssText =
            "background:#f8d7da; color:#721c24; padding:10px 15px; margin:15px 0; text-align:center; border:1px solid #f5c6cb; border-radius: 6px; font-size:14px;";
        div.textContent = `❌ ${message}`;
        container.insertBefore(div, container.firstChild); // Insert at the top of the container
    }


    // --- Load Revenue Statistics ---
    async function loadRevenueStatistics(from, to) {
        console.log("📦 Đang tải thống kê doanh thu...");
        const token = getAccessToken ? getAccessToken() : null;

        // --- Get UI Elements (inside function) ---
        const valueBlue = document.querySelector(".cards .value.blue");
        const valueCyan = document.querySelector(".cards .value.cyan");
        const valueYellow = document.querySelector(".cards .value.yellow");
        const tbody = document.querySelector(".table-container tbody");

        if (!valueBlue || !valueCyan || !valueYellow || !tbody) {
             console.error("❌ Thiếu các thành phần UI cần thiết trong revenue-data.js!");
             showErrorUI("Lỗi giao diện, không thể hiển thị dữ liệu.");
             return; // Stop execution if UI elements are missing
        }
        // --- End Get UI Elements ---

        try {
            // --- Reset/Loading state ---
            valueBlue.textContent = '...';
            valueCyan.textContent = '...';
            valueYellow.textContent = '...';
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Đang tải dữ liệu...</td></tr>`;
            // --- End Reset/Loading state ---


            const url = `${API_BASE_URL}/orders/statistics/revenue?from=${from}&to=${to}`;
            const headers = { "Content-Type": "application/json" };
            if (token) {
                 headers["Authorization"] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            console.log("🔄 Fetching revenue data:", url, "Headers:", headers);
            const res = await fetch(url, { headers });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ HTTP ${res.status} khi tải revenue:`, errorText);
                throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }
            const data = await res.json();
            const revenueData = data.result || data.data || data; // Handle potential wrappers
            console.log("✅ Revenue data received:", revenueData);
            updateUI(revenueData); // Call updateUI with the correct data structure

        } catch (err) {
            console.error("❌ Lỗi khi tải thống kê doanh thu:", err);
            // Reset UI elements on error
             if(valueBlue) valueBlue.textContent = 'Lỗi';
             if(valueCyan) valueCyan.textContent = 'Lỗi';
             if(valueYellow) valueYellow.textContent = 'Lỗi';
             if(tbody) tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Không thể tải dữ liệu (${err.message})</td></tr>`;
             showErrorUI(`Không thể tải thống kê doanh thu: ${err.message}`);
        }
    }

    // --- Update UI ---
    function updateUI(data) {
         // --- Get UI Elements (inside function) ---
        const valueBlue = document.querySelector(".cards .value.blue");
        const valueCyan = document.querySelector(".cards .value.cyan");
        const valueYellow = document.querySelector(".cards .value.yellow");
        const tbody = document.querySelector(".table-container tbody");

        if (!valueBlue || !valueCyan || !valueYellow || !tbody) {
             console.error("❌ Thiếu các thành phần UI cần thiết trong updateUI!");
             return;
        }
        // --- End Get UI Elements ---

        // Check if data exists
        if (!data) {
             console.warn("⚠️ Dữ liệu không hợp lệ để cập nhật UI.");
             valueBlue.textContent = 'N/A';
             valueCyan.textContent = 'N/A';
             valueYellow.textContent = 'N/A';
             tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Dữ liệu không hợp lệ</td></tr>`;
             return;
        }

        // Update 3 cards
        valueBlue.textContent = data.totalOrders || 0;
        valueCyan.textContent = data.totalProvinces || 0;
        valueYellow.textContent =
            (data.totalRevenue || 0).toLocaleString("vi-VN") + " ₫";

        // Update table
        const details = data.details || []; // Ensure details is an array
        tbody.innerHTML = ""; // Clear previous content
        if (!details || details.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Không có bản ghi nào</td></tr>`;
            return;
        }

        details.forEach((item, i) => {
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

        // --- TODO: Update Pagination Info ---
        const pageInfo = document.querySelector(".pagination span:nth-of-type(2)");
        if (pageInfo) {
            // Assuming API provides pagination data like currentPage, totalItems, itemsPerPage
            const totalItems = data.totalItems || details.length; // Example
            pageInfo.textContent = `${totalItems} of ${totalItems}`; // Update based on actual pagination logic
        }
        // --- End Update Pagination Info ---
    }


    // --- Initialize Date Picker Change Listener ---
    function initializeDatePickerListener() {
         const datePickerInput = document.querySelector("#date-range-picker");
         if (datePickerInput && datePickerInput._flatpickr) {
             console.log("👂 Gắn listener onChange cho Flatpickr...");
             // Store the original onChange if needed, or define it here
             datePickerInput._flatpickr.config.onChange.push((selectedDates, dateStr, instance) => { // Use .push to add listener
                if (selectedDates.length === 2) {
                    const from = selectedDates[0].toISOString();
                    const to = selectedDates[1].toISOString();
                     console.log("🗓️ Date range changed, reloading statistics:", from, to);
                    loadRevenueStatistics(from, to); // Reload data on change
                }
             });
         } else {
              console.warn("⚠️ Flatpickr instance for #date-range-picker not found when initializing listener.");
         }
    }

    // --- Initial Load Function ---
     function initialLoad() {
        const datePickerInput = document.querySelector("#date-range-picker");
         if (datePickerInput && datePickerInput._flatpickr && datePickerInput._flatpickr.selectedDates.length === 2) {
             const defaultRange = datePickerInput._flatpickr.selectedDates;
             console.log("🚀 Gọi API lần đầu với range mặc định:", defaultRange[0].toISOString(), defaultRange[1].toISOString());
             loadRevenueStatistics(
                 defaultRange[0].toISOString(),
                 defaultRange[1].toISOString()
             );
         } else {
             console.warn("⚠️ Không tìm thấy date range mặc định hoặc Flatpickr chưa sẵn sàng khi gọi initialLoad.");
             // Optionally, load with a default range if picker isn't ready
             const now = new Date();
             const defaultEnd = now.toISOString();
             const defaultStart = new Date(now.setDate(now.getDate() - 13)).toISOString(); // Default 14 days ago
             console.log("🚀 Gọi API lần đầu với range dự phòng (14 ngày):", defaultStart, defaultEnd);
             loadRevenueStatistics(defaultStart, defaultEnd);
         }
     }


    // --- Public methods ---
    return {
        loadRevenueStatistics,
        initializeDatePickerListener, // Expose listener setup
        initialLoad // Expose initial load function
    };

})();

// --- REMOVED document.addEventListener("DOMContentLoaded") ---
// Initialization logic (like initialLoad and initializeDatePickerListener)
// should now be called from within the initRevenuePage function in revenue.html
console.log("🔧 revenue-data.js script executed. Waiting for initRevenuePage() to call RevenueData methods.");