import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Disponibilite, RendezVous } from '../core/models';

@Component({
  selector: 'app-espace-pro',
  imports: [FormsModule, DatePipe],
  template: `
    <h1>Tableau de bord professionnel</h1>
    @if (auth.user(); as u) {
      <p>
        Statut du profil :
        <span class="badge {{ u.statutVerification }}">{{ (u.statutVerification || '').replace('_', ' ') }}</span>
        @if (u.statutVerification !== 'valide') {
          <span class="muted"> — votre profil n'est pas encore visible du public.</span>
        }
      </p>
    }
    <div class="tabs">
      <button [class.on]="onglet() === 'demandes'" (click)="onglet.set('demandes')">Demandes de rendez-vous</button>
      <button [class.on]="onglet() === 'dispos'" (click)="onglet.set('dispos')">Mes disponibilités</button>
    </div>
    @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }

    @if (onglet() === 'demandes') {
      @if (rdvs().length === 0) { <p class="muted">Aucune demande pour le moment.</p> }
      @for (r of rdvs(); track r._id) {
        <div class="card row" style="align-items:center;justify-content:space-between">
          <div>
            <h3>{{ r.client.prenom }} {{ r.client.nom }} <span class="badge {{ r.statut }}">{{ r.statut.replace('_', ' ') }}</span></h3>
            <div>📅 {{ r.dateHeure | date: 'dd/MM/yyyy HH:mm' }} · {{ r.client.email }} @if (r.client.telephone) { · {{ r.client.telephone }} }</div>
            @if (r.motif) { <div class="muted">Motif : {{ r.motif }}</div> }
          </div>
          <div class="row">
            @if (r.statut === 'en_attente') {
              <button class="btn ok" (click)="agir(r, 'confirmer')">Confirmer</button>
              <button class="btn ko" (click)="agir(r, 'refuser')">Refuser</button>
            }
            @if (r.statut === 'confirme') { <button class="btn ko" (click)="agir(r, 'annuler')">Annuler</button> }
          </div>
        </div>
      }
    } @else {
      <form class="card row" (ngSubmit)="ajouter()">
        <label>Date <input type="date" name="date" [(ngModel)]="n.date" required /></label>
        <label>Début <input type="time" name="deb" [(ngModel)]="n.heureDebut" required /></label>
        <label>Fin <input type="time" name="fin" [(ngModel)]="n.heureFin" required /></label>
        <button class="btn" type="submit">Ajouter le créneau</button>
      </form>
      <table>
        <thead><tr><th>Date</th><th>Horaire</th><th>État</th><th></th></tr></thead>
        <tbody>
          @for (d of dispos(); track d._id) {
            <tr>
              <td>{{ d.date }}</td><td>{{ d.heureDebut }} – {{ d.heureFin }}</td>
              <td><span class="badge" [class.valide]="d.disponible" [class.en_attente]="!d.disponible">{{ d.disponible ? 'libre' : 'réservé' }}</span></td>
              <td>@if (d.disponible) { <button class="btn ko" (click)="supprimer(d)">Supprimer</button> }</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `
})
export class EspacePro {
  private api = inject(ApiService);
  auth = inject(AuthService);
  onglet = signal<'demandes' | 'dispos'>('demandes');
  rdvs = signal<RendezVous[]>([]);
  dispos = signal<Disponibilite[]>([]);
  erreur = signal('');
  n = { date: '', heureDebut: '09:00', heureFin: '10:00' };

  constructor() {
    this.chargerRdv(); this.chargerDispos();
    this.api.me().subscribe((u) => this.auth.user.set(u)); // statut de verification a jour
  }
  chargerRdv() { this.api.mesRdv().subscribe((r) => this.rdvs.set(r)); }
  chargerDispos() { this.api.mesDispos().subscribe((d) => this.dispos.set(d)); }

  agir(r: RendezVous, a: 'confirmer' | 'refuser' | 'annuler') {
    this.erreur.set('');
    this.api.actionRdv(r._id, a).subscribe({
      next: () => { this.chargerRdv(); this.chargerDispos(); },
      error: (e) => this.erreur.set(e.error?.message || 'Erreur')
    });
  }
  ajouter() {
    this.erreur.set('');
    this.api.ajouterDispo(this.n).subscribe({
      next: () => this.chargerDispos(),
      error: (e) => this.erreur.set(e.error?.message || 'Erreur')
    });
  }
  supprimer(d: Disponibilite) {
    this.api.supprimerDispo(d._id).subscribe({
      next: () => this.chargerDispos(),
      error: (e) => this.erreur.set(e.error?.message || 'Erreur')
    });
  }
}
