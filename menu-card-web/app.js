// Base constants (only for logic; geometry is authored in base coords within the SVG)
const ARTIFICIAL_ICON_X_BASE = 530; // pinned X
const TEXTURE_ICON_X_BASE    = 745;

const ICON = {
  egg:"assets/icons/allergen_egg_icon.png",
  milk:"assets/icons/allergen_milk_icon.png",
  wheat:"assets/icons/allergen_wheat_icon.png",
  fish:"assets/icons/allergen_fish_icon.png",
  shellfish:"assets/icons/allergen_shellfish_icon.png",
  soy:"assets/icons/allergen_soy_icon.png",
  sesame:"assets/icons/allergen_sesame_icon.png",
  peanuts:"assets/icons/allergen_peanuts_icon.png",
  tree_nuts:"assets/icons/allergen_tree-nuts_icon.png",
  cc_all:"assets/icons/allergen_cc_may_contain_icon.png",
  add_allergen:"assets/icons/allergen_add_allergen_icon.png",
  halal:"assets/icons/attributes_halal_icon.png",
  vegan:"assets/icons/attributes_vegan_icon.png",
  caffeine:"assets/icons/attributes_contains_caffeine_icon.png",
  red40:"assets/icons/artificial_colors_red_40_icon.png",
  yellow5:"assets/icons/artificial_colors_yellow_5_icon.png",
  blue1:"assets/icons/artificial_colors_blue_1_icon.png",
  blue2:"assets/icons/artificial_colors_blue_2_icon.png",
  green3:"assets/icons/artificial_colors_green_3_icon.png",
  texture:"assets/icons/texture_and_stabilizer_icon.png",
  logo:"assets/icons/dining_logo.png",
};

// Shortcuts
const svgNS = "http://www.w3.org/2000/svg";
const scene           = document.getElementById("scene");
const allergenCircles = document.getElementById("allergenCircles");
const attributeCircles= document.getElementById("attributeCircles");
const artColorPills   = document.getElementById("artColorPills");
const texturePills    = document.getElementById("texturePills");
const bottomButtons   = document.getElementById("bottomButtons");
const previewPanel    = document.getElementById("previewPanel");

// Simple makers (in base units; SVG scales them automatically)
function R(x,y,w,h,fill,stroke=null,sw=1,rx=0){
  const el = document.createElementNS(svgNS,"rect");
  el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("width",w); el.setAttribute("height",h);
  el.setAttribute("fill",fill);
  if(stroke){ el.setAttribute("stroke",stroke); el.setAttribute("stroke-width",sw); }
  if(rx>0){ el.setAttribute("rx",rx); }
  return el;
}
function I(href,x,y,w,h){ const el=document.createElementNS(svgNS,"image");
  el.setAttribute("href",href); el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("width",w); el.setAttribute("height",h); return el; }
function T(txt,x,y,size,color="#000",anchor="start",klass="kievit"){
  const el=document.createElementNS(svgNS,"text");
  el.textContent=txt; el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("font-size",size); el.setAttribute("fill",color);
  el.setAttribute("class",klass); el.setAttribute("text-anchor",anchor);
  el.setAttribute("dominant-baseline","hanging");
  return el;
}

function circleButton(g, x, y, d, fill, stroke, iconKey){
  const borderW = Math.max(1, Math.round(d * 0.02));
  g.appendChild(R(x, y, d, d, fill, stroke, borderW, d/2));
  const icon = ICON[iconKey];
  if (icon){
    const s = Math.round(d * 0.62);
    g.appendChild(I(icon, x+(d-s)/2, y+(d-s)/2, s, s));
  }
}
function pillButton(g, x, y, w, h, fill, stroke){
  const el = R(x, y, w, h, fill, stroke, 2, h/2);
  g.appendChild(el);
  return {x,y,w,h};
}
function placeIconPinnedX(g, box, iconKey, pinnedX){
  const s = Math.round(Math.min(box.w, box.h) * 0.62);
  g.appendChild(I(ICON[iconKey], pinnedX - s/2, box.y + (box.h - s)/2, s, s));
}
function leftAlignedText(g, text, box, px, color, leftPad = 56){
  g.appendChild(T(text, box.x + leftPad, box.y + (box.h - px)/2, px, color, "start", "kievit"));
}

// ---- Build static UI once (all in base units) ----
(function build() {
  // Allergens (perfect circles)
  [
    ["egg",79.3,352.1,"#ffe89a","#fff6d8"],
    ["milk",199.7,352.1,"#ff9a9a","#ffdbdb"],
    ["wheat",320.0,352.1,"#efb58f","#ffd6d6"],
    ["fish",79.3,472.6,"#9acbff","#dbedff"],
    ["shellfish",199.7,472.6,"#e1a0e1","#ffd4ff"],
    ["soy",320.0,472.6,"#c3ddb7","#e9f6e3"],
    ["sesame",79.3,593.0,"#9b9b9b","#cfcaca"],
    ["peanuts",199.7,593.0,"#ffc952","#ffe7b2"],
    ["tree_nuts",320.0,593.0,"#91c4b9","#dbdbdb"],
    ["cc_all",79.3,713.2,"#bb8585","#d8b4b4"],
    ["add_allergen",199.7,713.2,"#ebebeb","#ebdfdf"],
  ].forEach(([key,x,y,fill,stroke])=>{
    circleButton(allergenCircles, x, y, 100.5, fill, stroke, key);
  });

  // Attributes (circles)
  [["halal",531.7,352.1],["vegan",651.9,352.1],["caffeine",772.2,352.1]]
    .forEach(([key,x,y]) => circleButton(attributeCircles, x, y, 100.5, "#efeeee", "#fff8f8", key));

  // Artificial colors (left-aligned labels; icons pinned to absolute X)
  [
    [528.8,"Red 40","red40","#ff8181","#ff9a9a","#800000"],
    [587.8,"Yellow 5","yellow5","#fffa81","#f4e4a2","#807700"],
    [646.3,"Blue 1","blue1","#81f4ff","#c8fcff","#3d96a2"],
    [704.8,"Blue 2","blue2","#81bfff","#c2d5ff","#3d6ba2"],
    [763.3,"Green 3","green3","#abebbe","#e3ffd7","#275213"],
  ].forEach(([y,label,key,fill,stroke,textCol])=>{
    const box = pillButton(artColorPills, 502, y, 170.4, 49.7, fill, stroke);
    placeIconPinnedX(artColorPills, box, key, ARTIFICIAL_ICON_X_BASE);
    leftAlignedText(artColorPills, `  ${label}`, box, 18, textCol, 56);
  });

  // Texture & Stabilizers
  ["Carrageenan","Xanthan gum","Cellulose gum","Polysorbates"].forEach((label,i)=>{
    const y = 528.8 + i*58.5;
    const box = pillButton(texturePills, 716, y, 216.3, 49.7, "#efeeee", "#fff8f8");
    placeIconPinnedX(texturePills, box, "texture", TEXTURE_ICON_X_BASE);
    leftAlignedText(texturePills, `  ${label}`, box, 18, "#443b3b", 56);
  });

  // Bottom buttons
  [
    [296.3,"Add Menu Card",476.9],
    [784.8,"Export PDF",238]
  ].forEach(([x,label,w])=>{
    bottomButtons.appendChild(R(x, 981.6, w, 36.8, "#012e64", "#3d6ba2", 2, 18.4));
    bottomButtons.appendChild(T(label, x + w/2, 981.6 + (36.8-18)/2, 18, "#fff", "middle"));
  });

  // Preview: centered inside the right gray panel (base: x=1077.8, w=842.2, h=1080)
  const RPX = 1077.8, RPW = 842.2, RPH = 1080;

  const PANEL_W = RPW * 0.82;
  const PANEL_H = RPH * 0.82;
  const PANEL_X = RPX + (RPW - PANEL_W)/2;
  const PANEL_Y = (RPH - PANEL_H)/2;

  // Gradient panel
  previewPanel.appendChild(R(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, "url(#previewGrad)", "#0e223f", 4, 18));

  // White sheet + grid lines (2 cols × 5 rows)
  const padX = PANEL_W * 0.06;
  const padY = PANEL_H * 0.06;
  const innerX = PANEL_X + padX, innerY = PANEL_Y + padY;
  const innerW = PANEL_W - 2*padX, innerH = PANEL_H - 2*padY;

  previewPanel.appendChild(R(innerX, innerY, innerW, innerH, "#fff"));

  const LINE_COLOR = "#0e223f", LINE_W = 6;

  // vertical divider
  const vX = innerX + innerW/2;
  const v = document.createElementNS(svgNS,"line");
  v.setAttribute("x1", vX); v.setAttribute("y1", innerY);
  v.setAttribute("x2", vX); v.setAttribute("y2", innerY+innerH);
  v.setAttribute("stroke", LINE_COLOR); v.setAttribute("stroke-width", LINE_W);
  previewPanel.appendChild(v);

  // horizontal dividers (4 lines)
  for(let r=1;r<5;r++){
    const y = innerY + innerH * r/5;
    const h = document.createElementNS(svgNS,"line");
    h.setAttribute("x1", innerX); h.setAttribute("y1", y);
    h.setAttribute("x2", innerX+innerW); h.setAttribute("y2", y);
    h.setAttribute("stroke", LINE_COLOR); h.setAttribute("stroke-width", LINE_W);
    previewPanel.appendChild(h);
  }
})();
