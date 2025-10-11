/**
 * TAG SYSTEM FUNCTIONALITY
 * Handles customer tags, modal, selection logic
 */

window.Tags = (function() {
  'use strict';

  // Tag system data
  const CUSTOMER_TAGS = [
    {
      name: "Khách hàng thân thiết",
      code: "CLOSE",
      color_code: "#44ab4d",
    },
    {
      name: "Khách hàng VIP",
      code: "VIP", 
      color_code: "#eb9642",
    },
    {
      name: "Khách hàng mới",
      code: "NEW",
      color_code: "#3b9ef4",
    },
    {
      name: "Bom hàng",
      code: "BOM",
      color_code: "#ee004c",
    },
    {
      name: "Tín nhiệm thấp",
      code: "LOW_EXPECTATION",
      color_code: "#d37cd9",
    },
  ];

  // Private variables
  let selectedTags = [];

  // Public methods
  function init() {
    initTagSystem();
  }

  // Tag system functionality
  function initTagSystem() {
    const addTagBtn = document.getElementById("addTagBtn");
    const tagModal = document.getElementById("tagModal");
    const closeTagModal = document.getElementById("closeTagModal");
    const availableTags = document.getElementById("availableTags");

    if (!addTagBtn || !tagModal || !closeTagModal || !availableTags) {
      return;
    }

    // Populate available tags
    populateAvailableTags();

    // Add tag button click
    addTagBtn.addEventListener("click", function () {
      tagModal.style.display = "flex";
    });

    // Close modal
    closeTagModal.addEventListener("click", function () {
      tagModal.style.display = "none";
    });

    // Close modal when clicking outside
    tagModal.addEventListener("click", function (e) {
      if (e.target === tagModal) {
        tagModal.style.display = "none";
      }
    });
  }

  function populateAvailableTags() {
    const availableTags = document.getElementById("availableTags");
    if (!availableTags) return;

    availableTags.innerHTML = "";

    CUSTOMER_TAGS.forEach((tag) => {
      const tagElement = document.createElement("div");
      tagElement.className = "available-tag";
      tagElement.setAttribute("data-code", tag.code);

      // Check if tag is already selected
      const isSelected = selectedTags.some(
        (selectedTag) => selectedTag.code === tag.code
      );
      if (isSelected) {
        tagElement.classList.add("selected");
      }

      tagElement.innerHTML = `
            <div class="tag-color-indicator" style="background-color: ${tag.color_code}"></div>
            <span class="tag-name">${tag.name}</span>
            <span class="tag-code">${tag.code}</span>
        `;

      tagElement.addEventListener("click", function () {
        toggleTagSelection(tag, tagElement);
      });

      availableTags.appendChild(tagElement);
    });
  }

  function toggleTagSelection(tag, element) {
    const isSelected = selectedTags.some(
      (selectedTag) => selectedTag.code === tag.code
    );

    if (isSelected) {
      // Remove tag
      selectedTags = selectedTags.filter(
        (selectedTag) => selectedTag.code !== tag.code
      );
      element.classList.remove("selected");
    } else {
      // Add tag
      selectedTags.push(tag);
      element.classList.add("selected");
    }

    updateTagsDisplay();
  }

  function updateTagsDisplay() {
    const tagsContainer = document.getElementById("tagsContainer");
    if (!tagsContainer) return;

    tagsContainer.innerHTML = "";

    selectedTags.forEach((tag) => {
      const tagElement = document.createElement("div");
      tagElement.className = "customer-tag";
      tagElement.style.backgroundColor = tag.color_code;

      tagElement.innerHTML = `
            <span>${tag.name}</span>
            <button class="tag-remove" data-code="${tag.code}">
                <i class="fas fa-times"></i>
            </button>
        `;

      // Add remove functionality
      const removeBtn = tagElement.querySelector(".tag-remove");
      removeBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        removeTag(tag.code);
      });

      tagsContainer.appendChild(tagElement);
    });
  }

  function removeTag(tagCode) {
    selectedTags = selectedTags.filter((tag) => tag.code !== tagCode);
    updateTagsDisplay();
    populateAvailableTags(); // Refresh available tags to update selection state
  }

  // Add a tag programmatically
  function addTag(tagCode) {
    const tag = CUSTOMER_TAGS.find(t => t.code === tagCode);
    if (tag && !selectedTags.some(t => t.code === tagCode)) {
      selectedTags.push(tag);
      updateTagsDisplay();
      populateAvailableTags();
    }
  }

  // Get current selected tags
  function getSelectedTags() {
    return [...selectedTags];
  }

  // Clear all selected tags
  function clearAllTags() {
    selectedTags = [];
    updateTagsDisplay();
    populateAvailableTags();
  }

  // Set selected tags (for initialization or external setting)
  function setSelectedTags(tags) {
    selectedTags = tags.filter(tag => 
      CUSTOMER_TAGS.some(ct => ct.code === tag.code)
    );
    updateTagsDisplay();
    populateAvailableTags();
  }

  // Check if a specific tag is selected
  function hasTag(tagCode) {
    return selectedTags.some(tag => tag.code === tagCode);
  }

  // Get available tags for external use
  function getAvailableTags() {
    return [...CUSTOMER_TAGS];
  }

  // Public API
  return {
    init,
    initTagSystem,
    populateAvailableTags,
    toggleTagSelection,
    updateTagsDisplay,
    removeTag,
    addTag,
    getSelectedTags,
    clearAllTags,
    setSelectedTags,
    hasTag,
    getAvailableTags,
    CUSTOMER_TAGS
  };
})();