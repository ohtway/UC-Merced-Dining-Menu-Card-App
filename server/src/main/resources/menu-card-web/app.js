// ========= Constants & icon mapping =========
const ARTIFICIAL_ICON_X_BASE = 530;
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

  halal_badge:"assets/icons/attributes_halal_card_icon.png",
  vegan_badge:"assets/icons/attributes_vegan_icon.png",
  caffeine_badge:"assets/icons/attributes_contains_caffeine_icon.png",

  red40:"assets/icons/artificial_colors_red_40_icon.png",
  yellow5:"assets/icons/artificial_colors_yellow_5_icon.png",
  blue1:"assets/icons/artificial_colors_blue_1_icon.png",
  blue2:"assets/icons/artificial_colors_blue_2_icon.png",
  green3:"assets/icons/artificial_colors_green_3_icon.png",

  texture:"assets/icons/texture_and_stabilizer_icon.png",
  logo:"assets/icons/dining_logo.png",
};

const LABEL = {
  egg:"Egg", milk:"Milk", wheat:"Wheat", fish:"Fish", shellfish:"Shellfish",
  soy:"Soy", sesame:"Sesame", peanuts:"Peanuts", tree_nuts:"Tree Nuts",
  cc_all:"May contain all allergens", add_allergen:"Add Allergen",
  halal:"Halal", vegan:"Vegan", caffeine:"Caffeine",
  red40:"Red 40", yellow5:"Yellow 5", blue1:"Blue 1", blue2:"Blue 2", green3:"Green 3",
  carrageenan:"Carrageenan", xanthan:"Xanthan gum", cellulose:"Cellulose gum", polysorbates:"Polysorbates"
};

// ========= DOM Shortcuts =========
const svgNS = "http://www.w3.org/2000/svg";
const allergenCircles = document.getElementById("allergenCircles");
const attributeCircles= document.getElementById("attributeCircles");
const artColorPills   = document.getElementById("artColorPills");
const texturePills    = document.getElementById("texturePills");
const bottomButtons   = document.getElementById("bottomButtons");
const previewPanel    = document.getElementById("previewPanel");
const nameErrorEl     = document.getElementById("nameError");
const allergenHintEl  = document.getElementById("allergenHint");
const attributeHintEl = document.getElementById("attributeHint");

// Modal
const modalEl   = document.getElementById("customAllergenModal");
const modalInp  = document.getElementById("customAllergenInput");
const modalAdd  = document.getElementById("customAllergenAddBtn");
const modalX    = document.getElementById("customAllergenClose");

// ========= State =========
const state = {
  selAllergens: new Set(),
  customAllergens: [],
  selAttributes: new Set(),
  selColors: new Set(),
  selTextures: new Set(),
  cards: [],
  selectedCardIndex: null,
  exportBusy: false
};

const toggleRefs = { allergen: [], attribute: [], color: [], texture: [] };

// ========= SVG helpers =========
function R(x,y,w,h,fill,stroke=null,sw=1,rx=0){
  const el = document.createElementNS(svgNS,"rect");
  el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("width",w); el.setAttribute("height",h);
  el.setAttribute("fill",fill);
  if(stroke){ el.setAttribute("stroke",stroke); el.setAttribute("stroke-width",sw); }
  if(rx>0){ el.setAttribute("rx",rx); }
  return el;
}
function I(href,x,y,w,h){
  const el=document.createElementNS(svgNS,"image");
  el.setAttribute("href",href); el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("width",w); el.setAttribute("height",h);
  return el;
}
function T(txt,x,y,size,color="#000",anchor="start",klass="kievit"){
  const el=document.createElementNS(svgNS,"text");
  el.textContent=txt; el.setAttribute("x",x); el.setAttribute("y",y);
  el.setAttribute("font-size",size); el.setAttribute("fill",color);
  el.setAttribute("class",klass); el.setAttribute("text-anchor",anchor);
  el.setAttribute("dominant-baseline","hanging");
  return el;
}

// ========= Shadows helpers =========
function setNormalShadow(shape){ shape.setAttribute("filter","url(#btnShadow)"); }
function setPressedShadow(shape){ shape.setAttribute("filter","url(#btnShadowPressed)"); }

// ========= UI Controls =========
function circleSelectable(parentG, x, y, d, fill, stroke, key, section){
  const g = document.createElementNS(svgNS, "g");
  parentG.appendChild(g);

  const borderW = Math.max(1, Math.round(d * 0.02));
  const circle = R(x, y, d, d, fill, stroke, borderW, d/2);
  circle.classList.add("btn-anim");
  setNormalShadow(circle);
  g.appendChild(circle);

  const icon = ICON[key];
  if (icon){
    const s = Math.round(d * 0.62);
    g.appendChild(I(icon, x+(d-s)/2, y+(d-s)/2, s, s));
  }

  const label  = LABEL[key] || key;
  const hintTarget = (section === "allergen") ? allergenHintEl : attributeHintEl;
  const show = () => { if (hintTarget) hintTarget.textContent = `— ${label}`; };
  const hide = () => { if (hintTarget) hintTarget.textContent = ""; };

  g.addEventListener("pointerenter", show);
  g.addEventListener("pointerleave", hide);

  if (key === "add_allergen") {
    g.style.cursor = "pointer";
    g.addEventListener("click", () => openCustomModal());
    toggleRefs[section].push({ key, el: circle, defaultStroke: stroke, group: g, isSpecial: true });
    return;
  }

  // Toggle selection
  g.style.cursor = "pointer";
  g.addEventListener("click", () => {
    const set = (section === "allergen") ? state.selAllergens : state.selAttributes;
    const isOn = set.has(key);
    if (isOn) {
      set.delete(key);
      circle.setAttribute("stroke", stroke);
      setNormalShadow(circle);
      g.removeAttribute("transform");
    } else {
      set.add(key);
      circle.setAttribute("stroke", "#012e64");
      setPressedShadow(circle);
      g.setAttribute("transform","translate(0,2)");
    }
  });

  toggleRefs[section].push({ key, el: circle, defaultStroke: stroke, group: g });
}

function pillSelectable(parentG, x, y, w, h, fill, stroke, iconKey, label, setRef, kind){
  const g = document.createElementNS(svgNS, "g");
  parentG.appendChild(g);

  const rect = R(x, y, w, h, fill, stroke, 2, h/2);
  rect.classList.add("btn-anim");
  setNormalShadow(rect);
  g.appendChild(rect);

  const s = Math.round(Math.min(w, h) * 0.62);
  const pinX = (kind === "color") ? ARTIFICIAL_ICON_X_BASE : TEXTURE_ICON_X_BASE;
  g.appendChild(I(ICON[iconKey], pinX - s/2, y + (h - s)/2, s, s));

  const text = document.createElementNS(svgNS, "text");
  text.textContent = `  ${label}`;
  text.setAttribute("x", x + 56);
  text.setAttribute("y", y + (h - 18)/2);
  text.setAttribute("font-size", 18);
  text.setAttribute("fill", "#443b3b");
  text.setAttribute("class", "kievit");
  text.setAttribute("dominant-baseline", "hanging");
  g.appendChild(text);

  g.style.cursor = "pointer";
  g.addEventListener("pointerenter", ()=> rect.setAttribute("stroke", "#333"));
  g.addEventListener("pointerleave", ()=> rect.setAttribute("stroke", setRef.has(labelKey(label)) ? "#012e64" : stroke));

  g.addEventListener("click", () => {
    const key = labelKey(label);
    if (setRef.has(key)) {
      setRef.delete(key);
      rect.setAttribute("stroke", stroke);
      setNormalShadow(rect);
      g.removeAttribute("transform");
    } else {
      setRef.add(key);
      rect.setAttribute("stroke", "#012e64");
      setPressedShadow(rect);
      g.setAttribute("transform","translate(0,2)");
    }
  });

  toggleRefs[kind].push({ key: labelKey(label), el: rect, defaultStroke: stroke, group: g });
}

function labelKey(label){
  const map = {
    "Red 40":"red40", "Yellow 5":"yellow5", "Blue 1":"blue1", "Blue 2":"blue2", "Green 3":"green3",
    "Carrageenan":"carrageenan", "Xanthan gum":"xanthan", "Cellulose gum":"cellulose", "Polysorbates":"polysorbates"
  };
  return map[label] || label;
}

// ========= Preview panel (HTML) =========
let pagesRootDiv = null;
function buildPreviewPanel(){
  const RPX = 1077.8, RPW = 842.2, RPH = 1080;
  const PANEL_W = RPW * 0.82, PANEL_H = RPH * 0.82;
  const PANEL_X = RPX + (RPW - PANEL_W)/2, PANEL_Y = (RPH - PANEL_H)/2;

  previewPanel.appendChild(R(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, "url(#previewGrad)", "#0e223f", 8, 40));

  const padX = PANEL_W * 0.03, padY = PANEL_H * 0.03;
  const innerX = PANEL_X + padX, innerY = PANEL_Y + padY;
  const innerW = PANEL_W - 2*padX, innerH = PANEL_H - 2*padY;

  const fo = document.createElementNS(svgNS, "foreignObject");
  fo.setAttribute("x", innerX); fo.setAttribute("y", innerY);
  fo.setAttribute("width", innerW); fo.setAttribute("height", innerH);

  const host = document.createElement("div");
  host.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  host.className = "preview-scroll";

  pagesRootDiv = document.createElement("div");
  host.appendChild(pagesRootDiv);

  fo.appendChild(host);
  previewPanel.appendChild(fo);
}

function renderPages(){
  if (!pagesRootDiv) return;
  pagesRootDiv.innerHTML = "";

  const perPage = 10;
  const pages = Math.max(1, Math.ceil(state.cards.length / perPage));

  for (let p = 0; p < pages; p++){
    const pageDiv = document.createElement("div");
    pageDiv.className = "preview-page";

    const grid = document.createElement("div");
    grid.className = "card-grid";
    pageDiv.appendChild(grid);

    for (let i = 0; i < perPage; i++){
      const globalIdx = p*perPage + i;
      const cardData = state.cards[globalIdx];

      const card = document.createElement("div");
      card.className = "menu-card";
      card.dataset.index = globalIdx;

      card.addEventListener("click", (e)=>{
        e.stopPropagation();
        document.querySelectorAll(".menu-card.selected").forEach(el=> el.classList.remove("selected"));
        card.classList.add("selected");
        state.selectedCardIndex = globalIdx;
      });

      const content = document.createElement("div");
      content.className = "content";

      if (cardData){
        const badges = document.createElement("div");
        badges.className = "card-badges";
        card.appendChild(badges);
        if (cardData.attributes.includes("halal"))    badges.appendChild(imgEl(ICON.halal_badge, "Halal"));
        if (cardData.attributes.includes("vegan"))    badges.appendChild(imgEl(ICON.vegan_badge, "Vegan"));
        if (cardData.attributes.includes("caffeine")) badges.appendChild(imgEl(ICON.caffeine_badge, "Caffeine"));
        if (cardData.allergens.includes("cc_all"))    badges.appendChild(imgEl(ICON.cc_all, "May contain all allergens"));

        const nameEl = document.createElement("h3");
        nameEl.className = "card-name";
        nameEl.textContent = cardData.name || "";
        content.appendChild(nameEl);

        const alList = [];
        if (cardData.allergens.length) alList.push(...cardData.allergens.map(k => LABEL[k] || k));
        if (cardData.customAllergens && cardData.customAllergens.length) alList.push(...cardData.customAllergens);
        if (alList.length){
          const a = document.createElement("p");
          a.className = "card-allergens";
          a.textContent = "Allergens: " + alList.join(", ");
          content.appendChild(a);
        }

        const auxList = [
          ...cardData.colors.map(k => LABEL[k] || k),
          ...cardData.textures.map(k => LABEL[k] || k)
        ];
        if (cardData.attributes.includes("caffeine")) auxList.push("Caffeine");
        if (auxList.length){
          const aux = document.createElement("p");
          aux.className = "card-aux";
          aux.textContent = "Contains: " + auxList.join(", ");
          content.appendChild(aux);
        }
      }

      card.appendChild(content);
      grid.appendChild(card);
    }

    pagesRootDiv.appendChild(pageDiv);
  }
}

function imgEl(src, alt){ const img = document.createElement("img"); img.src = src; img.alt = alt; return img; }

// ========= Bottom buttons (SVG) =========
let exportBtnRect = null, exportBtnG = null, exportHit = null;

function buildButtons(){
  const vis = [
    { x:296.3, y:981.6, w:476.9, h:36.8, label:"Add Menu Card", id:"addCard" },
    { x:784.8, y:981.6, w:238.0, h:36.8, label:"Export PDF",   id:"exportPdf" }
  ];
  vis.forEach(b=>{
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("data-id", b.id);

    const rect = R(b.x, b.y, b.w, b.h, "#012e64", "#3d6ba2", 2, 18.4);
    rect.classList.add("btn-anim");
    setNormalShadow(rect);
    const txt  = T(b.label, b.x + b.w/2, b.y + (36.8-18)/2, 18, "#fff", "middle");
    g.appendChild(rect);
    g.appendChild(txt);

    const hit = R(b.x, b.y, b.w, b.h, "transparent");
    hit.style.cursor = "pointer";

    hit.addEventListener("pointerdown", ()=>{ setPressedShadow(rect); g.setAttribute("transform","translate(0,2)"); });
    hit.addEventListener("pointerup",   ()=>{ setNormalShadow(rect); g.removeAttribute("transform"); });
    hit.addEventListener("pointerleave",()=>{ setNormalShadow(rect); g.removeAttribute("transform"); });

    hit.addEventListener("click", ()=>{
      if (b.id === "addCard") addCurrentCard();
      if (b.id === "exportPdf") exportPdf();
    });

    bottomButtons.appendChild(g);
    bottomButtons.appendChild(hit);

    if (b.id === "exportPdf"){ exportBtnG = g; exportBtnRect = rect; exportHit = hit; }
  });
}

// ========= Keyboard interactions =========
function setupKeys(){
  document.addEventListener("keydown", (e)=>{
    if (!modalEl.classList.contains("hidden")){
      if (e.key === "Enter"){ e.preventDefault(); confirmCustomAllergen(); }
      if (e.key === "Escape"){ e.preventDefault(); closeCustomModal(); }
      return;
    }
    if (e.key === "Enter"){ e.preventDefault(); addCurrentCard(); }
    if (e.key === "Backspace" && state.selectedCardIndex !== null){
      e.preventDefault();
      if (state.selectedCardIndex >= 0 && state.selectedCardIndex < state.cards.length){
        state.cards.splice(state.selectedCardIndex, 1);
        state.selectedCardIndex = null;
        renderPages();
      }
    }
  });

  document.addEventListener("click", ()=>{
    document.querySelectorAll(".menu-card.selected").forEach(el=> el.classList.remove("selected"));
    state.selectedCardIndex = null;
  });
}

// ========= Modal =========
function openCustomModal(){ modalInp.value = ""; modalEl.classList.remove("hidden"); setTimeout(()=> modalInp.focus(), 0); }
function closeCustomModal(){ modalEl.classList.add("hidden"); }
function confirmCustomAllergen(){ const v = modalInp.value.trim(); if (v){ state.customAllergens.push(v); } closeCustomModal(); }
modalAdd?.addEventListener("click", confirmCustomAllergen);
modalX?.addEventListener("click", closeCustomModal);

// ========= Card creation =========
function addCurrentCard(){
  const name = (document.getElementById("itemInput")?.value || "").trim();
  if (!name){ if (nameErrorEl) nameErrorEl.textContent = "You must add a menu item name."; return; }
  if (nameErrorEl) nameErrorEl.textContent = "";

  state.cards.push({
    name,
    allergens: Array.from(state.selAllergens),
    customAllergens: [...state.customAllergens],
    colors: Array.from(state.selColors),
    textures: Array.from(state.selTextures),
    attributes: Array.from(state.selAttributes),
  });

  renderPages();
  resetSelectionsUI();
  const inp = document.getElementById("itemInput"); if (inp) inp.value = "";
}

function resetSelectionsUI(){
  state.selAllergens.clear(); state.customAllergens = [];
  state.selAttributes.clear(); state.selColors.clear(); state.selTextures.clear();

  ["allergen","attribute","color","texture"].forEach(kind=>{
    toggleRefs[kind].forEach(ref => {
      ref.el.setAttribute("stroke", ref.defaultStroke);
      setNormalShadow(ref.el);
      if (ref.group && !ref.isSpecial) ref.group.removeAttribute("transform");
    });
  });
  if (allergenHintEl) allergenHintEl.textContent = "";
  if (attributeHintEl) attributeHintEl.textContent = "";
}

// ========= Export (wave animation) =========
function setExportBusy(on){
  state.exportBusy = on;

  // Disable only the export hit target
  if (exportHit) exportHit.style.pointerEvents = on ? "none" : "auto";

  // Toggle global class (HTML button shimmer)
  document.body.classList.toggle("wave-loading", on);

  // Explicitly toggle the SVG wide shine overlay
  const shine = document.getElementById("waveShine");
  if (shine) shine.style.display = on ? "block" : "none";

  // Apply .wave-on to all button base shapes
  const shapes = document.querySelectorAll(".btn-anim");
  shapes.forEach((el, i) => {
    if (on){
      const delay = (i % 10) * 0.12; // subtle stagger
      el.classList.add("wave-on");
      el.style.animationDelay = `${delay}s`;
    } else {
      el.classList.remove("wave-on");
      el.style.animationDelay = "";
      el.style.opacity = "";
    }
  });
}

async function exportPdf(){
  if (state.exportBusy) return;
  setExportBusy(true);

  // Ensure the wave paints before starting the fetch
  await new Promise(requestAnimationFrame);

  try{
    const res = await fetch("http://localhost:8080/export", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(state.cards),
    });
    if (!res.ok) throw new Error(await res.text());
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "menu-cards.pdf";
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  } catch (err){
    console.error("Export failed:", err);
    alert("Export failed. Make sure the export server is running on http://localhost:8080.");
  } finally {
    setExportBusy(false);
  }
}

// ========= Build left controls =========
(function buildLeftControls() {
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
    circleSelectable(allergenCircles, x, y, 100.5, fill, stroke, key, "allergen");
  });

  [["halal",531.7,352.1],["vegan",651.9,352.1],["caffeine",772.2,352.1]]
    .forEach(([key,x,y]) => circleSelectable(attributeCircles, x, y, 100.5, "#efeeee", "#fff8f8", key, "attribute"));

  // Vertical layout for color and texture pills
  [
    [528.8,"Red 40","red40","#ff8181","#ff9a9a"],
    [613.8,"Yellow 5","yellow5","#fffa81","#f4e4a2"],
    [698.8,"Blue 1","blue1","#81f4ff","#c8fcff"],
    [783.8,"Blue 2","blue2","#81bfff","#c2d5ff"],
    [868.8,"Green 3","green3","#abebbe","#e3ffd7"],
  ].forEach(([y,label,key,fill,stroke])=>{
    pillSelectable(artColorPills, 502, y, 170.4, 49.7, fill, stroke, key, label, state.selColors, "color");
  });

  [
    [528.8,"Carrageenan"],
    [613.8,"Xanthan gum"],
    [698.8,"Cellulose gum"],
    [783.8,"Polysorbates"],
  ].forEach(([y,label])=>{
    pillSelectable(texturePills, 716, y, 216.3, 49.7, "#efeeee", "#fff8f8", "texture", label, state.selTextures, "texture");
  });
})();


// Close the app when the tab/window is closed or navigated away
window.addEventListener('pagehide', () => {
  try { navigator.sendBeacon('/shutdown', 'bye'); } catch (e) {}
});


// ========= Init =========
buildPreviewPanel();
buildButtons();
setupKeys();
renderPages();
