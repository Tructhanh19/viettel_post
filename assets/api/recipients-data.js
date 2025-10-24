window.RecipientsData = (function () {
  'use strict';

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  let allRecipients = [];
  let isLoading = false;

  /**
   * -----------------------------------------------------
   * Init module - load danh sách người nhận từ API
   * -----------------------------------------------------
   */
  async function init() {
    if (isLoading) {
      console.log('⏳ RecipientsData đang load, bỏ qua...');
      return false;
    }

    try {
      isLoading = true;
      await loadRecipientsFromAPI();
      console.log(`✅ RecipientsData loaded (${allRecipients.length}) items`);
      return true;
    } catch (error) {
      console.error('❌ RecipientsData init failed:', error);
      return false;
    } finally {
      isLoading = false;
    }
  }

  /**
   * -----------------------------------------------------
   * Load danh sách người nhận từ API
   * -----------------------------------------------------
   */
  async function loadRecipientsFromAPI() {
    try {
      const url = `${API_BASE_URL}/receivers/get-all`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching recipients from:', url);
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      allRecipients = Array.isArray(data)
        ? data
        : data.data || data.result || data.recipients || [];

      console.log('📦 Loaded recipients:', allRecipients.length);
    } catch (error) {
      console.error('❌ Error loading recipients from API:', error);
      allRecipients = [];
      throw error;
    }
  }

  /**
   * -----------------------------------------------------
   * CRUD METHODS
   * -----------------------------------------------------
   */
  function getAllRecipients() {
    return allRecipients;
  }

  function getRecipientById(id) {
    return allRecipients.find(r => r._id === id || r.id === id);
  }

  async function fetchRecipientById(id) {
    try {
      const url = `${API_BASE_URL}/receivers/get?id=${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('❌ Error fetching recipient by ID:', error);
      throw error;
    }
  }

  /**
   * Tạo người nhận mới
   */
  async function createRecipient(recipientInfo) {
    try {
      const url = `${API_BASE_URL}/receivers/insert`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        name: recipientInfo.name,
        phone: recipientInfo.phone,
        tags: recipientInfo.tags || [],
        address: recipientInfo.address || null
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newRecipient = await res.json();

      await loadRecipientsFromAPI();
      console.log('✅ Recipient created:', newRecipient);
      return newRecipient;
    } catch (error) {
      console.error('❌ Error creating recipient:', error);
      throw error;
    }
  }

  /**
   * Cập nhật người nhận
   */
  async function updateRecipient(id, data) {
  try {
    const url = `${API_BASE_URL}/receivers/update/${id}`;
    const token = getAccessToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Đảm bảo rằng `tags` luôn được truyền vào
    const payload = {
      name: data.name,
      phone: data.phone,
      tags: data.tags || [],
      address: data.address || null
    };

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload) // Gửi dữ liệu đúng với cấu trúc
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const updated = await res.json();

    await loadRecipientsFromAPI();
    console.log('✅ Recipient updated:', updated);
    return updated;
  } catch (error) {
    console.error('❌ Error updating recipient:', error);
    throw error;
  }
}

  /**
   * Xóa người nhận
   */
  async function deleteRecipient(id) {
    try {
      const url = `${API_BASE_URL}/receivers/delete/${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      await loadRecipientsFromAPI();
      console.log('✅ Recipient deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting recipient:', error);
      throw error;
    }
  }

  /**
   * -----------------------------------------------------
   * Utility Methods
   * -----------------------------------------------------
   */
  function searchRecipients(term) {
    const t = term.toLowerCase();
    return allRecipients.filter(r =>
      r.name?.toLowerCase().includes(t) ||
      r.phone?.includes(term)
    );
  }

  function filterByStatus(status) {
    if (!status) return allRecipients;
    const isActive = status === 'Đang hoạt động';
    return allRecipients.filter(r => r.isActive === isActive);
  }

  function formatRecipientOption(r) {
    return `${r.name} - ${r.address} - ${r.phone}`;
  }

  async function refresh() {
    return await init();
  }

  return {
    init,
    refresh,
    getAllRecipients,
    getRecipientById,
    fetchRecipientById,
    searchRecipients,
    filterByStatus,
    createRecipient,
    updateRecipient,
    deleteRecipient,
    formatRecipientOption
  };
})();
