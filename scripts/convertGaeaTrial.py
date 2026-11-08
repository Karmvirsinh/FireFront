"""Optional offline conversion of the GUI trial's PNG16 data (requires Pillow).
No Gaea process is started; the app consumes only the resulting plain data.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'logs/gaea-gui-trial/export'
OUT = ROOT / 'src/prototype/data/gaeaSandstone.json'


def load(name):
    path = next(SOURCE.rglob(name))
    image = Image.open(path)
    image.load()
    if image.size != (512, 512) or image.mode not in ('I;16', 'I'):
        raise ValueError('Expected the actual 512-square PNG16 export')
    values = list(image.getdata())
    if min(values) == max(values):
        raise ValueError('Export is constant')
    return values, {'file': name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                    'bytes': path.stat().st_size, 'range16': [min(values), max(values)]}


def sample(values, x, z):
    x, z = x * 511, z * 511
    ix, iz = int(x), int(z)
    nx, nz = min(ix + 1, 511), min(iz + 1, 511)
    u, v = x - ix, z - iz
    return ((values[iz * 512 + ix] * (1-u) + values[iz * 512 + nx] * u) * (1-v)
            + (values[nz * 512 + ix] * (1-u) + values[nz * 512 + nx] * u) * v)


height, height_record = load('Sandstone_Out.png')
layers, layer_record = load('Sandstone_Layers.png')
data = {
    'source': 'QuadSpinner Gaea 2.3.1 Community / bundled Sandstone Butte',
    'resolution': 512, 'gridCells': 128, 'worldWidth': 32, 'heightScale': 16,
    'sourceWidthMeters': 5000, 'sourceHeightMeters': 2500,
    'orientation': 'Image first row maps to grid z=0; no geographic north is implied',
    'files': [height_record, layer_record],
    'heights': [round(sample(height, x/128, z/128) / 65535 * 16, 6)
                for z in range(129) for x in range(129)],
    'layers': [round(sample(layers, (x+.5)/128, (z+.5)/128) / 65535, 5)
               for z in range(128) for x in range(128)],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, separators=(',', ':')) + '\n', encoding='utf-8')
print(json.dumps({'files': data['files'], 'corners': len(data['heights']),
                  'heightRangeWorld': [min(data['heights']), max(data['heights'])]}))
