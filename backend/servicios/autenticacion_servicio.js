const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const usuariosRepositorio = require('../repositorios/usuarios_repositorio');

// Validar las credenciales del usuario
async function iniciarSesion(username, contrasena) {

    // Buscar el usuario en la base de datos
    const usuario = usuariosRepositorio.buscarPorUsername(username);

    if (!usuario) {
        return {
            estado: 401,
            mensaje: 'Usuario o contraseña incorrectos'
        };
    }

    // Comparar la contraseña con el hash almacenado
    const contrasenaValida = await bcrypt.compare(
        contrasena,
        usuario.usu_password_hash
    );

    if (!contrasenaValida) {
        return {
            estado: 401,
            mensaje: 'Usuario o contraseña incorrectos'
        };
    }

    // Comprobar que el usuario este activo
    if (usuario.usu_estado !== 'A') {
        return {
            estado: 403,
            mensaje: 'El usuario se encuentra inactivo'
        };
    }

    // Generar el token JWT
    const token = jwt.sign(
        {
            usu_codigo: usuario.usu_codigo,
            usu_rol: usuario.usu_rol
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRACION || '2h',
            algorithm: 'HS256'
        }
    );

    // Retornar los datos de autenticacion
    return {
        estado: 200,
        mensaje: 'Sesion iniciada correctamente',
        token: token,
        usuario: {
            usu_codigo: usuario.usu_codigo,
            usu_nombre: usuario.usu_nombre,
            usu_apellido: usuario.usu_apellido,
            usu_username: usuario.usu_username,
            usu_rol: usuario.usu_rol
        }
    };
}

module.exports = {
    iniciarSesion
};