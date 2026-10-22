# CHECK OUT — A Horror Story

`CHECK OUT` is a short browser-based horror choice game. The player wakes in Room 404 of a hotel that does not exist, makes choices, tries to keep a demon named Mr. Smiles happy, collects strange items, and reaches different endings.

The project uses only HTML, CSS, and vanilla JavaScript. No framework, build tool, database, or installation needed.

## Play the game

To preview it locally, open a terminal and run:

```bash
python3 -m http.server 8766
```

Then visit http://127.0.0.1:8766/ in a browser. Using a local server is recommended because browsers may restrict sound when `index.html` is opened directly as a file.

Sound starts after the player's first click or key press because modern browsers block autoplay.

## Screen flow

1. **Cover / Start screen** — dark graveyard scene with tombstones, iron fence, spiders, 3 jack-o-lanterns, dead trees, ravens, bats, moon, lightning, ghost silhouette, neon HOTEL 404 sign, neon ghost, neon skull, neon spider, and a 404 watermark. One button: RING THE BELL.
2. **How To Play screen (forced)** — after clicking RING THE BELL, the player sees four cards explaining choices, mood, items, and endings, plus a tip about green/red hint dots. Buttons: BACK and ENTER HOTEL 404.
3. **Story Intro Splash** — a brief "CHECKING IN..." animation with a loading bar (1.8s) before the game starts.
4. **Game screen** — story panel with scene text and choices (with stagger animations), plus a demon panel showing Mr. Smiles' face, mood meter, quote, inventory, and progress. Scene-specific atmospheric tints based on chapter.
5. **Result screen** — shows the outcome type (escaped, changed, reborn). All results are positive framing.
6. **End screen** — shows the ending name, story epilogue, stats, and a hint to try another path.

## Key design principles

- **No early-death endings**: Every path continues. Previous "DEAD!" and "TRAPPED!" endings have been converted to continuing story branches.
- **All endings are satisfying**: Every ending is framed as a form of escape, change, or rebirth. No ending feels like a loss.
- **Mood floor**: Mood never drops below 15 (was 0), preventing the player from getting stuck in an unwinnable state.
- **Choice hints**: Green dots on generous choices (+10 or more), red dots on harder paths (-8 or worse).
- **Forced instructions**: RING THE BELL always shows the how-to screen first. No separate HOW TO PLAY button.

## File guide

| File | Purpose |
| --- | --- |
| `index.html` | Page structure, buttons, screens, demon face markup, story intro splash, and horror decorations |
| `game.js` | English story (30+ scenes), choices, routes, 10 endings, game state, mood logic, audio, and controls |
| `i18n.js` | Traditional Chinese translations and Simplified Chinese conversion |
| `style.css` | Main layout, colours, animation, responsive design, horror artwork, intro splash, scene tints, stagger animations |
| `final-overrides.css` | Latest visual adjustments; loaded after `style.css`, so its rules take priority |
| `mystery-bgm.mp3` | Background music |
| `bell.wav` | Choice/click sound |
| `outcome-*.wav` | Different sounds for escaped, changed, and erased results |

The script order near the end of `index.html` is important: `i18n.js` must load before `game.js`.

## Story and choices

Open `game.js` and find `const scenes`.

Each scene has an ID such as `wake`, `hall`, or `lobby`:

```js
example: {
  chapter: '02 / EXAMPLE',
  time: '03:33 AM',
  icon: '?',
  title: 'Example Scene',
  text: `<p>Your story text goes here.</p>`,
  choices: [
    ['Choice shown to the player', 'nextSceneId', 10, 'optionalItem'],
    ['Another choice', 'endingId', -15]
  ]
}
```

A choice follows this order: `[button text, next scene/ending ID, mood change, optional item or flag]`

- A positive mood number makes Mr. Smiles happier.
- A negative mood number makes him angrier (but mood never drops below 15).
- The optional fourth value can add an item or story flag.
- Use an existing scene ID to continue the story.
- Use an existing ending ID to finish the story.
- Keep each scene to four choices or fewer.

## Endings

There are 10 unique endings. All are positive or bittersweet — none are pure losses:

| ID | Name | Type |
| --- | --- | --- |
| `staffend` | Night Shift | changed (hired) |
| `best` | Best Friends Forever | escaped |
| `honest` | The Honest Exit | escaped |
| `bellend` | Room Service | escaped |
| `error` | Error 404 | changed |
| `walk` | Walk of the Damned | escaped |
| `real` | The Real Checkout | escaped |
| `front` | The Real Checkout | escaped |
| `mirror` | The Mirror Guest | changed |
| `reset` | The Midnight Reset | changed (reborn) |

Three sections in `game.js` work together: `endings`, `resultTypes`, and `outcomeSounds`. If you add a new ending ID, add it to all three and to `i18n.js`.

## Demon mood

Mr. Smiles starts at `55%`. Mood never drops below `15%`. The `update()` function controls the mood ranges:

| Mood | State | Face class |
| --- | --- | --- |
| 75–100 | DELIGHTED | `happy` |
| 55–74 | AMUSED | `happy` |
| 30–54 | CURIOUS | _(neutral) |
| 15–29 | ANNOYED | `annoyed` |
| below 15 | FURIOUS | `furious` |

## Translations

English text is in `game.js`. Traditional Chinese is in the `ZH` object in `i18n.js`. Simplified Chinese is auto-generated by the `simp()` function.

## Safe editing checklist

1. Run `node --check game.js` to catch syntax errors.
2. Start the local server and play through changed routes.
3. Test English, Traditional Chinese, and Simplified Chinese.
4. Check desktop and mobile widths.
5. Confirm every choice reaches a valid scene or ending.
6. Verify no ending reads as a pure loss — all should feel satisfying.
