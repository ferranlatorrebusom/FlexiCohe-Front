import { userAPI } from '../api/user.api.js';

export class LoginPage {
  constructor() {
    console.log('[DEBUG] LoginPage constructor iniciado');
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[DEBUG] DOM completamente cargado');
      this.initComponents();
      this.checkAuth();
    });
  }

  initComponents() {
    console.log('[DEBUG] Inicializando componentes...');
    const loginForm = document.createElement('login-form');
    document.body.appendChild(loginForm);
    
    loginForm.addEventListener('login-request', async (e) => {
      console.log('[DEBUG] Evento login-request detectado', e.detail);
      
      try {
        console.log('[DEBUG] Intentando login con:', e.detail);
        const response = await userAPI.login(e.detail);
        console.log('[DEBUG] Respuesta del servidor:', response);
        
        if (!response.token) {
          throw new Error('No se recibió token en la respuesta');
        }
        
        console.log('[DEBUG] Almacenando token en localStorage');
        localStorage.setItem('jwtToken', response.token);
        
        console.log('[DEBUG] Redirigiendo a /index.html');
        window.location.href = '/index.html';
        
      } catch (error) {
        console.error('[ERROR] Error durante el login:', error);
        console.log('[DEBUG] Mostrando mensaje de error al usuario');
        loginForm.showMessage(error.message || 'Error desconocido', true);
      }
    });
  }

  checkAuth() {
    console.log('[DEBUG] Verificando autenticación...');
    const token = localStorage.getItem('jwtToken');
    if (token) {
      console.log('[DEBUG] Usuario ya autenticado, redirigiendo');
      window.location.href = '/index.html';
    } else {
      console.log('[DEBUG] Usuario no autenticado, mostrando formulario');
    }
  }
}

console.log('[DEBUG] Inicializando LoginPage');
new LoginPage();