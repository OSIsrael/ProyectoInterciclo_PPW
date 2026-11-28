const autenticacionServicio = require('../servicios/autenticacion_servicio');

// Controlador para iniciar sesion
async function iniciarSesion(solicitud, respuesta) {

    try {

        const { usuario, contrasena } = solicitud.body || {};

        // Validar los datos recibidos
        if (
            typeof usuario !== 'string' ||
            typeof contrasena !== 'string' ||
            !usuario.trim() ||
            !contrasena
        ) {
            return respuesta.status(400).json({
                mensaje: 'Debe ingresar usuario y contraseña'
            });
        }

        // Llamar al servicio de autenticacion
        const resultado = await autenticacionServicio.iniciarSesion(
            usuario.trim(),
            contrasena
        );

        const { estado, ...datos } = resultado;

        return respuesta.status(estado).json(datos);

    } catch (error) {

        console.error('Error de autenticacion:', error.message);

        return respuesta.status(500).json({
            mensaje: 'Error interno del servidor'
        });
    }
}

module.exports = {
    iniciarSesion
};