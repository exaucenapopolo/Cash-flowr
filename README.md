# Cash-flowr

Plateforme d’affiliation gamifiée : inscriptions payantes, parrainage à 3 niveaux, micro-tâches (vidéos, quiz), roue de la chance et retraits via Mobile Money / Fapshi.

---

## 🚀 Résumé
Cash-flowr est un MVP pour lancer une plateforme d’affiliation locale et gamifiée. L’objectif : permettre aux utilisateurs de s’inscrire (ex. 2700 FCFA), inviter d’autres personnes et gagner des commissions sur 3 niveaux, tout en proposant des tâches rémunérées (watch-to-earn, quiz), missions et mini-jeux pour augmenter l’engagement.

---

## ⭐ Fonctionnalités principales (MVP)
- Inscription / authentification (email / téléphone)
- Achat d’activation (ex : 2700 FCFA)
- Système de parrainage 3 niveaux (crédits automatiques)
- Wallet utilisateur (solde, historique)
- Micro-tâches : vidéos courtes, quiz, roue/scratch
- Demande de retrait (payouts via Fapshi / Mobile Money)
- Dashboard utilisateur (liens d’affiliation, statistiques)
- Admin panel pour valider retraits / gérer missions

---

## 🧭 Pages prévues (structure)
**Front-office**
- `index.html` / Home
- `how-it-works.html` / À propos
- `plans.html` / Tarifs
- `faq.html`
- `contact.html`

**Utilisateur (auth-required)**
- `/dashboard`
- `/missions`
- `/referral`
- `/wallet`
- `/profile`

**Admin**
- `/admin/dashboard`
- `/admin/payments`
- `/admin/missions`

---

## 🛠️ Stack technique recommandée
- Frontend : React ou Next.js  
- Backend : Firebase (Authentication, Cloud Functions, Firestore) ou Node/Express si besoin de logique serveur spécifique  
- DB : Cloud Firestore (real-time)  
- Paiement / Payout : Fapshi (Mobile Money local) + (optionnel) Paystack / Flutterwave pour cartes  
- Hébergement / CI : GitHub + Vercel (CI/CD depuis repo GitHub)

---

## 🔧 Installation locale (exemple Node + React)
> Exemple si tu utilises un projet React / Node :

```bash
# Cloner le repo
git clone https://github.com/TON_PSEUDO/cash-flowr.git
cd cash-flowr

# Installer dépendances (si frontend React / Node backend)
npm install

# Variables d'environnement
# Crée un fichier .env.local ou .env et ajoute les clés :
# REACT_APP_FIREBASE_API_KEY=...
# FAPSHI_API_KEY=...
# FIREBASE_SERVICE_ACCOUNT= (pour functions)

# Lancer en dev
npm run dev
