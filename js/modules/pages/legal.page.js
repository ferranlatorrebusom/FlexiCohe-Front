import { authUtils } from '../utils/auth.utils.js';
import { API_BASE } from '../utils/config.js';


document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const userRol = localStorage.getItem('userRol');
    const logo = document.querySelector('.logo-link');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
        logo.href= '../templates/index-admin.html';
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
        logo.href= '/index.html';
    }
});
