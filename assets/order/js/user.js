window.User = (function () {
  "use strict";

  // ===== PRIVATE STATE =====
  let currentUsers = [];
  let isPostOfficeSetup = false;

  // ===== PUBLIC INIT =====
  async function init() {
    await loadUserList();
    initializeUserComponents();
    initPostOfficeSelector();
    initPickupToggle();
  }

  // ===== LOAD USER LIST =====
  async function loadUserList() {
    console.debug("[LoadUser] Starting loadUserList...");
    
    if (!window.UserData) {
      console.error("[LoadUser] window.UserData not found!");
      return;
    }

    try {
      await window.UserData.init();
      console.debug("[LoadUser] UserData.init() completed");
    } catch (error) {
      console.error("[LoadUser] UserData.init() failed:", error);
      return;
    }

    const userSelect = document.getElementById("userSelect");
    if (!userSelect) {
      console.error("[LoadUser] userSelect element not found!");
      return;
    }

    const userId = window.API_CONFIG.getUserId();
    console.debug("[LoadUser] Fetching user with ID:", userId);
    
    const user = await window.UserData.fetchUserById(userId);
    
    if (!user) {
      console.error("[LoadUser] Failed to fetch user data!");
      return;
    }
    
    // Lưu vào global
    window.UserData._lastUserObj = user;
    console.debug("[LoadUser] User data saved to window.UserData._lastUserObj");

    console.debug("[LoadUser] User data loaded:", {
      userId: user._id || user.id,
      totalProfiles: user.profiles?.length || 0,
      profiles: user.profiles?.map((p, i) => ({
        index: i,
        name: p.name,
        phone: p.phoneNumber || p.phone_number,
        is_default: p.is_default || p.default
      }))
    });

    if (!user?.profiles?.length) {
      userSelect.innerHTML = '<option value="">Không có địa chỉ gửi</option>';
      return;
    }

    userSelect.innerHTML = '';
    let defaultProfile = null;
    let defaultIndex = -1;

    user.profiles.forEach((p, index) => {
      const addr = p.address || {};
      const addressStr = [addr.other, addr.ward, addr.district, addr.province]
        .filter(Boolean)
        .join(", ");
      const opt = document.createElement("option");
      // Sử dụng index làm value vì profile không có _id
      opt.value = String(index);
      opt.textContent = `${p.name || ""} - ${addressStr || ""} - ${p.phoneNumber || p.phone_number || ""}`;
      
      // Kiểm tra is_default === true (API trả về is_default, không phải default)
      if (p.is_default === true || p.default === true) {
        defaultProfile = p;
        defaultIndex = index;
      }
      
      userSelect.appendChild(opt);
    });

    console.debug("[LoadUser] Total profiles:", user.profiles.length);
    console.debug("[LoadUser] Default profile index:", defaultIndex);
    console.debug("[LoadUser] Default profile:", defaultProfile);

    // Nếu không có profile nào là default, chọn profile đầu tiên
    if (defaultIndex === -1 && user.profiles.length > 0) {
      defaultProfile = user.profiles[0];
      defaultIndex = 0;
      console.debug("[LoadUser] No default found, using first profile");
    }

    // Set selected cho option mặc định
    if (defaultIndex >= 0) {
      userSelect.selectedIndex = defaultIndex;
      console.debug("[LoadUser] Set selectedIndex to:", defaultIndex);
    }

    // Đảm bảo có defaultProfile để trigger event
    if (!defaultProfile) {
      console.warn("[Sender] No default profile found and no profiles available");
      return;
    }

    console.debug("[Sender] Will trigger initial event with profile:", {
      name: defaultProfile.name,
      phone: defaultProfile.phoneNumber || defaultProfile.phone_number,
      address: defaultProfile.address,
      is_default: defaultProfile.is_default || defaultProfile.default
    });

    // Trigger initial event với profile mặc định
    const uid = user._id?.$oid || user._id || user.id || window.API_CONFIG.getUserId();
    
    // Lấy branchId nếu có
    let branchId = null;
    const isPostOffice = document.getElementById("pickupToggle")?.checked;
    if (isPostOffice) {
      const selectedBranch = document.querySelector(".post-office-option.selected[data-id]");
      branchId =
        selectedBranch?.getAttribute("data-id") ||
        window.BranchData?.getAllBranches?.()?.[0]?._id?.$oid ||
        window.BranchData?.getAllBranches?.()?.[0]?._id ||
        null;
    }

    // Lấy pickupTime nếu có
    let pickupTime = null;
    const slot = document.querySelector(".time-slot.selected");
    if (slot) {
      const date = slot.getAttribute("data-date");
      const time = slot.getAttribute("data-time");
      pickupTime = `${date} ${time}`;
    } else {
      const displayText = document.querySelector("#selectedTimeDisplay")?.textContent?.trim();
      if (displayText && displayText !== "Chọn thời gian") pickupTime = displayText;
    }

    const senderData = {
      userId: uid,
      name: defaultProfile.name,
      phone_number: defaultProfile.phoneNumber || defaultProfile.phone_number,
      address: defaultProfile.address,
      branchId,
      pickupTime,
    };

    // Cập nhật CreateOrderData
    window.CreateOrderData = window.CreateOrderData || {};
    window.CreateOrderData.sender = senderData;

    document.dispatchEvent(
      new CustomEvent("userChanged", { detail: senderData })
    );
    
    console.debug("[Sender] Initial user loaded →", senderData);
  }

  // ===== INITIALIZE CORE UI COMPONENTS =====
  function initializeUserComponents() {
    initCODFunctionality();
    initPaymentNotification();
    initPricingSummary();
    initQuantityControls();
    initNoteTemplate();
    initUserSelectChange();
  }

  // ===== USER SELECT CHANGE =====
  function initUserSelectChange() {
    const userSelect = document.getElementById("userSelect");
    if (!userSelect) return;

    userSelect.addEventListener("change", () => {
      const selectedIndex = parseInt(userSelect.value, 10);
      const userObj = window.UserData?._lastUserObj;
      
      console.debug("[Sender] User select changed");
      console.debug("[Sender] - Selected Index:", selectedIndex);
      console.debug("[Sender] - Selected Text:", userSelect.options[userSelect.selectedIndex]?.text);

      if (!userObj || !Array.isArray(userObj.profiles)) {
        console.warn("[Sender] Missing userObj or profiles");
        return;
      }

      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userObj.profiles.length) {
        console.warn("[Sender] Invalid profile index:", selectedIndex);
        return;
      }

      // Lấy profile theo index
      const selectedProfile = userObj.profiles[selectedIndex];

      if (!selectedProfile) {
        console.error("[Sender] Cannot find profile at index:", selectedIndex);
        return;
      }

      console.debug("[Sender] ✅ Selected profile found:", {
        name: selectedProfile.name,
        phone: selectedProfile.phoneNumber || selectedProfile.phone_number,
        is_default: selectedProfile.is_default || selectedProfile.default,
        address: selectedProfile.address
      });

      // Lấy branchId (nếu đang bật gửi tại bưu cục)
      let branchId = null;
      const isPostOffice = document.getElementById("pickupToggle")?.checked;
      if (isPostOffice) {
        const selectedBranch = document.querySelector(".post-office-option.selected[data-id]");
        branchId =
          selectedBranch?.getAttribute("data-id") ||
          window.BranchData?.getAllBranches?.()?.[0]?._id?.$oid ||
          window.BranchData?.getAllBranches?.()?.[0]?._id ||
          null;
      }

      // Lấy pickupTime hiện tại
      let pickupTime = null;
      const slot = document.querySelector(".time-slot.selected");
      if (slot) {
        const date = slot.getAttribute("data-date");
        const time = slot.getAttribute("data-time");
        pickupTime = `${date} ${time}`;
      } else {
        const displayText = document.querySelector("#selectedTimeDisplay")?.textContent?.trim();
        if (displayText && displayText !== "Chọn thời gian") pickupTime = displayText;
      }

      // Gói dữ liệu người gửi mới với profile đã chọn
      const senderData = {
        userId: userObj._id?.$oid || userObj._id || userObj.id || "",
        name: selectedProfile.name || "",
        phone_number: selectedProfile.phoneNumber || selectedProfile.phone_number || "",
        address: selectedProfile.address || {},
        branchId,
        pickupTime,
      };

      // Cập nhật realtime CreateOrderData
      window.CreateOrderData = window.CreateOrderData || {};
      window.CreateOrderData.sender = senderData;

      // Bắn event userChanged
      document.dispatchEvent(new CustomEvent("userChanged", { detail: senderData }));

      console.debug("[Sender] User changed →", senderData);
    });
  }

  // ===== POST OFFICE SELECTOR =====
  function initPostOfficeSelector() {
    const pickupToggle = document.getElementById("pickupToggle");
    const postOfficeSection = document.getElementById("postOfficeSection");
    const display = document.getElementById("postOfficeDisplay");
    const dropdown = document.getElementById("postOfficeDropdown");
    const optionsContainer = document.getElementById("postOfficeOptions");
    const searchInput = document.getElementById("postOfficeSearch");
    const displayText = display?.querySelector(".display-text");
    if (!pickupToggle || !postOfficeSection || !display || !dropdown || !optionsContainer || !searchInput) return;

    let hasLoaded = false;

    pickupToggle.addEventListener("change", () => {
      if (pickupToggle.checked) {
        postOfficeSection.style.display = "block";
        dropdown.style.display = "none";
        if (displayText) displayText.textContent = "Tìm kiếm bưu cục...";
        optionsContainer.innerHTML =
          '<div class="no-results">Chưa có dữ liệu. Vui lòng click để tải danh sách.</div>';
        hasLoaded = false;
      } else {
        postOfficeSection.style.display = "none";
      }
    });

    display.addEventListener("click", async (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
      if (!hasLoaded) {
        optionsContainer.innerHTML = `<div class="no-results">Đang tải danh sách bưu cục...</div>`;
        const branches = await window.BranchData.getAllBranches();
        renderPostOfficeOptions(branches, optionsContainer, displayText, dropdown);
        hasLoaded = true;
      }
    });

    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase();
      optionsContainer
        .querySelectorAll(".post-office-option")
        .forEach((opt) => {
          opt.style.display = opt.textContent.toLowerCase().includes(keyword)
            ? "block"
            : "none";
        });
    });

    document.addEventListener("click", (e) => {
      if (!e.target.closest("#postOfficeSelect")) dropdown.style.display = "none";
    });
  }

  function renderPostOfficeOptions(branches, container, displayText, dropdown) {
    if (!branches?.length) {
      container.innerHTML = `<div class="no-results">Không tìm thấy bưu cục nào.</div>`;
      return;
    }

    container.innerHTML = branches
      .map((b) => {
        const id = b._id?.$oid || b._id || b.id;
        const address = typeof b.address === "object"
          ? Object.values(b.address).filter(Boolean).join(", ")
          : b.address || "";
        return `
          <div class="post-office-option" data-id="${id}">
            <strong>${b.name}</strong><br><small>${address}</small>
          </div>`;
      })
      .join("");

    container.querySelectorAll(".post-office-option").forEach((opt) => {
      opt.addEventListener("click", () => {
        // Xóa selected cũ và thêm selected mới
        container.querySelectorAll(".post-office-option").forEach(o => o.classList.remove("selected"));
        opt.classList.add("selected");
        
        const name = opt.querySelector("strong").textContent;
        if (displayText) displayText.textContent = name;
        dropdown.style.display = "none";
        
        document.dispatchEvent(
          new CustomEvent("postOfficeSelected", {
            detail: { id: opt.dataset.id, name },
          })
        );
      });
    });
  }

  // ====== COD FUNCTIONALITY ======
  function initCODFunctionality() {
    const checkbox = document.getElementById("codByGoods");
    const input = document.getElementById("codAmount");
    if (!checkbox || !input) return;

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        input.disabled = false;
        input.focus();
      } else {
        input.value = "0";
        input.disabled = true;
      }
    });
    input.disabled = true;
  }

  // ====== PAYMENT NOTIFICATION ======
  function initPaymentNotification() {
    const senderPay = document.getElementById("senderPays");
    const userPay = document.getElementById("userPays");
    const alertBox = document.getElementById("senderPaymentAlert");
    const modal = document.getElementById("userPaymentModal");
    const confirmBtn = document.getElementById("confirmSenderPayment");
    if (!senderPay || !userPay || !alertBox) return;

    const update = () => (alertBox.style.display = senderPay.checked ? "flex" : "none");

    userPay.addEventListener("change", () => {
      if (userPay.checked && modal) new bootstrap.Modal(modal).show();
    });

    confirmBtn?.addEventListener("click", () => {
      senderPay.checked = true;
      userPay.checked = false;
      update();
      bootstrap.Modal.getInstance(modal)?.hide();
    });

    modal?.addEventListener("hidden.bs.modal", () => {
      senderPay.checked = true;
      userPay.checked = false;
      update();
    });

    senderPay.addEventListener("change", update);
    update();
  }

  // ====== PRICING BAR ======
  function initPricingSummary() {
    const basic = document.getElementById("basicSummary");
    const detail = document.getElementById("detailedSummary");

    if (basic && detail) {
      window.showDetailedPricing = () => {
        basic.style.display = "none";
        detail.style.display = "block";
      };
      window.showBasicPricing = () => {
        basic.style.display = "block";
        detail.style.display = "none";
      };
    }

    const bar = document.getElementById("pricingSummaryBar");
    if (bar) {
      document.body.classList.add("has-floating-bar");
      setTimeout(() => bar.classList.add("show"), 500);
    }
  }

  // ====== QTY CONTROLS ======
  function initQuantityControls() {
    document.querySelectorAll(".qty-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = btn.parentElement.querySelector(".qty-input");
        if (!input) return;
        let val = parseInt(input.value, 10) || 0;
        if (btn.classList.contains("qty-plus")) val++;
        else if (btn.classList.contains("qty-minus")) val = Math.max(1, val - 1);
        input.value = val;
        input.dispatchEvent(new Event("change"));
      });
    });
  }

  // ====== PICKUP TOGGLE ======
  function initPickupToggle() {
    const toggle = document.getElementById("pickupToggle");
    const timeSection = document.getElementById("pickupTimeSection");
    const postSection = document.getElementById("postOfficeSection");
    if (!toggle || !timeSection || !postSection) return;

    const closeDropdown = () => {
      const sel = document.getElementById("postOfficeSelect");
      const display = sel?.querySelector(".select-display");
      const drop = sel?.querySelector(".select-dropdown");
      drop?.classList.remove("show");
      display?.classList.remove("active");
      if (drop) Object.assign(drop.style, { opacity: "", visibility: "", transform: "" });
    };

    const apply = () => {
      timeSection.style.display = toggle.checked ? "none" : "block";
      postSection.style.display = toggle.checked ? "block" : "none";
      closeDropdown();
    };

    apply();
    toggle.addEventListener("change", apply);
  }

  // ====== NOTE TEMPLATE ======
  function initNoteTemplate() {
    const btn = document.getElementById("noteTemplateBtn");
    const modal = document.getElementById("noteTemplateModal");
    const selectBtn = document.getElementById("selectNotesBtn");
    const textarea = document.getElementById("noteTextarea");
    if (!btn || !modal) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      new bootstrap.Modal(modal).show();
    });

    selectBtn?.addEventListener("click", () => {
      const selected = Array.from(document.querySelectorAll(".note-template-option:checked")).map(
        (opt) => opt.value
      );
      if (!selected.length || !textarea) return;

      const current = (textarea.value || "").trim();
      const text = selected.join("\n- ");
      textarea.value = current ? `${current}\n- ${text}` : `- ${text}`;

      const modalInstance = bootstrap.Modal.getInstance(modal);
      modalInstance?.hide();
      document.querySelectorAll(".note-template-option:checked").forEach((opt) => (opt.checked = false));
    });
  }

  // Bổ sung: Khi click vào slot, set .selected cho slot vừa chọn, bỏ .selected ở các slot khác
  function setupPickupTimeSlotSelection() {
    document.querySelectorAll('.time-slot').forEach(slot => {
      slot.addEventListener('click', function() {
        document.querySelectorAll('.time-slot.selected').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
      });
    });
  }

  // ===== PICKUP TIME AUTO UPDATE =====
  document.addEventListener("click", function (e) {
    const slot = e.target.closest(".time-slot");
    if (!slot) return;

    // Cập nhật CreateOrderData
    const pickupTime = slot.getAttribute("data-time") || null;
    window.CreateOrderData = window.CreateOrderData || {};
    window.CreateOrderData.sender = window.CreateOrderData.sender || {};
    window.CreateOrderData.sender.pickupTime = pickupTime;

    // Bắn event để module khác nhận biết
    document.dispatchEvent(
      new CustomEvent("pickupTimeChanged", {
        detail: { pickupTime },
      })
    );

    console.debug("[PickupTime] Updated:", pickupTime);
  });

  // Gọi hàm này sau khi render xong các slot
  if (document.readyState !== 'loading') setupPickupTimeSlotSelection();
  else document.addEventListener('DOMContentLoaded', setupPickupTimeSlotSelection);

  return {
    init,
    initCODFunctionality,
    initPaymentNotification,
    initPricingSummary,
    initQuantityControls,
    initPickupToggle,
    initUserSelectChange,
    initNoteTemplate,
    // Helper để debug
    checkStatus: function() {
      console.log("=== USER MODULE STATUS ===");
      console.log("window.UserData exists:", !!window.UserData);
      console.log("window.UserData._lastUserObj exists:", !!window.UserData?._lastUserObj);
      console.log("User profiles count:", window.UserData?._lastUserObj?.profiles?.length || 0);
      console.log("Profiles:", window.UserData?._lastUserObj?.profiles?.map((p, i) => ({
        index: i,
        name: p.name,
        phone: p.phoneNumber || p.phone_number,
        is_default: p.is_default || p.default
      })));
      console.log("userSelect element:", document.getElementById("userSelect"));
      console.log("userSelect value:", document.getElementById("userSelect")?.value);
      console.log("========================");
    }
  };
})();

// ===== SENDER.GETCURRENT =====
window.Sender = window.Sender || {};
window.Sender.getCurrentSender = function () {
  console.debug("[getCurrentSender] Called");
  
  const userSelect = document.getElementById("userSelect");
  const userObj = window.UserData?._lastUserObj;
  
  console.debug("[getCurrentSender] userSelect found:", !!userSelect);
  console.debug("[getCurrentSender] userObj found:", !!userObj);
  console.debug("[getCurrentSender] window.UserData exists:", !!window.UserData);
  
  if (!userObj) {
    console.error("[getCurrentSender] userObj is missing! Trying to get from window.UserData...");
    if (window.UserData && typeof window.UserData.fetchUserById === 'function') {
      console.warn("[getCurrentSender] UserData exists but _lastUserObj is not set. Call window.User.init() first!");
    }
    return {};
  }
  
  if (!userSelect) {
    console.error("[getCurrentSender] userSelect element not found!");
    return {};
  }

  const selectedIndex = parseInt(userSelect.value, 10);
  const profiles = userObj.profiles || [];
  
  console.debug("[getCurrentSender] Selected Index from dropdown:", selectedIndex);
  console.debug("[getCurrentSender] Total profiles:", profiles.length);
  console.debug("[getCurrentSender] Profiles:", profiles.map((p, i) => ({
    index: i,
    name: p.name,
    is_default: p.is_default || p.default
  })));
  
  // Lấy profile theo index
  let selectedProfile = null;
  if (!isNaN(selectedIndex) && selectedIndex >= 0 && selectedIndex < profiles.length) {
    selectedProfile = profiles[selectedIndex];
  }
  
  // Nếu không tìm thấy, fallback về default hoặc profile đầu tiên
  if (!selectedProfile) {
    console.warn("[getCurrentSender] Cannot find profile at index, using fallback");
    selectedProfile = profiles.find((p) => p.is_default === true || p.default === true) || profiles[0];
  }

  if (!selectedProfile) {
    console.error("[getCurrentSender] No profile available");
    return {};
  }

  console.debug("[getCurrentSender] Using profile:", {
    name: selectedProfile.name,
    phone: selectedProfile.phoneNumber || selectedProfile.phone_number,
    is_default: selectedProfile.is_default || selectedProfile.default,
    address: selectedProfile.address
  });

  let branchId = null;
  const isPostOffice = document.getElementById("pickupToggle")?.checked;
  if (isPostOffice) {
    const selectedBranch = document.querySelector(".post-office-option.selected[data-id]");
    branchId =
      selectedBranch?.getAttribute("data-id") ||
      window.BranchData?.getAllBranches?.()?.[0]?._id?.$oid ||
      window.BranchData?.getAllBranches?.()?.[0]?._id ||
      null;
  }

    // Lấy pickupTime từ UI và chuyển sang ISODate
    let pickupTime = null;
    const slot = document.querySelector('.time-slot.selected');
    if (slot) {
      // Lấy khung giờ
      const timeStr = slot.getAttribute('data-time') || slot.textContent.trim();
      // Lấy ngày từ tab đang active
      let dayOffset = 0;
      const activeTab = document.querySelector('.nav-link.active');
      if (activeTab) {
        if (activeTab.id === 'today-tab') dayOffset = 0;
        else if (activeTab.id === 'tomorrow-tab') dayOffset = 1;
        else if (activeTab.id === 'dayafter-tab') dayOffset = 2;
      }
      const now = new Date();
      const pickupDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      // Ước lượng giờ lấy hàng từ chuỗi (ví dụ: "Sáng (7h30 - 12h00)")
      let hour = 8, minute = 0;
      if (/7h30/.test(timeStr)) { hour = 7; minute = 30; }
      else if (/13h30/.test(timeStr)) { hour = 13; minute = 30; }
      else if (/18h30/.test(timeStr)) { hour = 18; minute = 30; }
      else if (/12h00/.test(timeStr)) { hour = 12; minute = 0; }
      else if (/21h00/.test(timeStr)) { hour = 21; minute = 0; }
      else if (/Cả ngày/.test(timeStr)) { hour = 8; minute = 0; }
      // Tạo Date
      pickupTime = new Date(pickupDay.getFullYear(), pickupDay.getMonth(), pickupDay.getDate(), hour, minute, 0).toISOString();
    } else {
      // Nếu không có slot, thử lấy từ input hoặc display
      const pickupInput = document.querySelector('#pickupTimeInput');
      if (pickupInput && pickupInput.value) {
        // Nếu input là kiểu datetime-local hoặc date, chuyển sang ISO
        const inputDate = new Date(pickupInput.value);
        if (!isNaN(inputDate.getTime())) pickupTime = inputDate.toISOString();
        else pickupTime = pickupInput.value;
      } else {
        const displayText = document.querySelector('#pickupTimeDisplay span')?.textContent?.trim();
        if (displayText) {
          // Nếu displayText là chuỗi ngày giờ, cố gắng parse
          const inputDate = new Date(displayText);
          if (!isNaN(inputDate.getTime())) pickupTime = inputDate.toISOString();
          else pickupTime = displayText;
        }
      }
    }

  const userId = userObj._id?.$oid || userObj._id || userObj.id || window.API_CONFIG?.getUserId?.() || "";
  
  return {
    userId: userId,
    name: selectedProfile.name || "",
    phone_number: selectedProfile.phoneNumber || selectedProfile.phone_number || "",
    address: selectedProfile.address || {},
    branchId,
    pickupTime
  };
};
