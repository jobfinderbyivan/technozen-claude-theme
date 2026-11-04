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

Hooks that exist on the sign-in page and in the reference projects' chat selectors: `[data-cds="Button"]` (with an inner `span.cds-btn-squish` at z-index -1 that paints the fill; the droplet gloss lives on that span so it stays under the label), `[data-cds="TextInput"]`, `[data-cds="Field"]`, `[data-cds="Form"]` (a bare wrapper, do not style it as a panel), `nav`, `[data-cds="Panel"]`, `[data-cds="Card"]`, `[data-cds="UserMessage"]`, `.ProseMirror`, `.dframe-sidebar`. The page color is painted by `body.bg-surface-1`; the leaf therefore goes on `<html>` and `.bg-surface-1/2` are made transparent in the Take skin.

Two parser facts that cost time: `@keyframes` placed inside a nested rule are silently dropped (build.py hoists them to the top level, and test.py checks that none remain nested), and a CDS button paints its fill on an inner `span.cds-btn-squish` at z-index -1, so any gloss put on the button's own `::before` ends up hidden under that span. `preview.html` reproduces these hooks so the generated CSS can be checked without signing in.

The leaf is `leaf.py`: a lime-to-green gradient, faint veins, fractal-noise cell texture, and 120 seeded droplets (shadow offset lower-right, refracting body gradient, dark rim, blurred upper-left highlight plus a sharp dot). About 60 KB as SVG, 85 KB as a data URI. Compared against the reference image side by side in the browser pane.

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
