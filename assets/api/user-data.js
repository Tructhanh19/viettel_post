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
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

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
          ? result.profiles.map((p) => ({
              name: p.name,
              phone_number: p.phone_number || p.phoneNumber,
              address: p.address || {},
              is_default: p.is_default ?? p.default ?? false,
            }))
          : [],
      };

      return normalized;
    } catch (error) {
      console.error("❌ Lỗi fetchUserById:", error);
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
      // Prepare profile data for PATCH API
      const patchData = {
        name: profileData.name,
        phoneNumber: profileData.phone_number, // API expects phoneNumber
        address: profileData.address,
        isDefault: profileData.is_default ?? profileData.default ?? false, // API expects isDefault
      };

      // If editing, add index to identify which profile to update
      if (typeof profileData.index === "number") {
        patchData.index = profileData.index;
      }

      // Use PATCH API for profiles
      const url = `${API_BASE_URL}/users/update/${userId}/profiles`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: "PATCH",
        headers,
        body: JSON.stringify(patchData),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const response = await res.json();

      // Update local users cache
      if (response.result) {
        const updatedUser = response.result;
        const userIndex = users.findIndex(
          (u) => u.id === userId || u._id === userId
        );
        if (userIndex >= 0) {
          users[userIndex] = {
            id: updatedUser.id || updatedUser._id,
            username: updatedUser.username,
            name: updatedUser.name,
            phone_number: updatedUser.phoneNumber || updatedUser.phone_number,
            email: updatedUser.email,
            roles: updatedUser.roles || [],
            active: updatedUser.active ?? updatedUser.is_active,
            address: updatedUser.address || {},
            profiles: Array.isArray(updatedUser.profiles)
              ? updatedUser.profiles.map((p) => ({
                  name: p.name,
                  phone_number: p.phoneNumber || p.phone_number,
                  address: p.address || {},
                  is_default: p.default ?? p.isDefault ?? false,
                }))
              : [],
          };
        }
      }

      return response;
    } catch (error) {
      console.error("❌ updateProfile error:", error);
      throw error;
    }
  }

  async function deleteProfile(userId, profileIndex) {
    try {
      // First fetch current user data to get existing profiles
      const currentUser = await fetchUserById(userId);
      let profiles = Array.isArray(currentUser.profiles)
        ? [...currentUser.profiles]
        : [];

      // Remove profile at specified index
      if (profileIndex >= 0 && profileIndex < profiles.length) {
        profiles.splice(profileIndex, 1);

        // If we deleted the default profile and there are other profiles, make the first one default
        const hasDefault = profiles.some((p) => p.is_default || p.default);
        if (!hasDefault && profiles.length > 0) {
          profiles[0].default = true;
        }
      } else {
        throw new Error(`Profile index ${profileIndex} is out of bounds`);
      }

      // Update user with new profiles array
      const url = `${API_BASE_URL}/users/update/${userId}`;
      const token = getAccessToken();
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const updatedUser = { ...currentUser, profiles };

      const res = await fetch(url, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedUser),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      await loadUsersFromAPI();
      return true;
    } catch (error) {
      console.error("❌ deleteProfile error:", error);
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
    const found =
      user.profiles.find((p) => p.is_default) || user.profiles[0] || null;
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
    deleteProfile,
    formatUserOption,
    getDefaultProfile,
  };
})();
