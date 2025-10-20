window.Service = (function () {
  "use strict";

  async function init() {
    const loaded = await ServiceData.init();
    if (!loaded) {
      console.error("❌ Không thể load dữ liệu dịch vụ");
      return;
    }

    renderAdditionalServices();
    setupAdditionalServiceListeners();
  }

  function renderAdditionalServices() {
    const services = ServiceData.getOtherServices();
    const container = document.querySelector(".additional-services .row");

    if (!container || services.length === 0) {
      console.warn("⚠️ Không tìm thấy container hoặc không có dịch vụ nào");
      return;
    }

    container.innerHTML = "";
    const servicesPerColumn = Math.ceil(services.length / 3);

    for (let col = 0; col < 3; col++) {
      const columnDiv = document.createElement("div");
      columnDiv.className = "col-md-4";

      const startIdx = col * servicesPerColumn;
      const endIdx = Math.min(startIdx + servicesPerColumn, services.length);

      for (let i = startIdx; i < endIdx; i++) {
        const service = services[i];
        const serviceId = service.code.toLowerCase();
        const isChecked = service.default === true;

        const serviceHTML = `
          <div class="form-check mb-2">
            <input class="form-check-input additional-service-checkbox"
                   type="checkbox"
                   id="${serviceId}"
                   data-code="${service.code}"
                   data-cost="${service.cost}"
                   ${isChecked ? "checked" : ""}>
            <label class="form-check-label" for="${serviceId}">${service.name}</label>
          </div>
        `;
        columnDiv.insertAdjacentHTML("beforeend", serviceHTML);
      }

      container.appendChild(columnDiv);
    }
  }

  function setupAdditionalServiceListeners() {
    const checkboxes = document.querySelectorAll(".additional-service-checkbox");
    checkboxes.forEach((cb) => cb.addEventListener("change", updateSelectedServices));

    // Đồng bộ ngay khi init
    updateSelectedServices();
  }

  function updateSelectedServices() {
    // Build otherServices array with code, name, totalPrice
    const otherServices = Array.from(
      document.querySelectorAll(".additional-service-checkbox:checked")
    ).map((cb) => {
      const code = cb.dataset.code;
      const name = cb.nextElementSibling?.textContent?.trim() || code;
      const totalPrice = Number(cb.dataset.cost) || 0;
      return { code, name, totalPrice };
    });

    // Main shipping service (from radio)
    let shippingService = null;
    const mainServiceRadio = document.querySelector("input[name='mainService']:checked");
    if (mainServiceRadio) {
      const code = mainServiceRadio.value;
      const label = document.querySelector(`label[for='${mainServiceRadio.id}']`);
      const name = label?.textContent?.trim() || code;
      // Estimate time: demo value, should get from ServiceData if available
      let estimate_time_hours = 24;
      if (window.ServiceData && typeof window.ServiceData.getEstimateTime === "function") {
        estimate_time_hours = window.ServiceData.getEstimateTime(code) || 24;
      }
      shippingService = { code, name, estimate_time_hours };
    }

    // Save to CreateOrderData
    window.CreateOrderData = window.CreateOrderData || {};
    window.CreateOrderData.otherServices = otherServices;
    window.CreateOrderData.shippingService = shippingService;

    console.log("✅ [CreateOrderData] otherServices:", otherServices);
    console.log("✅ [CreateOrderData] shippingService:", shippingService);

    if (window.PricingCalculator && typeof window.PricingCalculator.updateOrderData === "function") {
      window.PricingCalculator.updateOrderData({
        selectedServices: otherServices.map(s => s.code),
        additionalServicesCost: otherServices.reduce((sum, s) => sum + s.totalPrice, 0),
      });
    }

    updateServiceCounter();
  }

  function updateServiceCounter() {
    const checkedCount = document.querySelectorAll(".additional-service-checkbox:checked").length;
    const counterElement = document.querySelector(".card-body h6");

    if (counterElement && counterElement.textContent.includes("DỊCH VỤ CỘNG THÊM")) {
      counterElement.innerHTML = `<i class="fas fa-plus-circle"></i> DỊCH VỤ CỘNG THÊM (${checkedCount})`;
    }
  }

  return { init };
})();
window.Service.getSelectedService = function() {
  return {
    shipping: window.CreateOrderData?.shippingService || {},
    additional: window.CreateOrderData?.otherServices || [],
  };
};

