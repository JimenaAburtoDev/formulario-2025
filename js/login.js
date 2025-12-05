// ==================== FUNCIÓN MOSTRAR/OCULTAR CONTRASEÑA ====================
// Esta función cambia el tipo de input entre "password" y "text"
// También cambia el icono del ojo
function togglePasswordVisibility() {
    // Obtener el elemento del input de contraseña
    const input = document.getElementById('contrasena');
    // Obtener el botón de mostrar/ocultar
    const button = document.getElementById('togglePassword');
    
    // Si el input está en modo contraseña, cambiar a texto (para ver la contraseña)
    if (input.type === 'password') {
        // Cambiar tipo a text (contraseña visible)
        input.type = 'text';
        // Cambiar icono a ojo tachado (indica que está visible)
        button.innerHTML = '<i class="fas fa-eye-slash"></i>';
    } else {
        // Si ya es visible, volver a ocultar
        input.type = 'password';
        // Cambiar icono a ojo (indica que está oculta)
        button.innerHTML = '<i class="fas fa-eye"></i>';
    }
}

// ==================== FUNCIÓN MOSTRAR NOTIFICACIÓN ====================
// Esta función muestra mensajes de notificación al usuario (toast)
function mostrarNotificacion(mensaje) {
    // Obtener el elemento del toast (notificación)
    const toast = document.getElementById('toastNotificacion');
    // Obtener el elemento donde va el texto del mensaje
    const toastMensaje = document.getElementById('toastMensaje');
    
    // Establecer el texto del mensaje
    toastMensaje.textContent = mensaje;
    // Crear una instancia de Toast de Bootstrap y mostrarla
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// ==================== MANEJADOR DE ENVÍO DE FORMULARIO ====================
// Este evento se dispara cuando el usuario hace clic en "Ingresar"
document.getElementById('loginForm').addEventListener('submit', function(e) {
    // Prevenir que el formulario se envíe de forma tradicional (recarga la página)
    e.preventDefault();
    
    // Obtener el valor del email y eliminar espacios al inicio/final
    const usuario = document.getElementById('usuario').value.trim();
    // Obtener el valor de la contraseña
    const contrasena = document.getElementById('contrasena').value;
    // Obtener si está marcado el checkbox "Recuérdame"
    const recuerdame = document.getElementById('recuerdame').checked;
    // Obtener el botón de envío
    const btnIngresar = document.querySelector('button[type="submit"]');
    
    // ==================== VALIDACIÓN ====================
    // Verificar que ambos campos tengan contenido
    if (!usuario || !contrasena) {
        // Si falta alguno, mostrar mensaje de error
        mostrarNotificacion('Por favor, completa todos los campos');
        return;  // Detener ejecución
    }
    
    // ==================== CAMBIO DE ESTADO DEL BOTÓN ====================
    // Desabilitar el botón para evitar múltiples clics
    btnIngresar.disabled = true;
    // Cambiar el texto del botón a "Verificando..." con spinner de carga
    btnIngresar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Verificando...';
    
    // ==================== CONSTRUCCIÓN DE LA URL DEL API ====================
    // Obtener el hostname del navegador (ejemplo: localhost, 192.168.1.1, etc)
    const host = window.location.hostname;
    // Obtener el puerto si existe, si no dejar vacío (usa puerto por defecto 80 o 443)
    const port = window.location.port ? ':' + window.location.port : '';
    // Construir la URL completa del API
    const apiUrl = `http://${host}${port}/api/login`;
    
    // ==================== ENVÍO DE CREDENCIALES AL SERVIDOR ====================
    // Usar fetch para hacer una solicitud HTTP POST al servidor
    fetch(apiUrl, {
        // Tipo de solicitud: POST (envía datos)
        method: 'POST',
        // Encabezados HTTP
        headers: {
            'Content-Type': 'application/json'  // Indicar que el body es JSON
        },
        // Body: convertir datos a JSON y enviar al servidor
        body: JSON.stringify({
            email: usuario,      // Email del usuario
            password: contrasena  // Contraseña del usuario
        })
    })
    // Convertir la respuesta a JSON
    .then(response => response.json())
    // Procesar la respuesta del servidor
    .then(data => {
        // Si el servidor responde con success: true, el login fue correcto
        if (data.success) {
            // ==================== LOGIN EXITOSO ====================
            
            // Si el usuario marcó "Recuérdame", guardar datos localmente
            if (recuerdame) {
                // Guardar el email en localStorage (persiste entre sesiones)
                localStorage.setItem('usuarioGuardado', usuario);
                // Marcar que hay una sesión activa
                localStorage.setItem('sesionActiva', 'true');
            }
            
            // ==================== CREAR SESIÓN ====================
            // Guardar el usuario en sessionStorage (persiste solo mientras el navegador está abierto)
            sessionStorage.setItem('usuarioLogeado', usuario);
            // Crear un token de sesión codificando el email y la hora actual
            sessionStorage.setItem('tokenSesion', btoa(usuario + ':' + new Date().getTime()));
            
            // Mostrar mensaje de éxito
            mostrarNotificacion('Iniciando sesión...');
            
            // Redirigir a la página principal después de 1 segundo
            setTimeout(() => {
                window.location.href = '/';  // Ir a la página principal (formulario.html)
            }, 1000);
        } else {
            // ==================== LOGIN FALLIDO ====================
            
            // Mostrar el mensaje de error que envió el servidor
            mostrarNotificacion(data.error || 'Usuario o contraseña incorrectos');
            
            // Volver a habilitar el botón para que el usuario pueda intentar de nuevo
            btnIngresar.disabled = false;
            // Restaurar el texto original del botón
            btnIngresar.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Ingresar';
            
            // Limpiar el campo de contraseña
            document.getElementById('contrasena').value = '';
            // Enfocar el campo de contraseña para que pueda escribir de nuevo
            document.getElementById('contrasena').focus();
        }
    })
    // Capturar errores de conexión al servidor
    .catch(error => {
        // Mostrar el error en la consola del navegador (para debugging)
        console.error('Error:', error);
        // Mostrar mensaje de error al usuario
        mostrarNotificacion('Error al conectar con el servidor');
        
        // Volver a habilitar el botón
        btnIngresar.disabled = false;
        // Restaurar el texto original del botón
        btnIngresar.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Ingresar';
        // Enfocar el campo de contraseña
        document.getElementById('contrasena').focus();
    });
});

// ==================== RESTAURAR USUARIO GUARDADO ====================
// Este evento se ejecuta cuando la página termina de cargar (DOMContentLoaded)
window.addEventListener('DOMContentLoaded', function() {
    // Obtener el usuario guardado del localStorage (si existe)
    const usuarioGuardado = localStorage.getItem('usuarioGuardado');
    // Si hay un usuario guardado previamente
    if (usuarioGuardado) {
        // Rellenar el campo de email con el usuario guardado
        document.getElementById('usuario').value = usuarioGuardado;
        // Marcar el checkbox "Recuérdame" automáticamente
        document.getElementById('recuerdame').checked = true;
        // Enfocar el campo de contraseña para que el usuario solo deba escribir la contraseña
        document.getElementById('contrasena').focus();
    }
});

// ==================== PERMITIR ENVIAR CON ENTER ====================
// Este evento permite que el usuario presione Enter en el campo de contraseña para enviar
document.getElementById('contrasena').addEventListener('keypress', function(e) {
    // Si la tecla presionada es Enter
    if (e.key === 'Enter') {
        // Simular un envío del formulario (dispara el evento submit)
        document.getElementById('loginForm').dispatchEvent(new Event('submit'));
    }
});