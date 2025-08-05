<?php
// Permitir solicitudes desde cualquier origen (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar la solicitud de pre-vuelo (preflight) de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- 1. INCLUIR LA CONEXIÓN A LA BASE DE DATOS ---
require 'conexion.php';

// --- 2. VERIFICAR TOKEN DE AUTENTICACIÓN ---
// Esta función decodifica el token JWT y devuelve los datos del usuario o false si es inválido
function verificarToken($token) {
    if (empty($token)) {
        return false;
    }

    $secret_key = "TU_CLAVE_SECRETA_SUPER_SEGURA"; // Debe ser la misma que en internal_login.php
    $token_parts = explode(".", $token);
    
    if (count($token_parts) != 3) {
        return false;
    }

    $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[0]));
    $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $token_parts[1]));
    $signature_provided = $token_parts[2];

    $base64_url_header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
    $base64_url_payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
    $signature = hash_hmac('sha256', $base64_url_header . "." . $base64_url_payload, $secret_key, true);
    $base64_url_signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

    if ($base64_url_signature !== $signature_provided) {
        return false;
    }

    $payload_data = json_decode($payload, true);
    
    // Verificar expiración
    if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
        return false;
    }

    return $payload_data['data'];
}

// --- 3. OBTENER DATOS DE LA SOLICITUD ---
$request_method = $_SERVER["REQUEST_METHOD"];
$data = null;

// Para solicitudes POST, obtener datos del cuerpo
if ($request_method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
}

// --- 4. VERIFICAR ACCIÓN SOLICITADA ---
$action = isset($_GET['action']) ? $_GET['action'] : 
          (isset($data->action) ? $data->action : null);

// Obtener token
$token = isset($_GET['token']) ? $_GET['token'] : 
         (isset($data->token) ? $data->token : null);

// Verificar el token y obtener datos del usuario
$user_data = verificarToken($token);

// Si el token no es válido, devolver error
if (!$user_data) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Token no válido o expirado.'
    ]);
    exit;
}

// Solo los usuarios master pueden gestionar usuarios administrativos
if ($user_data['rol'] !== 'master') {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'No tienes permisos para realizar esta acción.'
    ]);
    exit;
}

// --- 5. PROCESAR LA ACCIÓN SOLICITADA ---
switch ($action) {
    case 'list':
        listUsers();
        break;
    case 'create':
        createUser($data);
        break;
    case 'update_status':
        updateUserStatus($data);
        break;
    case 'delete':
        deleteUser($data);
        break;
    default:
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Acción no válida.'
        ]);
        break;
}

// --- 6. IMPLEMENTACIÓN DE FUNCIONES DE ACCIÓN ---

/**
 * Lista todos los usuarios administrativos
 */
function listUsers() {
    global $pdo;
    
    try {
        // Seleccionamos todos los campos excepto la contraseña
        $sql = "SELECT id, nombre, usuario, email, telefono, rol, estado, ultimo_acceso FROM admin ORDER BY nombre";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Formatear los datos para cumplir con la estructura de la API
        $formatted_users = array_map(function($user) {
            return [
                'id' => intval($user['id']),
                'nombre' => $user['nombre'],
                'usuario' => $user['usuario'],
                'rol' => $user['rol'],
                'email' => $user['email'],
                'telefono' => $user['telefono'],
                'estado' => $user['estado'],
                'ultimoAcceso' => $user['ultimo_acceso']
            ];
        }, $users);
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $formatted_users,
            'message' => 'Usuarios administrativos cargados correctamente.'
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        // error_log($e->getMessage()); // Registrar error en logs
        echo json_encode([
            'success' => false,
            'message' => 'Error al cargar usuarios administrativos.'
        ]);
    }
}

/**
 * Crea un nuevo usuario administrativo
 */
function createUser($data) {
    global $pdo;
    
    // Verificar datos obligatorios
    if (empty($data->userData->nombre) || empty($data->userData->usuario) || 
        empty($data->userData->password) || empty($data->userData->rol)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos obligatorios.'
        ]);
        return;
    }
    
    try {
        // Verificar si el usuario ya existe
        $check_sql = "SELECT COUNT(*) FROM admin WHERE usuario = :usuario";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute(['usuario' => $data->userData->usuario]);
        
        if ($check_stmt->fetchColumn() > 0) {
            http_response_code(409); // Conflict
            echo json_encode([
                'success' => false,
                'message' => 'El nombre de usuario ya existe.'
            ]);
            return;
        }
        
        // Hashear contraseña
        $password_hash = password_hash($data->userData->password, PASSWORD_DEFAULT);
        
        // Insertar nuevo usuario
        $sql = "INSERT INTO admin (nombre, usuario, password, email, telefono, rol, estado) 
                VALUES (:nombre, :usuario, :password, :email, :telefono, :rol, :estado)";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            'nombre' => $data->userData->nombre,
            'usuario' => $data->userData->usuario,
            'password' => $password_hash,
            'email' => $data->userData->email ?? null,
            'telefono' => $data->userData->telefono ?? null,
            'rol' => $data->userData->rol,
            'estado' => $data->userData->estado ?? 'activo'
        ]);
        
        $new_user_id = $pdo->lastInsertId();
        
        http_response_code(201); // Created
        echo json_encode([
            'success' => true,
            'message' => 'Usuario administrativo creado correctamente.',
            'userId' => intval($new_user_id)
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        // error_log($e->getMessage()); // Registrar error en logs
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear usuario administrativo.'
        ]);
    }
}

/**
 * Actualiza el estado de un usuario (activo/inactivo)
 */
function updateUserStatus($data) {
    global $pdo;
    
    // Verificar datos obligatorios
    if (!isset($data->userId) || !isset($data->status)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Faltan datos obligatorios (userId o status).'
        ]);
        return;
    }
    
    // Validar que el estado sea válido
    if ($data->status !== 'activo' && $data->status !== 'inactivo') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Estado no válido. Debe ser "activo" o "inactivo".'
        ]);
        return;
    }
    
    try {
        // Verificar si es un usuario master (no se puede modificar)
        $check_sql = "SELECT rol FROM admin WHERE id = :id";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute(['id' => $data->userId]);
        $user_rol = $check_stmt->fetchColumn();
        
        if ($user_rol === 'master') {
            http_response_code(403); // Forbidden
            echo json_encode([
                'success' => false,
                'message' => 'No se puede modificar el estado de un usuario master.'
            ]);
            return;
        }
        
        // Actualizar estado
        $sql = "UPDATE admin SET estado = :estado WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $result = $stmt->execute([
            'estado' => $data->status,
            'id' => $data->userId
        ]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ]);
            return;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => "Estado del usuario actualizado a '{$data->status}' correctamente."
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        // error_log($e->getMessage()); // Registrar error en logs
        echo json_encode([
            'success' => false,
            'message' => 'Error al actualizar estado del usuario.'
        ]);
    }
}

/**
 * Elimina un usuario administrativo
 */
function deleteUser($data) {
    global $pdo;
    
    // Verificar datos obligatorios
    if (!isset($data->userId)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Falta el ID del usuario a eliminar.'
        ]);
        return;
    }
    
    try {
        // Verificar si es un usuario master (no se puede eliminar)
        $check_sql = "SELECT rol FROM admin WHERE id = :id";
        $check_stmt = $pdo->prepare($check_sql);
        $check_stmt->execute(['id' => $data->userId]);
        $user_rol = $check_stmt->fetchColumn();
        
        if ($user_rol === 'master') {
            http_response_code(403); // Forbidden
            echo json_encode([
                'success' => false,
                'message' => 'No se puede eliminar un usuario master.'
            ]);
            return;
        }
        
        // Eliminar usuario
        $sql = "DELETE FROM admin WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $data->userId]);
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Usuario no encontrado.'
            ]);
            return;
        }
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario eliminado correctamente.'
        ]);
    } catch (\PDOException $e) {
        http_response_code(500);
        // error_log($e->getMessage()); // Registrar error en logs
        echo json_encode([
            'success' => false,
            'message' => 'Error al eliminar usuario.'
        ]);
    }
}
?>
