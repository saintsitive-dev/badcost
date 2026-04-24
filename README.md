# 🏸 BadCost — Badminton Cost Calculator

A **free Progressive Web App (PWA)** for badminton hosts to calculate and share costs among players. Built with React + TypeScript and designed for use with close friends.

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

---

## 🏗 Architecture

BadCost uses **Clean Architecture** with four distinct layers, keeping core business logic framework-free and fully unit-testable.

```
src/
├── domain/                     # Core business logic (no dependencies)
│   ├── entities/               # Data shapes: Player, GameEvent, CostBreakdown
│   └── usecases/               # Pure functions: calculate*, managePlayers, formatShareText
│       └── __tests__/          # Unit tests (Node.js built-in test runner)
│
├── application/
│   └── ports/                  # Repository interfaces (IPlayerRepository, IEventRepository)
│
├── infrastructure/             # I/O implementations
│   ├── repositories/           # LocalStoragePlayerRepo, LocalStorageEventRepo
│   └── backup.ts               # JSON export / import
│
└── presentation/               # React UI (pages, components, context, hooks)
    ├── pages/                  # PlayersPage, NewEventPage, EventPage, ResultPage, HistoryPage, SettingsPage
    ├── components/             # BottomNav, Layout, PageHeader, PlayerCard, InstallBanner
    ├── context/                # PlayersContext
    └── hooks/                  # useEventData, usePWAInstall
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

### Install & Run

```bash
npm install
npm run dev
```

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

---

## 🗄 Data Storage

All data is persisted in **`localStorage`** under two keys:

| Key | Contents |
|---|---|
| `badcost_players` | JSON array of `Player` objects |
| `badcost_events` | JSON array of `GameEvent` objects |

### Backup & Restore

Go to **Settings → Export** to download a `badcost-backup-YYYY-MM-DD.json` file.  
Upload this file to Google Drive (or any cloud storage) for safekeeping.  
Use **Settings → Import** to restore from a backup file.

---

## 📂 Documentation

| File | Description |
|---|---|
| [`docs/features.md`](docs/features.md) | Detailed feature descriptions |
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
| vite-plugin-pwa | PWA manifest & service worker |
| Node.js `node:test` | Unit test runner (zero extra deps) |

---

## 📄 License

Private project — not open for redistribution.
