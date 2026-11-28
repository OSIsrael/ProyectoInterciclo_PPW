import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservasService, LaboratorioItem, UsuarioItem } from '../servicios/reservas.service';

@Component({
  selector: 'app-solicitud-docente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-docente.html',
  styleUrl: './solicitud-docente.css'
})
export class SolicitudDocenteComponent implements OnInit {
  private readonly reservasService = inject(ReservasService);

  docentes: UsuarioItem[] = [];
  laboratorios: LaboratorioItem[] = [];

  form = {
    usu_codigo: 2,
    lab_codigo: 1,
    fecha: '2026-12-04',
    horaInicio: '09:00',
    horaFin: '11:00',
    res_asignatura: '',
    res_motivo: ''
  };

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.reservasService.obtenerCatalogos().subscribe({
      next: (data) => {
        this.docentes = data.usuarios.filter((u) => u.usu_rol === 'D');
        this.laboratorios = data.laboratorios;
        if (this.docentes.length > 0) this.form.usu_codigo = this.docentes[0].usu_codigo;
        if (this.laboratorios.length > 0) this.form.lab_codigo = this.laboratorios[0].lab_codigo;
      }
    });
  }

  enviarSolicitud(): void {
    this.mensajeExito = '';
    this.mensajeError = '';

    this.reservasService.solicitarDocente({
      usu_codigo: Number(this.form.usu_codigo),
      lab_codigo: Number(this.form.lab_codigo),
      res_fecha_hora_inicio: `${this.form.fecha}T${this.form.horaInicio}`,
      res_fecha_hora_fin: `${this.form.fecha}T${this.form.horaFin}`,
      res_asignatura: this.form.res_asignatura.trim(),
      res_motivo: this.form.res_motivo.trim()
    }).subscribe({
      next: (res) => {
        this.mensajeExito = `Solicitud #${res.res_codigo} registrada en estado Pendiente (P). Se notificó al administrador.`;
        this.form.res_asignatura = '';
        this.form.res_motivo = '';
      },
      error: (err) => (this.mensajeError = err.error?.error || 'No se pudo enviar la solicitud')
    });
  }
}