# 🗳️ Tests unitaires – Contrat `Voting`

Ce dépôt contient les tests unitaires du smart contract **Voting**.

Ce qui est vérifié :
- Correctement initialisé au déploiement ;
- Gestion des propositions ;
- Verification du passage des étapes du workflow en erreur si l'étape précédente n'est pas la bonne;
- Verification du passage des étapes du workflow en erreur si l'étape précédente est correcte;
- Verification des changements d'étape autorisé uniquement par le owner ;
- Verification de la présence des logs à chaque changement d'étape.

---

## 🧱 Organisation des tests

### Comptes utilisés

| Variable | Rôle |
|---|---|
| `owner` | Premier compte Hardhat, déploie le contrat (propriétaire) |
| `paul` | Compte utilisé comme électeur |
| `michel` | Compte électeur supplémentaire |

### Mise en place

- **`before`** : récupère une seule fois les comptes de test (`owner`, `paul`, `michel`).
- **`beforeEach`** : redéploie un contrat `Voting` avant chqye test

### Rappel du workflow

| Valeur | Statut |
|---|---|
| `0` | RegisteringVoters |
| `1` | ProposalsRegistrationStarted |
| `2` | ProposalsRegistrationEnded |
| `3` | VotingSessionStarted |
| `4` | VotingSessionEnded |
| `5` | VotesTallied |

---

## ✅ Liste des tests

### 1. `voting setup` – Initialisation du contrat

| Test | Ce qui est vérifié |
|---|---|
| Proposition gagnante initialisée | `winningProposalID` vaut `0` |
| Workflow initialisé | `workflowStatus` vaut `0` (RegisteringVoters) |
| Propriétaire du contrat | `owner()` est bien le compte qui a déployé |

### 2. `voting proposal` – Ajout de propositions

| Test | Ce qui est vérifié |
|---|---|
| Électeur non enregistré | Revert : `"You're not a voter"` |
| Mauvaise étape du workflow | Revert : `"Proposals are not allowed yet"` |
| Description vide | Revert : `"Vous ne pouvez pas ne rien proposer"` |
| Ajout d'une proposition | La proposition est bien enregistrée à l'index `1` |
| Événement émis | L'event `ProposalRegistered` est émis avec l'ID `1` |

> ℹ️ Les propositions ajoutées commencent à l'index **1**, car l'index **0** est occupé par la proposition `GENESIS`, créée automatiquement au démarrage de l'enregistrement des propositions.

### 3. `voting workflow Failed` – Changements d'étape interdits

Chaque fonction de changement d'étape doit **revert** si elle est appelée au mauvais moment.

| Fonction appelée | Message d'erreur attendu |
|---|---|
| `startProposalsRegistering()` (déjà démarré) | `"Registering proposals cant be started now"` |
| `endProposalsRegistering()` | `"Registering proposals havent started yet"` |
| `startVotingSession()` | `"Registering proposals phase is not finished"` |
| `endVotingSession()` | `"Voting session havent started yet"` |
| `tallyVotes()` | `"Current status is not voting session ended"` |

### 4. `voting workflow success` – Changements d'étape valides

Chaque test enchaîne les étapes dans le bon ordre, puis vérifie le nouveau statut.

| Étape atteinte | Statut attendu |
|---|---|
| `startProposalsRegistering()` | `1` |
| `endProposalsRegistering()` | `2` |
| `startVotingSession()` | `3` |
| `endVotingSession()` | `4` |
| `tallyVotes()` | `5` |

### 5. `voting workflow only owner can change status` – Accès réservé au propriétaire

Seul le propriétaire (`owner`) peut faire avancer le workflow. Chaque test place d'abord le contrat à la bonne étape avec `owner`, puis vérifie que **paul** (non propriétaire) est refusé.

Le contrat utilise `Ownable` d'**OpenZeppelin v5**, qui ne renvoie plus de message texte mais une **custom error** :

```solidity
error OwnableUnauthorizedAccount(address account);
```

| Fonction appelée par `paul` | Erreur attendue |
|---|---|
| `startProposalsRegistering()` | `OwnableUnauthorizedAccount(paul)` |
| `endProposalsRegistering()` | `OwnableUnauthorizedAccount(paul)` |
| `startVotingSession()` | `OwnableUnauthorizedAccount(paul)` |
| `endVotingSession()` | `OwnableUnauthorizedAccount(paul)` |
| `tallyVotes()` | `OwnableUnauthorizedAccount(paul)` |


### 6. `voting workflow events` – Événements de changement d'étape

À chaque changement d'étape, le contrat émet l'événement :

```solidity
event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
```

Un seul test parcourt tout le workflow et vérifie à chaque étape que l'événement est émis avec **l'ancien statut** et **le nouveau statut**.

| Fonction appelée | `previousStatus` | `newStatus` |
|---|---|---|
| `startProposalsRegistering()` | `0` | `1` |
| `endProposalsRegistering()` | `1` | `2` |
| `startVotingSession()` | `2` | `3` |
| `endVotingSession()` | `3` | `4` |
| `tallyVotes()` | `4` | `5` |

---

## 🧪 Couverture de code (coverage)

Rapport généré avec :

```bash
npx hardhat test --coverage
```

| Fichier | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `voting.sol` | 🟡 **79,54 %** (35/44) | 100 % (0/0) | 100 % (0/0) | 🟡 **79,54 %** (35/44) |

## 📊 Résumé

| Bloc | Nombre de tests |
|---|---|
| voting setup | 3 |
| voting proposal | 5 |
| voting workflow Failed | 5 |
| voting workflow success | 5 |
| voting workflow only owner can change status | 5 |
| voting workflow events | 1 |
| **Total** | **24** |