# LegalTech Marketplace — MEAN (MongoDB · Express · Angular · Node.js)

Plateforme de mise en relation avec les avocats et notaires en Tunisie (PFE).
Basée sur le BMC et les diagrammes (cas d'utilisation, classes, séquence).

```
legaltech-mean/
├── backend/    API REST Node.js + Express + Mongoose (port 3000)
└── frontend/   Angular 22 (port 4200)
```

## 0. Prérequis
- Node.js 20+ (`node -v`)
- MongoDB Community Server + **MongoDB Compass** (https://www.mongodb.com/try/download/community)

## 1. Base de données avec MongoDB Compass (pas à pas)
1. Installer MongoDB Community Server (service démarré sur le port 27017) puis Compass.
2. Ouvrir **Compass** → URI : `mongodb://127.0.0.1:27017` → **Connect**.
3. Cliquer **+** (à côté de *Databases*) → *Database Name* : `legaltech`, *Collection Name* : `utilisateurs` → **Create Database**.
4. Sur la base `legaltech`, créer les 3 autres collections avec **Create collection** :
   `disponibilites`, `rendezvous`, `notifications`, `conversations`, `messages`.
   (Mongoose les crée aussi automatiquement, mais ici elles apparaissent tout de suite.)
5. Remplir avec des données de démo : dans un terminal, `cd backend && npm run seed`.
6. Dans Compass : cliquer **Refresh** (🔄) sur la liste des bases → `legaltech` → ouvrir chaque collection :
   - `utilisateurs` : 1 admin, 1 client, 4 professionnels (1 en attente)
   - `disponibilites` : créneaux des 5 prochains jours
7. Index (créés automatiquement au démarrage de l'API) : onglet **Indexes** de chaque collection.
8. Filtrer dans Compass, ex. dans `utilisateurs` : `{ "role": "professionnel", "statutVerification": "valide" }` → **Find**.
9. Modifier / supprimer un document : survoler la ligne → icône crayon / corbeille.

### Schéma des collections (diagramme de classes)
| Collection | Champs principaux |
|---|---|
| `utilisateurs` | nom, prenom, email (unique), motDePasseHash, telephone, role (`client`/`professionnel`/`admin`), actif · Professionnel : typeProfessionnel (`avocat`/`notaire`), numeroProfessionnel, adresse, ville, gouvernorat, description, specialites[], statutVerification (`en_attente`/`valide`/`refuse`) |
| `disponibilites` | professionnel → utilisateurs, date (YYYY-MM-DD), heureDebut, heureFin, disponible |
| `rendezvous` | client, professionnel, disponibilite (refs), dateHeure, motif, statut (`en_attente`/`confirme`/`refuse`/`annule`), dateCreation |
| `conversations` | client → utilisateurs, professionnel → utilisateurs, dernierMessage, dernierMessageDate (index unique client+professionnel) |
| `messages` | conversation → conversations, expediteur → utilisateurs, contenu (≤ 2000), lu, dateEnvoi |
| `notifications` | destinataire → utilisateurs, message, type, lu, dateEnvoi |

Avocat/Notaire/Client/Admin sont des sous-types de `Utilisateur` (héritage du diagramme de classes) stockés dans **une seule collection** distinguée par `role` + `typeProfessionnel`.

## 2. Backend (Node.js / Express)
```bash
cd backend
npm install
# le fichier .env est déjà fourni (copie de .env.example) — modifiez JWT_SECRET
npm run seed        # données de démo
npm run dev         # ou: npm start   →  http://localhost:3000/api/health
```

### Endpoints
| Méthode | Route | Accès |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | public |
| POST | `/api/auth/verify-email`, `/resend-verification` | public |
| POST | `/api/auth/forgot-password`, `/reset-password` | public |
| GET / POST | `/api/conversations`, `/:id/messages` | client / professionnel |
| GET / PUT | `/api/auth/me` | connecté |
| GET | `/api/professionnels?ville=&gouvernorat=&type=&specialite=&q=` | public |
| GET | `/api/professionnels/:id`, `/api/professionnels/:id/disponibilites` | public |
| GET / POST / DELETE | `/api/disponibilites` | professionnel |
| POST | `/api/rendez-vous` (400/401/**409** si créneau déjà réservé) | client |
| GET | `/api/rendez-vous` | client / professionnel |
| PATCH | `/api/rendez-vous/:id/confirmer` · `/refuser` | professionnel |
| PATCH | `/api/rendez-vous/:id/annuler` | client / professionnel |
| GET / PATCH | `/api/notifications`, `/:id/lu`, `/lire-tout` | connecté |
| GET | `/api/admin/utilisateurs?role=&statut=` | admin |
| PATCH | `/api/admin/utilisateurs/:id/activation`, `/api/admin/professionnels/:id/verification` | admin |

La réservation est **atomique** (`findOneAndUpdate` sur `disponible:true`) : deux clients ne peuvent pas prendre le même créneau (diagramme de séquence, branche 409).

### Vérification email, mot de passe oublié, messagerie
- **Inscription** → compte créé avec `emailVerifie:false` + email avec lien (24 h). Connexion refusée (403) tant que l'email n'est pas vérifié. Le profil des avocats/notaires doit en plus être validé par l'admin.
- **Mot de passe oublié** : page `/mot-de-passe-oublie` → lien valable 1 h → `/reinitialiser-mot-de-passe`. Les tokens sont stockés hachés (SHA-256), usage unique.
- **Emails** : sans `SMTP_HOST` dans `.env` (mode dev), les liens s'affichent dans la console du backend ET dans l'application. Pour de vrais emails, renseigner `SMTP_*` (ex. Gmail avec mot de passe d'application).
- **Messagerie** : le client clique « Envoyer un message » sur un profil ; page `/messagerie` (actualisation toutes les 5 s, messages non lus). Seul le client démarre la conversation, le professionnel répond.

## 3. Frontend (Angular)
```bash
cd frontend
npm install
npm start           # http://localhost:4200
```
L'URL de l'API est dans `frontend/src/app/core/api.service.ts` (`API_URL`).

## 4. Comptes de démo (mot de passe : `123456`)
| Rôle | Email |
|---|---|
| Admin | admin@legaltech.tn |
| Client | client@legaltech.tn |
| Avocate (Gafsa) | amel@legaltech.tn |
| Notaire (Sfax) | mounir@legaltech.tn |
| Avocate en attente | sonia@legaltech.tn (invisible tant que l'admin ne la valide pas) |

## 5. Scénario de test
1. Visiteur : page d'accueil → filtrer `Gafsa` → ouvrir le profil de Me Amel Trabelsi.
2. Se connecter en client → choisir un créneau → *Confirmer la demande* → *Mes rendez-vous*.
3. Se connecter en `amel@legaltech.tn` → *Demandes* → Confirmer/Refuser ; ajouter des créneaux.
4. Se connecter en admin → valider le profil de Sonia → elle apparaît dans la recherche.
5. Dans Compass, observer les changements dans `rendezvous`, `disponibilites`, `notifications`.

## Notes
- SSR : le BMC prévoit Angular SSR pour le SEO ; pour garder le projet simple, il est livré en SPA. Pour l'activer : `ng add @angular/ssr`.
- Revenus (abonnements premium) : non implémentés (hors périmètre fonctionnel des diagrammes).
