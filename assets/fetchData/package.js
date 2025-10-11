/**
 * PACKAGE DATA MODULE
 * Handles loading package types and package features from JSON files
 */

window.PackageData = (function() {
  'use strict';

  // Private variables
  let packageTypes = [];
  let packageFeatures = [];

  // Private methods
  async function loadPackageData() {
    try {
      const [typesResponse, featuresResponse] = await Promise.all([
        fetch('../assets/data/package_type.json'),
        fetch('../assets/data/package_feature.json')
      ]);

      if (!typesResponse.ok || !featuresResponse.ok) {
        throw new Error('Failed to load package data');
      }

      packageTypes = await typesResponse.json();
      packageFeatures = await featuresResponse.json();

      return true;
    } catch (error) {
      console.error('Error loading package data:', error);
      return false;
    }
  }

  // Public methods
  async function init() {
    return await loadPackageData();
  }

  function getPackageTypes() {
    return packageTypes;
  }

  function getPackageFeatures() {
    return packageFeatures;
  }

  function getFeaturesByPackageType(packageTypeCode) {
    return packageFeatures.filter(feature => feature.package_type_code === packageTypeCode);
  }

  function getFeatureCost(featureCode) {
    const feature = packageFeatures.find(f => f.code === featureCode);
    return feature ? feature.cost : 0;
  }

  // Public API
  return {
    init,
    getPackageTypes,
    getPackageFeatures,
    getFeaturesByPackageType,
    getFeatureCost
  };
})();
