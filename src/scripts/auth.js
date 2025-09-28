// Authentication page JavaScript functionality

class AuthPage {
    constructor() {
        this.apiConfig = {
            baseURL: 'http://localhost:3000/api',
            endpoints: {
                login: '/auth/login',
                register: '/auth/register',
                forgotPassword: '/auth/forgot-password',
                googleAuth: '/auth/google',
                facebookAuth: '/auth/facebook'
            }
        };

        this.validation = {
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            phone: /^[0-9]{10,11}$/,
            password: {
                minLength: 8,
                hasNumber: /\d/,
                hasLetter: /[a-zA-Z]/,
                hasSpecial: /[!@#$%^&*(),.?":{}|<>]/
            }
        };

        this.init();
    }

    init() {
        this.initializeAuth();
        this.setupEventListeners();
        this.setupRealTimeValidation();
    }

    initializeAuth() {
        // Check if user is already logged in
        const token = this.getAuthToken();
        if (token && this.isValidToken(token)) {
            const returnUrl = utils.url.getParam('return_url') || 'index.html';
            utils.url.redirect(returnUrl);
            return;
        }

        // Set initial tab based on URL parameter
        const tab = utils.url.getParam('tab');
        if (tab === 'register') {
            this.switchToRegister();
        }
    }

    setupEventListeners() {
        // Tab switching
        const loginTab = utils.dom.$('#login-tab');
        const registerTab = utils.dom.$('#register-tab');
        
        if (loginTab) loginTab.addEventListener('click', () => this.switchToLogin());
        if (registerTab) registerTab.addEventListener('click', () => this.switchToRegister());

        // Form submissions
        const loginForm = utils.dom.$('#login-form-element');
        const registerForm = utils.dom.$('#register-form-element');
        const forgotPasswordForm = utils.dom.$('#forgot-password-form');

        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));

        // Password toggles
        const loginPasswordToggle = utils.dom.$('#login-password-toggle');
        const registerPasswordToggle = utils.dom.$('#register-password-toggle');

        if (loginPasswordToggle) {
            loginPasswordToggle.addEventListener('click', () => this.togglePassword('login-password'));
        }
        if (registerPasswordToggle) {
            registerPasswordToggle.addEventListener('click', () => this.togglePassword('register-password'));
        }

        // Forgot password modal
        const forgotPasswordBtn = utils.dom.$('#forgot-password-btn');
        const cancelForgotPassword = utils.dom.$('#cancel-forgot-password');

        if (forgotPasswordBtn) forgotPasswordBtn.addEventListener('click', () => this.showForgotPasswordModal());
        if (cancelForgotPassword) cancelForgotPassword.addEventListener('click', () => this.hideForgotPasswordModal());

        // Social logins
        const googleLogin = utils.dom.$('#google-login');
        const facebookLogin = utils.dom.$('#facebook-login');

        if (googleLogin) googleLogin.addEventListener('click', () => this.handleGoogleLogin());
        if (facebookLogin) facebookLogin.addEventListener('click', () => this.handleFacebookLogin());

        // Password strength checker
        const registerPassword = utils.dom.$('#register-password');
        if (registerPassword) {
            registerPassword.addEventListener('input', () => this.checkPasswordStrength());
        }

        // Modal close on outside click
        const modal = utils.dom.$('#forgot-password-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideForgotPasswordModal();
                }
            });
        }
    }

    setupRealTimeValidation() {
        // Email validation on blur
        const registerEmail = utils.dom.$('#register-email');
        if (registerEmail) {
            registerEmail.addEventListener('blur', () => {
                if (registerEmail.value && !this.validation.email.test(registerEmail.value)) {
                    this.showFieldError('register-email', 'Email không hợp lệ');
                } else {
                    this.clearFieldError('register-email');
                }
            });
        }

        // Phone validation on blur
        const registerPhone = utils.dom.$('#register-phone');
        if (registerPhone) {
            registerPhone.addEventListener('blur', () => {
                if (registerPhone.value && !this.validation.phone.test(registerPhone.value)) {
                    this.showFieldError('register-phone', 'Số điện thoại không hợp lệ');
                } else {
                    this.clearFieldError('register-phone');
                }
            });
        }

        // Confirm password validation on input
        const confirmPassword = utils.dom.$('#register-confirm-password');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => {
                const password = utils.dom.$('#register-password')?.value || '';
                if (confirmPassword.value && confirmPassword.value !== password) {
                    this.showFieldError('register-confirm-password', 'Mật khẩu không khớp');
                } else {
                    this.clearFieldError('register-confirm-password');
                }
            });
        }
    }

    switchToLogin() {
        const loginTab = utils.dom.$('#login-tab');
        const registerTab = utils.dom.$('#register-tab');
        const loginForm = utils.dom.$('#login-form');
        const registerForm = utils.dom.$('#register-form');

        if (loginTab) loginTab.classList.add('active');
        if (registerTab) registerTab.classList.remove('active');
        if (loginForm) utils.dom.show(loginForm);
        if (registerForm) utils.dom.hide(registerForm);

        this.updateURL('login');
    }

    switchToRegister() {
        const loginTab = utils.dom.$('#login-tab');
        const registerTab = utils.dom.$('#register-tab');
        const loginForm = utils.dom.$('#login-form');
        const registerForm = utils.dom.$('#register-form');

        if (registerTab) registerTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
        if (registerForm) utils.dom.show(registerForm);
        if (loginForm) utils.dom.hide(loginForm);

        this.updateURL('register');
    }

    updateURL(tab) {
        utils.url.setParam('tab', tab);
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const submitBtn = utils.dom.$('#login-submit');
        const submitText = utils.dom.$('#login-submit-text');
        const loadingIcon = utils.dom.$('#login-loading');
        
        // Show loading state
        this.setLoadingState(submitBtn, submitText, loadingIcon, true);
        
        // Clear previous errors
        this.clearErrors('login');
        
        // Get form data
        const formData = new FormData(e.target);
        const loginData = {
            username: formData.get('username')?.trim() || '',
            password: formData.get('password') || '',
            remember: formData.get('remember') === 'on'
        };
        
        // Client-side validation
        if (!this.validateLoginForm(loginData)) {
            this.setLoadingState(submitBtn, submitText, loadingIcon, false);
            return;
        }
        
        try {
            const response = await utils.api.post(this.apiConfig.endpoints.login, loginData);
            
            if (response.success) {
                // Store auth token
                this.storeAuthToken(response.token, loginData.remember);
                
                // Store user info
                if (response.user) {
                    this.storeUserInfo(response.user);
                }
                
                utils.showNotification('Đăng nhập thành công!', 'success');
                
                // Redirect after success
                setTimeout(() => {
                    const returnUrl = utils.url.getParam('return_url') || 'index.html';
                    utils.url.redirect(returnUrl);
                }, 1500);
            } else {
                this.handleLoginErrors(response.errors || { general: response.message || 'Đăng nhập thất bại' });
            }
            
        } catch (error) {
            console.error('Login error:', error);
            utils.showNotification('Lỗi kết nối. Vui lòng thử lại!', 'error');
            this.shakeForm('login-form-element');
        }
        
        this.setLoadingState(submitBtn, submitText, loadingIcon, false);
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const submitBtn = utils.dom.$('#register-submit');
        const submitText = utils.dom.$('#register-submit-text');
        const loadingIcon = utils.dom.$('#register-loading');
        
        // Show loading state
        this.setLoadingState(submitBtn, submitText, loadingIcon, true);
        
        // Clear previous errors
        this.clearErrors('register');
        
        // Get form data
        const formData = new FormData(e.target);
        const registerData = {
            fullname: formData.get('fullname')?.trim() || '',
            email: formData.get('email')?.trim() || '',
            phone: formData.get('phone')?.trim() || '',
            password: formData.get('password') || '',
            confirm_password: formData.get('confirm_password') || '',
            accept_terms: formData.get('accept_terms') === 'on'
        };
        
        // Client-side validation
        if (!this.validateRegisterForm(registerData)) {
            this.setLoadingState(submitBtn, submitText, loadingIcon, false);
            return;
        }
        
        try {
            const response = await utils.api.post(this.apiConfig.endpoints.register, registerData);
            
            if (response.success) {
                utils.showNotification('Đăng ký thành công! Đang chuyển đến trang đăng nhập...', 'success');
                
                // Switch to login tab and pre-fill email
                setTimeout(() => {
                    this.switchToLogin();
                    const loginUsername = utils.dom.$('#login-username');
                    if (loginUsername) {
                        loginUsername.value = registerData.email;
                    }
                }, 1500);
            } else {
                this.handleRegisterErrors(response.errors || { general: response.message || 'Đăng ký thất bại' });
            }
            
        } catch (error) {
            console.error('Register error:', error);
            utils.showNotification('Lỗi kết nối. Vui lòng thử lại!', 'error');
            this.shakeForm('register-form-element');
        }
        
        this.setLoadingState(submitBtn, submitText, loadingIcon, false);
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = utils.dom.$('#forgot-email')?.value?.trim() || '';
        
        if (!this.validation.email.test(email)) {
            utils.showNotification('Vui lòng nhập email hợp lệ', 'error');
            return;
        }
        
        const submitBtn = utils.dom.$('#send-reset-link');
        const originalText = submitBtn?.textContent || '';
        
        if (submitBtn) {
            submitBtn.textContent = 'Đang gửi...';
            submitBtn.disabled = true;
        }
        
        try {
            const response = await utils.api.post(this.apiConfig.endpoints.forgotPassword, { email });
            
            if (response.success) {
                utils.showNotification('Link đặt lại mật khẩu đã được gửi đến email của bạn', 'success');
                this.hideForgotPasswordModal();
            } else {
                utils.showNotification(response.message || 'Không thể gửi email. Vui lòng thử lại!', 'error');
            }
            
        } catch (error) {
            console.error('Forgot password error:', error);
            utils.showNotification('Lỗi kết nối. Vui lòng thử lại!', 'error');
        }
        
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleGoogleLogin() {
        try {
            utils.url.redirect(`${this.apiConfig.baseURL}${this.apiConfig.endpoints.googleAuth}`);
        } catch (error) {
            console.error('Google login error:', error);
            utils.showNotification('Lỗi đăng nhập Google. Vui lòng thử lại!', 'error');
        }
    }

    async handleFacebookLogin() {
        try {
            utils.url.redirect(`${this.apiConfig.baseURL}${this.apiConfig.endpoints.facebookAuth}`);
        } catch (error) {
            console.error('Facebook login error:', error);
            utils.showNotification('Lỗi đăng nhập Facebook. Vui lòng thử lại!', 'error');
        }
    }

    validateLoginForm(data) {
        let isValid = true;
        
        // Username validation (email or phone)
        if (!data.username) {
            this.showFieldError('login-username', 'Vui lòng nhập email hoặc số điện thoại');
            isValid = false;
        } else if (!this.validation.email.test(data.username) && !this.validation.phone.test(data.username)) {
            this.showFieldError('login-username', 'Email hoặc số điện thoại không hợp lệ');
            isValid = false;
        }
        
        // Password validation
        if (!data.password) {
            this.showFieldError('login-password', 'Vui lòng nhập mật khẩu');
            isValid = false;
        }
        
        return isValid;
    }

    validateRegisterForm(data) {
        let isValid = true;
        
        // Full name validation
        if (!data.fullname || data.fullname.length < 2) {
            this.showFieldError('register-fullname', 'Họ tên phải có ít nhất 2 ký tự');
            isValid = false;
        }
        
        // Email validation
        if (!data.email) {
            this.showFieldError('register-email', 'Vui lòng nhập email');
            isValid = false;
        } else if (!this.validation.email.test(data.email)) {
            this.showFieldError('register-email', 'Email không hợp lệ');
            isValid = false;
        }
        
        // Phone validation
        if (!data.phone) {
            this.showFieldError('register-phone', 'Vui lòng nhập số điện thoại');
            isValid = false;
        } else if (!this.validation.phone.test(data.phone)) {
            this.showFieldError('register-phone', 'Số điện thoại không hợp lệ (10-11 số)');
            isValid = false;
        }
        
        // Password validation
        const passwordValidation = this.validatePassword(data.password);
        if (!passwordValidation.isValid) {
            this.showFieldError('register-password', passwordValidation.message);
            isValid = false;
        }
        
        // Confirm password validation
        if (data.password !== data.confirm_password) {
            this.showFieldError('register-confirm-password', 'Mật khẩu xác nhận không khớp');
            isValid = false;
        }
        
        // Terms acceptance
        if (!data.accept_terms) {
            utils.showNotification('Vui lòng đồng ý với điều khoản sử dụng', 'error');
            isValid = false;
        }
        
        return isValid;
    }

    validatePassword(password) {
        if (!password) {
            return { isValid: false, message: 'Vui lòng nhập mật khẩu' };
        }
        
        if (password.length < this.validation.password.minLength) {
            return { isValid: false, message: `Mật khẩu phải có ít nhất ${this.validation.password.minLength} ký tự` };
        }
        
        if (!this.validation.password.hasNumber.test(password)) {
            return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 số' };
        }
        
        if (!this.validation.password.hasLetter.test(password)) {
            return { isValid: false, message: 'Mật khẩu phải chứa ít nhất 1 chữ cái' };
        }
        
        return { isValid: true };
    }

    checkPasswordStrength() {
        const password = utils.dom.$('#register-password')?.value || '';
        const strengthBar = utils.dom.$('#password-strength');
        const strengthText = utils.dom.$('#password-strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let messages = [];
        
        if (password.length >= 8) strength++;
        else messages.push('ít nhất 8 ký tự');
        
        if (this.validation.password.hasNumber.test(password)) strength++;
        else messages.push('1 số');
        
        if (this.validation.password.hasLetter.test(password)) strength++;
        else messages.push('1 chữ cái');
        
        if (this.validation.password.hasSpecial.test(password)) strength++;
        else messages.push('1 ký tự đặc biệt');
        
        // Update strength bar
        const strengthClasses = ['weak', 'fair', 'good', 'strong'];
        
        if (password.length === 0) {
            strengthBar.className = 'password-strength';
            strengthText.textContent = 'Mật khẩu cần ít nhất 8 ký tự';
        } else {
            strengthBar.className = `password-strength ${strengthClasses[strength - 1] || 'weak'}`;
            
            if (messages.length === 0) {
                strengthText.textContent = 'Mật khẩu mạnh';
                strengthText.className = 'text-xs text-green-600 mt-1';
            } else {
                strengthText.textContent = `Cần thêm: ${messages.join(', ')}`;
                strengthText.className = 'text-xs text-gray-600 mt-1';
            }
        }
    }

    setLoadingState(button, textElement, loadingIcon, isLoading) {
        if (!button || !textElement || !loadingIcon) return;

        if (isLoading) {
            button.disabled = true;
            textElement.textContent = 'Đang xử lý...';
            utils.dom.show(loadingIcon);
        } else {
            button.disabled = false;
            textElement.textContent = textElement.id.includes('login') ? 'Đăng nhập' : 'Tạo tài khoản';
            utils.dom.hide(loadingIcon);
        }
    }

    togglePassword(inputId) {
        const input = utils.dom.$(`#${inputId}`);
        const icon = input?.nextElementSibling;
        
        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"/>
            </svg>`;
        } else {
            input.type = 'password';
            icon.innerHTML = `<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>`;
        }
    }

    showForgotPasswordModal() {
        const modal = utils.dom.$('#forgot-password-modal');
        const emailInput = utils.dom.$('#forgot-email');
        
        if (modal) utils.dom.show(modal);
        if (emailInput) emailInput.focus();
    }

    hideForgotPasswordModal() {
        const modal = utils.dom.$('#forgot-password-modal');
        const emailInput = utils.dom.$('#forgot-email');
        
        if (modal) utils.dom.hide(modal);
        if (emailInput) emailInput.value = '';
    }

    showFieldError(fieldId, message) {
        const field = utils.dom.$(`#${fieldId}`);
        const errorElement = utils.dom.$(`#${fieldId}-error`);
        
        if (field) {
            field.classList.add('border-red-500', 'shake');
            field.classList.remove('border-gray-300');
            setTimeout(() => field.classList.remove('shake'), 500);
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            utils.dom.show(errorElement);
        }
    }

    clearFieldError(fieldId) {
        const field = utils.dom.$(`#${fieldId}`);
        const errorElement = utils.dom.$(`#${fieldId}-error`);
        
        if (field) {
            field.classList.remove('border-red-500');
            field.classList.add('border-gray-300');
        }
        
        if (errorElement) {
            utils.dom.hide(errorElement);
        }
    }

    clearErrors(formType) {
        const fields = formType === 'login' 
            ? ['login-username', 'login-password']
            : ['register-fullname', 'register-email', 'register-phone', 'register-password', 'register-confirm-password'];
            
        fields.forEach(fieldId => this.clearFieldError(fieldId));
    }

    handleLoginErrors(errors) {
        if (errors.username) this.showFieldError('login-username', errors.username);
        if (errors.password) this.showFieldError('login-password', errors.password);
        if (errors.general) {
            utils.showNotification(errors.general, 'error');
            this.shakeForm('login-form-element');
        }
    }

    handleRegisterErrors(errors) {
        if (errors.fullname) this.showFieldError('register-fullname', errors.fullname);
        if (errors.email) this.showFieldError('register-email', errors.email);
        if (errors.phone) this.showFieldError('register-phone', errors.phone);
        if (errors.password) this.showFieldError('register-password', errors.password);
        if (errors.general) {
            utils.showNotification(errors.general, 'error');
            this.shakeForm('register-form-element');
        }
    }

    shakeForm(formId) {
        const form = utils.dom.$(`#${formId}`);
        if (form) {
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        }
    }

    // Token management
    getAuthToken() {
        return utils.storage.get('auth_token') || utils.session.get('auth_token');
    }

    storeAuthToken(token, remember = false) {
        if (remember) {
            utils.storage.set('auth_token', token);
            utils.storage.set('token_timestamp', Date.now());
        } else {
            utils.session.set('auth_token', token);
            utils.session.set('token_timestamp', Date.now());
        }
    }

    storeUserInfo(user) {
        const storage = utils.storage.get('auth_token') ? utils.storage : utils.session;
        storage.set('user_info', user);
    }

    isValidToken(token) {
        if (!token) return false;
        
        const timestamp = utils.storage.get('token_timestamp') || utils.session.get('token_timestamp');
        if (!timestamp) return false;
        
        // Check if token is expired (24 hours)
        const now = Date.now();
        const tokenAge = now - timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        return tokenAge < maxAge;
    }

    // Handle OAuth callback
    handleOAuthCallback() {
        const token = utils.url.getParam('token');
        const error = utils.url.getParam('error');

        if (token) {
            this.storeAuthToken(token, true);
            utils.showNotification('Đăng nhập thành công!', 'success');
            setTimeout(() => {
                utils.url.redirect('index.html');
            }, 1500);
        } else if (error) {
            utils.showNotification('Đăng nhập thất bại: ' + decodeURIComponent(error), 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authPage = new AuthPage();
    
    // Handle OAuth callback if present
    if (utils.url.getParam('token') || utils.url.getParam('error')) {
        window.authPage.handleOAuthCallback();
    }
});