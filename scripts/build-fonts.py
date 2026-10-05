"""
Builds the self-hosted web fonts in public/fonts from the upstream OFL sources.

  Inter     (OFL-1.1, https://github.com/rsms/inter)           -> body text
  Fraunces  (OFL-1.1, https://github.com/undercasetype/Fraunces) -> headings

Neither licence declares a Reserved Font Name, so subsetting is permitted.
The licences are copied next to the fonts (public/fonts/*-OFL.txt).

Usage (needs fonttools + brotli):
  python scripts/build-fonts.py <dir with Inter[opsz,wght].ttf, Fraunces[SOFT,WONK,opsz,wght].ttf, *-OFL.txt>

It also prints metric-matched fallback @font-face rules (Arial for Inter, Georgia for
Fraunces) so the web fonts swap in without layout shift.
"""
import os
import shutil
import sys

from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'fonts')
os.makedirs(OUT, exist_ok=True)

# Latin-1, general punctuation, rupee sign, arrows, minus, check/cross/star, play triangle
UNICODES = (
    list(range(0x20, 0x7F)) + list(range(0xA0, 0x100))
    + [0x131, 0x152, 0x153, 0x2C6, 0x2DA, 0x2DC]
    + list(range(0x2000, 0x2070))
    + [0x20B9, 0x2190, 0x2191, 0x2192, 0x2193, 0x2212, 0x2605, 0x2713, 0x2715, 0x25B6, 0x25CF, 0x25CB]
)

FONTS = [
    # (source, output, axis limits)
    ('inter-Inter[opsz,wght].ttf', 'inter-var.woff2', {'opsz': 14, 'wght': (400, 700)}),
    ('fraunces-Fraunces[SOFT,WONK,opsz,wght].ttf', 'fraunces-var.woff2', {'SOFT': 0, 'WONK': 0, 'opsz': 72, 'wght': (600, 700)}),
]


def build(src, out, limits):
    f = TTFont(os.path.join(SRC, src))
    f = instancer.instantiateVariableFont(f, limits)
    # Round-trip through a file so the subsetter sees a clean glyph order
    tmp = os.path.join(OUT, '_tmp.ttf')
    f.save(tmp)
    f = TTFont(tmp)
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'calt', 'tnum', 'lnum', 'pnum']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(unicodes=UNICODES)
    s.subset(f)
    path = os.path.join(OUT, out)
    f.flavor = 'woff2'
    f.save(path)
    os.remove(tmp)
    print(f'{out}: {os.path.getsize(path) // 1024} KB')


def avg_width(font, sample='the quick brown fox jumps over the lazy dog'):
    cmap = font.getBestCmap()
    hmtx = font['hmtx']
    upm = font['head'].unitsPerEm
    widths = [hmtx[cmap[ord(c)]][0] for c in sample if ord(c) in cmap]
    return sum(widths) / len(widths) / upm


def fallback(web_path, system_path, family, local_name):
    web = TTFont(web_path)
    sysf = TTFont(system_path)
    size_adjust = avg_width(web) / avg_width(sysf)
    upm = web['head'].unitsPerEm
    hhea = web['hhea']
    asc = hhea.ascent / upm / size_adjust
    desc = abs(hhea.descent) / upm / size_adjust
    gap = hhea.lineGap / upm / size_adjust
    print(
        f"@font-face {{ font-family: '{family}'; src: local('{local_name}'); "
        f"ascent-override: {asc * 100:.2f}%; descent-override: {desc * 100:.2f}%; "
        f"line-gap-override: {gap * 100:.2f}%; size-adjust: {size_adjust * 100:.2f}%; }}"
    )


for src, out, limits in FONTS:
    build(src, out, limits)

for lic in ('inter-OFL.txt', 'fraunces-OFL.txt'):
    shutil.copy(os.path.join(SRC, lic), os.path.join(OUT, lic))

win = os.environ.get('WINDIR', 'C:/Windows')
fallback(os.path.join(OUT, 'inter-var.woff2'), os.path.join(win, 'Fonts', 'arial.ttf'), 'Inter Fallback', 'Arial')
fallback(os.path.join(OUT, 'fraunces-var.woff2'), os.path.join(win, 'Fonts', 'georgia.ttf'), 'Fraunces Fallback', 'Georgia')
