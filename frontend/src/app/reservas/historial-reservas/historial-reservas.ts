import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService, Reserva, UsuarioItem } from '../servicios/reservas.service';

@Component({
  selector: 'app-historial-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-reservas.html',
  styleUrl: './historial-reservas.css'
})
export class HistorialReservasComponent implements OnInit {
  private readonly reservasService = inject(ReservasService);

  usuarios: UsuarioItem[] = [];
  usuarioSeleccionado = 2;
  reservas: Reserva[] = [];

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.usuarios = data.usuarios;
        if (this.usuarios.length > 0) {
          const docente = this.usuarios.find((u) => u.usu_rol === 'D');
          this.usuarioSeleccionado = docente ? docente.usu_codigo : this.usuarios[0].usu_codigo;
        }
        this.cargarHistorial();
      }
    });
  }

  cargarHistorial(): void {
    this.reservasService.listarPorUsuario(Number(this.usuarioSeleccionado)).subscribe({
      next: (data) => (this.reservas = data),
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cargar el historial')
    });
  }

  puedeCancelar(r: Reserva): boolean {
    if (r.res_estado !== 'P' && r.res_estado !== 'A') return false;
    return new Date(r.res_fecha_hora_inicio) > new Date();
  }

  cancelar(resCodigo: number): void {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.reservasService.cancelarReserva(resCodigo, Number(this.usuarioSeleccionado)).subscribe({
      next: () => {
        this.mensajeExito = `Reserva #${resCodigo} cancelada correctamente.`;
        this.cargarHistorial();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se pudo cancelar la reserva')
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