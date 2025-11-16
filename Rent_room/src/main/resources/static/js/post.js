let currentStep = 1;
let uploadedImages = [];

// Import API utilities (if api.js is loaded)
if (typeof apiPost === 'undefined') {
    // Fallback if api.js is not loaded
    window.apiPost = async function(url, data) {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        console.log(data);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        return response.json();
    };
    
    window.isAuthenticated = function() {
        return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
    };
    
    window.handleApiError = function(error) {
        alert(error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    };
}

// District data for Hà Nội only
const districtData = {
    'ha-noi': [
        'Quận Ba Đình', 'Quận Hoàn Kiếm', 'Quận Hai Bà Trưng', 'Quận Đống Đa', 'Quận Tây Hồ', 'Quận Cầu Giấy',
        'Quận Thanh Xuân', 'Quận Hoàng Mai', 'Quận Long Biên', 'Quận Nam Từ Liêm', 'Quận Bắc Từ Liêm', 'Quận Hà Đông',
        'Huyện Đông Anh', 'Huyện Gia Lâm', 'Huyện Sóc Sơn', 'Huyện Thanh Trì', 'Huyện Mê Linh', 'Huyện Phú Xuyên',
        'Huyện Thường Tín', 'Huyện Phúc Thọ', 'Huyện Đan Phượng', 'Huyện Hoài Đức', 'Huyện Quốc Oai', 'Huyện Thạch Thất',
        'Huyện Chương Mỹ', 'Huyện Thanh Oai', 'Huyện Mỹ Đức', 'Huyện Ứng Hòa', 'Huyện Sơn Tây', 'Thị xã Sơn Tây'
    ]
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS and Feather Icons
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 600,
            easing: 'ease-in-out',
            once: true
        });
    }
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Setup event listeners
    setupEventListeners();
    
    // Set default city to Hà Nội
    const citySelect = document.getElementById('city');
    if (citySelect) {
        citySelect.value = 'ha-noi';
        updateDistricts();
    }
    
    updatePreview();
});

// Setup all event listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const menu = document.getElementById('mobile-menu');
            if (menu) {
                menu.classList.toggle('hidden');
            }
        });
    }

    // City change listener
    const citySelect = document.getElementById('city');
    if (citySelect) {
        citySelect.addEventListener('change', function() {
            updateDistricts();
        });
    }

    // Form field listeners for preview
    const previewFields = ['title', 'price', 'area', 'city', 'district', 'address'];
    previewFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            element.addEventListener('input', updatePreview);
        }
    });

    // Amenities change listener
    document.querySelectorAll('input[name="amenities"]').forEach(checkbox => {
        checkbox.addEventListener('change', updatePreview);
    });

    // Package selection
    document.querySelectorAll('.package-option').forEach(option => {
        option.addEventListener('click', function() {
            const radio = this.querySelector('input[type="radio"]');
            if (radio) {
                radio.checked = true;
            }
        });
    });

    // Image upload listeners
    setupImageUpload();

    // Form submission
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handleFormSubmit);
    }
}

// Update districts based on selected city
function updateDistricts() {
    const citySelect = document.getElementById('city');
    const districtSelect = document.getElementById('district');
    if (!citySelect || !districtSelect) return;
    
    const selectedCity = citySelect.value;

    // Clear current options
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';

    if (selectedCity && districtData[selectedCity]) {
        districtData[selectedCity].forEach(district => {
            const option = document.createElement('option');
            option.value = district.toLowerCase().replace(/\s+/g, '-');
            option.textContent = district;
            districtSelect.appendChild(option);
        });
    }
    updatePreview();
}

// Step navigation
function nextStep() {
    if (validateCurrentStep()) {
        currentStep++;
        showStep(currentStep);
        updateProgress();
    }
}

function prevStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        updateProgress();
    }
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.classList.remove('active');
    });
    
    // Show current step
    const currentStepEl = document.getElementById(`step${step}`);
    if (currentStepEl) {
        currentStepEl.classList.add('active');
    }
    
    // Update step indicators
    document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
        const stepNumber = index + 2; // Starting from step 2
        if (stepNumber <= step) {
            indicator.classList.remove('bg-gray-300', 'text-gray-600');
            indicator.classList.add('bg-blue-600', 'text-white');
            const stepText = document.querySelector(`.step-text[data-step="${stepNumber}"]`);
            if (stepText) {
                stepText.classList.remove('text-gray-600');
                stepText.classList.add('text-blue-600', 'font-medium');
            }
        } else {
            indicator.classList.remove('bg-blue-600', 'text-white');
            indicator.classList.add('bg-gray-300', 'text-gray-600');
            const stepText = document.querySelector(`.step-text[data-step="${stepNumber}"]`);
            if (stepText) {
                stepText.classList.remove('text-blue-600', 'font-medium');
                stepText.classList.add('text-gray-600');
            }
        }
    });
}

function updateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        const progress = (currentStep / 3) * 100;
        progressBar.style.width = `${progress}%`;
    }
}

// Validate current step
function validateCurrentStep() {
    const currentStepEl = document.getElementById(`step${currentStep}`);
    if (!currentStepEl) return true;
    
    const requiredFields = currentStepEl.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.classList.add('border-red-500');
            isValid = false;
            
            // Remove error styling after user starts typing
            field.addEventListener('input', function() {
                this.classList.remove('border-red-500');
            }, { once: true });
        } else {
            field.classList.remove('border-red-500');
        }
    });

    if (!isValid) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    return isValid;
}

// Image upload functionality
function setupImageUpload() {
    const dragDropArea = document.getElementById('dragDropArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    if (!dragDropArea || !imageInput || !imagePreview) return;

    // Drag and drop events
    dragDropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    });

    dragDropArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
    });

    dragDropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    // File input change
    imageInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (uploadedImages.length + files.length > 10) {
            alert('Chỉ được upload tối đa 10 hình ảnh');
            return;
        }

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    uploadedImages.push({
                        file: file,
                        url: e.target.result
                    });
                    updateImagePreview();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function updateImagePreview() {
        imagePreview.innerHTML = '';
        uploadedImages.forEach((image, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            previewDiv.innerHTML = `
                <img src="${image.url}" alt="Preview ${index + 1}">
                <button type="button" class="remove-btn" onclick="removeImage(${index})">×</button>
            `;
            imagePreview.appendChild(previewDiv);
        });
    }
}

// Remove image
function removeImage(index) {
    uploadedImages.splice(index, 1);
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
        uploadedImages.forEach((image, idx) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            previewDiv.innerHTML = `
                <img src="${image.url}" alt="Preview ${idx + 1}">
                <button type="button" class="remove-btn" onclick="removeImage(${idx})">×</button>
            `;
            imagePreview.appendChild(previewDiv);
        });
    }
}

// Update preview
function updatePreview() {
    const titleEl = document.getElementById('title');
    const priceEl = document.getElementById('price');
    const areaEl = document.getElementById('area');
    const cityEl = document.getElementById('city');
    const districtEl = document.getElementById('district');
    const addressEl = document.getElementById('address');

    const title = titleEl ? titleEl.value || 'Tiêu đề tin đăng sẽ hiển thị ở đây' : 'Tiêu đề tin đăng sẽ hiển thị ở đây';
    const price = priceEl ? priceEl.value : '';
    const area = areaEl ? areaEl.value : '';
    const city = cityEl ? cityEl.value : '';
    const district = districtEl ? districtEl.value : '';
    const address = addressEl ? addressEl.value : '';

    const previewTitle = document.getElementById('previewTitle');
    const previewPrice = document.getElementById('previewPrice');
    const previewArea = document.getElementById('previewArea');
    const previewAddress = document.getElementById('previewAddress');

    if (previewTitle) previewTitle.textContent = title;
    if (previewPrice) previewPrice.textContent = price ? formatPrice(price) + '/tháng' : '0 VNĐ/tháng';
    if (previewArea) previewArea.textContent = `Diện tích: ${area || '--'} m²`;

    // Update address
    let fullAddress = '';
    if (address) fullAddress += address;
    if (district) fullAddress += (fullAddress ? ', ' : '') + getDistrictName(district);
    if (city) fullAddress += (fullAddress ? ', ' : '') + getCityName(city);
    
    if (previewAddress) previewAddress.textContent = fullAddress || 'Địa chỉ sẽ hiển thị ở đây';

    // Update amenities
    const selectedAmenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked'));
    const amenitiesContainer = document.getElementById('previewAmenities');
    if (amenitiesContainer) {
        amenitiesContainer.innerHTML = '';
        
        selectedAmenities.slice(0, 3).forEach(amenity => {
            const span = document.createElement('span');
            span.className = 'bg-gray-100 px-2 py-1 rounded text-sm flex items-center';
            span.innerHTML = `<i data-feather="${getAmenityIcon(amenity.value)}" class="mr-1 w-4 h-4"></i> ${getAmenityLabel(amenity.value)}`;
            amenitiesContainer.appendChild(span);
        });

        if (selectedAmenities.length > 3) {
            const moreSpan = document.createElement('span');
            moreSpan.className = 'bg-gray-100 px-2 py-1 rounded text-sm';
            moreSpan.textContent = `+${selectedAmenities.length - 3}`;
            amenitiesContainer.appendChild(moreSpan);
        }
    }

    // Re-initialize feather icons
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Utility functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
}

function getCityName(cityCode) {
    // Web chỉ hoạt động trên địa bàn Hà Nội
    const cities = {
        'ha-noi': 'Hà Nội'
    };
    return cities[cityCode] || 'Hà Nội'; // Default to Hà Nội
}

function getDistrictName(districtCode) {
    return districtCode.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getAmenityLabel(value) {
    const labels = {
        'wifi': 'WiFi',
        'parking': 'Chỗ để xe',
        'ac': 'Điều hòa',
        'kitchen': 'Bếp riêng',
        'laundry': 'Máy giặt',
        'tv': 'TV',
        'balcony': 'Ban công',
        'security': 'An ninh 24/7',
        'elevator': 'Thang máy'
    };
    return labels[value] || value;
}

function getAmenityIcon(value) {
    const icons = {
        'wifi': 'wifi',
        'parking': 'truck',
        'ac': 'wind',
        'kitchen': 'home',
        'laundry': 'droplet',
        'tv': 'tv',
        'balcony': 'sun',
        'security': 'shield',
        'elevator': 'arrow-up'
    };
    return icons[value] || 'check';
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateCurrentStep()) {
        return;
    }

    const agreeTerms = document.getElementById('agreeTerms');
    if (!agreeTerms || !agreeTerms.checked) {
        alert('Vui lòng đồng ý với điều khoản sử dụng');
        return;
    }

    // Check authentication
    if (!isAuthenticated()) {
        alert('Vui lòng đăng nhập để đăng tin');
        window.location.href = 'auth.html';
        return;
    }

    // Show loading
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
    }

    try {
        // Collect form data and map to backend format
        const titleEl = document.getElementById('title');
        const descriptionEl = document.getElementById('description');
        const addressEl = document.getElementById('address');
        const districtEl = document.getElementById('district');
        const cityEl = document.getElementById('city');
        const priceEl = document.getElementById('price');
        const areaEl = document.getElementById('area');
        const availableDateEl = document.getElementById('availableDate');
        
        // Get district name (not code)
        const districtValue = districtEl ? districtEl.value : '';
        const districtName = districtValue ? getDistrictName(districtValue) : '';
        
        // Backend nhận BaiDangChoThue entity với snake_case fields
        // Web chỉ hoạt động trên địa bàn Hà Nội
        const postData = {
            tieu_de: titleEl ? titleEl.value.trim() : '',
            mo_ta: descriptionEl ? descriptionEl.value.trim() : '',
            dia_chi_day_du: addressEl ? addressEl.value.trim() : '',
            phuong_xa: districtName || districtValue,
            tinh_thanhpho: 'Hà Nội', // Luôn là Hà Nội
            gia_thang: priceEl ? parseFloat(priceEl.value) || 0 : 0,
            dien_tich_m2: areaEl ? parseFloat(areaEl.value) || 0 : 0,
            nguoiDang: {
                "id": Number(localStorage.getItem("user_id"))
            }
        };
        
        // Handle available date if exists
        if (availableDateEl && availableDateEl.value) {
            // Convert date string to LocalDateTime format (YYYY-MM-DDTHH:mm:ss)
            postData.ngay_co_the_vao_o = availableDateEl.value + 'T00:00:00';
        }

        // Validate required fields
        if (!postData.tieu_de || !postData.mo_ta || !postData.dia_chi_day_du || 
            !postData.phuong_xa || !postData.tinh_thanhpho || !postData.gia_thang || !postData.dien_tich_m2) {
            alert('Vui lòng điền đầy đủ thông tin bắt buộc');
            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            return;
        }

        console.log('Sending post data:', postData);

        // Send to backend using apiPost if available, otherwise use fetch
        let response;
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const fetchResponse = await fetch('http://localhost:8080/api/baidang', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(postData)
        });
            
        if (!fetchResponse.ok) {
            const errorText = await fetchResponse.text();
            throw new Error(errorText || `HTTP ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();

        // Upload images if there are any
        if (uploadedImages.length > 0 && response.id) {
            try {
                const formData = new FormData();
                uploadedImages.forEach((image, index) => {
                    formData.append('files', image.file);
                });

                const imageUploadResponse = await fetch(`http://localhost:8080/api/hinhanh/upload/${response.id}`, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: formData
                });

                if (!imageUploadResponse.ok) {
                    console.error('Failed to upload images:', await imageUploadResponse.text());
                } else {
                    const uploadedImagesList = await imageUploadResponse.json();
                    // Set first image as thumbnail if there are images
                    if (uploadedImagesList.length > 0 && uploadedImagesList[0].id) {
                        await fetch(`http://localhost:8080/api/hinhanh/set-thumbnail/${uploadedImagesList[0].id}`, {
                            method: 'PUT',
                            headers: {
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            }
                        });
                    }
                }
            } catch (imageError) {
                console.error('Error uploading images:', imageError);
                // Don't fail the whole operation if image upload fails
            }
        }

        // Success - show success modal
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        const successModal = document.getElementById('successModal');
        if (successModal) {
            successModal.classList.remove('hidden');
        }
        
        // Redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 3000);
        
    } catch (error) {
        console.error('Error submitting post:', error);
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        
        const errorMessage = error.message || 'Có lỗi xảy ra khi đăng tin. Vui lòng thử lại.';
        alert(errorMessage);
        
        // If unauthorized, redirect to login
        if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('đăng nhập'))) {
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        }
    }
}

// Smooth scroll for navigation
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

