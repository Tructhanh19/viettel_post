/**
 * SERVICE FUNCTIONALITY
 * Handles service selection, pricing calculation, additional services
 */

window.Service = (function() {
  'use strict';

  // Service pricing data
  const SERVICE_PRICES = {
    standard: 65000,
    express: 82004,
    priority: 120000
  };

  const SERVICE_INFO = {
    standard: {
      price: "65.000 đ",
      deliveryTime: "2-3 ngày",
      description: "Chuyển phát tiêu chuẩn",
    },
    express: {
      price: "82.004 đ",
      deliveryTime: "1 ngày", 
      description: "Chuyển phát nhanh",
    },
    priority: {
      price: "120.000 đ",
      deliveryTime: "4-6 giờ",
      description: "Chuyển phát hỏa tốc",
    },
  };

  // Public methods
  async function init() {
    // Load service data first
    const loaded = await ServiceData.init();
    if (!loaded) {
      console.error('Failed to load service data');
      return;
    }

    // Render dynamic content
    renderAdditionalServices();

    // Initialize functionality
    initServiceSelection();
    updateServiceCounter();
  }

  function renderAdditionalServices() {
    const services = ServiceData.getOtherServices();
    const container = document.querySelector('.additional-services .row');
    
    if (!container || services.length === 0) {
      console.warn('Additional services container not found or no services available');
      return;
    }

    // Clear existing content
    container.innerHTML = '';

    // Group services into 3 columns
    const servicesPerColumn = Math.ceil(services.length / 3);
    
    for (let col = 0; col < 3; col++) {
      const columnDiv = document.createElement('div');
      columnDiv.className = 'col-md-4';
      
      const startIdx = col * servicesPerColumn;
      const endIdx = Math.min(startIdx + servicesPerColumn, services.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const service = services[i];
        const serviceId = service.code.toLowerCase();
        const isChecked = service.code === 'ZALO_THONG_BAO'; // Default checked
        
        const serviceHTML = `
          <div class="form-check mb-2">
            <input class="form-check-input additional-service-checkbox" 
                   type="checkbox" 
                   id="${serviceId}" 
                   data-code="${service.code}" 
                   data-cost="${service.cost}"
                   ${isChecked ? 'checked' : ''}>
            <label class="form-check-label" for="${serviceId}">${service.name}</label>
          </div>
        `;
        columnDiv.insertAdjacentHTML('beforeend', serviceHTML);
      }
      
      container.appendChild(columnDiv);
    }
  }

  function updateServiceCounter() {
    const checkedCount = document.querySelectorAll('.additional-service-checkbox:checked').length;
    const counterElement = document.querySelector('.card-body h6');
    
    if (counterElement && counterElement.textContent.includes('DỊCH VỤ CỘNG THÊM')) {
      counterElement.innerHTML = `<i class="fas fa-plus-circle"></i> DỊCH VỤ CỘNG THÊM (${checkedCount})`;
    }
  }

  function initServiceSelection() {
    // Handle main service selection changes
    const serviceRadios = document.querySelectorAll('input[name="mainService"]');
    serviceRadios.forEach((radio) => {
      radio.addEventListener("change", function () {
        updateServiceInfo(this.value);
        updateServicePrice();
      });
    });

    // Don't calculate price on init - keep default 0 đ
    // Price will be calculated when user fills in package info or selects additional services

    // Handle additional services
    const additionalServices = document.querySelectorAll('.additional-service-checkbox');
    additionalServices.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
        updateServiceCounter();
        updateServicePrice();
      });
    });
  }

  function updateServiceInfo(serviceType) {
    const info = SERVICE_INFO[serviceType];
    if (!info) return;

    // Update price and delivery time in the UI
    const priceElement = document.querySelector(".service-info strong");
    const deliveryElement = document.querySelector(".service-info .me-2 strong");

    if (priceElement) {
      priceElement.textContent = info.price;
    }
    if (deliveryElement) {
      deliveryElement.textContent = info.deliveryTime;
    }

    // Update any service description if exists
    const descriptionElement = document.querySelector(".service-description");
    if (descriptionElement) {
      descriptionElement.textContent = info.description;
    }
  }

  function updateServicePrice() {
    // Calculate total price including additional services
    const basePrice = getCurrentServicePrice();
    let additionalCost = 0;

    const additionalServices = document.querySelectorAll('.additional-service-checkbox:checked');
    additionalServices.forEach((checkbox) => {
      // Get cost from data attribute (from JSON)
      const cost = parseFloat(checkbox.dataset.cost) || 0;
      additionalCost += cost;
    });

    const totalPrice = basePrice + additionalCost;
    
    // Update all price display elements
    updatePriceDisplay(totalPrice);
  }

  function updatePriceDisplay(totalPrice) {
    const formattedPrice = formatPrice(totalPrice) + " đ";
    
    // Update main service price display
    const priceElement = document.querySelector(".service-info strong");
    if (priceElement) {
      priceElement.textContent = formattedPrice;
    }

    // Update floating bar price if exists
    const floatingPrice = document.querySelector("#pricingSummaryBar .price");
    if (floatingPrice) {
      floatingPrice.textContent = formattedPrice;
    }

    // Update detailed summary if exists
    const detailedPrice = document.querySelector("#detailedSummary .total-price");
    if (detailedPrice) {
      detailedPrice.textContent = formattedPrice;
    }

    // Trigger custom event for other modules
    const priceUpdateEvent = new CustomEvent('priceUpdated', {
      detail: { totalPrice, formattedPrice }
    });
    document.dispatchEvent(priceUpdateEvent);
  }

  function getCurrentServicePrice() {
    // Return 0 until package info is filled
    // Real price calculation should happen after user inputs package weight/dimensions
    return 0;
  }

  function calculateMainServicePrice(weight, distance) {
    // Calculate base price based on weight and distance
    // This is a placeholder - real calculation would be more complex
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    const serviceType = checkedService?.value || 'express';
    
    // Base rates per kg
    const ratesPerKg = {
      standard: 20000,
      express: 25000,
      priority: 35000
    };
    
    const weightInKg = weight / 1000; // Convert grams to kg
    const basePrice = ratesPerKg[serviceType] * Math.max(weightInKg, 0.5); // Minimum 0.5kg
    
    return Math.round(basePrice);
  }

  function getAdditionalServiceCost(serviceId) {
    // Get cost from checkbox data attribute (from JSON)
    const checkbox = document.getElementById(serviceId);
    if (checkbox && checkbox.dataset.cost) {
      return parseFloat(checkbox.dataset.cost);
    }
    
    // If checkbox not found, try to get from ServiceData module
    const code = serviceId.toUpperCase();
    const cost = ServiceData.getServiceCost(code);
    return cost || 0;
  }

  function formatPrice(price) {
    return price.toLocaleString("vi-VN");
  }

  // Get current service selection info
  function getCurrentServiceInfo() {
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    const serviceType = checkedService?.value || 'express';
    const basePrice = SERVICE_PRICES[serviceType];
    
    const additionalServices = [];
    const additionalCost = Array.from(document.querySelectorAll('.additional-service-checkbox:checked'))
      .reduce((total, checkbox) => {
        const cost = parseFloat(checkbox.dataset.cost) || 0;
        additionalServices.push({
          id: checkbox.id,
          code: checkbox.dataset.code,
          name: checkbox.nextElementSibling?.textContent || checkbox.id,
          cost: cost
        });
        return total + cost;
      }, 0);

    return {
      serviceType,
      serviceInfo: SERVICE_INFO[serviceType],
      basePrice,
      additionalServices,
      additionalCost,
      totalPrice: basePrice + additionalCost
    };
  }

  function getSelectedAdditionalServices() {
    const selected = [];
    document.querySelectorAll('.additional-service-checkbox:checked').forEach(checkbox => {
      selected.push({
        code: checkbox.dataset.code,
        name: checkbox.nextElementSibling?.textContent || '',
        cost: parseFloat(checkbox.dataset.cost) || 0
      });
    });
    return selected;
  }

  function calculateAdditionalServicesCost() {
    const services = getSelectedAdditionalServices();
    return services.reduce((total, service) => total + service.cost, 0);
  }

  // Recalculate pricing (useful for external triggers)
  function recalculatePrice() {
    updateServicePrice();
  }

  // Calculate price based on package info
  function recalculatePriceWithPackageInfo(weight, distance) {
    const basePrice = calculateMainServicePrice(weight, distance);
    let additionalCost = 0;

    const additionalServices = document.querySelectorAll('.additional-service-checkbox:checked');
    additionalServices.forEach((checkbox) => {
      const cost = parseFloat(checkbox.dataset.cost) || 0;
      additionalCost += cost;
    });

    const totalPrice = basePrice + additionalCost;
    updatePriceDisplay(totalPrice);
    return totalPrice;
  }

  // Public API
  return {
    init,
    initServiceSelection,
    updateServiceInfo,
    updateServicePrice,
    updateServiceCounter,
    getCurrentServicePrice,
    calculateMainServicePrice,
    getAdditionalServiceCost,
    formatPrice,
    getCurrentServiceInfo,
    getSelectedAdditionalServices,
    calculateAdditionalServicesCost,
    recalculatePrice,
    recalculatePriceWithPackageInfo,
    SERVICE_PRICES,
    SERVICE_INFO
  };
})();