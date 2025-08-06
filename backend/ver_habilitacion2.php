<?php
// =================================================================
// detalle_habilitacion.php - v7.9 (Botones de descarga de PDF)
// =================================================================

// MOSTRAR ERRORES PHP (solo para desarrollo, deshabilitar en producción)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once '../conexion.php';
session_start();

// Redirigir si no hay sesión
if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

// --- ¡IMPORTANTE! URL BASE DEL SUBDOMINIO DONDE ESTÁN LAS IMÁGENES ---
define('API_URL_BASE', 'https://credenciales.transportelanus.com.ar/');

// --- FUNCIONES DE UTILIDAD ---
function e($str) { return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8'); }
function getTipoTransporteFromLicencia($nroLicencia) { return (is_string($nroLicencia) && str_starts_with($nroLicencia, '068-')) ? 'Escolar' : 'Remis'; }
function getEstadoBadgeClass($estado) {
    switch (strtoupper($estado)) {
        case 'HABILITADO': return 'bg-green-100 text-green-800';
        case 'VENCIDO': case 'RECHAZADO': return 'bg-red-100 text-red-800';
        case 'EN TRAMITE': case 'APROBADO PARA OBLEA': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
function getTurnoBadgeClass($estado) {
    switch (strtoupper($estado)) {
        case 'CONFIRMADO': return 'bg-green-100 text-green-800';
        case 'CANCELADO': case 'ANULADO': return 'bg-red-100 text-red-800';
        case 'PENDIENTE': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}
function getInspectionItemStatusClass($estado) {
    switch (strtolower($estado)) {
        case 'bien': return 'bg-green-100 text-green-800';
        case 'regular': return 'bg-yellow-100 text-yellow-800';
        case 'mal': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// --- INICIALIZACIÓN DE VARIABLES ---
$habilitacion = null;
$id = $_GET['id'] ?? null;
$nro_licencia_param = $_GET['nro_licencia'] ?? null;
$found_by = '';
$error_message_general = null;
$personas = $vehiculo = $destino = $token = [];
$historialTurnos = $historialVerificacion = $historial_inspecciones_tecnicas = $historialObleas = [];
$alertas_vencimiento = []; // Para las alertas

// --- LÓGICA PRINCIPAL: Cargar datos de la habilitación y relacionados ---
try {
    if ($id && is_numeric($id)) {
        $stmt = $pdo->prepare("SELECT * FROM habilitaciones_generales WHERE id = ?");
        $stmt->execute([$id]);
        $habilitacion = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($habilitacion) $found_by = 'ID';
    }

    if (!$habilitacion && $nro_licencia_param) {
        $stmt = $pdo->prepare("SELECT * FROM habilitaciones_generales WHERE nro_licencia = ?");
        $stmt->execute([$nro_licencia_param]);
        $habilitacion = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($habilitacion) {
            $id = $habilitacion['id'];
            $found_by = 'Número de Licencia';
        }
    }

    if (!$habilitacion) {
        throw new Exception("Habilitación no encontrada. Verifique el ID o el número de licencia proporcionado.");
    }

    $id = $habilitacion['id']; // Asegurarnos de que el ID esté seteado
    $habilitacion['tipo_transporte_detectado'] = getTipoTransporteFromLicencia($habilitacion['nro_licencia']);

    // --- Cargar datos relacionados ---
    $stmt_personas = $pdo->prepare("SELECT p.nombre, p.dni, hp.rol, hp.licencia_categoria FROM habilitaciones_personas hp JOIN personas p ON p.id = hp.persona_id WHERE hp.habilitacion_id = ?");
    $stmt_personas->execute([$id]);
    $personas = $stmt_personas->fetchAll(PDO::FETCH_ASSOC);

    // Se traen todos los campos del vehículo
    $stmt_vehiculo = $pdo->prepare(
        "SELECT v.dominio, v.marca, v.modelo, v.chasis, v.ano, v.motor, v.asientos, v.inscripcion_inicial, v.Aseguradora, v.poliza, v.Vencimiento_Poliza, v.Vencimiento_VTV 
         FROM habilitaciones_vehiculos hv JOIN vehiculos v ON v.id = hv.vehiculo_id 
         WHERE hv.habilitacion_id = ? LIMIT 1"
    );
    $stmt_vehiculo->execute([$id]);
    $vehiculo = $stmt_vehiculo->fetch(PDO::FETCH_ASSOC);

    $stmt_destino = $pdo->prepare("SELECT he.tipo, CASE WHEN he.tipo = 'establecimiento' THEN e.nombre ELSE r.nombre END AS nombre, CASE WHEN he.tipo = 'establecimiento' THEN e.domicilio ELSE NULL END AS domicilio FROM habilitaciones_establecimientos he LEFT JOIN establecimientos e ON (he.tipo = 'establecimiento' AND he.establecimiento_id = e.id) LEFT JOIN remiserias r ON (he.tipo = 'remiseria' AND he.establecimiento_id = r.id) WHERE he.habilitacion_id = ? LIMIT 1");
    $stmt_destino->execute([$id]);
    $destino = $stmt_destino->fetch(PDO::FETCH_ASSOC);

    $stmt_token = $pdo->prepare("SELECT token FROM tokens_acceso WHERE habilitacion_id = ? ORDER BY creado_en DESC LIMIT 1");
    $stmt_token->execute([$id]);
    $token = $stmt_token->fetchColumn();

    $stmt_turnos = $pdo->prepare("SELECT fecha, hora, observaciones, estado FROM turnos WHERE habilitacion_id = ? ORDER BY fecha DESC, hora DESC");
    $stmt_turnos->execute([$id]);
    $historialTurnos = $stmt_turnos->fetchAll(PDO::FETCH_ASSOC);

    $stmt_verificaciones = $pdo->prepare("SELECT fecha, hora, nombre_titular, dominio, resultado FROM verificaciones_historial WHERE nro_licencia = ? ORDER BY fecha DESC, hora DESC");
    $stmt_verificaciones->execute([$habilitacion['nro_licencia']]);
    $historialVerificacion = $stmt_verificaciones->fetchAll(PDO::FETCH_ASSOC);
    
    $stmt_obleas = $pdo->prepare("SELECT * FROM obleas WHERE habilitacion_id = ? ORDER BY fecha_colocacion DESC");
    $stmt_obleas->execute([$id]);
    $historialObleas = $stmt_obleas->fetchAll(PDO::FETCH_ASSOC);

    $stmt_inspecciones_tecnicas = $pdo->prepare("SELECT id, nro_licencia, tipo_transporte, nombre_inspector, fecha_inspeccion, firma_inspector, firma_contribuyente, resultado FROM inspecciones WHERE habilitacion_id = ? ORDER BY fecha_inspeccion DESC");
    $stmt_inspecciones_tecnicas->execute([$id]);
    $inspecciones_tecnicas_raw = $stmt_inspecciones_tecnicas->fetchAll(PDO::FETCH_ASSOC);

    if (!empty($inspecciones_tecnicas_raw)) {
        $inspecciones_tecnicas_ids = array_column($inspecciones_tecnicas_raw, 'id');
        
        foreach($inspecciones_tecnicas_raw as $insp_tecnica) {
            $historial_inspecciones_tecnicas[$insp_tecnica['id']] = $insp_tecnica;
            $historial_inspecciones_tecnicas[$insp_tecnica['id']]['items_detalles'] = [];
            $historial_inspecciones_tecnicas[$insp_tecnica['id']]['fotos_vehiculo'] = [];
        }

        if (!empty($inspecciones_tecnicas_ids)) {
            $ids_placeholder = implode(',', array_fill(0, count($inspecciones_tecnicas_ids), '?'));
            
            $stmt_detalles_tecnicas = $pdo->prepare("SELECT inspeccion_id, item_id, nombre_item, estado, observacion, foto_path FROM inspeccion_detalles WHERE inspeccion_id IN ($ids_placeholder)");
            $stmt_detalles_tecnicas->execute($inspecciones_tecnicas_ids);
            while ($detalle_tecnica = $stmt_detalles_tecnicas->fetch(PDO::FETCH_ASSOC)) {
                $historial_inspecciones_tecnicas[$detalle_tecnica['inspeccion_id']]['items_detalles'][] = $detalle_tecnica;
            }

            $stmt_fotos_vehiculo = $pdo->prepare("SELECT inspeccion_id, tipo_foto, foto_path FROM inspeccion_fotos WHERE inspeccion_id IN ($ids_placeholder) ORDER BY FIELD(tipo_foto, 'frente', 'contrafrente', 'lateral_izq', 'lateral_der', 'adicional')");
            $stmt_fotos_vehiculo->execute($inspecciones_tecnicas_ids);
            while ($foto_vehiculo = $stmt_fotos_vehiculo->fetch(PDO::FETCH_ASSOC)) {
                $historial_inspecciones_tecnicas[$foto_vehiculo['inspeccion_id']]['fotos_vehiculo'][] = $foto_vehiculo;
            }
        }
    }

    // Lógica para Alertas de Vencimiento
    $hoy = new DateTime();
    $limite_pronto_a_vencer = (new DateTime())->modify('+30 days');

    function checkVencimiento($fecha_str, $nombre_item) {
        if (empty($fecha_str)) return null;

        try {
            $fecha_vencimiento = new DateTime($fecha_str);
            $hoy = new DateTime();
            $limite_pronto_a_vencer = (new DateTime())->modify('+30 days');
            
            if ($fecha_vencimiento < $hoy) {
                return ['tipo' => 'vencido', 'mensaje' => "<strong>$nombre_item VENCIDA</strong> el día " . $fecha_vencimiento->format('d/m/Y') . "."];
            } elseif ($fecha_vencimiento <= $limite_pronto_a_vencer) {
                $diferencia = $hoy->diff($fecha_vencimiento);
                $dias_restantes = $diferencia->days;
                if ($dias_restantes == 0) {
                    return ['tipo' => 'pronto', 'mensaje' => "<strong>$nombre_item PRONTA A VENCER.</strong> Vence hoy, " . $fecha_vencimiento->format('d/m/Y') . "."];
                }
                return ['tipo' => 'pronto', 'mensaje' => "<strong>$nombre_item PRONTA A VENCER.</strong> Vence el " . $fecha_vencimiento->format('d/m/Y') . " (en $dias_restantes días)."];
            }
        } catch (Exception $e) {
            // Ignorar fechas inválidas
        }
        return null;
    }

    if ($alerta = checkVencimiento($habilitacion['vigencia_fin'], 'La Habilitación')) $alertas_vencimiento[] = $alerta;
    if ($vehiculo) {
        if ($alerta = checkVencimiento($vehiculo['Vencimiento_VTV'], 'La VTV')) $alertas_vencimiento[] = $alerta;
        if ($alerta = checkVencimiento($vehiculo['Vencimiento_Poliza'], 'La Póliza de Seguro')) $alertas_vencimiento[] = $alerta;
    }


} catch (Exception $e) {
    $error_message_general = $e->getMessage();
    error_log("Error al cargar detalle de habilitación: " . $e->getMessage());
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Detalle de Habilitación: <?= e($habilitacion['nro_licencia'] ?? 'N/A') ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="favicon.ico" type="image/x-icon">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    <style>
        :root {
            --color-primary: #3b82f6;
            --color-secondary: #60a5fa;
            --color-text-primary: #1f2937;
            --color-text-secondary: #6b7280;
            --color-bg-light: #f9fafb;
            --color-bg-card: #ffffff;
            --color-border: #e5e7eb;
        }
        body { font-family: 'Inter', sans-serif; background-color: var(--color-bg-light); color: var(--color-text-primary); }
        .status-badge { padding: 0.25rem 0.75rem; font-weight: 600; font-size: 0.75rem; border-radius: 9999px; display: inline-block; line-height: 1.25; }
        .signature-display { max-width: 250px; height: auto; border: 1px dashed var(--color-border); padding: 5px; border-radius: 8px; background-color: #f9fafb;}
        [x-cloak] { display: none !important; }
    </style>
</head>
<body class="antialiased" x-data="{ isObleaModalOpen: false, obleaModalData: {}, isVerificacionModalOpen: false, verificacionModalData: {}, isInspeccionModalOpen: false, inspeccionModalData: {} }">

<header class="bg-white shadow-sm sticky top-0 z-40">
    <div class="max-w-7xl mx-auto flex justify-between items-center p-4">
        <h1 class="text-xl font-bold" style="color:var(--color-primary);">Detalle de Habilitación</h1>
        <a href="index.php" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>
            Volver
        </a>
    </div>
</header>

<main class="w-full max-w-7xl mx-auto mt-8 px-4 sm:px-6 lg:px-8 mb-16">

    <?php if ($error_message_general): ?>
        <div class="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
            <p class="font-bold text-lg">Error al Cargar la Habilitación</p>
            <p class="mt-2"><?= e($error_message_general) ?></p>
        </div>
    <?php elseif ($habilitacion): ?>
        
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div class="flex flex-wrap justify-between items-start gap-6">
                <div>
                    <h2 class="text-3xl font-bold tracking-tight" style="color:var(--color-text-primary);">Licencia N° <span class="font-mono" style="color:var(--color-primary);"><?= e($habilitacion['nro_licencia']) ?></span></h2>
                    <p class="mt-1" style="color:var(--color-text-secondary);">Información detallada y registro de actividad de la habilitación.</p>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                    <a href="editar_habilitacion.php?id=<?= e($id) ?>" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>
                        Editar
                    </a>
                    <?php if ($token): ?>
                        <a href="../publico/credencial.php?token=<?= e(urlencode($token)) ?>" target="_blank" class="bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>
                            Credencial
                        </a>
                    <?php endif; ?>
                     <a href="descargar_constancia.php?id=<?= e($id) ?>" target="_blank" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>
                        Descargar Constancia
                    </a>
                       <a href="descargar_resolucion.php?id=<?= e($id) ?>" target="_blank" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" /></svg>
                        Descargar Resolución
                    </a>
                </div>
            </div>
        </div>

        <?php if (!empty($alertas_vencimiento)): ?>
        <div class="space-y-4 mb-8">
            <?php foreach($alertas_vencimiento as $alerta): ?>
                <div class="p-4 rounded-lg flex items-center gap-4 <?php echo $alerta['tipo'] === 'vencido' ? 'bg-red-100 text-red-800 border border-red-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'; ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <p><?= $alerta['mensaje'] ?></p>
                </div>
            <?php endforeach; ?>
        </div>
        <?php endif; ?>

        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">

            <div class="xl:col-span-1 space-y-8">
                
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Datos de la Habilitación</h3>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div class="sm:col-span-2"><dt class="font-semibold" style="color:var(--color-text-secondary);">Estado</dt><dd class="mt-1"><span class="status-badge <?= getEstadoBadgeClass($habilitacion['estado']) ?>"><?= e(str_replace('_', ' ', $habilitacion['estado'])) ?></span></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Tipo Trámite</dt><dd class="mt-1"><?= e($habilitacion['tipo']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Transporte</dt><dd class="mt-1"><?= e($habilitacion['tipo_transporte_detectado']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Vigencia Inicio</dt><dd class="mt-1"><?= !empty($habilitacion['vigencia_inicio']) ? date('d/m/Y', strtotime($habilitacion['vigencia_inicio'])) : 'N/A' ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Vigencia Fin</dt><dd class="mt-1 font-bold"><?= !empty($habilitacion['vigencia_fin']) ? date('d/m/Y', strtotime($habilitacion['vigencia_fin'])) : 'N/A' ?></dd></div>
                    </dl>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>Personas Asociadas</h3>
                    <div class="space-y-4">
                        <?php if ($personas): foreach ($personas as $p): ?>
                        <div class="flex items-start gap-4 p-3 rounded-lg" style="background-color: var(--color-bg-light); border: 1px solid var(--color-border);">
                            <div class="flex-grow">
                                <div class="flex justify-between items-center">
                                    <p class="font-bold"><?= e($p['nombre']) ?></p>
                                    <span class="status-badge <?= getEstadoBadgeClass($p['rol']) ?>"><?= e($p['rol']) ?></span>
                                </div>
                                <p class="text-sm" style="color:var(--color-text-secondary);">DNI: <?= e($p['dni']) ?></p>
                            </div>
                        </div>
                        <?php endforeach; else: ?>
                        <p class="italic" style="color:var(--color-text-secondary);">Sin personas asociadas.</p>
                        <?php endif; ?>
                    </div>
                </div>

                <?php if ($vehiculo): ?>
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-lg font-bold mb-4 flex items-center gap-2" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>Vehículo Asociado</h3>
                    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div class="sm:col-span-2"><dt class="font-semibold" style="color:var(--color-text-secondary);">Dominio</dt><dd class="mt-1 font-mono font-bold text-base"><?= e($vehiculo['dominio']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Marca</dt><dd class="mt-1"><?= e($vehiculo['marca']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Modelo</dt><dd class="mt-1"><?= e($vehiculo['modelo']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Año</dt><dd class="mt-1"><?= e($vehiculo['ano']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Asientos</dt><dd class="mt-1"><?= e($vehiculo['asientos']) ?></dd></div>
                        <div class="sm:col-span-2"><dt class="font-semibold" style="color:var(--color-text-secondary);">Chasis</dt><dd class="mt-1 font-mono"><?= e($vehiculo['chasis']) ?></dd></div>
                        <div class="sm:col-span-2"><dt class="font-semibold" style="color:var(--color-text-secondary);">Motor</dt><dd class="mt-1 font-mono"><?= e($vehiculo['motor']) ?></dd></div>
                        <hr class="sm:col-span-2 my-2">
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Aseguradora</dt><dd class="mt-1"><?= e($vehiculo['Aseguradora']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Póliza N°</dt><dd class="mt-1"><?= e($vehiculo['poliza']) ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Vencimiento Póliza</dt><dd class="mt-1 font-bold"><?= !empty($vehiculo['Vencimiento_Poliza']) ? date('d/m/Y', strtotime($vehiculo['Vencimiento_Poliza'])) : 'N/A' ?></dd></div>
                        <div><dt class="font-semibold" style="color:var(--color-text-secondary);">Vencimiento VTV</dt><dd class="mt-1 font-bold"><?= !empty($vehiculo['Vencimiento_VTV']) ? date('d/m/Y', strtotime($vehiculo['Vencimiento_VTV'])) : 'N/A' ?></dd></div>
                    </dl>
                </div>
                <?php endif; ?>
            </div>

            <div class="xl:col-span-2 space-y-8">
                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-3" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>Historial de Colocación de Obleas</h3>
                    <?php if (empty($historialObleas)): ?>
                        <div class="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-lg"><p>No hay registros de colocación de obleas para esta habilitación.</p></div>
                    <?php else: ?>
                        <ul class="space-y-3">
                            <?php foreach ($historialObleas as $oblea): ?>
                                <li class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-bg-light);">
                                    <div>
                                        <p class="font-semibold"><?= date("d/m/Y H:i", strtotime($oblea['fecha_colocacion'])) ?> hs</p>
                                        <p class="text-sm" style="color:var(--color-text-secondary);">Receptor: <?= e($oblea['titular']) ?></p>
                                    </div>
                                    <button @click="isObleaModalOpen = true; obleaModalData = <?= htmlspecialchars(json_encode($oblea), ENT_QUOTES, 'UTF-8') ?>;" class="bg-sky-100 text-sky-700 hover:bg-sky-200 font-semibold py-1 px-3 rounded-full text-xs transition-colors">Ver Evidencia</button>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>

                 <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-3" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Historial de Verificaciones</h3>
                    <?php if (empty($historialVerificacion)): ?>
                        <div class="bg-blue-50 border-l-4 border-blue-400 text-blue-700 p-4 rounded-lg"><p>No hay verificaciones externas registradas.</p></div>
                    <?php else: ?>
                        <ul class="space-y-3">
                            <?php foreach ($historialVerificacion as $verificacion): ?>
                                <li class="flex items-center justify-between p-3 rounded-lg" style="background-color: var(--color-bg-light);">
                                    <div>
                                        <p class="font-semibold"><?= date("d/m/Y H:i", strtotime($verificacion['fecha'] . ' ' . $verificacion['hora'])) ?> hs</p>
                                        <p class="text-sm" style="color:var(--color-text-secondary);">Resultado: <span class="font-bold <?= $verificacion['resultado'] === 'APROBADO' ? 'text-green-600' : 'text-red-600' ?>"><?= e($verificacion['resultado']) ?></span></p>
                                    </div>
                                    <button @click="isVerificacionModalOpen = true; verificacionModalData = <?= htmlspecialchars(json_encode($verificacion), ENT_QUOTES, 'UTF-8') ?>;" class="bg-sky-100 text-sky-700 hover:bg-sky-200 font-semibold py-1 px-3 rounded-full text-xs transition-colors">Ver Detalle</button>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>

                <div class="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <h3 class="text-xl font-bold mb-6 flex items-center gap-3" style="color:var(--color-text-primary);"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" style="color:var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>Historial de Inspecciones</h3>
                    <?php if (empty($historial_inspecciones_tecnicas)): ?>
                                    </div>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    <?php endif; ?>
</main>

<div x-cloak x-show="isObleaModalOpen" @keydown.escape.window="isObleaModalOpen = false" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div @click.away="isObleaModalOpen = false" class="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8 space-y-6 transform transition-all" x-show="isObleaModalOpen" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95">
        <div class="flex justify-between items-center">
            <h3 class="text-2xl font-bold" style="color:var(--color-primary);">Evidencia de Colocación de Oblea</h3>
            <button @click="isObleaModalOpen = false" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>
        <div>
            <p><span class="font-semibold">Fecha:</span> <span x-text="new Date(obleaModalData.fecha_colocacion).toLocaleString('es-AR')"></span></p>
            <p><span class="font-semibold">Receptor:</span> <span x-text="obleaModalData.titular"></span></p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                <h4 class="font-bold mb-2">Foto de Evidencia</h4>
                <a :href="'<?= API_URL_BASE ?>' + obleaModalData.path_foto" target="_blank"><img :src="'<?= API_URL_BASE ?>' + obleaModalData.path_foto" alt="Evidencia fotográfica" class="rounded-lg border-2 border-gray-200 w-full hover:border-blue-500 transition"></a>
            </div>
            <div class="md:col-span-2 grid grid-cols-2 gap-6">
                <div>
                    <h4 class="font-bold mb-2">Firma del Receptor</h4>
                    <img :src="'<?= API_URL_BASE ?>' + obleaModalData.path_firma_receptor" alt="Firma del Receptor" class="rounded-lg border-2 border-gray-200 w-full">
                </div>
                <div>
                    <h4 class="font-bold mb-2">Firma del Inspector</h4>
                    <img :src="'<?= API_URL_BASE ?>' + obleaModalData.path_firma_inspector" alt="Firma del Inspector" class="rounded-lg border-2 border-gray-200 w-full">
                </div>
            </div>
        </div>
        <div class="text-right pt-4 border-t border-gray-200">
            <button @click="isObleaModalOpen = false" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
        </div>
    </div>
</div>

<div x-cloak x-show="isVerificacionModalOpen" @keydown.escape.window="isVerificacionModalOpen = false" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div @click.away="isVerificacionModalOpen = false" class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 space-y-4 transform transition-all" x-show="isVerificacionModalOpen" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95">
        <div class="flex justify-between items-center">
            <h3 class="text-2xl font-bold" style="color:var(--color-primary);">Detalle de Verificación</h3>
            <button @click="isVerificacionModalOpen = false" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
        </div>
        <dl class="grid grid-cols-1 gap-x-4 gap-y-4 text-sm">
            <div><dt class="font-semibold text-gray-500">Fecha y Hora</dt><dd class="mt-1" x-text="new Date(verificacionModalData.fecha + 'T' + verificacionModalData.hora).toLocaleString('es-AR')"></dd></div>
            <div><dt class="font-semibold text-gray-500">Resultado</dt><dd class="mt-1"><span class="status-badge" :class="verificacionModalData.resultado === 'APROBADO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" x-text="verificacionModalData.resultado"></span></dd></div>
            <div><dt class="font-semibold text-gray-500">Titular Verificado</dt><dd class="mt-1" x-text="verificacionModalData.nombre_titular"></dd></div>
            <div><dt class="font-semibold text-gray-500">Dominio Verificado</dt><dd class="mt-1 font-mono" x-text="verificacionModalData.dominio"></dd></div>
        </dl>
        <div class="text-right pt-4 border-t border-gray-200">
            <button @click="isVerificacionModalOpen = false" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
        </div>
    </div>
</div>

<div x-cloak x-show="isInspeccionModalOpen" @keydown.escape.window="isInspeccionModalOpen = false" class="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
    <div @click.away="isInspeccionModalOpen = false" class="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col transform transition-all" x-show="isInspeccionModalOpen" x-transition:enter="ease-out duration-300" x-transition:enter-start="opacity-0 scale-95" x-transition:enter-end="opacity-100 scale-100" x-transition:leave="ease-in duration-200" x-transition:leave-start="opacity-100 scale-100" x-transition:leave-end="opacity-0 scale-95">
        <div class="p-6 border-b border-gray-200">
            <div class="flex justify-between items-center">
                <h3 class="text-2xl font-bold" style="color:var(--color-primary);">Detalle de Inspección Técnica</h3>
                <button @click="isInspeccionModalOpen = false" class="text-gray-400 hover:text-gray-600 text-3xl leading-none">&times;</button>
            </div>
            <div>
                <p><span class="font-semibold">Fecha:</span> <span x-text="new Date(inspeccionModalData.fecha_inspeccion).toLocaleString('es-AR')"></span></p>
                <p><span class="font-semibold">Inspector:</span> <span x-text="inspeccionModalData.nombre_inspector"></span></p>
            </div>
        </div>
        <div class="p-6 overflow-y-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-1">
                    <h4 class="font-bold mb-2">Items Verificados</h4>
                    <ul class="space-y-1">
                        <template x-for="item in inspeccionModalData.items_detalles" :key="item.item_id">
                            <li class="flex justify-between items-center text-sm p-2 rounded-md" style="background-color: var(--color-bg-light);">
                                <span x-text="item.nombre_item"></span>
                                <span class="status-badge text-xs" :class="{
                                    'bg-green-100 text-green-800': item.estado.toLowerCase() === 'bien',
                                    'bg-yellow-100 text-yellow-800': item.estado.toLowerCase() === 'regular',
                                    'bg-red-100 text-red-800': item.estado.toLowerCase() === 'mal',
                                    'bg-gray-100 text-gray-800': !['bien', 'regular', 'mal'].includes(item.estado.toLowerCase())
                                }" x-text="item.estado.toUpperCase()"></span>
                            </li>
                        </template>
                    </ul>
                </div>
                <div class="lg:col-span-2 space-y-6">
                    <div>
                        <h4 class="font-bold mb-2">Firmas</h4>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <h5 class="text-sm font-bold text-gray-500">INSPECTOR</h5>
                                <img :src="inspeccionModalData.firma_inspector" alt="Firma Inspector" class="signature-display mt-1">
                            </div>
                            <div>
                                <h5 class="text-sm font-bold text-gray-500">CONTRIBUYENTE</h5>
                                <img :src="inspeccionModalData.firma_contribuyente" alt="Firma Contribuyente" class="signature-display mt-1">
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold mb-2">Evidencia Fotográfica</h4>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            <template x-for="foto in [...(inspeccionModalData.items_detalles.filter(i => i.foto_path)), ...inspeccionModalData.fotos_vehiculo]" :key="foto.foto_path">
                                <a :href="'<?= API_URL_BASE ?>' + foto.foto_path" target="_blank" class="block aspect-square">
                                    <img :src="'<?= API_URL_BASE ?>' + foto.foto_path" class="h-full w-full object-cover rounded-md border-2 border-transparent hover:border-blue-500 transition" />
                                </a>
                            </template>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="p-6 text-right border-t border-gray-200">
            <button @click="isInspeccionModalOpen = false" class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg">Cerrar</button>
        </div>
    </div>
</div>

</body>
</html>