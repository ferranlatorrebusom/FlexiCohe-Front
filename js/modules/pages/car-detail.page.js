import { getVehiculoByMatricula } from '../api/vehicle.api.js';
import { createAlquiler } from '../api/rent.api.js';
import { authUtils } from '../utils/auth.utils.js';

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();
    const params = new URLSearchParams(window.location.search);
    const matricula = params.get('matricula');

    if (!matricula) {
        document.getElementById('car-box').innerHTML = '<p class="text-danger">Matrícula no proporcionada.</p>';
        return;
    }

    const fechaInicioURL = params.get('fechaInicio');
    const fechaFinURL = params.get('fechaFin');
    const stored = JSON.parse(localStorage.getItem('lastSearch') || '{}');

    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');
    const rentMessage = document.getElementById('rent-message');

    function convertirAInputDatetime(fechaStr) {
        if (!fechaStr || typeof fechaStr !== 'string') return '';
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fechaStr)) return fechaStr;
        if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return `${fechaStr}T10:00`;
        return '';
    }

    const rawInicio = fechaInicioURL || stored.fechainicio || '';
    const rawFin = fechaFinURL || stored.fechaFin || '';

    if (fechaInicioInput) fechaInicioInput.value = convertirAInputDatetime(rawInicio);
    if (fechaFinInput) fechaFinInput.value = convertirAInputDatetime(rawFin);

    fechaInicioInput?.addEventListener('change', () => {
        if (fechaInicioInput.value) {
            localStorage.setItem('lastSearch', JSON.stringify({
                ...JSON.parse(localStorage.getItem('lastSearch') || '{}'),
                fechainicio: fechaInicioInput.value
            }));
        }
    });

    fechaFinInput?.addEventListener('change', () => {
        if (fechaFinInput.value) {
            localStorage.setItem('lastSearch', JSON.stringify({
                ...JSON.parse(localStorage.getItem('lastSearch') || '{}'),
                fechaFin: fechaFinInput.value
            }));
        }
    });

    try {
        const vehiculo = await getVehiculoByMatricula(matricula);
        renderCarDetails(vehiculo);
    } catch (error) {
        document.getElementById('car-box').innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }

    const rentForm = document.getElementById('rent-form');

    rentForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const idVehiculo = rentForm.querySelector('#idVehiculo').value;
        const fechaInicioRaw = fechaInicioInput.value;
        const fechaFinRaw = fechaFinInput.value;

        if (!fechaInicioRaw || !fechaFinRaw) {
            rentMessage.textContent = '❌ Debes seleccionar ambas fechas.';
            rentMessage.classList.add('text-danger');
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fInicio = new Date(fechaInicioRaw);
        const fFin = new Date(fechaFinRaw);

        if (fInicio < hoy) {
            rentMessage.textContent = '❌ La fecha de recogida no puede ser anterior a hoy.';
            rentMessage.classList.add('text-danger');
            return;
        }

        if (fFin <= fInicio) {
            rentMessage.textContent = '❌ La fecha de devolución debe ser posterior a la de recogida.';
            rentMessage.classList.add('text-danger');
            return;
        }

        let fechaInicio, fechaFin;

        try {
            fechaInicio = formatearFecha(fechaInicioRaw);
            fechaFin = formatearFecha(fechaFinRaw);
        } catch (error) {
            rentMessage.textContent = `❌ Error al formatear fechas: ${error.message}`;
            rentMessage.classList.add('text-danger');
            console.error(error);
            return;
        }

        try {
            await createAlquiler({ idVehiculo: parseInt(idVehiculo), fechaInicio, fechaFin });
            localStorage.removeItem('lastSearch');
            rentMessage.textContent = '✅ Reserva realizada con éxito.';
            rentMessage.classList.remove('text-danger');
            rentMessage.classList.add('text-success');
            setTimeout(() => window.location.href = '/templates/reserv-detail-user.html', 1500);
        } catch (err) {
            rentMessage.textContent = '❌ Error al realizar la reserva.';
            rentMessage.classList.remove('text-success');
            rentMessage.classList.add('text-danger');
            console.error(err);
        }
    });
});

function formatearFecha(input) {
    if (!input || typeof input !== "string" || !input.includes("T")) {
        throw new Error("❌ Fecha inválida");
    }

    try {
        const [fecha, hora] = input.split("T");
        const [anio, mes, dia] = fecha.split("-");
        const [h, min] = hora.split(":");
        return `${dia}/${mes}/${anio} ${h}:${min}:00`;
    } catch (err) {
        throw new Error("❌ Fecha inválida");
    }
}

function renderCarDetails(vehiculo) {
    const titleElement = document.querySelector('.car-name');
    const fechaInicioInput = document.getElementById('fechaInicio');
    const fechaFinInput = document.getElementById('fechaFin');

    if (titleElement) {
        titleElement.textContent = `${vehiculo.marca} ${vehiculo.modelo}`;
    }

    const subtitleElement = document.querySelector('.car-name + h5');
    if (subtitleElement) {
        subtitleElement.textContent = vehiculo.tipo || 'Tipo no disponible';
    }

    const imageUrl = vehiculo.imagen?.imagen?.trim()
        ? `/assets/images/${vehiculo.imagen.imagen}`
        : '../assets/images/default.png';

    document.querySelectorAll('#carousel-show .carousel-item img').forEach(img => {
        img.src = imageUrl;
        img.alt = `Imagen de ${vehiculo.modelo}`;
    });

    const carProps = document.getElementById('car-properties');
    if (carProps) {
        carProps.innerHTML = `
            <div class="row">
                <div class="col-3"><h5>${vehiculo.nplazas || '-'} plazas</h5></div>
                <div class="col-3"><h5>${vehiculo.transmision || '-'}</h5></div>
                <div class="col-3"><h5>${vehiculo.combustible || '-'}</h5></div>
                <div class="col-3"><h5>${vehiculo.potencia || '-'} CV</h5></div>
            </div>
            <div class="row">
                <div class="col-3"><h5>${new Date(vehiculo.anioMatricula).getFullYear() || '-'}</h5></div>
            </div>
        `;
    }

    const precioPorDia = vehiculo.precioDia;
    const spanPrecio = document.querySelector('#resumen .price b');
    const resumenContainer = document.getElementById('resumen');

    function actualizarResumen() {
        const fInicio = new Date(fechaInicioInput.value);
        const fFin = new Date(fechaFinInput.value);
        const unDiaMs = 1000 * 60 * 60 * 24;

        if (!isNaN(fInicio) && !isNaN(fFin) && fFin > fInicio) {
            const dias = Math.ceil((fFin - fInicio) / unDiaMs);
            const total = dias * precioPorDia;

            if (spanPrecio) spanPrecio.textContent = `${precioPorDia.toFixed(2)}€`;

            const totalDiv = resumenContainer.querySelector('.row.total div.col-9 b');
            if (totalDiv) totalDiv.textContent = `TOTAL: ${total.toFixed(2)}€`;

            const filaAlquiler = Array.from(resumenContainer.querySelectorAll('.row')).find(row =>
                row.innerText.includes('alquiler x')
            );
            if (filaAlquiler) {
                const col10 = filaAlquiler.querySelector('.col-10');
                const col2 = filaAlquiler.querySelector('.col-2');
                if (col10) col10.textContent = `${dias} días de alquiler x ${precioPorDia.toFixed(2)}€`;
                if (col2) col2.textContent = `${total.toFixed(2)}€`;
            }
        }
    }

    fechaInicioInput.addEventListener('change', actualizarResumen);
    fechaFinInput.addEventListener('change', actualizarResumen);

    document.getElementById('idVehiculo').value = vehiculo.id;

    if (fechaInicioInput.value && fechaFinInput.value) {
        actualizarResumen();
    }
}
