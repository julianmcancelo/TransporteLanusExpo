<?php
// =================================================================
// 1. LÓGICA, SEGURIDAD Y OBTENCIÓN DE DATOS
// =================================================================
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Crear archivo de log para debug con manejo explícito de errores
function log_debug($message) {
    try {
        $log_file = __DIR__ . '/credential_debug.log';
        $timestamp = date('[Y-m-d H:i:s]');
        
        // Asegurarnos que el directorio tiene permisos de escritura
        if (!is_writable(__DIR__)) {
            // Si no podemos escribir en el directorio, intentar con un directorio temporal
            $log_file = sys_get_temp_dir() . '/credential_debug.log';
        }
        
        // Intentar escribir en el archivo
        $result = file_put_contents($log_file, "$timestamp $message\n", FILE_APPEND);
        
        // Si falla, intentar crear el archivo primero
        if ($result === false) {
            touch($log_file);
            chmod($log_file, 0666); // Dar permisos amplios
            file_put_contents($log_file, "$timestamp $message\n", FILE_APPEND);
        }
        
        // Como último recurso, registrar en el log del sistema
        if ($result === false) {
            error_log("CREDENTIAL PHP: $message");
        }
    } catch (Exception $e) {
        // Si todo falla, al menos intentar con error_log
        error_log("CREDENTIAL LOG ERROR: " . $e->getMessage());
        error_log("CREDENTIAL MESSAGE: $message");
    }
}

log_debug('===== NUEVA SOLICITUD =====');

require_once __DIR__ . '/../nucleo/conexion.php';
require_once __DIR__ . '/../nucleo/funciones.php';
session_start();

// --- FUNCIONES AUXILIARES ---
if (!function_exists('formatearFecha')) {
    function formatearFecha($fecha) {
        if (!$fecha) return 'N/A';
        return date('d/m/Y', strtotime($fecha));
    }
}

// ## NUEVO: Función para dar color a las fechas de vencimiento del vehículo
function getVencimientoClass($fecha_str) {
    if (empty($fecha_str) || strtotime($fecha_str) === false) return 'text-slate-500'; // Color neutro para fechas no válidas
    try {
        $fecha = new DateTime($fecha_str);
        $hoy = new DateTime();
        $limite_pronto = (new DateTime())->modify('+30 days');

        if ($fecha < $hoy) return 'text-red-600 font-bold'; // Vencido
        if ($fecha <= $limite_pronto) return 'text-amber-600 font-bold'; // Pronto a Vencer
        return 'text-slate-700'; // Vigente
    } catch (Exception $e) {
        return 'text-slate-500';
    }
}

function obtenerUrlActual() {
    $protocolo = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $host = $_SERVER['HTTP_HOST'];
    $uri = $_SERVER['REQUEST_URI'];
    return $protocolo . $host . $uri;
}

function mostrarError($mensaje, $pdo = null) {
    if (ob_get_level() > 0) ob_end_clean();
    http_response_code(403);
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acceso Restringido</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
            /* Fondo con gradiente animado para un efecto aurora */
            background: linear-gradient(-45deg, #e0f7fa, #b2ebf2, #80deea, #4dd0e1);
            background-size: 400% 400%;
            animation: animated-gradient 15s ease infinite;
        }

        /* Keyframes para la animación del fondo */
        @keyframes animated-gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }

        /* Keyframes para la aparición de los elementos */
        @keyframes slide-in-up {
            from { opacity: 0; transform: translateY(40px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Keyframes para el brillo pulsante del ícono */
        @keyframes pulsating-glow {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); } /* Usamos un verde/celeste sutil */
            70% { box-shadow: 0 0 0 20px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }

        /* Clases para aplicar las animaciones con retardo */
        .animate-on-load {
            opacity: 0; /* Inicia invisible */
            animation: slide-in-up 0.8s ease-out forwards;
        }
        
        /* Efecto Shine para el botón */
        .btn-shine {
            position: relative;
            overflow: hidden;
        }
        .btn-shine::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent);
            transition: left 0.6s ease;
        }
        .btn-shine:hover::before {
            left: 100%;
        }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen p-4">

    <div class="animate-on-load bg-white/80 backdrop-blur-xl shadow-2xl rounded-2xl p-8 sm:p-12 max-w-lg w-full text-center ring-1 ring-black/5">
        
        <div class="animate-on-load" style="animation-delay: 0.2s;">
            <div class="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-sky-100" style="animation: pulsating-glow 2.5s infinite;">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3A5.25 5.25 0 0012 1.5zM12 3a3.75 3.75 0 00-3.75 3.75v3h7.5v-3A3.75 3.75 0 0012 3z" clip-rule="evenodd" />
                </svg>
            </div>
        </div>

        <div class="animate-on-load" style="animation-delay: 0.4s;">
            <h1 class="text-3xl sm:text-4xl font-black text-slate-900 mt-6 mb-3">
                Acceso Restringido
            </h1>
        </div>
        
        <div class="animate-on-load" style="animation-delay: 0.6s;">
            <p class="text-slate-700 text-lg mb-8 leading-relaxed">
                <?= htmlspecialchars($mensaje, ENT_QUOTES, 'UTF-8') ?>
            </p>
        </div>

        <div class="animate-on-load" style="animation-delay: 0.8s;">
            <div class="text-sm text-left text-slate-800 bg-sky-50/80 border border-sky-200 p-4 rounded-lg mt-8">
                <p class="font-semibold text-slate-900 mb-3">Si considera que esto es un error, puede contactarnos:</p>
                <div class="space-y-3">
                    <div class="flex items-center gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-700 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                        <span class="font-mono text-slate-800">4357-5100 (Int. 7137)</span>
                    </div>
                    <div class="flex items-center gap-3">
                         <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-sky-700 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                        <span class="font-mono text-slate-800">movilidadytransporte@lanus.gob.ar</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="animate-on-load" style="animation-delay: 1.0s;">
            <a href="https://www.lanus.gob.ar" class="btn-shine mt-10 inline-block text-white bg-sky-600 hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-sky-300 font-semibold px-10 py-3 rounded-lg shadow-lg hover:shadow-sky-200 transition-all duration-300 ease-in-out hover:-translate-y-1 transform-gpu">
                Volver al Sitio Principal
            </a>
        </div>
    </div>

</body>
</html>
<?php
    exit;
}

$token = $_GET['token'] ?? '';
log_debug("Token recibido: $token");

// Intentar URL-decode del token por si viene codificado
if (urldecode($token) !== $token) {
    $decoded_token = urldecode($token);
    log_debug("Token URL-decodificado: $decoded_token");
    // Probaremos ambas versiones
    $token_variants = [$token, $decoded_token];
} else {
    $token_variants = [$token];
}

if (empty($token)) {
    log_debug("Error: Token vacío");
    mostrarError("Token de acceso no proporcionado. El enlace utilizado no es válido o está incompleto.");
}

try {
    // Añadir información del servidor y versión PHP
    log_debug("INFO: PHP Version: " . phpversion());
    log_debug("INFO: Server: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'));
    log_debug("INFO: Document Root: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'));
    log_debug("INFO: Script Path: " . __FILE__);

    // Debug de conexión con más detalle
    log_debug("Verificando conexión a la BD");
    if (!isset($pdo)) {
        log_debug("Error: Variable PDO no está definida");
        
        // Intentar incluir manualmente los archivos de conexión
        $conexion_path = __DIR__ . '/../nucleo/conexion.php';
        $funciones_path = __DIR__ . '/../nucleo/funciones.php';
        
        log_debug("Intentando incluir manualmente: $conexion_path");
        if (file_exists($conexion_path)) {
            include_once $conexion_path;
            log_debug("Archivo de conexión incluido manualmente");
        } else {
            log_debug("Error: Archivo de conexión no existe en la ruta esperada");
        }
        
        // Verificar si ahora tenemos la conexión
        if (!isset($pdo)) {
            log_debug("Error: Variable PDO todavía no está definida después de incluir conexion.php");
            mostrarError("Error de conexión a la base de datos: No se pudo establecer conexión");
        }
    }
    
    log_debug("Ejecutando consulta para token");
    
    $tokenData = null;
    
    // Intentar diferentes variantes del token (original y decodificado)
    foreach ($token_variants as $token_variant) {
        log_debug("Probando variante de token: $token_variant");
        
        // Primer intento: campo fecha_expiracion
        $stmt = $pdo->prepare("SELECT ta.habilitacion_id, ta.fecha_expiracion FROM tokens_acceso ta WHERE ta.token = :token LIMIT 1");
        $stmt->execute(['token' => $token_variant]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tokenData) {
            log_debug("Token encontrado con campo fecha_expiracion");
            break;
        }
        
        // Segundo intento: campo fecha_vencimiento (nombre alternativo común)
        $stmt = $pdo->prepare("SELECT ta.habilitacion_id, ta.fecha_vencimiento as fecha_expiracion FROM tokens_acceso ta WHERE ta.token = :token LIMIT 1");
        $stmt->execute(['token' => $token_variant]);
        $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($tokenData) {
            log_debug("Token encontrado con campo fecha_vencimiento");
            break;
        }
    }
    
    if (!$tokenData) { 
        log_debug("Error: Token no encontrado en la base de datos");
        mostrarError("El token de acceso es inválido o no se encuentra en nuestra base de datos: $token"); 
    }
    
    log_debug("Token encontrado - Habilitación ID: " . ($tokenData['habilitacion_id'] ?? 'N/A') . ", Fecha exp: " . ($tokenData['fecha_expiracion'] ?? 'N/A'));
    
    if (strtotime($tokenData['fecha_expiracion']) < time()) { 
        log_debug("Error: Token expirado");
        mostrarError("Este enlace de acceso único ha expirado por seguridad. Por favor, solicite uno nuevo."); 
    }

    $id = $tokenData['habilitacion_id'];
    log_debug("Buscando datos para habilitación ID: $id");

    log_debug("Usando habilitacion_id: $id para consultar los datos");

    // ## MODIFICADO: Consulta SQL más simple primero para verificar si hg existe
    $check_sql = "SELECT * FROM habilitaciones_generales WHERE id = :id LIMIT 1";
    $stmt_check = $pdo->prepare($check_sql);
    $stmt_check->execute(['id' => $id]);
    $basic_data = $stmt_check->fetch(PDO::FETCH_ASSOC);
    
    if ($basic_data) {
        log_debug("Habilitación básica encontrada: ID=$id, Nro={$basic_data['nro_licencia']}");
    } else {
        log_debug("ERROR: No se encontró la habilitación básica con ID=$id");
    }
    
    // ## MODIFICADO: La consulta SQL ahora trae todos los datos del vehículo
    $sql = "
    SELECT 
        hg.id, hg.nro_licencia, hg.resolucion, hg.vigencia_inicio, hg.vigencia_fin, hg.estado, hg.tipo_transporte,
        p_titular.id AS titular_id, p_titular.nombre AS titular_nombre, p_titular.apellido AS titular_apellido, 
        p_titular.dni AS titular_dni, p_titular.cuit AS titular_cuit, p_titular.foto_url AS titular_foto,
        p_conductor.id AS conductor_id, p_conductor.nombre AS conductor_nombre, p_conductor.apellido AS conductor_apellido, 
        p_conductor.dni AS conductor_dni, p_conductor.foto_url AS conductor_foto,
        hc.licencia_categoria,
        p_celador.id AS celador_id, p_celador.nombre AS celador_nombre, p_celador.apellido AS celador_apellido, 
        p_celador.dni AS celador_dni,
        e.id AS escuela_id, e.nombre AS escuela_nombre, e.domicilio AS escuela_domicilio, e.localidad AS escuela_localidad,
        v.id AS vehiculo_id, v.marca, v.modelo, v.ano, v.motor, v.chasis, v.asientos, v.dominio, 
        v.Aseguradora, v.poliza, v.Vencimiento_VTV, v.Vencimiento_Poliza
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
    
    log_debug("Resultados de la consulta: " . ($data ? 'Datos encontrados' : 'NO SE ENCONTRARON DATOS'));
    
    if ($data) {
        log_debug("===== DATOS ENCONTRADOS =====");
        log_debug("ID: " . ($data['id'] ?? 'N/A'));
        log_debug("Nro licencia: " . ($data['nro_licencia'] ?? 'N/A'));
        log_debug("Titular: " . ($data['titular_nombre'] ?? 'N/A') . ' ' . ($data['titular_apellido'] ?? ''));
        log_debug("Conductor: " . ($data['conductor_nombre'] ?? 'N/A') . ' ' . ($data['conductor_apellido'] ?? ''));
        log_debug("Vehículo: " . ($data['marca'] ?? 'N/A') . ' ' . ($data['modelo'] ?? 'N/A') . ' (' . ($data['dominio'] ?? 'N/A') . ')');
        
        // Mostrar todas las claves y valores para depurar
        log_debug("===== TODAS LAS CLAVES Y VALORES =====");
        foreach ($data as $key => $value) {
            log_debug("$key: " . ($value ?? 'NULL'));
        }
    } else {
        log_debug("===== NO SE ENCONTRARON DATOS CON LA CONSULTA PRINCIPAL =====");
    }

    if (!$data) { 
        log_debug("Error: No se encontraron datos asociados a la habilitación ID: $id");
        
        // Intentar una consulta más simple como último recurso
        log_debug("Intentando consulta simple para habilitación");
        $stmt_simple = $pdo->prepare("SELECT * FROM habilitaciones_generales WHERE id = :id");
        $stmt_simple->execute(['id' => $id]);
        $data = $stmt_simple->fetch(PDO::FETCH_ASSOC);
        
        if (!$data) {
            mostrarError("No se encontraron datos asociados a la habilitación. Por favor, verifique la información.");
        } else {
            log_debug("Datos básicos encontrados con consulta simple");
        }
    }
    
    // Asegurar que todos los campos críticos estén definidos para evitar errores
    $campos_requeridos = [
        'nro_licencia', 'resolucion', 'vigencia_inicio', 'vigencia_fin', 'estado', 'tipo_transporte',
        'titular_nombre', 'titular_apellido', 'titular_dni', 'titular_foto',
        'conductor_nombre', 'conductor_apellido', 'conductor_dni', 'conductor_foto',
        'celador_nombre', 'celador_apellido', 'celador_dni',
        'dominio', 'marca', 'modelo', 'ano', 'asientos', 'motor', 'chasis',
        'Aseguradora', 'poliza', 'Vencimiento_VTV', 'Vencimiento_Poliza'
    ];
    
    foreach ($campos_requeridos as $campo) {
        if (!isset($data[$campo])) {
            $data[$campo] = '';
        }
    }
    
    log_debug("Datos recuperados y campos asegurados correctamente");
    log_debug("Titular: {$data['titular_nombre']} {$data['titular_apellido']}");
    log_debug("Conductor: {$data['conductor_nombre']} {$data['conductor_apellido']}");
    log_debug("Vehículo: {$data['marca']} {$data['modelo']} ({$data['dominio']})");

} catch (Exception $e) {
    $errorMsg = $e->getMessage();
    log_debug("ERROR EXCEPCIÓN: $errorMsg");
    log_debug("Traza: " . $e->getTraceAsString());
    error_log("Error en credencial.php: $errorMsg");
    mostrarError("Ocurrió un error técnico inesperado al intentar procesar su solicitud: $errorMsg");
}

$isExpired = strtotime($data['vigencia_fin']) < time();
// Se mantiene verde/rojo para el estado por ser un estándar universal de comprensión rápida.
$estado_clase = $data['estado'] === 'HABILITADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
$ciclo_lectivo_actual = date('Y');

?>
<!DOCTYPE html>
<html lang="es" class="h-full bg-white">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Credencial de Transporte | <?= e($data['nro_licencia'] ?? 'Visualizando') ?></title>
    
    <!-- DEBUG INFO - REMOVE IN PRODUCTION -->
    <script>
    console.log('Credencial cargada, token recibido: <?= htmlspecialchars(json_encode($_GET['token'] ?? 'no-token')) ?>');
    console.log('Datos cargados:', <?= json_encode($data ?: []) ?>);
    </script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <style>
        :root {
            --primary-blue: #0284c7; /* sky-600 */
            --dark-blue: #0369a1;    /* sky-700 */
        }
        @media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Inter', sans-serif; background-color: #f1f5f9; /* slate-100 */ }
        .credential-card {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
            border: 1px solid #e2e8f0; /* slate-200 */
        }
    </style>
</head>
<body class="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">

    <main class="w-full max-w-4xl mx-auto">
        <div class="credential-card bg-white rounded-2xl overflow-hidden relative" id="credencial">
            
            <?php if ($isExpired): ?>
            <div class="absolute inset-0 z-20 flex items-center justify-center p-4">
                <div class="bg-red-600/95 text-white text-center py-8 px-12 transform -rotate-12 border-4 border-white shadow-2xl rounded-lg backdrop-blur-sm">
                    <h2 class="text-5xl font-black uppercase tracking-wider">VENCIDA</h2>
                    <p class="text-lg mt-1">Por favor, regularice su situación.</p>
                </div>
            </div>
            <div class="absolute inset-0 bg-white/60 backdrop-blur-sm z-10"></div>
            <?php endif; ?>

            <header class="bg-gradient-to-r from-sky-700 to-sky-500 text-white p-6 flex justify-between items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-extrabold tracking-tight">Credencial de Habilitación</h1>
                    <p class="text-sm opacity-90">Transporte Escolar - Ciclo Lectivo <?= e($ciclo_lectivo_actual) ?></p>
                </div>
                <img src="https://www.lanus.gob.ar/img/logo-footer.svg" class="w-32 sm:w-36 h-auto" alt="Logo Lanús Gobierno" style="filter: brightness(0) invert(1);"/>
            </header>
            <div class="bg-slate-100 text-slate-700 px-6 py-3 text-sm font-semibold border-b border-slate-200">
                <p>Dirección General de Movilidad y Transporte</p>
            </div>

            <div class="p-6">
                <section class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-200">
                    <div class="md:col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <span class="text-xs font-semibold text-slate-500 uppercase">N° de Licencia</span>
                            <p class="text-lg font-bold text-[var(--primary-blue)]"><?= e($data['nro_licencia']) ?></p>
                        </div>
                        <div>
                            <span class="text-xs font-semibold text-slate-500 uppercase">Estado</span>
                            <p class="text-base font-bold px-3 py-1 rounded-full inline-block <?= $estado_clase ?>"><?= e($data['estado']) ?></p>
                        </div>
                        <div>
                            <span class="text-xs font-semibold text-slate-500 uppercase">Vigencia</span>
                            <p class="font-semibold text-slate-700"><?= e(formatearFecha($data['vigencia_inicio'])) ?> al <?= e(formatearFecha($data['vigencia_fin'])) ?></p>
                        </div>
                        <div>
                            <span class="text-xs font-semibold text-slate-500 uppercase">Resolución</span>
                            <p class="font-semibold text-slate-700"><?= e($data['resolucion']) ?></p>
                        </div>
                    </div>
                    <div class="flex flex-col items-center justify-center bg-slate-50 rounded-lg p-3">
                        <canvas id="qrcode" class="border-4 border-white rounded-lg shadow-md"></canvas>
                        <p class="mt-2 text-xs text-slate-600 font-medium">Verificar validez</p>
                    </div>
                </section>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 py-6">
                    <div class="space-y-6">
                        <div class="flex items-center gap-4">
                            <img src="<?= e($data['titular_foto'] ?? '../assets/sinfoto.png') ?>" class="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" alt="Foto Titular"/>
                            <div>
                                <h3 class="font-bold text-lg text-slate-800">Titular del Permiso</h3>
                                <p class="text-sm text-slate-600"><?= e($data['titular_nombre'] . ' ' . $data['titular_apellido']) ?></p>
                                <p class="text-xs text-slate-500">DNI: <?= e($data['titular_dni']) ?></p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <img src="<?= e($data['conductor_foto'] ?? '../assets/sinfoto.png') ?>" class="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg" alt="Foto Conductor"/>
                            <div>
                                <h3 class="font-bold text-lg text-slate-800">Conductor/a Autorizado/a</h3>
                                <p class="text-sm text-slate-600"><?= e(($data['conductor_nombre'] ? $data['conductor_nombre'] . ' ' . $data['conductor_apellido'] : 'No Asignado')) ?></p>
                                <p class="text-xs text-slate-500">Lic. Cat: <?= e($data['licencia_categoria'] ?? 'N/A') ?></p>
                            </div>
                        </div>
                    </div>
                    <div class="space-y-6">
                        <div class="bg-slate-50 p-4 rounded-lg h-full">
                            <h3 class="font-bold text-lg text-slate-800 mb-2">Vehículo Habilitado</h3>
                            <div class="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div class="col-span-2">
                                    <p class="text-2xl font-mono text-white bg-slate-800 inline-block px-3 py-1 rounded-md my-1"><?= e($data['dominio']) ?></p>
                                </div>
                                <div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase">Vehículo</span>
                                    <p class="text-sm text-slate-700 font-semibold"><?= e($data['marca']) ?> <?= e($data['modelo']) ?> (<?= e($data['ano']) ?>)</p>
                                </div>
                                <div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase">Asientos</span>
                                    <p class="text-sm text-slate-700 font-semibold"><?= e($data['asientos']) ?></p>
                                </div>
                                <div class="col-span-2">
                                    <span class="text-xs font-semibold text-slate-500 uppercase">Chasis</span>
                                    <p class="text-sm text-slate-700 font-semibold font-mono"><?= e($data['chasis']) ?></p>
                                </div>
                                
                                <hr class="col-span-2 my-2">

                                <div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase">Vencimiento VTV</span>
                                    <p class="text-sm font-semibold <?= getVencimientoClass($data['Vencimiento_VTV']) ?>"><?= e(formatearFecha($data['Vencimiento_VTV'])) ?></p>
                                </div>
                                <div>
                                    <span class="text-xs font-semibold text-slate-500 uppercase">Vencimiento Póliza</span>
                                    <p class="text-sm font-semibold <?= getVencimientoClass($data['Vencimiento_Poliza']) ?>"><?= e(formatearFecha($data['Vencimiento_Poliza'])) ?></p>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="w-24 h-24 flex-shrink-0 bg-slate-200 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>
                            </div>
                             <div>
                                <h3 class="font-bold text-lg text-slate-800">Celador/a</h3>
                                <p class="text-sm text-slate-600"><?= e(($data['celador_nombre'] ? $data['celador_nombre'] . ' ' . $data['celador_apellido'] : 'No Asignado')) ?></p>
                                <p class="text-xs text-slate-500">DNI: <?= e($data['celador_dni'] ?? 'N/A') ?></p>
                            </div>
                        </div>
                    </div>
                </div>

                <section class="pt-6 border-t border-slate-200">
                     <h3 class="font-bold text-lg text-slate-800 mb-2">Establecimiento Educativo</h3>
                     <div class="bg-slate-50 p-4 rounded-lg text-sm">
                         <p class="text-slate-800 font-semibold"><?= e($data['escuela_nombre'] ?? 'No Asignado') ?></p>
                         <p class="text-slate-600"><?= e($data['escuela_domicilio'] ?? 'N/A') ?> - <?= e($data['escuela_localidad'] ?? 'N/A') ?></p>
                    </div>
                </section>
            </div>
            
            <footer class="text-center text-xs text-slate-500 px-6 py-3 bg-slate-50 border-t">
                <p>El presente certificado es válido únicamente si se presenta junto a la VTV y el seguro obligatorio vigentes.</p>
            </footer>
        </div>

        <div class="text-center py-8 no-print">
            <button onclick="window.print()" class="inline-flex items-center gap-3 px-8 py-3 bg-[var(--dark-blue)] text-white rounded-lg shadow-lg hover:bg-sky-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span class="font-semibold">Imprimir o Guardar como PDF</span>
            </button>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js"></script>
    <script>
        new QRious({
            element: document.getElementById('qrcode'),
            value: '<?= e(obtenerUrlActual()) ?>',
            size: 140,
            level: 'H',
            padding: 8,
            background: '#ffffff',
            foreground: '#1e293b', // slate-800
        });
    </script>
</body>
</html>