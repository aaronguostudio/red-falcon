# Red Falcon: Broken Signal

[English](README.md) | [简体中文](README.zh-CN.md)

**An original browser run-and-gun game. One complete mission.**

Fight through a rainforest, cross a broken bridge, and take down a mechanical
guardian at a silent outpost. Inspired by classic side-scrolling action games,
Red Falcon brings its own level, characters, mechanical enemies, and sound.

Built with native Canvas 2D and Web Audio. No runtime dependencies or remote asset
requests.

![Red Falcon: Broken Signal — title screen and mechanical guardian](docs/preview.png)

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
| Double jump | Space / L |
| Continuous fire | Hold J, or aim and fire with the left mouse button |
| Aim up / down | W / S or Up / Down arrows |
| Invulnerable dash | Shift / H |
| Throw a grenade | K / right mouse button |
| Cycle unlocked weapons | Q |
| Pause / sound / fullscreen | Esc / M / F |

Touch devices have on-screen controls; landscape orientation is recommended.
Standard and Veteran difficulty each keep a separate best score in your browser.

## The first mission

- One continuous, 7,040-unit level spanning the rainforest, broken bridge, and
  forward outpost.
- Four enemy types: soldiers, heavy troops, turrets, and drones.
- Three weapons: Pulse Rifle, Swarm Shot, and Arc Railgun, plus grenades and
  destructible supply crates.
- Double jumps, invulnerable dashes, and three automatic checkpoints that restore
  armor and grenade supplies.
- A two-phase AEGIS–07 boss with fan-shaped volleys, marked bombardments, and
  ground shockwaves.
- Mission timing, combo scoring, completion ranks, checkpoint retries, and pause
  and restart controls.

The renderer draws the layered rainforest, ruins, characters, and machinery in
code. Particles, dash trails, hit pauses, screen shake, rain, and light shafts
bring the action to life. Web Audio synthesizes the sound effects and rhythm
track. The system's reduced-motion preference disables screen shake.

## Verify and develop

```sh
npm run check
npm test
```

The tests cover jumps and dashes, projectile collisions, weapon pickups,
grenades, checkpoint recovery, pause behavior, difficulty, and boss phases. A
complete-mission simulation reaches the ending using normal gameplay inputs.

| File | Responsibility |
| --- | --- |
| [game.js](dist/src/game.js) | Game simulation, independent of the DOM |
| [render.js](dist/src/render.js) | Canvas drawing and visual effects |
| [audio.js](dist/src/audio.js) | Synthesized sound effects and music |
| [main.js](dist/src/main.js) | Input handling and interface |
| [game.test.mjs](tests/game.test.mjs) | Game logic and complete-mission tests |

The read-only `window.redFalcon.snapshot()` exposes game state for debugging. It
does not provide cheats or level-skipping controls.

## Languages and scope

English is the primary repository language. Both READMEs cover the same overview,
setup, controls, and development information; commands and file paths are
identical. The current in-game interface is in Simplified Chinese.

This release contains one complete single-player browser mission. Multiplayer,
gamepad support, and additional missions are outside its current scope.
