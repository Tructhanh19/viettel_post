/**
 * Processing Order Management JavaScript
 * Viettel Post - Order Management System
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initializeSearchFunctionality();
    initializeDatePickers();
    initializeDropdowns();
    initializePagination();
    initializeFilterButtons();
    initializeTabSwitching();
    initializePendingView();
    
    console.log('Processing order management initialized');
});

// Search functionality
function initializeSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            console.log('Searching for:', searchTerm);
            // Implement search logic here
            filterTableData(searchTerm);
        });
    }
}

// Date picker initialization
function initializeDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.addEventListener('change', function() {
            console.log('Date changed:', this.value);
            // Implement date filtering logic here
        });
    });
}

// Dropdown functionality
function initializeDropdowns() {
    // Service dropdown
    const serviceDropdown = document.getElementById('serviceDropdown');
    const serviceSelect = document.getElementById('serviceSelect');
    
    if (serviceDropdown && serviceSelect) {
        // Toggle dropdown
        serviceSelect.addEventListener('click', function(e) {
            e.preventDefault();
            serviceDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!serviceSelect.contains(e.target) && !serviceDropdown.contains(e.target)) {
                serviceDropdown.classList.remove('show');
            }
        });

        // Handle service option selection
        const serviceOptions = serviceDropdown.querySelectorAll('.dropdown-item input[type="checkbox"]');
        const allServiceCheckbox = document.getElementById('service1');

        serviceOptions.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this === allServiceCheckbox && this.checked) {
                    // If "Tất cả" is checked, uncheck all others
                    serviceOptions.forEach(cb => {
                        if (cb !== allServiceCheckbox) cb.checked = false;
                    });
                } else if (this !== allServiceCheckbox && this.checked) {
                    // If any other option is checked, uncheck "Tất cả"
                    allServiceCheckbox.checked = false;
                }
                
                updateServiceSelectText();
            });
        });

        function updateServiceSelectText() {
            const selected = Array.from(serviceOptions).filter(cb => cb.checked);
            if (selected.length === 0) {
                serviceSelect.value = '';
            } else if (selected.length === 1) {
                serviceSelect.value = selected[0].nextElementSibling.textContent;
            } else {
                serviceSelect.value = `${selected.length} dịch vụ được chọn`;
            }
        }
    }

    // Reason dropdown
    const reasonDropdown = document.getElementById('reasonDropdown');
    const reasonSelect = document.getElementById('reasonSelect');
    
    if (reasonDropdown && reasonSelect) {
        // Toggle dropdown
        reasonSelect.addEventListener('click', function(e) {
            e.preventDefault();
            reasonDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!reasonSelect.contains(e.target) && !reasonDropdown.contains(e.target)) {
                reasonDropdown.classList.remove('show');
            }
        });

        // Handle reason option selection
        const reasonOptions = reasonDropdown.querySelectorAll('input[type="checkbox"]');
        const allReasonCheckbox = document.getElementById('reason1');

        reasonOptions.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                if (this === allReasonCheckbox && this.checked) {
                    // If "Tất cả" is checked, uncheck all others
                    reasonOptions.forEach(cb => {
                        if (cb !== allReasonCheckbox) cb.checked = false;
                    });
                } else if (this !== allReasonCheckbox && this.checked) {
                    // If any other option is checked, uncheck "Tất cả"
                    allReasonCheckbox.checked = false;
                }
                
                updateReasonSelectText();
            });
        });

        function updateReasonSelectText() {
            const selected = Array.from(reasonOptions).filter(cb => cb.checked);
            if (selected.length === 0) {
                reasonSelect.value = '';
            } else if (selected.length === 1) {
                reasonSelect.value = selected[0].nextElementSibling.textContent;
            } else {
                reasonSelect.value = `${selected.length} lý do được chọn`;
            }
        }
    }
}

// Pagination functionality
let totalRecords = 10; // Total current records
let currentPage = 1;

function initializePagination() {
    // Page size dropdown functionality
    const pageSizeSelect = document.querySelector('.page-size-selector select');
    if (pageSizeSelect) {
        pageSizeSelect.addEventListener('change', function() {
            console.log('Page size changed to:', this.value);
            currentPage = 1; // Reset to page 1 when changing page size
            updatePagination();
            loadPageData(1);
        });
    }

    // Initialize pagination
    updatePagination();
}

function updatePagination() {
    const pageSize = parseInt(document.querySelector('.page-size-selector select')?.value) || 10;
    const totalPages = Math.ceil(totalRecords / pageSize);
    const paginationNav = document.getElementById('paginationNav');
    
    if (!paginationNav) return;
    
    // Remove all page numbers (except prev/next buttons)
    const pageItems = paginationNav.querySelectorAll('.page-item');
    pageItems.forEach((item, index) => {
        if (index > 0 && index < pageItems.length - 1) {
            item.remove();
        }
    });

    // Add dynamic page numbers
    const nextButton = paginationNav.querySelector('.page-item:last-child');
    
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = i === currentPage ? 'page-item active' : 'page-item';
        
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        pageLink.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            updatePagination();
            loadPageData(i);
        });
        
        pageItem.appendChild(pageLink);
        paginationNav.insertBefore(pageItem, nextButton);
    }

    // Update prev/next button states
    const prevButton = paginationNav.querySelector('.page-item:first-child');
    const nextButtonElement = paginationNav.querySelector('.page-item:last-child');
    
    if (prevButton) {
        prevButton.classList.toggle('disabled', currentPage === 1);
        prevButton.querySelector('a').onclick = function(e) {
            e.preventDefault();
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
                loadPageData(currentPage);
            }
        };
    }

    if (nextButtonElement) {
        nextButtonElement.classList.toggle('disabled', currentPage === totalPages || totalPages <= 1);
        nextButtonElement.querySelector('a').onclick = function(e) {
            e.preventDefault();
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
                loadPageData(currentPage);
            }
        };
    }
}

function loadPageData(page) {
    console.log('Loading page:', page);
    // Here you would load data for the corresponding page
    // Could call API or filter existing data
}

function setTotalRecords(total) {
    totalRecords = total;
    updatePagination();
}

// Filter button functionality
function initializeFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const deliveryTable = document.getElementById('deliveryTable');
    const pendingTable = document.getElementById('pendingTable');
    const defaultActions = document.getElementById('defaultActions');
    const pendingActions = document.getElementById('pendingActions');

    console.log('Initializing filter buttons:', filterButtons.length);
    console.log('Elements found:', {
        deliveryTable: !!deliveryTable,
        pendingTable: !!pendingTable,
        defaultActions: !!defaultActions,
        pendingActions: !!pendingActions
    });

    // Simple direct implementation for reliable functionality
    setTimeout(function() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        console.log('Found filter buttons:', filterBtns.length);
        
        filterBtns.forEach((btn, index) => {
            console.log('Button', index, ':', btn.textContent);
            btn.onclick = function() {
                console.log('Direct click on:', this.textContent);
                
                // Remove active from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                if (this.textContent.includes('Chờ xử lý')) {
                    switchToPendingView();
                } else {
                    switchToDeliveryView();
                    
                    // Update record count based on filter
                    if (this.textContent.includes('Giao hàng 1 phần')) {
                        totalRecords = 10; // Current delivery records
                    } else {
                        totalRecords = 0; // Other filters have no data
                    }
                    updatePagination();
                }
            };
        });
    }, 200);
}

function switchToPendingView() {
    console.log('Switching to pending view');
    const deliveryTable = document.getElementById('deliveryTable');
    const pendingTable = document.getElementById('pendingTable');
    const defaultActions = document.getElementById('defaultActions');
    const pendingActions = document.getElementById('pendingActions');
    const regularFilterButtons = document.getElementById('regularFilterButtons');
    const pendingFilterSection = document.getElementById('pendingFilterSection');
    
    // Hide delivery elements
    if (deliveryTable) deliveryTable.style.display = 'none';
    if (defaultActions) defaultActions.style.display = 'none';
    if (regularFilterButtons) regularFilterButtons.style.display = 'none';
    
    // Show pending elements
    if (pendingTable) pendingTable.style.display = 'table';
    if (pendingActions) pendingActions.style.display = 'flex';
    if (pendingFilterSection) pendingFilterSection.style.display = 'block';
    
    // Load pending data
    loadPendingData();
    totalRecords = 0; // No pending records initially
    updatePagination();
}

function switchToDeliveryView() {
    console.log('Switching to delivery view');
    const deliveryTable = document.getElementById('deliveryTable');
    const pendingTable = document.getElementById('pendingTable');
    const defaultActions = document.getElementById('defaultActions');
    const pendingActions = document.getElementById('pendingActions');
    const regularFilterButtons = document.getElementById('regularFilterButtons');
    const pendingFilterSection = document.getElementById('pendingFilterSection');
    
    // Show delivery elements
    if (deliveryTable) deliveryTable.style.display = 'table';
    if (defaultActions) defaultActions.style.display = 'flex';
    if (regularFilterButtons) regularFilterButtons.style.display = 'flex';
    
    // Hide pending elements
    if (pendingTable) pendingTable.style.display = 'none';
    if (pendingActions) pendingActions.style.display = 'none';
    if (pendingFilterSection) pendingFilterSection.style.display = 'none';
}

function loadPendingData() {
    const pendingTableBody = document.getElementById('pendingTableBody');
    if (pendingTableBody) {
        // Sample pending data matching the image layout
        pendingTableBody.innerHTML = `
            <tr>
                <td>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox">
                    </div>
                </td>
                <td>VTP001234567</td>
                <td>08/10/2025</td>
                <td>
                    <div class="receiver-info">
                        <div class="name">Nguyễn Văn A</div>
                        <div class="phone">0901234567</div>
                    </div>
                </td>
                <td>
                    <div class="address">123 Nguyễn Trãi, Q.1, TP.HCM</div>
                </td>
                <td>
                    <div class="product-info">
                        <div>Điện thoại Samsung</div>
                        <small class="text-muted">COD: 15,000,000đ</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-warning text-dark">Không liên lạc được</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-sm btn-outline-primary" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-success" title="Duyệt">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
            <tr>
                <td>
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox">
                    </div>
                </td>
                <td>VTP001234568</td>
                <td>07/10/2025</td>
                <td>
                    <div class="receiver-info">
                        <div class="name">Trần Thị B</div>
                        <div class="phone">0912345678</div>
                    </div>
                </td>
                <td>
                    <div class="address">456 Lê Lợi, Q.3, TP.HCM</div>
                </td>
                <td>
                    <div class="product-info">
                        <div>Laptop Dell</div>
                        <small class="text-muted">COD: 25,000,000đ</small>
                    </div>
                </td>
                <td>
                    <span class="badge bg-secondary">Địa chỉ không chính xác</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-sm btn-outline-primary" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-success" title="Duyệt">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Tab switching functionality
function initializeTabSwitching() {
    const tabTriggers = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabTriggers.forEach(trigger => {
        trigger.addEventListener('shown.bs.tab', function(e) {
            console.log('Tab switched to:', e.target.getAttribute('data-bs-target'));
            // Add your tab switch logic here
        });
    });
}

// Table data filtering
function filterTableData(searchTerm) {
    const tables = [document.getElementById('deliveryTable'), document.getElementById('pendingTable')];
    
    tables.forEach(table => {
        if (!table || table.style.display === 'none') return;
        
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });
}

// Utility functions for testing and external access
window.setTotalRecords = setTotalRecords;
window.switchToPending = switchToPendingView;
window.switchToDelivery = switchToDeliveryView;

window.testTableSwitch = function() {
    const pendingBtn = document.querySelector('.filter-btn:nth-child(2)');
    if (pendingBtn) {
        pendingBtn.click();
        console.log('Manually triggered pending button click');
    }
};

// Initialize pending view
function initializePendingView() {
    // Ensure pending section is hidden initially
    const pendingFilterSection = document.getElementById('pendingFilterSection');
    if (pendingFilterSection) {
        pendingFilterSection.style.display = 'none';
    }
}

// Demo functions to test pagination
// Example: Change total records to test
// setTotalRecords(25); // Uncomment to test with 25 records (3 pages)
// setTotalRecords(5);  // Uncomment to test with 5 records (1 page)
// testTableSwitch(); // Uncomment to test table switching