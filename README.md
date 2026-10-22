# HOTEL 404 — An Escape Game in Three Acts

A browser-based branching horror **escape game**. Vanilla HTML/CSS/JS — no framework, no build step, no backend.

You are locked in Room 404 of Hotel 404. The door does not open. Your roommate is Mr. Smiles, the night concierge — every checkout in the building needs his signature, and he only signs for a guest he is pleased with. You checked in eleven months ago, the same week your brother **Peter** vanished inside the hotel, and you remember none of it.

**The aim:** raise his satisfaction rating to *Pleased*, reach the front desk at dawn, and get him to sign.

## Page flow

Two beats before the first scene. Players are impatient — every screen before the game is a screen they might quit on, so story and rules share one page.

| # | Page | What it does |
|---|---|---|
| 1 | **Cover** (`startScreen`) | Title, one-line hook — *"You are locked in Room 404. The only way out is a signature."* — and `RING THE BELL`. Nothing else. |
| 2 | **Briefing** (`briefScreen`) | Two columns. **Left:** *The night you checked in* — the four premise paragraphs (locked in → your roommate decides → so keep him happy → Peter). **Right:** the house rules — the rule, the goal, and four compact cards (assessment stamps, rating meter, items, endings), each with an icon. The `SAFE / RISKY / DANGER / RULE-BREAK` pills are the real badge styles, not a description of them. Button: `ENTER HOTEL 404`. |
| 3 | **Transition** | The briefing fades out, a curtain rises with the one line to remember — *"Make Mr. Smiles happy — so you can escape."* — then dissolves into the room. ~2s, and it runs on restart too. |
| 4 | **Game** | First scene. |

One `BACK` button returns to the cover, so a player can re-read the premise without restarting.

Keep the cover short and the briefing dense. Putting the long explanation on the cover buries the button; spreading it over two pages loses impatient players. The whole briefing is ~171 words.

## Run locally

```bash
python3 -m http.server 9100
```

Then open http://127.0.0.1:9100/. A local server is required for audio — opening `index.html` directly as a file will block sound in most browsers.

## Deploy (GitHub Pages, drag-and-drop)

The game is static, so it needs no build. Everything is relative — it works at a subpath like `username.github.io/repo-name/`.

1. Create a public repo on github.com. Do **not** add a README or `.gitignore` (you already have one).
2. On the empty repo page click **uploading an existing file**.
3. Drag in the **13 files** from `game-deploy/` — `index.html`, `style.css`, `final-overrides.css`, `game.js`, `i18n.js`, `README.md`, `bell.wav`, `mystery-bgm.mp3`, `outcome-died.wav`, `outcome-erased.wav`, `outcome-escaped.wav`, `outcome-hired.wav`, `outcome-trapped.wav`. Drag the files themselves, not the folder.
4. Commit.
5. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main`, folder `/ (root)` → Save.**
6. Wait ~1 minute. The game is live at `https://<username>.github.io/<repo>/`.

`index.html` must sit at the repo root — that is what Pages serves. There is no `.nojekyll` needed because no filename starts with an underscore.

## The framing

The entire interface is **diegetic**: it is software the hotel is running. You are not reading a guide about the hotel — you are using its systems, and they are hostile.

| UI element | In-world meaning |
|---|---|
| Mood meter | **Guest Satisfaction Rating — Mr. Smiles**. His opinion of you; the lock on your door |
| Risk badges | **Concierge Risk Assessment** stamped on each option |
| Ending screen | **Departure Record** / **Incident Report**, filed by the hotel |
| Inventory | **Property Log** |
| Ending tracker | **Guest Ledger — Departures Recorded** |
| Badges | **Loyalty Stamps** |

Tone rule: the hotel is polite, procedural, and completely indifferent. It never threatens. It files reports.

### On clarity

The premise is stated plainly in four short paragraphs in the left column of the **briefing page**, and the right column of the same page restates it as a rule plus an explicit goal. The player should never have to guess *who the guest is*, *why his rating matters*, or *what they are trying to do*.

Inside scenes the prose stays atmospheric, but every scene ends with the situation legible — who is present, what is at stake, what the next decision is about. Avoid ellipsis for its own sake: if a paragraph could be read two ways, rewrite it.

## Structure

**3 acts, 26 scenes, 6 endings.**

| Act | Scenes | Palette | Ends with |
|---|---|---|---|
| I — Check In | 9 | warm amber | the first lethal choice (`smiles_test`) |
| II — The Guests | 12 | cold blue / blackout | the confrontation at Room 219 |
| III — Check Out | 5 | clinical white | one of six departure records |

## The cast

- **Mr. Smiles / Elias Vance** — night concierge, 1974–1998, Employee of the Month 287 consecutive times. He is also **your roommate** and the only person who can sign you out. His mood is not anger; it is his **performance review**. Doors open on his approval because the door system is literally his job description, still running.
- **Miss Verity** — voice-only receptionist. Dry, tired, procedural. She lies exactly once: *"There is only one guest on that floor."* There are twenty-three. Her name means truth.
- **Peter** — your younger brother. Room 219. Not checked out. Speaks twice in the whole game, one word each time.

## Endings (6)

| # | Title | Unlock | Tier |
|---|---|---|---|
| 1 | Check Out Alone | Reach the desk without Peter | 🥉 / 🥈 |
| 2 | Check Out Together | Key used + Peter found + **Pleased** | 🥇 4 fragments · 🥈 2+ · 🥉 0–1 |
| 3 | Do Not Disturb | Break the rule · stay · or Furious at checkout | 🥉 (🥈 if Furious) |
| 4 | Room Service | Bell + bargain in the basement | 🥈 / 🥇 |
| 5 | The Bell Tolls | Bell + his name + ring at the mirror | 🥇 secret |
| 6 | 404 | All 4 fragments + photo + bell + **Pleased** | 🥇 true |

Every ending is a **departure**, not a failure. `dnd` is the closest thing to death and is framed as becoming staff.

`404` is the true departure: the register has one line, the name on it is yours, and Peter checked out eleven months ago — the hotel kept you in exchange and took the week you made the trade, so you would spend eleven months looking for someone who was already safe.

## Items (4) — each has exactly one job

| Item | Found | Use |
|---|---|---|
| **Photo** | start | Required for `404`. Changes Room 219 dialogue. |
| **Half-Key** | under the bed | Opens Room 219. Without it, the door will not open. |
| **Candle** | corridor sconce | Survives the Act II blackout. Without it, a harder dark path. |
| **Bell** | laundry machine | Summons him · bargains at the desk · rings at the mirror. |

## Systems

### Risk badges (always visible, not hover-only)
🟢 **SAFE** · 🟡 **RISKY** · 🔴 **DANGER** · ⚠️ **RULE-BREAK** (double-bordered, pulses; hovering it turns the rule banner red)

### Mood
Four named zones: **PLEASED** (75–100) · **NEUTRAL** (50–74) · **IRRITATED** (25–49) · **FURIOUS** (0–24).
Floor is **15** — no run can become unwinnable.

After every choice a delta line appears for 4.5s:
```
Mr. Smiles: NEUTRAL → IRRITATED  (−1)
"You did not thank me."
```
Every non-zero mood change carries a `reason`. This is enforced by the test suite.

### Gates
Options can be locked behind items or knowledge. Locked options stay visible, struck through, with a toast explaining what you missed — so the player learns the system instead of guessing.

### Rewards
- Bronze / Silver / Gold tier per ending
- 6 loyalty stamps in `localStorage` (`h404.progress.v2`)
- Three-room streak: clear 404, 405 and 219 in one run with no incident → +10 mood and the `three_doors` stamp
- **Pleased bonuses**: three extra options that only appear at mood ≥ 75 (faceless man speaks, Peter answers, Elias explains the bell)

## File guide

| File | Purpose |
|---|---|
| `index.html` | Screens, report card, rule banner, toasts, decorations |
| `game.js` | Engine, 26 scenes, 6 endings, routers, tiers, badges, persistence |
| `i18n.js` | Traditional Chinese for all 25 narrative scenes, endings, UI, badges; Simplified derived via a complete OpenCC-generated map |
| `style.css` | Layout, neon horror artwork, v2 components |
| `final-overrides.css` | Late-stage visual overrides (loads after `style.css`) |
| `ENHANCEMENT-SPEC.md` | The design spec this implements |
| `*.mp3` / `*.wav` | Music and SFX |

Script order matters: `i18n.js` must load before `game.js`.

### Translation

`i18n.js` holds one `ZH` object written in Traditional Chinese. Simplified is
derived at load time by `simp()`, which walks `ZH` and swaps characters through
`SIMP_MAP` — so you only ever author strings once.

`SIMP_MAP` is a **complete** table generated from OpenCC (`tw → cn`) over every
character appearing in `ZH`, and verified to match OpenCC's phrase-level output
for every string. If you add new Traditional text, regenerate it:

```js
// build-time only, not shipped
const OpenCC = require('opencc-js');
const t2s = OpenCC.Converter({ from: 'tw', to: 'cn' });
// for each distinct CJK char in ZH: if (t2s(c) !== c) map[c] = t2s(c)
```

Missing entries are silent — an unmapped character simply stays Traditional and
the page looks half-converted, so always re-run the generation after editing
Chinese copy.

## Adding content

```js
const C = (label, next, mood, opts) => ({ label, next, mood, ...opts });

myScene: {
  act: 2,
  chapter: 'ACT II / ROOM 219',
  time: '05:10',
  icon: '\u26A0',
  title: 'Scene Title',
  text: `<p>Prose here.</p>`,
  choices: [
    C('Do the thing.', 'nextSceneId', 10, {
      risk: 'safe',            // safe | risky | danger | rulebreak
      hint: 'Mr. Smiles respects this.',
      reason: 'You were honest with him.',   // REQUIRED if mood !== 0
      item: 'bell',            // optional
      flag: 'knowsName',       // optional
      fragment: 'memo',        // optional
      requires: s => s.items.includes('bell'),  // optional gate
      lockedLabel: 'You have no bell.',         // REQUIRED if requires set
      bonus: false             // true → renders the BONUS tag
    })
  ]
}
```

A router (no `choices`, no `text`) resolves before display:

```js
const routers = {
  myRouter: s => s.items.includes('candle') ? 'litScene' : 'darkScene'
};
```

Targets starting with `ending:` go straight to a departure record.

## Tests

The repo was validated with three suites (kept out of the deploy bundle):

1. **Link + reachability** — every choice target resolves; all 6 endings reachable across 4 state variants.
2. **DOM integration (jsdom)** — boot, forced instructions, splash, badges, report fields, persistence, restart, all three languages, zero console errors.
3. **Ending paths** — a scripted playthrough of each of the 6 endings in a real DOM.

Rules the tests enforce:
- every choice has a resolved `risk`
- every gated choice has a `lockedLabel`
- every non-zero mood change has a `reason`
- no scene is a dead end

## Safe editing checklist

1. `node -c game.js` and `node -c i18n.js`
2. Play the changed route end to end
3. Check EN / 繁中 / 简中
4. Check desktop and mobile widths
5. Confirm no ending reads as a pure loss
