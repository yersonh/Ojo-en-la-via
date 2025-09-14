<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Inicio - UberApp</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #f5f5f5;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        /* Fondo con imagen de mapa y overlay oscuro */
        body::before {
            content: "";
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image: url("../public/mapa.png"); /* Imagen tipo Google Maps oscura */
            background-size: cover;
            background-position: center;
            filter: brightness(0.4); /* Oscurecer el mapa */
            z-index: -1;
        }

        .content {
            z-index: 1;
            max-width: 600px;
            padding: 20px;
        }

        .logo {
            width: 120px;
            height: auto;
            margin-bottom: 20px;
            filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.1));
        }

        h1 {
            font-size: 2.5em;
            color: #ffffff;
            margin-bottom: 10px;
        }

        p {
            color: #cfcfcf;
            font-size: 1.1em;
        }

        .btn {
            margin-top: 20px;
            padding: 12px 24px;
            background-color: #1f1f1f;
            border: 1px solid #333;
            color: #ffffff;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn:hover {
            background-color: #2a2a2a;
            border-color: #555;
        }
    </style>
</head>
<body>

    <div class="content">
        <img src="../public/uber.png" alt="Uber Logo" class="logo">
        <h1>Bienvenido a UberApp</h1>
        <p>Usa el menú lateral para navegar por el panel de control. Gestiona pasajeros, viajes, conductores y más.</p>
    </div>

</body>
</html>
