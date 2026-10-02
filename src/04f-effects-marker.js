// ---------------------------------------------------------------- item effects
// Every item can carry a drop shadow and a frosted-glass backdrop. On screen the
// glass uses CSS backdrop-filter; in exports the map imagery underneath is
// re-drawn blurred and clipped to the item, so PNG/PDF match the preview.
function defaultFx() {
  return {
    shadow: { on: false, color: "#000000", opacity: 0.3, blur: 1.2, dx: 0.5, dy: 0.8 },
    glass: { on: false, blur: 3, tint: "#ffffff", opacity: 0.45, radius: 3, border: true },
  };
}
function itemFx(item) {
  if (!item.fx) item.fx = defaultFx();
  return item.fx;
}
// Tint + edge highlight drawn under the item's own content.
function glassUnderlay(item) {
  const g = item.fx?.glass;
  if (!g?.on) return "";
  const id = item.id.replace(/[^\w]/g, "");
  return (
    `<defs><linearGradient id="gl-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>` +
    `<rect width="${item.w}" height="${item.h}" rx="${g.radius}" fill="${esc(g.tint)}" fill-opacity="${g.opacity}"/>` +
    `<rect width="${item.w}" height="${item.h}" rx="${g.radius}" fill="url(#gl-${id})"/>` +
    (g.border ? `<rect x="0.15" y="0.15" width="${round(item.w - 0.3, 3)}" height="${round(item.h - 0.3, 3)}" rx="${g.radius}" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="0.3"/>` : "")
  );
}
// CSS for the on-screen item node.
function applyFxPreview(node, item) {
  const fx = item.fx;
  const Z = S.zoom;
  const sh = fx?.shadow;
  node.style.filter = sh?.on
    ? `drop-shadow(${round(sh.dx * Z, 2)}px ${round(sh.dy * Z, 2)}px ${round(sh.blur * Z, 2)}px ${hexA(sh.color, sh.opacity)})`
    : "";
  const g = fx?.glass;
  node.style.backdropFilter = g?.on ? `blur(${round(g.blur * Z, 2)}px)` : "";
  node.style.webkitBackdropFilter = node.style.backdropFilter;
  node.style.borderRadius = g?.on ? `${g.radius * Z}px` : "";
}
function hexA(hex, a) {
  const [r, g, b] = hexToRgb(normalizeHex(hex));
  return `rgba(${r},${g},${b},${a})`;
}
// SVG for export: filter defs + blurred backdrop of maps beneath a glass item.
function fxExportParts(item, index, mapImages) {
  const fx = item.fx;
  const id = item.id.replace(/[^\w]/g, "");
  let defs = "";
  let filterAttr = "";
  let backdrop = "";
  if (fx?.shadow?.on) {
    const sh = fx.shadow;
    defs += `<filter id="fxs-${id}" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="${sh.dx}" dy="${sh.dy}" stdDeviation="${round(sh.blur / 2, 3)}" flood-color="${esc(sh.color)}" flood-opacity="${sh.opacity}"/></filter>`;
    filterAttr = ` filter="url(#fxs-${id})"`;
  }
  if (fx?.glass?.on) {
    const g = fx.glass;
    defs += `<clipPath id="fxc-${id}"><rect x="${item.x}" y="${item.y}" width="${item.w}" height="${item.h}" rx="${g.radius}"/></clipPath><filter id="fxb-${id}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${round(g.blur / 2, 3)}"/></filter>`;
    const below = S.doc.items.slice(0, index).filter((m) => m.type === "map" && !m.hidden && !m.rot && m.x < item.x + item.w && m.x + m.w > item.x && m.y < item.y + item.h && m.y + m.h > item.y);
    for (const m of below) {
      let img = "";
      if (m.props.source === "snapshot" && m.props.snapshot?.src) {
        const sn = syncSnapshotView(m);
        img = `<image href="${sn.src}" x="${round(m.x + sn.x, 3)}" y="${round(m.y + sn.y, 3)}" width="${round(sn.w, 3)}" height="${round(sn.h, 3)}" preserveAspectRatio="none"/>`;
      } else if (mapImages?.get(m.id)) {
        img = `<image href="${mapImages.get(m.id)}" x="${m.x}" y="${m.y}" width="${m.w}" height="${m.h}" preserveAspectRatio="none"/>`;
      }
      if (img) backdrop += `<g clip-path="url(#fxc-${id})"><g filter="url(#fxb-${id})">${img}</g></g>`;
    }
  }
  return { defs, filterAttr, backdrop };
}

// ---------------------------------------------------------------- marker (point symbol + label)
const MARKER_SYMBOLS = [
  { id: "pin", name: "Pin", svg: (f, s) => `<path d="M5 0.6C2.8 0.6 1.2 2.2 1.2 4.3 1.2 7 5 9.6 5 9.6S8.8 7 8.8 4.3C8.8 2.2 7.2 0.6 5 0.6Z" fill="${f}" stroke="${s}" stroke-width="0.6"/><circle cx="5" cy="4.2" r="1.3" fill="#fff"/>` },
  { id: "circle", name: "Circle", svg: (f, s) => `<circle cx="5" cy="5" r="3.6" fill="${f}" stroke="${s}" stroke-width="0.7"/>` },
  { id: "dot", name: "Dot", svg: (f) => `<circle cx="5" cy="5" r="2" fill="${f}"/>` },
  { id: "capital", name: "Capital", svg: (f, s) => `<circle cx="5" cy="5" r="3.8" fill="#fff" stroke="${s}" stroke-width="0.7"/><circle cx="5" cy="5" r="2.2" fill="${f}"/>` },
  { id: "square", name: "Square", svg: (f, s) => `<rect x="1.6" y="1.6" width="6.8" height="6.8" fill="${f}" stroke="${s}" stroke-width="0.7"/>` },
  { id: "triangle", name: "Triangle", svg: (f, s) => `<path d="M5 1.2L9 8.6H1Z" fill="${f}" stroke="${s}" stroke-width="0.7" stroke-linejoin="round"/>` },
  { id: "peak", name: "Peak", svg: (f, s) => `<path d="M5 2L8.6 8H1.4Z" fill="${f}" stroke="${s}" stroke-width="0.5" stroke-linejoin="round"/>` },
  { id: "diamond", name: "Diamond", svg: (f, s) => `<path d="M5 0.8L9.2 5 5 9.2 0.8 5Z" fill="${f}" stroke="${s}" stroke-width="0.7" stroke-linejoin="round"/>` },
  { id: "star", name: "Star", svg: (f, s) => `<polygon points="${star(5, 5.3, 4.6, 1.9, 5)}" fill="${f}" stroke="${s}" stroke-width="0.4" stroke-linejoin="round"/>` },
  { id: "cross", name: "Cross", svg: (f) => `<path d="M2 2L8 8M8 2L2 8" stroke="${f}" stroke-width="1.4" stroke-linecap="round"/>` },
  { id: "flag", name: "Flag", svg: (f, s) => `<path d="M2.4 9.4V1" stroke="${s}" stroke-width="0.7" stroke-linecap="round"/><path d="M2.6 1.2H8.4L7 3.2 8.4 5.2H2.6Z" fill="${f}" stroke="${s}" stroke-width="0.4"/>` },
  { id: "target", name: "Sample point", svg: (f, s) => `<circle cx="5" cy="5" r="3.6" fill="none" stroke="${f}" stroke-width="0.8"/><circle cx="5" cy="5" r="1.2" fill="${f}"/><path d="M5 0.4V2.4M5 7.6V9.6M0.4 5H2.4M7.6 5H9.6" stroke="${s}" stroke-width="0.5"/>` },
];
ITEM_TYPES.marker = {
  label: "Marker",
  icon: "marker",
  size: [32, 8],
  defaults: () => ({
    symbol: "pin",
    size: 6,
    fill: "#dc2626",
    stroke: "#7f1d1d",
    label: "Sample site",
    labelPos: "right",
    font: font({ size: 8 }),
    halo: true,
    haloColor: "#ffffff",
    haloWidth: 0.6,
  }),
};
RENDERERS.marker = function marker(item) {
  const p = item.props;
  const sym = MARKER_SYMBOLS.find((m) => m.id === p.symbol) || MARKER_SYMBOLS[0];
  const s = p.size;
  const hasLabel = !!String(p.label || "").trim();
  const pos = hasLabel ? p.labelPos : "none";
  let sx = (item.w - s) / 2;
  let sy = (item.h - s) / 2;
  if (pos === "right") sx = 0;
  if (pos === "left") sx = item.w - s;
  if (pos === "bottom") sy = 0;
  if (pos === "top") sy = item.h - s;
  let out = `<svg x="${round(sx, 3)}" y="${round(sy, 3)}" width="${s}" height="${s}" viewBox="0 0 10 10" overflow="visible">${sym.svg(esc(p.fill), esc(p.stroke))}</svg>`;
  if (hasLabel) {
    const f = p.font;
    const fh = f.size * PT;
    const halo = p.halo ? `stroke="${esc(p.haloColor)}" stroke-width="${p.haloWidth}" paint-order="stroke" stroke-linejoin="round"` : "";
    const text = resolveVars(p.label, item);
    let x = s + 1;
    let y = item.h / 2 + fh * 0.35;
    let anchor = "start";
    if (pos === "left") [x, anchor] = [item.w - s - 1, "end"];
    if (pos === "top") [x, y, anchor] = [item.w / 2, sy - 0.8, "middle"];
    if (pos === "bottom") [x, y, anchor] = [item.w / 2, s + fh + 0.4, "middle"];
    out += richLine(text, x, y, f, anchor, halo).svg;
  }
  return out;
};
function markerThumb(m) {
  return `<svg width="30" height="30" viewBox="0 0 10 10">${m.svg("currentColor", "currentColor")}</svg>`;
}
