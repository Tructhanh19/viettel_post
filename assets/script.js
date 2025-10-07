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
  initContentLoader();
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
 * Initialize content loader for dynamic page loading
 */
function initContentLoader() {
  // Add click handlers for links with data-content attribute
  document.querySelectorAll('a[data-content]').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const contentUrl = this.getAttribute('data-content');
      loadContent(contentUrl);
      
      // Update active menu item
      document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
      });
      this.closest('.menu-item').classList.add('active');
    });
  });
}

/**
 * Load content dynamically into main content area
 * @param {string} url - URL of the content to load
 */
async function loadContent(url) {
  const mainContent = document.getElementById('mainContent');
  
  try {
    // Show loading state
    mainContent.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-3">Đang tải...</p></div>';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const content = await response.text();
    mainContent.innerHTML = content;
    
    // Execute any scripts in the loaded content
    const scripts = mainContent.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.head.appendChild(newScript);
      document.head.removeChild(newScript);
    });
    
  } catch (error) {
    console.error('Error loading content:', error);
    mainContent.innerHTML = `
      <div class="alert alert-danger text-center">
        <i class="fas fa-exclamation-triangle"></i>
        <p class="mt-2">Không thể tải nội dung. Vui lòng thử lại.</p>
      </div>
    `;
  }
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
