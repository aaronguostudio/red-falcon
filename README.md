# Red Falcon: Broken Signal

[English](README.md) | [简体中文](README.zh-CN.md)

**[Play online](https://red-falcon-broken-signal.arronstudio.chatgpt.site)** — Open in your browser and play. No sign-in or installation required.

**An original browser run-and-gun game. Eight complete chapters.**

Chase a lost signal from a rainforest outpost through fortresses, waterfalls,
industrial ruins, and a living underground nest. Inspired by classic
side-scrolling action games, Red Falcon brings its own eight-chapter campaign,
characters, bosses, and sound.

Built with native Canvas 2D and Web Audio. No runtime dependencies. All assets
are served by the game itself; no third-party CDNs are required.

![Red Falcon: Broken Signal — title screen and mechanical guardian](docs/preview.png)

## New visual sample

**[Play the 30-second opening](https://red-falcon-broken-signal.arronstudio.chatgpt.site/?sample=intro)** · **[Challenge AEGIS–07](https://red-falcon-broken-signal.arronstudio.chatgpt.site/?sample=boss)**

A playable art-and-motion prototype: rain-soaked jungle ruins, textured terrain,
eight-frame running, directional aiming, jump/landing poses and a telegraphed
Guardian encounter. English by default, with Chinese available in the top bar.
The opening runs for 30 active seconds before offering the boss fight. Boss
practice starts with full armor and all three weapons. Practice does not change
campaign unlocks or records.

![Visual sample — live gameplay](docs/visual-slice/preview.webp)

The five WebP atlases load only for the sample (about 2 MB). Static lighting and
terrain are cached, off-screen actors are culled, and particles are capped at
240. See the [implementation and measured performance](docs/visual-slice/README.md)
for methods, results and device limitations.

## Quick start

Requirements: **Node.js 20+** and a modern browser. No dependency installation is
needed.

```sh
git clone https://github.com/aaronguostudio/red-falcon.git
cd red-falcon
npm run dev
```

Open [the local game](http://red-falcon.localhost:4177). A desktop browser in
fullscreen gives the best view.

The `dist/` directory contains the HTML, CSS, and JavaScript source directly; it
is not generated build output. Deploy that directory to any static host without
a build step. `.openai/hosting.json` configures the original Sites deployment and
is not needed for independent hosting.

## Controls

| Action | Input |
| --- | --- |
| Move | A / D or Left / Right arrows |
| Double jump | K / Space |
| Crouch and fire | Hold Down arrow / S on the ground |
| Continuous fire | Hold J, or aim and fire with the left mouse button |
| Aim up / down | W / Up arrow; S / Down arrow aims down in midair |
| Invulnerable dash | Shift / H |
| Throw a grenade | L / right mouse button |
| Cycle unlocked weapons | Q |
| Pause / sound / fullscreen | Esc / M / F |

Crouching lowers the hitbox, keeps your feet planted and allows firing. Release
to stand; K / Space jumps immediately out of the crouch. The bindings apply to
both the visual sample and the campaign.

Touch devices have on-screen controls, including a hold-to-crouch button; landscape orientation is recommended.
Standard and Veteran difficulty keep separate best scores for each chapter.
Clear a chapter to unlock the next, or replay any unlocked chapter using
**Choose chapter**. Unlocks and scores are saved in this browser when storage is
available; they do not sync across devices. Checkpoints last only for the current
mission. Reloading or returning to the menu restarts the chapter. Each chapter
begins with a Pulse Rifle; collect its weapon upgrades along the route.

## The campaign

| Chapter | Environment and challenge | Boss |
| --- | --- | --- |
| 01 · Verdant Outpost | Rainforest, broken bridges, forward outpost | Iron Guardian |
| 02 · Relay Bastion | Fortified corridors and timed laser vents | Bulwark Iris |
| 03 · Cataract Run | Rapids, suspended ledges, double-jump crossings | Tempest Ray |
| 04 · Cinder Foundry | Opposing conveyor belts and furnace vents | Forge Crawler |
| 05 · Whiteout Frontier | Slippery ice, glacial gaps, freezing vents | Frost Spire |
| 06 · Railgrave Express | Freight decks and marked artillery impacts | Siege Engine |
| 07 · Ion Heart | Reactor cells, energy vents, charged beam attacks | Prism Warden |
| 08 · The Hollow Signal | Living terrain, spore vents, drone broods | Signal Sovereign |

Each authored chapter has three sectors, three checkpoints, a distinct boss,
and its own briefing and ending. The final boss has three phases; the others
have two. Boss attacks include aimed volleys, shockwaves, marked bombardments,
charged beams, crossfire, spirals, low barrages, and summoned drones.

- Four enemy types: soldiers, heavy troops, turrets, and drones.
- Pulse Rifle, Swarm Shot, Arc Railgun, grenades, and destructible supply crates.
- Double jumps, invulnerable dashes, and checkpoints that restore armor and grenades.
- Per-chapter timing, combo scoring, completion ranks, and checkpoint retries.
- Chapter selection, sequential unlocks, and a complete campaign ending.

Scenery, characters, and machinery are drawn in code. Each chapter has its own
palette, architecture, atmosphere, and boss silhouette. Particles, dash trails,
hit pauses, screen shake, and weather bring the action to life. Web Audio
synthesizes the sound effects and rhythm track. The system's reduced-motion
preference disables screen shake.

## Verify and develop

```sh
npm run check
npm test
```

The tests cover jumps and dashes, projectile collisions, weapon pickups,
grenades, checkpoint recovery, pause behavior, difficulty, and boss phases. A
separate input-only simulation completes each of the eight chapters. Campaign
tests also cover safe checkpoints, sequential unlocks, saved scores, invalid or
blocked storage, chapter transitions, and the final boss phases.

| File | Responsibility |
| --- | --- |
| [game.js](dist/src/game.js) | Game simulation, independent of the DOM |
| [levels.js](dist/src/levels.js) | Eight authored routes, formations, chapter copy, and boss definitions |
| [patterns.js](dist/src/patterns.js) | Boss attack patterns and hazard collisions |
| [progress.js](dist/src/progress.js) | Browser-local chapter unlocks and best scores |
| [render.js](dist/src/render.js) | Canvas drawing and visual effects |
| [scenes.js](dist/src/scenes.js) | Chapter scenery, environmental effects, and boss art |
| [audio.js](dist/src/audio.js) | Synthesized sound effects and music |
| [i18n.js](dist/src/i18n.js) | English / Simplified Chinese copy and saved language preference |
| [main.js](dist/src/main.js) | Input handling and interface |
| [game.test.mjs](tests/game.test.mjs) | Core game logic and first-mission tests |
| [campaign.test.mjs](tests/campaign.test.mjs) | Eight-chapter playthroughs, progression, and mechanics |

The read-only `window.redFalcon.snapshot()` exposes game state for debugging. It
does not provide cheats or level-skipping controls.

## Languages and scope

English is the primary repository language. Both READMEs cover the same overview,
setup, controls, and development information; commands and file paths are
identical. The game defaults to English. Use **EN / 中文** in the top bar or field
manual to switch instantly; your choice is saved in this browser. Menus, combat
messages, boss warnings, touch controls, and results support both languages.
Switching languages preserves your current mission progress.

This release contains a complete, original eight-chapter single-player browser
campaign. Multiplayer and gamepad support are outside its current scope.
