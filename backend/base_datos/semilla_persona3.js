//importamos los repositorios 
const baseDatos = require('./conexion');
const equipos = require('../repositorios/equipos');
const incidencias = require('../repositorios/incidencias');
const notificaciones = require('../repositorios/notificaciones');

function cargarSemilla(){

    //buscamos datos de persona 1
    const laboratorio = baseDatos.prepare(`
        SELECT lab_codigo FROM GRL_LABORATORIOS
        WHERE lab_nombre = ? AND lab_ubicacion=?    
    `).get('Laboratorio de Redes', 'Bloque A - Primera Planta');

    const estudiante = baseDatos.prepare(`
        SELECT usu_codigo FROM GRL_USUARIOS
        WHERE usu_username = ? AND usu_rol = 'E'
    `).get('estudiante1');

    if (!laboratorio || !estudiante) {
        throw new Error('Primero carga los usuarios y laboratorios de Persona 1');
    }

    //cargar equipos, incidencia y aviso
    const computadoras =[
        {inventario: 'RED-PC-01', estado: 'O'}, //O operativo
        {inventario: 'RED-PC-02', estado: 'D'},//D es para daniado
        {inventario: 'RED-PC-03', estado: 'R'} //R es en reparacion
    ]

    for(const pc of computadoras){
        const existente = equipos.buscarPorInventario(pc.inventario);

        if (existente && existente.lab_codigo !== laboratorio.lab_codigo){
            throw new Error(`El equipo ${pc.inventario} pertenece a otro laboratorio.`);
        }

        if (!existente){
            equipos.crearEquipo(pc.inventario, 'Computadora', pc.estado, laboratorio.lab_codigo);
        }
    }

    const equipo = equipos.buscarPorInventario('RED-PC-02');
    const descripcion = 'La computadora no se prende';
    const reportes = incidencias.listarPorEquipo(equipo.equ_codigo);
    const reporteExistente = reportes.find(reporte =>
        reporte.usu_codigo === estudiante.usu_codigo &&
        reporte.inc_descripcion === descripcion
    );

    let codigoIncidencia;
    if (reporteExistente){
        codigoIncidencia = reporteExistente.inc_codigo;
    } else{
        codigoIncidencia = incidencias.crearIncidencia(
            equipo.equ_codigo, estudiante.usu_codigo, descripcion, 'A'
        );
    }

    const titulo = 'Incidencia registrada';
    const bandeja = notificaciones.listarPorUsuario(estudiante.usu_codigo);
    const avisoExiste = bandeja.some(aviso =>
        aviso.inc_codigo === codigoIncidencia && aviso.not_titulo === titulo
    );

    if (!avisoExiste){
        notificaciones.crearNotificacion({
            codigoUsuario: estudiante.usu_codigo,
            tipo: 'INCIDENCIA',
            titulo: titulo,
            mensaje: 'Se registró tu reporte sobre RED-PC-02.',
            codigoIncidencia: codigoIncidencia
        });
    }

    
}

try{
    baseDatos.exec('BEGIN IMMEDIATE');
    cargarSemilla();
    baseDatos.exec('COMMIT');
    console.log('Datos semilla de Persona 3 cargados correctamente.');
} catch (error){
    if (baseDatos.isTransaction) {
        baseDatos.exec('ROLLBACK');
    }
    console.error(error.stack);
    process.exitCode = 1;
} finally{
    baseDatos.close();
}