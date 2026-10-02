// ---------------------------------------------------------------- page size catalog + units
// Sizes are stored in millimetres; pixel sizes convert at the page's px-per-inch.
const PAGE_UNITS = {
  mm: { label: "mm", perMm: 1, step: 1 },
  cm: { label: "cm", perMm: 0.1, step: 0.1 },
  in: { label: "in", perMm: 1 / 25.4, step: 0.05 },
  pt: { label: "pt", perMm: 72 / 25.4, step: 1 },
  px: { label: "px", perMm: null, step: 1 },
};
const PAPER_CATALOG = [
  { group: "ISO A", unit: "mm", sizes: [["A0", 841, 1189], ["A1", 594, 841], ["A2", 420, 594], ["A3", 297, 420], ["A4", 210, 297], ["A5", 148, 210], ["A6", 105, 148]] },
  { group: "ISO B", unit: "mm", sizes: [["B0", 1000, 1414], ["B1", 707, 1000], ["B2", 500, 707], ["B3", 353, 500], ["B4", 250, 353], ["B5", 176, 250]] },
  { group: "North America", unit: "in", sizes: [["Letter", 8.5, 11], ["Legal", 8.5, 14], ["Tabloid / Ledger", 11, 17], ["ANSI C", 17, 22], ["ANSI D", 22, 34], ["ANSI E", 34, 44], ["Arch D", 24, 36]] },
  { group: "Indonesia", unit: "mm", sizes: [["F4 / Folio", 215, 330], ["KLHK 1:500.000 (min.)", 900, 510, "Tabel 1 SK 399/2024"], ["KLHK 1:250.000 (min.)", 800, 600, "Tabel 1 SK 399/2024"], ["KLHK 1:50.000 / 1:25.000 (min.)", 420, 297, "Tabel 1 SK 399/2024"], ["KLHK 1:10.000 (min.)", 297, 210, "Tabel 1 SK 399/2024"]] },
  { group: "Posters", unit: "in", sizes: [["Poster 11 × 17 in", 11, 17], ["Poster 18 × 24 in", 18, 24], ["Poster 24 × 36 in", 24, 36], ["Poster 27 × 40 in", 27, 40]] },
  { group: "Photo prints", unit: "in", sizes: [["4 × 6 in", 4, 6], ["5 × 7 in", 5, 7], ["8 × 10 in", 8, 10], ["11 × 14 in", 11, 14]] },
  { group: "Presentation", unit: "px", sizes: [["Slide 16:9 (1920 × 1080)", 1920, 1080], ["Slide 4:3 (1024 × 768)", 1024, 768], ["Slide 16:10 (1920 × 1200)", 1920, 1200], ["4K UHD (3840 × 2160)", 3840, 2160]] },
  { group: "Social media", unit: "px", sizes: [
    ["Instagram post (1:1)", 1080, 1080], ["Instagram portrait (4:5)", 1080, 1350], ["Instagram / Facebook story", 1080, 1920], ["TikTok / Reels", 1080, 1920],
    ["Facebook post", 1200, 630], ["Facebook cover", 820, 312], ["X (Twitter) post", 1600, 900], ["X (Twitter) header", 1500, 500],
    ["LinkedIn post", 1200, 627], ["LinkedIn banner", 1584, 396], ["YouTube thumbnail", 1280, 720], ["YouTube banner", 2560, 1440],
    ["Pinterest pin", 1000, 1500], ["WhatsApp status", 1080, 1920],
  ] },
];
function pxPerMm(pg) {
  return (pg.pxDpi || 96) / 25.4;
}
function toUnit(mm, pg) {
  const u = pg.unit || "mm";
  if (u === "px") return mm * pxPerMm(pg);
  return mm * PAGE_UNITS[u].perMm;
}
function fromUnit(v, pg) {
  const u = pg.unit || "mm";
  if (u === "px") return v / pxPerMm(pg);
  return v / PAGE_UNITS[u].perMm;
}
function sizeToMm(w, h, unit, pg) {
  if (unit === "px") return [w / pxPerMm(pg), h / pxPerMm(pg)];
  return [w / PAGE_UNITS[unit].perMm, h / PAGE_UNITS[unit].perMm];
}
function applyPaper(pg, name, w, h, unit) {
  const [mw, mh] = sizeToMm(w, h, unit, pg);
  const land = pg.orientation === "landscape";
  // social / screen sizes keep their native orientation
  const fixed = unit === "px";
  pg.width = round(fixed ? mw : land ? Math.max(mw, mh) : Math.min(mw, mh), 3);
  pg.height = round(fixed ? mh : land ? Math.min(mw, mh) : Math.max(mw, mh), 3);
  if (fixed) pg.orientation = mw >= mh ? "landscape" : "portrait";
  pg.size = name;
  pg.unit = unit;
  if (unit === "px") S.exportDpi = pg.pxDpi || 96;
}
function paperLabel(pg) {
  const u = pg.unit || "mm";
  const f = (v) => round(toUnit(v, pg), u === "px" || u === "mm" || u === "pt" ? 0 : 2);
  return `${pg.size === "custom" ? "Custom" : pg.size} · ${f(pg.width)} × ${f(pg.height)} ${u}`;
}
function openPaperCatalog(anchor, after) {
  const pg = S.doc.page;
  const search = el("input", { type: "search", class: `${NS}-input`, placeholder: "Search sizes (A4, story, poster…)" });
  const body = el("div", { class: `${NS}-catbody` });
  const draw = () => {
    body.innerHTML = "";
    const q = search.value.trim().toLowerCase();
    for (const g of PAPER_CATALOG) {
      const rows = g.sizes.filter(([n]) => !q || n.toLowerCase().includes(q) || g.group.toLowerCase().includes(q));
      if (!rows.length) continue;
      const det = el("details", { class: `${NS}-catgrp`, open: true }, el("summary", {}, g.group, el("small", {}, g.unit)));
      for (const [name, w, h, note] of rows) {
        const ratio = w / h;
        const thumbW = ratio >= 1 ? 22 : 22 * ratio;
        const thumbH = ratio >= 1 ? 22 / ratio : 22;
        const b = el("button", { type: "button", class: `${NS}-catrow ${pg.size === name ? "active" : ""}` });
        b.innerHTML = `<svg width="26" height="26" viewBox="0 0 26 26"><rect x="${(26 - thumbW) / 2}" y="${(26 - thumbH) / 2}" width="${thumbW}" height="${thumbH}" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/></svg><span>${esc(name)}</span><small>${w} × ${h} ${g.unit}${note ? ` · ${esc(note)}` : ""}</small>`;
        b.addEventListener("click", () => {
          closePopover();
          commit(() => applyPaper(pg, name, w, h, g.unit));
          after?.();
        });
        det.appendChild(b);
      }
      body.appendChild(det);
    }
  };
  search.addEventListener("input", draw);
  draw();
  popoverAt(anchor, el("div", { class: `${NS}-catalog` }, el("div", { class: `${NS}-ptitle` }, "Page size"), search, body), `${NS}-catpop`);
  setTimeout(() => search.focus(), 30);
}
