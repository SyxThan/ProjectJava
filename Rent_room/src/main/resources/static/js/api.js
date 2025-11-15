/**
 * API Utility Functions
 * Common functions for making API requests with authentication
 */

const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Get authentication token from storage
 */
function getAuthToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

/**
 * Get current user data from storage
 */
function getCurrentUser() {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    return null;
}

/**
 * Get current user ID
 */
function getCurrentUserId() {
    const user = getCurrentUser();
    return user ? user.id : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return getAuthToken() !== null;
}

/**
 * Make authenticated API request
 */
async function apiRequest(url, options = {}) {
    const token = getAuthToken();
    
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };
    
    try {
        const response = await fetch(url, config);
        
        // Handle 401 Unauthorized
        if (response.status === 401) {
            // Clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            
            // Redirect to login
            if (window.location.pathname !== '/auth.html' && !window.location.pathname.includes('auth.html')) {
                window.location.href = 'auth.html';
            }
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        
        return response;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * GET request
 */
async function apiGet(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    
    const response = await apiRequest(fullUrl, {
        method: 'GET'
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    return response.json();
}

/**
 * POST request
 */
async function apiPost(url, data = {}) {
    const response = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    return response.json();
}

/**
 * PUT request
 */
async function apiPut(url, data = {}) {
    const response = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    return response.json();
}

/**
 * DELETE request
 */
async function apiDelete(url) {
    const response = await apiRequest(url, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `HTTP ${response.status}`);
    }
    
    // Some DELETE endpoints may not return JSON
    try {
        return await response.json();
    } catch (e) {
        return { success: true };
    }
}

/**
 * Format price in Vietnamese currency
 */
function formatPrice(price) {
    if (!price) return '0';
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
}

/**
 * Format price per month
 */
function formatPricePerMonth(price) {
    if (!price) return '0';
    const formatted = new Intl.NumberFormat('vi-VN').format(price);
    return formatted + ' đ/tháng';
}

/**
 * Show success notification
 */
function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Show error notification
 */
function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

/**
 * Show loading overlay
 */
function showLoading(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="text-center">
                    <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p class="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        `;
    }
}

/**
 * Handle API errors
 */
function handleApiError(error) {
    console.error('API Error:', error);
    const message = error.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
    showErrorMessage(message);
}

/**
 * Parse image URL from various formats
 * Handles: JSON array string, single URL, or null/empty
 */
function parseImageUrl(imageData) {
    if (!imageData || typeof imageData !== 'string' || imageData.trim() === '') {
        return '';
    }
    
    const trimmed = imageData.trim();
    
    // If it's a JSON array string
    if (trimmed.startsWith('[')) {
        try {
            // Replace single quotes with double quotes for valid JSON
            const cleaned = trimmed.replace(/'/g, '"');
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed[0];
            }
        } catch (e) {
            // If JSON parsing fails, try regex to extract URL
            const match = trimmed.match(/https?:\/\/[^\s'"]+/);
            if (match) {
                return match[0];
            }
        }
    }
    
    // If it's already a URL, return as is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    
    return '';
}

/**
 * Get image URL from post data
 * Tries multiple sources: anhBia, anh_bia, or HinhAnhPhongTro array
 */
function getPostImageUrl(post) {
    // Try anhBia field (camelCase - DTO format)
    let image = post.anhBia || '';
    if (image) {
        image = parseImageUrl(image);
        if (image) return image;
    }
    
    // Try anh_bia field (snake_case - Entity format)
    image = post.anh_bia || '';
    if (image) {
        image = parseImageUrl(image);
        if (image) return image;
    }
    
    // Try HinhAnhPhongTro array if available
    if (post.HinhAnhPhongTro && Array.isArray(post.HinhAnhPhongTro) && post.HinhAnhPhongTro.length > 0) {
        const firstImage = post.HinhAnhPhongTro[0];
        if (firstImage && firstImage.duong_dan_anh) {
            image = parseImageUrl(firstImage.duong_dan_anh);
            if (image) return image;
        }
    }
    
    return '';
}

