const { DatabaseSync } = require('node:sqlite');
const ruta = require('node:path');

const rutaBaseDatos = ruta.join(__dirname, 'reservas.db');

// Crear o abrir la base de datos SQLite
const baseDatos = new DatabaseSync(rutaBaseDatos);

// Activar las claves foráneas
baseDatos.exec('PRAGMA foreign_keys = ON');

console.log('Conexión a SQLite establecida correctamente');

module.exports = baseDatos;