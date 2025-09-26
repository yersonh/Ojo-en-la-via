<?php
require_once '../config/database.php';
require_once '../controllers/sesioncontrolador.php';

// Crear conexión
$database = new Database();
$db = $database->conectar();

// Instanciar controlador
$controller = new SesionControlador($db);

// Manejo de registro
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['registrar'])) {
    $resultado = $controller->registrar(
        $_POST['nombres'],
        $_POST['apellidos'],
        $_POST['correo'],
        $_POST['telefono'],
        $_POST['id_rol'],
        $_POST['id_estado'], // Nuevo campo añadido
        $_POST['password']
    );
    
    if ($resultado) {
        echo "<script>
            alert('✅ Usuario registrado correctamente.');
            window.location.href = '../index.php';
        </script>";
        exit;
    } else {
        echo "<script>alert('❌ Error al registrar usuario.');</script>";
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <link rel="shortcut icon" href="../imagenes/fiveicon.png" type="image/x-icon">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <title>Registrar Usuario - Ojo en la vía</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: Arial, sans-serif; 
            background: url("../imagenes/login3.jpg") no-repeat center center/cover; 
            color: #fff; 
            text-align: center; 
            padding: 40px 20px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }
        
        .form-box { 
            background: rgba(59, 57, 57, 0.5);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 40px;
            border-radius: 15px;
            width: 100%;
            max-width: 450px;
        }
        
        h2 {
            margin-bottom: 20px;
            color: #fff;
            font-size: 24px;
        }
        
        .form-group {
            margin-bottom: 20px;
            text-align: left;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 14px;
        }
        
        input, select { 
            width: 100%; 
            padding: 12px; 
            border: 1px solid #444; 
            border-radius: 5px; 
            background: #333;
            color: #fff;
            font-size: 14px;
        }
        
        input:focus, select:focus {
            outline: none;
            border-color: #007bff;
        }
        
        .input-group {
            position: relative;
        }
        
        .icono-alerta {
            position: absolute;
            right: 12px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 18px;
            color: #ffcc00;
            display: none;
            cursor: pointer;
        }
        
        .mensaje-error {
            display: none;
            color: #ff5555;
            font-size: 12px;
            margin-top: 5px;
        }
        
        button { 
            background: #007bff; 
            color: #fff; 
            padding: 12px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            width: 100%;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }
        
        button:hover { 
            background: #0056b3; 
        }
        
        button:disabled {
            background: #555;
            cursor: not-allowed;
        }
        
        .volver-link { 
            color: #0af; 
            text-decoration: none; 
            display: block; 
            margin-top: 20px;
            font-size: 14px;
        }
        
        .volver-link:hover {
            text-decoration: underline;
        }
        
        .alert {
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 15px;
            display: none;
        }
        
        .alert-error {
            background: #ff4444;
            color: white;
        }
        
        .alert-success {
            background: #44ff44;
            color: black;
        }
    </style>
</head>
<body>
    <div class="form-box">
        <h2>👤 Registrar Usuario</h2>
        
        <div id="alert-message" class="alert"></div>
        
        <form method="POST" id="registroForm">
            <div class="form-group">
                <label for="nombres">Nombres:</label>
                <input type="text" id="nombres" name="nombres" placeholder="Ingresa tus nombres" required>
            </div>
            
            <div class="form-group">
                <label for="apellidos">Apellidos:</label>
                <input type="text" id="apellidos" name="apellidos" placeholder="Ingresa tus apellidos" required>
            </div>
            
            <div class="form-group">
                <label for="correo">Correo electrónico:</label>
                <div class="input-group">
                    <input type="email" id="correo" name="correo" placeholder="ejemplo@correo.com" required>
                    <span id="correo-alerta" class="icono-alerta" title="Este correo ya está registrado">⚠️</span>
                </div>
                <small id="mensaje-error" class="mensaje-error"></small>
            </div>
            
            <div class="form-group">
                <label for="telefono">Teléfono:</label>
                <input type="text" id="telefono" name="telefono" placeholder="Ingresa tu teléfono" required>
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" name="password" placeholder="Crea una contraseña segura" required>
            </div>
            
            <div class="form-group">
                <label for="id_rol">Rol:</label>
                <select id="id_rol" name="id_rol" required>
                    <option value="">Selecciona un rol</option>
                    <option value="1">Administrador</option>
                    <option value="2">Usuario</option>
                </select>
            </div>

            <div class="form-group">
                <label for="id_estado">Estado:</label>
                <select id="id_estado" name="id_estado" required>
                    <option value="">Selecciona un estado</option>
                    <option value="1" selected>Activo</option>
                    <option value="2">Inactivo</option>
                    <option value="3">Bloqueado</option>
                </select>
            </div>

            <button type="submit" name="registrar" id="btnRegistrar">Registrar</button>
        </form>
        
        <a href="../index.php" class="volver-link">⬅ Volver al inicio</a>
    </div>

    <script>
        // Mostrar/ocultar alerta
        function mostrarAlerta(mensaje, tipo) {
            const alerta = document.getElementById('alert-message');
            alerta.textContent = mensaje;
            alerta.className = 'alert ' + (tipo === 'error' ? 'alert-error' : 'alert-success');
            alerta.style.display = 'block';
            
            setTimeout(() => {
                alerta.style.display = 'none';
            }, 5000);
        }

        // Verificar correo al perder foco
        document.getElementById("correo").addEventListener("blur", function() {
            verificarCorreo(this.value);
        });

        // Verificar correo mientras se escribe (después de 1 segundo sin escribir)
        let timeoutId;
        document.getElementById("correo").addEventListener("input", function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                verificarCorreo(this.value);
            }, 1000);
        });

        function verificarCorreo(correo) {
            const alerta = document.getElementById("correo-alerta");
            const mensajeError = document.getElementById("mensaje-error");
            const btnRegistrar = document.getElementById("btnRegistrar");

            // Validación básica de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (correo.trim() === "") {
                alerta.style.display = "none";
                mensajeError.style.display = "none";
                btnRegistrar.disabled = false;
                return;
            }

            if (!emailRegex.test(correo)) {
                alerta.style.display = "inline";
                mensajeError.style.display = "block";
                mensajeError.textContent = "Formato de correo inválido";
                btnRegistrar.disabled = true;
                return;
            }

            // Verificar si el correo existe
            fetch("manage/verificar_correoManage.php", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/x-www-form-urlencoded" 
                },
                body: "correo=" + encodeURIComponent(correo)
            })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }
                return res.json();
            })
            .then(data => {
                if (data.existe) {
                    alerta.style.display = "inline";
                    mensajeError.style.display = "block";
                    mensajeError.textContent = "Este correo ya está registrado. Intenta con otro.";
                    btnRegistrar.disabled = true;
                } else {
                    alerta.style.display = "none";
                    mensajeError.style.display = "none";
                    btnRegistrar.disabled = false;
                }
            })
            .catch(err => {
                console.error("Error en la verificación:", err);
                alerta.style.display = "none";
                mensajeError.style.display = "none";
                btnRegistrar.disabled = false;
            });
        }

        // Validar formulario antes de enviar
        document.getElementById("registroForm").addEventListener("submit", function(e) {
            const correo = document.getElementById("correo").value;
            const alerta = document.getElementById("correo-alerta");
            
            if (alerta.style.display === "inline") {
                e.preventDefault();
                mostrarAlerta("❌ Por favor, usa un correo electrónico que no esté registrado.", "error");
                return false;
            }
            
            // Validación adicional de campos (incluyendo el nuevo id_estado)
            const campos = ['nombres', 'apellidos', 'telefono', 'password', 'id_rol', 'id_estado'];
            for (let campo of campos) {
                if (!document.getElementById(campo).value.trim()) {
                    e.preventDefault();
                    mostrarAlerta("❌ Por favor, completa todos los campos.", "error");
                    return false;
                }
            }
            
            return true;
        });

        // Validar teléfono (solo números)
        document.getElementById("telefono").addEventListener("input", function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Establecer estado por defecto como "Activo"
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('id_estado').value = '1';
        });
    </script>
</body>
</html>