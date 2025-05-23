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

export async function actualizarImagenVehiculo(matricula, file) {
    const formData = new FormData();
    formData.append('imagen', file);
    const token = localStorage.getItem('jwtToken');  

    try {
        const res = await fetch(`${API_BASE}/vehiculos/${matricula}/imagen`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(errorText || 'Error al actualizar la imagen');
        }

        return res; 

    } catch (err) {
        console.error('❌ Error en actualizarImagenVehiculo:', err);
        throw err;
    }
}

export async function eliminarVehiculoPorMatricula(matricula) {
    const token = localStorage.getItem('jwtToken');

    const res = await fetch(`${API_BASE}/vehiculos/${matricula}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al eliminar el vehículo');
    }

    return res;
}


export async function actualizarVehiculoCoche(matricula, carroceria, puertas, potencia) {
    const token = localStorage.getItem('jwtToken');

    const res = await fetch(`${API_BASE}/vehiculos/updateVehiculoCoche/${matricula}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: new URLSearchParams({ carroceria, puertas, potencia })
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al eliminar el vehículo');
    }

    return res;
}

export async function actualizarVehiculoMoto(matricula, cilindrada, baul) {
    const token = localStorage.getItem('jwtToken');

    const res = await fetch(`${API_BASE}/vehiculos/updateVehiculoMoto/${matricula}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: new URLSearchParams({ cilindrada, baul })
    });
    
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al eliminar el vehículo');
    }

    return res;
}

export async function actualizarVehiculoFurgoneta(matricula, volumen, longitud, pesoMax) {
    const token = localStorage.getItem('jwtToken');

    const params = new URLSearchParams({ volumen, longitud, pesoMax });

    const res = await fetch(`${API_BASE}/vehiculos/updateVehiculoFurgoneta/${matricula}?${params.toString()}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`
            // No necesitas 'Content-Type' porque no hay body
        }
    });

    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al actualizar la furgoneta');
    }

    return res.json();
}


export async function actualizarVehiculoCamion(matricula, altura, numRemolques, tipoCarga, matriculaRemolque, pesoMax) {
    const token = localStorage.getItem('jwtToken');

    const res = await fetch(`${API_BASE}/vehiculos/updateVehiculoCamion/${matricula}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: new URLSearchParams({ altura, numRemolques, tipoCarga, matriculaRemolque, pesoMax })
    });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Error al eliminar el vehículo');
    }

    return res;
}