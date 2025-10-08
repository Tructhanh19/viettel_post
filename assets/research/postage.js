// Add interactive functionality
document.addEventListener("DOMContentLoaded", function () {
  const lookupBtn = document.querySelector(".lookup-btn");

  lookupBtn.addEventListener("click", function () {
    // Add loading state
    this.innerHTML =
      '<i class="fas fa-spinner fa-spin me-2"></i>Đang tra cứu...';
    this.disabled = true;

    // Simulate API call
    setTimeout(() => {
      this.innerHTML = "Tra cứu";
      this.disabled = false;

      // Here you would normally show results
      alert("Tra cứu thành công! (Demo)");
    }, 2000);
  });

  // Add change handlers for dropdowns
  const selects = document.querySelectorAll(".form-select");
  selects.forEach((select) => {
    select.addEventListener("change", function () {
      // Add visual feedback
      this.style.borderColor = "#28a745";
      setTimeout(() => {
        this.style.borderColor = "#ddd";
      }, 1000);
    });
  });
});
