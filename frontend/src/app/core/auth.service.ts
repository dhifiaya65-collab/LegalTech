import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from './api.service';
import { Utilisateur } from './models';

const TOKEN_KEY = 'legaltech_token';
const USER_KEY = 'legaltech_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  readonly user = signal<Utilisateur | null>(this.lireUser());
  readonly connecte = computed(() => !!this.user());

  get token(): string | null { return localStorage.getItem(TOKEN_KEY); }

  private lireUser(): Utilisateur | null {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
  }

  private ouvrirSession = (r: { token: string; user: Utilisateur }) => {
    localStorage.setItem(TOKEN_KEY, r.token);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    this.user.set(r.user);
  };

  login(email: string, mdp: string) { return this.api.login(email, mdp).pipe(tap(this.ouvrirSession)); }
  register(data: any) { return this.api.register(data); }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
    this.router.navigate(['/']);
  }

  accueilPourRole(): string {
    const r = this.user()?.role;
    return r === 'admin' ? '/admin' : r === 'professionnel' ? '/espace-pro' : '/mes-rendez-vous';
  }
}
