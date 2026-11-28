const express = require('express');
const router = express.Router();
const horariosControlador = require('../controladores/horariosControlador');

router.get('/horarios', horariosControlador.obtenerHorarios);
router.post('/horarios', horariosControlador.crearHorario);
router.put('/horarios/:id', horariosControlador.actualizarHorario);
router.delete('/horarios/:id', horariosControlador.eliminarHorario);

router.get('/bloqueos', horariosControlador.obtenerBloqueos);
router.post('/bloqueos', horariosControlador.crearBloqueo);
router.delete('/bloqueos/:id', horariosControlador.eliminarBloqueo);

router.get('/horarios/calendario/:labCodigo', horariosControlador.obtenerCalendarioSemanal);

module.exports = router;