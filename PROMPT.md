# Prompt: Build "Technozen for Claude" — 5 switchable themes, open source

Paste everything below this line into Claude Code as one message.

---

Build an open-source theme pack called **Technozen for Claude**: five distinct Technozen themes for the Claude desktop app (Windows, this machine) with a hotkey switcher, plus the same five themes as Claude Code CLI theme files. Simplest possible code, zero dependencies, readable by a stranger on GitHub. Work in `technozen-claude-theme/` (this folder). Do not ask me questions; make the call, write it down in the README, and keep going.

## 1. Facts already established (do not re-research; verify hands-on in Phase 0)

**Every working Claude desktop theme uses one mechanism.** Enable Developer Mode (Help > Troubleshooting > Enable Developer Mode), open DevTools (Ctrl+Shift+I), paste a JS snippet into Sources > Snippets, run it with Ctrl+Enter. The snippet appends one `<style>` element that overrides the app's CSS custom properties with `!important`. Nothing persists across app restart: the snippet is saved by DevTools but must be re-run each launch. App updates rename tokens and break themes. Patching the app itself (asar) is blocked on this Windows MSIX install (signed package, integrity fuses, folder wiped on update). Do not attempt it.

**Projects to copy from** (read the actual code, not the README):
- https://github.com/rinn7e/claude-desktop-theme-tuner — `src/theme/tokens.ts` (13 semantic colors expanded to ~68 variables) and `snippets/diagnose.snippet.js` (detects which tokens an app update renamed).
- https://github.com/pcastro93/claude-desktop-themes — TOML palette → `generator/generate.py` → `theme.css` + `apply-theme.js`. The apply script finds-or-creates `<style id="custom-theme">`, sets `textContent`, and re-appends it to `<head>` so it stays last. Undo is `document.getElementById('custom-theme').remove()`. Its `css-dump/vars.colors.css` is the most complete token list.
- https://greasyfork.org/en/scripts/567497 (R89.Claude.Catppuccin) — the only existing in-page multi-theme switcher: a settings panel, live preview, `<style id>` rewrite with no reload. Copy the switch-without-reload idea; skip the panel.
- https://github.com/clausqr/claude-themes — one CSS file per theme scoped under `html[data-phosphor="<name>"]`. Copy the data-attribute scoping; it is the simplest switch.
- https://github.com/catppuccin/userstyles/blob/main/styles/claude/catppuccin.user.less — most recently maintained token map (Nov 2026). Its PR #2285 documents the new component layers.
- https://github.com/patrickjaja/claude-desktop-extra — Linux only, but its README documents token roles (`--bg-000` lightest panel, `--bg-100` content, `--bg-200` sidebar, `--bg-400/500` backdrop).
- https://code.claude.com/docs/en/terminal-config#create-a-custom-theme — official CLI theme format.

**The app has three overlapping token layers. A theme must set all three, every declaration `!important`:**
1. Legacy claude.ai tokens, bare HSL triplets consumed as `hsl(var(--x))`: `--bg-000..500`, `--text-000..500`, `--border-100..400`, `--accent-brand`, `--accent-000/100/200/900`, `--accent-main-*`, `--accent-secondary-*`, `--oncolor-100..300`, `--danger/success/warning-000/100/200/900`. Format is `"210 40% 96%"` with no `hsl()` wrapper.
2. Claude Design System hex tokens on `html.cds-root[data-mode="dark"|"light"]`: `--cds-page-bg`, `--cds-surface-0..3`, `--cds-surface-panel`, `--cds-surface-popover`, `--cds-text-primary/secondary/muted`, `--cds-border`, `--cds-border-strong`, `--cds-role-accent-400/450/600`, `--cds-bg-accent`, `--cds-text-accent`, `--cds-fill-field`, `--cds-fill-ghost-hover`, `--cds-fill-ghost-selected`, `--cds-fizzy-lake-color-sidebar`, `--cds-tooltip-bg`.
3. Code-tab frame tokens on `[data-frame-mode="code"]` and `.epitaxy-root`: `--df-z0..z6`, `--df-bg-page-hsl` (HSL triplet), `--df-bg-page`, `--df-sidebar-bg`, `--df-hover`, `--df-selected`, `--surface-primary`, `--surface-panel`.

The app sets these with selectors up to five parts deep, which is why `!important` on `:root, :root *` is what every project ends up using. The Code tab may be a cross-origin iframe (`a.claude.ai`); if so, one snippet cannot reach it from the Chat frame and the README must say so.

**Claude Code CLI themes** (official, update-proof): one JSON per theme at `%USERPROFILE%\.claude\themes\<slug>.json` with `name`, `base` (`dark`|`light`), and `overrides` (token → `#rrggbb`). Tokens include `claude`, `text`, `inactive`, `subtle`, `suggestion`, `permission`, `success`, `error`, `warning`, `promptBorder`, `planMode`, `autoAccept`, `diffAdded`, `diffRemoved`, `userMessageBackground`, `selectionBg`. Unknown tokens are ignored. Select with `/theme` or `"theme": "custom:<slug>"` in settings.json. Needs CLI ≥ 2.1.118. Folder hot-reloads.

## 2. The five themes

Technozen, per the Aesthetics Wiki, is white, matte silver, light blue, light green, unstained light wood, diffuse shadowless light, "cold but cute" (Wii, DS Lite, MUJI, Asimo). It is NOT glossy Frutiger Eco green or neon. Three themes are light and two are dark; the dark ones stay matte and calm. Only five hex values below are sourced (`#7EC8E3`, `#87CEEB`, `#0997FF`, `#FCC9B9`, `#7CFC00`); the rest are starting points you may tune, but every final text/background pair must pass the contrast test in Phase 3.

| slug | name | mode | bg | surface | text | muted | accent | accent2 | border | glow | motif |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `shiro` | Shiro Ceramic | light | `#FFFFFF` | `#F6F7F8` | `#2B2F33` | `#6B7178` | `#2E9BD6` | `#BFC5CA` | `#E3E6E9` | `#CFEAF7` | Wii channel tiles, blue underglow |
| `take` | Take Karesansui | light | `#F4F3EE` | `#FFFFFF` | `#2E3A33` | `#64705F` | `#4F8F4B` | `#B8A98A` | `#D6DAD2` | `#A8D8A0` | raked sand lines, one stone |
| `sakura` | Sakura Mokuzai | light | `#FBF3F2` | `#FFFFFF` | `#4A3A3A` | `#86716F` | `#C96C83` | `#9C7A66` | `#EBD5D3` | `#FCC9B9` | blossom dots on light wood |
| `mizu` | Mizu Glass | dark | `#0B2A3F` | `#123A55` | `#E8F6FB` | `#9CC2D4` | `#35C7E8` | `#8FE36B` | `#1F5478` | `#7EC8E3` | Endless Ocean, top-edge specular |
| `yoru` | Yoru Lantern | dark | `#16181D` | `#1F2229` | `#ECEEF2` | `#9A9FA8` | `#F2B35B` | `#8FB3C9` | `#2C3038` | `#5FD3F3` | paper-lantern amber on charcoal |

Each theme has exactly these 8 semantic tokens. Every app variable in section 1 is derived from them in one mapping table. If you need a 9th token for all five, add it; never add a token to only one theme.

## 3. Phases. Do them in order. Log results as you go in `NOTES.md`.

### Phase 0 — Hands-on verification (30 minutes, nothing built yet)
In the Claude desktop app on this PC (MSIX build, v4.x):
1. Confirm Help > Troubleshooting > Enable Developer Mode exists. Record where `developer_settings.json` is written (candidates: `%APPDATA%\Claude`, `%LOCALAPPDATA%\Claude-Data`, `%LOCALAPPDATA%\Packages\Claude_*\LocalCache\Roaming\Claude`).
2. Confirm Ctrl+Shift+I opens DevTools. Check whether the Code tab is a separate frame in the DevTools frame picker.
3. In the console, dump every custom property on `document.documentElement`, `.dframe-root`, and `.epitaxy-root` whose name matches `/bg|surface|text|border|accent|fill|page|sidebar|z\d|hover|selected/`. Save to `css-dump/vars.json`. This is the real token list for THIS build; it overrides section 1 where they differ.
4. Confirm which root selector matches: `html.cds-root[data-mode]` vs `:root[data-color-version="v2"][data-mode]` vs `[data-theme=claude]`.
5. Inject a one-line test style (`--cds-page-bg: red !important`) and check it survives switching Chat → Code → Cowork. If `<head>` is remounted, you need a MutationObserver that re-appends the style.
6. Confirm `localStorage` persists across an app restart (the switcher stores the chosen theme there).
7. Run `claude --version`; confirm ≥ 2.1.118 and that `/theme` opens.
8. Check Settings > Claude Code for a "Code appearance" dropdown and whether it lists files from `~/.claude/themes`.
Write every answer in `NOTES.md`. If Developer Mode does not exist in this build, stop and report; only the CLI themes are shippable then.

### Phase 1 — Copy the methods, then improve them
Read the code of the seven projects in section 1. Write `NOTES.md` section "What each project does and what we take". Then implement these improvements, which none of them has together:
- **In-app switching with no reload**: `html[data-technozen="<slug>"]` scoping + one `<style>` with all five blocks. Switching is one attribute change.
- **Hotkey**: Ctrl+Shift+T cycles the five themes. Ctrl+Shift+0 removes the theme (undo).
- **Remembers the last theme** via `localStorage`.
- **Drift detector** built into the apply snippet: after applying, read back each variable with `getComputedStyle` and `console.warn` any that did not take. That is theme-tuner's diagnose idea, run automatically, so an app update is caught the moment it breaks something.
- **One source, four outputs**: `themes.json` is the only place colors live. A generator emits everything else.
- **Survives SPA remounts** with a MutationObserver that re-appends the style if it disappears (only if Phase 0 step 5 shows it is needed; otherwise leave it out and say why).

### Phase 2 — Build. Files, nothing more:
```
technozen-claude-theme/
  README.md            how to install (3 steps), switch, undo, fix after an update, license
  NOTES.md             Phase 0 answers + what was copied from where
  LICENSE              MIT
  themes.json          five themes × 8 tokens, the only hand-edited file
  build.py             stdlib only. themes.json → dist/technozen.css, dist/technozen.snippet.js,
                       dist/technozen.user.js, dist/cli-themes/<slug>.json
  test.py              stdlib only. See Phase 3.
  css-dump/vars.json   from Phase 0
  dist/                generated, committed so users can download without running Python
```
Rules: no npm, no pip, no build tool, no classes where a function will do, no config options nobody asked for. Each file under 200 lines. Comment only the why (e.g. why `!important`, why re-append last, why HSL triplets). Variable names a non-programmer can read. The generated CSS is also valid as a Stylus userstyle for claude.ai in a browser; the `.user.js` is the same snippet with a Tampermonkey header (`@match https://claude.ai/*`, `@run-at document-start`). One mapping table in `build.py` converts the 8 semantic tokens into every app variable; hex → HSL-triplet conversion is one small function.

### Phase 3 — Test every bit of code, batch, before touching the app
`test.py` runs all checks and exits non-zero on any failure. Required checks:
1. `themes.json`: exactly 5 themes, each with exactly the same 8 token keys, every value matches `^#[0-9A-Fa-f]{6}$`, slugs unique, names unique.
2. WCAG contrast (compute it, don't eyeball): `text` on `bg` ≥ 4.5, `text` on `surface` ≥ 4.5, `muted` on `bg` ≥ 3.0, `accent` on `bg` ≥ 3.0, white or `text` on `accent` ≥ 4.5 for whichever is used on buttons. Print a table of every ratio.
3. Distinctness: pairwise hue distance between the five `accent` values ≥ 30°, and no two `bg` values within ΔE-ish distance (simple RGB Euclidean < 20 fails). This is the "very distinct" guarantee.
4. Generated CSS: every variable from the mapping table appears in all five blocks; every declaration ends with `!important`; HSL-triplet variables contain no `hsl(` or `#`; hex variables contain no `%`. Count of `{` equals count of `}`.
5. Generated JS: `node --check` on both JS files if Node exists, else a regex check for balanced braces and that the CSS string is correctly escaped (no unescaped backtick or `</script>`).
6. CLI JSON: each of the 5 files parses, `base` ∈ {dark, light}, every override is `#rrggbb`, token names ⊆ the official list.
7. Round trip: hex → HSL triplet → hex is within ±1 per channel.
8. Idempotence: running `build.py` twice produces byte-identical `dist/`.
Run `build.py` then `test.py`. Fix until green. Paste the final test output into `NOTES.md`.

### Phase 4 — Verify in the real app, one theme at a time
Apply the snippet, cycle all five with the hotkey, and for each take a screenshot of Chat view and Code view. Check: sidebar, message bubbles, input box, popover/menu, tooltip, dialog, code block, selected sidebar item, hover state. List any element that stayed stock in `NOTES.md` under "Known gaps" (expect: artifact/preview panes, possibly the Code tab if it is cross-origin). Restart the app and confirm the remembered theme comes back after one Ctrl+Enter. Drop the five CLI JSON files into `~/.claude/themes/`, run `/theme`, confirm all five appear and switch live.

### Phase 5 — Ship
README: three install steps with the exact menu path and hotkey, a 5-row table with one screenshot per theme, "After a Claude update: run `build.py` after updating `css-dump/vars.json`, the drift warnings tell you which names changed", and the limitation that the desktop snippet must be re-run after each launch (Anthropic issue anthropics/claude-code#79305 tracks native support). Credit the seven projects by name and link. MIT license. Then `git init`, commit, and tell me the folder is ready to push.

## 4. Done means
`python test.py` is green, all five themes screenshot correctly in Chat view, the hotkey cycles and persists, the five CLI themes show in `/theme`, and the README lets someone who has never used DevTools install it in under five minutes. Report what you could not verify and why.
