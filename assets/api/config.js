window.API_CONFIG = {
  BASE_URL: 'http://localhost:8585/api/v1', // 👈 URL backend cố định
  getAccessToken: function () {
    return (
      localStorage.getItem('accessToken') ||
      sessionStorage.getItem('accessToken') ||
      ''
    );
  }
};