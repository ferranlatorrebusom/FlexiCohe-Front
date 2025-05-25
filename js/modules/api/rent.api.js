import { API_BASE } from '../utils/config.js';

const API_URL = `${API_BASE}/alquileres`;

export async function createAlquiler(idVehiculo, fechaInicio, fechaFin) {
    const token = localStorage.getItem('jwtToken');

    if (!token) {
        alert('Debes iniciar sesión para realizar una reserva.');
        window.location.href = '../templates/login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
    };

    const data = {
        idVehiculo: Number(idVehiculo), fechaInicio, fechaFin
    };
    
    console.log("📦 Payload final que se enviará al backend:", data);

    const response = await fetch(API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error del backend:", errorText);
        throw new Error(`Error al crear alquiler: ${errorText}`);
    }

    // ✅ Solo intenta parsear JSON si hay contenido
    const contentLength = response.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength) > 0) {
        return await response.json();
    }

    return null; // todo ha ido bien aunque no haya respuesta
}

// 🆕 Obtener todos los alquileres del usuario autenticado
export async function getAlquileresDelUsuario() {
    const token = localStorage.getItem('jwtToken');
    console.log('Token JWT:', token); // Verifica que el token sea válido

    if (!token) {
        alert('Debes iniciar sesión para ver tus reservas.');
        window.location.href = '../templates/login.html';
        return;
    }

    const headers = {
        Authorization: `Bearer ${token}`
    };

    const response = await fetch(API_URL, {
        method: 'GET',
        headers
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error al obtener alquileres:', errorText);
        throw new Error(`Error al obtener alquileres: ${errorText}`);
    }

    return await response.json();
}

// Pagar alquiler → cambia el estado a "procesando"
export async function pagarAlquiler(idAlquiler) {
    const token = localStorage.getItem('jwtToken');

    const response = await fetch(`${API_URL}/${idAlquiler}/pagar`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return await response.json().catch(() => null);
}

// Anular alquiler → eliminar de la base de datos
export async function anularAlquiler(idAlquiler) {
    const token = localStorage.getItem('jwtToken');

    const response = await fetch(`${API_URL}/${idAlquiler}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al anular el alquiler: ${errorText}`);
    }

    return true;
}

// Cambiar estado de alquiler
export async function cambiarEstadoAlquiler(id, nuevoEstado) {
    const token = localStorage.getItem('jwtToken');

    const response = await fetch(`${API_URL}/cambiarEstado`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            idAlquiler: id,
            newEstado: nuevoEstado
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al cambiar de estado el alquiler: ${errorText}`);
    }

    alert(`Estado cambiado a ${nuevoEstado}`);
    window.location.reload();
}
