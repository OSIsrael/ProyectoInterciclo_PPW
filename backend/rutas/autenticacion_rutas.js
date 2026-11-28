const express = require('express');

const autenticacionControlador = require(
    '../controladores/autenticacion_controlador'
);

const rutas = express.Router();

// Ruta para iniciar sesion
rutas.post('/login', autenticacionControlador.iniciarSesion);

module.exports = rutas;