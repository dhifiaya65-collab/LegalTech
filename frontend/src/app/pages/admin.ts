import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../core/api.service';
import { Utilisateur } from '../core/models';

@Component({
  selector: 'app-admin',
  imports: [],
  template: `
    <h1>Administration</h1>
    <div class="tabs">
      <button [class.on]="onglet() === 'profils'" (click)="changer('profils')">Profils à valider</button>
      <button [class.on]="onglet() === 'tous'" (click)="changer('tous')">Tous les utilisateurs</button>
    </div>
    @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
    @if (liste().length === 0) { <p class="muted">Aucun élément.</p> }
    <table>
      <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Détails</th><th>Statut</th><th>Actions</th></tr></thead>
      <tbody>
        @for (u of liste(); track u._id) {
          <tr>
            <td>{{ u.prenom }} {{ u.nom }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.role === 'professionnel' ? u.typeProfessionnel : u.role }}</td>
            <td>@if (u.role === 'professionnel') { N° {{ u.numeroProfessionnel }} — {{ u.ville }} }</td>
            <td>
              @if (u.role === 'professionnel') { <span class="badge {{ u.statutVerification }}">{{ (u.statutVerification || '').replace('_', ' ') }}</span> }
              <span class="badge" [class.valide]="u.actif" [class.refuse]="!u.actif">{{ u.actif ? 'actif' : 'désactivé' }}</span>
            </td>
            <td class="row">
              @if (u.role === 'professionnel') {
                <button class="btn ok" (click)="verifier(u, 'valide')">Valider</button>
                <button class="btn ko" (click)="verifier(u, 'refuse')">Refuser</button>
              }
              @if (u.role !== 'admin') {
                <button class="btn or" (click)="basculer(u)">{{ u.actif ? 'Désactiver' : 'Activer' }}</button>
              }
            </td>
          </tr>
        }
      </tbody>
    </table>
  `
})
export class Admin {
  private api = inject(ApiService);
  onglet = signal<'profils' | 'tous'>('profils');
  liste = signal<Utilisateur[]>([]);
  erreur = signal('');

  constructor() { this.charger(); }

  changer(o: 'profils' | 'tous') { this.onglet.set(o); this.charger(); }
  charger() {
    const p: Record<string, string> = this.onglet() === 'profils' ? { role: 'professionnel', statut: 'en_attente' } : {};
    this.api.utilisateurs(p).subscribe((l) => this.liste.set(l));
  }
  verifier(u: Utilisateur, s: 'valide' | 'refuse') {
    this.api.verifier(u._id, s).subscribe({ next: () => this.charger(), error: (e) => this.erreur.set(e.error?.message || 'Erreur') });
  }
  basculer(u: Utilisateur) {
    this.api.activer(u._id, !u.actif).subscribe({ next: () => this.charger(), error: (e) => this.erreur.set(e.error?.message || 'Erreur') });
  }
}
