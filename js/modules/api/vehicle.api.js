import { API_BASE } from '../utils/config.js';

export async function searchVehicles(params) {
    const url = new URL(`${API_BASE}/vehiculos/buscador`);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
            url.searchParams.append(key, value);
        }
    });

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    if (!response.ok) throw new Error('Error al buscar vehículos');
    return await response.json();
}

export async function getLocalizaciones() {
    const url = `${API_BASE}/vehiculos/localizaciones`;


    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    if (!response.ok) throw new Error('Error al cargar localizaciones');
    return await response.json();
}

export async function getLocalizacionesDetalladas() {
    const url = `${API_BASE}/vehiculos/localizaciones/detallado`;


    const token = localStorage.getItem('jwtToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
        throw new Error('Error al cargar localizaciones');
    }

    return await response.json();
}

export async function getVehiculoByMatricula(matricula) {
    const url = `${API_BASE}/vehiculos/matricula/${matricula}`;

    const token = localStorage.getItem('jwtToken');
    if (!token) {
        throw new Error('Token de autenticación no encontrado. Por favor inicia sesión de nuevo.');
    }

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Error al obtener vehículo por matrícula');
    return await response.json();
}


export async function getVehiculos() {
    const url = `${API_BASE}/vehiculos`;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    if (!response.ok) throw new Error('Error al cargar vehículos');
    return await response.json();
}

export async function actualizarVehiculo(matricula, vehiculoData) {
    try {
        const url = `${API_BASE}/vehiculos/updateVehiculo/${matricula}`;
        const token = localStorage.getItem('jwtToken');  

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(vehiculoData)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar el vehículo: ${response.statusText}`);
        }

        const vehiculoActualizado = await response.json();
        console.log("✅ Vehículo actualizado correctamente:", vehiculoActualizado);

    } catch (error) {
        console.error("❌ Error en la actualización del vehículo:", error);
    }
}

