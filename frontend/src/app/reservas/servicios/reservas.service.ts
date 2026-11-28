import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LaboratorioItem {
  lab_codigo: number;
  lab_nombre: string;
  lab_ubicacion: string;
  lab_capacidad: number;
  lab_software_instalado: string;
  lab_estado: 'D' | 'M';
}

export interface EquipoItem {
  equ_codigo: number;
  equ_codigo_inventario: string;
  equ_tipo: string;
  equ_estado: 'O' | 'D' | 'R';
  lab_codigo: number;
}

export interface UsuarioItem {
  usu_codigo: number;
  usu_nombre: string;
  usu_apellido: string;
  usu_username: string;
  usu_rol: 'A' | 'D' | 'E';
}

export interface CatalogosReserva {
  laboratorios: LaboratorioItem[];
  equipos: EquipoItem[];
  usuarios: UsuarioItem[];
}

export interface Reserva {
  res_codigo: number;
  res_tipo: 'L' | 'E';
  res_fecha_hora_inicio: string;
  res_fecha_hora_fin: string;
  res_asignatura: string | null;
  res_motivo: string | null;
  res_estado: 'P' | 'A' | 'R' | 'C' | 'F';
  res_mensaje_respuesta: string;
  usu_codigo: number;
  lab_codigo: number;
  usu_codigo1: number | null;
  hor_codigo: number;
  equ_codigo: number | null;
  lab_nombre?: string;
  equ_codigo_inventario?: string | null;
  solicitante_nombre?: string;
  solicitante_rol?: string;
}

@Injectable({ providedIn: 'root' })
export class ReservasService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = 'http://localhost:3000/api';

  obtenerCatalogos(): Observable<CatalogosReserva> {
    return this.http.get<CatalogosReserva>(`${this.urlApi}/reservas/catalogos`);
  }

  listarTodas(): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.urlApi}/reservas`);
  }

  listarPorUsuario(usuCodigo: number): Observable<Reserva[]> {
    return this.http.get<Reserva[]>(`${this.urlApi}/reservas/usuario/${usuCodigo}`);
  }

  solicitarDocente(payload: {
    usu_codigo: number;
    lab_codigo: number;
    res_fecha_hora_inicio: string;
    res_fecha_hora_fin: string;
    res_asignatura: string;
    res_motivo: string;
  }): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.urlApi}/reservas/docente`, payload);
  }

  reservarEstudiante(payload: {
    usu_codigo: number;
    lab_codigo: number;
    equ_codigo: number;
    res_fecha_hora_inicio: string;
    res_fecha_hora_fin: string;
    res_motivo: string;
  }): Observable<Reserva> {
    return this.http.post<Reserva>(`${this.urlApi}/reservas/estudiante`, payload);
  }

  responderSolicitud(
    resCodigo: number,
    payload: { accion: 'A' | 'R'; res_mensaje_respuesta: string; usu_codigo1: number }
  ): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.urlApi}/reservas/${resCodigo}/responder`, payload);
  }

  cancelarReserva(resCodigo: number, usuCodigo: number): Observable<Reserva> {
    return this.http.put<Reserva>(`${this.urlApi}/reservas/${resCodigo}/cancelar`, { usu_codigo: usuCodigo });
  }
}