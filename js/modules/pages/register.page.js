import { authUtils } from '../utils/auth.utils.js';
import { httpClient } from '../utils/http.utils.js';

class RegisterPage {
    constructor() {
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        await authUtils.redirectIfAuthenticated();
        this.setupForm();
    }

    setupForm() {
        const form = document.getElementById('registerForm');
        
        if (!form) {
            console.error('Formulario no encontrado');
            return;
        }

        form.addEventListener('submit', async (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const userData = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellidos').value,
            correo: document.getElementById('correo').value,
            password: document.getElementById('password').value
        };

        try {
            await httpClient.request({
                method: 'POST',
                url: '/register',
                data: userData
            });

            this.showMessage('Registro exitoso! Redirigiendo...', false);
            setTimeout(() => window.location.href = '/templates/login.html', 1500);
            
        } catch (error) {
            this.showMessage(error.message || 'Error en el registro', true);
        }
    }

    showMessage(text, isError) {
        const messageEl = document.getElementById('message');
        if (!messageEl) return;
        
        messageEl.textContent = text;
        messageEl.className = isError ? 'message-error' : 'message-success';
        messageEl.style.display = 'block';
        
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
}

new RegisterPage();