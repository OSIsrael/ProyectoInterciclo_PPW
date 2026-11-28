import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService, Horario, Bloqueo } from '../servicios/horarios.service';
import { ReservasService, LaboratorioItem, UsuarioItem } from '../../reservas/servicios/reservas.service';

@Component({
  selector: 'app-gestion-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-horarios.html',
  styleUrl: './gestion-horarios.css'
})
export class GestionHorariosComponent implements OnInit {
  private readonly horariosService = inject(HorariosService);
  private readonly reservasService = inject(ReservasService);

  laboratorios: LaboratorioItem[] = [];
  administradores: UsuarioItem[] = [];
  horarios: Horario[] = [];
  bloqueos: Bloqueo[] = [];

  diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  filtroLabCodigo = 0;

  nuevoHorario: Horario = {
    hor_dia_semana: 'Lunes',
    hor_hora_inicio: '07:00',
    hor_hora_fin: '09:00',
    hor_activo: 'S',
    lab_codigo: 1
  };

  bloqueoForm = {
    blo_tipo: 'clase_fija' as 'clase_fija' | 'mantenimiento' | 'feriado',
    blo_motivo: '',
    fecha: '',
    horaInicio: '07:00',
    horaFin: '09:00',
    lab_codigo: 1,
    usu_codigo: 1
  };

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.cargarCatalogos();
    this.cargarHorarios();
    this.cargarBloqueos();
  }

  cargarCatalogos(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.laboratorios = data.laboratorios;
        this.administradores = data.usuarios.filter((u) => u.usu_rol === 'A');
        if (this.laboratorios.length > 0) {
          this.nuevoHorario.lab_codigo = this.laboratorios[0].lab_codigo;
          this.bloqueoForm.lab_codigo = this.laboratorios[0].lab_codigo;
        }
        if (this.administradores.length > 0) {
          this.bloqueoForm.usu_codigo = this.administradores[0].usu_codigo;
        }
      }
    });
  }

  cargarHorarios(): void {
    const lab = this.filtroLabCodigo > 0 ? this.filtroLabCodigo : undefined;
    this.horariosService.listarHorarios(lab).subscribe({
      next: (data) => (this.horarios = data),
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cargar horarios')
    });
  }

  cargarBloqueos(): void {
    this.horariosService.listarBloqueos().subscribe({
      next: (data) => (this.bloqueos = data),
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cargar bloqueos')
    });
  }

  guardarHorario(): void {
    this.limpiarMensajes();
    this.horariosService.crearHorario({
      ...this.nuevoHorario,
      lab_codigo: Number(this.nuevoHorario.lab_codigo)
    }).subscribe({
      next: () => {
        this.mensajeExito = 'Franja horaria registrada correctamente.';
        this.cargarHorarios();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se pudo crear el horario')
    });
  }

  alternarEstadoHorario(h: Horario): void {
    if (!h.hor_codigo) return;
    this.limpiarMensajes();
    const nuevoEstado = h.hor_activo === 'S' ? 'N' : 'S';
    this.horariosService.actualizarHorario(h.hor_codigo, { ...h, hor_activo: nuevoEstado }).subscribe({
      next: () => {
        this.mensajeExito = 'Estado del horario actualizado.';
        this.cargarHorarios();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al actualizar horario')
    });
  }

  eliminarHorario(id?: number): void {
    if (!id) return;
    this.limpiarMensajes();
    this.horariosService.eliminarHorario(id).subscribe({
      next: () => {
        this.mensajeExito = 'Franja horaria eliminada.';
        this.cargarHorarios();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se puede eliminar (puede tener reservas asociadas)')
    });
  }

  guardarBloqueo(): void {
    this.limpiarMensajes();
    if (!this.bloqueoForm.fecha || !this.bloqueoForm.blo_motivo.trim()) {
      this.mensajeError = 'Completa la fecha y el motivo del bloqueo.';
      return;
    }

    this.horariosService.crearBloqueo({
      blo_tipo: this.bloqueoForm.blo_tipo,
      blo_motivo: this.bloqueoForm.blo_motivo.trim(),
      blo_inicio: `${this.bloqueoForm.fecha}T${this.bloqueoForm.horaInicio}`,
      blo_fin: `${this.bloqueoForm.fecha}T${this.bloqueoForm.horaFin}`,
      lab_codigo: Number(this.bloqueoForm.lab_codigo),
      usu_codigo: Number(this.bloqueoForm.usu_codigo)
    }).subscribe({
      next: () => {
        this.mensajeExito = 'Bloqueo registrado correctamente.';
        this.bloqueoForm.blo_motivo = '';
        this.cargarBloqueos();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se pudo registrar el bloqueo')
    });
  }

  eliminarBloqueo(id?: number): void {
    if (!id) return;
    this.limpiarMensajes();
    this.horariosService.eliminarBloqueo(id).subscribe({
      next: () => {
        this.mensajeExito = 'Bloqueo eliminado.';
        this.cargarBloqueos();
      },
      error: (err) => (this.mensajeError = err.error?.error || 'Error al eliminar bloqueo')
    });
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }
}