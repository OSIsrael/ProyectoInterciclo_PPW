const baseDatos = require('./conexion');
const archivos = require('node:fs');
const ruta = require('node:path');

try {
    const rutaScript = ruta.join(__dirname, 'crear_tablas.sql');

    const scriptSQL = archivos.readFileSync(rutaScript, 'utf8');

    baseDatos.exec('BEGIN TRANSACTION');

    baseDatos.exec(scriptSQL);

    baseDatos.exec('COMMIT');

    console.log('Base de datos inicializada correctamente');

} catch (error) {

    // Deshacer los cambios si existe una transacción activa
    if (baseDatos.isTransaction) {
        baseDatos.exec('ROLLBACK');
    }

    console.error('Error al inicializar la base de datos:', error.message);
    process.exitCode = 1;

} finally {

    baseDatos.close();
}