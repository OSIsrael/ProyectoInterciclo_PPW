const reservasServicio = require('../servicios/reservasServicio');

function obtenerTodas(req, res) {
  try {
    res.json(reservasServicio.listarTodas());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function obtenerPorUsuario(req, res) {
  try {
    res.json(reservasServicio.listarPorUsuario(req.params.usuCodigo));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function solicitarDocente(req, res) {
  try {
    const creada = reservasServicio.crearSolicitudDocente(req.body);
    res.status(201).json(creada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function reservarEstudiante(req, res) {
  try {
    const creada = reservasServicio.crearReservaEstudiante(req.body);
    res.status(201).json(creada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function responderSolicitud(req, res) {
  try {
    const actualizada = reservasServicio.responderSolicitudAdmin(req.params.id, req.body);
    res.json(actualizada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function cancelarReserva(req, res) {
  try {
    const { usu_codigo } = req.body;
    const cancelada = reservasServicio.cancelarReservaUsuario(req.params.id, usu_codigo);
    res.json(cancelada);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function finalizarVencidas(req, res) {
  try {
    const resultado = reservasServicio.sincronizarFinalizadas();
    res.json({
      mensaje: 'Sincronización de reservas finalizadas ejecutada.',
      ...resultado
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

function obtenerCatalogos(req, res) {
  try {
    res.json(reservasServicio.obtenerCatalogosDisponibles());
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

module.exports = {
  obtenerTodas,
  obtenerPorUsuario,
  solicitarDocente,
  reservarEstudiante,
  responderSolicitud,
  cancelarReserva,
  finalizarVencidas,
  obtenerCatalogos
};