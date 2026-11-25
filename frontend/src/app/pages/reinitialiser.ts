import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-reinitialiser',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="card" style="max-width:420px;margin:auto">
      <h1>Nouveau mot de passe</h1>
      @if (succes()) {
        <div class="succes">{{ succes() }}</div>
        <a class="btn" routerLink="/login">Se connecter</a>
      } @else {
        <form (ngSubmit)="valider()">
          <label>Nouveau mot de passe (6 caractères min.) <input name="mdp" type="password" [(ngModel)]="mdp" required minlength="6" /></label><br />
          <label>Confirmer <input name="mdp2" type="password" [(ngModel)]="mdp2" required /></label>
          @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
          <p><button class="btn" type="submit">Enregistrer</button></p>
        </form>
      }
    </div>
  `
})
export class Reinitialiser {
  private api = inject(ApiService);
  private token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') || '';
  mdp = ''; mdp2 = '';
  succes = signal('');
  erreur = signal('');

  valider() {
    this.erreur.set('');
    if (this.mdp.length < 6) return this.erreur.set('6 caractères minimum');
    if (this.mdp !== this.mdp2) return this.erreur.set('Les mots de passe ne correspondent pas');
    this.api.reinitialiser(this.token, this.mdp).subscribe({
      next: (r) => this.succes.set(r.message),
      error: (e) => this.erreur.set(e.error?.message || 'Lien invalide ou expiré')
    });
  }
}
