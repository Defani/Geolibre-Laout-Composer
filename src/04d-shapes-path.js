// ---------------------------------------------------------------- fills, extra shapes, pen paths
const FILL_PATTERNS = {
  "/": "Diagonal /",
  "\\": "Diagonal \\",
  x: "Cross-hatch ×",
  "-": "Horizontal",
  "|": "Vertical",
  "+": "Grid +",
  ".": "Dots",
};

// Paint for a closed shape: solid color, linear gradient or hatch pattern.
function fillPaint(item, p) {
  if (!p.fill) return { defs: "", attr: `fill="none"` };
  const op = p.fillOpacity ?? 1;
  const type = p.fillType || "solid";
  const id = item.id.replace(/[^\w]/g, "");
  if (type === "gradient") {
    const gid = `fg-${id}`;
    const a = p.gradientAngle ?? 90;
    return {
      defs: `<linearGradient id="${gid}" gradientTransform="rotate(${a - 90} 0.5 0.5)"><stop offset="0" stop-color="${esc(p.fill)}"/><stop offset="1" stop-color="${esc(p.fill2 || "#ffffff")}"/></linearGradient>`,
      attr: `fill="url(#${gid})" fill-opacity="${op}"`,
    };
  }
  if (type === "pattern") {
    const pid = `fp-${id}`;
    const s = Math.max(0.6, p.patternSpacing || 2);
    const c = esc(p.patternColor || "#000000");
    const sw = Math.max(0.05, p.patternWidth || 0.2);
    const ln = (d) => `<path d="${d}" stroke="${c}" stroke-width="${sw}" fill="none"/>`;
    const P = p.pattern || "/";
    let body = "";
    if (P === "/" || P === "x") body += ln(`M0,${s}L${s},0M${-s / 2},${s / 2}L${s / 2},${-s / 2}M${s / 2},${s * 1.5}L${s * 1.5},${s / 2}`);
    if (P === "\\" || P === "x") body += ln(`M0,0L${s},${s}M${-s / 2},${s / 2}L${s / 2},${s * 1.5}M${s / 2},${-s / 2}L${s * 1.5},${s / 2}`);
    if (P === "-" || P === "+") body += ln(`M0,${s / 2}H${s}`);
    if (P === "|" || P === "+") body += ln(`M${s / 2},0V${s}`);
    if (P === ".") body += `<circle cx="${s / 2}" cy="${s / 2}" r="${sw * 1.4}" fill="${c}"/>`;
    const bg = p.patternBg ? `<rect width="${s}" height="${s}" fill="${esc(p.fill)}"/>` : "";
    return {
      defs: `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${s}" height="${s}">${bg}${body}</pattern>`,
      attr: `fill="url(#${pid})" fill-opacity="${op}"`,
    };
  }
  return { defs: "", attr: `fill="${esc(p.fill)}" fill-opacity="${op}"` };
}

// extra shapes (Ploots shape library parity)
SHAPES.splice(
  SHAPES.findIndex((s) => s.id === "diamond") + 1,
  0,
  { id: "triangle-down", name: "Inverted triangle", d: (w, h) => `M0,0H${w}L${w / 2},${h}Z` },
);
SHAPES.splice(
  SHAPES.findIndex((s) => s.id === "star8"),
  0,
  { id: "star4", name: "4-point star", star: [4, 0.38] },
  { id: "star6", name: "6-point star", star: [6, 0.5] },
);
SHAPES.splice(
  SHAPES.findIndex((s) => s.id === "arrow-2"),
  0,
  { id: "arrow-d", name: "Arrow down", d: (w, h) => `M${w * 0.3},0V${h * 0.62}H0L${w / 2},${h}L${w},${h * 0.62}H${w * 0.7}V0Z` },
);
SHAPES.splice(
  SHAPES.findIndex((s) => s.id === "cross"),
  0,
  {
    id: "heart",
    name: "Heart",
    d: (w, h) =>
      `M${w / 2},${h * 0.28}C${w / 2},${h * 0.12} ${w * 0.36},0 ${w * 0.22},0C${w * 0.07},0 0,${h * 0.14} 0,${h * 0.3}C0,${h * 0.56} ${w * 0.3},${h * 0.76} ${w / 2},${h}C${w * 0.7},${h * 0.76} ${w},${h * 0.56} ${w},${h * 0.3}C${w},${h * 0.14} ${w * 0.93},0 ${w * 0.78},0C${w * 0.64},0 ${w / 2},${h * 0.12} ${w / 2},${h * 0.28}Z`,
  },
  {
    id: "speech",
    name: "Speech bubble",
    d: (w, h) => {
      const r = Math.min(w, h) * 0.14;
      const b = h * 0.76;
      return `M${r},0H${w - r}Q${w},0 ${w},${r}V${b - r}Q${w},${b} ${w - r},${b}H${w * 0.42}L${w * 0.24},${h}L${w * 0.27},${b}H${r}Q0,${b} 0,${b - r}V${r}Q0,0 ${r},0Z`;
    },
  },
  { id: "half-circle", name: "Half circle", d: (w, h) => `M0,${h}A${w / 2},${h} 0 0 1 ${w},${h}Z` },
);

// ---------------------------------------------------------------- path item (pen tool)
ITEM_TYPES.path = {
  label: "Drawing",
  icon: "pen",
  size: [30, 20],
  defaults: () => ({
    points: [
      [0, 1],
      [1, 0],
    ],
    closed: false,
    smooth: false,
    stroke: "#111111",
    strokeWidth: 0.5,
    strokeStyle: "solid",
    fill: "",
    fillOpacity: 1,
    fillType: "solid",
    arrowStart: false,
    arrowEnd: false,
  }),
};

function pathD(pts, closed, smooth) {
  if (pts.length < 2) return "";
  const P = (q) => `${round(q[0], 3)},${round(q[1], 3)}`;
  if (!smooth || pts.length < 3) return `M${pts.map(P).join("L")}${closed ? "Z" : ""}`;
  // Catmull-Rom → cubic Bézier
  const n = pts.length;
  const at = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M${P(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${P(c1)} ${P(c2)} ${P(p2)}`;
  }
  return d + (closed ? "Z" : "");
}
function arrowHead(tip, from, size, color) {
  const a = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const l = [tip[0] - size * Math.cos(a - 0.4), tip[1] - size * Math.sin(a - 0.4)];
  const r = [tip[0] - size * Math.cos(a + 0.4), tip[1] - size * Math.sin(a + 0.4)];
  return `<polygon points="${round(tip[0], 3)},${round(tip[1], 3)} ${round(l[0], 3)},${round(l[1], 3)} ${round(r[0], 3)},${round(r[1], 3)}" fill="${esc(color)}"/>`;
}

RENDERERS.path = function path(item) {
  const p = item.props;
  const pts = (p.points || []).map(([u, v]) => [u * item.w, v * item.h]);
  if (pts.length < 2) return "";
  const sw = Math.max(0.05, p.strokeWidth || 0);
  const paint = p.closed ? fillPaint(item, p) : { defs: "", attr: `fill="none"` };
  let out = paint.defs ? `<defs>${paint.defs}</defs>` : "";
  const stroke = p.strokeWidth > 0 ? strokeAttrs(p.stroke, sw, p.strokeStyle) : `stroke="none"`;
  out += `<path d="${pathD(pts, p.closed, p.smooth)}" ${paint.attr} ${stroke} stroke-linejoin="round" stroke-linecap="round"/>`;
  if (!p.closed) {
    const size = Math.max(sw * 4, 1.6);
    if (p.arrowEnd) out += arrowHead(pts[pts.length - 1], pts[pts.length - 2], size, p.stroke);
    if (p.arrowStart) out += arrowHead(pts[0], pts[1], size, p.stroke);
  }
  return out;
};
