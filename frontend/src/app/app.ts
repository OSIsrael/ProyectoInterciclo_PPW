import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Api } from './servicios/api';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {

  private readonly servicioApi = inject(Api);

  titulo = 'Gestión de Reservas de Laboratorios';

  mensaje = signal('Comprobando conexión...');
  versionSqlite = signal('');
  conectado = signal(false);

  ngOnInit(): void {
    this.verificarConexion();
  }

  verificarConexion(): void {

    this.servicioApi.comprobarConexion().subscribe({

      next: (respuesta) => {
        this.mensaje.set(respuesta.mensaje);
        this.versionSqlite.set(respuesta.version);
        this.conectado.set(true);
      },

      error: (error) => {
        this.mensaje.set('Error de conexión con el servidor');
        this.versionSqlite.set('');
        this.conectado.set(false);

        console.error(error);
      }

    });
  }
}
