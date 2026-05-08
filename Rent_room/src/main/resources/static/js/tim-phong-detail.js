console.log('JS file loaded');
console.log('ID:', new URLSearchParams(window.location.search).get('id'));
window.SKIP_OLD_INIT = false; // enable full legacy init for detailed view
// CONSTANTS & API CONFIGURATION
// Correct base endpoints
const API_POST_BASE = 'http://localhost:8080/api/baidangtimphong'; // posts (ensure matches controller @RequestMapping)
const API_COMMENT_BASE = 'http://localhost:8080/api/baidangtimphong'; // comments (same base)
const API_BASE = 'http://localhost:8080';
const COMMENTS_PER_PAGE = 10;
const MAX_COMMENT_LENGTH = 1000;

// STATE VARIABLES
let currentBaiDangId = null;
let currentUser = null;
let currentPage = 0;
let totalPages = 0;
let isLoadingComments = false;

// Get post ID from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('id');
currentBaiDangId = postId;

// postId extracted (legacy)

// New lightweight loader per instructions
document.addEventListener('DOMContentLoaded', () => {
  const id = new URLSearchParams(window.location.search).get('id');
  if(!id){
    const l = document.getElementById('loading-state');
    if(l) l.style.display='none';
    alert('Missing post ID (?id=...)');
    return;
  }
  loadPostDetail(id);
  // Restore comments + auth
  loadComments(id,0).catch(()=>{});
  fetchCurrentUserAsync().then(u=>{currentUser=u;updateAuthUI();}).catch(()=>{});
  setupEventListeners();
});

// Keep old listener but abort if skipped
// Initialize page
document.addEventListener('DOMContentLoaded', async () => { if(window.SKIP_OLD_INIT) return;
    feather.replace();
    if (!postId) {
        showError('Không tìm thấy ID bài đăng');
        return;
    }
    // Load post + comments sequentially
    await loadPostDetails();
    if (currentBaiDangId) {
        loadComments(currentBaiDangId, 0).catch(()=>{});
    }
    // Auth/UI (non-blocking)
    fetchCurrentUserAsync().then(u=>{currentUser=u;updateAuthUI();}).catch(()=>{});
    setupEventListeners();
    if (typeof setupCommentForm === 'function') {
        try { setupCommentForm(); } catch(_) {}
    }
});

// Load post details from API
// Replacement simplified function per spec
async function loadPostDetail(id) { 
  const loading = document.getElementById('loading-state'); 
  const content = document.getElementById('post-content'); 
  try { 
    const res = await fetch(`${API_POST_BASE}/${id}`); 
    const data = await res.json(); 
    if(loading) loading.style.display = 'none';
    const legacyLoading = document.getElementById('loadingState');
    if(legacyLoading) legacyLoading.style.display='none';
    if(content){
      content.style.display = 'none'; // hide minimal test container to show full original layout
      content.innerHTML = `<h1>${data.name || data.tieuDe || ''}</h1><p>${data.moTa || ''}</p>`; 
    }
    const legacyContent = document.getElementById('postContent');
    if(legacyContent) legacyContent.style.display='flex'; // show original detailed layout
  } catch (e) {
    if(loading) loading.style.display = 'none';
    const legacyLoading = document.getElementById('loadingState');
    if(legacyLoading) legacyLoading.style.display='none';
    alert('Error: ' + e.message);
    console.error(e);
  }
}

async function loadPostDetails() {
    showLoading();
    try {
        const response = await fetch(`${API_POST_BASE}/${postId}`);
        if (!response.ok) throw new Error(response.status === 404 ? 'Bài đăng không tồn tại' : 'Lỗi máy chủ');
        const post = await response.json();
        displayPostDetails(post);
        hideLoading();
    } catch (e) {
        showError('Không thể tải bài đăng: ' + e.message);
    }
}

// Display post details
function displayPostDetails(post) {
    console.log('displayPostDetails called with data:', post); // Debug log
    
    // Update page title
    document.title = `${post.tieuDe || 'Tin tìm phòng'} - Phòng Trọ 24/7`;
    
    // Post title
    const postTitle = document.getElementById('postTitle');
    if (postTitle) {
        postTitle.textContent = post.tieuDe || 'Không có tiêu đề';
    } else {
        console.error('postTitle element not found');
    }
    
    // Post location
    const postLocation = document.getElementById('postLocation');
    if (postLocation) {
        const location = `${post.khuVucMongMuonXa || ''}, ${post.khuVucMongMuonThanhPho || ''}`.trim();
        postLocation.innerHTML = `
            <i data-feather="map-pin" class="w-5 h-5 mr-1"></i>
            <span>${location || 'Chưa cập nhật'}</span>
        `;
    } else {
        console.error('postLocation element not found');
    }
    
    // Post status badge
    const statusBadges = document.getElementById('statusBadges');
    if (statusBadges) {
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
    } else {
        console.error('statusBadges element not found');
    }
    
    // Price range
    const postPriceRange = document.getElementById('postPriceRange');
    if (postPriceRange) {
        const priceMin = formatPrice(post.giaThapNhat || 0);
        const priceMax = formatPrice(post.giaCaoNhat || 0);
        postPriceRange.textContent = `${priceMin} - ${priceMax}/tháng`;
    } else {
        console.error('postPriceRange element not found');
    }
    
    // Area
    const postArea = document.getElementById('postArea');
    if (postArea) {
        const area = post.dienTichToiThieu || 0;
        postArea.textContent = `${area} m²`;
    } else {
        console.error('postArea element not found');
    }
    
    // Number of people
    const postPeople = document.getElementById('postPeople');
    if (postPeople) {
        const people = post.soNguoiO || 'Chưa xác định';
        postPeople.textContent = people === 'Chưa xác định' ? people : `${people} người`;
    } else {
        console.error('postPeople element not found');
    }
    
    // Desired area
    const postDesiredArea = document.getElementById('postDesiredArea');
    if (postDesiredArea) {
        const desiredArea = `${post.khuVucMongMuonXa || ''}, ${post.khuVucMongMuonThanhPho || ''}`.trim();
        postDesiredArea.textContent = desiredArea || 'Chưa xác định';
    } else {
        console.error('postDesiredArea element not found');
    }
    
    // Description
    const postDescription = document.getElementById('postDescription');
    if (postDescription) {
        const description = post.moTa || 'Không có mô tả';
        postDescription.innerHTML = `
            <p class="text-gray-700 whitespace-pre-wrap">${escapeHtml(description)}</p>
        `;
    } else {
        console.error('postDescription element not found');
    }
    
    // Poster info
    const posterName = post.userFullname || 'Người đăng tin';
    const posterPhone = post.userSoDienThoai || '';
    const posterEmail = post.userEmail || '';
    
    const posterNameElement = document.getElementById('posterName');
    if (posterNameElement) {
        posterNameElement.textContent = posterName;
    } else {
        console.error('posterName element not found');
    }
    
    const posterPhoneElement = document.getElementById('posterPhone');
    if (posterPhoneElement) {
        if (posterPhone) {
            posterPhoneElement.href = `tel:${posterPhone}`;
            const phoneSpan = posterPhoneElement.querySelector('span');
            if (phoneSpan) {
                phoneSpan.textContent = posterPhone;
            }
        } else {
            posterPhoneElement.href = '#';
            const phoneSpan = posterPhoneElement.querySelector('span');
            if (phoneSpan) {
                phoneSpan.textContent = 'Chưa cập nhật';
            }
            posterPhoneElement.classList.add('opacity-50', 'cursor-not-allowed');
        }
    } else {
        console.error('posterPhone element not found');
    }
    
    const posterEmailContainer = document.getElementById('posterEmailContainer');
    const posterEmailElement = document.getElementById('posterEmail');
    if (posterEmail && posterEmailContainer && posterEmailElement) {
        posterEmailContainer.classList.remove('hidden');
        posterEmailElement.href = `mailto:${posterEmail}`;
        const emailSpan = posterEmailElement.querySelector('span');
        if (emailSpan) {
            emailSpan.textContent = posterEmail;
        }
    } else if (posterEmailContainer) {
        posterEmailContainer.classList.add('hidden');
    }
    
    // Posted date
    const postedDateElement = document.getElementById('postedDate');
    if (postedDateElement) {
        const postedDate = formatDate(post.ngayDang);
        postedDateElement.textContent = postedDate || 'Chưa xác định';
    } else {
        console.error('postedDate element not found');
    }
    
    // Re-initialize feather icons
    if (window.feather) {
        feather.replace();
    }
    
    console.log('displayPostDetails completed'); // Debug log
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

function getUserId() {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.id) {
            return user.id;
        }
    } catch (e) {
        console.warn('[AUTH] Cannot parse user object for ID');
    }
    const storedId = localStorage.getItem('user_id');
    if (storedId) {
        const parsedId = parseInt(storedId, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
            return parsedId;
        }
    }
    return null;
}

function getCurrentUserName() {
    try {
        const userObj = JSON.parse(localStorage.getItem('user'));
        if (userObj && userObj.fullname) {
            return userObj.fullname;
        }
        if (userObj && userObj.email) {
            return userObj.email.split('@')[0];
        }
    } catch (e) {
        console.warn('[AUTH] Cannot parse user object for name');
    }
    return 'Bạn';
}

// Show loading
// Legacy functions retained below
function showLoading() {
    const l = document.getElementById('loadingState');
    const c = document.getElementById('postContent');
    if (l) l.classList.remove('hidden');
    if (c) c.classList.add('hidden');
}

// Hide loading
function hideLoading() {
    const l = document.getElementById('loadingState');
    const c = document.getElementById('postContent');
    if (l) l.classList.add('hidden');
    if (c) c.classList.remove('hidden');
}

// Show error
function showError(message){
    hideLoading();
    const c=document.getElementById('postContent');
    if(!c)return;
    c.innerHTML=`<div class='w-full text-center py-16'>
        <h2 class='text-2xl font-bold mb-2 text-red-600'>Lỗi</h2>
        <p class='text-gray-600 mb-4'>${escapeHtml(message)}</p>
        <a href='tim-phong.html' class='px-4 py-2 bg-blue-600 text-white rounded'>Quay lại</a>
    </div>`;
}

// ================================
// AUTHENTICATION FUNCTIONS
// ================================

// Get current user from token (page-local helper).
// IMPORTANT: do NOT override the global synchronous getCurrentUser() from api.js,
// otherwise navbar.js (which expects the sync version) will break and show the
// "Đăng nhập" button even when the user is logged in.
async function fetchCurrentUserAsync() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken') || sessionStorage.getItem('token');
    console.log('[AUTH] fetchCurrentUserAsync - Token exists:', !!token);
    if (!token) {
        // Fallback: read cached user object so UI stays consistent with navbar.
        try {
            const cached = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
            if (cached && !cached.id) cached.id = cached.userId || cached.user_id;
            return cached;
        } catch (_) { return null; }
    }
    try {
        // Backend exposes /api/user/me (not /api/auth/me)
        const response = await fetch(`${API_BASE}/api/user/me`, { headers: getAuthHeaders() });
        console.log('[AUTH] /api/user/me status:', response.status);
        if (response.ok) {
            const user = await response.json();
            if (user && !user.id) user.id = user.userId || user.user_id;
            try { localStorage.setItem('user', JSON.stringify(user)); } catch(_){}
            return user;
        }
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
        }
        // On any non-OK response, fallback to cached user so UI doesn't flip to logged-out state.
        try {
            const cached = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
            if (cached && !cached.id) cached.id = cached.userId || cached.user_id;
            return cached;
        } catch (_) { return null; }
    } catch (e) {
        console.error('[AUTH] error /api/user/me', e);
        try {
            const cached = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
            if (cached && !cached.id) cached.id = cached.userId || cached.user_id;
            return cached;
        } catch (_) { return null; }
    }
}

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token') || sessionStorage.getItem('token');
    console.log('[AUTH] getAuthHeaders - Token:', token ? 'Exists' : 'Missing');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// Require authentication
function requireAuth() {
    if (!currentUser) {
        showNotification('Vui lòng đăng nhập để thực hiện thao tác này', 'error');
        setTimeout(() => {
            window.location.href = 'auth.html';
        }, 1500);
        return false;
    }
    return true;
}

// Update UI based on authentication state
function updateAuthUI() {
    const addCommentSection = document.getElementById('add-comment-section');
    const loginPrompt = document.getElementById('login-prompt');
    const currentUserAvatar = document.getElementById('current-user-avatar');
    
    if (currentUser) {
        if (addCommentSection) addCommentSection.classList.remove('hidden');
        if (loginPrompt) loginPrompt.classList.add('hidden');
        
        // Update avatar
        if (currentUser.avatar) {
            currentUserAvatar.src = currentUser.avatar;
        } else {
            currentUserAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=3b82f6&color=fff`;
        }
    } else {
        if (addCommentSection) addCommentSection.classList.add('hidden');
        if (loginPrompt) loginPrompt.classList.remove('hidden');
    }
}

// ================================
// COMMENT API FUNCTIONS
// ================================

// Load comments for a post
async function loadComments(baiDangId, page) {
    if (isLoadingComments) return;
    isLoadingComments = true;
    
    try {
        console.log('Loading comments for baiDangId:', baiDangId); // Debug log
        
        // Check if comment elements exist
        const commentElements = {
            commentsList: document.getElementById('comments-list'),
            commentCount: document.getElementById('comment-count'),
            loadMoreContainer: document.getElementById('load-more-container')
        };
        
        // If comment elements don't exist, skip comment loading silently
        if (!commentElements.commentsList || !commentElements.commentCount) {
            console.log('Comment elements not found, skipping comment loading');
            return;
        }
        
        showCommentsLoading();
        
        const response = await fetch(`${API_COMMENT_BASE}/${baiDangId}/binh-luan`); // correct comment endpoint
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const comments = await response.json();
        console.log('Comments loaded:', comments); // Debug log
        
        hideCommentsLoading();
        commentElements.commentsList.innerHTML = '';
        
        // Update comment count
        commentElements.commentCount.textContent = comments.length || 0;
        
        // Render comments
        if (comments && comments.length > 0) {
            showCommentsList();
            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentElements.commentsList.appendChild(commentElement);
            });
        } else {
            showEmptyComments();
        }
        
        // Hide load more button since we load all comments at once
        if (commentElements.loadMoreContainer) {
            commentElements.loadMoreContainer.classList.add('hidden');
        }
        
        // Re-initialize feather icons
        feather.replace();
        
    } catch (error) {
        console.error('Error loading comments:', error);
        hideCommentsLoading();
        // Don't show notification for comment loading errors in this context
    } finally {
        isLoadingComments = false;
    }
}

// Add new comment
async function addComment(baiDangId, noiDung) {
    if (!requireAuth()) return;
    if (!validateComment(noiDung)) return;
    
    const submitBtn = document.getElementById('submit-comment');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang gửi...';
        
        // Backend reads userId from JWT principal, not from a custom header.
        const response = await fetch(`${API_COMMENT_BASE}/${baiDangId}/binh-luan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ noiDung })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const newComment = await response.json();
        
        // Clear input
        document.getElementById('comment-input').value = '';
        updateCharCount();
        
        // Reload comments to get the updated list
        await loadComments(baiDangId, 0);
        
        // Show success notification
        showNotification('Đã thêm bình luận thành công!', 'success');
        
        // Re-initialize feather icons
        feather.replace();
        
    } catch (error) {
        console.error('Error adding comment:', error);
        showNotification('Không thể thêm bình luận. Vui lòng thử lại.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

// Update comment
async function updateComment(commentId, noiDung) {
    if (!requireAuth()) return;
    if (!validateComment(noiDung)) return;
    try {
        const response = await fetch(`${API_COMMENT_BASE}/binh-luan/${commentId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ noiDung })
        });
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Bạn không có quyền chỉnh sửa bình luận này', 'error');
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const contentElement = document.getElementById(`content-${commentId}`);
        if (contentElement) contentElement.textContent = noiDung;
        const headerElement = document.querySelector(`[data-comment-id="${commentId}"] .comment-header`);
        if (headerElement && !headerElement.querySelector('.edited-indicator')) {
            const editedSpan = document.createElement('span');
            editedSpan.className = 'edited-indicator text-xs text-gray-500 ml-2';
            editedSpan.textContent = '(đã chỉnh sửa)';
            headerElement.appendChild(editedSpan);
        }
        hideEditForm(commentId);
        showNotification('Đã cập nhật bình luận thành công!', 'success');
    } catch (error) {
        console.error('Error updating comment:', error);
        showNotification('Không thể cập nhật bình luận. Vui lòng thử lại.', 'error');
    }
}

// Delete comment
async function deleteComment(commentId) {
    if (!requireAuth()) return;
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return;
    try {
        const response = await fetch(`${API_COMMENT_BASE}/binh-luan/${commentId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            if (response.status === 403) {
                showNotification('Bạn không có quyền xóa bình luận này', 'error');
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.style.transition = 'opacity 0.3s ease';
            commentElement.style.opacity = '0';
            setTimeout(() => {
                commentElement.remove();
                const countElement = document.getElementById('comment-count');
                const newCount = Math.max(0, parseInt(countElement.textContent) - 1);
                countElement.textContent = newCount;
                if (newCount === 0) showEmptyComments();
            }, 300);
        }
        showNotification('Đã xóa bình luận thành công!', 'success');
    } catch (error) {
        console.error('Error deleting comment:', error);
        showNotification('Không thể xóa bình luận. Vui lòng thử lại.', 'error');
    }
}

// Reply to comment
async function replyToComment(parentId, noiDung) {
    if (!requireAuth()) return;
    if (!validateComment(noiDung)) return;
    
    try {
        // Backend reads userId from JWT principal, not from a custom header.
        const response = await fetch(`${API_COMMENT_BASE}/${currentBaiDangId}/binh-luan`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                noiDung,
                idBinhLuanCha: parentId
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        // Clear and hide reply form
        const replyInput = document.getElementById(`reply-input-${parentId}`);
        replyInput.value = '';
        hideReplyForm(parentId);
        
        // Reload comments to get the updated list with replies
        await loadComments(currentBaiDangId, 0);
        
        showNotification('Đã thêm phản hồi thành công!', 'success');
        
        // Re-initialize feather icons
        feather.replace();
        
    } catch (error) {
        console.error('Error adding reply:', error);
        showNotification('Không thể thêm phản hồi. Vui lòng thử lại.', 'error');
    }
}

// Remove unused functions since replies are loaded with parent comments
// and like functionality is not implemented in backend yet

// ================================
// RENDERING FUNCTIONS
// ================================

// Create comment element
function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item border-b border-gray-200 pb-4 last:border-b-0';
    div.setAttribute('data-comment-id', comment.id);
    
    // Check permissions
    const isOwner = currentUser && currentUser.id === comment.userId;
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    const canEdit = isOwner || isAdmin;
    const canDelete = isOwner || isAdmin;
    
    // Get avatar URL
    const avatarUrl = comment.avatar || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.fullname || 'User')}&background=random&color=fff`;
    
    // Format time
    const timeAgo = formatTimeAgo(comment.ngayTao);
    
    // Check if comment was edited
    const isEdited = comment.ngayCapNhat && comment.ngayCapNhat !== comment.ngayTao;
    
    div.innerHTML = `
        <div class="flex space-x-3">
            <img src="${avatarUrl}" alt="${escapeHtml(comment.fullname)}" 
                 class="w-10 h-10 rounded-full flex-shrink-0 object-cover">
            <div class="flex-1 min-w-0">
                <!-- Comment Header -->
                <div class="comment-header flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <span class="font-semibold text-gray-900">${escapeHtml(comment.fullname)}</span>
                        <span class="text-sm text-gray-500">${timeAgo}</span>
                        ${isEdited ? '<span class="edited-indicator text-xs text-gray-500">(đã chỉnh sửa)</span>' : ''}
                    </div>
                    ${(canEdit || canDelete) ? `
                        <div class="relative">
                            <button class="comment-menu-btn p-1 hover:bg-gray-100 rounded-full" 
                                    onclick="toggleCommentMenu(${comment.id})">
                                <i data-feather="more-horizontal" class="w-4 h-4 text-gray-500"></i>
                            </button>
                            <div id="menu-${comment.id}" class="comment-menu absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border hidden z-10">
                                ${canEdit ? `<button onclick="showEditForm(${comment.id})" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Chỉnh sửa</button>` : ''}
                                ${canDelete ? `<button onclick="deleteComment(${comment.id})" class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">Xóa</button>` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Comment Content -->
                <div class="mt-1">
                    <p id="content-${comment.id}" class="text-gray-800 whitespace-pre-wrap">${escapeHtml(comment.noiDung)}</p>
                    
                    <!-- Star Rating (if exists) -->
                    ${comment.danhGiaSao ? `
                        <div class="flex items-center mt-1">
                            ${Array.from({length: 5}, (_, i) => `
                                <i data-feather="star" class="w-4 h-4 ${i < comment.danhGiaSao ? 'text-yellow-400 fill-current' : 'text-gray-300'}"></i>
                            `).join('')}
                            <span class="text-sm text-gray-500 ml-2">${comment.danhGiaSao}/5 sao</span>
                        </div>
                    ` : ''}
                    
                    <!-- Edit Form (Hidden by default) -->
                    <div id="edit-form-${comment.id}" class="hidden mt-2">
                        <textarea id="edit-input-${comment.id}" 
                                  class="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                                  rows="3" maxlength="5000">${escapeHtml(comment.noiDung)}</textarea>
                        <div class="flex items-center justify-between mt-2">
                            <span class="text-sm text-gray-500">
                                <span id="edit-char-count-${comment.id}">${comment.noiDung.length}</span>/5000
                            </span>
                            <div class="space-x-2">
                                <button onclick="hideEditForm(${comment.id})" 
                                        class="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                    Hủy
                                </button>
                                <button onclick="saveEditComment(${comment.id})" 
                                        class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Comment Footer -->
                <div class="mt-2 flex items-center space-x-4">
                    ${currentUser ? `
                        <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition" 
                                onclick="showReplyForm(${comment.id})">
                            <i data-feather="message-circle" class="w-4 h-4"></i>
                            <span class="text-sm">Phản hồi</span>
                        </button>
                    ` : ''}
                    
                    ${comment.binhLuanCon && comment.binhLuanCon.length > 0 ? `
                        <button class="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition" 
                                onclick="toggleReplies(${comment.id})">
                            <i data-feather="chevron-down" class="w-4 h-4 transition-transform" id="chevron-${comment.id}"></i>
                            <span class="text-sm">Xem ${comment.binhLuanCon.length} phản hồi</span>
                        </button>
                    ` : ''}
                </div>
                
                <!-- Reply Form (Hidden by default) -->
                ${currentUser ? `
                    <div id="reply-form-${comment.id}" class="hidden mt-3 ml-2 p-3 bg-gray-50 rounded-lg">
                        <div class="flex space-x-3">
                            <img src="${currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.fullname || currentUser.name || 'User')}&background=3b82f6&color=fff`}" 
                                 alt="${escapeHtml(currentUser.fullname || currentUser.name)}" 
                                 class="w-8 h-8 rounded-full flex-shrink-0">
                            <div class="flex-1">
                                <textarea id="reply-input-${comment.id}" 
                                          placeholder="Viết phản hồi..." 
                                          class="w-full p-2 border border-gray-300 rounded resize-none focus:ring-2 focus:ring-blue-500"
                                          rows="2" maxlength="5000"></textarea>
                                <div class="flex items-center justify-between mt-2">
                                    <span class="text-sm text-gray-500">
                                        <span id="reply-char-count-${comment.id}">0</span>/5000
                                    </span>
                                    <div class="space-x-2">
                                        <button onclick="hideReplyForm(${comment.id})" 
                                                class="px-3 py-1 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                                            Hủy
                                        </button>
                                        <button onclick="sendReply(${comment.id})" 
                                                class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                                            Gửi
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Replies Container -->
                <div id="replies-${comment.id}" class="replies-container mt-3 ml-4 pl-4 border-l-2 border-gray-200 space-y-3 ${comment.binhLuanCon && comment.binhLuanCon.length > 0 ? '' : 'hidden'}">
                    ${comment.binhLuanCon ? comment.binhLuanCon.map(reply => createReplyHTML(reply)).join('') : ''}
                </div>
            </div>
        </div>
    `;
    
    return div;
}

// Create reply HTML (helper function)
function createReplyHTML(reply) {
    const isOwner = currentUser && currentUser.id === reply.userId;
    const isAdmin = currentUser && currentUser.role === 'ADMIN';
    const canEdit = isOwner || isAdmin;
    const canDelete = isOwner || isAdmin;
    
    const avatarUrl = reply.avatar || 
        `https://ui-avatars.com/api/?name=${encodeURIComponent(reply.fullname || 'User')}&background=random&color=fff`;
    
    const timeAgo = formatTimeAgo(reply.ngayTao);
    const isEdited = reply.ngayCapNhat && reply.ngayCapNhat !== reply.ngayTao;
    
    return `
        <div class="reply-item" data-reply-id="${reply.id}">
            <div class="flex space-x-3">
                <img src="${avatarUrl}" alt="${escapeHtml(reply.fullname)}" 
                     class="w-8 h-8 rounded-full flex-shrink-0 object-cover">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="font-medium text-gray-900 text-sm">${escapeHtml(reply.fullname)}</span>
                            <span class="text-xs text-gray-500">${timeAgo}</span>
                            ${isEdited ? '<span class="text-xs text-gray-500">(đã chỉnh sửa)</span>' : ''}
                        </div>
                        ${(canEdit || canDelete) ? `
                            <div class="relative">
                                <button class="p-1 hover:bg-gray-100 rounded-full" onclick="toggleReplyMenu(${reply.id})">
                                    <i data-feather="more-horizontal" class="w-3 h-3 text-gray-500"></i>
                                </button>
                                <div id="reply-menu-${reply.id}" class="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border hidden z-10">
                                    ${canEdit ? `<button onclick="editReply(${reply.id})" class="block w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-100">Chỉnh sửa</button>` : ''}
                                    ${canDelete ? `<button onclick="deleteReply(${reply.id})" class="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-100">Xóa</button>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="mt-1">
                        <p class="text-gray-800 text-sm whitespace-pre-wrap">${escapeHtml(reply.noiDung)}</p>
                        ${reply.danhGiaSao ? `
                            <div class="flex items-center mt-1">
                                ${Array.from({length: 5}, (_, i) => `
                                    <i data-feather="star" class="w-3 h-3 ${i < reply.danhGiaSao ? 'text-yellow-400 fill-current' : 'text-gray-300'}"></i>
                                `).join('')}
                                <span class="text-xs text-gray-500 ml-1">${reply.danhGiaSao}/5 sao</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function moved inline to createReplyHTML for better organization

// ================================
// UI HELPER FUNCTIONS
// ================================

// Setup event listeners
function setupEventListeners() {
    // Comment input character count
    const commentInput = document.getElementById('comment-input');
    const submitBtn = document.getElementById('submit-comment');
    
    if (commentInput) {
        commentInput.addEventListener('input', updateCharCount);
        commentInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                if (!submitBtn.disabled) {
                    handleSubmitComment();
                }
            }
        });
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', handleSubmitComment);
    }
    
    // Close menus when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.comment-menu-btn') && !e.target.closest('.comment-menu')) {
            closeAllMenus();
        }
    });
}

// Update character count for main comment input
function updateCharCount() {
    const input = document.getElementById('comment-input');
    const counter = document.getElementById('comment-char-count');
    const submitBtn = document.getElementById('submit-comment');
    
    if (input && counter) {
        const length = input.value.length;
        counter.textContent = `${length}/5000`;
        
        if (submitBtn) {
            submitBtn.disabled = length === 0 || length > 5000;
        }
    }
}

// Handle submit comment
function handleSubmitComment() {
    const input = document.getElementById('comment-input');
    const noiDung = input.value.trim();
    
    if (noiDung) {
        addComment(currentBaiDangId, noiDung);
    }
}

// Load more functionality removed since we load all comments at once

// Toggle replies visibility
function toggleReplies(commentId) {
    const repliesContainer = document.getElementById(`replies-${commentId}`);
    const chevron = document.getElementById(`chevron-${commentId}`);
    
    repliesContainer.classList.toggle('hidden');
    
    if (chevron) {
        if (repliesContainer.classList.contains('hidden')) {
            chevron.style.transform = 'rotate(0deg)';
        } else {
            chevron.style.transform = 'rotate(180deg)';
        }
    }
}

// Validate comment content
function validateComment(content) {
    if (!content || content.trim().length === 0) {
        showNotification('Vui lòng nhập nội dung bình luận', 'error');
        return false;
    }
    
    if (content.length > 5000) {
        showNotification('Bình luận không được vượt quá 5000 ký tự', 'error');
        return false;
    }
    
    return true;
}

// Show comments loading
function showCommentsLoading() {
    const loadingEl = document.getElementById('comments-loading');
    const listEl = document.getElementById('comments-list');
    const emptyEl = document.getElementById('comments-empty');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (listEl) listEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

// Hide comments loading
function hideCommentsLoading() {
    const loadingEl = document.getElementById('comments-loading');
    if (loadingEl) loadingEl.classList.add('hidden');
}

// Show comments list
function showCommentsList() {
    const listEl = document.getElementById('comments-list');
    const emptyEl = document.getElementById('comments-empty');
    
    if (listEl) listEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
}

// Show empty comments
function showEmptyComments() {
    const listEl = document.getElementById('comments-list');
    const emptyEl = document.getElementById('comments-empty');
    
    if (listEl) listEl.classList.add('hidden');
    if (emptyEl) emptyEl.classList.remove('hidden');
}

// Load more functionality removed

// Show/hide edit form
function showEditForm(commentId) {
    document.getElementById(`content-${commentId}`).classList.add('hidden');
    document.getElementById(`edit-form-${commentId}`).classList.remove('hidden');
    
    const editInput = document.getElementById(`edit-input-${commentId}`);
    editInput.focus();
    
    // Setup character counter for edit form (only once)
    if (!editInput.hasAttribute('data-listener-added')) {
        editInput.addEventListener('input', function() {
            const counter = document.getElementById(`edit-char-count-${commentId}`);
            if (counter) {
                counter.textContent = editInput.value.length;
            }
        });
        editInput.setAttribute('data-listener-added', 'true');
    }
    
    closeAllMenus();
}

function hideEditForm(commentId) {
    document.getElementById(`content-${commentId}`).classList.remove('hidden');
    document.getElementById(`edit-form-${commentId}`).classList.add('hidden');
}

function saveEditComment(commentId) {
    const editInput = document.getElementById(`edit-input-${commentId}`);
    const noiDung = editInput.value.trim();
    
    if (noiDung) {
        updateComment(commentId, noiDung);
    }
}

// Show/hide reply form
function showReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    replyForm.classList.remove('hidden');
    
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    replyInput.focus();
    
    // Setup character counter for reply form (only once)
    if (!replyInput.hasAttribute('data-listener-added')) {
        replyInput.addEventListener('input', function() {
            const counter = document.getElementById(`reply-char-count-${commentId}`);
            if (counter) {
                counter.textContent = replyInput.value.length;
            }
        });
        replyInput.setAttribute('data-listener-added', 'true');
    }
}

function hideReplyForm(commentId) {
    const replyForm = document.getElementById(`reply-form-${commentId}`);
    replyForm.classList.add('hidden');
    
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    replyInput.value = '';
}

function sendReply(commentId) {
    const replyInput = document.getElementById(`reply-input-${commentId}`);
    const noiDung = replyInput.value.trim();
    
    if (noiDung) {
        replyToComment(commentId, noiDung);
    }
}

// Toggle comment menu
function toggleCommentMenu(commentId) {
    closeAllMenus();
    const menu = document.getElementById(`menu-${commentId}`);
    menu.classList.toggle('hidden');
}

// Close all menus
function closeAllMenus() {
    document.querySelectorAll('.comment-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
}

// Reply count is handled automatically in createCommentElement

// Format time ago
function formatTimeAgo(dateString) {
    if (!dateString) return '';
    
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
        
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i data-feather="${
                type === 'success' ? 'check-circle' :
                type === 'error' ? 'x-circle' :
                'info'
            }" class="w-5 h-5"></i>
            <span>${escapeHtml(message)}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    feather.replace();
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s ease';
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ===============================
// Bình luận tin tìm phòng
// ===============================

function getAuthToken() {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('authToken') || 
                  localStorage.getItem('accessToken') ||
                  localStorage.getItem('jwtToken');
    return token;
}

async function loadComments() {
    try {
        showCommentsLoading();
        const endpoint = `${API_BASE}/api/bai-dang-tim-phong/${postId}/binh-luan`;
        const response = await fetch(endpoint, { mode: 'cors' });

        if (!response.ok) {
            if (response.status === 404) {
                showCommentsEmpty();
                return;
            }
            throw new Error(`HTTP ${response.status}`);
        }

        const comments = await response.json();
        if (Array.isArray(comments) && comments.length > 0) {
            displayComments(comments);
            hideCommentsLoading();
        } else {
            showCommentsEmpty();
        }
    } catch (error) {
        console.error('[COMMENTS] Error loading comments:', error);
        showCommentsEmpty();
    }
}

function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');
    const loadingState = document.getElementById('commentsLoading');

    if (!commentsList) return;

    commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';

    comments.forEach((comment, index) => {
        try {
            const element = createCommentElement(comment, index);
            if (comment.id) {
                element.dataset.commentId = comment.id;
            }
            commentsList.appendChild(element);
        } catch (e) {
            console.error('[COMMENTS] Error rendering comment', e);
        }
    });
}

function createCommentElement(comment, index) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.id = `comment-${index}`;

    const author = comment.fullname || comment.hoTen || comment.tenNguoiDung || comment.author || comment.userName || comment.name || 'Thành viên';
    const content = comment.noiDung || comment.content || comment.text || '';
    const dateStr = comment.ngayTao || comment.createdAt || comment.created_at || new Date().toISOString();
    const replies = comment.binhLuanCon || comment.replies || [];

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

                <div class="comment-text">${escapeHtml(content)}</div>

                <div class="comment-actions">
                    <button class="action-btn" onclick="toggleReplyForm(${index})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
                        </svg>
                        Trả lời
                    </button>
                </div>

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

function createReplyElement(reply) {
    const author = reply.fullname || reply.hoTen || reply.tenNguoiDung || reply.author || reply.userName || reply.name || 'Thành viên';
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

function setupCommentForm() {
    const submitBtn = document.getElementById('submitCommentBtn');
    const commentInput = document.getElementById('commentInput');
    const charCount = document.getElementById('charCount');

    if (submitBtn) {
        submitBtn.addEventListener('click', sendComment);
    }

    if (commentInput) {
        commentInput.addEventListener('input', function() {
            if (charCount) {
                charCount.textContent = this.value.length;
            }
            this.style.height = 'auto';
            this.style.height = Math.max(120, this.scrollHeight) + 'px';
        });

        commentInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                sendComment();
            }
        });
    }

    updateCurrentUserDisplay();
}

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

async function sendComment() {
    const commentInput = document.getElementById('commentInput');
    const submitBtn = document.getElementById('submitCommentBtn');

    if (!commentInput) return;

    const content = commentInput.value.trim();

    if (!content) {
        showCommentError('Vui lòng nhập bình luận');
        return;
    }

    if (content.length > 5000) {
        showCommentError('Bình luận không được vượt quá 5000 ký tự');
        return;
    }

    const token = getAuthToken();
    if (!token) {
        showCommentError('Bạn cần đăng nhập để bình luận');
        return;
    }

    const userId = getUserId();
    if (!userId) {
        showCommentError('Không xác định được người dùng. Vui lòng đăng nhập lại.');
        return;
    }

    const originalText = submitBtn.textContent;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Đang gửi...';

        const response = await fetch(`${API_BASE}/api/bai-dang-tim-phong/${postId}/binh-luan`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'userId': userId.toString()
            },
            body: JSON.stringify({ noiDung: content })
        });

        if (!response.ok) {
            let errorMessage = 'Không thể gửi bình luận. Vui lòng thử lại.';
            if (response.status === 401) {
                errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
            } else if (response.status === 403) {
                errorMessage = 'Bạn không có quyền bình luận bài viết này.';
            }
            throw new Error(errorMessage);
        }

        commentInput.value = '';
        commentInput.style.height = '120px';
        showCommentSuccess('Bình luận đã được gửi thành công!');
        setTimeout(loadComments, 500);
    } catch (error) {
        showCommentError(error.message || 'Đã xảy ra lỗi khi gửi bình luận');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function toggleReplyForm(commentIndex) {
    const form = document.getElementById(`reply-form-${commentIndex}`);
    const button = document.querySelector(`button[onclick="toggleReplyForm(${commentIndex})"]`);

    if (!form) return;

    const isActive = form.classList.contains('active');

    document.querySelectorAll('.reply-form.active').forEach(f => f.classList.remove('active'));
    document.querySelectorAll('.action-btn.active').forEach(btn => btn.classList.remove('active'));

    if (!isActive) {
        form.classList.add('active');
        if (button) button.classList.add('active');

        const textarea = document.getElementById(`reply-input-${commentIndex}`);
        if (textarea) {
            setTimeout(() => textarea.focus(), 100);
        }
    }
}

function cancelReply(commentIndex) {
    const form = document.getElementById(`reply-form-${commentIndex}`);
    const textarea = document.getElementById(`reply-input-${commentIndex}`);
    const button = document.querySelector(`button[onclick="toggleReplyForm(${commentIndex})"]`);

    if (form) form.classList.remove('active');
    if (button) button.classList.remove('active');
    if (textarea) textarea.value = '';
}

async function submitReply(commentIndex) {
    const textarea = document.getElementById(`reply-input-${commentIndex}`);
    if (!textarea) return;

    const content = textarea.value.trim();

    if (!content) {
        showCommentError('Vui lòng nhập phản hồi');
        return;
    }

    if (content.length > 5000) {
        showCommentError('Phản hồi không được vượt quá 5000 ký tự');
        return;
    }

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

    const commentElement = document.getElementById(`comment-${commentIndex}`);
    let parentCommentId = commentElement?.dataset.commentId ? parseInt(commentElement.dataset.commentId) : null;
    if (!parentCommentId) {
        showCommentError('Không xác định được bình luận cha.');
        return;
    }

    const originalButton = document.querySelector(`#reply-form-${commentIndex} button[onclick="submitReply(${commentIndex})"]`);
    const originalText = originalButton ? originalButton.textContent : 'Gửi';

    try {
        if (originalButton) {
            originalButton.disabled = true;
            originalButton.innerHTML = '<span class="loading-spinner"></span> Đang gửi...';
        }

        const response = await fetch(`${API_BASE}/api/bai-dang-tim-phong/${postId}/binh-luan`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`,
                'userId': userId.toString()
            },
            body: JSON.stringify({
                noiDung: content,
                idBinhLuanCha: parentCommentId
            })
        });

        if (!response.ok) {
            let errorMessage = 'Không thể gửi phản hồi. Vui lòng thử lại.';
            if (response.status === 401) {
                errorMessage = 'Token hết hạn. Vui lòng đăng nhập lại.';
            } else if (response.status === 404) {
                errorMessage = 'Bình luận gốc không tồn tại.';
            }
            throw new Error(errorMessage);
        }

        textarea.value = '';
        cancelReply(commentIndex);
        showCommentSuccess('Phản hồi đã được gửi thành công!');
        setTimeout(loadComments, 500);
    } catch (error) {
        showCommentError(error.message || 'Đã xảy ra lỗi khi gửi phản hồi');
    } finally {
        if (originalButton) {
            originalButton.disabled = false;
            originalButton.textContent = originalText;
        }
    }
}

function showCommentsLoading() {
    const loadingState = document.getElementById('commentsLoading');
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');

    if (loadingState) loadingState.style.display = 'block';
    if (commentsList) commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'none';

    // Also show the kebab-case loader used by the new comment block
    const loadingKebab = document.getElementById('comments-loading');
    if (loadingKebab) loadingKebab.classList.remove('hidden');
    const listKebab = document.getElementById('comments-list');
    if (listKebab) listKebab.classList.add('hidden');
    const emptyKebab = document.getElementById('comments-empty');
    if (emptyKebab) emptyKebab.classList.add('hidden');
}

function hideCommentsLoading() {
    const loadingState = document.getElementById('commentsLoading');
    if (loadingState) loadingState.style.display = 'none';
    // Also hide the kebab-case loader used by the new comment block
    const loadingKebab = document.getElementById('comments-loading');
    if (loadingKebab) loadingKebab.classList.add('hidden');
}

function showCommentsEmpty() {
    const loadingState = document.getElementById('commentsLoading');
    const commentsList = document.getElementById('commentsList');
    const emptyState = document.getElementById('commentsEmpty');

    if (loadingState) loadingState.style.display = 'none';
    if (commentsList) commentsList.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
}

function showCommentError(message) {
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;

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

function showCommentSuccess(message) {
    const commentSection = document.querySelector('.comment-section');
    if (!commentSection) return;

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

