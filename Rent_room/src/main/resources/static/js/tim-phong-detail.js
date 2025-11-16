// Backend API base
const API_BASE = 'http://localhost:8080';

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Feather Icons
    feather.replace();

    if (!postId) {
        showError('Không tìm thấy thông tin bài đăng');
        return;
    }

    // Load post details
    await loadPostDetails();
});

// Load post details from API
async function loadPostDetails() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE}/api/baidangtimphong/${postId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Không tìm thấy bài đăng');
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const post = await response.json();
        displayPostDetails(post);
        
        hideLoading();
    } catch (error) {
        console.error('Error loading post details:', error);
        showError('Không thể tải thông tin bài đăng. Vui lòng thử lại sau.');
        hideLoading();
    }
}

// Display post details
function displayPostDetails(post) {
    // Update page title
    document.title = `${post.tieuDe || 'Tin tìm phòng'} - Phòng Trọ 24/7`;
    
    // Post title
    document.getElementById('postTitle').textContent = post.tieuDe || 'Không có tiêu đề';
    
    // Post location
    const location = `${post.khuVucMongMuonXa || ''}, ${post.khuVucMongMuonThanhPho || ''}`.trim();
    document.getElementById('postLocation').innerHTML = `
        <i data-feather="map-pin" class="w-5 h-5 mr-1"></i>
        <span>${location || 'Chưa cập nhật'}</span>
    `;
    
    // Post status badge
    const statusBadges = document.getElementById('statusBadges');
    statusBadges.innerHTML = '';
    if (post.trangThai === 'dang_tim') {
        statusBadges.innerHTML += `
            <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Đang tìm phòng
            </div>
        `;
    } else if (post.trangThai === 'da_tim_duoc') {
        statusBadges.innerHTML += `
            <div class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Đã tìm được phòng
            </div>
        `;
    }
    
    // Price range
    const priceMin = formatPrice(post.giaThapNhat || 0);
    const priceMax = formatPrice(post.giaCaoNhat || 0);
    document.getElementById('postPriceRange').textContent = `${priceMin} - ${priceMax}/tháng`;
    
    // Area
    const area = post.dienTichToiThieu || 0;
    document.getElementById('postArea').textContent = `${area} m²`;
    
    // Number of people
    const people = post.soNguoiO || 'Chưa xác định';
    document.getElementById('postPeople').textContent = people === 'Chưa xác định' ? people : `${people} người`;
    
    // Desired area
    const desiredArea = `${post.khuVucMongMuonXa || ''}, ${post.khuVucMongMuonThanhPho || ''}`.trim();
    document.getElementById('postDesiredArea').textContent = desiredArea || 'Chưa xác định';
    
    // Description
    const description = post.moTa || 'Không có mô tả';
    document.getElementById('postDescription').innerHTML = `
        <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(description)}</p>
    `;
    
    // Poster info
    const posterName = post.userFullname || 'Người đăng tin';
    const posterPhone = post.userSoDienThoai || '';
    const posterEmail = post.userEmail || '';
    
    document.getElementById('posterName').textContent = posterName;
    
    if (posterPhone) {
        document.getElementById('posterPhone').href = `tel:${posterPhone}`;
        document.getElementById('posterPhone').querySelector('span').textContent = posterPhone;
    } else {
        document.getElementById('posterPhone').href = '#';
        document.getElementById('posterPhone').querySelector('span').textContent = 'Chưa cập nhật';
        document.getElementById('posterPhone').classList.add('opacity-50', 'cursor-not-allowed');
    }
    
    if (posterEmail) {
        document.getElementById('posterEmailContainer').classList.remove('hidden');
        document.getElementById('posterEmail').href = `mailto:${posterEmail}`;
        document.getElementById('posterEmail').querySelector('span').textContent = posterEmail;
    } else {
        document.getElementById('posterEmailContainer').classList.add('hidden');
    }
    
    // Posted date
    const postedDate = formatDate(post.ngayDang);
    document.getElementById('postedDate').textContent = postedDate || 'Chưa xác định';
    
    // Re-initialize feather icons
    feather.replace();
}

// Format price
function formatPrice(price) {
    if (!price && price !== 0) return '0';
    if (price >= 1000000) {
        const trieu = price / 1000000;
        return trieu.toFixed(trieu % 1 === 0 ? 0 : 1) + ' triệu';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

// Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show loading
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('postContent').classList.add('hidden');
}

// Hide loading
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('postContent').classList.remove('hidden');
}

// Show error
function showError(message) {
    hideLoading();
    const content = document.getElementById('postContent');
    content.innerHTML = `
        <div class="w-full text-center py-20">
            <i data-feather="alert-circle" class="w-16 h-16 text-red-500 mx-auto mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Lỗi</h2>
            <p class="text-gray-600 mb-6">${escapeHtml(message)}</p>
            <a href="tim-phong.html" class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                Quay lại danh sách
            </a>
        </div>
    `;
    content.classList.remove('hidden');
    feather.replace();
}

