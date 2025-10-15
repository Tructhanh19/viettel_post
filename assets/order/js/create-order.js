/**
 * CREATE ORDER FUNCTIONALITY - SIMPLE VERSION
 * Follows the same pattern as postage.js for consistent behavior
 */

// Simple DOMContentLoaded approach like postage.js
document.addEventListener("DOMContentLoaded", function () {
  initCreateOrder();
});

// Also handle case where script loads after DOM is ready
if (document.readyState !== 'loading') {
  initCreateOrder();
}

function initCreateOrder() {
  const createOrderContent = document.querySelector(".create-order-content");
  
  if (!createOrderContent) {
    // Retry after a short delay
    setTimeout(initCreateOrder, 500);
    return;
  }
  
  // Load components immediately
  loadComponents();
}

async function loadComponents() {
  const components = [
    { id: "receiver-info", file: "order/receiver-info.html" },
    { id: "sender-info", file: "order/sender-info.html" },
    { id: "service-selection", file: "order/service-selection.html" },
    { id: "package-info", file: "order/package-info.html" },
    { id: "cod-info", file: "order/cod-info.html" },
  ];

  // Load each component
  for (const component of components) {
    try {
      const response = await fetch(component.file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
      const element = document.getElementById(component.id);
      if (element) {
        element.innerHTML = html;
      }
    } catch (error) {
      // Silent error handling
    }
  }
  
  // Initialize functionality after all components are loaded
  setTimeout(() => {
    initializeBasicFunctionality();
  }, 100);
}

async function initializeBasicFunctionality() {
  // 1️⃣ Initialize data modules first
  if (window.AddressData?.init) await window.AddressData.init();
  if (window.BranchData?.init) await window.BranchData.init();
  if (window.PackageData?.init) await window.PackageData.init();
  if (window.ServiceData?.init) await window.ServiceData.init();
  if (window.ScopeData?.init) await window.ScopeData.init();

  // 2️⃣ Initialize core logic modules (order-related)
  if (window.PricingCalculator?.init) window.PricingCalculator.init();
  if (window.Package?.init) await window.Package.init();

  // 3️⃣ Initialize UI-related modules
  if (window.Sender?.init) window.Sender.init();
  if (window.Receiver?.init) window.Receiver.init();
  if (window.Service?.init) await window.Service.init();
  if (window.Pickup?.init) window.Pickup.init();
  if (window.Tags?.init) window.Tags.init();
  if (window.Validation?.init) window.Validation.init();

  // 4️⃣ ✅ Finally, initialize COD module (after Package & Pricing ready)
  if (window.CODModule?.init) {
    window.CODModule.init();
    console.log("💵 COD Module initialized after core modules");
  }
}


// Debug function (silent)
window.debugCreateOrder = function() {
  const createOrderContent = document.querySelector(".create-order-content");
  const senderInfo = document.getElementById("sender-info");
  const hasContent = senderInfo && senderInfo.innerHTML.trim() !== "";

  return {
    contentExists: !!createOrderContent,
    hasContent: hasContent
  };
};