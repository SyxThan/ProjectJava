// Sample room data
let allRooms = [
    {
        id: 1,
        title: "Phòng trọ cao cấp Quận 1",
        price: 3500000,
        area: 25,
        city: "ho-chi-minh",
        district: "quan-1",
        address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
        type: "room",
        amenities: ["wifi", "ac", "parking"],
        images: ["http://static.photos/indoor/640x360/1"],
        description: "Phòng trọ cao cấp, full nội thất, gần trung tâm",
        featured: true,
        posted: new Date("2024-01-15")
    },
    {
        id: 2,
        title: "Chung cư mini Bình Thạnh",
        price: 4200000,
        area: 35,
        city: "ho-chi-minh",
        district: "binh-thanh",
        address: "45 Điện Biên Phủ, Bình Thạnh, TP.HCM",
        type: "apartment",
        amenities: ["wifi", "ac", "kitchen", "parking", "laundry"],
        images: ["http://static.photos/indoor/640x360/2"],
        description: "Chung cư mini mới xây, đầy đủ tiện nghi",
        featured: false,
        posted: new Date("2024-01-18")
    },
    {
        id: 3,
        title: "Nhà trọ Gò Vấp giá rẻ",
        price: 2800000,
        area: 20,
        city: "ho-chi-minh",
        district: "go-vap",
        address: "78 Quang Trung, Gò Vấp, TP.HCM",
        type: "room",
        amenities: ["wifi", "parking"],
        images: ["http://static.photos/indoor/640x360/3"],
        description: "Phòng trọ sạch sẽ, an ninh tốt",
        featured: false,
        posted: new Date("2024-01-19")
    },
    {
        id: 4,
        title: "Studio cao cấp Quận 7",
        price: 8000000,
        area: 30,
        city: "ho-chi-minh",
        district: "quan-7",
        address: "123 Nguyễn Thị Thập, Quận 7, TP.HCM",
        type: "studio",
        amenities: ["wifi", "ac", "kitchen", "parking", "security"],
        images: ["http://static.photos/indoor/640x360/4"],
        description: "Studio hiện đại, view đẹp",
        featured: true,
        posted: new Date("2024-01-16")
    },
    {
        id: 5,
        title: "Phòng trọ sinh viên Đống Đa",
        price: 1800000,
        area: 18,
        city: "ha-noi",
        district: "dong-da",
        address: "56 Thái Thịnh, Đống Đa, Hà Nội",
        type: "room",
        amenities: ["wifi"],
        images: ["http://static.photos/indoor/640x360/5"],
        description: "Phòng trọ dành cho sinh viên",
        featured: false,
        posted: new Date("2024-01-20")
    },
    {
        id: 6,
        title: "Căn hộ Ba Đình",
        price: 6500000,
        area: 45,
        city: "ha-noi",
        district: "ba-dinh",
        address: "89 Đội Cấn, Ba Đình, Hà Nội",
        type: "apartment",
        amenities: ["wifi", "ac", "kitchen", "parking", "laundry", "security"],
        images: ["http://static.photos/indoor/640x360/6"],
        description: "Căn hộ đẹp, gần trung tâm",
        featured: true,
        posted: new Date("2024-01-17")
    }
];

let filteredRooms = [...allRooms];
let currentView = 'list';
let currentPage = 1;
const itemsPerPage = 9;

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
document.addEventListener('DOMContentLoaded', function() {
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
    
    // Initial room display
    displayRooms(allRooms);
    updateResultsCount(allRooms.length);
});

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
function performSearch() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const quickCity = document.getElementById('quickCity').value;
    const quickPrice = document.getElementById('quickPrice').value;

    // Show loading
    showLoading();

    // Simulate API delay
    setTimeout(() => {
        let results = [...allRooms];

        // Filter by keyword
        if (keyword) {
            results = results.filter(room => 
                room.title.toLowerCase().includes(keyword) ||
                room.address.toLowerCase().includes(keyword) ||
                room.description.toLowerCase().includes(keyword)
            );
        }

        // Filter by quick city
        if (quickCity) {
            results = results.filter(room => room.city === quickCity);
        }

        // Filter by quick price
        if (quickPrice) {
            results = filterByPriceRange(results, quickPrice);
        }

        filteredRooms = results;
        displayRooms(filteredRooms);
        updateResultsCount(filteredRooms.length);
        updateSearchSummary(keyword, quickCity, quickPrice);
        hideLoading();
    }, 800);
}

// Apply filters
function applyFilters() {
    showLoading();

    setTimeout(() => {
        let results = [...allRooms];

        // Apply all filters
        const keyword = document.getElementById('searchKeyword').value.toLowerCase();
        const city = document.getElementById('filterCity').value;
        const district = document.getElementById('filterDistrict').value;
        const priceRange = document.getElementById('priceRange').value;
        const roomTypes = Array.from(document.querySelectorAll('input[name="roomType"]:checked')).map(cb => cb.value);
        const area = document.querySelector('input[name="area"]:checked')?.value;
        const amenities = Array.from(document.querySelectorAll('input[name="amenities"]:checked')).map(cb => cb.value);

        // Filter by keyword
        if (keyword) {
            results = results.filter(room => 
                room.title.toLowerCase().includes(keyword) ||
                room.address.toLowerCase().includes(keyword) ||
                room.description.toLowerCase().includes(keyword)
            );
        }

        // Filter by city
        if (city) {
            results = results.filter(room => room.city === city);
        }

        // Filter by district
        if (district) {
            results = results.filter(room => room.district === district);
        }

        // Filter by price
        if (priceRange < 20) {
            results = results.filter(room => room.price <= priceRange * 1000000);
        }

        // Filter by room type
        if (roomTypes.length > 0) {
            results = results.filter(room => roomTypes.includes(room.type));
        }

        // Filter by area
        if (area) {
            results = filterByArea(results, area);
        }

        // Filter by amenities
        if (amenities.length > 0) {
            results = results.filter(room => 
                amenities.every(amenity => room.amenities.includes(amenity))
            );
        }

        filteredRooms = results;
        displayRooms(filteredRooms);
        updateResultsCount(filteredRooms.length);
        hideLoading();
    }, 500);
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

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRooms = rooms.slice(startIndex, endIndex);

    grid.innerHTML = paginatedRooms.map(room => `
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

    // Pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRooms = rooms.slice(startIndex, endIndex);

    list.innerHTML = paginatedRooms.map(room => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer" onclick="goToDetail(${room.id})">
            <div class="flex">
                <div class="w-1/3 relative">
                    <img src="${room.images[0]}" alt="${room.title}" class="w-full h-32 object-cover">
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

// Sort results
function sortResults() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch(sortBy) {
        case 'newest':
            filteredRooms.sort((a, b) => new Date(b.posted) - new Date(a.posted));
            break;
        case 'price-asc':
            filteredRooms.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredRooms.sort((a, b) => b.price - a.price);
            break;
        case 'area-desc':
            filteredRooms.sort((a, b) => b.area - a.area);
            break;
        case 'popular':
            filteredRooms.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
            break;
    }
    
    displayRooms(filteredRooms);
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
function updateResultsCount(count) {
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
