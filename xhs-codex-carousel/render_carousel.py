from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
data = json.loads((ROOT / "content.json").read_text())

W, H = 1242, 1660
INK = "#171717"; RED = "#E93C37"; RED_DARK = "#B82127"; PINK = "#FFE9E6"
CREAM = "#FFF9F0"; PAPER = "#FFFFFF"; GRAY = "#6E6A65"; LINE = "#E8DED0"
BLACK = "#161616"; GREEN = "#0E8255"; MINT = "#D9F4E8"; AMBER = "#FFD36E"; BLUE = "#DCEEFF"
FONT = "/System/Library/AssetsV2/com_apple_MobileAsset_Font8/86ba2c91f017a3749571a82f2c6d890ac7ffb2fb.asset/AssetData/PingFang.ttc"
MONO = "/System/Library/Fonts/SFNSMono.ttf"

def font(n, bold=False, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, n, index=1 if bold and not mono else 0)

def wrap(text, ft, width):
    rows=[]
    for p in text.split("\n"):
        line=""
        for ch in p:
            if line and ft.getlength(line + ch) > width:
                rows.append(line); line=ch
            else: line += ch
        if line: rows.append(line)
    return rows

def draw_text(d, x, y, text, ft, fill, width=None, gap=10):
    if width is None:
        d.text((x,y), text, font=ft, fill=fill); return y + ft.size
    for row in wrap(text, ft, width):
        d.text((x,y), row, font=ft, fill=fill); y += ft.size + gap
    return y

def rr(d, box, rad, fill, outline=None, width=2):
    d.rounded_rectangle(box, radius=rad, fill=fill, outline=outline, width=width)

def base():
    im=Image.new("RGB",(W,H),CREAM); d=ImageDraw.Draw(im)
    d.rectangle((0,0,W,18),fill=RED)
    for x,y,r in [(1110,180,170),(1120,1440,230),(90,1500,150)]:
        d.ellipse((x-r,y-r,x+r,y+r),fill="#FFF1DB")
    return im, d

def header(d, i, eyebrow):
    d.ellipse((72,64,96,88),fill=RED)
    d.text((112,53),"CODEX 反常识实战",font=font(28,True),fill=INK)
    d.text((1170,56),f"{i+1:02}/08",font=font(27,mono=True),fill=GRAY,anchor="ra")
    rr(d,(72,130,520,179),24,PINK)
    d.text((96,141),eyebrow,font=font(24,True),fill=RED_DARK)

def footer(d, i, copy):
    d.line((72,1500,1170,1500),fill=LINE,width=2)
    d.text((72,1532),copy,font=font(28),fill=GRAY)
    d.text((1170,1532),"→",font=font(34,True),fill=RED,anchor="ra")
    d.text((72,1590),"@ AI 编程少走弯路",font=font(22),fill="#9B928A")

def big(d, s, top=235):
    y=draw_text(d,72,top,s["headline"],font(80,True),INK,1080,0)
    d.rectangle((72,y+23,344,y+35),fill=RED)
    return y+75

def agent(d, x, y, label, title, question, accent):
    rr(d,(x,y,x+1098,y+178),28,PAPER,LINE)
    d.ellipse((x+28,y+30,x+102,y+104),fill=accent)
    d.text((x+65,y+67),label,font=font(29,True,True),fill=INK,anchor="mm")
    d.text((x+132,y+26),title,font=font(38,True),fill=INK)
    draw_text(d,x+132,y+84,question,font(27),GRAY,900,5)

def code(d, x, y, w, rows, size=25):
    rr(d,(x,y,x+w,y+len(rows)*58+96),26,BLACK)
    for dx,c in enumerate(("#FF6B61", "#FFD36E", "#4DD883")): d.ellipse((x+32+dx*30,y+30,x+48+dx*30,y+46),fill=c)
    yy=y+84
    for prefix, value, color in rows:
        d.text((x+32,yy),prefix,font=font(size,mono=True),fill=RED)
        d.text((x+105,yy),value,font=font(size,mono=True),fill=color)
        yy += 58

def slide(s, i):
    im,d=base(); header(d,i,s["eyebrow"]); k=s["kind"]
    if k == "cover":
        d.text((72,272),"我用错 Codex",font=font(75,True),fill=INK)
        d.text((72,367),"很久了",font=font(102,True),fill=INK)
        rr(d,(72,540,1170,855),40,RED)
        d.text((120,595),"开 3 个代理",font=font(82,True),fill=PAPER)
        d.text((120,710),"不会更快",font=font(94,True),fill=AMBER)
        rr(d,(72,936,1170,1280),36,PAPER,LINE)
        d.text((116,982),"真正的省时方法",font=font(30,True),fill=RED)
        d.text((116,1042),"先并行研究",font=font(54,True),fill=INK)
        d.text((116,1125),"再集中实现",font=font(54,True),fill=INK)
        d.text((990,1110),"→",font=font(92,True),fill=RED,anchor="mm")
    elif k == "problem":
        big(d,s)
        code(d,72,560,1098,[("A >","form.tsx","#FFFFFF"),("B >","form.tsx","#FFFFFF"),("C >","form.tsx","#FFFFFF")],31)
        rr(d,(72,905,1170,1250),36,PAPER,LINE)
        d.text((114,955),"你以为",font=font(29,True),fill=GRAY)
        d.text((114,1012),"3 倍速度",font=font(63,True),fill=GREEN)
        d.text((595,1012),"实际上",font=font(29,True),fill=GRAY)
        d.text((595,1080),"覆盖 · 合并 · 重跑",font=font(43,True),fill=RED)
        d.text((114,1170),"同一文件被同时碰到，就是返工的起点。",font=font(29),fill=GRAY)
    elif k == "principle":
        big(d,s)
        agent(d,72,570,"01","只读探索","现有页面、组件、调用链在哪里？",MINT)
        agent(d,72,780,"02","风险核查","校验、埋点、异常路径有哪些？",AMBER)
        agent(d,72,990,"03","验收建议","怎样算完成？会在哪儿失败？",BLUE)
        rr(d,(72,1230,1170,1350),26,INK)
        d.text((621,1289),"共同规则：不直接改代码",font=font(36,True),fill=PAPER,anchor="mm")
    elif k == "roles":
        big(d,s)
        agent(d,72,560,"A","代码探索","这次会动到哪些页面、组件和调用链？",MINT)
        agent(d,72,780,"B","风险核查","表单校验、埋点、异常路径是什么？",AMBER)
        agent(d,72,1000,"C","验收设计","上线前必须通过哪些测试和页面检查？",BLUE)
        d.text((72,1285),"给“问题”，不要给“帮我做完”。",font=font(35,True),fill=RED)
    elif k == "prompt":
        big(d,s)
        rr(d,(72,545,1170,1335),34,PAPER,LINE)
        d.text((112,590),"复制这一段 ↓",font=font(28,True),fill=RED)
        prompt_rows=[
            "请先将【需求】拆为 3 个", "互不修改同一文件的子任务：", "A. 代码结构探索", "B. 风险与边界核查", "C. 测试与验收建议", "每个只返回结论、证据和建议，", "不要修改代码；汇总计划后等我确认。"
        ]
        yy=660
        for row in prompt_rows:
            d.text((112,yy),row,font=font(33),fill=INK); yy+=82
        rr(d,(112,1200,1130,1286),22,BLACK)
        d.text((621,1224),"先研究，后实现",font=font(31,True),fill=PAPER,anchor="ma")
    elif k == "merge":
        big(d,s)
        code(d,72,560,1098,[("A >","复用 FormShell","#BFEFD8"),("B >","补手机号校验","#FFD36E"),("C >","7 条验收项","#BEE6FF")],29)
        flow=[("01","汇总结论"),("02","找出冲突"),("03","给执行计划"),("04","你确认一次")]
        yy=900
        for no,t in flow:
            rr(d,(72,yy,1170,yy+102),22,PAPER,LINE)
            d.text((110,yy+31),no,font=font(27,True,True),fill=RED)
            d.text((224,yy+26),t,font=font(35,True),fill=INK)
            yy+=118
    elif k == "implement":
        big(d,s)
        rr(d,(72,570,1170,965),38,INK)
        d.text((116,620),"主线程",font=font(28,True),fill=AMBER)
        d.text((116,685),"统一修改",font=font(69,True),fill=PAPER)
        d.text((116,780),"运行测试 + 检查页面",font=font(36),fill="#BCE7D1")
        d.ellipse((1000,760,1080,840),fill=RED); d.text((1040,800),"1",font=font(38,True),fill=PAPER,anchor="mm")
        rr(d,(72,1030,1170,1280),32,PAPER,LINE)
        d.text((116,1080),"不是 1 个人干活",font=font(31,True),fill=GRAY)
        d.text((116,1145),"是 1 个人改代码，3 个人提供证据。",font=font(35,True),fill=INK)
    elif k == "summary":
        big(d,s)
        steps=[("拆任务","谁负责什么问题"),("锁边界","不改同一文件"),("并行研究","只交结论与证据"),("主线程汇总","先出计划"),("统一实现","最后一起验收")]
        yy=555
        for n,(t,sub) in enumerate(steps,1):
            d.ellipse((74,yy,146,yy+72),fill=RED if n<5 else INK)
            d.text((110,yy+36),str(n),font=font(28,True,True),fill=PAPER,anchor="mm")
            d.text((180,yy-2),t,font=font(38,True),fill=INK)
            d.text((510,yy+8),sub,font=font(27),fill=GRAY)
            if n<5: d.line((110,yy+80,110,yy+112),fill=RED,width=5)
            yy+=145
        rr(d,(72,1300,1170,1405),28,RED)
        d.text((621,1332),"收藏：下次复杂需求直接套用",font=font(34,True),fill=PAPER,anchor="ma")
    footer(d,i,s["footer"])
    im.save(OUT/f"{i+1:02d}-{s['id']}.jpg",quality=96,subsampling=0)

for i,s in enumerate(data["slides"]): slide(s,i)

# A compact QA contact sheet for fast visual review.
thumbs=[]
for i,s in enumerate(data["slides"]):
    im=Image.open(OUT/f"{i+1:02d}-{s['id']}.jpg").resize((248,332))
    thumbs.append(im)
sheet=Image.new("RGB",(248*4+50,332*2+50),"#DDD7CF")
for i,im in enumerate(thumbs): sheet.paste(im,(10+(i%4)*258,10+(i//4)*342))
sheet.save(OUT/"qa-contact-sheet.jpg",quality=92)
print(f"Rendered {len(data['slides'])} carousel cards")
