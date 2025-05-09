// utils/auth.utils.js
import { API_BASE } from '../utils/config.js';

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
                username: payload.username,
                roles: payload.roles || []
            };
        } catch (error) {
            console.error('Error decodificando token:', error);
            return null;
        }
    },

    async validateToken() {
        try {
            const response = await fetch(`${API_BASE}/validate-token`, {
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
            const userNameElement = document.getElementById('headerUserName');
            const emailElement = document.getElementById('headerUserEmail');
            const loginLink = document.getElementById('loginLink');
            const userInfo = document.getElementById('userInfo');
            const headerLogoutBtn = document.getElementById('headerLogoutBtn');

            if (userNameElement) userNameElement.textContent = userData.username;
            if (emailElement) emailElement.textContent = userData.email;
            if (loginLink) loginLink.classList.add('d-none');
            if (userInfo) userInfo.classList.remove('d-none');
            if (headerLogoutBtn) headerLogoutBtn.classList.remove('d-none');
        }
    },

    showLoginElements() {
        const loginLink = document.getElementById('loginLink');
        const userInfo = document.getElementById('userInfo');
        
        if (loginLink) loginLink.classList.remove('d-none');
        if (userInfo) userInfo.classList.add('d-none');
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
        window.location.href = '/templates/login.html';
    },

    async init() {
        await this.handleAuthState();
        this.setupLogout();
    }
};