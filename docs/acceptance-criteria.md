# Acceptance Criteria

This document lists all acceptance criteria (AC1–AC12) for **BadCost**, along with implementation notes describing how each criterion is satisfied in the codebase.

---

## Managing Players & Events

### AC1 — View player count
> As a badminton host, I can see how many badminton players have been recorded in this application.

**Implementation:** `PlayersPage` shows the total count in the page subtitle ("ทั้งหมด N คน"). The count reflects all players stored in `localStorage`.

---

### AC2 — Add players (Thai & English)
> As a badminton host, I can put badminton players' names; Thai and English are supported.

**Implementation:**
- `managePlayers.addPlayer()` trims whitespace and rejects empty names.
- The input placeholder reads "ชื่อผู้เล่น (ไทย / English)".
- Sorting uses Thai locale (`localeCompare('th')`) so Thai names sort correctly.

---

### AC3 — Delete a player
> As a badminton host, I can delete a badminton player's name.

**Implementation:**
- `managePlayers.deletePlayer()` filters the player out by ID.
- `PlayersPage` shows a ✕ button on each player pill; tapping it prompts for confirmation.

---

### AC4 — Favourite players
> As a badminton host, I can favourite players so I can see them first next time I open the app.

**Implementation:**
- `managePlayers.toggleFavorite()` flips the `isFavorite` flag.
- `managePlayers.sortPlayers()` places favourited players at the top of the list.
- Favourite status is persisted in `localStorage` and restored on reload.

---

### AC5 — Select players for a new event
> As a badminton host, I can select players to include in the game calculation, set today's date and time on click "Start".

**Implementation:**
- `NewEventPage` shows all players sorted by favourite status.
- Per-player hours are set individually or bulk-updated.
- The datetime picker defaults to "now" (current local date/time).
- Clicking "เริ่มเกม →" calls `createEvent()` and saves to `localStorage`, then navigates to the event page.

---

## Managing Costs

### AC6 — Court cost per player
> As a badminton host who pays for the court, I can put how much the court costs per hour, and how many hours each player plays. I can see how much each player owes for the court.

**Implementation:**
- Inputs: cost per court per hour, number of courts (stepper), optional per-hour court count override.
- `calculateCourtCost()` uses the **last-N hours** model: each player pays only for the hours they were present.
- A live breakdown is shown on the event page.

**Use case:** `src/domain/usecases/calculateCourtCost.ts`

---

### AC7 — Shuttlecock cost per player
> As a badminton host who pays for shuttlecocks, I can put the cost per shuttlecock and how many were used. If specified, I can break down shuttlecock usage by hour-tier; otherwise, cost is split equally.

**Implementation:**
- Inputs: cost per unit, total used, optional per-hour usage toggle.
- `calculateShuttlecockCost()` checks whether any per-hour data exists:
  - **With per-hour data:** applies the last-N hours model identical to court costs.
  - **Without per-hour data:** splits total cost equally among all players (ceil per player).

**Use case:** `src/domain/usecases/calculateShuttlecockCost.ts`

---

### AC8 — Organiser fee
> As a badminton host who organised the event, I can put an organiser fee; it is split equally. I can see each player's share.

**Implementation:**
- Input: total organiser fee.
- `calculateOrganizerFee()` computes `ceil(fee / totalPlayers)` per player.
- A preview of the per-person amount is shown on the event page.

**Use case:** `src/domain/usecases/calculateOrganizerFee.ts`

---

### AC9 — Host can also play
> The badminton host can also play, and their cost is shared normally like other players.

**Implementation:**
- The host selects themselves as one of the players in `NewEventPage`.
- No special treatment — the host's player ID is included in all calculations identically to any other participant.

---

### AC10 — Round up (ceiling) all floats
> All float values are rounded up to integer before the next calculation step.

**Implementation:**
- `calculateCourtCost()`: `Math.ceil(rawCost)` applied per player after accumulation.
- `calculateShuttlecockCost()`: `Math.ceil(rawCost)` applied per player.
- `calculateOrganizerFee()`: `Math.ceil(fee / playerCount)` per player.
- `calculateTotalCost()`: totals are a simple integer sum of the already-ceiled components.

---

### AC11 — Final total = court + shuttlecock + organiser
> Final calculation for each player = AC6 + AC7 + AC8.

**Implementation:**
- `calculateTotalCost()` sums the three ceiled components for each player.
- Results are sorted by `total` descending.

**Use case:** `src/domain/usecases/calculateTotalCost.ts`

---

### AC12 — Share as text for LINE
> As a badminton host, I can share calculation results as text summarising how much each player owes.

**Expected format:**
```
🏸 สรุปค่าแบด
📅 <Thai formatted date>

1. P'Ning 190 (3hrs)
2. Mon 190 (3hrs)
3. โจโจ้ 113 (2hrs)

💰 รวม: 493 บาท
```

**Implementation:**
- `formatShareText()` produces the text above.
- `ResultPage` has a "📋 Copy สำหรับ LINE" button that writes the text to the clipboard via `navigator.clipboard.writeText()` with a `document.execCommand('copy')` fallback for older browsers.
- The button shows "✓ คัดลอกแล้ว!" for 2.5 seconds after a successful copy.

**Use case:** `src/domain/usecases/formatShareText.ts`

---

## New Features (AC13–AC14)

### AC13 — Add player on-the-spot during event creation
> As a badminton host who forgot to add someone, I can add a new player directly from the New Event page without navigating away; the new player is automatically selected for the current event.

**Behaviour:**
1. A "+Player" button is visible below the player list on `NewEventPage`.
2. Tapping it reveals an inline add-player form (name input + เพิ่ม button).
3. The same duplicate-prevention rules from AC14 apply to this form.
4. On successful add, the new player is persisted via `PlayersContext.add()` (calls `addPlayer()`) and automatically added to the selected set with the current `bulkHours` value.
5. The inline form collapses after a successful add.
6. The "+Player" button becomes "✕ ยกเลิก" while the form is open.

**Use cases reused:** `managePlayers.addPlayer()`, `managePlayers.findSimilarPlayers()`  
**No new domain logic** — AC13 is purely a presentation-layer feature that wires existing use cases.

---

### AC14 — Duplicate player name prevention (suggestion dropdown)
> As a badminton host, when I type a player name in any add-player input, I see a dropdown of existing players with similar names, and I am blocked from creating an exact duplicate.

**Behaviour:**
1. While the add-player input contains ≥ 1 character (trimmed), `findSimilarPlayers(allPlayers, query)` is called.
2. Up to 5 matching players are shown in a dropdown below the input (substring, case-insensitive).
3. If the trimmed query is an **exact match** (case-insensitive) to any existing player name:
   - The "เพิ่ม" button is **disabled**.
   - An inline error "ชื่อนี้มีอยู่แล้ว" is displayed.
4. Partial matches are informational — they display in the dropdown but do not block creation.
5. The dropdown closes when the input is cleared or loses focus.

**Applies to:** PlayersPage add form **and** the inline form introduced in AC13.

**New domain function:** `findSimilarPlayers(players: Player[], query: string): Player[]`  
**Use case file:** `src/domain/usecases/managePlayers.ts`  
**Test file:** `src/domain/usecases/__tests__/managePlayers.test.ts`

