#!/usr/bin/env python3
# generate_pdf.py
# pip install reportlab

import json, math, os, argparse
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import Color

PT_PER_IN = 72.0

# --- Layout constants (inches) ---
PAGE_W, PAGE_H = letter  # in points
CARD_W_IN, CARD_H_IN = 3.57, 2.00
START_X_IN, START_Y_IN = 0.68, 0.44   # from top-left
GROUP_W_IN, GROUP_H_IN = 7.15, 10.02
COLS, ROWS = 2, 5
GAP_X_IN = (GROUP_W_IN - COLS*CARD_W_IN) / (COLS - 1)
GAP_Y_IN = (GROUP_H_IN - ROWS*CARD_H_IN) / (ROWS - 1)

# --- Typography ---
NAME_SIZE = 27.9
LINE_SIZE = 16
LINE_GAP = 6

RED = Color(0.761, 0.106, 0.106)
GRAY = Color(0.4, 0.4, 0.4)
BLACK = Color(0,0,0)
BORDER = Color(0.055, 0.133, 0.247)

LABEL = {
  "egg":"Egg","milk":"Milk","wheat":"Wheat","fish":"Fish","shellfish":"Shellfish",
  "soy":"Soy","sesame":"Sesame","peanuts":"Peanuts","tree_nuts":"Tree Nuts",
  "cc_all":"May Contain All Allergens",
  "halal":"Halal","vegan":"Vegan","caffeine":"Contains Caffeine",
  "red40":"Red 40","yellow5":"Yellow 5","blue1":"Blue 1","blue2":"Blue 2","green3":"Green 3",
  "carrageenan":"Carrageenan","xanthan":"Xanthan gum","cellulose":"Cellulose gum","polysorbates":"Polysorbates"
}

def in2pt(x): return x * PT_PER_IN

def load_assets(base_dir):
  fonts_dir = os.path.join(base_dir, "menu-card-web", "assets", "fonts")
  icons_dir = os.path.join(base_dir, "menu-card-web", "assets", "icons")

  cali = os.path.join(fonts_dir, "calibrib.ttf")
  bebas = os.path.join(fonts_dir, "BebasNeue-Regular.ttf")

  pdfmetrics.registerFont(TTFont("CalibriBold", cali))
  pdfmetrics.registerFont(TTFont("BebasNeue", bebas))

  badges = {
    "halal": ImageReader(os.path.join(icons_dir, "attributes_halal_card_icon.png")),
    "vegan": ImageReader(os.path.join(icons_dir, "attributes_vegan_icon.png")),
    "caffeine": ImageReader(os.path.join(icons_dir, "attributes_contains_caffeine_icon.png")),
    "cc_all": ImageReader(os.path.join(icons_dir, "allergen_cc_may_contain_icon.png")),
  }
  return badges

def draw_centered_text(c, text, x_center, y_baseline, font_name, size, color):
  c.setFont(font_name, size)
  c.setFillColor(color)
  w = pdfmetrics.stringWidth(text, font_name, size)
  c.drawString(x_center - w/2.0, y_baseline, text)

def draw_pdf(cards, out_path, base_dir="."):
  badges = load_assets(base_dir)

  c = canvas.Canvas(out_path, pagesize=letter)
  per_page = COLS * ROWS
  pages = max(1, math.ceil(len(cards)/per_page))

  for p in range(pages):
    # White background (page is white by default, but explicit is fine)
    c.setFillColorRGB(1,1,1)
    c.rect(0,0,PAGE_W,PAGE_H, stroke=0, fill=1)

    for r in range(ROWS):
      for col in range(COLS):
        idx = p*per_page + r*COLS + col
        card = cards[idx] if idx < len(cards) else None

        x = in2pt(START_X_IN + col*(CARD_W_IN + GAP_X_IN))
        y_top_from_top = in2pt(START_Y_IN + r*(CARD_H_IN + GAP_Y_IN))
        y = PAGE_H - y_top_from_top - in2pt(CARD_H_IN)

        # Card rect
        c.setFillColorRGB(1,1,1)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.5)
        c.rect(x, y, in2pt(CARD_W_IN), in2pt(CARD_H_IN), stroke=1, fill=1)

        if not card: continue

        # Badges (default 0.57"; shrink to 0.45" if many)
        badge_size_in = 0.57
        badge_keys = []
        if "attributes" in card and isinstance(card["attributes"], list):
          if "halal" in card["attributes"]:    badge_keys.append("halal")
          if "vegan" in card["attributes"]:    badge_keys.append("vegan")
          if "caffeine" in card["attributes"]: badge_keys.append("caffeine")
        if "allergens" in card and "cc_all" in card["allergens"]:
          badge_keys.append("cc_all")

        if len(badge_keys) >= 3:
          badge_size_in = 0.45

        bsz = in2pt(badge_size_in)
        bpad = in2pt(0.08)
        bx = x + in2pt(CARD_W_IN) - bpad - bsz
        by = y + in2pt(CARD_H_IN) - bpad - bsz

        for k in badge_keys:
          img = badges.get(k)
          if img:
            c.drawImage(img, bx, by, width=bsz, height=bsz, mask='auto', preserveAspectRatio=True, anchor='c')
            bx -= (bsz + in2pt(0.08))

        # Build lines
        name = (card.get("name") or "").strip()
        allergens = card.get("allergens") or []
        custom = card.get("customAllergens") or []
        colors = card.get("colors") or []
        textures = card.get("textures") or []
        attrs = card.get("attributes") or []

        allergen_list = [LABEL.get(k, k) for k in allergens if k != "cc_all"] + list(custom)
        allergens_str = f"Allergens: {', '.join(allergen_list)}" if allergen_list else None

        # ✅ Include caffeine attribute in Contains line
        contains_items = [LABEL.get(k, k) for k in colors] + [LABEL.get(k, k) for k in textures]
        if "caffeine" in attrs:
          contains_items.append(LABEL["caffeine"])
        contains_str = f"Contains: {', '.join(contains_items)}" if contains_items else None

        lines = [
          ("CalibriBold", NAME_SIZE, BLACK, name),
        ]
        if allergens_str: lines.append(("BebasNeue", LINE_SIZE, RED, allergens_str))
        if contains_str:  lines.append(("BebasNeue", LINE_SIZE, GRAY, contains_str))

        total_h = sum(sz for _, sz, _, _ in lines) + LINE_GAP * (len(lines)-1)
        cy = y + (in2pt(CARD_H_IN) + total_h)/2.0 - lines[0][1]  # baseline of first line
        cx = x + in2pt(CARD_W_IN)/2.0

        for font_name, sz, color, text in lines:
          draw_centered_text(c, text, cx, cy, font_name, sz, color)
          cy -= (sz + LINE_GAP)

    c.showPage()

  c.save()

def main():
  ap = argparse.ArgumentParser(description="Generate Menu Card PDF locally.")
  ap.add_argument("--input", "-i", default="cards.json", help="Path to cards JSON (exported state.cards).")
  ap.add_argument("--output", "-o", default="menu-cards.pdf", help="Output PDF path.")
  ap.add_argument("--base", "-b", default=".", help="Project root (folder containing menu-card-web/).")
  args = ap.parse_args()

  with open(args.input, "r", encoding="utf-8") as f:
    cards = json.load(f)
    if not isinstance(cards, list):
      raise ValueError("Input JSON must be a list of card objects.")

  draw_pdf(cards, args.output, base_dir=args.base)
  print(f"PDF written to: {args.output}")

if __name__ == "__main__":
  main()
