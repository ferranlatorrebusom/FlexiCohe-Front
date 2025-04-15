import { authUtils } from '../utils/auth.utils.js';
import { getLocalizaciones } from '../api/vehicle.api.js';

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

    const form = document.getElementById('main-search-form');
    const pickupInput = document.getElementById('pickup-date');
    const returnInput = document.getElementById('return-date');
    const locationSelect = document.getElementById('location');
    const feedback = document.createElement('div');
    feedback.className = 'text-danger mt-2';
    form.appendChild(feedback);

    if (!form || !pickupInput || !returnInput || !locationSelect) {
        console.warn('Formulario o inputs no encontrados');
        return;
    }

    // Establecer la fecha actual por defecto en recogida
    const today = new Date();
    const isoToday = today.toISOString().split('T')[0];
    pickupInput.value = isoToday;

    // Restaurar valores desde localStorage
    const stored = JSON.parse(localStorage.getItem('lastSearch') || '{}');

    if (stored.fechainicio) pickupInput.value = stored.fechainicio.split('T')[0];
    if (stored.fechaFin) returnInput.value = stored.fechaFin.split('T')[0];

    // Cargar localizaciones desde backend
    try {
        const localizaciones = await getLocalizaciones();
        locationSelect.innerHTML = '<option value="">Selecciona una localización</option>';
        localizaciones.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            locationSelect.appendChild(option);
        });

        if (stored.localizacion) locationSelect.value = stored.localizacion;

    } catch (err) {
        console.error('Error cargando localizaciones', err);
        locationSelect.innerHTML = '<option value="">Error al cargar</option>';
    }

    // Restaurar selección de tipo
    if (stored.tipo) {
        const tipoBtn = document.querySelector(`.vehicle-options button[data-tipo="${stored.tipo}"]`);
        if (tipoBtn) {
            document.querySelectorAll('.vehicle-options button').forEach(btn => btn.classList.remove('selected'));
            tipoBtn.classList.add('selected');
            selectedTipo = stored.tipo;
        }
    }

    // Validar fechas
    const submitBtn = form.querySelector('button[type="submit"]');
    const validarFechas = () => {
        const fechaInicio = new Date(pickupInput.value);
        const fechaFin = new Date(returnInput.value);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const esValido = pickupInput.value && returnInput.value && fechaFin > fechaInicio && fechaInicio >= hoy;
        submitBtn.disabled = !esValido;

        feedback.textContent = '';
        if (pickupInput.value && new Date(pickupInput.value) < hoy) {
            feedback.textContent = '⚠️ La fecha de recogida no puede ser anterior a hoy.';
        } else if (fechaFin <= fechaInicio) {
            feedback.textContent = '⚠️ La fecha de devolución debe ser posterior a la de recogida.';
        }
    };

    pickupInput.addEventListener('input', validarFechas);
    returnInput.addEventListener('input', validarFechas);
    validarFechas();

    // Guardar y redirigir
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const params = new URLSearchParams();
        const searchState = {};

        for (let [key, value] of formData.entries()) {
            if (value) {
                params.append(key, value);
                searchState[key] = value;
            }
        }

        if (selectedTipo) {
            params.append('tipo', selectedTipo);
            searchState.tipo = selectedTipo;
        }

        // 💾 Guardar en formato completo con hora para compatibilidad
        if (searchState.fechainicio && !searchState.fechainicio.includes('T')) {
            searchState.fechainicio += 'T10:00';
        }
        if (searchState.fechaFin && !searchState.fechaFin.includes('T')) {
            searchState.fechaFin += 'T10:00';
        }

        localStorage.setItem('lastSearch', JSON.stringify(searchState));
        window.location.href = `templates/search.html?${params.toString()}`;
    });
});
