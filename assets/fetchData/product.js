/**
 * PRODUCT AUTOCOMPLETE MODULE
 * Handles product suggestions and auto-fill functionality
 */

window.ProductData = (function () {
  "use strict";

  let productsData = [];
  let isLoading = false;

  // Initialize product data
  async function init() {
    await loadProductsData();
    // Return whether products were loaded so callers can react
    return Array.isArray(productsData) && productsData.length > 0;
  }

  // Load products from backend API, fallback to local JSON
  async function loadProductsData() {
    if (isLoading || productsData.length > 0) return;

    isLoading = true;
    try {
      const apiBase = window.API_CONFIG?.BASE_URL || '';
      const token = window.API_CONFIG?.getAccessToken?.() || null;

      // Helper: try to extract an array from various response shapes
      function extractProductsFromResponse(obj) {
        if (!obj) return [];
        if (Array.isArray(obj)) return obj;
        // Common keys where arrays may be nested
        const candidates = ['data', 'products', 'items', 'result', 'payload'];
        for (const key of candidates) {
          if (Array.isArray(obj[key])) return obj[key];
          // nested under data -> items
          if (obj[key] && typeof obj[key] === 'object') {
            for (const k2 of ['items', 'products', 'data']) {
              if (Array.isArray(obj[key][k2])) return obj[key][k2];
            }
          }
        }
        // As a last resort, search for the first array value inside object
        for (const val of Object.values(obj)) {
          if (Array.isArray(val)) return val;
        }
        return [];
      }

      if (apiBase) {
        try {
          const url = `${apiBase.replace(/\/$/, '')}/orders/packages`;
          console.info('[ProductData] Trying API:', url);
          const headers = { 'Content-Type': 'application/json' };
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const resp = await fetch(url, { headers });
          console.info('[ProductData] API response status:', resp.status);
          if (resp.ok) {
            // Attempt to parse JSON and extract product array robustly
            const data = await resp.json();
            const extracted = extractProductsFromResponse(data);
            productsData = extracted;
            console.info('[ProductData] Loaded products from API, count=', productsData.length);
            return;
          } else {
            // Log response body if possible for debugging
            let text = '';
            try { text = await resp.text(); } catch (e) { text = String(e); }
            console.warn('[ProductData] API returned', resp.status, resp.statusText, text);
          }
        } catch (err) {
          console.warn('[ProductData] Failed to fetch from API, falling back to local JSON', err);
        }
      } else {
        console.info('[ProductData] API base URL not configured (window.API_CONFIG.BASE_URL)');
      }

      // Fallback to local JSON file
      try {
        const localPath = '/assets/data/products.json';
        console.info('[ProductData] Trying local file:', localPath);
        const localResp = await fetch(localPath);
        if (localResp.ok) {
          const localData = await localResp.json();
          productsData = Array.isArray(localData) ? localData : extractProductsFromResponse(localData);
          console.info('[ProductData] Loaded products from local JSON, count=', productsData.length);
        } else {
          console.warn('[ProductData] Local products.json not available, status=', localResp.status);
        }
      } catch (errLocal) {
        console.error('[ProductData] Error loading local products.json', errLocal);
      }
    } catch (error) {
      console.error('[ProductData] Error loading products:', error);
    } finally {
      isLoading = false;
    }
  }

  // Search products by name
  function searchProducts(query) {
    if (!query) return [];

    const lowerQuery = query.toLowerCase();
    return productsData.filter((product) =>
      product.name.toLowerCase().includes(lowerQuery)
    );
  }

  // Get product by name
  function getProductByName(name) {
    return productsData.find(
      (product) => product.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Get all products
  function getAllProducts() {
    return productsData;
  }

  // Public API
  return {
    init,
    searchProducts,
    getProductByName,
    getAllProducts,
  };
})();
