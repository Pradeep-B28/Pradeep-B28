import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('assets/images/projects', exist_ok=True)
os.makedirs('assets/images', exist_ok=True)

# 1. Generate og-card.png (1200 x 630)
def create_og_card():
    w, h = 1200, 630
    img = Image.new('RGB', (w, h), color='#0A0B0D')
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rounded_rectangle([(24, 24), (w - 24, h - 24)], radius=18, outline='#1F232A', width=2)
    # Inner surface panel
    draw.rounded_rectangle([(32, 32), (w - 32, h - 32)], radius=16, fill='#121418')

    # Faint background grid lines
    for x in range(32, w - 32, 48):
        draw.line([(x, 32), (x, h - 32)], fill='#181B22', width=1)
    for y in range(32, h - 32, 48):
        draw.line([(32, y), (w - 32, y)], fill='#181B22', width=1)

    # Status pill
    draw.rounded_rectangle([(72, 72), (480, 114)], radius=21, fill='#191E24', outline='#FFB224', width=1)
    draw.ellipse([(90, 88), (100, 98)], fill='#FFB224')
    # Text fallback with default font if TTF not available
    try:
        font_pill = ImageFont.truetype('arial.ttf', 15)
        font_name = ImageFont.truetype('georgia.ttf', 62)
        font_title = ImageFont.truetype('arial.ttf', 24)
        font_sub = ImageFont.truetype('arial.ttf', 18)
        font_mono = ImageFont.truetype('cour.ttf', 16)
    except Exception:
        font_pill = font_name = font_title = font_sub = font_mono = ImageFont.load_default()

    draw.text((112, 85), "OPEN TO SDE ROLES · REMOTE / RELOCATION", fill='#ECEDEE', font=font_pill)

    # Name
    draw.text((72, 140), "B Pradeep", fill='#ECEDEE', font=font_name)

    # Title
    draw.text((72, 222), "Software Engineer — Full-Stack & Interactive Web", fill='#FFB224', font=font_title)

    # One-liner
    draw.text((72, 275), "I build full-stack platforms, developer tools, and interactive algorithm visualizations.", fill='#9BA1A6', font=font_sub)
    draw.text((72, 305), "4 years of engineering experience · 7,500+ engineers trained.", fill='#9BA1A6', font=font_sub)

    # Three proof stats pills at bottom
    stats = [
        "4 YRS ENGINEERING",
        "7,500+ TRAINED",
        "20 PROJECTS SHIPPED"
    ]
    cur_x = 72
    for s in stats:
        draw.rounded_rectangle([(cur_x, 375), (cur_x + 240, 425)], radius=8, fill='#161920', outline='#1F232A', width=1)
        draw.text((cur_x + 20, 392), s, fill='#FFB224', font=font_mono)
        cur_x += 260

    # Right side: stylized graph visualization
    nodes = [
        (850, 160), (970, 120), (1080, 180),
        (890, 260), (1020, 240), (1110, 320),
        (830, 360), (950, 380), (1050, 440)
    ]
    edges = [
        (0, 1), (1, 2), (0, 3), (1, 4), (2, 5),
        (3, 4), (4, 5), (3, 6), (4, 7), (5, 8),
        (6, 7), (7, 8)
    ]
    # Draw edges
    for i, j in edges:
        is_path = (i, j) in [(0, 3), (3, 4), (4, 7), (7, 8)]
        col = '#FFB224' if is_path else '#2A303C'
        w_line = 3 if is_path else 1
        draw.line([nodes[i], nodes[j]], fill=col, width=w_line)

    # Draw nodes
    for idx, (nx, ny) in enumerate(nodes):
        is_path_node = idx in [0, 3, 4, 7, 8]
        col = '#FFB224' if is_path_node else '#1F242D'
        border_col = '#FFFFFF' if is_path_node else '#3A4250'
        r = 9 if is_path_node else 6
        draw.ellipse([(nx - r, ny - r), (nx + r, ny + r)], fill=col, outline=border_col, width=2)

    # Target indicator on node 8
    draw.ellipse([(nodes[8][0] - 16, nodes[8][1] - 16), (nodes[8][0] + 16, nodes[8][1] + 16)], outline='#FFB224', width=2)

    img.save('assets/images/og-card.png', 'PNG')
    print("Created assets/images/og-card.png")

# 2. Generate preview cards for projects without images (1200 x 675 WebP)
def create_project_card(filename, title, category, tech_list, metric_text):
    w, h = 1200, 675
    img = Image.new('RGB', (w, h), color='#0A0B0D')
    draw = ImageDraw.Draw(img)

    # Card background
    draw.rounded_rectangle([(20, 20), (w - 20, h - 20)], radius=18, fill='#121418', outline='#1F232A', width=2)

    # Subtle grid
    for x in range(20, w - 20, 50):
        draw.line([(x, 20), (x, h - 20)], fill='#161920', width=1)
    for y in range(20, h - 20, 50):
        draw.line([(20, y), (w - 20, y)], fill='#161920', width=1)

    try:
        font_cat = ImageFont.truetype('cour.ttf', 16)
        font_title = ImageFont.truetype('georgia.ttf', 44)
        font_tech = ImageFont.truetype('cour.ttf', 16)
        font_metric = ImageFont.truetype('arial.ttf', 20)
    except Exception:
        font_cat = font_title = font_tech = font_metric = ImageFont.load_default()

    # Category badge
    draw.rounded_rectangle([(60, 60), (320, 102)], radius=8, fill='#181C22', outline='#1F232A', width=1)
    draw.text((76, 74), f"LAB // {category.upper()}", fill='#FFB224', font=font_cat)

    # Title
    draw.text((60, 130), title, fill='#ECEDEE', font=font_title)

    # Tech chips
    tx = 60
    for t in tech_list:
        chip_w = len(t) * 14 + 32
        draw.rounded_rectangle([(tx, 205), (tx + chip_w, 245)], radius=6, fill='#191E25', outline='#2A303C', width=1)
        draw.text((tx + 16, 218), t, fill='#9BA1A6', font=font_tech)
        tx += chip_w + 14

    # Proof Metric box
    draw.rounded_rectangle([(60, 275), (w - 60, 345)], radius=10, fill='#161A20', outline='#FFB224', width=1)
    draw.text((80, 298), f"Proof Metric: {metric_text}", fill='#ECEDEE', font=font_metric)

    # Graphical blueprint accent in bottom half
    cx, cy = 600, 500
    for r in range(40, 180, 35):
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], outline='#1F242E', width=1)
    draw.line([(cx - 200, cy), (cx + 200, cy)], fill='#1F242E', width=1)
    draw.line([(cx, cy - 140), (cx, cy + 140)], fill='#1F242E', width=1)
    draw.ellipse([(cx - 8, cy - 8), (cx + 8, cy + 8)], fill='#FFB224')

    out_path = f'assets/images/projects/{filename}'
    img.save(out_path, 'WEBP', quality=90)
    print(f"Created {out_path}")

create_og_card()

projects_to_make = [
    ('gitviz.webp', 'GIT-viz 3D', 'Visualizers', ['JavaScript', 'Three.js', 'Web Audio'], '3D procedural city skyline generation from Git commits'),
    ('relnotes.webp', 'Rel_Notes', 'Dev Tools', ['Python', 'Groq LLM', 'Click'], 'Zero-config conventional commit classification'),
    ('devstarter.webp', 'Devstarter', 'Dev Tools', ['Docker', 'Devcontainers', 'Linux'], 'Zero-configuration environments across 6 programming languages'),
    ('javadsaroadmap.webp', 'Java + DSA Roadmap', 'Algorithms', ['Java', 'JVM Internals', 'Algorithms'], 'Curriculum utilized in training 7,500+ engineers'),
    ('sortvisualizer.webp', 'Searching & Sorting Visualizer', 'Visualizers', ['Java', 'Java Swing', 'Algorithms'], 'Frame-by-frame comparison and swap step tracing'),
    ('portfoliosuite.webp', 'Portfolio Theme Suite', 'Visualizers', ['React', 'Three.js', 'WebGL'], '6 interactive 3D WebGL developer themes')
]

for p in projects_to_make:
    create_project_card(p[0], p[1], p[2], p[3], p[4])
