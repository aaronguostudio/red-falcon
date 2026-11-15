# Campaign art upgrade · 2.2

[Play the complete campaign](https://red-falcon-broken-signal.arronstudio.chatgpt.site)

The approved first-chapter art direction now runs throughout all eight authored
routes. Characters share the same eight-frame run, crouch, directional aim,
jump/landing and weapon registration. Seven new backdrops, chapter terrain,
seven new boss designs and a third-phase Queen appearance complete the campaign.
Boss pose pairs use stable anchors and a shared scale; telegraphs, recoil,
muzzle lighting, damage flashes and existing attack patterns remain live.

## Rendering and loading

- Shared actors: four WebP atlases, 1.59 MB compressed. First chapter including
  its backdrop: 2.07 MB. The new seven-chapter art adds 3.51 MB across the repository;
  it is **not** all downloaded on the first visit.
- Later chapters fetch their backdrop, the terrain atlas and the relevant boss
  atlas. HTTP caching can reuse the shared atlas URLs. Only the selected terrain
  tile and two boss poses (four for the Queen) remain decoded.
- The previous chapter's ImageBitmaps are explicitly closed. Stale downloads are
  cancelled; downloads including response bodies time out after 30 seconds and
  offer a bilingual Retry button. A mission starts only after its art is ready.
- Three terrain tiles and static lighting are baked into canvases. The backdrop
  source bitmap is released after baking. Screen bounds cull actors and platforms;
  ambient weather has 24–48 particles and combat particles are capped at 240.
- Estimated retained RGBA texture/cache storage is 35.5–38.7 MB (decimal), excluding
  the main framebuffer, transient decode buffers, browser/GPU overhead and HTTP
  cache. This is an accounting estimate, **not** process-memory measurement.
  Repeated chapter changes return to the same per-chapter allocation.
- Reduced-motion preference disables camera shake and ambient weather.

The renderer remains Canvas 2D with no runtime dependencies or remote CDNs.
Generated assets are committed in `dist/assets/campaign/`; original prompts and
registration notes are in [background prompts](BACKDROP-PROMPTS.md) and
[sprite prompts](SPRITE-PROMPTS.md). Encoding preserves transparency. No new
source images were painted or retouched through pixel-editing scripts.

## Verification

- `npm run check` and all 42 Node tests pass, including eight input-only route
  simulations, collisions, checkpoints, hazard timing, controls and translations.
- [Browser campaign playthrough](browser-playthrough.json): all eight chapters
  completed sequentially through keyboard/mouse events. No teleports, direct
  damage or health overrides. Chapters 1–7 needed no retries; the final chapter
  needed two. The final Queen reached phase three and the full completion save
  contains chapters 0–7.
- [Browser art/loading checks](browser-art.json): every chapter launches and renders;
  repeated switches stay bounded; failed downloads, stalled downloads, cancelled
  chapter selections and victory-to-next-chapter retries recover. These use an
  unlocked test profile and controlled boss/victory fixtures for visual coverage.
- [Controls](browser-controls.json): hold-to-crouch, K/double jump, L/grenade,
  English/Chinese and touch events pass. The 30-second practice-to-boss flow also
  passes without changing campaign records.
- README images are actual captures from the input-only campaign playthrough.

## Performance

Headless Chrome on the development Mac. Every chapter uses a controlled sustained
boss firefight with 60 warm-up frames and 180 measured frames per renderer and
setting. The old procedural renderer is retained as the comparison. The fixture
uses the same weapon, fixed random source, invulnerable player and sustained boss
health so the fight cannot end during measurement. Renderer-specific camera and
projectile registration are preserved. This measures simulation plus Canvas
command-submission CPU time, excluding DOM HUD and downloads.

At 1280 × 720 / DPR 1, upgraded CPU P95 was 0.2 ms in every chapter; the old
renderer was 0.3–0.5 ms. Frame P95 stayed at 16.7–16.8 ms.

At 1920 × 1080 / DPR 2 with simulated 4× CPU slowdown:

| Chapter | Old CPU P95 | Upgraded CPU P95 | Upgraded frame P95 |
| --- | ---: | ---: | ---: |
| 01 · jungle | 2.4 ms | 0.9 ms | 16.7 ms |
| 02 · base | 1.3 ms | 0.9 ms | 16.8 ms |
| 03 · waterfall | 1.4 ms | 0.8 ms | 16.8 ms |
| 04 · foundry | 1.2 ms | 0.7 ms | 16.7 ms |
| 05 · snow | 1.1 ms | 0.8 ms | 16.7 ms |
| 06 · rail | 1.1 ms | 0.9 ms | 16.7 ms |
| 07 · reactor | 1.2 ms | 0.9 ms | 16.8 ms |
| 08 · hive | 1.2 ms | 1.0 ms | 16.8 ms |

Across those eight upgraded throttled cases, one of 1,440 measured frames exceeded
25 ms (in the base chapter). All other upgraded throttled frames stayed below that
threshold. These results show no material frame-pacing regression in this fixture.
They do not measure GPU completion, promise 60 FPS on every device, or substitute
for physical low-end phone testing. Touch behavior was tested in browser emulation;
physical mobile performance remains unverified.

[Raw performance results](frame-pacing.json)

```sh
# Set PLAYWRIGHT_MODULE to your installed Playwright package entry point.
node scripts/qa/campaign-art-browser.mjs
node scripts/qa/campaign-playthrough-browser.mjs
node scripts/qa/controls-browser.mjs
node scripts/perf/campaign-frame-pacing.mjs
```

The scripts default to `http://red-falcon.localhost:4177` and macOS Chrome. Set
`GAME_URL`, `CHROME_PATH`, `PLAYWRIGHT_MODULE` and `QA_OUTPUT` when needed. Browser
QA requires a locally installed Playwright package; it is not a game dependency.
