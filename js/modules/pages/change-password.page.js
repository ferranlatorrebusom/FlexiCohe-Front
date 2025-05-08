import { authUtils } from '../utils/auth.utils.js';
import { API_BASE } from '../utils/config.js';

document.addEventListener("DOMContentLoaded", async function () {
    await authUtils.init();

    const form = document.querySelector(".password-form");
    const backBtn = document.querySelector(".back-btn");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const inputs = form.querySelectorAll("input");
        const currentPassword = inputs[0].value;
        const newPassword = inputs[1].value;
        const confirmPassword = inputs[2].value;

        if (newPassword !== confirmPassword) {
            alert("❌ Las nuevas contraseñas no coinciden.");
            return;
        }

        if (newPassword === currentPassword) {
            alert("❌ La nueva contraseña no puede ser igual a la actual.");
            return;
        }

        const token = localStorage.getItem('jwtToken');

        try {
            const response = await fetch(`${API_BASE}/usuarios/modificarPassword`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword
                })
            });

            if (response.ok) {
                alert("✅ Contraseña cambiada con éxito.");
                form.reset();
                
                const userRol = localStorage.getItem('userRol');
                if (userRol === 'ADMIN') {
                    window.location.href = '/templates/index-admin.html';
                } else {
                    window.location.href = '/index.html';
                }
            } else if (response.status === 401) {
                alert("⚠️ No estás autenticado. Vuelve a iniciar sesión.");
                window.location.href = "/templates/login.html";
            } else {
                const errorText = await response.text();
                alert("❌ Error al cambiar la contraseña: " + errorText);
            }
        } catch (err) {
            console.error(err);
            alert("❌ Error de red o del servidor.");
        }
    });

    backBtn.addEventListener("click", function () {
        window.history.back();
    });
});
