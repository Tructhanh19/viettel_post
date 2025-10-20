// Ensure config.js is loaded first in HTML

window.ShipmentsData = (function () {
    "use strict";

    // --- Check API config ---
    if (!window.API_CONFIG) {
        console.error("❌ API_CONFIG chưa load! Ensure config.js is loaded before shipments-data.js.");
        return { // Return dummy object
            loadOrders: () => console.error("ShipmentsData: API_CONFIG missing."),
            updateOrderStatus: () => console.error("ShipmentsData: API_CONFIG missing."),
            renderTable: () => console.error("ShipmentsData: API_CONFIG missing.")
        };
    }

    const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;

    let orders = []; // Store orders data internally
    let currentStatusFilter = "Tất cả"; // Keep track of the current filter

    // ===========================
    // Helper: Get Valid Token with Bearer prefix
    // ===========================
    function getValidTokenWithBearer() {
        let token = getAccessToken ? getAccessToken() : null;
        if (!token) return null;
        // Ensure "Bearer " prefix is present
        return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

     // ===========================
    // Helper: Show Error UI
    // ===========================
     function showErrorUI(message, areaSelector = ".table-area") {
        const area = document.querySelector(areaSelector);
        if (area) {
            area.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">❌ ${message}</p>`;
        }
     }


    // ===========================
    // Load danh sách đơn hàng
    // ===========================
    async function loadOrders() {
        console.log("📦 Đang tải danh sách đơn hàng...");
        const tableArea = document.querySelector(".table-area"); // Get element inside function
        if (!tableArea) {
             console.error("❌ Không tìm thấy .table-area!");
             return;
        }
        tableArea.innerHTML = `<p style="text-align: center; padding: 20px;">Đang tải dữ liệu...</p>`;

        const token = getValidTokenWithBearer();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token;

        try {
            const url = `${API_BASE_URL}/orders/get-all`;
            console.log("🔄 Fetching orders from:", url, "Headers:", headers);
            const res = await fetch(url, { headers });

            if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} khi tải orders:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }

            const data = await res.json();
             // --- Data Normalization ---
             const rawOrders = data.result || data.data || (Array.isArray(data) ? data : []);
             orders = rawOrders.map(o => ({ // Map to a consistent structure
                id: o._id?.$oid || o._id || o.id,
                code: o.code || "N/A",
                senderName: o.sender?.name || o.senderName || "N/A",
                receiverName: o.receiver?.name || o.receiverName || "N/A",
                // Combine address parts safely
                receiverAddress: [
                    o.receiver?.address?.detail,
                    o.receiver?.address?.ward,
                    o.receiver?.address?.district,
                    o.receiver?.address?.province
                ].filter(Boolean).join(', ') || o.receiverAddress || "N/A",
                status: o.status?.name || o.status || "N/A", // Prefer status name if available
                createdAt: o.createdAt || o.created_date?.$date || o.created_date || null
            }));
            // --- End Normalization ---

            console.log(`✅ Đã tải ${orders.length} đơn hàng.`);

            updateSummaryStats();
            updateTabsCount();
            renderTable(currentStatusFilter); // Render based on the current filter
        } catch (err) {
            console.error("❌ Lỗi tải danh sách đơn hàng:", err);
            showErrorUI(`Không thể tải dữ liệu đơn hàng (${err.message})`);
        }
    }

    // ===========================
    // Cập nhật thống kê tổng số (Summary Stats)
    // ===========================
    function updateSummaryStats() {
         console.log("📊 Cập nhật Summary Stats...");
         const statItems = document.querySelectorAll(".summary-stats .stat-item"); // Get elements inside
         if (!statItems || statItems.length === 0) return;

         // --- More robust status matching ---
         const statusCounts = orders.reduce((acc, order) => {
            const status = order.status || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
         }, {});
         statusCounts["Tất cả"] = orders.length;
         // --- End robust status matching ---


        // Define mapping from data-status-target to actual status names used in data
        const targetToStatusMap = {
            "Tất cả": "Tất cả",
            "Lấy thành công": "Giao thành công", // Adjust if API uses a different status for "Picked up successfully" vs "Delivered"
            "Chờ lấy": "Chờ lấy",
            "Hủy lấy": "Hủy lấy",
            "Đơn nháp": "Đơn nháp"
            // Add other mappings if needed
        };


        statItems.forEach((item) => {
            const targetLabel = item.dataset.statusTarget;
            const actualStatus = targetToStatusMap[targetLabel] || targetLabel; // Use mapping or fallback to targetLabel
            const count = statusCounts[actualStatus] || 0; // Get count for the actual status
            const countElement = item.querySelector("b");
            if (countElement) countElement.textContent = `${count} đơn`;
        });
    }


    // ===========================
    // Cập nhật số lượng ở các tab
    // ===========================
    function updateTabsCount() {
         console.log("🔢 Cập nhật số đếm trên Tabs...");
         const tabItems = document.querySelectorAll(".tab-item, .dropdown-item"); // Get elements inside
         if (!tabItems || tabItems.length === 0) return;

         // --- More robust status matching ---
         const statusCounts = orders.reduce((acc, order) => {
             const status = order.status || "Unknown";
             acc[status] = (acc[status] || 0) + 1;
             return acc;
         }, {});
         statusCounts["Tất cả"] = orders.length;
         // --- End robust status matching ---

        tabItems.forEach((tab) => {
            const status = tab.dataset.status;
            const count = statusCounts[status] || 0; // Get count using the robust counts object

            const colorBox = tab.querySelector(".color-box")?.outerHTML || `<span class="color-box"></span>`;
            // Extract name more reliably, handling potential existing count
            const nameOnlyMatch = tab.innerHTML.match(/>([^<(]+)\s*(\(.*\))?</);
            const nameOnly = nameOnlyMatch ? nameOnlyMatch[1].trim() : (status || "Tab");

            tab.innerHTML = `${colorBox} ${nameOnly} (${count})`;
        });
    }

    // ===========================
    // Hiển thị bảng đơn hàng
    // ===========================
    function renderTable(statusFilter) {
        console.log(`🔍 Rendering table for status: ${statusFilter}`);
        currentStatusFilter = statusFilter; // Update the current filter state
        const tableArea = document.querySelector(".table-area");
         if (!tableArea) return;

        const list =
            statusFilter === "Tất cả"
                ? orders
                : orders.filter((o) => o.status === statusFilter);

        if (list.length === 0) {
            tableArea.innerHTML = `<p style="text-align: center; padding: 40px; color: #888;">Không có bản ghi nào cho trạng thái "${statusFilter}"</p>`;
            return;
        }

        const tableHTML = `
            <div class="table-responsive"> <table>
                <thead>
                <tr>
                    <th>#</th>
                    <th>Mã vận đơn</th>
                    <th>Người gửi</th>
                    <th>Người nhận</th>
                    <th style="min-width: 200px;">Địa chỉ nhận</th> <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                </tr>
                </thead>
                <tbody>
                ${list
                    .map(
                        (o, i) => `
                    <tr data-order-id="${o.id}" data-order-code="${o.code}"> <td>${i + 1}</td>
                      <td>${o.code}</td>
                      <td>${o.senderName}</td>
                      <td>${o.receiverName}</td>
                      <td>${o.receiverAddress}</td>
                      <td><span class="status-${(o.status || '').toLowerCase().replace(/\s+/g, '-')}">${o.status}</span></td> <td>${
                          o.createdAt
                              ? new Date(o.createdAt).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric'}) // Format date
                              : "-"
                      }</td>
                      <td>
                        <button class="btn btn-sm btn-update" data-code="${o.code}">
                            <i class="fa-solid fa-pen fa-fw"></i> Cập nhật TT
                        </button>
                         <button class="btn btn-sm btn-view-details" data-id="${o.id}">
                             <i class="fa-solid fa-eye fa-fw"></i> Xem CT
                         </button>
                      </td>
                    </tr>`
                    )
                    .join("")}
                </tbody>
            </table>
            </div> `;
        tableArea.innerHTML = tableHTML;

         // --- Add event listeners for new buttons ---
         addTableActionListeners();
    }

     // ===========================
    // Add Table Action Listeners (Update Status, View Details)
    // ===========================
    function addTableActionListeners() {
        const tableArea = document.querySelector(".table-area");
        if (!tableArea) return;

        tableArea.querySelectorAll('.btn-update').forEach(button => {
            button.removeEventListener('click', handleUpdateStatusClick); // Prevent duplicates
            button.addEventListener('click', handleUpdateStatusClick);
        });

        tableArea.querySelectorAll('.btn-view-details').forEach(button => {
             button.removeEventListener('click', handleViewDetailsClick); // Prevent duplicates
            button.addEventListener('click', handleViewDetailsClick);
        });
    }

     // Handler for "Update Status" button click
    function handleUpdateStatusClick(event) {
        const orderCode = event.currentTarget.dataset.code;
        console.log(`🔧 Clicked update status for order code: ${orderCode}`);
        // Find the corresponding order data (optional, could just pass code)
        const order = orders.find(o => o.code === orderCode);
        openStatusModal(orderCode, order ? order.status : null); // Pass current status if available
    }

     // Handler for "View Details" button click (Placeholder)
    function handleViewDetailsClick(event) {
        const orderId = event.currentTarget.dataset.id;
        console.log(`👁️ Clicked view details for order ID: ${orderId}`);
        alert(`Chức năng xem chi tiết cho ID ${orderId} chưa được cài đặt.`);
        // TODO: Implement logic to show order details (e.g., in a new modal or panel)
    }


    // ===========================
    // Modal cập nhật trạng thái (Logic only)
    // HTML should be in shipments.html
    // ===========================
    let selectedOrderCodeForUpdate = null; // Store code instead of just boolean

    function openStatusModal(orderCode, currentStatus = null) {
        selectedOrderCodeForUpdate = orderCode;
        const statusModal = document.getElementById("statusModal");
        const statusSelect = document.getElementById("statusSelect");

        if (statusModal && statusSelect) {
             // Set the dropdown to the current status if provided
             if(currentStatus && statusSelect.querySelector(`option[value="${currentStatus}"]`)) {
                  statusSelect.value = currentStatus;
             } else {
                 statusSelect.selectedIndex = 0; // Default to first option
             }
            statusModal.classList.remove("hidden");
            console.log(`🪄 Opening status modal for order code: ${orderCode}`);
        } else {
             console.error("❌ Status modal or select dropdown not found!");
        }
    }

    function closeStatusModal() {
        selectedOrderCodeForUpdate = null;
        const statusModal = document.getElementById("statusModal");
        if (statusModal) {
            statusModal.classList.add("hidden");
            console.log("🔒 Closing status modal.");
        }
    }

    async function updateOrderStatus() {
        const statusSelect = document.getElementById("statusSelect");
        const confirmBtn = document.getElementById('confirmStatusBtn');

        if (!selectedOrderCodeForUpdate) {
             console.error("❌ No order selected for status update.");
             alert("Lỗi: Chưa chọn đơn hàng!");
             return;
         }
        if (!statusSelect) {
             console.error("❌ Status select dropdown not found for update.");
             alert("Lỗi: Không tìm thấy dropdown trạng thái!");
             return;
         }

        const newStatus = statusSelect.value;
        const token = getValidTokenWithBearer(); // Get token with Bearer
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token;

        console.log(`🚀 Attempting to update status for ${selectedOrderCodeForUpdate} to "${newStatus}"`);

        try {
             if(confirmBtn) confirmBtn.disabled = true; confirmBtn.textContent = 'Đang cập nhật...';

            const res = await fetch(
                `${API_BASE_URL}/orders/update-status/${selectedOrderCodeForUpdate}`, // Assuming endpoint uses order CODE
                {
                    method: "PATCH", // Use PATCH for partial updates like status
                    headers,
                    body: JSON.stringify({ status: newStatus }), // Send only the status field
                }
            );

            if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} when updating status:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }

             // Assuming API returns the updated order or a success message
             const updateResult = await res.json();
             console.log(`✅ Status update successful for ${selectedOrderCodeForUpdate}. Response:`, updateResult);

            closeStatusModal();
            await loadOrders(); // Reload the list to reflect changes
            alert(`✅ Đã cập nhật trạng thái đơn ${selectedOrderCodeForUpdate} thành "${newStatus}"!`);

        } catch (err) {
            console.error("❌ Lỗi cập nhật trạng thái:", err);
            alert(`⚠️ Cập nhật trạng thái thất bại: ${err.message}`);
            // Optionally close modal on error or keep it open for retry
            // closeStatusModal();
        } finally {
             if(confirmBtn) confirmBtn.disabled = false; confirmBtn.textContent = 'Xác nhận';
        }
    }

    // ===========================
    // Public methods
    // ===========================
    return {
        loadOrders,
        renderTable, // Expose renderTable if needed externally
        updateOrderStatus, // Expose the function to be called by the modal confirm button
        openStatusModal, // Expose function to open modal
        closeStatusModal // Expose function to close modal
    };

})();

// --- REMOVED document.addEventListener("DOMContentLoaded") ---
// Initialization logic (loadOrders) and event bindings (modal buttons, table actions)
// should now be called from within the initShipmentsPage function in shipments.html
console.log("🔧 shipments-data.js script executed. Waiting for initShipmentsPage() to call ShipmentsData methods.");