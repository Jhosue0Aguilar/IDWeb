const formulario = document.querySelector('#form-tarea');
const inputTitulo = document.querySelector('#titulo');
const inputCurso = document.querySelector('#curso');
const inputFecha = document.querySelector('#fechaEntrega');
const contenedorAlertas = document.querySelector('#alertas');
const listaTareas = document.querySelector('#lista-tareas');
const contenedorFiltros = document.querySelector('#filtros');
const resumen = document.querySelector('#resumen');

const Clave_Storage = 'tareasUniversitarias';

let tareas = cargarTareas();
let filtroActual = 'todas';

function cargarTareas() {
    try {
        const guardadas = JSON.parse(localStorage.getItem(CLAVE_STORAGE));
        return Array.isArray(guardadas) ? guardadas : [];
    } catch (error) {
        return [];
    }
}
 
function guardarTareas() {
    localStorage.setItem(Clave_Storage, JSON.stringify(tareas));
}
 
function obtenerHoy() {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
}
 
function formatearFecha(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}
 
function mostrarErrores(errores) {
    contenedorAlertas.innerHTML = '';
 
    if (errores.length === 0) return;
 
    const alerta = document.createElement('div');
    alerta.className = 'alert alert-danger';
    alerta.setAttribute('role', 'alert');
 
    const lista = document.createElement('ul');
    lista.className = 'mb-0 ps-3';
 
    errores.forEach((mensaje) => {
        const item = document.createElement('li');
        item.textContent = mensaje;
        lista.appendChild(item);
    });
 
    alerta.appendChild(lista);
    contenedorAlertas.appendChild(alerta);
}
 
function validarFormulario(titulo, curso, fechaEntrega) {
    const errores = [];
 
    if (!titulo) errores.push('El título no puede estar vacío.');
    if (!curso) errores.push('El curso no puede estar vacío.');
 
    if (!fechaEntrega) {
        errores.push('Debes seleccionar una fecha de entrega.');
    } 
    else if (fechaEntrega <= obtenerHoy()) {
        errores.push('La fecha de entrega debe ser posterior a la fecha actual.');
    }
 
    return errores;
}
 
formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
 
    const titulo = inputTitulo.value.trim();
    const curso = inputCurso.value.trim();
    const fechaEntrega = inputFecha.value;
 
    const errores = validarFormulario(titulo, curso, fechaEntrega);
    mostrarErrores(errores);
    if (errores.length > 0) return;
 
    const nuevaTarea = {
        id: Date.now(),
        titulo,
        curso,
        fechaEntrega,
        completada: false
    };
 
    tareas = [...tareas, nuevaTarea];
    guardarTareas();
 
    formulario.reset();
    inputTitulo.focus();
    renderizarTareas();
});
 
// ---------- Operaciones sobre el arreglo ----------
function alternarEstado(id) {
    const tarea = tareas.find((t) => t.id === id);
    if (!tarea) return;
 
    tareas = tareas.map((t) =>
        t.id === id ? { ...t, completada: !t.completada } : t
    );
    guardarTareas();
    renderizarTareas();
}
 
function eliminarTarea(id) {
    tareas = tareas.filter((t) => t.id !== id);
    guardarTareas();
    renderizarTareas();
}
 
function obtenerTareasFiltradas() {
    switch (filtroActual) {
        case 'pendientes':
            return tareas.filter((t) => !t.completada);
        case 'completadas':
            return tareas.filter((t) => t.completada);
        default:
            return tareas;
    }
}
 
function crearElementoTarea(tarea) {
    const li = document.createElement('li');
    li.className = 'list-group-item tarea';
    li.dataset.id = tarea.id;
    if (tarea.completada) li.classList.add('tarea--completada');
 
    const info = document.createElement('div');
    info.className = 'tarea__info';
 
    const titulo = document.createElement('p');
    titulo.className = 'tarea__titulo';
    titulo.textContent = tarea.titulo;
 
    const detalle = document.createElement('p');
    detalle.className = 'tarea__detalle';
    detalle.textContent = `${tarea.curso} · Entrega: ${formatearFecha(tarea.fechaEntrega)}`;

    if (!tarea.completada && tarea.fechaEntrega <= obtenerHoy()) {
        detalle.classList.add('tarea__detalle--vencida');
        detalle.textContent += ' (vencida)';
    }
 
    info.append(titulo, detalle);

    const acciones = document.createElement('div');
    acciones.className = 'tarea__acciones';
 
    const botonEstado = document.createElement('button');
    botonEstado.type = 'button';
    botonEstado.className = tarea.completada
        ? 'btn btn-sm btn-outline-secondary'
        : 'btn btn-sm btn-success';
    botonEstado.dataset.accion = 'alternar';
    botonEstado.textContent = tarea.completada ? 'Reabrir' : 'Completar';
 
    const botonEliminar = document.createElement('button');
    botonEliminar.type = 'button';
    botonEliminar.className = 'btn btn-sm btn-danger';
    botonEliminar.dataset.accion = 'eliminar';
    botonEliminar.textContent = 'Eliminar';
 
    acciones.append(botonEstado, botonEliminar);
    li.append(info, acciones);
 
    return li;
}
 
function actualizarResumen() {
    const completadas = tareas.reduce((total, t) => total + (t.completada ? 1 : 0), 0);
    const pendientes = tareas.length - completadas;
 
    resumen.textContent = tareas.length === 0
        ? ''
        : `Total: ${tareas.length} · Pendientes: ${pendientes} · Completadas: ${completadas}`;
}
 
function renderizarTareas() {
    listaTareas.innerHTML = '';
 
    const visibles = obtenerTareasFiltradas();
 
    if (visibles.length === 0) {
        const vacio = document.createElement('li');
        vacio.className = 'list-group-item tarea__vacia';
        vacio.textContent = tareas.length === 0
            ? 'Aún no tienes tareas. ¡Agrega la primera!'
            : 'No hay tareas en este filtro.';
        listaTareas.appendChild(vacio);
    } 
    else {
        [...visibles]
            .sort((a, b) => a.fechaEntrega.localeCompare(b.fechaEntrega))
            .forEach((tarea) => listaTareas.appendChild(crearElementoTarea(tarea)));
    }
 
    actualizarResumen();
}
 
listaTareas.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-accion]');
    if (!boton) return;
 
    const id = Number(boton.closest('li').dataset.id);
 
    if (boton.dataset.accion === 'alternar') alternarEstado(id);
    if (boton.dataset.accion === 'eliminar') eliminarTarea(id);
});
 
contenedorFiltros.addEventListener('click', (evento) => {
    const boton = evento.target.closest('button[data-filtro]');
    if (!boton) return;
 
    filtroActual = boton.dataset.filtro;
 
    contenedorFiltros.querySelectorAll('button').forEach((b) => {
        b.classList.toggle('active', b === boton);
    });
 
    renderizarTareas();
});
 
document.addEventListener('DOMContentLoaded', () => {
    inputFecha.min = obtenerHoy();
    renderizarTareas();
});