export type Role = 'client' | 'professionnel' | 'admin';

export interface Utilisateur {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: Role;
  actif: boolean;
  typeProfessionnel?: 'avocat' | 'notaire';
  numeroProfessionnel?: string;
  adresse?: string;
  ville?: string;
  gouvernorat?: string;
  description?: string;
  specialites?: string[];
  statutVerification?: 'en_attente' | 'valide' | 'refuse';
}

export interface Disponibilite {
  _id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  disponible: boolean;
}

export interface RendezVous {
  _id: string;
  client: Utilisateur;
  professionnel: Utilisateur;
  disponibilite: Disponibilite;
  dateHeure: string;
  motif?: string;
  statut: 'en_attente' | 'confirme' | 'refuse' | 'annule';
}

export interface Notification {
  _id: string;
  message: string;
  type: string;
  lu: boolean;
  dateEnvoi: string;
}

export interface Conversation {
  _id: string;
  client: Utilisateur;
  professionnel: Utilisateur;
  dernierMessage?: string;
  dernierMessageDate?: string;
  nonLus: number;
}

export interface Message {
  _id: string;
  expediteur: string;
  contenu: string;
  dateEnvoi: string;
  lu: boolean;
}
