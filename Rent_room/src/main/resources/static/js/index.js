/**
 * Index Page - Trang chủ
 * Load danh sách bài đăng nổi bật
 */

const API_BASE = 'http://localhost:8080/api/baidang';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeIndex();
});

function initializeIndex() {
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
    
    // Load featured posts
    loadFeaturedPosts();
}

async function loadFeaturedPosts() {
    const featuredContainer = document.getElementById('featured-rooms');
    if (!featuredContainer) return;
    
    try {
        // Load approved posts (trangThai = APPROVED)
        const params = {
            page: 0,
            size: 6,
            trangThai: 'APPROVED'
        };
        
        const data = await apiGet(API_BASE, params);
        
        // Handle different response formats
        let posts = null;
        
        if (data && data.data && Array.isArray(data.data)) {
            // New format: { success, message, data: [...], pagination: {...} }
            posts = data.data;
        } else if (data && data.content && Array.isArray(data.content)) {
            // Spring PaginationResponseDTO format: { content: [...], ... }
            posts = data.content;
        } else if (Array.isArray(data)) {
            // Simple array response
            posts = data;
        }
        
        if (posts) {
            displayFeaturedPosts(posts.slice(0, 6));
        } else {
            displayFeaturedPosts([]);
        }
    } catch (error) {
        console.error('Error loading featured posts:', error);
        // Don't show error on homepage, just log it
    }
}

function displayFeaturedPosts(posts) {
    const container = document.getElementById('featured-rooms');
    if (!container) return;
    
    if (!posts || posts.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i data-feather="inbox" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <p class="text-gray-600 text-lg">Chưa có phòng trọ nổi bật</p>
            </div>
        `;
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        return;
    }
    
    container.innerHTML = posts.map(post => createPostCard(post)).join('');
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

function createPostCard(post) {
    const price = post.gia_thang || post.giaThang || 0;
    const area = post.dien_tich_m2 || post.dienTichM2 || 0;
    const title = post.tieu_de || post.tieuDe || 'Không có tiêu đề';
    const district = post.phuong_xa || post.phuongXa || '';
    const city = post.tinh_thanhpho || post.tinhThanhpho || '';
    
    // Get image URL - try multiple methods
    let image = '';
    
    // Direct access first (most common case)
    image = post.anhBia || post.anh_bia || '';
    
    // If empty, try helper functions
    if (!image && typeof getPostImageUrl !== 'undefined') {
        image = getPostImageUrl(post);
    } else if (!image && typeof parseImageUrl !== 'undefined') {
        image = parseImageUrl(post.anhBia || post.anh_bia || '');
    }
    
    // If still empty or if it's a JSON string, try to parse
    if (image && image.trim().startsWith('[')) {
        try {
            const cleaned = image.replace(/'/g, '"').trim();
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed) && parsed.length > 0) {
                image = parsed[0];
            }
        } catch (e) {
            const match = image.match(/https?:\/\/[^\s'"]+/);
            if (match) image = match[0];
        }
    }
    
    // Clean up image URL (remove any extra quotes or whitespace)
    if (image) {
        image = image.trim().replace(/^["']|["']$/g, '');
    }
    
    const id = post.id;
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition" data-aos="fade-up">
            <a href="detail.html?id=${id}">
                <div class="relative h-48 ${image ? '' : 'bg-gradient-to-br from-blue-400 to-blue-600'}">
                    ${image ? `<img src="${image}" alt="${title}" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.parentElement.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600'); this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center\\'><i data-feather=\\'image\\' class=\\'w-16 h-16 text-white opacity-50\\'></i></div>'; if(typeof feather !== 'undefined') feather.replace();">` : '<div class="w-full h-full flex items-center justify-center"><i data-feather="image" class="w-16 h-16 text-white opacity-50"></i></div>'}
                    <div class="absolute bottom-4 left-4 text-white drop-shadow-lg">
                        <span class="text-2xl font-bold">${formatPrice(price)}</span>
                        <span class="text-sm">/tháng</span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">${title}</h3>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                        <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                        <span class="line-clamp-1">${district}${city ? ', ' + city : ''}</span>
                    </div>
                    <div class="flex items-center text-sm text-gray-500">
                        <i data-feather="maximize-2" class="w-4 h-4 mr-1"></i>
                        <span>${area} m²</span>
                    </div>
                </div>
            </a>
        </div>
    `;
}

