
import { getVehiculoByMatricula, getLocalizacionesDetalladas, actualizarVehiculo, actualizarImagenVehiculo, eliminarVehiculoPorMatricula, 
            actualizarVehiculoCoche, actualizarVehiculoMoto, actualizarVehiculoFurgoneta, actualizarVehiculoCamion} from '../api/vehicle.api.js';
import { authUtils } from '../utils/auth.utils.admin.js';
import { API_BASE } from '../utils/config.js';

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
    const urlParams = new URLSearchParams(window.location.search);
    const matricula = urlParams.get('matricula');    

    if (!matricula) {
        alert('Matrícula no proporcionada.');
        return;
    }

    const vehiculo = await getVehiculoByMatricula(matricula);
    detectarTipoVehiculo(vehiculo)        
    rellenarFormulario(vehiculo);

    const form = document.getElementById('form-editar-vehiculo');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const vehiculoActualizado = {
            matricula: document.getElementById('matricula').value,
            marca: document.getElementById('marca').value,
            modelo: document.getElementById('modelo').value,
            anioMatricula: document.getElementById('anio').value,
            transmision: document.getElementById('transmision').value,
            combustible: document.getElementById('combustible').value,
            color: document.getElementById('color').value,
            localizacion: {
                localizacion: parseInt(document.getElementById('location')?.value) || 1
            },
            nplazas: document.getElementById('plazas').value,
            precioDia: document.getElementById('precio').value,
        };

        const tipo = detectarTipoVehiculo(vehiculo);

        switch (tipo) {
            case 'COCHE':
                await actualizarVehiculoCoche(
                    matricula,
                    document.getElementById('carroceria').value,
                    document.getElementById('puertas').value,
                    document.getElementById('potencia').value,
                    
                );
                break;
            case 'MOTO':
                await actualizarVehiculoMoto(
                    matricula,
                    document.getElementById('cilindrada').value,
                    document.getElementById('baul').checked ? '1' : '0',
                    
                );
                break;
            case 'FURGONETA':
                await actualizarVehiculoFurgoneta(
                    matricula,
                    document.getElementById('volumen').value,
                    document.getElementById('longitud').value,
                    document.getElementById('pesoMaxFurgoneta').value,
                    
                );
                break;
            case 'CAMION':
                await actualizarVehiculoCamion(
                    matricula,
                    document.getElementById('altura').value,
                    document.getElementById('nRemolques').value,
                    document.getElementById('tipoCarga').value,
                    document.getElementById('matriculaRemolque').value,
                    document.getElementById('pesoMaxCamion').value,
                    
                );
                break;
        }

        try {
            await actualizarVehiculo(matricula, vehiculoActualizado);
            alert('Vehículo actualizado correctamente.');    
            window.location.href = 'search.html'; 
        } catch (error) {
            console.error('Error al actualizar el vehículo:', error);
            alert('Hubo un error al actualizar el vehículo.');
        }

    });

    document.getElementById('actualizarImagenBtn')?.addEventListener('click', async () => {
        const fileInput = document.getElementById('vehiculoImagenInput');
        const file = fileInput.files[0];

        if (!file) {
            alert('Selecciona una imagen primero.');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const matricula = urlParams.get('matricula');

        if (!matricula) {
            alert('Matrícula no especificada en la URL.');
            return;
        }

        try {
            await actualizarImagenVehiculo(matricula, file);
            alert('✅ Imagen del vehículo actualizada correctamente.');
            document.getElementById('foto-vehiculo').src = URL.createObjectURL(file);
        } catch (err) {
            alert('❌ Error al actualizar la imagen del vehículo.');
        }
    });

    document.getElementById('eliminarVehiculoBtn')?.addEventListener('click', async () => {
        const confirmar = confirm("¿Estás seguro de que deseas eliminar este vehículo? Esta acción no se puede deshacer.");
        if (!confirmar) return;

        const urlParams = new URLSearchParams(window.location.search);
        const matricula = urlParams.get('matricula');

        try {
            await eliminarVehiculoPorMatricula(matricula);
            alert('✅ Vehículo eliminado correctamente.');
            window.location.href = '../templates/search.html'; 
        } catch (err) {
            console.error('❌ Error al eliminar el vehículo:', err);
            alert('❌ No se pudo eliminar el vehículo.');
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
    const coloresSelect = document.getElementById('color');
    const coloresOptions = Array.from(coloresSelect.options);
    const selectedColores = vehiculo.combustible;
    coloresOptions.forEach(option => {
        if (option.value === selectedColores) {
            option.selected = true;
        }
    });
    

    document.getElementById('plazas').value = vehiculo.nplazas;
    document.getElementById('precio').value = vehiculo.precioDia;
    
    const tipo = detectarTipoVehiculo(vehiculo);
    mostrarCamposPorTipo(tipo);

    switch (tipo) {
        case 'COCHE':
            document.getElementById('carroceria').value = vehiculo.carroceria || '';
            document.getElementById('potencia').value = vehiculo.potencia || '';
            document.getElementById('puertas').value = vehiculo.puertas || '';
            break;

        case 'MOTO':
            document.getElementById('cilindrada').value = vehiculo.cilindrada || '';
            document.getElementById('baul').checked = vehiculo.baul === 1;
            break;

        case 'FURGONETA':
            document.getElementById('volumen').value = vehiculo.volumen || '';
            document.getElementById('longitud').value = vehiculo.longitud || '';
            document.getElementById('pesoMaxFurgoneta').value = vehiculo.pesoMax || '';
            break;

        case 'CAMION':
            document.getElementById('pesoMaxCamion').value = vehiculo.pesoMax || '';
            document.getElementById('altura').value = vehiculo.altura || '';
            document.getElementById('nRemolques').value = vehiculo.numRemolques || '';
            document.getElementById('tipoCarga').value = vehiculo.tipoCarga || '';
            document.getElementById('matriculaRemolque').value = vehiculo.matriculaRemolque || '';
            break;

        default:
            break;
    }

    const fotoVehiculo = vehiculo.imagen.imagen?.trim() || '../assets/images/default.png';
    document.getElementById('foto-vehiculo').src = fotoVehiculo;
}

function detectarTipoVehiculo(vehicle) {
    if ('pesoMax' in vehicle && 'volumen' in vehicle && 'longitud' in vehicle) {
        return 'FURGONETA';
    } else if ('cilindrada' in vehicle && 'baul' in vehicle) {
        return 'MOTO';
    } else if ('altura' in vehicle && 'numRemolques' in vehicle && 'matriculaRemolque' in vehicle && 'tipoCarga' in vehicle && 'pesoMax' in vehicle) {
        return 'CAMION';
    } else {
        return 'COCHE';
    }
}

function mostrarCamposPorTipo(tipo) {
    document.querySelectorAll('.campos-especificos').forEach(div => div.style.display = 'none');
    switch(tipo) {
        case 'COCHE':
            document.getElementById('camposCoche').style.display = 'block';
            break;
        case 'MOTO':
            document.getElementById('camposMoto').style.display = 'block';
            break;
        case 'FURGONETA':
            document.getElementById('camposFurgoneta').style.display = 'block';
            break;
        case 'CAMION':
            document.getElementById('camposCamion').style.display = 'block';
            break;
    }
}
