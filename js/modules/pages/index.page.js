import { authUtils } from '../utils/auth.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();
});