import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService, Reserva, UsuarioItem } from '../servicios/reservas.service';

@Component({
  selector: 'app-aprobacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './aprobacion-admin.html',
  styleUrl: './aprobacion-admin.css'
})
export class AprobacionAdminComponent implements OnInit {
  private readonly reservasService = inject(ReservasService);

  administradores: UsuarioItem[] = [];
  adminSeleccionado = 1;
  reservas: Reserva[] = [];
  mensajesRespuesta: Record<number, string> = {};

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.administradores = data.usuarios.filter((u) => u.usu_rol === 'A');
        if (this.administradores.length > 0) {
          this.adminSeleccionado = this.administradores[0].usu_codigo;
        }
      }
    });
    this.cargarReservas();
  }

  cargarReservas(): void {
    this.reservasService.listarTodas().subscribe({
      next: (data) => (this.reservas = data),
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cargar reservas')
    });
  }

  get pendientes(): Reserva[] {
    return this.reservas.filter((r) => r.res_estado === 'P');
  }

  responder(resCodigo: number, accion: 'A' | 'R'): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    const mensaje = this.mensajesRespuesta[resCodigo] || '';

    this.reservasService.responderSolicitud(resCodigo, {
      accion,
      res_mensaje_respuesta: mensaje,
      usu_codigo1: Number(this.adminSeleccionado)
    }).subscribe({
      next: () => {
        this.mensajeExito = accion === 'A'
          ? `Solicitud #${resCodigo} aprobada y notificada al docente.`
          : `Solicitud #${resCodigo} rechazada y notificada al docente.`;
        this.cargarReservas();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al procesar solicitud')
    });
  }

  etiquetaEstado(estado: string): string {
    const mapa: Record<string, string> = {
      P: 'Pendiente',
      A: 'Aprobada',
      R: 'Rechazada',
      C: 'Cancelada',
      F: 'Finalizada'
    };
    return mapa[estado] || estado;
  }
}