<?php
/**
 * Archivo de funciones auxiliares
 * Este archivo contiene funciones de ayuda utilizadas en todo el sistema
 */

// Función para escapar valores de manera segura para mostrar en HTML
if (!function_exists('e')) {
    function e($value) {
        return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8', false);
    }
}

// Función para verificar si el usuario está autenticado
function esta_autenticado() {
    return isset($_SESSION['usuario_id']);
}

// Función para obtener la URL base del sistema
function base_url() {
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    return $protocol . $host;
}

// Función para formatear fechas
function formatear_fecha($fecha, $formato = 'd/m/Y') {
    if (!$fecha) return 'N/A';
    return date($formato, strtotime($fecha));
}

// Función para generar tokens aleatorios seguros
function generar_token($longitud = 32) {
    return bin2hex(random_bytes($longitud / 2));
}

// Función para validar un token de acceso
function validar_token($token, $pdo) {
    if (!$token) return false;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM tokens_acceso WHERE token = :token AND fecha_expiracion > NOW() LIMIT 1");
        $stmt->execute(['token' => $token]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        return false;
    }
}

// Función para obtener datos de habilitación por ID
function obtener_habilitacion($id, $pdo) {
    try {
        $sql = "SELECT * FROM habilitaciones_generales WHERE id = :id LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    } catch (PDOException $e) {
        return false;
    }
}

// Función para registrar actividad en el sistema
function log_actividad($usuario_id, $accion, $detalles, $pdo) {
    try {
        $sql = "INSERT INTO log_actividad (usuario_id, accion, detalles, fecha_hora) VALUES (:usuario_id, :accion, :detalles, NOW())";
        $stmt = $pdo->prepare($sql);
        return $stmt->execute([
            'usuario_id' => $usuario_id,
            'accion' => $accion,
            'detalles' => $detalles
        ]);
    } catch (PDOException $e) {
        return false;
    }
}
