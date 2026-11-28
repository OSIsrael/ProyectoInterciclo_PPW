const baseDatos = require('../base_datos/conexion');

function listarTodas() {
  return baseDatos.prepare(`
    SELECT r.*,
           l.lab_nombre,
           e.equ_codigo_inventario,
           (u.usu_nombre || ' ' || u.usu_apellido) AS solicitante_nombre,
           u.usu_rol AS solicitante_rol
    FROM GRL_RESERVAS r
    JOIN GRL_LABORATORIOS l ON l.lab_codigo = r.lab_codigo
    JOIN GRL_USUARIOS u ON u.usu_codigo = r.usu_codigo
    LEFT JOIN GRL_EQUIPOS e ON e.equ_codigo = r.equ_codigo
    ORDER BY r.res_fecha_hora_inicio DESC
  `).all();
}

function listarPorUsuario(usuCodigo) {
  return baseDatos.prepare(`
    SELECT r.*, l.lab_nombre, e.equ_codigo_inventario
    FROM GRL_RESERVAS r
    JOIN GRL_LABORATORIOS l ON l.lab_codigo = r.lab_codigo
    LEFT JOIN GRL_EQUIPOS e ON e.equ_codigo = r.equ_codigo
    WHERE r.usu_codigo = ?
    ORDER BY r.res_fecha_hora_inicio DESC
  `).all(usuCodigo);
}

function listarPorLaboratorioYRango(labCodigo, fechaInicio, fechaFin) {
  return baseDatos.prepare(`
    SELECT r.*,
           (u.usu_nombre || ' ' || u.usu_apellido) AS solicitante_nombre,
           e.equ_codigo_inventario
    FROM GRL_RESERVAS r
    JOIN GRL_USUARIOS u ON u.usu_codigo = r.usu_codigo
    LEFT JOIN GRL_EQUIPOS e ON e.equ_codigo = r.equ_codigo
    WHERE r.lab_codigo = ?
      AND r.res_estado IN ('P', 'A')
      AND r.res_fecha_hora_inicio < ?
      AND r.res_fecha_hora_fin > ?
    ORDER BY r.res_fecha_hora_inicio ASC
  `).all(labCodigo, fechaFin, fechaInicio);
}

function obtenerPorId(resCodigo) {
  return baseDatos.prepare(`
    SELECT r.*, l.lab_nombre, e.equ_codigo_inventario
    FROM GRL_RESERVAS r
    JOIN GRL_LABORATORIOS l ON l.lab_codigo = r.lab_codigo
    LEFT JOIN GRL_EQUIPOS e ON e.equ_codigo = r.equ_codigo
    WHERE r.res_codigo = ?
  `).get(resCodigo);
}

function crear(datos) {
  const resultado = baseDatos.prepare(`
    INSERT INTO GRL_RESERVAS (
      res_tipo, res_fecha_hora_inicio, res_fecha_hora_fin, res_asignatura,
      res_motivo, res_estado, res_mensaje_respuesta, usu_codigo, lab_codigo,
      usu_codigo1, hor_codigo, equ_codigo
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    datos.res_tipo,
    datos.res_fecha_hora_inicio,
    datos.res_fecha_hora_fin,
    datos.res_asignatura || null,
    datos.res_motivo || null,
    datos.res_estado,
    datos.res_mensaje_respuesta || '',
    datos.usu_codigo,
    datos.lab_codigo,
    datos.usu_codigo1 || null,
    datos.hor_codigo,
    datos.res_tipo === 'L' ? null : datos.equ_codigo
  );

  return obtenerPorId(Number(resultado.lastInsertRowid));
}

function actualizarEstado(resCodigo, { res_estado, res_mensaje_respuesta = '', usu_codigo1 = null }) {
  baseDatos.prepare(`
    UPDATE GRL_RESERVAS
    SET res_estado = ?,
        res_mensaje_respuesta = ?,
        usu_codigo1 = COALESCE(?, usu_codigo1)
    WHERE res_codigo = ?
  `).run(res_estado, res_mensaje_respuesta, usu_codigo1, resCodigo);

  return obtenerPorId(resCodigo);
}

function finalizarVencidas(fechaActualIso) {
  const resultado = baseDatos.prepare(`
    UPDATE GRL_RESERVAS
    SET res_estado = 'F'
    WHERE res_estado = 'A'
      AND res_fecha_hora_fin <= ?
  `).run(fechaActualIso);

  return resultado.changes;
}

module.exports = {
  listarTodas,
  listarPorUsuario,
  listarPorLaboratorioYRango,
  obtenerPorId,
  crear,
  actualizarEstado,
  finalizarVencidas
};