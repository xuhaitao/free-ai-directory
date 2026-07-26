from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/assets/social-card.png"
FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"

image = Image.new("RGB", (1200, 630), "#0b3d30")
draw = ImageDraw.Draw(image)
draw.ellipse((760, -170, 1280, 350), fill="#0e5d46")
draw.ellipse((820, 210, 1440, 830), fill="#0a3228")

def font(size: int, index: int = 0):
    return ImageFont.truetype(FONT, size=size, index=index)

draw.rounded_rectangle((72, 68, 242, 104), radius=18, fill="#d6f6e5")
draw.text((157, 86), "每日自动更新", fill="#0b3d30", font=font(18), anchor="mm")
draw.text((72, 150), "免费 AI 目录", fill="white", font=font(72))
draw.text((72, 253), "AI 热点 · 免费模型 · 中转站资料", fill="#d6f6e5", font=font(42))

cards = [(72, "今日榜单", "新闻 · 项目 · 模型"), (396, "免费入口", "14 种模型类型")]
for x, eyebrow, title in cards:
    draw.rounded_rectangle((x, 382, x + 300, 500), radius=18, fill="white")
    draw.text((x + 28, 404), eyebrow, fill="#087a55", font=font(21))
    draw.text((x + 28, 446), title, fill="#111916", font=font(27))

draw.text((72, 545), "www.qaz5678.xyz", fill="#b9d9cd", font=ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 24))
image.save(OUT, optimize=True)
print(OUT)
