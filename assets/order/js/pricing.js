// /**
//  * PRICING CALCULATOR
//  * Calculate shipping fees based on order information
//  */
// window.PricingCalculator = (function () {
//   "use strict";

//   let currentOrderData = {
//     senderProvince: null,
//     senderDistrict: null,
//     receiverProvince: null,
//     receiverDistrict: null,
//     weight: 0,
//     packageValue: 0,
//     featuresCost: 0, // Phụ phí từ package features (đã tính sẵn)
//     serviceCode: "SCN",
//     additionalServicesCost: 0, // phí dịch vụ cộng thêm
//     promotionDiscount: 0, // giảm giá khuyến mãi
//   };

//   /**
//    * Update order data
//    */
//   function updateOrderData(data) {
//     currentOrderData = { ...currentOrderData, ...data };
//     // ...

//     calculateAndDisplay();

//     // Phát sự kiện để các UI khác cập nhật
//     setTimeout(() => {
//       document.dispatchEvent(
//         new CustomEvent("orderDataChanged", { detail: currentOrderData })
//       );
//     }, 0);
//   }

//   /**
//    * Calculate base shipping fee
//    */
//   function calculateShippingFee() {
//     const {
//       senderProvince,
//       senderDistrict,
//       receiverProvince,
//       receiverDistrict,
//       weight,
//     } = currentOrderData;

//     // ...

//     // Kiểm tra đủ dữ liệu
//     if (
//       !receiverProvince ||
//       !senderProvince ||
//       !receiverDistrict ||
//       !senderDistrict ||
//       !weight ||
//       weight <= 0 ||
//       !currentOrderData.packageValue
//     ) {
//       // ...
//       return null;
//     }

//     if (!window.ScopeData) {
//   // ...
//       return null;
//     }

//     const scopeCode = window.ScopeData.determineScope(
//       senderProvince,
//       senderDistrict || "",
//       receiverProvince,
//       receiverDistrict || ""
//     );
//     const baseFee = window.ScopeData.calculateShippingFee(scopeCode, weight);
//     // ====== TỰ ĐỘNG TÍNH PHÍ & CẬP NHẬT SAU MỌI THAY ĐỔI ======
// const recalculationEvents = [
//   "userChanged", 
//   "receiverChanged", 
//   "postOfficeSelected", 
//   "packageItemsChanged", 
//   "codChanged", 
//   "serviceChanged"
// ];

// recalculationEvents.forEach(eventName => {
//   document.addEventListener(eventName, async () => {
//     if (!window.PricingCalculator?.calculateTotalFee) return;

//     const pricingResult = window.PricingCalculator.calculateTotalFee();

//     if (pricingResult) {
//       // Cập nhật vào CreateOrderData
//       window.CreateOrderData.totalPrice = pricingResult.totalFee;
//       window.CreateOrderData.deliveryTime = pricingResult.estimateTime;
//       window.CreateOrderData.codCost = pricingResult.codFee || 0;

//       // Nếu có khoảng cách, cập nhật luôn
//       if (pricingResult.distance) {
//         window.CreateOrderData.distance = pricingResult.distance;
//       } else if (window.ScopeData?.calculateDistance) {
//         const d = window.ScopeData.calculateDistance(
//           window.CreateOrderData.sender?.address?.province,
//           window.CreateOrderData.sender?.address?.district,
//           window.CreateOrderData.receiver?.address?.province,
//           window.CreateOrderData.receiver?.address?.district
//         );
//         if (d) window.CreateOrderData.distance = d;
//       }

//       logOrderDataSummary && logOrderDataSummary();
//     }
//   });
// });

//     if (baseFee === null) return null;

//     return { baseFee, scopeCode };
//   }

//   /**
//    * Get special product fees (already calculated by Package module)
//    */
//   function getSpecialProductFees() {
//     return currentOrderData.featuresCost || 0;
//   }

//   /**
//    * Calculate total fee
//    */
//   function calculateTotalFee() {
//     // Log đầu vào để kiểm tra hàm có được gọi không
//     console.log('[PRICING DEBUG] calculateTotalFee called', JSON.parse(JSON.stringify(currentOrderData)));
//     const shippingResult = calculateShippingFee();
//     if (!shippingResult) {
//       console.warn('[PRICING DEBUG] shippingResult is null, not enough data to calculate fee', JSON.parse(JSON.stringify(currentOrderData)));
//       return null;
//     }
//     if (!shippingResult) return null;

//     const promotionDiscount = currentOrderData.promotionDiscount || 0;
//     const codFee = currentOrderData.codFee || 0;
//     const featuresCost = currentOrderData.featuresCost || 0;

//     // ✅ Tính phí dịch vụ cộng thêm
//     let additionalServicesCost = currentOrderData.additionalServicesCost || 0;
//     if (
//       Array.isArray(currentOrderData.selectedServices) &&
//       additionalServicesCost === 0
//     ) {
//       additionalServicesCost = currentOrderData.selectedServices.reduce(
//         (sum, code) => {
//           return sum + (window.ServiceData?.getServiceCost(code) || 0);
//         },
//         0
//       );
//     }

//     // Tổng phí
//     var totalPrice =
//       shippingResult.baseFee +
//       featuresCost +
//       codFee +
//       additionalServicesCost -
//       promotionDiscount;

//     // Tính deliveryTime (ISODate)
//     var deliveryTime = null;
//     try {
//       var senderPickup = window.CreateOrderData && window.CreateOrderData.sender ? window.CreateOrderData.sender.pickupTime : null;
//       var pickupDate = senderPickup ? new Date(senderPickup) : new Date();
//       var estimateDays = 1;
//       if (window.ScopeData && typeof window.ScopeData.getEstimateTime === "function") {
//         estimateDays = window.ScopeData.getEstimateTime(shippingResult.scopeCode) || 1;
//       }
//       // Nếu có shippingService thì lấy estimate_time_hours
//       var shippingServiceObj = window.CreateOrderData && window.CreateOrderData.shippingService ? window.CreateOrderData.shippingService : null;
//       var estimateHours = null;
//       if (shippingServiceObj && shippingServiceObj.estimate_time_hours) {
//         estimateHours = shippingServiceObj.estimate_time_hours;
//       }
//       if (estimateHours) {
//         pickupDate.setHours(pickupDate.getHours() + estimateHours);
//       } else {
//         pickupDate.setDate(pickupDate.getDate() + estimateDays);
//       }
//       deliveryTime = pickupDate.toISOString();
//     } catch (err) {
//       deliveryTime = null;
//     }

//     // Tính distance (giả lập, dùng địa chỉ người gửi/nhận)
//     var distance = null;
//     try {
//       var senderAddr = window.CreateOrderData && window.CreateOrderData.sender ? window.CreateOrderData.sender.address : null;
//       var receiverAddr = window.CreateOrderData && window.CreateOrderData.receiver ? window.CreateOrderData.receiver.address : null;
//       if (senderAddr && receiverAddr) {
//         if (senderAddr.province && receiverAddr.province) {
//           if (senderAddr.province === receiverAddr.province) {
//             distance = 5.0;
//           } else {
//             distance = 1650.0;
//           }
//         }
//       }
//     } catch (err) {
//       distance = null;
//     }

//     // Chỉ dùng dịch vụ Chuyển phát nhanh
//     var shippingService = null;
//     if (window.CreateOrderData && window.CreateOrderData.shippingService) {
//       shippingService = window.CreateOrderData.shippingService;
//     } else {
//       if (window.ServiceData && window.ServiceData.getShippingServiceByCode) {
//         shippingService = window.ServiceData.getShippingServiceByCode('EXPRESS_SOUTH') || null;
//       }
//     }

//     // estimateTime (ngày) vẫn giữ cho UI
//     var estimateTime = window.ScopeData && typeof window.ScopeData.getEstimateTime === "function"
//       ? window.ScopeData.getEstimateTime(shippingResult.scopeCode)
//       : 1;

//     // Log các giá trị cần kiểm tra
//     console.log('[PRICING DEBUG]', {
//       baseFee: shippingResult.baseFee,
//       additionalServicesCost: additionalServicesCost,
//       codFee: codFee,
//       featuresCost: featuresCost,
//       promotionDiscount: promotionDiscount,
//       totalFee: totalPrice,
//       totalPrice: totalPrice
//     });
//     return {
//       baseFee: shippingResult.baseFee,
//       additionalServicesCost: additionalServicesCost,
//       codFee: codFee,
//       featuresCost: featuresCost,
//       promotionDiscount: promotionDiscount,
//       totalFee: totalPrice,
//       totalPrice: totalPrice,
//       deliveryTime: deliveryTime,
//       distance: distance,
//       estimateTime: estimateTime,
//       scopeCode: shippingResult.scopeCode,
//       shippingService: shippingService
//     };
//   }

//   /**
//    * Calculate and display pricing
//    */
//   function calculateAndDisplay() {
//     const result = calculateTotalFee();
//     displayPricing(result);
//     // ✅ Cập nhật CreateOrderData mỗi lần tính phí
//   if (result && window.CreateOrderData) {
//     window.CreateOrderData.totalPrice = result.totalFee || 0;
//     window.CreateOrderData.deliveryTime = result.estimateTime || null;
//     window.CreateOrderData.distance = result.distance || null;

//     console.log("[DEBUG][ORDER DATA SUMMARY]", {
//       totalPrice: window.CreateOrderData.totalPrice,
//       deliveryTime: window.CreateOrderData.deliveryTime,
//       distance: window.CreateOrderData.distance,
//       codCost: window.CreateOrderData.codInfo?.codCost || 0
//     });
//   }

//   // 🔔 Gửi event để UI update
//   document.dispatchEvent(new CustomEvent("orderPricingCalculated", {
//     detail: result
//   }));
//   }

//   /**
//    * Display pricing in the UI
//    */
//   function displayPricing(result) {
//     const pricingSummaryBar = document.getElementById("pricingSummaryBar");
//     if (!pricingSummaryBar) return;

//     const basicSummary = pricingSummaryBar.querySelector(
//       "#basicSummary .summary-value"
//     );
//     if (basicSummary)
//       basicSummary.textContent = result
//         ? formatCurrency(result.totalFee)
//         : "0 đ";

//     if (!result) return;

//     // Cập nhật chi tiết
//     const detailedSummary = pricingSummaryBar.querySelector("#detailedSummary");
//     if (detailedSummary) {
//       const summaryItems = detailedSummary.querySelectorAll(".summary-item");

//       if (summaryItems[0])
//         summaryItems[0].querySelector(".summary-value").textContent =
//           formatCurrency(result.totalFee);

//       if (summaryItems[3])
//         summaryItems[3].querySelector(
//           ".summary-value"
//         ).textContent = `${result.estimateTime} ngày`;
//     }

//     // Log breakdown (fix lỗi specialFees undefined)
//     const selectedServices = Array.isArray(currentOrderData.selectedServices)
//       ? currentOrderData.selectedServices
//       : [];

//     const serviceCosts = selectedServices.map((code) => ({
//       code,
//       cost: window.ServiceData?.getServiceCost(code) || 0,
//     }));

//     // ...

//     // 🔔 Gửi event mới với toàn bộ kết quả tính phí
//     document.dispatchEvent(
//       new CustomEvent("orderPricingCalculated", {
//         detail: result
//       })
//     );
//   }

//   /**
//    * Format currency VND
//    */
//   function formatCurrency(amount) {
//     return new Intl.NumberFormat("vi-VN", {
//       style: "currency",
//       currency: "VND",
//     }).format(amount || 0);
//   }

//   /**
//    * Get current pricing
//    */
//   function getCurrentPricing() {
//     return calculateTotalFee();
//   }

//   /**
//    * Reset calculator
//    */
//   function reset() {
//     currentOrderData = {
//       receiverProvince: null,
//       receiverDistrict: null,
//       senderProvince: null,
//       senderDistrict: null,
//       weight: 0,
//       packageValue: 0,
//       featuresCost: 0,
//       serviceCode: "SCN",
//       additionalServicesCost: 0,
//       promotionDiscount: 0,
//     };
//     displayPricing(null);
//   }

//   /**
//    * Initialize pricing calculator listeners
//    */
//   function init() {
//     setupAddressListeners();
//     setupWeightListeners();
//     setupSpecialProductListeners();
//   // ...
//     document.addEventListener("codChanged", (e) => {
//       // Nếu có phí thu hộ trong tương lai, thêm xử lý tại đây
//       calculateAndDisplay();
//     });
//   }

//   /**
//    * Setup address change listeners
//    */
//   function setupAddressListeners() {
//     // Người gửi là receiver (dropdown người gửi)
//     document.addEventListener("receiverChanged", (e) => {
//       if (!e.detail || !e.detail.address) {
//         return;
//       }
//       const addr = e.detail.address;
//       updateOrderData({
//         receiverProvince: addr.province,
//         receiverDistrict: addr.district,
//         receiverWard: addr.ward,
//       });
//     });

//     // Người nhận là sender
//     const senderProvinceSelect = document.getElementById("provinceSelect");
//     const senderDistrictSelect = document.getElementById("districtSelect");

//     if (senderProvinceSelect) {
//       senderProvinceSelect.addEventListener("locationChange", (e) => {
//   // ...
//         let value =
//           typeof e.detail.text === "string" ? e.detail.text.trim() : "";
//         updateOrderData({ senderProvince: value, senderDistrict: null });
//       });
//     }

//     if (senderDistrictSelect) {
//       senderDistrictSelect.addEventListener("locationChange", (e) => {
//   // ...
//         let value =
//           typeof e.detail.text === "string" ? e.detail.text.trim() : "";
//         updateOrderData({ senderDistrict: value });
//       });
//     }
//   }

//   /**
//    * Setup weight change listeners
//    */
//   function setupWeightListeners() {
//     document.addEventListener("packageItemsChanged", (e) => {
//       updateOrderData({
//         weight: e.detail.totalWeight || 0,
//         packageValue: e.detail.totalValue || 0,
//         featuresCost: e.detail.featuresCost || 0,
//       });
//     });
//   }

//   /**
//    * Setup special product type listeners
//    */
//   function setupSpecialProductListeners() {
//     // featuresCost đã được tính trong packageItemsChanged event
//   }

//   // Public API
//   return {
//     init,
//     updateOrderData,
//     calculateTotalFee,
//     getCurrentPricing,
//     displayPricing,
//     reset,
//   };
// })();
// document.dispatchEvent(new CustomEvent("orderPricingCalculated", {
//   detail: result
// }));
