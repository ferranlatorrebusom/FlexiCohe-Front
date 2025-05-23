import { searchVehicles, getLocalizaciones, getVehiculos,eliminarVehiculoPorMatricula } from '../api/vehicle.api.js';
import { authUtils } from '../utils/auth.utils.js';
import { API_BASE } from '../utils/config.js';

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

    await cargarFiltrosDinamicos();

    restaurarFiltrosExtendidos();

    const userRol = localStorage.getItem('userRol');
    const logo = document.querySelector('.logo-link');

    if (userRol === 'ADMIN') {
        document.querySelector('.btn-create')?.classList.remove('d-none');
        logo.href= `${API_BASE}/templates/index-admin.html`;
    } else {
        document.querySelector('.btn-create')?.classList.add('d-none');
        logo.href= `${API_BASE}/index.html`;
    }

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
        const precioMax = document.querySelector('input[name="precioMax"]')?.value || '';
            
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

        if (precioMax) searchParams['precioMax'] = precioMax;

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
        try {
            const vehicles = await searchVehicles(params);
            renderResults(vehicles, params);
        } catch (error) {
            resultsContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
        }
    }

    restaurarTipoSeleccionado();

    function renderResults(vehicles, currentParams) {
        if (!resultsContainer) return;

        const userRol = localStorage.getItem('userRol');

        const fechaInicio = currentParams?.fechaInicio || '';
        const fechaFin = currentParams?.fechaFin || '';
        const tipo = currentParams?.tipo || 'COCHE';
    
        const precioMax = parseFloat(currentParams.precioMax || Infinity);
    
        const filtrados = vehicles.filter(vehicle => {
            const precio = parseFloat(vehicle.precioDia);
            const plazas = parseInt(vehicle.nplazas);

            if (isNaN(precio)) return false;
    

            if (!isNaN(precioMax) && precio > precioMax) {
                console.log(`Excluido ${vehicle.marca} ${vehicle.modelo} por precio > precioMax`);
                return false;
            }

            if (currentParams.nplazas) {
                const nplazasFiltro = parseInt(currentParams.nplazas);
                if (plazas !== nplazasFiltro) {
                    console.log(`Excluido ${vehicle.marca} ${vehicle.modelo} por nplazas distinto (${plazas} vs ${nplazasFiltro})`);
                    return false;
                }
            }
            return true;
        });
    
        resultsContainer.innerHTML = filtrados.length
            ? filtrados.map(vehicle => {     
                const imagenUrl = vehicle.imagenUrl?.trim();
                
                const queryString = `matricula=${encodeURIComponent(vehicle.matricula)}&fechaInicio=${encodeURIComponent(fechaInicio)}&fechaFin=${encodeURIComponent(fechaFin)}&tipo=${encodeURIComponent(tipo)}`;
                const botonesAdmin = userRol === 'ADMIN'
                ? `<div class="d-flex justify-content-center gap-2 mt-2">
                    <a href="${API_BASE}/templates/car-data-edit.html?matricula=${encodeURIComponent(vehicle.matricula)}" class="btn btn-warning btn-sm">Editar Vehículo</a>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-matricula="${vehicle.matricula}">Eliminar Vehículo</button>
                    </div>`
                : '';
                
                return `
                    <a href="../templates/car-detail.html?${queryString}" style="text-decoration: none;">
                        <div class="card mb-3 text-dark">
                            <div class="row g-0">
                                <div class="col-md-4">
                                    <img src="${imagenUrl}" class="img-fluid rounded-start" alt="Imagen de ${vehicle.marca} ${vehicle.modelo}">
                                    ${botonesAdmin}
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
                                            Matrícula: ${vehicle.matricula}<br>
                                            Localización: ${vehicle.localizacion}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </a>
                `;
            }).join('')
            : '<p class="text-muted">No hay vehículos disponibles con esos criterios.</p>';
            
            document.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const matricula = e.currentTarget.dataset.matricula;
                    const confirmar = confirm("¿Estás seguro de que deseas eliminar este vehículo?");
                    if (!confirmar) return;

                    try {
                        await eliminarVehiculoPorMatricula(matricula);
                        alert('Vehículo eliminado correctamente.');
                        location.reload();

                    } catch (err) {
                        console.error(err);
                        alert('Error al eliminar el vehículo.');
                    }
                });
            });

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

async function cargarFiltrosDinamicos() {
    try {
        const vehiculos = await getVehiculos();

        rellenarSelect('marca', vehiculos.map(v => v.marca));
        rellenarSelect('modelo', vehiculos.map(v => v.modelo));
        rellenarSelect('color', vehiculos.map(v => v.color));
        rellenarSelect('transmision', vehiculos.map(v => v.transmision));
        rellenarSelect('combustible', vehiculos.map(v => v.combustible?.toString()));
        rellenarSelect('nplazas', vehiculos.map(v => v.nplazas?.toString()));
    } catch (error) {
        console.error('Error al cargar filtros dinámicos:', error);
    }
}

function rellenarSelect(nombreCampo, valores) {
    const select = document.querySelector(`select[name="${nombreCampo}"]`);
    if (!select) return;

    const valoresUnicos = [...new Set(valores.filter(Boolean))];

    select.innerHTML = '<option value="">-</option>';
    valoresUnicos.forEach(valor => {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = valor;
        select.appendChild(option);
    });
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

function restaurarFiltrosExtendidos() {
    const stored = JSON.parse(localStorage.getItem('lastSearch') || '{}');
    const filterMenu = document.getElementById('filter-menu');
    if (!filterMenu) return;

    const selects = filterMenu.querySelectorAll('select');

    selects.forEach(select => {
        const savedValue = stored[select.name];
        if (savedValue) {
            select.value = savedValue;
        }
    });
}

async function ejecutarBusquedaConFiltros(params) {
    resultsContainer.innerHTML = '<p class="text-muted">Buscando vehículos disponibles...</p>';
    try {
        const vehicles = await searchVehicles(params);
        renderResults(vehicles, params);
    } catch (error) {
        resultsContainer.innerHTML = `<p class="text-danger">Error: ${error.message}</p>`;
    }
}