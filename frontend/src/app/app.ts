import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="nav">
      <a class="brand" routerLink="/">⚖️ LegalTech <span>Tunisie</span></a>
      <nav>
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Rechercher</a>
        @if (auth.user(); as u) {
          <a [routerLink]="auth.accueilPourRole()" routerLinkActive="on">
            {{ u.role === 'client' ? 'Mes rendez-vous' : u.role === 'professionnel' ? 'Mon espace' : 'Administration' }}
          </a>
          @if (u.role !== 'admin') { <a routerLink="/messagerie" routerLinkActive="on">Messages</a> }
          <a routerLink="/notifications" routerLinkActive="on">Notifications</a>
          <span class="who">{{ u.prenom }} {{ u.nom }}</span>
          <button class="btn ghost" (click)="auth.logout()">Déconnexion</button>
        } @else {
          <a routerLink="/login" routerLinkActive="on">Connexion</a>
          <a class="btn" routerLink="/register">Créer un compte</a>
        }
      </nav>
    </header>
    <main class="container"><router-outlet /></main>
    <footer class="foot">© LegalTech Marketplace — PFE</footer>
  `
})
export class App {
  auth = inject(AuthService);
}
