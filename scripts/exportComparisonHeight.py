"""Offline local comparison data; no Gaea launch or npm dependency.

Keep native PNG16 samples (not coarse triangles). See docs/gaea-trial.md for
Community/bundled-example restrictions; these data are not Kenney CC0 assets.
"""
from pathlib import Path
import hashlib
import json
import struct
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'logs/gaea-gui-trial/export/Sandstone_Out.png'
image = Image.open(source)
assert image.size == (512, 512) and image.mode in ('I', 'I;16')
samples = list(image.getdata())
assert min(samples) != max(samples)
dest = root / 'public/comparison'
dest.mkdir(parents=True, exist_ok=True)
(dest / 'gaea-height.u16').write_bytes(struct.pack('<' + 'H'*len(samples), *samples))
(dest / 'gaea-source.json').write_text(json.dumps({
    'source': 'QuadSpinner Gaea 2.3.1 Community / bundled Sandstone Butte',
    'file': source.name, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'size': 512, 'encoding': 'little-endian uint16, first image row = z0',
    'worldWidth': 32, 'heightScale': 16, 'usage': 'Local educational noncommercial comparison; see docs/gaea-trial.md',
}, indent=2) + '\n', encoding='utf-8')
print('Exported native 512x512 PNG16 samples, 524288 bytes.')
