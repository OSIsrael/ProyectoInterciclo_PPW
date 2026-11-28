const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const baseDatos = require('../base_datos/conexion');
const horariosServicio = require('../servicios/horariosServicio');
const reservasServicio = require('../servicios/reservasServicio');
const reservasRepo = require('../repositorios/reservas');
const notificacionesRepo = require('../repositorios/notificaciones');

function obtenerProximoLunesISO() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  const diasHastaLunes = fecha.getDay() === 0 ? 1 : ((8 - fecha.getDay()) % 7) || 7;
  fecha.setDate(fecha.getDate() + diasHastaLunes);
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

function obtenerAyerISO() {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - 1);
  const pad = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`;
}

describe('Reglas de Negocio - Horarios, Bloqueos y Reservas (Persona 2)', () => {
  const sufijo = `TEST_P2_${Date.now()}`;
  const lunesFuturo = obtenerProximoLunesISO();
  const diaPasado = obtenerAyerISO();

  let adminId;
  let docenteId;
  let estudianteId;
  let labDisponibleId;
  let labMantenimientoId;
  let equipoOperativoId;
  let equipoDanadoId;
  let horarioLunesId;
  let bloqueoId;

  before(() => {
    const sqlEsquema = fs.readFileSync(
      path.join(__dirname, '../base_datos/crear_tablas.sql'),
      'utf8'
    );
    baseDatos.exec(sqlEsquema);

    const insUsu = baseDatos.prepare(`
      INSERT INTO GRL_USUARIOS (usu_nombre, usu_apellido, usu_correo, usu_username, usu_password_hash, usu_rol, usu_estado)
      VALUES (?, ?, ?, ?, 'hash_prueba', ?, 'A')
    `);

    adminId = Number(insUsu.run('Admin', sufijo, `admin_${sufijo}@test.ec`, `admin_${sufijo}`, 'A').lastInsertRowid);
    docenteId = Number(insUsu.run('Docente', sufijo, `doc_${sufijo}@test.ec`, `doc_${sufijo}`, 'D').lastInsertRowid);
    estudianteId = Number(insUsu.run('Estudiante', sufijo, `est_${sufijo}@test.ec`, `est_${sufijo}`, 'E').lastInsertRowid);

    const insLab = baseDatos.prepare(`
      INSERT INTO GRL_LABORATORIOS (lab_nombre, lab_ubicacion, lab_capacidad, lab_software_instalado, lab_foto, lab_estado)
      VALUES (?, 'Bloque Test', 2, 'Node, Angular', 'test.jpg', ?)
    `);

    labDisponibleId = Number(insLab.run(`Lab Disp ${sufijo}`, 'D').lastInsertRowid);
    labMantenimientoId = Number(insLab.run(`Lab Mant ${sufijo}`, 'M').lastInsertRowid);

    const insEq = baseDatos.prepare(`
      INSERT INTO GRL_EQUIPOS (equ_codigo_inventario, equ_tipo, equ_estado, lab_codigo)
      VALUES (?, 'PC Prueba', ?, ?)
    `);

    equipoOperativoId = Number(insEq.run(`EQ-OK-${sufijo}`, 'O', labDisponibleId).lastInsertRowid);
    equipoDanadoId = Number(insEq.run(`EQ-BAD-${sufijo}`, 'D', labDisponibleId).lastInsertRowid);

    const horario1 = horariosServicio.crearHorario({
      hor_dia_semana: 'Lunes',
      hor_hora_inicio: '07:00',
      hor_hora_fin: '13:00',
      hor_activo: 'S',
      lab_codigo: labDisponibleId
    });
    horarioLunesId = horario1.hor_codigo;

    const bloqueo = horariosServicio.crearBloqueo({
      blo_tipo: 'mantenimiento',
      blo_motivo: `Mantenimiento ${sufijo}`,
      blo_inicio: `${lunesFuturo}T07:00`,
      blo_fin: `${lunesFuturo}T09:00`,
      lab_codigo: labDisponibleId,
      usu_codigo: adminId
    });
    bloqueoId = bloqueo.blo_codigo;
  });

  after(() => {
    baseDatos.prepare('DELETE FROM GRL_NOTIFICACIONES WHERE usu_codigo IN (?, ?, ?)').run(adminId, docenteId, estudianteId);
    baseDatos.prepare('DELETE FROM GRL_RESERVAS WHERE lab_codigo IN (?, ?)').run(labDisponibleId, labMantenimientoId);
    baseDatos.prepare('DELETE FROM GRL_BLOQUEOS WHERE blo_codigo = ?').run(bloqueoId);
    baseDatos.prepare('DELETE FROM GRL_HORARIOS WHERE lab_codigo IN (?, ?)').run(labDisponibleId, labMantenimientoId);
    baseDatos.prepare('DELETE FROM GRL_EQUIPOS WHERE lab_codigo IN (?, ?)').run(labDisponibleId, labMantenimientoId);
    baseDatos.prepare('DELETE FROM GRL_LABORATORIOS WHERE lab_codigo IN (?, ?)').run(labDisponibleId, labMantenimientoId);
    baseDatos.prepare('DELETE FROM GRL_USUARIOS WHERE usu_codigo IN (?, ?, ?)').run(adminId, docenteId, estudianteId);
  });

  it('1. Rechaza reservas en fechas u horas pasadas (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearReservaEstudiante({
        usu_codigo: estudianteId,
        lab_codigo: labDisponibleId,
        equ_codigo: equipoOperativoId,
        res_fecha_hora_inicio: `${diaPasado}T09:00`,
        res_fecha_hora_fin: `${diaPasado}T11:00`,
        res_motivo: 'Intento en fecha pasada'
      });
    }, /pasadas/i);
  });

  it('2. Rechaza reservas en laboratorios en estado Mantenimiento (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearSolicitudDocente({
        usu_codigo: docenteId,
        lab_codigo: labMantenimientoId,
        res_fecha_hora_inicio: `${lunesFuturo}T09:00`,
        res_fecha_hora_fin: `${lunesFuturo}T11:00`,
        res_asignatura: 'Sistemas Operativos',
        res_motivo: 'Práctica en lab en mantenimiento'
      });
    }, /mantenimiento/i);
  });

  it('3. Rechaza reservas fuera de las franjas horarias activas (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearReservaEstudiante({
        usu_codigo: estudianteId,
        lab_codigo: labDisponibleId,
        equ_codigo: equipoOperativoId,
        res_fecha_hora_inicio: `${lunesFuturo}T19:00`,
        res_fecha_hora_fin: `${lunesFuturo}T21:00`,
        res_motivo: 'Fuera de horario'
      });
    }, /franjas activas/i);
  });

  it('4. Rechaza reservas en franjas con bloqueo activo (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearSolicitudDocente({
        usu_codigo: docenteId,
        lab_codigo: labDisponibleId,
        res_fecha_hora_inicio: `${lunesFuturo}T07:00`,
        res_fecha_hora_fin: `${lunesFuturo}T09:00`,
        res_asignatura: 'Redes',
        res_motivo: 'Choque con bloqueo'
      });
    }, /bloqueada/i);
  });

  it('5. Rechaza reserva de un equipo dañado o no operativo (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearReservaEstudiante({
        usu_codigo: estudianteId,
        lab_codigo: labDisponibleId,
        equ_codigo: equipoDanadoId,
        res_fecha_hora_inicio: `${lunesFuturo}T09:00`,
        res_fecha_hora_fin: `${lunesFuturo}T11:00`,
        res_motivo: 'Intento con equipo dañado'
      });
    }, /no está operativo/i);
  });

  it('6. Docente solicita laboratorio completo en estado Pendiente (P) y notifica al admin (P2-04)', () => {
    const solicitud = reservasServicio.crearSolicitudDocente({
      usu_codigo: docenteId,
      lab_codigo: labDisponibleId,
      res_fecha_hora_inicio: `${lunesFuturo}T09:00`,
      res_fecha_hora_fin: `${lunesFuturo}T11:00`,
      res_asignatura: 'Programación Web',
      res_motivo: 'Práctica grupal'
    });

    assert.equal(solicitud.res_tipo, 'L');
    assert.equal(solicitud.res_estado, 'P');

    const notifsAdmin = notificacionesRepo.listarPorUsuario(adminId);
    assert.ok(notifsAdmin.some((n) => n.res_codigo === solicitud.res_codigo));
  });

  it('7. Administrador aprueba solicitud docente (A), guarda mensaje y notifica al docente (P2-07)', () => {
    const pendientes = reservasServicio.listarTodas().filter(
      (r) => r.lab_codigo === labDisponibleId && r.res_estado === 'P'
    );
    assert.equal(pendientes.length, 1);

    const aprobada = reservasServicio.responderSolicitudAdmin(pendientes[0].res_codigo, {
      accion: 'A',
      res_mensaje_respuesta: 'Aprobado para la práctica.',
      usu_codigo1: adminId
    });

    assert.equal(aprobada.res_estado, 'A');
    assert.equal(aprobada.res_mensaje_respuesta, 'Aprobado para la práctica.');

    const notifsDocente = notificacionesRepo.listarPorUsuario(docenteId);
    assert.ok(notifsDocente.some((n) => n.res_codigo === aprobada.res_codigo && n.not_tipo === 'RESERVA_APROBADA'));
  });

  it('8. Impide que un estudiante reserve equipo cuando el laboratorio está reservado completo por docente (P2-06)', () => {
    assert.throws(() => {
      reservasServicio.crearReservaEstudiante({
        usu_codigo: estudianteId,
        lab_codigo: labDisponibleId,
        equ_codigo: equipoOperativoId,
        res_fecha_hora_inicio: `${lunesFuturo}T09:00`,
        res_fecha_hora_fin: `${lunesFuturo}T11:00`,
        res_motivo: 'Solapamiento con docente'
      });
    }, /reserva completa aprobada/i);
  });

  it('9. Estudiante reserva equipo operativo con confirmación automática (A) e impide doble reserva del mismo equipo (P2-05)', () => {
    const reservaEq = reservasServicio.crearReservaEstudiante({
      usu_codigo: estudianteId,
      lab_codigo: labDisponibleId,
      equ_codigo: equipoOperativoId,
      res_fecha_hora_inicio: `${lunesFuturo}T11:00`,
      res_fecha_hora_fin: `${lunesFuturo}T13:00`,
      res_motivo: 'Proyecto individual'
    });

    assert.equal(reservaEq.res_tipo, 'E');
    assert.equal(reservaEq.res_estado, 'A');

    assert.throws(() => {
      reservasServicio.crearReservaEstudiante({
        usu_codigo: estudianteId,
        lab_codigo: labDisponibleId,
        equ_codigo: equipoOperativoId,
        res_fecha_hora_inicio: `${lunesFuturo}T11:00`,
        res_fecha_hora_fin: `${lunesFuturo}T13:00`,
        res_motivo: 'Doble reserva del mismo equipo'
      });
    }, /ya está reservado/i);

    const cancelada = reservasServicio.cancelarReservaUsuario(reservaEq.res_codigo, estudianteId);
    assert.equal(cancelada.res_estado, 'C');
  });

  it('10. Finaliza automáticamente (F) las reservas aprobadas cuyo horario ya terminó (P2-09)', () => {
    const vencida = reservasRepo.crear({
      res_tipo: 'E',
      res_fecha_hora_inicio: `${diaPasado}T09:00`,
      res_fecha_hora_fin: `${diaPasado}T11:00`,
      res_asignatura: null,
      res_motivo: 'Reserva vencida de prueba',
      res_estado: 'A',
      res_mensaje_respuesta: 'Confirmada',
      usu_codigo: estudianteId,
      lab_codigo: labDisponibleId,
      hor_codigo: horarioLunesId,
      equ_codigo: equipoOperativoId
    });

    reservasServicio.sincronizarFinalizadas();

    const verificada = reservasRepo.obtenerPorId(vencida.res_codigo);
    assert.equal(verificada.res_estado, 'F');
  });
});