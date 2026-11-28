import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService, LaboratorioItem, EquipoItem, UsuarioItem } from '../servicios/reservas.service';

@Component({
  selector: 'app-reserva-estudiante',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva-estudiante.html',
  styleUrl: './reserva-estudiante.css'
})
export class ReservaEstudianteComponent implements OnInit {
  private readonly reservasService = inject(ReservasService);

  estudiantes: UsuarioItem[] = [];
  laboratorios: LaboratorioItem[] = [];
  todosEquipos: EquipoItem[] = [];
  equiposFiltrados: EquipoItem[] = [];

  form = {
    usu_codigo: 5,
    lab_codigo: 1,
    equ_codigo: 0,
    fecha: '2026-12-04',
    horaInicio: '11:00',
    horaFin: '13:00',
    res_motivo: ''
  };

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.estudiantes = data.usuarios.filter((u) => u.usu_rol === 'E');
        this.laboratorios = data.laboratorios;
        this.todosEquipos = data.equipos;
        if (this.estudiantes.length > 0) this.form.usu_codigo = this.estudiantes[0].usu_codigo;
        if (this.laboratorios.length > 0) {
          this.form.lab_codigo = this.laboratorios[0].lab_codigo;
          this.filtrarEquiposPorLab();
        }
      }
    });
  }

  filtrarEquiposPorLab(): void {
    const labId = Number(this.form.lab_codigo);
    this.equiposFiltrados = this.todosEquipos.filter((e) => e.lab_codigo === labId);
    this.form.equ_codigo = this.equiposFiltrados.length > 0 ? this.equiposFiltrados[0].equ_codigo : 0;
  }

  reservarEquipo(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    this.reservasService.reservarEstudiante({
      usu_codigo: Number(this.form.usu_codigo),
      lab_codigo: Number(this.form.lab_codigo),
      equ_codigo: Number(this.form.equ_codigo),
      res_fecha_hora_inicio: `${this.form.fecha}T${this.form.horaInicio}`,
      res_fecha_hora_fin: `${this.form.fecha}T${this.form.horaFin}`,
      res_motivo: this.form.res_motivo.trim() || 'Práctica individual de estudiante'
    }).subscribe({
      next: (res) => {
        this.mensajeExito = `Reserva #${res.res_codigo} confirmada automáticamente (Estado: Aprobada). Equipo: ${res.equ_codigo_inventario}.`;
        this.form.res_motivo = '';
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se pudo completar la reserva del equipo')
    });
  }
}