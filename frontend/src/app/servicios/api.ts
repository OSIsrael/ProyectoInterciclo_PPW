import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
}
