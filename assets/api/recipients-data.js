// Ensure config.js is loaded first in HTML

window.RecipientsData = (function () {
    "use strict";

    // --- Check API config ---
    if (!window.API_CONFIG) {
        console.error("❌ API_CONFIG chưa được load! Ensure config.js is loaded before recipients-data.js.");
        return { // Return dummy object to prevent further errors
            loadRecipients: () => console.error("RecipientsData: API_CONFIG missing."),
            createRecipient: () => console.error("RecipientsData: API_CONFIG missing."),
            deleteRecipient: () => console.error("RecipientsData: API_CONFIG missing.")
        };
    }

    const API_BASE_URL = window.API_CONFIG.BASE_URL;
    const getAccessToken = window.API_CONFIG.getAccessToken;
    let recipients = []; // Keep track of loaded recipients internally

    // ==========================
    // Load danh sách người nhận
    // ==========================
    async function loadRecipients() {
        console.log("📦 Đang tải danh sách người nhận...");
        const tbody = document.querySelector(".main-content tbody"); // Get tbody specifically within the loaded content
        if (!tbody) {
            console.error("❌ Không tìm thấy tbody trong .main-content!");
            return;
        }

        const token = getAccessToken ? getAccessToken() : null; // Check if function exists

        try {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Đang tải...</td></tr>`; // Loading state
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                 // Remove "Bearer " prefix if it exists, API expects raw token here?
                 // headers['Authorization'] = token.startsWith('Bearer ') ? token.slice(7) : token;
                 // **Update based on previous feedback**: Keep Bearer if API expects it
                 headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
            }

            const url = `${API_BASE_URL}/receivers/get-all`;
            console.log("🔄 Fetching recipients from:", url, "with headers:", headers); // Log URL and headers
            const res = await fetch(url, { headers });

            if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} khi tải recipients:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }

            const data = await res.json();
             // Assuming API might return { result: [...] } or just [...]
            const rawRecipients = data.result || data.data || data.receivers || (Array.isArray(data) ? data : []);
            console.log("✅ Loaded raw recipients data:", rawRecipients);

            // --- Data Normalization ---
             recipients = rawRecipients.map(r => ({
                id: r._id?.$oid || r._id || r.id, // Handle different ID formats
                name: r.name || "N/A",
                phone: r.phone || "N/A",
                address: r.address || {}, // Ensure address object exists
                tags: r.tags || [],
                success_rate: r.success_rate // Keep original field if needed
            }));
            // --- End Normalization ---

            renderTable(); // Update the UI
        } catch (err) {
            console.error("❌ Lỗi tải danh sách người nhận:", err);
            if(tbody) tbody.innerHTML = `<tr><td colspan="6" class="no-data">Không thể tải dữ liệu (${err.message})</td></tr>`;
        }
    }

    // ==========================
    // Render bảng dữ liệu
    // ==========================
    function renderTable() {
         const tbody = document.querySelector(".main-content tbody");
         if (!tbody) return; // Exit if tbody not found

        tbody.innerHTML = ""; // Clear existing rows
        if (!recipients.length) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Không có bản ghi nào</td></tr>`;
            return;
        }

        recipients.forEach((r, i) => {
            // --- Improved Address Formatting ---
            const addressParts = [
                r.address.detail,
                r.address.ward,
                r.address.district,
                r.address.province
            ].filter(Boolean); // Filter out empty/null parts
            const addressString = addressParts.length > 0 ? addressParts.join(', ') : "—";
            // --- End Improved Address Formatting ---

            const tagHTML =
                r.tags && r.tags.length
                    ? r.tags.map((t) => `<span class="tag">${t.name || 'Tag'}</span>`).join(" ") // Added fallback for tag name
                    : "—";

            const tr = document.createElement("tr");
            tr.setAttribute('data-recipient-id', r.id); // Add ID for easier selection
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td>${r.name}</td>
                <td>${tagHTML}</td>
                <td>${(r.success_rate !== undefined && r.success_rate !== null ? Number(r.success_rate) : 95).toFixed(1)}%</td>
                <td>${addressString}</td>
                <td>
                    <button class="btn btn-edit btn-sm" data-id="${r.id}">Sửa</button> <button class="btn btn-danger btn-sm btn-delete" data-id="${r.id}">Xoá</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

         // --- Add event listeners for delete buttons ---
         addDeleteEventListeners();
         addEditEventListeners(); // Add listeners for edit
    }

     // ==========================
    // Add Delete Event Listeners
    // ==========================
    function addDeleteEventListeners() {
        const tbody = document.querySelector(".main-content tbody");
        if (!tbody) return;
        tbody.querySelectorAll('.btn-delete').forEach(button => {
             // Remove old listener before adding new one to prevent duplicates
             button.removeEventListener('click', handleDeleteClick);
             button.addEventListener('click', handleDeleteClick);
        });
    }
     // Handler for delete click
    async function handleDeleteClick(event) {
        const button = event.currentTarget;
        const recipientId = button.dataset.id;
        if (!recipientId) return;

        if (confirm(`Bạn có chắc chắn muốn xoá người nhận này (ID: ${recipientId})?`)) {
             button.disabled = true; button.textContent = 'Đang xoá...';
             await deleteRecipient(recipientId);
             button.disabled = false; button.textContent = 'Xoá'; // Restore button if needed (e.g., on error)
        }
    }


    // ==========================
    // Add Edit Event Listeners (Placeholder - implement modal logic)
    // ==========================
     function addEditEventListeners() {
        const tbody = document.querySelector(".main-content tbody");
        if (!tbody) return;
        tbody.querySelectorAll('.btn-edit').forEach(button => {
            button.removeEventListener('click', handleEditClick);
            button.addEventListener('click', handleEditClick);
        });
    }

    // Handler for edit click (Placeholder)
    function handleEditClick(event) {
        const recipientId = event.currentTarget.dataset.id;
        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient) {
            console.log("✏️ Edit recipient:", recipient);
            alert(`Chức năng sửa cho ID ${recipientId} chưa được cài đặt.`);
            // TODO: Implement logic to open the modal and pre-fill form fields
            // Example:
            // populateEditForm(recipient);
            // showModal(); // Assuming showModal is globally accessible or part of RecipientsData
        } else {
             console.error(`❌ Không tìm thấy recipient với ID ${recipientId} để sửa.`);
        }
    }


    // ==========================
    // Thêm mới người nhận
    // ==========================
    async function createRecipient() {
        console.log("➕ Creating new recipient...");
         // Retrieve elements inside the function
        const fullNameInput = document.getElementById("fullName");
        const phoneInput = document.getElementById("phoneNumber");
        const addressInput = document.getElementById("address");
        const modal = document.getElementById('addRecipientModal');

        if (!fullNameInput || !phoneInput || !addressInput || !modal) {
            console.error("❌ Missing form elements in createRecipient!");
            alert("Lỗi: Không tìm thấy form thêm mới.");
            return;
        }


        const name = fullNameInput.value.trim();
        const phone = phoneInput.value.trim();
        const addressDetail = addressInput.value.trim(); // Changed variable name for clarity

        if (!name || !phone || !addressDetail) {
            alert("⚠️ Vui lòng nhập đầy đủ Họ tên, SĐT và Địa chỉ chi tiết!");
            return;
        }

        // --- Basic phone validation (Vietnamese format) ---
        const phoneRegex = /^(0[3|5|7|8|9])[0-9]{8}$/;
        if (!phoneRegex.test(phone)) {
             alert("⚠️ Số điện thoại không hợp lệ. Vui lòng nhập SĐT Việt Nam gồm 10 chữ số (vd: 09xxxxxxxx).");
             return;
        }
        // --- End phone validation ---

        const newRecipient = {
            name,
            phone,
            address: { // Structure expected by API
                detail: addressDetail,
                // --- Giả định Tỉnh/Huyện/Xã - Cần lấy từ dropdowns/API địa chỉ nếu có ---
                province: "TP. Hồ Chí Minh", // Placeholder
                district: "Quận 1",       // Placeholder
                ward: "Phường Bến Nghé"  // Placeholder
                // --- Kết thúc giả định ---
            },
            tags: [] // Default empty tags
        };

        const token = getAccessToken ? getAccessToken() : null; // Check if function exists

        try {
             // Optional: Disable button during request
             const submitBtn = document.getElementById('submitRecipientBtn');
             if(submitBtn) submitBtn.disabled = true; submitBtn.textContent = 'Đang thêm...';


            const url = `${API_BASE_URL}/receivers/insert`;
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

             console.log("📤 Sending create request to:", url, "with payload:", newRecipient);

            const res = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(newRecipient)
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.error(`❌ HTTP ${res.status} khi tạo recipient:`, errorText);
                throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
            }
            const result = await res.json();
             const createdData = result.result || result.data || result; // Handle wrapper
            console.log("✅ Recipient created:", createdData);


            // Cập nhật danh sách (optional - loadRecipients already does this)
            // recipients.push(createdData);
            // renderTable(); // Update UI immediately

            // Hoặc đơn giản là tải lại toàn bộ danh sách
            await loadRecipients(); // Reload the list from server


            modal.classList.add('hidden'); // Hide modal
            // Reset form fields
            fullNameInput.value = "";
            phoneInput.value = "";
            addressInput.value = "";

            alert("✅ Đã thêm người nhận mới thành công!");
        } catch (err) {
            console.error("❌ Lỗi khi thêm người nhận:", err);
            alert(`⚠️ Thêm người nhận thất bại: ${err.message}`);
        } finally {
             // Re-enable button
             const submitBtn = document.getElementById('submitRecipientBtn');
             if(submitBtn) submitBtn.disabled = false; submitBtn.textContent = 'Thêm mới';
        }
    }

     // ==========================
    // Xoá người nhận
    // ==========================
    async function deleteRecipient(id) {
         console.log(`➖ Deleting recipient with ID: ${id}`);
         const token = getAccessToken ? getAccessToken() : null;

         try {
             const url = `${API_BASE_URL}/receivers/delete/${id}`; // Assuming DELETE endpoint
             const headers = { 'Content-Type': 'application/json' };
             if (token) headers["Authorization"] = `Bearer ${token}`;

              console.log("📤 Sending delete request to:", url);

             const res = await fetch(url, {
                 method: "DELETE",
                 headers
             });

             if (!res.ok) {
                 const errorText = await res.text();
                 console.error(`❌ HTTP ${res.status} khi xoá recipient:`, errorText);
                 throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
             }

             // Assuming successful deletion returns 200/204 or a confirmation message
             console.log("✅ Recipient deleted successfully:", id);

              // Remove from local array and re-render OR reload the whole list
             // Option 1: Remove locally (faster UI update)
             recipients = recipients.filter(r => r.id !== id);
             renderTable();
             // Option 2: Reload from server (ensures consistency)
             // await loadRecipients();

             alert(`✅ Đã xoá người nhận (ID: ${id}) thành công!`);

         } catch (err) {
             console.error("❌ Lỗi khi xoá người nhận:", err);
             alert(`⚠️ Xoá người nhận thất bại: ${err.message}`);
             // Reload list to ensure UI is correct even if delete failed locally
             await loadRecipients();
         }
    }


    // ==========================
    // Public methods
    // ==========================
    return {
        loadRecipients,
        createRecipient,
        deleteRecipient
        // Add editRecipient later if needed
    };

})();

// --- REMOVED document.addEventListener("DOMContentLoaded") ---
// Initialization logic (like loadRecipients) and event binding (like createRecipient)
// should now be called from within the initRecipientsPage function in recipients.html
console.log("🔧 recipients-data.js script executed. Waiting for initRecipientsPage() to call RecipientsData methods.");