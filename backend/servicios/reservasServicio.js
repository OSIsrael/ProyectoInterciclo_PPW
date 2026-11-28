const baseDatos = require('../base_datos/conexion');
const reservasRepo = require('../repositorios/reservas');
const bloqueosRepo = require('../repositorios/bloqueos');
const notificacionesRepo = require('../repositorios/notificaciones');
const { obtenerFechaHoraLocalISO } = require('./horariosServicio');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function obtenerDiaSemanaDeFechaISO(fechaHoraISO) {
  const soloFecha = fechaHoraISO.split('T')[0];
  const fecha = new Date(`${soloFecha}T12:00:00`);
  return DIAS_SEMANA[fecha.getDay()];
}

function extraerHora(fechaHoraISO) {
  return fechaHoraISO.split('T')[1].slice(0, 5);
}

function validarDisponibilidadReserva({
  res_tipo,
  res_fecha_hora_inicio,
  res_fecha_hora_fin,
  lab_codigo,
  equ_codigo = null,
  hor_codigo = null,
  ignorarResCodigo = null
}) {
  const ahoraISO = obtenerFechaHoraLocalISO();

  if (!res_fecha_hora_inicio || !res_fecha_hora_fin || !lab_codigo || !res_tipo) {
    throw new Error('Faltan datos obligatorios para validar la reserva.');
  }

  if (res_fecha_hora_inicio >= res_fecha_hora_fin) {
    throw new Error('La fecha y hora de inicio debe ser menor que la de fin.');
  }
  if (res_fecha_hora_inicio <= ahoraISO) {
    throw new Error('No se pueden realizar reservas en fechas u horas pasadas.');
  }

  const laboratorio = baseDatos
    .prepare('SELECT * FROM GRL_LABORATORIOS WHERE lab_codigo = ?')
    .get(Number(lab_codigo));

  if (!laboratorio) {
    throw new Error('El laboratorio seleccionado no existe.');
  }
  if (laboratorio.lab_estado !== 'D') {
    throw new Error('El laboratorio se encuentra en mantenimiento y no admite reservas.');
  }

  const diaSemana = obtenerDiaSemanaDeFechaISO(res_fecha_hora_inicio);
  const horaInicio = extraerHora(res_fecha_hora_inicio);
  const horaFin = extraerHora(res_fecha_hora_fin);

  let horarioValido = null;
  if (hor_codigo) {
    horarioValido = baseDatos
      .prepare('SELECT * FROM GRL_HORARIOS WHERE hor_codigo = ? AND lab_codigo = ? AND hor_activo = \'S\'')
      .get(Number(hor_codigo), Number(lab_codigo));
  } else {
    horarioValido = baseDatos
      .prepare(`
        SELECT * FROM GRL_HORARIOS
        WHERE lab_codigo = ?
          AND hor_dia_semana = ?
          AND hor_activo = 'S'
          AND hor_hora_inicio <= ?
          AND hor_hora_fin >= ?
        LIMIT 1
      `)
      .get(Number(lab_codigo), diaSemana, horaInicio, horaFin);
  }

  if (!horarioValido) {
    throw new Error(`El horario solicitado (${diaSemana} ${horaInicio}-${horaFin}) está fuera de las franjas activas del laboratorio.`);
  }

  const bloqueos = bloqueosRepo.listarPorLaboratorioYRango(
    Number(lab_codigo),
    res_fecha_hora_inicio,
    res_fecha_hora_fin
  );
  if (bloqueos.length > 0) {
    throw new Error(`La franja está bloqueada por ${bloqueos[0].blo_tipo}: ${bloqueos[0].blo_motivo}.`);
  }

  const reservasSolapadas = reservasRepo
    .listarPorLaboratorioYRango(Number(lab_codigo), res_fecha_hora_inicio, res_fecha_hora_fin)
    .filter((r) => r.res_codigo !== ignorarResCodigo);

  if (res_tipo === 'L') {
    if (reservasSolapadas.length > 0) {
      throw new Error('Existe solapamiento con otra reserva activa o pendiente en esa franja horaria.');
    }
  } else if (res_tipo === 'E') {
    const reservaCompletaDocente = reservasSolapadas.find(
      (r) => r.res_tipo === 'L' && r.res_estado === 'A'
    );
    if (reservaCompletaDocente) {
      throw new Error('El laboratorio tiene una reserva completa aprobada por un docente en esa franja.');
    }

    const reservasEquiposActivas = reservasSolapadas.filter(
      (r) => r.res_tipo === 'E' && r.res_estado === 'A'
    );
    if (reservasEquiposActivas.length >= laboratorio.lab_capacidad) {
      throw new Error('Se alcanzó la capacidad máxima de puestos del laboratorio en esa franja.');
    }

    if (!equ_codigo) {
      throw new Error('Debe seleccionar un equipo operativo para realizar la reserva.');
    }

    const equipo = baseDatos
      .prepare('SELECT * FROM GRL_EQUIPOS WHERE equ_codigo = ? AND lab_codigo = ?')
      .get(Number(equ_codigo), Number(lab_codigo));

    if (!equipo) {
      throw new Error('El equipo seleccionado no pertenece a este laboratorio.');
    }
    if (equipo.equ_estado !== 'O') {
      throw new Error(`El equipo ${equipo.equ_codigo_inventario} no está operativo (estado: ${equipo.equ_estado}).`);
    }

    const equipoOcupado = reservasEquiposActivas.some(
      (r) => Number(r.equ_codigo) === Number(equ_codigo)
    );
    if (equipoOcupado) {
      throw new Error(`El equipo ${equipo.equ_codigo_inventario} ya está reservado en ese horario.`);
    }
  } else {
    throw new Error('Tipo de reserva inválido. Use L (Laboratorio) o E (Equipo).');
  }

  return horarioValido;
}

function sincronizarFinalizadas() {
  const actualizadas = reservasRepo.finalizarVencidas(obtenerFechaHoraLocalISO());
  return { actualizadas };
}

function listarTodas() {
  sincronizarFinalizadas();
  return reservasRepo.listarTodas();
}

function listarPorUsuario(usuCodigo) {
  sincronizarFinalizadas();
  return reservasRepo.listarPorUsuario(Number(usuCodigo));
}

function crearSolicitudDocente(datos) {
  sincronizarFinalizadas();

  const usuario = baseDatos
    .prepare('SELECT * FROM GRL_USUARIOS WHERE usu_codigo = ?')
    .get(Number(datos.usu_codigo));

  if (!usuario || usuario.usu_rol !== 'D') {
    throw new Error('Solo los usuarios con rol Docente pueden solicitar un laboratorio completo.');
  }
  if (!datos.res_asignatura || !datos.res_motivo) {
    throw new Error('La asignatura y el motivo son obligatorios para solicitudes de docentes.');
  }

  const horarioValido = validarDisponibilidadReserva({
    res_tipo: 'L',
    res_fecha_hora_inicio: datos.res_fecha_hora_inicio,
    res_fecha_hora_fin: datos.res_fecha_hora_fin,
    lab_codigo: datos.lab_codigo,
    hor_codigo: datos.hor_codigo
  });

  const nuevaReserva = reservasRepo.crear({
    res_tipo: 'L',
    res_fecha_hora_inicio: datos.res_fecha_hora_inicio,
    res_fecha_hora_fin: datos.res_fecha_hora_fin,
    res_asignatura: datos.res_asignatura,
    res_motivo: datos.res_motivo,
    res_estado: 'P',
    res_mensaje_respuesta: '',
    usu_codigo: Number(datos.usu_codigo),
    lab_codigo: Number(datos.lab_codigo),
    hor_codigo: horarioValido.hor_codigo,
    equ_codigo: null
  });

  const admins = baseDatos
    .prepare("SELECT usu_codigo FROM GRL_USUARIOS WHERE usu_rol = 'A' AND usu_estado = 'A'")
    .all();

  for (const admin of admins) {
    notificacionesRepo.crearNotificacion({
      codigoUsuario: admin.usu_codigo,
      tipo: 'SOLICITUD_RESERVA',
      titulo: 'Nueva solicitud de laboratorio',
      mensaje: `El docente ${usuario.usu_nombre} ${usuario.usu_apellido} solicitó ${nuevaReserva.lab_nombre} para ${datos.res_asignatura}.`,
      codigoReserva: nuevaReserva.res_codigo
    });
  }

  return nuevaReserva;
}

function crearReservaEstudiante(datos) {
  sincronizarFinalizadas();

  const usuario = baseDatos
    .prepare('SELECT * FROM GRL_USUARIOS WHERE usu_codigo = ?')
    .get(Number(datos.usu_codigo));

  if (!usuario || usuario.usu_rol !== 'E') {
    throw new Error('Solo los usuarios con rol Estudiante pueden reservar equipos individuales.');
  }

  const horarioValido = validarDisponibilidadReserva({
    res_tipo: 'E',
    res_fecha_hora_inicio: datos.res_fecha_hora_inicio,
    res_fecha_hora_fin: datos.res_fecha_hora_fin,
    lab_codigo: datos.lab_codigo,
    equ_codigo: datos.equ_codigo,
    hor_codigo: datos.hor_codigo
  });

  return reservasRepo.crear({
    res_tipo: 'E',
    res_fecha_hora_inicio: datos.res_fecha_hora_inicio,
    res_fecha_hora_fin: datos.res_fecha_hora_fin,
    res_asignatura: datos.res_asignatura || null,
    res_motivo: datos.res_motivo || 'Práctica individual de estudiante',
    res_estado: 'A',
    res_mensaje_respuesta: 'Confirmación automática por disponibilidad.',
    usu_codigo: Number(datos.usu_codigo),
    lab_codigo: Number(datos.lab_codigo),
    hor_codigo: horarioValido.hor_codigo,
    equ_codigo: Number(datos.equ_codigo)
  });
}

function responderSolicitudAdmin(resCodigo, { accion, res_mensaje_respuesta = '', usu_codigo1 }) {
  sincronizarFinalizadas();

  const reserva = reservasRepo.obtenerPorId(Number(resCodigo));
  if (!reserva) {
    throw new Error('La reserva no existe.');
  }
  if (reserva.res_estado !== 'P') {
    throw new Error('Solo se pueden aprobar o rechazar reservas en estado Pendiente.');
  }

  const admin = baseDatos
    .prepare('SELECT * FROM GRL_USUARIOS WHERE usu_codigo = ?')
    .get(Number(usu_codigo1));
  if (!admin || admin.usu_rol !== 'A') {
    throw new Error('Solo un Administrador puede aprobar o rechazar solicitudes.');
  }

  if (accion !== 'A' && accion !== 'R') {
    throw new Error('Acción inválida. Use A (Aprobar) o R (Rechazar).');
  }

  if (accion === 'A') {
    validarDisponibilidadReserva({
      res_tipo: reserva.res_tipo,
      res_fecha_hora_inicio: reserva.res_fecha_hora_inicio,
      res_fecha_hora_fin: reserva.res_fecha_hora_fin,
      lab_codigo: reserva.lab_codigo,
      equ_codigo: reserva.equ_codigo,
      hor_codigo: reserva.hor_codigo,
      ignorarResCodigo: reserva.res_codigo
    });
  }

  const mensajeFinal =
    res_mensaje_respuesta.trim() ||
    (accion === 'A' ? 'Solicitud aprobada por el administrador.' : 'Solicitud rechazada por el administrador.');

  const actualizada = reservasRepo.actualizarEstado(Number(resCodigo), {
    res_estado: accion,
    res_mensaje_respuesta: mensajeFinal,
    usu_codigo1: Number(usu_codigo1)
  });

  notificacionesRepo.crearNotificacion({
    codigoUsuario: reserva.usu_codigo,
    tipo: accion === 'A' ? 'RESERVA_APROBADA' : 'RESERVA_RECHAZADA',
    titulo: accion === 'A' ? 'Reserva de laboratorio aprobada' : 'Reserva de laboratorio rechazada',
    mensaje: `Tu solicitud para ${reserva.lab_nombre} (${reserva.res_fecha_hora_inicio}) fue ${accion === 'A' ? 'aprobada' : 'rechazada'}. Mensaje: ${mensajeFinal}`,
    codigoReserva: reserva.res_codigo
  });

  return actualizada;
}

function cancelarReservaUsuario(resCodigo, usuCodigo) {
  sincronizarFinalizadas();

  const reserva = reservasRepo.obtenerPorId(Number(resCodigo));
  if (!reserva) {
    throw new Error('La reserva no existe.');
  }
  if (Number(reserva.usu_codigo) !== Number(usuCodigo)) {
    throw new Error('No tienes permiso para cancelar una reserva de otro usuario.');
  }
  if (reserva.res_estado !== 'P' && reserva.res_estado !== 'A') {
    throw new Error('Solo se pueden cancelar reservas Pendientes o Aprobadas.');
  }

  const ahoraISO = obtenerFechaHoraLocalISO();
  if (reserva.res_fecha_hora_inicio <= ahoraISO) {
    throw new Error('No se puede cancelar una reserva que ya inició o finalizó.');
  }

  return reservasRepo.actualizarEstado(Number(resCodigo), {
    res_estado: 'C',
    res_mensaje_respuesta: 'Cancelada por el usuario antes de su inicio.'
  });
}

function obtenerCatalogosDisponibles() {
  const laboratorios = baseDatos
    .prepare('SELECT * FROM GRL_LABORATORIOS ORDER BY lab_nombre')
    .all();
  const equipos = baseDatos
    .prepare("SELECT * FROM GRL_EQUIPOS WHERE equ_estado = 'O' ORDER BY lab_codigo, equ_codigo_inventario")
    .all();
  const usuarios = baseDatos
    .prepare('SELECT usu_codigo, usu_nombre, usu_apellido, usu_username, usu_rol FROM GRL_USUARIOS WHERE usu_estado = \'A\' ORDER BY usu_codigo')
    .all();

  return { laboratorios, equipos, usuarios };
}

module.exports = {
  validarDisponibilidadReserva,
  sincronizarFinalizadas,
  listarTodas,
  listarPorUsuario,
  crearSolicitudDocente,
  crearReservaEstudiante,
  responderSolicitudAdmin,
  cancelarReservaUsuario,
  obtenerCatalogosDisponibles
};