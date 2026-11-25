import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width:420px;margin:auto">
      <h1>Mot de passe oublié</h1>
      <p class="muted">Entrez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
      <form (ngSubmit)="envoyer()">
        <label>Email <input name="email" type="email" [(ngModel)]="email" required /></label>
        @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
        <p><button class="btn" type="submit" [disabled]="envoi()">Envoyer le lien</button></p>
      </form>
      @if (message()) { <div class="succes">{{ message() }}</div> }
      @if (devLink()) {
        <div class="card">
          <b>Mode développement (pas de SMTP configuré)</b>
          <p class="muted">Le lien est aussi affiché dans la console du backend.</p>
          <a class="btn or" [href]="devLink()">Ouvrir le lien de réinitialisation</a>
        </div>
      }
      <p class="muted"><a routerLink="/login">Retour à la connexion</a></p>
    </div>
  `
})
export class MotDePasseOublie {
  private api = inject(ApiService);
  email = '';
  envoi = signal(false);
  message = signal('');
  erreur = signal('');
  devLink = signal<string | undefined>(undefined);

  envoyer() {
    this.envoi.set(true); this.erreur.set(''); this.message.set(''); this.devLink.set(undefined);
    this.api.motDePasseOublie(this.email).subscribe({
      next: (r) => { this.message.set(r.message); this.devLink.set(r.devLink); this.envoi.set(false); },
      error: (e) => { this.erreur.set(e.error?.message || 'Erreur'); this.envoi.set(false); }
    });
  }
}
