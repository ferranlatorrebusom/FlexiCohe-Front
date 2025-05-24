import { authUtils } from '../utils/auth.utils.admin.js';
import { getLocalizacionesDetalladas } from '../api/vehicle.api.js';
import { API_BASE } from '../utils/config.js';

let selectedTipo = null;

function handleVehicleSelection(button) {
    document.querySelectorAll('.vehicle-options button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
    selectedTipo = button.dataset.tipo;
    // ✅ Guardamos en localStorage al pulsar botón
    const stored = JSON.parse(localStorage.getItem('lastSearch') || '{}');
    stored.tipo = selectedTipo;
    localStorage.setItem('lastSearch', JSON.stringify(stored));
}

window.selectVehicle = handleVehicleSelection;

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const userData = authUtils.getAuthData();
    if (!userData || !userData.roles.includes('ADMIN')) {
        alert('⚠️ Acceso denegado. Solo administradores.');
        window.location.href = '/index.html';
        return; 
    }

    const userRol = localStorage.getItem('userRol');
    const logo = document.querySelector('.logo-link');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
        logo.href= '../templates/index-admin.html';
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
        logo.href= '/index.html';
    }
    
    let selectedImage = null;

    const form = document.getElementById('main-search-form');
    const locationSelect = document.getElementById('location');
    const imageInput = document.createElement('input');

    imageInput.type = 'file';
    imageInput.accept = 'image/*';

    const imageBtn = document.getElementById('addImageBtn');
    const feedback = document.createElement('div');
    feedback.className = 'text-danger mt-2';
    form.appendChild(feedback);


    if (!form || !locationSelect) {
        console.warn('Formulario o inputs no encontrados');
        return;
    }
    
    // Cargar localizaciones desde backend
    try {
        const localizaciones = await getLocalizacionesDetalladas();
        locationSelect.innerHTML = '<option value="">Selecciona una localización</option>';
        localizaciones.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc.localizacion;
            option.textContent = loc.descripcion;
            locationSelect.appendChild(option);
        });

    } catch (err) { 
        console.error('Error cargando localizaciones', err);
        locationSelect.innerHTML = '<option value="">Error al cargar</option>';
    }

    // Restaurar selección de tipo
    const buttons = document.querySelectorAll('#vehicle-type button');
    const tipos = ['coche', 'moto', 'furgoneta', 'camion'];
    
    buttons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Activar botón seleccionado
            buttons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
    
            // Mostrar/Ocultar campos específicos
            tipos.forEach(tipo => {
                const div = document.getElementById(`campos-${tipo}`);
                if (div) div.style.display = 'none';
            });
    
            const tipoSeleccionado = tipos[index];
            const divVisible = document.getElementById(`campos-${tipoSeleccionado}`);
            if (divVisible) divVisible.style.display = 'flex';
        });
    });

    // Manejo de selección de imagen
    imageBtn.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', () => {
        const file = imageInput.files[0];
        if (!file) return;

        selectedImage = file;

        const reader = new FileReader();
        reader.onload = function (e) {
        imageBtn.src = e.target.result;
        imageBtn.style.opacity = '1';
        };
        reader.readAsDataURL(file);
    });

    // Guardar y redirigir
    document.querySelector('#button-container button').addEventListener('click', async (e) => {
        e.preventDefault();
    
        if (!selectedImage) {
            alert('⚠️ Debes incluir una imagen del vehículo');
            return;
        }
        const tipoIndex = Array.from(document.querySelectorAll('#vehicle-type button')).findIndex(btn => btn.classList.contains('selected'));
        const tipos = ['COCHE', 'MOTO', 'FURGONETA', 'CAMION'];
        const selectedTipo = tipos[tipoIndex];

        try {
            const vehiculo = {
                marca: document.querySelector('#marca')?.value || '',
                modelo: document.querySelector('#modelo')?.value || '',
                anioMatricula: document.querySelector('#anioMatricula')?.value || '2025',
                transmision: document.getElementById('transmision')?.value || '',
                combustible: document.getElementById('combustible')?.value || '',
                color: document.getElementById('color')?.value || '',
                localizacion: {
                    localizacion: parseInt(document.getElementById('location')?.value) || 1
                },
                nplazas: document.querySelector('#plazas')?.value || '',
                precioDia: document.querySelector('#precio')?.value || '',
                tipo: selectedTipo,
                matricula: document.querySelector('#matricula')?.value || '',
                disponibilidad: 1
            };

            switch (selectedTipo) {
                case 'COCHE':
                    vehiculo.carroceria = document.getElementById('carroceria')?.value || '';
                    vehiculo.potencia = parseInt(document.getElementById('potencia')?.value) || 0;
                    vehiculo.puertas = parseInt(document.getElementById('puertas')?.value) || 0;
                    break;
                case 'MOTO':
                    vehiculo.cilindrada = parseInt(document.getElementById('cilindrada')?.value) || 0;
                    vehiculo.baul = parseInt(document.getElementById('baul')?.value) || 0;
                    break;
                case 'FURGONETA':
                    vehiculo.volumen = parseFloat(document.getElementById('volumen')?.value) || 0;
                    vehiculo.longitud = parseFloat(document.getElementById('longitud')?.value) || 0;
                    vehiculo.pesoMax = parseFloat(document.getElementById('pesoMaxFurgoneta')?.value) || 0;
                    break;
                case 'CAMION':
                    vehiculo.pesoMax = parseFloat(document.getElementById('pesoMaxCamion')?.value) || 0;
                    vehiculo.altura = parseFloat(document.getElementById('altura')?.value) || 0;
                    vehiculo.numRemolques = parseInt(document.getElementById('nRemolques')?.value) || 0;
                    vehiculo.tipoCarga = document.getElementById('tipoCarga')?.value || '';
                    vehiculo.matriculaRemolque = document.getElementById('matriculaRemolque')?.value || '';
                    break;
            }
            const formData = new FormData();
            formData.append('vehiculo', new Blob([JSON.stringify(vehiculo)], { type: 'application/json' }));
            formData.append('imagen', selectedImage);

            const token = localStorage.getItem('jwtToken');

            const response = await fetch(`${API_BASE}/vehiculos/add`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        
        if (!response.ok) throw new Error('Error al guardar vehículo');
        
            const data = await response.json();
            alert('✅ Vehículo guardado correctamente');
            window.location.href = '../templates/index-admin.html';
            
        } catch (err) {
            console.error('❌ Error al guardar el vehículo:', err);
            alert('Hubo un problema al guardar el vehículo.');
        }

    });
});
