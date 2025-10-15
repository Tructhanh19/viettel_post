/**
 * AUTHENTICATION MODULE
 * Handles login, logout, and auth state management
 */

window.Auth = (function() {
  'use strict';

  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  /**
   * Get access token
   */
  function getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get username
   */
  function getUsername() {
    return localStorage.getItem('username');
  }

  /**
   * Logout user
   */
  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('username');
    sessionStorage.clear();
    
    console.log('✅ User logged out');
    
    // Redirect to login page
    window.location.href = 'login.html';
  }

  /**
   * Require authentication (redirect to login if not authenticated)
   */
  function requireAuth() {
    if (!isAuthenticated()) {
      console.log('⚠️ Not authenticated, redirecting to login...');
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  /**
   * Initialize auth UI (username display, logout button)
   */
  function initAuthUI() {
    const username = getUsername();
    
    // Display username in UI
    const usernameDisplays = document.querySelectorAll('.user-name, .username-display');
    usernameDisplays.forEach(el => {
      if (username) {
        el.textContent = username;
      }
    });

    // Setup logout buttons
    const logoutBtns = document.querySelectorAll('[data-logout], .logout-btn, #logoutBtn');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
          logout();
        }
      });
    });
  }

  // Public API
  return {
    isAuthenticated,
    getAccessToken,
    getUsername,
    logout,
    requireAuth,
    initAuthUI
  };
})();

// Auto-require auth on protected pages (except login/register pages)
window.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname;
  
  // Skip auth check on login/register pages
  if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
    return;
  }

  // Require authentication for all other pages
  if (window.Auth && window.Auth.requireAuth()) {
    window.Auth.initAuthUI();
  }
});
