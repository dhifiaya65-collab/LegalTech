import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width:420px;margin:auto">
      <h1>Connexion</h1>
      <form (ngSubmit)="valider()">
        <label>Email <input name="email" type="email" [(ngModel)]="email" required /></label><br />
        <label>Mot de passe <input name="mdp" type="password" [(ngModel)]="mdp" required /></label>
        @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
        @if (nonVerifie()) {
          <p><button class="btn or" type="button" (click)="renvoyer()">Renvoyer l'email de vérification</button></p>
        }
        @if (info()) { <div class="succes">{{ info() }}</div> }
        @if (devLink()) { <p><a class="btn or" [href]="devLink()">Vérifier mon email (mode dev)</a></p> }
        <p><button class="btn" type="submit">Se connecter</button></p>
      </form>
      <p class="muted"><a routerLink="/mot-de-passe-oublie">Mot de passe oublié ?</a></p>
      <p class="muted">Pas de compte ? <a routerLink="/register">Créer un compte</a></p>
    </div>
  `
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private api = inject(ApiService);
  email = ''; mdp = '';
  erreur = signal('');
  info = signal('');
  nonVerifie = signal(false);
  devLink = signal<string | undefined>(undefined);

  valider() {
    this.erreur.set(''); this.info.set(''); this.nonVerifie.set(false); this.devLink.set(undefined);
    this.auth.login(this.email, this.mdp).subscribe({
      next: () => this.router.navigate([this.auth.accueilPourRole()]),
      error: (e) => {
        this.erreur.set(e.error?.message || 'Connexion impossible');
        this.nonVerifie.set(e.error?.code === 'EMAIL_NON_VERIFIE');
      }
    });
  }

  renvoyer() {
    this.api.renvoyerVerification(this.email).subscribe((r) => { this.info.set(r.message); this.devLink.set(r.devLink); });
  }
}
