# SalonSwipe — TODO

## Phase 1 : Backend & Base de données
- [x] Schéma DB : tables events, exhibitors, votes
- [x] Seed données FHT 2026 (193 exposants avec tiers Sodexo)
- [x] Seed données TechInnov 2026 (277 exposants avec tiers Sodexo)
- [x] API tRPC : events.list, events.getBySlug
- [x] API tRPC : exhibitors.list, exhibitors.swipeQueue
- [x] API tRPC : votes.cast (like/superlike/dislike)
- [x] API tRPC : votes.undo (retour arrière)
- [x] API tRPC : votes.myVotes, votes.teamVotes
- [x] API tRPC : votes.stats (KPIs par tier, par user)
- [ ] API tRPC : import.uploadExcel (à venir)

## Phase 2 : Interface Swipe
- [x] Design system : couleurs, typographie, tokens CSS
- [x] Composant SwipeCard avec animations framer-motion
- [x] Gestes tactiles (touch drag) sur mobile
- [x] Boutons Like / SuperLike / Dislike
- [x] Overlays animés LIKE / NOPE / SUPER
- [x] Bouton Undo (retour arrière)
- [x] Modal embed iframe site exposant
- [x] Indicateur de progression (x restants)
- [x] État "plus d'exposants" (fin de pile)
- [x] Page Swipe principale

## Phase 3 : Vue Équipe & Dashboard
- [x] Page Vue Équipe avec filtres Like/SuperLike/Dislike
- [x] Stats par membre d'équipe
- [x] Dashboard statistiques (KPIs votes)
- [x] Page d'accueil avec sélection d'événement
- [x] Design responsive mobile-first
- [ ] Import Excel (upload + parsing) — à venir
- [ ] Navigation bottom bar mobile — à venir
- [ ] Filtre par tier (A/B/C/D) dans vue équipe — à venir

## Phase 4 : Tests & Livraison
- [x] Tests vitest backend (21 tests passent)
- [x] Checkpoint final
