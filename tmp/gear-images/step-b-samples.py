from __future__ import annotations

import json
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont


PROJECT_ROOT = Path.cwd()
OUT_ROOT = PROJECT_ROOT / "tmp" / "gear-images"
INVENTORY_PATH = OUT_ROOT / "inventory.json"
SAMPLE_DIR = OUT_ROOT / "processed-samples"
SAMPLE_DIR.mkdir(parents=True, exist_ok=True)

SAMPLE_IDS = [
    "671b003d-6cdf-4c4c-9975-512953b77270",  # GREGORY Zulu 30
    "3755f48c-66c1-49d6-b6eb-f49d5172e9f7",  # SOTO SOD-310
    "ba3ddad5-f0b7-4db0-8ed3-f3dac1332104",  # Black Diamond Cosmo 350
    "dbc5a976-e0f9-4387-b9b2-3cf2a064db70",  # mont-bell Alpine Down Parka
]


def load_items() -> dict[str, dict]:
    data = json.loads(INVENTORY_PATH.read_text())
    return {item["id"]: item for item in data["items"]}


def checkerboard(size: tuple[int, int], cell: int = 16) -> Image.Image:
    w, h = size
    bg = Image.new("RGB", size, "#ffffff")
    draw = ImageDraw.Draw(bg)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                draw.rectangle([x, y, x + cell - 1, y + cell - 1], fill="#e8ece8")
    return bg


def estimate_background(rgb: np.ndarray) -> np.ndarray:
    h, w, _ = rgb.shape
    patch = max(8, min(h, w) // 20)
    corners = np.concatenate(
        [
            rgb[:patch, :patch].reshape(-1, 3),
            rgb[:patch, -patch:].reshape(-1, 3),
            rgb[-patch:, :patch].reshape(-1, 3),
            rgb[-patch:, -patch:].reshape(-1, 3),
        ],
        axis=0,
    )
    return np.median(corners, axis=0)


def border_connected_mask(candidate: np.ndarray) -> np.ndarray:
    h, w = candidate.shape
    visited = np.zeros((h, w), dtype=bool)
    queue: deque[tuple[int, int]] = deque()

    def add(y: int, x: int) -> None:
        if candidate[y, x] and not visited[y, x]:
            visited[y, x] = True
            queue.append((y, x))

    for x in range(w):
        add(0, x)
        add(h - 1, x)
    for y in range(h):
        add(y, 0)
        add(y, w - 1)

    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and candidate[ny, nx] and not visited[ny, nx]:
                visited[ny, nx] = True
                queue.append((ny, nx))

    return visited


def remove_light_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    arr = np.array(rgba)
    rgb = arr[:, :, :3].astype(np.int16)
    alpha = arr[:, :, 3]

    bg = estimate_background(rgb)
    distance = np.linalg.norm(rgb - bg, axis=2)
    brightness = rgb.mean(axis=2)
    channel_span = rgb.max(axis=2) - rgb.min(axis=2)

    # Official product images are mostly white or light gray backgrounds.
    # Only remove pixels connected to the image border so white gear details remain.
    candidate = ((distance < 42) & (brightness > 205)) | (
        (brightness > 238) & (channel_span < 28)
    )
    bg_mask = border_connected_mask(candidate)

    alpha = alpha.copy()
    alpha[bg_mask] = 0
    arr[:, :, 3] = alpha
    return Image.fromarray(arr, "RGBA")


def trim_and_square(image: Image.Image, long_edge: int = 512) -> Image.Image:
    alpha = image.getchannel("A")
    # Crop at the product's actual alpha boundary, then expand the crop box a
    # little so straps, hems, burner arms, cords, and other thin edges are safe.
    bbox = alpha.point(lambda p: 255 if p > 1 else 0).getbbox()

    if not bbox:
        return Image.new("RGBA", (long_edge, long_edge), (255, 255, 255, 0))

    left, top, right, bottom = bbox
    safety_margin = max(4, round(max(right - left, bottom - top) * 0.025))
    bbox = (
        max(0, left - safety_margin),
        max(0, top - safety_margin),
        min(image.width, right + safety_margin),
        min(image.height, bottom + safety_margin),
    )

    cropped = image.crop(bbox)
    scale = min(long_edge / cropped.width, long_edge / cropped.height)
    resized = cropped.resize(
        (max(1, round(cropped.width * scale)), max(1, round(cropped.height * scale))),
        Image.Resampling.LANCZOS,
    )

    canvas = Image.new("RGBA", (long_edge, long_edge), (255, 255, 255, 0))
    x = (long_edge - resized.width) // 2
    y = (long_edge - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas


def fit_on_background(image: Image.Image, size: int = 320, background: str = "white", padding: int = 36) -> Image.Image:
    if background == "checker":
        canvas = checkerboard((size, size))
    else:
        canvas = Image.new("RGB", (size, size), "#ffffff")

    img = image.convert("RGBA")
    scale = min((size - padding) / img.width, (size - padding) / img.height)
    img = img.resize((max(1, round(img.width * scale)), max(1, round(img.height * scale))), Image.Resampling.LANCZOS)
    x = (size - img.width) // 2
    y = (size - img.height) // 2
    canvas.paste(img, (x, y), img)
    return canvas


def main() -> None:
    items = load_items()
    rows = []
    manifest = []

    for gear_id in SAMPLE_IDS:
        item = items[gear_id]
        source_path = PROJECT_ROOT / item["downloaded_path"]
        original = Image.open(source_path)
        removed = remove_light_background(original)
        processed = trim_and_square(removed)

        out_path = SAMPLE_DIR / f"{item['source']}__{gear_id}.png"
        processed.save(out_path)

        label = f"{item['brand']} / {item['model'] or item['name'] or gear_id}"
        before = fit_on_background(original, background="white")
        after = fit_on_background(processed, background="checker", padding=0)

        row = Image.new("RGB", (700, 380), "#f7f7f4")
        row.paste(before, (24, 44))
        row.paste(after, (356, 44))
        draw = ImageDraw.Draw(row)
        draw.text((24, 14), label[:70], fill="#111111")
        draw.text((130, 350), "Before", fill="#555555", anchor="mm")
        draw.text((462, 350), "After 512 edge-fit", fill="#14724e", anchor="mm")
        rows.append(row)

        manifest.append(
            {
                "id": gear_id,
                "source": item["source"],
                "brand": item["brand"],
                "model": item["model"],
                "original": item["downloaded_path"],
                "processed": str(out_path.relative_to(PROJECT_ROOT)),
            }
        )

    sheet = Image.new("RGB", (700, 380 * len(rows)), "#f7f7f4")
    for i, row in enumerate(rows):
        sheet.paste(row, (0, i * 380))

    sheet_path = SAMPLE_DIR / "step-b-before-after-contact-sheet.png"
    sheet.save(sheet_path)
    (SAMPLE_DIR / "step-b-sample-manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")

    print(json.dumps({"sample_count": len(manifest), "contact_sheet": str(sheet_path.relative_to(PROJECT_ROOT)), "samples": manifest}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
