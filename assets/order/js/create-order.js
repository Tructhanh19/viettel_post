/**
 * CREATE ORDER FUNCTIONALITY
 * Main controller for create order page
 */

// Load components
async function loadComponents() {
    const components = [
        { id: 'sender-info', file: 'order/sender-info.html' },
        { id: 'receiver-info', file: 'order/receiver-info.html' },
        { id: 'service-selection', file: 'order/service-selection.html' },
        { id: 'package-info', file: 'order/package-info.html' },
        { id: 'cod-info', file: 'order/cod-info.html' }
    ];

    for (const component of components) {
        try {
            const response = await fetch(component.file);
            const html = await response.text();
            document.getElementById(component.id).innerHTML = html;
        } catch (error) {
            console.error(`Error loading ${component.file}:`, error);
        }
    }

    // Initialize components after loading
    initializeComponents();
    
    // Initialize time-based conditions after a short delay
    setTimeout(() => {
        initTimeBasedConditions();
        initReceiverInfo();
        handleLocationCascading();
        initFormValidation();
        initTagSystem();
        initPackageInfo();
        initNoteTemplate();
    }, 100);
}

function initializeComponents() {
    // COD functionality
    const codByGoodsCheckbox = document.getElementById('codByGoods');
    const codAmountInput = document.getElementById('codAmount');
    
    if (codByGoodsCheckbox && codAmountInput) {
        codByGoodsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // When checked, enable COD amount input and focus on it
                codAmountInput.disabled = false;
                codAmountInput.focus();
            } else {
                // When unchecked, reset amount to 0 and disable
                codAmountInput.value = '0';
                codAmountInput.disabled = true;
            }
        });
        
        // Initially disable COD amount input
        codAmountInput.disabled = true;
    }
    
    // Payment person notification logic
    const senderPaymentRadio = document.getElementById('senderPays');
    const receiverPaymentRadio = document.getElementById('receiverPays');
    const senderAlert = document.getElementById('senderPaymentAlert');
    const receiverPaymentModal = document.getElementById('receiverPaymentModal');
    const confirmSenderPaymentBtn = document.getElementById('confirmSenderPayment');
    
    if (senderPaymentRadio && receiverPaymentRadio && senderAlert) {
        function updatePaymentNotification() {
            if (senderPaymentRadio.checked) {
                senderAlert.style.display = 'flex';
            } else {
                senderAlert.style.display = 'none';
            }
        }
        
        // Handle receiver payment selection - show modal
        receiverPaymentRadio.addEventListener('change', function() {
            if (this.checked && receiverPaymentModal) {
                const modal = new bootstrap.Modal(receiverPaymentModal);
                modal.show();
            }
        });
        
        // Handle confirm sender payment button
        if (confirmSenderPaymentBtn) {
            confirmSenderPaymentBtn.addEventListener('click', function() {
                // Revert to sender payment
                senderPaymentRadio.checked = true;
                receiverPaymentRadio.checked = false;
                updatePaymentNotification();
                
                // Close modal
                const modalInstance = bootstrap.Modal.getInstance(receiverPaymentModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
            });
        }
        
        // Handle modal close - also revert to sender
        if (receiverPaymentModal) {
            receiverPaymentModal.addEventListener('hidden.bs.modal', function() {
                senderPaymentRadio.checked = true;
                receiverPaymentRadio.checked = false;
                updatePaymentNotification();
            });
        }
        
        senderPaymentRadio.addEventListener('change', updatePaymentNotification);
        
        // Initialize with sender selected
        updatePaymentNotification();
    }
    
    // Pricing summary toggle (will be implemented when form is complete)
    const basicSummary = document.getElementById('basicSummary');
    const detailedSummary = document.getElementById('detailedSummary');
    
    if (basicSummary && detailedSummary) {
        // Function to show detailed view when form is complete
        window.showDetailedPricing = function() {
            basicSummary.style.display = 'none';
            detailedSummary.style.display = 'block';
        };
        
        // Function to show basic view (default)
        window.showBasicPricing = function() {
            basicSummary.style.display = 'block';
            detailedSummary.style.display = 'none';
        };
    }
    
    // Initialize floating pricing bar
    const floatingBar = document.getElementById('pricingSummaryBar');
    if (floatingBar) {
        // Add class to body to add padding
        document.body.classList.add('has-floating-bar');
        
        // Show floating bar after a short delay
        setTimeout(() => {
            floatingBar.classList.add('show');
        }, 500);
    }

    // Quantity controls
    document.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentNode.querySelector('.qty-input');
            const isPlus = this.classList.contains('plus');
            let value = parseInt(input.value) || 1;
            
            if (isPlus) {
                value++;
            } else if (value > 1) {
                value--;
            }
            
            input.value = value;
        });
    });

    // Sender toggle functionality
    const senderToggle = document.getElementById('saveToPostOffice');
    const pickupTimeSection = document.getElementById('pickupTimeSection');
    const postOfficeSection = document.getElementById('postOfficeSection');
    
    if (senderToggle && pickupTimeSection && postOfficeSection) {
        senderToggle.addEventListener('change', function() {
            if (this.checked) {
                // Khi tick: Hiện chọn bưu cục, ẩn thời gian hẹn lấy
                pickupTimeSection.style.display = 'none';
                postOfficeSection.style.display = 'block';
            } else {
                // Khi không tick: Hiện thời gian hẹn lấy, ẩn chọn bưu cục
                pickupTimeSection.style.display = 'block';
                postOfficeSection.style.display = 'none';
            }
        });
    }

    // Time picker functionality
    const timePickerBtn = document.getElementById('timePickerBtn');
    const timePickerModal = document.getElementById('timePickerModal');
    const selectedTimeDisplay = document.getElementById('selectedTimeDisplay');
    
    if (timePickerBtn && timePickerModal) {
        // Toggle modal
        timePickerBtn.addEventListener('click', function() {
            const isVisible = timePickerModal.style.display !== 'none';
            timePickerModal.style.display = isVisible ? 'none' : 'block';
            
            // Toggle active class for styling
            if (isVisible) {
                timePickerBtn.classList.remove('active');
            } else {
                timePickerBtn.classList.add('active');
            }
        });
        
        // Close modal when clicking outside
        document.addEventListener('click', function(e) {
            if (!pickupTimeSection.contains(e.target)) {
                timePickerModal.style.display = 'none';
                timePickerBtn.classList.remove('active');
            }
        });
        
        // Handle time slot selection - will be attached after components load
        // This is handled in initTimeBasedConditions function
    }
}

// Initialize time-based conditions
function initTimeBasedConditions() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Get elements
    const todayTab = document.getElementById('today-tab');
    const todayTabPane = document.getElementById('today');
    const tomorrowTab = document.getElementById('tomorrow-tab');
    const tomorrowTabPane = document.getElementById('tomorrow');
    const todayTimeSlots = todayTabPane?.querySelector('.time-slots-list');
    
    if (!todayTab || !todayTabPane || !tomorrowTab || !tomorrowTabPane) return;
    
    // Full time slots for tomorrow and day after
    const fullTimeSlots = [
        { time: 'Cả ngày', date: '08/10/2025' },
        { time: 'Sáng (7h30 - 12h00)', date: '08/10/2025' },
        { time: 'Chiều (13h30 - 18h00)', date: '08/10/2025' },
        { time: 'Tối (18h30 - 21h00)', date: '08/10/2025' }
    ];
    
    // Define available slots for today based on current time
    let todayAvailableSlots = [];
    let showTodayTab = true;
    
    if (currentHour < 16) {
        // Before 16:00: Can pick up today with time restrictions
        if (currentHour >= 6 && currentHour < 12) {
            // Morning (6:00 - 12:00): Hide "Sáng" and "Cả ngày", show "Chiều" and "Tối"
            todayAvailableSlots = [
                { time: 'Chiều (13h30 - 18h00)', date: '07/10/2025' },
                { time: 'Tối (18h30 - 21h00)', date: '07/10/2025' }
            ];
        } else if (currentHour >= 12 && currentHour < 16) {
            // Afternoon (12:00 - 16:00): Hide "Sáng", "Cả ngày", "Chiều", show only "Tối"
            todayAvailableSlots = [
                { time: 'Tối (18h30 - 21h00)', date: '07/10/2025' }
            ];
        } else {
            // Early morning (0:00 - 6:00): Show all slots for today
            todayAvailableSlots = [
                { time: 'Cả ngày', date: '07/10/2025' },
                { time: 'Sáng (7h30 - 12h00)', date: '07/10/2025' },
                { time: 'Chiều (13h30 - 18h00)', date: '07/10/2025' },
                { time: 'Tối (18h30 - 21h00)', date: '07/10/2025' }
            ];
        }
    } else {
        // After 16:00: Hide today tab completely, only show tomorrow and day after
        showTodayTab = false;
    }
    
    if (showTodayTab && todayAvailableSlots.length > 0 && todayTimeSlots) {
        // Update today's time slots
        todayTimeSlots.innerHTML = todayAvailableSlots.map(slot => 
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        ).join('');
        
        // Show today tab
        todayTab.style.display = 'block';
    } else {
        // Hide today tab and make tomorrow active
        todayTab.style.display = 'none';
        todayTabPane.classList.remove('show', 'active');
        
        // Make tomorrow tab active
        tomorrowTab.classList.add('active');
        tomorrowTabPane.classList.add('show', 'active');
    }
    
    // Ensure tomorrow and day after have full slots
    const tomorrowTimeSlots = document.querySelector('#tomorrow .time-slots-list');
    const dayAfterTimeSlots = document.querySelector('#dayafter .time-slots-list');
    
    if (tomorrowTimeSlots) {
        tomorrowTimeSlots.innerHTML = fullTimeSlots.map(slot => 
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        ).join('');
    }
    
    if (dayAfterTimeSlots) {
        const dayAfterSlots = fullTimeSlots.map(slot => ({
            ...slot,
            date: '09/10/2025'
        }));
        dayAfterTimeSlots.innerHTML = dayAfterSlots.map(slot => 
            `<div class="time-slot" data-time="${slot.time}" data-date="${slot.date}">
                ${slot.time}
            </div>`
        ).join('');
    }
    
    // Re-attach event listeners for all time slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function() {
            // Remove selected class from all slots
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            
            // Add selected class to clicked slot
            this.classList.add('selected');
            
            // Update display
            const date = this.getAttribute('data-date');
            const time = this.getAttribute('data-time');
            const displayElement = document.getElementById('selectedTimeDisplay');
            if (displayElement) {
                displayElement.textContent = `${date} - ${time}`;
            }
            
            // Close modal
            const modal = document.getElementById('timePickerModal');
            const btn = document.getElementById('timePickerBtn');
            if (modal && btn) {
                modal.style.display = 'none';
                btn.classList.remove('active');
            }
        });
    });
}

// Receiver info functionality
function initReceiverInfo() {
    // Address mode toggle
    const useNewAddressToggle = document.getElementById('useNewAddress');
    const normalMode = document.getElementById('normalAddressMode');
    const newMode = document.getElementById('newAddressMode');
    
    if (useNewAddressToggle && normalMode && newMode) {
        useNewAddressToggle.addEventListener('change', function() {
            if (this.checked) {
                normalMode.style.display = 'none';
                newMode.style.display = 'block';
            } else {
                normalMode.style.display = 'block';
                newMode.style.display = 'none';
            }
            
            // Check receiver info completeness after mode change
            setTimeout(() => checkReceiverInfoComplete(), 100);
        });
    }
    
    // Custom delivery time select
    const deliveryTimeSelect = document.getElementById('deliveryTimeSelect');
    const deliveryTimeDisplay = document.getElementById('deliveryTimeDisplay');
    const deliveryTimeDropdown = document.getElementById('deliveryTimeDropdown');
    
    if (deliveryTimeSelect && deliveryTimeDisplay && deliveryTimeDropdown) {
        // Toggle dropdown
        deliveryTimeDisplay.addEventListener('click', function() {
            const isOpen = deliveryTimeDropdown.classList.contains('show');
            
            if (isOpen) {
                deliveryTimeDropdown.classList.remove('show');
                deliveryTimeDisplay.classList.remove('active');
            } else {
                deliveryTimeDropdown.classList.add('show');
                deliveryTimeDisplay.classList.add('active');
            }
        });
        
        // Handle option selection
        const options = deliveryTimeDropdown.querySelectorAll('.dropdown-option');
        options.forEach(option => {
            option.addEventListener('click', function() {
                // Remove previous selection
                options.forEach(opt => opt.classList.remove('selected'));
                
                // Add selection to clicked option
                this.classList.add('selected');
                
                // Update display
                const selectedText = this.textContent;
                const displaySpan = deliveryTimeDisplay.querySelector('span');
                if (displaySpan) {
                    displaySpan.textContent = selectedText;
                }
                
                // Close dropdown
                deliveryTimeDropdown.classList.remove('show');
                deliveryTimeDisplay.classList.remove('active');
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!deliveryTimeSelect.contains(event.target)) {
                deliveryTimeDropdown.classList.remove('show');
                deliveryTimeDisplay.classList.remove('active');
            }
        });
        

    }
    
    // Initialize searchable selects
    initSearchableSelects();
}

// Searchable Select functionality
function initSearchableSelects() {
    const searchableSelects = document.querySelectorAll('.custom-select-search');
    
    searchableSelects.forEach(selectElement => {
        const display = selectElement.querySelector('.select-display');
        const dropdown = selectElement.querySelector('.select-dropdown');
        const searchInput = selectElement.querySelector('.search-input');
        const optionsContainer = selectElement.querySelector('.options-container');
        const noResults = selectElement.querySelector('.no-results');
        
        if (!display || !dropdown || !searchInput || !optionsContainer) return;
        
        // Toggle dropdown
        display.addEventListener('click', function() {
            const isOpen = dropdown.classList.contains('show');
            
            // Close all other dropdowns
            document.querySelectorAll('.custom-select-search .select-dropdown.show').forEach(dd => {
                dd.classList.remove('show');
                dd.parentElement.querySelector('.select-display').classList.remove('active');
            });
            
            if (isOpen) {
                dropdown.classList.remove('show');
                display.classList.remove('active');
            } else {
                dropdown.classList.add('show');
                display.classList.add('active');
                searchInput.focus();
            }
        });
        
        // Search functionality
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const options = optionsContainer.querySelectorAll('.dropdown-option');
            let hasVisibleOptions = false;
            
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    option.style.display = 'block';
                    hasVisibleOptions = true;
                } else {
                    option.style.display = 'none';
                }
            });
            
            // Show/hide no results message
            if (noResults) {
                if (hasVisibleOptions || searchTerm === '') {
                    noResults.style.display = 'none';
                } else {
                    noResults.style.display = 'block';
                    noResults.textContent = 'Không tìm thấy kết quả';
                }
            }
        });
        
        // Option selection
        optionsContainer.addEventListener('click', function(e) {
            if (e.target.classList.contains('dropdown-option')) {
                // Remove previous selection
                optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                // Add selection to clicked option
                e.target.classList.add('selected');
                
                // Update display
                const selectedText = e.target.textContent;
                const displaySpan = display.querySelector('span');
                if (displaySpan) {
                    displaySpan.textContent = selectedText;
                    display.classList.add('has-value');
                }
                
                // Clear search
                searchInput.value = '';
                
                // Reset options visibility
                optionsContainer.querySelectorAll('.dropdown-option').forEach(opt => {
                    opt.style.display = 'block';
                });
                if (noResults) noResults.style.display = 'none';
                
                // Close dropdown
                dropdown.classList.remove('show');
                display.classList.remove('active');
                
                // Trigger change event for cascading selects
                const changeEvent = new CustomEvent('locationChange', {
                    detail: {
                        value: e.target.getAttribute('data-value'),
                        text: selectedText,
                        selectId: selectElement.id
                    }
                });
                selectElement.dispatchEvent(changeEvent);
                
                // Trigger validation for this select
                const errorElement = selectElement.parentElement.querySelector('.text-danger');
                if (errorElement) {
                    hideSelectError(selectElement, errorElement);
                }
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!selectElement.contains(event.target)) {
                dropdown.classList.remove('show');
                display.classList.remove('active');
            }
        });
        
        // Prevent dropdown close when clicking on search input
        searchInput.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
}

// Handle location cascading (Province -> District -> Ward -> Street)
function handleLocationCascading() {
    const provinceSelect = document.getElementById('provinceSelect');
    const districtSelect = document.getElementById('districtSelect');
    const wardSelect = document.getElementById('wardSelect');
    const streetSelect = document.getElementById('streetSelect');
    
    // New address mode selects
    const newProvinceSelect = document.getElementById('newProvinceSelect');
    const newWardSelect = document.getElementById('newWardSelect');
    const newStreetSelect = document.getElementById('newStreetSelect');
    
    // Sample data - in real app this would come from API
    const districts = {
        hanoi: ['Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Tây Hồ', 'Quận Long Biên'],
        hcm: ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 7']
    };
    
    const wards = {
        'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho'],
        'Quận 2': ['Phường Thảo Điền', 'Phường Bình An', 'Phường Bình Trưng Đông']
    };
    
    const streets = {
        'Phường Bến Nghé': ['Đường Nguyễn Huệ', 'Đường Lê Lợi', 'Đường Đồng Khởi'],
        'Phường Bến Thành': ['Đường Lê Thánh Tôn', 'Đường Pasteur', 'Đường Hai Bà Trưng'],
        'Phường Thảo Điền': ['Đường Xa Lộ Hà Nội', 'Đường Nguyễn Văn Hưởng', 'Đường Quốc Hương']
    };
    
    // Normal address mode cascading
    if (provinceSelect) {
        provinceSelect.addEventListener('locationChange', function(e) {
            const provinceValue = e.detail.value;
            updateDistrictOptions(districtSelect, districts[provinceValue] || []);
            resetSelect(wardSelect, 'Xã/Phường');
            resetSelect(streetSelect, 'Đường/Thôn/Xóm');
        });
    }
    
    if (districtSelect) {
        districtSelect.addEventListener('locationChange', function(e) {
            const districtText = e.detail.text;
            updateWardOptions(wardSelect, wards[districtText] || []);
            resetSelect(streetSelect, 'Đường/Thôn/Xóm');
        });
    }
    
    if (wardSelect) {
        wardSelect.addEventListener('locationChange', function(e) {
            const wardText = e.detail.text;
            updateStreetOptions(streetSelect, streets[wardText] || []);
        });
    }
    
    // New address mode cascading
    if (newProvinceSelect) {
        newProvinceSelect.addEventListener('locationChange', function(e) {
            const provinceValue = e.detail.value;
            updateWardOptions(newWardSelect, wards[Object.keys(districts[provinceValue] || {})[0]] || []);
            resetSelect(newStreetSelect, 'Đường/Thôn/Xóm');
        });
    }
    
    if (newWardSelect) {
        newWardSelect.addEventListener('locationChange', function(e) {
            const wardText = e.detail.text;
            updateStreetOptions(newStreetSelect, streets[wardText] || []);
        });
    }
}

function updateDistrictOptions(selectElement, options) {
    if (!selectElement) return;
    
    const optionsContainer = selectElement.querySelector('.options-container');
    if (options.length > 0) {
        optionsContainer.innerHTML = options.map(option => 
            `<div class="dropdown-option" data-value="${option.toLowerCase().replace(/\s+/g, '')}">${option}</div>`
        ).join('');
    } else {
        optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
}

function updateWardOptions(selectElement, options) {
    if (!selectElement) return;
    
    const optionsContainer = selectElement.querySelector('.options-container');
    if (options.length > 0) {
        optionsContainer.innerHTML = options.map(option => 
            `<div class="dropdown-option" data-value="${option.toLowerCase().replace(/\s+/g, '')}">${option}</div>`
        ).join('');
    } else {
        optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
}

function updateStreetOptions(selectElement, options) {
    if (!selectElement) return;
    
    const optionsContainer = selectElement.querySelector('.options-container');
    if (options.length > 0) {
        optionsContainer.innerHTML = options.map(option => 
            `<div class="dropdown-option" data-value="${option.toLowerCase().replace(/\s+/g, '')}">${option}</div>`
        ).join('');
    } else {
        optionsContainer.innerHTML = '<div class="no-results">Không có dữ liệu</div>';
    }
}

function resetSelect(selectElement, placeholder) {
    if (!selectElement) return;
    
    const display = selectElement.querySelector('.select-display');
    const span = display.querySelector('span');
    const optionsContainer = selectElement.querySelector('.options-container');
    
    span.textContent = placeholder;
    display.classList.remove('has-value');
    optionsContainer.innerHTML = `<div class="no-results">Vui lòng chọn cấp trên trước</div>`;
}

// Form validation functions
function validateSenderInfo() {
    const senderSelect = document.getElementById('senderSelect');
    const senderError = document.getElementById('senderError');
    let isValid = true;

    if (senderSelect && senderSelect.value === '') {
        showError(senderSelect, senderError, 'Người gửi không được để trống');
        isValid = false;
    } else if (senderSelect) {
        hideError(senderSelect, senderError);
    }

    return isValid;
}

function validateReceiverInfo() {
    let isValid = true;

    // Validate phone number
    const phone = document.getElementById('receiverPhone');
    const phoneError = document.getElementById('phoneError');
    if (phone) {
        const phoneValue = phone.value.trim();
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        
        if (phoneValue === '') {
            showError(phone, phoneError, 'Điện thoại không được để trống');
            isValid = false;
        } else if (!phoneRegex.test(phoneValue)) {
            showError(phone, phoneError, 'Số điện thoại không hợp lệ');
            isValid = false;
        } else {
            hideError(phone, phoneError);
        }
    }

    // Validate name
    const name = document.getElementById('receiverName');
    const nameError = document.getElementById('nameError');
    if (name) {
        if (name.value.trim() === '') {
            showError(name, nameError, 'Họ tên không được để trống');
            isValid = false;
        } else {
            hideError(name, nameError);
        }
    }

    // Validate address based on mode
    const useNewAddress = document.getElementById('useNewAddress');
    const isNewAddressMode = useNewAddress && useNewAddress.checked;
    
    if (isNewAddressMode) {
        // Validate new address mode
        const newAddress = document.getElementById('newReceiverAddress');
        const newAddressError = document.getElementById('newAddressError');
        if (newAddress) {
            if (newAddress.value.trim() === '') {
                showError(newAddress, newAddressError, 'Địa chỉ không được để trống');
                isValid = false;
            } else {
                hideError(newAddress, newAddressError);
            }
        }
    } else {
        // Validate normal address mode
        const address = document.getElementById('receiverAddress');
        const addressError = document.getElementById('addressError');
        if (address) {
            if (address.value.trim() === '') {
                showError(address, addressError, 'Địa chỉ không được để trống');
                isValid = false;
            } else {
                hideError(address, addressError);
            }
        }
    }

    // Validate location selects
    isValid = validateLocationSelects() && isValid;

    return isValid;
}

function validateLocationSelects() {
    let isValid = true;
    
    // Check which address mode is active
    const useNewAddress = document.getElementById('useNewAddress');
    const isNewAddressMode = useNewAddress && useNewAddress.checked;
    
    if (isNewAddressMode) {
        // Validate new address mode
        isValid = validateNewAddressSelects() && isValid;
    } else {
        // Validate normal address mode
        isValid = validateNormalAddressSelects() && isValid;
    }

    return isValid;
}

function validateNormalAddressSelects() {
    let isValid = true;

    // Validate province
    const provinceSelect = document.getElementById('provinceSelect');
    const provinceError = document.getElementById('provinceError');
    if (provinceSelect) {
        const selectedOption = provinceSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(provinceSelect, provinceError, 'Tỉnh/Thành phố không được để trống');
            isValid = false;
        } else {
            hideSelectError(provinceSelect, provinceError);
        }
    }

    // Validate district
    const districtSelect = document.getElementById('districtSelect');
    const districtError = document.getElementById('districtError');
    if (districtSelect) {
        const selectedOption = districtSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(districtSelect, districtError, 'Huyện/Quận không được để trống');
            isValid = false;
        } else {
            hideSelectError(districtSelect, districtError);
        }
    }

    // Validate ward
    const wardSelect = document.getElementById('wardSelect');
    const wardError = document.getElementById('wardError');
    if (wardSelect) {
        const selectedOption = wardSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(wardSelect, wardError, 'Xã/Phường không được để trống');
            isValid = false;
        } else {
            hideSelectError(wardSelect, wardError);
        }
    }

    // Validate street
    const streetSelect = document.getElementById('streetSelect');
    const streetError = document.getElementById('streetError');
    if (streetSelect) {
        const selectedOption = streetSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(streetSelect, streetError, 'Đường/Thôn/Xóm không được để trống');
            isValid = false;
        } else {
            hideSelectError(streetSelect, streetError);
        }
    }

    return isValid;
}

function validateNewAddressSelects() {
    let isValid = true;

    // Validate new province
    const newProvinceSelect = document.getElementById('newProvinceSelect');
    const newProvinceError = document.getElementById('newProvinceError');
    if (newProvinceSelect) {
        const selectedOption = newProvinceSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(newProvinceSelect, newProvinceError, 'Tỉnh/Thành phố không được để trống');
            isValid = false;
        } else {
            hideSelectError(newProvinceSelect, newProvinceError);
        }
    }

    // Validate new ward
    const newWardSelect = document.getElementById('newWardSelect');
    const newWardError = document.getElementById('newWardError');
    if (newWardSelect) {
        const selectedOption = newWardSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(newWardSelect, newWardError, 'Xã/Phường/Đặc khu không được để trống');
            isValid = false;
        } else {
            hideSelectError(newWardSelect, newWardError);
        }
    }

    // Validate new street
    const newStreetSelect = document.getElementById('newStreetSelect');
    const newStreetError = document.getElementById('newStreetError');
    if (newStreetSelect) {
        const selectedOption = newStreetSelect.querySelector('.dropdown-option.selected');
        if (!selectedOption) {
            showSelectError(newStreetSelect, newStreetError, 'Đường/Thôn/Xóm không được để trống');
            isValid = false;
        } else {
            hideSelectError(newStreetSelect, newStreetError);
        }
    }

    return isValid;
}

function showError(element, errorElement, message) {
    element.classList.add('error');
    element.classList.remove('success');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideError(element, errorElement) {
    element.classList.remove('error');
    element.classList.add('success');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Check if receiver info is complete after fixing error
    setTimeout(() => checkReceiverInfoComplete(), 100);
}

function showSelectError(selectElement, errorElement, message) {
    selectElement.classList.add('error');
    selectElement.classList.remove('success');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function hideSelectError(selectElement, errorElement) {
    selectElement.classList.remove('error');
    selectElement.classList.add('success');
    if (errorElement) {
        errorElement.style.display = 'none';
    }
    
    // Check if receiver info is complete after fixing error
    setTimeout(() => checkReceiverInfoComplete(), 100);
}

function validateForm() {
    const senderValid = validateSenderInfo();
    const receiverValid = validateReceiverInfo();
    
    return senderValid && receiverValid;
}

// Add real-time validation
function initFormValidation() {
    // Real-time validation for phone
    const phone = document.getElementById('receiverPhone');
    if (phone) {
        phone.addEventListener('blur', function() {
            const phoneError = document.getElementById('phoneError');
            const phoneValue = this.value.trim();
            const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
            
            if (phoneValue === '') {
                showError(this, phoneError, 'Điện thoại không được để trống');
            } else if (!phoneRegex.test(phoneValue)) {
                showError(this, phoneError, 'Số điện thoại không hợp lệ');
            } else {
                hideError(this, phoneError);
            }
        });
        
        // Also check on input for immediate feedback
        phone.addEventListener('input', function() {
            setTimeout(() => checkReceiverInfoComplete(), 100);
        });
    }

    // Real-time validation for name
    const name = document.getElementById('receiverName');
    if (name) {
        name.addEventListener('blur', function() {
            const nameError = document.getElementById('nameError');
            if (this.value.trim() === '') {
                showError(this, nameError, 'Họ tên không được để trống');
            } else {
                hideError(this, nameError);
            }
        });
        
        // Also check on input for immediate feedback
        name.addEventListener('input', function() {
            setTimeout(() => checkReceiverInfoComplete(), 100);
        });
    }

    // Real-time validation for address
    const address = document.getElementById('receiverAddress');
    if (address) {
        address.addEventListener('blur', function() {
            const addressError = document.getElementById('addressError');
            if (this.value.trim() === '') {
                showError(this, addressError, 'Địa chỉ không được để trống');
            } else {
                hideError(this, addressError);
            }
        });
        
        address.addEventListener('input', function() {
            setTimeout(() => checkReceiverInfoComplete(), 100);
        });
    }

    // Real-time validation for new address
    const newAddress = document.getElementById('newReceiverAddress');
    if (newAddress) {
        newAddress.addEventListener('blur', function() {
            const newAddressError = document.getElementById('newAddressError');
            if (this.value.trim() === '') {
                showError(this, newAddressError, 'Địa chỉ không được để trống');
            } else {
                hideError(this, newAddressError);
            }
        });
        
        newAddress.addEventListener('input', function() {
            setTimeout(() => checkReceiverInfoComplete(), 100);
        });
    }

    // Real-time validation for sender select
    const senderSelect = document.getElementById('senderSelect');
    if (senderSelect) {
        senderSelect.addEventListener('change', function() {
            const senderError = document.getElementById('senderError');
            if (this.value === '') {
                showError(this, senderError, 'Người gửi không được để trống');
            } else {
                hideError(this, senderError);
            }
        });
    }

    // Add validation to create order button
    const createOrderBtn = document.getElementById('createOrderBtn');
    if (createOrderBtn) {
        createOrderBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (validateForm()) {
                // All validations passed
                alert('Tất cả thông tin hợp lệ! Đơn hàng sẽ được tạo.');
                // Here you would typically submit the form data
            } else {
                // Show error message
                alert('Vui lòng kiểm tra lại thông tin đã nhập!');
                
                // Scroll to first error
                const firstError = document.querySelector('.error, .text-danger[style*="block"]');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
    
    // Initialize service selection
    initServiceSelection();
}

function initServiceSelection() {
    // Handle main service selection changes
    const serviceRadios = document.querySelectorAll('input[name="mainService"]');
    serviceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateServiceInfo(this.value);
        });
    });
    
    // Initialize with default selected service
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    if (checkedService) {
        updateServiceInfo(checkedService.value);
    }
    
    // Handle additional services
    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]');
    additionalServices.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateServicePrice();
        });
    });
}

function updateServiceInfo(serviceType) {
    const serviceInfo = {
        standard: {
            price: '65.000 đ',
            deliveryTime: '2-3 ngày',
            description: 'Chuyển phát tiêu chuẩn'
        },
        express: {
            price: '82.004 đ', 
            deliveryTime: '1 ngày',
            description: 'Chuyển phát nhanh'
        },
        priority: {
            price: '120.000 đ',
            deliveryTime: '4-6 giờ',
            description: 'Chuyển phát hỏa tốc'
        }
    };
    
    const info = serviceInfo[serviceType];
    if (info) {
        // Update price and delivery time in the UI
        const priceElement = document.querySelector('.service-info strong');
        const deliveryElement = document.querySelector('.service-info .me-2 strong');
        
        if (priceElement) {
            priceElement.textContent = info.price;
        }
        if (deliveryElement) {
            deliveryElement.textContent = info.deliveryTime;
        }
    }
}

function updateServicePrice() {
    // Calculate total price including additional services
    const basePrice = getCurrentServicePrice();
    let additionalCost = 0;
    
    const additionalServices = document.querySelectorAll('.additional-services input[type="checkbox"]:checked');
    additionalServices.forEach(service => {
        // Add cost for each selected additional service
        // In a real application, these would be configured with actual prices
        additionalCost += getAdditionalServiceCost(service.id);
    });
    
    const totalPrice = basePrice + additionalCost;
    const priceElement = document.querySelector('.service-info strong');
    if (priceElement) {
        priceElement.textContent = formatPrice(totalPrice) + ' đ';
    }
}

function getCurrentServicePrice() {
    const checkedService = document.querySelector('input[name="mainService"]:checked');
    const basePrices = {
        standard: 65000,
        express: 82004,
        priority: 120000
    };
    
    return basePrices[checkedService?.value] || 82004;
}

function getAdditionalServiceCost(serviceId) {
    const serviceCosts = {
        declareValue: 5000,
        insurance: 10000,
        inspection: 8000,
        specialDelivery: 15000,
        fragileGoods: 12000,
        exchange: 10000,
        specialHandling: 20000,
        handDelivery: 8000,
        identityConfirmation: 15000,
        smsNotification: 2000,
        zaloNotification: 0, // Free service
        refundService: 5000
    };
    
    return serviceCosts[serviceId] || 0;
}

function formatPrice(price) {
    return price.toLocaleString('vi-VN');
}

// Tag system data
const CUSTOMER_TAGS = [
    {
        "name": "Khách hàng thân thiết",
        "code": "CLOSE",
        "color_code": "#44ab4d"
    },
    {
        "name": "Khách hàng VIP",
        "code": "VIP",
        "color_code": "#eb9642"
    },
    {
        "name": "Khách hàng mới",
        "code": "NEW",
        "color_code": "#3b9ef4"
    },
    {
        "name": "Bom hàng",
        "code": "BOM",
        "color_code": "#ee004c"
    },
    {
        "name": "Tín nhiệm thấp",
        "code": "LOW_EXPECTATION",
        "color_code": "#d37cd9"
    }
];

// Tag system functionality
let selectedTags = [];

function initTagSystem() {
    const addTagBtn = document.getElementById('addTagBtn');
    const tagModal = document.getElementById('tagModal');
    const closeTagModal = document.getElementById('closeTagModal');
    const availableTags = document.getElementById('availableTags');
    
    if (!addTagBtn || !tagModal || !closeTagModal || !availableTags) return;
    
    // Populate available tags
    populateAvailableTags();
    
    // Add tag button click
    addTagBtn.addEventListener('click', function() {
        tagModal.style.display = 'flex';
    });
    
    // Close modal
    closeTagModal.addEventListener('click', function() {
        tagModal.style.display = 'none';
    });
    
    // Close modal when clicking outside
    tagModal.addEventListener('click', function(e) {
        if (e.target === tagModal) {
            tagModal.style.display = 'none';
        }
    });
}

function populateAvailableTags() {
    const availableTags = document.getElementById('availableTags');
    if (!availableTags) return;
    
    availableTags.innerHTML = '';
    
    CUSTOMER_TAGS.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'available-tag';
        tagElement.setAttribute('data-code', tag.code);
        
        // Check if tag is already selected
        const isSelected = selectedTags.some(selectedTag => selectedTag.code === tag.code);
        if (isSelected) {
            tagElement.classList.add('selected');
        }
        
        tagElement.innerHTML = `
            <div class="tag-color-indicator" style="background-color: ${tag.color_code}"></div>
            <span class="tag-name">${tag.name}</span>
            <span class="tag-code">${tag.code}</span>
        `;
        
        tagElement.addEventListener('click', function() {
            toggleTagSelection(tag, tagElement);
        });
        
        availableTags.appendChild(tagElement);
    });
}

function toggleTagSelection(tag, element) {
    const isSelected = selectedTags.some(selectedTag => selectedTag.code === tag.code);
    
    if (isSelected) {
        // Remove tag
        selectedTags = selectedTags.filter(selectedTag => selectedTag.code !== tag.code);
        element.classList.remove('selected');
    } else {
        // Add tag
        selectedTags.push(tag);
        element.classList.add('selected');
    }
    
    updateTagsDisplay();
}

function updateTagsDisplay() {
    const tagsContainer = document.getElementById('tagsContainer');
    if (!tagsContainer) return;
    
    tagsContainer.innerHTML = '';
    
    selectedTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'customer-tag';
        tagElement.style.backgroundColor = tag.color_code;
        
        tagElement.innerHTML = `
            <span>${tag.name}</span>
            <button class="tag-remove" data-code="${tag.code}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add remove functionality
        const removeBtn = tagElement.querySelector('.tag-remove');
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            removeTag(tag.code);
        });
        
        tagsContainer.appendChild(tagElement);
    });
}

function removeTag(tagCode) {
    selectedTags = selectedTags.filter(tag => tag.code !== tagCode);
    updateTagsDisplay();
    populateAvailableTags(); // Refresh available tags to update selection state
}

function checkReceiverInfoComplete() {
    const phone = document.getElementById('receiverPhone');
    const name = document.getElementById('receiverName');
    const address = document.getElementById('receiverAddress');
    const newAddress = document.getElementById('newReceiverAddress');
    const useNewAddress = document.getElementById('useNewAddress');
    
    // Check basic info
    const phoneValid = phone && phone.value.trim() !== '';
    const nameValid = name && name.value.trim() !== '';
    
    // Check address based on mode
    const isNewAddressMode = useNewAddress && useNewAddress.checked;
    let addressValid = false;
    
    if (isNewAddressMode) {
        addressValid = newAddress && newAddress.value.trim() !== '';
        // Also check if location selects are filled for new mode
        const newProvince = document.getElementById('newProvinceSelect');
        const newWard = document.getElementById('newWardSelect');
        const newStreet = document.getElementById('newStreetSelect');
        
        const newProvinceValid = newProvince && newProvince.querySelector('.dropdown-option.selected');
        const newWardValid = newWard && newWard.querySelector('.dropdown-option.selected');
        const newStreetValid = newStreet && newStreet.querySelector('.dropdown-option.selected');
        
        addressValid = addressValid && newProvinceValid && newWardValid && newStreetValid;
    } else {
        addressValid = address && address.value.trim() !== '';
        // Also check if location selects are filled for normal mode
        const province = document.getElementById('provinceSelect');
        const district = document.getElementById('districtSelect');
        const ward = document.getElementById('wardSelect');
        const street = document.getElementById('streetSelect');
        
        const provinceValid = province && province.querySelector('.dropdown-option.selected');
        const districtValid = district && district.querySelector('.dropdown-option.selected');
        const wardValid = ward && ward.querySelector('.dropdown-option.selected');
        const streetValid = street && street.querySelector('.dropdown-option.selected');
        
        addressValid = addressValid && provinceValid && districtValid && wardValid && streetValid;
    }
    
    const isComplete = phoneValid && nameValid && addressValid;
    
    // Show/hide rating and tag sections
    const ratingSection = document.getElementById('receiverRatingSection');
    const tagSection = document.getElementById('receiverTagSection');
    
    if (isComplete) {
        if (ratingSection && ratingSection.style.display === 'none') {
            ratingSection.style.display = 'block';
            setTimeout(() => ratingSection.classList.add('show'), 10);
        }
        if (tagSection && tagSection.style.display === 'none') {
            tagSection.style.display = 'block';
            setTimeout(() => tagSection.classList.add('show'), 100);
        }
    } else {
        if (ratingSection) {
            ratingSection.classList.remove('show');
            setTimeout(() => ratingSection.style.display = 'none', 300);
        }
        if (tagSection) {
            tagSection.classList.remove('show');
            setTimeout(() => tagSection.style.display = 'none', 300);
        }
    }
    
    return isComplete;
}

/**
 * PACKAGE INFO FUNCTIONALITY
 */
let packageItemCounter = 1;
let availableNumbers = []; // Array to store reusable numbers

function initPackageInfo() {
    // Package type switching
    const packageTypeInputs = document.querySelectorAll('input[name="packageType"]');
    const mailCharacteristics = document.getElementById('mailCharacteristics');
    const documentCharacteristics = document.getElementById('documentCharacteristics');

    packageTypeInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.value === 'mail') {
                mailCharacteristics.style.display = 'block';
                documentCharacteristics.style.display = 'none';
            } else if (this.value === 'document') {
                mailCharacteristics.style.display = 'none';
                documentCharacteristics.style.display = 'block';
            }
        });
    });

    // Add package item functionality
    const addPackageBtn = document.getElementById('addPackageItemBtn');
    if (addPackageBtn) {
        addPackageBtn.addEventListener('click', addPackageItem);
    }

    // Initialize existing package items
    updatePackageItemVisibility();
    updatePackageSummary();

    // Add event listeners for calculation updates and validation
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('package-weight') || 
            e.target.classList.contains('package-value') ||
            e.target.classList.contains('package-quantity')) {
            updatePackageSummary();
        }
        
        // Validation for required fields
        if (e.target.classList.contains('package-name')) {
            validatePackageField(e.target, 'package-name-error');
        } else if (e.target.classList.contains('package-weight')) {
            validatePackageField(e.target, 'package-weight-error');
        } else if (e.target.classList.contains('dimension-length')) {
            validatePackageField(e.target, 'dimension-length-error');
        } else if (e.target.classList.contains('dimension-width')) {
            validatePackageField(e.target, 'dimension-width-error');
        } else if (e.target.classList.contains('dimension-height')) {
            validatePackageField(e.target, 'dimension-height-error');
        }
    });
    
    // Validation on blur
    document.addEventListener('blur', function(e) {
        if (e.target.classList.contains('package-name') ||
            e.target.classList.contains('package-weight') ||
            e.target.classList.contains('dimension-length') ||
            e.target.classList.contains('dimension-width') ||
            e.target.classList.contains('dimension-height')) {
            const errorClass = e.target.className.includes('package-name') ? 'package-name-error' :
                               e.target.className.includes('package-weight') ? 'package-weight-error' :
                               e.target.className.includes('dimension-length') ? 'dimension-length-error' :
                               e.target.className.includes('dimension-width') ? 'dimension-width-error' :
                               'dimension-height-error';
            validatePackageField(e.target, errorClass);
        }
    }, true);
}

function addPackageItem() {
    // Get next available number
    let itemNumber;
    if (availableNumbers.length > 0) {
        // Reuse lowest available number
        availableNumbers.sort((a, b) => a - b);
        itemNumber = availableNumbers.shift();
    } else {
        // Use next sequential number
        packageItemCounter++;
        itemNumber = packageItemCounter;
    }
    
    const container = document.getElementById('packageItemsContainer');
    
    const newItem = document.createElement('div');
    newItem.className = 'package-item';
    newItem.setAttribute('data-item', itemNumber);
    
    newItem.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h6 class="mb-0">Tên hàng ${itemNumber}<span class="text-danger">*</span></h6>
            <button type="button" class="btn btn-sm btn-outline-danger remove-item-btn">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="mb-3">
            <input type="text" class="form-control package-name" placeholder="Nhập tên hàng hóa" required>
            <div class="package-name-error text-danger small mt-1" style="display: none;">Tên hàng hóa không được để trống</div>
        </div>

        <div class="row mb-3">
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-cube text-dark"></i> <span class="text-danger">*</span>
                </label>
                <input type="number" class="form-control package-quantity" value="1" min="1" required>
            </div>
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-balance-scale text-dark"></i> <span class="text-danger">*</span>
                </label>
                <div class="input-group">
                    <input type="number" class="form-control package-weight" placeholder="Trọng lượng" min="0" step="0.01" required>
                    <span class="input-group-text">g</span>
                </div>
                <div class="package-weight-error text-danger small mt-1" style="display: none;">Trọng lượng không được để trống</div>
            </div>
            <div class="col-md-4">
                <label class="form-label">
                    <i class="fas fa-money-bill text-dark"></i>
                </label>
                <div class="input-group">
                    <input type="number" class="form-control package-value" placeholder="Giá trị hàng" min="0">
                    <span class="input-group-text">đ</span>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(newItem);
    
    // Add remove functionality
    const removeBtn = newItem.querySelector('.remove-item-btn');
    removeBtn.addEventListener('click', function() {
        removePackageItem(newItem);
    });
    
    updatePackageItemVisibility();
    updatePackageSummary();
    
    // Focus on the new item's name field
    const nameInput = newItem.querySelector('.package-name');
    if (nameInput) {
        nameInput.focus();
    }
}

function removePackageItem(item) {
    // Get the item number before removing
    const itemNumber = parseInt(item.getAttribute('data-item'));
    
    // Add the number back to available numbers for reuse
    if (itemNumber > 1) { // Don't reuse number 1
        availableNumbers.push(itemNumber);
    }
    
    item.remove();
    updatePackageItemVisibility();
    updatePackageSummary();
}

function updatePackageItemVisibility() {
    const items = document.querySelectorAll('.package-item');
    items.forEach((item, index) => {
        const removeBtn = item.querySelector('.remove-item-btn');
        if (removeBtn) {
            removeBtn.style.display = items.length > 1 ? 'flex' : 'none';
        }
    });
}

function updatePackageSummary() {
    const items = document.querySelectorAll('.package-item');
    let totalWeight = 0;
    let totalValue = 0;
    
    items.forEach(item => {
        const quantity = parseFloat(item.querySelector('.package-quantity').value) || 0;
        const weight = parseFloat(item.querySelector('.package-weight').value) || 0;
        const value = parseFloat(item.querySelector('.package-value').value) || 0;
        
        totalWeight += quantity * weight;
        totalValue += quantity * value;
    });
    
    // Update display
    const totalWeightEl = document.getElementById('totalWeight');
    const totalValueEl = document.getElementById('totalValue');
    
    if (totalWeightEl) {
        totalWeightEl.textContent = formatNumber(totalWeight) + ' g';
    }
    
    if (totalValueEl) {
        totalValueEl.textContent = formatNumber(totalValue) + ' đ';
    }
}

function formatNumber(num) {
    return new Intl.NumberFormat('vi-VN').format(num);
}

function validatePackageField(field, errorClass) {
    const container = field.closest('.package-item') || field.closest('.dimensions-section') || field.closest('.mb-3');
    const errorElement = container?.querySelector(`.${errorClass}`);
    
    if (!errorElement) return;
    
    const isEmpty = !field.value || field.value.trim() === '';
    const isInvalid = field.type === 'number' && (isNaN(field.value) || parseFloat(field.value) <= 0);
    
    if (isEmpty || isInvalid) {
        errorElement.style.display = 'block';
        field.classList.add('is-invalid');
    } else {
        errorElement.style.display = 'none';
        field.classList.remove('is-invalid');
    }
}

/**
 * NOTE TEMPLATE FUNCTIONALITY
 */
function initNoteTemplate() {
    const noteTemplateBtn = document.getElementById('noteTemplateBtn');
    const noteTemplateModal = document.getElementById('noteTemplateModal');
    const selectNotesBtn = document.getElementById('selectNotesBtn');
    const noteTextarea = document.getElementById('noteTextarea');
    
    if (noteTemplateBtn && noteTemplateModal) {
        // Show modal when clicking "Ghi chú mẫu"
        noteTemplateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const modal = new bootstrap.Modal(noteTemplateModal);
            modal.show();
        });
        
        // Handle note selection
        if (selectNotesBtn && noteTextarea) {
            selectNotesBtn.addEventListener('click', function() {
                const selectedNotes = [];
                const checkedOptions = document.querySelectorAll('.note-template-option:checked');
                
                checkedOptions.forEach(option => {
                    selectedNotes.push(option.value);
                });
                
                // Add selected notes to textarea
                const currentText = noteTextarea.value.trim();
                let newText = currentText;
                
                if (selectedNotes.length > 0) {
                    const notesToAdd = selectedNotes.join('\n- ');
                    if (currentText) {
                        newText += '\n- ' + notesToAdd;
                    } else {
                        newText = '- ' + notesToAdd;
                    }
                    noteTextarea.value = newText;
                }
                
                // Close modal
                const modalInstance = bootstrap.Modal.getInstance(noteTemplateModal);
                if (modalInstance) {
                    modalInstance.hide();
                }
                
                // Clear selections for next time
                checkedOptions.forEach(option => {
                    option.checked = false;
                });
            });
        }
    }
}

// Initialize when content is loaded
loadComponents();