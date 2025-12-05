// ==================== VERIFICAR AUTENTICACIÓN AL CARGAR LA PÁGINA ====================
// Este evento se ejecuta cuando la página termina de cargar (DOMContentLoaded)
window.addEventListener('DOMContentLoaded', function() {
    // Llamar a la función que verifica si el usuario está autenticado
    verificarSesion();
});

// ==================== FUNCIÓN VERIFICAR SESIÓN ====================
// Esta función verifica si hay una sesión activa
// Si no la hay, redirige al usuario a la página de login
function verificarSesion() {
    // Obtener el usuario logeado del sessionStorage
    // sessionStorage solo persiste mientras el navegador esté abierto (diferente a localStorage)
    const usuarioLogeado = sessionStorage.getItem('usuarioLogeado');
    
    // Si no hay usuario en sesión (el usuario no está logeado)
    if (!usuarioLogeado) {
        // Redirigir a la página de login
        window.location.href = '/login';
        return;  // Detener la ejecución
    }
    
    // Si hay usuario logeado, mostrar su email en la barra de navegación
    // Obtener el elemento del navbar donde se muestra el nombre del usuario
    document.getElementById('usuarioActual').textContent = usuarioLogeado;
}

// ==================== FUNCIÓN CERRAR SESIÓN ====================
// Esta función cierra la sesión y redirige al login
function cerrarSesion() {
    // Mostrar diálogo de confirmación al usuario
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        // Eliminar los datos de sesión del sessionStorage
        // Eliminar el nombre del usuario
        sessionStorage.removeItem('usuarioLogeado');
        // Eliminar el token de sesión
        sessionStorage.removeItem('tokenSesion');
        
        // Redirigir a la página de login
        window.location.href = '/login';
    }
}