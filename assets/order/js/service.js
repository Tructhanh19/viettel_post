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

  const ADDITIONAL_SERVICE_COSTS = {
    declareValue: 5000,
    insurance: 10000,
    inspection: 8000,
    specialDelivery: 15000,
    fragileGoods: 12000,
    exchange: 10000,
    specialHandling: 20000,
    handDelivery: 8000,
    identityConfirmation: 15000,
    smsNotification: 2000,
    zaloNotification: 0, // Free service
    refundService: 5000,
  };

  // Public methods
  function init() {
    initServiceSelection();
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

    // Initialize with default selected service
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    if (checkedService) {
      updateServiceInfo(checkedService.value);
      updateServicePrice();
    }

    // Handle additional services
    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]');
    additionalServices.forEach((checkbox) => {
      checkbox.addEventListener("change", function () {
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

    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]:checked');
    additionalServices.forEach((service) => {
      // Add cost for each selected additional service
      additionalCost += getAdditionalServiceCost(service.id);
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
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    return SERVICE_PRICES[checkedService?.value] || SERVICE_PRICES.express;
  }

  function getAdditionalServiceCost(serviceId) {
    return ADDITIONAL_SERVICE_COSTS[serviceId] || 0;
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
    const additionalCost = Array.from(document.querySelectorAll('.additional-services input[type="checkbox"]:checked'))
      .reduce((total, service) => {
        const cost = getAdditionalServiceCost(service.id);
        additionalServices.push({
          id: service.id,
          name: service.nextElementSibling?.textContent || service.id,
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

  // Recalculate pricing (useful for external triggers)
  function recalculatePrice() {
    updateServicePrice();
  }

  // Public API
  return {
    init,
    initServiceSelection,
    updateServiceInfo,
    updateServicePrice,
    getCurrentServicePrice,
    getAdditionalServiceCost,
    formatPrice,
    getCurrentServiceInfo,
    recalculatePrice,
    SERVICE_PRICES,
    SERVICE_INFO,
    ADDITIONAL_SERVICE_COSTS
  };
})();