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
  getCurrentUser().then(u=>{currentUser=u;updateAuthUI();}).catch(()=>{});
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
    getCurrentUser().then(u=>{currentUser=u;updateAuthUI();}).catch(()=>{});
    setupEventListeners();
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

// Get current user from token
async function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    console.log('getCurrentUser - Token exists:', !!token); // Debug log
    
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
            headers: getAuthHeaders()
        });
        
        console.log('getCurrentUser - Response status:', response.status); // Debug log
        
        if (response.ok) {
            const user = await response.json();
            console.log('getCurrentUser - User loaded:', user); // Debug log
            return user;
        }
        return null;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

// Get authentication headers
function getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    console.log('Token:', token ? 'Exists' : 'Missing'); // Debug log
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
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
        addCommentSection.classList.remove('hidden');
        loginPrompt.classList.add('hidden');
        
        // Update avatar
        if (currentUser.avatar) {
            currentUserAvatar.src = currentUser.avatar;
        } else {
            currentUserAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'User')}&background=3b82f6&color=fff`;
        }
    } else {
        addCommentSection.classList.add('hidden');
        loginPrompt.classList.remove('hidden');
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
        
        const response = await fetch(`${API_COMMENT_BASE}/${baiDangId}/binh-luan`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'userId': currentUser.id.toString()
            },
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
        const response = await fetch(`${API_BASE_URL}/binh-luan/${commentId}`, {
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
        
        // Update comment content
        const contentElement = document.getElementById(`content-${commentId}`);
        contentElement.textContent = noiDung;
        
        // Add edited indicator
        const headerElement = document.querySelector(`[data-comment-id="${commentId}"] .comment-header`);
        if (headerElement && !headerElement.querySelector('.edited-indicator')) {
            const editedSpan = document.createElement('span');
            editedSpan.className = 'edited-indicator text-xs text-gray-500 ml-2';
            editedSpan.textContent = '(đã chỉnh sửa)';
            headerElement.appendChild(editedSpan);
        }
        
        // Hide edit form
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
        const response = await fetch(`${API_BASE_URL}/binh-luan/${commentId}`, {
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
        
        // Remove comment element with animation
        const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
        if (commentElement) {
            commentElement.style.transition = 'opacity 0.3s ease';
            commentElement.style.opacity = '0';
            
            setTimeout(() => {
                commentElement.remove();
                
                // Update count
                const countElement = document.getElementById('comment-count');
                const newCount = Math.max(0, parseInt(countElement.textContent) - 1);
                countElement.textContent = newCount;
                
                // Show empty state if no comments
                if (newCount === 0) {
                    showEmptyComments();
                }
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
        const response = await fetch(`${API_COMMENT_BASE}/${currentBaiDangId}/binh-luan`, {
            method: 'POST',
            headers: {
                ...getAuthHeaders(),
                'userId': currentUser.id.toString()
            },
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

