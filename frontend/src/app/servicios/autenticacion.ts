import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Api } from './api';

import {
  Credenciales,
  RespuestaAutenticacion,
  UsuarioAutenticado
} from '../modelos/autenticacion';

@Injectable({
  providedIn: 'root'
})
export class Autenticacion {

  private readonly api = inject(Api);


  iniciarSesion(
    credenciales: Credenciales
  ): Observable<RespuestaAutenticacion> {

    return this.api.iniciarSesion(credenciales).pipe(

      tap(respuesta => {
        sessionStorage.setItem(
          'token',
          respuesta.token
        );

        sessionStorage.setItem(
          'usuario',
          JSON.stringify(respuesta.usuario)
        );
      })
    );
  }


  obtenerToken(): string | null {
    return sessionStorage.getItem('token');
  }

  // Obtener el usuario autenticado
  obtenerUsuario(): UsuarioAutenticado | null {

    const usuario = sessionStorage.getItem('usuario');

    return usuario ? JSON.parse(usuario) : null;
  }

  // Comprobar una sesion local
  sesionActiva(): boolean {
    return this.obtenerToken() !== null;
  }

  cerrarSesion(): void {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('usuario');
  }
}
