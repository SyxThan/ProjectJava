/**
 * Search Page - Kết nối với backend API
 * Module: Tìm phòng trọ (BaiDangChoThue)
 * Endpoint: GET /api/baidang
 * Parameters: page, size, tinhThanh, phuongXa, giaMin, giaMax, dienTichMin, dienTichMax, trangThai
 */

const API_BASE = 'http://localhost:8080/api/baidang';

let currentPage = 0;
const pageSize = 12;
let currentFilters = {};
let currentSort = 'ngayDang-desc';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

function initializeSearch() {
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
    
    // Load initial data from URL params
    loadFiltersFromURL();
    loadPosts();
}

function setupEventListeners() {
    // Filter phường/xã change event
    const filterPhuongXa = document.getElementById('filterPhuongXa');
    if (filterPhuongXa) {
        filterPhuongXa.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    if (mobileMenuButton) {
        mobileMenuButton.addEventListener('click', function() {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.toggle('hidden');
            }
        });
    }
}

function loadFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Load filters from URL
    const phuongXa = urlParams.get('phuongXa');
    const page = urlParams.get('page');
    
    // Set filter values
    if (phuongXa) {
        const filterPhuongXa = document.getElementById('filterPhuongXa');
        if (filterPhuongXa) filterPhuongXa.value = phuongXa;
    }
    
    if (page) {
        currentPage = parseInt(page) || 0;
    }
}

async function performSearch() {
    currentPage = 0;
    currentFilters = buildFilters();
    updateURL();
    await loadPosts();
}

function buildFilters() {
    const filters = {};
    
    // Tỉnh/Thành phố - Luôn mặc định là Hà Nội
    filters.tinhThanh = 'Hà Nội';
    
    // Phường/Xã - Backend parameter: phuongXa
    const filterPhuongXa = document.getElementById('filterPhuongXa');
    if (filterPhuongXa && filterPhuongXa.value) {
        filters.phuongXa = filterPhuongXa.value;
    }
    
    // Trạng thái - Mặc định chỉ hiển thị bài đã duyệt
    filters.trangThai = 'APPROVED';
    
    return filters;
}

function updateURL() {
    const params = new URLSearchParams();
    
    // Only add phuongXa to URL if it's set (tinhThanh is always Hà Nội, no need to add)
    if (currentFilters.phuongXa) params.set('phuongXa', currentFilters.phuongXa);
    if (currentPage > 0) params.set('page', currentPage);
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.pushState({}, '', newURL);
}

async function loadPosts() {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const searchSummary = document.getElementById('searchSummary');
    const loadingState = document.getElementById('loadingState');
    const noResults = document.getElementById('noResults');
    
    // Show loading
    if (loadingState) loadingState.classList.remove('hidden');
    if (resultsGrid) resultsGrid.innerHTML = '';
    if (noResults) noResults.classList.add('hidden');
    
    try {
        // Build query parameters matching backend exactly
        const params = {
            page: currentPage,
            size: pageSize
        };
        
        // Add filters if they exist
        if (currentFilters.tinhThanh) params.tinhThanh = currentFilters.tinhThanh;
        if (currentFilters.phuongXa) params.phuongXa = currentFilters.phuongXa;
        if (currentFilters.trangThai) params.trangThai = currentFilters.trangThai;
        
        const data = await apiGet(API_BASE, params);
        
        if (loadingState) loadingState.classList.add('hidden');
        
        // Handle PaginationResponseDTO format: { success, message, data: [...], pagination: {...} }
        let posts = [];
        let totalCount = 0;
        let paginationInfo = null;
        
        if (data && data.data && Array.isArray(data.data)) {
            // PaginationResponseDTO format
            posts = data.data;
            if (data.pagination) {
                totalCount = data.pagination.totalItems || 0;
                paginationInfo = {
                    number: data.pagination.currentPage || 0,
                    totalPages: data.pagination.totalPages || 0,
                    totalElements: data.pagination.totalItems || 0
                };
            } else {
                totalCount = posts.length;
            }
        } else if (data && data.content && Array.isArray(data.content)) {
            // Spring Page format (fallback)
            posts = data.content;
            totalCount = data.totalElements || 0;
            paginationInfo = {
                number: data.number || 0,
                totalPages: data.totalPages || 0,
                totalElements: data.totalElements || 0
            };
        } else if (Array.isArray(data)) {
            // Simple array response (fallback)
            posts = data;
            totalCount = data.length;
        } else {
            console.error('Invalid response format:', data);
            throw new Error('Dữ liệu không hợp lệ');
        }
        
        if (posts && posts.length > 0) {
            displayPosts(posts);
            updateResultsCount(totalCount);
            updateSearchSummary(currentFilters);
            if (paginationInfo) {
                updatePagination(paginationInfo);
            }
        } else {
            showNoResults();
        }
    } catch (error) {
        if (loadingState) loadingState.classList.add('hidden');
        handleApiError(error);
        showNoResults();
    }
}

function displayPosts(posts) {
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    if (!resultsGrid) return;
    
    if (!posts || posts.length === 0) {
        showNoResults();
        return;
    }
    
    if (noResults) noResults.classList.add('hidden');
    
    resultsGrid.innerHTML = posts.map(post => createPostCard(post)).join('');
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
    
    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }
}

function createPostCard(post) {
    // Support both Entity (snake_case) and DTO (camelCase) formats
    const price = post.gia_thang || post.giaThang || 0;
    const area = post.dien_tich_m2 || post.dienTichM2 || 0;
    const title = post.tieu_de || post.tieuDe || 'Không có tiêu đề';
    const phuongXa = post.phuong_xa || post.phuongXa || '';
    const tinhThanh = post.tinh_thanhpho || post.tinhThanhpho || '';
    const id = post.id;
    
    // Get image URL - try multiple sources
    let image = '';
    
    // 1. Try anhBia field (DTO format)
    if (post.anhBia) {
        image = post.anhBia;
    }
    // 2. Try hinhAnhPhongTro array - find image with laAnhBia = true
    else if (post.hinhAnhPhongTro && Array.isArray(post.hinhAnhPhongTro)) {
        const anhBia = post.hinhAnhPhongTro.find(img => img.laAnhBia === true);
        if (anhBia && anhBia.duong_dan_anh) {
            image = anhBia.duong_dan_anh;
        } else if (post.hinhAnhPhongTro.length > 0 && post.hinhAnhPhongTro[0].duong_dan_anh) {
            // Fallback to first image
            image = post.hinhAnhPhongTro[0].duong_dan_anh;
        }
    }
    // 3. Try HinhAnhPhongTro (capital H)
    else if (post.HinhAnhPhongTro && Array.isArray(post.HinhAnhPhongTro)) {
        const anhBia = post.HinhAnhPhongTro.find(img => img.laAnhBia === true);
        if (anhBia && anhBia.duong_dan_anh) {
            image = anhBia.duong_dan_anh;
        } else if (post.HinhAnhPhongTro.length > 0 && post.HinhAnhPhongTro[0].duong_dan_anh) {
            image = post.HinhAnhPhongTro[0].duong_dan_anh;
        }
    }
    
    // Parse image URL if it's a JSON string or needs parsing
    if (image && typeof parseImageUrl !== 'undefined') {
        image = parseImageUrl(image);
    }
    
    // Format address
    const address = [phuongXa, tinhThanh].filter(Boolean).join(', ');
    
    return `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition" data-aos="fade-up">
            <a href="detail.html?id=${id}">
                <div class="relative h-48 ${image ? '' : 'bg-gradient-to-br from-blue-400 to-blue-600'}">
                    ${image ? `<img src="${image}" alt="${title}" class="w-full h-full object-cover" loading="lazy" onerror="this.onerror=null; this.style.display='none'; this.parentElement.classList.add('bg-gradient-to-br', 'from-blue-400', 'to-blue-600'); this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center\\'><i data-feather=\\'image\\' class=\\'w-16 h-16 text-white opacity-50\\'></i></div>'; if(typeof feather !== 'undefined') feather.replace();">` : '<div class="w-full h-full flex items-center justify-center"><i data-feather="image" class="w-16 h-16 text-white opacity-50"></i></div>'}
                    <div class="absolute top-4 right-4 bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium text-blue-600">
                        Mới đăng
                    </div>
                    <div class="absolute bottom-4 left-4 text-white drop-shadow-lg">
                        <span class="text-2xl font-bold">${formatPrice(price)}</span>
                        <span class="text-sm">/tháng</span>
                    </div>
                </div>
                <div class="p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">${title}</h3>
                    <div class="flex items-center text-sm text-gray-600 mb-3">
                        <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                        <span class="line-clamp-1">${address || 'Chưa có địa chỉ'}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div class="flex items-center">
                            <i data-feather="maximize-2" class="w-4 h-4 mr-1"></i>
                            <span>${area} m²</span>
                        </div>
                        <div class="flex items-center">
                            <i data-feather="calendar" class="w-4 h-4 mr-1"></i>
                            <span>${formatDate(post.ngay_dang || post.ngayDang)}</span>
                        </div>
                    </div>
                    <a href="detail.html?id=${id}" class="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                        Xem chi tiết
                    </a>
                </div>
            </a>
        </div>
    `;
}

function formatDate(dateValue) {
    if (!dateValue) return 'Chưa có ngày';
    try {
        // Handle both string and LocalDateTime format from backend
        let date;
        if (typeof dateValue === 'string') {
            // Backend sends LocalDateTime as ISO string (e.g., "2024-01-15T10:30:00")
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return 'Chưa có ngày';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Chưa có ngày';
        }
        
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Hôm nay';
        if (days === 1) return 'Hôm qua';
        if (days < 7) return `${days} ngày trước`;
        if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
        return date.toLocaleDateString('vi-VN');
    } catch (e) {
        return 'Chưa có ngày';
    }
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = count;
    }
}

function updateSearchSummary(filters) {
    const searchSummary = document.getElementById('searchSummary');
    if (!searchSummary) return;
    
    const parts = [];
    
    if (filters.tinhThanh) {
        parts.push(filters.tinhThanh);
    }
    if (filters.phuongXa) {
        parts.push(filters.phuongXa);
    }
    
    searchSummary.textContent = parts.length > 0 ? parts.join(' • ') : 'Hà Nội • Tất cả phường/xã';
}

function updatePagination(data) {
    const pagination = document.getElementById('pagination');
    if (!pagination || !data) return;
    
    const totalPages = data.totalPages || 0;
    const currentPageNum = data.number || 0;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<nav class="flex items-center justify-center space-x-1">';
    
    // Previous button
    paginationHTML += `
        <button onclick="changePage(${currentPageNum - 1})" 
                ${currentPageNum === 0 ? 'disabled' : ''}
                class="px-3 py-2 rounded-md ${currentPageNum === 0 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'}">
            <i data-feather="chevron-left" class="w-4 h-4"></i>
        </button>
    `;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(0, currentPageNum - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    if (startPage > 0) {
        paginationHTML += `
            <button onclick="changePage(0)" class="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100">1</button>
        `;
        if (startPage > 1) {
            paginationHTML += '<span class="px-2 text-gray-500">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button onclick="changePage(${i})" 
                    class="px-4 py-2 rounded-md ${i === currentPageNum ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}">
                ${i + 1}
            </button>
        `;
    }
    
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            paginationHTML += '<span class="px-2 text-gray-500">...</span>';
        }
        paginationHTML += `
            <button onclick="changePage(${totalPages - 1})" class="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-100">${totalPages}</button>
        `;
    }
    
    // Next button
    paginationHTML += `
        <button onclick="changePage(${currentPageNum + 1})" 
                ${currentPageNum >= totalPages - 1 ? 'disabled' : ''}
                class="px-3 py-2 rounded-md ${currentPageNum >= totalPages - 1 ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'}">
            <i data-feather="chevron-right" class="w-4 h-4"></i>
        </button>
    `;
    
    paginationHTML += '</nav>';
    pagination.innerHTML = paginationHTML;
    
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

function changePage(page) {
    if (page < 0) return;
    currentPage = page;
    updateURL();
    loadPosts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function sortResults() {
    // Sort functionality removed - not needed with simplified filters
}

function applyFilters() {
    currentPage = 0;
    currentFilters = buildFilters();
    updateURL();
    loadPosts();
    
    // Close sidebar on mobile
    closeFilterSidebar();
}

function clearFilters() {
    // Reset filter input
    const filterPhuongXa = document.getElementById('filterPhuongXa');
    if (filterPhuongXa) filterPhuongXa.value = '';
    
    // Apply cleared filters
    currentPage = 0;
    currentFilters = buildFilters();
    updateURL();
    loadPosts();
    
    // Close sidebar on mobile
    closeFilterSidebar();
}

function openFilterSidebar() {
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');
    if (filterSidebar) filterSidebar.classList.remove('mobile-hidden');
    if (filterOverlay) filterOverlay.classList.add('active');
}

function closeFilterSidebar() {
    const filterSidebar = document.getElementById('filterSidebar');
    const filterOverlay = document.getElementById('filterOverlay');
    if (filterSidebar) filterSidebar.classList.add('mobile-hidden');
    if (filterOverlay) filterOverlay.classList.remove('active');
}

function showNoResults() {
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    if (resultsGrid) resultsGrid.innerHTML = '';
    if (noResults) {
        noResults.classList.remove('hidden');
        if (typeof feather !== 'undefined') feather.replace();
    }
}

// Make functions available globally
window.performSearch = performSearch;
window.changePage = changePage;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.openFilterSidebar = openFilterSidebar;
window.closeFilterSidebar = closeFilterSidebar;
window.sortResults = sortResults;
