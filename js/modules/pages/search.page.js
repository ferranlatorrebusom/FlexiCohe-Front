import { searchVehicles, getLocalizaciones } from '../api/vehicle.api.js';
import { authUtils } from '../utils/auth.utils.js';

function restaurarTipoSeleccionado() {
    const stored = JSON.parse(localStorage.getItem('lastSearch') || '{}');
    if (stored.tipo) {
        const btn = document.querySelector(`.vehicle-btn[data-value="${stored.tipo}"]`);
        if (btn) {
            document.querySelectorAll('.vehicle-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await authUtils.init();
    const form = document.getElementById('search-form');
    const resultsContainer = document.getElementById('results');
    const fechaInicioInput = document.querySelector('input[name="fechaInicio"]');
    const fechaFinInput = document.querySelector('input[name="fechaFin"]');
    const localizacionSelect = document.querySelector('select[name="localizacion"]');
    const tipoBotones = document.querySelectorAll('.vehicle-btn');
    const tipoSelectExtendido = document.querySelector('select[name="tipo"]');
    const feedback = document.createElement('div');
    feedback.className = 'text-danger mt-2';
    form.appendChild(feedback);

    const urlParams = new URLSearchParams(window.location.search);
    const storedSearch = JSON.parse(localStorage.getItem('lastSearch') || '{}');

    const savedInicio = urlParams.get('fechaInicio') || storedSearch.fechaInicio || storedSearch.fechainicio;
    const savedFin = urlParams.get('fechaFin') || storedSearch.fechaFin || storedSearch.fechaFin;
    const savedLoc = urlParams.get('localizacion') || storedSearch.localizacion;
    const savedTipo = urlParams.get('tipo') || storedSearch.tipo;

    const hoy = new Date().toISOString().split('T')[0];
    if (fechaInicioInput) fechaInicioInput.value = (savedInicio || hoy).split('T')[0];
    if (fechaFinInput) fechaFinInput.value = (savedFin || '').split('T')[0];

    let tipoInput = form.querySelector('input[name="tipo"]');
    if (!tipoInput) {
        tipoInput = document.createElement('input');
        tipoInput.type = 'hidden';
        tipoInput.name = 'tipo';
        form.appendChild(tipoInput);
    }

    cargarLocalizaciones(savedLoc);

    if (savedTipo) {
        const btn = [...tipoBotones].find(b => b.dataset.value === savedTipo);
        if (btn) {
            tipoBotones.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            tipoInput.value = savedTipo;
        }
        if (tipoSelectExtendido) tipoSelectExtendido.value = savedTipo;
    }

    tipoBotones.forEach(btn => {
        btn.addEventListener('click', () => {
            tipoBotones.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const selectedTipo = btn.dataset.value;
            tipoInput.value = selectedTipo;
            if (tipoSelectExtendido) tipoSelectExtendido.value = selectedTipo;
            localStorage.setItem('lastSearch', JSON.stringify({
                ...JSON.parse(localStorage.getItem('lastSearch') || '{}'),
                tipo: selectedTipo
            }));
        });
    });

    if (tipoSelectExtendido) {
        tipoSelectExtendido.addEventListener('change', () => {
            tipoInput.value = tipoSelectExtendido.value;
            tipoBotones.forEach(b => {
                if (b.dataset.value === tipoSelectExtendido.value) {
                    b.classList.add('selected');
                } else {
                    b.classList.remove('selected');
                }
            });
            localStorage.setItem('lastSearch', JSON.stringify({
                ...JSON.parse(localStorage.getItem('lastSearch') || '{}'),
                tipo: tipoSelectExtendido.value
            }));
        });
    }

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const fechaInicio = formData.get('fechaInicio');
        const fechaFin = formData.get('fechaFin');

        const hoyDate = new Date();
        hoyDate.setHours(0, 0, 0, 0);

        const fInicio = new Date(fechaInicio);
        const fFin = new Date(fechaFin);

        feedback.textContent = '';

        if (!fechaInicio || !fechaFin) {
            resultsContainer.innerHTML = `<p class="text-danger">⚠️ Debes seleccionar una fecha de recogida y una de devolución.</p>`;
            return;
        }

        if (fInicio < hoyDate) {
            resultsContainer.innerHTML = `<p class="text-danger">⚠️ La fecha de recogida no puede ser anterior a hoy.</p>`;
            return;
        }

        if (fFin <= fInicio) {
            resultsContainer.innerHTML = `<p class="text-danger">⚠️ La fecha de devolución debe ser posterior a la de recogida.</p>`;
            return;
        }

        const searchParams = {};
        for (let [key, value] of formData.entries()) {
            if (value) searchParams[key] = value;
        }

        localStorage.setItem('lastSearch', JSON.stringify(searchParams));

        const params = new URLSearchParams(searchParams);
        history.replaceState(null, '', `?${params.toString()}`);

        try {
            resultsContainer.innerHTML = '<p class="text-muted">Buscando vehículos disponibles...</p>';
            const vehicles = await searchVehicles(searchParams);
            renderResults(vehicles, searchParams);
        } catch (error) {
            resultsContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        }
    });

    if ([...urlParams.entries()].length > 0) {
        const params = Object.fromEntries(urlParams.entries());
        resultsContainer.innerHTML = '<p class="text-muted">Buscando vehículos disponibles...</p>';
        searchVehicles(params)
            .then(vehicles => renderResults(vehicles, params))
            .catch(error => {
                resultsContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
            });
    }

    restaurarTipoSeleccionado();

    function renderResults(vehicles, currentParams) {
        if (!resultsContainer) return;

        const fechaInicio = currentParams?.fechaInicio || '';
        const fechaFin = currentParams?.fechaFin || '';
        const tipo = currentParams?.tipo || '';

        resultsContainer.innerHTML = vehicles.length
            ? vehicles.map(vehicle => {
                const imagenUrl = vehicle.imagenUrl?.trim() || '/assets/images/default.png';
                const queryString = `matricula=${encodeURIComponent(vehicle.matricula)}&fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&tipo=${encodeURIComponent(tipo)}`;

                return `
                    <a href="../templates/car-detail.html?${queryString}" style="text-decoration: none;">
                        <div class="card mb-3 text-dark">
                            <div class="row g-0">
                                <div class="col-md-4">
                                    <img src="${imagenUrl}" class="img-fluid rounded-start" alt="Imagen de ${vehicle.modelo}">
                                </div>
                                <div class="col-md-8">
                                    <div class="card-body">
                                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                                        <p class="card-text">
                                            Transmisión: ${vehicle.transmision || 'N/A'}<br>
                                            Combustible: ${vehicle.combustible || 'N/A'}<br>
                                            Color: ${vehicle.color || 'N/A'}<br>
                                            Precio/día: ${vehicle.precioDia} €<br>
                                            Año: ${vehicle.anioMatricula?.split('/')?.pop() || 'N/A'}<br>
                                            Matrícula: ${vehicle.matricula}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }).join('')
            : '<p class="text-muted">No hay vehículos disponibles con esos criterios.</p>';
    }
});

async function cargarLocalizaciones(selected = '') {
    const selectLugar = document.querySelector('select[name="localizacion"]');
    if (!selectLugar) return;

    try {
        const localizaciones = await getLocalizaciones();
        selectLugar.innerHTML = '<option value="">Selecciona una localización</option>';
        localizaciones.forEach(loc => {
            const option = document.createElement('option');
            option.value = loc;
            option.textContent = loc;
            if (loc === selected) option.selected = true;
            selectLugar.appendChild(option);
        });
    } catch (error) {
        console.error('Error cargando localizaciones:', error);
        selectLugar.innerHTML = '<option value="">Error al cargar</option>';
    }
}

window.applyExtendedFilters = () => {
    const filterMenu = document.getElementById('filter-menu');
    const selects = filterMenu?.querySelectorAll('select') || [];
    const form = document.getElementById('search-form');

    selects.forEach(select => {
        if (select.name && !form.querySelector(`[name="${select.name}"]`)) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.name = select.name;
            form.appendChild(hiddenInput);
        }

        select.addEventListener('change', () => {
            const input = form.querySelector(`[name="${select.name}"]`);
            if (input) input.value = select.value;
        });
    });
};

applyExtendedFilters();
