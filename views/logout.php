<?php
require_once '../config/database.php';
require_once '../controllers/sesioncontrolador.php';

$database = new Database();
$db = $database->conectar();

$sesion = new SesionControlador($db);
$sesion->logout();

header("Location: login.php");
exit;
