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

// Store initial dashboard content
let initialDashboard = "";

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", function () {
  // Store initial dashboard content
  initialDashboard = mainContent.innerHTML;

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
  document.querySelectorAll("a[data-content]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const contentUrl = this.getAttribute("data-content");
      loadContent(contentUrl);

      // Remove active class from all menu items and submenu items
      document.querySelectorAll(".menu-item").forEach((item) => {
        item.classList.remove("active");
      });
      document.querySelectorAll(".submenu a").forEach((item) => {
        item.classList.remove("active");
      });

      // Add active class only to the clicked item
      this.classList.add("active");

      // If this is a submenu item, also mark parent menu as open
      const parentMenuItem = this.closest(".menu-item.has-submenu");
      if (parentMenuItem) {
        parentMenuItem.classList.add("open");
      }
    });
  });
}

/**
 * Load content dynamically into main content area
 * @param {string} url - URL of the content to load
 */
async function loadContent(url) {
  const mainContent = document.getElementById("mainContent");

  // Special case for home - restore initial dashboard
  if (url === "home") {
    mainContent.innerHTML = initialDashboard;
    return;
  }

  try {
    // Show loading state
    mainContent.innerHTML =
      '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p class="mt-3">Đang tải...</p></div>';

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    mainContent.innerHTML = content;

    // Clean up old dynamic scripts before adding new ones
    document
      .querySelectorAll('script[data-dynamic="true"]')
      .forEach((oldScript) => {
        oldScript.remove();
      });

    // Reset global modules to force reinit when loading dynamic pages
    // This ensures event listeners and DOM bindings are recreated for new elements
    const modulesToReset = [
      "AddressData",
      "BranchData",
      "PackageData",
      "ProductData",
      "SenderData",
      "ServiceData",
      "TagData",
      "Sender",
      "Receiver",
      "Service",
      "Package",
      "Pickup",
      "Tags",
      "OrderController",
      "SenderInfo",
      "PostageCalculator",
    ];

    modulesToReset.forEach((moduleName) => {
      if (window[moduleName]) {
        delete window[moduleName];
      }
    });

    // Execute any scripts in the loaded content
    const scripts = mainContent.querySelectorAll("script");

    // Separate external and inline scripts
    const externalScripts = [];
    const inlineScripts = [];

    scripts.forEach((script) => {
      if (script.src) {
        externalScripts.push(script);
      } else {
        inlineScripts.push(script);
      }
      script.remove(); // Remove from mainContent
    });

    // Load external scripts first (in sequence)
    // Add cache-busting timestamp to force reload
    const timestamp = Date.now();
    for (const script of externalScripts) {
      await new Promise((resolve, reject) => {
        const newScript = document.createElement("script");
        newScript.setAttribute("data-dynamic", "true");
        // Add timestamp to force reload (cache busting)
        const separator = script.src.includes("?") ? "&" : "?";
        newScript.src = script.src + separator + "_t=" + timestamp;
        newScript.onload = resolve;
        newScript.onerror = reject;
        document.body.appendChild(newScript);
      });
    }

    // Then execute inline scripts (in sequence)
    for (const script of inlineScripts) {
      const newScript = document.createElement("script");
      newScript.setAttribute("data-dynamic", "true");
      newScript.textContent = script.textContent;
      document.body.appendChild(newScript);

      // Small delay to ensure script executes
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  } catch (error) {
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
  initAccountSettingsMenu();
  initReceiverManagementHandler();
});
//
//
//
//
//
// ====================================================================================
/**
 * Initialize Account Settings menu handler
 */
function initAccountSettingsMenu() {
  const accountMenu = document.querySelector("#accountSettingsMenu a");
  const mainContent = document.getElementById("mainContent");

  if (accountMenu && mainContent) {
    accountMenu.addEventListener("click", function (e) {
      e.preventDefault();

      // Tải sidebar.html
      fetch("./AccountSetting/sidebar.html")
        .then((res) => res.text())
        .then((html) => {
          mainContent.innerHTML = html;

          // Khi sidebar load xong, khởi tạo sidebar
          initSidebarAjax();

          // Tải sẵn trang accountDetail.html khi vừa mở "Cài đặt tài khoản"
          const accountContent = document.getElementById("accountContent");
          if (accountContent) {
            loadAccountPage(
              accountContent,
              "./AccountSetting/accountDetail.html"
            );
          }
        })
        .catch((err) => {
          mainContent.innerHTML = `<p style="color:red;">Lỗi tải sidebar.html</p>`;
        });
    });
  }
}

/**
 * Initialize handler for sender management links
 */
function initReceiverManagementHandler() {
  const mainContent = document.getElementById("mainContent");

  if (mainContent) {
    mainContent.addEventListener("click", function (e) {
      if (e.target.matches('a[data-action="load-receiver-management"]')) {
        e.preventDefault();

        // Tải sidebar.html
        fetch("./AccountSetting/sidebar.html")
          .then((res) => res.text())
          .then((html) => {
            mainContent.innerHTML = html;

            // Khi sidebar load xong, khởi tạo sidebar
            initSidebarAjax();

            // Active thẻ li "Thông tin người gửi"
            const senderLink = document.querySelector(
              '.account-menu .menu-link[href="receiverInfo.html"]'
            );
            if (senderLink) {
              senderLink.parentElement.classList.add("active");
            }

            // Tải trang receiverInfo.html
            const accountContent = document.getElementById("accountContent");
            if (accountContent) {
              loadAccountPage(
                accountContent,
                "./AccountSetting/receiverInfo.html"
              );
            }
          })
          .catch((err) => {
            mainContent.innerHTML = `<p style="color:red;">Lỗi tải sidebar.html</p>`;
          });
      }
    });
  }
}

/**
 * Initialize sidebar ajax navigation for account settings
 */
function initSidebarAjax() {
  const accountLinks = document.querySelectorAll(".account-menu .menu-link");
  const accountContent = document.getElementById("accountContent");

  if (!accountContent) return;

  accountLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const page = this.getAttribute("href");

      // Highlight menu đang chọn
      accountLinks.forEach((l) => l.parentElement.classList.remove("active"));
      this.parentElement.classList.add("active");

      // Load page
      loadAccountPage(accountContent, `./AccountSetting/${page}`);
    });
  });
}
// ====================================================================================
//
//
//
//
//
/**
 * Load account page with script execution
 * @param {HTMLElement} container - Container to load content into
 * @param {string} url - URL to load
 */
async function loadAccountPage(container, url) {
  container.innerHTML = "<p>Đang tải...</p>";

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    container.innerHTML = html;

    console.log("📄 HTML loaded, resetting modules...");

    // Reset global modules to force reinit
    const modulesToReset = ["AddressData", "SenderData", "SenderInfo"];
    modulesToReset.forEach((moduleName) => {
      if (window[moduleName]) {
        console.log("🗑️ Deleting module:", moduleName);
        delete window[moduleName];
      }
    });

    // Execute scripts in the loaded content
    const scripts = container.querySelectorAll("script");
    const externalScripts = [];
    const inlineScripts = [];

    scripts.forEach((script) => {
      if (script.src) {
        externalScripts.push(script);
      } else {
        inlineScripts.push(script);
      }
      script.remove();
    });

    // Clean up old dynamic scripts first
    const oldScripts = document.querySelectorAll('script[data-dynamic="true"]');
    console.log("🧹 Cleaning up old scripts:", oldScripts.length);
    oldScripts.forEach((oldScript) => {
      oldScript.remove();
    });

    console.log(
      "📦 Loading",
      externalScripts.length,
      "external scripts and",
      inlineScripts.length,
      "inline scripts"
    );

    // Load external scripts with cache busting
    const timestamp = Date.now();
    for (const script of externalScripts) {
      await new Promise((resolve, reject) => {
        const newScript = document.createElement("script");
        newScript.setAttribute("data-dynamic", "true");
        const separator = script.src.includes("?") ? "&" : "?";
        newScript.src = script.src + separator + "_t=" + timestamp;
        newScript.onload = resolve;
        newScript.onerror = reject;
        document.body.appendChild(newScript);
      });
    }

    // Execute inline scripts
    for (const script of inlineScripts) {
      const newScript = document.createElement("script");
      newScript.setAttribute("data-dynamic", "true");
      newScript.textContent = script.textContent;
      document.body.appendChild(newScript);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Sau khi load script xong, nếu là accountDetail.html, changePassword.html hoặc staffManager.html thì gọi initAccountPage
    if (
      (url.includes("accountDetail.html") ||
        url.includes("changePassword.html") ||
        url.includes("staffManager.html")) &&
      window.initAccountPage
    ) {
      await window.initAccountPage();
    }
  } catch (err) {
    container.innerHTML = `<p style="color:red;">Không thể tải trang. Vui lòng thử lại.</p>`;
  }
}
