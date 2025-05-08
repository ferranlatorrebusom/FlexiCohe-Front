import { getAlquileresDelUsuario, pagarAlquiler, anularAlquiler } from '../api/rent.api.js';
import { authUtils } from '../utils/auth.utils.js';

function formatearFecha(fechaIso) {
    const date = new Date(fechaIso);
    return date.toLocaleDateString('en-CA');
}

function calcularDias(fInicio, fFin) {
    const inicio = new Date(fInicio);
    const fin = new Date(fFin);
    const diffMs = fin - inicio;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const userRol = localStorage.getItem('userRol');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
    }

    const container = document.getElementById('reservation-details');
    container.innerHTML = '<p class="text-muted">🔄 Cargando reserva...</p>';

    try {
        const alquileres = await getAlquileresDelUsuario();
        if (!alquileres.length) {
            container.innerHTML = '<p class="text-muted">📭 No tienes ninguna reserva activa.</p>';
            return;
        }

        // Usamos solo el primero de momento
        const alquiler = alquileres.at(-1);
        const { vehiculo, fechaInicio, fechaFin, estado, id } = alquiler;
        const dias = calcularDias(fechaInicio, fechaFin);
        const totalAlquiler = dias * vehiculo.precioDia;
        const tasaKm = dias * 4.70;
        const total = totalAlquiler + tasaKm;

        container.innerHTML = `
            <div class="car-section">
                <h2>${vehiculo.marca} ${vehiculo.modelo}</h2>
                <img src="../assets/images/${vehiculo.imagen || 'default.png'}" alt="${vehiculo.modelo}">
                <a href="#">más info</a>
                <div class="car-info">
                    <p><strong>Desde:</strong> <input type="date" value="${formatearFecha(fechaInicio)}" disabled></p>
                    <p><strong>Hasta:</strong> <input type="date" value="${formatearFecha(fechaFin)}" disabled></p>
                    <p><strong>Tipo de tarifa:</strong> Tarifa flexible</p>
                    <p><strong>Seguro:</strong> Protección básica</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${vehiculo.localizacion}</p>
                    <p id="estado-texto"><strong>Estado:</strong> ${estado}</p>
                </div>
            </div>

            <div class="invoice-section">
                <h2>Factura</h2>
                <p class="price"><strong>${vehiculo.precioDia.toFixed(2)}€</strong> / día</p>
                <div class="invoice-details">
                    <p><strong>Gastos de alquiler</strong></p>
                    <p>${dias} días de alquiler x ${vehiculo.precioDia.toFixed(2)}€ <span>${totalAlquiler.toFixed(2)}€</span></p>
                    <p><strong>Impuestos y tasas adicionales</strong></p>
                    <p>Kilómetros ilimitados ${dias} días x 4,70€ <span>+${tasaKm.toFixed(2)}€</span></p>
                    <p><strong>Seguro</strong></p>
                    <p>Protección básica <span>+0,00€</span></p>
                </div>
                <p class="total"><strong>TOTAL:</strong> ${total.toFixed(2)}€</p>
                <div class="actions">
                    <button class="btn-yellow" id="payBtn">Pagar</button>
                    <button class="btn-red" id="cancelBtn">Anular reserva</button>
                </div>
                <div id="action-message"></div>
            </div>
        `;

        const pagarBtn = container.querySelector('#payBtn');
        const anularBtn = container.querySelector('#cancelBtn');

        // Botones
        pagarBtn.addEventListener('click', async () => {
            try {
                await pagarAlquiler(id);
                document.getElementById('action-message').innerHTML = '<p class="text-success">✅ Reserva pagada correctamente.</p>';
                document.querySelector('#estado-texto').innerHTML = '<strong>Estado:</strong> procesando';
                pagarBtn.disabled = true;
                pagarBtn.textContent = "Pagado";

                if (userRol === 'ADMIN') {
                    setTimeout(() => {
                    window.location.href = '/index-admin.html';
                    }, 2500);
                } else {
                    setTimeout(() => {
                    window.location.href = '/index.html';
                    }, 2500);
                }
            } catch (err) {
                console.error("Error al pagar:", err);
                document.getElementById('action-message').innerHTML = `<p class="text-danger">❌ Error al realizar el pago: ${err.message}</p>`;
            }
        });

        anularBtn.addEventListener('click', async () => {
            try {
                await anularAlquiler(id);
                document.getElementById('action-message').innerHTML = '<p class="text-success">🗑️ Reserva anulada correctamente.</p>';
                container.innerHTML = '<p class="text-muted">📭 Reserva anulada. No tienes ninguna reserva activa.</p>';
            } catch (err) {
                console.error("Error al anular:", err);
                document.getElementById('action-message').innerHTML = '<p class="text-danger">❌ Error al anular la reserva.</p>';
            }

            if (userRol === 'ADMIN') {
                setTimeout(() => {
                window.location.href = '/templates/index-admin.html';
                }, 2500);
            } else {
                setTimeout(() => {
                window.location.href = '/index.html';
                }, 2500);
            }
        });

    } catch (error) {
        console.error('Error cargando reserva:', error);
        container.innerHTML = '<p class="text-danger">❌ Error al cargar la reserva.</p>';
    }
});
