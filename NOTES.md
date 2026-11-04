# Build notes

Written 2026-11-03 while building this. Keep for the next person who has to fix it after a Claude update.

## Phase 0: what was checked on this machine

| Question | Answer |
|---|---|
| Claude desktop build | MSIX package `Claude_pzs8sxrjxfjjc` (Windows 11). App data lives in `%LOCALAPPDATA%\Claude-Data\claude_pzs8sxrjxfjjc\`. |
| Developer Mode | Not enabled at build time: no `developer_settings.json` anywhere under AppData. The menu path (Help > Troubleshooting > Enable Developer Mode) is from Anthropic's docs and the reference projects; it was not clicked here because this build ran unattended. Once enabled, the settings file should appear in the Claude-Data folder above. |
| DevTools shortcut | Ctrl+Shift+I per Anthropic's docs. Not pressed here. |
| Token dump | Done against the live claude.ai web app (build `84f6710620`), which is the same bundle the desktop app renders. 122 variables resolved. Saved in `css-dump/vars.json`. |
| Root selector | `<html class="cds-root" data-theme="claude" data-color-version="v2" data-mode="light|dark">`. Mode colors are set by `[data-color-version="v2"][data-theme="claude"][data-mode="dark"]` (older tokens) and `html.cds-root` (newer tokens). |
| Injection / CSP | An appended `<style>` with `!important` on `:root, :root *` overrides every variable. Inline styles are not blocked. Fetching a script from localhost IS blocked by CSP, so the snippet must be pasted, not loaded. |
| SPA remount | Not tested (the browser pane was on the sign-in page, not a signed-in session). The reference projects do not use a MutationObserver and report it works, so none was added. `apply()` re-appends the style every time it runs, so a hotkey press also repairs a lost style. |
| localStorage | Survives a page reload (tested: value `sakura` persisted). |
| Claude Code CLI | 2.1.300 installed. `~/.claude/themes/` did not exist; it was created and the five JSON files copied in. `/theme` was not opened (interactive), and because the folder was new, a restart is needed before it lists them. |
| Code tab `--df-*` / `--surface-*` tokens | Not present on the sign-in page; the mapping for them is taken from theme-tuner, pcastro93 and daijro's script. Unverified live. |
| `--accent-main-*`, `--accent-secondary-*`, `--surface-000..200` | Do not exist in this build (some userstyles still set them; harmless). |
| `--cds-neutral-0..900` | Exists (22 steps, saved under `neutral_ramp` in `vars.json`), flips with mode, and is what Tailwind `bg-neutral-*` classes paint. Missing it made dark themes show a light container; now generated as a bg-to-text mix. |

## What was copied from where

- **Style injection and re-append** (keep our `<style>` last in `<head>`): pcastro93/claude-desktop-themes `apply-theme.js`.
- **Semantic colors -> many variables, one mapping table, HSL triplets for the old tokens**: rinn7e/claude-desktop-theme-tuner `tokens.ts`.
- **`html[data-x="slug"]` scoping so a switch is one attribute change**: clausqr/claude-themes `content.js`.
- **Switch without reload by rewriting one `<style>`**: R89.Claude.Catppuccin.
- **Code tab selectors** (`[data-frame-mode="code"]`, `.epitaxy-root`, `--surface-*`): daijro's OLED userscript.
- **Role of each `--bg-*` step**: patrickjaja/claude-desktop-extra README.
- **CLI theme format**: code.claude.com/docs/en/terminal-config.

## What this does that those don't

- Five themes in one file, cycled with Ctrl+Alt+T, choice remembered. (Ctrl+Shift+T was the first choice; browsers reserve it for "reopen closed tab", so the userscript could never see it.)
- Drift check after every apply: warns in the console when no large surface is painted in the theme's colors (what a token rename looks like). One timer, cancelled on the next apply or remove, so fast cycling cannot produce a false warning.
- Re-running the snippet does not stack keyboard listeners.
- `remove()` restores the app's own light/dark mode, unless the app changed it itself while the theme was on.
- Accent used as text (`--cds-text-accent`, `--cds-role-accent-600`, `--accent-000`) is a step darker/lighter than the accent fill, as stock does, and tested at 4.5:1.
- Contrast, distinctness and output validity are tested before anything touches the app.

## Test output (final run)

```
theme     text/bg text/surf muted/bg accent/bg on/accent  link/bg link/surf
shiro      13.49     12.34     5.40      4.17      4.52    5.59      5.12
take       10.46     11.34     4.96      4.18      4.74    5.24      5.68
sakura      9.57     10.23     4.20      4.23      4.74    5.20      5.56
mizu       13.41     10.79     7.82      7.92     10.10    8.91      7.16
yoru       15.29     13.71     6.68      9.62     10.23   10.77      9.66
ok  test_palette / build / test_contrast / test_distinct / test_css / test_js / test_cli_themes / test_round_trip / test_idempotent
all green
```

The first run failed on `take` and `sakura` on/accent (4.41 and 4.35); both accents were darkened one step. The review then showed accent-as-link text was only held to 3:1; the link columns were added and the link tokens now use a darker (or on dark themes lighter) step of the accent.

## Live verification

All five themes were applied to claude.ai in the desktop app's browser pane (sign-in page) and screenshotted into `screenshots/`. Hotkey cycling, removal, re-apply, and localStorage persistence across reload were exercised with synthetic key events (which reach the page directly, so they do not prove a real keypress gets past the browser; that is why the hotkey avoids browser-reserved chords). The signed-in chat view, the Code tab, popovers and dialogs were not seen; those are the first things to look at on a signed-in app.

An adversarial review (three reviewers, each finding independently re-checked) found 11 real issues before the first commit: accent-as-text contrast, test order, stale CLI files on rename, the reserved hotkey, a drift-check race, a stale data-mode restore, dark-theme shimmer colors, and four documentation errors. All fixed.

## Skins (added the same day)

What the live page allows, checked on claude.ai in Chrome 152 (the desktop app's engine): `data:` SVG and PNG images load with no CSP violation; inline `<svg>` with filters works; `backdrop-filter`, `color-mix()`, `:has()`, CSS nesting and `corner-shape` are supported. A `<link>` to a localhost stylesheet and `fetch()` to localhost are blocked, so the snippet must stay one self-contained paste.

A second research pass pulled the app's own bundle (build `360b60fdaa`, 2026-11-04) and catalogued its hooks; the skins use those: `[data-cds-part="paint"]` (the button fill span), `[data-cds-icon-only]`, `[data-cds="ChatComposer"]`, `[data-cds="Dialog"]`, `[data-cds="Popover"]`, `[data-cds="Menu"]`, `[data-cds="TextArea"]`, `[data-cds-popup]`, `[data-row]` (sidebar rows), `.cds-card-fill`, `.dframe-content` (paints `--df-bg-page`), `.epitaxy-codeblock`, and the variables `--cds-message-bubble-radius`, `--msg-block-radius`, `--cds-radius-composer`. They come from the bundle's CSS and JSX, not from a signed-in screenshot; the hooks that older scripts used (`[data-radix-*]`, `[data-testid="user-message"]`, `[data-user-message-bubble]`, `[data-frame-mode]`) are gone from that build and test.py rejects them.

The drift check in the snippet measures with the skin attribute temporarily off, because every skin replaces the plain page colors with gradients and glass. The leaf background is a 56 KB SVG (77 KB as a data URI) with 720 gradient ellipses; Chromium re-rasterizes it at viewport size on resize (about 30-50 ms per frame while dragging the window edge), not while scrolling.

Hooks that exist on the sign-in page and in the reference projects' chat selectors: `[data-cds="Button"]` (with an inner `span.cds-btn-squish` at z-index -1 that paints the fill; the droplet gloss lives on that span so it stays under the label), `[data-cds="TextInput"]`, `[data-cds="Field"]`, `[data-cds="Form"]` (a bare wrapper, do not style it as a panel), `nav`, `[data-cds="Panel"]`, `[data-cds="Card"]`, `[data-cds="UserMessage"]`, `.ProseMirror`, `.dframe-sidebar`. The page color is painted by `body.bg-surface-1`; the leaf therefore goes on `<html>` and `.bg-surface-1/2` are made transparent in the Take skin.

Two parser facts that cost time: `@keyframes` placed inside a nested rule are silently dropped (build.py hoists them to the top level, and test.py checks that none remain nested), and a CDS button paints its fill on an inner `span.cds-btn-squish` at z-index -1, so any gloss put on the button's own `::before` ends up hidden under that span. `preview.html` reproduces these hooks so the generated CSS can be checked without signing in.

The leaf is `leaf.py`: a lime-to-green gradient, faint veins, a fractal-noise cell texture tiled at 400 px, and 120 seeded droplets (shadow offset lower-right, refracting body gradient, dark rim, soft upper-left highlight plus a sharp dot; gradients only, no per-drop filters). Big drops are kept out of the middle half of the width, where the chat sits. Compared against the reference image side by side in the browser pane.

A second adversarial review (three reviewers, each finding re-checked) found 15 issues in the skin layer before the final commit, among them petals painting over the transcript (`html::after` needs `z-index: -1`), wet headlines applied inside white dialogs, secondary text too faint on the leaf, a drift check that always warned with a skin on, a comment-blind `@keyframes` hoist, and a nested-keyframes test that only looked at the first rule. All fixed.

## The Windows installer (added the same day)

Read from the app bundle (`app.asar`, Store build 4.16336) and tested where possible:

- The app refuses to start if its command line carries `remote-debugging-port`, `remote-debugging-pipe` or a dozen other Chromium switches (a denylist in the main bundle), so Chrome DevTools Protocol injection is out. Signed builds also ignore `CLAUDE_USER_DATA_DIR`, and a second launch just hands its arguments to the running instance.
- Developer Mode is `developer_settings.json` with `{"allowDevTools": true}` in the app's user data folder (`%LOCALAPPDATA%\Claude-Data\claude_<id>\` for the Store build, `%APPDATA%\Claude` for older installs). The schema has that one key. The Developer menu's visibility is computed at startup, so it needs a restart.
- With Developer Mode on, the environment variable `CLAUDE_DEV_TOOLS` (`undocked`, `detach`, `bottom`, `left`, `right`) makes the app open DevTools on its main window at startup. The DevTools shortcut is **Ctrl+Alt+I** (Ctrl+Shift+I is the model picker).
- The Store build's launch alias is `%LOCALAPPDATA%\Microsoft\WindowsApps\claude-desktop.exe`; it accepts arguments and passes environment variables through.

`installer/TechnozenInstaller.cs` builds with the `csc.exe` that ships in every Windows (.NET Framework 4.x), so there is no SDK to install. Version 1.0.0 used a Start Menu launcher shortcut; the owner reopened Claude the normal way and the theme was gone, so 1.1.0 switched to a watcher: Install writes the Developer Mode file, sets the user-level environment variable `CLAUDE_DEV_TOOLS=undocked` (registry plus broadcast, so Start and taskbar launches inherit it), copies the EXE to `%LOCALAPPDATA%\Programs\Technozen for Claude\`, and puts a `--watch` shortcut in the Startup folder. The watcher (one instance, guarded by a named mutex) polls every second for a visible window owned by the Claude app whose title contains "Developer Tools" or "DevTools", once per Claude process: it brings it to the front (an Alt tap lifts Windows' foreground lock if needed), types Ctrl+Shift+P, "Show Console", Enter, Ctrl+V, "allow pasting", Enter, Ctrl+V, Enter, then sends WM_CLOSE. The double paste handles Chromium's one-time self-XSS warning either way. The first version's launch path was confirmed working by the owner (shortcut, copy, restart, injection); the watcher path is tested by the owner too, because this session runs inside the Claude app it would restart.

1.2.0 removes the white flash the owner disliked. The helper is now a WinForms message loop polling every 100 ms: on a new Claude process it shows a loading card (borderless, rounded, WS_EX_NOACTIVATE so clicks on it never steal the keyboard focus the typing needs, WS_EX_TOPMOST, mouse ripples, CRT scanlines and sweep), hides Claude's main window with ShowWindow(SW_HIDE) as soon as it is visible (not moved off-screen: Electron saves window bounds on move, and an off-screen position would be remembered), parks the DevTools window at -32000,-32000 (off-screen windows can still be foreground), types on a worker thread with trimmed waits (about five seconds), then SW_SHOW + SetForegroundWindow on Claude and fades the card. If DevTools never appears within 40 s, or Claude quits, the window is shown anyway. `--demo out.png` renders the card to a file, which is how it was checked here without a desktop session. The app has no hook before first paint (checked every CLAUDE_* environment variable it reads and every insertCSS/loadExtension call in the bundle), so this is the closest possible to a pre-applied theme on the Store build.

A third adversarial review (three reviewers, each finding re-checked with C# harnesses compiled by the system csc.exe) found ten issues in the first installer draft. The two that would have broken every run: the process-name test was case-sensitive while the real process name is lowercase `claude`, and that same name belongs to the Claude Code CLI, so the launcher would have killed every CLI session. Now only processes whose executable path is the desktop app count, Claude is asked to close and never killed, the EXE is copied to `%LOCALAPPDATA%\Programs\Technozen for Claude\` before the shortcut points at it, clipboard failures are caught, work runs off the UI thread with the buttons disabled, and Uninstall asks before turning Developer Mode off.

## The singing orbs (1.3.0)

`installer/Orbs.cs`: `Scene` is a 60 Hz fixed-step physics with 4 or 5 circles (mass = radius squared), inverse-square mouse repulsion (`9000 / (d² + 400)`, cut off beyond 500 px, speed capped at 14 px per step), 0.995 damping, elastic collisions (restitution 0.92, overlap split by inverse mass, standard normal impulse), walls resolved after collisions so nothing can be pushed out. A strike only counts when its loudness (impulse / 25000) is at least 0.06 and that pair has not rung in the last 150 ms. `Synth` streams 48 kHz 16-bit stereo through `waveOut` with four 20 ms buffers filled by its own thread; a 4096-entry sine table, one motion sine per orb with speed-driven amplitude (60 ms attack, 300 ms release), up to four bells of four partials each (ratios 1, 2, 2.76, 4.07; decays 2, 1.4, 0.9, 0.6 s as per-sample multiplies), left partials on one orb's fundamental and right partials on the other's, a strike scheduled at the next rendered frame, tanh limiter, master 0.6. Fundamentals are picked 180 to 600 Hz with 4 to 9 Hz between neighbours so every pair beats audibly; the owner's 40/60 Hz example would be inaudible on laptop speakers, which is written in the brief. `--selftest report.txt` checks it headlessly: 2000 seeds place without overlap and with every pair beating at 3 to 30 Hz; a scripted head-on collision conserves momentum (apart from damping), separates and rings loud; a parked cursor repels; a 10 s sweep stays finite and contained, energy only decays once the mouse leaves, strikes land in a sane count; a cursor-pinned pair rings at most every 300 ms (contact-based ringing with a 4 px separation hysteresis); the offline render has a sane peak and RMS, true stereo difference, a strike scheduled at the next rendered frame and loudest within one buffer; voice stealing does not click (a stolen bell fades out in a 10 ms tail instead of stopping dead); the WAVEHDR flags offset matches the process bitness; and, when a sound device exists, the real stream keeps rendering past its first queued buffers. That last check exists because the review found the shipped 64-bit build reading the flags at the 32-bit offset, which would have silenced the card after 80 ms. The card logs the chosen frequencies, whether a sound device opened and the DPI scale.

1.3.1: the owner's first 1.3.0 start failed all six paste attempts (log: DevTools found at 994 ms, no marker ever, 44 s of card). A harness proved the input shield passes the helper's own keystrokes (SendKeys and SendInput both arrive with the injected flag), and Claude had not updated, so the likely cause is timing: the old sequence pasted 130 KB, typed "allow pasting", pasted again and pressed Enter with half-second gaps while Claude was still starting and the card now also costs CPU. The sequence is now paste, wait 1.5 s, Enter, wait 1.5 s, check the marker; only if it is missing does it answer the one-time paste warning and paste again; four attempts at most, so a failed start costs about 25 s, not 44. Also on the owner's request: the card is a quarter larger (one scale factor), orb radii spread 26 to 77 px, speed halved (cap 7 px per step, half the mouse force, drag 0.99), mass grows as radius^2.5, and loudness follows closing speed with a steeper curve and a higher ceiling (bell amplitude 0.7, master 0.75).

Known latency: a strike starts at the next rendered buffer and sits behind up to three queued 20 ms buffers plus the audio stack, so the bell is heard roughly 60 to 100 ms after the collision; the flash ring is delayed by 75 ms to meet it. Sub-buffer alignment is not possible through winmm and is not attempted. The helper itself now scans for Claude twice a second and caches which pids are the app; the 1.2.x helper queried every process's path ten times a second and cost several percent of a core.

## Known gaps

- No persistence across desktop app restarts (no startup hook; same as every other project).
- Code tab and artifact/preview panes unverified.
- `--cds-gray-*` primitives are left stock (mode-independent, used for a few icons).
- Status colors (danger, success, warning) are left stock on purpose.

## Redoing the token dump after an update

`build.py` writes `css-dump/names.json`, the list of every variable the theme sets. With the theme NOT applied, open DevTools on claude.ai or the app and run this in the console (paste the array from names.json in place of `[...]`):

```js
const names = [...];
const cs = getComputedStyle(document.documentElement);
names.filter(n => !cs.getPropertyValue(n).trim());
```

The names it prints no longer exist in the app (renamed or dropped). Search the app's stylesheets for the old value in `css-dump/vars.json` to find the new name, then update `variables()` in `build.py`. Variables that only exist in the Code tab (`--df-*`, `--surface-*`) will show as missing on the chat page; run the check on the Code tab too before deciding they are gone.
