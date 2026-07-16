from pathlib import Path
import sys

from PIL import Image, ImageDraw


root = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent
files = sorted(root.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[1]))
output = root / "contacts"
output.mkdir(exist_ok=True)
thumb = (620, 877)
margin = 24
gap = 20

for start in range(0, len(files), 4):
    pages = []
    for path in files[start : start + 4]:
        image = Image.open(path).convert("RGB")
        image.thumbnail(thumb)
        canvas = Image.new("RGB", thumb, "white")
        canvas.paste(image, ((thumb[0] - image.width) // 2, 0))
        draw = ImageDraw.Draw(canvas)
        draw.rectangle((0, 0, thumb[0] - 1, thumb[1] - 1), outline="#777777", width=1)
        draw.text((8, 8), path.stem, fill="#B00020")
        pages.append(canvas)
    sheet = Image.new(
        "RGB",
        (margin * 2 + thumb[0] * 2 + gap, margin * 2 + thumb[1] * 2 + gap),
        "#D9D9D9",
    )
    for index, page in enumerate(pages):
        x = margin + (index % 2) * (thumb[0] + gap)
        y = margin + (index // 2) * (thumb[1] + gap)
        sheet.paste(page, (x, y))
    end = min(start + 4, len(files))
    sheet.save(output / f"contact-{start + 1:02d}-{end:02d}.png")
