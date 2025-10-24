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

    let chart = null; // Global chart instance

    // --- Helper Function ---
    function showErrorUI(message, containerSelector = ".report-content") {
        const container = document.querySelector(containerSelector);
        if (!container) return;
        const oldError = container.querySelector('.error-ui-revenue');
        if(oldError) oldError.remove();
        const div = document.createElement("div");
        div.className = "error-ui-revenue";
        div.style.cssText = "background:#f8d7da; color:#721c24; padding:10px 15px; margin:15px 0; text-align:center; border:1px solid #f5c6cb; border-radius: 6px; font-size:14px;";
        div.textContent = `❌ ${message}`;
        container.insertBefore(div, container.firstChild);
    }

    // --- SỬA LẠI HÀM TẠO MÀU ---
    function generateDistinctColors(count) {
        const colors = [];
        // Danh sách màu cơ bản lớn hơn
        const baseColors = [
            '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
            '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
            '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
        ];
        if (count <= 0) return colors;
        for (let i = 0; i < count; i++) {
            colors.push(baseColors[i % baseColors.length]);
        }
        if (count > baseColors.length) {
            console.warn(`[Color Gen Revenue] Số lượng màu (${count}) lớn hơn bảng màu (${baseColors.length}), màu có thể lặp lại.`);
        }
        console.log(`[Color Gen Revenue] Generated ${count} colors.`);
        return colors;
    }
    // ============================

    // --- Load Revenue Statistics (Thêm Logging) ---
    async function loadRevenueStatistics(from, to) {
        // === THÊM LOGGING ===
        console.log(`📦 Đang tải thống kê doanh thu cho: ${from} -> ${to}`);
        // =====================
        const token = getAccessToken ? getAccessToken() : null;

        const valueBlue = document.querySelector(".cards .value.blue");
        const valueCyan = document.querySelector(".cards .value.cyan");
        const valueYellow = document.querySelector(".cards .value.yellow");
        const tbody = document.querySelector(".table-container tbody");

        if (!valueBlue || !valueCyan || !valueYellow || !tbody) { /* Error handling */ return; }

        try {
            valueBlue.textContent = '...'; valueCyan.textContent = '...'; valueYellow.textContent = '...';
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Đang tải dữ liệu...</td></tr>`;

            // New behavior: call /orders/filter to retrieve all orders in the range and aggregate client-side
            const baseFilterUrl = `${API_BASE_URL}/orders/filter?from=${from}&to=${to}`;
            const headers = { "Content-Type": "application/json" };
            if (token) { headers["Authorization"] = `Bearer ${token}`; }

            console.log("🔄 Fetching orders for revenue aggregation (base):", baseFilterUrl);

            // Helper to normalize orders array from various response shapes
            function extractOrdersFromResponse(json) {
                if (!json) return [];
                if (Array.isArray(json)) return json;
                if (Array.isArray(json.data)) return json.data;
                if (Array.isArray(json.result)) return json.result;
                if (Array.isArray(json.orders)) return json.orders;
                return [];
            }

            // Try to fetch all pages if API supports pagination; use a large limit as a fallback
            const pageLimit = 1000; // try to fetch many items per page
            let allOrders = [];
            let page = 1;
            let keepFetching = true;

            while (keepFetching) {
                const pageUrl = `${baseFilterUrl}&page=${page}&limit=${pageLimit}`;
                console.log(`   -> Fetching page ${page}:`, pageUrl);
                const resp = await fetch(pageUrl, { headers });
                const txt = await resp.text().catch(() => null);
                if (!resp.ok) {
                    console.error(`❌ HTTP ${resp.status} khi tải orders:`, txt);
                    throw new Error(`HTTP ${resp.status}: ${txt || resp.statusText}`);
                }

                let json;
                try { json = txt ? JSON.parse(txt) : null; } catch (e) {
                    console.error("❌ Lỗi parse JSON từ /orders/filter:", e, "Body:", txt);
                    throw new Error("Dữ liệu trả về từ API /orders/filter không đúng định dạng JSON.");
                }

                const orders = extractOrdersFromResponse(json);
                console.log(`      -> Received ${orders.length} orders on page ${page}`);
                allOrders = allOrders.concat(orders);

                // Determine if we should continue
                const totalPages = json?.meta?.totalPages || json?.meta?.total_pages || json?.pagination?.totalPages || json?.totalPages || null;
                const currentPage = json?.meta?.page || json?.page || json?.pagination?.page || page;

                if (totalPages) {
                    if (page >= totalPages) keepFetching = false; else page += 1;
                } else {
                    // If no pagination info, stop when returned items < limit
                    if (orders.length < pageLimit) keepFetching = false; else page += 1;
                }
            }

            console.log(`✅ Total orders fetched for aggregation: ${allOrders.length}`);

            // Aggregate data into the shape expected by updateUI
            const provinceMap = {};
            let totalRevenue = 0;

            function getOrderRevenue(order) {
                // Try multiple possible fields where revenue/price might be stored
                const candidates = [
                    order.shipping_service?.total_price,
                    order.shipping_service?.totalPrice,
                    order.shipping_service?.price,
                    order.total_price,
                    order.totalPrice,
                    order.total_amount,
                    order.totalAmount,
                    order.amount,
                    order.price,
                    order.grand_total,
                    order.final_price,
                    order.payment?.amount,
                    order.payment_amount,
                    order.cod_cost,
                    order.codCost
                ];
                for (const v of candidates) {
                    if (v !== undefined && v !== null && v !== '') {
                        const n = Number(v);
                        if (!Number.isNaN(n) && n !== 0) return n;
                        if (!Number.isNaN(n) && n === 0) return 0; // explicit zero
                    }
                }

                // Fallback: try to sum item totals if present
                if (Array.isArray(order.items) && order.items.length > 0) {
                    let sum = 0;
                    order.items.forEach(it => {
                        const itCandidates = [it.total_price, it.totalPrice, it.price, it.unit_price, it.unitPrice, it.amount];
                        for (const iv of itCandidates) {
                            if (iv !== undefined && iv !== null && iv !== '') {
                                const inum = Number(iv);
                                if (!Number.isNaN(inum)) { sum += inum; return; }
                            }
                        }
                    });
                    if (sum > 0) return sum;
                }

                return 0;
            }

            // For debugging: capture a few examples where revenue is zero to inspect later
            const zeroRevenueSamples = [];

            allOrders.forEach((o, idx) => {
                const shippingPrice = getOrderRevenue(o);
                totalRevenue += shippingPrice;

                // try several paths for province
                const province = o.receiver?.address?.province || o.receiver?.province || o.receiver_province || o.to_province || o.province || 'Khác';
                if (!provinceMap[province]) provinceMap[province] = { orders: 0, revenue: 0 };
                provinceMap[province].orders += 1;
                provinceMap[province].revenue += shippingPrice;

                if (shippingPrice === 0 && zeroRevenueSamples.length < 5) {
                    zeroRevenueSamples.push({ id: o._id || o.id || o.order_id || `idx_${idx}`, raw: o });
                }
            });

            if (zeroRevenueSamples.length > 0) {
                console.warn(`⚠️ Một số đơn có doanh thu 0 (hiển thị tối đa 5 mẫu) — kiểm tra các trường khả dĩ của order:`);
                console.log(zeroRevenueSamples);
            }

            const details = Object.keys(provinceMap).map(p => ({
                province: p,
                orders: provinceMap[p].orders,
                revenue: provinceMap[p].revenue,
                percentage: 0
            }));

            const totalOrders = allOrders.length;
            const totalProvinces = details.length;

            // compute percentage: prefer revenue share, fallback to order-count share when totalRevenue is zero
            if (totalRevenue > 0) {
                details.forEach(d => { d.percentage = (d.revenue / totalRevenue) * 100; });
            } else {
                console.warn('⚠️ Tổng doanh thu = 0, sẽ tính phần trăm theo tỉ lệ số đơn thay cho doanh thu.');
                details.forEach(d => { d.percentage = totalOrders > 0 ? (d.orders / totalOrders) * 100 : 0; });
            }

            const revenueData = {
                totalOrders: totalOrders,
                totalProvinces: totalProvinces,
                totalRevenue: totalRevenue,
                details: details
            };

            console.log("📊 Aggregated revenueData:", JSON.stringify(revenueData, null, 2));
            updateUI(revenueData);

        } catch (err) {
            console.error("❌ Lỗi khi tải thống kê doanh thu:", err);
            if(valueBlue) valueBlue.textContent = 'Lỗi'; if(valueCyan) valueCyan.textContent = 'Lỗi'; if(valueYellow) valueYellow.textContent = 'Lỗi';
            if(tbody) tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Không thể tải dữ liệu (${err.message})</td></tr>`;
            showErrorUI(`Không thể tải thống kê doanh thu: ${err.message}`);
             // Hủy chart cũ nếu có lỗi
             if (chart) { chart.destroy(); chart = null; }
             const chartPlaceholder = document.querySelector('.chart-placeholder');
             if (chartPlaceholder) {
                  chartPlaceholder.innerHTML = '<div style="text-align:center; padding: 20px; color: #dc3545;">Lỗi tải dữ liệu biểu đồ</div>';
             }
        }
    }

    // --- Update UI (Thêm Logging) ---
    function updateUI(data) {
        const valueBlue = document.querySelector(".cards .value.blue");
        const valueCyan = document.querySelector(".cards .value.cyan");
        const valueYellow = document.querySelector(".cards .value.yellow");
        const tbody = document.querySelector(".table-container tbody");

        if (!valueBlue || !valueCyan || !valueYellow || !tbody) { /* Error handling */ return; }

        // === THÊM LOGGING ===
        console.log("[UI Update] Bắt đầu cập nhật UI với data:", JSON.stringify(data, null, 2));
        // =====================

        if (!data || typeof data !== 'object') { // Kiểm tra data là object
            console.warn("⚠️ Dữ liệu không hợp lệ (không phải object) để cập nhật UI.");
            valueBlue.textContent = 'N/A'; valueCyan.textContent = 'N/A'; valueYellow.textContent = 'N/A';
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Dữ liệu không hợp lệ</td></tr>`;
            if (chart) { chart.destroy(); chart = null; }
             const chartPlaceholder = document.querySelector('.chart-placeholder');
             if (chartPlaceholder) chartPlaceholder.innerHTML = '<div style="text-align:center; padding: 20px; color: #6c757d;">Dữ liệu biểu đồ không hợp lệ</div>';
            return;
        }

        // Update 3 cards
        valueBlue.textContent = data.totalOrders || 0;
        valueCyan.textContent = data.totalProvinces || 0;
        valueYellow.textContent = (data.totalRevenue || 0).toLocaleString("vi-VN") + " ₫";
        console.log(`[UI Update] Cards updated: Orders=${data.totalOrders || 0}, Provinces=${data.totalProvinces || 0}, Revenue=${data.totalRevenue || 0}`);


        // Update table
        const details = Array.isArray(data.details) ? data.details : []; // Đảm bảo details là array
        // === THÊM LOGGING ===
        console.log("[UI Update] Dữ liệu 'details' để hiển thị bảng:", JSON.stringify(details, null, 2));
        // =====================
        tbody.innerHTML = ""; // Clear table body

        if (details.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="empty-row">Không có bản ghi nào</td></tr>`;
            console.log("[UI Update] Bảng không có dữ liệu.");
            if (chart) { chart.destroy(); chart = null; } // Hủy chart nếu bảng rỗng
             const chartPlaceholder = document.querySelector('.chart-placeholder');
             if (chartPlaceholder) chartPlaceholder.innerHTML = '<div style="text-align:center; padding: 20px; color: #6c757d;">Không có dữ liệu biểu đồ</div>';
            return; // Dừng nếu không có details
        }

        // Sort details by percentage (giữ nguyên)
        const sortedDetails = [...details].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
         // === THÊM LOGGING ===
         console.log("[UI Update] Dữ liệu 'details' sau khi sắp xếp:", JSON.stringify(sortedDetails, null, 2));
         // =====================

        sortedDetails.forEach((item, i) => {
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
        console.log(`[UI Update] Đã render ${sortedDetails.length} dòng vào bảng.`);


        // Render doughnut chart
        const chartPlaceholder = document.querySelector('.chart-placeholder');
        if (!chartPlaceholder) { console.error("❌ Chart placeholder not found!"); return; }

        chartPlaceholder.innerHTML = ''; // Clear placeholder
        chartPlaceholder.style.cssText = 'width: 100%; height: 250px; position: relative; background: transparent;'; // Đặt style

        let canvas = document.createElement('canvas'); // Tạo canvas mới
        canvas.style.cssText = 'width: 100%; height: 100%;';
        chartPlaceholder.appendChild(canvas);

        if (chart) { chart.destroy(); chart = null; } // Hủy chart cũ

        const ctx = canvas.getContext('2d');

        // Prepare chart data
        const labels = sortedDetails.map(item => item.province || 'Không rõ');
        const percentages = sortedDetails.map(item => item.percentage || 0);
         // === THÊM LOGGING ===
         console.log("[Chart Data] Labels:", labels);
         console.log("[Chart Data] Percentages:", percentages);
         // =====================

        // Generate distinct colors using the fixed function
        const colors = generateDistinctColors(labels.length); // <<< Gọi hàm mới

        try {
             chart = new Chart(ctx, {
                 type: 'doughnut',
                 data: {
                     labels: labels,
                     datasets: [{
                         data: percentages,
                         backgroundColor: colors,
                         borderWidth: 0, // Bỏ viền chart
                         // borderColor: '#fff' // Không cần nếu borderWidth=0
                     }]
                 },
                 options: {
                     responsive: true,
                     maintainAspectRatio: false, // Cho phép co giãn tốt hơn
                     plugins: {
                         legend: {
                             position: 'right', // Chú giải bên phải
                             labels: { padding: 15, font: {size: 11}, boxWidth: 12 }
                         },
                         tooltip: {
                             callbacks: {
                                 // Tooltip hiển thị Tên tỉnh: xx.xx%
                                 label: function(context) {
                                     let label = context.label || '';
                                     let value = context.parsed || 0; // parsed là giá trị % đã được chart tính
                                     return ` ${label}: ${value.toFixed(2)}%`;
                                 }
                             }
                         }
                     }
                 }
             });
             console.log("[UI Update] Đã vẽ biểu đồ Doughnut cho doanh thu.");
        } catch(chartError) {
             console.error("❌ Lỗi khi vẽ biểu đồ doanh thu:", chartError);
             showErrorUI("Lỗi hiển thị biểu đồ doanh thu.", ".chart-placeholder"); // Hiển thị lỗi ngay tại placeholder
        }

        // --- Update Pagination Info (Giữ nguyên logic cũ) ---
        const pageInfo = document.querySelector(".pagination span:nth-of-type(2)");
        if (pageInfo) {
            const totalItems = data.totalItems || details.length; // Ưu tiên totalItems từ API nếu có
            // Cập nhật text dựa trên logic phân trang thực tế (nếu có)
            // Ví dụ đơn giản: hiển thị tổng số dòng
            pageInfo.textContent = `${details.length} kết quả`;
            console.log(`[UI Update] Cập nhật thông tin phân trang (hiển thị ${details.length} kết quả).`);
        }
        // --- End Update Pagination Info ---
    }


    // --- Initialize Date Picker Change Listener (Giữ nguyên) ---
    function initializeDatePickerListener() {
        const datePickerInput = document.querySelector("#date-range-picker");
        if (datePickerInput?._flatpickr?.config?.onChange) { // Kiểm tra kỹ hơn
            console.log("👂 Gắn listener onChange cho Flatpickr...");
            // Đảm bảo không gắn trùng lặp (kiểm tra nếu listener đã tồn tại)
            const reloadListener = (selectedDates) => {
                 if (selectedDates.length === 2) {
                     const from = selectedDates[0].toISOString();
                     // Set end date to end of day UTC
                     const toDate = selectedDates[1];
                     toDate.setUTCHours(23, 59, 59, 999);
                     const to = toDate.toISOString();

                     console.log("🗓️ Date range changed (Flatpickr), reloading statistics:", from, to);
                     loadRevenueStatistics(from, to);
                 }
            };
            // Kiểm tra xem listener đã tồn tại chưa trước khi push
             if (!datePickerInput._flatpickr.config.onChange.some(fn => fn.toString() === reloadListener.toString())) {
                  datePickerInput._flatpickr.config.onChange.push(reloadListener);
                  console.log("   -> Listener đã được thêm.");
             } else {
                  console.log("   -> Listener đã tồn tại, không thêm lại.");
             }
        } else {
            console.warn("⚠️ Flatpickr instance hoặc config.onChange không tìm thấy khi gắn listener.");
        }
    }

    // --- Initial Load Function (Giữ nguyên) ---
    function initialLoad() {
        const datePickerInput = document.querySelector("#date-range-picker");
        let rangeToLoad = { from: null, to: null };

        // Ưu tiên lấy ngày từ Flatpickr nếu đã khởi tạo và chọn
        if (datePickerInput?._flatpickr?.selectedDates?.length === 2) {
            const selectedDates = datePickerInput._flatpickr.selectedDates;
            rangeToLoad.from = selectedDates[0].toISOString();
             // Set end date to end of day UTC
             const toDate = selectedDates[1];
             toDate.setUTCHours(23, 59, 59, 999);
            rangeToLoad.to = toDate.toISOString();
            console.log("🚀 Gọi API lần đầu với range từ Flatpickr (đã sẵn sàng):", rangeToLoad.from, rangeToLoad.to);
        } else {
             // Nếu Flatpickr chưa sẵn sàng, dùng ngày mặc định (14 ngày qua, End of Day UTC)
            console.warn("⚠️ Flatpickr chưa sẵn sàng hoặc chưa chọn range. Dùng range mặc định.");
            const now = new Date();
             const toDateDefault = new Date(now); // Clone now
             toDateDefault.setUTCHours(23, 59, 59, 999);
            rangeToLoad.to = toDateDefault.toISOString();

             const fromDateDefault = new Date(now);
             fromDateDefault.setUTCDate(now.getUTCDate() - 13); // 14 ngày tính cả hôm nay
             fromDateDefault.setUTCHours(0, 0, 0, 0);
            rangeToLoad.from = fromDateDefault.toISOString();
            console.log("🚀 Gọi API lần đầu với range dự phòng (14 ngày UTC):", rangeToLoad.from, rangeToLoad.to);
        }

        if (rangeToLoad.from && rangeToLoad.to) {
             loadRevenueStatistics(rangeToLoad.from, rangeToLoad.to);
        } else {
             console.error("❌ Không thể xác định khoảng ngày để tải dữ liệu lần đầu.");
             showErrorUI("Lỗi xác định khoảng ngày. Vui lòng thử lại.");
        }
    }


    // --- Public methods ---
    return {
        loadRevenueStatistics, // Có thể gọi lại từ bên ngoài nếu cần
        initializeDatePickerListener,
        initialLoad // Hàm được gọi bởi initRevenuePage
    };

})();

// --- Initialization is handled by initRevenuePage in revenue.html ---
console.log("🔧 revenue-data.js script executed. Waiting for initRevenuePage().");
