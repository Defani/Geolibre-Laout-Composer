// ---------------------------------------------------------------- icon catalog
// Icons (Maki, Temaki — both CC0) load from jsDelivr on first use and are then
// stored inline in the item, so layouts keep working offline and export cleanly.

// ---- icon item
ITEM_TYPES.icon = {
  label: "Icon",
  icon: "library",
  size: [10, 10],
  defaults: () => ({ set: "maki", name: "marker", svg: "", viewBox: "0 0 15 15", color: "#111111", label: "", labelPos: "right", font: font({ size: 8 }) }),
};
RENDERERS.icon = function iconItem(item, ctx) {
  const p = item.props;
  if (!p.svg) return ctx.export ? "" : placeholder(item, "Loading icon…");
  const hasLabel = !!String(p.label || "").trim();
  const s = Math.min(item.h, hasLabel ? item.h : item.w);
  let out = `<svg x="0" y="${round((item.h - s) / 2, 3)}" width="${round(s, 3)}" height="${round(s, 3)}" viewBox="${esc(p.viewBox)}" overflow="visible"><g fill="${esc(p.color)}" color="${esc(p.color)}">${p.svg}</g></svg>`;
  if (hasLabel) out += richLine(resolveVars(p.label, item), s + 1, item.h / 2 + p.font.size * PT * 0.35, p.font, "start").svg;
  return out;
};
const iconCache = new Map();
async function fetchIconSvg(set, name) {
  const key = `${set}/${name}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const url = CATALOG.iconSets[set].url.replace("{name}", encodeURIComponent(name));
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    })
    .then((txt) => {
      const doc = new DOMParser().parseFromString(txt, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) throw new Error("Not an SVG");
      // keep shapes only; drop scripts / event attributes; let the item color fill them
      svg.querySelectorAll("script,foreignObject").forEach((n) => n.remove());
      svg.querySelectorAll("*").forEach((n) => {
        for (const a of [...n.attributes]) if (/^on/i.test(a.name)) n.removeAttribute(a.name);
        if (n.getAttribute("fill") && n.getAttribute("fill") !== "none") n.removeAttribute("fill");
      });
      const vb = svg.getAttribute("viewBox") || `0 0 ${parseFloat(svg.getAttribute("width")) || 15} ${parseFloat(svg.getAttribute("height")) || 15}`;
      return { svg: svg.innerHTML, viewBox: vb };
    });
  iconCache.set(key, p);
  p.catch(() => iconCache.delete(key));
  return p;
}
async function addIconItem(set, name) {
  const pg = S.doc.page;
  const item = newItem("icon", pg.width / 2 - 5, pg.height / 2 - 5);
  item.name = name.replace(/[-_]/g, " ");
  item.props.set = set;
  item.props.name = name;
  commit(() => S.doc.items.push(item));
  select([item.id]);
  try {
    const ic = await fetchIconSvg(set, name);
    item.props.svg = ic.svg;
    item.props.viewBox = ic.viewBox;
    saveLibrary();
    renderAll();
  } catch (e) {
    toast(`Could not load icon “${name}”: ${e.message}`, "warn");
  }
}

// ---- catalog browser: Rupabumi pictograms (inline) + Maki / Temaki (CC0, jsDelivr)
const ICON_SET_LABELS = { rbi: "Rupabumi", maki: "Maki", temaki: "Temaki" };
function addRbiIcon(ic) {
  const pg = S.doc.page;
  const item = newItem("icon", pg.width / 2 - 5, pg.height / 2 - 5);
  item.name = ic.name;
  const color = /danau|sungai|air|rawa|laut|pantai|waduk|pelabuhan|dermaga/.test(ic.id) ? "#1f78b4" : /hutan|mangrove|kebun|sawah|semak|rumput/.test(ic.id) ? "#2e7d32" : /kontur|gunung|puncak|bukit|gua|lereng/.test(ic.id) ? "#8d5524" : "#111111";
  Object.assign(item.props, { set: "rbi", name: ic.id, svg: ic.svg, viewBox: "0 0 24 24", color });
  commit(() => S.doc.items.push(item));
  select([item.id]);
}
function openCatalog(anchor) {
  const tabs = el("div", { class: `${NS}-seg ${NS}-segfull` });
  const search = el("input", { type: "search", class: `${NS}-input`, placeholder: "Search icons (danau, sungai, kontur, airport…)" });
  const body = el("div", { class: `${NS}-catbody` });
  let tab = S.catalogTab && ICON_SET_LABELS[S.catalogTab] ? S.catalogTab : "rbi";
  const draw = () => {
    S.catalogTab = tab;
    for (const b of tabs.children) b.classList.toggle("active", b.dataset.v === tab);
    body.innerHTML = "";
    const q = search.value.trim().toLowerCase();
    if (tab === "rbi") {
      body.append(el("p", { class: `${NS}-muted` }, "Topographic pictograms drawn for this plugin. Click to place; change the color on the right."));
      const groups = [...new Set(RBI_ICONS.map((i) => i.group))];
      for (const gname of groups) {
        const list = RBI_ICONS.filter((i) => i.group === gname && (!q || i.name.toLowerCase().includes(q) || i.id.includes(q)));
        if (!list.length) continue;
        const grid = el("div", { class: `${NS}-icongrid ${NS}-rbigrid` });
        for (const ic of list) {
          const b = el("button", { type: "button", class: `${NS}-iconbtn`, title: ic.name, html: `<svg width="22" height="22" viewBox="0 0 24 24">${ic.svg}</svg><small>${esc(ic.name)}</small>` });
          b.addEventListener("click", () => {
            closePopover();
            addRbiIcon(ic);
          });
          grid.appendChild(b);
        }
        body.appendChild(el("details", { class: `${NS}-catgrp`, open: true }, el("summary", {}, gname, el("small", {}, String(list.length))), grid));
      }
      return;
    }
    const set = CATALOG.iconSets[tab];
    body.append(el("p", { class: `${NS}-muted` }, `${set.label} icons · ${set.license} (public domain). Click to place on the page.`));
    const order = ["Basic symbols", "Water & hydrology", "Terrain & nature", "Vegetation & forest", "Transport", "Government & public", "Health", "Education & culture", "Religion", "Tourism & recreation", "Sports", "Food & shops", "Utilities & industry", "Hazards & warnings", "Other"];
    for (const gname of order) {
      const names = (set.groups[gname] || []).filter((n) => !q || n.includes(q.replace(/\s+/g, "-")) || n.includes(q.replace(/\s+/g, "_")));
      if (!names.length) continue;
      const grid = el("div", { class: `${NS}-icongrid` });
      for (const n of names) {
        const b = el("button", { type: "button", class: `${NS}-iconbtn ${NS}-remote`, title: n });
        b.appendChild(el("img", { src: set.url.replace("{name}", encodeURIComponent(n)), alt: n, loading: "lazy" }));
        b.addEventListener("click", () => {
          closePopover();
          addIconItem(tab, n);
        });
        grid.appendChild(b);
      }
      body.appendChild(el("details", { class: `${NS}-catgrp`, open: !!q || gname === "Basic symbols" || gname === "Water & hydrology" }, el("summary", {}, gname, el("small", {}, String(names.length))), grid));
    }
  };
  for (const [v, label] of Object.entries(ICON_SET_LABELS)) {
    const b = el("button", { type: "button", "data-v": v }, label);
    b.addEventListener("click", () => {
      tab = v;
      draw();
    });
    tabs.appendChild(b);
  }
  search.addEventListener("input", draw);
  draw();
  return popoverAt(anchor, el("div", { class: `${NS}-catalog` }, el("div", { class: `${NS}-ptitle` }, "Icon catalog"), tabs, search, body), `${NS}-catpop`);
}
