import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosService, CalendarioSemanal } from '../servicios/horarios.service';
import { ReservasService, LaboratorioItem } from '../../reservas/servicios/reservas.service';

@Component({
  selector: 'app-calendario-semanal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendario-semanal.html',
  styleUrl: './calendario-semanal.css'
})
export class CalendarioSemanalComponent implements OnInit {
  private readonly horariosService = inject(HorariosService);
  private readonly reservasService = inject(ReservasService);

  laboratorios: LaboratorioItem[] = [];
  labSeleccionado = 1;
  fechaReferencia = '2026-12-01';
  calendario: CalendarioSemanal | null = null;
  mensajeError = '';

  ngOnInit(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.laboratorios = data.laboratorios;
        if (this.laboratorios.length > 0) {
          this.labSeleccionado = this.laboratorios[0].lab_codigo;
        }
        this.consultarCalendario();
      }
    });
  }

  consultarCalendario(): void {
    this.mensajeError = '';
    this.horariosService.obtenerCalendarioSemanal(Number(this.labSeleccionado), this.fechaReferencia).subscribe({
      next: (data) => (this.calendario = data),
      error: (err) => (this.mensajeError = err.error?.error || 'Error al cargar el calendario semanal')
    });
  }

  cambiarSemana(diasDelta: number): void {
    const fecha = new Date(`${this.fechaReferencia}T12:00:00`);
    fecha.setDate(fecha.getDate() + diasDelta);
    this.fechaReferencia = fecha.toISOString().split('T')[0];
    this.consultarCalendario();
  }
}