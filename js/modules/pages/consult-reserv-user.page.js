import { getAlquileresDelUsuario, anularAlquiler, cambiarEstadoAlquiler, pagarAlquiler } from '../api/rent.api.js';
import { authUtils } from '../utils/auth.utils.js';
import { API_BASE } from '../utils/config.js';

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

function loadImageAsBase64(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg"));
        };
        img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
        img.src = url;
    });
}

async function generarPDF(alquiler) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const dias = calcularDias(alquiler.fechaInicio, alquiler.fechaFin);
    const totalAlquiler = alquiler.vehiculo.precioDia * dias;
    const tasaKm = dias * 4.70;
    const seguro = 0.00;
    const subtotal = totalAlquiler + tasaKm + seguro;
    const total = subtotal.toFixed(2);
    const imagenVehiculo = alquiler.vehiculo.imagenUrl?.trim() || `${API_BASE}/assets/images/default.png`;

    // Logo superior derecha
    try {
        const logo = await loadImageAsBase64(`${API_BASE}/assets/images/logo.png`);
        doc.addImage(logo, 'PNG', 150, 10, 40, 20);
    } catch (e) {
        console.warn("Logo no cargado:", e.message);
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text("Contrato de Alquiler de Vehículo", 20, 30);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 190, 33);

    let y = 40;
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    // Partes del contrato
    doc.text("Entre las partes:", 20, y);
    y += 8;
    const partes = [
        `ARRENDADOR: FlexiCoche, con domicilio comercial en España.`,
        `ARRENDATARIO: ${alquiler.usuario?.nombre || "Tú"}.`,
    ];
    partes.forEach(line => {
        const lines = doc.splitTextToSize(line, 170);
        doc.text(lines, 20, y);
        y += lines.length * 6;
    });

    y += 4;
    doc.setFont("times", "bold");
    doc.text("Datos del Vehículo", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    const vehiculoDatos = [
        `Matricula: ${alquiler.vehiculo.matricula}`,
        `Marca y modelo: ${alquiler.vehiculo.marca} ${alquiler.vehiculo.modelo}`,
        `Ubicación: ${alquiler.vehiculo.localizacion}`,
    ];
    vehiculoDatos.forEach(line => {
        doc.text(doc.splitTextToSize(line, 170), 20, y);
        y += 6;
    });

    y += 4;
    doc.setFont("times", "bold");
    doc.text("Condiciones del Alquiler", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    const condiciones = [
        `El ARRENDATARIO acepta haber reservado el vehículo desde el día ${formatearFecha(alquiler.fechaInicio)} hasta el ${formatearFecha(alquiler.fechaFin)}, por un total de ${dias} días.`,
        `El precio total del alquiler es de ${total} €, incluyendo una tarifa flexible y seguro de protección básica.`,
        `El estado actual del alquiler es: ${alquiler.estado}.`,
        `El ARRENDATARIO se compromete a devolver el vehículo en el mismo estado en que lo recibió, conforme a las políticas de FlexiCoche.`,
        `Ambas partes declaran estar de acuerdo con las condiciones expresadas en este documento.`,
    ];
    condiciones.forEach(line => {
        const wrapped = doc.splitTextToSize(line, 170);
        doc.text(wrapped, 20, y);
        y += wrapped.length * 6;
    });

    // Imagen del vehículo
    y += 10;
    try {
        const imgVehiculo = await loadImageAsBase64(imagenVehiculo);
        doc.addImage(imgVehiculo, 'JPEG', 55, y, 100, 60);
        y += 65;
    } catch (e) {
        console.warn("Imagen vehículo no cargada:", e.message);
    }

    y += 10;
    doc.setFont("times", "italic");
    doc.text("Firma del Arrendatario: _______________________", 20, y);
    doc.text("Fecha: __________________", 140, y);

    // Pie legal
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(150);
    doc.text("Este contrato es válido entre las partes. FlexiCoche © 2025", 20, 285);

    doc.addPage();

    // FACTURA SIMPLIFICADA (Página 2)

    try {
        const logo = await loadImageAsBase64(`${API_BASE}/assets/images/logo.png`);
        doc.addImage(logo, 'PNG', 150, 10, 40, 20);
    } catch (e) {
        console.warn("Logo no cargado:", e.message);
    }

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); 
    doc.text("Factura de Alquiler Simplificada", 20, 30);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 190, 33);

    y = 40;
    doc.setFont("times", "normal");
    doc.setFontSize(12);

    // Datos resumidos del Cliente
    doc.setFont("times", "bold");
    doc.text("Cliente", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    doc.text(`Nombre: ${alquiler.usuario?.nombre || "Tú"}`, 20, y);
    y += 6;
    doc.text(`Dirección: ${alquiler.vehiculo.localizacion || "No disponible"}`, 20, y);
    y += 6;

    // Datos resumidos del Vehículo
    y += 8;
    doc.setFont("times", "bold");
    doc.text("Vehículo", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    doc.text(`Marca: ${alquiler.vehiculo.marca} ${alquiler.vehiculo.modelo}`, 20, y);
    y += 6;
    doc.text(`Placa: ${alquiler.vehiculo.matricula || "N/A"}`, 20, y);
    y += 6;

    // Subtotal desglosado antes del total
    y += 8;
    doc.setFont("times", "bold");
    doc.text("Resumen de pagos", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    doc.text(`Gastos de alquiler (${dias} días x ${alquiler.vehiculo.precioDia.toFixed(2)}€):`, 20, y);
    doc.text(`${totalAlquiler.toFixed(2)}€`, 150, y, { align: 'right' });
    y += 6;
    doc.text(`Tasa por kilómetros (${dias} días x 4.70€):`, 20, y);
    doc.text(`${tasaKm.toFixed(2)}€`, 150, y, { align: 'right' });
    y += 6;
    doc.text(`Seguro protección básica:`, 20, y);
    doc.text(`${seguro.toFixed(2)}€`, 150, y, { align: 'right' });

    // Total general
    y += 10;
    doc.setFont("times", "bold");
    doc.text("TOTAL", 20, y);
    doc.text(`${total}€`, 150, y, { align: 'right' });
    y += 10;

    // Firma y pie de página
    y += 10;
    doc.setFont("times", "italic");
    doc.text("Firma del Cliente: _______________________", 20, y);
    doc.text("Fecha: __________________", 140, y);

    // Pie de página legal o nota
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.setTextColor(150);
    doc.text("Gracias por alquilar con FlexiCoche. Esta factura tiene validez fiscal.", 20, 285);

    doc.save(`contrato-alquiler-${alquiler.id}.pdf`);
}

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const contenedor = document.querySelector('main');
    const userRol = localStorage.getItem('userRol');
    const logo = document.querySelector('.logo-link');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
        logo.href= `${API_BASE}/templates/index-admin.html`;
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
        logo.href= `${API_BASE}/index.html`;
    }

    try {
        const alquileres = await getAlquileresDelUsuario();

        if (!alquileres.length) {
            contenedor.innerHTML += '<p class="text-muted">📭 No tienes ninguna reserva realizada.</p>';
            return;
        }
// Separar activos y anteriores
        const alquileresActivos = alquileres.filter(a => a.estado.toLowerCase() !== 'devuelto');
        const alquileresAnteriores = alquileres.filter(a => a.estado.toLowerCase() === 'devuelto');

        alquileresActivos.forEach(alquiler => {
            const { vehiculo, fechaInicio, fechaFin, estado, id } = alquiler;
            const dias = calcularDias(fechaInicio, fechaFin);
            const total = (vehiculo.precioDia * dias + dias * 4.70).toFixed(2);

            const titulo = document.querySelector('main h1');
            if (titulo) {
                titulo.textContent = userRol === 'ADMIN' ? 'Reservas de clientes' : 'Mis reservas';
            }

            const estadoLower = estado.toLowerCase();

            const div = document.createElement('div');
            div.classList.add('contenedor');

            let botonesExtra = '';

            if (userRol === 'ADMIN') {
                const aceptarDisabled = (estadoLower === 'procesando') ? '' : 'btn-disabled';
                const devolverDisabled = (estadoLower === 'en alquiler') ? '' : 'btn-disabled';
                const denegarDisabled = (estadoLower === 'procesando') ? '': 'btn-disabled';
                
                botonesExtra = `
                    <button class="btn-rojo btn-denegar ${denegarDisabled}" data-id="${id}" >❌ Denegar</button>
                    <button class="btn-aceptar ${aceptarDisabled}" data-id="${id}" >✅ Aceptar</button>
                    <button class="btn-devolver ${devolverDisabled}" data-id="${id}">🔄 Devolver</button>
                `;
            }

            if(estadoLower === 'a pagar' && userRol !== 'ADMIN'){
                    botonesExtra += `
                        <button class="btn-rojo btn-anular" data-id="${id}" data-tipo="eliminar">❌ Anular</button>
                        <button class="btn-amarillo btn-pagar" data-id="${id}">💳 Pagar</button>
                    `;
            }
            
            const pdfEnabledEstados = ['en alquiler', 'devuelto'];
            const pdfDisabled = !pdfEnabledEstados.includes(estado.toLowerCase()) ? 'disabled' : '';
            botonesExtra +=`<img src="${API_BASE}/assets/icons/pdficon.png" class="btn-pdf" data-id="${id}" ${pdfDisabled}></img>`

            div.innerHTML = `
                <div class="vehiculo">
                    <img src="${vehiculo.imagenUrl?.trim() || 'default.png'}" alt="${vehiculo.modelo}">   
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
                        ${botonesExtra}
                    </div>
                </div>
            `;
            contenedor.appendChild(div);
        });

        // Si hay reservas anteriores, creamos una sección aparte
        if (alquileresAnteriores.length) {
            const seccionAnteriores = document.createElement('section');
            seccionAnteriores.classList.add('anteriores-reservas');
            seccionAnteriores.innerHTML = `<h2 class="titulo-centrado">Reservas anteriores finalizadas</h2>`;
            contenedor.appendChild(seccionAnteriores);

            alquileresAnteriores.forEach(alquiler => {
                const { vehiculo, fechaInicio, fechaFin, estado, id } = alquiler;
                const dias = calcularDias(fechaInicio, fechaFin);
                const total = (vehiculo.precioDia * dias + dias * 4.70).toFixed(2);

                const div = document.createElement('div');
                div.classList.add('contenedor', 'anterior');

                div.innerHTML = `
                    <div class="vehiculo">
                        <img src="${vehiculo.imagenUrl?.trim() || 'default.png'}" alt="${vehiculo.modelo}">   
                    </div>
                    <div class="info">
                        <h1>${vehiculo.marca} ${vehiculo.modelo}</h1>
                        <p><strong>Usuario:</strong> ${userRol === 'ADMIN' ? alquiler.usuario?.nombre || 'N/A' : 'Tú'}</p>
                        <p><strong>Desde el</strong> ${formatearFecha(fechaInicio)} <strong>hasta</strong> ${formatearFecha(fechaFin)}</p>
                        <p><strong>Importe:</strong> ${total}€</p>
                        <p><strong>Estado:</strong> ${estado}</p>
                        <div class="acciones">
                            <img src="${API_BASE}/assets/icons/pdficon.png" class="btn-pdf" data-id="${id}">
                        </div>
                    </div>
                `;
                seccionAnteriores.appendChild(div);
            });
        }

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

        // Botón PAGAR
        document.querySelectorAll('.btn-pagar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                try {
                    await pagarAlquiler(id);
                    alert('✅ Reserva pagada correctamente.');
                    window.location.reload();
                } catch (err) {
                    console.error('Error al pagar:', err);
                    alert(`❌ Error al realizar el pago: ${err.message}`);
                }
            });
        });

        // Botón ANULAR
        document.querySelectorAll('.btn-anular').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                const confirmacion = confirm('¿Seguro que quieres anular esta reserva? Esta acción la eliminará.');
                if (!confirmacion) return;

                try {
                    await anularAlquiler(id);
                    alert('✅ Reserva eliminada correctamente.');
                    window.location.reload();
                } catch (err) {
                    console.error('Error al eliminar reserva:', err);
                    alert('❌ No se pudo eliminar la reserva.');
                }
            });
        });

        // Botón DENEGAR
        document.querySelectorAll('.btn-denegar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = Number(btn.dataset.id);
                const confirmacion = confirm('¿Seguro que quieres cancelar esta reserva? Se cambiará el estado a denegado.');
                if (!confirmacion) return;

                try {
                    await cambiarEstadoAlquiler(id, 'denegado');
                    alert('✅ Reserva cancelada correctamente.');
                    window.location.reload();
                } catch (err) {
                    console.error('Error al cancelar reserva:', err);
                    alert('❌ No se pudo cancelar la reserva.');
                }
            });
        });

    } catch (err) {
        console.error('Error al cargar las reservas:', err);
        contenedor.innerHTML += '<p class="text-danger">❌ Error al cargar las reservas.</p>';
    }
});
