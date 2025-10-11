/**
 * BRANCH DATA MANAGEMENT
 * Handles loading and managing branch/post office data
 */

window.BranchData = (function () {
  "use strict";

  let branchData = null;
  let isLoading = false;

  // Public methods
  async function init() {
    console.log("Initializing BranchData...");
    await loadBranchData();
  }

  // Load branch data from JSON file
  async function loadBranchData() {
    if (isLoading) {
      console.log("Already loading branch data...");
      return;
    }

    isLoading = true;
    console.log("Loading branch data from JSON...");

    try {
      const response = await fetch("../assets/data/branch.json");
      console.log("Branch data response status:", response.status);

      if (response.ok) {
        branchData = await response.json();
        console.log("Branch data loaded:", branchData.length, "branches");
      } else {
        console.error("Failed to load branch data, status:", response.status);
      }
    } catch (error) {
      console.error("Error loading branch data:", error);
    } finally {
      isLoading = false;
    }
  }

  // Get all active branches
  function getAllBranches() {
    if (!branchData) return [];
    return branchData.filter((branch) => branch.is_active);
  }

  // Get branches by province
  function getBranchesByProvince(provinceName) {
    if (!branchData) return [];

    return branchData.filter(
      (branch) =>
        branch.is_active &&
        branch.address &&
        branch.address.province &&
        branch.address.province.toLowerCase().includes(provinceName.toLowerCase())
    );
  }

  // Calculate distance between two addresses (mock implementation)
  // In real app, you would use geocoding API
  function calculateDistance(address1, address2) {
    // Mock calculation - returns random distance for demo
    // In production, use Google Maps Distance Matrix API or similar
    return (Math.random() * 3 + 0.3).toFixed(3);
  }

  // Get nearest branches based on sender address
  function getNearestBranches(senderAddress, limit = 10) {
    if (!branchData || !senderAddress) return [];

    const activeBranches = branchData.filter((branch) => branch.is_active);

    // Calculate distance for each branch
    const branchesWithDistance = activeBranches.map((branch) => {
      const branchAddress =
        branch.address &&
        `${branch.address.street || ""} ${branch.address.ward || ""} ${
          branch.address.district || ""
        } ${branch.address.province || ""}`.trim();

      return {
        ...branch,
        distance: calculateDistance(senderAddress, branchAddress),
      };
    });

    // Sort by distance and return top N
    return branchesWithDistance
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
      .slice(0, limit);
  }

  // Search branches by keyword
  function searchBranches(keyword, branches = null) {
    const searchData = branches || getAllBranches();
    if (!keyword) return searchData;

    const lowerKeyword = keyword.toLowerCase();

    return searchData.filter((branch) => {
      const name = branch.name?.toLowerCase() || "";
      const address =
        `${branch.address?.street || ""} ${branch.address?.ward || ""} ${
          branch.address?.district || ""
        } ${branch.address?.province || ""}`.toLowerCase();

      return name.includes(lowerKeyword) || address.includes(lowerKeyword);
    });
  }

  // Format branch for display
  function formatBranchDisplay(branch) {
    const address =
      branch.address &&
      `${branch.address.street || ""}, ${branch.address.ward || ""}, ${
        branch.address.district || ""
      }, ${branch.address.province || ""}`.replace(/^,\s*|,\s*,/g, ", ");

    return {
      id: branch._id?.$oid || branch._id,
      name: branch.name,
      address: address,
      phone: branch.phone,
      distance: branch.distance || "N/A",
    };
  }

  // Public API
  return {
    init,
    getAllBranches,
    getBranchesByProvince,
    getNearestBranches,
    searchBranches,
    formatBranchDisplay,
  };
})();
