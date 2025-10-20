window.CODModule = (function () {
  "use strict";

  let codEnabled = false;
  let payer = "sender"; // sender | receiver

  // Elements
  let codCheckbox, codAmountInput, senderPaysRadio, receiverPaysRadio;

  /** 🧩 Lưu thông tin COD vào CreateOrderData */
  function saveCODInfoToOrder() {
    window.CreateOrderData = window.CreateOrderData || {};
    window.CreateOrderData.codInfo = {
      codCost: codEnabled ? (parseFloat(codAmountInput?.value) || 0) : 0,
      payer,
      codEnabled,
    };
    console.log("[DEBUG][CreateOrderData] codInfo:", window.CreateOrderData.codInfo);
  }

  /** 🚀 Khởi tạo module */
  function init() {
    // Lấy lại các phần tử DOM mỗi lần init
    codCheckbox = document.getElementById("codByGoods");
    codAmountInput = document.getElementById("codAmount");
    senderPaysRadio = document.getElementById("senderPays");
    receiverPaysRadio = document.getElementById("receiverPays");

    if (!codCheckbox || !codAmountInput) {
      console.error("❌ COD elements missing in DOM");
      return;
    }

    // Xóa event cũ tránh nhân đôi
    codCheckbox.replaceWith(codCheckbox.cloneNode(true));
    codCheckbox = document.getElementById("codByGoods");
    codCheckbox.addEventListener("change", () => {
      codEnabled = codCheckbox.checked;
      handleCODToggle();
      updateUI();
      saveCODInfoToOrder();
    });

    if (senderPaysRadio && receiverPaysRadio) {
      senderPaysRadio.replaceWith(senderPaysRadio.cloneNode(true));
      receiverPaysRadio.replaceWith(receiverPaysRadio.cloneNode(true));
      senderPaysRadio = document.getElementById("senderPays");
      receiverPaysRadio = document.getElementById("receiverPays");

      senderPaysRadio.addEventListener("change", () => {
        if (senderPaysRadio.checked) payer = "sender";
        updateUI();
        saveCODInfoToOrder();
      });

      receiverPaysRadio.addEventListener("change", () => {
        if (!codEnabled) {
          const modal = new bootstrap.Modal(
            document.getElementById("receiverPaymentModal")
          );
          modal.show();
          receiverPaysRadio.checked = false;
          senderPaysRadio.checked = true;
          return;
        }
        payer = "receiver";
        updateUI();
        saveCODInfoToOrder();
      });
    }

    // Lắng nghe sự kiện liên quan đến package & pricing (chỉ 1 lần)
    if (!window._codModuleEventAdded) {
      document.addEventListener("packageItemsChanged", updateUI);
      document.addEventListener("orderDataChanged", updateUI);
      window._codModuleEventAdded = true;
    }

    // Cập nhật lần đầu
    updateUI();
    saveCODInfoToOrder();
  }

  /** ⚙️ Xử lý bật/tắt COD */
  function handleCODToggle() {
    if (!codCheckbox || !codAmountInput || !senderPaysRadio || !receiverPaysRadio) return;

    if (!codEnabled) {
      console.log("[COD] Bỏ tick COD, reset input");
      codAmountInput.value = 0;
      codAmountInput.readOnly = true;
      codAmountInput.disabled = true;
      receiverPaysRadio.checked = false;
      senderPaysRadio.checked = true;
      receiverPaysRadio.disabled = true;
      payer = "sender";
    } else {
      const packageTotals = window.Package?.calculateTotals?.();
      const totalValue = packageTotals?.totalValue || 0;
      codAmountInput.value = totalValue;
      codAmountInput.readOnly = true;
      codAmountInput.disabled = false;
      receiverPaysRadio.disabled = false;
    }
  }

  /** 🧾 Cập nhật hiển thị */
  function updateUI() {
    if (!codCheckbox || !codAmountInput) return;

    const pricing = window.PricingCalculator?.getCurrentPricing?.();
    const packageTotals = window.Package?.calculateTotals?.();

    if (!pricing) return;

    const totalFee = pricing.totalFee || 0;
    const totalValue = packageTotals?.totalValue || 0;
    const codAmount = parseFloat(codAmountInput.value) || 0;

    if (!codEnabled) {
      // ❌ Không COD
      receiverPaysRadio.disabled = true;
      receiverPaysRadio.checked = false;
      senderPaysRadio.checked = true;
    } else {
      // ✅ COD bật
      receiverPaysRadio.disabled = false;
    }

    console.log("💰 [COD UI Updated]", {
      codEnabled,
      payer,
      codAmount,
      totalFee,
      totalValue,
    });
  }

  /** 💰 Format tiền tệ VND */
  function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  }
/** 📦 Hàm public cho Data Summary lấy dữ liệu COD */
function getCODSummaryData() {
  const codInfo = window.CreateOrderData?.codInfo || {};
  return {
    codEnabled: codInfo.codEnabled || false,
    codCost: codInfo.codCost || 0,
    payer: codInfo.payer || "sender",
  };
}

  return {
    init,
    updateUI,
    getCODSummaryData,
  };
})();
window.CODModule.getCurrentCOD = function() {
  return {
    codCost: window.CreateOrderData?.codInfo?.codCost || 0,
  };
};
