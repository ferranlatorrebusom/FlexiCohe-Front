export class LoginForm {
    constructor() {
        // Seleccionar el formulario existente en el DOM
        this.form = document.querySelector('#loginForm');
        if (!this.form) {
            console.error('Formulario no encontrado en el DOM');
            return;
        }

        // Crear un elemento para mostrar mensajes
        this.messageEl = document.createElement('div');
        this.messageEl.className = 'message';
        this.form.appendChild(this.messageEl);

        // Agregar el evento submit al formulario
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault();

        // Obtener los valores de los campos del formulario
        const correo = this.form.querySelector('#correo').value;
        const password = this.form.querySelector('#password').value;

        // Disparar el evento personalizado 'login-request'
        this.form.dispatchEvent(new CustomEvent('login-request', {
            detail: { correo, password },
            bubbles: true,
            composed: true
        }));
    }

    showMessage(message, isError = false) {
        this.messageEl.textContent = message;
        this.messageEl.className = `message ${isError ? 'error' : 'success'}`;

        // Limpiar el mensaje después de 5 segundos
        setTimeout(() => {
            this.messageEl.textContent = '';
            this.messageEl.className = 'message';
        }, 5000);
    }
}

// Inicializar el componente cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    new LoginForm();
});