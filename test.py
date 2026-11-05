"""Checks themes.json and everything build.py generates. Run: python test.py
Exits 1 on the first group of failures. No dependencies."""
import colorsys
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys

import build
from build import DIST, THEMES, TOKENS, accent_text, contrast, on_color, rgb, triplet, variables

HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
CLI_TOKENS = {  # from https://code.claude.com/docs/en/terminal-config#create-a-custom-theme
    "claude", "text", "inverseText", "inactive", "subtle", "suggestion", "permission", "remember",
    "success", "error", "warning", "merged", "promptBorder", "planMode", "autoAccept", "bashBorder",
    "ide", "fastMode", "effortUltra", "diffAdded", "diffRemoved", "diffAddedDimmed", "diffRemovedDimmed",
    "diffAddedWord", "diffRemovedWord", "userMessageBackground", "userMessageBackgroundHover",
    "bashMessageBackgroundColor", "memoryBackgroundColor", "selectionBg", "composerSidebarBackground",
    "rate_limit_fill", "rate_limit_empty", "briefLabelYou", "briefLabelClaude",
    "claudeShimmer", "warningShimmer", "permissionShimmer", "promptBorderShimmer", "inactiveShimmer", "fastModeShimmer",
}
failures = []


def check(ok, message):
    if not ok:
        failures.append(message)


def hue_gap(a, b):
    d = abs(colorsys.rgb_to_hsv(*(c / 255 for c in rgb(a)))[0] - colorsys.rgb_to_hsv(*(c / 255 for c in rgb(b)))[0]) * 360
    return min(d, 360 - d)


def test_palette():
    check(len(THEMES) == 5, f"expected 5 themes, got {len(THEMES)}")
    names = [t["name"] for t in THEMES.values()]
    check(len(set(names)) == len(names), "theme names are not unique")
    for slug, t in THEMES.items():
        check(re.fullmatch(r"[a-z]+", slug), f"{slug}: slug must be lowercase letters")
        check(t["mode"] in ("light", "dark"), f"{slug}: mode must be light or dark")
        check(set(t) == set(TOKENS) | {"name", "mode"}, f"{slug}: keys must be exactly name, mode, {TOKENS}")
        for k in TOKENS:
            check(HEX.match(str(t.get(k, ""))), f"{slug}.{k}: not #RRGGBB")


def test_contrast():
    print(f"{'theme':8} {'text/bg':>8} {'text/surf':>9} {'muted/bg':>8} {'accent/bg':>9} {'on/accent':>9} {'link/bg':>8} {'link/surf':>9}")
    for slug, t in THEMES.items():
        on, link = on_color(t["accent"]), accent_text(t)
        ratios = {
            "text/bg": (contrast(t["text"], t["bg"]), 4.5),
            "text/surf": (contrast(t["text"], t["surface"]), 4.5),
            "muted/bg": (contrast(t["muted"], t["bg"]), 3.0),
            "accent/bg": (contrast(t["accent"], t["bg"]), 3.0),
            "on/accent": (contrast(on, t["accent"]), 4.5),
            "link/bg": (contrast(link, t["bg"]), 4.5),
            "link/surf": (contrast(link, t["surface"]), 4.5),
        }
        print(f"{slug:8} " + " ".join(f"{v:>{len(k)}.2f}" for k, (v, _) in ratios.items()))
        for k, (v, minimum) in ratios.items():
            check(v >= minimum, f"{slug}: {k} contrast {v:.2f} < {minimum}")


def test_distinct():
    slugs = list(THEMES)
    for i, a in enumerate(slugs):
        for b in slugs[i + 1:]:
            gap = hue_gap(THEMES[a]["accent"], THEMES[b]["accent"])
            check(gap >= 30, f"{a}/{b}: accent hues only {gap:.0f} degrees apart (need 30)")
            dist = math.dist(rgb(THEMES[a]["bg"]), rgb(THEMES[b]["bg"]))
            check(dist >= 10, f"{a}/{b}: backgrounds only {dist:.0f} RGB units apart (need 10)")


def test_css():
    text = (DIST / "technozen.css").read_text(encoding="utf-8")
    check(text.count("{") == text.count("}"), "css: unbalanced braces")
    check("__LEAF" not in text and "url(http" not in text, "css: placeholder left in or external URL used")
    for slug in THEMES:
        skin = build.ROOT / "skins" / f"{slug}.css"
        check(skin.exists(), f"skins/{slug}.css is missing")
        check(f'html[data-technozen="{slug}"][data-technozen-skin="on"] {{' in text, f"css: no skin block for {slug}")
        nested = build.skin_css(slug).split("\n}\n", 1)[0]  # everything before the hoisted frames
        check("@keyframes" not in nested, f"css: {slug} skin has @keyframes nested inside the theme block (the browser drops those)")
        src = skin.read_text(encoding="utf-8")
        # hooks that no longer exist in the app (see NOTES.md), and :has() which is re-evaluated on every DOM change
        for stale in ("data-radix", 'data-testid="user-message"', "data-user-message-bubble", "data-frame-mode", "button.cds-reset", ":has("):
            check(stale not in src, f"skins/{slug}.css uses {stale}, which is stale or too slow for a streaming transcript")
    wanted = sum((build.ROOT / "skins" / f"{s}.css").read_text(encoding="utf-8").count("@keyframes") for s in THEMES)
    check(text.count("@keyframes") == wanted, f"css: expected {wanted} @keyframes, found {text.count('@keyframes')}")
    text = text[:text.index('[data-technozen-skin="on"]')]  # the palette checks below are about the color blocks only
    sample = variables(next(iter(THEMES.values())))
    for slug in THEMES:
        block = re.search(rf'html\[data-technozen="{slug}"\].*?\n\}}', text, re.S)
        check(block, f"css: no block for {slug}")
        if not block:
            continue
        body = block.group(0)
        for name in sample:
            check(f"\n  {name}: " in body, f"css: {slug} is missing {name}")
    for line in text.splitlines():
        if not line.startswith("  --"):
            continue
        check(line.endswith(" !important;"), f"css: not !important: {line.strip()}")
        name, value = line.strip().split(": ", 1)
        value = value.removesuffix(" !important;")
        if re.fullmatch(r"[\d.]+ [\d.]+% [\d.]+%", value):
            continue  # a bare HSL triplet
        check(re.fullmatch(r"#[0-9A-F]{6}([0-9A-F]{2})?", value), f"css: {name} value is neither hex nor triplet: {value}")
    for name in sample:
        is_triplet = re.fullmatch(r"[\d.]+ [\d.]+% [\d.]+%", sample[name])
        is_hex = re.fullmatch(r"#[0-9A-F]{6}([0-9A-F]{2})?", sample[name])
        check(is_triplet or is_hex, f"mapping: {name} has an unexpected value {sample[name]}")
        if name.startswith(("--bg-", "--text-", "--border-", "--accent", "--brand", "--oncolor", "--df-z", "--df-bg-page-hsl", "--pictogram")):
            check(is_triplet, f"mapping: {name} must be an HSL triplet, got {sample[name]}")
        if name.startswith(("--cds-", "--surface-", "--prompt-")) or name in ("--df-bg-page", "--df-sidebar-bg"):
            check(is_hex, f"mapping: {name} must be hex, got {sample[name]}")


def test_js():
    for file in ("technozen.snippet.js", "technozen.user.js"):
        text = (DIST / file).read_text(encoding="utf-8")
        check(text.count("{") == text.count("}"), f"{file}: unbalanced braces")
        check("</script" not in text.lower(), f"{file}: contains </script>")
        check(text.count("`") % 2 == 0 and "${CSS" not in text, f"{file}: template literals must be balanced and never wrap the CSS")
        check('id: "technozen-panel"' in text and ".tz-swatch" in text, f"{file}: the floating panel is missing")
        check(len(text) < 400_000, f"{file}: {len(text) // 1024} KB is too big to paste comfortably (limit 400 KB)")
        if shutil.which("node"):
            r = subprocess.run(["node", "--check", str(DIST / file)], capture_output=True, text=True)
            check(r.returncode == 0, f"{file}: node --check failed:\n{r.stderr}")
        else:
            print("node not found, skipped syntax check for", file)
    check("@match        https://claude.ai/*" in (DIST / "technozen.user.js").read_text(encoding="utf-8"), "user.js: missing @match")


def test_drops():
    import leaf
    check(leaf.svg().count("<use ") == 120 and leaf.svg(count=0).count("<use ") == 0, "leaf: bare version must have no drops, normal one 120")
    if not shutil.which("node"):
        return print("node not found, skipped the drops physics")
    spec = build.ROOT / "dist" / "drops.spec.tmp"
    spec.write_text(json.dumps({"drops": leaf.drops()}), encoding="utf-8")
    r = subprocess.run(["node", str(build.ROOT / "drops.test.js"), str(spec)], capture_output=True, text=True)
    spec.unlink()
    print(r.stdout.strip())
    check(r.returncode == 0, "drops physics:\n" + r.stderr)


def test_cli_themes():
    on_disk = {p.stem for p in (DIST / "cli-themes").glob("*.json")}
    check(on_disk == set(THEMES), f"cli-themes/ has {sorted(on_disk)} but themes.json has {sorted(THEMES)}")
    for slug, t in THEMES.items():
        data = json.loads((DIST / "cli-themes" / f"{slug}.json").read_text(encoding="utf-8"))
        check(data["base"] in ("dark", "light"), f"cli {slug}: base must be dark or light")
        check(set(data) == {"name", "base", "overrides"}, f"cli {slug}: unexpected top-level keys")
        for k, v in data["overrides"].items():
            check(k in CLI_TOKENS, f"cli {slug}: unknown token {k}")
            check(HEX.match(v), f"cli {slug}: {k} is not #RRGGBB")


def test_round_trip():
    for slug, t in THEMES.items():
        for k in TOKENS:
            h, s, l = (float(x.rstrip("%")) for x in triplet(t[k]).split())
            back = tuple(round(c * 255) for c in colorsys.hls_to_rgb(h / 360, l / 100, s / 100))
            check(all(abs(a - b) <= 1 for a, b in zip(back, rgb(t[k]))), f"{slug}.{k}: HSL round trip drifted to {back}")


def test_idempotent():
    def digest():
        return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in DIST.rglob("*") if p.is_file()}
    first = digest()
    build.build()
    check(first == digest(), "build.py is not idempotent: dist/ changed on a second run")


if __name__ == "__main__":
    # test_palette runs before the build so a bad themes.json gets a message, not a traceback
    for test in (test_palette, build.build, test_contrast, test_distinct, test_css, test_js, test_drops, test_cli_themes, test_round_trip, test_idempotent):
        test()
        if failures:
            print(f"\nFAIL in {test.__name__}:")
            print("\n".join("  " + f for f in failures))
            sys.exit(1)
        print(f"ok  {test.__name__}")
    print("\nall green")
