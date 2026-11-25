import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Disponibilite, Utilisateur } from '../core/models';

@Component({
  selector: 'app-professionnel-detail',
  imports: [FormsModule, RouterLink],
  template: `
    @if (pro(); as p) {
      <div class="card">
        <h1>{{ p.prenom }} {{ p.nom }}</h1>
        <span class="badge valide">✔ Profil vérifié</span> <span class="badge">{{ p.typeProfessionnel }}</span>
        <p>📍 {{ p.adresse }} {{ p.ville }} ({{ p.gouvernorat }}) @if (p.telephone) { — 📞 {{ p.telephone }} }</p>
        <div>@for (s of p.specialites; track s) { <span class="pillow">{{ s }}</span> }</div>
        <p>{{ p.description }}</p>
        @if (auth.user()?.role === 'client') {
          <button class="btn or" (click)="ecrire()">💬 Envoyer un message</button>
        } @else if (!auth.user()) {
          <a class="btn or" routerLink="/login">💬 Connectez-vous pour écrire à ce professionnel</a>
        }
      </div>

      <div class="card">
        <h2>Créneaux disponibles</h2>
        @if (creneaux().length === 0) { <p class="muted">Aucun créneau disponible pour le moment.</p> }
        @else {
          <div class="slots">
            @for (c of creneaux(); track c._id) {
              <button class="slot" [class.sel]="choix()?._id === c._id" (click)="choix.set(c)">
                {{ c.date }} · {{ c.heureDebut }}–{{ c.heureFin }}
              </button>
            }
          </div>
        }

        @if (choix()) {
          <hr />
          @if (!auth.user()) {
            <p>Vous devez être connecté pour demander un rendez-vous.</p>
            <a class="btn" routerLink="/login">Se connecter</a>
          } @else if (auth.user()?.role !== 'client') {
            <p class="muted">Seuls les clients peuvent demander un rendez-vous.</p>
          } @else {
            <label>Motif du rendez-vous <textarea rows="3" [(ngModel)]="motif"></textarea></label>
            <p><button class="btn ok" (click)="confirmer()" [disabled]="envoi()">Confirmer la demande</button></p>
          }
        }
        @if (message()) { <div class="succes">{{ message() }}</div> }
        @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
      </div>
    } @else if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
    @else { <p class="muted">Chargement…</p> }
  `
})
export class ProfessionnelDetail {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  auth = inject(AuthService);

  id = this.route.snapshot.paramMap.get('id')!;
  pro = signal<Utilisateur | null>(null);
  creneaux = signal<Disponibilite[]>([]);
  choix = signal<Disponibilite | null>(null);
  motif = '';
  envoi = signal(false);
  message = signal('');
  erreur = signal('');

  constructor() {
    this.api.professionnel(this.id).subscribe({
      next: (p) => this.pro.set(p),
      error: (e) => this.erreur.set(e.error?.message || 'Professionnel introuvable')
    });
    this.charger();
  }

  ecrire() {
    this.api.ouvrirConversation(this.id).subscribe({
      next: (c) => this.router.navigate(['/messagerie'], { queryParams: { conv: c._id } }),
      error: (e) => this.erreur.set(e.error?.message || 'Impossible d\'ouvrir la conversation')
    });
  }

  charger() { this.api.creneauxDe(this.id).subscribe((c) => this.creneaux.set(c)); }

  confirmer() {
    const c = this.choix();
    if (!c) return;
    this.envoi.set(true); this.erreur.set(''); this.message.set('');
    this.api.demanderRdv(c._id, this.motif).subscribe({
      next: () => { this.envoi.set(false); this.router.navigate(['/mes-rendez-vous']); },
      error: (e) => {
        this.envoi.set(false);
        this.erreur.set(e.error?.message || 'Erreur lors de la réservation'); // 400 / 401 / 409
        if (e.status === 409) { this.choix.set(null); this.charger(); } // "Choisir un autre creneau"
      }
    });
  }
}
