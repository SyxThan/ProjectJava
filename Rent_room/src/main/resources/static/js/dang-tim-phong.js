/**
 * Dang Tim Phong Page - Kết nối với backend API
 * Module: Đăng bài tìm phòng (BaiDangTimPhong)
 */

// API endpoint - use from window if available, otherwise use default
const API_BASE = (typeof window !== 'undefined' && window.DANG_TIM_PHONG_API_BASE) 
    ? window.DANG_TIM_PHONG_API_BASE + '/createpost'
    : 'http://localhost:8080/api/baidangtimphong/createpost';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeDangTimPhong();
});

function initializeDangTimPhong() {
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
    
    // Setup form submission
    const form = document.getElementById('postForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Check authentication - use safe check
    const isAuth = typeof isAuthenticated !== 'undefined' ? isAuthenticated() : 
                   (localStorage.getItem('token') !== null || sessionStorage.getItem('token') !== null);
    
    if (!isAuth) {
        alert('Vui lòng đăng nhập để đăng bài');
        window.location.href = 'auth.html';
        return;
    }
    
    // Get user - use safe check
    let user = null;
    if (typeof getCurrentUser !== 'undefined') {
        user = getCurrentUser();
    } else {
        // Fallback: get user from storage
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        if (userStr) {
            try {
                user = JSON.parse(userStr);
            } catch (e) {
                console.error('Error parsing user data:', e);
            }
        }
    }
    
    // Normalize user ID - check both 'id' and 'user_id' fields
    let userId = null;
    if (user) {
        // Priority: user_id (from auth.js), then userId, then id
        userId = user.user_id || user.userId || user.id;
    }
    
    // Fallback: check localStorage for user_id
    if (!userId) {
        const storedId = localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
        // Avoid using string "undefined" or "null"
        if (storedId && storedId !== 'undefined' && storedId !== 'null') {
            userId = storedId;
        }
    }
    
    // Parse and validate
    const parsedUserId = parseInt(userId, 10);
    if (!user || isNaN(parsedUserId) || parsedUserId <= 0) {
        console.error('User data:', user);
        console.error('Raw User ID:', userId);
        console.error('Parsed User ID:', parsedUserId);
        alert('Không tìm thấy thông tin người dùng hợp lệ. Vui lòng đăng nhập lại.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Collect form data
    const khuVucMongMuonThanhPhoEl = document.getElementById('khuVucMongMuonThanhPho');
    const formData = {
        userId: parsedUserId,
        tieuDe: document.getElementById('tieuDe').value.trim(),
        moTa: document.getElementById('moTa').value.trim(),
        khuVucMongMuonXa: document.getElementById('khuVucMongMuonXa').value.trim(),
        khuVucMongMuonThanhPho: khuVucMongMuonThanhPhoEl ? (khuVucMongMuonThanhPhoEl.value.trim() || 'Hà Nội') : 'Hà Nội', // Default to Hà Nội
        giaThapNhat: parseFloat(document.getElementById('giaThapNhat').value) || 0,
        giaCaoNhat: parseFloat(document.getElementById('giaCaoNhat').value) || 0,
        dienTichToiThieu: parseFloat(document.getElementById('dienTichToiThieu').value) || 0,
        soNguoiO: parseInt(document.getElementById('soNguoiO').value) || null
    };
    
    // Validation
    if (!formData.tieuDe || formData.tieuDe.length < 5) {
        alert('Tiêu đề phải có ít nhất 5 ký tự');
        return;
    }
    
    if (!formData.khuVucMongMuonXa || !formData.khuVucMongMuonThanhPho) {
        alert('Vui lòng nhập đầy đủ thông tin khu vực');
        return;
    }
    
    if (formData.giaThapNhat <= 0 || formData.giaCaoNhat <= 0) {
        alert('Giá phải lớn hơn 0');
        return;
    }
    
    if (!formData.dienTichToiThieu || formData.dienTichToiThieu <= 0) {
        alert('Diện tích tối thiểu phải lớn hơn 0');
        return;
    }
    
    if (formData.giaThapNhat > formData.giaCaoNhat) {
        alert('Giá thấp nhất không được lớn hơn giá cao nhất');
        return;
    }
    
    // Show loading
    const submitBtn = document.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Đang đăng bài...';
    }
    
    try {
        // Backend trả về ResponseEntity với body là string message hoặc error array/string
        const token = typeof getAuthToken !== 'undefined' ? getAuthToken() : 
                      (localStorage.getItem('token') || sessionStorage.getItem('token'));
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(formData)
        });
        
        // Handle both JSON and plain text responses
        let responseData;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            try {
                responseData = await response.json();
            } catch (e) {
                // If JSON parsing fails, try as text
                const text = await response.text();
                responseData = text;
            }
        } else {
            // Plain text response
            responseData = await response.text();
        }
        
        if (response.ok) {
            // Backend trả về ResponseEntity.ok("Tạo bài viết thành công") - có thể là string hoặc JSON
            let message = 'Đăng bài thành công!';
            if (typeof responseData === 'string') {
                message = responseData;
            } else if (responseData && responseData.message) {
                message = responseData.message;
            }
            
            if (typeof showSuccessMessage !== 'undefined') {
                showSuccessMessage(message);
            } else {
                alert(message);
            }
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'tim-phong.html';
            }, 2000);
        } else {
            // Backend trả về error: string hoặc List<String> hoặc JSON object
            let errorMessage = 'Đăng bài thất bại. Vui lòng thử lại.';
            if (typeof responseData === 'string') {
                errorMessage = responseData;
            } else if (Array.isArray(responseData)) {
                errorMessage = responseData.join(', ');
            } else if (responseData && typeof responseData === 'object') {
                if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (Array.isArray(responseData.errors)) {
                    errorMessage = responseData.errors.join(', ');
                }
            }
            
            if (typeof showErrorMessage !== 'undefined') {
                showErrorMessage(errorMessage);
            } else {
                alert(errorMessage);
            }
            
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
        
    } catch (error) {
        if (typeof handleApiError !== 'undefined') {
            handleApiError(error);
        } else {
            console.error('Error submitting form:', error);
            alert('Có lỗi xảy ra khi đăng bài. Vui lòng thử lại.');
        }
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

