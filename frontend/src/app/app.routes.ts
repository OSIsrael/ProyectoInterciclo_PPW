import { Routes } from '@angular/router';
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { Bienvenida } from './componentes/bienvenida/bienvenida';
import { GestionHorariosComponent } from './horarios/gestion-horarios/gestion-horarios';
import { CalendarioSemanalComponent } from './horarios/calendario-semanal/calendario-semanal';
import { SolicitudDocenteComponent } from './reservas/solicitud-docente/solicitud-docente';
import { ReservaEstudianteComponent } from './reservas/reserva-estudiante/reserva-estudiante';
import { AprobacionAdminComponent } from './reservas/aprobacion-admin/aprobacion-admin';
import { HistorialReservasComponent } from './reservas/historial-reservas/historial-reservas';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'inicio-sesion',
    pathMatch: 'full'
  },
  {
    path: 'inicio-sesion',
    component: InicioSesion
  },
  {
    path: 'bienvenida',
    component: Bienvenida
  },
  {
    path: 'horarios/gestion',
    component: GestionHorariosComponent
  },
  {
    path: 'horarios/calendario',
    component: CalendarioSemanalComponent
  },
  {
    path: 'reservas/docente',
    component: SolicitudDocenteComponent
  },
  {
    path: 'reservas/estudiante',
    component: ReservaEstudianteComponent
  },
  {
    path: 'reservas/admin',
    component: AprobacionAdminComponent
  },
  {
    path: 'reservas/historial',
    component: HistorialReservasComponent
  },
  {
    path: '**',
    redirectTo: 'inicio-sesion'
  }
];