from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
DATA = json.loads((ROOT / "content.json").read_text())

W, H = 1242, 1660
CREAM = "#FFF8EF"
PAPER = "#FFFFFF"
INK = "#191817"
MUTED = "#726B63"
LINE = "#E8DED2"
RED = "#EF4D43"
RED_DARK = "#B9282B"
CORAL = "#FF8C72"
PINK = "#FFE6E2"
MINT = "#CDEEDC"
GREEN = "#197A57"
BLUE = "#DCEBFF"
BLUE_DARK = "#376DA3"
AMBER = "#FFD66E"
CHARCOAL = "#252423"
FONT = "/System/Library/AssetsV2/com_apple_MobileAsset_Font8/86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc"
MONO = "/System/Library/Fonts/SFNSMono.ttf"


def ft(size, bold=False, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, size, index=1 if bold and not mono else 0)


def rr(draw, box, radius, fill, outline=None, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrap(text, font, max_width):
    result = []
    for paragraph in text.split("\n"):
        line = ""
        for char in paragraph:
            if line and font.getlength(line + char) > max_width:
                result.append(line)
                line = char
            else:
                line += char
        if line:
            result.append(line)
    return result


def text_block(draw, x, y, text, font, fill, max_width, line_gap=10):
    for row in wrap(text, font, max_width):
        draw.text((x, y), row, font=font, fill=fill)
        y += font.size + line_gap
    return y


def background(page_no):
    im = Image.new("RGB", (W, H), CREAM)
    draw = ImageDraw.Draw(im)
    draw.rectangle((0, 0, W, 18), fill=RED)
    draw.ellipse((1030, -70, 1370, 270), fill="#FFEED9")
    draw.ellipse((-180, 1350, 230, 1760), fill="#FFE9DF")
    for i in range(8):
        x = 950 + (i % 4) * 62
        y = 1310 + (i // 4) * 62
        draw.ellipse((x, y, x + 14, y + 14), fill="#E8D8C6")
    return im, draw


def header(draw, page_no, eyebrow):
    draw.ellipse((72, 62, 98, 88), fill=RED)
    draw.text((114, 51), "CODEX 普通人实战", font=ft(28, True), fill=INK)
    draw.text((1170, 55), f"{page_no:02}/08", font=ft(27, mono=True), fill=MUTED, anchor="ra")
    rr(draw, (72, 126, 505, 180), 27, PINK)
    draw.text((98, 139), eyebrow, font=ft(25, True), fill=RED_DARK)


def footer(draw, page_no, copy):
    draw.line((72, 1500, 1170, 1500), fill=LINE, width=2)
    draw.text((72, 1532), copy, font=ft(25), fill=MUTED)
    draw.text((1170, 1523), "→", font=ft(38, True), fill=RED, anchor="ra")
    draw.text((72, 1590), "公开样本数据截至 2026-07-28", font=ft(21), fill="#A49A90")


def headline(draw, title, y=235):
    y = text_block(draw, 72, y, title, ft(77, True), INK, 1080, 0)
    draw.rounded_rectangle((72, y + 25, 340, y + 37), radius=6, fill=RED)
    return y + 82


def robot(draw, x, y, scale=1.0, mood="happy"):
    def box(vals):
        return tuple(int(v * scale) for v in vals)

    # soft shadow
    bx = int(x)
    by = int(y)
    shadow = box((bx / scale - 18, by / scale + 262, bx / scale + 250, by / scale + 318))
    draw.ellipse(shadow, fill="#E7D9CA")
    # hoodie/body
    body = box((bx / scale + 28, by / scale + 145, bx / scale + 218, by / scale + 286))
    rr(draw, body, int(58 * scale), RED)
    draw.ellipse(box((bx / scale - 2, by / scale + 158, bx / scale + 70, by / scale + 232)), fill=CORAL)
    draw.ellipse(box((bx / scale + 178, by / scale + 158, bx / scale + 250, by / scale + 232)), fill=CORAL)
    # head and ears
    draw.ellipse(box((bx / scale + 2, by / scale + 54, bx / scale + 48, by / scale + 112)), fill=CHARCOAL)
    draw.ellipse(box((bx / scale + 198, by / scale + 54, bx / scale + 244, by / scale + 112)), fill=CHARCOAL)
    head = box((bx / scale + 22, by / scale + 18, bx / scale + 224, by / scale + 170))
    rr(draw, head, int(62 * scale), PAPER, CHARCOAL, int(6 * scale))
    # screen face
    face = box((bx / scale + 48, by / scale + 46, bx / scale + 198, by / scale + 137))
    rr(draw, face, int(36 * scale), CHARCOAL)
    eye_y = by + int(86 * scale)
    eye_r = int(10 * scale)
    draw.ellipse((bx + int(88 * scale) - eye_r, eye_y - eye_r, bx + int(88 * scale) + eye_r, eye_y + eye_r), fill=MINT)
    draw.ellipse((bx + int(158 * scale) - eye_r, eye_y - eye_r, bx + int(158 * scale) + eye_r, eye_y + eye_r), fill=MINT)
    if mood == "happy":
        draw.arc(box((bx / scale + 104, by / scale + 91, bx / scale + 144, by / scale + 120)), 10, 170, fill=MINT, width=max(2, int(5 * scale)))
    # laptop
    rr(draw, box((bx / scale + 34, by / scale + 211, bx / scale + 214, by / scale + 308)), int(14 * scale), CHARCOAL)
    draw.ellipse(box((bx / scale + 114, by / scale + 250, bx / scale + 136, by / scale + 272)), fill=RED)
    draw.rounded_rectangle(box((bx / scale + 12, by / scale + 303, bx / scale + 236, by / scale + 321)), radius=int(8 * scale), fill="#5E5B58")


def label(draw, x, y, text, color=RED, width=None):
    f = ft(24, True)
    width = width or int(f.getlength(text)) + 52
    rr(draw, (x, y, x + width, y + 50), 25, color)
    draw.text((x + 26, y + 11), text, font=f, fill=PAPER)


def metric_card(draw, x, y, title, likes, saves, comments, accent):
    rr(draw, (x, y, x + 1098, y + 172), 30, PAPER, LINE)
    draw.rectangle((x, y, x + 16, y + 172), fill=accent)
    draw.text((x + 40, y + 24), title, font=ft(30, True), fill=INK)
    chips = [("赞", likes), ("藏", saves), ("评", comments)]
    xx = x + 42
    for name, value in chips:
        rr(draw, (xx, y + 88, xx + 260, y + 139), 25, "#F8F4EF")
        draw.text((xx + 18, y + 100), name, font=ft(22, True), fill=MUTED)
        value_font = ft(28, True, mono=value.isascii())
        draw.text((xx + 72, y + 95), value, font=value_font, fill=INK)
        xx += 282


def arrow(draw, x1, y1, x2, y2, color=RED, width=8):
    draw.line((x1, y1, x2, y2), fill=color, width=width)
    draw.polygon([(x2, y2), (x2 - 24, y2 - 17), (x2 - 24, y2 + 17)], fill=color)


def icon_file(draw, x, y, color=BLUE):
    rr(draw, (x, y, x + 108, y + 132), 18, color)
    draw.polygon([(x + 70, y), (x + 108, y + 38), (x + 70, y + 38)], fill=PAPER)
    for yy in (y + 62, y + 86, y + 110):
        draw.line((x + 22, yy, x + 82, yy), fill=BLUE_DARK, width=6)


def icon_sheet(draw, x, y):
    rr(draw, (x, y, x + 128, y + 112), 16, MINT)
    for dx in (x + 42, x + 82):
        draw.line((dx, y + 14, dx, y + 98), fill=GREEN, width=4)
    for dy in (y + 44, y + 75):
        draw.line((x + 14, dy, x + 114, dy), fill=GREEN, width=4)


def flow_card(draw, x, y, no, title, sub, accent):
    rr(draw, (x, y, x + 1098, y + 154), 28, PAPER, LINE)
    draw.ellipse((x + 28, y + 36, x + 110, y + 118), fill=accent)
    draw.text((x + 69, y + 77), no, font=ft(28, True, mono=True), fill=INK, anchor="mm")
    draw.text((x + 140, y + 27), title, font=ft(34, True), fill=INK)
    draw.text((x + 140, y + 86), sub, font=ft(25), fill=MUTED)


def slide_cover(draw):
    label(draw, 72, 235, "我真的去查了")
    draw.text((72, 320), "我翻了", font=ft(82, True), fill=INK)
    draw.text((72, 410), "1336", font=ft(164, True, mono=True), fill=RED)
    draw.text((608, 453), "条评论", font=ft(62, True), fill=INK)
    draw.text((72, 600), "普通人这样用", font=ft(73, True), fill=INK)
    draw.text((72, 690), "Codex", font=ft(112, True, mono=True), fill=INK)
    draw.text((505, 716), "才值", font=ft(79, True), fill=RED)
    rr(draw, (72, 870, 1170, 1330), 44, PAPER, LINE)
    robot(draw, 790, 950, 1.28)
    draw.text((118, 930), "高频答案不是", font=ft(29, True), fill=MUTED)
    draw.text((118, 995), "“帮我写代码”", font=ft(48, True), fill=INK)
    draw.text((118, 1085), "而是把重复工作", font=ft(44, True), fill=INK)
    draw.text((118, 1155), "变成一条工作流", font=ft(44, True), fill=RED)
    rr(draw, (118, 1245, 650, 1298), 26, PINK)
    draw.text((146, 1256), "滑到最后，提示词可直接复制", font=ft(24, True), fill=RED_DARK)


def slide_evidence(draw, s):
    y = headline(draw, s["headline"])
    draw.text((72, y), "登录网页端 · 搜索后切到“图文”", font=ft(27, True), fill=MUTED)
    metric_card(draw, 72, y + 68, "普通人到底拿 Codex 干什么？", "7061", "7849", "1336", RED)
    metric_card(draw, 72, y + 264, "一文带你用上 AI 编程神器", "7182", "1万", "152", GREEN)
    metric_card(draw, 72, y + 460, "10 张图讲清 Vibe Coding", "3092", "4198", "24", BLUE_DARK)
    rr(draw, (72, y + 688, 1170, y + 854), 30, CHARCOAL)
    draw.text((112, y + 722), "数据给出的方向", font=ft(25, True), fill=AMBER)
    draw.text((112, y + 775), "具体用途 + 可复制路线图", font=ft(40, True), fill=PAPER)
    draw.text((112, y + 810), "更像“收藏型干货”，也更容易引发评论。", font=ft(25), fill="#D9D5D0")


def slide_files(draw, s):
    y = headline(draw, s["headline"])
    rr(draw, (72, y, 1170, y + 330), 38, PAPER, LINE)
    icon_file(draw, 120, y + 92)
    draw.text((242, y + 125), "PDF 发票", font=ft(32, True), fill=INK)
    arrow(draw, 430, y + 160, 560, y + 160)
    icon_sheet(draw, 600, y + 105)
    draw.text((748, y + 125), "Excel 汇总", font=ft(32, True), fill=INK)
    draw.text((120, y + 258), "识别字段 → 重命名 → 去重 → 汇总 → 标异常", font=ft(29, True), fill=RED_DARK)
    rr(draw, (72, y + 372, 1170, y + 725), 34, CHARCOAL)
    draw.text((112, y + 410), "先这样说", font=ft(25, True), fill=AMBER)
    prompt = "扫描这个文件夹里的 PDF，提取抬头、金额、日期和编号。先列处理规则与异常项，等我确认后再生成表格；保留原文件。"
    text_block(draw, 112, y + 466, prompt, ft(31), PAPER, 995, 14)
    robot(draw, 890, y + 748, 0.72)
    rr(draw, (72, y + 770, 820, y + 900), 28, MINT)
    draw.text((108, y + 802), "关键边界", font=ft(25, True), fill=GREEN)
    draw.text((108, y + 850), "未经确认，不改名、不覆盖、不删除。", font=ft(30, True), fill=INK)


def slide_assets(draw, s):
    y = headline(draw, s["headline"])
    items = [
        ("01", "产品原图", "统一尺寸 / 裁切 / 检查", PINK),
        ("02", "产品标题", "生成封面文案与清单", BLUE),
        ("03", "文件夹规则", "自动命名并归档", MINT),
    ]
    yy = y + 10
    for no, title, sub, accent in items:
        flow_card(draw, 72, yy, no, title, sub, accent)
        yy += 176
    rr(draw, (72, yy + 22, 1170, yy + 268), 34, RED)
    draw.text((112, yy + 58), "适合什么人？", font=ft(25, True), fill="#FFE8E2")
    draw.text((112, yy + 110), "电商运营 · 内容团队 · 自媒体", font=ft(42, True), fill=PAPER)
    draw.text((112, yy + 176), "规则越稳定，自动化越值钱。", font=ft(28), fill=PAPER)
    robot(draw, 850, yy + 292, 0.78)


def slide_teaching(draw, s):
    y = headline(draw, s["headline"])
    rr(draw, (72, y, 1170, y + 300), 36, PAPER, LINE)
    draw.text((112, y + 40), "只准备 1 次", font=ft(28, True), fill=RED)
    draw.text((112, y + 94), "课程大纲 + 第 1 讲样稿", font=ft(43, True), fill=INK)
    draw.text((112, y + 175), "先提炼：语气、结构、题型、版式", font=ft(29), fill=MUTED)
    rr(draw, (112, y + 235, 610, y + 278), 21, PINK)
    draw.text((136, y + 243), "得到一份可复用的固定模板", font=ft(23, True), fill=RED_DARK)
    arrow(draw, 620, y + 340, 620, y + 420)
    cards = [("复习卡", PINK), ("讲义", BLUE), ("PPT", MINT)]
    xx = 72
    for title, color in cards:
        rr(draw, (xx, y + 440, xx + 330, y + 720), 30, color)
        draw.text((xx + 38, y + 485), title, font=ft(39, True), fill=INK)
        for k in range(4):
            draw.rounded_rectangle((xx + 38, y + 560 + k * 36, xx + 282 - k * 8, y + 574 + k * 36), radius=7, fill="#FFFFFF")
        xx += 384
    rr(draw, (72, y + 770, 1170, y + 900), 28, CHARCOAL)
    draw.text((112, y + 802), "验收要写清：内容来源、页数、格式、不可编造项", font=ft(30, True), fill=PAPER)


def slide_knowledge(draw, s):
    y = headline(draw, s["headline"])
    nodes = [
        (105, y + 95, "聊天/会议", PINK),
        (105, y + 305, "本地资料", BLUE),
        (105, y + 515, "每日记录", MINT),
    ]
    for x, yy, title, color in nodes:
        rr(draw, (x, yy, x + 300, yy + 132), 28, color)
        draw.text((x + 150, yy + 66), title, font=ft(31, True), fill=INK, anchor="mm")
        arrow(draw, x + 320, yy + 66, 575, yy + 66, GREEN, 7)
    rr(draw, (610, y + 85, 1135, y + 662), 42, CHARCOAL)
    robot(draw, 748, y + 135, 1.0)
    draw.text((872, y + 500), "整理", font=ft(31, True), fill=AMBER, anchor="mm")
    draw.text((872, y + 555), "关联", font=ft(31, True), fill=MINT, anchor="mm")
    draw.text((872, y + 610), "生成周报", font=ft(31, True), fill=PAPER, anchor="mm")
    rr(draw, (72, y + 735, 1170, y + 920), 32, PAPER, LINE)
    draw.text((112, y + 775), "注意", font=ft(26, True), fill=RED)
    draw.text((112, y + 830), "跨飞书、Obsidian 等应用前，", font=ft(34, True), fill=INK)
    draw.text((112, y + 882), "先确认已接入对应工具与权限。", font=ft(34, True), fill=INK)


def slide_mvp(draw, s):
    y = headline(draw, s["headline"])
    steps = [
        ("1", "给一个真实样本", "别只说“做个工具”"),
        ("2", "先写需求清单", "目标 / 输入 / 输出 / 边界"),
        ("3", "只做最小版本", "先解决 1 个重复动作"),
        ("4", "让它自测验收", "报错、空数据、错误格式都要测"),
    ]
    yy = y
    for no, title, sub in steps:
        flow_card(draw, 72, yy, no, title, sub, AMBER if no in ("1", "3") else MINT)
        yy += 178
    rr(draw, (72, yy + 25, 1170, yy + 200), 32, RED)
    draw.text((112, yy + 60), "最好的第一个项目", font=ft(25, True), fill="#FFE6E0")
    draw.text((112, yy + 112), "是你明天就会再用一次的工具。", font=ft(39, True), fill=PAPER)


def slide_prompt(draw, s):
    y = headline(draw, s["headline"])
    rr(draw, (72, y, 1170, y + 790), 36, CHARCOAL)
    draw.text((112, y + 38), "复制 ↓", font=ft(25, True), fill=AMBER)
    rows = [
        ("我每周都要", "【重复任务】。"),
        ("输入是", "【文件 / 数据】；"),
        ("输出要", "【格式 / 示例】。"),
        ("请先只做：", ""),
        ("1.", "复述目标"),
        ("2.", "列处理规则"),
        ("3.", "标出异常与风险"),
        ("4.", "给最小可行方案"),
    ]
    yy = y + 100
    for left, right in rows:
        draw.text((112, yy), left, font=ft(29, True), fill=CORAL if left[:1].isdigit() else PAPER)
        draw.text((340 if not left[:1].isdigit() else 180, yy), right, font=ft(29), fill=PAPER)
        yy += 64
    rr(draw, (112, y + 636, 1130, y + 742), 24, "#353330", outline="#605B55")
    draw.text((621, y + 666), "未经确认，不修改原文件。", font=ft(32, True), fill=MINT, anchor="ma")
    rr(draw, (72, y + 830, 1170, y + 1010), 32, PINK)
    draw.text((112, y + 866), "下一篇你来选", font=ft(25, True), fill=RED_DARK)
    draw.text((112, y + 922), "发票整理 / 课程资料 / 个人小工具", font=ft(37, True), fill=INK)
    draw.text((112, y + 973), "评论 1 / 2 / 3，我按票数做完整实战。", font=ft(26), fill=MUTED)


def render_slide(slide, index):
    im, draw = background(index + 1)
    header(draw, index + 1, slide["eyebrow"])
    kind = slide["kind"]
    if kind == "cover":
        slide_cover(draw)
    elif kind == "evidence":
        slide_evidence(draw, slide)
    elif kind == "files":
        slide_files(draw, slide)
    elif kind == "assets":
        slide_assets(draw, slide)
    elif kind == "teaching":
        slide_teaching(draw, slide)
    elif kind == "knowledge":
        slide_knowledge(draw, slide)
    elif kind == "mvp":
        slide_mvp(draw, slide)
    elif kind == "prompt":
        slide_prompt(draw, slide)
    footer(draw, index + 1, slide["footer"])
    path = OUT / f"{index + 1:02d}-{slide['id']}.jpg"
    im.save(path, quality=96, subsampling=0)
    return path


paths = [render_slide(slide, i) for i, slide in enumerate(DATA["slides"])]

thumbs = [Image.open(path).resize((248, 332), Image.Resampling.LANCZOS) for path in paths]
sheet = Image.new("RGB", (248 * 4 + 50, 332 * 2 + 50), "#DDD6CC")
for i, thumb in enumerate(thumbs):
    sheet.paste(thumb, (10 + (i % 4) * 258, 10 + (i // 4) * 342))
sheet.save(OUT / "qa-contact-sheet.jpg", quality=94)
print(f"Rendered {len(paths)} carousel cards to {OUT}")
