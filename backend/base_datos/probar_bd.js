const baseDatos = require('./conexion');

function probarRestriccion(nombre, consulta) {
    try {
        baseDatos.exec(consulta);
        console.log('FALLO: ' + nombre);
    } catch (error) {
        if (error.errcode && (error.errcode & 255) === 19) {
            console.log('CORRECTO: ' + nombre);
        } else {
            console.log('ERROR: ' + nombre + ': ' + error.message);
        }
    }
}

try {
    // Iniciar transacción para las pruebas
    baseDatos.exec('BEGIN TRANSACTION');

    // Crear un usuario temporal
    baseDatos.exec(`
        INSERT INTO GRL_USUARIOS (
            usu_nombre, usu_apellido, usu_correo,
            usu_username, usu_password_hash,
            usu_rol, usu_estado
        ) VALUES (
            'Usuario', 'Prueba', 'prueba@test.com',
            'prueba', 'hash_temporal', 'A', 'A'
        );
    `);

    // PRUEBA 1: Correo duplicado
    probarRestriccion('Correo duplicado', `
        INSERT INTO GRL_USUARIOS (
            usu_nombre, usu_apellido, usu_correo,
            usu_username, usu_password_hash,
            usu_rol, usu_estado
        ) VALUES (
            'Otro', 'Usuario', 'prueba@test.com',
            'otro', 'hash_temporal', 'D', 'A'
        );
    `);

    // PRUEBA 2: Nombre obligatorio
    probarRestriccion('Nombre obligatorio', `
        UPDATE GRL_USUARIOS
        SET usu_nombre = NULL
        WHERE usu_username = 'prueba';
    `);

    // PRUEBA 3: Rol inválido
    probarRestriccion('Rol invalido', `
        UPDATE GRL_USUARIOS
        SET usu_rol = 'X'
        WHERE usu_username = 'prueba';
    `);

    // PRUEBA 4: Clave foránea inexistente
    probarRestriccion('Clave foranea inexistente', `
        INSERT INTO GRL_EQUIPOS (
            equ_codigo_inventario,
            equ_tipo, equ_estado, lab_codigo
        ) VALUES (
            'EQ-PRUEBA', 'Computadora', 'O', -1
        );
    `);

} finally {
    // Deshacer todos los cambios de las pruebas
    if (baseDatos.isTransaction) {
        baseDatos.exec('ROLLBACK');
    }

    baseDatos.close();
    console.log('Pruebas finalizadas');
}