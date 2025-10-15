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
  }

  // Load products from JSON
  async function loadProductsData() {
    if (isLoading || productsData.length > 0) return;

    isLoading = true;

    try {
      const response = await fetch("../assets/data/products.json");
      if (response.ok) {
        productsData = await response.json();
      }
    } catch (error) {
      // Silent error
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
