/**
 * Navbar Component - Hiển thị navbar động dựa trên vai trò người dùng
 */

/**
 * Inject consistent navbar styles
 */
function injectNavbarStyles() {
    if (!document.getElementById('navbar-styles')) {
        const style = document.createElement('style');
        style.id = 'navbar-styles';
        style.textContent = `
            #navbar-container {
                background-color: white;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                position: sticky;
                top: 0;
                z-index: 50;
            }
            #navbar-container .container {
                padding-left: 1rem;
                padding-right: 1rem;
                padding-top: 0.75rem;
                padding-bottom: 0.75rem;
            }
            #navbar-container a[href="index.html"] span {
                font-size: 1.25rem;
                font-weight: 700;
                color: #2563eb;
            }
            #navbar-container nav a {
                font-size: 1rem;
                color: #4b5563;
            }
            #navbar-container nav a:hover {
                color: #2563eb;
            }
            #navbar-container nav a.text-blue-600 {
                color: #2563eb;
                font-weight: 500;
            }
        `;
        if (document.head) {
            document.head.appendChild(style);
        } else {
            // If head is not ready, wait for DOMContentLoaded
            document.addEventListener('DOMContentLoaded', function() {
                if (!document.getElementById('navbar-styles')) {
                    document.head.appendChild(style);
                }
            });
        }
    }
}

// Inject styles immediately if possible
if (document.head) {
    injectNavbarStyles();
} else {
    document.addEventListener('DOMContentLoaded', injectNavbarStyles);
}

/**
 * Render navbar dựa trên vai trò người dùng
 */
function renderNavbar() {
    // Check if getCurrentUser is available
    if (typeof getCurrentUser === 'undefined') {
        console.warn('getCurrentUser is not defined. Make sure api.js is loaded before navbar.js');
        // Fallback: try to get user from storage directly
        const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
        const user = userStr ? (() => {
            try {
                return JSON.parse(userStr);
            } catch (e) {
                return null;
            }
        })() : null;
        const isAuth = user !== null;
        const role = user ? (user.role || 'nguoi_thue') : null;
        renderNavbarWithUser(user, isAuth, role);
        return;
    }
    
    const user = getCurrentUser();
    const isAuth = typeof isAuthenticated !== 'undefined' ? isAuthenticated() : (user !== null);
    const role = user ? (user.role || 'nguoi_thue') : null;
    renderNavbarWithUser(user, isAuth, role);
}

/**
 * Render navbar with user data
 */
function renderNavbarWithUser(user, isAuth, role) {
    // Inject styles first if not already injected
    injectNavbarStyles();
    
    // Get current page to highlight active menu item
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    const navbarHTML = generateNavbarHTML(user, isAuth, role, currentPage);
    
    // Find navbar container
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = navbarHTML;
        
        // Initialize feather icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Setup mobile menu toggle
        setupMobileMenu();
    }
}

/**
 * Inject consistent navbar styles
 */
function injectNavbarStyles() {
    if (!document.getElementById('navbar-styles')) {
        const style = document.createElement('style');
        style.id = 'navbar-styles';
        style.textContent = `
            #navbar-container {
                background-color: white;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
                position: sticky;
                top: 0;
                z-index: 50;
            }
            #navbar-container .container {
                padding-left: 1rem;
                padding-right: 1rem;
                padding-top: 0.75rem;
                padding-bottom: 0.75rem;
            }
            #navbar-container a[href="index.html"] span {
                font-size: 1.25rem;
                font-weight: 700;
                color: #2563eb;
            }
            #navbar-container nav a {
                font-size: 1rem;
                color: #4b5563;
            }
            #navbar-container nav a:hover {
                color: #2563eb;
            }
            #navbar-container nav a.text-blue-600 {
                color: #2563eb;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Generate navbar HTML based on user role
 */
function generateNavbarHTML(user, isAuth, role, currentPage) {
    const isAdmin = role === 'quan_tri_vien' || role === 'ADMIN';
    const isUser = isAuth && !isAdmin;
    
    // Common menu items
    const commonMenuItems = [
        { href: 'index.html', text: 'Trang chủ', active: currentPage === 'index.html' },
        { href: 'search.html', text: 'Tìm phòng', active: currentPage === 'search.html' },
        { href: 'tim-phong.html', text: 'Tin tìm phòng', active: currentPage === 'tim-phong.html' }
    ];
    
    // Add favorites for authenticated users
    if (isAuth) {
        commonMenuItems.push({ 
            href: 'favorites.html', 
            text: 'Phòng đã lưu', 
            active: currentPage === 'favorites.html',
            icon: 'heart'
        });
    }
    
    // Menu items based on role
    let roleMenuItems = [];
    if (isAdmin) {
        roleMenuItems = [
            { href: 'post.html', text: 'Đăng tin', active: currentPage === 'post.html' },
            { href: 'admin.html', text: 'Quản trị', active: currentPage === 'admin.html' }
        ];
    } else if (isUser) {
        roleMenuItems = [
            { href: 'post.html', text: 'Đăng tin', active: currentPage === 'post.html' },
            { href: 'dang-tim-phong.html', text: 'Đăng tìm phòng', active: currentPage === 'dang-tim-phong.html' }
            // Không thêm "Tài khoản" vào menu vì đã có trong userSection
        ];
    } else {
        roleMenuItems = [
            { href: 'post.html', text: 'Đăng tin', active: currentPage === 'post.html' },
            { href: 'dang-tim-phong.html', text: 'Đăng tìm phòng', active: currentPage === 'dang-tim-phong.html' }
        ];
    }
    
    // Combine menu items
    const menuItems = [...commonMenuItems, ...roleMenuItems];
    
    // User info section
    let userSection = '';
    if (isAuth && user) {
        const userName = user.fullname || user.email || 'Người dùng';
        userSection = `
            <div class="flex items-center space-x-4">
                <div class="hidden md:flex items-center space-x-2 text-sm">
                    <i data-feather="user" class="w-4 h-4 text-gray-600"></i>
                    <span class="text-gray-700">${userName}</span>
                    ${isAdmin ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Admin</span>' : ''}
                </div>
                <a href="account.html" class="hidden md:block px-4 py-2 text-gray-700 hover:text-blue-600 transition">Tài khoản</a>
                <button onclick="handleLogout()" class="px-4 py-2 text-gray-700 hover:text-red-600 transition">Đăng xuất</button>
                <button class="md:hidden" id="mobile-menu-button">
                    <i data-feather="menu"></i>
                </button>
            </div>
        `;
    } else {
        userSection = `
            <div class="flex items-center space-x-4">
                <a href="auth.html" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Đăng nhập</a>
                <button class="md:hidden" id="mobile-menu-button">
                    <i data-feather="menu"></i>
                </button>
            </div>
        `;
    }
    
    // Generate menu HTML
    const desktopMenu = menuItems.map(item => `
        <a href="${item.href}" class="${item.active ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} flex items-center">
            ${item.icon ? `<i data-feather="${item.icon}" class="w-4 h-4 mr-1"></i>` : ''}
            ${item.text}
        </a>
    `).join('');
    
    const mobileMenu = menuItems.map(item => `
        <a href="${item.href}" class="${item.active ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-blue-600'} flex items-center">
            ${item.icon ? `<i data-feather="${item.icon}" class="w-4 h-4 mr-1"></i>` : ''}
            ${item.text}
        </a>
    `).join('');
    
    return `
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
            <a href="index.html" class="flex items-center">
                <i data-feather="home" class="text-blue-600 mr-2"></i>
                <span class="text-xl font-bold text-blue-600">Phòng Trọ 24/7</span>
            </a>
            <nav class="hidden md:flex space-x-8">
                ${desktopMenu}
            </nav>
            ${userSection}
        </div>
        <!-- Mobile menu -->
        <div class="md:hidden hidden bg-white shadow-lg" id="mobile-menu">
            <div class="px-4 py-3 flex flex-col space-y-3">
                ${mobileMenu}
                ${isAuth && user ? `
                    <div class="border-t pt-3 mt-3">
                        <div class="flex items-center space-x-2 mb-3">
                            <i data-feather="user" class="w-4 h-4 text-gray-600"></i>
                            <span class="text-gray-700 text-sm">${user.fullname || user.email || 'Người dùng'}</span>
                            ${isAdmin ? '<span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">Admin</span>' : ''}
                        </div>
                        <a href="account.html" class="block text-gray-600 hover:text-blue-600">Tài khoản</a>
                        <button onclick="handleLogout()" class="block text-left text-gray-600 hover:text-red-600 mt-2">Đăng xuất</button>
                    </div>
                ` : `
                    <a href="auth.html" class="block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">Đăng nhập</a>
                `}
            </div>
        </div>
    `;
}

/**
 * Setup mobile menu toggle
 */
function setupMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Show success message
    if (typeof showSuccessMessage !== 'undefined') {
        showSuccessMessage('Đã đăng xuất thành công');
    }
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Make functions globally available
window.handleLogout = handleLogout;

// Auto-render navbar when DOM is ready
// Render immediately with fallback, then update if api.js loads later
function initNavbar() {
    // Always render immediately - renderNavbar() has fallback built-in
    renderNavbar();
    
    // If api.js loads later, we can optionally re-render
    // But for now, the fallback should work fine
}

document.addEventListener('DOMContentLoaded', function() {
    // Render immediately
    initNavbar();
    
    // Also try to render after a short delay in case api.js loads asynchronously
    // But don't wait - render immediately first
    setTimeout(function() {
        if (typeof getCurrentUser !== 'undefined') {
            // Re-render with proper getCurrentUser if it's now available
            renderNavbar();
        }
    }, 50);
});

// Re-render navbar when user data changes (e.g., after login)
window.addEventListener('storage', function(e) {
    if (e.key === 'user' || e.key === 'token') {
        initNavbar();
    }
});

