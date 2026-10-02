// ---------------------------------------------------------------- draw tools
// Polyline / polygon: click points. Bézier pen: click for a corner, drag for a
// smooth node. Freehand: drag. Shared keys: Shift = 45° steps, Enter or
// double-click = finish, click the first point = close, Backspace = undo point,
// Esc = cancel.
const DRAW_MODES = [
  { id: "polyline", name: "Polyline", icon: "M3 18L9 8l5 7 7-11", hint: "Click to add points · double-click or Enter to finish" },
  { id: "polygon", name: "Polygon", icon: "M5 19L3 9l8-6 9 5-3 11z", hint: "Click to add corners · click the first point or press Enter to close" },
  { id: "bezier", name: "Bézier pen", icon: "M3 19C6 6 18 18 21 5M3 19h.01M21 5h.01M9 9l-3 6M15 15l3-6", hint: "Click for a corner, click-drag for a curve · Enter to finish, click the first point to close" },
  { id: "freehand", name: "Freehand", icon: "M3 17c3-6 5 2 8-3s4-7 7-3 2 6 3 4", hint: "Drag to draw · release to finish" },
  { id: "arrowline", name: "Arrow line", icon: "M4 19L19 4M19 4h-7M19 4v7", hint: "Click points · the line ends with an arrow" },
];

function drawThumb(m) {
  return `<svg width="40" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${m.icon}"/></svg>`;
}
function drawMode() {
  return S.toolVariant || "polyline";
}

function penPoint(e) {
  const [x, y] = toMM(e);
  const s = e.altKey ? { x, y } : snapPoint(x, y, []);
  let px = s.x;
  let py = s.y;
  const last = S.pen?.pts[S.pen.pts.length - 1];
  if (last && e.shiftKey) {
    const a = Math.round(Math.atan2(py - last[1], px - last[0]) / (Math.PI / 4)) * (Math.PI / 4);
    const d = Math.hypot(px - last[0], py - last[1]);
    px = last[0] + d * Math.cos(a);
    py = last[1] + d * Math.sin(a);
  }
  return [round(px, 2), round(py, 2)];
}

function penDown(e) {
  const mode = drawMode();
  if (mode === "freehand") return startFreehand(e);
  if (!S.pen) S.pen = { pts: [], handles: [] };
  const pt = penPoint(e);
  const first = S.pen.pts[0];
  if (first && S.pen.pts.length >= 3 && Math.hypot(pt[0] - first[0], pt[1] - first[1]) * S.zoom < 9) return finishPen(true);
  const last = S.pen.pts[S.pen.pts.length - 1];
  if (last && Math.hypot(pt[0] - last[0], pt[1] - last[1]) < 0.05) return;
  S.pen.pts.push(pt);
  S.pen.handles.push(null);
  drawPenPreview(pt);
  if (mode === "bezier") {
    // drag out a symmetric handle for a smooth node
    const idx = S.pen.pts.length - 1;
    capture(
      e,
      (ev) => {
        const [x, y] = toMM(ev);
        const h = [x - pt[0], y - pt[1]];
        S.pen.handles[idx] = Math.hypot(h[0], h[1]) * S.zoom > 3 ? [round(h[0], 3), round(h[1], 3)] : null;
        drawPenPreview();
      },
      () => drawPenPreview(),
    );
  }
}

function startFreehand(e) {
  S.pen = { pts: [penPoint(e)], handles: [] };
  capture(
    e,
    (ev) => {
      const [x, y] = toMM(ev);
      const last = S.pen.pts[S.pen.pts.length - 1];
      if (Math.hypot(x - last[0], y - last[1]) * S.zoom > 2.5) S.pen.pts.push([round(x, 2), round(y, 2)]);
      drawPenPreview();
    },
    () => {
      const pts = simplifyPath(S.pen.pts, 0.35 / Math.max(S.zoom / PX96, 0.4));
      S.pen.pts = pts;
      S.pen.handles = pts.map(() => null);
      S.pen.smooth = true;
      finishPen(false);
    },
  );
}

// Ramer–Douglas–Peucker
function simplifyPath(pts, tol) {
  if (pts.length < 3) return pts;
  const dist = (p, a, b) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    if (!l) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l, 0, 1);
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = dist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) {
      max = d;
      idx = i;
    }
  }
  if (max <= tol) return [pts[0], pts[pts.length - 1]];
  return [...simplifyPath(pts.slice(0, idx + 1), tol).slice(0, -1), ...simplifyPath(pts.slice(idx), tol)];
}

// Path data for points + optional symmetric handles (out-handle offset per node).
function bezierD(pts, handles, closed) {
  const P = (q) => `${round(q[0], 3)},${round(q[1], 3)}`;
  const n = pts.length;
  let d = `M${P(pts[0])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const ha = handles?.[i];
    const hb = handles?.[(i + 1) % n];
    if (!ha && !hb) d += `L${P(b)}`;
    else {
      const c1 = ha ? [a[0] + ha[0], a[1] + ha[1]] : a;
      const c2 = hb ? [b[0] - hb[0], b[1] - hb[1]] : b;
      d += `C${P(c1)} ${P(c2)} ${P(b)}`;
    }
  }
  return d + (closed ? "Z" : "");
}

function drawPenPreview(cursor) {
  let svgHost = S.ui.guides.querySelector(`.${NS}-penprev`);
  if (!S.pen) {
    svgHost?.remove();
    return;
  }
  if (!svgHost) {
    svgHost = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgHost.setAttribute("class", `${NS}-penprev`);
    S.ui.guides.appendChild(svgHost);
  }
  const pg = S.doc.page;
  const Z = S.zoom;
  svgHost.setAttribute("width", pg.width * Z);
  svgHost.setAttribute("height", pg.height * Z);
  svgHost.setAttribute("viewBox", `0 0 ${pg.width} ${pg.height}`);
  const pts = cursor ? [...S.pen.pts, cursor] : S.pen.pts;
  const hs = cursor ? [...S.pen.handles, null] : S.pen.handles;
  const sw = 1.5 / Z;
  let html = pts.length > 1 ? `<path d="${S.pen.smooth ? pathD(pts, false, true) : bezierD(pts, hs, false)}" fill="none" stroke="#0d99ff" stroke-width="${sw}"/>` : "";
  S.pen.handles.forEach((h, i) => {
    if (!h) return;
    const p = S.pen.pts[i];
    html += `<line x1="${p[0] - h[0]}" y1="${p[1] - h[1]}" x2="${p[0] + h[0]}" y2="${p[1] + h[1]}" stroke="#0d99ff" stroke-width="${sw * 0.7}"/>`;
    html += `<circle cx="${p[0] + h[0]}" cy="${p[1] + h[1]}" r="${2.5 / Z}" fill="#0d99ff"/><circle cx="${p[0] - h[0]}" cy="${p[1] - h[1]}" r="${2.5 / Z}" fill="#0d99ff"/>`;
  });
  if (drawMode() !== "freehand") {
    S.pen.pts.forEach(([x, y], i) => {
      html += `<rect x="${x - 3 / Z}" y="${y - 3 / Z}" width="${6 / Z}" height="${6 / Z}" fill="${i === 0 ? "#0d99ff" : "#fff"}" stroke="#0d99ff" stroke-width="${sw * 0.8}"/>`;
    });
  }
  svgHost.innerHTML = html;
}

function finishPen(closed) {
  const mode = drawMode();
  const pts = S.pen?.pts || [];
  const handles = S.pen?.handles || [];
  const smooth = !!S.pen?.smooth;
  S.pen = null;
  drawPenPreview();
  if (pts.length < 2) {
    setTool("select");
    return;
  }
  if (mode === "polygon" && pts.length >= 3) closed = true;
  // bounds include Bézier handles so curves stay inside the box
  const all = [...pts];
  handles.forEach((h, i) => h && all.push([pts[i][0] + h[0], pts[i][1] + h[1]], [pts[i][0] - h[0], pts[i][1] - h[1]]));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const y0 = Math.min(...ys);
  const w = Math.max(0.5, Math.max(...xs) - x0);
  const h = Math.max(0.5, Math.max(...ys) - y0);
  const item = newItem("path", x0, y0);
  item.w = round(w, 3);
  item.h = round(h, 3);
  item.props.points = pts.map(([x, y]) => [round((x - x0) / w, 5), round((y - y0) / h, 5)]);
  if (handles.some(Boolean)) item.props.handles = handles.map((hh) => (hh ? [round(hh[0] / w, 5), round(hh[1] / h, 5)] : null));
  item.props.closed = closed;
  item.props.smooth = smooth;
  if (closed) item.props.fill = "#93c5fd";
  if (mode === "arrowline") item.props.arrowEnd = true;
  const count = S.doc.items.filter((i) => i.type === "path").length + 1;
  item.name = `${closed ? "Polygon" : mode === "freehand" ? "Freehand" : mode === "bezier" ? "Curve" : "Line"} ${count}`;
  commit(() => S.doc.items.push(item));
  setTool("select");
  select([item.id]);
}

// path renderer with Bézier handles
const basePathRenderer = RENDERERS.path;
RENDERERS.path = function pathWithHandles(item, ctx) {
  const p = item.props;
  if (!p.handles || !p.handles.some(Boolean)) return basePathRenderer(item, ctx);
  const pts = p.points.map(([u, v]) => [u * item.w, v * item.h]);
  const hs = p.handles.map((h) => (h ? [h[0] * item.w, h[1] * item.h] : null));
  const sw = Math.max(0.05, p.strokeWidth || 0);
  const paint = p.closed ? fillPaint(item, p) : { defs: "", attr: `fill="none"` };
  let out = paint.defs ? `<defs>${paint.defs}</defs>` : "";
  const stroke = p.strokeWidth > 0 ? strokeAttrs(p.stroke, sw, p.strokeStyle) : `stroke="none"`;
  out += `<path d="${bezierD(pts, hs, p.closed)}" ${paint.attr} ${stroke} stroke-linejoin="round" stroke-linecap="round"/>`;
  if (!p.closed) {
    const size = Math.max(sw * 4, 1.6);
    const n = pts.length;
    const endFrom = hs[n - 1] ? [pts[n - 1][0] - hs[n - 1][0], pts[n - 1][1] - hs[n - 1][1]] : pts[n - 2];
    const startFrom = hs[0] ? [pts[0][0] + hs[0][0], pts[0][1] + hs[0][1]] : pts[1];
    if (p.arrowEnd) out += arrowHead(pts[n - 1], endFrom, size, p.stroke);
    if (p.arrowStart) out += arrowHead(pts[0], startFrom, size, p.stroke);
  }
  return out;
};
