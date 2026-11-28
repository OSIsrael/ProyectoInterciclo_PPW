// Credenciales ingresadas en el formulario
export interface Credenciales {
  usuario: string;
  contrasena: string;
}

// Datos del usuario autenticado
export interface UsuarioAutenticado {
  usu_codigo: number;
  usu_nombre: string;
  usu_apellido: string;
  usu_username: string;
  usu_rol: 'A' | 'D' | 'E';
}

// Respuesta del servidor al iniciar sesion
export interface RespuestaAutenticacion {
  mensaje: string;
  token: string;
  usuario: UsuarioAutenticado;
}
