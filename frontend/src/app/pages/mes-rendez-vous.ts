import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { RendezVous } from '../core/models';

@Component({
  selector: 'app-mes-rendez-vous',
  imports: [DatePipe, RouterLink],
  template: `
    <h1>Mes rendez-vous</h1>
    @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
    @if (liste().length === 0) {
      <p class="muted">Aucun rendez-vous. <a routerLink="/">Rechercher un professionnel</a></p>
    }
    @for (r of liste(); track r._id) {
      <div class="card row" style="align-items:center;justify-content:space-between">
        <div>
          <h3>{{ r.professionnel.prenom }} {{ r.professionnel.nom }} <span class="badge {{ r.statut }}">{{ r.statut.replace('_', ' ') }}</span></h3>
          <div>📅 {{ r.dateHeure | date: 'dd/MM/yyyy HH:mm' }} — 📍 {{ r.professionnel.ville }}</div>
          @if (r.motif) { <div class="muted">Motif : {{ r.motif }}</div> }
        </div>
        @if (r.statut === 'en_attente' || r.statut === 'confirme') {
          <button class="btn ko" (click)="annuler(r)">Annuler</button>
        }
      </div>
    }
  `
})
export class MesRendezVous {
  private api = inject(ApiService);
  liste = signal<RendezVous[]>([]);
  erreur = signal('');

  constructor() { this.charger(); }
  charger() { this.api.mesRdv().subscribe((r) => this.liste.set(r)); }

  annuler(r: RendezVous) {
    if (!confirm('Annuler ce rendez-vous ?')) return;
    this.api.actionRdv(r._id, 'annuler').subscribe({
      next: () => this.charger(),
      error: (e) => this.erreur.set(e.error?.message || 'Erreur')
    });
  }
}
