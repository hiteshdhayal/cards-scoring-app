# Card Scorekeeper — Redesign & Performance Plan

Status: **plan only — nothing below is built yet.** Review, answer the questions in §9, and I'll build it.

---

## 1. Health check of the live site (done 15 Nov 2026)

I tested https://cards-scoring-app.vercel.app end to end with a throwaway game (deleted afterwards).

| Check | Result |
| --- | --- |
| Home page loads | ✅ 200, served from Vercel's CDN cache |
| Create game | ✅ works, but **3.4 s** |
| Read game state (polled every 3 s) | ✅ correct, but **~0.87 s every time** |
| Add a bid | ✅ correct (+12, total 12), **0.43 s** |
| Winner detection (target 10) | ✅ "winner" shown at 12 ≥ 10 |
| Flip to missed | ✅ total became −12, winner cleared, 0.39 s |
| Delete entry | ✅ 0.47 s |
| Unknown game code | ✅ returns 404 (but the UI doesn't handle it, see bug B3) |

**Verdict: the server is working correctly. Every number is right. The problem is speed and feel, not correctness.**

---

## 2. Why the app doesn't feel smooth (root causes, ranked)

### R1 — The API runs in the USA while the database is in Singapore (biggest cause)
The response header `x-vercel-id: iad1::iad1` shows your API functions run in **Washington DC (iad1)**, which is Vercel's default region. Your Neon database is in **Singapore (ap-southeast-1)**. Every SQL query crosses the Pacific and back (~250 ms; I measured 247 ms for a bare `select 1`).

- Reading a game = 3 queries **in sequence** → ~0.75 s of pure travel time. That matches the 0.87 s I measured.
- Creating a game = 1 + 4 inserts in sequence → 5 round trips, plus a cold start → 3.4 s.
- You're in India, so your phone → US → Singapore → US → phone. The data travels around the world twice for every tap.

### R2 — No optimistic UI: every tap waits for two network trips
Tapping "Add" waits for the write (~0.4 s), **then** a full re-read (~0.9 s), and only then does the chip appear. That's about **1.3 s of nothing happening** after every tap. Native iOS apps update on the same frame you lift your finger.

### R3 — Polling races cause flicker
Polling every 3 s is not coordinated with your taps. A poll that started *before* your tap can arrive *after* it and briefly put back the old state (the chip flips back, then forward again). Rapid taps on the same chip read stale data, so the second tap is lost.

### R4 — "Double-tap to delete" is broken on phones
On touch screens, a double-tap fires **two taps first** (flip → flip back) and then the delete. iOS Safari often doesn't fire double-tap events at all. So it flickers and sometimes doesn't work.

### R5 — The database falls asleep
Neon's free plan suspends the database after ~5 minutes idle. The first request after that takes an extra 0.5–1 s+ to wake it. You can't turn this off on the free plan, but the app can hide it with skeleton loading and a warm-up ping.

### R6 — Wasteful polling
- Polling continues when the phone is locked or the tab is in the background, which wastes battery and data.
- When you come back, you see stale data for up to 3 s.
- Slow requests (cold starts) can pile up on top of each other because there's no "skip if one is already in flight".
- Every poll replaces the whole state, even when nothing changed, so the whole screen re-renders.

### R7 — No press feedback
Buttons have no pressed state and show nothing while waiting, so a tap feels "dead". You can also tap **Start game** twice and create two games.

**Expected result after the fixes:** taps feel instant (0 ms visual response). Server round trips drop from ~0.9 s to ~0.05–0.15 s from India. Other phones sync within ~2 s.

---

## 3. Bugs found during the review (will be fixed as part of the build)

| # | Bug | Fix |
| --- | --- | --- |
| B1 | Double-tap delete flips the chip twice and is unreliable on iOS | Replace with an action sheet (tap the chip → "Mark Missed / Delete / Cancel") |
| B2 | Tapping **Start game** twice creates duplicate games | Disable while pending; show a spinner in the button |
| B3 | Joining a wrong code shows "Loading game #X…" **forever** | Handle 404: "No game with code X" message, back to Home |
| B4 | If a saved game was deleted, the app is stuck on loading at launch | Same 404 handling: clear the saved code |
| B5 | Target field uses `defaultValue`, so other phones never see target changes | Controlled field synced from server; edited in a sheet with a stepper |
| B6 | You can start a game with 0 or 1 players (all names blank) | Require ≥ 2 names; the Start button stays disabled until valid |
| B7 | `maximumScale: 1` blocks pinch-zoom (an accessibility problem) | Remove it; prevent accidental zoom with `touch-action: manipulation` + 16 px inputs instead |
| B8 | Leftover template file `app/page.module.css` is unused | Delete |

---

## 4. Design direction — "feels like an Apple app"

Based on Apple's Human Interface Guidelines (iOS look on iPhone, still clean on Android).

### 4.1 Visual language
- **Font:** the system font stack (`-apple-system, "SF Pro Text", "SF Pro Display", system-ui`). That's real San Francisco on iPhone and Roboto on Android. Scores use **tabular numerals** so digits don't jiggle when they change.
- **Type scale (iOS):** Large Title 34/41 bold · Title 2 22 · Headline 17 semibold · Body 17 · Subhead 15 · Footnote 13 · Caption 12. Scores use 34–40 pt rounded-weight numbers (`ui-rounded` → SF Pro Rounded on iOS).
- **Layout:** iOS **inset-grouped** style, like the Settings app: grey background, white rounded cards, 16 pt side margins, 4 pt spacing grid.
- **Corners:** cards 22 px, buttons 14 px, pill buttons and chips fully round, bottom sheets 28 px top corners.
- **Touch targets:** every tappable thing ≥ 44 × 44 pt.
- **Materials:** a translucent, blurred top bar (`backdrop-filter: saturate(180%) blur(20px)`). Like iOS, it shows a big "Large Title" that shrinks into the bar as you scroll.
- **Icons:** inline SVG in the SF Symbols style (plus, crown, trophy, share, xmark, chevron). No emoji in the UI chrome.

### 4.2 Colour (iOS system colours, automatic Light & Dark mode)

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `#F2F2F7` | `#000000` | page background |
| `--card` | `#FFFFFF` | `#1C1C1E` | cards, sheets |
| `--card-2` | `#F2F2F7` | `#2C2C2E` | keys, inputs inside cards |
| `--label` | `#000000` | `#FFFFFF` | primary text |
| `--label-2` | `rgba(60,60,67,.6)` | `rgba(235,235,245,.6)` | secondary text |
| `--separator` | `rgba(60,60,67,.29)` | `rgba(84,84,88,.65)` | hairlines |
| `--blue` (accent) | `#007AFF` | `#0A84FF` | primary buttons, links |
| `--green` (made) | `#34C759` | `#30D158` | +points |
| `--red` (missed) | `#FF3B30` | `#FF453A` | −points, destructive |
| `--orange` (leader) | `#FF9500` | `#FF9F0A` | crown, leader highlight |
| Player colours | Blue · Purple `#AF52DE` · Pink `#FF2D55` · Teal `#30B0C7` | dark variants | avatar circles, progress bars |

The theme follows the phone's Light/Dark setting automatically.

### 4.3 Motion & feel
- **Press feedback:** everything tappable shrinks to 97% while pressed and springs back (≈ 120 ms).
- **iOS curve** for sheets and transitions: `cubic-bezier(0.32, 0.72, 0, 1)`, 350–450 ms.
- **Bottom sheets** slide up, dim the background, and close by swiping down, tapping the backdrop, or pressing ✕.
- **Score changes:** the total does a quick "number roll" and briefly glows green or red.
- **List changes:** new chips pop in (scale 0.6 → 1). Deleted chips shrink out. When ranking changes, rows slide to their new position (FLIP animation).
- **Haptics:** a light vibration on add, flip, and delete where the phone supports it (Android). iOS Safari doesn't allow web vibration, but iOS switches get native haptics through Safari's `switch` control.
- **Respects "Reduce Motion":** animations become simple fades when that setting is on.
- **No layout jumps:** skeleton placeholders while loading, and fixed heights for score rows.

### 4.4 Controls ("better rounded toggles")
- **iOS Switch** (51 × 31, green when on) for "Play to a target score".
- **iOS Segmented Control** (pill track with a sliding white thumb) for **Made / Missed** and for **New Game / Join** on the home screen.
- **iOS Stepper** (− / + pill) for the target score, defaulting to 31.
- **Number keypad grid** of big round keys for bids, so you never need the phone keyboard to add a score.
- **Action Sheet** (iOS-style stacked buttons + separate Cancel) for chip actions and "Leave game?".
- **Toast / banner** ("Code copied", "Couldn't save — retrying", "Offline — reconnecting…").

---

## 5. Screens (mobile-first, then scaled up for tablet/desktop)

### 5.1 Home
```
┌──────────────────────────────┐
│ Scorekeeper          (Large) │
│ ┌──────────┬───────────────┐ │
│ │ New Game │     Join      │ │  ← segmented control
│ └──────────┴───────────────┘ │
│  PLAYERS                     │
│ ┌──────────────────────────┐ │
│ │ (H) Hitesh               │ │  ← coloured initial avatar
│ │ (M) Man                  │ │
│ │ (P) Player 3             │ │
│ │ (P) Player 4             │ │
│ └──────────────────────────┘ │
│  GAME                        │
│ ┌──────────────────────────┐ │
│ │ Target score      [ ●  ] │ │  ← iOS switch
│ │ Play to         [ − 31 + ]│ │  ← stepper, shown when switch on
│ └──────────────────────────┘ │
│  RECENT                      │
│ ┌──────────────────────────┐ │
│ │ Game 14 · H, M, P, A   › │ │  ← resume from this phone's history
│ └──────────────────────────┘ │
│ ╭──────────────────────────╮ │
│ │       Start Game         │ │  ← pinned above the home indicator
│ ╰──────────────────────────╯ │
└──────────────────────────────┘
```
- **Join tab:** one big code field (large digits, numeric keypad, auto-focus) and a Join button. Supports links like `?code=14`: opening a shared link joins straight away.
- Names auto-capitalise. Return moves to the next field.

### 5.2 Scoreboard (the main screen)
```
┌──────────────────────────────┐
│ ‹ Leave   Game 14  [Share ⇪] │  ← translucent blurred bar
│ Scoreboard           (Large) │
│ Target 31 · ● Live           │  ← live-sync dot
│ ┌──────────────────────────┐ │
│ │ (H) Hitesh   👑       24 │ │  ← big rounded tabular total
│ │ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░  77%    │ │  ← progress to target
│ │ (+5)(+4)(−3)(+6)(+12)  › │ │  ← chips, scroll sideways
│ ├──────────────────────────┤ │
│ │ (M) Man                18 │ │
│ │ ...                       │ │
│ └──────────────────────────┘ │
│ ╭──────────────╮╭──────────╮ │
│ │  + Add Round ││Standings │ │  ← bottom action bar
│ ╰──────────────╯╰──────────╯ │
└──────────────────────────────┘
```
- **Tap a player row → "Add bid" sheet** (§5.3).
- **Tap a chip → action sheet:** "Mark as Missed" (or "Mark as Made"), "Delete" in red, and "Cancel". This replaces the broken double-tap.
- **Share button:** opens the phone's share menu (WhatsApp etc.) with the link `…/?code=14`. On laptops it copies the link and shows a "Copied" toast.
- **Target** is tappable and opens a small sheet with the stepper and switch, synced to all phones.
- **Live dot:** green = synced, amber = reconnecting, grey = offline.
- **Leaving** asks first with an action sheet ("Leave this game? You can rejoin with code 14.").

### 5.3 Add bid sheet (one player)
```
┌──────────────────────────────┐
│            ───               │  ← grab handle
│ Add for Hitesh            ✕  │
│ ┌────────────┬─────────────┐ │
│ │  ● Made    │   Missed    │ │  ← segmented, default Made
│ └────────────┴─────────────┘ │
│   ( 1 )  ( 2 )  ( 3 )  ( 4 ) │
│   ( 5 )  ( 6 )  ( 7 )  ( 8 ) │  ← big round keys; one tap adds
│   ( 9 )  (10 )  (11 )  (12 ) │     and closes the sheet
│   (13 )  [ other… ]          │
└──────────────────────────────┘
```
One tap on a number adds the entry instantly (optimistic) and closes the sheet. "Other…" opens a numeric field for unusual values.

### 5.4 Add Round sheet (all 4 players at once) — recommended
For each player row: name, bid stepper/keys, and a Made/Missed segmented control. Then **Save Round**. This matches how the game is really played (everyone bids each round) and needs 4–8 taps instead of 4 separate sheets. See question Q1.

### 5.5 Standings sheet (replaces the "Total" pop-up)
A ranked list 1–4 with a crown for 1st, gold/silver/bronze rank badges, each total, and "−6 behind leader". If there's a winner, a trophy header is shown.

### 5.6 Winner moment
When someone reaches the target: a full-screen celebration card ("Hitesh wins! 🏆 33 points") with a light confetti burst (small, dependency-free canvas). Buttons: **Keep Playing** / **New Game**. It shows once per game per phone, and the banner stays on the scoreboard afterwards.

### 5.7 Bigger screens
Max content width 560 px, centred. On tablets the player cards form a 2 × 2 grid. Sheets become centred dialogs on screens wider than 700 px.

---

## 6. Performance & architecture changes (the "smoothness" fix)

### P1 — Move the API next to the database (fixes R1)
Add `vercel.json` with `{ "regions": ["sin1"] }` (Singapore). The route-level `preferredRegion` option is **deprecated in this Next.js version (16.4)**, so the region is set at the project level. You can also set it in Vercel → Project → Settings → Functions → Region. Expected per-query time: ~250 ms → ~5 ms.

### P2 — Fewer database round trips
- **Read state:** run the 3 queries in a single Neon HTTP round trip (`sql.transaction([...])`, read-only) instead of 3 sequential ones.
- **Create game:** insert the game and all players in **one** statement (CTE + `unnest`) instead of 5.
- **Every write returns the full new game state**, so the client never needs a follow-up read. One round trip per tap.
- **New endpoint:** `POST /api/games/{id}/rounds` adds up to 4 entries in one statement (for "Add Round").

### P3 — Optimistic updates (fixes R2)
A small client store (`lib/useGame.ts`) does the following:
1. Applies the change to the screen **immediately**: new chip, flipped chip, removed chip, and recomputed totals, ranking and winner. It uses the same scoring function as the server (`lib/score.ts`, shared code).
2. Sends the request in the background. New entries get a temporary ID until the server confirms.
3. On success, uses the server state from the response. On failure, rolls back and shows a toast ("Couldn't save — tap to retry").

### P4 — Race-free, battery-friendly sync (fixes R3, R6)
- A **sequence guard**: any poll that started before the latest change is ignored, so there's no more flicker.
- No new poll starts while one is in flight. In-flight polls are cancelled (AbortController) when you make a change.
- **Pauses when hidden or locked** and refreshes immediately when you come back (`visibilitychange` / `focus` / `online`).
- Polls every 2 s while visible.
- **Skips re-rendering when nothing changed.** The server sends a cheap `version` (latest change time + entry count). If it's unchanged, the client does nothing.

### P5 — Hide the database cold start (R5)
- A skeleton scoreboard instead of "Loading…".
- A warm-up ping (`GET /api/health` → `select 1`) when the Home screen opens, so the database is awake by the time you tap Start.

### P6 — Instant app shell
The page is already served statically from the CDN (confirmed: `x-vercel-cache: HIT`). That stays as is. All components remain lightweight, with **no new UI libraries**: plain CSS + React only, so the download stays small.

### P7 — Install as an app (feels native)
- Web app manifest (`app/manifest.ts`) + Apple touch icon + `apple-mobile-web-app-capable`, so it can be **added to the Home Screen** and opens full-screen without the browser bar.
- `viewport-fit=cover` + `env(safe-area-inset-*)` padding around the notch and home indicator.
- `theme-color` for both Light and Dark mode.
- `overscroll-behavior: none` so sheets don't drag the page behind them.
- `touch-action: manipulation` so taps are instant with no 300 ms zoom delay.

### P8 — Small hardening (same scope, low effort)
- Validate inputs on the server (bid is an integer 1–99, `made` is a boolean, names ≤ 20 characters, player count per Q3).
- Entry edits/deletes check that the entry belongs to that game (`/api/games/{id}/entries/{entryId}`).
- Return proper 400/404 errors that the UI shows politely.

---

## 7. File structure after the build

```
app/
  layout.tsx                 viewport-fit, theme colours, Apple web-app meta
  manifest.ts                Add-to-Home-Screen manifest (new)
  apple-icon.png, icon.png   app icons (new, generated SVG→PNG)
  globals.css                design tokens (light/dark) + base + components, sectioned
  page.tsx                   thin: picks Home or Game screen
  api/
    health/route.ts                           GET warm-up (new)
    games/route.ts                            POST create (1 query)
    games/[id]/route.ts                       GET state (1 round trip), PATCH target
    games/[id]/entries/route.ts               POST add one → returns state
    games/[id]/entries/[entryId]/route.ts     PATCH flip / DELETE → returns state (moved)
    games/[id]/rounds/route.ts                POST add a round → returns state (new)
components/
  HomeScreen.tsx  GameScreen.tsx  PlayerCard.tsx  EntryChip.tsx
  AddBidSheet.tsx  AddRoundSheet.tsx  StandingsSheet.tsx  TargetSheet.tsx
  WinnerCelebration.tsx  ActionSheet.tsx
  ui/ Sheet.tsx  SegmentedControl.tsx  Switch.tsx  Stepper.tsx  Keypad.tsx
      Button.tsx  Toast.tsx  Avatar.tsx  Icon.tsx  AnimatedNumber.tsx
lib/
  db.ts            Neon client (unchanged)
  game-state.ts    shared server query: load full state in one round trip
  score.ts         totals / ranking / winner (shared by server + optimistic client)
  useGame.ts       store: polling, sequence guard, optimistic mutations
  api.ts           typed fetch helpers
  haptics.ts       vibrate-if-supported
  recent.ts        "Recent games" in localStorage
vercel.json        { "regions": ["sin1"] }
```
Removed: `app/api/entries/[id]/route.ts` (moved under the game), `app/page.module.css`.

**Database:** no destructive changes. If you choose round grouping (Q1), I'll add one nullable column: `alter table entries add column round integer;`. Your existing games keep working.

---

## 8. Build order & verification

1. **Speed first (no visual change yet):** `vercel.json` region, batched queries, writes return state, health endpoint. Measure live latency before and after.
2. **Client store:** `useGame` with optimistic updates, sequence guard, visibility-aware polling.
3. **Design system:** tokens, light/dark, and UI primitives (Sheet, Segmented, Switch, Stepper, Keypad, Toast, Button).
4. **Screens:** Home → Scoreboard → Add Bid → chip Action Sheet → Standings → Target → Add Round → Winner.
5. **Add to Home Screen:** manifest, icons, safe areas.
6. **Bug fixes** B1–B8 (most are fixed along the way).
7. **Testing:**
   - Playwright on **iPhone 15** and **Pixel 7** emulation, in Light and Dark mode. I'll send you screenshots of every screen.
   - Scripted flow: create → add → flip → delete → round → reach target → winner → leave → rejoin by link → wrong code.
   - Two-browser sync test: a change on phone A appears on phone B within ~2 s, with no flicker.
   - Rapid-tap test (10 taps in 1 s on one chip ends in the correct state).
   - Type check, lint, and production build.
8. **Ship:** commit and push to the branch. You redeploy on Vercel (or merge), then I re-test the live URL and report the new timings.

---

## 9. Decisions I need from you

- **Q1 — Add Round sheet** (enter all 4 bids for a round at once, chips grouped by round)? *Recommended: yes.* It needs the one-column database change in §7, which I'll give you as a single SQL line to run.
- **Q2 — Bid range on the keypad:** 1–13 (standard Call Break hand)? *Recommended: 1–13 + "Other…".*
- **Q3 — Player count:** keep it fixed at 4, or allow 2–6? *Recommended: 2–6 (4 by default).*
- **Q4 — Vercel region:** OK to move the API to **Singapore (sin1)**? *Strongly recommended.* It's the single biggest speed win.
- **Q5 — Confetti** on win: yes/no? *Recommended: yes, subtle.*
