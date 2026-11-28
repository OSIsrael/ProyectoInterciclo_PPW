const express = require('express');
const router = express.Router();
const reservasControlador = require('../controladores/reservasControlador');

router.get('/reservas/catalogos', reservasControlador.obtenerCatalogos);

router.get('/reservas', reservasControlador.obtenerTodas);
router.get('/reservas/usuario/:usuCodigo', reservasControlador.obtenerPorUsuario);

router.post('/reservas/docente', reservasControlador.solicitarDocente);
router.post('/reservas/estudiante', reservasControlador.reservarEstudiante);

router.put('/reservas/:id/responder', reservasControlador.responderSolicitud);
router.put('/reservas/:id/cancelar', reservasControlador.cancelarReserva);

router.post('/reservas/finalizar-vencidas', reservasControlador.finalizarVencidas);

module.exports = router;