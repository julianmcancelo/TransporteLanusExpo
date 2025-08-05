<?php
// Permitir solicitudes desde cualquier origen (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Manejar la solicitud de pre-vuelo (preflight) de CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- 1. INCLUIR LA CONEXIÓN A LA BASE DE DATOS ---
// El archivo conexion.php nos proporciona la variable $pdo.
require 'conexion.php';

// --- 2. OBTENER DATOS DE LA SOLICITUD ---
$data = json_decode(file_get_contents("php://input"));

if (empty($data->identifier) || empty($data->password)) {
    http_response_code(400); // Bad Request
    echo json_encode(['status' => 'error', 'message' => 'Faltan credenciales.']);
    exit;
}

// --- 3. PREPARAR Y EJECUTAR LA CONSULTA SQL ---
$sql = "SELECT id, nombre, email, password, rol, legajo FROM admin WHERE email = :identifier OR legajo = :identifier LIMIT 1";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['identifier' => $data->identifier]);
    $user = $stmt->fetch();

    // --- 4. VERIFICAR USUARIO Y CONTRASEÑA ---
    if ($user && password_verify($data->password, $user['password'])) {
        
        // --- 5. VALIDAR ROL ---
        // CAMBIO: Se agrega 'master' como rol válido
        if ($user['rol'] !== 'admin' && $user['rol'] !== 'inspector' && $user['rol'] !== 'master') {
            http_response_code(403); // Forbidden
            echo json_encode(['status' => 'error', 'message' => 'Acceso no autorizado para este rol.']);
            exit;
        }

        // --- 6. GENERAR TOKEN JWT ---
        $secret_key = "TU_CLAVE_SECRETA_SUPER_SEGURA"; // ¡Cámbiala y guárdala de forma segura!
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'iat' => time(),
            'exp' => time() + (60*60*24), // 24 horas de validez
            'data' => [
                'id' => $user['id'],
                'nombre' => $user['nombre'],
                'rol' => $user['rol']
            ]
        ]);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret_key, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

        // --- 7. RESPUESTA EXITOSA ---
        http_response_code(200);
        echo json_encode([
            'status' => 'success',
            'data' => [
                'id' => $user['id'], // Añadido ID para el perfil de usuario
                'nombre' => $user['nombre'],
                'email' => $user['email'],
                'rol' => $user['rol'],
                'legajo' => $user['legajo'],
                'token' => $jwt,
                // Añadimos userId para que la app pueda hacer llamadas al perfil
                'userId' => $user['id']
            ]
        ]);

    } else {
        http_response_code(401); // Unauthorized
        echo json_encode(['status' => 'error', 'message' => 'Credenciales incorrectas.']);
    }

} catch (\PDOException $e) {
    http_response_code(500);
    // error_log($e->getMessage()); // Registrar el error real en logs del servidor
    echo json_encode(['status' => 'error', 'message' => 'Error en la consulta.']);
} 
