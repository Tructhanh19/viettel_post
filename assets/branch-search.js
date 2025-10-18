/**
 * Branch Search Functionality
 * Handles searching, filtering, and paginating branch information
 */

let branchData = [];
let filteredBranches = [];
let currentPage = 1;
let itemsPerPage = 12;
let provinces = [];

/**
 * Initialize branch search functionality
 */
function initBranchSearch() {
  if (!window.branchDataRaw) {
    console.error("Branch data not loaded");
    return;
  }

  branchData = window.branchDataRaw;
  filteredBranches = [...branchData];

  // Extract unique provinces
  provinces = [
    ...new Set(branchData.map((branch) => branch.address.province)),
  ].sort();

  setupEventListeners();
  populateProvinceFilter();
  applyFilters();

  // Initial render
  renderBranches();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  const searchInput = document.getElementById("searchInput");
  const provinceFilter = document.getElementById("provinceFilter");
  const statusFilter = document.getElementById("statusFilter");
  const itemsPerPageSelect = document.getElementById("itemsPerPage");
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");

  // Search input
  searchInput.addEventListener("input", function (e) {
    currentPage = 1; // Reset to first page
    applyFilters();
  });

  // Province filter
  provinceFilter.addEventListener("change", function () {
    currentPage = 1;
    applyFilters();
  });

  // Status filter
  statusFilter.addEventListener("change", function () {
    currentPage = 1;
    applyFilters();
  });

  // Items per page
  itemsPerPageSelect.addEventListener("change", function () {
    itemsPerPage = parseInt(this.value);
    currentPage = 1;
    applyFilters();
  });

  // Pagination buttons
  prevPageBtn.addEventListener("click", function () {
    if (currentPage > 1) {
      currentPage--;
      renderBranches();
    }
  });

  nextPageBtn.addEventListener("click", function () {
    const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderBranches();
    }
  });
}

/**
 * Populate province filter dropdown
 */
function populateProvinceFilter() {
  const provinceFilter = document.getElementById("provinceFilter");
  provinces.forEach((province) => {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    provinceFilter.appendChild(option);
  });
}

/**
 * Apply all filters (search, province, status)
 */
function applyFilters() {
  const searchTerm = document
    .getElementById("searchInput")
    .value.toLowerCase()
    .trim();
  const selectedProvince = document.getElementById("provinceFilter").value;
  const selectedStatus = document.getElementById("statusFilter").value;

  filteredBranches = branchData.filter((branch) => {
    // Search filter
    const matchesSearch =
      !searchTerm ||
      branch.name.toLowerCase().includes(searchTerm) ||
      branch.address.province.toLowerCase().includes(searchTerm) ||
      branch.address.district.toLowerCase().includes(searchTerm) ||
      branch.address.ward.toLowerCase().includes(searchTerm) ||
      branch.address.other.toLowerCase().includes(searchTerm) ||
      branch.phone.toLowerCase().includes(searchTerm);

    // Province filter
    const matchesProvince =
      !selectedProvince || branch.address.province === selectedProvince;

    // Status filter
    const matchesStatus =
      !selectedStatus || branch.is_active.toString() === selectedStatus;

    return matchesSearch && matchesProvince && matchesStatus;
  });

  currentPage = 1; // Reset to first page when filters change
  renderBranches();
}

/**
 * Render branches with pagination
 */
function renderBranches() {
  const branchList = document.getElementById("branchList");
  const noResults = document.getElementById("noResults");
  const pagination = document.getElementById("pagination");

  if (filteredBranches.length === 0) {
    branchList.innerHTML = "";
    noResults.style.display = "block";
    pagination.style.display = "none";
    return;
  }

  noResults.style.display = "none";
  pagination.style.display = "block";

  // Calculate pagination
  const totalPages = Math.ceil(filteredBranches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredBranches.length);
  const branchesToShow = filteredBranches.slice(startIndex, endIndex);

  // Render branches
  const branchesHtml = branchesToShow
    .map((branch) => {
      const fullAddress = [
        branch.address.other,
        branch.address.ward,
        branch.address.district,
        branch.address.province,
      ]
        .filter(Boolean)
        .join(", ");

      const statusClass = branch.is_active ? "active" : "inactive";
      const statusText = branch.is_active ? "Hoạt động" : "Tạm ngừng";

      return `
      <div class="branch-card">
        <div class="branch-name">${branch.name}</div>
        <div class="branch-address">
          <i class="fas fa-map-marker-alt"></i> ${fullAddress}
        </div>
        <div class="branch-phone">
          <i class="fas fa-phone"></i> ${branch.phone}
        </div>
        <div class="branch-hours">
          <i class="fas fa-clock"></i> ${branch.working_hours}
        </div>
        <span class="branch-status ${statusClass}">${statusText}</span>
      </div>
    `;
    })
    .join("");

  branchList.innerHTML = branchesHtml;

  // Update pagination info
  document.getElementById("startItem").textContent = startIndex + 1;
  document.getElementById("endItem").textContent = endIndex;
  document.getElementById("totalItems").textContent = filteredBranches.length;

  // Update pagination controls
  updatePaginationControls(totalPages);
}

/**
 * Update pagination controls
 * @param {number} totalPages - Total number of pages
 */
function updatePaginationControls(totalPages) {
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageNumbers = document.getElementById("pageNumbers");

  // Update prev/next buttons
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;

  // Generate page numbers
  pageNumbers.innerHTML = "";
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `page-number ${i === currentPage ? "active" : ""}`;
    pageBtn.textContent = i;
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderBranches();
    });
    pageNumbers.appendChild(pageBtn);
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // If data is already loaded, initialize immediately
  if (window.branchDataRaw) {
    initBranchSearch();
  }
});
