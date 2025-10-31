<?php
// config/bootstrap_session.php

// Verificar SI la sesión ya está iniciada ANTES de incluir sessions.php
if (session_status() !== PHP_SESSION_ACTIVE) {
    require_once __DIR__ . '/sessions.php';
    
    SessionManager::start();
    SessionManager::verifySessionData();
    register_shutdown_function([SessionManager::class, 'close']);
    
    error_log("✅ bootstrap_session.php ejecutado - Sesión iniciada: " . session_id());
} else {
    error_log("⚠️ bootstrap_session.php: Sesión ya activa, no se reinicia - ID: " . session_id());
}
?>