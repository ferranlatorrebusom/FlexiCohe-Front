import { getAlquileresDelUsuario, anularAlquiler, cambiarEstadoAlquiler } from '../api/rent.api.js';
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
    const userRol = localStorage.getItem('userRol');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none'); 
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
    }

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

            const titulo = document.querySelector('main h1');
            if (titulo) {
                titulo.textContent = userRol === 'ADMIN' ? 'Reservas de clientes' : 'Mis reservas';
            }

            const estadoLower = estado.toLowerCase();
            const anulableEstados = ['procesando', 'a pagar'];
            
            const isAnulable = anulableEstados.includes(estadoLower);
            const btnDisabledAttr = isAnulable ? '' : 'disabled';
            const btnDisabledClass = isAnulable ? '' : 'btn-disabled';

            const div = document.createElement('div');
            div.classList.add('contenedor');

            let botonesExtra = '';

            if (userRol === 'ADMIN') {
                const aceptarDisabled = estado !== 'procesando' ? 'disabled' : '';
                const devolverDisabled = estado !== 'en alquiler' ? 'disabled' : '';
                const pdfEnabledEstados = ['en alquiler', 'devuelto'];
                const pdfDisabled = !pdfEnabledEstados.includes(estado.toLowerCase()) ? 'disabled' : '';
            
                botonesExtra = `
                    <button class="btn-aceptar" data-id="${id}" ${aceptarDisabled}>✅ Aceptar</button>
                    <button class="btn-devolver" data-id="${id}" ${devolverDisabled}>🔄 Devolver</button>
                    <button class="btn-pdf" data-id="${id}" ${pdfDisabled}>📄 PDF</button>
                `;
            }

            div.innerHTML = `
                <div class="vehiculo">
                    <img src="../assets/images/${vehiculo.imagen || 'default.png'}" alt="${vehiculo.modelo}">
                    <a href="#">más info</a>
                </div>
                <div class="info">
                    <h1>${vehiculo.marca} ${vehiculo.modelo}</h1>
                    <p><strong>Usuario:</strong> ${userRol === 'ADMIN' ? alquiler.usuario?.nombre || 'N/A' : 'Tú'}</p>
                    <p><strong>Desde el</strong> ${formatearFecha(fechaInicio)} <strong>hasta</strong> ${formatearFecha(fechaFin)}</p>
                    <p><strong>Importe:</strong> ${total}€</p>
                    <p><strong>Tipo de tarifa:</strong> Tarifa flexible</p>
                    <p><strong>Seguro:</strong> Protección básica</p>
                    <p><strong>📍</strong> ${vehiculo.localizacion}</p>
                    <p><strong>Estado:</strong> ${estado}</p>
                    <div class="acciones">
                        <button class="btn-rojo btn-anular ${btnDisabledClass}" data-id="${id}" ${btnDisabledAttr}>❌ Anular</button>
                        ${botonesExtra}
                    </div>
                </div>
            `;
            contenedor.appendChild(div);
        });

        // Event listeners SOLO para los que no están deshabilitados
        document.querySelectorAll('.btn-anular:not([disabled])').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                try {
                    await cambiarEstadoAlquiler(id, 'denegado');
                    alert('❌ Reserva denegada correctamente.');
                    window.location.reload();
                } catch (err) {
                    console.error('Error al denegar reserva:', err);
                    alert('❌ No se pudo denegar la reserva.');
                }
            });
        });

        // Botón ACEPTAR
        document.querySelectorAll('.btn-aceptar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                await cambiarEstadoAlquiler(id, 'en alquiler');
            });
        });

        // Botón DEVOLVER
        document.querySelectorAll('.btn-devolver').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                await cambiarEstadoAlquiler(id, 'devuelto');
            });
        });

        // Botón PDF
        document.querySelectorAll('.btn-pdf').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.dataset.id);
                const alquiler = alquileres.find(a => a.id == id);
                generarPDF(alquiler);
            });
        });

    } catch (err) {
        console.error('Error al cargar las reservas:', err);
        contenedor.innerHTML += '<p class="text-danger">❌ Error al cargar las reservas.</p>';
    }
});
