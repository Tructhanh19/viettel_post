/**
 * PICKUP TIME FUNCTIONALITY
 * Handles pickup time selection, time slots, modal
 */

window.Pickup = (function() {
  'use strict';

  // Public methods
  function init() {
    initTimePickerModal();
    initTimeBasedConditions();
  }

  function initTimePickerModal() {
    // Time picker functionality
    const timePickerBtn = document.getElementById("timePickerBtn");
    const timePickerModal = document.getElementById("timePickerModal");
    const selectedTimeDisplay = document.getElementById("selectedTimeDisplay");
    const pickupTimeSection = document.getElementById("pickupTimeSection");

    if (timePickerBtn && timePickerModal) {
      // Toggle modal
      timePickerBtn.addEventListener("click", function () {
        const isVisible = timePickerModal.style.display !== "none";
        timePickerModal.style.display = isVisible ? "none" : "block";

        // Toggle active class for styling
        if (isVisible) {
          timePickerBtn.classList.remove("active");
        } else {
          timePickerBtn.classList.add("active");
        }
      });

      // Close modal when clicking outside
      document.addEventListener("click", function (e) {
        if (pickupTimeSection && !pickupTimeSection.contains(e.target)) {
          timePickerModal.style.display = "none";
          timePickerBtn.classList.remove("active");
        }
      });
    }
  }

  // Initialize time-based conditions
  function initTimeBasedConditions() {
    const now = new Date();
    const currentHour = now.getHours();

    // Get elements
    const todayTab = document.getElementById("today-tab");
    const todayTabPane = document.getElementById("today");
    const tomorrowTab = document.getElementById("tomorrow-tab");
    const tomorrowTabPane = document.getElementById("tomorrow");
    const todayTimeSlots = todayTabPane?.querySelector(".time-slots-list");

    if (!todayTab || !todayTabPane || !tomorrowTab || !tomorrowTabPane) {
      return;
    }

    // Get real dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    // Format dates as DD/MM/YYYY
    const formatDate = (date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const todayStr = formatDate(today);
    const tomorrowStr = formatDate(tomorrow);
    const dayAfterStr = formatDate(dayAfter);

    // Update tab labels with real dates
    const dayAfterTab = document.getElementById("dayafter-tab");
    if (todayTab) todayTab.textContent = `Hôm nay (${todayStr})`;
    if (tomorrowTab) tomorrowTab.textContent = `Ngày mai (${tomorrowStr})`;
    if (dayAfterTab) dayAfterTab.textContent = `Ngày kia (${dayAfterStr})`;

    // Full time slots for tomorrow and day after
    const fullTimeSlots = [
      { time: "Cả ngày", date: tomorrowStr },
      { time: "Sáng (7h30 - 12h00)", date: tomorrowStr },
      { time: "Chiều (13h30 - 18h00)", date: tomorrowStr },
      { time: "Tối (18h30 - 21h00)", date: tomorrowStr },
    ];

    // Define available slots for today based on current time
    let todayAvailableSlots = [];
    let showTodayTab = true;

    if (currentHour < 16) {
      // Before 16:00: Can pick up today with time restrictions
      if (currentHour >= 6 && currentHour < 12) {
        // Morning (6:00 - 12:00): Hide "Sáng" and "Cả ngày", show "Chiều" and "Tối"
        todayAvailableSlots = [
          { time: "Chiều (13h30 - 18h00)", date: todayStr },
          { time: "Tối (18h30 - 21h00)", date: todayStr },
        ];
      } else if (currentHour >= 12 && currentHour < 16) {
        // Afternoon (12:00 - 16:00): Hide "Sáng", "Cả ngày", "Chiều", show only "Tối"
        todayAvailableSlots = [
          { time: "Tối (18h30 - 21h00)", date: todayStr },
        ];
      } else {
        // Early morning (0:00 - 6:00): Show all slots for today
        todayAvailableSlots = [
          { time: "Cả ngày", date: todayStr },
          { time: "Sáng (7h30 - 12h00)", date: todayStr },
          { time: "Chiều (13h30 - 18h00)", date: todayStr },
          { time: "Tối (18h30 - 21h00)", date: todayStr },
        ];
      }
    } else {
      // After 16:00: Hide today tab completely, only show tomorrow and day after
      showTodayTab = false;
    }

    if (showTodayTab && todayAvailableSlots.length > 0 && todayTimeSlots) {
      // Update today's time slots
      todayTimeSlots.innerHTML = todayAvailableSlots
        .map(
          (slot) =>
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        )
        .join("");

      // Show today tab
      todayTab.style.display = "block";
    } else {
      // Hide today tab and make tomorrow active
      todayTab.style.display = "none";
      todayTabPane.classList.remove("show", "active");

      // Make tomorrow tab active
      tomorrowTab.classList.add("active");
      tomorrowTabPane.classList.add("show", "active");
    }

    // Ensure tomorrow and day after have full slots
    const tomorrowTimeSlots = document.querySelector("#tomorrow .time-slots-list");
    const dayAfterTimeSlots = document.querySelector("#dayafter .time-slots-list");

    if (tomorrowTimeSlots) {
      tomorrowTimeSlots.innerHTML = fullTimeSlots
        .map(
          (slot) =>
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        )
        .join("");
    }

    if (dayAfterTimeSlots) {
      const dayAfterSlots = fullTimeSlots.map((slot) => ({
        ...slot,
        date: dayAfterStr,
      }));
      dayAfterTimeSlots.innerHTML = dayAfterSlots
        .map(
          (slot) =>
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        )
        .join("");
    }

    // Re-attach event listeners for all time slots
    attachTimeSlotListeners();
  }

  function attachTimeSlotListeners() {
    document.querySelectorAll(".time-slot").forEach((slot) => {
      // Remove existing listeners to prevent duplicates
      slot.removeEventListener("click", handleTimeSlotClick);
      slot.addEventListener("click", handleTimeSlotClick);
    });
  }

  function handleTimeSlotClick() {
    // Remove selected class from all slots
    document
      .querySelectorAll(".time-slot")
      .forEach((s) => s.classList.remove("selected"));

    // Add selected class to clicked slot
    this.classList.add("selected");

    // Update display
    const date = this.getAttribute("data-date");
    const time = this.getAttribute("data-time");
    const displayElement = document.getElementById("selectedTimeDisplay");
    if (displayElement) {
      displayElement.textContent = `${date} - ${time}`;
    }

    // Close modal
    const modal = document.getElementById("timePickerModal");
    const btn = document.getElementById("timePickerBtn");
    if (modal && btn) {
      modal.style.display = "none";
      btn.classList.remove("active");
    }

    // Trigger custom event for other modules
    const timeSelectedEvent = new CustomEvent('timeSlotSelected', {
      detail: { date, time, fullText: `${date} - ${time}` }
    });
    document.dispatchEvent(timeSelectedEvent);
  }

  // Get currently selected time slot
  function getSelectedTimeSlot() {
    const selectedSlot = document.querySelector(".time-slot.selected");
    if (selectedSlot) {
      return {
        date: selectedSlot.getAttribute("data-date"),
        time: selectedSlot.getAttribute("data-time"),
        element: selectedSlot
      };
    }
    return null;
  }

  // Set selected time slot programmatically
  function setSelectedTimeSlot(date, time) {
    // Find the matching slot
    const slots = document.querySelectorAll(".time-slot");
    const targetSlot = Array.from(slots).find(slot => 
      slot.getAttribute("data-date") === date && 
      slot.getAttribute("data-time") === time
    );

    if (targetSlot) {
      // Clear other selections
      document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));
      
      // Select the target slot
      targetSlot.classList.add("selected");
      
      // Update display
      const displayElement = document.getElementById("selectedTimeDisplay");
      if (displayElement) {
        displayElement.textContent = `${date} - ${time}`;
      }

      return true;
    }
    return false;
  }

  // Clear selected time slot
  function clearSelectedTimeSlot() {
    document.querySelectorAll(".time-slot").forEach(s => s.classList.remove("selected"));
    const displayElement = document.getElementById("selectedTimeDisplay");
    if (displayElement) {
      displayElement.textContent = "Chọn thời gian lấy hàng";
    }
  }

  // Get available time slots for a specific date
  function getAvailableTimeSlots(date) {
    const slots = document.querySelectorAll(`.time-slot[data-date="${date}"]`);
    return Array.from(slots).map(slot => ({
      date: slot.getAttribute("data-date"),
      time: slot.getAttribute("data-time"),
      element: slot
    }));
  }

  // Public API
  return {
    init,
    initTimePickerModal,
    initTimeBasedConditions,
    attachTimeSlotListeners,
    handleTimeSlotClick,
    getSelectedTimeSlot,
    setSelectedTimeSlot,
    clearSelectedTimeSlot,
    getAvailableTimeSlots
  };
})();