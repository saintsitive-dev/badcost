# Game Booking Feature

## Problem Statement

Currently, the host manually posts game details in a LINE group chat and tracks sign-ups by editing a message. This is error-prone and doesn't scale. We need an in-app game booking system where:

- The host creates a game with details (venue, date, time, courts, max players)
- The host shares an invite link to a LINE group
- Users click the link, see available games, and join by entering their name
- The booking flows directly into cost calculation (no separate "convert" step)

## Approach

Add Firebase Firestore as the backend for shared game state. Host authenticates via Google Sign-In. Participants identify themselves with a name (stored in localStorage). The game booking flows directly into cost calculation — when the host is ready, they tap "คิดค่าแบด" → review participants/hours → proceed to cost entry.

---

## Data Model

### Firestore Collections

```
/hosts/{hostId}
  - displayName: string
  - email: string
  - provider: "google" | "line"
  - createdAt: timestamp

/games/{gameId}
  - hostId: string
  - title: string              // e.g. "เปิดตี้วันพุธ 🏸"
  - venue: string              // e.g. "sevendays badminton"
  - date: string               // ISO date "2026-05-20"
  - startTime: string          // "19:00"
  - endTime: string            // "20:00"
  - hours: number              // calculated or manual
  - courts: string             // e.g. "4,5 คอร์ด" or "3 คอร์ด"
  - zone: string               // e.g. "3,4,5" (optional)
  - maxPlayers: number | null  // null = unlimited
  - status: "open" | "full" | "closed"
  - inviteCode: string         // short unique code for invite link
  - createdAt: timestamp
  - gameDate: timestamp        // for querying/sorting

/games/{gameId}/participants/{participantId}
  - name: string
  - joinedAt: timestamp
  - deviceId: string           // localStorage-based device identifier
```

### localStorage Keys

```
badcost_device_id    — unique device identifier (UUID, generated once)
badcost_user_name    — last used name for quick re-entry
badcost_host_token   — Firebase auth token for host
```

---

## URL Structure

```
/games/invite/:inviteCode     — Invite landing page (participant view)
/games/:gameId                — Game detail / participant list
/games/create                 — Host: create a new game
/games/manage                 — Host: list & manage created games
```

---

## Features Breakdown

### 9. Game Booking (New Module)

#### 9.1 Host Authentication

| # | Feature | Detail |
|---|---|---|
| 9.1.1 | Google Sign-In | Firebase Auth with Google provider |
| 9.1.2 | Persistent session | Host stays logged in across sessions (Firebase Auth state) |

#### 9.2 Game Creation (Host)

| # | Feature | Detail |
|---|---|---|
| 9.2.1 | Create game form | Title, venue, date, start time, end time, courts, zone, max players |
| 9.2.2 | Generate invite link | Auto-generates a short invite code (e.g. `abc123`) |
| 9.2.3 | Copy invite link | One-tap copy of `https://<domain>/games/invite/abc123` |
| 9.2.4 | Manage games | List all games created by host, with status badges |
| 9.2.5 | Edit game | Adjust max players, time, venue even after creation |
| 9.2.6 | Close game | Manually close registration |
| 9.2.7 | Delete game | Permanently delete a game and all its participant data |

#### 9.3 Invite Landing Page (Participant)

| # | Feature | Detail |
|---|---|---|
| 9.3.1 | Show available games | Games not yet joined, in the future (past games > 1 week hidden) |
| 9.3.2 | Show joined games | Games the user already joined (matched by deviceId) |
| 9.3.3 | Auto-redirect | If only 1 available game → redirect to game detail |
| 9.3.4 | Name input | First-time: prompt for name. Stored in localStorage for future visits |
| 9.3.5 | Change name | Option to update stored name |

#### 9.4 Game Detail Page (Participant)

| # | Feature | Detail |
|---|---|---|
| 9.4.1 | Game info display | Thai-formatted details matching LINE message style |
| 9.4.2 | Participant list | Numbered list showing who joined (real-time updates via Firestore) |
| 9.4.3 | Join button | Add self to participant list (blocked if game full) |
| 9.4.4 | Leave button | Remove self from participant list |
| 9.4.5 | Full indicator | Show "เต็มแล้ว 📌" when max reached |
| 9.4.6 | Slot indicators | Show empty numbered slots for remaining capacity (like "15. \n16. \n17. \n18.") |

#### 9.4.H Game Detail — Host Controls

| # | Feature | Detail |
|---|---|---|
| 9.4.H1 | Remove participant | Host can remove any participant from the list at any time |
| 9.4.H2 | Add participant manually | Host can add a name to the list on behalf of someone (e.g. someone who asked in chat but didn't use the link) |
| 9.4.H3 | Reorder participants | Host can reorder the participant list if needed |
| 9.4.H4 | Override max limit | Host can add beyond max (override) or adjust max at any time |

#### 9.5 Start Cost Calculation (Host)

| # | Feature | Detail |
|---|---|---|
| 9.5.1 | "คิดค่าแบด" button | Available on game detail for host |
| 9.5.2 | Confirmation page | Shows participants with per-player hour adjustment |
| 9.5.3 | Pre-fill hours | Use game duration as default hours for all players |
| 9.5.4 | Navigate to event | After confirmation, creates GameEvent and navigates to cost entry page |

---

## Implementation Phases

### Phase 0: Infrastructure (Terraform)
- Set up Terraform Cloud workspace
- Write Terraform configs for GCP project, Firebase, Firestore, Auth
- Create GitHub Actions workflow for `terraform plan` on PR / `terraform apply` on merge
- Deploy Cloud Function for LINE Login token exchange
- Configure Firebase Hosting

### Phase 1: Firebase SDK & Host Auth
- Add Firebase SDK (firebase, @firebase/auth, @firebase/firestore)
- Create `infrastructure/firebase/` module in app code with config
- Implement host login page with Google Sign-In and LINE Login
- Store host session in Firebase Auth

### Phase 2: Game Creation & Management
- Create `domain/entities/Game.ts` entity
- Create Firestore repository for games (`infrastructure/repositories/FirestoreGameRepo.ts`)
- Build game creation form page (`/games/create`)
- Build game management page (`/games/manage`)
- Implement invite code generation and copy-to-clipboard

### Phase 3: Participant Flow (Invite Link)
- Build invite landing page (`/games/invite/:inviteCode`)
- Implement device ID generation and localStorage session
- Build name input/remember flow
- Show available vs. joined games
- Implement auto-redirect logic

### Phase 4: Game Detail & Join/Leave
- Build game detail page with real-time Firestore listener
- Implement join/leave logic with max player enforcement
- Host controls: add/remove participants, reorder, override max
- Thai-formatted display matching LINE message style
- Real-time participant list updates
- Empty slot indicators

### Phase 5: Cost Calculation Flow
- "คิดค่าแบด" button on game detail → confirmation page
- Confirmation page: per-player hour adjustment, include/exclude toggle
- Creates GameEvent with pre-filled players and hours
- Navigates directly to existing cost entry flow

---

## Infrastructure (Terraform)

All infrastructure is managed via Terraform, stored in `/infrastructure/`.

### State Management
- **Terraform Cloud** (free tier) — state storage, locking, run history
- No need for a separate GCS bucket

### Directory Structure
```
/infrastructure/
├── main.tf                 # Provider config, Terraform Cloud backend
├── variables.tf            # Input variables (project ID, region, etc.)
├── outputs.tf              # Output values (project URLs, etc.)
├── firebase.tf             # Firebase project, Firestore DB, app config
├── auth.tf                 # Firebase Auth providers (Google, LINE custom)
├── firestore-rules.tf      # Firestore security rules deployment
├── cloud-functions.tf      # Cloud Functions for LINE Login token exchange
└── terraform.tfvars.example # Example vars (actual secrets in GitHub Secrets)
```

### Secrets Management
- All auth secrets (LINE channel ID/secret, Firebase service account) stored in **GitHub Secrets**
- Terraform Cloud workspace variables linked to GitHub Actions
- No secrets committed to repo — `terraform.tfvars` is gitignored

### CI/CD (GitHub Actions)
- `terraform plan` on PR
- `terraform apply` on merge to main
- Secrets injected via GitHub Secrets → Terraform Cloud variables

### Resources Managed
- GCP Project + Firebase enablement
- Firestore database + security rules
- Firebase Auth (Google provider + LINE custom auth)
- Cloud Function for LINE Login OAuth token exchange
- Firebase Hosting (for the web app)

---

## Backend Service Registration Guide

### Step-by-step instructions to set up all required services (one-time manual setup):

### 1. Google Cloud Platform (GCP) Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click "New Project" → Name it (e.g. `badcost-prod`)
3. Note the **Project ID** (e.g. `badcost-prod-abc123`)
4. Enable billing (required even for free tier — you won't be charged with Spark plan)
5. Enable APIs:
   - Firebase Management API
   - Cloud Firestore API
   - Identity Toolkit API (for Firebase Auth)
   - Cloud Functions API
   - Cloud Build API

### 2. Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project" → Select your GCP project from step 1
3. Skip Google Analytics (optional)
4. Once created:
   - Go to **Project Settings** → Note your `Web API Key` and `Project ID`
   - Go to **Build → Firestore** → Click "Create database" → Choose `asia-southeast1` (Bangkok) → Start in production mode
   - Go to **Build → Authentication** → Click "Get started"
   - Under **Sign-in method** → Enable **Google** (add your email as project support email)

### 3. LINE Login Channel (for LINE Authentication)

1. Go to [developers.line.biz](https://developers.line.biz)
2. Create a **Provider** (e.g. "BadCost")
3. Create a **LINE Login** channel:
   - Channel type: LINE Login
   - App type: Web app
   - Name: "BadCost" (or your preference)
4. In channel settings:
   - Note the **Channel ID** and **Channel Secret**
   - Under "LINE Login" tab → Set **Callback URL**: `https://<your-domain>/auth/line/callback`
   - Enable: Email address permission (optional, for display)
5. Publish the channel (change from "Developing" to "Published")

### 4. Terraform Cloud

1. Go to [app.terraform.io](https://app.terraform.io) → Sign up (free)
2. Create an **Organization** (e.g. `badcost`)
3. Create a **Workspace**:
   - Choose "API-driven workflow"
   - Name: `badcost-prod`
4. In workspace settings → **Variables**, add:
   - `GOOGLE_CREDENTIALS` (sensitive) — GCP service account JSON key
   - `TF_VAR_gcp_project_id` — your GCP project ID
   - `TF_VAR_line_channel_id` (sensitive) — LINE channel ID
   - `TF_VAR_line_channel_secret` (sensitive) — LINE channel secret
5. Generate a **Team API Token** (or User Token) → Save for GitHub Secrets

### 5. GCP Service Account (for Terraform)

1. In GCP Console → **IAM & Admin → Service Accounts**
2. Create service account: `terraform@<project-id>.iam.gserviceaccount.com`
3. Grant roles:
   - `roles/editor` (or more granular: Firebase Admin, Firestore Admin, Cloud Functions Admin)
   - `roles/resourcemanager.projectIamAdmin`
4. Create a JSON key → Download it
5. This is your `GOOGLE_CREDENTIALS` for Terraform Cloud

### 6. GitHub Secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret Name | Value |
|---|---|
| `TF_API_TOKEN` | Terraform Cloud API token from step 4.5 |
| `GOOGLE_CREDENTIALS` | GCP service account JSON key (entire file content) |
| `LINE_CHANNEL_ID` | LINE Login Channel ID |
| `LINE_CHANNEL_SECRET` | LINE Login Channel Secret |
| `FIREBASE_WEB_API_KEY` | From Firebase project settings |

### 7. Firebase Hosting (for deploying the web app)

1. In Firebase Console → **Build → Hosting** → Click "Get started"
2. Follow the setup wizard (skip CLI install — Terraform handles deployment)
3. Note your default domain: `<project-id>.web.app`
4. (Optional) Add custom domain later in Firebase Hosting settings

### 8. Verify Everything Works

After all setup:
```bash
cd infrastructure/
terraform init
terraform plan  # Should show resources to create
```

---

### Cost Summary (Free Tier Limits)

| Service | Free Tier | Our Usage |
|---|---|---|
| Firebase Firestore | 1GB storage, 50K reads/day, 20K writes/day | Well within limits for a small group |
| Firebase Auth | 10K authentications/month | Only host logs in — very low usage |
| Firebase Hosting | 10GB transfer/month, 1GB storage | Static SPA, minimal |
| Cloud Functions | 2M invocations/month, 400K GB-seconds | Only LINE Login callback — minimal |
| Terraform Cloud | 500 managed resources | ~10 resources total |
| **Total monthly cost** | **$0** | ✅ |

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | Firebase Firestore | Free tier sufficient, real-time listeners, easy auth |
| Host auth | Google + LINE Login | User requested both options |
| Participant identity | Name + deviceId in localStorage | Simple, no login required for participants |
| Real-time updates | Firestore `onSnapshot` | Participants see joins/leaves instantly |
| Invite code format | 6-char alphanumeric | Short enough for LINE sharing |
| Game visibility | Future only + hide past >1 week | Performance per requirement |
| Max player enforcement | Firestore transaction | Prevents race condition on last slot |

---

## Performance & UX Principles

| Principle | Implementation |
|---|---|
| **Fast load** | Code-split game booking module (lazy routes). Minimal Firestore reads — query only future games + 1 week past. |
| **Free** | Firebase Spark (free) plan is sufficient. No paid services. Keep Firestore reads low with smart caching. |
| **Easy to use** | Participants: zero sign-up, just tap link + type name. Host: 1-tap copy invite link. Auto-redirect when only 1 game. |
| **Offline-friendly** | Cache last-seen game state in localStorage. Show cached data instantly, update when Firestore connects. |
| **Mobile-first** | Large tap targets, minimal form fields, one-handed operation. Optimized for LINE in-app browser. |
| **Instant feedback** | Optimistic UI updates on join/leave. Show loading skeleton while Firestore syncs. |

---

## UI/UX Notes

- Game detail page should visually match the LINE message format the group is used to
- Use Thai locale for dates (e.g. "พุธ 20 พฤษภา 2569")
- Emoji usage consistent with existing LINE messages (🏸, 🌟, 📌)
- Mobile-first design (since users click from LINE on mobile)
- Join button prominently placed, disabled + "เต็มแล้ว" when full
