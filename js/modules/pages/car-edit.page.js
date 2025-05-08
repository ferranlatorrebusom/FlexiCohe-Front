import { getVehiculoByMatricula, getLocalizacionesDetalladas, actualizarVehiculo } from '../api/vehicle.api.js';
import { authUtils } from '../utils/auth.utils.admin.js';

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();

    const userData = authUtils.getAuthData();
    if (!userData || !userData.roles.includes('ADMIN')) {
        alert('⚠️ Acceso denegado. Solo administradores.');
        window.location.href = '/index.html';
        return; 
    }

    const urlParams = new URLSearchParams(window.location.search);
    const matricula = urlParams.get('matricula');

    if (!matricula) {
        alert('Matrícula no proporcionada.');
        return;
    }

    try {
        const vehiculo = await getVehiculoByMatricula(matricula);
        rellenarFormulario(vehiculo);
    } catch (error) {
        console.error('Error al cargar datos del vehículo:', error);
        alert('No se pudo cargar la información del vehículo.');
    }

    const form = document.getElementById('form-editar-vehiculo');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const vehiculoActualizado = {
            matricula: document.getElementById('matricula').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            anio: document.getElementById('anio').value,
            transmision: document.getElementById('transmision').value,
            combustible: document.getElementById('combustible').value,
            color: document.getElementById('color').value,
            localizacion: {
                localizacion: parseInt(document.getElementById('location')?.value) || 1
            },
            nplazas: document.getElementById('plazas').value,
            precioDia: document.getElementById('precio').value,
            carroceria: document.getElementById('carroceria').value,
            potencia: document.getElementById('potencia').value,
            puertas: document.getElementById('puertas').value
        };

        try {
            await actualizarVehiculo(matricula, vehiculoActualizado);
            alert('Vehículo actualizado correctamente.');    
            window.location.href = 'search.html'; 
        } catch (error) {
            console.error('Error al actualizar el vehículo:', error);
            alert('Hubo un error al actualizar el vehículo.');
        }
    });
});

async function rellenarFormulario(vehiculo) {
    document.getElementById('matricula').value = vehiculo.matricula;
    document.getElementById('marca').value = vehiculo.marca;
    document.getElementById('modelo').value = vehiculo.modelo;
    document.getElementById('anio').value = vehiculo.anioMatricula.split('/').pop(); 
    document.getElementById('transmision').value = vehiculo.transmision;
    
    const combustibleSelect = document.getElementById('combustible');
    const combustibleOptions = Array.from(combustibleSelect.options);
    const selectedCombustible = vehiculo.combustible;
    combustibleOptions.forEach(option => {
        if (option.value === selectedCombustible) {
            option.selected = true;
        }
    });

    const locationSelect = document.getElementById('location');

    const localizaciones = await getLocalizacionesDetalladas();
    locationSelect.innerHTML = '<option value="">Selecciona una localización</option>';
    localizaciones.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc.localizacion;
        option.textContent = loc.descripcion;
        locationSelect.appendChild(option);
    });

    locationSelect.value = vehiculo.localizacion.localizacion;

    document.getElementById('color').value = vehiculo.color;
    document.getElementById('plazas').value = vehiculo.nplazas;
    document.getElementById('precio').value = vehiculo.precioDia;
    document.getElementById('carroceria').value = vehiculo.carroceria;
    document.getElementById('potencia').value = vehiculo.potencia;
    document.getElementById('puertas').value = vehiculo.puertas;

    const fotoVehiculo = vehiculo.imagen.imagen; 

    if (fotoVehiculo) {
        document.getElementById('foto-vehiculo').src = fotoVehiculo; 
    } else {
        document.getElementById('foto-vehiculo').src = "../assets/images/DEFAULT-USER-IMAGE.png";
    }
}
