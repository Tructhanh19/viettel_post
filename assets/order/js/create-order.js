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
    { id: "sender-info", file: "order/sender-info.html" },
    { id: "receiver-info", file: "order/receiver-info.html" },
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
  // Initialize all available modules
  if (window.Sender && window.Sender.init) {
    window.Sender.init();
  }
  
  if (window.Receiver && window.Receiver.init) {
    window.Receiver.init();
  }
  
  if (window.Service && window.Service.init) {
    await window.Service.init();
  }
  
  if (window.Package && window.Package.init) {
    await window.Package.init();
  }
  
  if (window.Pickup && window.Pickup.init) {
    window.Pickup.init();
  }
  
  if (window.Tags && window.Tags.init) {
    window.Tags.init();
  }
  
  if (window.Validation && window.Validation.init) {
    window.Validation.init();
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