const baseDatos = require('../base_datos/conexion');

// Buscar un usuario por su nombre de usuario
function buscarPorUsername(username) {

    return baseDatos.prepare(`
        SELECT usu_codigo,
               usu_nombre,
               usu_apellido,
               usu_correo,
               usu_username,
               usu_password_hash,
               usu_rol,
               usu_estado
        FROM GRL_USUARIOS
        WHERE usu_username = ?
    `).get(username);
}

// Buscar un usuario por su codigo
function buscarPorCodigo(codigo) {

    return baseDatos.prepare(`
        SELECT usu_codigo,
               usu_nombre,
               usu_apellido,
               usu_correo,
               usu_username,
               usu_rol,
               usu_estado
        FROM GRL_USUARIOS
        WHERE usu_codigo = ?
    `).get(codigo);
}

module.exports = {
    buscarPorUsername,
    buscarPorCodigo
};