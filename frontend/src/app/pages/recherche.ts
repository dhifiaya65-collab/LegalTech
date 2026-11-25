import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Utilisateur } from '../core/models';
import { GOUVERNORATS } from '../core/constants';

@Component({
  selector: 'app-recherche',
  imports: [FormsModule, RouterLink],
  template: `
    <h1>Trouvez un avocat ou un notaire en Tunisie</h1>
    <p class="muted">Profils vérifiés, recherche par gouvernorat et spécialité, rendez-vous en ligne.</p>

    <form class="card row" (ngSubmit)="rechercher()">
      <label>Gouvernorat
        <select name="gouvernorat" [(ngModel)]="f.gouvernorat">
          <option value="">Tous</option>
          @for (g of gouvernorats; track g) { <option>{{ g }}</option> }
        </select>
      </label>
      <label>Ville <input name="ville" [(ngModel)]="f.ville" placeholder="ex : Gafsa" /></label>
      <label>Type
        <select name="type" [(ngModel)]="f.type">
          <option value="">Tous</option><option value="avocat">Avocat</option><option value="notaire">Notaire</option>
        </select>
      </label>
      <label>Spécialité <input name="specialite" [(ngModel)]="f.specialite" placeholder="ex : famille" /></label>
      <label>Nom <input name="q" [(ngModel)]="f.q" /></label>
      <button class="btn" type="submit">Rechercher</button>
    </form>

    @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
    @if (chargement()) { <p class="muted">Chargement…</p> }
    @else if (resultats().length === 0) { <p class="muted">Aucun professionnel trouvé.</p> }

    <div class="grid">
      @for (p of resultats(); track p._id) {
        <div class="card">
          <h3>{{ p.typeProfessionnel === 'notaire' ? 'Me' : 'Maître' }} {{ p.prenom }} {{ p.nom }}</h3>
          <span class="badge valide">✔ Profil vérifié</span>
          <p class="muted">{{ p.typeProfessionnel }} — {{ p.ville }} ({{ p.gouvernorat }})</p>
          <div>@for (s of p.specialites; track s) { <span class="pillow">{{ s }}</span> }</div>
          <p>{{ p.description }}</p>
          <a class="btn" [routerLink]="['/professionnels', p._id]">Voir le profil</a>
        </div>
      }
    </div>
  `
})
export class Recherche {
  private api = inject(ApiService);
  gouvernorats = GOUVERNORATS;
  f = { gouvernorat: '', ville: '', type: '', specialite: '', q: '' };
  resultats = signal<Utilisateur[]>([]);
  chargement = signal(false);
  erreur = signal('');

  constructor() { this.rechercher(); }

  rechercher() {
    this.chargement.set(true);
    this.erreur.set('');
    this.api.chercher(this.f).subscribe({
      next: (r) => { this.resultats.set(r); this.chargement.set(false); },
      error: () => { this.erreur.set('Impossible de joindre le serveur (API démarrée ?)'); this.chargement.set(false); }
    });
  }
}
