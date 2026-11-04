# Technozen for Claude

Five Technozen themes for the Claude desktop app and claude.ai, switchable with a hotkey, plus the same five as Claude Code CLI themes. Technozen is the Japanese cousin of Frutiger Aero: white, matte silver, light wood, soft blue and green, calm. Think Wii menu, DS Lite, a MUJI shelf.

| Theme | Mode | Look | |
|---|---|---|---|
| **Shiro Ceramic** `shiro` | light | white, matte silver, Wii blue | ![shiro](screenshots/shiro.jpg) |
| **Take Karesansui** `take` | light | raked sand, bamboo green | ![take](screenshots/take.jpg) |
| **Sakura Mokuzai** `sakura` | light | dusty pink, light wood | ![sakura](screenshots/sakura.jpg) |
| **Mizu Glass** `mizu` | dark | deep sea navy, aqua | ![mizu](screenshots/mizu.jpg) |
| **Yoru Lantern** `yoru` | dark | charcoal, lantern amber | ![yoru](screenshots/yoru.jpg) |

## Windows: the one-click installer

Download **Technozen for Claude.exe** from the [latest release](https://github.com/jobfinderbyivan/technozen-claude-theme/releases/latest) and run it. **Install and apply** copies the program to your user folder, turns on Claude's Developer Mode, and starts a small helper that also starts at every login. From then on the theme goes on by itself every time Claude opens, however you start it. To show it right away, Claude is closed once (it asks first; unsaved text is lost) and reopened. **Uninstall** stops and removes the helper and asks whether to turn Developer Mode off too.

How it works: with Developer Mode on, Claude opens its own DevTools whenever a certain environment variable is set, and the installer sets it for your account. The helper waits for that DevTools window, pastes the theme into the console with keystrokes, and closes DevTools again; it takes about ten seconds after Claude opens, during which you should keep your hands off the keyboard and mouse. It does this once per Claude run, so DevTools windows you open yourself afterwards are left alone. Windows SmartScreen will warn because the file is not code-signed, and some antivirus tools dislike programs that send keystrokes; choose "More info" > "Run anyway", or build it yourself from `installer/` with `python installer/build_exe.py` (uses the compiler that ships with Windows).

## Install in the Claude desktop app by hand (Windows / macOS)

The desktop app has no theme setting yet ([anthropics/claude-code#79305](https://github.com/anthropics/claude-code/issues/79305) tracks it), so the theme is a small script you run once per launch from the app's own developer tools.

1. In Claude: **Help > Troubleshooting > Enable Developer Mode** (once), then restart Claude. Press **Ctrl+Alt+I** (Cmd+Option+I on Mac) to open DevTools, or use the **Developer > Show Dev Tools** menu.
2. Click the **Console** tab, paste the whole of [`dist/technozen.snippet.js`](dist/technozen.snippet.js), press **Enter**. Close DevTools.
3. Done. The app is now in Shiro Ceramic.

- A small panel appears in the bottom-right corner: click a swatch to switch theme, tick **skin** for the full skin or untick it for colors only, **×** removes the theme, the round button folds the panel away. Everything is remembered.
- Hotkeys do the same: **Ctrl+Alt+T** cycles to the next theme, **Ctrl+Alt+S** switches the skin off and on, **Ctrl+Alt+0** removes everything.
- Your choice is remembered. After restarting Claude: Ctrl+Alt+I, Console, press the **Up arrow** to recall the snippet, Enter. It comes back in the theme you left it in. (If you prefer, save it under DevTools > Sources > Snippets and run it with Ctrl+Enter.)
- From the DevTools console you can also run `technozen.apply("mizu")` or `technozen.remove()`.
- If you change Claude's own Appearance setting while a theme is on, cycle Ctrl+Alt+T back round to your theme, or run `technozen.apply("take")` in the console.

## Install on claude.ai in a browser

Install [`dist/technozen.user.js`](dist/technozen.user.js) in Tampermonkey or Violentmonkey. Same hotkeys. (Stylus alone cannot switch themes, because each block is keyed to an attribute on `<html>`. If you only want one theme in Stylus: set claude.ai's own Appearance to that theme's light or dark first, then paste `dist/technozen.css` and change that theme's selector to `html, html *`.)

## Install in Claude Code (the terminal)

Copy the files in `dist/cli-themes/` into `~/.claude/themes/` (on Windows `%USERPROFILE%\.claude\themes\`). If that folder did not exist before, restart Claude Code once. Then run `/theme` and pick one. They set the accent, prompt border, selection and message backgrounds; the terminal keeps its own background and text colors, so pick a light theme on a light terminal and a dark one on a dark terminal. Needs a Claude Code version whose `/theme` offers custom themes (see [the docs](https://code.claude.com/docs/en/terminal-config#create-a-custom-theme)).

## Change the colors

Colors come from one file, [`themes.json`](themes.json); shapes from `skins/<slug>.css` (plain CSS, nested under the theme selector by the build). Edit either, then:

```bash
python build.py
```

```bash
python test.py
```

`test.py` checks contrast (WCAG 4.5:1 for body text and link text, 3:1 for muted text and accent fills), that the five themes are visibly distinct, that every generated file is valid, and that the build is reproducible. Python 3.10+, no packages. Node is optional (it syntax-checks the JS when present).

## After a Claude update

Claude occasionally renames the CSS variables the theme sets. When that happens the snippet prints a warning in the console: `[technozen] the app is not painting theme colors...`. To fix it, follow the recipe at the end of `NOTES.md` (it uses `css-dump/names.json`, the list of every variable the theme sets), update the mapping table in `build.py`, rebuild, and run the tests.

## Colors and skins

Each theme has two layers:

- **Colors** (`themes.json`): eight colors mapped onto every CSS variable the app reads. This alone recolors the whole app and keeps Claude's shapes.
- **Skin** (`skins/<slug>.css`): shapes, gloss, backgrounds and motifs on top. Take is a wet green leaf with every button a water drop (the background is drawn by `leaf.py`, no image files). Mizu is deep water with glass panes, Yoru a dark room lit by one paper lantern, Sakura petals over light wood, Shiro white ceramic tiles.

Ctrl+Alt+S toggles the skin layer; the choice is remembered separately from the theme.

| Take skin | Shiro | Sakura | Mizu | Yoru |
|---|---|---|---|---|
| ![take skin](screenshots/skin-take.jpg) | ![shiro skin](screenshots/skin-shiro.jpg) | ![sakura skin](screenshots/skin-sakura.jpg) | ![mizu skin](screenshots/skin-mizu.jpg) | ![yoru skin](screenshots/skin-yoru.jpg) |

To see any theme without the app, serve the folder and open `preview.html`:

```bash
python -m http.server 8765
```

then visit `http://127.0.0.1:8765/preview.html#take` (buttons in the corner switch theme and skin).

## How it works

One `<style>` element. Five color blocks, each scoped to `html[data-technozen="<slug>"]`, override the app's CSS custom properties with `!important`; five skin blocks are scoped to `html[data-technozen="<slug>"][data-technozen-skin="on"]` and use CSS nesting. Switching changes one attribute on `<html>`; nothing reloads. The app has three layers of variables (the older claude.ai `--bg-*`/`--text-*` HSL triplets, the newer `--cds-*` hex tokens, and the Code tab's `--df-*` frame tokens) and all three are set from the same eight colors. Skins target the app's stable hooks (`data-cds="Button"`, `data-cds="Panel"`, `nav`, `aside`, the `.ProseMirror` composer) rather than its generated class names.

## Credits

The mechanism and the variable names come from reading these projects. None of them is affiliated with this one.

- [rinn7e/claude-desktop-theme-tuner](https://github.com/rinn7e/claude-desktop-theme-tuner) (token mapping, update diagnosis)
- [pcastro93/claude-desktop-themes](https://github.com/pcastro93/claude-desktop-themes) (generator shape, style re-append trick)
- [clausqr/claude-themes](https://github.com/clausqr/claude-themes) (data-attribute scoping)
- [catppuccin/userstyles](https://github.com/catppuccin/userstyles/tree/main/styles/claude) (newest token map)
- [R89.Claude.Catppuccin](https://greasyfork.org/en/scripts/567497) (switching without reload)
- [daijro's Claude OLED theme](https://greasyfork.org/en/scripts/555074) (Code tab selectors)
- [patrickjaja/claude-desktop-extra](https://github.com/patrickjaja/claude-desktop-extra) (token roles)

Technozen references: [Aesthetics Wiki](https://aesthetics.fandom.com/wiki/Technozen), [skeuoss.net](https://skeuoss.net/blogs/aesthetics/technozen), the Theme Plaza 3DS themes [Technozen Bamboo](https://themeplaza.art/item/98816) and [TechnoZen Sakura](https://themeplaza.art/item/96983).

## Limitations

- The desktop snippet does not persist across app restarts. The app has no startup hook for user scripts.
- Artifact and preview panes keep their own styling.
- The Code tab was mapped from other projects' selectors, not verified live here. If it stays stock, see `NOTES.md`.
- Skins use `backdrop-filter` blur on panels. On a weak GPU with a very long transcript, turn the skin off (Ctrl+Alt+S) if scrolling stutters.
- The theme sets the app's light/dark attribute to match itself. Changing Appearance in Claude's settings while themed has no visible effect until you re-apply or remove the theme.

MIT license.
