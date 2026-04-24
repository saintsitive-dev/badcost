# Features

This document describes all features of **BadCost**, grouped by area.

---

## 1. Player Management

**Location:** Players tab (`/players`)

| # | Feature | Detail |
|---|---|---|
| 1.1 | View total player count | Shown in the page subtitle ("ทั้งหมด N คน") |
| 1.2 | Add a player | Input supports Thai and English names; leading/trailing whitespace is trimmed automatically |
| 1.3 | Delete a player | Tap ✕ on the player pill; confirms before deletion |
| 1.4 | Favourite a player | Tap ⭐/☆ on the pill to toggle favourite status |
| 1.5 | Favourites shown first | Favourited players appear at the top, sorted alphabetically; the rest follow in Thai locale order |
| 1.6 | **Duplicate-name prevention (suggestion dropdown)** | While typing in any add-player input, a dropdown appears below showing existing players whose names contain the typed text (case-insensitive, substring match). If the typed name is an **exact match** (case-insensitive, after trim) to an existing player, the "เพิ่ม" button is **disabled** and an inline error "ชื่อนี้มีอยู่แล้ว" is shown. Partial suggestions are informational only. |

**Persistence:** All player data is stored in `localStorage` under key `badcost_players`.

### Suggestion Dropdown — Detail (Feature 1.6)

- **Trigger:** any keystroke that leaves the trimmed query non-empty (≥ 1 character).
- **Matching logic:** `findSimilarPlayers(players, query)` — substring match, case-insensitive. This is a **pure domain function** in `managePlayers.ts`.
- **Display:** up to 5 suggestions shown. Each row shows the player's name (and ⭐ if a favourite).
- **Exact-match block:** if `players.some(p => p.name.toLowerCase() === query.toLowerCase())` → "เพิ่ม" button disabled, error shown.
- **Partial-match info:** partial suggestions appear in the dropdown but do not block creation.
- **Dismiss:** dropdown closes when the input is cleared or loses focus (onBlur with a short delay to allow clicks inside the dropdown).
- **Applies to:** PlayersPage add form **and** the inline add form in NewEventPage (Feature 2.8).

---

## 2. Event Creation

**Location:** New Event tab (`/new`)

| # | Feature | Detail |
|---|---|---|
| 2.1 | Set event date & time | Defaults to "now"; editable via a datetime-local picker |
| 2.2 | Select players | Checkbox list; tap player name or checkbox to toggle |
| 2.3 | Select all players | "เลือกทั้งหมด" button selects all registered players |
| 2.4 | Set hours per player | Each selected player has a stepper (−/+); minimum 1 hour |
| 2.5 | Bulk-set hours | Quick-tap buttons (1–4 hrs) or stepper apply the same hour count to all currently selected players |
| 2.6 | Start the event | "เริ่มเกม (N คน) →" button; disabled until at least one player is selected |
| 2.7 | Favourites shown first | Player list mirrors the order from the Players tab |
| 2.8 | **Add player on-the-spot** | A "+Player" button below the player list expands an inline add-player form. The host types a name (with duplicate prevention — see Feature 1.6), taps "เพิ่ม", and the new player is created via the same `addPlayer()` use case and **automatically selected** for the current event at the current `bulkHours` setting. The form collapses after a successful add. |

**Persistence:** A `GameEvent` record is saved to `localStorage` on "Start".

### Inline Add Player — Detail (Feature 2.8)

- Reuses `addPlayer()` from `managePlayers.ts` — no new domain logic for creation.
- Reuses `findSimilarPlayers()` for the suggestion dropdown — same behaviour as Feature 1.6.
- The new player is persisted to `badcost_players` via `PlayersContext.add()` before being auto-selected into the event.
- If the typed name exactly matches an existing player (case-insensitive), the "เพิ่ม" button is **disabled** and an error "ชื่อนี้มีอยู่แล้ว" is shown — creation is blocked.
- The "+Player" button label changes to "✕ ยกเลิก" while the form is open.

---

## 3. Cost Entry (Event Page)

**Location:** `/event/:id`

### 3.1 Play Hours (per player)

- Each player's hours can be adjusted after the event starts.
- Stepper controls (−/+), minimum 1 hour.

### 3.2 Court Cost (AC6)

| Input | Description |
|---|---|
| Cost per court per hour | Price in Thai Baht |
| Number of courts | Stepper, minimum 1 |
| Per-hour court count override | Toggle; allows specifying a different court count per hour slot |

- A summary hint shows total court cost per hour (e.g. "💡 รวม 600 บาทต่อชม.").
- A live breakdown shows each player's court share once the cost is entered.

### 3.3 Shuttlecock Cost (AC7)

| Input | Description |
|---|---|
| Cost per shuttlecock | Price in Thai Baht |
| Total shuttlecocks used | Total count for the session |
| Per-hour shuttlecock count | Toggle; allows specifying how many shuttlecocks were used each hour |

- If no per-hour data is provided, cost is split equally among all players.
- If per-hour data is provided, shuttlecock cost follows the last-N hours model.
- A live breakdown shows each player's shuttlecock share.

### 3.4 Organiser Fee (AC8)

| Input | Description |
|---|---|
| Total organiser fee | Flat amount; split equally among all players (ceil) |

- Preview shows the per-person share.

### 3.5 Live Cost Summary

- Real-time preview of each player's total with a breakdown (court + shuttlecock + organiser).
- Updates immediately on any input change.

---

## 4. Results Page

**Location:** `/event/:id/result`

| # | Feature | Detail |
|---|---|---|
| 4.1 | Grand total | Displayed prominently at the top |
| 4.2 | Per-player result cards | Sorted by total (highest first); shows rank, name, hours, total |
| 4.3 | Expandable cost breakdown | Tap a player card to see court / shuttlecock / organiser split |
| 4.4 | Edit button | Returns to the event cost entry page |
| 4.5 | Share to LINE | Copies a formatted text summary to the clipboard (see below) |

### Share Text Format (AC12)

```
🏸 สรุปค่าแบด
📅 <Thai date>

1. P'Ning 190 (3hrs)
2. Mon 190 (3hrs)
3. โจโจ้ 113 (2hrs)

💰 รวม: 493 บาท
```

---

## 5. History

**Location:** History tab (`/history`)

| # | Feature | Detail |
|---|---|---|
| 5.1 | List all events | Sorted by most recent; shows date, player count, and status badge |
| 5.2 | Status badge | "✓ เสร็จแล้ว" (finalised) or "● กำลังดำเนินการ" (in progress) |
| 5.3 | Open event | Tap the card to navigate to the result (if finalised) or cost entry page |
| 5.4 | Edit event | "✏️ แก้ไข" footer button navigates to the cost entry page |
| 5.5 | Delete event | "🗑 ลบ" footer button; confirms before deletion |

---

## 6. Settings & Backup

**Location:** Settings tab (`/settings`)

| # | Feature | Detail |
|---|---|---|
| 6.1 | Stats dashboard | Shows total player count and total event count |
| 6.2 | Export backup | Downloads a `badcost-backup-YYYY-MM-DD.json` file containing all players and events |
| 6.3 | Import backup | Upload a previously exported JSON file; replaces current data after confirmation |
| 6.4 | Google Drive guidance | UI reminds user to save the exported file to Google Drive for cloud backup |

**Backup file format:**

```json
{
  "version": 1,
  "exportedAt": "2024-01-15T10:00:00.000Z",
  "players": [ /* Player[] */ ],
  "events":  [ /* GameEvent[] */ ]
}
```

---

## 7. PWA & Offline

| # | Feature | Detail |
|---|---|---|
| 7.1 | Installable | Add-to-home-screen banner shown on first visit (iOS / Android / desktop) |
| 7.2 | Offline support | Service worker caches the app shell; works without a network connection |
| 7.3 | No backend required | All data lives in `localStorage`; no server needed |

---

## 8. Cost Calculation Engine

### Rounding Rule (AC10)

All per-player shares are rounded **up** (ceiling) to the nearest integer before being aggregated into the final total. This prevents players from paying less than their fair share due to floating-point division.

### "Last-N Hours" Participation Model

Given a session of `maxH` total hours:

- A player who plays **H hours** participates in hours `(maxH - H + 1)` through `maxH` (the **last** H hours of the session).
- For each hour slot, only eligible players contribute to that slot's cost.

**Example** (3-hour session, 1 late joiner):

| Player | Hours | Eligible for hour 1? | Eligible for hour 2? | Eligible for hour 3? |
|---|---|---|---|---|
| P'Ning | 3 | ✅ | ✅ | ✅ |
| Mon | 3 | ✅ | ✅ | ✅ |
| โจโจ้ (late) | 1 | ❌ | ❌ | ✅ |

This model applies to both court costs and shuttlecock costs (when per-hour data is provided).
