// js/modules/pages/consult-reserv-user.page.js

import { getAlquileresDelUsuario, anularAlquiler } from '../api/rent.api.js';
import { authUtils } from '../utils/auth.utils.js';

function formatearFecha(fechaIso) {
    const date = new Date(fechaIso);
    return date.toLocaleDateString('es-ES');
}

function calcularDias(fInicio, fFin) {
    const inicio = new Date(fInicio);
    const fin = new Date(fFin);
    const diffMs = fin - inicio;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const contenedor = document.querySelector('main');

    try {
        const alquileres = await getAlquileresDelUsuario();

        if (!alquileres.length) {
            contenedor.innerHTML += '<p class="text-muted">📭 No tienes ninguna reserva realizada.</p>';
            return;
        }

        alquileres.forEach(alquiler => {
            const { vehiculo, fechaInicio, fechaFin, estado, id } = alquiler;
            const dias = calcularDias(fechaInicio, fechaFin);
            const total = (vehiculo.precioDia * dias + dias * 4.70).toFixed(2);

            const isAnulable = estado.toLowerCase() !== 'procesando';
            const btnDisabledAttr = isAnulable ? '' : 'disabled';
            const btnDisabledClass = isAnulable ? '' : 'btn-disabled';

            const div = document.createElement('div');
            div.classList.add('contenedor');

            div.innerHTML = `
                <div class="vehiculo">
                    <img src="../assets/images/${vehiculo.imagen || 'default.png'}" alt="${vehiculo.modelo}">
                    <a href="#">más info</a>
                </div>
                <div class="info">
                    <h1>${vehiculo.marca} ${vehiculo.modelo}</h1>
                    <p><strong>Usuario:</strong> Tú</p>
                    <p><strong>Desde el</strong> ${formatearFecha(fechaInicio)} <strong>hasta</strong> ${formatearFecha(fechaFin)}</p>
                    <p><strong>Importe:</strong> ${total}€</p>
                    <p><strong>Tipo de tarifa:</strong> Tarifa flexible</p>
                    <p><strong>Seguro:</strong> Protección básica</p>
                    <p><strong>📍</strong> ${vehiculo.localizacion}</p>
                    <p><strong>Estado:</strong> ${estado}</p>
                    <div class="acciones">
                        <button class="btn-rojo btn-anular ${btnDisabledClass}" data-id="${id}" ${btnDisabledAttr}>❌ Anular</button>
                        <button class="btn-yellow" disabled>Devolución</button>
                    </div>
                </div>
            `;

            contenedor.appendChild(div);
        });

        // Event listeners SOLO para los que no están deshabilitados
        document.querySelectorAll('.btn-anular:not([disabled])').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                try {
                    await anularAlquiler(id);
                    alert('✅ Reserva anulada correctamente.');
                    window.location.reload();
                } catch (err) {
                    console.error('Error al anular reserva:', err);
                    alert('❌ No se pudo anular la reserva.');
                }
            });
        });

    } catch (err) {
        console.error('Error al cargar las reservas:', err);
        contenedor.innerHTML += '<p class="text-danger">❌ Error al cargar las reservas.</p>';
    }
});
