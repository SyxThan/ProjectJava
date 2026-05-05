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
    // Load comments
    await loadComments();

    // Setup comment form
    setupCommentForm();

    
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
                showToast('Đã bỏ lưu phòng trọ');
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
                showToast('Đã lưu phòng trọ vào danh sách yêu thích', true);
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

// Show toast notification
function showToast(message, showLink = false) {
    // Remove existing toast if any
    const existingToast = document.getElementById('toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 animate-slide-up';
    toast.style.animation = 'slideUp 0.3s ease-out';
    
    toast.innerHTML = `
        <i data-feather="check-circle" class="w-5 h-5 text-green-400"></i>
        <span>${message}</span>
        ${showLink ? '<a href="favorites.html" class="ml-2 underline hover:text-blue-400">Xem danh sách</a>' : ''}
    `;
    
    document.body.appendChild(toast);
    
    // Initialize feather icons for the toast
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Add animation styles
    if (!document.getElementById('toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            @keyframes slideDown {
                from {
                    transform: translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateY(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
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
    const images = collectRoomImages(room.hinhAnhPhongTro || []);
    
    if (images.length > 0) {
        const mainImage = document.getElementById('mainImage');
        if (mainImage) {
            mainImage.src = images[0];
            mainImage.alt = room.tieu_de;
        }
        
        const imageCount = document.getElementById('imageCount');
        if (imageCount) {
            imageCount.textContent = `1/${images.length}`;
        }
        
        const thumbnails = document.getElementById('thumbnails');
        if (thumbnails) {
            thumbnails.innerHTML = '';
            images.forEach((img, index) => {
                const thumbWrapper = document.createElement('div');
                thumbWrapper.className = `flex-shrink-0 w-24 h-16 rounded-md overflow-hidden cursor-pointer ${index === 0 ? 'border-2 border-blue-500' : 'hover:border-2 hover:border-blue-500'}`;
                const thumbImg = document.createElement('img');
                thumbImg.src = img;
                thumbImg.alt = `Ảnh ${index + 1}`;
                thumbImg.className = 'w-full h-full object-cover';
                thumbWrapper.addEventListener('click', () => changeMainImage(img, index));
                thumbWrapper.appendChild(thumbImg);
                thumbnails.appendChild(thumbWrapper);
            });
        }
    } else {
        console.warn('Không tìm thấy ảnh hiển thị cho bài đăng:', room.id);
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

// Thu thập danh sách ảnh hợp lệ từ dữ liệu trả về
function collectRoomImages(imageRecords) {
    if (!Array.isArray(imageRecords) || imageRecords.length === 0) {
        return [];
    }
    
    const coverImages = imageRecords.filter(img => img && img.laAnhBia);
    const otherImages = imageRecords.filter(img => img && !img.laAnhBia);
    const orderedImages = [...coverImages, ...otherImages];
    
    const uniqueImages = [];
    const seen = new Set();
    
    orderedImages.forEach(record => {
        const paths = extractImagePaths(record?.duong_dan_anh);
        paths.forEach(path => {
            const normalized = normalizeImageUrl(path);
            if (normalized && !seen.has(normalized)) {
                seen.add(normalized);
                uniqueImages.push(normalized);
            }
        });
    });
    
    return uniqueImages;
}

// Xử lý chuỗi đường dẫn ảnh có thể ở nhiều định dạng khác nhau
function extractImagePaths(rawValue) {
    if (!rawValue || typeof rawValue !== 'string') {
        return [];
    }
    
    const value = rawValue.trim();
    if (!value) {
        return [];
    }
    
    // Nếu backend trả về JSON array
    if (value.startsWith('[')) {
        try {
            const parsed = JSON.parse(value.replace(/'/g, '"'));
            if (Array.isArray(parsed)) {
                return parsed
                    .filter(item => typeof item === 'string')
                    .map(item => item.trim())
                    .filter(Boolean);
            }
        } catch (err) {
            console.warn('Không thể parse JSON array ảnh:', err);
        }
    }
    
    // Nếu backend trả về JSON object có trường images
    if (value.startsWith('{')) {
        try {
            const parsed = JSON.parse(value.replace(/'/g, '"'));
            if (Array.isArray(parsed?.images)) {
                return parsed.images
                    .filter(item => typeof item === 'string')
                    .map(item => item.trim())
                    .filter(Boolean);
            }
        } catch (err) {
            console.warn('Không thể parse JSON object ảnh:', err);
        }
    }
    
    // Nếu chuỗi chứa nhiều đường dẫn cách nhau bởi dấu phẩy
    if (value.includes(',')) {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }
    
    // Ngược lại xem như một đường dẫn duy nhất
    return [value];
}

// Chuẩn hoá đường dẫn ảnh để tránh lỗi hiển thị
function normalizeImageUrl(path) {
    if (!path || typeof path !== 'string') {
        return null;
    }
    
    const trimmed = path.trim();
    if (!trimmed) {
        return null;
    }
    
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
        return trimmed;
    }
    
    // Giữ nguyên đường dẫn tuyệt đối bắt đầu bằng /
    if (trimmed.startsWith('/')) {
        return trimmed;
    }
    
    // Đảm bảo thêm dấu / đầu nếu thiếu để khớp với static path
    return `/${trimmed}`;
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

// ===================== COMMENT SECTION FUNCTIONS =====================

// Get token from localStorage
function getAuthToken() {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('jwtToken');
    console.log('[AUTH] Token lookup result:', token ? 'Found' : 'Not found');
    return token;
}

function getUserId() {
    // Prefer explicit user_id key saved by auth.js
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        try {
            const userObj = JSON.parse(localStorage.getItem('user'));
            if (userObj && (userObj.user_id || userObj.userId)) {
                userId = userObj.user_id || userObj.userId;
            }
        } catch (e) {
            console.warn('[AUTH] Cannot parse user object for userId');
        }
    }
    if (userId) {
        // Ensure integer
        userId = parseInt(userId, 10);
        if (isNaN(userId) || userId <= 0) {
            console.warn('[AUTH] Invalid userId value:', userId);
            return null;
        }
        console.log('[AUTH] Using userId header:', userId);
        return userId;
    }
    console.warn('[AUTH] userId not found in storage');
    return null;
}

function getCurrentUserName() {
    try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        if (userObj && userObj.fullname) {
            return userObj.fullname;
        }
        if (userObj && userObj.email) {
            return userObj.email.split('@')[0]; // Use part before @
        }
    } catch (e) {
        console.warn('[AUTH] Cannot parse user object for name');
    }
    return 'Bạn';
}

// Load comments from backend
async function loadComments() {
    try {
        console.log('[COMMENTS] Loading comments for room:', roomId);
        showCommentsLoading();
        
        let response;
        try {
            response = await fetch(`${API_BASE}/api/bai-dang-cho-thue/${roomId}/binh-luan`, { mode: 'cors' });
        } catch (netErr) {
            console.error('[COMMENTS] Network error loading comments:', netErr);
            // Fallback attempt with window.location.origin
            if (window.location && window.location.origin && window.location.origin !== API_BASE) {
                const fallback = `${window.location.origin}/api/bai-dang-cho-thue/${roomId}/binh-luan`;
                console.log('[COMMENTS] Retry load with fallback:', fallback);
                try {
                    response = await fetch(fallback, { mode: 'cors' });
                } catch (fallbackErr) {
                    console.error('[COMMENTS] Fallback load failed:', fallbackErr);
                    showCommentsEmpty();
                    showCommentError('Không thể tải bình luận (Failed to fetch). Kiểm tra backend và kết nối mạng.');
                    return;
                }
            } else {
                showCommentsEmpty();
                showCommentError('Không thể tải bình luận (Failed to fetch). Backend có chạy tại http://localhost:8080?');
                return;
            }
        }
        
        console.log('[COMMENTS] Load response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('[COMMENTS] No comments found (404)');
                showCommentsEmpty();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const comments = await response.json();
        console.log('[COMMENTS] Loaded comments:', comments);
        
        if (Array.isArray(comments) && comments.length > 0) {
            displayComments(comments);
            hideCommentsLoading();
        } else {
            console.log('[COMMENTS] Empty comments list');
            showCommentsEmpty();
        }
    } catch (error) {
        console.error('[COMMENTS] Error loading comments:', error);
        showCommentsEmpty();
    }
}

// Display comments
function displayComments(comments) {
    console.log('[COMMENTS] Displaying', comments.length, 'comments');
    
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');
    const loadingState = document.getElementById('commentsLoading');
    
    if (!commentsList) {
        console.error('[COMMENTS] commentsList element not found');
        return;
    }
    
    commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    
    comments.forEach((comment, index) => {
        try {
            const commentElement = createCommentElement(comment, index);
            // Store actual comment ID for reply functionality
            if (comment.id) {
                commentElement.dataset.commentId = comment.id;
            }
            commentsList.appendChild(commentElement);
        } catch (e) {
            console.error('[COMMENTS] Error creating comment element:', e);
        }
    });
}

// Create a single comment element
function createCommentElement(comment, index) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.id = `comment-${index}`;
    
    // Support multiple field name variations for full name display
    const author = comment.fullname || comment.hoTen || comment.tenNguoiDung || comment.author || comment.userName || comment.name || 'Khách hàng';
    const content = comment.noiDung || comment.content || comment.text || '';
    const dateStr = comment.ngayTao || comment.createdAt || comment.created_at || new Date().toISOString();
    const replies = comment.binhLuanCon || comment.replies || [];
    const rating = comment.danhGiaSao || comment.rating || 0;
    
    const initials = author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const formattedDate = formatCommentDate(dateStr);
    
    div.innerHTML = `
        <div class="comment-main">
            <div class="comment-avatar">${initials}</div>
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${escapeHtml(author)}</span>
                    <span class="comment-date">${formattedDate}</span>
                </div>
                
                ${rating > 0 ? `
                    <div class="comment-rating">
                        ${Array(5).fill().map((_, i) => 
                            `<span class="star">${i < rating ? '★' : '☆'}</span>`
                        ).join('')}
                    </div>
                ` : ''}
                
                <div class="comment-text">${escapeHtml(content)}</div>
                
                <div class="comment-actions">
                    <button class="action-btn" onclick="toggleReplyForm(${index})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                        Trả lời
                    </button>
                </div>
                
                <!-- Reply Form -->
                <div id="reply-form-${index}" class="reply-form">
                    <div class="reply-form-header">
                        <div class="reply-avatar">
                            ${getCurrentUserName().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                        <span class="reply-author">${getCurrentUserName()}</span>
                    </div>
                    <textarea 
                        id="reply-input-${index}" 
                        class="reply-textarea"
                        placeholder="Viết phản hồi của bạn..." 
                        maxlength="1000"></textarea>
                    <div class="reply-form-actions">
                        <button onclick="cancelReply(${index})" class="reply-btn reply-btn-cancel">Hủy</button>
                        <button onclick="submitReply(${index})" class="reply-btn reply-btn-submit">Gửi phản hồi</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Replies List -->
        ${replies && replies.length > 0 ? `
            <div class="replies-section">
                <div class="replies-list">
                    ${replies.map((reply, replyIndex) => createReplyElement(reply, index, replyIndex)).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    return div;
}

// Create reply element
function createReplyElement(reply, parentIndex, replyIndex) {
    const author = reply.fullname || reply.hoTen || reply.tenNguoiDung || reply.author || reply.userName || reply.name || 'Khách hàng';
    const content = reply.noiDung || reply.content || reply.text || '';
    const dateStr = reply.ngayTao || reply.createdAt || reply.created_at || new Date().toISOString();
    
    const initials = author.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const formattedDate = formatCommentDate(dateStr);
    
    return `
        <div class="reply-item">
            <div class="reply-main">
                <div class="reply-avatar-small">${initials}</div>
                <div class="reply-content">
                    <div class="reply-header">
                        <span class="reply-author">${escapeHtml(author)}</span>
                        <span class="reply-date">${formattedDate}</span>
                    </div>
                    <div class="reply-text">${escapeHtml(content)}</div>
                </div>
            </div>
        </div>
    `;
}

// Setup comment form
function setupCommentForm() {
    console.log('[COMMENTS] Setting up comment form');
    
    const submitBtn = document.getElementById('submitCommentBtn');
    const commentInput = document.getElementById('commentInput');
    const charCount = document.getElementById('charCount');
    
    if (submitBtn) {
        submitBtn.addEventListener('click', sendComment);
    }
    
    if (commentInput) {
        // Character counting
        commentInput.addEventListener('input', function() {
            if (charCount) {
                charCount.textContent = this.value.length;
                
                // Visual feedback for character limit
                const remaining = 5000 - this.value.length;
                if (remaining < 500) {
                    charCount.style.color = remaining < 100 ? '#dc2626' : '#f59e0b';
                } else {
                    charCount.style.color = '#64748b';
                }
            }
        });
        
        // Keyboard shortcuts
        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendComment();
            }
        });
        
        // Auto-resize
        commentInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.max(120, this.scrollHeight) + 'px';
        });
    }
    
    // Set current user name and avatar
    updateCurrentUserDisplay();
}

// Update current user display in comment form
function updateCurrentUserDisplay() {
    const userName = getCurrentUserName();
    const userNameElement = document.getElementById('currentUserName');
    const userAvatarElement = document.getElementById('currentUserAvatar');
    
    if (userNameElement) {
        if (userName !== 'Bạn') {
            userNameElement.textContent = userName;
            userNameElement.className = 'user-name';
        } else {
            userNameElement.textContent = 'Vui lòng đăng nhập để bình luận';
            userNameElement.className = 'user-name';
        }
    }
    
    if (userAvatarElement && userName !== 'Bạn') {
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        userAvatarElement.innerHTML = `<span>${initials}</span>`;
        userAvatarElement.className = 'user-avatar-large';
    }
}

// Send comment with proper error handling and authorization
async function sendComment() {
    console.log('[COMMENTS] sendComment() called');
    
    const commentInput = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');
    
    if (!commentInput) {
        console.error('[COMMENTS] Comment input element not found');
        return;
    }
    
    const content = commentInput.value.trim();
    
    // Validation
    if (!content) {
        showCommentError('Vui lòng nhập bình luận');
        return;
    }
    
    if (content.length > 5000) {
        showCommentError('Bình luận không được vượt quá 5000 ký tự');
        return;
    }
    
    // Check authentication
    const token = getAuthToken();
    if (!token) {
        console.warn('[COMMENTS] No token found in localStorage');
        showCommentError('Bạn cần đăng nhập để bình luận');
        return;
    }
    
    console.log('[COMMENTS] Token found, length:', token.length);
    console.log('[COMMENTS] Room ID:', roomId);
    
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Đang gửi...';
        
        const requestBody = {
            noiDung: content
            // Note: danhGiaSao is optional, idBinhLuanCha is null for main comments
        };
        
        const endpoint = `${API_BASE}/api/bai-dang-cho-thue/${roomId}/binh-luan`;
        const userId = getUserId();
        if (!userId) {
            showCommentError('Không xác định được người dùng (userId). Vui lòng đăng nhập lại.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
        console.log('[COMMENTS] Sending request to:', endpoint);
        console.log('[COMMENTS] Request body:', requestBody);
        console.log('[COMMENTS] Authorization: Bearer', token.substring(0, 20) + '...');
        console.log('[COMMENTS] Header userId:', userId);
        
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'userId': userId.toString()
                },
                body: JSON.stringify(requestBody)
            });
        } catch (netErr) {
            console.error('[COMMENTS] Network/Fetch error first attempt:', netErr);
            // Fallback try same path with window.location.origin
            if (window.location && window.location.origin && window.location.origin !== API_BASE) {
                const fallbackEndpoint = `${window.location.origin}/api/bai-dang-cho-thue/${roomId}/binh-luan`;
                console.log('[COMMENTS] Retrying with fallback endpoint:', fallbackEndpoint);
                try {
                    response = await fetch(fallbackEndpoint, {
                        method: 'POST',
                        mode: 'cors',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            'userId': userId.toString()
                        },
                        body: JSON.stringify(requestBody)
                    });
                } catch (fallbackErr) {
                    console.error('[COMMENTS] Fallback network error:', fallbackErr);
                    showCommentError('Không thể kết nối tới server. Kiểm tra backend (http://localhost:8080) đang chạy và không bị chặn Mixed Content (HTTPS gọi HTTP).');
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    return;
                }
            } else {
                showCommentError('Không thể kết nối tới server (Failed to fetch). Vui lòng kiểm tra backend đang chạy.');
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                return;
            }
        }
        
        console.log('[COMMENTS] Response status:', response.status);
        console.log('[COMMENTS] Response headers - Content-Type:', response.headers.get('content-type'));
        
        let responseText = '';
        try {
            responseText = await response.text();
            console.log('[COMMENTS] Response text:', responseText);
        } catch (e) {
            console.log('[COMMENTS] Could not read response text');
        }
        
        if (!response.ok) {
            let errorMessage = `Lỗi ${response.status}`;
            
            if (response.status === 401) {
                errorMessage = 'Token hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại';
            } else if (response.status === 403) {
                errorMessage = 'Bạn không có quyền bình luận bài viết này';
            } else if (response.status === 404) {
                errorMessage = 'Bài viết không tồn tại';
            } else if (response.status === 500) {
                errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau';
            } else {
                try {
                    const errorData = JSON.parse(responseText);
                    console.log('[COMMENTS] Error response JSON:', errorData);
                    errorMessage = errorData.message || errorData.msg || errorData.error || responseText || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
            }
            
            console.error('[COMMENTS] Request failed:', errorMessage);
            throw new Error(errorMessage);
        }
        
        commentInput.value = '';
        showCommentSuccess('Bình luận đã được gửi thành công!');
        
        console.log('[COMMENTS] Comment sent successfully, reloading...');
        // Reload comments after delay
        setTimeout(async () => {
            await loadComments();
        }, 500);
        
    } catch (error) {
        console.error('[COMMENTS] Error sending comment:', error.message);
        showCommentError(error.message || 'Không thể gửi bình luận. Vui lòng thử lại sau.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Toggle reply form visibility
function toggleReplyForm(commentIndex) {
    console.log('[COMMENTS] Toggling reply form for comment:', commentIndex);
    
    const form = document.getElementById(`reply-form-${commentIndex}`);
    const button = document.querySelector(`button[onclick="toggleReplyForm(${commentIndex})"]`);
    
    if (!form) {
        console.error('[COMMENTS] Reply form not found:', `reply-form-${commentIndex}`);
        return;
    }
    
    const isActive = form.classList.contains('active');
    
    // Close all other reply forms first
    document.querySelectorAll('.reply-form.active').forEach(f => {
        f.classList.remove('active');
    });
    document.querySelectorAll('.action-btn.active').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (!isActive) {
        form.classList.add('active');
        if (button) button.classList.add('active');
        
        const textarea = document.getElementById(`reply-input-${commentIndex}`);
        if (textarea) {
            setTimeout(() => textarea.focus(), 100);
        }
    }
}

// Cancel reply
function cancelReply(commentIndex) {
    const form = document.getElementById(`reply-form-${commentIndex}`);
    const textarea = document.getElementById(`reply-input-${commentIndex}`);
    const button = document.querySelector(`button[onclick="toggleReplyForm(${commentIndex})"]`);
    
    if (form) form.classList.remove('active');
    if (button) button.classList.remove('active');
    if (textarea) textarea.value = '';
}

// Submit reply
async function submitReply(commentIndex) {
    console.log('[COMMENTS] submitReply() called for comment:', commentIndex);
    
    const textarea = document.getElementById(`reply-input-${commentIndex}`);
    if (!textarea) {
        console.error('[COMMENTS] Reply textarea not found');
        return;
    }
    
    const content = textarea.value.trim();
    
    // Validation
    if (!content) {
        showCommentError('Vui lòng nhập phản hồi');
        return;
    }
    
    if (content.length > 5000) {
        showCommentError('Phản hồi không được vượt quá 5000 ký tự');
        return;
    }
    
    // Check authentication
    const token = getAuthToken();
    if (!token) {
        showCommentError('Bạn cần đăng nhập để trả lời bình luận');
        return;
    }
    
    const userId = getUserId();
    if (!userId) {
        showCommentError('Không xác định được người dùng. Vui lòng đăng nhập lại.');
        return;
    }
    
    // Find parent comment ID - need to get actual comment ID from the data
    const commentElement = document.getElementById(`comment-${commentIndex}`);
    let parentCommentId = null;
    
    // Try to get parent comment ID from data attribute if set, otherwise use index + 1 as fallback
    if (commentElement && commentElement.dataset.commentId) {
        parentCommentId = parseInt(commentElement.dataset.commentId);
    } else {
        // Fallback: assume comment ID equals index + 1 (this might need adjustment based on your backend)
        parentCommentId = commentIndex + 1;
        console.warn('[COMMENTS] Using fallback parent comment ID:', parentCommentId);
    }
    
    const originalButton = document.querySelector(`#reply-form-${commentIndex} button[onclick="submitReply(${commentIndex})"]`);
    const originalText = originalButton ? originalButton.textContent : 'Gửi';
    
    try {
        if (originalButton) {
            originalButton.disabled = true;
            originalButton.innerHTML = '<span class="loading-spinner"></span> Đang gửi...';
        }
        
        const requestBody = {
            noiDung: content,
            idBinhLuanCha: parentCommentId
        };
        
        const endpoint = `${API_BASE}/api/bai-dang-cho-thue/${roomId}/binh-luan`;
        console.log('[COMMENTS] Sending reply to:', endpoint);
        console.log('[COMMENTS] Reply body:', requestBody);
        console.log('[COMMENTS] Parent comment ID:', parentCommentId);
        
        let response;
        try {
            response = await fetch(endpoint, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'userId': userId.toString()
                },
                body: JSON.stringify(requestBody)
            });
        } catch (netErr) {
            console.error('[COMMENTS] Network error submitting reply:', netErr);
            showCommentError('Không thể kết nối tới server. Vui lòng thử lại.');
            return;
        }
        
        console.log('[COMMENTS] Reply response status:', response.status);
        
        let responseText = '';
        try {
            responseText = await response.text();
            console.log('[COMMENTS] Reply response text:', responseText);
        } catch (e) {
            console.log('[COMMENTS] Could not read reply response text');
        }
        
        if (!response.ok) {
            let errorMessage = `Lỗi ${response.status}`;
            
            if (response.status === 401) {
                errorMessage = 'Token hết hạn. Vui lòng đăng nhập lại';
            } else if (response.status === 403) {
                errorMessage = 'Bạn không có quyền trả lời bình luận này';
            } else if (response.status === 404) {
                errorMessage = 'Bình luận gốc không tồn tại';
            } else if (response.status === 400) {
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.msg || 'Dữ liệu không hợp lệ';
                } catch (e) {
                    errorMessage = 'Dữ liệu phản hồi không hợp lệ';
                }
            } else {
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.message || errorData.msg || errorData.error || responseText || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
            }
            
            console.error('[COMMENTS] Reply failed:', errorMessage);
            throw new Error(errorMessage);
        }
        
        // Success
        textarea.value = '';
        const form = document.getElementById(`reply-form-${commentIndex}`);
        if (form) form.style.display = 'none';
        
        showCommentSuccess('Phản hồi đã được gửi thành công!');
        
        console.log('[COMMENTS] Reply sent successfully, reloading comments...');
        // Reload all comments to show the new reply
        setTimeout(async () => {
            await loadComments();
        }, 500);
        
    } catch (error) {
        console.error('[COMMENTS] Error submitting reply:', error.message);
        showCommentError(error.message || 'Không thể gửi phản hồi. Vui lòng thử lại sau.');
    } finally {
        if (originalButton) {
            originalButton.disabled = false;
            originalButton.textContent = originalText;
        }
    }
}

// Show comments loading state
function showCommentsLoading() {
    const loadingState = document.getElementById('commentsLoading');
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');
    
    if (loadingState) loadingState.style.display = 'block';
    if (commentsList) commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';
}

// Hide comments loading state
function hideCommentsLoading() {
    const loadingState = document.getElementById('commentsLoading');
    if (loadingState) loadingState.style.display = 'none';
}

// Show empty comments state
function showCommentsEmpty() {
    const loadingState = document.getElementById('commentsLoading');
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');
    
    if (loadingState) loadingState.style.display = 'none';
    if (commentsList) commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
}

// Show comment error
function showCommentError(message) {
    console.error('[COMMENTS ERROR]', message);
    
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;
    
    // Remove existing messages
    document.querySelectorAll('.status-message').forEach(msg => msg.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'status-message error';
    errorDiv.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        ${message}
    `;
    
    const commentForm = commentSection.querySelector('.comment-form-container');
    commentForm.parentNode.insertBefore(errorDiv, commentForm.nextSibling);
    
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.opacity = '0';
            setTimeout(() => errorDiv.remove(), 300);
        }
    }, 5000);
}

// Show comment success
function showCommentSuccess(message) {
    console.log('[COMMENTS SUCCESS]', message);
    
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;
    
    // Remove existing messages
    document.querySelectorAll('.status-message').forEach(msg => msg.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'status-message success';
    successDiv.innerHTML = `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
        </svg>
        ${message}
    `;
    
    const commentForm = commentSection.querySelector('.comment-form-container');
    commentForm.parentNode.insertBefore(successDiv, commentForm.nextSibling);
    
    setTimeout(() => {
        if (successDiv) {
            successDiv.style.opacity = '0';
            setTimeout(() => successDiv.remove(), 300);
        }
    }, 4000);
}

// Format comment date
function formatCommentDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        console.error('[COMMENTS] Error formatting date:', e);
        return 'Gần đây';
    }
}

// Escape HTML characters to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
