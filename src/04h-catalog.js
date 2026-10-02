// ---------------------------------------------------------------- symbol catalog: icons + KLHK symbology
// Icons (Maki, Temaki — both CC0) load from jsDelivr on first use and are then
// stored inline in the item, so layouts keep working offline and export cleanly.

// RBI-style reference symbols for common topographic features. These are
// approximations for layout work; the binding specification is SNI 8743:2019.
const RBI_STYLE = [
  { group: "Perairan (hydrography)", items: [
    { name: "Sungai (garis)", patch: { type: "line", stroke: "#1f78b4", strokeWidth: 0.35 } },
    { name: "Sungai besar (area)", patch: { type: "fill", fill: "#bfe6ff", stroke: "#1f78b4", strokeWidth: 0.2 } },
    { name: "Danau / waduk", patch: { type: "fill", fill: "#bfe6ff", stroke: "#1f78b4", strokeWidth: 0.25 } },
    { name: "Rawa", patch: { type: "fill", fill: "#d7f0ff", stroke: "#1f78b4", strokeWidth: 0.15 } },
    { name: "Garis pantai", patch: { type: "line", stroke: "#1f78b4", strokeWidth: 0.25 } },
    { name: "Laut", patch: { type: "fill", fill: "#bee8ff", stroke: "", strokeWidth: 0 } },
    { name: "Mata air", patch: { type: "point", fill: "#1f78b4", stroke: "#ffffff", radius: 1 } },
  ] },
  { group: "Transportasi (transport)", items: [
    { name: "Jalan arteri", patch: { type: "line", stroke: "#e31a1c", strokeWidth: 0.7 } },
    { name: "Jalan kolektor", patch: { type: "line", stroke: "#ff7f00", strokeWidth: 0.55 } },
    { name: "Jalan lokal", patch: { type: "line", stroke: "#ffd27f", strokeWidth: 0.45 } },
    { name: "Jalan lain / setapak", patch: { type: "line", stroke: "#4d4d4d", strokeWidth: 0.25, dash: "dash" } },
    { name: "Jalan kereta api", patch: { type: "line", stroke: "#000000", strokeWidth: 0.45, dash: "longdash" } },
    { name: "Bandar udara", patch: { type: "point", fill: "#6a3d9a", stroke: "#ffffff", radius: 1.2 } },
    { name: "Pelabuhan", patch: { type: "point", fill: "#1f78b4", stroke: "#ffffff", radius: 1.2 } },
  ] },
  { group: "Batas wilayah (boundaries)", items: [
    { name: "Batas negara", patch: { type: "line", stroke: "#000000", strokeWidth: 0.6, dash: "longdashdot" } },
    { name: "Batas provinsi", patch: { type: "line", stroke: "#000000", strokeWidth: 0.45, dash: "dashdot" } },
    { name: "Batas kabupaten/kota", patch: { type: "line", stroke: "#4d4d4d", strokeWidth: 0.35, dash: "dashdot" } },
    { name: "Batas kecamatan", patch: { type: "line", stroke: "#7f7f7f", strokeWidth: 0.25, dash: "dash" } },
    { name: "Batas desa", patch: { type: "line", stroke: "#9f9f9f", strokeWidth: 0.2, dash: "dot" } },
  ] },
  { group: "Permukiman & relief", items: [
    { name: "Permukiman", patch: { type: "fill", fill: "#f4c6c6", stroke: "#b15928", strokeWidth: 0.1 } },
    { name: "Ibu kota provinsi", patch: { type: "point", fill: "#000000", stroke: "#ffffff", radius: 1.5 } },
    { name: "Ibu kota kabupaten/kota", patch: { type: "point", fill: "#ffffff", stroke: "#000000", radius: 1.3 } },
    { name: "Garis kontur", patch: { type: "line", stroke: "#a0522d", strokeWidth: 0.15 } },
    { name: "Kontur indeks", patch: { type: "line", stroke: "#a0522d", strokeWidth: 0.35 } },
    { name: "Titik tinggi", patch: { type: "point", fill: "#7f3b08", stroke: "", radius: 0.6 } },
  ] },
];

const rgbHex = (rgb) => rgbToHex(rgb);
// Legend patch for a KLHK symbology row (white fills get a thin outline).
function klhkPatch(it) {
  const fill = rgbHex(it.rgb);
  const isLine = /garis|batas|line|jalan|sungai/i.test(`${it.name} ${it.note || ""}`) && !/area|kawasan|zona|blok/i.test(it.name);
  if (isLine) return { type: "line", stroke: fill, strokeWidth: 0.5 };
  return { type: "fill", fill, fillOpacity: 1, stroke: /^#(f{6}|fefefe)$/i.test(fill) ? "#9ca3af" : "", strokeWidth: 0.15 };
}

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

// ---- catalog browser
function openCatalog(anchor, { legend } = {}) {
  const tabs = el("div", { class: `${NS}-seg ${NS}-segfull` });
  const search = el("input", { type: "search", class: `${NS}-input`, placeholder: "Search symbols…" });
  const body = el("div", { class: `${NS}-catbody` });
  const target = legend || selectedItems().find((i) => i.type === "legend") || null;
  let tab = S.catalogTab || "klhk";
  const addEntry = (name, patch) => {
    const lg = target || selectedItems().find((i) => i.type === "legend");
    if (!lg) return toast("Select a legend first to add symbology entries to it.", "warn");
    commit(() => lg.props.entries.push({ key: uid("man"), kind: "item", label: name, manual: true, userLabel: true, patch: clone(patch) }));
    toast(`Added “${name}” to ${lg.name}`);
  };
  const swatchRow = (name, patch, sub) => {
    const r = el("button", { type: "button", class: `${NS}-catrow`, title: target ? `Add to ${target.name}` : "Select a legend, then click to add" });
    r.innerHTML = `<svg width="26" height="16" viewBox="0 0 7 4">${legendPatch(patch, 0, 0, 7, 4)}</svg><span>${esc(name)}</span>${sub ? `<small>${esc(sub)}</small>` : ""}`;
    r.addEventListener("click", () => addEntry(name, patch));
    return r;
  };
  const draw = () => {
    S.catalogTab = tab;
    for (const b of tabs.children) b.classList.toggle("active", b.dataset.v === tab);
    body.innerHTML = "";
    const q = search.value.trim().toLowerCase();
    if (tab === "klhk") {
      const kh = CATALOG.klhk;
      body.append(
        el("p", { class: `${NS}-muted` }, `Colors from ${kh.source}. Click a row to add it to the selected legend.`),
        el("div", { class: `${NS}-btnrow` },
          btn("Add Kawasan Hutan legend set", () => {
            const lg = target || selectedItems().find((i) => i.type === "legend");
            if (!lg) return toast("Select a legend first.", "warn");
            commit(() => {
              lg.props.entries.push({ key: uid("man"), kind: "group", label: "Fungsi Kawasan Hutan", manual: true });
              for (const k of kh.kawasanHutan) lg.props.entries.push({ key: uid("man"), kind: "item", label: k.name, manual: true, userLabel: true, patch: klhkPatch(k) });
              lg.props.entries.push({ key: uid("man"), kind: "item", label: "Batas Kawasan Hutan (tata batas definitif)", manual: true, userLabel: true, patch: { type: "line", stroke: "#000000", strokeWidth: 0.5 } });
              lg.props.entries.push({ key: uid("man"), kind: "item", label: "Batas Kawasan Hutan (belum tata batas)", manual: true, userLabel: true, patch: { type: "line", stroke: "#000000", strokeWidth: 0.5, dash: "dash" } });
            });
            toast("Kawasan Hutan legend set added");
          }, { iconName: "list", primary: true }),
        ),
      );
      const kgrp = el("details", { class: `${NS}-catgrp`, open: true }, el("summary", {}, "3.1 Kawasan Hutan (fungsi)"));
      for (const k of kh.kawasanHutan) if (!q || k.name.toLowerCase().includes(q)) kgrp.appendChild(swatchRow(k.name, klhkPatch(k), `RGB ${k.rgb.join(" ")}`));
      body.appendChild(kgrp);
      for (const sec of kh.sections) {
        const items = sec.items.filter((it) => !q || it.name.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q));
        if (!items.length) continue;
        const g = el("details", { class: `${NS}-catgrp`, open: !!q }, el("summary", {}, `${sec.code} ${sec.title}`, el("small", {}, String(items.length))));
        for (const it of items) g.appendChild(swatchRow(it.name, klhkPatch(it), `RGB ${it.rgb.join(" ")}${it.note ? ` · ${it.note}` : ""}`));
        body.appendChild(g);
      }
    } else if (tab === "rbi") {
      body.append(el("p", { class: `${NS}-muted` }, "Topographic (Rupabumi-style) reference symbols. Approximate styles — the binding specification is SNI 8743:2019."));
      for (const grp of RBI_STYLE) {
        const items = grp.items.filter((it) => !q || it.name.toLowerCase().includes(q));
        if (!items.length) continue;
        const g = el("details", { class: `${NS}-catgrp`, open: true }, el("summary", {}, grp.group));
        for (const it of items) g.appendChild(swatchRow(it.name, it.patch));
        body.appendChild(g);
      }
    } else {
      const set = CATALOG.iconSets[tab];
      body.append(el("p", { class: `${NS}-muted` }, `${set.label} icons · ${set.license} (public domain). Click to place on the page.`));
      const order = ["Basic symbols", "Water & hydrology", "Terrain & nature", "Vegetation & forest", "Transport", "Government & public", "Health", "Education & culture", "Religion", "Tourism & recreation", "Sports", "Food & shops", "Utilities & industry", "Hazards & warnings", "Other"];
      for (const gname of order) {
        const names = (set.groups[gname] || []).filter((n) => !q || n.includes(q.replace(/\s+/g, "-")) || n.includes(q.replace(/\s+/g, "_")));
        if (!names.length) continue;
        const grid = el("div", { class: `${NS}-icongrid` });
        for (const n of names) {
          const b = el("button", { type: "button", class: `${NS}-iconbtn`, title: n });
          b.appendChild(el("img", { src: set.url.replace("{name}", encodeURIComponent(n)), alt: n, loading: "lazy" }));
          b.addEventListener("click", () => {
            closePopover();
            addIconItem(tab, n);
          });
          grid.appendChild(b);
        }
        body.appendChild(el("details", { class: `${NS}-catgrp`, open: !!q || gname === "Basic symbols" || gname === "Water & hydrology" }, el("summary", {}, gname, el("small", {}, String(names.length))), grid));
      }
    }
  };
  for (const [v, label] of [["klhk", "KLHK"], ["rbi", "Rupabumi"], ["maki", "Maki"], ["temaki", "Temaki"]]) {
    const b = el("button", { type: "button", "data-v": v }, label);
    b.addEventListener("click", () => {
      tab = v;
      draw();
    });
    tabs.appendChild(b);
  }
  search.addEventListener("input", draw);
  draw();
  return popoverAt(anchor, el("div", { class: `${NS}-catalog` }, el("div", { class: `${NS}-ptitle` }, "Symbol catalog"), tabs, search, body), `${NS}-catpop`);
}
