import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Conversation, Disponibilite, Message, Notification, RendezVous, Utilisateur } from './models';

// URL de l'API Node/Express (voir backend/.env -> PORT)
export const API_URL = 'http://localhost:3000/api';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // --- Auth ---
  register(data: any) { return this.http.post<{ message: string; devLink?: string }>(`${API_URL}/auth/register`, data); }
  verifierEmail(token: string) { return this.http.post<{ message: string }>(`${API_URL}/auth/verify-email`, { token }); }
  renvoyerVerification(email: string) {
    return this.http.post<{ message: string; devLink?: string }>(`${API_URL}/auth/resend-verification`, { email });
  }
  motDePasseOublie(email: string) {
    return this.http.post<{ message: string; devLink?: string }>(`${API_URL}/auth/forgot-password`, { email });
  }
  reinitialiser(token: string, motDePasse: string) {
    return this.http.post<{ message: string }>(`${API_URL}/auth/reset-password`, { token, motDePasse });
  }
  login(email: string, motDePasse: string) {
    return this.http.post<{ token: string; user: Utilisateur }>(`${API_URL}/auth/login`, { email, motDePasse });
  }
  me() { return this.http.get<Utilisateur>(`${API_URL}/auth/me`); }

  // --- Professionnels (public) ---
  chercher(filtres: Record<string, string>) {
    let params = new HttpParams();
    Object.entries(filtres).forEach(([k, v]) => { if (v) params = params.set(k, v); });
    return this.http.get<Utilisateur[]>(`${API_URL}/professionnels`, { params });
  }
  professionnel(id: string) { return this.http.get<Utilisateur>(`${API_URL}/professionnels/${id}`); }
  creneauxDe(id: string) { return this.http.get<Disponibilite[]>(`${API_URL}/professionnels/${id}/disponibilites`); }

  // --- Disponibilites (professionnel) ---
  mesDispos() { return this.http.get<Disponibilite[]>(`${API_URL}/disponibilites`); }
  ajouterDispo(d: { date: string; heureDebut: string; heureFin: string }) {
    return this.http.post<Disponibilite>(`${API_URL}/disponibilites`, d);
  }
  supprimerDispo(id: string) { return this.http.delete(`${API_URL}/disponibilites/${id}`); }

  // --- Rendez-vous ---
  demanderRdv(disponibiliteId: string, motif: string) {
    return this.http.post<RendezVous>(`${API_URL}/rendez-vous`, { disponibiliteId, motif });
  }
  mesRdv() { return this.http.get<RendezVous[]>(`${API_URL}/rendez-vous`); }
  actionRdv(id: string, action: 'confirmer' | 'refuser' | 'annuler') {
    return this.http.patch<RendezVous>(`${API_URL}/rendez-vous/${id}/${action}`, {});
  }

  // --- Messagerie ---
  conversations() { return this.http.get<Conversation[]>(`${API_URL}/conversations`); }
  ouvrirConversation(professionnelId: string) {
    return this.http.post<Conversation>(`${API_URL}/conversations`, { professionnelId });
  }
  messages(convId: string) { return this.http.get<Message[]>(`${API_URL}/conversations/${convId}/messages`); }
  envoyerMessage(convId: string, contenu: string) {
    return this.http.post<Message>(`${API_URL}/conversations/${convId}/messages`, { contenu });
  }

  // --- Notifications ---
  notifications() { return this.http.get<Notification[]>(`${API_URL}/notifications`); }
  lireTout() { return this.http.patch(`${API_URL}/notifications/lire-tout`, {}); }

  // --- Admin ---
  utilisateurs(params: Record<string, string> = {}) {
    return this.http.get<Utilisateur[]>(`${API_URL}/admin/utilisateurs`, { params });
  }
  activer(id: string, actif: boolean) {
    return this.http.patch<Utilisateur>(`${API_URL}/admin/utilisateurs/${id}/activation`, { actif });
  }
  verifier(id: string, statut: 'valide' | 'refuse') {
    return this.http.patch<Utilisateur>(`${API_URL}/admin/professionnels/${id}/verification`, { statut });
  }
}
