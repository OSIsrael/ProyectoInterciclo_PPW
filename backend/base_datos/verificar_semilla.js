const baseDatos = require('./conexion');
const bcrypt = require('bcryptjs');

try {

    // Consultar los usuarios registrados
    const usuarios = baseDatos.prepare(`
        SELECT usu_codigo,
               usu_username,
               usu_rol,
               usu_estado,
               usu_codigo1
        FROM GRL_USUARIOS
        ORDER BY usu_codigo
    `).all();

    console.log('\n--- USUARIOS REGISTRADOS ---');
    console.table(usuarios);

    // Consultar cantidad de usuarios por rol
    const roles = baseDatos.prepare(`
        SELECT usu_rol AS rol, COUNT(*) AS cantidad
        FROM GRL_USUARIOS
        GROUP BY usu_rol
    `).all();

    console.log('\n--- USUARIOS POR ROL ---');
    console.table(roles);

    // Consultar los laboratorios registrados
    const laboratorios = baseDatos.prepare(`
        SELECT lab_codigo,
               lab_nombre,
               lab_capacidad,
               lab_estado
        FROM GRL_LABORATORIOS
    `).all();

    console.log('\n--- LABORATORIOS REGISTRADOS ---');
    console.table(laboratorios);

    // Verificar la contraseña del administrador
    const admin = baseDatos.prepare(`
        SELECT usu_password_hash
        FROM GRL_USUARIOS
        WHERE usu_username = ?
    `).get('admin');

    const contrasenaCorrecta = bcrypt.compareSync(
        'Admin123*',
        admin.usu_password_hash
    );

    const contrasenaIncorrecta = bcrypt.compareSync(
        'ClaveIncorrecta',
        admin.usu_password_hash
    );

    console.log('\n--- PRUEBAS DE CONTRASENA ---');

    console.log('Contrasena correcta:',
        contrasenaCorrecta ? 'CORRECTO' : 'FALLO'
    );

    console.log('Rechazo de contrasena incorrecta:',
        !contrasenaIncorrecta ? 'CORRECTO' : 'FALLO'
    );

    // Verificar la integridad referencial
    const errores = baseDatos.prepare(`
        PRAGMA foreign_key_check
    `).all();

    console.log('Errores de claves foraneas:', errores.length);

} finally {
    baseDatos.close();
}