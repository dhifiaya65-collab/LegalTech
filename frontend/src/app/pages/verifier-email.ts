import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';

@Component({
  selector: 'app-verifier-email',
  imports: [RouterLink],
  template: `
    <div class="card" style="max-width:480px;margin:auto">
      <h1>Vérification de l'email</h1>
      @if (chargement()) { <p class="muted">Vérification en cours…</p> }
      @if (succes()) { <div class="succes">{{ succes() }}</div><a class="btn" routerLink="/login">Se connecter</a> }
      @if (erreur()) { <div class="erreur">{{ erreur() }}</div><a routerLink="/login">Retour à la connexion</a> }
    </div>
  `
})
export class VerifierEmail {
  private api = inject(ApiService);
  chargement = signal(true);
  succes = signal('');
  erreur = signal('');

  constructor() {
    const token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') || '';
    this.api.verifierEmail(token).subscribe({
      next: (r) => { this.succes.set(r.message); this.chargement.set(false); },
      error: (e) => { this.erreur.set(e.error?.message || 'Lien invalide'); this.chargement.set(false); }
    });
  }
}
