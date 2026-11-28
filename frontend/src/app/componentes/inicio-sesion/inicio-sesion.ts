import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, timeout } from 'rxjs';

import { Autenticacion } from '../../servicios/autenticacion';

import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio-sesion',
  imports: [FormsModule],
  templateUrl: './inicio-sesion.html',
  styleUrl: './inicio-sesion.css'
})
export class InicioSesion {

  private readonly autenticacion = inject(Autenticacion);
  private readonly router = inject(Router);

  usuario: string = '';
  contrasena: string = '';

  mensajeError = signal('');
  mensajeExito = signal('');
  cargando = signal(false);

  iniciarSesion(): void {

    if (this.cargando()) {
      return;
    }

    this.mensajeError.set('');
    this.mensajeExito.set('');

    // Validar los campos
    if (!this.usuario.trim() || !this.contrasena) {
      this.mensajeError.set(
        'Ingrese su usuario y contraseña'
      );
      return;
    }

    this.cargando.set(true);

    // Enviar las credenciales
    this.autenticacion.iniciarSesion({
      usuario: this.usuario.trim(),
      contrasena: this.contrasena

    }).pipe(

      timeout(10000),

      finalize(() => {
        this.cargando.set(false);
      })

    ).subscribe({

      next: () => {

        this.contrasena = '';

        this.router.navigate(['/bienvenida']);

      },

      error: (error) => {

        if (error.name === 'TimeoutError') {

          this.mensajeError.set(
            'El servidor tardó demasiado en responder'
          );

        } else if (error instanceof HttpErrorResponse) {

          switch (error.status) {

            case 0:
              this.mensajeError.set(
                'No se pudo conectar con el servidor'
              );
              break;

            case 401:
              this.mensajeError.set(
                'Usuario o contraseña incorrectos'
              );
              break;

            case 403:
              this.mensajeError.set(
                'No tiene permiso para iniciar sesión'
              );
              break;

            case 404:
              this.mensajeError.set(
                'Servicio de autenticación no disponible'
              );
              break;

            default:
              this.mensajeError.set(
                'Ocurrió un error al iniciar sesión'
              );
          }

        } else {

          this.mensajeError.set(
            'Ocurrió un error inesperado'
          );
        }
      }
    });
  }
}
