from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
SIZE = 256
image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=56, fill="#153c32")
draw.ellipse((60, 60, 196, 196), outline="#d6f6e5", width=24)
draw.ellipse((104, 104, 152, 152), fill="#26b67c")
image.save(
    ROOT / "src" / "assets" / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
)
