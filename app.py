# Importar módulos necesarios de Flask para crear servidor web
from flask import Flask, request, jsonify, send_from_directory
# Importar CORS para permitir solicitudes desde diferentes dominios
from flask_cors import CORS
# Importar módulos de fecha y hora para manejar datos temporales
from datetime import datetime, date
# Importar conector de MySQL para conectarse a la base de datos
import mysql.connector
# Importar Decimal para manejar números decimales
from decimal import Decimal
# Importar JSON para serializar datos
import json

# Crear la aplicación Flask especificando la carpeta de archivos estáticos (HTML, CSS, JS)
app = Flask(__name__, static_folder="static")
# Habilitar CORS para que el navegador pueda hacer solicitudes desde otros orígenes
CORS(app)

# Clase personalizada para serializar objetos especiales a JSON
# Esta clase extiende JSONEncoder para convertir tipos de datos que JSON no soporta nativamente
class DateTimeEncoder(json.JSONEncoder):
    # Método que define cómo convertir objetos a JSON
    def default(self, obj):
        # Si el objeto es una fecha (date), convertirlo a formato ISO (YYYY-MM-DD)
        if isinstance(obj, date):
            return obj.isoformat()
        # Si el objeto es una fecha con hora (datetime), convertirlo a formato ISO (YYYY-MM-DD HH:MM:SS)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        # Si el objeto es un número decimal, convertirlo a string para evitar problemas de precisión
        elif isinstance(obj, Decimal):
            return str(obj)
        # En caso contrario, usar el método por defecto del JSONEncoder
        return super().default(obj)

# ==================== CONFIGURACIÓN DE BASE DE DATOS ====================
# Diccionario con las credenciales para conectarse a la base de datos MySQL en AWS RDS
db_config = {
    'host': 'computadora.chskcq2cswec.us-east-1.rds.amazonaws.com',  # Dirección del servidor de base de datos en la nube
    'user': 'admin',  # Usuario de la base de datos
    'password': '123456789jimena',  # Contraseña del usuario
    'database': 'computadora'  # Nombre de la base de datos a usar
}

# Función para establecer conexión con la base de datos
def get_db_connection():
    try:
        # Intentar conectarse a MySQL usando las credenciales configuradas
        conn = mysql.connector.connect(**db_config)
        return conn
    except mysql.connector.Error as err:
        # Si hay error, mostrarlo en consola y retornar None
        print(f"Error de conexión: {err}")
        return None

# ==================== RUTAS FRONTEND ====================
# Ruta raíz: cuando el usuario accede a /, se sirve la página principal (formulario.html)
@app.route('/')
def index():
    # Enviar el archivo formulario.html desde la carpeta static
    return send_from_directory(app.static_folder, 'formulario.html')

# Ruta para la página de login: cuando acceden a /login, se sirve login.html
@app.route('/login')
def login():
    # Enviar el archivo login.html desde la carpeta static
    return send_from_directory(app.static_folder, 'login.html')

# Ruta para servir archivos CSS dinámicamente
# Por ejemplo: /css/formulario.css → sirve la carpeta css/formulario.css
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('css', filename)

# Ruta para servir archivos JavaScript dinámicamente
# Por ejemplo: /js/formulario.js → sirve la carpeta js/formulario.js
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('js', filename)

# Ruta para servir imágenes dinámicamente
# Por ejemplo: /img/fondo.jpg → sirve la carpeta img/fondo.jpg
@app.route('/img/<path:filename>')
def serve_img(filename):
    return send_from_directory('img', filename)

# ==================== RUTAS API ====================
# ENDPOINT DE LOGIN - Validar credenciales contra la base de datos
# Tipo: POST (envía datos al servidor)
# URL: /api/login
@app.route('/api/login', methods=['POST'])
def api_login():
    # Obtener los datos JSON que envía el cliente (email y contraseña)
    data = request.get_json()
    # Extraer el email del JSON
    email = data.get('email')
    # Extraer la contraseña del JSON
    password = data.get('password')
    
    # Validar que ambos campos tengan contenido
    if not email or not password:
        # Si falta alguno, retornar error 400 (Bad Request)
        return jsonify({"error": "Email y contraseña requeridos"}), 400
    
    try:
        # Intentar conectarse a la base de datos
        conn = get_db_connection()
        # Si la conexión falla, retornar error 500 (Server Error)
        if not conn:
            return jsonify({"error": "No se pudo conectar a la base de datos"}), 500
        
        # Crear un cursor para ejecutar comandos SQL
        # dictionary=True devuelve los resultados como diccionarios (más fácil de usar)
        cursor = conn.cursor(dictionary=True)
        # Ejecutar una consulta para buscar un usuario con ese email y contraseña
        # El % se reemplaza con los valores de la tupla para evitar inyección SQL
        cursor.execute("SELECT * FROM usuarios WHERE email = %s AND password = %s", (email, password))
        # Obtener solo el primer resultado (fetchone) o None si no existe
        usuario = cursor.fetchone()
        # Cerrar el cursor
        cursor.close()
        # Cerrar la conexión a la base de datos
        conn.close()
        
        # Si el usuario fue encontrado, el login es exitoso
        if usuario:
            # Retornar respuesta exitosa con el email del usuario (código 200)
            return jsonify({"success": True, "usuario": email}), 200
        else:
            # Si no fue encontrado, retornar error de autenticación (código 401)
            return jsonify({"error": "Email o contraseña incorrectos"}), 401
    
    # Capturar cualquier excepción que ocurra
    except Exception as e:
        # Mostrar el error en la consola para debugging
        print(f"Error en login: {str(e)}")
        # Retornar el error al cliente
        return jsonify({"error": str(e)}), 500

# ENDPOINT LISTAR EQUIPOS - Obtener todos los equipos de la base de datos
# Tipo: GET (solo obtiene datos, no modifica)
# URL: /api/equipos
@app.route('/api/equipos', methods=['GET'])
def listar_equipos():
    try:
        # Conectar a la base de datos
        conn = get_db_connection()
        # Si la conexión falla, retornar error
        if not conn:
            print("No se pudo conectar a la base de datos")
            return jsonify({"error": "No se pudo conectar a la base de datos", "equipos": []}), 500

        # Crear cursor para ejecutar comandos SQL
        cursor = conn.cursor(dictionary=True)
        # Ejecutar comando SELECT para obtener todos los registros de la tabla equipos
        cursor.execute("SELECT * FROM equipos")
        # Obtener todos los resultados en una lista
        equipos = cursor.fetchall()
        
        # Convertir fechas de MySQL a formato ISO (YYYY-MM-DD)
        # MySQL devuelve objetos date, pero JSON no sabe cómo serializarlos
        for equipo in equipos:
            # Verificar si existe el campo fecha_mantenimiento y no es None
            if 'fecha_mantenimiento' in equipo and equipo['fecha_mantenimiento'] is not None:
                # Verificar que sea un objeto date de Python
                if isinstance(equipo['fecha_mantenimiento'], date):
                    # Convertir a string ISO
                    equipo['fecha_mantenimiento'] = equipo['fecha_mantenimiento'].isoformat()
            # Hacer lo mismo para fecha_registro
            if 'fecha_registro' in equipo and equipo['fecha_registro'] is not None:
                if isinstance(equipo['fecha_registro'], date):
                    equipo['fecha_registro'] = equipo['fecha_registro'].isoformat()
        
        # Cerrar el cursor
        cursor.close()
        # Cerrar la conexión a la base de datos
        conn.close()
        
        # Mostrar en consola cuántos equipos se cargaron (para debugging)
        print(f"Equipos cargados: {len(equipos)}")
        # Retornar la lista de equipos en formato JSON
        return jsonify(equipos)
    
    # Capturar errores
    except Exception as e:
        # Mostrar el error en consola
        print(f"Error en listar_equipos: {str(e)}")
        # Retornar error al cliente
        return jsonify({"error": str(e), "equipos": []}), 500

# ENDPOINT CREAR EQUIPO - Agregar un nuevo equipo a la base de datos
# Tipo: POST (envía datos al servidor para crear)
# URL: /api/equipos
@app.route('/api/equipos', methods=['POST'])
def crear_equipo():
    # Obtener los datos JSON que envía el cliente (datos del nuevo equipo)
    data = request.get_json()
    # Conectar a la base de datos
    conn = get_db_connection()
    # Si la conexión falla, retornar error
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    # Crear cursor para ejecutar comandos SQL
    cursor = conn.cursor()
    # Comando SQL para insertar un nuevo equipo con todos sus campos
    query = """
        INSERT INTO equipos (codigo, marca, sistema_operativo, ram, fecha_mantenimiento,
                             tipo_equipo, modelo, almacenamiento, estado, fecha_registro)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """
    # Tupla con los valores que se insertarán (del JSON recibido)
    # Si no viene fecha_registro, usar la fecha actual
    values = (
        data.get("codigo"),  # Código del equipo
        data.get("marca"),  # Marca del equipo
        data.get("sistemaOperativo"),  # Sistema operativo
        data.get("ram"),  # Memoria RAM
        data.get("fechaMantenimiento"),  # Fecha de última mantención
        data.get("tipoEquipo"),  # Tipo (Laptop, Desktop, etc)
        data.get("modelo"),  # Modelo del equipo
        data.get("almacenamiento"),  # Capacidad de almacenamiento
        data.get("estado"),  # Estado (Activo, Inactivo, etc)
        data.get("fechaRegistro") or datetime.now().strftime("%Y-%m-%d")  # Fecha de registro
    )
    try:
        # Ejecutar el comando INSERT con los valores
        cursor.execute(query, values)
        # Confirmar los cambios en la base de datos
        conn.commit()
        # Obtener el ID del equipo que se acaba de crear
        equipo_id = cursor.lastrowid
        # Cerrar cursor
        cursor.close()
        # Cerrar conexión
        conn.close()
        # Retornar el ID del nuevo equipo con código 201 (Created)
        return jsonify({"id": equipo_id}), 201
    except mysql.connector.Error as err:
        # Si hay error en la base de datos, mostrarlo
        print(err)
        # Retornar error al cliente
        return jsonify({"error": "Error al insertar"}), 500

# ENDPOINT ELIMINAR EQUIPO - Borrar un equipo de la base de datos
# Tipo: DELETE (elimina datos)
# URL: /api/equipos/<id> (donde <id> es el ID del equipo a eliminar)
@app.route('/api/equipos/<int:id>', methods=['DELETE'])
def eliminar_equipo(id):
    # Conectar a la base de datos
    conn = get_db_connection()
    # Si la conexión falla, retornar error
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    # Crear cursor para ejecutar comandos SQL
    cursor = conn.cursor()
    try:
        # Ejecutar comando DELETE para eliminar el equipo con el ID especificado
        cursor.execute("DELETE FROM equipos WHERE id = %s", (id,))
        # Confirmar los cambios en la base de datos
        conn.commit()
        # Cerrar cursor
        cursor.close()
        # Cerrar conexión
        conn.close()
        # Retornar mensaje de éxito con código 200
        return jsonify({"message": "Equipo eliminado"}), 200
    except mysql.connector.Error as err:
        # Si hay error, mostrarlo
        print(err)
        # Retornar error al cliente
        return jsonify({"error": "Error al eliminar"}), 500

# ENDPOINT ACTUALIZAR EQUIPO - Modificar un equipo existente
# Tipo: PUT (modifica datos existentes)
# URL: /api/equipos/<id> (donde <id> es el ID del equipo a actualizar)
@app.route('/api/equipos/<int:id>', methods=['PUT'])
def actualizar_equipo(id):
    # Obtener los datos JSON que envía el cliente (campos actualizados)
    data = request.get_json()
    # Conectar a la base de datos
    conn = get_db_connection()
    # Si la conexión falla, retornar error
    if not conn:
        return jsonify({"error": "DB connection failed"}), 500

    # Crear cursor para ejecutar comandos SQL
    cursor = conn.cursor()
    # Comando SQL para actualizar todos los campos del equipo
    query = """UPDATE equipos 
               SET codigo=%s, marca=%s, sistema_operativo=%s, ram=%s, 
                   fecha_mantenimiento=%s, tipo_equipo=%s, modelo=%s, 
                   almacenamiento=%s, estado=%s, fecha_registro=%s
               WHERE id=%s"""
    # Tupla con los valores nuevos que se actualizarán
    values = (
        data.get("codigo"),  # Código actualizado
        data.get("marca"),  # Marca actualizada
        data.get("sistemaOperativo"),  # Sistema operativo actualizado
        data.get("ram"),  # RAM actualizada
        data.get("fechaMantenimiento") or None,  # Fecha de mantención (opcional)
        data.get("tipoEquipo"),  # Tipo actualizado
        data.get("modelo"),  # Modelo actualizado
        data.get("almacenamiento"),  # Almacenamiento actualizado
        data.get("estado"),  # Estado actualizado
        data.get("fechaRegistro") or datetime.now().strftime("%Y-%m-%d"),  # Fecha actualizada
        id  # ID del equipo a actualizar (va en el WHERE)
    )
    try:
        # Ejecutar el comando UPDATE con los nuevos valores
        cursor.execute(query, values)
        # Confirmar los cambios en la base de datos
        conn.commit()
        # Cerrar cursor
        cursor.close()
        # Cerrar conexión
        conn.close()
        # Retornar mensaje de éxito con código 200
        return jsonify({"message": "Equipo actualizado"}), 200
    except mysql.connector.Error as err:
        # Si hay error, mostrarlo
        print(err)
        # Retornar error al cliente
        return jsonify({"error": "Error al actualizar"}), 500

# ==================== EJECUCIÓN DEL SERVIDOR ====================
# Este código solo se ejecuta si el archivo es ejecutado directamente (no importado)
if __name__ == "__main__":
    # Ejecutar el servidor Flask:
    # host="0.0.0.0" → Escucha en todas las interfaces de red (necesario para EC2)
    # port=5000 → Puerto donde escucha (se puede cambiar según necesidad)
    # debug=True → Modo debug activado (reinicia servidor al detectar cambios, muestra errores detallados)
    app.run(host="0.0.0.0", port=5000, debug=True)
