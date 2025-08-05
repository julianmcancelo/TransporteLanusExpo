<?php
// Debug script to test database connection and credential queries
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Log directory creation
$log_dir = __DIR__ . '/logs';
if (!file_exists($log_dir)) {
    mkdir($log_dir, 0777, true);
}

$log_file = $log_dir . '/debug_connection.log';
file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Debug connection test started\n", FILE_APPEND);

// Include connection and functions files
try {
    require_once __DIR__ . '/nucleo/conexion.php';
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Successfully included conexion.php\n", FILE_APPEND);
} catch (Exception $e) {
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Error including conexion.php: " . $e->getMessage() . "\n", FILE_APPEND);
    echo "<p>Error including conexion.php: " . $e->getMessage() . "</p>";
}

try {
    require_once __DIR__ . '/nucleo/funciones.php';
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Successfully included funciones.php\n", FILE_APPEND);
} catch (Exception $e) {
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Error including funciones.php: " . $e->getMessage() . "\n", FILE_APPEND);
    echo "<p>Error including funciones.php: " . $e->getMessage() . "</p>";
}

// Test token and query
$test_token = '50df3dbf6a8bde58eff71e695c24266a80551abaafef4dceebd8d3b3af728dc2';
file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Testing with token: $test_token\n", FILE_APPEND);

// Try database connection
try {
    if (isset($pdo)) {
        file_put_contents($log_file, date('[Y-m-d H:i:s]') . " PDO connection exists\n", FILE_APPEND);
        
        // Try token query
        $stmt = $pdo->prepare("SELECT ta.habilitacion_id, ta.fecha_expiracion FROM tokens_acceso ta WHERE ta.token = :token LIMIT 1");
        $stmt->execute(['token' => $test_token]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tokenData) {
            file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Token found: " . print_r($tokenData, true) . "\n", FILE_APPEND);
            $id = $tokenData['habilitacion_id'];
            
            // Try credential data query
            $sql = "
            SELECT 
                hg.nro_licencia, hg.resolucion, hg.vigencia_inicio, hg.vigencia_fin, hg.estado, hg.tipo_transporte,
                p_titular.nombre AS titular_nombre, p_titular.dni AS titular_dni, p_titular.cuit AS titular_cuit, p_titular.foto_url AS titular_foto,
                p_conductor.nombre AS conductor_nombre, p_conductor.dni AS conductor_dni, p_conductor.foto_url AS conductor_foto,
                hc.licencia_categoria,
                p_celador.nombre AS celador_nombre, p_celador.dni AS celador_dni,
                e.nombre AS escuela_nombre, e.domicilio AS escuela_domicilio, e.localidad AS escuela_localidad,
                v.marca, v.modelo, v.ano, v.motor, v.chasis, v.asientos, v.dominio, v.Aseguradora, v.poliza, v.Vencimiento_VTV, v.Vencimiento_Poliza
            FROM habilitaciones_generales hg
            LEFT JOIN habilitaciones_personas ht ON ht.habilitacion_id = hg.id AND ht.rol = 'TITULAR' LEFT JOIN personas p_titular ON p_titular.id = ht.persona_id
            LEFT JOIN habilitaciones_personas hc ON hc.habilitacion_id = hg.id AND hc.rol = 'CONDUCTOR' LEFT JOIN personas p_conductor ON p_conductor.id = hc.persona_id
            LEFT JOIN habilitaciones_personas hce ON hce.habilitacion_id = hg.id AND hce.rol = 'CELADOR' LEFT JOIN personas p_celador ON p_celador.id = hce.persona_id
            LEFT JOIN habilitaciones_establecimientos he ON he.habilitacion_id = hg.id LEFT JOIN establecimientos e ON e.id = he.establecimiento_id AND he.tipo = 'establecimiento'
            LEFT JOIN habilitaciones_vehiculos hv ON hv.habilitacion_id = hg.id LEFT JOIN vehiculos v ON v.id = hv.vehiculo_id
            WHERE hg.id = :id
            ";
            $stmt_data = $pdo->prepare($sql);
            $stmt_data->execute(['id' => $id]);
            $data = $stmt_data->fetch(PDO::FETCH_ASSOC);
            
            if ($data) {
                file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Credential data found successfully!\n", FILE_APPEND);
                
                echo "<h1>Credential Data Retrieved Successfully</h1>";
                echo "<pre>";
                print_r($data);
                echo "</pre>";
            } else {
                file_put_contents($log_file, date('[Y-m-d H:i:s]') . " No credential data found for ID: $id\n", FILE_APPEND);
                echo "<p>No credential data found for ID: $id</p>";
            }
        } else {
            file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Token not found: $test_token\n", FILE_APPEND);
            echo "<p>Token not found: $test_token</p>";
        }
    } else {
        file_put_contents($log_file, date('[Y-m-d H:i:s]') . " PDO connection not established\n", FILE_APPEND);
        echo "<p>PDO connection not established</p>";
    }
} catch (PDOException $e) {
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " Database error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo "<p>Database error: " . $e->getMessage() . "</p>";
} catch (Exception $e) {
    file_put_contents($log_file, date('[Y-m-d H:i:s]') . " General error: " . $e->getMessage() . "\n", FILE_APPEND);
    echo "<p>General error: " . $e->getMessage() . "</p>";
}

echo "<p>Debug log has been written to: $log_file</p>";
?>
