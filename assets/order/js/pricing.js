/**
 * PRICING CALCULATOR
 * Calculate shipping fees based on order information
 */
window.PricingCalculator = (function () {
  "use strict";

  let currentOrderData = {
    senderProvince: null,
    senderDistrict: null,
    receiverProvince: null,
    receiverDistrict: null,
    weight: 0,
    packageValue: 0,
    featuresCost: 0, // Phụ phí từ package features (đã tính sẵn)
    serviceCode: "SCN",
    additionalServicesCost: 0, // phí dịch vụ cộng thêm
    promotionDiscount: 0, // giảm giá khuyến mãi
  };

  /**
   * Update order data
   */
  function updateOrderData(data) {
    currentOrderData = { ...currentOrderData, ...data };
    console.log("💰 Order data updated:", currentOrderData);

    // Log kiểm tra selectedServices
    if (Array.isArray(currentOrderData.selectedServices)) {
      console.log(
        "[OrderData] selectedServices:",
        currentOrderData.selectedServices
      );
    } else {
      console.log(
        "[OrderData] selectedServices is missing or not an array:",
        currentOrderData.selectedServices
      );
    }

    calculateAndDisplay();

    // Phát sự kiện để các UI khác cập nhật
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent("orderDataChanged", { detail: currentOrderData })
      );
    }, 0);
  }

  /**
   * Calculate base shipping fee
   */
  function calculateShippingFee() {
    const {
      senderProvince,
      senderDistrict,
      receiverProvince,
      receiverDistrict,
      weight,
    } = currentOrderData;

    console.group("📦 [Kiểm tra dữ liệu tính phí]");
    console.table({
      senderProvince,
      senderDistrict,
      receiverProvince,
      receiverDistrict,
      weight,
      packageValue: currentOrderData.packageValue,
      featuresCost: currentOrderData.featuresCost,
      serviceCode: currentOrderData.serviceCode,
      additionalServicesCost: currentOrderData.additionalServicesCost,
      promotionDiscount: currentOrderData.promotionDiscount,
    });
    console.groupEnd();

    // Kiểm tra đủ dữ liệu
    if (
      !receiverProvince ||
      !senderProvince ||
      !receiverDistrict ||
      !senderDistrict ||
      !weight ||
      weight <= 0 ||
      !currentOrderData.packageValue
    ) {
      console.warn("⚠️ Chưa đủ thông tin để tính phí!", {
        receiverProvince,
        receiverDistrict,
        senderProvince,
        senderDistrict,
        weight,
        packageValue: currentOrderData.packageValue,
      });
      return null;
    }

    if (!window.ScopeData) {
      console.error("❌ ScopeData not available");
      return null;
    }

    const scopeCode = window.ScopeData.determineScope(
      senderProvince,
      senderDistrict || "",
      receiverProvince,
      receiverDistrict || ""
    );
    const baseFee = window.ScopeData.calculateShippingFee(scopeCode, weight);

    if (baseFee === null) return null;

    return { baseFee, scopeCode };
  }

  /**
   * Get special product fees (already calculated by Package module)
   */
  function getSpecialProductFees() {
    return currentOrderData.featuresCost || 0;
  }

  /**
   * Calculate total fee
   */
  function calculateTotalFee() {
    const shippingResult = calculateShippingFee();
    if (!shippingResult) return null;

    const promotionDiscount = currentOrderData.promotionDiscount || 0;
    const codFee = currentOrderData.codFee || 0;
    const featuresCost = currentOrderData.featuresCost || 0;

    // ✅ Tính phí dịch vụ cộng thêm
    let additionalServicesCost = currentOrderData.additionalServicesCost || 0;
    if (
      Array.isArray(currentOrderData.selectedServices) &&
      additionalServicesCost === 0
    ) {
      additionalServicesCost = currentOrderData.selectedServices.reduce(
        (sum, code) => {
          return sum + (window.ServiceData?.getServiceCost(code) || 0);
        },
        0
      );
    }

    const totalFee =
      shippingResult.baseFee +
      featuresCost +
      codFee +
      additionalServicesCost -
      promotionDiscount;

    const estimateTime =
      window.ScopeData && typeof window.ScopeData.getEstimateTime === "function"
        ? window.ScopeData.getEstimateTime(shippingResult.scopeCode)
        : 1;

    return {
      baseFee: shippingResult.baseFee,
      additionalServicesCost,
      codFee,
      featuresCost,
      promotionDiscount,
      totalFee,
      estimateTime,
      scopeCode: shippingResult.scopeCode,
    };
  }

  /**
   * Calculate and display pricing
   */
  function calculateAndDisplay() {
    console.group("🧮 [DEBUG] QUY TRÌNH TÍNH PHÍ");
    console.table({
      senderProvince: currentOrderData.senderProvince,
      senderDistrict: currentOrderData.senderDistrict,
      receiverProvince: currentOrderData.receiverProvince,
      receiverDistrict: currentOrderData.receiverDistrict,
      weight: currentOrderData.weight,
      value: currentOrderData.packageValue,
    });

    const result = calculateTotalFee();

    if (!result) {
      console.warn(
        "⚠️ Không tính được phí vì thiếu dữ liệu hoặc baseFee null!"
      );
    } else {
      console.log("✅ Kết quả tính phí:", result);
    }

    console.groupEnd();
    displayPricing(result);
  }

  /**
   * Display pricing in the UI
   */
  function displayPricing(result) {
    const pricingSummaryBar = document.getElementById("pricingSummaryBar");
    if (!pricingSummaryBar) return;

    const basicSummary = pricingSummaryBar.querySelector(
      "#basicSummary .summary-value"
    );
    if (basicSummary)
      basicSummary.textContent = result
        ? formatCurrency(result.totalFee)
        : "0 đ";

    if (!result) return;

    // Cập nhật chi tiết
    const detailedSummary = pricingSummaryBar.querySelector("#detailedSummary");
    if (detailedSummary) {
      const summaryItems = detailedSummary.querySelectorAll(".summary-item");

      if (summaryItems[0])
        summaryItems[0].querySelector(".summary-value").textContent =
          formatCurrency(result.totalFee);

      if (summaryItems[3])
        summaryItems[3].querySelector(
          ".summary-value"
        ).textContent = `${result.estimateTime} ngày`;
    }

    // Log breakdown (fix lỗi specialFees undefined)
    const selectedServices = Array.isArray(currentOrderData.selectedServices)
      ? currentOrderData.selectedServices
      : [];

    const serviceCosts = selectedServices.map((code) => ({
      code,
      cost: window.ServiceData?.getServiceCost(code) || 0,
    }));

    console.log("📊 Pricing breakdown:", {
      baseFee: formatCurrency(result.baseFee),
      featuresCost: formatCurrency(result.featuresCost),
      additionalServicesCost: formatCurrency(result.additionalServicesCost),
      codFee: formatCurrency(result.codFee),
      totalFee: formatCurrency(result.totalFee),
      estimateTime: result.estimateTime + " ngày",
      scopeCode: result.scopeCode,
      selectedServices,
      serviceCosts,
    });

    // 🔔 NEW: Gửi event để module COD cập nhật tiền trả người gửi
    document.dispatchEvent(
      new CustomEvent("orderDataChanged", {
        detail: { totalFee: result.totalFee },
      })
    );
  }

  /**
   * Format currency VND
   */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  }

  /**
   * Get current pricing
   */
  function getCurrentPricing() {
    return calculateTotalFee();
  }

  /**
   * Reset calculator
   */
  function reset() {
    currentOrderData = {
      receiverProvince: null,
      receiverDistrict: null,
      senderProvince: null,
      senderDistrict: null,
      weight: 0,
      packageValue: 0,
      featuresCost: 0,
      serviceCode: "SCN",
      additionalServicesCost: 0,
      promotionDiscount: 0,
    };
    displayPricing(null);
  }

  /**
   * Initialize pricing calculator listeners
   */
  function init() {
    setupAddressListeners();
    setupWeightListeners();
    setupSpecialProductListeners();
    console.log("💰 Pricing Calculator initialized");
    document.addEventListener("codChanged", (e) => {
      console.log("💬 COD changed:", e.detail);
      // Nếu có phí thu hộ trong tương lai, thêm xử lý tại đây
      calculateAndDisplay();
    });
  }

  /**
   * Setup address change listeners
   */
  function setupAddressListeners() {
    // Người gửi là receiver (dropdown người gửi)
    document.addEventListener("receiverChanged", (e) => {
      console.log("📍 Người gửi changed:", e.detail);
      if (!e.detail || !e.detail.address) {
        console.warn("Dữ liệu người gửi thiếu thông tin address:", e.detail);
        return;
      }
      const addr = e.detail.address;
      updateOrderData({
        receiverProvince: addr.province,
        receiverDistrict: addr.district,
        receiverWard: addr.ward,
      });
    });

    // Người nhận là sender
    const senderProvinceSelect = document.getElementById("provinceSelect");
    const senderDistrictSelect = document.getElementById("districtSelect");

    if (senderProvinceSelect) {
      senderProvinceSelect.addEventListener("locationChange", (e) => {
        console.log("📍 Người nhận (sender) province changed:", e.detail);
        let value =
          typeof e.detail.text === "string" ? e.detail.text.trim() : "";
        updateOrderData({ senderProvince: value, senderDistrict: null });
      });
    }

    if (senderDistrictSelect) {
      senderDistrictSelect.addEventListener("locationChange", (e) => {
        console.log("📍 Người nhận (sender) district changed:", e.detail);
        let value =
          typeof e.detail.text === "string" ? e.detail.text.trim() : "";
        updateOrderData({ senderDistrict: value });
      });
    }
  }

  /**
   * Setup weight change listeners
   */
  function setupWeightListeners() {
    document.addEventListener("packageItemsChanged", (e) => {
      updateOrderData({
        weight: e.detail.totalWeight || 0,
        packageValue: e.detail.totalValue || 0,
        featuresCost: e.detail.featuresCost || 0,
      });
    });
  }

  /**
   * Setup special product type listeners
   */
  function setupSpecialProductListeners() {
    // featuresCost đã được tính trong packageItemsChanged event
  }

  // Public API
  return {
    init,
    updateOrderData,
    calculateTotalFee,
    getCurrentPricing,
    displayPricing,
    reset,
  };
})();
