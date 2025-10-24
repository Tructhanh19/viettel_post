/**
 * dashboard-stats.js
 * Cập nhật nội dung cho trang chủ dashboard (index.html gốc).
 * Cập nhật: Dùng API THẬT, đếm từ /get-all, dùng selectors gốc, SỬA MÀU CHART, giữ tooltip.
 */

(function () {
    'use strict';

    // Biến toàn cục
    let API_BASE_URL;
    let getAccessToken;
    let topProvincesChart = null;
    let startDateInput, endDateInput;
    let allOrdersCache = [];
    let isFetchingAll = false;

    // Chỉ cần màu cho trạng thái thẻ, không cần cho chart nữa
    const STATUS_COLORS = { DELIVERED: '#28a745', RETURNED: '#ffc107', DEFAULT: '#adb5bd' };

    /** Chờ config.js load */
    function waitForConfig(timeout = 7000, interval = 100) {
        return new Promise((resolve) => {
            let elapsedTime = 0;
            const checkInterval = setInterval(() => {
                if (window.API_CONFIG?.BASE_URL && typeof window.API_CONFIG?.getAccessToken === 'function') {
                    clearInterval(checkInterval); console.log(`✅ API_CONFIG sẵn sàng sau ${elapsedTime}ms.`); resolve(true);
                } else {
                    elapsedTime += interval; if (elapsedTime >= timeout) { clearInterval(checkInterval); console.error(`❌ Không tìm thấy API_CONFIG hợp lệ sau ${timeout}ms.`); resolve(false); }
                }
            }, interval);
        });
     }

    /** Khởi tạo chính */
    async function mainInit() {
        console.log("🚀 Bắt đầu mainInit...");
        const configReady = await waitForConfig();
        if (!configReady) { showError("Lỗi cấu hình hệ thống (config.js)."); resetUIOnError(); displayConfigErrorUI(); return; }

        API_BASE_URL = window.API_CONFIG.BASE_URL; getAccessToken = window.API_CONFIG.getAccessToken;
        console.log(`👍 Sử dụng API Base URL: ${API_BASE_URL}`); console.log('🚀 KHỞI TẠO DashboardStats (API Thật + Đếm từ /get-all)...');

        const datePickers = document.querySelectorAll('.content-header .date-picker input[type="date"]');
        if (datePickers.length === 2) {
             startDateInput = datePickers[0]; endDateInput = datePickers[1]; initDatePickers(); fetchAllAndProcessOrders();
        } else { console.error("❌ Không tìm thấy đủ 2 input date."); fetchAllAndProcessOrders(true); }
        updateUsernameDisplay();
    }

    /** Hiển thị lỗi config trên UI */
    function displayConfigErrorUI() {
        const dashboardDiv = document.querySelector('.dashboard');
        if (dashboardDiv && !document.getElementById('config-error-msg')) {
             const errorDiv = document.createElement('div'); errorDiv.id = 'config-error-msg';
             errorDiv.style.cssText = 'background:#f8d7da;color:#721c24;padding:15px;margin:10px 0;border:1px solid #f5c6cb;border-radius:6px;text-align:center;font-weight:bold;';
             errorDiv.textContent = 'Lỗi cấu hình API!'; dashboardDiv.parentNode.insertBefore(errorDiv, dashboardDiv);
             const overlay = document.getElementById('loading-overlay'); if (overlay) overlay.style.display = 'none';
        }
     }

    /** Khởi tạo Date Pickers */
    function initDatePickers() {
        const today = new Date(); const endDateDefault = today.toISOString().split('T')[0]; const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(today.getDate() - 6); const startDateDefault = sevenDaysAgo.toISOString().split('T')[0];
        if (!startDateInput.value) startDateInput.value = startDateDefault; if (!endDateInput.value) endDateInput.value = endDateDefault;
        startDateInput.addEventListener('change', processOrdersWithSelectedDate); endDateInput.addEventListener('change', processOrdersWithSelectedDate);
        console.log("📅 Date pickers initialized:", startDateInput.value, "to", endDateInput.value);
     }

    /** Lấy ngày mặc định UTC */
    function getDefaultStartDateUTC() { const d = new Date(); d.setUTCDate(d.getUTCDate() - 6); d.setUTCHours(0, 0, 0, 0); return d; }
    function getDefaultEndDateUTC() { const d = new Date(); d.setUTCHours(23, 59, 59, 999); return d; }

    /** Xử lý lại cache khi ngày thay đổi */
    function processOrdersWithSelectedDate() {
        if (isFetchingAll) { console.log("⏳ Đang tải..."); showError("Đang tải dữ liệu..."); return; }
        if (allOrdersCache.length === 0 && !isFetchingAll) { console.warn("⚠️ Cache rỗng, thử tải lại..."); fetchAllAndProcessOrders(); return; }
        const fromDateStr = startDateInput?.value; const toDateStr = endDateInput?.value;
        if (!fromDateStr || !toDateStr || fromDateStr > toDateStr) { console.warn("⚠️ Ngày không hợp lệ."); showError("Vui lòng chọn khoảng ngày hợp lệ."); filterAndDisplayOrders(getDefaultStartDateUTC(), getDefaultEndDateUTC()); return; }
        try {
            const fromDate = new Date(fromDateStr); fromDate.setUTCHours(0, 0, 0, 0); const toDate = new Date(toDateStr); toDate.setUTCHours(23, 59, 59, 999);
            console.log(`🔄 Xử lý lại cache cho (UTC): ${fromDate.toISOString()} -> ${toDate.toISOString()}`); filterAndDisplayOrders(fromDate, toDate);
        } catch (e) { console.error("❌ Lỗi parse ngày:", e); showError("Định dạng ngày không hợp lệ."); filterAndDisplayOrders(getDefaultStartDateUTC(), getDefaultEndDateUTC()); }
     }

     /** Tải TẤT CẢ đơn hàng và xử lý lần đầu */
     async function fetchAllAndProcessOrders(useDefaultDates = false) {
        if (isFetchingAll) { console.log("⏳ Đang tải /get-all..."); return; } isFetchingAll = true; setLoadingState(true, "Đang tải danh sách đơn hàng..."); console.log(`[API Call /get-all] Bắt đầu tải...`);
        try {
            const token = getAccessToken(); if (!API_BASE_URL) throw new Error("API Base URL chưa sẵn sàng."); if (!token) throw new Error("Chưa đăng nhập hoặc lỗi lấy token.");
            const allOrders = await fetchAllOrders(token); allOrdersCache = Array.isArray(allOrders) ? allOrders : []; console.log(`[API Call /get-all] Tải xong ${allOrdersCache.length} đơn.`);
            if (allOrdersCache.length > 0) { console.log("🧐 Cấu trúc đơn hàng đầu tiên:", JSON.stringify(allOrdersCache[0], null, 2)); }
            let fromDate, toDate;
            if (useDefaultDates || !startDateInput?.value || !endDateInput?.value) { fromDate = getDefaultStartDateUTC(); toDate = getDefaultEndDateUTC(); } else { fromDate = new Date(startDateInput.value); fromDate.setUTCHours(0, 0, 0, 0); toDate = new Date(endDateInput.value); toDate.setUTCHours(23, 59, 59, 999); }
            console.log(`🔄 Xử lý lần đầu cho (UTC): ${fromDate.toISOString()} -> ${toDate.toISOString()}`); filterAndDisplayOrders(fromDate, toDate);
        } catch (error) { console.error("❌ Lỗi fetchAllAndProcessOrders:", error.message, error); showError("Lỗi tải danh sách đơn hàng: " + error.message); allOrdersCache = []; resetUIOnError(); }
        finally { isFetchingAll = false; setLoadingState(false); }
     }

     /** Gọi API GET /orders/get-all */
     async function fetchAllOrders(token) {
        const url = `${API_BASE_URL}/orders/get-all`; console.log(`[API Call] GET ${url}`); const headers = { 'Authorization': `Bearer ${token}` };
        const response = await fetch(url, { headers }); const responseBody = await response.text();
        if (!response.ok) { console.error(`[API Error] /get-all ${response.status}:`, responseBody); if (response.status === 401 || response.status === 403) throw new Error("Lỗi xác thực/quyền API (/get-all)."); throw new Error(`Lỗi ${response.status} API /get-all.`); }
        try { const data = JSON.parse(responseBody); const orders = data.result || data; if (!Array.isArray(orders)) { throw new Error("Dữ liệu /get-all không phải mảng."); } return orders; }
        catch(e) { console.error("❌ Lỗi parse JSON /get-all:", e, "Body:", responseBody); throw new Error("Dữ liệu /get-all lỗi JSON."); }
     }

    /** Lọc đơn hàng theo ngày và cập nhật UI */
    function filterAndDisplayOrders(fromDateUTC, toDateUTC) {
        console.log(`[Filter] Lọc ${allOrdersCache.length} đơn từ ${fromDateUTC.toLocaleDateString()} đến ${toDateUTC.toLocaleDateString()} (UTC)`);
        setLoadingState(true, "Đang xử lý dữ liệu...");
        let debugCounter = 0;

        const filteredOrders = allOrdersCache.filter(order => {
             const createdAtString = order.createdDate;
             if (!createdAtString) return false;
             try {
                 const orderDate = new Date(createdAtString);
                 const isValidDate = !isNaN(orderDate.getTime());
                 const isInRange = isValidDate && orderDate >= fromDateUTC && orderDate <= toDateUTC;
                 if (debugCounter < 5) { console.log(`[Debug Filter UTC] Order ID: ${order.id || order.code}, DateStr: ${createdAtString}, ParsedDate: ${isValidDate ? orderDate.toISOString() : 'Invalid'}, IsInRange: ${isInRange}`); debugCounter++; }
                 return isInRange;
             } catch { return false; }
        });
        console.log(`[Filter] Tìm thấy ${filteredOrders.length} đơn.`);

        // --- Đếm trạng thái ---
        let deliveredCount = 0; let returnedCount = 0;
        filteredOrders.forEach(order => {
            const statusCode = order.status?.code;
            if (statusCode === 'DELIVERED') deliveredCount++; else if (statusCode === 'RETURNED') returnedCount++;
        });
        console.log(`[Count] Delivered: ${deliveredCount}, Returned: ${returnedCount}`);
        updateStatsCardsManual(deliveredCount, returnedCount);

        // --- Thống kê tỉnh ---
        const provinceCounts = {};
        filteredOrders.forEach(order => {
            const province = order.receiver?.address?.province?.trim();
            if (province && province !== '') { provinceCounts[province] = (provinceCounts[province] || 0) + 1; }
        });
        console.log("[Count] Thống kê tỉnh:", provinceCounts);
        const provinceChartData = Object.entries(provinceCounts).map(([p, o]) => ({ province: p, orders: o })).filter(p => p.orders > 0);
        renderTopProvincesChartManual(provinceChartData);

        setLoadingState(false);
        updateLastUpdatedTime();
    }

    /** Cập nhật thẻ thống kê */
    function updateStatsCardsManual(deliveredCount, returnedCount) {
        console.log(`[UI Update] Chuẩn bị cập nhật thẻ - Delivered: ${deliveredCount}, Returned: ${returnedCount}`);
        const successCardValueEl = document.querySelector('.stat-card.success .stat-value');
        const failedCardValueEl = document.querySelector('.stat-card.failed .stat-value');

        if (successCardValueEl) {
            console.log("   -> Tìm thấy element '.stat-card.success .stat-value'.");
            successCardValueEl.textContent = formatNumber(deliveredCount);
            console.log(`   ✅ Đã set textContent cho success: ${successCardValueEl.textContent}`);
        } else { console.error("   -> KHÔNG tìm thấy element '.stat-card.success .stat-value'!"); }

        if (failedCardValueEl) {
            console.log("   -> Tìm thấy element '.stat-card.failed .stat-value'.");
            failedCardValueEl.textContent = formatNumber(returnedCount);
            console.log(`   ✅ Đã set textContent cho failed: ${failedCardValueEl.textContent}`);
        } else { console.error("   -> KHÔNG tìm thấy element '.stat-card.failed .stat-value'!"); }
    }

    /** Vẽ biểu đồ Doughnut (Sửa hàm generateDistinctColors) */
    function renderTopProvincesChartManual(provinceData) {
        const ctxElement = document.getElementById('pieChart');
        if (!ctxElement) { console.warn("Canvas #pieChart không tồn tại."); return; }
        const ctx = ctxElement.getContext('2d');
        console.log("[UI Update] Dữ liệu tỉnh để vẽ:", JSON.stringify(provinceData));
        if (topProvincesChart) { topProvincesChart.destroy(); topProvincesChart = null; }

        if (!Array.isArray(provinceData) || provinceData.length === 0) {
            ctx.clearRect(0,0,ctxElement.width,ctxElement.height); ctx.fillStyle='#6c757d'; ctx.textAlign='center'; ctx.font='14px Arial';
            ctx.fillText('Không có dữ liệu tỉnh', ctxElement.width/2, ctxElement.height/2); console.log("Không có dữ liệu tỉnh."); return;
        }

        // --- Logic tính toán top tỉnh ---
        const sortedProvinces = provinceData.sort((a, b) => b.orders - a.orders);
        const topN = 9; const topProvincesData = sortedProvinces.slice(0, topN);
        const otherOrdersCount = sortedProvinces.slice(topN).reduce((sum, p) => sum + p.orders, 0);
        const labels = topProvincesData.map(p => p.province || 'Không rõ');
        const dataValues = topProvincesData.map(p => p.orders);
        if (otherOrdersCount > 0) { labels.push('Tỉnh khác'); dataValues.push(otherOrdersCount); }
        // === SỬ DỤNG HÀM TẠO MÀU ĐÃ SỬA ===
        const backgroundColors = generateDistinctColors(labels.length);
        // ==================================

        try {
            topProvincesChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Số lượng đơn', // Nhãn tooltip sẽ được ghi đè bởi callbacks
                        data: dataValues,
                        backgroundColor: backgroundColors,
                        borderWidth: 0 // Không viền
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '60%',
                    plugins: {
                        legend: { position: 'right', labels: { padding: 15, font: { size: 12 }, boxWidth: 15 } },
                        tooltip: {
                            callbacks: {
                                // === TOOLTIP HIỂN THỊ SỐ LƯỢNG (Giữ nguyên) ===
                                label: function(context) {
                                    let label = context.label || '';
                                    let value = context.raw || 0;
                                    // Tính lại tổng dataValues vì nó có thể thay đổi
                                    let total = dataValues.reduce((a,b)=>a+b,0);
                                    let percentage = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                                    // Chỉ hiển thị Tên tỉnh: Số lượng đơn
                                    return ` ${label}: ${formatNumber(value)}`;
                                    // Nếu muốn hiển thị cả %, dùng dòng dưới:
                                    // return ` ${label}: ${formatNumber(value)} (${percentage})`;
                                }
                                // ==========================================
                            }
                        }
                    }
                }
            });
            console.log("[UI Update] Đã vẽ biểu đồ Doughnut với màu riêng biệt.");
        } catch (chartError) { console.error("❌ Lỗi vẽ biểu đồ:", chartError); /* Error handling UI */ }
    }

    /** Set loading state */
    function setLoadingState(isLoading, message = "") { /* ... Giữ nguyên ... */ }
    /** Reset UI on error */
     function resetUIOnError() { /* ... Giữ nguyên ... */ }
    /** Show error */
    function showError(message) { /* ... Giữ nguyên ... */ }
    /** Cập nhật tên user */
    function updateUsernameDisplay() { /* ... Giữ nguyên ... */ }
    /** Cập nhật thời gian */
    function updateLastUpdatedTime() { /* ... Giữ nguyên ... */ }
    /** Helper: Format số */
    function formatNumber(num) { if (typeof num !== 'number' || isNaN(num)) return '0'; return new Intl.NumberFormat('vi-VN').format(num); }
    /** Helper: Map mã trạng thái */
    function mapStatusName(code) { const m={DELIVERED:"Giao thành công",RETURNED:"Đã hoàn"}; return m[code]||code; } // Chỉ cần 2 trạng thái

    /** === SỬA LẠI HÀM TẠO MÀU === */
    function generateDistinctColors(count) {
        const colors = [];
        // Danh sách màu cơ bản lớn hơn, đa dạng hơn
        const baseColors = [
            '#4E79A7', '#F28E2B', '#E15759', '#76B7B2', '#59A14F',
            '#EDC948', '#B07AA1', '#FF9DA7', '#9C755F', '#BAB0AC',
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            // Thêm một số màu khác nếu cần
            '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
            '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d', '#9edae5'
        ];

        if (count <= 0) return colors;

        for (let i = 0; i < count; i++) {
            // Lặp lại danh sách màu cơ bản
            colors.push(baseColors[i % baseColors.length]);
        }

        if (count > baseColors.length) {
            console.warn(`[Color Gen] Số lượng màu (${count}) lớn hơn bảng màu (${baseColors.length}), màu có thể lặp lại.`);
            // Có thể thêm logic xáo trộn nhẹ màu lặp lại nếu muốn, nhưng thường không cần thiết
        }

        console.log(`[Color Gen] Generated ${count} colors using base palette:`, colors);
        return colors;
    }
    /** ============================ */


    // --- Điểm khởi chạy ---
    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', mainInit); }
    else { if(document.querySelector('.dashboard .stats-cards') && document.getElementById('pieChart')) { mainInit(); } else { console.log("Not Dashboard page, skipping init."); } }

    window.DashboardStats = { reloadData: fetchAllAndProcessOrders };

})();