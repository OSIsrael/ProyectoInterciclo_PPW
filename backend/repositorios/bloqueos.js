const baseDatos = require('../base_datos/conexion');

function listarTodos() {
  return baseDatos.prepare(`
    SELECT b.*, l.lab_nombre, (u.usu_nombre || ' ' || u.usu_apellido) AS creado_por
    FROM GRL_BLOQUEOS b
    JOIN GRL_LABORATORIOS l ON l.lab_codigo = b.lab_codigo
    JOIN GRL_USUARIOS u ON u.usu_codigo = b.usu_codigo
    ORDER BY b.blo_inicio DESC
  `).all();
}

function listarPorLaboratorioYRango(labCodigo, fechaInicio, fechaFin) {
  return baseDatos.prepare(`
    SELECT *
    FROM GRL_BLOQUEOS
    WHERE lab_codigo = ?
      AND blo_inicio < ?
      AND blo_fin > ?
    ORDER BY blo_inicio ASC
  `).all(labCodigo, fechaFin, fechaInicio);
}

function obtenerPorId(bloCodigo) {
  return baseDatos.prepare('SELECT * FROM GRL_BLOQUEOS WHERE blo_codigo = ?').get(bloCodigo);
}

function crear({ blo_tipo, blo_motivo, blo_inicio, blo_fin, lab_codigo, usu_codigo }) {
  const resultado = baseDatos.prepare(`
    INSERT INTO GRL_BLOQUEOS (blo_tipo, blo_motivo, blo_inicio, blo_fin, lab_codigo, usu_codigo)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(blo_tipo, blo_motivo, blo_inicio, blo_fin, lab_codigo, usu_codigo);

  return obtenerPorId(Number(resultado.lastInsertRowid));
}

function eliminar(bloCodigo) {
  const resultado = baseDatos.prepare('DELETE FROM GRL_BLOQUEOS WHERE blo_codigo = ?').run(bloCodigo);
  return resultado.changes > 0;
}

module.exports = {
  listarTodos,
  listarPorLaboratorioYRango,
  obtenerPorId,
  crear,
  eliminar
};