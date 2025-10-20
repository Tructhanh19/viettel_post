window.CreateOrderData = window.CreateOrderData || {
  sender: {},
  receiver: {},
  status: { code: "DRAFT", name: "Đơn nháp", color: "#67C0EB" },
  packageType: {},
  packages: [],
  otherServices: [],
  shippingService: {},
  deliveryTime: null,
  distance: null,
  codCost: 0,
  totalPrice: 0,
};

/* ================== KHỞI TẠO ================== */
document.addEventListener("DOMContentLoaded", initCreateOrder);
if (document.readyState !== "loading") initCreateOrder();

function initCreateOrder() {
  const content = document.querySelector(".create-order-content");
  if (!content) return setTimeout(initCreateOrder, 300);
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

  for (const { id, file } of components) {
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const html = await res.text();
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    } catch (err) {
      console.warn(`[WARN] Load ${file} failed:`, err.message);
    }
  }

  setTimeout(() => initializeBasicFunctionality(), 100);
}

/* ================== KHỞI TẠO MODULE ================== */
async function initializeBasicFunctionality() {
  // Data sources
  await window.AddressData?.init?.();
  await window.BranchData?.init?.();
  await window.PackageData?.init?.();
  await window.ServiceData?.init?.();
  await window.ScopeData?.init?.();

  // Core logic
  window.PricingCalculator?.init?.();
  await window.Package?.init?.();

  // UI modules
  window.Sender?.init?.();
  window.Receiver?.init?.();
  await window.Service?.init?.();
  window.Pickup?.init?.();
  window.Tags?.init?.();
  window.Validation?.init?.();

  // COD
  window.CODModule?.init?.();

  // User profile
  window.User?.init?.();
}

/* ================== USER (SENDER) ================== */
document.addEventListener("userChanged", function (e) {
  const d = e.detail;
  window.CreateOrderData.sender = {
    userId: d._id?.$oid || d._id || d.id || d.userId || "",
    name: d.name,
    phoneNumber: d.phone_number,
    address: d.address,
    pickupTime: null,
    branchId: null,
  };
  aggregateOrderData();
});

document.addEventListener("postOfficeSelected", function (e) {
  if (window.CreateOrderData.sender)
    window.CreateOrderData.sender.branchId = e.detail.id;
  aggregateOrderData();
});

document
  .getElementById("pickupToggle")
  ?.addEventListener("change", function (e) {
    if (!window.CreateOrderData.sender) return;
    if (!e.target.checked) window.CreateOrderData.sender.branchId = null;
    aggregateOrderData();
  });

/* ================== RECEIVER ================== */
document.addEventListener("receiverChanged", function (e) {
  const detail = e.detail;

  // Làm sạch chuỗi địa chỉ
  const clean = (v) =>
    (v || "").replace(/\n|\t/g, "").replace(/\s+/g, " ").trim();

  // Chuẩn hóa address
  let address = null;
  if (detail.address) {
    address = {
      province: clean(detail.address.province),
      district: clean(detail.address.district),
      ward: clean(detail.address.ward),
      other: clean(detail.address.other),
    };
  } else if (
    detail.province ||
    detail.district ||
    detail.ward ||
    detail.other
  ) {
    address = {
      province: clean(detail.province),
      district: clean(detail.district),
      ward: clean(detail.ward),
      other: clean(detail.other),
    };
  }

  // Chuẩn hóa branchId
  let branchId = "";
  if (detail.branchId?.$oid) branchId = detail.branchId.$oid;
  else if (detail.branchId) branchId = detail.branchId;

  window.CreateOrderData.receiver = {
    name: detail.name || "",
    phone: detail.phone || "",
    address,
    branchId: branchId || null,
    tags: detail.tags || [],
    pickTime: detail.pickTime || null,
  };

  console.log(
    "[DEBUG][CreateOrderData] receiver updated (event):",
    window.CreateOrderData.receiver
  );
  logOrderDataSummary();
});

/* ================== PRICING ================== */
document.addEventListener("orderPricingCalculated", function (e) {
  const pricing = e.detail;
  if (!pricing) return;

  window.CreateOrderData.totalPrice = pricing.totalFee;
  window.CreateOrderData.deliveryTime = pricing.estimateTime;
  window.CreateOrderData.codCost = pricing.codFee || 0;

  // Nếu ScopeData có distance (nếu có), cập nhật
  if (pricing.scopeCode && window.ScopeData?.getScopeByCode) {
    const scope = window.ScopeData.getScopeByCode(pricing.scopeCode);
    window.CreateOrderData.distance = scope?.distance || null;
  }

  aggregateOrderData();
});

/* ================== TỰ ĐỘNG TỔNG HỢP SAU MỖI THAY ĐỔI ================== */
[
  "userChanged",
  "receiverChanged",
  "postOfficeSelected",
  "packageItemsChanged",
  "codChanged",
  "serviceChanged",
].forEach((eventName) => {
  document.addEventListener(eventName, () => {
    if (window.PricingCalculator?.calculateTotalFee) {
      const pricing = window.PricingCalculator.calculateTotalFee();
      if (pricing) {
        window.CreateOrderData.totalPrice = pricing.totalFee;
        window.CreateOrderData.deliveryTime = pricing.estimateTime;
        window.CreateOrderData.codCost = pricing.codFee || 0;
      }
    }
    aggregateOrderData();
  });
});

/* ================== TỔNG HỢP DỮ LIỆU ================== */
function aggregateOrderData() {
  window.CreateOrderData.sender = window.Sender?.getCurrentSender?.() || {};
  window.CreateOrderData.receiver =
    window.Receiver?.getCurrentReceiver?.() || {};

  const pkg = window.Package?.getCurrentPackage?.();
  const svc = window.Service?.getSelectedService?.();
  const cod = window.CODModule?.getCurrentCOD?.();

  if (pkg) {
    window.CreateOrderData.packages = pkg.items || [];
    window.CreateOrderData.packageType = pkg.type || {};
  }

  if (svc) {
    window.CreateOrderData.shippingService = svc.shipping || {};
    window.CreateOrderData.otherServices = svc.additional || [];
  }

  if (cod) {
    window.CreateOrderData.codCost = cod.codCost || 0;
  }

  logOrderDataSummary();
}

/* ================== DEBUG LOG ================== */
function logOrderDataSummary() {
  const data = window.CreateOrderData;
  // ====== TÍNH deliveryTime, distance, totalPrice ======
  // 1. Tính baseFee
  let baseFee = 0,
    scopeCode = null;
  const sender = data.sender || {};
  const receiver = data.receiver || {};
  // Lấy tổng trọng lượng từ tất cả package-item
  let totalWeight = 0;
  if (Array.isArray(data.packages)) {
    totalWeight = data.packages.reduce((sum, pkg) => sum + (pkg.weight || 0) * (pkg.quantity || 1), 0);
  } else if (typeof data.weight === 'number') {
    totalWeight = data.weight;
  }
  if (
    window.ScopeData &&
    window.ScopeData.determineScope &&
    window.ScopeData.calculateShippingFee
  ) {
    scopeCode = window.ScopeData.determineScope(
      sender.address?.province,
      sender.address?.district,
      receiver.address?.province,
      receiver.address?.district
    );
    baseFee = window.ScopeData.calculateShippingFee(scopeCode, totalWeight) || 0;
  }
  // 2. Tính featuresCost, promotionDiscount, codFee, additionalServicesCost
  const featuresCost = data.featuresCost || 0;
  const promotionDiscount = data.promotionDiscount || 0;
  const codFee = data.codCost || 0;
  let additionalServicesCost = 0;
  if (Array.isArray(data.otherServices) && window.ServiceData?.getServiceCost) {
    additionalServicesCost = data.otherServices.reduce(
      (sum, s) => sum + (window.ServiceData.getServiceCost(s.code) || 0),
      0
    );
  }
  // 3. Tổng phí
  let totalPrice = 0;
  // Luôn cộng packageType.totalPrice vào tổng phí
  const packageTypeFee = data.packageType?.totalPrice || 0;
  totalPrice = baseFee + packageTypeFee + featuresCost + additionalServicesCost - promotionDiscount;
  // Lưu lại tổng trọng lượng vào CreateOrderData
  data.totalWeight = totalWeight;
  // 4. Tính deliveryTime (ISODate)
  let deliveryTime = null;
  try {
    let pickupTime = sender.pickupTime
      ? new Date(sender.pickupTime)
      : new Date();
    let estimateDays = 1;
    if (window.ScopeData?.getEstimateTime && scopeCode) {
      estimateDays = window.ScopeData.getEstimateTime(scopeCode) || 1;
    }
    let estimateHours = null;
    if (data.shippingService?.estimate_time_hours) {
      estimateHours = data.shippingService.estimate_time_hours;
    }
    if (estimateHours) {
      pickupTime.setHours(pickupTime.getHours() + estimateHours);
    } else {
      pickupTime.setDate(pickupTime.getDate() + estimateDays);
    }
    deliveryTime = pickupTime.toISOString();
  } catch (err) {
    deliveryTime = null;
  }
  // 5. Tính distance (giả lập)
  let distance = null;
  if (sender.address?.province && receiver.address?.province) {
    distance =
      sender.address.province === receiver.address.province ? 5.0 : 1650.0;
  }
  data.totalPrice = totalPrice;
  data.deliveryTime = deliveryTime;
  data.distance = distance;

  // 7. Gọi cập nhật UI
  updatePricingSummary();
  // 6. Log tổng hợp
  console.groupCollapsed("%c[DEBUG][ORDER DATA SUMMARY]", "color:#67C0EB");
  console.log({
    receiver: data.receiver,
    sender: data.sender,
    status: data.status,
    packageType: data.packageType,
    packages: data.packages,
    otherServices: data.otherServices,
    shippingService: data.shippingService,
    codCost: codFee,
    deliveryTime,
    distance,
    totalPrice,
  });
  console.groupEnd();
}
/* ================== HIỂN THỊ THANH TỔNG KẾT PHÍ ================== */
document.addEventListener("orderDataChanged", updatePricingSummary);
document.addEventListener("orderPricingCalculated", updatePricingSummary);
document.addEventListener("codChanged", updatePricingSummary);
document.addEventListener("packageItemsChanged", updatePricingSummary);
document.addEventListener("receiverChanged", updatePricingSummary);
document.addEventListener("userChanged", updatePricingSummary);

function updatePricingSummary() {
  const data = window.CreateOrderData || {};
  const cod = data.codCost || 0;
  const totalPrice = data.totalPrice || 0;
  const payer = data.codInfo?.payer || "sender"; // người trả: sender | receiver
  const deliveryTime = data.deliveryTime || null;

  const totalFeeEl = document.querySelector(
    "#detailedSummary .summary-item:nth-child(1) .summary-value"
  );
  const codEl = document.querySelector(
    "#detailedSummary .summary-item:nth-child(2) .summary-value"
  );
  const senderPayEl = document.querySelector(
    "#detailedSummary .summary-item:nth-child(3) .summary-value"
  );
  const deliveryTimeEl = document.querySelector(
    "#detailedSummary .summary-item:nth-child(4) .summary-value"
  );

  const formatCurrency = (v) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(v || 0);

  // 🧮 Tổng cước
  if (totalFeeEl) totalFeeEl.textContent = formatCurrency(totalPrice);

  // 💵 Tiền thu hộ
  if (codEl) codEl.textContent = formatCurrency(cod);

  // 💰 Tiền trả người gửi
  let senderPay = 0;
  if (cod === 0) {
    senderPay = totalPrice;
  } else {
    if (payer === "sender") {
      senderPay = cod - totalPrice;
    } else {
      senderPay = cod;
    }
  }
  if (senderPayEl) senderPayEl.textContent = formatCurrency(senderPay);

  // ⏰ Thời gian dự kiến
  if (deliveryTimeEl) {
    let days = 1;
    try {
      const now = new Date();
      const est = new Date(deliveryTime);
      const diff = Math.ceil((est - now) / (1000 * 60 * 60 * 24));
      if (diff > 0) days = diff;
    } catch (err) {}
    deliveryTimeEl.textContent = `${days} ngày`;
  }
}
