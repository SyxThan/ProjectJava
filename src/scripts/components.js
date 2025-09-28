// Component loading system for Phòng Trọ 24/7

class ComponentLoader {
    constructor() {
        this.componentCache = new Map();
        this.loadedComponents = new Set();
    }

    // Load a component from a file
    async loadComponent(componentName, targetSelector) {
        try {
            // Check if component is already cached
            if (this.componentCache.has(componentName)) {
                this.insertComponent(this.componentCache.get(componentName), targetSelector);
                return;
            }

            // Fetch component HTML
            const response = await fetch(`src/components/${componentName}.html`);
            if (!response.ok) {
                throw new Error(`Failed to load component: ${componentName}`);
            }

            const componentHTML = await response.text();
            
            // Cache the component
            this.componentCache.set(componentName, componentHTML);
            
            // Insert into DOM
            this.insertComponent(componentHTML, targetSelector);
            
            // Mark as loaded
            this.loadedComponents.add(componentName);

            // Initialize component-specific functionality
            this.initializeComponent(componentName);

        } catch (error) {
            console.error(`Error loading component ${componentName}:`, error);
        }
    }

    // Insert component HTML into target selector
    insertComponent(html, targetSelector) {
        const targetElement = document.querySelector(targetSelector);
        if (targetElement) {
            targetElement.innerHTML = html;
            
            // Re-initialize Feather icons for new content
            if (typeof feather !== 'undefined') {
                feather.replace();
            }
        }
    }

    // Initialize component-specific functionality
    initializeComponent(componentName) {
        switch (componentName) {
            case 'header':
                this.initializeHeader();
                break;
            case 'footer':
                this.initializeFooter();
                break;
            case 'notification':
                this.initializeNotification();
                break;
        }
    }

    // Initialize header functionality
    initializeHeader() {
        // Mobile menu toggle
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

            // Close mobile menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    mobileMenu.classList.add('hidden');
                }
            });
        }

        // Update active navigation
        this.updateActiveNavigation();

        // Check authentication status and update header
        this.updateAuthenticationState();
    }

    // Initialize footer functionality
    initializeFooter() {
        // Add any footer-specific functionality here
        // For example, newsletter subscription, social media links, etc.
        
        // Newsletter subscription (if exists)
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = newsletterForm.querySelector('input[type="email"]')?.value;
                if (email) {
                    this.handleNewsletterSubscription(email);
                }
            });
        }

        // Social media link tracking
        const socialLinks = document.querySelectorAll('footer [data-feather]');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const platform = e.target.getAttribute('data-feather');
                this.trackSocialClick(platform);
            });
        });
    }

    // Initialize notification functionality
    initializeNotification() {
        // Notification is handled by the common utils
        // This is just to ensure it's properly initialized
        if (typeof utils !== 'undefined') {
            utils.setupNotifications();
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

    // Update authentication state in header
    updateAuthenticationState() {
        const authButton = document.querySelector('header a[href="auth.html"]');
        const userToken = this.getAuthToken();
        const userInfo = this.getUserInfo();

        if (userToken && userInfo) {
            // User is logged in, show user menu instead of login button
            if (authButton) {
                authButton.outerHTML = `
                    <div class="relative user-menu">
                        <button class="flex items-center space-x-2 text-gray-700 hover:text-blue-600 focus:outline-none">
                            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                ${userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span class="hidden md:block">${userInfo.name || 'User'}</span>
                            <i data-feather="chevron-down" class="w-4 h-4"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden user-dropdown">
                            <a href="account.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tài khoản</a>
                            <a href="my-posts.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Tin đăng của tôi</a>
                            <a href="favorites.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Yêu thích</a>
                            <div class="border-t border-gray-100"></div>
                            <button onclick="componentLoader.logout()" class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Đăng xuất</button>
                        </div>
                    </div>
                `;

                // Initialize user menu dropdown
                this.initializeUserMenu();
            }
        }
    }

    // Initialize user menu dropdown
    initializeUserMenu() {
        const userMenuButton = document.querySelector('.user-menu button');
        const userDropdown = document.querySelector('.user-dropdown');

        if (userMenuButton && userDropdown) {
            userMenuButton.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('hidden');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.add('hidden');
            });
        }

        // Re-initialize Feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    }

    // Get auth token
    getAuthToken() {
        if (typeof utils !== 'undefined') {
            return utils.storage.get('auth_token') || utils.session.get('auth_token');
        }
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }

    // Get user info
    getUserInfo() {
        if (typeof utils !== 'undefined') {
            return utils.storage.get('user_info') || utils.session.get('user_info');
        }
        try {
            return JSON.parse(localStorage.getItem('user_info') || sessionStorage.getItem('user_info') || 'null');
        } catch {
            return null;
        }
    }

    // Logout functionality
    logout() {
        // Clear authentication data
        if (typeof utils !== 'undefined') {
            utils.storage.remove('auth_token');
            utils.storage.remove('user_info');
            utils.session.remove('auth_token');
            utils.session.remove('user_info');
        } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user_info');
        }

        // Show notification and redirect
        if (typeof utils !== 'undefined') {
            utils.showNotification('Đã đăng xuất thành công', 'success');
            setTimeout(() => {
                utils.url.redirect('index.html');
            }, 1000);
        } else {
            alert('Đã đăng xuất thành công');
            window.location.href = 'index.html';
        }
    }

    // Handle newsletter subscription
    async handleNewsletterSubscription(email) {
        try {
            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('Email không hợp lệ');
            }

            // In a real app, this would be an API call
            console.log('Newsletter subscription:', email);
            
            if (typeof utils !== 'undefined') {
                utils.showNotification('Đăng ký nhận tin thành công!', 'success');
            } else {
                alert('Đăng ký nhận tin thành công!');
            }

            // Clear form
            const newsletterForm = document.querySelector('.newsletter-form');
            if (newsletterForm) {
                newsletterForm.reset();
            }

        } catch (error) {
            console.error('Newsletter subscription error:', error);
            if (typeof utils !== 'undefined') {
                utils.showNotification(error.message || 'Có lỗi xảy ra', 'error');
            } else {
                alert(error.message || 'Có lỗi xảy ra');
            }
        }
    }

    // Track social media clicks
    trackSocialClick(platform) {
        // In a real app, this would send analytics data
        console.log('Social media click:', platform);
        
        // Optional: Open social media pages
        const socialUrls = {
            facebook: 'https://facebook.com/phongtro247',
            instagram: 'https://instagram.com/phongtro247',
            twitter: 'https://twitter.com/phongtro247',
            youtube: 'https://youtube.com/phongtro247'
        };

        if (socialUrls[platform]) {
            window.open(socialUrls[platform], '_blank');
        }
    }

    // Load multiple components at once
    async loadComponents(components) {
        const promises = components.map(({ name, target }) => 
            this.loadComponent(name, target)
        );
        
        await Promise.all(promises);
    }

    // Get cached component
    getCachedComponent(componentName) {
        return this.componentCache.get(componentName);
    }

    // Clear component cache
    clearCache() {
        this.componentCache.clear();
        this.loadedComponents.clear();
    }

    // Check if component is loaded
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }

    // Reload a component
    async reloadComponent(componentName, targetSelector) {
        this.componentCache.delete(componentName);
        this.loadedComponents.delete(componentName);
        await this.loadComponent(componentName, targetSelector);
    }

    // Load component with fallback
    async loadComponentWithFallback(componentName, targetSelector, fallbackHTML = '') {
        try {
            await this.loadComponent(componentName, targetSelector);
        } catch (error) {
            console.warn(`Failed to load component ${componentName}, using fallback`);
            this.insertComponent(fallbackHTML, targetSelector);
        }
    }

    // Preload components (for performance)
    async preloadComponents(componentNames) {
        const promises = componentNames.map(async (name) => {
            try {
                const response = await fetch(`src/components/${name}.html`);
                if (response.ok) {
                    const html = await response.text();
                    this.componentCache.set(name, html);
                }
            } catch (error) {
                console.warn(`Failed to preload component ${name}:`, error);
            }
        });

        await Promise.all(promises);
    }

    // Initialize common components for all pages
    async initializeCommonComponents() {
        // Load header and footer on all pages except auth
        const currentPage = window.location.pathname.split('/').pop();
        
        if (currentPage !== 'auth.html') {
            await this.loadComponents([
                { name: 'header', target: 'header-placeholder' },
                { name: 'footer', target: 'footer-placeholder' },
                { name: 'notification', target: 'notification-placeholder' }
            ]);
        } else {
            // For auth page, only load notification
            await this.loadComponent('notification', 'notification-placeholder');
        }
    }
}

// Create global instance
const componentLoader = new ComponentLoader();

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Look for component placeholders and load them
    const headerPlaceholder = document.getElementById('header-placeholder');
    const footerPlaceholder = document.getElementById('footer-placeholder');
    const notificationPlaceholder = document.getElementById('notification-placeholder');

    const components = [];
    
    if (headerPlaceholder) {
        components.push({ name: 'header', target: '#header-placeholder' });
    }
    
    if (footerPlaceholder) {
        components.push({ name: 'footer', target: '#footer-placeholder' });
    }
    
    if (notificationPlaceholder) {
        components.push({ name: 'notification', target: '#notification-placeholder' });
    }

    if (components.length > 0) {
        componentLoader.loadComponents(components);
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentLoader;
}

// Make available globally
window.ComponentLoader = ComponentLoader;
window.componentLoader = componentLoader;