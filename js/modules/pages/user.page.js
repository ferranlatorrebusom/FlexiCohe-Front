import { userAPI } from '../api/user.api.js';
import { LoginForm } from '../components/user.component.js';
import { API_BASE } from '../utils/config.js';

export class LoginPage {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initComponents();
            this.checkAuth();
        });
    }

    initComponents() {
        const loginForm = document.querySelector('#loginForm');
        if (!loginForm) {
            console.error('Formulario de login no encontrado');
            return;
        }

        loginForm.addEventListener('login-request', async (e) => {
            const { correo, password } = e.detail;

            try {
                const response = await userAPI.login({ correo, password });
                if (!response.token) {
                    throw new Error('No se recibió token en la respuesta');
                }

                localStorage.setItem('jwtToken', response.token);
                const userRole = response.roles[0]; // Tomamos el primer rol del array
                localStorage.setItem('userRol', userRole);
                
                if (userRole === 'ADMIN') {
                    window.location.href = '/templates/index-admin.html';
                } else {
                    window.location.href =  '/index.html';
                }

            } catch (error) {
                console.error('Error durante el login:', error);
                loginForm.dispatchEvent(new CustomEvent('login-error', {
                    detail: { message: error.message },
                    bubbles: true,
                    composed: true
                }));
            }
        });

        loginForm.addEventListener('login-error', (e) => {
            const { message } = e.detail;
            const messageEl = loginForm.querySelector('.message');
            if (messageEl) {
                messageEl.textContent = message;
                messageEl.className = 'message error';

                setTimeout(() => {
                    messageEl.textContent = '';
                    messageEl.className = 'message';
                }, 5000);
            }
        });
    }

    checkAuth() {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            window.location.href = '/index.html';
        }
    }
}

new LoginPage();
