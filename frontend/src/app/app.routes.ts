import { Routes } from '@angular/router';
import { InicioSesion } from './componentes/inicio-sesion/inicio-sesion';
import { Bienvenida } from './componentes/bienvenida/bienvenida';

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
    path: '**',
    redirectTo: 'inicio-sesion'
  }
];
