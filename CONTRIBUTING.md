# Contributing to BadCost 🏸

This is a private project maintained by a single owner for personal use with close friends.  
Contributions from invited collaborators are welcome. The guide below explains how to work with the codebase consistently.

---

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Rules](#architecture-rules)
- [Adding a New Feature](#adding-a-new-feature)
- [Game Booking Module](#game-booking-module)
- [Infrastructure (Terraform)](#infrastructure-terraform)
- [Writing Tests](#writing-tests)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Branch Strategy](#branch-strategy)

---

## 📁 Project Structure

```
src/
├── domain/          # Pure business logic — NO React, NO browser APIs
│   ├── entities/    # TypeScript interfaces (Player, GameEvent, Game, CostBreakdown)
│   └── usecases/    # Pure functions + __tests__/
├── application/
│   └── ports/       # Repository interfaces (IPlayerRepository, IEventRepository)
├── infrastructure/  # Concrete I/O (localStorage, Firebase, backup)
│   ├── repositories/  # LocalStoragePlayerRepo, LocalStorageEventRepo, FirestoreGameRepo
│   └── firebase/      # Firebase config, auth, session management
└── presentation/    # React components, pages, context, hooks
    ├── pages/         # Cost-splitting pages
    │   └── games/     # Game booking pages (lazy-loaded)
    ├── components/    # Shared UI components
    │   └── games/     # Game booking shared components
    ├── context/       # PlayersContext
    └── hooks/         # useEventData, usePWAInstall

infrastructure/      # Terraform IaC (root-level, separate from src/)
├── main.tf          # Provider config, Terraform Cloud backend
├── variables.tf     # Input variables
├── firebase.tf      # Firebase project & web app
├── auth.tf          # Firebase Auth (Google provider)
├── firestore.tf     # Firestore DB + security rules
└── firestore.rules  # Firestore security rules source
```

---

## 🛠 Development Setup

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start dev server with Firebase Emulators (recommended)
npm run dev:full

# Or start separately:
npm run emulators   # Terminal 1
npm run dev         # Terminal 2

# Run unit tests
npm test

# Lint
npm run lint

# Production build
npm run build
```

### Firebase Emulators (local dev)

`npm run dev:full` starts Firebase Auth + Firestore emulators locally. No credentials or `.env` file needed. The app auto-connects to emulators in dev mode and auto-signs you in as "Dev Host".

- Requires **Java Runtime** (for the Firestore emulator JAR)
- First run downloads ~139MB emulator JAR (cached after that)
- Emulator data resets on restart
- Emulator UI: http://localhost:4000

### Firebase (production deployment)

```bash
# Copy env template and fill in your Firebase config
cp .env.example .env
```

See [`docs/features/game-booking.md`](docs/features/game-booking.md) for full Firebase project setup instructions.

### Terraform (infrastructure changes)

```bash
cd infrastructure/
terraform init      # First time only
terraform plan      # Preview changes
terraform apply     # Apply changes
```

Requires Terraform Cloud credentials (see the backend registration guide in the game booking doc).

---

## 🏛 Architecture Rules

BadCost uses **Clean Architecture**. Strictly follow these dependency rules:

| Layer | May depend on | Must NOT depend on |
|---|---|---|
| `domain` | nothing | `application`, `infrastructure`, `presentation`, React, browser APIs |
| `application/ports` | `domain` entities | `infrastructure`, `presentation`, React |
| `infrastructure` | `domain`, `application/ports` | `presentation`, React |
| `presentation` | all layers | — |

> **Rule of thumb:** if you can't unit-test it with `node:test` and plain function calls, it doesn't belong in `domain/`.

---

## ➕ Adding a New Feature

1. **Define entities** (if needed) in `src/domain/entities/`.
2. **Write the use case** as a pure function in `src/domain/usecases/`.
3. **Write unit tests** in `src/domain/usecases/__tests__/` *before* the implementation (TDD preferred).
4. **Update repository interfaces** in `src/application/ports/` if new persistence is needed.
5. **Implement infrastructure** in `src/infrastructure/` if new persistence is needed.
6. **Build the UI** in `src/presentation/`.
7. **Update `docs/`** — add/update acceptance criteria, features, and test-case docs as appropriate.

---

## 🎯 Game Booking Module

The game booking feature lives in a separate set of pages under `src/presentation/pages/games/`. Key differences from the cost-splitting module:

| Aspect | Cost-Splitting | Game Booking |
|---|---|---|
| Data storage | localStorage only | Firebase Firestore (real-time) |
| Auth | None (single device) | Google Sign-In (host only) |
| Routing | `/event/:id`, `/event/:id/result` | `/games/*` (lazy-loaded) |
| Shared components | `src/presentation/components/` | `src/presentation/components/games/` |
| User identity | N/A | deviceId + name in localStorage |

### Unified flow

The game booking flows directly into cost calculation — no separate "convert" step:

```
เปิดตี้ tab → Login → Create Game → Share Link → Players Join
   → "คิดค่าแบด" → Confirm Players & Hours → Cost Entry → Result → Copy to LINE
```

### Key files

| File | Purpose |
|---|---|
| `src/domain/entities/Game.ts` | Game & Participant interfaces + helper functions |
| `src/infrastructure/firebase/config.ts` | Firebase app init + emulator connection |
| `src/infrastructure/firebase/auth.ts` | Google Sign-In (auto-sign-in in dev mode) |
| `src/infrastructure/firebase/session.ts` | Device ID & user name (localStorage) |
| `src/infrastructure/repositories/FirestoreGameRepo.ts` | Full CRUD + real-time + duplicate prevention |
| `src/presentation/components/games/index.tsx` | Shared UI components for game pages |
| `src/presentation/pages/games/CostConfirmationPage.tsx` | Per-player hour adjustment before cost entry |
| `firebase.json` | Firebase Emulator configuration |

### Adding a new game booking page

1. Create the page in `src/presentation/pages/games/`.
2. Use shared components from `../../components/games` (`GamePageContainer`, `Card`, `PrimaryButton`, etc.).
3. Add a lazy-loaded route in `src/App.tsx`.
4. Add pure logic to `src/domain/entities/Game.ts` and test in `__tests__/game.test.ts`.

---

## 🏗 Infrastructure (Terraform)

Cloud infrastructure lives in `/infrastructure/` (root-level directory, outside `src/`).

### Making infrastructure changes

1. Edit the relevant `.tf` file.
2. Run `terraform plan` to preview.
3. Open a PR — GitHub Actions runs `terraform plan` automatically.
4. On merge to `main`, GitHub Actions runs `terraform apply`.

### CI Pipeline

All pushes to `main` and PRs run the CI workflow (`.github/workflows/ci.yml`):
1. `npm run build` — TypeScript type check + Vite build
2. `npm test` — Unit tests
3. `npm run lint` — ESLint

### Secrets

All secrets are stored in **GitHub Secrets** and **Terraform Cloud workspace variables**:
- `GOOGLE_CREDENTIALS` — GCP service account key
- `TF_API_TOKEN` — Terraform Cloud API token
- `FIREBASE_WEB_API_KEY` — Firebase web API key

Never commit secrets to the repository.

---

## 🧪 Writing Tests

Tests live alongside use cases in `src/domain/usecases/__tests__/`.  
The project uses **Node.js built-in `node:test`** — no extra test libraries needed.

### Test file template

```ts
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { myUseCase } from '../myUseCase';

describe('myUseCase', () => {
  it('describes the expected behaviour', () => {
    const result = myUseCase(/* inputs */);
    assert.equal(result, /* expected */);
  });
});
```

### Run tests

```bash
npm test
```

### Guidelines

- Each use case / entity with logic must have its own test file.
- Reference the relevant AC number in the test description (e.g. `'rounds up per player (AC10)'`).
- Cover: happy path, edge cases (empty input, single player, rounding), and boundary conditions.
- Game domain logic tests are in `__tests__/game.test.ts`.

---

## ✏️ Code Style

- **TypeScript strict mode** is enabled — no `any` types.
- Use **interfaces** for entities, **pure functions** for use cases.
- Tailwind utility classes only — use the `.form-input` component class for form inputs.
- Keep components small and focused. Extract reusable UI into `presentation/components/`.
- Game booking pages should use shared components from `components/games/`.
- Comments only where logic is non-obvious. AC references (e.g. `// AC6`) are encouraged.

Lint is enforced via ESLint + typescript-eslint:

```bash
npm run lint
```

---

## 💬 Commit Messages

Use conventional-style prefixes:

| Prefix | When to use |
|---|---|
| `feat:` | New feature or AC implementation |
| `fix:` | Bug fix |
| `test:` | Adding or updating tests |
| `docs:` | Documentation only |
| `refactor:` | Code change without behaviour change |
| `chore:` | Tooling, config, deps |
| `infra:` | Terraform / infrastructure changes |

Example:

```
feat: add per-hour court count override (AC6)

Allows the host to specify different court counts per hour slot.
Uses the last-N hours participation model to determine eligibility.
```

---

## 🌿 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, deployable code |
| `feat/<name>` | New feature work |
| `fix/<name>` | Bug fixes |
| `docs/<name>` | Documentation changes |
| `infra/<name>` | Infrastructure/Terraform changes |

Open a pull request to `main` when ready. Squash-merge preferred to keep history clean.
