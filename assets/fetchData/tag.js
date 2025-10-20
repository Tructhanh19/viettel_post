/**
 * TAG DATA MODULE
 * Handles loading and managing customer tags from JSON
 */

window.TagData = (function () {
  "use strict";

  let tags = [];
  let isInitialized = false;

  /**
   * Initialize and load tag data from JSON
   */
  async function init() {
    if (isInitialized) {
      return;
    }


    try {
      const response = await fetch("../assets/data/tag.json");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      tags = await response.json();

      isInitialized = true;
    } catch (error) {
      console.error("Error loading tag data:", error);
      tags = [];
    }
  }

  /**
   * Get all tags
   * @returns {Array} Array of all tags
   */
  function getAllTags() {
    return tags;
  }

  /**
   * Get tag by code
   * @param {string} code - Tag code
   * @returns {Object|null} Tag object or null if not found
   */
  function getTagByCode(code) {
    return tags.find((tag) => tag.code === code) || null;
  }

  /**
   * Search tags by name
   * @param {string} keyword - Search keyword
   * @returns {Array} Filtered tags
   */
  function searchTags(keyword) {
    if (!keyword || keyword.trim() === "") {
      return tags;
    }

    const lowerKeyword = keyword.toLowerCase();
    return tags.filter(
      (tag) =>
        tag.name.toLowerCase().includes(lowerKeyword) ||
        tag.code.toLowerCase().includes(lowerKeyword)
    );
  }

  // Public API
  return {
    init,
    getAllTags,
    getTagByCode,
    searchTags,
  };
})();
