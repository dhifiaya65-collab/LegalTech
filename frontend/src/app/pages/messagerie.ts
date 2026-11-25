import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Conversation, Message, Utilisateur } from '../core/models';

@Component({
  selector: 'app-messagerie',
  imports: [FormsModule, DatePipe],
  styles: [`
    .chat { display:grid; grid-template-columns:300px 1fr; gap:14px; min-height:480px; }
    @media (max-width:700px) { .chat { grid-template-columns:1fr; } }
    .liste { background:#fff; border-radius:10px; overflow:auto; max-height:560px; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .conv { padding:12px; border-bottom:1px solid #eef0f3; cursor:pointer; }
    .conv:hover, .conv.on { background:#eef2f7; }
    .conv small { display:block; color:#6b7280; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .pastille { background:#c9a227; color:#222; border-radius:20px; padding:1px 8px; font-size:.75rem; margin-left:6px; }
    .fenetre { background:#fff; border-radius:10px; display:flex; flex-direction:column; box-shadow:0 1px 4px rgba(0,0,0,.08); height:560px; }
    .entete { padding:12px 16px; border-bottom:1px solid #eef0f3; font-weight:600; color:#1e3a5f; }
    .fil { flex:1; overflow:auto; padding:14px; display:flex; flex-direction:column; gap:8px; background:#f8fafc; }
    .bulle { max-width:75%; padding:8px 12px; border-radius:12px; background:#e5e7eb; align-self:flex-start; white-space:pre-wrap; word-break:break-word; }
    .bulle.moi { background:#1e3a5f; color:#fff; align-self:flex-end; }
    .bulle small { display:block; opacity:.7; font-size:.7rem; margin-top:3px; }
    .saisie { display:flex; gap:8px; padding:10px; border-top:1px solid #eef0f3; }
    .saisie input { flex:1; }
  `],
  template: `
    <h1>Messagerie</h1>
    <p class="muted">Conversations entre clients et professionnels. Ne partagez pas d'informations sensibles inutilement.</p>
    @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
    <div class="chat">
      <div class="liste">
        @if (convs().length === 0) { <p class="muted" style="padding:12px">Aucune conversation. Ouvrez un profil et cliquez sur « Envoyer un message ».</p> }
        @for (c of convs(); track c._id) {
          <div class="conv" [class.on]="actif()?._id === c._id" (click)="choisir(c)">
            <b>{{ autre(c).prenom }} {{ autre(c).nom }}</b>
            @if (c.nonLus > 0) { <span class="pastille">{{ c.nonLus }}</span> }
            <small>{{ c.dernierMessage || 'Nouvelle conversation' }}</small>
          </div>
        }
      </div>

      <div class="fenetre">
        @if (actif(); as c) {
          <div class="entete">{{ autre(c).prenom }} {{ autre(c).nom }}
            @if (autre(c).typeProfessionnel) { <span class="badge">{{ autre(c).typeProfessionnel }}</span> }
          </div>
          <div class="fil" id="fil">
            @for (m of msgs(); track m._id) {
              <div class="bulle" [class.moi]="m.expediteur === auth.user()?._id">
                {{ m.contenu }}<small>{{ m.dateEnvoi | date: 'dd/MM HH:mm' }}</small>
              </div>
            }
            @if (msgs().length === 0) { <p class="muted">Écrivez le premier message.</p> }
          </div>
          <form class="saisie" (ngSubmit)="envoyer()">
            <input name="t" [(ngModel)]="texte" placeholder="Votre message…" maxlength="2000" autocomplete="off" />
            <button class="btn" type="submit" [disabled]="!texte.trim()">Envoyer</button>
          </form>
        } @else {
          <p class="muted" style="padding:20px">Sélectionnez une conversation.</p>
        }
      </div>
    </div>
  `
})
export class Messagerie {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  convs = signal<Conversation[]>([]);
  actif = signal<Conversation | null>(null);
  msgs = signal<Message[]>([]);
  erreur = signal('');
  texte = '';
  private convDemandee = this.route.snapshot.queryParamMap.get('conv');

  constructor() {
    this.chargerConvs(true);
    // Actualisation automatique toutes les 5 s (polling)
    const timer = setInterval(() => { this.chargerConvs(false); if (this.actif()) this.chargerMsgs(); }, 5000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  autre(c: Conversation): Utilisateur {
    return this.auth.user()?.role === 'client' ? c.professionnel : c.client;
  }

  chargerConvs(initial: boolean) {
    this.api.conversations().subscribe({
      next: (l) => {
        this.convs.set(l);
        if (initial) {
          const c = l.find((x) => x._id === this.convDemandee) ?? null;
          if (c) this.choisir(c);
        }
      },
      error: (e) => this.erreur.set(e.error?.message || 'Erreur de chargement')
    });
  }

  choisir(c: Conversation) { this.actif.set(c); this.chargerMsgs(true); }

  chargerMsgs(defiler = false) {
    const c = this.actif();
    if (!c) return;
    this.api.messages(c._id).subscribe((m) => {
      const change = m.length !== this.msgs().length;
      this.msgs.set(m);
      if (defiler || change) setTimeout(() => { const el = document.getElementById('fil'); if (el) el.scrollTop = el.scrollHeight; });
    });
  }

  envoyer() {
    const c = this.actif(); const t = this.texte.trim();
    if (!c || !t) return;
    this.api.envoyerMessage(c._id, t).subscribe({
      next: () => { this.texte = ''; this.chargerMsgs(true); this.chargerConvs(false); },
      error: (e) => this.erreur.set(e.error?.message || 'Envoi impossible')
    });
  }
}
