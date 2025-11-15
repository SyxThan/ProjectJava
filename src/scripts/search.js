// Backend API base (dev profile runs on 8080)
const API_BASE = 'http://localhost:8080';

// Data stores
let currentFilters = {
    keyword: '',
    tinhThanhpho: '',
    phuongXa: '',
    giaMin: null,
    giaMax: null,
    dienTichMin: null,
    dienTichMax: null,
    trangThai: '',
    page: 0,
    pageSize: 9,
    sortBy: 'id',
    sortDirection: 'desc'
};
let currentResponse = null;
let currentView = 'grid';

// District data for cities
const districtData = {
    'ho-chi-minh': [
        'quan-1', 'quan-2', 'quan-3', 'quan-4', 'quan-5', 'quan-6', 'quan-7', 'quan-8', 'quan-9', 'quan-10',
        'quan-11', 'quan-12', 'binh-thanh', 'go-vap', 'phu-nhuan', 'tan-binh', 'tan-phu', 'thu-duc',
        'binh-chanh', 'can-gio', 'cu-chi', 'hoc-mon', 'nha-be'
    ],
    'ha-noi': [
        'ba-dinh', 'hoan-kiem', 'hai-ba-trung', 'dong-da', 'tay-ho', 'cau-giay',
        'thanh-xuan', 'hoang-mai', 'long-bien', 'nam-tu-liem', 'bac-tu-liem', 'ha-dong'
    ],
    'da-nang': [
        'hai-chau', 'thanh-khe', 'son-tra', 'ngu-hanh-son', 'lien-chieu', 'cam-le'
    ]
    // Add more districts as needed
};

// City names mapping
const cityNames = {
    'ho-chi-minh': 'TP. Hồ Chí Minh',
    'ha-noi': 'Hà Nội',
    'da-nang': 'Đà Nẵng',
    'can-tho': 'Cần Thơ',
    'hai-phong': 'Hải Phòng'
};

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize AOS and Feather Icons
    AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true
    });
    feather.replace();

    // Setup event listeners
    setupEventListeners();
    
    // Initialize view buttons state
    initializeViewButtons();

    // Load initial data from backend
    showLoading();
    try {
        await loadRoomsFromBackend();
        updateResultsCount();
    } catch (e) {
        console.error('Failed to load listings from backend:', e);
        displayNoResults();
    } finally {
        hideLoading();
    }
});

// Fetch listings from backend using new pagination API
async function loadRoomsFromBackend() {
    const params = new URLSearchParams();
    
    if (currentFilters.keyword) params.append('keyword', currentFilters.keyword);
    if (currentFilters.tinhThanhpho) params.append('tinhThanhpho', currentFilters.tinhThanhpho);
    if (currentFilters.phuongXa) params.append('phuongXa', currentFilters.phuongXa);
    if (currentFilters.giaMin !== null) params.append('giaMin', currentFilters.giaMin);
    if (currentFilters.giaMax !== null) params.append('giaMax', currentFilters.giaMax);
    if (currentFilters.dienTichMin !== null) params.append('dienTichMin', currentFilters.dienTichMin);
    if (currentFilters.dienTichMax !== null) params.append('dienTichMax', currentFilters.dienTichMax);
    if (currentFilters.trangThai) params.append('trangThai', currentFilters.trangThai);
    
    params.append('page', currentFilters.page);
    params.append('pageSize', currentFilters.pageSize);
    params.append('sortBy', currentFilters.sortBy);
    params.append('sortDirection', currentFilters.sortDirection);
    
    const resp = await fetch(`${API_BASE}/api/baidang?${params.toString()}`);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    currentResponse = data;
    
    const rooms = (data.content || []).map(normalizeListingFromBackend);
    displayRooms(rooms);
    updatePagination(data);
}

// Update pagination controls based on backend response
function updatePagination(pageData) {
    const totalPages = pageData.totalPages || 0;
    const currentPage = pageData.number || 0;
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }
    
    let html = '<nav class="flex items-center space-x-1">';
    
    // Previous button
    html += `<button onclick="goToPage(${currentPage - 1})" 
             ${currentPage === 0 ? 'disabled' : ''} 
             class="px-3 py-2 ${currentPage === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-md">
                <i data-feather="chevron-left" class="w-4 h-4"></i>
             </button>`;
    
    // Page numbers with ellipsis logic
    const maxVisible = 5;
    let startPage = Math.max(0, currentPage - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    // First page
    if (startPage > 0) {
        html += `<button onclick="goToPage(0)" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">1</button>`;
        if (startPage > 1) {
            html += '<span class="px-3 py-2 text-gray-500">...</span>';
        }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPage;
        html += `<button onclick="goToPage(${i})" 
                 class="px-4 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'} rounded-md">
                    ${i + 1}
                 </button>`;
    }
    
    // Last page
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += '<span class="px-3 py-2 text-gray-500">...</span>';
        }
        html += `<button onclick="goToPage(${totalPages - 1})" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button onclick="goToPage(${currentPage + 1})" 
             ${currentPage >= totalPages - 1 ? 'disabled' : ''} 
             class="px-3 py-2 ${currentPage >= totalPages - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-md">
                <i data-feather="chevron-right" class="w-4 h-4"></i>
             </button>`;
    
    html += '</nav>';
    paginationContainer.innerHTML = html;
    
    // Re-initialize feather icons for the new buttons
    feather.replace();
}

// Navigate to a specific page
async function goToPage(page) {
    currentFilters.page = page;
    showLoading();
    try {
        await loadRoomsFromBackend();
        updateResultsCount();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        console.error('Page navigation failed:', e);
    } finally {
        hideLoading();
    }
}

// Convert backend BaiDangChoThue -> UI room object
function normalizeListingFromBackend(item) {
    const id = item.id;
    const title = item.tieu_de || 'Tin cho thuê';
    const price = typeof item.gia_thang === 'number' ? item.gia_thang : 0;
    const area = typeof item.dien_tich_m2 === 'number' ? item.dien_tich_m2 : 0;
    const address = item.dia_chi_day_du || [item.phuong_xa, item.tinh_thanhpho].filter(Boolean).join(', ');
    const images = extractImageUrls(item.hinhAnhPhongTro || item.HinhAnhPhongTro || []);
    const posted = item.ngay_dang || item.ngay_cap_nhat || new Date().toISOString();
    const featured = (item.hinhAnhPhongTro || item.HinhAnhPhongTro || []).some(i => i.laAnhBia);

    return {
        id,
        title,
        price,
        area,
        city: slugify(item.tinh_thanhpho),
        district: slugify(item.phuong_xa),
        address,
        type: 'room',
        amenities: [],
        images: images.length ? images : [
            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23f3f4f6"/><text x="320" y="180" font-family="Arial" font-size="16" fill="%23666" text-anchor="middle">Chưa có hình ảnh</text></svg>'
        ],
        description: item.mo_ta || '',
        featured,
        posted
    };
}

// Extract image URLs from child entities or string field
function extractImageUrls(arr) {
    try {
        const urls = [];
        (arr || []).forEach(img => {
            if (!img) return;
            const raw = img.duong_dan_anh || img.url || img.path || '';
            if (!raw) return;
            if (Array.isArray(raw)) {
                raw.forEach(u => { if (typeof u === 'string') urls.push(processImageUrl(u)); });
            } else if (typeof raw === 'string') {
                const trimmed = raw.trim();
                if (trimmed.startsWith('[')) {
                    // JSON-style array string
                    try {
                        const parsed = JSON.parse(trimmed);
                        if (Array.isArray(parsed)) parsed.forEach(u => { if (typeof u === 'string') urls.push(processImageUrl(u)); });
                    } catch (_) {
                        // fall back to comma split
                        trimmed.split(',').map(s => s.trim()).forEach(u => { if (u) urls.push(processImageUrl(u)); });
                    }
                } else if (trimmed.includes(',')) {
                    trimmed.split(',').map(s => s.trim()).forEach(u => { if (u) urls.push(processImageUrl(u)); });
                } else {
                    urls.push(processImageUrl(trimmed));
                }
            }
        });
        return urls;
    } catch (e) {
        console.warn('extractImageUrls failed:', e);
        return [];
    }
}

// Process image URL to handle relative paths
function processImageUrl(url) {
    if (!url) return '';
    // If it's already a full URL (http/https), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // If it's a data URI, return as is
    if (url.startsWith('data:')) {
        return url;
    }
    // If it starts with /uploads, add API_BASE
    if (url.startsWith('/uploads') || url.startsWith('uploads')) {
        const cleanUrl = url.startsWith('/') ? url : '/' + url;
        return `${API_BASE}${cleanUrl}`;
    }
    // Otherwise assume it's a relative path and add API_BASE
    return `${API_BASE}/${url}`;
}

function slugify(val) {
    if (!val || typeof val !== 'string') return '';
    return val
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    document.getElementById('mobile-menu-button').addEventListener('click', function() {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    });

    // City change listener
    document.getElementById('filterCity').addEventListener('change', function() {
        updateDistricts(this.value);
    });

    // Search input listener
    document.getElementById('searchKeyword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Quick filter listeners
    document.getElementById('quickCity').addEventListener('change', performSearch);
    document.getElementById('quickPrice').addEventListener('change', performSearch);

    // Filter change listeners
    const filterInputs = document.querySelectorAll('#filterSidebar input, #filterSidebar select');
    filterInputs.forEach(input => {
        input.addEventListener('change', function() {
            if (this.type === 'range') return; // Handle range separately
            applyFilters();
        });
    });
}

// Initialize view buttons state
function initializeViewButtons() {
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    if (currentView === 'list') {
        listBtn.classList.add('bg-blue-600', 'text-white');
        listBtn.classList.remove('text-gray-600');
        gridBtn.classList.remove('bg-blue-600', 'text-white');
        gridBtn.classList.add('text-gray-600');
    } else {
        gridBtn.classList.add('bg-blue-600', 'text-white');
        gridBtn.classList.remove('text-gray-600');
        listBtn.classList.remove('bg-blue-600', 'text-white');
        listBtn.classList.add('text-gray-600');
    }
}

// Update districts based on selected city
function updateDistricts(cityCode) {
    const districtSelect = document.getElementById('filterDistrict');
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
    districtSelect.disabled = !cityCode;

    if (cityCode && districtData[cityCode]) {
        districtData[cityCode].forEach(districtCode => {
            const option = document.createElement('option');
            option.value = districtCode;
            option.textContent = formatDistrictName(districtCode);
            districtSelect.appendChild(option);
        });
        districtSelect.disabled = false;
    }
}

// Format district name
function formatDistrictName(districtCode) {
    return districtCode.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Update price display
function updatePriceDisplay(value) {
    const priceDisplay = document.getElementById('priceDisplay');
    if (value >= 20) {
        priceDisplay.textContent = 'Tất cả mức giá';
    } else {
        priceDisplay.textContent = `Dưới ${value} triệu`;
    }
    applyFilters();
}

// Perform search
async function performSearch() {
    const keyword = document.getElementById('searchKeyword').value.trim();
    const quickCity = document.getElementById('quickCity').value;
    const quickPrice = document.getElementById('quickPrice').value;

    // Show loading
    showLoading();

    // Update filters
    currentFilters.keyword = keyword || '';
    currentFilters.tinhThanhpho = quickCity || '';
    currentFilters.page = 0; // Reset to first page
    
    // Parse price range
    if (quickPrice) {
        const [min, max] = quickPrice.split('-').map(p => p === '+' ? null : parseInt(p) * 1000000);
        currentFilters.giaMin = min;
        currentFilters.giaMax = max || null;
    } else {
        currentFilters.giaMin = null;
        currentFilters.giaMax = null;
    }

    try {
        await loadRoomsFromBackend();
        updateResultsCount();
        updateSearchSummary(keyword, quickCity, quickPrice);
    } catch (e) {
        console.error('Search failed:', e);
        displayNoResults();
    } finally {
        hideLoading();
    }
}

// Apply filters
async function applyFilters() {
    showLoading();

    // Gather all filter values
    const keyword = document.getElementById('searchKeyword').value.trim();
    const city = document.getElementById('filterCity').value;
    const district = document.getElementById('filterDistrict').value;
    const priceRange = parseFloat(document.getElementById('priceRange').value);

    // Update currentFilters
    currentFilters.keyword = keyword || '';
    currentFilters.tinhThanhpho = city || '';
    currentFilters.phuongXa = district || '';
    currentFilters.page = 0; // Reset to first page
    
    // Price filter (priceRange slider is in millions)
    if (priceRange < 20) {
        currentFilters.giaMin = null;
        currentFilters.giaMax = priceRange * 1000000;
    } else {
        currentFilters.giaMin = null;
        currentFilters.giaMax = null;
    }

    try {
        await loadRoomsFromBackend();
        updateResultsCount();
    } catch (e) {
        console.error('Apply filters failed:', e);
        displayNoResults();
    } finally {
        hideLoading();
    }
}

// Filter by price range
function filterByPriceRange(rooms, priceRange) {
    const [min, max] = priceRange.split('-').map(p => p === '+' ? Infinity : parseInt(p));
    return rooms.filter(room => {
        const price = room.price / 1000000; // Convert to millions
        if (max === undefined || max === Infinity) {
            return price >= min;
        }
        return price >= min && price <= max;
    });
}

// Filter by area
function filterByArea(rooms, areaRange) {
    if (areaRange === '50+') {
        return rooms.filter(room => room.area >= 50);
    }
    const [min, max] = areaRange.split('-').map(Number);
    return rooms.filter(room => room.area >= min && room.area <= max);
}

// Clear filters
function clearFilters() {
    // Clear all form inputs
    document.getElementById('searchKeyword').value = '';
    document.getElementById('quickCity').value = '';
    document.getElementById('quickPrice').value = '';
    document.getElementById('filterCity').value = '';
    document.getElementById('filterDistrict').value = '';
    document.getElementById('filterDistrict').disabled = true;
    document.getElementById('priceRange').value = 20;
    document.getElementById('priceDisplay').textContent = 'Tất cả mức giá';

    // Clear checkboxes and radio buttons
    document.querySelectorAll('#filterSidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelectorAll('#filterSidebar input[type="radio"]').forEach(rb => rb.checked = false);

    // Reset results
    filteredRooms = [...allRooms];
    displayRooms(filteredRooms);
    updateResultsCount(filteredRooms.length);
    updateSearchSummary('', '', '');
}

// Display rooms
function displayRooms(rooms) {
    if (currentView === 'grid') {
        displayGridView(rooms);
    } else {
        displayListView(rooms);
    }
}

// Display grid view
function displayGridView(rooms) {
    const grid = document.getElementById('resultsGrid');
    const list = document.getElementById('resultsList');
    const noResults = document.getElementById('noResults');

    list.classList.add('hidden');
    
    if (rooms.length === 0) {
        grid.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');
    grid.classList.remove('hidden');

    // No client-side pagination - backend handles it
    grid.innerHTML = rooms.map(room => `
        <div class="room-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer flex flex-col h-full" onclick="goToDetail(${room.id})">
            <div class="relative">
                <img src="${room.images[0]}" alt="${room.title}" class="w-full h-48 object-cover">
                ${room.featured ? '<div class="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded text-sm font-medium">Nổi bật</div>' : ''}
                <div class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md">
                    <i data-feather="heart" class="text-gray-400 hover:text-red-500 w-4 h-4 cursor-pointer"></i>
                </div>
            </div>
            <div class="p-4 flex flex-col flex-grow">
                <h3 class="font-bold text-lg mb-2">${room.title}</h3>
                <div class="text-lg font-bold text-blue-600 mb-2">${formatPrice(room.price)}/tháng</div>
                <p class="text-gray-600 mb-3 flex items-center">
                    <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                    ${room.address}
                </p>
                <div class="flex items-center mb-3 text-sm text-gray-600">
                    <span class="flex items-center mr-4">
                        <i data-feather="maximize" class="w-4 h-4 mr-1"></i>
                        ${room.area}m²
                    </span>
                    <span class="flex items-center">
                        <i data-feather="home" class="w-4 h-4 mr-1"></i>
                        ${getTypeLabel(room.type)}
                    </span>
                </div>
                <div class="flex flex-wrap gap-2 mb-4">
                    ${room.amenities.slice(0, 3).map(amenity => `
                        <span class="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                            <i data-feather="${getAmenityIcon(amenity)}" class="w-4 h-4 mr-1"></i>
                            ${getAmenityLabel(amenity)}
                        </span>
                    `).join('')}
                    ${room.amenities.length > 3 ? `<span class="bg-gray-100 px-2 py-1 rounded text-sm">+${room.amenities.length - 3}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Display list view
function displayListView(rooms) {
    const grid = document.getElementById('resultsGrid');
    const list = document.getElementById('resultsList');
    const noResults = document.getElementById('noResults');

    grid.classList.add('hidden');
    
    if (rooms.length === 0) {
        list.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');
    list.classList.remove('hidden');

    // No client-side pagination - backend handles it
    list.innerHTML = rooms.map(room => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer" onclick="goToDetail(${room.id})">
            <div class="flex">
                <div class="w-1/3 relative">
                    <img src="${room.images[0]}" alt="${room.title}" class="w-full h-full object-cover">
                    ${room.featured ? '<div class="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">Nổi bật</div>' : ''}
                </div>
                <div class="w-2/3 p-4 flex flex-col justify-between">
                    <div>
                        <h3 class="font-bold text-lg mb-2">${room.title}</h3>
                        <div class="text-lg font-bold text-blue-600 mb-2">${formatPrice(room.price)}/tháng</div>
                        <p class="text-gray-600 mb-2 flex items-center">
                            <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                            ${room.address}
                        </p>
                        <div class="flex items-center mb-2 text-sm text-gray-600">
                            <span class="flex items-center mr-4">
                                <i data-feather="maximize" class="w-4 h-4 mr-1"></i>
                                ${room.area}m²
                            </span>
                            <span class="flex items-center">
                                <i data-feather="home" class="w-4 h-4 mr-1"></i>
                                ${getTypeLabel(room.type)}
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="flex flex-wrap gap-1">
                            ${room.amenities.slice(0, 4).map(amenity => `
                                <span class="bg-gray-100 px-2 py-1 rounded text-xs">
                                    ${getAmenityLabel(amenity)}
                                </span>
                            `).join('')}
                        </div>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded text-sm transition">
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Sort results - updates sorting and reloads from backend
async function sortResults() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'newest':
            currentFilters.sortBy = 'id';
            currentFilters.sortDirection = 'desc';
            break;
        case 'price-asc':
            currentFilters.sortBy = 'gia_thang';
            currentFilters.sortDirection = 'asc';
            break;
        case 'price-desc':
            currentFilters.sortBy = 'gia_thang';
            currentFilters.sortDirection = 'desc';
            break;
        case 'area-desc':
            currentFilters.sortBy = 'dien_tich_m2';
            currentFilters.sortDirection = 'desc';
            break;
        case 'popular':
            // Backend doesn't have a popularity field, fallback to newest
            currentFilters.sortBy = 'id';
            currentFilters.sortDirection = 'desc';
            break;
    }
    
    currentFilters.page = 0; // Reset to first page
    showLoading();
    try {
        await loadRoomsFromBackend();
        updateResultsCount();
    } catch (e) {
        console.error('Sort failed:', e);
    } finally {
        hideLoading();
    }
}

// Display no results message
function displayNoResults() {
    const container = document.getElementById('roomsContainer');
    container.innerHTML = `
        <div class="col-span-full text-center py-12">
            <i data-feather="search" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-700 mb-2">Không tìm thấy kết quả</h3>
            <p class="text-gray-500">Vui lòng thử lại với bộ lọc khác</p>
        </div>
    `;
    feather.replace();
    updateResultsCount();
}

// Change view
function changeView(view) {
    currentView = view;
    const gridBtn = document.getElementById('gridView');
    const listBtn = document.getElementById('listView');
    
    if (view === 'grid') {
        gridBtn.classList.add('bg-blue-600', 'text-white');
        gridBtn.classList.remove('text-gray-600');
        listBtn.classList.remove('bg-blue-600', 'text-white');
        listBtn.classList.add('text-gray-600');
    } else {
        listBtn.classList.add('bg-blue-600', 'text-white');
        listBtn.classList.remove('text-gray-600');
        gridBtn.classList.remove('bg-blue-600', 'text-white');
        gridBtn.classList.add('text-gray-600');
    }
    
    displayRooms(filteredRooms);
}

// Filter sidebar functions
function openFilterSidebar() {
    document.getElementById('filterSidebar').classList.remove('mobile-hidden');
    document.getElementById('filterOverlay').classList.add('active');
}

function closeFilterSidebar() {
    document.getElementById('filterSidebar').classList.add('mobile-hidden');
    document.getElementById('filterOverlay').classList.remove('active');
}

// Loading state
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('resultsGrid').classList.add('hidden');
    document.getElementById('resultsList').classList.add('hidden');
    document.getElementById('noResults').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

// Update results count
function updateResultsCount() {
    const count = currentResponse?.totalElements || 0;
    document.getElementById('resultsCount').textContent = count.toLocaleString();
}

// Update search summary
function updateSearchSummary(keyword, city, price) {
    let summary = [];
    
    if (keyword) summary.push(`"${keyword}"`);
    if (city) summary.push(cityNames[city] || city);
    if (price) {
        const priceLabel = price === '10+' ? 'Trên 10 triệu' : 
                            price.includes('-') ? `${price.split('-').join(' - ')} triệu` : 
                            `Dưới ${price} triệu`;
        summary.push(priceLabel);
    }
    
    if (summary.length === 0) {
        summary = ['Tất cả khu vực', 'Tất cả mức giá'];
    }
    
    document.getElementById('searchSummary').textContent = summary.join(' • ');
}

// Go to detail page
function goToDetail(roomId) {
    window.location.href = `detail.html?id=${roomId}`;
}

// Utility functions
function formatPrice(price) {
    if (price >= 1000000) {
        return (price / 1000000).toFixed(1).replace('.0', '') + ' tr';
    }
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

function getTypeLabel(type) {
    const types = {
        'room': 'Phòng trọ',
        'apartment': 'Chung cư mini',
        'house': 'Nhà nguyên căn',
        'shared': 'Ở ghép',
        'studio': 'Studio'
    };
    return types[type] || type;
}

function getAmenityLabel(amenity) {
    const amenities = {
        'wifi': 'WiFi',
        'ac': 'Điều hòa',
        'parking': 'Chỗ xe',
        'kitchen': 'Bếp',
        'laundry': 'Máy giặt',
        'security': 'An ninh'
    };
    return amenities[amenity] || amenity;
}

function getAmenityIcon(amenity) {
    const icons = {
        'wifi': 'wifi',
        'ac': 'wind',
        'parking': 'truck',
        'kitchen': 'home',
        'laundry': 'droplet',
        'security': 'shield'
    };
    return icons[amenity] || 'check';
}

// Handle URL parameters (for direct links from homepage)
function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const location = urlParams.get('location');
    const price = urlParams.get('price');
    const keyword = urlParams.get('q');

    if (keyword) {
        document.getElementById('searchKeyword').value = keyword;
    }
    if (location) {
        document.getElementById('quickCity').value = location;
    }
    if (price) {
        document.getElementById('quickPrice').value = price;
    }

    if (keyword || location || price) {
        performSearch();
    }
}

// Initialize URL parameters on page load
document.addEventListener('DOMContentLoaded', function() {
    handleUrlParameters();
});

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Save search to localStorage (for user preferences)
function saveSearchPreferences() {
    const preferences = {
        city: document.getElementById('filterCity').value,
        priceRange: document.getElementById('priceRange').value,
        roomTypes: Array.from(document.querySelectorAll('input[name="roomType"]:checked')).map(cb => cb.value),
        amenities: Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value)
    };
    localStorage.setItem('searchPreferences', JSON.stringify(preferences));
}

// Load search preferences
function loadSearchPreferences() {
    try {
        const preferences = JSON.parse(localStorage.getItem('searchPreferences') || '{}');
        
        if (preferences.city) {
            document.getElementById('filterCity').value = preferences.city;
            updateDistricts(preferences.city);
        }
        
        if (preferences.priceRange) {
            document.getElementById('priceRange').value = preferences.priceRange;
            updatePriceDisplay(preferences.priceRange);
        }
        
        if (preferences.roomTypes) {
            preferences.roomTypes.forEach(type => {
                const checkbox = document.querySelector(`input[name="roomType"][value="${type}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
        
        if (preferences.amenities) {
            preferences.amenities.forEach(amenity => {
                const checkbox = document.querySelector(`input[name="amenities"][value="${amenity}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }
    } catch (e) {
        console.log('Error loading preferences:', e);
    }
}

// Auto-save preferences when filters change
document.addEventListener('change', function(e) {
    if (e.target.closest('#filterSidebar')) {
        setTimeout(saveSearchPreferences, 500); // Debounce
    }
});

// Load preferences on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSearchPreferences();
});

// Share functionality
function shareSearch() {
    const url = new URL(window.location);
    const keyword = document.getElementById('searchKeyword').value;
    const city = document.getElementById('quickCity').value;
    const price = document.getElementById('quickPrice').value;

    if (keyword) url.searchParams.set('q', keyword);
    if (city) url.searchParams.set('location', city);
    if (price) url.searchParams.set('price', price);

    if (navigator.share) {
        navigator.share({
            title: 'Tìm phòng trọ - Phòng Trọ 24/7',
            url: url.toString()
        });
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(url.toString()).then(() => {
            alert('Đã copy link tìm kiếm vào clipboard');
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key to close filter sidebar on mobile
    if (e.key === 'Escape') {
        closeFilterSidebar();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchKeyword').focus();
    }
});

// Lazy loading for images (if implementing infinite scroll)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Error handling for failed image loads
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle">Hình ảnh không khả dụng</text></svg>';
    }
}, true);

// Analytics tracking (placeholder)
function trackSearch(keyword, filters) {
    // Here you would typically send analytics data
    console.log('Search tracked:', { keyword, filters });
}

// Performance monitoring
function measureSearchPerformance() {
    const start = performance.now();
    return function() {
        const end = performance.now();
        console.log(`Search took ${end - start} milliseconds`);
    };
}

// Responsive design helper
function handleResize() {
    const isMobile = window.innerWidth < 1024;
    if (!isMobile) {
        // Automatically close mobile filter sidebar on desktop
        closeFilterSidebar();
    }
}

window.addEventListener('resize', handleResize);

// Service Worker registration (for offline functionality)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// PWA install prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button or banner
});

// Geolocation for nearby search (optional feature)
function searchNearby() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            // Use coordinates to find nearby rooms
            console.log('User location:', { lat, lng });
        }, function(error) {
            console.log('Geolocation error:', error);
        });
    }
}
