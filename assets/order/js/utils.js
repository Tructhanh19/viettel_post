/**
 * UTILITIES FUNCTIONALITY
 * Common helper functions used across modules
 */

window.Utils = (function() {
  'use strict';

  // Public methods
  function init() {
    // Utils don't need specific initialization
  }

  // Number formatting
  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
      return '0';
    }
    return new Intl.NumberFormat("vi-VN").format(num);
  }

  // Price formatting
  function formatPrice(price) {
    if (typeof price !== 'number' || isNaN(price)) {
      return '0 đ';
    }
    return formatNumber(price) + ' đ';
  }

  // Currency parsing (remove dots and convert to number)
  function parsePrice(priceString) {
    if (typeof priceString !== 'string') {
      return 0;
    }
    // Remove dots, commas, spaces and 'đ' symbol
    const cleaned = priceString.replace(/[^\d]/g, '');
    return parseInt(cleaned) || 0;
  }

  // Phone number validation
  function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') {
      return false;
    }
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    return phoneRegex.test(phone.trim());
  }

  // Name validation
  function isValidName(name) {
    if (!name || typeof name !== 'string') {
      return false;
    }
    return name.trim().length >= 2;
  }

  // Email validation
  function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  // Address validation
  function isValidAddress(address) {
    if (!address || typeof address !== 'string') {
      return false;
    }
    return address.trim().length >= 5;
  }

  // Generate unique ID
  function generateId(prefix = 'id') {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Debounce function
  function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
      const context = this;
      const args = arguments;
      const later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  }

  // Throttle function
  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Deep clone object
  function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    if (obj instanceof Array) {
      return obj.map(item => deepClone(item));
    }
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Check if element is visible
  function isElementVisible(element) {
    if (!element) return false;
    return element.offsetWidth > 0 && element.offsetHeight > 0;
  }

  // Scroll to element smoothly
  function scrollToElement(element, offset = 0) {
    if (!element) return;
    
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  }

  // Show/hide element with animation
  function slideDown(element, duration = 300) {
    if (!element) return;
    
    element.style.removeProperty('display');
    let display = window.getComputedStyle(element).display;
    if (display === 'none') display = 'block';
    element.style.display = display;
    
    let height = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    element.offsetHeight;
    element.style.boxSizing = 'border-box';
    element.style.transitionProperty = "height, margin, padding";
    element.style.transitionDuration = duration + 'ms';
    element.style.height = height + 'px';
    element.style.removeProperty('padding-top');
    element.style.removeProperty('padding-bottom');
    element.style.removeProperty('margin-top');
    element.style.removeProperty('margin-bottom');
    
    window.setTimeout(() => {
      element.style.removeProperty('height');
      element.style.removeProperty('overflow');
      element.style.removeProperty('transition-duration');
      element.style.removeProperty('transition-property');
    }, duration);
  }

  function slideUp(element, duration = 300) {
    if (!element) return;
    
    element.style.transitionProperty = 'height, margin, padding';
    element.style.transitionDuration = duration + 'ms';
    element.style.boxSizing = 'border-box';
    element.style.height = element.offsetHeight + 'px';
    element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;
    
    window.setTimeout(() => {
      element.style.display = 'none';
      element.style.removeProperty('height');
      element.style.removeProperty('padding-top');
      element.style.removeProperty('padding-bottom');
      element.style.removeProperty('margin-top');
      element.style.removeProperty('margin-bottom');
      element.style.removeProperty('overflow');
      element.style.removeProperty('transition-duration');
      element.style.removeProperty('transition-property');
    }, duration);
  }

  // Local storage helpers
  function setLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
      return false;
    }
  }

  function getLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return defaultValue;
    }
  }

  function removeLocalStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Error removing from localStorage:', e);
      return false;
    }
  }

  // Date helpers
  function formatDate(date, format = 'dd/mm/yyyy') {
    if (!date) return '';
    if (typeof date === 'string') date = new Date(date);
    if (!(date instanceof Date) || isNaN(date)) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return format
      .replace('dd', day)
      .replace('mm', month)
      .replace('yyyy', year);
  }

  function parseDate(dateString, format = 'dd/mm/yyyy') {
    if (!dateString) return null;
    
    try {
      if (format === 'dd/mm/yyyy') {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          return new Date(parts[2], parts[1] - 1, parts[0]);
        }
      }
      return new Date(dateString);
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  }

  // Error handling
  function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // In production, you might want to send to error tracking service
    if (window.ErrorTracker) {
      window.ErrorTracker.log(error, context);
    }
  }

  // Public API
  return {
    init,
    formatNumber,
    formatPrice,
    parsePrice,
    isValidPhone,
    isValidName,
    isValidEmail,
    isValidAddress,
    generateId,
    debounce,
    throttle,
    deepClone,
    isElementVisible,
    scrollToElement,
    slideDown,
    slideUp,
    setLocalStorage,
    getLocalStorage,
    removeLocalStorage,
    formatDate,
    parseDate,
    handleError
  };
})();