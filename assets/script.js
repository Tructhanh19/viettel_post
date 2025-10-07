/**
 * Viettel Post Dashboard JavaScript
 * Main functionality for sidebar, user dropdown, and other interactions
 */

// DOM Elements
const menuToggle = document.getElementById("menuToggle");
const sidebar = document.getElementById("sidebar");
const mainContent = document.getElementById("mainContent");
const userDropdown = document.getElementById("userDropdown");
const userInfo = userDropdown.querySelector(".user-info");

// Submenu IDs
const submenus = ["quanLyMenu", "traCuuMenu", "tienIchMenu", "hoiDapMenu"];

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  initSidebarToggle();
  initUserDropdown();
  initSubmenus();
  initOutsideClickHandler();
});

/**
 * Initialize sidebar toggle functionality
 */
function initSidebarToggle() {
  menuToggle.addEventListener("click", function () {
    sidebar.classList.toggle("collapsed");
  });
}

/**
 * Initialize user dropdown functionality
 */
function initUserDropdown() {
  userInfo.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    userDropdown.classList.toggle("open");

    // Close all submenus when opening user dropdown
    closeAllSubmenus();
  });
}

/**
 * Initialize submenu functionality
 */
function initSubmenus() {
  submenus.forEach((menuId) => {
    const menu = document.getElementById(menuId);
    if (menu) {
      const menuLink = menu.querySelector(".menu-link");
      menuLink.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Close user dropdown when opening submenu
        userDropdown.classList.remove("open");

        // Close other submenus
        submenus.forEach((otherId) => {
          if (otherId !== menuId) {
            const otherMenu = document.getElementById(otherId);
            if (otherMenu) {
              otherMenu.classList.remove("open");
            }
          }
        });

        // Toggle current submenu
        menu.classList.toggle("open");
      });
    }
  });
}

/**
 * Initialize outside click handler to close dropdowns
 */
function initOutsideClickHandler() {
  document.addEventListener("click", function (e) {
    // Check if click is inside any submenu
    const clickedInsideSubmenu = submenus.some((menuId) => {
      const menu = document.getElementById(menuId);
      return menu && menu.contains(e.target);
    });

    // Close all submenus if clicked outside
    if (!clickedInsideSubmenu) {
      closeAllSubmenus();
    }

    // Close user dropdown if clicked outside
    if (!userDropdown.contains(e.target)) {
      userDropdown.classList.remove("open");
    }
  });
}

/**
 * Close all submenu dropdowns
 */
function closeAllSubmenus() {
  submenus.forEach((menuId) => {
    const menu = document.getElementById(menuId);
    if (menu) {
      menu.classList.remove("open");
    }
  });
}

/**
 * Utility function to handle menu item selection
 * @param {string} menuItem - The selected menu item
 */
function selectMenuItem(menuItem) {
  // Remove active class from all menu items
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.classList.remove("active");
  });

  // Add active class to selected item
  const selectedItem = document.querySelector(`[data-menu="${menuItem}"]`);
  if (selectedItem) {
    selectedItem.classList.add("active");
  }
}

/**
 * Handle search functionality
 */
function initSearch() {
  const searchInput = document.querySelector(".search input");
  const searchBtn = document.querySelector(".search-btn");

  if (searchInput && searchBtn) {
    searchBtn.addEventListener("click", function () {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
      }
    });

    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const query = this.value.trim();
        if (query) {
          performSearch(query);
        }
      }
    });
  }
}

/**
 * Perform search operation
 * @param {string} query - Search query
 */
function performSearch(query) {
  console.log("Searching for:", query);
  // TODO: Implement actual search functionality
  alert(`Tìm kiếm: ${query}`);
}

/**
 * Initialize chart functionality (placeholder)
 */
function initCharts() {
  // TODO: Initialize Chart.js or other charting library
  console.log("Charts initialized");
}

document.addEventListener("DOMContentLoaded", function () {
  initSearch();
  initCharts();
  // initAccountSettingsMenu();
});

function initAccountSettingsMenu() {
  const accountMenuItem = document.getElementById("accountSettingsMenu");

  const mainContent = document.getElementById("mainContent");

  if (accountMenuItem && mainContent) {
    const link = accountMenuItem.querySelector("a.menu-link");

    if (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();

        fetch(link.getAttribute("href"))
          .then((response) => {
            if (!response.ok) {
              throw new Error("Lỗi kết nối mạng hoặc không tìm thấy file");
            }
            return response.text();
          })
          .then((html) => {
            html = html.replace(
              "../assets/AccountSetting/account.css",
              "assets/AccountSetting/account.css"
            );

            mainContent.innerHTML = html;

            document.querySelectorAll(".menu-item").forEach((item) => {
              item.classList.remove("active");
            });

            accountMenuItem.classList.add("active");
          })
          .catch((error) => {
            console.error("Lỗi khi tải nội dung:", error);
            alert("Không thể tải nội dung. Vui lòng thử lại sau.");
          });
      });
    }
  }
}
