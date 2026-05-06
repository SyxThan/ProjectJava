// Backend API base
const API_BASE = 'http://localhost:8080';
const ITEMS_PER_PAGE = 20;

// Data stores
let currentPage = 0;
let currentSize = ITEMS_PER_PAGE;
let currentResponse = null;
let currentView = 'grid';
let userId = null;

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize AOS and Feather Icons
    AOS.init({
        duration: 600,
        easing: 'ease-in-out',
        once: true
    });
    feather.replace();

    // Check if user is logged in
    userId = getUserId();
    
    console.log('Favorites page - User ID:', userId);
    console.log('localStorage user_id:', localStorage.getItem('user_id'));
    console.log('localStorage user:', localStorage.getItem('user'));
    
    if (!userId) {
        console.warn('User not logged in - showing login required state');
        showLoginRequired();
        return;
    }

    // Initialize view buttons state
    initializeViewButtons();

    // Load liked rooms from backend
    showLoading();
    try {
        await loadLikedRooms();
    } catch (e) {
        console.error('Failed to load liked rooms:', e);
        displayEmptyState();
    } finally {
        hideLoading();
    }
});

// Get user ID from localStorage (assuming it's stored after login)
function getUserId() {
    // Try to get user_id from localStorage (stored during login)
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
        return parseInt(storedUserId);
    }
    
    // Fallback: try to get from user object
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user && user.id) {
                return parseInt(user.id);
            }
        } catch (e) {
            console.error('Error parsing user object:', e);
        }
    }
    
    // If not found, user needs to login
    return null;
}

// Fetch liked rooms from backend
async function loadLikedRooms() {
    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('size', currentSize);
    
    const resp = await fetch(`${API_BASE}/api/usertracking/liked/${userId}?${params.toString()}`);
    if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    
    if (!data.success) {
        throw new Error(data.message || 'Có lỗi xảy ra');
    }
    
    currentResponse = data;
    
    const rooms = (data.data || []).map(normalizeListingFromBackend);
    
    if (rooms.length === 0) {
        displayEmptyState();
    } else {
        displayRooms(rooms);
        updatePagination(data.pagination);
    }
    
    updateResultsCount();
}

// Convert backend BaiDangOutputDTO -> UI room object
function normalizeListingFromBackend(item) {
    const id = item.id;
    const title = item.tieuDe || 'Tin cho thuê';
    const price = typeof item.giaThang === 'number' ? item.giaThang : 0;
    const area = typeof item.dienTichM2 === 'number' ? item.dienTichM2 : 0;
    const address = item.diaChiDayDu || [item.phuongXa, item.tinhThanhpho].filter(Boolean).join(', ');
    const image = item.anhBia || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="%23f3f4f6"/><text x="320" y="180" font-family="Arial" font-size="16" fill="%23666" text-anchor="middle">Chưa có hình ảnh</text></svg>';
    const posted = item.ngayDang || new Date().toISOString();

    return {
        id,
        title,
        price,
        area,
        address,
        images: [processImageUrl(image)],
        posted
    };
}

// Process image URL to handle relative paths
function processImageUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    if (url.startsWith('data:')) {
        return url;
    }
    if (url.startsWith('/uploads') || url.startsWith('uploads')) {
        const cleanUrl = url.startsWith('/') ? url : '/' + url;
        return `${API_BASE}${cleanUrl}`;
    }
    return `${API_BASE}/${url}`;
}

// Update pagination controls
function updatePagination(pagination) {
    const totalPages = pagination?.totalPages || 0;
    const currentPageNum = pagination?.currentPage || 0;
    const hasNext = pagination?.hasNext || false;
    const hasPrevious = pagination?.hasPrevious || false;
    
    const paginationContainer = document.getElementById('pagination');
    
    if (!paginationContainer || totalPages <= 1) {
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
        return;
    }
    
    let html = '<nav class="flex items-center space-x-1">';
    
    // Previous button
    html += `<button onclick="goToPage(${currentPageNum - 1})" 
             ${!hasPrevious ? 'disabled' : ''} 
             class="px-3 py-2 ${!hasPrevious ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-md">
                <i data-feather="chevron-left" class="w-4 h-4"></i>
             </button>`;
    
    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(0, currentPageNum - 2);
    let endPage = Math.min(totalPages - 1, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
        startPage = Math.max(0, endPage - maxVisible + 1);
    }
    
    if (startPage > 0) {
        html += `<button onclick="goToPage(0)" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">1</button>`;
        if (startPage > 1) {
            html += '<span class="px-3 py-2 text-gray-500">...</span>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === currentPageNum;
        html += `<button onclick="goToPage(${i})" 
                 class="px-4 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'} rounded-md">
                    ${i + 1}
                 </button>`;
    }
    
    if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
            html += '<span class="px-3 py-2 text-gray-500">...</span>';
        }
        html += `<button onclick="goToPage(${totalPages - 1})" class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">${totalPages}</button>`;
    }
    
    // Next button
    html += `<button onclick="goToPage(${currentPageNum + 1})" 
             ${!hasNext ? 'disabled' : ''} 
             class="px-3 py-2 ${!hasNext ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'} rounded-md">
                <i data-feather="chevron-right" class="w-4 h-4"></i>
             </button>`;
    
    html += '</nav>';
    paginationContainer.innerHTML = html;
    
    feather.replace();
}

// Navigate to a specific page
async function goToPage(page) {
    currentPage = page;
    showLoading();
    try {
        await loadLikedRooms();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
        console.error('Page navigation failed:', e);
    } finally {
        hideLoading();
    }
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
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');

    list.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    grid.classList.remove('hidden');

    grid.innerHTML = rooms.map(room => `
        <div class="room-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition flex flex-col h-full">
            <div class="relative cursor-pointer" onclick="goToDetail(${room.id})">
                <img src="${room.images[0]}" alt="${room.title}" class="w-full h-56 object-cover">
                <button onclick="event.stopPropagation(); removeFavorite(${room.id})" 
                        class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition group">
                    <i data-feather="heart" class="w-5 h-5 text-red-500 fill-current"></i>
                </button>
            </div>
            <div class="p-4 flex flex-col flex-grow cursor-pointer" onclick="goToDetail(${room.id})">
                <h3 class="font-bold text-lg mb-2 line-clamp-2">${room.title}</h3>
                <div class="text-lg font-bold text-blue-600 mb-2">${formatPrice(room.price)}/tháng</div>
                <p class="text-gray-600 mb-3 flex items-center">
                    <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                    ${room.address}
                </p>
                <div class="flex items-center text-sm text-gray-600 mt-auto">
                    <span class="flex items-center">
                        <i data-feather="maximize" class="w-4 h-4 mr-1"></i>
                        ${room.area}m²
                    </span>
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
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');

    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.add('hidden');
    list.classList.remove('hidden');

    list.innerHTML = rooms.map(room => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
            <div class="flex">
                <div class="w-1/3 relative cursor-pointer" onclick="goToDetail(${room.id})">
                    <img src="${room.images[0]}" alt="${room.title}" class="w-full h-full object-cover">
                    <button onclick="event.stopPropagation(); removeFavorite(${room.id})" 
                            class="absolute top-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-red-50 transition">
                        <i data-feather="heart" class="w-5 h-5 text-red-500 fill-current"></i>
                    </button>
                </div>
                <div class="w-2/3 p-4 flex flex-col justify-between">
                    <div class="cursor-pointer" onclick="goToDetail(${room.id})">
                        <h3 class="font-bold text-lg mb-2">${room.title}</h3>
                        <div class="text-lg font-bold text-blue-600 mb-2">${formatPrice(room.price)}/tháng</div>
                        <p class="text-gray-600 mb-2 flex items-center">
                            <i data-feather="map-pin" class="w-4 h-4 mr-1"></i>
                            ${room.address}
                        </p>
                        <div class="flex items-center text-sm text-gray-600">
                            <span class="flex items-center">
                                <i data-feather="maximize" class="w-4 h-4 mr-1"></i>
                                ${room.area}m²
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mt-4">
                        <button onclick="goToDetail(${room.id})" class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded text-sm transition">
                            Xem chi tiết
                        </button>
                        <button onclick="removeFavorite(${room.id})" class="text-red-500 hover:text-red-700 font-medium text-sm transition">
                            <i data-feather="trash-2" class="w-4 h-4 inline mr-1"></i>
                            Xóa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    feather.replace();
}

// Remove favorite
async function removeFavorite(roomId) {
    if (!confirm('Bạn có chắc muốn xóa phòng này khỏi danh sách yêu thích?')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const resp = await fetch(`${API_BASE}/api/usertracking/deletelove/${userId}/${roomId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!resp.ok) {
            throw new Error(`HTTP ${resp.status}`);
        }
        
        const result = await resp.json();
        
        if (result.success) {
            // Reload the list
            showLoading();
            await loadLikedRooms();
            hideLoading();
        } else {
            alert('Có lỗi xảy ra khi xóa phòng yêu thích');
        }
    } catch (e) {
        console.error('Failed to remove favorite:', e);
        alert('Có lỗi xảy ra khi xóa phòng yêu thích');
    }
}

// Sort results
async function sortResults() {
    const sortBy = document.getElementById('sortBy').value;
    
    // Note: Backend returns data ordered by liked date (newest first)
    // We'll do client-side sorting for now
    if (currentResponse && currentResponse.data) {
        let rooms = currentResponse.data.map(normalizeListingFromBackend);
        
        switch(sortBy) {
            case 'price-asc':
                rooms.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                rooms.sort((a, b) => b.price - a.price);
                break;
            case 'area-desc':
                rooms.sort((a, b) => b.area - a.area);
                break;
            case 'newest':
            default:
                // Already sorted by backend
                break;
        }
        
        displayRooms(rooms);
    }
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
    
    // Re-render current rooms with new view
    if (currentResponse && currentResponse.data) {
        const rooms = currentResponse.data.map(normalizeListingFromBackend);
        displayRooms(rooms);
    }
}

// Loading state
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('resultsGrid').classList.add('hidden');
    document.getElementById('resultsList').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('loginRequired').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

// Update results count
function updateResultsCount() {
    const count = currentResponse?.pagination?.totalItems || 0;
    document.getElementById('resultsCount').textContent = count;
}

// Display empty state
function displayEmptyState() {
    const grid = document.getElementById('resultsGrid');
    const list = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');
    
    grid.classList.add('hidden');
    list.classList.add('hidden');
    loginRequired.classList.add('hidden');
    emptyState.classList.remove('hidden');
    
    updateResultsCount();
}

// Show login required state
function showLoginRequired() {
    const grid = document.getElementById('resultsGrid');
    const list = document.getElementById('resultsList');
    const emptyState = document.getElementById('emptyState');
    const loginRequired = document.getElementById('loginRequired');
    
    grid.classList.add('hidden');
    list.classList.add('hidden');
    emptyState.classList.add('hidden');
    loginRequired.classList.remove('hidden');
    
    document.getElementById('resultsCount').textContent = '0';
    
    // Log debug info
    console.log('=== LOGIN DEBUG INFO ===');
    console.log('user_id in localStorage:', localStorage.getItem('user_id'));
    console.log('user in localStorage:', localStorage.getItem('user'));
    console.log('token in localStorage:', localStorage.getItem('token'));
    console.log('========================');
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

// Error handling for failed image loads
document.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23f3f4f6"/><text x="150" y="100" font-family="Arial" font-size="14" fill="%23666" text-anchor="middle">Hình ảnh không khả dụng</text></svg>';
    }
}, true);
