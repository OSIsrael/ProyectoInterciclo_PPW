const baseDatos = require('../base_datos/conexion');

function listarPorLaboratorio(codigoLaboratorio){
    const consulta = baseDatos.prepare(`
        SELECT equ_codigo, equ_codigo_inventario, equ_tipo, equ_estado
        FROM GRL_EQUIPOS WHERE lab_codigo = ?
        ORDER BY equ_codigo_inventario
    `);
    return consulta.all(codigoLaboratorio);
}

function buscarPorInventario(codigoInventario){
    const consulta = baseDatos.prepare(`
        SELECT equ_codigo, equ_codigo_inventario, equ_tipo, equ_estado, lab_codigo
        FROM GRL_EQUIPOS WHERE equ_codigo_inventario = ?
    `);

    return consulta.get(codigoInventario);
}

function crearEquipo(codigoInventario, tipo, estado, codigoLaboratorio){
    const consulta = baseDatos.prepare(`
        INSERT INTO GRL_EQUIPOS(
            equ_codigo_inventario, equ_tipo, equ_estado, lab_codigo
        )
        VALUES(?, ?, ?, ?)
    `);
    const resultado = consulta.run(codigoInventario, tipo, estado, codigoLaboratorio);
    return resultado.lastInsertRowid;
}

module.exports = {listarPorLaboratorio, buscarPorInventario, crearEquipo};

