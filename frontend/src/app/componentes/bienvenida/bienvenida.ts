import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Autenticacion } from '../../servicios/autenticacion';
import { UsuarioAutenticado } from '../../modelos/autenticacion';

@Component({
  selector: 'app-bienvenida',
  imports: [],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css'
})
export class Bienvenida implements OnInit {

  private readonly autenticacion = inject(Autenticacion);
  private readonly router = inject(Router);

  usuario: UsuarioAutenticado | null = null;

  // Recuperar los datos de la sesion
  ngOnInit(): void {

    this.usuario = this.autenticacion.obtenerUsuario();

    if (!this.usuario || !this.autenticacion.sesionActiva()) {
      this.router.navigate(['/inicio-sesion']);
    }
  }

  // Obtener el nombre completo del rol
  obtenerRol(): string {

    switch (this.usuario?.usu_rol) {

      case 'A':
        return 'Administrador';

      case 'D':
        return 'Docente';

      case 'E':
        return 'Estudiante';

      default:
        return 'Desconocido';
    }
  }

  // Cerrar la sesion usuario
  cerrarSesion(): void {

    this.autenticacion.cerrarSesion();

    this.router.navigate(['/inicio-sesion']);
  }
}
