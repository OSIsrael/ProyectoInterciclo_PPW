const express = require('express');
const cors = require('cors');
require('dotenv').config();

const baseDatos = require('./base_datos/conexion');

//aplicacion express
const aplicacion = express();

const PUERTO = process.env.PORT || 3000;

aplicacion.use(cors({
    origin: 'http://localhost:4200'
}));

aplicacion.use(express.json());

// Ruta de prueba servidor
aplicacion.get('/api', (solicitud, respuesta) => {
    respuesta.json({
        mensaje: 'API de Gestión de Reservas de Laboratorios',
        estado: 'Servidor funcionando correctamente'
    });
});

// Ruta de prueba bdd
aplicacion.get('/api/base-datos', (solicitud, respuesta) => {
    const resultado = baseDatos
        .prepare('SELECT sqlite_version() AS version')
        .get();

    respuesta.json({
        mensaje: 'Base de datos conectada correctamente',
        version: resultado.version
    });
});

// Iniciar
aplicacion.listen(PUERTO, () => {
    console.log(`Servidor en http://localhost:${PUERTO}`);
});