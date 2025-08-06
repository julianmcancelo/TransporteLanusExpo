<?php
// =================================================================================
// ARCHIVO: guardar_inspeccion.php (v16.4 - Prefijo de Firma)
// DESCRIPCIÓN: Se asegura de que las firmas se guarden con el prefijo
//              'data:image/png;base64,' para su correcta visualización.
// =================================================================================

// --- MODO DEBUG Y CONFIGURACIÓN ---
define('DEBUG_MODE', true);
define('LOG_FILE', 'debug_log.txt');
define('UPLOAD_DIR', $_SERVER['DOCUMENT_ROOT'] . '/uploads/inspecciones_fotos/');
define('RELATIVE_PATH', 'uploads/inspecciones_fotos/');

require_once 'conexion.php';
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// --- MANEJO DE ERRORES Y LOGGING ---
function simple_log($message) {
    if (DEBUG_MODE) {
        $log_message = "[" . date("Y-m-d H:i:s") . "] " . $message . "\n";
        @file_put_contents(LOG_FILE, $log_message, FILE_APPEND);
    }
}

set_exception_handler(function($exception) {
    simple_log("!!! EXCEPCIÓN NO CAPTURADA: " . $exception->getMessage() . " en " . $exception->getFile() . ":" . $exception->getLine());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Error inesperado en el servidor.', 'detail' => $exception->getMessage()]);
    exit();
});

// --- CABECERAS Y MANEJO DE CORS ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// --- FUNCIONES HELPER ---
function responder_error($mensaje, $codigo_http = 400) {
    simple_log("-> ERROR CONTROLADO: " . $mensaje);
    http_response_code($codigo_http);
    echo json_encode(['status' => 'error', 'message' => $mensaje]);
    exit();
}

/**
 * 🛡️ Guarda una imagen desde Base64 de forma segura.
 */
function guardar_imagen_desde_base64(?string $base64String, string $fileNamePrefix): ?string {
    if (empty($base64String)) {
        return null;
    }

    if (!is_dir(UPLOAD_DIR)) {
        if (!mkdir(UPLOAD_DIR, 0775, true)) {
            simple_log("Error Crítico: No se pudo crear el directorio: " . UPLOAD_DIR);
            return null;
        }
    }

    $base64Data = preg_replace('/^data:image\/\w+;base64,/', '', $base64String);
    $imageData = base64_decode($base64Data);

    if ($imageData === false || @getimagesizefromstring($imageData) === false) {
        simple_log("ALERTA: Se intentó subir un archivo inválido como imagen.");
        return null;
    }

    $fileName = strtolower($fileNamePrefix) . '_' . uniqid() . '.jpg';
    $fullPath = UPLOAD_DIR . $fileName;
    $finalRelativePath = RELATIVE_PATH . $fileName;

    if (file_put_contents($fullPath, $imageData)) {
        simple_log("Imagen guardada en: " . $fullPath);
        return $finalRelativePath;
    }

    simple_log("Error: No se pudo escribir el archivo en {$fullPath}");
    return null;
}

// --- LÓGICA PRINCIPAL ---
simple_log("================= INICIO DE PETICIÓN (v16.4 Firma) =================");

try {
    // 1. LEER Y DECODIFICAR JSON
    $json_payload = file_get_contents("php://input");
    if (empty($json_payload)) {
        responder_error("No se recibieron datos en la petición.");
    }
    $data = json_decode($json_payload);
    if (json_last_error() !== JSON_ERROR_NONE) {
        responder_error("Error en el formato JSON: " . json_last_error_msg());
    }

    // 2. VALIDACIÓN DE DATOS REQUERIDOS
    if (!isset($data->habilitacion_id, $data->nro_licencia, $data->items, $data->firma_inspector, $data->nombre_inspector)) {
        responder_error("Faltan datos requeridos en la petición.");
    }

    // 4. INICIAR TRANSACCIÓN DE BASE DE DATOS
    $pdo->beginTransaction();
    simple_log("Transacción iniciada.");

    // 5. INSERTAR INSPECCIÓN PRINCIPAL
    $sql_inspeccion = "INSERT INTO inspecciones (habilitacion_id, nro_licencia, tipo_transporte, nombre_inspector, email_contribuyente, firma_inspector, firma_contribuyente, fecha_inspeccion, resultado) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)";
    $stmt_inspeccion = $pdo->prepare($sql_inspeccion);

    // --- Se asegura que el prefijo exista en las firmas ---
    $firma_inspector_final = $data->firma_inspector;
    if ($firma_inspector_final && strpos($firma_inspector_final, 'data:image/') !== 0) {
        $firma_inspector_final = 'data:image/png;base64,' . $firma_inspector_final;
    }

    $firma_contribuyente_final = $data->firma_contribuyente ?? null;
    if ($firma_contribuyente_final && strpos($firma_contribuyente_final, 'data:image/') !== 0) {
        $firma_contribuyente_final = 'data:image/png;base64,' . $firma_contribuyente_final;
    }

    $stmt_inspeccion->execute([
        $data->habilitacion_id,
        $data->nro_licencia,
        $data->tipo_transporte ?? null,
        $data->nombre_inspector,
        filter_var($data->email_contribuyente ?? null, FILTER_VALIDATE_EMAIL) ? $data->email_contribuyente : null,
        $firma_inspector_final,
        $firma_contribuyente_final,
        $data->resultado ?? 'pendiente' // Guardar el resultado
    ]);
    $id_inspeccion_nueva = $pdo->lastInsertId();
    simple_log("Inspección principal insertada con ID: " . $id_inspeccion_nueva);

    // 6. INSERTAR DETALLES DE ÍTEMS
    $sql_detalle = "INSERT INTO inspeccion_detalles (inspeccion_id, item_id, nombre_item, estado, observacion, foto_path, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt_detalle = $pdo->prepare($sql_detalle);
    foreach ($data->items as $item) {
        $foto_path = guardar_imagen_desde_base64($item->foto ?? null, "item_{$id_inspeccion_nueva}_{$item->id}");
        
        $stmt_detalle->execute([
            $id_inspeccion_nueva,
            $item->id,
            $item->nombre,
            $item->estado,
            $item->observacion,
            $foto_path,
            $item->location->latitude ?? null,
            $item->location->longitude ?? null
        ]);
    }
    simple_log("Detalles de ítems insertados.");

    // 7. INSERTAR FOTOS DEL VEHÍCULO Y ADICIONALES
    $sql_fotos = "INSERT INTO inspeccion_fotos (inspeccion_id, tipo_foto, foto_path, latitud, longitud) VALUES (?, ?, ?, ?, ?)";
    $stmt_fotos = $pdo->prepare($sql_fotos);

    if (!empty($data->fotos_vehiculo)) {
        foreach ($data->fotos_vehiculo as $tipo_foto => $foto_data) {
            if (!empty($foto_data->foto)) {
                $foto_path = guardar_imagen_desde_base64($foto_data->foto, "{$tipo_foto}_{$id_inspeccion_nueva}");
                if ($foto_path) {
                    $stmt_fotos->execute([
                        $id_inspeccion_nueva, $tipo_foto, $foto_path,
                        $foto_data->location->latitude ?? null, $foto_data->location->longitude ?? null
                    ]);
                }
            }
        }
    }
    simple_log("Fotos del vehículo procesadas.");

    if (!empty($data->foto_adicional) && !empty($data->foto_adicional->foto)) {
        $foto_path = guardar_imagen_desde_base64($data->foto_adicional->foto, "adicional_{$id_inspeccion_nueva}");
        if ($foto_path) {
            $stmt_fotos->execute([
                $id_inspeccion_nueva, 'adicional', $foto_path,
                $data->foto_adicional->location->latitude ?? null, $data->foto_adicional->location->longitude ?? null
            ]);
        }
    }
    simple_log("Foto adicional procesada.");

    // 7.5 ACTUALIZAR ESTADO DEL TURNO
    simple_log("Actualizando estado del turno para habilitacion_id: {$data->habilitacion_id}");
    
    // Primero verificar si se envió información específica del turno desde el frontend
    if (isset($data->turno_id) && !empty($data->turno_id)) {
        simple_log("Usando turno_id específico: {$data->turno_id}");
        $sql_turno = "UPDATE turnos SET estado = 'FINALIZADO' WHERE id = ?";
        $stmt_turno = $pdo->prepare($sql_turno);
        $stmt_turno->execute([$data->turno_id]);
        $affected_rows = $stmt_turno->rowCount();
        simple_log("Turno actualizado por ID específico. Filas afectadas: {$affected_rows}");
    } else {
        // Fallback: buscar por habilitacion_id pero ser más flexible con el estado
        simple_log("Buscando turno por habilitacion_id (fallback)");
        $sql_turno = "UPDATE turnos SET estado = 'FINALIZADO' WHERE habilitacion_id = ? AND estado IN ('CONFIRMADO', 'Confirmado', 'Pendiente', 'Programado')";
        $stmt_turno = $pdo->prepare($sql_turno);
        $stmt_turno->execute([$data->habilitacion_id]);
        $affected_rows = $stmt_turno->rowCount();
        simple_log("Turno actualizado por habilitacion_id. Filas afectadas: {$affected_rows}");
    }
    
    // Log adicional para debugging
    if ($affected_rows === 0) {
        simple_log("⚠️ ADVERTENCIA: No se actualizó ningún turno. Verificar estado actual.");
        // Consultar estado actual para debugging
        $sql_check = "SELECT id, estado, fecha, hora FROM turnos WHERE habilitacion_id = ? ORDER BY fecha DESC, hora DESC LIMIT 1";
        $stmt_check = $pdo->prepare($sql_check);
        $stmt_check->execute([$data->habilitacion_id]);
        $turno_actual = $stmt_check->fetch(PDO::FETCH_ASSOC);
        if ($turno_actual) {
            simple_log("Turno encontrado - ID: {$turno_actual['id']}, Estado: {$turno_actual['estado']}, Fecha: {$turno_actual['fecha']}, Hora: {$turno_actual['hora']}");
        } else {
            simple_log("No se encontró ningún turno para habilitacion_id: {$data->habilitacion_id}");
        }
    } else {
        simple_log("✅ Turno actualizado exitosamente a FINALIZADO.");
    }

    // 7.6 INSERTAR REGISTRO EN TABLA DE HISTORIAL
    simple_log("Insertando registro en tabla de historial...");
    try {
        $sql_historial = "INSERT INTO historial (nro_licencia, fecha, hora, nombre_titular, dominio, resultado, expediente) VALUES (?, CURDATE(), CURTIME(), ?, ?, ?, ?)";
        $stmt_historial = $pdo->prepare($sql_historial);
        
        // Extraer datos necesarios para el historial
        $nombre_titular = $data->titular->nombre ?? 'No especificado';
        $dominio = $data->vehiculo->dominio ?? $data->vehiculo->patente ?? 'No especificado';
        $resultado_historial = $data->resultado ?? 'finalizado';
        $expediente = $data->expediente ?? null; // Campo opcional
        
        $stmt_historial->execute([
            $data->nro_licencia,
            $nombre_titular,
            $dominio,
            $resultado_historial,
            $expediente
        ]);
        
        $historial_id = $pdo->lastInsertId();
        simple_log("✅ Registro de historial insertado con ID: {$historial_id}");
        simple_log("- Licencia: {$data->nro_licencia}");
        simple_log("- Titular: {$nombre_titular}");
        simple_log("- Dominio: {$dominio}");
        simple_log("- Resultado: {$resultado_historial}");
        
    } catch (Exception $e) {
        simple_log("⚠️ ERROR al insertar en historial: " . $e->getMessage());
        // No interrumpir el proceso principal, solo registrar el error
    }

    // 8. COMMIT DE LA TRANSACCIÓN
    $pdo->commit();
    simple_log("Transacción completada (commit).");

    // 9. RESPUESTA FINAL
    http_response_code(201);
    echo json_encode(["status" => "success", "message" => "Inspección N°{$id_inspeccion_nueva} guardada correctamente.", "new_inspection_id" => $id_inspeccion_nueva]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        simple_log("!!! Ocurrió una excepción, realizando rollback.");
        $pdo->rollBack();
    }
    throw $e;
}

simple_log("================= FIN DE PETICIÓN =================\n\n");