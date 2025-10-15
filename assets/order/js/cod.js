/**
 * COD MODULE – Quản lý tiền thu hộ & tiền trả người gửi
 */
window.CODModule = (function () {
  "use strict";

  let codEnabled = false;
  let payer = "sender"; // sender | receiver

  // Elements
  const codCheckbox = document.getElementById("codByGoods");
  const codAmountInput = document.getElementById("codAmount");
  const senderPaysRadio = document.getElementById("senderPays");
  const receiverPaysRadio = document.getElementById("receiverPays");
  const senderPaymentBox = document.getElementById("senderPaymentBox");
  const senderPaymentValue = senderPaymentBox?.querySelector(".payment-value");

  function init() {
    if (!codCheckbox || !codAmountInput) {
      console.error("❌ COD elements missing in DOM");
      return;
    }

    // COD checkbox toggle
    codCheckbox.addEventListener("change", () => {
      codEnabled = codCheckbox.checked;
      handleCODToggle();
      updateUI();
    });

    // Người trả phí toggle
    if (senderPaysRadio && receiverPaysRadio) {
      senderPaysRadio.addEventListener("change", () => {
        if (senderPaysRadio.checked) payer = "sender";
        updateUI();
      });
      receiverPaysRadio.addEventListener("change", () => {
        if (!codEnabled) {
          // Hiển thị cảnh báo modal
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
      });
    }

    // Nghe các sự kiện từ module khác
    document.addEventListener("packageItemsChanged", updateUI);
    document.addEventListener("orderDataChanged", updateUI);

    // Cập nhật lần đầu
    updateUI();

    console.log("💵 COD Module initialized");
  }

  function handleCODToggle() {
    if (!codEnabled) {
      // Khi bỏ tick COD → disable input + reset về 0
      codAmountInput.value = 0;
      codAmountInput.disabled = true;
      receiverPaysRadio.checked = false;
      senderPaysRadio.checked = true;
      receiverPaysRadio.disabled = true; // không chọn được người nhận
      payer = "sender";
    } else {
      // Khi tick COD → enable input và gán giá trị hàng làm COD
      const packageTotals = window.Package?.calculateTotals?.();
      const totalValue = packageTotals?.totalValue || 0;
      codAmountInput.value = totalValue;
      codAmountInput.disabled = false;
      receiverPaysRadio.disabled = false;
    }
  }

  function updateUI() {
    const pricing = window.PricingCalculator?.getCurrentPricing?.();
    const packageTotals = window.Package?.calculateTotals?.();

    if (!pricing) return;

    const totalFee = pricing.totalFee || 0;
    const totalValue = packageTotals?.totalValue || 0;
    const codAmount = parseFloat(codAmountInput.value) || 0;

    let senderPays = 0;
    let paymentLabelText = "";
    let paymentValueText = "";

    if (!codEnabled) {
      // ❌ Không COD
      senderPays = totalFee;
      paymentLabelText = "Người gửi thanh toán:";
      paymentValueText = `${formatCurrency(senderPays)} (không thu hộ)`;
      senderPaymentBox.classList.remove("d-none");
      receiverPaysRadio.disabled = true;
      receiverPaysRadio.checked = false;
      senderPaysRadio.checked = true;
    } else {
      // ✅ COD bật
      receiverPaysRadio.disabled = false;

      if (payer === "sender") {
        // Người gửi trả phí
        senderPays = totalFee;
        paymentLabelText = "Người gửi thanh toán:";
        paymentValueText = `${formatCurrency(
          senderPays
        )} (COD: ${formatCurrency(codAmount)})`;
        senderPaymentBox.classList.remove("d-none");
      } else {
        // Người nhận trả phí
        senderPays = 0;
        paymentLabelText = "Người nhận thanh toán:";
        paymentValueText = `${formatCurrency(
          totalValue
        )} (COD: ${formatCurrency(codAmount)})`;
        senderPaymentBox.classList.add("d-none");
      }
    }

    // Cập nhật UI
    if (senderPaymentValue) senderPaymentValue.textContent = paymentValueText;
    if (senderPaymentBox) {
      const label = senderPaymentBox.querySelector(".payment-label");
      if (label) label.textContent = paymentLabelText;
    }

    console.log("💰 [COD UI Updated]", {
      codEnabled,
      payer,
      codAmount,
      totalFee,
      totalValue,
    });
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  }

  return {
    init,
    updateUI,
  };
})();
