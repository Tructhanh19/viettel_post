/**
 * SCOPE DATA MANAGEMENT
 * Handles loading and managing shipping scope and pricing data
 */

window.ScopeData = (function () {
  "use strict";

  let scopeData = null;
  let isLoading = false;

  // Public methods
  async function init() {
    await loadScopeData();
  }

  // Load scope data from JSON file
  async function loadScopeData() {
    if (scopeData || isLoading) return;

    isLoading = true;

    try {
      // Try relative path first (for files in research/ folder)
      let response = await fetch("../assets/data/scope.json");
      
      if (!response.ok) {
        // Try from root (for files loaded from index.html)
        response = await fetch("assets/data/scope.json");
      }

      if (response.ok) {
        scopeData = await response.json();
      }
    } catch (error) {
      // Silent error - data loading failed
    } finally {
      isLoading = false;
    }
  }

  // Get all scopes
  function getAllScopes() {
    if (!scopeData) return [];
    return scopeData;
  }

  // Get scope by code
  function getScopeByCode(code) {
    if (!scopeData) return null;
    return scopeData.find(scope => scope.code === code);
  }

  // Calculate shipping fee based on scope and weight
  function calculateShippingFee(scopeCode, weightInGrams) {
    const scope = getScopeByCode(scopeCode);
    if (!scope || !scope.fees) return null;

    // Find matching fee tier based on weight
    for (const fee of scope.fees) {
      if (!fee.is_active) continue;

      const withinMin = weightInGrams >= fee.weight_min;
      const withinMax = fee.weight_max === null || weightInGrams <= fee.weight_max;

      if (withinMin && withinMax) {
        // If weight_max is null, it's the last tier (charged per additional unit)
        if (fee.weight_max === null && weightInGrams > 2000) {
          // Calculate extra weight beyond 2kg
          const extraWeight = weightInGrams - 2000;
          const extra500gUnits = Math.ceil(extraWeight / 500);
          
          // Get base cost for 2kg (previous tier)
          const baseFee = scope.fees.find(f => f.weight_max === 2000);
          const baseCost = baseFee ? baseFee.cost : 0;
          
          return baseCost + (extra500gUnits * fee.cost);
        }
        
        return fee.cost;
      }
    }

    return null;
  }

  // Determine scope based on sender and receiver addresses
  function determineScope(senderProvince, senderDistrict, receiverProvince, receiverDistrict) {
    // Normalize strings
    const normalizeSender = {
      province: (senderProvince || "").toLowerCase().trim(),
      district: (senderDistrict || "").toLowerCase().trim()
    };
    
    const normalizeReceiver = {
      province: (receiverProvince || "").toLowerCase().trim(),
      district: (receiverDistrict || "").toLowerCase().trim()
    };

    // Define regions
    const regions = {
      north: ["hà nội", "hải phòng", "quảng ninh", "bắc ninh", "bắc giang", "cao bằng", "điện biên", "hà giang", "hòa bình", "lai châu", "lào cai", "lạng sơn", "phú thọ", "sơn la", "thái nguyên", "tuyên quang", "vĩnh phúc", "yên bái", "hà nam", "hưng yên", "nam định", "ninh bình", "thái bình"],
      central: ["đà nẵng", "huế", "quảng nam", "quảng ngãi", "bình định", "phú yên", "khánh hòa", "ninh thuận", "bình thuận", "gia lai", "kon tum", "đắk lắk", "đắk nông", "lâm đồng", "nghệ an", "hà tĩnh", "quảng bình", "quảng trị"],
      south: ["hồ chí minh", "tp.hồ chí minh", "sài gòn", "bình dương", "đồng nai", "bà rịa - vũng tàu", "long an", "tiền giang", "bến tre", "trà vinh", "vĩnh long", "đồng tháp", "an giang", "kiên giang", "cần thơ", "hậu giang", "sóc trăng", "bạc liêu", "cà mau", "tây ninh"]
    };

    // Detect regions
    const getSenderRegion = () => {
      for (const [region, provinces] of Object.entries(regions)) {
        if (provinces.some(p => normalizeSender.province.includes(p))) {
          return region;
        }
      }
      return null;
    };

    const getReceiverRegion = () => {
      for (const [region, provinces] of Object.entries(regions)) {
        if (provinces.some(p => normalizeReceiver.province.includes(p))) {
          return region;
        }
      }
      return null;
    };

    const senderRegion = getSenderRegion();
    const receiverRegion = getReceiverRegion();

    // Same province
    if (normalizeSender.province === normalizeReceiver.province) {
      // Check if same district (Nội cụm)
      if (normalizeSender.district === normalizeReceiver.district) {
        return "NTNC"; // Nội Tỉnh Nội Cụm
      } else {
        return "NTNGC"; // Nội Tỉnh Ngoại Cụm
      }
    }

    // Different provinces - check regions
    if (senderRegion === receiverRegion) {
      return "NM"; // Nội Miền
    }

    // Different regions
    // Check for special routes (Liên Miền Đặc Biệt)
    const specialProvinces = ["hà nội", "hồ chí minh", "tp.hồ chí minh", "đà nẵng"];
    const isSenderSpecial = specialProvinces.some(p => normalizeSender.province.includes(p));
    const isReceiverSpecial = specialProvinces.some(p => normalizeReceiver.province.includes(p));

    if (isSenderSpecial && isReceiverSpecial) {
      return "LMDB"; // Liên Miền Đặc Biệt (between major cities)
    }

    return "LM"; // Liên Miền (general inter-region)
  }

  // Get estimate time for scope
  function getEstimateTime(scopeCode) {
    const scope = getScopeByCode(scopeCode);
    return scope ? scope.estimate_time : null;
  }

  // Public API
  return {
    init,
    getAllScopes,
    getScopeByCode,
    calculateShippingFee,
    determineScope,
    getEstimateTime
  };
})();
