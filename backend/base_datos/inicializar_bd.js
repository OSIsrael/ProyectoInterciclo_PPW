const baseDatos = require('./conexion');
const archivos = require('node:fs');
const ruta = require('node:path');

try {
    // Obtener la ruta del script SQL
    const rutaScript = ruta.join(__dirname, 'crear_tablas.sql');

    // Leer el contenido del archivo SQL
    const scriptSQL = archivos.readFileSync(rutaScript, 'utf8');

    // Iniciar una transacción
    baseDatos.exec('BEGIN TRANSACTION');

    // Ejecutar el script de creación de tablas
    baseDatos.exec(scriptSQL);

    // Confirmar los cambios
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

    // Cerrar la conexión
    baseDatos.close();
}