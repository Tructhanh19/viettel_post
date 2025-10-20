window.UserData = (function () {
  "use strict";

  const API_BASE_URL = window.API_CONFIG.BASE_URL;
  const getAccessToken = window.API_CONFIG.getAccessToken;

  let users = [];
  let isLoading = false;

  /**
   * -----------------------------------------------------
   * Init module - load danh sách người gửi từ API
   * -----------------------------------------------------
   */
  async function init() {
    if (isLoading) {
      return false;
    }

    try {
      isLoading = true;
      await loadUsersFromAPI();
      return true;
    } catch (error) {
      return false;
    } finally {
      isLoading = false;
    }
  }

  /**
   * -----------------------------------------------------
   * Load danh sách người gửi từ API
   * -----------------------------------------------------
   */
  async function loadUsersFromAPI() {
    try {
      const url = `${API_BASE_URL}/users/get-all`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(url, { headers });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      users = Array.isArray(data) ? data : data.data || data.users || [];
    } catch (error) {
      users = [];
      throw error;
    }
  }

  /**
   * -----------------------------------------------------
   * CRUD METHODS
   * -----------------------------------------------------
   */
  function getAllUsers() {
    return users;
  }

  function getUserById(id) {
    return users.find((r) => r._id === id || r.id === id);
  }

  // async function fetchUserById(id) {
  //   try {
  //     const url = `${API_BASE_URL}/users/find?id=${id}`;
  //     const token = getAccessToken();
  //     const headers = { "Content-Type": "application/json" };
  //     if (token) headers["Authorization"] = `Bearer ${token}`;

  //     const res = await fetch(url, { headers });
  //     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
  //     return await res.json();
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async function fetchUserById(id) {
    try {
      const url = `${API_BASE_URL}/users/find?id=${id}`;
      const token = getAccessToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = await res.json();
      const result = json.result || json.data || json; // hỗ trợ các dạng response

      // Chuẩn hóa dữ liệu để tránh xung đột key Mongo vs API
      const normalized = {
        id: result.id || result._id?.$oid || result._id || id,
        username: result.username,
        name: result.name,
        phone_number: result.phone_number || result.phoneNumber,
        email: result.email,
        roles: result.roles || [],
        active: result.active ?? result.is_active,
        address: result.address || {},
        profiles: Array.isArray(result.profiles)
          ? result.profiles.map(p => ({
              name: p.name,
              phone_number: p.phone_number || p.phoneNumber,
              address: p.address || {},
              is_default: p.is_default ?? p.default ?? false
            }))
          : []
      };

      return normalized;
    } catch (error) {
      console.error('❌ Lỗi fetchUserById:', error);
      throw error;
    }
  }

  async function createUser(data) {
    try {
      const url = `${API_BASE_URL}/users/insert`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const newUser = await res.json();

      await loadUsersFromAPI();
      return newUser;
    } catch (error) {
      throw error;
    }
  }

  async function updateUser(id, data) {
    try {
      const url = `${API_BASE_URL}/users/update/${id}`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const updated = await res.json();

      await loadUsersFromAPI();
      return updated;
    } catch (error) {
      throw error;
    }
  }

  async function deleteUser(id) {
    try {
      const url = `${API_BASE_URL}/users/delete/${id}`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { method: "DELETE", headers });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      await loadUsersFromAPI();
      return true;
    } catch (error) {
      throw error;
    }
  }

  // add and update profile
async function updateProfile(userId, profileData) {
  try {
    const url = `${API_BASE_URL}/users/update/${userId}/profiles`;
    const token = getAccessToken();
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(profileData),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const updated = await res.json();
    return updated;
  } catch (error) {
    console.error("❌ updateProfile error:", error);
    throw error;
  }
}

  /**
   * -----------------------------------------------------
   * Utility Methods
   * -----------------------------------------------------
   */
  function searchUsers(term) {
    const t = term.toLowerCase();
    return users.filter(
      (r) => r.name?.toLowerCase().includes(t) || r.phone_number?.includes(term)
    );
  }

  function filterByStatus(status) {
    if (!status) return users;
    const isActive = status === "Đang hoạt động";
    return users.filter((r) => r.is_active === isActive);
  }

  function formatUserOption(r) {
    return `${r.name} - ${r.address} - ${r.phone_number}`;
  }

  async function refresh() {
    return await init();
  }

  function getDefaultProfile(user) {
    if (!user || !Array.isArray(user.profiles)) return null;
    const found = user.profiles.find(p => p.is_default) || user.profiles[0] || null;
    return found;
  }


  return {
    init,
    refresh,
    getAllUsers,
    getUserById,
    fetchUserById,
    searchUsers,
    filterByStatus,
    createUser,
    updateUser,
    deleteUser,
    updateProfile,
    formatUserOption,
    getDefaultProfile
  };
})();
