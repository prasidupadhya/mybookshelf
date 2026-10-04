"""Optional asset preparation; production uses the checked-in WOFF2 files.

Requires fonttools[woff]==4.60.2. No frontend build is needed.
"""
from io import BytesIO
from pathlib import Path
import tarfile
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1] / "public/assets/fonts"
VERSION = "5.3.0"
# Latin-1 includes all Spanish letters and inverted punctuation. Keep common
# typographic punctuation and accents without subsetting to today's book data.
UNICODES = set(range(0x20, 0x100)) | set(range(0x2000, 0x2070)) | {
    0x131, 0x152, 0x153, 0x2BC, 0x2C6, 0x2DA, 0x2DC, 0x304, 0x308,
    0x309, 0x323, 0x20AC, 0x2122, 0x2191, 0x2192, 0x2193, 0x2212,
}
FACES = [
    ("@fontsource-variable", "fraunces", "full-normal", "500", {"wght": 500, "SOFT": 20, "WONK": 0}),
    ("@fontsource-variable", "public-sans", "wght-normal", "400-600", {"wght": (400, 600)}),
    ("@fontsource", "ibm-plex-mono", "400-normal", "400", None),
]

ROOT.mkdir(parents=True, exist_ok=True)
for scope, family, source, weight, axes in FACES:
    url = f"https://registry.npmjs.org/{scope}/{family}/-/{family}-{VERSION}.tgz"
    with urllib.request.urlopen(url, timeout=30) as response:
        archive_bytes = response.read()
    with tarfile.open(fileobj=BytesIO(archive_bytes), mode="r:gz") as archive:
        font = TTFont(BytesIO(archive.extractfile(f"package/files/{family}-latin-{source}.woff2").read()))
        (ROOT / f"{family}-LICENSE.txt").write_bytes(archive.extractfile("package/LICENSE").read())
    if axes:
        font = instantiateVariableFont(font, axes, inplace=True)
    options = subset.Options()
    options.flavor = "woff2"
    options.recalc_timestamp = False
    options.layout_features = ["*"]
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=UNICODES)
    subsetter.subset(font)
    assert set(map(ord, "áéíóúñü¿¡ÁÉÍÓÚÑÜ")) <= set(font.getBestCmap())
    output = ROOT / f"{family}-es-{weight}.woff2"
    font.flavor = "woff2"
    font.save(output)
    print(f"{output.name}: {output.stat().st_size} bytes; Spanish glyphs verified")
