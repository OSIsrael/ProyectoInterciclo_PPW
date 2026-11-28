const baseDatos = require('../base_datos/conexion');

function crearNotificacion({
    codigoUsuario,tipo,titulo,mensaje,
    codigoIncidencia = null, codigoReserva = null
}) {
    const consulta = baseDatos.prepare(`
        INSERT INTO GRL_NOTIFICACIONES(
            usu_codigo, not_tipo, not_titulo, not_mensaje, 
            inc_codigo, res_codigo
        )
        VALUES (?, ?, ?, ?, ?, ?)

    `);

    const resultado = consulta.run(codigoUsuario, tipo, titulo, 
        mensaje, codigoIncidencia, codigoReserva
    );

    return resultado.lastInsertRowid;
}

function listarPorUsuario(codigoUsuario){
    const consulta = baseDatos.prepare(`
        SELECT not_codigo, not_tipo, not_titulo, not_mensaje, 
            not_fecha_creacion, not_leida, inc_codigo, res_codigo
        FROM GRL_NOTIFICACIONES WHERE usu_codigo = ?
        ORDER BY not_fecha_creacion DESC, not_codigo DESC
    `);

    return consulta.all(codigoUsuario);
}

module.exports = {crearNotificacion, listarPorUsuario};