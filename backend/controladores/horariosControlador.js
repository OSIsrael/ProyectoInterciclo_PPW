const horariosServicio = require('../servicios/horariosServicio');

function obtenerHorarios(req, res) {
  try {
    const { lab_codigo } = req.query;
    const datos = horariosServicio.listarHorarios(lab_codigo);
    res.json(datos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function crearHorario(req, res) {
  try {
    const creado = horariosServicio.crearHorario(req.body);
    res.status(201).json(creado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function actualizarHorario(req, res) {
  try {
    const actualizado = horariosServicio.actualizarHorario(req.params.id, req.body);
    res.json(actualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function eliminarHorario(req, res) {
  try {
    const resultado = horariosServicio.eliminarHorario(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

function obtenerBloqueos(req, res) {
  try {
    const datos = horariosServicio.listarBloqueos();
    res.json(datos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function crearBloqueo(req, res) {
  try {
    const creado = horariosServicio.crearBloqueo(req.body);
    res.status(201).json(creado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function eliminarBloqueo(req, res) {
  try {
    const resultado = horariosServicio.eliminarBloqueo(req.params.id);
    res.json(resultado);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}

function obtenerCalendarioSemanal(req, res) {
  try {
    const { labCodigo } = req.params;
    const { fecha } = req.query;
    const calendario = horariosServicio.obtenerCalendarioSemanal(labCodigo, fecha);
    res.json(calendario);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  obtenerHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
  obtenerBloqueos,
  crearBloqueo,
  eliminarBloqueo,
  obtenerCalendarioSemanal
};