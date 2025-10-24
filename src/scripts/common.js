// Common JavaScript utilities for Phòng Trọ 24/7

/**
 * Common utilities and shared functionality
 */
class PhongTroUtils {
    constructor() {
        this.init();
    }

    init() {
        this.initFeatherIcons();
        this.initAOS();
        this.setupMobileMenu();
        this.setupScrollToTop();
        this.setupNotifications();
        this.updateActiveNavigation();
    }

    // Initialize Feather Icons
    initFeatherIcons() {
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Initialize AOS (Animate On Scroll)
    initAOS() {
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 800,
                easing: 'ease-in-out',
                once: true,
                offset: 100
            });
        }
    }

    // Setup mobile menu functionality
    setupMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });

            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileMenuButton.contains(e.target) && !mobileMenu.contains(e.target)) {
                    mobileMenu.classList.add('hidden');
                }
            });
        }
    }

    // Setup scroll to top functionality
    setupScrollToTop() {
        let scrollButton = document.getElementById('scroll-to-top');
        
        if (!scrollButton) {
            scrollButton = document.createElement('button');
            scrollButton.id = 'scroll-to-top';
            scrollButton.innerHTML = '<i data-feather="arrow-up"></i>';
            scrollButton.className = 'fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition opacity-0 pointer-events-none z-50';
            scrollButton.setAttribute('aria-label', 'Scroll to top');
            document.body.appendChild(scrollButton);
            
            scrollButton.onclick = () => {
                window.scrollTo({ 
                    top: 0, 
                    behavior: 'smooth' 
                });
            };
            
            this.initFeatherIcons();
        }

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 300) {
                scrollButton.classList.remove('opacity-0', 'pointer-events-none');
                scrollButton.classList.add('opacity-100');
            } else {
                scrollButton.classList.add('opacity-0', 'pointer-events-none');
                scrollButton.classList.remove('opacity-100');
            }
        });
    }

    // Setup notification system
    setupNotifications() {
        if (!document.getElementById('notification')) {
            const notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'notification';
            notification.innerHTML = `
                <div class="flex items-center">
                    <i data-feather="check-circle" class="mr-2"></i>
                    <span id="notification-text">Thành công!</span>
                </div>
            `;
            document.body.appendChild(notification);
            this.initFeatherIcons();
        }
    }

    // Update active navigation based on current page
    updateActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // Show notification
    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');
        
        if (!notification || !notificationText) return;
        
        // Set message
        notificationText.textContent = message;
        
        // Set type classes
        notification.className = 'notification';
        notification.classList.add(type);
        
        // Show notification
        notification.classList.add('show');
        
        // Hide after duration
        setTimeout(() => {
            notification.classList.remove('show');
        }, duration);
    }

    // Format price to Vietnamese currency
    formatPrice(price) {
        if (price >= 1000000) {
            return (price / 1000000).toFixed(1).replace('.0', '') + ' triệu VNĐ';
        }
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    }

    // Format date to Vietnamese format
    formatDate(date) {
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    }

    // Debounce function for performance optimization
    debounce(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    }

    // Throttle function for performance optimization
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Local storage helpers
    storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to localStorage:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from localStorage:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from localStorage:', e);
                return false;
            }
        },

        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.error('Error clearing localStorage:', e);
                return false;
            }
        }
    };

    // Session storage helpers
    session = {
        set(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Error saving to sessionStorage:', e);
                return false;
            }
        },

        get(key, defaultValue = null) {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error('Error reading from sessionStorage:', e);
                return defaultValue;
            }
        },

        remove(key) {
            try {
                sessionStorage.removeItem(key);
                return true;
            } catch (e) {
                console.error('Error removing from sessionStorage:', e);
                return false;
            }
        }
    };

    // Form validation helpers
    validation = {
        email: (email) => {
            const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return regex.test(email);
        },

        phone: (phone) => {
            const regex = /^[0-9]{10,11}$/;
            return regex.test(phone.replace(/\s/g, ''));
        },

        password: (password) => {
            return {
                length: password.length >= 8,
                hasNumber: /\d/.test(password),
                hasLetter: /[a-zA-Z]/.test(password),
                hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
                isValid: password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password)
            };
        },

        required: (value) => {
            return value && value.toString().trim().length > 0;
        }
    };

    // API helpers
    api = {
        baseURL: 'http://localhost:8080/api',

        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };

            try {
                const response = await fetch(url, config);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Request failed');
                }
                
                return data;
            } catch (error) {
                console.error('API request failed:', error);
                throw error;
            }
        },

        get(endpoint, options = {}) {
            return this.request(endpoint, { method: 'GET', ...options });
        },

        post(endpoint, data, options = {}) {
            return this.request(endpoint, {
                method: 'POST',
                body: JSON.stringify(data),
                ...options
            });
        },

        put(endpoint, data, options = {}) {
            return this.request(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data),
                ...options
            });
        },

        delete(endpoint, options = {}) {
            return this.request(endpoint, { method: 'DELETE', ...options });
        }
    };

    // DOM helpers
    dom = {
        $(selector) {
            return document.querySelector(selector);
        },

        $$(selector) {
            return document.querySelectorAll(selector);
        },

        createElement(tag, className = '', content = '') {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (content) element.innerHTML = content;
            return element;
        },

        show(element) {
            if (typeof element === 'string') element = this.$(element);
            if (element) element.classList.remove('hidden');
        },

        hide(element) {
            if (typeof element === 'string') element = this.$(element);
            if (element) element.classList.add('hidden');
        },

        toggle(element) {
            if (typeof element === 'string') element = this.$(element);
            if (element) element.classList.toggle('hidden');
        }
    };

    // URL helpers
    url = {
        getParams() {
            return new URLSearchParams(window.location.search);
        },

        getParam(name, defaultValue = null) {
            return this.getParams().get(name) || defaultValue;
        },

        setParam(name, value) {
            const url = new URL(window.location);
            url.searchParams.set(name, value);
            window.history.replaceState({}, '', url);
        },

        removeParam(name) {
            const url = new URL(window.location);
            url.searchParams.delete(name);
            window.history.replaceState({}, '', url);
        },

        redirect(url) {
            window.location.href = url;
        },

        reload() {
            window.location.reload();
        }
    };

    // Loading states
    loading = {
        show(element, text = 'Đang tải...') {
            if (typeof element === 'string') element = this.dom.$(element);
            if (!element) return;

            const loader = this.dom.createElement('div', 'loading-overlay', `
                <div class="loading-spinner"></div>
                <p class="mt-4 text-gray-600">${text}</p>
            `);
            
            element.style.position = 'relative';
            element.appendChild(loader);
        },

        hide(element) {
            if (typeof element === 'string') element = this.dom.$(element);
            if (!element) return;

            const loader = element.querySelector('.loading-overlay');
            if (loader) loader.remove();
        }
    };
}

// Initialize common utilities
const utils = new PhongTroUtils();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhongTroUtils;
}

// Make available globally
window.PhongTroUtils = PhongTroUtils;
window.utils = utils;