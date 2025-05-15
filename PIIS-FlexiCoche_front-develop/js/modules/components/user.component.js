class LoginForm extends HTMLElement {
    constructor() {
      super();
      
      // Crear Shadow DOM para encapsulación
      const shadow = this.attachShadow({ mode: 'open' });
      
      // Plantilla del componente
      shadow.innerHTML = `
        <style>
          :host {
            display: block;
            max-width: 400px;
            margin: 2rem auto;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
  
          form {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
  
          input {
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
          }
  
          button {
            background: #007bff;
            color: white;
            padding: 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
          }
  
          button:hover {
            background: #0056b3;
          }
  
          .message {
            margin-top: 1rem;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
          }
  
          .error {
            background: #ffe0e0;
            color: #dc3545;
            border: 1px solid #dc3545;
          }
  
          .success {
            background: #e0ffe0;
            color: #28a745;
            border: 1px solid #28a745;
          }
        </style>
  
        <form id="loginForm">
          <input type="email" 
                 id="correo" 
                 placeholder="Correo electrónico" 
                 required>
                 
          <input type="password" 
                 id="password" 
                 placeholder="Contraseña" 
                 required>
                 
          <button type="submit">Iniciar Sesión</button>
        </form>
        <div class="message" id="message"></div>
      `;
  
      
      this.form = shadow.getElementById('loginForm');
      this.messageEl = shadow.getElementById('message');
  
      
      this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  
    handleSubmit(e) {
      e.preventDefault();
      
      const correo = this.shadowRoot.getElementById('correo').value;
      const password = this.shadowRoot.getElementById('password').value;
  
    
      this.dispatchEvent(new CustomEvent('login-request', {
        detail: { correo, password },
        bubbles: true,
        composed: true
      }));
    }
  
    showMessage(message, isError = false) {
      this.messageEl.textContent = message;
      this.messageEl.className = `message ${isError ? 'error' : 'success'}`;
      
      
      setTimeout(() => {
        this.messageEl.textContent = '';
        this.messageEl.className = 'message';
      }, 5000);
    }
  }
  
  
  if (!customElements.get('login-form')) {
    customElements.define('login-form', LoginForm);
  }