import { Routes } from '@angular/router';
import { roleGuard } from './core/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/recherche').then((m) => m.Recherche) },
  { path: 'professionnels/:id', loadComponent: () => import('./pages/professionnel-detail').then((m) => m.ProfessionnelDetail) },
  { path: 'login', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  { path: 'register', loadComponent: () => import('./pages/register').then((m) => m.Register) },
  { path: 'verifier-email', loadComponent: () => import('./pages/verifier-email').then((m) => m.VerifierEmail) },
  { path: 'mot-de-passe-oublie', loadComponent: () => import('./pages/mot-de-passe-oublie').then((m) => m.MotDePasseOublie) },
  { path: 'reinitialiser-mot-de-passe', loadComponent: () => import('./pages/reinitialiser').then((m) => m.Reinitialiser) },
  {
    path: 'messagerie',
    canActivate: [roleGuard('client', 'professionnel')],
    loadComponent: () => import('./pages/messagerie').then((m) => m.Messagerie)
  },
  {
    path: 'mes-rendez-vous',
    canActivate: [roleGuard('client')],
    loadComponent: () => import('./pages/mes-rendez-vous').then((m) => m.MesRendezVous)
  },
  {
    path: 'espace-pro',
    canActivate: [roleGuard('professionnel')],
    loadComponent: () => import('./pages/espace-pro').then((m) => m.EspacePro)
  },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./pages/admin').then((m) => m.Admin)
  },
  {
    path: 'notifications',
    canActivate: [roleGuard('client', 'professionnel', 'admin')],
    loadComponent: () => import('./pages/notifications').then((m) => m.Notifications)
  },
  { path: '**', redirectTo: '' }
];
