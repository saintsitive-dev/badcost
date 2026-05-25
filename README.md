# 🏸 BadCost — Badminton Cost Calculator & Game Booking

A **free Progressive Web App (PWA)** for badminton hosts to calculate costs among players **and** manage game sign-ups via shareable invite links. Built with React + TypeScript + Firebase.

> **Language note:** The UI is Thai-first. Player names support both Thai and English.

---

## ✨ Features at a Glance

| Feature | Description |
|---|---|
| 👥 Player management | Add, delete, and favourite players (Thai & English names) |
| 🎮 Event creation | Select players, set individual play hours, set date/time |
| 🏟 Court cost | Cost per court per hour, multiple courts, optional per-hour court override |
| 🏸 Shuttlecock cost | Cost per unit, total used, optional per-hour breakdown |
| 📋 Organiser fee | Flat fee split equally among all players |
| 💰 Live summary | Real-time cost preview as you fill in the form |
| 📋 Share to LINE | One-tap copy of a formatted cost summary text |
| 💾 Backup & restore | Export / import all data as a JSON file (save to Google Drive manually) |
| 📱 PWA | Installable on iOS / Android / desktop, works offline |
| **🎯 Game booking** | Host creates games, shares invite links, players join by name |
| **🔗 Invite links** | Share via LINE group — no login needed for participants |
| **📊 Real-time list** | Live participant list with Firestore real-time updates |
| **💰 Calculate costs** | Start cost calculation directly from game booking |

---

## 🏗 Architecture

BadCost uses **Clean Architecture** with four distinct layers, keeping core business logic framework-free and fully unit-testable.

```
src/
├── domain/                     # Core business logic (no dependencies)
│   ├── entities/               # Data shapes: Player, GameEvent, CostBreakdown, Game
│   └── usecases/               # Pure functions: calculate*, managePlayers, formatShareText
│       └── __tests__/          # Unit tests (Node.js built-in test runner)
│
├── application/
│   └── ports/                  # Repository interfaces (IPlayerRepository, IEventRepository)
│
├── infrastructure/             # I/O implementations
│   ├── repositories/           # LocalStoragePlayerRepo, LocalStorageEventRepo, FirestoreGameRepo
│   ├── firebase/               # Firebase config, auth (Google Sign-In), session management
│   └── backup.ts               # JSON export / import
│
└── presentation/               # React UI (pages, components, context, hooks)
    ├── pages/                  # Cost-splitting pages + games/ (booking module)
    ├── components/             # Shared UI (BottomNav, Layout, PageHeader, games/)
    ├── context/                # PlayersContext
    └── hooks/                  # useEventData, usePWAInstall
```

### Game Booking Flow

```
Host (Google Sign-In) → Create Game → Copy Invite Link → Share in LINE Group
                                                              ↓
Participants → Click Link → Enter Name → Join Game (real-time)
                                                              ↓
Host → "คิดค่าแบด" → Confirm Players & Hours → Calculate & Share Costs
```

### Cost Calculation Model

Player costs use a **"last-N hours" tier model**:

- A player who plays **H hours** out of a **maxH-hour session** participates in the **last H hours**.
- This correctly handles **late joiners** — a 1-hour late joiner only pays for the final hour.
- All fractional amounts are **rounded up (ceil)** to the nearest integer before aggregation (AC10).

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm
- Java Runtime (for Firebase Emulators)

### Install & Run

```bash
npm install --legacy-peer-deps

# Run with Firebase Emulators (full features, no credentials needed)
npm run dev:full

# Or run separately:
npm run emulators   # Terminal 1 — Firebase Auth + Firestore emulators
npm run dev         # Terminal 2 — Vite dev server
```

Open http://localhost:5173/badcost/

| Service | URL |
|---------|-----|
| App | http://localhost:5173/badcost/ |
| Firebase Emulator UI | http://localhost:4000 |

> **Note:** In dev mode, Google Sign-In auto-signs you in as "Dev Host" (no real Google account needed). Emulator data resets on restart.

### Build

```bash
npm run build
```

### Run Unit Tests

```bash
npm test
```

Tests use Node.js's built-in `node:test` runner — no additional test framework required.

### Lint

```bash
npm run lint
```

### All npm scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server only |
| `npm run dev:full` | Vite + Firebase Emulators (recommended) |
| `npm run emulators` | Firebase Emulators only |
| `npm run build` | TypeScript check + production build |
| `npm test` | Unit tests |
| `npm run lint` | ESLint |

---

## 🔥 Firebase Setup (Game Booking)

The game booking feature uses Firebase Firestore + Auth.

### Local Development (Emulators — recommended)

No real credentials needed. The app auto-connects to local emulators in dev mode:

```bash
npm run dev:full   # Starts both emulators and Vite
```

First run downloads the emulator JARs (~139MB, cached after that). Requires Java Runtime.

### Production (real Firebase project)

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore + Google Auth
3. Copy `.env.example` to `.env` and fill in your Firebase config

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `<project-id>.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | GCP project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `<project-id>.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

> **Note:** The existing cost-splitting features work without Firebase (localStorage only). Firebase is only needed for game booking.

---

## 🏗 Infrastructure (Terraform)

All cloud infrastructure is managed via Terraform in the `/infrastructure/` directory.

```bash
cd infrastructure/
terraform init
terraform plan
terraform apply
```

- **State management:** Terraform Cloud (free tier)
- **CI/CD:** GitHub Actions — `terraform plan` on PR, `terraform apply` on merge to main
- **Resources:** Firebase project, Firestore DB, Auth providers, Firebase Hosting

See [`docs/features/game-booking.md`](docs/features/game-booking.md) for the full backend service registration guide.

---

## 🗄 Data Storage

### Local (localStorage)

| Key | Contents |
|---|---|
| `badcost:players` | JSON array of `Player` objects |
| `badcost:events` | JSON array of `GameEvent` objects |
| `badcost_device_id` | Unique device identifier for game participation |
| `badcost_user_name` | Participant's display name |

### Cloud (Firestore)

| Collection | Purpose |
|---|---|
| `hosts/{hostId}` | Host profile (Google auth) |
| `games/{gameId}` | Game booking details |
| `games/{gameId}/participants/{id}` | Participant entries |

### Backup & Restore

Go to **Settings → Export** to download a `badcost-backup-YYYY-MM-DD.json` file.  
Upload this file to Google Drive (or any cloud storage) for safekeeping.  
Use **Settings → Import** to restore from a backup file.

---

## 📂 Documentation

| File | Description |
|---|---|
| [`docs/features.md`](docs/features.md) | Cost-splitting feature descriptions |
| [`docs/features/game-booking.md`](docs/features/game-booking.md) | Game booking feature spec & backend setup guide |
| [`docs/acceptance-criteria.md`](docs/acceptance-criteria.md) | Acceptance criteria (AC1–AC12) |
| [`docs/test-cases.md`](docs/test-cases.md) | Unit test cases per use case |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute |

---

## 🛠 Tech Stack

| Tool | Role |
|---|---|
| React 19 | UI framework |
| TypeScript 6 | Type safety |
| Vite 8 | Build tool & dev server |
| TailwindCSS 4 | Utility-first styling |
| React Router 7 | Client-side routing |
| Firebase | Auth (Google Sign-In) + Firestore (real-time DB) |
| Terraform | Infrastructure as Code |
| vite-plugin-pwa | PWA manifest & service worker |
| Node.js `node:test` | Unit test runner (zero extra deps) |

---

## 📄 License

Private project — not open for redistribution.
