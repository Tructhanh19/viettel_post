document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".menu-link");
  const content = document.getElementById("accountContent");

  // Khi click vào menu
  links.forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault(); // ❌ Ngăn load trang

      const url = link.getAttribute("href");

      try {
        // 🟢 Dùng fetch để tải file HTML con
        const response = await fetch(url);
        if (!response.ok) throw new Error("Không thể tải nội dung");
        const html = await response.text();

        // 🧩 Thay nội dung vào khu vực content
        content.innerHTML = html;

        // 🎨 Highlight menu đang chọn
        links.forEach((l) => l.parentElement.classList.remove("active"));
        link.parentElement.classList.add("active");
      } catch (error) {
        content.innerHTML = `<p class="text-danger">Lỗi tải nội dung: ${error.message}</p>`;
      }
    });
  });

  // Tự động load mục đầu tiên khi vào trang
  if (links.length > 0) {
    links[0].click();
  }
});
