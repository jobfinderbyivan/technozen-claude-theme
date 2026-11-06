"""The live things floating over each theme, in the same form as leaf.py's drops: one unit-size shape and a list of where they sit.
Take's are its water drops. tint colors ripples and pops; lift makes them rise while moving; spin turns them as they travel; glow brightens them with speed."""
import random
import leaf

BEAD = ("<radialGradient id='s'><stop offset='0' stop-color='#2b2f33' stop-opacity='.2'/><stop offset='1' stop-color='#2b2f33' stop-opacity='0'/></radialGradient>"
        "<radialGradient id='b' cx='.42' cy='.35' r='.7'><stop offset='0' stop-color='#fff'/><stop offset='.7' stop-color='#f3f5f7'/><stop offset='1' stop-color='#cdd5db'/></radialGradient>"
        "<g id='d'><ellipse rx='1.1' ry='.7' cx='.2' cy='.6' fill='url(#s)'/><circle r='1' fill='url(#b)' stroke='#c3ccd3'/>"
        "<path d='M-.82-.12A.82.82 0 0 1 .82-.12Q0 .1-.82-.12Z' fill='#fff' opacity='.8'/><ellipse cy='.7' rx='.52' ry='.17' fill='#2f8fe0' opacity='.28'/></g>")

PETAL = ("<linearGradient id='p' x1='.5' y1='0' x2='.5' y2='1'><stop offset='0' stop-color='#fde9e6'/><stop offset='.6' stop-color='#f9c4c4'/><stop offset='1' stop-color='#ec8fa0'/></linearGradient>"
         "<g id='d'><path d='M0-.8.16-1C.85-.8.8.35 0 1-.8.35-.85-.8-.16-1Z' fill='url(#p)' stroke='#d9788f' stroke-opacity='.35'/>"
         "<path d='M0-.7Q.08.1 0 .85' fill='none' stroke='#d9788f' stroke-opacity='.3'/></g>")

BUBBLE = ("<radialGradient id='w'><stop offset='0' stop-color='#2ed3c4' stop-opacity='.02'/><stop offset='.72' stop-color='#2ed3c4' stop-opacity='.06'/><stop offset='1' stop-color='#8ff0e6' stop-opacity='.4'/></radialGradient>"
          "<g id='d'><circle r='1' fill='url(#w)' stroke='#e8f6fb' stroke-opacity='.55'/><ellipse rx='.26' ry='.15' cx='-.36' cy='-.48' fill='#fff' opacity='.75'/><ellipse rx='.1' ry='.06' cx='.42' cy='.5' fill='#fff' opacity='.4'/></g>")

EMBER = ("<radialGradient id='e'><stop offset='0' stop-color='#ffe9b8'/><stop offset='.22' stop-color='#f2b35b'/><stop offset='.5' stop-color='#f2b35b' stop-opacity='.28'/><stop offset='1' stop-color='#f2b35b' stop-opacity='0'/></radialGradient>"
         "<g id='d'><circle r='1.2' fill='url(#e)'/></g>")


def scatter(seed, count, sizes, tall=1.0):
    """[x, y, r, ry, stroke width at unit size]; big ones stay out of the middle, where the chat sits. The same on every build."""
    rng = random.Random(seed)
    W, H = leaf.W, leaf.H
    out = []
    for _ in range(count):
        r = rng.choice(sizes)
        x, y = rng.uniform(0, W), rng.uniform(0, H)
        if r >= 20 and 0.25 * W < x < 0.75 * W:
            x = x - 0.25 * W if x < 0.5 * W else x + 0.25 * W
        out.append([round(x), round(y), r, round(r * tall, 1), round(max(1, r * 0.06) / r, 3)])
    return out


def specs():
    base = {"w": leaf.W, "h": leaf.H}
    return {
        "shiro": {**base, "defs": BEAD, "drops": scatter(11, 34, [6, 8, 8, 10, 12, 14, 18, 24, 32]), "tint": "#2f8fe0"},
        "take": {**base, "defs": leaf.DROP_DEFS, "drops": leaf.drops(), "tint": "#fff"},
        "sakura": {**base, "defs": PETAL, "drops": scatter(12, 60, [6, 7, 8, 9, 10, 12, 14, 16], 1.25), "tint": "#bc4e68", "spin": True},
        "mizu": {**base, "defs": BUBBLE, "drops": scatter(13, 70, [5, 6, 8, 10, 12, 16, 20, 26, 34]), "tint": "#8ff0e6", "lift": 0.00002},
        "yoru": {**base, "defs": EMBER, "drops": scatter(14, 44, [6, 8, 10, 12, 14, 18, 22]), "tint": "#f2b35b", "glow": True},
    }
