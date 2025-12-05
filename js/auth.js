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

// ==================== FUNCIÓN INICIAR SESIÓN ====================
// Esta función se ejecuta cuando el usuario envía el formulario de login
function iniciarSesion(event) {
    event.preventDefault(); // Evitar que la página se recargue

    // Obtener los valores de usuario y contraseña
    const usuario = document.getElementById('usuario').value;
    const contrasena = document.getElementById('contrasena').value;

    // Validar que los campos no estén vacíos
    if (!usuario || !contrasena) {
        mostrarMensajeError('Por favor, ingresa tu usuario y contraseña.');
        return;
    }

    // Simular autenticación (puedes reemplazar esto con una llamada a tu API)
    if (usuario === 'admin' && contrasena === '1234') {
        // Guardar el usuario en sessionStorage
        sessionStorage.setItem('usuarioLogeado', usuario);

        // Redirigir a la página principal
        window.location.href = '/';
    } else {
        mostrarMensajeError('Usuario o contraseña incorrectos.');
    }
}

// ==================== FUNCIÓN PARA MOSTRAR MENSAJE DE ERROR ====================
function mostrarMensajeError(mensaje) {
    const errorDiv = document.getElementById('errorMensaje');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    }
}

// ==================== FUNCIÓN PARA MOSTRAR/OCULTAR CONTRASEÑA ====================
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function () {
        const passwordField = document.getElementById('contrasena');
        const type = passwordField.type === 'password' ? 'text' : 'password';
        passwordField.type = type;
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
}

// ==================== EVENTO PARA EL FORMULARIO ====================
// Asociar la función iniciarSesion al evento submit del formulario
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', iniciarSesion);
}