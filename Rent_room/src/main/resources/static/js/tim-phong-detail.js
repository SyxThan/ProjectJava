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
    await loadComments();
    setupCommentForm();
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
}

function hideCommentsLoading() {
    const loadingState = document.getElementById('commentsLoading');
    if (loadingState) loadingState.style.display = 'none';
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

