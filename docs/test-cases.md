# Test Cases

Unit tests for **BadCost** domain use cases live in `src/domain/usecases/__tests__/`.  
Run them with:

```bash
npm test
```

Tests use **Node.js built-in `node:test`** — no additional test framework is required.

---

## calculateCourtCost

**File:** `src/domain/usecases/__tests__/calculateCourtCost.test.ts`  
**Use case:** `src/domain/usecases/calculateCourtCost.ts`  
**AC:** AC6, AC10

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| CC-01 | Late joiner pays for last hour only | 16 players: 15 × 3hrs, 1 × 1hr; 3 courts @ 200/hr | Late joiner = 38 ฿; 3-hr player = 118 ฿ |
| CC-02 | All players same hours → equal split per hour | 3 players × 2hrs; 1 court @ 100/hr | Each = `ceil(200/3)` = 67 ฿ |
| CC-03 | 3-hr player pays more than 1-hr late joiner | 2 players: p1=3hrs, p2=1hr; 1 court @ 100/hr | `p1.total > p2.total` |
| CC-04 | Per-hour court count overrides `numCourts` | p1=3hrs, p2=2hrs, p3=1hr; courts by hour: {1:2, 2:1, 3:3} @ 100/hr | p3=100, p1=350 |
| CC-05 | Zero-court override produces no cost for that hour | p1=1hr; courts: {1:0}; numCourts=1 | p1=0 (override zero wins) |
| CC-06 | No override uses `numCourts` | p1=1hr; no override; numCourts=1 @ 100/hr | p1=100 |
| CC-07 | Empty player map returns empty object | `playerHours = {}` | `{}` |
| CC-08 | Rounds up (AC10) | 3 players × 1hr; 1 court @ 100/hr | Each = `ceil(100/3)` = 34 ฿ |

---

## calculateShuttlecockCost

**File:** `src/domain/usecases/__tests__/calculateShuttlecockCost.test.ts`  
**Use case:** `src/domain/usecases/calculateShuttlecockCost.ts`  
**AC:** AC7, AC10

### Equal Split (no per-hour data)

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| SC-01 | Splits equally when no per-hour data | 3 players × 2hrs; 6 shuttles @ 20/unit | Each = 40 ฿ |
| SC-02 | Rounds up (AC10) | 3 players; 5 shuttles @ 20/unit (total 100) | Each = `ceil(100/3)` = 34 ฿ |
| SC-03 | Empty player map returns empty object | `playerHours = {}` | `{}` |

### Per-Hour Split (last-N hours model)

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| SC-04 | Hour-1 shuttles paid by full-duration players only | 3 players: p1=3hrs, p2=2hrs, p3=1hr; 2 shuttles in hour 1 @ 10/unit | p1=20, p2=0, p3=0 |
| SC-05 | Last-hour shuttles shared by everyone | 3 players (same as SC-04); 3 shuttles in hour 3 @ 10/unit | p1=10, p2=10, p3=10 |
| SC-06 | 3-hr player pays most, late joiner pays least | 9 shuttles total (3 per hour) @ 10/unit | `p1 > p2 > p3` |
| SC-07 | Zero-count entries are ignored | Compare `{1:2, 2:0}` vs `{1:2}` | Results identical |

---

## calculateOrganizerFee

**File:** `src/domain/usecases/__tests__/calculateOrganizerFee.test.ts`  
**Use case:** `src/domain/usecases/calculateOrganizerFee.ts`  
**AC:** AC8, AC10

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| OF-01 | Splits equally when evenly divisible | Fee=300, 3 players | Each = 100 ฿ |
| OF-02 | Rounds up when not divisible (AC10) | Fee=100, 3 players | Each = `ceil(100/3)` = 34 ฿ |
| OF-03 | Empty player list returns empty object | Fee=500, `[]` | `{}` |
| OF-04 | Single player pays full fee | Fee=150, 1 player | p1 = 150 ฿ |

---

## calculateTotalCost

**File:** `src/domain/usecases/__tests__/calculateTotalCost.test.ts`  
**Use case:** `src/domain/usecases/calculateTotalCost.ts`  
**AC:** AC11

Players used in tests:

| ID | Name |
|---|---|
| p1 | P'Ning |
| p2 | Mon |
| p3 | โจโจ้ |

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| TC-01 | Sums all cost components (AC11) | p1: court=150 + shuttle=40 + org=0 | p1.total = 190 ฿ |
| TC-02 | Results sorted by total descending | Same as TC-01 | `result[0].total >= result[1].total >= result[2].total` |
| TC-03 | Uses player name from players array (Thai name) | playerId=p3 | `playerName = "โจโจ้"` |
| TC-04 | Missing cost entries default to 0 | p1 with no court/shuttle/org maps | p1.courtCost=0, p1.total=0 |

---

## formatShareText

**File:** `src/domain/usecases/__tests__/formatShareText.test.ts`  
**Use case:** `src/domain/usecases/formatShareText.ts`  
**AC:** AC12

Input breakdowns:

| Player | Hours | Court | Shuttlecock | Organiser | Total |
|---|---|---|---|---|---|
| P'Ning | 3 | 150 | 40 | 0 | 190 |
| Mon | 3 | 150 | 40 | 0 | 190 |
| โจโจ้ | 2 | 100 | 13 | 0 | 113 |

| Test ID | Description | Expected |
|---|---|---|
| FS-01 | Includes emoji header `🏸` | Text contains `🏸` |
| FS-02 | Includes date emoji `📅` | Text contains `📅` |
| FS-03 | Includes all player names | Text contains `P'Ning`, `Mon`, `โจโจ้` |
| FS-04 | Includes all totals | Text contains `190`, `113` |
| FS-05 | Includes hours in result lines | Text contains `3hrs`, `2hrs` |
| FS-06 | Includes grand total (190+190+113=493) | Text contains `493` |
| FS-07 | Numbered list starts with highest total | Line starting with `1.` contains `190` |

---

## managePlayers

**File:** `src/domain/usecases/__tests__/managePlayers.test.ts`  
**Use case:** `src/domain/usecases/managePlayers.ts`  
**AC:** AC1, AC2, AC3, AC4

### addPlayer

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| MP-01 | Adds player with trimmed name | `"  P'Ning  "` | name=`"P'Ning"`, isFavorite=false, id present |
| MP-02 | Throws on empty name | `"   "`, `""` | Error matching `/empty/i` |
| MP-03 | Appends to existing list | Existing: `[Mon]`, add `"โจโจ้"` | Length=2, last name=`"โจโจ้"` |

### deletePlayer

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| MP-04 | Removes player by ID | `[A, B]`, delete A | Length=1, remaining ID=B |
| MP-05 | No-op when ID not found | `[A]`, delete `"999"` | Length=1 |

### toggleFavorite

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| MP-06 | Sets isFavorite to true | Player with `isFavorite=false` | `isFavorite=true` |
| MP-07 | Sets isFavorite back to false | Player with `isFavorite=true` | `isFavorite=false` |

### sortPlayers

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| MP-08 | Favourites appear first | `[Mon (non-fav), P'Ning (fav)]` | P'Ning first |
| MP-09 | Non-favourites sorted alphabetically (Thai locale) | `[B, A]` | A first |

### findSimilarPlayers (AC14)

| Test ID | Description | Inputs | Expected |
|---|---|---|---|
| MP-10 | Returns empty array for empty query | `players=[Mon, P'Ning]`, `query=""` | `[]` |
| MP-11 | Returns empty array for whitespace-only query | `query="   "` | `[]` |
| MP-12 | Exact match (case-insensitive) is returned | `players=[Mon]`, `query="mon"` | `[Mon]` |
| MP-13 | Partial / substring match is returned | `players=[Mon, Monica]`, `query="mo"` | `[Mon, Monica]` |
| MP-14 | Case-insensitive substring match | `players=[P'Ning]`, `query="NING"` | `[P'Ning]` |
| MP-15 | Non-matching query returns empty array | `players=[Mon, P'Ning]`, `query="xyz"` | `[]` |
| MP-16 | Empty player list returns empty array | `players=[]`, `query="Mon"` | `[]` |
| MP-17 | Thai name partial match | `players=[โจโจ้, โจ]`, `query="โจ"` | both returned |
| MP-18 | Does not return player whose name does not contain query | `players=[Mon, P'Ning]`, `query="Mon"` | only `[Mon]` |

