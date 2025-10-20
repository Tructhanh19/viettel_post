/**
 * ADDRESS DATA MANAGEMENT
 * Handles loading and managing address data from JSON files
 */

window.AddressData = (function () {
  "use strict";

  // Cache for loaded data
  let addressData63 = null; // Old address system
  let addressData34 = null; // New address system
  let isLoading = false;

  // Public methods
  async function init() {
    await loadAddressData();
  }

  // Load both address data files
  async function loadAddressData() {
    if (isLoading) return;

    isLoading = true;

    try {
      // Try relative path first, then fallback to root path
      let data63Response = await fetch("../assets/data/address_63.json").catch(() => null);
      if (!data63Response || !data63Response.ok) {
        data63Response = await fetch("assets/data/address_63.json");
      }

      let data34Response = await fetch("../assets/data/address_34.json").catch(() => null);
      if (!data34Response || !data34Response.ok) {
        data34Response = await fetch("assets/data/address_34.json");
      }

      if (data63Response.ok) {
        addressData63 = await data63Response.json();
      }

      if (data34Response.ok) {
        addressData34 = await data34Response.json();
      }
    } catch (error) {
      // Silent error - data loading failed
    } finally {
      isLoading = false;
    }
  }

  // Get provinces for old address system (63 provinces)
  function getProvinces63() {
    if (!addressData63) {
      return [];
    }
    const provinces = addressData63.map((province) => ({
      code: province.code,
      name: province.name,
      codename: province.codename,
      phone_code: province.phone_code,
      region: province.region,
    }));
    return provinces;
  }

  // Get provinces for new address system (34 provinces)
  function getProvinces34() {
    if (!addressData34) return [];

    return addressData34.map((province) => ({
      code: province.code,
      name: province.name,
      codename: province.codename,
      phone_code: province.phone_code,
      region: province.region,
    }));
  }

  // Get districts by province code (old system)
  function getDistricts63(provinceCode) {
    if (!addressData63) return [];

    // Convert to string for comparison
    const codeStr = String(provinceCode);
    const province = addressData63.find((p) => String(p.code) === codeStr);
    
    if (!province || !province.districts) return [];

    return province.districts.map((district) => ({
      code: district.code,
      name: district.name,
      codename: district.codename,
      division_type: district.division_type,
      short_codename: district.short_codename,
    }));
  }

  // Get districts by province code (new system)
  function getDistricts34(provinceCode) {
    if (!addressData34) return [];

    // Convert to string for comparison
    const codeStr = String(provinceCode);
    const province = addressData34.find((p) => String(p.code) === codeStr);
    if (!province || !province.districts) return [];

    return province.districts.map((district) => ({
      code: district.code,
      name: district.name,
      codename: district.codename,
      division_type: district.division_type,
      short_codename: district.short_codename,
    }));
  }

  // Get wards by province and district code (old system)
  function getWards63(provinceCode, districtCode) {
    if (!addressData63) return [];

    // So sánh bằng chuỗi để tránh lỗi kiểu dữ liệu
    const province = addressData63.find((p) => String(p.code) === String(provinceCode));
    if (!province || !province.districts) return [];

    const district = province.districts.find((d) => String(d.code) === String(districtCode));
    if (!district || !district.wards) return [];

    return district.wards.map((ward) => ({
      code: ward.code,
      name: ward.name,
      codename: ward.codename,
      division_type: ward.division_type,
      short_codename: ward.short_codename,
    }));
  }

  // Get wards by province and district code (new system)
  function getWards34(provinceCode, districtCode) {
    if (!addressData34) return [];

    const province = addressData34.find((p) => p.code === provinceCode);
    if (!province || !province.districts) return [];

    const district = province.districts.find((d) => d.code === districtCode);
    if (!district || !district.wards) return [];

    return district.wards.map((ward) => ({
      code: ward.code,
      name: ward.name,
      codename: ward.codename,
      division_type: ward.division_type,
      short_codename: ward.short_codename,
    }));
  }

  // Helper function to populate select options
  function populateSelectOptions(
    selectElement,
    options,
    placeholder = "Chọn..."
  ) {
    if (!selectElement) return;

    const optionsContainer = selectElement.querySelector(".options-container");
    if (!optionsContainer) return;

    if (options.length > 0) {
      optionsContainer.innerHTML = options
        .map(
          (option) =>
            `<div class="dropdown-option" data-value="${
              option.code
            }" data-codename="${option.codename || ""}">
            ${option.name}
          </div>`
        )
        .join("");
    } else {
      optionsContainer.innerHTML = `<div class="no-results">Không có dữ liệu</div>`;
    }

    // Reset display
    const display = selectElement.querySelector(".select-display");
    const span = display?.querySelector("span");
    if (span) {
      span.textContent = placeholder;
      display.classList.remove("has-value");
    }
  }

  // Helper function to reset select
  function resetSelect(selectElement, placeholder = "Chọn...") {
    if (!selectElement) return;

    const display = selectElement.querySelector(".select-display");
    const span = display?.querySelector("span");
    const optionsContainer = selectElement.querySelector(".options-container");

    if (span) {
      span.textContent = placeholder;
      display.classList.remove("has-value");
    }

    if (optionsContainer) {
      optionsContainer.innerHTML = `<div class="no-results">Vui lòng chọn cấp trên trước</div>`;
    }
  }

  // Setup cascading for old address system (normal mode)
  function setupNormalAddressCascading() {
    const provinceSelect = document.getElementById("provinceSelect");
    const districtSelect = document.getElementById("districtSelect");
    const wardSelect = document.getElementById("wardSelect");

    if (!provinceSelect || !districtSelect || !wardSelect) return;

    // Populate provinces
    const provinces = getProvinces63();
    populateSelectOptions(provinceSelect, provinces, "Tỉnh/Thành phố");

    // Khôi phục lựa chọn từ localStorage nếu có
    const savedProvince = localStorage.getItem('receiver_province');
    const savedDistrict = localStorage.getItem('receiver_district');
    const savedWard = localStorage.getItem('receiver_ward');
    if (savedProvince) {
      const provinceOption = provinceSelect.querySelector(`.dropdown-option[data-value='${savedProvince}']`);
      if (provinceOption) {
        provinceOption.classList.add('selected');
        provinceSelect.querySelector('.select-display span').textContent = provinceOption.textContent;
        provinceSelect.querySelector('.select-display').classList.add('has-value');
        // Load districts
        const districts = getDistricts63(parseInt(savedProvince));
        populateSelectOptions(districtSelect, districts, "Quận/Huyện");
        if (savedDistrict) {
          const districtOption = districtSelect.querySelector(`.dropdown-option[data-value='${savedDistrict}']`);
          if (districtOption) {
            districtOption.classList.add('selected');
            districtSelect.querySelector('.select-display span').textContent = districtOption.textContent;
            districtSelect.querySelector('.select-display').classList.add('has-value');
            // Load wards
            const wards = getWards63(parseInt(savedProvince), parseInt(savedDistrict));
            populateSelectOptions(wardSelect, wards, "Xã/Phường");
            if (savedWard) {
              const wardOption = wardSelect.querySelector(`.dropdown-option[data-value='${savedWard}']`);
              if (wardOption) {
                wardOption.classList.add('selected');
                wardSelect.querySelector('.select-display span').textContent = wardOption.textContent;
                wardSelect.querySelector('.select-display').classList.add('has-value');
              }
            }
          }
        }
      }
    }

    // Province change handler
    provinceSelect.addEventListener("change", function (e) {
      if (e.detail && e.detail.value) {
        const provinceCode = parseInt(e.detail.value);
        localStorage.setItem('receiver_province', provinceCode);
        localStorage.removeItem('receiver_district');
        localStorage.removeItem('receiver_ward');
        const districts = getDistricts63(provinceCode);
        populateSelectOptions(districtSelect, districts, "Quận/Huyện");
        resetSelect(wardSelect, "Xã/Phường");
        // Cập nhật trạng thái selected cho option mới
        provinceSelect.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
        const selectedOpt = provinceSelect.querySelector(`.dropdown-option[data-value='${provinceCode}']`);
        if (selectedOpt) {
          selectedOpt.classList.add('selected');
          provinceSelect.querySelector('.select-display span').textContent = selectedOpt.textContent;
          provinceSelect.querySelector('.select-display').classList.add('has-value');
        }
        // Trigger custom event
        provinceSelect.dispatchEvent(
          new CustomEvent("locationChange", {
            detail: { value: e.detail.value, text: e.detail.text },
          })
        );
      }
    });

    // District change handler
    districtSelect.addEventListener("change", function (e) {
      if (e.detail && e.detail.value) {
        // Get province code from currently selected province
        const selectedProvince = provinceSelect.querySelector(
          ".dropdown-option.selected"
        );
        if (selectedProvince) {
          const provinceCode = parseInt(
            selectedProvince.getAttribute("data-value")
          );
          const districtCode = parseInt(e.detail.value);
          localStorage.setItem('receiver_district', districtCode);
          localStorage.removeItem('receiver_ward');
          const wards = getWards63(provinceCode, districtCode);
          populateSelectOptions(wardSelect, wards, "Xã/Phường");
          // Cập nhật trạng thái selected cho option mới
          districtSelect.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
          const selectedOpt = districtSelect.querySelector(`.dropdown-option[data-value='${districtCode}']`);
          if (selectedOpt) {
            selectedOpt.classList.add('selected');
            districtSelect.querySelector('.select-display span').textContent = selectedOpt.textContent;
            districtSelect.querySelector('.select-display').classList.add('has-value');
          }
          // Trigger custom event
          districtSelect.dispatchEvent(
            new CustomEvent("locationChange", {
              detail: { value: e.detail.value, text: e.detail.text },
            })
          );
        }
      }
    });
    // Ward change handler
    wardSelect.addEventListener("change", function (e) {
      if (e.detail && e.detail.value) {
        localStorage.setItem('receiver_ward', e.detail.value);
        // Cập nhật trạng thái selected cho option mới
        wardSelect.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
        const selectedOpt = wardSelect.querySelector(`.dropdown-option[data-value='${e.detail.value}']`);
        if (selectedOpt) {
          selectedOpt.classList.add('selected');
          wardSelect.querySelector('.select-display span').textContent = selectedOpt.textContent;
          wardSelect.querySelector('.select-display').classList.add('has-value');
        }
      }
    });
  }

  // Setup cascading for new address system
  function setupNewAddressCascading() {
    const newProvinceSelect = document.getElementById("newProvinceSelect");
    const newWardSelect = document.getElementById("newWardSelect");

    if (!newProvinceSelect || !newWardSelect) return;

    // Populate provinces
    const provinces = getProvinces34();
    populateSelectOptions(newProvinceSelect, provinces, "Tỉnh/Thành phố");

    // Province change handler - directly load wards for new system
    newProvinceSelect.addEventListener("change", function (e) {
      if (e.detail && e.detail.value) {
        const provinceCode = parseInt(e.detail.value);

        // For new system, wards are directly in province (no districts level)
        const province = addressData34.find((p) => p.code === provinceCode);
        if (province && province.wards && province.wards.length > 0) {
          const wards = province.wards.map((ward) => ({
            code: ward.code,
            name: ward.name,
            codename: ward.codename,
            division_type: ward.division_type,
            short_codename: ward.short_codename,
          }));
          populateSelectOptions(newWardSelect, wards, "Phường/Xã");
        } else {
          resetSelect(newWardSelect, "Phường/Xã");
        }

        // Trigger custom event
        newProvinceSelect.dispatchEvent(
          new CustomEvent("locationChange", {
            detail: { value: e.detail.value, text: e.detail.text },
          })
        );
      }
    });
  }

  // Setup both cascading systems
  function setupAddressCascading() {
    const useNewAddressCheckbox = document.getElementById("useNewAddressToggle");
    const isNewAddressMode = useNewAddressCheckbox ? useNewAddressCheckbox.checked : false;

    // Always setup both systems
    setupNormalAddressCascading();
    setupNewAddressCascading();

    // Toggle visibility based on checkbox
    const normalMode = document.getElementById("normalAddressMode");
    const newMode = document.getElementById("newAddressMode");

    if (isNewAddressMode) {
      if (normalMode) normalMode.style.display = "none";
      if (newMode) newMode.style.display = "block";
    } else {
      if (normalMode) normalMode.style.display = "block";
      if (newMode) newMode.style.display = "none";
    }

    // Add toggle event handler
    if (useNewAddressCheckbox) {
      useNewAddressCheckbox.addEventListener("change", function() {
        const normalMode = document.getElementById("normalAddressMode");
        const newMode = document.getElementById("newAddressMode");

        if (this.checked) {
          if (normalMode) normalMode.style.display = "none";
          if (newMode) newMode.style.display = "block";
          
          // Re-populate provinces for new mode
          const newProvinceSelect = document.getElementById("newProvinceSelect");
          if (newProvinceSelect) {
            const provinces = getProvinces34();
            populateSelectOptions(newProvinceSelect, provinces, "Tỉnh/Thành phố");
          }
        } else {
          if (normalMode) normalMode.style.display = "block";
          if (newMode) newMode.style.display = "none";
          
          // Re-populate provinces for normal mode
          const provinceSelect = document.getElementById("provinceSelect");
          if (provinceSelect) {
            const provinces = getProvinces63();
            populateSelectOptions(provinceSelect, provinces, "Tỉnh/Thành phố");
          }
        }
      });
    }
  }

  // Get province by code (unified method)
  function getProvinceByCode(code, useNewSystem = false) {
    const data = useNewSystem ? addressData34 : addressData63;
    if (!data) return null;

    return data.find((p) => p.code === code);
  }

  // Get district by codes (unified method)
  function getDistrictByCode(provinceCode, districtCode, useNewSystem = false) {
    const province = getProvinceByCode(provinceCode, useNewSystem);
    if (!province || !province.districts) return null;

    return province.districts.find((d) => d.code === districtCode);
  }

  // Get ward by codes (unified method)
  function getWardByCode(
    provinceCode,
    districtCode,
    wardCode,
    useNewSystem = false
  ) {
    const district = getDistrictByCode(
      provinceCode,
      districtCode,
      useNewSystem
    );
    if (!district || !district.wards) return null;

    return district.wards.find((w) => w.code === wardCode);
  }

  // Public API
  return {
    init,
    setupAddressCascading,
    getProvinces63,
    getDistricts63,
    getWards63,
    getProvinces34,
    getDistricts34,
    getWards34,
  };
})();
