"""Turns themes.json into everything in dist/ (see README). Run: python build.py"""
import colorsys
import json
import pathlib
import urllib.parse

ROOT = pathlib.Path(__file__).parent
DIST = ROOT / "dist"
TOKENS = ["bg", "surface", "text", "muted", "accent", "accent2", "border", "glow"]
NEUTRAL_STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 850, 900]
THEMES = json.loads((ROOT / "themes.json").read_text(encoding="utf-8"))


# ---- color helpers ---------------------------------------------------------

def rgb(hex6):
    return tuple(int(hex6[i:i + 2], 16) for i in (1, 3, 5))


def triplet(hex6_):
    # "#1A2B3C" -> "210.0 38.9% 17.3%": claude.ai's older tokens are consumed as hsl(var(--x)),
    # so they must be bare H S% L% with no hsl() wrapper.
    r, g, b = (c / 255 for c in rgb(hex6_))
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return f"{h * 360:.1f} {s * 100:.1f}% {l * 100:.1f}%"


def alpha(hex6_, percent):
    # "#RRGGBB", 12 -> "#RRGGBB1F": the app's own tokens use 8-digit hex for translucent fills.
    return hex6_ + "%02X" % round(percent * 255 / 100)


def mix(a, b, amount):
    return "#%02X%02X%02X" % tuple(round(x + (y - x) * amount) for x, y in zip(rgb(a), rgb(b)))


def luminance(hex6_):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (channel(c) for c in rgb(hex6_))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    """WCAG contrast ratio, 1.0 to 21.0."""
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def on_color(background):
    """White or near-black, whichever reads better on the given color."""
    return max(("#FFFFFF", "#111111"), key=lambda c: contrast(c, background))


def accent_text(t):
    """Accent used as text (links): a step toward the text color, as stock does (450 fill vs 600 text)."""
    return mix(t["accent"], t["text"], 0.25)


# ---- the mapping: 8 theme colors -> every variable the app reads -----------

def variables(t):
    """Returns {css variable: value}. One table, used for every output."""
    bg, sf, tx, mu, ac, a2, bd, gl = (t[k] for k in TOKENS)
    on, link = on_color(ac), accent_text(t)
    hexes = {
        # Page, panels, popovers, sidebar. --cds-surface-1/2 is the page, 0/3 are raised panels.
        "--cds-page-bg": bg, "--background-color-page": bg, "--cds-surface-1": bg, "--cds-surface-2": bg,
        "--cds-fill-field": bg, "--cds-surface-0": sf, "--cds-surface-3": sf, "--cds-surface-panel": sf,
        "--cds-surface-popover": sf, "--cds-fizzy-lake-color-sidebar": sf,
        "--cds-fizzy-lake-color-card-hover": alpha(gl, 50),
        "--df-bg-page": bg, "--df-sidebar-bg": sf, "--df-web-sidebar-bg": sf, "--df-sidebar-tint": sf,
        # Code tab (the "epitaxy" surfaces)
        "--surface-primary": bg, "--surface-primary-elevated": sf, "--surface-panel": sf,
        "--surface-panel-elevated": sf, "--surface-popover": sf, "--surface-popover-elevated": sf,
        "--surface-hud": sf, "--surface-prompt-blur": sf, "--prompt-compact-bg": sf,
        # Text. --cds-neutral-900 is the "ink" the app derives translucent overlays from.
        "--cds-text-primary": tx, "--cds-text-secondary": mu, "--cds-text-muted": mu,
        "--cds-text-stays-secondary": mu, "--cds-neutral-900": tx, "--cds-tooltip-bg": tx,
        "--cds-fill-primary": tx, "--cds-fill-primary-hover": mu, "--cds-on-primary": bg,
        "--cds-alpha-1": alpha(tx, 5), "--cds-alpha-2": alpha(tx, 10), "--cds-alpha-3": alpha(tx, 20),
        "--cds-backdrop": alpha(tx, 45),
        # Borders
        "--cds-border": bd, "--cds-border-line": bd, "--cds-fizzy-lake-color-seam": bd,
        "--cds-fizzy-lake-color-composer-ring": bd, "--cds-ring-color": bd,
        "--cds-border-strong": alpha(mu, 40), "--cds-border-stronger": alpha(mu, 60),
        # Accent. --cds-clay is the Claude-orange used by the logo and spinner.
        "--cds-role-accent-400": ac, "--cds-role-accent-450": ac, "--cds-role-accent-600": link,
        "--cds-fill-accent": ac, "--cds-fill-accent-hover": mix(ac, tx, 0.15), "--cds-text-accent": link,
        "--cds-role-accent-on": on, "--cds-on-accent": on, "--cds-border-accent": alpha(ac, 35),
        "--cds-bg-accent": alpha(ac, 14), "--cds-bg-accent-muted": alpha(ac, 10),
        "--cds-bg-accent-chip": alpha(ac, 14), "--cds-bg-accent-layer": alpha(ac, 7),
        "--cds-clay": ac, "--cds-clay-emphasized": mix(ac, tx, 0.15),
        # Second accent: your own message bubbles and the "Pro" purple.
        "--cds-bg-user-message": alpha(a2, 22), "--cds-fill-pro": a2, "--cds-bg-pro": alpha(a2, 14),
        # Glow: hover, selected and highlight fills.
        "--cds-bg-highlight": alpha(gl, 55), "--cds-fill-ghost-hover": alpha(gl, 45),
        "--cds-fill-ghost-selected": alpha(gl, 75), "--cds-fill-secondary": alpha(gl, 35),
        "--cds-fill-secondary-hover": alpha(gl, 55), "--cds-fill-button-ghost-hover": alpha(gl, 55),
        "--cds-bg-neutral": alpha(gl, 35), "--cds-bg-neutral-hover": alpha(gl, 55),
        "--cds-fizzy-lake-color-selected-hover": alpha(gl, 80),
        "--df-hover": alpha(gl, 45), "--df-selected": alpha(gl, 75), "--df-selected-base": gl,
    }
    # Older claude.ai tokens, bare HSL. --bg-000 is the lightest surface (popovers), --bg-100 the
    # page; the app applies its own alpha to --border-*, so those hold a full-strength color.
    triplets = {
        "--bg-000": sf, "--bg-100": bg, "--bg-200": sf, "--bg-300": sf, "--bg-400": bd, "--bg-500": bd,
        "--text-000": tx, "--text-100": tx, "--text-200": tx, "--text-300": mu, "--text-400": mu, "--text-500": mu,
        "--border-100": mu, "--border-200": mu, "--border-300": mu, "--border-400": mu,
        "--accent-brand": ac, "--brand-000": ac, "--brand-100": ac, "--brand-200": ac,
        "--accent-000": link, "--accent-100": ac, "--accent-200": ac, "--accent-900": gl,
        "--accent-pro-000": a2, "--accent-pro-100": a2, "--accent-pro-200": a2, "--accent-pro-900": gl,
        "--oncolor-100": on, "--pictogram-100": bd,
        "--df-z0": bg, "--df-z1": sf, "--df-z2": sf, "--df-z3": bd, "--df-z4": bd, "--df-z5": mu, "--df-z6": mu,
        "--df-bg-page-hsl": bg,
    }
    # The app also has a mode-flipping neutral ramp (0 = page, 900 = ink) that Tailwind classes like
    # dark:bg-neutral-30 paint from. Stock is near-linear, so a straight mix from bg to text matches it.
    neutral = {f"--cds-neutral-{n}": mix(bg, tx, n / 900) for n in NEUTRAL_STEPS}
    out = dict(hexes)
    out.update(neutral)
    out.update({k: triplet(v) for k, v in triplets.items()})
    return out


def css():
    """Every declaration is !important: the app re-sets these variables with selectors up to
    five parts deep, and an !important override is the only thing that beats all of them."""
    blocks = []
    for slug, t in THEMES.items():
        lines = [f"  color-scheme: {t['mode']} !important;"]
        lines += [f"  {k}: {v} !important;" for k, v in variables(t).items()]
        sel = f'html[data-technozen="{slug}"]'
        blocks.append(f"/* {t['name']} ({t['mode']}) */\n{sel}, {sel} * {{\n" + "\n".join(lines) + "\n}")
    blocks += [skin_css(slug) for slug in THEMES if (ROOT / "skins" / f"{slug}.css").exists()]
    return "/* Technozen for Claude. Generated by build.py from themes.json; edit that, not this. */\n\n" + "\n\n".join(blocks) + "\n"


def skin_css(slug):
    """skins/<slug>.css, nested under the theme + skin-on selector (CSS nesting, Chrome 120+).
    Images are inlined as data: URIs so the snippet stays one self-contained paste."""
    text = (ROOT / "skins" / f"{slug}.css").read_text(encoding="utf-8")
    if "__LEAF__" in text:
        import leaf
        text = text.replace("__LEAF__", "data:image/svg+xml," + urllib.parse.quote(leaf.svg(), safe="/:=.,;' -_()"))
    return f'html[data-technozen="{slug}"][data-technozen-skin="on"] {{\n{text}\n}}'


def snippet():
    # The drift check compares painted backgrounds against these; rgb() is what getComputedStyle returns.
    paint = {slug: {"mode": t["mode"], "paint": ["rgb(%d, %d, %d)" % rgb(t[k]) for k in ("bg", "surface")]}
             for slug, t in THEMES.items()}
    template = (ROOT / "snippet.template.js").read_text(encoding="utf-8")
    # json.dumps makes the CSS a plain quoted string, so no backtick or ${} escaping to get wrong.
    return template.replace("__THEMES__", json.dumps(paint)).replace("__CSS__", json.dumps(css()))


def userscript():
    header = """// ==UserScript==
// @name         Technozen for Claude
// @namespace    technozen-claude-theme
// @version      1.0.0
// @description  Five switchable Technozen themes for claude.ai. Ctrl+Alt+T cycles, Ctrl+Alt+0 removes.
// @match        https://claude.ai/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==
"""
    return header + snippet()


def cli_theme(slug, t):
    """Claude Code CLI only paints a few things; the terminal owns the background, so text colors
    are left to the base preset and only accents and fills are set."""
    # Shimmer is the LIGHTER color in the spinner gradient; on dark themes glow is dark, so lift it.
    shimmer = t["glow"] if t["mode"] == "light" else mix(t["accent"], t["text"], 0.5)
    return {
        "name": "Technozen " + t["name"],
        "base": t["mode"],
        "overrides": {
            "claude": t["accent"], "claudeShimmer": shimmer,
            "promptBorder": t["accent"], "promptBorderShimmer": shimmer,
            "permission": t["accent2"], "permissionShimmer": shimmer,
            "planMode": t["accent2"], "suggestion": t["accent"],
            "selectionBg": t["glow"],
            "userMessageBackground": t["surface"], "userMessageBackgroundHover": t["glow"],
            "composerSidebarBackground": t["surface"],
        },
    }


def build():
    (DIST / "cli-themes").mkdir(parents=True, exist_ok=True)
    for old in (DIST / "cli-themes").glob("*.json"):
        old.unlink()  # a renamed theme must not leave its old file behind
    names = list(variables(next(iter(THEMES.values()))))  # for the after-an-update recipe in NOTES.md
    (ROOT / "css-dump" / "names.json").write_text(json.dumps(names, indent=0) + "\n", encoding="utf-8", newline="\n")
    (DIST / "technozen.css").write_text(css(), encoding="utf-8", newline="\n")
    (DIST / "technozen.snippet.js").write_text(snippet(), encoding="utf-8", newline="\n")
    (DIST / "technozen.user.js").write_text(userscript(), encoding="utf-8", newline="\n")
    for slug, t in THEMES.items():
        (DIST / "cli-themes" / f"{slug}.json").write_text(
            json.dumps(cli_theme(slug, t), indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"built {len(THEMES)} themes into {DIST}")


if __name__ == "__main__":
    build()
