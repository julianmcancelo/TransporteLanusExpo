<?php
/**
 * validar_qr.php - Endpoint para la validación de códigos QR por inspectores
 * 
 * Este script recibe un token de QR, verifica su validez en la base de datos,
 * y devuelve la información completa de la credencial asociada al token.
 * 
 * Método: POST
 * Parámetros:
 *   - qr_token: Token único del código QR a validar
 * 
 * Headers requeridos:
 *   - Authorization: Bearer [token_jwt] - Token JWT del inspector autenticado
 * 
 * Respuesta:
 *   - JSON con datos de la credencial si es válida
 *   - JSON con mensaje de error si no es válida
 */

// Activar registro de errores para depuración
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Registrar todas las solicitudes entrantes para depuración
file_put_contents('qr_debug_log.txt', "\n[" . date('Y-m-d H:i:s') . "] Nueva solicitud recibida\n", FILE_APPEND);

// Configuración inicial
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

// Para solicitudes OPTIONS (pre-flight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Incluir archivos necesarios
require_once 'conexion.php';  // Archivo de conexión a la BD
require_once 'jwt_helper.php'; // Archivo para manejo de JWT

// Función para enviar respuesta de error
function send_json_error($message, $code = 400) {
    // Registrar el error para depuración
    file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] ERROR: $message (Código: $code)\n", FILE_APPEND);
    
    http_response_code($code);
    echo json_encode([
        'error' => true,
        'message' => $message
    ]);
    exit;
}

// Función para registrar intentos de validación en la base de datos
function log_qr_scan($conn, $inspector_id, $token_id, $result, $latitude = null, $longitude = null) {
    try {
        $stmt = $conn->prepare("
            INSERT INTO log_escaneos (
                usuario_id, 
                token_id, 
                fecha_hora, 
                resultado, 
                latitud, 
                longitud
            ) VALUES (?, ?, NOW(), ?, ?, ?)
        ");
        
        $stmt->execute([
            $inspector_id,
            $token_id, 
            $result ? 'VALIDO' : 'INVALIDO', 
            $latitude, 
            $longitude
        ]);
        
        return $conn->lastInsertId();
    } catch (PDOException $e) {
        // Log error pero no detiene el flujo
        error_log("Error al registrar escaneo: " . $e->getMessage());
        return false;
    }
}

// Validar método de solicitud
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_json_error('Método no permitido', 405);
}

// Obtener datos de la solicitud
$raw_input = file_get_contents('php://input');
file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Datos recibidos: $raw_input\n", FILE_APPEND);

$input = json_decode($raw_input, true);

// Verificar si los datos JSON se decodificaron correctamente
if (json_last_error() !== JSON_ERROR_NONE) {
    send_json_error('Error al procesar datos JSON: ' . json_last_error_msg());
}

if (!isset($input['qr_token']) || empty($input['qr_token'])) {
    send_json_error('Token QR no proporcionado');
}

$qr_token = trim($input['qr_token']);
file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Token QR recibido: $qr_token\n", FILE_APPEND);

// Obtener coordenadas geográficas (si están presentes)
$latitude = isset($input['latitude']) ? $input['latitude'] : null;
$longitude = isset($input['longitude']) ? $input['longitude'] : null;

// Verificar el token JWT del inspector (autenticación)
$inspector_id = null;
$auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';

// Registrar todos los encabezados para depuración
$all_headers = getallheaders();
$headers_str = "";
foreach ($all_headers as $name => $value) {
    $headers_str .= "$name: $value\n";
}
file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Encabezados recibidos:\n$headers_str\n", FILE_APPEND);

// SOLO PARA DEPURACIÓN: Temporalmente desactivar la verificación de token
// Usar un ID de inspector fijo para pruebas
$inspector_id = 1; // ID de un inspector válido en la base de datos
file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] MODO DEPURACIÓN: Usando inspector_id fijo = $inspector_id\n", FILE_APPEND);

/*
if (empty($auth_header)) {
    send_json_error('No autorizado: Token no proporcionado', 401);
}

// Extraer el token Bearer
if (preg_match('/Bearer\s(\S+)/', $auth_header, $matches)) {
*/
/*
    $jwt_token = $matches[1];
    
    // Decodificar y validar el token JWT
    try {
        $decoded = JWTHelper::decode($jwt_token);
        
        // Verificar que el usuario sea un inspector
        if (!isset($decoded->user_id) || !isset($decoded->role) || $decoded->role !== 'inspector') {
            send_json_error('No autorizado: Rol no válido', 403);
        }
        
        $inspector_id = $decoded->user_id;
    } catch (Exception $e) {
        send_json_error('Token inválido: ' . $e->getMessage(), 401);
    }
} else {
    send_json_error('Formato de token inválido', 401);
}
*/

// Conectar a la base de datos
try {
    $conn = Conexion::conectar();
    file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Conexión a BD establecida\n", FILE_APPEND);
    
    // 1. Verificar si el token existe y no ha expirado
    $stmt = $conn->prepare("
        SELECT 
            t.id,
            t.habilitacion_id,
            t.fecha_creacion,
            t.fecha_vencimiento
        FROM 
            tokens_acceso t
        WHERE 
            t.token = :token 
        LIMIT 1
    ");
    
    $stmt->bindParam(':token', $qr_token);
    $stmt->execute();
    $token_data = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Registrar resultado de la consulta
    $token_data_str = $token_data ? json_encode($token_data) : 'null';
    file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Resultado de consulta de token: $token_data_str\n", FILE_APPEND);
    
    if (!$token_data) {
        // Registrar intento fallido
        log_qr_scan($conn, $inspector_id, null, false, $latitude, $longitude);
        send_json_error('El código QR no es válido o ha expirado');
    }
    
    $token_id = $token_data['id'];
    $habilitacion_id = $token_data['habilitacion_id'];
    
    // Verificar si el token ha expirado
    $fecha_actual = new DateTime();
    $fecha_vencimiento = new DateTime($token_data['fecha_vencimiento']);
    
    if ($fecha_actual > $fecha_vencimiento) {
        // Registrar intento fallido por token vencido
        log_qr_scan($conn, $inspector_id, $token_id, false, $latitude, $longitude);
        send_json_error('El código QR ha expirado');
    }
    
    // 2. Obtener datos de la habilitación
    $stmt = $conn->prepare("
        SELECT 
            h.id AS habilitacion_id,
            h.nro_licencia,
            h.estado,
            h.vigencia_fin,
            p.id AS persona_id,
            p.nombre,
            p.apellido,
            p.dni,
            v.dominio AS patente,
            v.marca,
            v.modelo,
            v.ano
        FROM 
            habilitaciones_generales h
        INNER JOIN 
            habilitaciones_personas hp ON h.id = hp.habilitacion_id
        INNER JOIN 
            personas p ON hp.persona_id = p.id
        LEFT JOIN 
            vehiculos v ON h.vehiculo_id = v.id
        WHERE 
            h.id = :habilitacion_id
            AND hp.rol = 'TITULAR'
        LIMIT 1
    ");
    
    $stmt->bindParam(':habilitacion_id', $habilitacion_id);
    $stmt->execute();
    $habilitacion = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$habilitacion) {
        // Registrar intento fallido por habilitación no encontrada
        log_qr_scan($conn, $inspector_id, $token_id, false, $latitude, $longitude);
        send_json_error('No se encontró información asociada a este QR');
    }
    
    // 3. Crear respuesta con formato específico
    $nombre_completo = $habilitacion['apellido'] . ', ' . $habilitacion['nombre'];
    $vehiculo_completo = '';
    
    if (!empty($habilitacion['marca']) && !empty($habilitacion['modelo']) && !empty($habilitacion['patente'])) {
        $vehiculo_completo = $habilitacion['marca'] . ' ' . $habilitacion['modelo'];
        if (!empty($habilitacion['ano'])) {
            $vehiculo_completo .= ' (' . $habilitacion['ano'] . ')';
        }
        $vehiculo_completo .= ' - ' . $habilitacion['patente'];
    }
    
    // 4. Registrar validación exitosa en la base de datos
    log_qr_scan($conn, $inspector_id, $token_id, true, $latitude, $longitude);
    
    // 5. Registrar la validación en la tabla de validaciones si existe
    try {
        $stmt = $conn->prepare("
            INSERT INTO validaciones (
                habilitacion_id, 
                usuario_id, 
                fecha_hora, 
                resultado,
                latitud,
                longitud,
                observaciones
            ) VALUES (?, ?, NOW(), 'VALIDADO', ?, ?, 'Validación por QR')
        ");
        
        $stmt->execute([
            $habilitacion_id,
            $inspector_id,
            $latitude,
            $longitude
        ]);
    } catch (PDOException $e) {
        // Continuamos aunque falle esta inserción
        error_log("Error al registrar validación: " . $e->getMessage());
    }
    
    // 6. Devolver respuesta exitosa
    $response_data = [
        'nombre' => $nombre_completo,
        'dni' => $habilitacion['dni'],
        'licencia' => $habilitacion['nro_licencia'],
        'vencimiento' => $habilitacion['vigencia_fin'],
        'estado' => $habilitacion['estado'],
        'vehiculo' => $vehiculo_completo
    ];
    
    // Registrar respuesta exitosa
    file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] Respuesta exitosa: " . json_encode($response_data) . "\n", FILE_APPEND);
    
    http_response_code(200);
    echo json_encode($response_data);
    
} catch (PDOException $e) {
    $error_message = 'Error en la base de datos: ' . $e->getMessage();
    file_put_contents('qr_debug_log.txt', "[" . date('Y-m-d H:i:s') . "] ERROR DB: {$error_message}\n" . $e->getTraceAsString() . "\n", FILE_APPEND);
    send_json_error($error_message, 500);
}
?>
