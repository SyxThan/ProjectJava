/**
 * Authentication JavaScript
 * Handles login, register, and authentication state management
 */

const API_BASE_URL = 'http://localhost:8080/api/auth/';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Tab switching
    setupTabSwitching();
    
    // Form submissions
    setupLoginForm();
    setupRegisterForm();
    
    // Password toggles
    setupPasswordToggles();
    
    // Password strength indicator
    setupPasswordStrength();
}

// Tab Switching
function setupTabSwitching() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginTab && registerTab) {
        loginTab.addEventListener('click', function() {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            if (loginForm) loginForm.classList.remove('hidden');
            if (registerForm) registerForm.classList.add('hidden');
        });

        registerTab.addEventListener('click', function() {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            if (registerForm) registerForm.classList.remove('hidden');
            if (loginForm) loginForm.classList.add('hidden');
        });
    }
}

// Login Form
function setupLoginForm() {
    const loginForm = document.getElementById('login-form-element');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('login-username');
        const password = document.getElementById('login-password');
        const rememberMe = document.getElementById('remember-me');
        
        if (!username || !password) return;
        
        const usernameValue = username.value.trim();
        const passwordValue = password.value;
        const rememberMeValue = rememberMe ? rememberMe.checked : false;

        // Show loading
        setLoading('login', true);

        try {
            const response = await fetch(API_BASE_URL + 'login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: usernameValue,
                    password: passwordValue
                })
            });

            const data = await response.json();

            if (data.token && data.message && data.message.includes('thành công')) {
                // Save authentication data
                const storage = rememberMeValue ? localStorage : sessionStorage;
                storage.setItem('token', data.token);
                
                // Save user data
                const userData = {
                    email: usernameValue,
                    fullname: data.fullname || usernameValue,
                    role: data.role || 'nguoi_thue'
                };
                storage.setItem('user', JSON.stringify(userData));

                // Show success message
                showSuccessMessage('Đăng nhập thành công! Đang chuyển hướng...');

                // Redirect to home page after 1 second
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                showErrorMessage(data.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
                setLoading('login', false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showErrorMessage('Lỗi kết nối đến server. Vui lòng thử lại sau.');
            setLoading('login', false);
        }
    });
}

// Register Form
function setupRegisterForm() {
    const registerForm = document.getElementById('register-form-element');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullnameEl = document.getElementById('register-fullname');
        const emailEl = document.getElementById('register-email');
        const phoneEl = document.getElementById('register-phone');
        const passwordEl = document.getElementById('register-password');
        const confirmPasswordEl = document.getElementById('register-confirm-password');
        const acceptTermsEl = document.getElementById('accept-terms');
        
        if (!fullnameEl || !emailEl || !phoneEl || !passwordEl || !confirmPasswordEl) return;
        
        const fullname = fullnameEl.value.trim();
        const email = emailEl.value.trim();
        const phone = phoneEl.value.trim();
        const password = passwordEl.value;
        const confirmPassword = confirmPasswordEl.value;
        const acceptTerms = acceptTermsEl ? acceptTermsEl.checked : false;

        // Validation
        if (!fullname || fullname.length < 2) {
            showErrorMessage('Họ và tên phải có ít nhất 2 ký tự');
            return;
        }

        if (!email || !isValidEmail(email)) {
            showErrorMessage('Email không hợp lệ');
            return;
        }

        if (!phone || !isValidPhone(phone)) {
            showErrorMessage('Số điện thoại phải có 10-11 chữ số');
            return;
        }

        if (!password || password.length < 6) {
            showErrorMessage('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (password !== confirmPassword) {
            showErrorMessage('Mật khẩu xác nhận không khớp');
            return;
        }

        if (!acceptTerms) {
            showErrorMessage('Vui lòng đồng ý với điều khoản sử dụng');
            return;
        }

        // Show loading
        setLoading('register', true);

        try {
            // Backend RegisterDTO không có role field - luôn mặc định nguoi_thue
            const requestData = {
                fullname: fullname,
                email: email,
                soDienThoai: phone,
                password: password,
                confirmPassword: confirmPassword
            };
            
            const response = await fetch(API_BASE_URL + 'register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            // Backend trả về Map<String, Object> với field "message"
            if (response.ok && data.message && data.message.includes('thành công')) {
                showSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.');

                setTimeout(() => {
                    const loginTab = document.getElementById('login-tab');
                    if (loginTab) {
                        loginTab.click();
                        const loginUsername = document.getElementById('login-username');
                        if (loginUsername) {
                            loginUsername.value = email;
                        }
                    }
                }, 2000);
            } else {
                showErrorMessage(data.message || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Register error:', error);
            showErrorMessage('Lỗi kết nối đến server. Vui lòng thử lại sau.');
        } finally {
            setLoading('register', false);
        }
    });
}

// Password Toggles
function setupPasswordToggles() {
    const loginToggle = document.getElementById('login-password-toggle');
    const registerToggle = document.getElementById('register-password-toggle');

    if (loginToggle) {
        loginToggle.addEventListener('click', function() {
            togglePasswordVisibility('login-password', loginToggle);
        });
    }

    if (registerToggle) {
        registerToggle.addEventListener('click', function() {
            togglePasswordVisibility('register-password', registerToggle);
        });
    }
}

function togglePasswordVisibility(inputId, toggleButton) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
}

// Password Strength Indicator
function setupPasswordStrength() {
    const passwordInput = document.getElementById('register-password');
    const strengthBar = document.getElementById('password-strength');
    const strengthText = document.getElementById('password-strength-text');

    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener('input', function() {
            const password = this.value;
            const strength = calculatePasswordStrength(password);
            
            strengthBar.className = 'password-strength w-full h-2 rounded transition-all';
            
            if (strength === 0) {
                strengthBar.className += ' bg-gray-200';
                strengthBar.style.width = '25%';
                strengthText.textContent = 'Mật khẩu cần ít nhất 6 ký tự';
            } else if (strength === 1) {
                strengthBar.className += ' bg-red-500';
                strengthBar.style.width = '33%';
                strengthText.textContent = 'Mật khẩu yếu';
            } else if (strength === 2) {
                strengthBar.className += ' bg-yellow-500';
                strengthBar.style.width = '66%';
                strengthText.textContent = 'Mật khẩu trung bình';
            } else {
                strengthBar.className += ' bg-green-500';
                strengthBar.style.width = '100%';
                strengthText.textContent = 'Mật khẩu mạnh';
            }
        });
    }
}

function calculatePasswordStrength(password) {
    if (!password || password.length < 6) return 0;
    
    let strength = 0;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    return Math.min(strength, 3);
}

// Utility Functions
function setLoading(formType, isLoading) {
    const submitBtn = document.getElementById(`${formType}-submit`);
    const submitText = document.getElementById(`${formType}-submit-text`);
    const loadingIcon = document.getElementById(`${formType}-loading`);

    if (submitBtn) {
        submitBtn.disabled = isLoading;
    }

    if (submitText && loadingIcon) {
        if (isLoading) {
            submitText.textContent = 'Đang xử lý...';
            loadingIcon.classList.remove('hidden');
        } else {
            submitText.textContent = formType === 'login' ? 'Đăng nhập' : 'Tạo tài khoản';
            loadingIcon.classList.add('hidden');
        }
    }
}

function showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    const re = /^\d{10,11}$/;
    return re.test(phone);
}

