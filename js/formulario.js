// ==================== CONFIGURACIÓN DEL API ====================
// Obtener el hostname del navegador (ejemplo: localhost, 192.168.1.1, 3.236.244.8, etc)
const host = window.location.hostname;
// Obtener el puerto si existe, si no dejar vacío (usa puerto por defecto)
const port = window.location.port ? ':' + window.location.port : '';
// Construir la URL completa del API dinámicamente
// Esto permite que funcione en localhost, en EC2, o en cualquier otro servidor
const apiUrl = `http://${host}${port}/api/equipos`;

// Mostrar en consola la URL del API (útil para debugging)
console.log("URL de API:", apiUrl);

// ==================== VARIABLES GLOBALES ====================
// Variable para rastrear cuál equipo se está editando (null si se crea uno nuevo)
let editandoId = null;

// ==================== FUNCIÓN MOSTRAR NOTIFICACIONES ====================
// Esta función muestra mensajes de notificación tipo toast (esquina inferior derecha)
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Obtener el elemento del toast
    const toast = document.getElementById('toastNotificacion');
    // Obtener el elemento donde va el texto del mensaje
    const toastMensaje = document.getElementById('toastMensaje');
    // Obtener el header del toast (donde va el color)
    const toastHeader = toast.querySelector('.toast-header');
    
    // Establecer el texto del mensaje
    toastMensaje.textContent = mensaje;
    
    // Cambiar el color del header según el tipo de notificación
    // Resetear las clases
    toastHeader.className = 'toast-header text-white';
    // Agregar la clase según el tipo
    if (tipo === 'success') {
        // Verde para éxito
        toastHeader.classList.add('bg-success');
    } else if (tipo === 'error') {
        // Rojo para error
        toastHeader.classList.add('bg-danger');
    } else if (tipo === 'info') {
        // Azul para información
        toastHeader.classList.add('bg-info');
    }
    
    // Crear una instancia del Toast de Bootstrap y mostrarla
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// ==================== FUNCIÓN OBTENER BADGE DE ESTADO ====================
// Esta función devuelve HTML con un badge de color según el estado del equipo
function obtenerBadgeEstado(estado) {
    // Convertir el estado a minúsculas para comparación
    const estadoLower = (estado || '').toLowerCase();
    // Variable para guardar la clase CSS del badge
    let claseEstado = 'badge-activo';  // Por defecto, verde (Activo)
    
    // Determinar la clase según el estado
    if (estadoLower === 'inactivo') {
        claseEstado = 'badge-inactivo';  // Rojo
    } else if (estadoLower === 'mantenimiento') {
        claseEstado = 'badge-mantenimiento';  // Amarillo
    } else if (estadoLower === 'no disponible') {
        claseEstado = 'badge-inactivo';  // Rojo
    }
    
    // Retornar HTML con el badge de color
    return `<span class="badge-estado ${claseEstado}">${estado || 'N/A'}</span>`;
}

// ==================== FUNCIÓN LIMPIAR FORMULARIO ====================
// Esta función vacía todos los campos del formulario y resetea el estado
function limpiarFormulario() {
    // Resetear todos los campos del formulario a sus valores iniciales
    document.getElementById("formEquipo").reset();
    // Limpiar el ID del equipo (para nuevas inserciones)
    document.getElementById("equipoId").value = '';
    // Resetear la variable de edición
    editandoId = null;
    
    // Mostrar el botón "Guardar" (para crear nuevo equipo)
    document.getElementById("btnGuardar").style.display = 'block';
    // Ocultar el botón "Actualizar" (solo aparece cuando se edita)
    document.getElementById("btnActualizar").style.display = 'none';
    
    // Cambiar el título del formulario a "Registrar Nuevo Equipo"
    document.querySelector('.card-header h5').innerHTML = '<i class="fas fa-plus-circle me-2"></i>Registrar Nuevo Equipo';
}

// ==================== FUNCIÓN CARGAR EQUIPO EN FORMULARIO ====================
// Esta función rellena el formulario con los datos de un equipo existente para editarlo
function cargarEquipo(id, codigo, marca, so, ram, tipo, modelo, almacenamiento, estado, fechaMant, fechaReg) {
    // Guardar el ID del equipo que se está editando
    document.getElementById("equipoId").value = id;
    // Rellenar cada campo con los datos del equipo
    document.getElementById("codigo").value = codigo;
    document.getElementById("marca").value = marca || '';
    document.getElementById("so").value = so || '';
    document.getElementById("ram").value = ram || '';
    document.getElementById("tipo").value = tipo || '';
    document.getElementById("modelo").value = modelo || '';
    document.getElementById("almacenamiento").value = almacenamiento || '';
    document.getElementById("estado").value = estado || '';
    document.getElementById("fechaMant").value = fechaMant || '';
    document.getElementById("fechaReg").value = fechaReg || '';
    
    // Guardar el ID en la variable de edición
    editandoId = id;
    
    // Ocultar el botón "Guardar" (porque estamos editando, no creando)
    document.getElementById("btnGuardar").style.display = 'none';
    // Mostrar el botón "Actualizar" (para guardar cambios)
    document.getElementById("btnActualizar").style.display = 'block';
    
    // Cambiar el título del formulario a "Editar Equipo #XX"
    document.querySelector('.card-header h5').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Equipo #' + id;
    
    // Hacer scroll suave hasta el formulario para que el usuario lo vea
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== FUNCIÓN FORMATEAR FECHA ====================
// Esta función convierte fechas a formato ISO (YYYY-MM-DD)
function formatearFecha(fecha) {
    // Si la fecha es vacía, null, o "N/A", devolver "N/A"
    if (!fecha || fecha === 'null' || fecha === 'N/A') {
        return 'N/A';
    }
    try {
        // Crear un objeto Date a partir del string de fecha
        const date = new Date(fecha);
        // Verificar si la fecha es válida (isNaN devuelve true si no es un número válido)
        if (isNaN(date.getTime())) {
            return fecha; // Si no es válida, devolver como está
        }
        // Convertir a ISO format y devolver solo la parte de la fecha (sin la hora)
        return date.toISOString().split('T')[0];
    } catch (e) {
        // Si ocurre error, devolver la fecha como está
        return fecha;
    }
}

// ==================== FUNCIÓN LISTAR EQUIPOS ====================
// Esta función obtiene todos los equipos del servidor y los muestra en la tabla
function listarEquipos() {
    // Hacer petición GET al servidor para obtener todos los equipos
    fetch(apiUrl)
        .then(res => {
            // Mostrar el estado de la respuesta HTTP en consola (200, 404, 500, etc)
            console.log("Status:", res.status);
            // Convertir la respuesta a JSON
            return res.json();
        })
        .then(data => {
            // Mostrar los datos recibidos en consola para debugging
            console.log("Datos recibidos:", data);
            
            // Verificar si el servidor respondió con un error
            if (data.error) {
                // Mostrar el error en consola
                console.error("Error del servidor:", data.error);
                // Mostrar notificación de error al usuario
                mostrarNotificacion(`Error: ${data.error}`, 'error');
                // Si hay error pero hay datos, usar los datos del error
                data = data.equipos || [];
            }
            
            // Obtener el tbody de la tabla donde van los datos
            const tbody = document.querySelector("#tablaEquipos tbody");
            // Limpiar la tabla (vaciarla)
            tbody.innerHTML = "";
            
            // Verificar si no hay datos o si data no es un array
            if (!Array.isArray(data) || data.length === 0) {
                // Mostrar mensaje de "no hay datos"
                tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-5">No hay equipos registrados</td></tr>`;
                // Actualizar el contador de equipos
                document.getElementById('totalEquipos').textContent = '0';
                return;  // Detener ejecución
            }
            
            // Recorrer cada equipo y crear una fila en la tabla
            data.forEach((eq, index) => {
                // Crear un elemento de fila (tr)
                const tr = document.createElement("tr");
                // Agregar animación con delay (cada fila aparece con retraso)
                tr.style.animationDelay = `${index * 0.05}s`;
                
                // Formatear las fechas para mostrarlas correctamente
                // (la API devuelve fecha_mantenimiento y fecha_registro con guiones bajos)
                const fechaMant = formatearFecha(eq.fecha_mantenimiento);
                const fechaReg = formatearFecha(eq.fecha_registro);
                
                // Mostrar en consola para debugging
                console.log(`Equipo ${eq.id}:`, {fechaMant, fechaReg, raw: {fecha_mant: eq.fecha_mantenimiento, fecha_reg: eq.fecha_registro}});
                
                // Construir el HTML de la fila con los datos del equipo
                tr.innerHTML = `
                    <td><strong>${eq.id}</strong></td>
                    <td>${eq.codigo}</td>
                    <td>${eq.marca || 'N/A'}</td>
                    <td><span class="badge bg-info">${eq.tipo_equipo || 'N/A'}</span></td>
                    <td>${obtenerBadgeEstado(eq.estado)}</td>
                    <td><small><strong>${fechaMant}</strong></small></td>
                    <td><small><strong>${fechaReg}</strong></small></td>
                    <td>
                        <!-- Botón Editar: carga el equipo en el formulario -->
                        <button class="btn btn-sm btn-warning me-2" onclick="cargarEquipo(${eq.id}, '${(eq.codigo || '').replace(/'/g, "\\'")}', '${(eq.marca || '').replace(/'/g, "\\'")}', '${(eq.sistema_operativo || '').replace(/'/g, "\\'")}', '${(eq.ram || '').replace(/'/g, "\\'")}', '${(eq.tipo_equipo || '').replace(/'/g, "\\'")}', '${(eq.modelo || '').replace(/'/g, "\\'")}', '${(eq.almacenamiento || '').replace(/'/g, "\\'")}', '${(eq.estado || '').replace(/'/g, "\\'")}', '${eq.fecha_mantenimiento || ''}', '${eq.fecha_registro || ''}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <!-- Botón Eliminar: borra el equipo con confirmación -->
                        <button class="btn-delete" onclick="eliminarEquipo(${eq.id})">
                            <i class="fas fa-trash-alt"></i> Eliminar
                        </button>
                    </td>
                `;
                // Agregar la fila a la tabla
                tbody.appendChild(tr);
            });
            
            // Actualizar el contador de equipos totales
            document.getElementById('totalEquipos').textContent = data.length;
            
            // Animar las filas con animación de entrada
            const filas = document.querySelectorAll('#tablaEquipos tbody tr');
            filas.forEach(fila => {
                fila.style.animation = 'fadeInUp 0.5s ease-out';
            });
        })
        // Capturar errores de conexión (cuando no se puede llegar al servidor)
        .catch(error => {
            // Mostrar error en consola
            console.error('Error al obtener equipos:', error);
            // Mostrar notificación de error al usuario
            mostrarNotificacion(`Error de conexión: ${error.message}`, 'error');
            // Mostrar mensaje de error en la tabla
            const tbody = document.querySelector("#tablaEquipos tbody");
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-danger py-5">Error al cargar los equipos</td></tr>`;
        });
}

// ==================== FUNCIÓN GUARDAR EQUIPO (CREATE) ====================
// Esta función crea un nuevo equipo en la base de datos
function guardarEquipo(e) {
    // Prevenir que el formulario se envíe de forma tradicional
    e.preventDefault();
    
    // Obtener el código del equipo y eliminar espacios
    const codigo = document.getElementById("codigo").value.trim();
    // Validar que al menos el código esté llenado (es requerido)
    if (!codigo) {
        // Mostrar mensaje informativo
        mostrarNotificacion('Por favor, ingresa al menos el código del equipo', 'info');
        return;  // Detener ejecución
    }
    
    // Crear objeto con los datos del equipo desde el formulario
    const equipo = {
        codigo: codigo,
        marca: document.getElementById("marca").value || 'N/A',
        sistemaOperativo: document.getElementById("so").value || 'N/A',
        ram: document.getElementById("ram").value || 'N/A',
        fechaMantenimiento: document.getElementById("fechaMant").value || null,
        tipoEquipo: document.getElementById("tipo").value || 'N/A',
        modelo: document.getElementById("modelo").value || 'N/A',
        almacenamiento: document.getElementById("almacenamiento").value || 'N/A',
        estado: document.getElementById("estado").value || 'Activo',
        fechaRegistro: document.getElementById("fechaReg").value || new Date().toISOString().split('T')[0]
    };
    
    // Hacer petición POST para crear el equipo
    fetch(apiUrl, {
        method: "POST",  // POST = crear
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(equipo)  // Enviar el objeto como JSON
    })
    .then(response => {
        // Si la respuesta es exitosa (código 200-299)
        if (response.ok) {
            // Mostrar mensaje de éxito
            mostrarNotificacion('¡Equipo registrado exitosamente!', 'success');
            // Limpiar el formulario
            limpiarFormulario();
            // Recargar la lista de equipos
            listarEquipos();
        } else {
            // Si hay error, mostrar mensaje
            mostrarNotificacion('Error al registrar el equipo', 'error');
        }
    })
    .catch(error => {
        // Capturar errores de conexión
        console.error('Error:', error);
        mostrarNotificacion('Error en la conexión con el servidor', 'error');
    });
}

// ==================== FUNCIÓN ACTUALIZAR EQUIPO (UPDATE) ====================
// Esta función modifica un equipo existente en la base de datos
function actualizarEquipo() {
    // Obtener el ID del equipo que se está editando
    const id = document.getElementById("equipoId").value;
    // Obtener el código y eliminar espacios
    const codigo = document.getElementById("codigo").value.trim();
    
    // Validar que el código esté llenado
    if (!codigo) {
        mostrarNotificacion('Por favor, ingresa al menos el código del equipo', 'info');
        return;
    }
    
    // Crear objeto con los datos actualizados del equipo
    const equipo = {
        codigo: codigo,
        marca: document.getElementById("marca").value || 'N/A',
        sistemaOperativo: document.getElementById("so").value || 'N/A',
        ram: document.getElementById("ram").value || 'N/A',
        fechaMantenimiento: document.getElementById("fechaMant").value || null,
        tipoEquipo: document.getElementById("tipo").value || 'N/A',
        modelo: document.getElementById("modelo").value || 'N/A',
        almacenamiento: document.getElementById("almacenamiento").value || 'N/A',
        estado: document.getElementById("estado").value || 'Activo',
        fechaRegistro: document.getElementById("fechaReg").value || new Date().toISOString().split('T')[0]
    };
    
    // Hacer petición PUT para actualizar el equipo
    // Nota: ${apiUrl}/${id} → http://host:port/api/equipos/5 (por ejemplo)
    fetch(`${apiUrl}/${id}`, {
        method: "PUT",  // PUT = actualizar
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(equipo)  // Enviar el objeto actualizado como JSON
    })
    .then(response => {
        // Si la respuesta es exitosa
        if (response.ok) {
            // Mostrar mensaje de éxito
            mostrarNotificacion('¡Equipo actualizado correctamente!', 'success');
            // Limpiar el formulario
            limpiarFormulario();
            // Recargar la lista de equipos
            listarEquipos();
        } else {
            // Si hay error, mostrar mensaje
            mostrarNotificacion('Error al actualizar el equipo', 'error');
        }
    })
    .catch(error => {
        // Capturar errores de conexión
        console.error('Error:', error);
        mostrarNotificacion('Error en la conexión con el servidor', 'error');
    });
}

// ==================== FUNCIÓN ELIMINAR EQUIPO (DELETE) ====================
// Esta función borra un equipo de la base de datos
function eliminarEquipo(id) {
    // Mostrar diálogo de confirmación
    if (confirm('¿Estás seguro de que deseas eliminar este equipo?')) {
        // Hacer petición DELETE al servidor
        // Nota: ${apiUrl}/${id} → http://host:port/api/equipos/5 (por ejemplo)
        fetch(`${apiUrl}/${id}`, {method: "DELETE"})
            .then(response => {
                // Si la respuesta es exitosa
                if (response.ok) {
                    // Mostrar mensaje de éxito
                    mostrarNotificacion('¡Equipo eliminado correctamente!', 'success');
                    // Limpiar el formulario
                    limpiarFormulario();
                    // Recargar la lista de equipos
                    listarEquipos();
                } else {
                    // Si hay error, mostrar mensaje
                    mostrarNotificacion('Error al eliminar el equipo', 'error');
                }
            })
            .catch(error => {
                // Capturar errores de conexión
                console.error('Error:', error);
                mostrarNotificacion('Error en la conexión con el servidor', 'error');
            });
    }
}

// ==================== INICIALIZACIÓN DE LA APLICACIÓN ====================
// Este evento se ejecuta cuando la página termina de cargar (DOMContentLoaded)
document.addEventListener('DOMContentLoaded', function() {
    // Agregar event listener al formulario para envío (al hacer clic en Guardar)
    document.getElementById("formEquipo").addEventListener("submit", guardarEquipo);
    // Agregar event listener al botón Actualizar
    document.getElementById("btnActualizar").addEventListener("click", actualizarEquipo);
    // Cargar la lista de equipos cuando la página carga
    listarEquipos();
    
    // Auto-actualizar la lista cada 30 segundos (para ver cambios en tiempo real si otro usuario actualiza)
    setInterval(listarEquipos, 30000);
});
