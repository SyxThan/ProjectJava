/**
 * Tim Phong Page - Kết nối với backend API
 * Module: Tìm người thuê phòng (BaiDangTimPhong)
 */

const API_BASE = 'http://localhost:8080/api/baidangtimphong/';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeTimPhong();
});

function initializeTimPhong() {
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
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial data
    loadPosts();
}

function setupEventListeners() {
    // Search button
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }
    
    // Filter buttons
    const filterToggle = document.getElementById('filterToggle');
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleFilterSidebar);
    }
    
    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

function toggleFilterSidebar() {
    const sidebar = document.getElementById('filterSidebar');
    const overlay = document.getElementById('filterOverlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}

async function performSearch() {
    const resultsContainer = document.getElementById('postsContainer');
    if (resultsContainer) {
        showLoading('postsContainer');
    }
    
    try {
        const filters = buildFilters();
        let url = API_BASE;
        
        // Build URL based on filters
        if (filters.khuVuc) {
            const [xa, thanhPho] = filters.khuVuc.split(',');
            url = `${API_BASE}khuvuc/${encodeURIComponent(thanhPho)}/${encodeURIComponent(xa)}`;
        } else if (filters.giaMin && filters.giaMax) {
            url = `${API_BASE}min/${filters.giaMin}/max/${filters.giaMax}`;
        } else if (filters.giaMin) {
            url = `${API_BASE}min/${filters.giaMin}`;
        } else if (filters.giaMax) {
            url = `${API_BASE}max/${filters.giaMax}`;
        }
        
        // Backend trả về ResponseEntity - có thể là List hoặc error string
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // ResponseEntity.ok() trả về List<BaiDangTimPhongDTO>
        if (Array.isArray(data)) {
            displayPosts(data);
        } else {
            throw new Error('Dữ liệu không hợp lệ');
        }
    } catch (error) {
        handleApiError(error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-600">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
}

function buildFilters() {
    const filters = {};
    
    const city = document.getElementById('filterCity');
    const district = document.getElementById('filterDistrict');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    
    if (city && city.value && district && district.value) {
        filters.khuVuc = `${district.value},${city.value}`;
    }
    if (priceMin && priceMin.value) {
        filters.giaMin = parseFloat(priceMin.value) * 1000000;
    }
    if (priceMax && priceMax.value) {
        filters.giaMax = parseFloat(priceMax.value) * 1000000;
    }
    
    return filters;
}

async function loadPosts() {
    const resultsContainer = document.getElementById('postsContainer');
    if (resultsContainer) {
        showLoading('postsContainer');
    }
    
    try {
        // Backend trả về ResponseEntity - có thể là List hoặc error string
        const response = await fetch(API_BASE, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // ResponseEntity.ok() trả về List<BaiDangTimPhongDTO>
        if (Array.isArray(data)) {
            displayPosts(data);
        } else {
            throw new Error('Dữ liệu không hợp lệ');
        }
    } catch (error) {
        handleApiError(error);
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="text-center py-12">
                    <p class="text-gray-600">Không thể tải dữ liệu. Vui lòng thử lại sau.</p>
                </div>
            `;
        }
    }
}

function displayPosts(posts) {
    const resultsContainer = document.getElementById('postsContainer');
    if (!resultsContainer) return;
    
    if (!posts || posts.length === 0) {
        resultsContainer.innerHTML = `
            <div class="text-center py-12">
                <i data-feather="inbox" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <p class="text-gray-600 text-lg">Không có bài đăng nào</p>
            </div>
        `;
        if (typeof feather !== 'undefined') feather.replace();
        return;
    }
    
    resultsContainer.innerHTML = posts.map(post => createPostCard(post)).join('');
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

function createPostCard(post) {
    const title = post.tieuDe || 'Không có tiêu đề';
    const description = post.moTa || '';
    const city = post.khuVucMongMuonThanhPho || '';
    const district = post.khuVucMongMuonXa || '';
    const priceMin = post.giaThapNhat || 0;
    const priceMax = post.giaCaoNhat || 0;
    const area = post.dienTichToiThieu || 0;
    const id = post.id;
    
    return `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition" data-aos="fade-up">
            <h3 class="text-xl font-bold text-gray-900 mb-3">${title}</h3>
            <p class="text-gray-600 mb-4 line-clamp-3">${description}</p>
            <div class="space-y-2 mb-4">
                <div class="flex items-center text-sm text-gray-600">
                    <i data-feather="map-pin" class="w-4 h-4 mr-2"></i>
                    <span>${district}${city ? ', ' + city : ''}</span>
                </div>
                <div class="flex items-center text-sm text-gray-600">
                    <i data-feather="dollar-sign" class="w-4 h-4 mr-2"></i>
                    <span>${formatPrice(priceMin)} - ${formatPrice(priceMax)}/tháng</span>
                </div>
                ${area > 0 ? `
                <div class="flex items-center text-sm text-gray-600">
                    <i data-feather="maximize-2" class="w-4 h-4 mr-2"></i>
                    <span>Tối thiểu ${area} m²</span>
                </div>
                ` : ''}
            </div>
            <a href="tim-phong-detail.html?id=${id}" class="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                Xem chi tiết
            </a>
        </div>
    `;
}

function applyFilters() {
    toggleFilterSidebar();
    performSearch();
}

// Make functions available globally
window.performSearch = performSearch;
window.applyFilters = applyFilters;
window.toggleFilterSidebar = toggleFilterSidebar;

