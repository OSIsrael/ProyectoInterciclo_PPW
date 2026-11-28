const baseDatos = require('../base_datos/conexion');
const horariosRepo = require('../repositorios/horarios');
const bloqueosRepo = require('../repositorios/bloqueos');
const reservasRepo = require('../repositorios/reservas');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function obtenerFechaHoraLocalISO(fecha = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}`;
}

function listarHorarios(labCodigo = null) {
  if (labCodigo) {
    return horariosRepo.listarPorLaboratorio(Number(labCodigo));
  }
  return horariosRepo.listarTodos();
}

function crearHorario(datos) {
  const { hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo = 'S', lab_codigo } = datos;

  if (!hor_dia_semana || !hor_hora_inicio || !hor_hora_fin || !lab_codigo) {
    throw new Error('Todos los campos del horario son obligatorios.');
  }
  if (hor_hora_inicio >= hor_hora_fin) {
    throw new Error('La hora de inicio debe ser menor que la hora de fin.');
  }

  const existentes = horariosRepo.listarPorLaboratorio(Number(lab_codigo));
  const hayCruce = existentes.some(
    (h) =>
      h.hor_dia_semana === hor_dia_semana &&
      h.hor_activo === 'S' &&
      h.hor_hora_inicio < hor_hora_fin &&
      h.hor_hora_fin > hor_hora_inicio
  );

  if (hayCruce) {
    throw new Error('Ya existe una franja horaria activa que se cruza en ese día y laboratorio.');
  }

  return horariosRepo.crear({
    hor_dia_semana,
    hor_hora_inicio,
    hor_hora_fin,
    hor_activo,
    lab_codigo: Number(lab_codigo)
  });
}

function actualizarHorario(horCodigo, datos) {
  const actual = horariosRepo.obtenerPorId(Number(horCodigo));
  if (!actual) {
    throw new Error('El horario especificado no existe.');
  }

  const actualizado = {
    hor_dia_semana: datos.hor_dia_semana ?? actual.hor_dia_semana,
    hor_hora_inicio: datos.hor_hora_inicio ?? actual.hor_hora_inicio,
    hor_hora_fin: datos.hor_hora_fin ?? actual.hor_hora_fin,
    hor_activo: datos.hor_activo ?? actual.hor_activo,
    lab_codigo: Number(datos.lab_codigo ?? actual.lab_codigo)
  };

  if (actualizado.hor_hora_inicio >= actualizado.hor_hora_fin) {
    throw new Error('La hora de inicio debe ser menor que la hora de fin.');
  }

  return horariosRepo.actualizar(Number(horCodigo), actualizado);
}

function eliminarHorario(horCodigo) {
  const eliminado = horariosRepo.eliminar(Number(horCodigo));
  if (!eliminado) {
    throw new Error('No se encontró el horario para eliminar.');
  }
  return { mensaje: 'Horario eliminado correctamente.' };
}

function listarBloqueos() {
  return bloqueosRepo.listarTodos();
}

function crearBloqueo(datos) {
  const { blo_tipo, blo_motivo, blo_inicio, blo_fin, lab_codigo, usu_codigo } = datos;

  if (!blo_tipo || !blo_motivo || !blo_inicio || !blo_fin || !lab_codigo || !usu_codigo) {
    throw new Error('Todos los campos del bloqueo son obligatorios.');
  }
  if (blo_inicio >= blo_fin) {
    throw new Error('La fecha/hora de inicio del bloqueo debe ser anterior a la de fin.');
  }

  return bloqueosRepo.crear({
    blo_tipo,
    blo_motivo,
    blo_inicio,
    blo_fin,
    lab_codigo: Number(lab_codigo),
    usu_codigo: Number(usu_codigo)
  });
}

function eliminarBloqueo(bloCodigo) {
  const eliminado = bloqueosRepo.eliminar(Number(bloCodigo));
  if (!eliminado) {
    throw new Error('No se encontró el bloqueo para eliminar.');
  }
  return { mensaje: 'Bloqueo eliminado correctamente.' };
}

function obtenerCalendarioSemanal(labCodigo, fechaBaseStr) {
  reservasRepo.finalizarVencidas(obtenerFechaHoraLocalISO());

  const lab = baseDatos
    .prepare('SELECT * FROM GRL_LABORATORIOS WHERE lab_codigo = ?')
    .get(Number(labCodigo));

  if (!lab) {
    throw new Error('Laboratorio no encontrado.');
  }

  const fechaRef = fechaBaseStr ? new Date(`${fechaBaseStr}T12:00:00`) : new Date();
  const diaIndice = fechaRef.getDay(); 
  const diffALunes = diaIndice === 0 ? -6 : 1 - diaIndice;
  const lunes = new Date(fechaRef);
  lunes.setDate(fechaRef.getDate() + diffALunes);

  const diasSemana = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    diasSemana.push({
      fecha: `${yyyy}-${mm}-${dd}`,
      diaNombre: DIAS_SEMANA[d.getDay()]
    });
  }

  const inicioSemana = `${diasSemana[0].fecha}T00:00`;
  const finSemana = `${diasSemana[diasSemana.length - 1].fecha}T23:59`;

  const horariosLab = horariosRepo
    .listarPorLaboratorio(Number(labCodigo))
    .filter((h) => h.hor_activo === 'S');
  const bloqueosSemana = bloqueosRepo.listarPorLaboratorioYRango(Number(labCodigo), inicioSemana, finSemana);
  const reservasSemana = reservasRepo.listarPorLaboratorioYRango(Number(labCodigo), inicioSemana, finSemana);

  const calendario = diasSemana.map((dia) => {
    const franjasDia = horariosLab
      .filter((h) => h.hor_dia_semana === dia.diaNombre)
      .map((h) => {
        const inicioSlot = `${dia.fecha}T${h.hor_hora_inicio}`;
        const finSlot = `${dia.fecha}T${h.hor_hora_fin}`;

        if (lab.lab_estado === 'M') {
          return {
            ...h,
            fecha: dia.fecha,
            inicio_iso: inicioSlot,
            fin_iso: finSlot,
            estado_disponibilidad: 'bloqueada',
            detalle: 'Laboratorio en mantenimiento'
          };
        }

        const bloqueo = bloqueosSemana.find((b) => b.blo_inicio < finSlot && b.blo_fin > inicioSlot);
        if (bloqueo) {
          return {
            ...h,
            fecha: dia.fecha,
            inicio_iso: inicioSlot,
            fin_iso: finSlot,
            estado_disponibilidad: 'bloqueada',
            detalle: `${bloqueo.blo_tipo}: ${bloqueo.blo_motivo}`
          };
        }

        const reservasEnFranja = reservasSemana.filter(
          (r) => r.res_fecha_hora_inicio < finSlot && r.res_fecha_hora_fin > inicioSlot
        );

        const reservaLabCompleto = reservasEnFranja.find((r) => r.res_tipo === 'L');
        if (reservaLabCompleto) {
          return {
            ...h,
            fecha: dia.fecha,
            inicio_iso: inicioSlot,
            fin_iso: finSlot,
            estado_disponibilidad: 'reservada',
            detalle: `Laboratorio completo (${reservaLabCompleto.res_estado === 'A' ? 'Aprobada' : 'Pendiente'}) - ${reservaLabCompleto.solicitante_nombre}`
          };
        }

        if (reservasEnFranja.length > 0) {
          const cuposOcupados = reservasEnFranja.length;
          const lleno = cuposOcupados >= lab.lab_capacidad;
          return {
            ...h,
            fecha: dia.fecha,
            inicio_iso: inicioSlot,
            fin_iso: finSlot,
            estado_disponibilidad: lleno ? 'reservada' : 'parcial',
            cupos_ocupados: cuposOcupados,
            capacidad_total: lab.lab_capacidad,
            detalle: `${cuposOcupados}/${lab.lab_capacidad} puestos reservados`
          };
        }

        return {
          ...h,
          fecha: dia.fecha,
          inicio_iso: inicioSlot,
          fin_iso: finSlot,
          estado_disponibilidad: 'libre',
          cupos_ocupados: 0,
          capacidad_total: lab.lab_capacidad,
          detalle: 'Disponible'
        };
      });

    return {
      ...dia,
      franjas: franjasDia
    };
  });

  return {
    laboratorio: lab,
    semana_inicio: diasSemana[0].fecha,
    semana_fin: diasSemana[diasSemana.length - 1].fecha,
    dias: calendario
  };
}

module.exports = {
  obtenerFechaHoraLocalISO,
  listarHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario,
  listarBloqueos,
  crearBloqueo,
  eliminarBloqueo,
  obtenerCalendarioSemanal
};