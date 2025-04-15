// vehicle.api.js

export async function searchVehicles(params) {
    const url = new URL('https://flexicohe-back.onrender.com/vehiculos/buscador');

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
    const url = 'https://flexicohe-back.onrender.com/vehiculos/localizaciones';

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    if (!response.ok) throw new Error('Error al cargar localizaciones');
    return await response.json();
}

export async function getVehiculoByMatricula(matricula) {
    const url = `https://flexicohe-back.onrender.com/vehiculos/matricula/${matricula}`;

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await fetch(url, {
        method: 'GET',
        headers
    });

    if (!response.ok) throw new Error('Error al obtener vehículo por matrícula');
    return await response.json();
}
