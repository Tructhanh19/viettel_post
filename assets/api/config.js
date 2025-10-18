window.API_CONFIG = {
  BASE_URL: 'http://localhost:8585/api/v1', // 👈 URL backend cố định
  getAccessToken: function () {
    return (
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      ''
    );
  },

  getUserId: function () {
    const token = this.getAccessToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.id || payload.sub || null;
    } catch (e) {
      console.error("Token invalid:", e);
      return null;
    }
  }
};