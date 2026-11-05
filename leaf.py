"""Draws the 'green leaf with water drops' background for the Take skin as one SVG string.
build.py embeds it as a data: URI.
Droplets are gradient-only (no per-drop filters) so the image rasterizes fast; the one noise
filter is a 400px pattern tile, not a full-screen raster."""
import random

W, H = 1600, 1000


# One water drop at unit size: offset shadow, refracting body, dark rim, caustic, blurred highlight, sharp glint.
DROP = ("<g id='d'><ellipse rx='1.1' ry='.7' cx='.3' cy='.65' fill='url(#shadow)'/><ellipse rx='1' ry='1' fill='url(#body)'/>"
        "<ellipse rx='1' ry='1' fill='none' stroke='url(#rim)'/><ellipse rx='.5' ry='.2' cx='.05' cy='.62' fill='url(#caustic)'/>"
        "<ellipse rx='.42' ry='.3' cx='-.3' cy='-.4' fill='url(#highlight)'/><ellipse rx='.13' ry='.08' cx='-.36' cy='-.5' fill='#fff' opacity='.95'/></g>")


DROP_DEFS = """<radialGradient id="body" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#fff" stop-opacity=".04"/><stop offset=".62" stop-color="#eaffc8" stop-opacity=".1"/><stop offset=".86" stop-color="#3f9a28" stop-opacity=".22"/><stop offset="1" stop-color="#0d4a12" stop-opacity=".55"/>
</radialGradient>
<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".45" stop-color="#4caa2c" stop-opacity=".2"/><stop offset="1" stop-color="#0b3d0f" stop-opacity=".8"/>
</linearGradient>
<radialGradient id="shadow" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#063a0a" stop-opacity=".38"/><stop offset=".6" stop-color="#063a0a" stop-opacity=".18"/><stop offset="1" stop-color="#063a0a" stop-opacity="0"/>
</radialGradient>
<radialGradient id="highlight" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
<radialGradient id="caustic" cx=".5" cy=".5" r=".5">
<stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
</radialGradient>
""".replace("\n", "") + DROP


def droplet(x, y, r, ry, stroke):
    return f"<use href='#d' transform='translate({x} {y})scale({r} {ry})' stroke-width='{stroke}'/>"


def drops(seed=7, count=120):
    """[x, y, r, ry, stroke width at unit size], the same drops in the same places on every build."""
    rng = random.Random(seed)   # fixed seed: the build must be reproducible
    out = []
    for _ in range(count):
        r = rng.choice([5, 6, 8, 8, 10, 12, 14, 18, 24, 32, 44, 60])
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        if r >= 24 and 0.25 * W < x < 0.75 * W:   # keep big drops out of the middle, where the chat sits
            x = x - 0.25 * W if x < 0.5 * W else x + 0.25 * W
        ry = r * rng.uniform(0.95, 1.15)   # slightly taller than wide, like a drop at rest
        out.append([round(x), round(y), r, round(ry, 1), round(max(1.2, r * 0.07) / r, 3)])
    return out


def veins():
    """A midrib and curved side veins, faint, lighter than the leaf."""
    paths = ['<path d="M -100 620 Q 800 420 1700 300"/>']
    for i in range(9):
        x0 = 60 + i * 180
        paths.append(f'<path d="M {x0} {600 - i * 35} q 120 -220 260 -420"/>')
        paths.append(f'<path d="M {x0 + 90} {620 - i * 35} q 60 180 200 360"/>')
    return "".join(paths)


def svg(seed=7, count=120):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="leaf" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#c4f24e"/><stop offset=".45" stop-color="#84d431"/><stop offset="1" stop-color="#2f8f1c"/>
</linearGradient>
<filter id="cells" x="0" y="0" width="1" height="1">
<feTurbulence type="fractalNoise" baseFrequency=".02 .035" numOctaves="2" seed="{seed}"/>
<feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .95  0 0 0 0 .25  0 0 0 .2 0"/>
</filter>
<pattern id="tile" width="400" height="400" patternUnits="userSpaceOnUse">
<rect width="400" height="400" filter="url(#cells)"/>
</pattern>
{DROP_DEFS}
</defs>
<rect width="{W}" height="{H}" fill="url(#leaf)"/>
<rect width="{W}" height="{H}" fill="url(#tile)"/>
<g fill="none" stroke="#e4ff9a" stroke-width="3" opacity=".28" stroke-linecap="round">{veins()}</g>
{"".join(droplet(*d) for d in drops(seed, count))}
</svg>"""
