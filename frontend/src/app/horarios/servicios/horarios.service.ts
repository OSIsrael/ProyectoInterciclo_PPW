import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Horario {
  hor_codigo?: number;
  hor_dia_semana: string;
  hor_hora_inicio: string;
  hor_hora_fin: string;
  hor_activo: 'S' | 'N';
  lab_codigo: number;
  lab_nombre?: string;
}

export interface Bloqueo {
  blo_codigo?: number;
  blo_tipo: 'clase_fija' | 'mantenimiento' | 'feriado';
  blo_motivo: string;
  blo_inicio: string;
  blo_fin: string;
  lab_codigo: number;
  usu_codigo: number;
  lab_nombre?: string;
  creado_por?: string;
}

export interface FranjaCalendario {
  hor_codigo: number;
  hor_dia_semana: string;
  hor_hora_inicio: string;
  hor_hora_fin: string;
  hor_activo: string;
  lab_codigo: number;
  fecha: string;
  inicio_iso: string;
  fin_iso: string;
  estado_disponibilidad: 'libre' | 'parcial' | 'reservada' | 'bloqueada';
  detalle: string;
  cupos_ocupados?: number;
  capacidad_total?: number;
}

export interface DiaCalendario {
  fecha: string;
  diaNombre: string;
  franjas: FranjaCalendario[];
}

export interface CalendarioSemanal {
  laboratorio: {
    lab_codigo: number;
    lab_nombre: string;
    lab_ubicacion: string;
    lab_capacidad: number;
    lab_estado: 'D' | 'M';
  };
  semana_inicio: string;
  semana_fin: string;
  dias: DiaCalendario[];
}

@Injectable({ providedIn: 'root' })
export class HorariosService {
  private readonly http = inject(HttpClient);
  private readonly urlApi = 'http://localhost:3000/api';

  listarHorarios(labCodigo?: number): Observable<Horario[]> {
    let params = new HttpParams();
    if (labCodigo) {
      params = params.set('lab_codigo', labCodigo);
    }
    return this.http.get<Horario[]>(`${this.urlApi}/horarios`, { params });
  }

  crearHorario(horario: Horario): Observable<Horario> {
    return this.http.post<Horario>(`${this.urlApi}/horarios`, horario);
  }

  actualizarHorario(id: number, horario: Partial<Horario>): Observable<Horario> {
    return this.http.put<Horario>(`${this.urlApi}/horarios/${id}`, horario);
  }

  eliminarHorario(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.urlApi}/horarios/${id}`);
  }

  listarBloqueos(): Observable<Bloqueo[]> {
    return this.http.get<Bloqueo[]>(`${this.urlApi}/bloqueos`);
  }

  crearBloqueo(bloqueo: Bloqueo): Observable<Bloqueo> {
    return this.http.post<Bloqueo>(`${this.urlApi}/bloqueos`, bloqueo);
  }

  eliminarBloqueo(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.urlApi}/bloqueos/${id}`);
  }

  obtenerCalendarioSemanal(labCodigo: number, fecha?: string): Observable<CalendarioSemanal> {
    let params = new HttpParams();
    if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<CalendarioSemanal>(`${this.urlApi}/horarios/calendario/${labCodigo}`, { params });
  }
}