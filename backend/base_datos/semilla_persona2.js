const baseDatos = require('./conexion');

function cargarSemillaPersona2() {
  const admin = baseDatos.prepare("SELECT usu_codigo FROM GRL_USUARIOS WHERE usu_rol = 'A' LIMIT 1").get();
  const docente = baseDatos.prepare("SELECT usu_codigo FROM GRL_USUARIOS WHERE usu_rol = 'D' LIMIT 1").get();
  const estudiante = baseDatos.prepare("SELECT usu_codigo FROM GRL_USUARIOS WHERE usu_rol = 'E' LIMIT 1").get();
  const labs = baseDatos.prepare("SELECT lab_codigo FROM GRL_LABORATORIOS WHERE lab_estado = 'D' ORDER BY lab_codigo").all();

  if (!admin || !docente || !estudiante || labs.length === 0) {
    throw new Error('Primero ejecuta inicializar_bd.js y datos_semilla.js de la base.');
  }

  const lab1 = labs[0].lab_codigo;
  const lab2 = labs[1] ? labs[1].lab_codigo : lab1;

  const insertarEquipo = baseDatos.prepare(`
    INSERT OR IGNORE INTO GRL_EQUIPOS (equ_codigo_inventario, equ_tipo, equ_estado, lab_codigo)
    VALUES (?, ?, 'O', ?)
  `);
  insertarEquipo.run('P2-LAB1-PC01', 'PC Escritorio', lab1);
  insertarEquipo.run('P2-LAB2-PC01', 'Workstation', lab2);

  const equipoLab1 = baseDatos.prepare("SELECT equ_codigo FROM GRL_EQUIPOS WHERE lab_codigo = ? AND equ_estado = 'O' LIMIT 1").get(lab1);
  const equipoLab2 = baseDatos.prepare("SELECT equ_codigo FROM GRL_EQUIPOS WHERE lab_codigo = ? AND equ_estado = 'O' LIMIT 1").get(lab2);

  const totalHorarios = baseDatos.prepare('SELECT COUNT(*) AS total FROM GRL_HORARIOS').get().total;
  if (totalHorarios === 0) {
    const insertarHorario = baseDatos.prepare(`
      INSERT INTO GRL_HORARIOS (hor_dia_semana, hor_hora_inicio, hor_hora_fin, hor_activo, lab_codigo)
      VALUES (?, ?, ?, 'S', ?)
    `);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const franjas = [
      ['07:00', '09:00'],
      ['09:00', '11:00'],
      ['11:00', '13:00'],
      ['14:00', '16:00'],
      ['16:00', '18:00']
    ];

    for (const lab of [lab1, lab2]) {
      for (const dia of dias) {
        for (const [inicio, fin] of franjas) {
          insertarHorario.run(dia, inicio, fin, lab);
        }
      }
    }
    console.log('Horarios de atención cargados.');
  }

  const totalBloqueos = baseDatos.prepare('SELECT COUNT(*) AS total FROM GRL_BLOQUEOS').get().total;
  if (totalBloqueos === 0) {
    const insertarBloqueo = baseDatos.prepare(`
      INSERT INTO GRL_BLOQUEOS (blo_tipo, blo_motivo, blo_inicio, blo_fin, lab_codigo, usu_codigo)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertarBloqueo.run('clase_fija', 'Clase fija: Sistemas Operativos', '2026-12-01T07:00', '2026-12-01T09:00', lab1, admin.usu_codigo);
    insertarBloqueo.run('mantenimiento', 'Actualización de software', '2026-12-02T14:00', '2026-12-02T16:00', lab2, admin.usu_codigo);
    insertarBloqueo.run('feriado', 'Feriado institucional', '2026-12-06T07:00', '2026-12-06T18:00', lab1, admin.usu_codigo);
    console.log('Bloqueos cargados.');
  }

  const totalReservas = baseDatos.prepare('SELECT COUNT(*) AS total FROM GRL_RESERVAS').get().total;
  if (totalReservas === 0) {
    const horarioLab1 = baseDatos.prepare('SELECT hor_codigo FROM GRL_HORARIOS WHERE lab_codigo = ? LIMIT 1').get(lab1);
    const horarioLab2 = baseDatos.prepare('SELECT hor_codigo FROM GRL_HORARIOS WHERE lab_codigo = ? LIMIT 1').get(lab2);

    const insertarReserva = baseDatos.prepare(`
      INSERT INTO GRL_RESERVAS (
        res_tipo, res_fecha_hora_inicio, res_fecha_hora_fin, res_asignatura, res_motivo,
        res_estado, res_mensaje_respuesta, usu_codigo, lab_codigo, usu_codigo1, hor_codigo, equ_codigo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertarReserva.run(
      'L', '2026-12-01T09:00', '2026-12-01T11:00',
      'Programación y Plataformas Web', 'Práctica de APIs REST',
      'A', 'Aprobado sin novedades.', docente.usu_codigo, lab2, admin.usu_codigo, horarioLab2.hor_codigo, null
    );

    insertarReserva.run(
      'L', '2026-12-03T09:00', '2026-12-03T11:00',
      'Redes de Computadoras', 'Configuración de VLANs',
      'P', '', docente.usu_codigo, lab1, null, horarioLab1.hor_codigo, null
    );

    insertarReserva.run(
      'E', '2026-12-01T11:00', '2026-12-01T13:00',
      null, 'Desarrollo de proyecto integrador',
      'A', 'Confirmación automática por disponibilidad.', estudiante.usu_codigo, lab2, null, horarioLab2.hor_codigo, equipoLab2.equ_codigo
    );

    insertarReserva.run(
      'E', '2026-11-20T09:00', '2026-11-20T11:00',
      null, 'Práctica anterior',
      'A', 'Confirmación automática.', estudiante.usu_codigo, lab1, null, horarioLab1.hor_codigo, equipoLab1.equ_codigo
    );

    console.log('Reservas de prueba cargadas.');
  }
}

try {
  baseDatos.exec('BEGIN IMMEDIATE TRANSACTION');
  cargarSemillaPersona2();
  baseDatos.exec('COMMIT');
  console.log('Semilla Persona 2 ejecutada correctamente.');
} catch (error) {
  if (baseDatos.isTransaction) baseDatos.exec('ROLLBACK');
  console.error('Error en semilla Persona 2:', error.message);
  process.exitCode = 1;
} finally {
  baseDatos.close();
}