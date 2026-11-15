# Verdant Outpost: playable visual slice

[30-second opening](https://red-falcon-broken-signal.arronstudio.chatgpt.site/?sample=intro) · [AEGIS–07 practice](https://red-falcon-broken-signal.arronstudio.chatgpt.site/?sample=boss)

This prototype applies the approved art direction to a timed opening and a complete Guardian encounter. It is a separate practice mode within the eight-chapter game. The opening ends after 30 active simulation seconds, when the player is grounded; pausing freezes the timer. Retrying the opening restarts its timer. Boss practice replenishes armor, grenades and all three weapons. Practice results never call campaign completion or write campaign scores.

## Art and motion

- Five locally hosted WebP atlases, about 2 MB combined, decoded before deployment buttons become available. The regular campaign does not request them.
- Layered jungle background, animated rain, foreground foliage, wet concrete, riveted steel and cached supply crates. A 1.2× camera brings characters closer while preserving the 16:9 playfield.
- Eight running poses at approximately 15 frames per second at full speed; independent ascending, descending and landing poses. Directional aim uses additional articulated poses, with small torso adjustments to retain free mouse aiming. Shared registration keeps bullets and muzzle flashes attached to the rifle.
- Guardian wind-up, recoil, recovery and defeat poses. The attack cycle retains volley, marked mortar strikes and ground shockwaves, with a second phase below half health.
- Recoil, brief impact stops, landing sound, sparks, bounded camera shake and dash echoes. Reduced-motion preference suppresses camera shake and animated rain.
- Hold ↓ / S to crouch and fire with a lower hitbox; release to stand. K / Space jumps directly out of the crouch, and L / right click throws a grenade. This reuses the existing pose atlases.
- English and Simplified Chinese, desktop keyboard/mouse and touch buttons (including hold-to-crouch). Landscape is recommended on phones.

## Performance design

Canvas 2D and the existing simulation remain in use. Background color treatment, light falloff, the vignette, crate faces and nine terrain tiles are cached. Terrain rendering visits only visible tiles; enemies and items are culled. Cosmetic rain uses one batched path, particles are capped at 240, and the diagnostics ring holds at most 600 samples. Pixel ratio remains capped at 2. The legacy forest cache is lazy and is not allocated for sample launches.

## Measurements — 2026-11-15

Headless Chrome on this development Mac, not a physical phone benchmark. Raw results include the browser version. Tests ran sequentially. Timings below are rounded; sub-millisecond measurements should not be interpreted as universal speedup ratios.

The render benchmark uses identical world positions and 120 particles, 90 warm-up frames and 240 measured frames per scene. It measures CPU submission of Canvas commands, **not GPU completion or total frame time**.

| Viewport, DPR 1 | Original P95: opening / traversal / boss | Sample P95: opening / traversal / boss |
| --- | --- | --- |
| 1280 × 720 | 0.4 / 0.5 / 0.4 ms | 0.2 / 0.2 / 0.2 ms |
| 1920 × 1080 | 0.4 / 0.5 / 0.4 ms | 0.2 / 0.2 / 0.2 ms |

A separate sustained boss-firefight fixture measures animation-frame intervals and simulation + render CPU work. It uses invulnerability to keep the fixture running, warms up for 120 frames and measures 300 more; it is not a gameplay completion test. DOM HUD and audio are excluded from this fixture.

| Condition | Original CPU P95 | Sample CPU P95 | Original / sample frame interval P95 | Sample frames > 25 ms |
| --- | --- | --- | --- | --- |
| 1280 × 720, DPR 1 | 0.5 ms | 0.2 ms | 16.7 / 16.7 ms | 0 / 300 |
| 1920 × 1080, DPR 2, simulated 4× CPU slowdown | 2.4 ms | 1.0 ms | 16.8 / 16.8 ms | 0 / 300 |

These measurements show no material frame-rate regression in the tested configurations. They do not establish performance on older mobile GPUs, Safari, constrained memory or slow networks. The sample adds an initial texture download and decode cost. A read-only `window.redFalcon.metrics` snapshot also reports bounded live CPU/frame samples including the real application's HUD and audio scheduling.

Raw evidence: [original rendering](perf-baseline.json), [sample rendering](perf-slice.json), [frame pacing](frame-pacing.json), [browser input playthrough](playthrough.json).

## Verification

`npm run check` and all 42 Node tests pass, including all eight campaign routes, crouch collision and firing, K/Space jumps, L grenades, and the sample's timer, retry, firing registration, effect cap and input-driven boss completion. A browser keyboard/mouse playthrough reaches the intermission, switches language, defeats the two-phase boss, checks replay, returns to the campaign and confirms the campaign save is unchanged. Launchers and gameplay were inspected at 1280×720, 844×390 and 390×844. Touch checks use browser emulation; physical-device validation remains open.

For reproduction, install Playwright in a separate tool environment, set `PLAYWRIGHT_MODULE` to its module path and optionally set `CHROME_PATH`. Keep the project server running on the local domain:

```sh
npm run dev
# In another terminal, with PLAYWRIGHT_MODULE configured:
node scripts/perf/render-benchmark.mjs
node scripts/perf/render-benchmark.mjs --sample
node scripts/perf/frame-pacing.mjs
node scripts/qa/visual-slice-browser.mjs
node scripts/qa/controls-browser.mjs
```

`GAME_URL` overrides the local domain. `QA_OUTPUT` selects where browser screenshots and the gameplay report are written. Performance scripts write their JSON into this directory.

## Scope of the prototype

The rest of the campaign keeps its existing presentation. This slice establishes the asset pipeline, camera, readable materials and action timing before a broader art pass. The small sprite libraries use layered poses rather than bespoke frames for every possible aim and movement combination; transitions can be refined further after play feedback. The soundtrack remains the existing synthesized score, with added landing feedback.

[Asset generation prompts](ASSET-PROMPTS.md)
