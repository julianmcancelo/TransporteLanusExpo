<?php
/**
 * API Endpoint: validate_credential_qr.php
 * 
 * Purpose: Validar credenciales escaneadas mediante QR por inspectores
 * 
 * Method: POST
 * 
 * Parameters:
 *   - qr_data: Datos extraídos del código QR escaneado (string)
 *   - token: Token de autenticación del inspector (string)
 * 
 * Returns:
 *   - JSON con información de validación de la credencial
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../includes/db_connection.php';
require_once '../includes/auth_utils.php';
require_once '../includes/response_utils.php';

// Verificar método de solicitud
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendErrorResponse('Método no permitido', 405);
    exit;
}

// Obtener y validar datos de entrada
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['qr_data']) || !isset($input['token'])) {
    sendErrorResponse('Faltan parámetros requeridos (qr_data, token)', 400);
    exit;
}

$qrData = $input['qr_data'];
$token = $input['token'];

// Validar token del inspector
if (!validateInspectorToken($token)) {
    sendErrorResponse('Token de inspector inválido o expirado', 401);
    exit;
}

try {
    // Decodificar datos del QR
    // El formato esperado del QR es: "TRANSPORTELANUS:ID_CREDENCIAL:HASH_VERIFICACION"
    $qrParts = explode(':', $qrData);
    
    if (count($qrParts) !== 3 || $qrParts[0] !== 'TRANSPORTELANUS') {
        sendErrorResponse('Formato de QR inválido', 400);
        exit;
    }
    
    $credencialId = intval($qrParts[1]);
    $hashVerificacion = $qrParts[2];
    
    // Conectar a la base de datos
    $conn = getDBConnection();
    
    // Consultar información de la credencial
    $query = "SELECT 
                c.id,
                c.hash_verificacion,
                c.estado,
                c.fecha_vencimiento,
                p.nombre,
                p.apellido,
                v.marca,
                v.modelo,
                v.dominio
              FROM credenciales c
              JOIN personas p ON c.persona_id = p.id
              JOIN vehiculos v ON c.vehiculo_id = v.id
              WHERE c.id = ?";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param('i', $credencialId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        sendErrorResponse('Credencial no encontrada', 404);
        exit;
    }
    
    $credencial = $result->fetch_assoc();
    
    // Verificar hash de seguridad
    if ($credencial['hash_verificacion'] !== $hashVerificacion) {
        sendResponse([
            'success' => false,
            'data' => [
                'nombre' => $credencial['nombre'] . ' ' . $credencial['apellido'],
                'habilitacion_status' => 'QR ALTERADO',
                'vencimiento' => $credencial['fecha_vencimiento'],
                'vehiculo' => $credencial['marca'] . ' ' . $credencial['modelo'] . ' (' . $credencial['dominio'] . ')'
            ],
            'message' => 'Hash de verificación inválido. QR posiblemente alterado.'
        ]);
        exit;
    }
    
    // Determinar estado de la habilitación
    $estadoTexto = $credencial['estado'];
    
    // Verificar vencimiento
    $hoy = new DateTime();
    $vencimiento = new DateTime($credencial['fecha_vencimiento']);
    
    if ($hoy > $vencimiento) {
        $estadoTexto = 'VENCIDA';
    }
    
    // Registrar el evento de validación
    $queryLog = "INSERT INTO log_validaciones (credencial_id, inspector_id, fecha, resultado)
                SELECT ?, u.id, NOW(), ?
                FROM usuarios u
                WHERE u.token = ?";
    
    $resultadoValidacion = ($estadoTexto === 'ACTIVA') ? 'VÁLIDA' : 'INVÁLIDA';
    $stmtLog = $conn->prepare($queryLog);
    $stmtLog->bind_param('iss', $credencialId, $resultadoValidacion, $token);
    $stmtLog->execute();
    
    // Preparar respuesta
    $response = [
        'success' => true,
        'data' => [
            'nombre' => $credencial['nombre'] . ' ' . $credencial['apellido'],
            'habilitacion_status' => $estadoTexto,
            'vencimiento' => $credencial['fecha_vencimiento'],
            'vehiculo' => $credencial['marca'] . ' ' . $credencial['modelo'] . ' (' . $credencial['dominio'] . ')'
        ],
        'message' => 'Validación de credencial completada'
    ];
    
    sendResponse($response);
    
} catch (Exception $e) {
    sendErrorResponse('Error al validar la credencial: ' . $e->getMessage(), 500);
    exit;
}

// Funciones auxiliares específicas para este endpoint

/**
 * Valida el token de un inspector
 * 
 * @param string $token Token a validar
 * @return bool True si el token es válido, false en caso contrario
 */
function validateInspectorToken($token) {
    // Verificar que el token pertenece a un inspector activo
    try {
        $conn = getDBConnection();
        
        $query = "SELECT id FROM usuarios WHERE token = ? AND (rol = 'inspector' OR rol = 'admin' OR rol = 'master') AND estado = 'activo'";
        $stmt = $conn->prepare($query);
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $result = $stmt->get_result();
        
        return $result->num_rows > 0;
        
    } catch (Exception $e) {
        return false;
    }
}
