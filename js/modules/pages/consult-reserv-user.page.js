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
    const total = (alquiler.vehiculo.precioDia * dias + dias * 4.70).toFixed(2);
    const imagenVehiculo = alquiler.vehiculo.imagenUrl?.trim() || '../assets/images/default.png';

    // Logo superior derecha
    try {
        const logo = await loadImageAsBase64("../assets/images/logo.png");
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
        const logo = await loadImageAsBase64("../assets/images/logo.png");
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

    // Precio total simplificado
    y += 8;
    doc.setFont("times", "bold");
    doc.text("Total", 20, y);
    y += 8;
    doc.setFont("times", "normal");
    doc.text(`Total Alquiler: ${total}€`, 20, y);
    y += 6;

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

        //<img src="../assets/images/${vehiculo.imagen || 'default.png'}" alt="${vehiculo.modelo}"> 
            div.innerHTML = `
                <div class="vehiculo">
                    <img src="${vehiculo.imagenUrl?.trim() || 'default.png'}" alt="${vehiculo.modelo}">     
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
