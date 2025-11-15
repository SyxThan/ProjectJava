/**
 * Detail Page - Chi tiết bài đăng cho thuê
 * Kết nối với backend API
 */

const API_BASE = 'http://localhost:8080/api/baidang';
const COMMENT_API_BASE = 'http://localhost:8080/api/bai-dang-cho-thue';
let currentPostId = null;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }

    // Get post ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get('id');

    if (!currentPostId) {
        showError('Không tìm thấy ID bài đăng.');
        return;
    }

    // Load post details
    loadPostDetail();

    // Load comments
    loadComments();
    
    // Note: setupCommentForm will be called after displayPostDetail injects HTML
});

async function loadPostDetail() {
    const contentContainer = document.getElementById('roomDetails') ||
                            document.querySelector('.lg\\:w-2\\/3') ||
                            document.querySelector('main > .container');

    if (!currentPostId) {
        if (contentContainer) {
            contentContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-600">Không tìm thấy ID bài đăng.</p>
                    <a href="search.html" class="mt-4 inline-block text-blue-600 hover:underline">Quay lại danh sách</a>
                </div>
            `;
        }
        return;
    }

    try {
        // Backend trả về Optional<BaiDangChoThue>
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/${currentPostId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const post = await response.json();

        // Backend trả về Optional<BaiDangChoThue> - có thể là object hoặc null
        // Nếu response là empty object hoặc null, throw error
        if (!post || (typeof post === 'object' && Object.keys(post).length === 0)) {
            throw new Error('Không tìm thấy bài đăng');
        }
        
        displayPostDetail(post);
    } catch (error) {
        handleApiError(error);
        const mainContent = document.querySelector('.lg\\:w-2\\/3') || document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-600">Không thể tải thông tin bài đăng.</p>
                    <a href="search.html" class="mt-4 inline-block text-blue-600 hover:underline">Quay lại danh sách</a>
                </div>
            `;
        }
    }
}

function displayPostDetail(post) {
    const contentContainer = document.getElementById('roomDetails') ||
                            document.querySelector('.lg\\:w-2\\/3') ||
                            document.querySelector('main > .container');

    if (!contentContainer) return;
    
    // Check authentication status for comment form
    const user = (typeof getCurrentUser !== 'undefined') ? getCurrentUser() : null;
    const isAuth = user !== null && (typeof getAuthToken !== 'undefined' ? getAuthToken() !== null : false);

    // Backend trả về BaiDangChoThue entity với snake_case fields
    // Hỗ trợ cả snake_case và camelCase để tương thích
    const title = post.tieu_de || post.tieuDe || 'Không có tiêu đề';
    const description = post.mo_ta || post.moTa || '';
    const address = post.dia_chi_day_du || post.diaChiDayDu || '';
    const district = post.phuong_xa || post.phuongXa || '';
    const city = post.tinh_thanhpho || post.tinhThanhpho || '';
    const price = post.gia_thang || post.giaThang || 0;
    const area = post.dien_tich_m2 || post.dienTichM2 || 0;
    // trangThai là enum, có thể là string hoặc object
    const status = (post.trangThai && typeof post.trangThai === 'string') 
        ? post.trangThai 
        : (post.trangThai && post.trangThai.name) 
            ? post.trangThai.name 
            : 'PENDING';
    const nguoiDang = post.nguoiDang || {};
    const images = post.HinhAnhPhongTro || post.hinhAnhPhongTro || [];

    // Get image URLs from hinhAnhPhongTro array
    let imageUrls = [];
    let thumbnailUrl = '';
    
    if (images && Array.isArray(images) && images.length > 0) {
        images.forEach(img => {
            if (img.duong_dan_anh) {
                let url = img.duong_dan_anh;
                
                // Parse if JSON array string (e.g., "['url1', 'url2']")
                if (url && typeof url === 'string' && url.trim().startsWith('[')) {
                    try {
                        // Replace single quotes with double quotes for valid JSON
                        const cleaned = url.replace(/'/g, '"').trim();
                        const parsed = JSON.parse(cleaned);
                        if (Array.isArray(parsed)) {
                            // Add all URLs from the array
                            parsed.forEach(u => {
                                if (u && typeof u === 'string' && u.trim()) {
                                    const trimmedUrl = u.trim();
                                    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
                                        imageUrls.push(trimmedUrl);
                                    }
                                }
                            });
                        }
                    } catch (e) {
                        // If JSON parsing fails, try regex to extract all URLs
                        const matches = url.match(/https?:\/\/[^\s'"]+/g);
                        if (matches) {
                            imageUrls = imageUrls.concat(matches);
                        }
                    }
                } 
                // Single URL string
                else if (url && typeof url === 'string' && url.trim()) {
                    const trimmed = url.trim();
                    // Check if it's a valid URL
                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                        // If this is the thumbnail (laAnhBia = true), use it as main image
                        if (img.laAnhBia === true && !thumbnailUrl) {
                            thumbnailUrl = trimmed;
                        }
                        imageUrls.push(trimmed);
                    }
                }
            }
        });
    }
    
    // Remove duplicates
    imageUrls = [...new Set(imageUrls)];
    
    // If we have a thumbnail, move it to the front
    if (thumbnailUrl && imageUrls.includes(thumbnailUrl)) {
        imageUrls = imageUrls.filter(url => url !== thumbnailUrl);
        imageUrls.unshift(thumbnailUrl);
    }

    // If no images, try to get from thumbnail API
    if (imageUrls.length === 0) {
        loadThumbnailImage();
    }

    const totalImages = imageUrls.length;
    const html = `
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <!-- Image Gallery -->
            <div class="relative">
                ${imageUrls.length > 0 ? `
                    <!-- Main Image -->
                    <div class="relative h-96 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                        <img src="${imageUrls[0]}" alt="Ảnh chính" 
                             id="mainImage"
                             data-image-index="0"
                             class="w-full h-full object-cover cursor-pointer"
                             onclick="openImageModal('${imageUrls[0]}')">
                        ${imageUrls.length > 1 ? `
                            <div id="imageCounter" class="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                                1/${totalImages}
                            </div>
                        ` : ''}
                    </div>
                    <!-- Thumbnail Gallery -->
                    ${imageUrls.length > 1 ? `
                        <div class="room-gallery flex overflow-x-auto space-x-2 pb-2">
                            ${imageUrls.map((url, idx) => `
                                <img src="${url}" alt="Ảnh ${idx + 1}" 
                                     data-thumb-index="${idx}"
                                     class="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 border-2 ${idx === 0 ? 'border-blue-500' : 'border-transparent'}"
                                     onclick="changeMainImage('${url}', ${idx}, ${totalImages})">
                            `).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div class="h-96 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center rounded-lg">
                        <div class="text-center">
                            <i data-feather="image" class="w-16 h-16 text-white opacity-50 mx-auto mb-2"></i>
                            <p class="text-white opacity-75">Chưa có hình ảnh</p>
                        </div>
                    </div>
                `}
            </div>

            <!-- Post Details -->
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h1 class="text-3xl font-bold text-gray-900">${title}</h1>
                    <span class="px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${status === 'APPROVED' ? 'Đã duyệt' :
                          status === 'PENDING' ? 'Chờ duyệt' :
                          'Từ chối'}
                    </span>
                </div>

                <div class="flex items-center text-2xl font-bold text-blue-600 mb-6">
                    <span>${formatPrice(price)}</span>
                    <span class="text-lg font-normal text-gray-600 ml-2">/tháng</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="flex items-center text-gray-600">
                        <i data-feather="map-pin" class="w-5 h-5 mr-2"></i>
                        <span>${district}${city ? ', ' + city : ''}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i data-feather="maximize-2" class="w-5 h-5 mr-2"></i>
                        <span>${area} m²</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i data-feather="user" class="w-5 h-5 mr-2"></i>
                        <span>${nguoiDang.fullname || 'N/A'}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                        <i data-feather="phone" class="w-5 h-5 mr-2"></i>
                        <span>${nguoiDang.so_dien_thoai || 'N/A'}</span>
                    </div>
                </div>

                <div class="border-t pt-6 mb-6">
                    <h2 class="text-xl font-bold mb-4">Mô tả</h2>
                    <p class="text-gray-700 whitespace-pre-wrap">${description}</p>
                </div>

                <div class="border-t pt-6">
                    <h2 class="text-xl font-bold mb-4">Địa chỉ</h2>
                    <p class="text-gray-700">${address}</p>
                </div>
            </div>
        </div>

        <!-- Comments Section -->
        <div class="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 class="text-xl font-bold mb-4">Bình luận</h2>
            <div id="commentsContainer">
                <div class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="mt-2 text-gray-600">Đang tải bình luận...</p>
                </div>
            </div>

            <!-- Comment Form -->
            ${isAuth ? `
                <form id="commentForm" class="mt-6 border-t pt-6">
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2">Viết bình luận</label>
                        <textarea id="commentContent" name="comment" 
                                  class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  rows="4" placeholder="Nhập bình luận của bạn..."></textarea>
                    </div>
                    <div class="mb-4">
                        <label class="block text-gray-700 text-sm font-medium mb-2">Đánh giá (tùy chọn)</label>
                        <select id="commentRating" name="rating" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="0">Không đánh giá</option>
                            <option value="5">5 sao - Tuyệt vời</option>
                            <option value="4">4 sao - Rất tốt</option>
                            <option value="3">3 sao - Tốt</option>
                            <option value="2">2 sao - Bình thường</option>
                            <option value="1">1 sao - Kém</option>
                        </select>
                    </div>
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Gửi bình luận
                    </button>
                </form>
            ` : `
                <div class="mt-6 border-t pt-6 text-center">
                    <p class="text-gray-600 mb-4">Vui lòng đăng nhập để bình luận</p>
                    <a href="auth.html" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Đăng nhập
                    </a>
                </div>
            `}
        </div>
    `;

    contentContainer.innerHTML = html;

    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Setup comment form after HTML is injected
    setupCommentForm();
}

async function loadThumbnailImage() {
    if (!currentPostId) return;
    
    try {
        const response = await fetch(`http://localhost:8080/api/hinhanh/thumbnail/${currentPostId}`);
        if (response.ok) {
            const thumbnail = await response.json();
            if (thumbnail && thumbnail.duong_dan_anh) {
                // Could update image display here if needed
            }
        }
    } catch (e) {
        // Ignore thumbnail load errors
    }
}

async function loadComments() {
    const commentsContainer = document.getElementById('commentsContainer');
    if (!commentsContainer) return;
    
    try {
        // Backend trả về List<CommentResponseDTO>
        const response = await fetch(`${COMMENT_API_BASE}/${currentPostId}/binh-luan`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const comments = await response.json();
        
        if (Array.isArray(comments)) {
            displayComments(comments, commentsContainer);
        } else {
            displayComments([], commentsContainer);
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        commentsContainer.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600">Không thể tải bình luận.</p>
            </div>
        `;
    }
}

function displayComments(comments, container) {
    if (!container) return;
    
    if (!comments || comments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i data-feather="message-circle" class="w-12 h-12 text-gray-400 mx-auto mb-2"></i>
                <p class="text-gray-600">Chưa có bình luận nào</p>
            </div>
        `;
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        return;
    }
    
    container.innerHTML = comments.map(comment => createCommentCard(comment)).join('');
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

function createCommentCard(comment) {
    const content = comment.noiDung || '';
    const rating = comment.danhGiaSao || 0;
    const fullname = comment.fullname || 'Người dùng';
    const avatar = comment.avatar || '';
    const ngayTao = comment.ngayTao ? new Date(comment.ngayTao).toLocaleDateString('vi-VN') : '';
    const binhLuanCon = comment.binhLuanCon || [];

    return `
        <div class="border-b pb-4 mb-4 last:border-b-0">
            <div class="flex items-start space-x-4">
                ${avatar ? `
                    <img src="${avatar}" alt="${fullname}" class="w-10 h-10 rounded-full">
                ` : `
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <i data-feather="user" class="w-5 h-5 text-blue-600"></i>
                    </div>
                `}
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <div>
                            <h4 class="font-medium text-gray-900">${fullname}</h4>
                            ${rating > 0 ? `
                                <div class="flex items-center mt-1">
                                    ${Array.from({length: 5}, (_, i) => `
                                        <i data-feather="star" class="w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}"></i>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                        <span class="text-sm text-gray-500">${ngayTao}</span>
                    </div>
                    <p class="text-gray-700">${content}</p>
                    ${binhLuanCon.length > 0 ? `
                        <div class="mt-4 ml-4 pl-4 border-l-2 border-gray-200">
                            ${binhLuanCon.map(subComment => createCommentCard(subComment)).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function setupCommentForm() {
    // Wait a bit for DOM to be ready, then setup form
    setTimeout(() => {
        const commentForm = document.getElementById('commentForm');
        if (!commentForm) {
            // Form doesn't exist (user not logged in), return
            return;
        }
        
        // Remove existing event listeners by cloning the form
        const newForm = commentForm.cloneNode(true);
        commentForm.parentNode.replaceChild(newForm, commentForm);
        
        // Add new event listener
        newForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Check authentication - use safe checks
            const user = (typeof getCurrentUser !== 'undefined') ? getCurrentUser() : null;
            const token = (typeof getAuthToken !== 'undefined') ? getAuthToken() : null;
            
            if (!user || !token) {
                alert('Vui lòng đăng nhập để bình luận');
                window.location.href = 'auth.html';
                return;
            }
            
            if (!user.id) {
                alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
                window.location.href = 'auth.html';
                return;
            }
            
            const commentContentEl = document.getElementById('commentContent');
            const commentRatingEl = document.getElementById('commentRating');
            
            if (!commentContentEl) {
                alert('Không tìm thấy ô nhập bình luận');
                return;
            }
            
            const noiDung = commentContentEl.value.trim();
            const danhGiaSao = commentRatingEl ? parseInt(commentRatingEl.value) || null : null;
            
            if (!noiDung) {
                alert('Vui lòng nhập nội dung bình luận');
                return;
            }
            
            try {
                // Backend cần header userId và body CommentRequestDTO
                const commentData = {
                    noiDung: noiDung,
                    danhGiaSao: danhGiaSao && danhGiaSao > 0 ? danhGiaSao : null
                };
                
                const response = await fetch(`${COMMENT_API_BASE}/${currentPostId}/binh-luan`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'userId': user.id.toString(),
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify(commentData)
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (typeof showSuccessMessage !== 'undefined') {
                        showSuccessMessage('Bình luận đã được đăng');
                    } else {
                        alert('Bình luận đã được đăng');
                    }
                    newForm.reset();
                    loadComments();
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText || `HTTP ${response.status}`);
                }
            } catch (error) {
                console.error('Error posting comment:', error);
                if (typeof handleApiError !== 'undefined') {
                    handleApiError(error);
                } else {
                    alert('Có lỗi xảy ra khi đăng bình luận: ' + (error.message || 'Vui lòng thử lại sau.'));
                }
            }
        });
    }, 300);
}

function changeMainImage(imageUrl, index, totalImages) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageUrl;
        mainImage.setAttribute('data-image-index', index);
        mainImage.onclick = () => openImageModal(imageUrl);
        
        // Update counter
        const counter = document.getElementById('imageCounter');
        if (counter && totalImages) {
            counter.textContent = `${index + 1}/${totalImages}`;
        }
        
        // Update thumbnail borders
        document.querySelectorAll('.room-gallery img').forEach((img) => {
            const thumbIndex = parseInt(img.getAttribute('data-thumb-index'));
            if (thumbIndex === index) {
                img.classList.remove('border-transparent');
                img.classList.add('border-blue-500');
            } else {
                img.classList.remove('border-blue-500');
                img.classList.add('border-transparent');
            }
        });
    }
}

function openImageModal(imageUrl) {
    // Simple image modal - can be enhanced later
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="relative max-w-4xl max-h-full p-4">
            <img src="${imageUrl}" alt="Full size" class="max-w-full max-h-screen rounded-lg">
            <button onclick="this.closest('.fixed').remove()" 
                    class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75">
                <i data-feather="x" class="w-6 h-6"></i>
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

// Make functions globally available
window.changeMainImage = changeMainImage;
window.openImageModal = openImageModal;

function showError(message) {
    const container = document.querySelector('main') || document.body;
    container.innerHTML = `
        <div class="container mx-auto px-4 py-12">
            <div class="text-center">
                <p class="text-red-600 text-lg mb-4">${message}</p>
                <a href="search.html" class="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Quay lại danh sách
                </a>
            </div>
        </div>
    `;
}

// Make functions available globally
window.openImageModal = openImageModal;

