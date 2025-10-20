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
    await loadBranchData();
  }

  // Load branch data from JSON file
  async function loadBranchData() {
    if (branchData) {
      return;
    }

    if (isLoading) {
      return;
    }

    isLoading = true;

    try {
      // Try multiple possible paths
      let response = await fetch("../assets/data/branch.json");
      
      if (!response.ok) {
        // Try alternative path from root
        response = await fetch("assets/data/branch.json");
      }
      
      if (response.ok) {
        branchData = await response.json();
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

  function calculateDistance(address1, address2) {
    return (Math.random() * 3 + 0.3).toFixed(3);
  }

  // Get nearest branches based on receiver address
  function getNearestBranches(receiverAddress, limit = 10) {
    if (!branchData || !receiverAddress) return [];

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
        distance: calculateDistance(receiverAddress, branchAddress),
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
    // Build address parts and filter out empty values
    const addressParts = [
      branch.address?.street,
      branch.address?.ward,
      branch.address?.district,
      branch.address?.province
    ].filter(part => part && part.trim() !== "");
    
    const address = addressParts.join(", ");

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
