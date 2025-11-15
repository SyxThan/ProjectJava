/**
 * Dang Tim Phong Page - Kết nối với backend API
 * Module: Đăng bài tìm phòng (BaiDangTimPhong)
 */

const API_BASE = 'http://localhost:8080/api/baidangtimphong/createpost';

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
    
    // Check authentication
    if (!isAuthenticated()) {
        alert('Vui lòng đăng nhập để đăng bài');
        window.location.href = 'auth.html';
        return;
    }
    
    const user = getCurrentUser();
    if (!user || !user.id) {
        alert('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
        window.location.href = 'auth.html';
        return;
    }
    
    // Collect form data
    const khuVucMongMuonThanhPhoEl = document.getElementById('khuVucMongMuonThanhPho');
    const formData = {
        userId: user.id,
        tieuDe: document.getElementById('tieuDe').value.trim(),
        moTa: document.getElementById('moTa').value.trim(),
        khuVucMongMuonXa: document.getElementById('khuVucMongMuonXa').value.trim(),
        khuVucMongMuonThanhPho: khuVucMongMuonThanhPhoEl ? (khuVucMongMuonThanhPhoEl.value.trim() || 'Hà Nội') : 'Hà Nội', // Default to Hà Nội
        giaThapNhat: parseFloat(document.getElementById('giaThapNhat').value) || 0,
        giaCaoNhat: parseFloat(document.getElementById('giaCaoNhat').value) || 0,
        dienTichToiThieu: parseFloat(document.getElementById('dienTichToiThieu').value) || null,
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
        const token = getAuthToken();
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify(formData)
        });
        
        const responseData = await response.json();
        
        if (response.ok) {
            // Backend trả về ResponseEntity.ok("Tạo bài viết thành công")
            const message = typeof responseData === 'string' ? responseData : 
                           (responseData.message || 'Đăng bài thành công!');
            showSuccessMessage(message);
            
            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'tim-phong.html';
            }, 2000);
        } else {
            // Backend trả về error: string hoặc List<String>
            let errorMessage = 'Đăng bài thất bại. Vui lòng thử lại.';
            if (Array.isArray(responseData)) {
                errorMessage = responseData.join(', ');
            } else if (typeof responseData === 'string') {
                errorMessage = responseData;
            } else if (responseData.message) {
                errorMessage = responseData.message;
            }
            showErrorMessage(errorMessage);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
        
    } catch (error) {
        handleApiError(error);
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }
}

