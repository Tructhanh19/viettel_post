// src="config.js"> // This line is not needed in a JS file, assuming config.js is loaded first in HTML

// --- Define FeedbackData Module ---
window.FeedbackData = (function () {
    "use strict";

    // --- Check API config ---
    if (!window.API_CONFIG) {
        console.error("❌ API_CONFIG chưa load! Ensure config.js is loaded before feedback-data.js.");
        // Optionally return a dummy object or throw an error
        return {
            loadFeedbackList: () => console.error("FeedbackData: API_CONFIG missing."),
            createFeedback: () => console.error("FeedbackData: API_CONFIG missing.")
        };
    }

    const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;

    // --- DOM elements (will be retrieved inside functions when needed) ---
    // Moved inside functions to ensure they exist when called dynamically

    // ========================
    // LOAD FEEDBACK LIST
    // ========================
    async function loadFeedbackList() {
        console.log("📦 Đang tải danh sách khiếu nại...");
        const tbody = document.querySelector("#feedbackPageContent tbody"); // Get tbody specifically within the loaded content
        if (!tbody) {
            console.error("❌ Không tìm thấy tbody trong #feedbackPageContent!");
            return;
        }

        const token = getAccessToken ? getAccessToken() : null; // Check if function exists

        try {
            tbody.innerHTML = `<tr><td colspan="8" class="no-data">Đang tải...</td></tr>`; // Show loading state
            const headers = {};
            if (token) {
                 headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            const res = await fetch(`${API_BASE_URL}/feedbacks/get-all`, { headers });

            if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} khi tải feedback:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }
            const data = await res.json();

            console.log("✅ Loaded feedback list:", data);
            const feedbackList = data.result || data.data || []; // Handle different response structures

            if (!feedbackList || feedbackList.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="no-data">Không có bản ghi nào</td></tr>`;
                return;
            }

            tbody.innerHTML = feedbackList
                .map(
                    (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.code || "-"}</td>
                  <td>${item.orderCode || "-"}</td>
                  <td>${item.type || "-"}</td>
                  <td>${item.content || "-"}</td>
                  <td>${item.createdAt ? new Date(item.createdAt).toLocaleDateString("vi-VN") : "-"}</td>
                  <td>${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "-"}</td>
                  <td>${item.status || "Đang xử lý"}</td>
                </tr>`
                )
                .join("");
        } catch (err) {
            console.error("❌ Lỗi tải danh sách khiếu nại:", err);
            tbody.innerHTML = `<tr><td colspan="8" class="no-data">Không thể tải dữ liệu (${err.message})</td></tr>`;
        }
    }

    // ========================
    // CREATE FEEDBACK
    // ========================
    async function createFeedback() {
        console.log("🧾 Gửi khiếu nại mới...");

        // Retrieve elements *inside* the function to ensure they exist
        const orderCodeInput = document.querySelector(
            "#complaintModal input[placeholder='Nhập mã đơn hàng']"
        );
        const contentInput = document.querySelector(
            "#complaintModal textarea[placeholder='Nhập nội dung khiếu nại/ góp ý']"
        );
        const complaintTypeDisplay = document.querySelector(
            "#complaintTypeDropdown .dropdown-selected span"
        );
        const pickupAddressSelect = document.querySelector(
            "#complaintModal select" // Assuming only one select in the modal for address
        );
        const modal = document.getElementById('complaintModal'); // Needed for hiding

        // Check if elements were found
        if (!orderCodeInput || !contentInput || !complaintTypeDisplay || !pickupAddressSelect || !modal) {
            console.error("❌ Không tìm thấy đủ các thành phần form trong modal!");
            alert("⚠️ Đã xảy ra lỗi giao diện. Vui lòng thử tải lại trang.");
            return;
        }


        const orderCode = orderCodeInput.value.trim();
        const content = contentInput.value.trim();
        const type = complaintTypeDisplay.textContent.trim();
        // Assuming the select value *is* the address string needed by API
        const address = pickupAddressSelect.value.trim();


        if (!orderCode || !content || type === "Chọn loại khiếu nại" || !address || address === "Chọn địa chỉ lấy hàng") { // Added check for default select option
            alert("⚠️ Vui lòng nhập đầy đủ Mã đơn hàng, Nội dung, Loại khiếu nại và chọn Địa chỉ lấy hàng!");
            return;
        }

        const feedback = {
            orderCode,
            type,
            content,
            address, // API expects just the string? Adjust if it needs an object
        };

        const token = getAccessToken ? getAccessToken() : null; // Check if function exists
        const headers = { 'Content-Type': 'application/json' };

        if (token) {
            headers['Authorization'] = token.startsWith('Bearer ')
                ? token
                : `Bearer ${token}`;
        }

        console.log('🔐 Gửi feedback với payload:', feedback);
        console.log('🔐 Header gửi đi:', headers);


        try {
             // Optional: Show loading state on button
             const confirmBtn = document.getElementById('confirmModalBtn');
             if(confirmBtn) confirmBtn.disabled = true; confirmBtn.textContent = "Đang gửi...";

             const res = await fetch(`${API_BASE_URL}/feedbacks/insert`, { // Assuming endpoint is /feedbacks/insert
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify(feedback)
             });

              if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} khi tạo feedback:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
             }

             const result = await res.json();
             console.log("✅ Feedback created:", result);

             // Hide modal and reload list
             modal.classList.add('hidden'); // Use direct reference
             resetFormInternal(); // Use internal reset helper
             await loadFeedbackList(); // Reload the list to show the new item
             alert("✅ Đã gửi khiếu nại thành công!");


        } catch (err) {
             console.error("❌ Lỗi khi tạo khiếu nại:", err);
             alert(`⚠️ Gửi khiếu nại thất bại: ${err.message}`);
        } finally {
             // Restore button state
             const confirmBtn = document.getElementById('confirmModalBtn');
             if(confirmBtn) confirmBtn.disabled = false; confirmBtn.textContent = "Xác nhận";
        }

    }

     // Internal helper to reset form fields
    function resetFormInternal() {
         const orderCodeInput = document.querySelector("#complaintModal input[placeholder='Nhập mã đơn hàng']");
         const contentInput = document.querySelector("#complaintModal textarea[placeholder='Nhập nội dung khiếu nại/ góp ý']");
         const complaintTypeDisplay = document.querySelector("#complaintTypeDropdown .dropdown-selected span");
         const pickupAddressSelect = document.querySelector("#complaintModal select");

         if(orderCodeInput) orderCodeInput.value = "";
         if(contentInput) contentInput.value = "";
         if(complaintTypeDisplay) complaintTypeDisplay.textContent = "Chọn loại khiếu nại";
         if(pickupAddressSelect) pickupAddressSelect.selectedIndex = 0;
     }


    // --- Public methods ---
    return {
        loadFeedbackList,
        createFeedback
        // Add other functions if they need to be called externally
    };

})();

// --- REMOVED document.addEventListener("DOMContentLoaded") ---
// Initialization logic (like loadFeedbackList) should now be called
// from within the initFeedbackPage function in feedback.html
console.log("🔧 feedback-data.js script executed. Waiting for initFeedbackPage() to call FeedbackData methods.");