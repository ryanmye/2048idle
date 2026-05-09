# Idle 2048 (Implementation + Handoff Spec)

## Development

- Install: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Test: `npm run test`
- Preview production build: `npm run preview`

This repository includes both:
- the playable app in `src/` (Vite + React + TypeScript + Zustand + Tailwind)
- the original design handoff reference files (`Idle 2048 Wireframes.html`, `app.jsx`, `screens.jsx`, `tweaks-panel.jsx`)

---

# Handoff: Idle 2048

## Overview
An idle/incremental game built around classic 4×4 2048. The player starts on a single manual board, earns points from merges, and uses those points to buy bots that play their own boards autonomously. Bots come in tiers (Common → Mythic), each running a different algorithm (random, greedy, minimax, expectimax, MCTS, n-tuple network, afterstate-TD). Achievement-based unlocks gate new bots, board slots, autorestart capacity, and currency. A radial research tree expands one ring per prestige reset; far-prestige rings unlock higher-dimensional boards (5×5 through 9×9). Two currencies: **points** (soft) and **prestige tokens** (hard).

## About the Design Files
The HTML/JSX files bundled here are **design references** — interactive wireframes built in HTML+React (via inline Babel) showing intended layout, content, copy, and interactions. They are **not production code to ship**. The task is to recreate these designs in the target codebase's existing framework (likely React/Next.js for web, but choose what's idiomatic) using its established patterns, design system, and state management. Use the JSX files as a structural reference and lift exact copy / data shapes from them.

## Fidelity
**Low-fidelity wireframes.** The aesthetic is a deliberate "cozy pastel whiteboard" sketch — hand-drawn fonts, dashed borders, slight rotations, sticky-note feel. This is **not the final visual style**. Treat the wireframes as a guide for:
- Layout, hierarchy, and information density
- Content, copy, and game mechanics
- Component composition and screen flow
- Interaction patterns (editable names, achievement tiles, gacha cards)

The shipped UI should adopt the target codebase's design system. Keep the cozy / playful tone if no system exists.

## Screens / Views

### 1 — Early Game
**Purpose:** First-time experience. The user plays one manual 4×4 board with arrow keys and earns their first points. The first bot (Random Walker) is locked behind reaching a 64 tile.
**Layout:** Two-column responsive flex. Left: editable board name, 4×4 board, on-screen arrow buttons, rage meter. Right: first-bot preview card (locked, with unlock condition), three additional locked bot rows, "how it works" tip card.
**Key behavior:** No bot is owned at game start — the first bot unlocks at 64. Click the board title to rename it.

### 2 — Mid Game
**Purpose:** Core gameplay loop with multiple boards running in parallel + a side shop.
**Layout:** Two-column. Left (2fr): "boards · 6 of 8" header, 3×2 grid of mini-boards (each with editable name + bot owner + moves/sec), production sparkline, "just unlocked" callout. Right (1fr): shop with category pills (bots/boards/restarts/boosts), buyable bot list, autorestart pool widget (42 / 100, regen + refill + cap-upgrade buttons).
**Key behavior:** Click any mini-board name to rename. Click a board to expand into the bot-detail screen. Autorestart cap is permanent — UI exposes both refill (consumable) and cap-increase (permanent) buttons.

### 3 — Late Game
**Purpose:** Many-boards-running view. Boards are abstracted into bar-chart cells grouped by "farm".
**Layout:** Two-column. Left (2fr): list of farms (each renamable; shows name, pts/s, bar-chart of boards, expand button, sparkline). Right (1fr): total output card, offline earnings card (notes how many autorestarts were drained while offline), prestige-ready card, rage-mode reminder.
**Key behavior:** Offline earnings = 35% of online points/sec, multiplied by time, capped/throttled by available autorestarts (which drain during offline calc).

### 4 — Bot Detail
**Purpose:** Inspect / upgrade a single bot.
**Layout:** Two-column. Left: gacha-style card (rarity badge, art slot, name, blurb, stat pills, "unlocked by" line). Right: 4 upgrade tracks (speed, look-ahead depth, merge bonus %, lucky tile) each with level bar + +1 cost button; current-board + lifetime stat boxes; fusion slot (3-of-same → next tier).

### 5 — Shop / Catalogue
**Purpose:** Full bot catalogue + autorestarts + extra board slots.
**Layout:** Top: category pills + currency display. Helper line: "unlock new bots by hitting in-game milestones — your bots count too!" Grid: auto-fill cards (min 190px) for all 12 bots with cost, rarity, unlock condition, owned/available/locked state. Bottom row: daily gacha pull, autorestart pool with both refill (+10/+50/+100) and permanent cap upgrades (cap → 125 / 150 / 200), extra board slot purchase.

### 6 — Research + Prestige
**Purpose:** Spend prestige tokens on a radial research tree; perform prestige resets.
**Layout:** Two-column. Left: SVG radial tree with central "core" node + 4 rings of nodes. Ring 1 (radius 80): basic upgrades. Ring 2 (radius 150): tier-II upgrades + fusion. Ring 3 (radius 200): includes 5×5, 6×6, 7×7 board nodes mixed with `?` nodes. Ring 4 (radius 250): 8×8 and 9×9 board nodes (only two — they're far-future). Outer dotted ring labeled "expand at next prestige →". Right: prestige progress card, "you keep" / "you lose" cards, "next expansion" preview, **"far-future branch: higher-dimensional boards — 5×5 (P7) → 6×6 (P9) → 7×7 (P12) → 8×8 (P16) → 9×9 (P20)"** card.
**Key behavior:** Each prestige expands the visible tree by one ring. Higher-dimensional boards (5×5–9×9) are gated by very high prestige levels (P7 onward).

### 7 — Stats & Achievements
**Purpose:** Lifetime stats + sortable achievement grid.
**Layout:** Top: 8 lifetime-stat tiles (total pts, boards finished, moves made, best tile, bots owned, prestiges, rage triggers, play time) + points/sec sparkline. Bottom: achievement grid `repeat(auto-fill, minmax(180px, 1fr))`. Each tile is colored by category (tile / score / life / moves / bot / board / meta / rage / hidden) with category label, achievement name, and `→ reward` line. **Sort: incomplete first, completed pushed to the bottom.** Hidden achievements show as `???`.

## Game Mechanics

### Currencies
- **⬢ points** — soft currency from every merge. Spent on bots, boards, autorestart refills, board slots, upgrades.
- **◆ prestige tokens** — hard currency. Earned at prestige reset. Spent on research tree nodes.

### Bot Catalogue (full)
Defined in `screens.jsx` as the `BOTS` array. Each: id, name, rarity, tier, mps, cost, algo, unlock, color, got-state.

| id | Name | Rarity | Tier | m/s | Cost | Algorithm | Unlock |
|---|---|---|---|---|---|---|---|
| rand | Random Walker | COMMON | 1 | 0.5 | 100 | uniform random direction | reach 64 tile |
| lu | Left-Up | COMMON | 1 | 1.0 | 850 | left, then up. always | reach 128 tile |
| corner | Corner | COMMON | 1 | 1.0 | 1.2k | anchors largest in corner | reach 256 tile |
| snake | Snake | UNCOMMON | 2 | 1.4 | 3.4k | snake-fills row by row | reach 512 tile |
| greedy | Greedy | UNCOMMON | 2 | 1.6 | 5.2k | max-merge each move | score 50,000 on one board |
| minmax2 | Minimax · d2 | RARE | 3 | 2.0 | 8.4k | looks 2 moves ahead | reach 1024 tile |
| minmax4 | Minimax · d4 | RARE | 3 | 2.4 | 24k | looks 4 moves ahead | reach 2048 tile |
| expecti | Expectimax | EPIC | 4 | 2.6 | 82k | weighted by spawn odds | reach 4096 tile |
| mcts | Monte Carlo | EPIC | 4 | 2.2 | 140k | simulates 200 rollouts/move | 10M total moves |
| ntuple | n-Tuple Network | LEGENDARY | 5 | 3.0 | 1.2M | trained pattern weights | reach 8192 tile |
| afterstate | Afterstate-TD | LEGENDARY | 5 | 3.4 | 8.4M | TD-learned value function | lifetime 1T points |
| myth | ??? | MYTHIC | 6 | ? | ? | ? | reach 16,384 tile · prestige 7+ (hidden) |

**No bot is owned at game start.** First playthrough requires reaching a 64 tile manually before any bot can be bought.

### Achievement System (full)
Defined as `ACHIEVEMENTS` array in `screens.jsx`. ~38 achievements across 9 categories. Each tracks completion (`got`), reward text, and category. Achievements unlock by player **OR** any bot.

Categories & sample rewards:
- **tile** (reach 32 → 16,384): unlock bots, +pts, +◆
- **score** (1k / 10k / 50k / 250k / 1M on one board): +pts, starter speed bonus, +◆, +10% all bot speed
- **life** (1M / 100M / 1B / 1T lifetime): +board slot, +offline rate, +◆ + autorestart cap, unlock bot
- **moves** (1k / 100k / 1M / 10M): +pts, +5 max autorestarts, +board slot, unlock bot
- **bot** (first bot, 5 bots, first fusion, all commons, all rares): +pts, +board slot, +◆, +speed
- **board** (3 running, 8 running, first 5×5, first 7×7): +autorestart cap, +5% global pts, +◆
- **meta** (first / 3 / 7 prestiges, 24h hands-off): research opens, +◆ per prestige, unlock 5×5 boards, +25% offline
- **rage** (first rage, 100 rages): +pts, +50% rage duration
- **hidden** (2 slots, `???`)

UI: tiles in a `repeat(auto-fill, minmax(180px, 1fr))` grid, colored by category, slight per-tile rotation, completed sorted to the bottom.

### Autorestart System
- **Max cap: 100** (starting). Pool regenerates 1 every 4 minutes up to cap.
- **Drains during offline calc** — when offline earnings are computed, autorestarts are spent for boards that filled. Offline UI shows "used X autorestarts · Y left".
- **Two purchase types:**
  - *Refill* (consumable): +10 / +50 / +100 for points
  - *Permanent cap upgrades*: cap → 125 (8k pts), cap → 150 (32k pts), cap → 200 (180k pts)
- Achievements can also bump the max (e.g. "100k moves → +5 max autorestarts").

### Higher-Dimensional Boards
Locked behind very high prestige and surfaced through the research tree's outer rings:
- 5×5 → unlocks at prestige 7 (ring 3)
- 6×6 → prestige 9 (ring 3)
- 7×7 → prestige 12 (ring 3)
- 8×8 → prestige 16 (ring 4)
- 9×9 → prestige 20 (ring 4, cap)

Bots on bigger boards earn exponentially more points per merge (suggested: ×2 per board-side step). Tile-merge logic generalizes naturally — only the grid size changes.

### Prestige
- Reset everything (points, owned bots, board upgrades, autorestart stockpile).
- Keep: prestige tokens, unlocked research nodes, achievements & bot unlocks, cosmetic bot variants.
- Each prestige expands the research tree by one ring outward.
- Prestige tokens earned ≈ proportional to log of total points at reset.

### Rage Mode
Manual play charges a rage meter. When full → all bots get a temporary speed multiplier (×3 for 30s default; achievements can extend duration).

### Offline Earnings
`offline_pts = 0.35 × online_pts_per_sec × time_offline`, throttled by available autorestarts. Show "used X / Y left" in the offline-collect modal.

## Interactions & Behavior
- **Editable board names** — click any board title (board, mini-board, or farm) to rename inline. Persists to `localStorage` keyed by board index.
- **Click a mini-board** → expand into Bot Detail screen for that board.
- **Tab navigation** between screens (in the wireframe; in production, treat as routes).
- **Achievement sort** — recompute on every state change so completed always sink to the bottom of the grid.
- **Gacha card animation** — flip / glow on pull (not yet wireframed; nice-to-have).
- **Responsive** — all screens use flex-wrap with min-widths; should collapse to single column on mobile.

## State Management
Top-level state needed:
- `points`, `prestigeTokens` — currencies
- `boards: Board[]` — each `{ id, name, gridSize, tiles, ownerBotId | "manual", score, mps }`
- `bots: Bot[]` — each `{ id, type, level, upgrades: {speed, depth, mergeBonus, lucky}, lifetime: {moves, merges, restartsUsed} }`
- `autorestarts: { current, max, lastRegenAt }`
- `achievements: { [id]: { got: boolean, gotAt: timestamp } }`
- `research: { ownedNodes: string[] }`
- `prestigeLevel`
- `lifetime: { totalPts, totalMoves, totalMerges, bestTile, prestiges, rageTriggers, playTime }`
- `boardNames` (Record<idx, string>)

Side effects:
- Tick loop for bot moves (per-bot interval based on mps).
- Tick loop for autorestart regen.
- Persist whole state to `localStorage` on every meaningful change (debounced).
- On load: compute offline delta and show "collect" modal.

## Design Tokens

### Colors (cozy pastel — replace in real codebase)
- `--paper`: `#fbf6ee` (background)
- `--paper-2`: `#f4ecdc`
- `--ink`: `#2b2a26` (foreground)
- `--ink-soft`: `#5d5a52`
- `--ink-faint`: `#9b958a`
- `--pink`: `#f4c8c4`
- `--peach`: `#f5d8b8` — Common-tier bot color
- `--butter`: `#f3e2a3`
- `--mint`: `#c8e0c4` — primary action / Rare-tier
- `--sky`: `#c4d8ea` — Uncommon-tier / board-size nodes
- `--lilac`: `#d8cae6` — Epic-tier
- `--coral`: `#e8a59c` — Legendary-tier / destructive (prestige reset)
- `--sage`: `#a5b89e`

### Typography
- `--serif`: `'Newsreader'` for headers (`weight 600`, `letter-spacing -.3px to -.5px`)
- `--sans`: `'Source Sans 3'` for body / UI
- `--hand`: `'Kalam'`, `--note`: `'Caveat'`, `--label`: `'Patrick Hand'` — handwritten accents only
- `--mono`: `'JetBrains Mono'` for numbers and tiny labels (uppercase, letter-spacing .8px)
- `--tile-num`: `'Source Sans 3'` `font-weight: 700`, `font-variant-numeric: tabular-nums`, `letter-spacing: -0.02em` — **numbers on 2048 tiles**

### Spacing
- Base unit: 4px
- Card padding: 8–14px
- Gap between cards: 6–14px

### Border radius
- Pills: 999px
- Cards: 10–14px
- Sheet: 18px

### Shadows
- Hand-drawn offset: `2px 2px 0 var(--rule)` or `4px 4px 0 var(--rule)` for sheet-level
- Tile shadow: `1.5px 1.5px 0 var(--rule)`

### Tile colors (2048)
| Value | Background |
|---|---|
| 2 | `#f6ecd8` |
| 4 | `var(--peach)` |
| 8 | `var(--pink)` |
| 16 | `var(--coral)` (white text) |
| 32 | `var(--butter)` |
| 64 | `var(--mint)` |
| 128 | `var(--sky)` |
| 256 | `var(--lilac)` |
| 512 | `var(--sage)` (white text) |
| 1024+ | extend palette |

## Assets
None required. Bot "art" is a placeholder dashed box with the bot id in monospace. Real implementation should commission or generate per-bot illustrations matching the chosen aesthetic.

## Screenshots
See `screenshots/` — one PNG per screen (01 early → 07 stats).

## Files
- `Idle 2048 Wireframes.html` — root document. Loads React/Babel and the JSX files. Contains all CSS as `<style>` block.
- `app.jsx` — top-level App component, tab routing, direction switcher, tweaks panel wiring, board-name state with localStorage persistence.
- `screens.jsx` — all 7 screens + shared primitives (`Sparkline`, `Tile`, `Board2048`, `EditableName`, `MiniBoardCell`, `BotCard`, `ResearchNode`/`Edge`). The `BOTS` and `ACHIEVEMENTS` arrays at the top are the source of truth for game data — copy these into the real codebase.
- `tweaks-panel.jsx` — third-party Tweaks panel (host-protocol). Not needed in production.

## Implementation Notes
- The 6 "directions" (A–F) in the wireframe are aesthetic explorations, not separate UIs. Pick one (whiteboard/E was approved) or design your own.
- Keep the **editable inline names** pattern — it's a small detail that makes boards/farms feel personal in an idle game.
- The achievement grid should re-sort live; consider transition animations when an achievement completes and slides to the bottom.
- Higher-dim boards (5×5+) are far-future content — ship the game with 4×4 only, but reserve the data shape (`gridSize` per board) on day one so it's not a refactor later.
