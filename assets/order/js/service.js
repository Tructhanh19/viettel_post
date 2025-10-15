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
    const selectedServices = Array.from(
      document.querySelectorAll(".additional-service-checkbox:checked")
    ).map((cb) => cb.dataset.code);

    const totalCost = selectedServices.reduce((sum, code) => {
      return sum + (ServiceData.getServiceCost(code) || 0);
    }, 0);

    console.log("✅ Selected additional services:", selectedServices, "→ Tổng phí:", totalCost);

    if (window.PricingCalculator && typeof window.PricingCalculator.updateOrderData === "function") {
      window.PricingCalculator.updateOrderData({
        selectedServices: selectedServices,
        additionalServicesCost: totalCost, // ✅ fix đúng biến
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
