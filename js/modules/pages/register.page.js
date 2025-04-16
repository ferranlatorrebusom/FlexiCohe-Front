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

        const passwordInput = document.getElementById('password');
        const repeatPasswordInput = document.getElementById('rep-password');

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = passwordInput.value.trim();
            const repeatPassword = repeatPasswordInput.value.trim();

            if (password !== repeatPassword) {
                alert('Las contraseñas no coinciden. Por favor, verifica e inténtalo de nuevo.');
                return;
            }

            const userData = {
                nombre: document.getElementById('nombre').value.trim(),
                apellidos: document.getElementById('apellidos').value.trim(),
                correo: document.getElementById('correo').value.trim(),
                password: password
            };

            try {
                await httpClient.request({
                    method: 'POST',
                    url: 'https://flexicohe-back.onrender.com/register',
                    data: userData
                });

                this.showMessage('Registro exitoso! Redirigiendo...', false);
                setTimeout(() => window.location.href = 'https://flexicohe-back.onrender.com/templates/login.html', 1500);
                
            } catch (error) {
                this.showMessage(error.message || 'Error en el registro', true);
            }
        });
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
