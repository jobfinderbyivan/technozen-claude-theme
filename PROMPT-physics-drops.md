# Prompt: water drops with physics on the Take skin

Paste everything below the line into Claude Code, in the `technozen-claude-theme` folder.

---

Build an interactive version of the Take skin. The water drops are painted into the leaf image today. In the interactive version the leaf has no painted drops, and the same drops float above it as silent physical objects that the mouse and the app gently push around. A new tick box in the theme switcher turns this on and off.

## What must look identical

- A drop must look exactly as it does now: same gradients, shadow, rim, caustic, highlight and glint, at the same sizes. Draw each one from the `DROP` shape and `<defs>` in `leaf.py`. Do not redraw them by hand.
- The first frame must match the static skin: same 120 drops from the same seed, in the same places, with the leaf's `center / cover` scaling applied. Ticking the box on or off must not make a drop jump.
- Text stays on top of the drops and stays readable. Panels keep frosting the drops behind them, as the sidebar does now.
- With the box off, the Take skin must be exactly what ships today. Prove it with a pixel comparison against the current build.
- Silent. No sound of any kind.

## The two versions of the leaf

- `leaf.svg(count=0)` already draws the leaf with no drops. Use that as the background when interactive is on.
- Draw the drops on one `<canvas>`: fixed, full window, `pointer-events: none`, placed behind the app and above the leaf. Follow how `skins/sakura.css` places its petals at `z-index: -1`.
- The canvas must never receive a click, key or scroll, and must never cover a control. Listeners are passive and never call `preventDefault`.

## Physics

- Reuse the approach in `installer/Orbs.cs`: fixed 60 Hz step, mass = radius cubed, drawing carried forward by velocity between steps.
- Drops collide softly with each other. Use a grid so 120 drops never need every pair tested.
- The window edges hold them softly, and a drop may sit partly cut off by the edge, as in the current image. Nothing leaves the window for good.
- Everything is gentle. Nothing may look thrown. Measure speeds in on-screen pixels per second, and use those measured limits as test limits.

## What pushes the drops

Mouse first:

- The mouse has priority over everything else. It pushes harder and reaches a higher speed than any part of the app, and near the cursor the app's own pushes fade out, so the mouse always wins.
- Big drops lean away slowly and small drops move sooner, as the orbs do on the start-up card.

Then the app. Text, borders and lines are all physical:

- Text lines, borders, dividers, panels, buttons and the composer each act as a soft shape.
- They push only when they move or change: scrolling text through the drops, a message streaming in, a panel opening, a window resize. A still app pushes nothing, otherwise the drops could never come to rest.
- Scrolling must sweep drops gently out of the way of the moving text.

## All borders are permeable

- No part of the app is ever a wall. App shapes only ever apply a soft push, never a collision.
- If the mouse pushes a drop into a border, panel or text, the drop goes through it. It keeps moving behind the text and behind the frosted panels, in and out of the sidebar, with no sticking, snapping or bouncing.

## Coming to rest after 102 seconds

- After the last push of any kind, drops glide and slow down, and every drop reaches exactly zero speed at 102 seconds. A new push restarts the 102 seconds.
- The slowdown must be smooth to the end, with no visible stop. Test the 102 seconds on a simulated clock, so the test does not take 102 seconds.

## The tick box

- Add `interactive` to the theme switcher panel in `snippet.template.js`, next to `skin`, with the same look. Store it in `localStorage` as `technozen-interactive`. Default on.
- It works without a restart in both directions.
- Only Take has drops in this round. On the other four themes, and when `skin` is off, show the box disabled with a tooltip saying so.
- Turning it off, switching theme, turning the skin off or pressing remove must take away the canvas, all listeners, observers and timers, and leave nothing running.
- Running the snippet again must not double anything. It must survive Claude moving between pages. If the system asks for reduced motion, default to off.

## Performance is a requirement

The owner has asked for this app to be fast and light, and these limits are pass or fail:

- At rest: no animation frame requested and no timers running, so 0% CPU from this feature. Any new event wakes it.
- Moving: a frame costs under 2 ms of script and drawing on the owner's PC, and it must keep up with the screen.
- Never read layout inside an animation frame. Measure app shapes in batches, at most about 10 times a second and only while something is changing, using `IntersectionObserver`, `ResizeObserver` and a `MutationObserver` limited to what the feature needs. Long transcripts must not slow down: only shapes on screen count.
- Pre-render each drop size once, and redraw only what moved.
- Frosted panels re-blur whatever moves behind them. This is the biggest risk, so measure it. If it exceeds the budget, report the numbers and the options to the owner, and do not silently change how the panels look.
- Keep the snippet small. Report its size before and after.

## Read first, and do not break

- Read `NOTES.md`, `skins/take.css`, `leaf.py`, `build.py`, `snippet.template.js` and `test.py`. Use the app's stable hooks listed in `NOTES.md`, never generated class names, and no `:has()`.
- Claude's page blocks scripts and stylesheets from localhost, and `data:` images are allowed. Verify anything else in the running app before relying on it, including that drawing `data:` images to a canvas works.
- The helper's proof that the theme ran depends on the snippet finishing without an error. A failure in this feature must never stop the theme from applying: catch it, leave the static skin on, and log it to the console.
- Never restart Claude, open its DevTools, or send keystrokes to its window from this session. Those keystrokes get sent as chat messages. The owner's next Claude start is the real test.

## Tests and process

- Put the physics in pure functions with no page access, and test them in `test.py` or a small script it runs: rest at exactly 102 s, restart on a new push, mouse beats app at the same spot, a still app applies no force, a drop driven by the mouse passes through a shape, and no drop is lost.
- Prove the tests work by breaking each behaviour on purpose and showing that a test fails.
- Try it in `preview.html` in the browser pane, with a scrolling page and a simulated stream of text. Measure frame time and at-rest activity. A pane that is hidden pauses animation frames, so do not trust timings from a hidden pane.
- Run a multi-agent adversarial review before shipping, and fix what survives.
- Stay in the turn while background work runs, and keep the task list on the current step. Do not go silent.
- Then rebuild with `python build.py` and `python installer/build_exe.py`, run `python test.py` and the self-test, bump the version, install the helper, commit, push and publish a release, as the earlier releases did.

## Report back

Lead with whether it works. Give measured numbers for frame cost, CPU at rest and snippet size, and name anything you could not verify in the real app. How it feels is the owner's call, so ask only about that.
