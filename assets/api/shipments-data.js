
window.ShipmentsData = (function () {
    "use strict";

    // --- Check API config ---
    if (!window.API_CONFIG) {
        console.error("❌ API_CONFIG chưa load! Ensure config.js is loaded before shipments-data.js.");
        // Return a non-functional object to prevent further errors
        return {
            init: () => showErrorUI("Lỗi cấu hình API."),
            handleFilterChange: () => {}, handleStatusFilterChange: () => {}, handleItemsPerPageChange: () => {}, handlePageChange: () => {},
            openEditModal: () => {}, closeEditModal: () => {}, handleSaveEdit: () => {}, resetSecondaryFilters: () => {},
        };
    }
    // ===========================
// Edit Status Modal - Close Function
// ===========================
function closeEditModal() {
    console.log("🔒 Closing edit modal");
    
    if (elements.editModal) {
        elements.editModal.classList.add('hidden');
        elements.editModal.setAttribute('aria-hidden', 'true');
    }
    
    hideModalMessages();
    
    // Reset form
    if (elements.editStatusForm) {
        elements.editStatusForm.reset();
    }
    
    // Clear any stored order ID
    if (elements.editingOrderIdInput) {
        elements.editingOrderIdInput.value = '';
    }
    if (elements.editOrderIdSpan) {
        elements.editOrderIdSpan.textContent = '';
    }
}
    const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;

    // --- State Variables ---
    let allOrders = [];
    let filteredOrders = [];
    let displayedOrders = [];
    let orderStatuses = [];
    let shippingServices = [];
    let packageTypes = [];
    let branches = []; // For warehouse filter

    // Filters State
    let currentSearchTerm = '';
    let currentDateRange = { from: null, to: null };
    let currentWarehouse = '';
    let currentPayer = '';
    let currentOrderType = '';
    let currentPaymentStatus = '';
    let currentService = '';
    let currentAccount = '';
    let currentStatusFilterCode = ''; // For status tabs
    // New secondary filters state
    let currentPackageType = '';
    let currentCodStatus = '';
    let currentOrderCategory = '';
    let currentCustomerGroup = '';

    // Pagination State
    let currentPage = 1;
    let itemsPerPage = 10;
    let totalItems = 0;
    let totalPages = 1;

    // --- DOM Elements ---
    let elements = {}; // Cached DOM elements
    // ===========================
// Edit Status Modal Logic - Thêm hàm handleSaveEdit
// ===========================
async function handleSaveEdit() {
    hideModalMessages();
    const orderId = elements.editingOrderIdInput?.value;
    const selectedStatusCode = elements.editStatusSelect?.value;
    const selectedStatusName = elements.editStatusSelect?.selectedOptions[0]?.text || selectedStatusCode;

    if (!orderId) {
        showModalError("Lỗi: Không tìm thấy mã đơn hàng.");
        return;
    }
    if (!selectedStatusCode) {
        showModalError("Vui lòng chọn trạng thái mới.");
        return;
    }

    const saveBtn = elements.saveEditBtn;
    const originalText = saveBtn?.textContent;
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';
    }

    try {
        console.log(`🔄 Starting status update for order: ${orderId}`);
        const response = await updateOrderStatusAPI(orderId, selectedStatusCode, selectedStatusName);
        
        console.log(`✅ Order ${orderId} status updated successfully.`, response);
        
        // Update local data
        const updatedOrderIndex = allOrders.findIndex(o => o.id === orderId);
        if (updatedOrderIndex !== -1) {
            allOrders[updatedOrderIndex].status = {
                code: selectedStatusCode,
                name: selectedStatusName
            };
            
            // Update timestamps if available
            if (response?.modifiedDate) {
                allOrders[updatedOrderIndex].modifiedDate = response.modifiedDate;
            } else {
                allOrders[updatedOrderIndex].modifiedDate = new Date().toISOString();
            }
            
            if (response?.modifiedBy) {
                allOrders[updatedOrderIndex].modifiedBy = response.modifiedBy;
            }
        }

        closeEditModal();
        applyFiltersAndRender();
        updateStatusTabs();
        
        // Show success message
        showSuccessMessage(`Đã cập nhật trạng thái đơn hàng ${orderId} thành công!`);

    } catch (error) {
        console.error(`❌ Failed to update order ${orderId} status:`, error);
        showModalError(`Lỗi cập nhật: ${error.message || "Lỗi không xác định. Vui lòng thử lại."}`);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}
    // --- Cache DOM Elements ---
function cacheDOMElements() {
    elements = {
        // Filters
        searchInput: document.getElementById('shipmentSearchInput'),
        datePickerInput: document.getElementById('dateRangePicker'),
        warehouseFilter: document.getElementById('warehouseFilter'),
        payerFilter: document.getElementById('payerFilter'),
        orderTypeFilter: document.getElementById('orderTypeFilter'),
        paymentStatusFilter: document.getElementById('paymentStatusFilter'),
        serviceFilter: document.getElementById('serviceFilter'),
        accountFilter: document.getElementById('accountFilter'),
        packageTypeFilter: document.getElementById('packageTypeFilter'),
        codStatusFilter: document.getElementById('codStatusFilter'),
        orderCategoryFilter: document.getElementById('orderCategoryFilter'),
        customerGroupFilter: document.getElementById('customerGroupFilter'),
        secondaryFilters: document.getElementById('secondaryFilters'),
        addFilterBtn: document.getElementById('addFilterBtn'),

        // Status Tabs
        statusTabsContainer: document.getElementById('statusTabsContainer'),

        // Table & Feedback
        tableBody: document.getElementById('shipmentsTableBody'),
        loadingSpinner: document.getElementById('loadingSpinner'),
        noResultsDiv: document.getElementById('noResults'),
        lastUpdatedTime: document.getElementById('lastUpdatedTime'),

        // Pagination
        itemsPerPageSelect: document.getElementById('itemsPerPageSelect'),
        paginationInfo: document.getElementById('paginationInfo'),
        firstPageBtn: document.getElementById('firstPageBtn'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        lastPageBtn: document.getElementById('lastPageBtn'),

        // Summary Footer
        totalOrdersSummary: document.getElementById('totalOrdersSummary'),
        totalCodSummary: document.getElementById('totalCodSummary'),
        totalShippingCostSummary: document.getElementById('totalShippingCostSummary'),

        // Edit Status Modal Elements - SỬA LẠI PHẦN NÀY
        editModal: document.getElementById('editOrderInfoModal'),
        editModalTitle: document.getElementById('editModalTitle'),
        editOrderIdSpan: document.getElementById('editOrderId'),
        editingOrderIdInput: document.getElementById('editingOrderId'),
        editStatusForm: document.getElementById('editOrderForm'),
        editStatusSelect: document.getElementById('editStatusSelect'),
        editModalError: document.getElementById('editModalError'),
        saveEditBtn: document.getElementById('saveEditBtn'),
    };
    
    // Update itemsPerPage from select if exists
    itemsPerPage = parseInt(elements.itemsPerPageSelect?.value || '10', 10);
}

    // ===========================
    // Helper Functions
    // ===========================
    function getValidTokenWithBearer() {
        let token = getAccessToken ? getAccessToken() : null;
        if (!token) { console.warn("⚠️ Access token not found."); return null; }
        return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    function showErrorUI(message) {
        console.error("❌ UI Error:", message);
        hideLoading();
        if (elements.noResultsDiv) {
            elements.noResultsDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> Lỗi: ${escapeHtml(message)}`;
            elements.noResultsDiv.style.display = 'block';
            elements.noResultsDiv.classList.add('error');
        }
        if (elements.tableBody) {
            elements.tableBody.innerHTML = `<tr><td colspan="8" class="no-data error">${escapeHtml(message)}</td></tr>`;
        }
        disablePagination();
    }

    function hideErrorUI() {
        if (elements.noResultsDiv) {
            elements.noResultsDiv.textContent = 'Không tìm thấy vận đơn nào phù hợp.';
            elements.noResultsDiv.style.display = 'none';
            elements.noResultsDiv.classList.remove('error');
        }
    }

    function showLoading() {
        hideErrorUI();
        if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'flex';
        if (elements.noResultsDiv) elements.noResultsDiv.style.display = 'none';
        if (elements.tableBody) elements.tableBody.innerHTML = '';
        disablePagination();
        updateLastUpdatedTime(true);
    }

    function hideLoading() {
        if (elements.loadingSpinner) elements.loadingSpinner.style.display = 'none';
        updateLastUpdatedTime();
    }

    function formatCurrency(value) {
        if (typeof value !== 'number' || isNaN(value)) { return '0 ₫'; }
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) { throw new Error("Invalid date"); }
            return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
        } catch (e) { console.warn("Invalid date format:", dateString); return 'N/A'; }
    }

    function formatDateTime(dateString) {
        if (!dateString) return '--:--';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) { throw new Error("Invalid date"); }
            return new Intl.DateTimeFormat('vi-VN', { 
                hour: '2-digit', minute: '2-digit', second: '2-digit', 
                day: '2-digit', month: '2-digit', year: 'numeric' 
            }).format(date);
        } catch (e) { console.warn("Invalid date/time format:", dateString); return '--:--'; }
    }

    function escapeHtml(unsafe) {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(unsafe).replace(/[&<>"']/g, m => map[m]);
    }

    function updateLastUpdatedTime(isLoading = false) {
        if (elements.lastUpdatedTime) {
            elements.lastUpdatedTime.textContent = isLoading ? 'Đang cập nhật...' : formatDateTime(new Date());
        }
    }

    // ===========================
    // Data Fetching
    // ===========================
   async function fetchJsonWithAuth(url, options = {}) {
    const token = getValidTokenWithBearer();
    if (!token && !options.isPublic) {
        throw new Error("Missing authentication token.");
    }
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = token;

    let response;
    try { 
        response = await fetch(url, { ...options, headers }); 
    } catch (networkError) { 
        throw new Error(`Lỗi mạng khi truy cập ${url}.`); 
    }

    if (!response.ok) {
        let errorText = await response.text().catch(() => response.statusText);
        try { 
            const errorJson = JSON.parse(errorText); 
            errorText = errorJson.message || errorText; 
        } catch {}
        console.error(`HTTP Error ${response.status} for ${url}: ${errorText}`);
        if (response.status === 401) throw new Error("Phiên đăng nhập hết hạn.");
        if (response.status === 404) throw new Error("Không tìm thấy dữ liệu.");
        throw new Error(`Lỗi ${response.status}: ${errorText}`);
    }

    try {
        const text = await response.text();
        if (!text && response.status === 204) return null;
        if (!text) return null;
        const data = JSON.parse(text);
        
        // Check for API error codes
        if (data && typeof data.code !== 'undefined' && data.code !== 10000 && data.message) {
            throw new Error(data.message);
        }
        
        // For status update API, return the result object
        if (options.method === 'PUT' && url.includes('/orders/update/') && url.includes('/status')) {
            return data.result || data;
        }
        
        return data?.result ?? data;
    } catch (e) {
        console.error(`Error parsing JSON response from ${url}:`, e);
        throw new Error(e.message || "Phản hồi từ server không hợp lệ.");
    }
}

    async function fetchStaticData(filename) {
        const pathsToTry = [`assets/data/${filename}`, `../assets/data/${filename}`];
        for (const path of pathsToTry) {
            try {
                const response = await fetch(path);
                if (response.ok) { 
                    console.log(`✅ Loaded static data: ${path}`); 
                    return await response.json(); 
                }
            } catch (error) { 
                console.warn(`Network error fetching ${path}: ${error.message}`); 
            }
        }
        throw new Error(`Không thể tải dữ liệu tĩnh ${filename}.`);
    }

    // --- MODIFIED FUNCTION: Use filter API instead of get-all ---
    // --- MODIFIED FUNCTION: Use filter API với tham số phù hợp ---
// --- ALTERNATIVE: Với thời gian cụ thể ---
async function loadOrdersWithFilter() {
    // Default date range: last 30 days (from 00:00:00 to 23:59:59)
    const toDate = new Date();
    toDate.setHours(23, 59, 59, 999);
    
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    fromDate.setHours(0, 0, 0, 0);
    
    // Format dates to ISO 8601 with timezone
    const fromISO = fromDate.toISOString();
    const toISO = toDate.toISOString();
    
    const url = `${API_BASE_URL}/orders/filter?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
    
    console.log(`🔍 Fetching orders from: ${fromISO} to: ${toISO}`);
    
    try {
        const ordersResult = await fetchJsonWithAuth(url);
        return Array.isArray(ordersResult) ? ordersResult : [];
    } catch (error) {
        console.error("❌ Error loading orders with filter:", error);
        // Fallback to get-all if filter fails
        try {
            console.log("🔄 Falling back to get-all API...");
            const fallbackResult = await fetchJsonWithAuth(`${API_BASE_URL}/orders/get-all`);
            return Array.isArray(fallbackResult) ? fallbackResult : [];
        } catch (fallbackError) {
            console.error("❌ Fallback to get-all also failed:", fallbackError);
            throw error; // Throw original error
        }
    }
}

    async function loadAllData() {
        showLoading();
        try {
            const [ordersResult, statusesResult, servicesResult, packageTypesResult, branchesResult] = await Promise.all([
                loadOrdersWithFilter(), // Use the new filter function
                fetchStaticData('order_status.json'),
                fetchStaticData('shipping_service.json'),
                fetchStaticData('package_type.json'),
                fetchStaticData('branch.json')
            ]);

            allOrders = ordersResult;
            orderStatuses = Array.isArray(statusesResult) ? statusesResult : [];
            shippingServices = Array.isArray(servicesResult) ? servicesResult : [];
            packageTypes = Array.isArray(packageTypesResult) ? packageTypesResult : [];
            branches = Array.isArray(branchesResult) ? branchesResult : [];

            console.log(`✅ Data Loaded: ${allOrders.length} orders, ${orderStatuses.length} statuses, ${shippingServices.length} services, ${packageTypes.length} types, ${branches.length} branches.`);

            populateServiceFilter();
            populatePackageTypeFilter();
            populateBranchFilter();
            updateStatusTabs();
            applyFiltersAndRender();

        } catch (err) {
            console.error("❌ Fatal error during initial data load:", err);
            showErrorUI(err.message || "Lỗi nghiêm trọng khi tải dữ liệu.");
            allOrders = []; orderStatuses = []; shippingServices = []; packageTypes = []; branches = [];
            updateStatusTabs();
            applyFiltersAndRender();
        } finally {
            hideLoading();
        }
    }

    function populateServiceFilter() {
        if (!elements.serviceFilter) return;
        elements.serviceFilter.innerHTML = '<option value="">Dịch vụ (Tất cả)</option>';
        shippingServices.forEach(s => elements.serviceFilter.add(new Option(s.name, s.code)));
    }

    function populatePackageTypeFilter() {
        if (!elements.packageTypeFilter) return;
        elements.packageTypeFilter.innerHTML = '<option value="">Loại hàng (Tất cả)</option>';
        packageTypes.forEach(t => elements.packageTypeFilter.add(new Option(t.name, t.code)));
    }

    function populateBranchFilter() {
        if (!elements.warehouseFilter) return;
        elements.warehouseFilter.innerHTML = '<option value="">Kho hàng (Tất cả)</option>';
        const activeBranches = branches
            .filter(b => b.is_active)
            .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        activeBranches.forEach(b => elements.warehouseFilter.add(new Option(b.name, b._id?.$oid || b._id)));
    }

    // ===========================
    // Filtering Logic
    // ===========================
   function applyFiltersAndRender() {
    readFilterValues();
    let tempOrders = [...allOrders];

    // Status filter
    if (currentStatusFilterCode) {
        tempOrders = tempOrders.filter(o => o.status?.code === currentStatusFilterCode);
    }
    
    // Search filter - tìm kiếm theo nhiều trường
    if (currentSearchTerm) {
        const lowerTerm = currentSearchTerm.toLowerCase();
        tempOrders = tempOrders.filter(o =>
            String(o.id || '').toLowerCase().includes(lowerTerm) ||
            String(o.receiver?.name || '').toLowerCase().includes(lowerTerm) ||
            String(o.sender?.name || '').toLowerCase().includes(lowerTerm) ||
            String(o.receiver?.phone || '').includes(currentSearchTerm) ||
            // Tìm trong packages name
            (Array.isArray(o.packages) && o.packages.some(pkg => 
                String(pkg.name || '').toLowerCase().includes(lowerTerm)
            ))
        );
    }
    
    // Date filter - xử lý cả createdDate và created_date
    if (currentDateRange.from && currentDateRange.to) {
        try {
            const fromDate = new Date(currentDateRange.from); 
            fromDate.setHours(0,0,0,0);
            const toDate = new Date(currentDateRange.to); 
            toDate.setHours(23,59,59,999);
            
            tempOrders = tempOrders.filter(o => {
                const createdDateStr = o.createdDate || o.created_date;
                if (!createdDateStr) return false;
                try { 
                    const d = new Date(createdDateStr); 
                    return !isNaN(d) && d >= fromDate && d <= toDate; 
                } catch { 
                    return false; 
                }
            });
        } catch(e) { 
            console.error("Error applying date filter:", e); 
        }
    }
    
    // Warehouse filter - xử lý cả branchId và branch_id
    if (currentWarehouse) {
        tempOrders = tempOrders.filter(o => 
            (o.sender?.branchId || o.sender?.branch_id) === currentWarehouse || 
            (o.receiver?.branchId || o.receiver?.branch_id) === currentWarehouse 
        );
    }
    
    // Service filter
    if (currentService) {
        tempOrders = tempOrders.filter(o => o.shipping_service?.code === currentService);
    }
    
    // Package type filter
    if (currentPackageType) {
        tempOrders = tempOrders.filter(o => o.package_type?.code === currentPackageType);
    }

    // Payer filter (xác định người trả phí)
    if (currentPayer) {
        tempOrders = tempOrders.filter(o => {
            // Logic xác định người trả phí dựa trên cấu trúc dữ liệu
            // Có thể cần điều chỉnh dựa trên business logic thực tế
            const hasCod = o.codCost && o.codCost > 0;
            if (currentPayer === 'receiver') return hasCod;
            if (currentPayer === 'sender') return !hasCod;
            return true;
        });
    }

    filteredOrders = tempOrders;
    totalItems = filteredOrders.length;
    totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > totalPages) currentPage = 1;

    renderTable();
    updatePaginationControls();
    updateSummaryFooter();
}

    function readFilterValues() {
        currentSearchTerm = elements.searchInput?.value.trim() || '';
        const fp = elements.datePickerInput?._flatpickr;
        currentDateRange = (fp && fp.selectedDates.length === 2)
            ? { from: fp.selectedDates[0].toISOString(), to: fp.selectedDates[1].toISOString() }
            : { from: null, to: null };
        currentWarehouse = elements.warehouseFilter?.value || '';
        currentPayer = elements.payerFilter?.value || '';
        currentOrderType = elements.orderTypeFilter?.value || '';
        currentPaymentStatus = elements.paymentStatusFilter?.value || '';
        currentService = elements.serviceFilter?.value || '';
        currentAccount = elements.accountFilter?.value || '';
        currentPackageType = elements.packageTypeFilter?.value || '';
        currentCodStatus = elements.codStatusFilter?.value || '';
        currentOrderCategory = elements.orderCategoryFilter?.value || '';
        currentCustomerGroup = elements.customerGroupFilter?.value || '';
    }

    function resetSecondaryFilters() {
        currentPaymentStatus = ''; 
        currentService = ''; 
        currentAccount = '';
        currentPackageType = ''; 
        currentCodStatus = ''; 
        currentOrderCategory = ''; 
        currentCustomerGroup = '';
        
        [elements.paymentStatusFilter, elements.serviceFilter, elements.accountFilter,
         elements.packageTypeFilter, elements.codStatusFilter, elements.orderCategoryFilter,
         elements.customerGroupFilter].forEach(sel => { 
            if (sel) sel.selectedIndex = 0; 
        });
    }

    // ===========================
    // UI Rendering
    // ===========================
    function updateStatusTabs() {
        if (!elements.statusTabsContainer) return;
        const counts = { "": allOrders.length };
        const tabOrder = ["RECEIVED", "PICKING_UP", "DELIVERED", "IN_TRANSIT", "PENDING", "FAILED_PICKUP", "DRAFT"];

        allOrders.forEach(o => { 
            if(o.status?.code) counts[o.status.code] = (counts[o.status.code] || 0) + 1; 
        });

        const baseStyle = `
            display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px;
            margin-right: 8px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #dcdfe6;
            background-color: #ffffff; color: #606266; font-size: 13px; font-weight: 500;
            cursor: pointer; transition: all 0.2s ease; white-space: nowrap; line-height: 1;
        `;
        
        const activeStyle = `
            ${baseStyle} color: #409eff; border-color: #c6e2ff; background-color: #ecf5ff;
        `;

        let tabsHtml = '';
        
        const allIsActive = currentStatusFilterCode === '';
        tabsHtml += `
            <div class="tab-item ${allIsActive ? 'active' : ''}" data-status-code=""
                 style="${allIsActive ? activeStyle : baseStyle}"
                 onmouseover="this.style.borderColor='#409eff';this.style.color='#409eff'"
                 onmouseout="if(!${allIsActive}){this.style.borderColor='#dcdfe6';this.style.color='#606266'}"
                 onclick="ShipmentsData.handleStatusFilterChange('')">
                Tất cả (${counts[""] || 0})
            </div>
        `;

        tabOrder.forEach(code => {
            const statusDef = orderStatuses.find(s => s.code === code);
            if (statusDef) {
                const count = counts[code] || 0;
                const isActive = currentStatusFilterCode === code;
                
                tabsHtml += `
                    <div class="tab-item ${isActive ? 'active' : ''}" data-status-code="${code}"
                         style="${isActive ? activeStyle : baseStyle}"
                         onmouseover="this.style.borderColor='#409eff';this.style.color='#409eff'"
                         onmouseout="if(!${isActive}){this.style.borderColor='#dcdfe6';this.style.color='#606266'}"
                         onclick="ShipmentsData.handleStatusFilterChange('${code}')">
                        <span class="color-box" style="background-color: ${statusDef.color || '#ccc'}; width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0;"></span>
                        ${escapeHtml(statusDef.name)} (${count})
                    </div>`;
            }
        });
        
        elements.statusTabsContainer.style.display = 'flex';
        elements.statusTabsContainer.style.flexWrap = 'wrap';
        elements.statusTabsContainer.innerHTML = tabsHtml;
    }

    // --- MODIFIED FUNCTION: Added tracking number and tags column ---
   // --- UPDATED FUNCTION: Hiển thị đúng cấu trúc dữ liệu từ API ---
function renderTable() {
    hideErrorUI();
    if (!elements.tableBody) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    displayedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    if (displayedOrders.length === 0) {
        if (elements.noResultsDiv) elements.noResultsDiv.style.display = 'block';
        elements.tableBody.innerHTML = `<tr><td colspan="10" class="no-data">Không tìm thấy vận đơn nào phù hợp.</td></tr>`;
    } else {
        if (elements.noResultsDiv) elements.noResultsDiv.style.display = 'none';
        let tableHtml = '';
        displayedOrders.forEach((order, index) => {
            const orderId = order.id || 'N/A';
            const senderName = order.sender?.name || 'N/A';
            const receiverName = order.receiver?.name || 'N/A';
            
            // Xử lý địa chỉ
            const receiverAddr = order.receiver?.address || {};
            const province = receiverAddr.province || '';
            const district = receiverAddr.district || '';
            const ward = receiverAddr.ward || '';
            const detail = receiverAddr.other || receiverAddr.detail || '';
            const addressString = [detail, ward, district, province].filter(Boolean).join(', ') || 'N/A';
            
            // Trạng thái
            const statusInfo = orderStatuses.find(s => s.code === order.status?.code) || { 
                name: order.status?.name || 'N/A', 
                color: '#888' 
            };
            
            // Ngày tạo
            const createdDate = formatDate(order.createdDate || order.created_date);
            
            // Thông tin packages
            const packageNames = Array.isArray(order.packages) 
                ? order.packages.map(pkg => pkg.name).filter(Boolean).join(', ') 
                : 'N/A';
                
            // Dịch vụ vận chuyển
            const serviceName = order.shipping_service?.name || 'N/A';
            
            // COD và tổng tiền
            const codAmount = order.codCost || 0;
            const totalAmount = order.totalPrice || 0;

            tableHtml += `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>${escapeHtml(orderId)}</td>
                    <td>${escapeHtml(senderName)}</td>
                    <td>${escapeHtml(receiverName)}</td>
                    <td>${escapeHtml(addressString)}</td>
                    <td>${escapeHtml(packageNames)}</td>
                    <td>${escapeHtml(serviceName)}</td>
                    <td><span class="status-badge" style="background-color: ${statusInfo.color};">${escapeHtml(statusInfo.name)}</span></td>
                    <td>${formatCurrency(codAmount)}</td>
                    <td>${formatCurrency(totalAmount)}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-edit" data-order-id="${orderId}" title="Cập nhật trạng thái đơn hàng">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                    </td>
                </tr>`;
        });
        elements.tableBody.innerHTML = tableHtml;
    }
}

    function updateSummaryFooter() {
    if (!elements.totalOrdersSummary || !elements.totalCodSummary || !elements.totalShippingCostSummary) {
        return;
    }

    const totalOrders = filteredOrders.length;
    let totalCod = 0;
    let totalShippingCost = 0;

    filteredOrders.forEach(o => {
        totalCod += Number(o.codCost || 0);
        totalShippingCost += Number(o.totalPrice || 0);
    });

    elements.totalOrdersSummary.textContent = totalOrders;
    elements.totalCodSummary.textContent = formatCurrency(totalCod);
    elements.totalShippingCostSummary.textContent = formatCurrency(totalShippingCost);
}
    // ===========================
    // Pagination
    // ===========================
    function updatePaginationControls() {
        if (!elements.paginationInfo || !elements.firstPageBtn) return;
        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        elements.paginationInfo.textContent = `Hiển thị ${startItem} - ${endItem} của ${totalItems}`;
        elements.firstPageBtn.disabled = currentPage <= 1;
        elements.prevPageBtn.disabled = currentPage <= 1;
        elements.nextPageBtn.disabled = currentPage >= totalPages;
        elements.lastPageBtn.disabled = currentPage >= totalPages;
    }

    function disablePagination() {
        if (!elements.paginationInfo || !elements.firstPageBtn) return;
        elements.paginationInfo.textContent = `Hiển thị 0 - 0 của 0`;
        elements.firstPageBtn.disabled = true;
        elements.prevPageBtn.disabled = true;
        elements.nextPageBtn.disabled = true;
        elements.lastPageBtn.disabled = true;
    }

    function handlePageChange(action) {
        let newPage = currentPage;
        switch (action) {
            case 'first': newPage = 1; break;
            case 'prev': newPage = Math.max(1, currentPage - 1); break;
            case 'next': newPage = Math.min(totalPages, currentPage + 1); break;
            case 'last': newPage = totalPages; break;
        }
        if (newPage !== currentPage) {
            currentPage = newPage;
            renderTable();
            updatePaginationControls();
        }
    }

    function handleItemsPerPageChange(value) {
        itemsPerPage = parseInt(value, 10) || 10;
        currentPage = 1;
        applyFiltersAndRender();
    }

    // ===========================
    // Event Handlers
    // ===========================
    function handleFilterChange(isRefresh = false) {
        if (isRefresh) {
            currentSearchTerm = '';
            currentDateRange = { from: null, to: null };
            currentWarehouse = '';
            currentPayer = '';
            currentOrderType = '';
            currentPaymentStatus = '';
            currentService = '';
            currentAccount = '';
            currentPackageType = '';
            currentCodStatus = '';
            currentOrderCategory = '';
            currentCustomerGroup = '';
            currentStatusFilterCode = '';

            if(elements.searchInput) elements.searchInput.value = '';
            elements.datePickerInput?._flatpickr?.clear();
            document.querySelectorAll('.filter-area select').forEach(sel => sel.selectedIndex = 0);
            
            elements.secondaryFilters?.classList.add('hidden');
            if(elements.addFilterBtn) {
                elements.addFilterBtn.classList.remove('active');
                const icon = elements.addFilterBtn.querySelector('i');
                if(icon) icon.className = 'fas fa-filter';
            }
        }

        currentPage = 1;
        applyFiltersAndRender();
        
        if (isRefresh) {
            updateStatusTabs();
            if (elements.statusTabsContainer) {
                elements.statusTabsContainer.querySelectorAll('.tab-item').forEach(tab => tab.classList.remove('active'));
                elements.statusTabsContainer.querySelector('.tab-item[data-status-code=""]')?.classList.add('active');
            }
        }
    }

    function handleStatusFilterChange(statusCode) {
        currentStatusFilterCode = statusCode || '';
        currentPage = 1;
        updateStatusTabs();
        applyFiltersAndRender();
    }

    async function updateOrderStatusAPI(orderId, statusCode, statusName) {
    if (!orderId) throw new Error("Mã đơn hàng không hợp lệ.");
    if (!statusCode || !statusName) throw new Error("Trạng thái không hợp lệ.");
    
    const url = `${API_BASE_URL}/orders/update/${orderId}/status`;
    const payload = {
        statusCode: statusCode,
        statusName: statusName
    };
    
    console.log('🔧 API Call Details:');
    console.log('URL:', url);
    console.log('Method: PUT');
    console.log('Payload:', payload);
    console.log('Order ID:', orderId);
    
    try {
        const response = await fetchJsonWithAuth(url, { 
            method: 'PUT', 
            body: JSON.stringify(payload) 
        });
        console.log('✅ API Response:', response);
        return response;
    } catch (error) {
        console.error('❌ API Error:', error);
        throw error;
    }
}

   async function openEditModal(orderId) {
    console.log(`🔧 openEditModal called for order: ${orderId}`);
    hideModalMessages();
    
    if (!elements.editModal || !orderId) {
        console.error("❌ Modal element not found or orderId missing");
        return;
    }

    const order = allOrders.find(o => o.id === orderId);
    if (!order) {
        alert(`Lỗi: Không tìm thấy dữ liệu đơn hàng ${orderId}.`);
        return;
    }

    console.log(`📦 Found order:`, order);

    // Set order ID
    if (elements.editingOrderIdInput) {
        elements.editingOrderIdInput.value = orderId;
    }
    if (elements.editOrderIdSpan) {
        elements.editOrderIdSpan.textContent = orderId;
    }
    
    // Populate status dropdown
    if (elements.editStatusSelect) {
        elements.editStatusSelect.innerHTML = '<option value="">-- Chọn trạng thái --</option>';
        
        orderStatuses.forEach(status => {
            const option = new Option(status.name, status.code);
            
            // Select current status
            if (status.code === order.status?.code) {
                option.selected = true;
                console.log(`✅ Preselecting status: ${status.name}`);
            }
            
            elements.editStatusSelect.add(option);
        });
    }

    // Show modal
    elements.editModal.classList.remove('hidden');
    elements.editModal.setAttribute('aria-hidden', 'false');
    
    console.log(`✅ Modal should be visible now`);
    
    // Focus on status select
    if (elements.editStatusSelect) {
        elements.editStatusSelect.focus();
    }
}

function hideModalMessages() {
    if (elements.editModalError) {
        elements.editModalError.textContent = '';
        elements.editModalError.classList.add('hidden');
    }
}

function showModalError(message) {
    if (elements.editModalError) {
        elements.editModalError.textContent = message;
        elements.editModalError.classList.remove('hidden');
    }
}

    // Temporary test function - call this in browser console
async function testStatusUpdate() {
    const testOrderId = '60d21b4667d0d8992e610f11'; // Use a real order ID
    const testStatusCode = 'DELIVERED'; // Use a valid status code
    const testStatusName = 'Đã giao hàng';
    
    const url = `http://localhost:8585/api/v1/orders/update/${testOrderId}/status`;
    const payload = {
        statusCode: testStatusCode,
        statusName: testStatusName
    };
    
    console.log('🧪 Testing endpoint directly...');
    console.log('URL:', url);
    
    // Test with POST
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getValidTokenWithBearer()
            },
            body: JSON.stringify(payload)
        });
        console.log('POST Response Status:', response.status);
        console.log('POST Response Headers:', response.headers);
        const text = await response.text();
        console.log('POST Response Body:', text);
    } catch (error) {
        console.error('POST Test Failed:', error);
    }
    
    // Test with PUT for comparison
    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': getValidTokenWithBearer()
            },
            body: JSON.stringify(payload)
        });
        console.log('PUT Response Status:', response.status);
        console.log('PUT Response Headers:', response.headers);
        const text = await response.text();
        console.log('PUT Response Body:', text);
    } catch (error) {
        console.error('PUT Test Failed:', error);
    }
}

// Call this in browser console: testStatusUpdate()
    async function updateOrderStatusAPI(orderId, statusCode, statusName) {
    if (!orderId) throw new Error("Mã đơn hàng không hợp lệ.");
    if (!statusCode || !statusName) throw new Error("Trạng thái không hợp lệ.");
    
    const url = `${API_BASE_URL}/orders/update/${orderId}/status`;
    
    console.log('🔄 Attempting status update...');
    console.log('Order ID:', orderId);
    console.log('New Status:', statusCode, statusName);
    
    // Try POST first (most common for updates)
    try {
        console.log('🔄 Trying POST method...');
        const response = await fetchJsonWithAuth(url, { 
            method: 'POST', 
            body: JSON.stringify({
                statusCode: statusCode,
                statusName: statusName
            })
        });
        console.log('✅ POST method succeeded');
        return response;
    } catch (postError) {
        console.log('❌ POST failed:', postError.message);
        
        // If POST fails with method not supported, try PATCH
        if (postError.message.includes('method') && postError.message.includes('not supported')) {
            try {
                console.log('🔄 Trying PATCH method...');
                const response = await fetchJsonWithAuth(url, { 
                    method: 'PATCH', 
                    body: JSON.stringify({
                        statusCode: statusCode,
                        statusName: statusName
                    })
                });
                console.log('✅ PATCH method succeeded');
                return response;
            } catch (patchError) {
                console.log('❌ PATCH failed:', patchError.message);
                throw new Error(`Cả POST và PATCH đều không được hỗ trợ. Vui lòng kiểm tra API documentation.`);
            }
        }
        
        // If it's another error, throw it
        throw postError;
    }
}
    // ===========================
    // Event Binding & Initialization
    // ===========================
    function bindEvents() {
    // Filter Events
    if (elements.searchInput) elements.searchInput.addEventListener('input', debounce(() => handleFilterChange(), 300));
    if (elements.datePickerInput) elements.datePickerInput.addEventListener('change', () => handleFilterChange());
    if (elements.warehouseFilter) elements.warehouseFilter.addEventListener('change', () => handleFilterChange());
    if (elements.payerFilter) elements.payerFilter.addEventListener('change', () => handleFilterChange());
    if (elements.serviceFilter) elements.serviceFilter.addEventListener('change', () => handleFilterChange());
    if (elements.packageTypeFilter) elements.packageTypeFilter.addEventListener('change', () => handleFilterChange());

    // Add Filter Button Toggle
    if (elements.addFilterBtn) elements.addFilterBtn.addEventListener('click', function() {
        const isActive = this.classList.toggle('active');
        elements.secondaryFilters?.classList.toggle('hidden', !isActive);
        const icon = this.querySelector('i');
        if (icon) icon.className = isActive ? 'fas fa-times' : 'fas fa-filter';
    });

    // Pagination Events
    if (elements.itemsPerPageSelect) elements.itemsPerPageSelect.addEventListener('change', (e) => handleItemsPerPageChange(e.target.value));
    if (elements.firstPageBtn) elements.firstPageBtn.addEventListener('click', () => handlePageChange('first'));
    if (elements.prevPageBtn) elements.prevPageBtn.addEventListener('click', () => handlePageChange('prev'));
    if (elements.nextPageBtn) elements.nextPageBtn.addEventListener('click', () => handlePageChange('next'));
    if (elements.lastPageBtn) elements.lastPageBtn.addEventListener('click', () => handlePageChange('last'));

    // Edit Modal Events - SỬA LẠI PHẦN NÀY
    if (elements.saveEditBtn) elements.saveEditBtn.addEventListener('click', handleSaveEdit);
    if (elements.editModal) {
    elements.editModal.addEventListener('click', function(e) {
        if (e.target === this) closeEditModal(); // ❌ closeEditModal not defined yet
    });
    const closeBtn = elements.editModal.querySelector('.close-modal');
    if (closeBtn) closeBtn.addEventListener('click', closeEditModal); // ❌ closeEditModal not defined yet
}

    // Table Actions
    if (elements.tableBody) {
        elements.tableBody.addEventListener('click', function(e) {
            const editBtn = e.target.closest('.btn-edit');
            if (editBtn) {
                const orderId = editBtn.dataset.orderId;
                if (orderId) openEditModal(orderId);
            }
        });
    }
}

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // ===========================
    // Initialization
    // ===========================

async function init() {
    console.log("🚀 Initializing ShipmentsData module...");
    cacheDOMElements(); // Phải gọi hàm này trước
    bindEvents(); // Sau đó mới bind events
    await loadAllData();
}   

// ===========================
// Public API
// ===========================
return {
    init,
    handleFilterChange,
    handleStatusFilterChange,
    handleItemsPerPageChange,
    handlePageChange,
    openEditModal,
    closeEditModal, // Make sure this is included
    handleSaveEdit,
    resetSecondaryFilters,
};
})();

// --- Initialization is called from initShipmentsPage in shipments.html ---
console.log("🔧 shipments-data.js script executed. Waiting for initShipmentsPage() to call ShipmentsData.init().");
