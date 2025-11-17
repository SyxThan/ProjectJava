/**
 * Index Page - Trang chủ
 * Trang chủ đơn giản với điều hướng và thông tin về trang web
 */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeIndex();
});

function initializeIndex() {
    // Initialize AOS and Feather Icons
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 50
        });
    }
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    // Re-render icons after animations
    setTimeout(() => {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }, 500);
}
