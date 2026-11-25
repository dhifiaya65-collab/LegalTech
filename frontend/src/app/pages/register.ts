import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { GOUVERNORATS } from '../core/constants';

@Component({
  selector: 'app-register',
  imports: [FormsModule],
  template: `
    <div class="card" style="max-width:640px;margin:auto">
      <h1>Créer un compte</h1>
      <div class="tabs">
        <button type="button" [class.on]="d.role === 'client'" (click)="d.role = 'client'">Je suis un client</button>
        <button type="button" [class.on]="d.role === 'professionnel'" (click)="d.role = 'professionnel'">Je suis avocat / notaire</button>
      </div>
      @if (succes()) {
        <div class="succes">{{ succes() }}</div>
        @if (devLink()) {
          <div class="card">
            <b>Mode développement (pas de SMTP configuré)</b>
            <p class="muted">Le lien de vérification est aussi affiché dans la console du backend.</p>
            <a class="btn or" [href]="devLink()">Vérifier mon email maintenant</a>
          </div>
        }
      } @else {
      <form (ngSubmit)="valider()">
        <div class="row">
          <label>Nom <input name="nom" [(ngModel)]="d.nom" required /></label>
          <label>Prénom <input name="prenom" [(ngModel)]="d.prenom" required /></label>
        </div>
        <div class="row">
          <label>Email <input name="email" type="email" [(ngModel)]="d.email" required /></label>
          <label>Téléphone <input name="tel" [(ngModel)]="d.telephone" /></label>
        </div>
        <label>Mot de passe (6 caractères min.) <input name="mdp" type="password" [(ngModel)]="d.motDePasse" required minlength="6" /></label>

        @if (d.role === 'professionnel') {
          <h3 style="margin-top:16px">Informations professionnelles</h3>
          <div class="row">
            <label>Profession
              <select name="type" [(ngModel)]="d.typeProfessionnel">
                <option value="avocat">Avocat</option><option value="notaire">Notaire</option>
              </select>
            </label>
            <label>N° professionnel <input name="num" [(ngModel)]="d.numeroProfessionnel" required /></label>
          </div>
          <div class="row">
            <label>Gouvernorat
              <select name="gouv" [(ngModel)]="d.gouvernorat" required>
                <option value="" disabled>Choisir…</option>
                @for (g of gouvernorats; track g) { <option>{{ g }}</option> }
              </select>
            </label>
            <label>Ville <input name="ville" [(ngModel)]="d.ville" required /></label>
          </div>
          <label>Adresse du cabinet <input name="adr" [(ngModel)]="d.adresse" /></label>
          <label>Spécialités (séparées par des virgules) <input name="spec" [(ngModel)]="specialitesTexte" placeholder="Droit de la famille, Droit civil" /></label>
          <label>Présentation <textarea name="desc" rows="3" [(ngModel)]="d.description"></textarea></label>
          <p class="muted">Votre profil sera visible après validation par l'administrateur.</p>
        }
        @if (erreur()) { <div class="erreur">{{ erreur() }}</div> }
        <p><button class="btn" type="submit">Créer mon compte</button></p>
      </form>
      }
    </div>
  `
})
export class Register {
  private auth = inject(AuthService);
  gouvernorats = GOUVERNORATS;
  specialitesTexte = '';
  erreur = signal('');
  succes = signal('');
  devLink = signal<string | undefined>(undefined);
  d: any = {
    role: 'client', nom: '', prenom: '', email: '', telephone: '', motDePasse: '',
    typeProfessionnel: 'avocat', numeroProfessionnel: '', gouvernorat: '', ville: '', adresse: '', description: ''
  };

  valider() {
    this.erreur.set('');
    const data = { ...this.d, specialites: this.specialitesTexte.split(',').map((s) => s.trim()).filter(Boolean) };
    this.auth.register(data).subscribe({
      next: (r) => { this.succes.set(r.message); this.devLink.set(r.devLink); },
      error: (e) => this.erreur.set(e.error?.message || 'Inscription impossible')
    });
  }
}
