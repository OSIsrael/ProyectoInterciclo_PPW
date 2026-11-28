const baseDatos = require('../base_datos/conexion');

function listarTodos() {
  return baseDatos.prepare(`
    SELECT h.hor_codigo, h.hor_dia_semana, h.hor_hora_inicio, h.hor_hora_fin,
           h.hor_activo, h.lab_codigo, l.lab_nombre
    FROM GRL_HORARIOS h
    JOIN GRL_LABORATORIOS l ON l.lab_codigo = h.lab_codigo
    ORDER BY h.lab_codigo, h.hor_codigo
  `).all();
}

function listarPorLaboratorio(labCodigo) {
  return baseDatos.prepare(`
    SELECT hor_codigo, hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo
    FROM GRL_HORARIOS
    WHERE lab_codigo = ?
    ORDER BY hor_dia_semana, hor_hora_inicio
  `).all(labCodigo);
}

function obtenerPorId(horCodigo) {
  return baseDatos.prepare(`
    SELECT * FROM GRL_HORARIOS WHERE hor_codigo = ?
  `).get(horCodigo);
}

function crear({ hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo = 'S', lab_codigo }) {
  const resultado = baseDatos.prepare(`
    INSERT INTO GRL_HORARIOS (hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo)
    VALUES (?, ?, ?, ?, ?)
  `).run(hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo);

  return obtenerPorId(Number(resultado.lastInsertRowid));
}

function actualizar(horCodigo, { hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo }) {
  baseDatos.prepare(`
    UPDATE GRL_HORARIOS
    SET hor_dia_semana = ?, hor_hora_inicio = ?, hor_hora_fin = ?, hor_activo = ?, lab_codigo = ?
    WHERE hor_codigo = ?
  `).run(hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo, horCodigo);

  return obtenerPorId(horCodigo);
}

function eliminar(horCodigo) {
  const resultado = baseDatos.prepare('DELETE FROM GRL_HORARIOS WHERE hor_codigo = ?').run(horCodigo);
  return resultado.changes > 0;
}

module.exports = {
  listarTodos,
  listarPorLaboratorio,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};