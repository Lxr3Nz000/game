# Startup Master — Global Expansion

## Problem Statement (original)
Advanced tycoon game "Startup Master - Global Expansion". Dashboard with tabs (Office, Staff, Research, Real Estate), Hype HUD, random-event pop-ups (bug, AI trend), interactive tutorial manager (first 3 minutes), isometric office grid, multi-office progression (Garage→Coworking→Tech Hub→Silicon Tower→Moon), milestones w/ gem rewards, Burn Rate (exponential maintenance), app Obsolescence (value decay w/ updates), random crises (market crash −50% revenue for 2 min). Dark mode, neon green/red accents. IT+EN.

## Architecture
- **Frontend**: React 19 SPA with single GamePage, state in `useGameState` hook (useReducer-like via setState + tick interval 1s), saved to localStorage under `startup_master_save_v1`.
- **Backend**: FastAPI `/api/events/generate` calls Claude Sonnet 4.5 via Emergent LLM key with per-event prompt templates + static IT/EN fallback. Events also logged to MongoDB.
- **Design**: Dark cyberpunk terminal — #07090d background, neon #00ff9d/#ff4068/#00d4ff, VT323 display + JetBrains Mono body + Space Grotesk headings, isometric CSS via rotateX(58deg) rotateZ(-45deg).

## Core Requirements (static)
1. HUD: cash / gems / hype / burn / revenue / office / staff
2. Tabs: Office, Staff, Research, Real Estate, Milestones
3. Isometric office with desks + animated devs (color-coded by role)
4. Tutorial: 4 steps (desk → hire → launch → collect)
5. 5 Offices with capacity + bonus tiers
6. Burn Rate (maintenance + salaries)
7. Obsolescence (−0.5%/s, min 10%, reset by update)
8. Random events via Claude (every ~35s, 55% chance)
9. Milestones (10 defined) awarding gems/discounts/prod bonus
10. IT/EN toggle, localStorage persistence, bankrupt overlay

## What's been implemented (2026-02)
- FULL MVP shipped. 100% backend tests (6/6) + 100% frontend E2E.
- Isometric grid auto-sizing to office capacity.
- AI event generation in Italian + English (Claude Sonnet 4.5).
- Tutorial auto-advances and auto-switches tabs.
- Milestone tracking with gem rewards, Unicorn gates Moon HQ.

## Backlog (P0 / P1 / P2)
**P1**
- Sound effects (app release chime, event pop, bankrupt)
- Premium shop: spend gems for cash boost, revive after bankruptcy, speed up research
- Prestige / reset for permanent multipliers
- Staff burnout mechanic tied to "dev_burnout" event

**P2**
- Leaderboard (needs auth)
- Mobile-first layout pass
- Animated dev typing sprites
- Data viz for revenue/burn over time via recharts
- C# / Unity export of core classes (OfficeManager, TutorialSequence, MarketFluctuation) as documentation

## Test Credentials
No auth. See /app/memory/test_credentials.md.

## Update (2026-02 / iteration 2) — Mobile engagement patch
- Tap-to-code clicker on isometric office (+1 wp per tap, €1 per 4 taps when idle)
- New sticky top tutorial stepper (5 steps, no blocking modal, counter for taps left)
- Gem Shop modal (7 items, revive gated by bankrupt state) — accessible via HUD Sparkles button AND clickable gems chip
- SFX engine via Web Audio API (click/buy/hire/launch/release/milestone/bankrupt/gem), mute persisted in localStorage
- Difficulty tuning: start cash 1000→800, hype 50→35, obsolescence 0.5%→0.7%/s, events 35s/55%→25s/65%, desk maintenance 0.3→0.5€/s, quarterly taxes (8% of cash every 90s after tutorial)
- Hello World work 30→50 (lets player either click-to-finish or wait for dev)
- Save version bumped to 2 (old saves invalidated)
- Tests: 6/6 backend, 100% mobile E2E (iteration_2.json)

## Update (2026-02 / iteration 3) — Progression & replayability patch
- **4 Difficulty levels** (Easy/Normal/Hard/Hardcore) with unique cash/burn/revenue/work multipliers + hype start + tax% + event frequency. Shown via DifficultyModal at start of every new run.
- **Fire staff** — each staff chip has an X button; severance = 50% of role hire cost; confirm dialog.
- **Marketing Quick Actions** — panel (visible after tutorial) with 3 buttons: Ads €80 (+12 hype, 15s cd), PR Blast €400 (+25 hype & +30% rev 30s, 45s cd), Influencer €2500 (hype→100 & +80% rev 60s, 120s cd).
- **Prestige / IPO** — sell startup at valuation ≥ €10M to unlock permanent productivity multiplier. Keeps: gems/2, prestigeMult, ipoRounds. New run re-picks difficulty but skips tutorial.
- **Stats tab** with recharts LineChart (revenue/burn over last 60s) + 4 stat cards (total earned, valuation, taps, prestige).
- **Random Decision modals** every 60-150s after tutorial: salary raise (pay or fire), angel investor (+cash -revenue), emergency bug (hotfix or hype loss), conference (hype boost).
- **Dev typing animation** — `iso-dev.working` class with 0.45s cycle when active project exists (vs 1.8s idle).
- Save version bumped to **v3** (keys v1/v2 ignored).
- Tests: backend 6/6, frontend 14/14 E2E (iteration_3.json). Zero console errors.
