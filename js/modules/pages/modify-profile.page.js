import { authUtils } from '../utils/auth.utils.js';
import { API_BASE } from '../utils/config.js';

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();
    
    const userRol = localStorage.getItem('userRol');
    const logo = document.querySelector('.logo-link');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
        logo.href = '../templates/index-admin.html';
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
        logo.href = '/index.html';
    }

    const form = document.querySelector('.user-form');
    const nameInput = form.querySelector('input[type="text"]');
    const lastNameInput = form.querySelectorAll('input[type="text"]')[1];
    const dobInput = form.querySelector('input[type="date"]');
    const phoneInput = form.querySelector('input[type="tel"]');
    const dniInput = form.querySelectorAll('input[type="text"]')[2];
    const profileImg = document.querySelector('#userProfileImage');
    const usernameHeader = document.querySelector('.username');

    const fieldsToDisable = [nameInput, lastNameInput, dobInput, phoneInput, dniInput];
    fieldsToDisable.forEach(input => input.disabled = true);

    const token = localStorage.getItem('jwtToken');
    if (!token) {
        alert('Debes iniciar sesión.');
        window.location.href = '../templates/login.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/usuarios/datos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Error al obtener datos del usuario');
        const data = await res.json();

        nameInput.value = data.nombre || '';
        lastNameInput.value = data.apellidos || '';
        dobInput.value = data.fechaNacimiento ? convertirDdMmYyyyToIso(data.fechaNacimiento) : '';
        phoneInput.value = data.telefono || '';
        dniInput.value = data.ndocumento || '';
        usernameHeader.textContent = data.nombre;

        if (data.foto) {
            profileImg.src = data.foto;
        } else {
            profileImg.src = "../assets/images/DEFAULT-USER-IMAGE.png";
        }

    } catch (err) {
        console.error('❌ Error cargando perfil:', err);
        alert('Error al cargar tus datos.');
    }

    // ✏️ Activar edición de campos
    document.querySelector('.edit-user')?.addEventListener('click', (e) => {
        e.preventDefault();
        fieldsToDisable.forEach(input => input.disabled = false);
    });

    // 💾 Guardar cambios
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nombre: nameInput.value,
            apellidos: lastNameInput.value,
            telefono: phoneInput.value,
            fechaNacimiento: formatearFechaParaApi(dobInput.value),
            ndocumento: dniInput.value
        };

        try {
            const res = await fetch(`${API_BASE}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error(await res.text());

            alert('✅ Usuario actualizado correctamente.');
            fieldsToDisable.forEach(input => input.disabled = true);

        } catch (err) {
            console.error('❌ Error actualizando usuario:', err);
            alert('Error al actualizar el usuario.');
        }
    });

    // 🗑 Borrar usuario
    document.querySelector('.button-group')?.addEventListener('click', async (e) => {
        if (e.target.matches('.delete-btn')) {
            e.preventDefault();
            const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?");
            if (!confirmacion) return;

            try {
                const res = await fetch(`${API_BASE}/usuarios/eliminar`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const mensaje = await res.text();

                if (res.ok) {
                    alert("✅ Tu cuenta ha sido eliminada correctamente.");
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '../templates/login.html';
                } else {
                    alert("❌ Error al eliminar cuenta: " + mensaje);
                }
            } catch (err) {
                console.error('❌ Error al eliminar cuenta:', err);
                alert('Ocurrió un error al intentar eliminar tu cuenta.');
            }
        }
    });

    // 📸 Cambiar imagen
    const imageInput = document.querySelector('#imageInput');
    const changeImageBtn = document.querySelector('.change-img');

    changeImageBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageInput.click();
    });

    imageInput.addEventListener('change', async () => {
        const file = imageInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('imagen', file);

        try {
            const resUpload = await fetch(`${API_BASE}/usuarios/modificarImagen`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!resUpload.ok) throw new Error(await resUpload.text());

            alert('✅ Imagen actualizada correctamente.');
            profileImg.src = URL.createObjectURL(file);
        } catch (err) {
            console.error('❌ Error actualizando imagen:', err);
            alert('Error al actualizar la imagen de perfil.');
        }
    });
});

// 🛠️ Utilidades de fecha
function convertirDdMmYyyyToIso(fechaStr) {
    const [dia, mes, anio] = fechaStr.split('/');
    return `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

function formatearFechaParaApi(valorInputDate) {
    if (!valorInputDate) return '';
    const date = new Date(valorInputDate);
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
