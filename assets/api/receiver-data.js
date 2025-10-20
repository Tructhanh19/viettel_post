window.ReceiverData = (function () {
  'use strict';

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  let receivers = [];
  let isLoading = false;

  /**
   * -----------------------------------------------------
   * Init module - load danh sách người nhận từ API
   * -----------------------------------------------------
   */
  async function init() {
    if (isLoading) {
      console.log('⏳ ReceiverData đang load, bỏ qua...');
      return false;
    }

    try {
      isLoading = true;
      await loadReceiversFromAPI();
      console.log(`✅ ReceiverData loaded (${receivers.length}) items`);
      return true;
    } catch (error) {
      console.error('❌ ReceiverData init failed:', error);
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
  async function loadReceiversFromAPI() {
    try {
      const url = `${API_BASE_URL}/receivers/get-all`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      console.log('🔄 Fetching receivers from:', url);
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      receivers = Array.isArray(data)
        ? data
        : data.data || data.receivers || [];

      console.log('📦 Loaded receivers:', receivers.length);
    } catch (error) {
      console.error('❌ Error loading receivers from API:', error);
      receivers = [];
      throw error;
    }
  }

  /**
   * -----------------------------------------------------
   * CRUD METHODS
   * -----------------------------------------------------
   */
  function getAllReceivers() {
    return receivers;
  }

  function getReceiverById(id) {
    return receivers.find(r => r._id === id || r.id === id);
  }

  async function fetchReceiverById(id) {
    try {
      const url = `${API_BASE_URL}/receivers/get?id=${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('❌ Error fetching receiver by ID:', error);
      throw error;
    }
  }

  /**
   * Create receiver with correct payload format
   * @param {Object} receiverInfo - { name, phone, address, branchId, tags }
   * address: { province, district, ward, other/detail }
   * branchId: string (if "Nhận tại bưu cục")
   * tags: array
   */
  async function createReceiver(receiverInfo) {
    try {
      const url = `${API_BASE_URL}/receivers/insert`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // Build payload according to API spec
      const payload = {
        name: receiverInfo.name,
        phone: receiverInfo.phone,
        address: receiverInfo.address || null,
        branchId: receiverInfo.branchId || null,
        tags: receiverInfo.tags || []
      };

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newReceiver = await res.json();

      await loadReceiversFromAPI();
      console.log('✅ Receiver created:', newReceiver);
      return newReceiver;
    } catch (error) {
      console.error('❌ Error creating receiver:', error);
      throw error;
    }
  }

  async function updateReceiver(id, data) {
    try {
      const url = `${API_BASE_URL}/receivers/update/${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const updated = await res.json();

      await loadReceiversFromAPI();
      console.log('✅ Receiver updated:', updated);
      return updated;
    } catch (error) {
      console.error('❌ Error updating receiver:', error);
      throw error;
    }
  }

  async function deleteReceiver(id) {
    try {
      const url = `${API_BASE_URL}/receivers/delete/${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { method: 'DELETE', headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      await loadReceiversFromAPI();
      console.log('✅ Receiver deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ Error deleting receiver:', error);
      throw error;
    }
  }

  /**
   * -----------------------------------------------------
   * Utility Methods
   * -----------------------------------------------------
   */
  function searchReceivers(term) {
    const t = term.toLowerCase();
    return receivers.filter(r =>
      r.name?.toLowerCase().includes(t) ||
      r.phone?.includes(term)
    );
  }

  function filterByStatus(status) {
    if (!status) return receivers;
    const isActive = status === 'Đang hoạt động';
    return receivers.filter(r => r.isActive === isActive);
  }

  function formatReceiverOption(r) {
    return `${r.name} - ${r.address} - ${r.phone}`;
  }

  async function refresh() {
    return await init();
  }

  return {
    init,
    refresh,
    getAllReceivers,
    getReceiverById,
    fetchReceiverById,
    searchReceivers,
    filterByStatus,
    createReceiver,
    updateReceiver,
    deleteReceiver,
    formatReceiverOption
  };
})();
