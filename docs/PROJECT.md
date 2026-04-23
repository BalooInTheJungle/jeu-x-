# PROJECT.md — Vision du Projet

## Concept en Une Phrase

Une plateforme web de jeux de soirée multijoueurs temps réel, extensible à l'infini par des agents IA.

---

## Le Problème

Les jeux de soirée web existants (Jackbox, Kahoot...) sont soit payants, soit rigides, soit nécessitent une installation. On veut "envoie le lien → tout le monde joue" en 30 secondes, gratuit, depuis n'importe quel appareil.

---

## La Solution

Des rooms éphémères avec un code à 4 lettres. Chaque jeu est un module indépendant branché sur une plateforme commune. N'importe quel agent IA peut créer un nouveau jeu en lisant les docs.

---

## Utilisateurs

**V1 :** Anonymes — pseudo temporaire, pas de compte requis.
**V2 :** Comptes optionnels pour l'historique et les statistiques.

---

## Jeux Prévus

| # | Jeu | Description courte | Version |
|---|-----|--------------------|---------|
| 1 | **Image Quiz** | Vois une image, devine ce que c'est — plusieurs thèmes paramétrables | V1 |
| 2 | **Flag Quiz** | À définir | V1 |
| 3 | **Undercover / Bluff** | Jeu de déduction sociale | V2 |
| 4+ | À venir | La plateforme est conçue pour les accueillir | V3+ |

---

## Principes Non-Négociables

- **Gratuit pour toujours** — pas de monétisation, pas de pub, pas de premium
- **Web uniquement** — pas d'app native (PWA acceptable en V2)
- **Zéro friction** — rejoindre une partie en 30 secondes, sans compte
- **Solo dev + agents IA** — chaque nouveau jeu doit pouvoir être créé par un agent seul
- **TypeScript strict** — pas de `any`, pas de raccourcis sales
- **Extensible by design** — ajouter un jeu ne doit pas toucher au code de la plateforme

---

## Critère de Réussite

Chaque décision doit passer ce test :
> *"Est-ce qu'un agent IA pourra ajouter un nouveau jeu en lisant juste les fichiers `docs/` ?"*

Si oui → bonne décision. Si non → la doc ou le code doit être amélioré.
