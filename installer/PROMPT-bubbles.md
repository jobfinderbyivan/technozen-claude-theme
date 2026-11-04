# Prompt: singing glass orbs for the Claude start-up card

Paste everything below the line into Claude Code, in the `technozen-claude-theme` folder.

---

Replace the start-up card's artwork in `installer/TechnozenInstaller.cs` (class `Loader`) with an interactive scene of glass bubble spheres that make bell tones, in the Y2K / Frutiger Aero style of the reference: transparent chrome-rimmed glass globes over a bright green meadow and blue sky, soft bokeh, specular highlights. Keep everything else the card already does. Do not ask questions; decide, write the decision in NOTES.md, keep going.

## What must not change (read the code first)

- `Loader` is a borderless, rounded, topmost, **WS_EX_NOACTIVATE** WinForms window (it must never take keyboard focus: the helper is typing into DevTools while the card is up). Mouse *moves* reach it even while `InputShield` is on; mouse *buttons* and keys do not. So all interaction is mouse movement.
- `Loader.Progress(float)` is set by the helper at real milestones and the bar must only ever show that value. The owner's rule: a progress bar that moves on a timer is a lie. Keep the bar, keep it honest.
- No text on the card except the "Claude" wordmark. No "Technozen", no "loading" chatter.
- The helper is one C# file compiled by `python installer/build_exe.py` with the `csc.exe` that ships in Windows (.NET Framework 4.x). No NuGet, no NAudio, no extra DLLs. `--demo out.png` renders the card to a file; keep that working and make it render the orbs.
- The card lives for 5 to 15 seconds per Claude start and runs on anyone's PC. Budget: under 2 percent CPU for the scene, audio never glitches, no allocation in the per-frame or per-audio-buffer paths after start.

## The scene

- 4 or 5 orbs (random count), radii 34 to 70 px, each with a random glass tint (pale aqua, lime, lilac, chrome-blue), a random position that does not overlap, a small random drift velocity, and a random **tone** (see audio). Everything is seeded from `Environment.TickCount` so every boot differs; `--demo` uses a fixed seed.
- Physics at a fixed 60 Hz step (accumulate real time, step in 1/60 s slices, cap at 4 steps per frame):
  - mass = radius squared; velocities in px per step.
  - Walls: bounce inside the card's rounded face with 0.9 restitution.
  - Mouse = reverse gravity: force on each orb = k / (distance squared + 400) pointing away from the cursor, capped so an orb cannot exceed ~14 px per step. The cursor position comes from `MouseMove`; when the cursor is outside the card there is no force.
  - Orb-orb: circle test, resolve overlap along the normal (split by inverse mass), then the standard 2D elastic impulse with restitution 0.92. Record each collision as `(orbA, orbB, impulse)` for the audio and a flash for the visuals.
  - Light damping (0.995 per step) so the scene settles when the mouse leaves.
- Drawing in GDI+ per frame (33 ms timer, already there): sky-to-meadow background (keep the green glow and scanlines but push the palette to the reference: sky blue top, lime-green bottom, a soft horizon band); each orb = radial-gradient body (nearly transparent centre, tinted rim), a dark refracted rim at the lower right, a bright specular ellipse at the upper left, a sharp white dot, a faint chrome ring, a soft contact shadow; on collision a brief white flash ring at the contact point that fades over 300 ms. Draw orbs back-to-front by radius so big ones read as nearer.

## The audio (this is the point)

A small software synth streaming to the sound card with **winmm** `waveOut*` via P/Invoke: 48 kHz, 16-bit, **stereo**, four 20 ms buffers in rotation, filled on a dedicated thread. No other audio API. Master output through a soft limiter (`tanh`) so it can never clip.

Each orb owns a bell voice with a fundamental `f` chosen at boot. The owner's example uses 40 Hz and 60 Hz; honour the mechanic exactly but choose fundamentals the average laptop speaker can reproduce: pick each `f` from 180 to 900 Hz, and pick them so that every pair differs by 3 to 30 Hz where possible, since that difference is what the brain hears as the binaural beat. Write the chosen values to the helper log at start.

- **Motion tone.** While an orb moves, its voice plays a soft sine at `f` whose amplitude follows speed: target amplitude = min(1, speed / 6) × 0.12, approached with a 60 ms attack and 300 ms release so it swells and fades rather than clicks. A resting orb is silent.
- **Collision bell.** When orb A (fundamental `fA`) strikes orb B (`fB`) with impulse `J`, start one bell event whose loudness is proportional to `J` (normalise by the largest plausible impulse, clamp to 1). The bell is a struck singing-bowl voice: partials at 1.0, 2.0, 2.76, 4.07 times the fundamental with amplitudes 1, 0.5, 0.25, 0.12 and exponential decays of 2.0, 1.4, 0.9, 0.6 seconds, plus a 15 ms attack. **Binaural**: the left channel's partials are built on `fA`, the right channel's on `fB`, so each ear gets one tone and the listener's head makes the beat. If both orbs were moving, their motion tones are already sounding and the bell's attack is timed to the collision frame exactly, so the swell and the strike line up; the peak of the bell must coincide with the collision, not lag a buffer behind (keep a per-voice sample-accurate start offset inside the buffer).
- **Mixing.** Sum all voices, multiply by a master gain (0.6), soft-limit, write interleaved 16-bit L/R. Keep the math to sines, multiplies and exponential decays per sample; precompute per-voice phase increments; no allocation per buffer; at most 5 motion voices and 8 simultaneous bells (oldest replaced).
- Start the audio stream when the card opens, stop and close it when the card fades. Headphones recommended for the binaural effect; speakers still get a pleasant bell.

## Tests (add to installer/, run by hand, document in NOTES.md)

- `--demo out.png` still renders, now with orbs and one collision flash.
- A headless `--selftest` flag that runs 600 physics steps with a scripted cursor path and asserts: no NaN, no orb outside the face, kinetic energy never increases without the mouse, at least one collision occurred; then renders 2 seconds of audio with two scripted collisions into a buffer and asserts: peak below 0.99, RMS above 0.01, left and right channels differ (true stereo), and the bell peak lands within one buffer of the collision sample. Print PASS/FAIL lines; exit code non-zero on failure.
- Keep `python test.py` green (it checks the snippet, not the EXE).

## Deliver

Build with `python installer/build_exe.py`, bump VERSION, replace the installed helper on this PC the detached way (kill the running helper, copy the EXE to `%LOCALAPPDATA%\Programs\Technozen for Claude\`, relaunch via the Startup shortcut through explorer.exe), update README (one paragraph, one new screenshot from `--demo`) and NOTES, commit, push, and publish a versioned GitHub release. Report what could not be verified without a desktop session (sound through real speakers, mouse feel).
