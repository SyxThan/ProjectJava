// Backend API base
const API_BASE = 'http://localhost:8080';

// Get room ID from URL
const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('id');
const userId = Number(localStorage.getItem("user_id")) || 0;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Feather Icons
    feather.replace();

    // Mobile menu toggle
    document.getElementById('mobile-menu-button')?.addEventListener('click', function() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    });

    if (!roomId) {
        showError('Không tìm thấy thông tin phòng trọ');
        return;
    }

    // Load room details
    await loadRoomDetails();
    
    // Setup love button
    await setupLoveButton();
});

// Setup love button event listener
async function setupLoveButton() {
    const loveButton = document.getElementById('love');
    if (!loveButton) {
        console.error('Love button not found!');
        return;
    }
    
    // Check if user has liked this room
    if (userId > 0) {
        await checkLoveStatus();
    } else {
        loveButton.addEventListener('click', function(e) {
            e.preventDefault();
            alert('Vui lòng đăng nhập để thích phòng trọ');
        });
        return;
    }
    
    // Add click listener to toggle love
    loveButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (userId <= 0) {
            alert('Vui lòng đăng nhập để thích phòng trọ');
            return;
        }
        
        await toggleLove();
    });
}

// Check love status when page loads
async function checkLoveStatus() {
    try {
        const response = await fetch(
            `${API_BASE}/api/usertracking/islove/${userId}/${roomId}`
        );
        
        if (response.ok) {
            const data = await response.json();
            console.log('Love status response:', data);
            
            // Đợi 100ms để feather.replace() hoàn thành
            setTimeout(() => {
                const loveButton = document.getElementById('love');
                if (!loveButton) {
                    console.error('Love button not found in checkLoveStatus');
                    return;
                }
                
                const heartIcon = loveButton.querySelector('svg');
                if (!heartIcon) {
                    console.error('Heart icon (SVG) not found');
                    return;
                }
                
                if (data.isLove) {
                    // User has liked - add red color
                    console.log("User loved this room - applying red color");
                    heartIcon.style.color = '#ef4444';
                    heartIcon.style.fill = '#ef4444';
                    loveButton.setAttribute('data-liked', 'true');
                } else {
                    // User hasn't liked - gray color
                    console.log("User hasn't liked - applying gray color");
                    heartIcon.style.color = '#9ca3af'; 
                    heartIcon.style.fill = 'none';
                    loveButton.setAttribute('data-liked', 'false');
                }
            }, 100);
        } else {
            console.error('Failed to check love status:', response.status);
        }
    } catch (error) {
        console.error('Error checking love status:', error);
    }
}

// Toggle love status
async function toggleLove() {
    try {
        const loveButton = document.getElementById('love');
        const heartIcon = loveButton.querySelector('svg');
        const isLiked = loveButton.getAttribute('data-liked') === 'true';
        
        console.log('Toggle love - current state:', isLiked);
        
        if (isLiked) {
            // Unlike - send DELETE request
            const response = await fetch(
                `${API_BASE}/api/usertracking/deletelove/${userId}/${roomId}`,
                {
                    method: 'DELETE'
                }
            );
            
            if (response.ok) {
                console.log('Unlike successful');
                // Remove red color
                heartIcon.style.color = '#9ca3af';
                heartIcon.style.fill = 'none';
                loveButton.setAttribute('data-liked', 'false');
            } else {
                console.error('Unlike failed:', response.status);
                alert('Có lỗi khi bỏ thích. Vui lòng thử lại');
            }
        } else {
            // Like - send POST request
            const response = await fetch(
                `${API_BASE}/api/usertracking`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        user_id: userId,
                        bai_dang_id: roomId,
                        type: 'like'
                    })
                }
            );
            
            if (response.ok) {
                console.log('Like successful');
                // Add red color
                heartIcon.style.color = '#ef4444';
                heartIcon.style.fill = '#ef4444';
                loveButton.setAttribute('data-liked', 'true');
            } else {
                console.error('Like failed:', response.status);
                alert('Có lỗi khi thích. Vui lòng thử lại');
            }
        }
    } catch (error) {
        console.error('Error toggling love:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại');
    }
}

// Load room details from API
async function loadRoomDetails() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/baidang/${roomId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const room = await response.json();
        
        displayRoomDetails(room);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading room details:', error);
        showError('Không thể tải thông tin phòng trọ. Vui lòng thử lại sau.');
        hideLoading();
    }
}

// Display room details
function displayRoomDetails(room) {
    // Update page title
    document.title = `${room.tieu_de} - Phòng Trọ 24/7`;
    
    // Room title
    document.getElementById('roomTitle').textContent = room.tieu_de;
    
    // Room location
    document.getElementById('roomLocation').innerHTML = `
        <i data-feather="map-pin" class="w-5 h-5 mr-1"></i>
        <span>${room.dia_chi_day_du}</span>
    `;
    
    // Room status badge
    const statusBadges = document.getElementById('statusBadges');
    statusBadges.innerHTML = '';
    if (room.trangThai === 'CHUA_DUYET') {
        statusBadges.innerHTML += `
            <div class="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                Chờ duyệt
            </div>
        `;
    } else if (room.trangThai === 'DA_DUYET') {
        statusBadges.innerHTML += `
            <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Đã duyệt
            </div>
        `;
    }
    
    // Room gallery - xử lý hinhAnhPhongTro
    let images = [];
    if (room.hinhAnhPhongTro && room.hinhAnhPhongTro.length > 0) {
        // Tìm ảnh bìa trước (laAnhBia: true)
        const coverImage = room.hinhAnhPhongTro.find(img => img.laAnhBia === true);
        if (coverImage && coverImage.duong_dan_anh) {
            images.push(coverImage.duong_dan_anh);
        }
        
        // Lấy các ảnh từ array (laAnhBia: false)
        const imageArrayItem = room.hinhAnhPhongTro.find(img => img.laAnhBia === false);
        if (imageArrayItem && imageArrayItem.duong_dan_anh) {
            // Parse chuỗi JSON array
            try {
                const parsedImages = JSON.parse(imageArrayItem.duong_dan_anh.replace(/'/g, '"'));
                if (Array.isArray(parsedImages)) {
                    images = images.concat(parsedImages);
                }
            } catch (e) {
                console.error('Error parsing images:', e);
            }
        }
    }
    
    if (images.length > 0) {
        const mainImage = document.getElementById('mainImage');
        mainImage.src = images[0];
        mainImage.alt = room.tieu_de;
        
        document.getElementById('imageCount').textContent = `1/${images.length}`;
        
        const thumbnails = document.getElementById('thumbnails');
        thumbnails.innerHTML = images.map((img, index) => `
            <div class="flex-shrink-0 w-24 h-16 rounded-md overflow-hidden cursor-pointer ${index === 0 ? 'border-2 border-blue-500' : 'hover:border-2 hover:border-blue-500'}" 
                 onclick="changeMainImage('${img}', ${index})">
                <img src="${img}" alt="Ảnh ${index + 1}" class="w-full h-full object-cover">
            </div>
        `).join('');
    }
    
    // Room info
    document.getElementById('roomPrice').textContent = `${formatPrice(room.gia_thang)}/tháng`;
    document.getElementById('roomArea').textContent = `${room.dien_tich_m2}m²`;
    document.getElementById('roomType').textContent = 'Phòng trọ';
    document.getElementById('roomCapacity').textContent = 'Liên hệ';
    
    // Room description
    document.getElementById('roomDescription').innerHTML = formatDescription(room.mo_ta);
    
    // Amenities
    const amenitiesGrid = document.getElementById('amenitiesGrid');
    amenitiesGrid.innerHTML = '<p class="text-gray-500">Thông tin tiện nghi sẽ được cập nhật sau</p>';
    
    // Owner info
    if (room.nguoiDang) {
        document.getElementById('ownerName').textContent = room.nguoiDang.fullname || 'Chủ nhà';
        document.getElementById('ownerPhone').textContent = room.nguoiDang.so_dien_thoai || 'Chưa cập nhật';
        document.getElementById('ownerPhone').href = `tel:${room.nguoiDang.so_dien_thoai}`;
        
        if (room.nguoiDang.email) {
            document.getElementById('ownerEmail').textContent = room.nguoiDang.email;
            document.getElementById('ownerEmail').href = `mailto:${room.nguoiDang.email}`;
            document.getElementById('ownerEmailContainer').classList.remove('hidden');
        }
    }
    
    // Posted date
    if (room.ngay_dang) {
        document.getElementById('postedDate').textContent = formatDate(room.ngay_dang);
    }
    
    // Replace feather icons
    feather.replace();
}

// Change main image
function changeMainImage(imageSrc, index) {
    const mainImage = document.getElementById('mainImage');
    mainImage.src = imageSrc;
    
    // Update image count
    const thumbnails = document.querySelectorAll('#thumbnails > div');
    document.getElementById('imageCount').textContent = `${index + 1}/${thumbnails.length}`;
    
    // Update border
    thumbnails.forEach((thumb, i) => {
        if (i === index) {
            thumb.classList.add('border-2', 'border-blue-500');
        } else {
            thumb.classList.remove('border-2', 'border-blue-500');
        }
    });
}

// Format price
function formatPrice(price) {
    if (!price) return 'Liên hệ';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Chưa rõ';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Format description
function formatDescription(text) {
    if (!text) return '<p class="text-gray-500">Chưa có mô tả</p>';
    
    // Convert line breaks to <p> tags
    const paragraphs = text.split('\n').filter(p => p.trim());
    return paragraphs.map(p => `<p class="mb-3">${p}</p>`).join('');
}

// Show loading
function showLoading() {
    document.getElementById('loadingState')?.classList.remove('hidden');
    document.getElementById('roomContent')?.classList.add('hidden');
}

// Hide loading
function hideLoading() {
    document.getElementById('loadingState')?.classList.add('hidden');
    document.getElementById('roomContent')?.classList.remove('hidden');
}

// Show error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'container mx-auto px-4 py-8';
    errorDiv.innerHTML = `
        <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i data-feather="alert-circle" class="text-red-600 w-12 h-12 mx-auto mb-4"></i>
            <h2 class="text-xl font-bold text-red-600 mb-2">Có lỗi xảy ra</h2>
            <p class="text-gray-600 mb-4">${message}</p>
            <a href="search.html" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Quay lại trang tìm kiếm
            </a>
        </div>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(errorDiv);
    feather.replace();
}
