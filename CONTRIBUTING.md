# Contributing to BadCost 🏸

This is a private project maintained by a single owner for personal use with close friends.  
Contributions from invited collaborators are welcome. The guide below explains how to work with the codebase consistently.

---

## 📋 Table of Contents

- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Architecture Rules](#architecture-rules)
- [Adding a New Feature](#adding-a-new-feature)
- [Writing Tests](#writing-tests)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Branch Strategy](#branch-strategy)

---

## 📁 Project Structure

```
src/
├── domain/          # Pure business logic — NO React, NO browser APIs
│   ├── entities/    # TypeScript interfaces only
│   └── usecases/    # Pure functions + __tests__/
├── application/
│   └── ports/       # Repository interfaces (IPlayerRepository, IEventRepository)
├── infrastructure/  # Concrete I/O (localStorage, file backup)
└── presentation/    # React components, pages, context, hooks
```

---

## 🛠 Development Setup

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run unit tests
npm test

# Lint
npm run lint

# Production build
npm run build
```

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

## 🧪 Writing Tests

Tests live alongside use cases in `src/domain/usecases/__tests__/`.  
The project uses **Node.js built-in `node:test`** — no extra test libraries needed.

### Test file template

```ts
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { myUseCase } from '../myUseCase';

describe('myUseCase', () => {
  test('describes the expected behaviour', () => {
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

- Each use case must have its own test file.
- Reference the relevant AC number in the test description (e.g. `'rounds up per player (AC10)'`).
- Cover: happy path, edge cases (empty input, single player, rounding), and boundary conditions.

---

## ✏️ Code Style

- **TypeScript strict mode** is enabled — no `any` types.
- Use **interfaces** for entities, **pure functions** for use cases.
- Tailwind utility classes only — no custom CSS files.
- Keep components small and focused. Extract reusable UI into `presentation/components/`.
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

Open a pull request to `main` when ready. Squash-merge preferred to keep history clean.
