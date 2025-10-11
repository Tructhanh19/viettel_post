/**
 * SERVICE DATA MODULE
 * Handles loading service data from JSON files
 */

window.ServiceData = (function() {
  'use strict';

  // Private variables
  let otherServices = [];

  // Private methods
  async function loadServiceData() {
    try {
      const response = await fetch('../assets/data/orther_service.json');

      if (!response.ok) {
        throw new Error('Failed to load service data');
      }

      otherServices = await response.json();
      return true;
    } catch (error) {
      console.error('Error loading service data:', error);
      return false;
    }
  }

  // Public methods
  async function init() {
    return await loadServiceData();
  }

  function getOtherServices() {
    return otherServices;
  }

  function getServiceByCode(code) {
    return otherServices.find(service => service.code === code);
  }

  function getServiceCost(code) {
    const service = getServiceByCode(code);
    return service ? service.cost : 0;
  }

  // Public API
  return {
    init,
    getOtherServices,
    getServiceByCode,
    getServiceCost
  };
})();
