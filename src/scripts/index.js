// Index page JavaScript functionality

class IndexPage {
    constructor() {
        this.vietnamLocations = {
            'Hà Nội': ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy', 'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông'],
            'Hồ Chí Minh': ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân', 'Thủ Đức'],
            'Đà Nẵng': ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'],
            'Hải Phòng': ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Hải An', 'Kiến An', 'Đồ Sơn', 'Dương Kinh'],
            'Cần Thơ': ['Ninh Kiều', 'Ô Môn', 'Bình Thuỷ', 'Cái Răng', 'Thốt Nốt'],
            'Bình Dương': ['Thủ Dầu Một', 'Dĩ An', 'Thuận An', 'Tân Uyên', 'Bến Cát'],
            'Đồng Nai': ['Biên Hòa', 'Long Thành', 'Nhơn Trạch', 'Vĩnh Cửu', 'Trảng Bom'],
            'Khánh Hòa': ['Nha Trang', 'Cam Ranh', 'Ninh Hòa', 'Vạn Ninh'],
            'Lâm Đồng': ['Đà Lạt', 'Bảo Lộc', 'Đức Trọng', 'Di Linh'],
            'Quảng Nam': ['Hội An', 'Tam Kỳ', 'Điện Bàn', 'Thăng Bình']
        };

        this.sampleRooms = [
            {
                id: 1,
                title: 'Phòng trọ đẹp Q.1',
                price: '3.5tr/tháng',
                location: '123 Nguyễn Huệ, Q.1, TP.HCM',
                image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80',
                amenities: ['Wifi', 'TV', 'Điều hòa'],
                featured: true
            },
            {
                id: 2,
                title: 'Chung cư mini Bình Thạnh',
                price: '4.2tr/tháng',
                location: '45 Điện Biên Phủ, Bình Thạnh',
                image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80',
                amenities: ['Wifi', 'TV', 'Điều hòa', 'Giường'],
                featured: false
            },
            {
                id: 3,
                title: 'Nhà trọ Gò Vấp',
                price: '2.8tr/tháng',
                location: '78 Quang Trung, Gò Vấp',
                image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80',
                amenities: ['Wifi', 'Giường'],
                featured: false
            }
        ];

        this.popularAreas = [
            { name: 'Quận 1', rooms: 1200, image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80' },
            { name: 'Bình Thạnh', rooms: 980, image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80' },
            { name: 'Quận 7', rooms: 850, image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80' },
            { name: 'Gò Vấp', rooms: 720, image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?ixlib=rb-4.0.3&auto=format&fit=crop&w=640&q=80' }
        ];

        this.likedRooms = new Set();
        this.init();
    }

    init() {
        this.loadPopularAreas();
        this.loadFeaturedRooms();
        this.setupEventListeners();
        this.setupLocationSearch();
    }

    setupEventListeners() {
        // Search form handling
        const searchForm = utils.dom.$('#search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        }

        // Smooth scroll for anchor links
        utils.dom.$$('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = utils.dom.$(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Intersection observer for animations
        this.setupIntersectionObserver();
    }

    setupLocationSearch() {
        const locationInput = utils.dom.$('#location-input');
        const locationDropdown = utils.dom.$('#location-dropdown');

        if (!locationInput || !locationDropdown) return;

        locationInput.addEventListener('input', utils.debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            if (searchTerm.length > 0) {
                this.showLocationSuggestions(searchTerm);
            } else {
                this.hideLocationDropdown();
            }
        }, 300));

        locationInput.addEventListener('blur', () => {
            setTimeout(() => this.hideLocationDropdown(), 200);
        });

        document.addEventListener('click', (e) => {
            if (!locationInput.contains(e.target) && !locationDropdown.contains(e.target)) {
                this.hideLocationDropdown();
            }
        });

        // Keyboard navigation
        locationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const firstOption = locationDropdown.querySelector('.location-option');
                if (firstOption && !locationDropdown.classList.contains('hidden')) {
                    firstOption.click();
                    e.preventDefault();
                }
            }
        });
    }

    showLocationSuggestions(searchTerm) {
        const dropdown = utils.dom.$('#location-dropdown');
        const suggestions = [];

        // Search in provinces and districts
        Object.keys(this.vietnamLocations).forEach(province => {
            if (province.toLowerCase().includes(searchTerm)) {
                suggestions.push({ type: 'province', name: province });
            }
            
            this.vietnamLocations[province].forEach(district => {
                if (district.toLowerCase().includes(searchTerm)) {
                    suggestions.push({ type: 'district', name: district, province: province });
                }
            });
        });

        if (suggestions.length > 0) {
            dropdown.innerHTML = suggestions.slice(0, 8).map(suggestion => {
                if (suggestion.type === 'province') {
                    return `<div class="location-option p-3 hover:bg-gray-100 cursor-pointer border-b" onclick="indexPage.selectLocation('${suggestion.name}')">
                        <i data-feather="map-pin" class="inline mr-2 w-4 h-4"></i>
                        <strong>${suggestion.name}</strong>
                    </div>`;
                } else {
                    return `<div class="location-option p-3 hover:bg-gray-100 cursor-pointer border-b" onclick="indexPage.selectLocation('${suggestion.name}, ${suggestion.province}')">
                        <i data-feather="map-pin" class="inline mr-2 w-4 h-4"></i>
                        ${suggestion.name}, <span class="text-gray-600">${suggestion.province}</span>
                    </div>`;
                }
            }).join('');
            
            utils.dom.show(dropdown);
            utils.initFeatherIcons();
        } else {
            this.hideLocationDropdown();
        }
    }

    selectLocation(location) {
        const locationInput = utils.dom.$('#location-input');
        if (locationInput) {
            locationInput.value = location;
        }
        this.hideLocationDropdown();
    }

    hideLocationDropdown() {
        const dropdown = utils.dom.$('#location-dropdown');
        if (dropdown) {
            utils.dom.hide(dropdown);
        }
    }

    handleSearch(e) {
        e.preventDefault();
        
        const location = utils.dom.$('#location-input')?.value || '';
        const price = utils.dom.$('#price-select')?.value || '';
        const roomType = utils.dom.$('#room-type-select')?.value || '';

        // Create search parameters
        const searchParams = new URLSearchParams();
        if (location) searchParams.set('location', location);
        if (price) searchParams.set('price', price);
        if (roomType) searchParams.set('type', roomType);

        // Show search notification
        utils.showNotification(`Đang tìm kiếm phòng trọ${location ? ' tại ' + location : ''}...`, 'info');

        // Simulate search delay
        setTimeout(() => {
            utils.url.redirect(`search.html?${searchParams.toString()}`);
        }, 1000);
    }

    loadPopularAreas() {
        const container = utils.dom.$('#popular-areas');
        if (!container) return;
        
        container.innerHTML = this.popularAreas.map((area, index) => `
            <div class="area-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition cursor-pointer" 
                 data-aos="fade-up" data-aos-delay="${index * 100}"
                 onclick="indexPage.searchByArea('${area.name}')">
                <img src="${area.image}" alt="${area.name}" class="w-full h-40 object-cover">
                <div class="p-4">
                    <h3 class="font-bold text-lg">${area.name}</h3>
                    <p class="text-gray-600">${area.rooms.toLocaleString()} phòng</p>
                </div>
            </div>
        `).join('');
    }

    loadFeaturedRooms() {
        const container = utils.dom.$('#featured-rooms');
        if (!container) return;
        
        container.innerHTML = this.sampleRooms.map((room, index) => `
            <div class="room-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition" 
                 data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="relative">
                    <img src="${room.image}" alt="${room.title}" class="w-full h-48 object-cover">
                    ${room.featured ? '<div class="featured-badge">Nổi bật</div>' : ''}
                    <div class="absolute top-3 right-3 bg-white p-2 rounded-full shadow-md">
                        <i data-feather="heart" class="text-gray-400 hover:text-red-500 cursor-pointer heart-icon" 
                           onclick="indexPage.toggleLike(${room.id}, this)" data-room-id="${room.id}"></i>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-xl">${room.title}</h3>
                        <span class="price-display">${room.price}</span>
                    </div>
                    <p class="text-gray-600 mb-3">
                        <i data-feather="map-pin" class="inline mr-1 w-4 h-4"></i> ${room.location}
                    </p>
                    <div class="amenities-grid mb-4">
                        ${room.amenities.map(amenity => {
                            const icons = {
                                'Wifi': 'wifi',
                                'TV': 'tv',
                                'Điều hòa': 'wind',
                                'Giường': 'home'
                            };
                            return `<span class="amenity-tag">
                                <i data-feather="${icons[amenity] || 'check'}" class="w-4 h-4"></i> ${amenity}
                            </span>`;
                        }).join('')}
                    </div>
                    <button onclick="indexPage.viewRoomDetails(${room.id})" 
                            class="btn btn-primary w-full">
                        Xem chi tiết
                    </button>
                </div>
            </div>
        `).join('');

        // Re-initialize feather icons for dynamically loaded content
        utils.initFeatherIcons();
    }

    searchByArea(areaName) {
        const locationInput = utils.dom.$('#location-input');
        if (locationInput) {
            locationInput.value = areaName;
        }
        
        utils.showNotification(`Đang tìm kiếm phòng trọ tại ${areaName}...`, 'info');
        
        setTimeout(() => {
            utils.url.redirect(`search.html?location=${encodeURIComponent(areaName)}`);
        }, 1000);
    }

    toggleLike(roomId, element) {
        event.stopPropagation();
        
        if (this.likedRooms.has(roomId)) {
            this.likedRooms.delete(roomId);
            element.classList.remove('heart-liked');
            utils.showNotification('Đã bỏ yêu thích', 'success');
        } else {
            this.likedRooms.add(roomId);
            element.classList.add('heart-liked');
            utils.showNotification('Đã thêm vào yêu thích', 'success');
        }

        // Save to localStorage
        utils.storage.set('likedRooms', Array.from(this.likedRooms));
    }

    viewRoomDetails(roomId) {
        utils.showNotification('Đang tải chi tiết phòng...', 'info');
        
        setTimeout(() => {
            utils.url.redirect(`detail.html?id=${roomId}`);
        }, 500);
    }

    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in');
                }
            });
        }, observerOptions);

        // Observe all sections for animation
        utils.dom.$$('section').forEach(section => {
            observer.observe(section);
        });
    }

    // Load liked rooms from localStorage
    loadLikedRooms() {
        const saved = utils.storage.get('likedRooms', []);
        this.likedRooms = new Set(saved);
        
        // Update heart icons
        saved.forEach(roomId => {
            const heartIcon = utils.dom.$(`[data-room-id="${roomId}"]`);
            if (heartIcon) {
                heartIcon.classList.add('heart-liked');
            }
        });
    }

    // Initialize counters animation
    animateCounters() {
        const counters = utils.dom.$$('.stat-counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.dataset.count);
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = Math.floor(current).toLocaleString();
            }, 16);
        });
    }

    // Search suggestions with autocomplete
    setupAdvancedSearch() {
        const searchInput = utils.dom.$('#location-input');
        if (!searchInput) return;

        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.fetchSearchSuggestions(e.target.value);
            }, 300);
        });
    }

    async fetchSearchSuggestions(query) {
        if (query.length < 2) return;

        try {
            // In a real app, this would be an API call
            const suggestions = this.getLocalSuggestions(query);
            this.displaySearchSuggestions(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    getLocalSuggestions(query) {
        const suggestions = [];
        const lowerQuery = query.toLowerCase();

        // Search in locations
        Object.keys(this.vietnamLocations).forEach(province => {
            if (province.toLowerCase().includes(lowerQuery)) {
                suggestions.push({
                    type: 'province',
                    name: province,
                    count: Math.floor(Math.random() * 1000) + 100
                });
            }

            this.vietnamLocations[province].forEach(district => {
                if (district.toLowerCase().includes(lowerQuery)) {
                    suggestions.push({
                        type: 'district',
                        name: district,
                        province: province,
                        count: Math.floor(Math.random() * 500) + 50
                    });
                }
            });
        });

        return suggestions.slice(0, 8);
    }

    displaySearchSuggestions(suggestions) {
        const dropdown = utils.dom.$('#location-dropdown');
        if (!dropdown) return;

        if (suggestions.length === 0) {
            utils.dom.hide(dropdown);
            return;
        }

        dropdown.innerHTML = suggestions.map(suggestion => {
            const displayName = suggestion.type === 'province' 
                ? suggestion.name 
                : `${suggestion.name}, ${suggestion.province}`;
            
            return `
                <div class="location-option p-3 hover:bg-gray-100 cursor-pointer border-b flex justify-between items-center" 
                     onclick="indexPage.selectLocation('${displayName}')">
                    <div class="flex items-center">
                        <i data-feather="map-pin" class="w-4 h-4 mr-2 text-gray-400"></i>
                        <span>${displayName}</span>
                    </div>
                    <span class="text-sm text-gray-500">${suggestion.count} phòng</span>
                </div>
            `;
        }).join('');

        utils.dom.show(dropdown);
        utils.initFeatherIcons();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.indexPage = new IndexPage();
});