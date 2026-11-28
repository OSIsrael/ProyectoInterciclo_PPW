const baseDatos = require('../base_datos/conexion');

function crearIncidencia(codigoEquipo, codigoUsuario, descripcion, prioridad){
    const consulta = baseDatos.prepare(`
        INSERT INTO GRL_INCIDENCIAS(
            equ_codigo, usu_codigo, inc_descripcion, inc_prioridad, inc_estado  
        )
        VALUES (?,?,?,?,'P')
    `);

    const resultado = consulta.run(codigoEquipo,codigoUsuario, descripcion, prioridad);
    return resultado.lastInsertRowid;
}

function listarPorEquipo(codigoEquipo){
    const consulta = baseDatos.prepare(`
        SELECT inc_codigo, inc_descripcion, inc_prioridad, inc_estado, inc_fecha_reporte,
            usu_codigo
        FROM GRL_INCIDENCIAS WHERE equ_codigo = ?
        ORDER BY inc_fecha_reporte DESC, inc_codigo DESC
    `);
    return consulta.all(codigoEquipo);
}

module.exports = {crearIncidencia, listarPorEquipo};