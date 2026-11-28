const baseDatos = require('./conexion');
const bcrypt = require('bcryptjs');

// Factor de costo para generar los hashes
const rondas = 10;

//usuario de prueba
const usuarios = [
    {
        nombre: 'Administrador',
        apellido: 'Sistema',
        correo: 'admin@example.com',
        username: 'admin',
        password: 'Admin123*',
        rol: 'A'
    }
];

// 3 docentes de prueba
for (let i = 1; i <= 3; i++) {
    usuarios.push({
        nombre: 'Docente',
        apellido: 'Prueba ' + i,
        correo: `docente${i}@example.com`,
        username: `docente${i}`,
        password: 'Docente123*',
        rol: 'D'
    });
}

//5 estudiantes de prueba
for (let i = 1; i <= 5; i++) {
    usuarios.push({
        nombre: 'Estudiante',
        apellido: 'Prueba ' + i,
        correo: `estudiante${i}@example.com`,
        username: `estudiante${i}`,
        password: 'Estudiante123*',
        rol: 'E'
    });
}

// consulta para insertar usuarios
const insertarUsuario = baseDatos.prepare(`
    INSERT INTO GRL_USUARIOS (
        usu_nombre,
        usu_apellido,
        usu_correo,
        usu_username,
        usu_password_hash,
        usu_rol,
        usu_estado,
        usu_codigo1
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

// consulta si un usuario ya existe
const buscarUsuario = baseDatos.prepare(`
    SELECT usu_codigo, usu_rol
    FROM GRL_USUARIOS
    WHERE usu_username = ?
`);

// Función para cargar los usuarios de prueba
function cargarUsuarios() {

    let codigoAdmin = null;
    let insertados = 0;

    for (const usuario of usuarios) {

        // Comprobar si el usuario ya existe
        const existente = buscarUsuario.get(usuario.username);

        if (existente) {

            if (existente.usu_rol !== usuario.rol) {
                throw new Error(
                    'El usuario existente tiene un rol diferente'
                );
            }

            if (usuario.rol === 'A') {
                codigoAdmin = existente.usu_codigo;
            }

            console.log('Usuario existente:', usuario.username);
            continue;
        }

        // Generar el hash de la contraseña
        const contrasenaHash = bcrypt.hashSync(
            usuario.password,
            rondas
        );

        // El administrador inicial no tiene un creador
        const codigoCreador =
            usuario.rol === 'A' ? null : codigoAdmin;

        // Insertar el usuario
        const resultado = insertarUsuario.run(
            usuario.nombre,
            usuario.apellido,
            usuario.correo,
            usuario.username,
            contrasenaHash,
            usuario.rol,
            'A',
            codigoCreador
        );

        // Guardar el código del administrador
        if (usuario.rol === 'A') {
            codigoAdmin = Number(resultado.lastInsertRowid);
        }

        insertados++;

        console.log('Usuario creado:', usuario.username);
    }

    console.log('Total de usuarios nuevos:', insertados);
}

// Datos laboratorios de prueba
const laboratorios = [
    {
        nombre: 'Laboratorio de Computacion 1',
        ubicacion: 'Bloque A - Planta Baja',
        capacidad: 25,
        software: 'IntelliJ IDEA, Visual Studio Code, Node.js',
        foto: 'laboratorio1.jpg',
        estado: 'D'
    },
    {
        nombre: 'Laboratorio de Redes',
        ubicacion: 'Bloque A - Primera Planta',
        capacidad: 20,
        software: 'Cisco Packet Tracer, Wireshark',
        foto: 'laboratorio2.jpg',
        estado: 'D'
    },
    {
        nombre: 'Laboratorio de Electronica',
        ubicacion: 'Bloque B - Planta Baja',
        capacidad: 15,
        software: 'Vivado, STM32CubeIDE',
        foto: 'laboratorio3.jpg',
        estado: 'M'
    }
];

//preparar la consulta para insertar laboratorios
const insertarLaboratorio = baseDatos.prepare(`
    INSERT INTO GRL_LABORATORIOS (
        lab_nombre,
        lab_ubicacion,
        lab_capacidad,
        lab_software_instalado,
        lab_foto,
        lab_estado
    ) VALUES (?, ?, ?, ?, ?, ?)
`);

//consultar si un laboratorio ya existe
const buscarLaboratorio = baseDatos.prepare(`
    SELECT lab_codigo
    FROM GRL_LABORATORIOS
    WHERE lab_nombre = ?
    AND lab_ubicacion = ?
`);

//  cargar los laboratorios de prueba
function cargarLaboratorios() {

    let insertados = 0;

    for (const laboratorio of laboratorios) {

        // Comprobar si el laboratorio ya existe
        const existente = buscarLaboratorio.get(
            laboratorio.nombre,
            laboratorio.ubicacion
        );

        if (existente) {
            console.log(
                'Laboratorio existente:',
                laboratorio.nombre
            );
            continue;
        }

        // Insertar el laboratorio
        insertarLaboratorio.run(
            laboratorio.nombre,
            laboratorio.ubicacion,
            laboratorio.capacidad,
            laboratorio.software,
            laboratorio.foto,
            laboratorio.estado
        );

        insertados++;

        console.log(
            'Laboratorio creado:',
            laboratorio.nombre
        );
    }

    console.log('Total de laboratorios nuevos:', insertados);
}

//carga de datos semilla
try {

    // Inicia una transaccion
    baseDatos.exec('BEGIN IMMEDIATE TRANSACTION');

    console.log('\n--- CARGANDO USUARIOS ---');
    cargarUsuarios();

    console.log('\n--- CARGANDO LABORATORIOS ---');
    cargarLaboratorios();

    // Confirmar los cambios
    baseDatos.exec('COMMIT');

    console.log('\nDatos semilla cargados correctamente');

} catch (error) {

    // Deshace los cambios si ocurre un error
    if (baseDatos.isTransaction) {
        baseDatos.exec('ROLLBACK');
    }

    console.error('Error al cargar los datos:', error.message);
    process.exitCode = 1;

} finally {

    // Cerrar la conexion
    baseDatos.close();
}