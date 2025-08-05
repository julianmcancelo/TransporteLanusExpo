<?php
/**
 * Archivo de conexión a la base de datos
 * Este archivo establece la conexión PDO a la base de datos MySQL
 */

// Configuración de la base de datos
$db_host = 'localhost';     // Host de la base de datos
$db_name = 'transporte_lanus';  // Nombre de la base de datos
$db_user = 'root';          // Usuario de la base de datos
$db_pass = '';              // Contraseña del usuario

// Opciones de PDO
$pdo_options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4'
];

// Establecer la conexión a la base de datos
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass, $pdo_options);
    
    // Registrar conexión exitosa en un archivo de log (opcional)
    $log_file = __DIR__ . '/conexion.log';
    $message = date('[Y-m-d H:i:s]') . " Conexión establecida correctamente\n";
    file_put_contents($log_file, $message, FILE_APPEND);
    
} catch (PDOException $e) {
    // Registrar error de conexión en un archivo de log
    $log_file = __DIR__ . '/conexion_error.log';
    $message = date('[Y-m-d H:i:s]') . " Error de conexión: " . $e->getMessage() . "\n";
    file_put_contents($log_file, $message, FILE_APPEND);
    
    // En producción, podrías querer mostrar un mensaje de error genérico
    // die("Error de conexión a la base de datos. Por favor, intente nuevamente más tarde.");
    
    // Para desarrollo, mostrar el error exacto
    echo "Error de conexión a la base de datos: " . $e->getMessage();
    exit;
}
