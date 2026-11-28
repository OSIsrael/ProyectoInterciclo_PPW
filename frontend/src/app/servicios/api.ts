import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  Credenciales,
  RespuestaAutenticacion
} from '../modelos/autenticacion';

// Estructura de la respuesta del servidor
interface RespuestaBaseDatos {
  mensaje: string;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class Api {

  private readonly http = inject(HttpClient);

  private readonly urlApi = 'http://localhost:3000/api';

  // Comprobar conexion
  comprobarConexion(): Observable<RespuestaBaseDatos> {
    return this.http.get<RespuestaBaseDatos>(
      `${this.urlApi}/base-datos`
    );
  }

  // Enviar credenciales al backend
  iniciarSesion(
    credenciales: Credenciales
  ): Observable<RespuestaAutenticacion> {

    return this.http.post<RespuestaAutenticacion>(
      `${this.urlApi}/autenticacion/login`,
      credenciales
    );
  }
}
