// utils/auth.utils.js
export const authUtils = {
    isAuthenticated() {
        return !!localStorage.getItem('jwtToken');
    },

    getAuthData() {
        const token = localStorage.getItem('jwtToken');
        if (!token) return null;

        try {
            // Decodificación segura para base64url
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(decodeURIComponent(atob(base64)));
            
            return {
                email: payload.sub,
                roles: payload.roles || []
            };
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    },

    async validateToken() {
        try {
            const response = await fetch('/validate-token', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error validando token:', error);
            return false;
        }
    },

    async redirectIfAuthenticated() {
        try {
            if (this.isAuthenticated()) {
                const isValid = await this.validateToken();
                if (isValid) {
                    window.location.href = '/index.html';
                } else {
                    this.logout();
                }
            }
        } catch (error) {
            console.error('Error en redirectIfAuthenticated:', error);
            this.logout();
        }
    },

    async handleAuthState() {
        try {
            if (!this.isAuthenticated()) {
                this.showLoginElements();
                return;
            }

            const isValid = await this.validateToken();
            if (!isValid) {
                this.logout();
                return;
            }

            this.showUserElements();
        } catch (error) {
            console.error('Error en handleAuthState:', error);
            this.logout();
        }
    },

    showUserElements() {
        const userData = this.getAuthData();
        if (userData) {
            // Actualizar elementos de usuario
            const emailElement = document.getElementById('headerUserEmail');
            const loginLink = document.getElementById('loginLink');
            const userInfo = document.getElementById('userInfo');

            if (emailElement) emailElement.textContent = userData.email;
            if (loginLink) loginLink.classList.add('hidden');
            if (userInfo) userInfo.classList.remove('hidden');
        }
    },

    showLoginElements() {
        const loginLink = document.getElementById('loginLink');
        const userInfo = document.getElementById('userInfo');
        
        if (loginLink) loginLink.classList.remove('hidden');
        if (userInfo) userInfo.classList.add('hidden');
    },

    setupLogout() {
        const logoutBtn = document.getElementById('headerLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        } else {
            console.warn('Botón de logout no encontrado');
        }
    },

    logout() {
  
        localStorage.removeItem('jwtToken');
        window.location.href = '/login.html';
        window.location.reload();
    },

    async init() {
        await this.handleAuthState();
        this.setupLogout();
    }
};