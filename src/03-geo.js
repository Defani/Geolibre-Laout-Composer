// ---------------------------------------------------------------- geometry
// Map items store their view as {center, zoom, bearing}, where `zoom` is the
// MapLibre zoom the frame would have when the page is drawn at 96 dpi. That
// makes the map scale independent of how far the composer canvas is zoomed.
const WORLD = 512;
function lngToX(lng, z) {
  return ((lng + 180) / 360) * WORLD * 2 ** z;
}
function latToY(lat, z) {
  const phi = (clamp(lat, -85.0511, 85.0511) * Math.PI) / 180;
  return (0.5 - Math.log(Math.tan(Math.PI / 4 + phi / 2)) / (2 * Math.PI)) * WORLD * 2 ** z;
}
function xToLng(x, z) {
  return (x / (WORLD * 2 ** z)) * 360 - 180;
}
function yToLat(y, z) {
  const n = Math.PI - (2 * Math.PI * y) / (WORLD * 2 ** z);
  return (180 / Math.PI) * Math.atan(Math.sinh(n));
}

// Projection helper for a map item, in item-local millimetres.
function mapGeom(item) {
  const v = item.props.view;
  const z = v.zoom;
  const b = ((v.bearing || 0) * Math.PI) / 180;
  const cx = lngToX(v.center[0], z);
  const cy = latToY(v.center[1], z);
  const W = item.w * PX96;
  const H = item.h * PX96;
  const cos = Math.cos(-b);
  const sin = Math.sin(-b);
  return {
    w: item.w,
    h: item.h,
    project(lng, lat) {
      const dx = lngToX(lng, z) - cx;
      const dy = latToY(lat, z) - cy;
      const rx = dx * cos - dy * sin;
      const ry = dx * sin + dy * cos;
      return [(W / 2 + rx) / PX96, (H / 2 + ry) / PX96];
    },
    unproject(xmm, ymm) {
      const rx = xmm * PX96 - W / 2;
      const ry = ymm * PX96 - H / 2;
      // inverse rotation
      const dx = rx * cos + ry * sin;
      const dy = -rx * sin + ry * cos;
      return [xToLng(cx + dx, z), yToLat(cy + dy, z)];
    },
    bounds() {
      const pts = [
        this.unproject(0, 0),
        this.unproject(item.w, 0),
        this.unproject(item.w, item.h),
        this.unproject(0, item.h),
      ];
      // densify edges so rotated frames are covered
      for (let i = 1; i < 8; i++) {
        pts.push(this.unproject((item.w * i) / 8, 0), this.unproject((item.w * i) / 8, item.h));
        pts.push(this.unproject(0, (item.h * i) / 8), this.unproject(item.w, (item.h * i) / 8));
      }
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return { west: Math.min(...xs), east: Math.max(...xs), south: Math.min(...ys), north: Math.max(...ys), corners: pts.slice(0, 4) };
    },
  };
}

function metersPerMm(item) {
  // ground metres represented by one paper millimetre
  const v = item.props.view;
  const mPerPx = (EARTH_CIRC * Math.cos((v.center[1] * Math.PI) / 180)) / (WORLD * 2 ** v.zoom);
  return mPerPx * PX96;
}
function mapScale(item) {
  return Math.round(metersPerMm(item) * 1000);
}
function zoomForScale(scale, lat) {
  const mPerPx = (scale / 1000) / PX96;
  return Math.log2((EARTH_CIRC * Math.cos((lat * Math.PI) / 180)) / (WORLD * mPerPx));
}
// Zoom that makes a w x h (mm) frame show the given bounds.
function zoomForBounds(b, wmm, hmm) {
  const W = wmm * PX96;
  const H = hmm * PX96;
  const dx = lngToX(b.east, 0) - lngToX(b.west, 0);
  const dy = latToY(b.south, 0) - latToY(b.north, 0);
  const zx = Math.log2(W / Math.max(dx, 1e-9));
  const zy = Math.log2(H / Math.max(dy, 1e-9));
  return Math.min(zx, zy);
}

function niceStep(range, target = 5) {
  const raw = range / Math.max(target, 1);
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  const nice = f < 1.5 ? 1 : f < 2.25 ? 2 : f < 3.5 ? 2.5 : f < 7.5 ? 5 : 10;
  return nice * p;
}
// Common "pretty" scales for the scale picker.
const PRESET_SCALES = [1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000];

// ---------------------------------------------------------------- coordinate labels
function hemi(value, axis, lang) {
  if (lang === "id") return axis === "x" ? (value < 0 ? "BB" : "BT") : value < 0 ? "LS" : "LU";
  return axis === "x" ? (value < 0 ? "W" : "E") : value < 0 ? "S" : "N";
}
function fmtCoord(value, axis, fmt, lang = "id", decimals = 2) {
  const a = Math.abs(value);
  const h = value === 0 ? "" : ` ${hemi(value, axis, lang)}`;
  if (fmt === "dd") return `${a.toFixed(decimals)}°${h}`;
  if (fmt === "dd-signed") return `${value.toFixed(decimals)}°`;
  // DMS / DM
  let d = Math.floor(a);
  let mFloat = (a - d) * 60;
  let m = Math.floor(mFloat);
  let s = Math.round((mFloat - m) * 60);
  if (s === 60) {
    s = 0;
    m += 1;
  }
  if (m === 60) {
    m = 0;
    d += 1;
  }
  if (fmt === "dm") return `${d}°${String(Math.round(mFloat) % 60).padStart(2, "0")}'${h}`;
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"${h}`;
}

// ---------------------------------------------------------------- UTM (WGS84)
const UTM = (() => {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const k0 = 0.9996;
  const e2 = f * (2 - f);
  const ep2 = e2 / (1 - e2);
  const rad = Math.PI / 180;
  function zoneOf(lng) {
    return clamp(Math.floor((lng + 180) / 6) + 1, 1, 60);
  }
  function forward(lng, lat, zone, south) {
    const lon0 = ((zone - 1) * 6 - 180 + 3) * rad;
    const phi = lat * rad;
    const lam = lng * rad;
    const N = a / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
    const T = Math.tan(phi) ** 2;
    const C = ep2 * Math.cos(phi) ** 2;
    const A = Math.cos(phi) * (lam - lon0);
    const M =
      a *
      ((1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256) * phi -
        ((3 * e2) / 8 + (3 * e2 ** 2) / 32 + (45 * e2 ** 3) / 1024) * Math.sin(2 * phi) +
        ((15 * e2 ** 2) / 256 + (45 * e2 ** 3) / 1024) * Math.sin(4 * phi) -
        ((35 * e2 ** 3) / 3072) * Math.sin(6 * phi));
    const E =
      k0 * N * (A + ((1 - T + C) * A ** 3) / 6 + ((5 - 18 * T + T ** 2 + 72 * C - 58 * ep2) * A ** 5) / 120) + 500000;
    let Nn =
      k0 *
      (M +
        N *
          Math.tan(phi) *
          (A ** 2 / 2 + ((5 - T + 9 * C + 4 * C ** 2) * A ** 4) / 24 + ((61 - 58 * T + T ** 2 + 600 * C - 330 * ep2) * A ** 6) / 720));
    if (south) Nn += 10000000;
    return [E, Nn];
  }
  function inverse(E, Nn, zone, south) {
    const lon0 = ((zone - 1) * 6 - 180 + 3) * rad;
    const x = E - 500000;
    const y = south ? Nn - 10000000 : Nn;
    const M = y / k0;
    const mu = M / (a * (1 - e2 / 4 - (3 * e2 ** 2) / 64 - (5 * e2 ** 3) / 256));
    const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
    const phi1 =
      mu +
      ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
      ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
      ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
      ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);
    const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
    const T1 = Math.tan(phi1) ** 2;
    const C1 = ep2 * Math.cos(phi1) ** 2;
    const R1 = (a * (1 - e2)) / (1 - e2 * Math.sin(phi1) ** 2) ** 1.5;
    const D = x / (N1 * k0);
    const lat =
      phi1 -
      ((N1 * Math.tan(phi1)) / R1) *
        (D ** 2 / 2 - ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4) / 24 + ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) * D ** 6) / 720);
    const lng = lon0 + (D - ((1 + 2 * T1 + C1) * D ** 3) / 6 + ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5) / 120) / Math.cos(phi1);
    return [lng / rad, lat / rad];
  }
  return { zoneOf, forward, inverse };
})();

// ---------------------------------------------------------------- grid lines
// Returns {lines:[{pts:[[x,y]...], axis:'x'|'y', value}], fmt(value, axis)}
// for a map item, in item mm.
function computeGrid(item) {
  const g = item.props.grid;
  const geom = mapGeom(item);
  const b = geom.bounds();
  const lines = [];
  const target = Math.max(2, Math.round(Math.max(item.w, item.h) / 32));
  if (g.type === "utm") {
    const zone = g.zone || UTM.zoneOf(item.props.view.center[0]);
    const south = item.props.view.center[1] < 0;
    const corners = [];
    for (let i = 0; i <= 10; i++) {
      for (const [x, y] of [
        [(item.w * i) / 10, 0],
        [(item.w * i) / 10, item.h],
        [0, (item.h * i) / 10],
        [item.w, (item.h * i) / 10],
      ]) {
        const [lng, lat] = geom.unproject(x, y);
        corners.push(UTM.forward(lng, lat, zone, south));
      }
    }
    // pad the range so lines run past the frame and cross its edges cleanly
    let minE = Math.min(...corners.map((c) => c[0]));
    let maxE = Math.max(...corners.map((c) => c[0]));
    let minN = Math.min(...corners.map((c) => c[1]));
    let maxN = Math.max(...corners.map((c) => c[1]));
    const pe = (maxE - minE) * 0.05;
    const pn = (maxN - minN) * 0.05;
    minE -= pe;
    maxE += pe;
    minN -= pn;
    maxN += pn;
    const stepE = g.interval > 0 ? g.interval : niceStep(maxE - minE, target);
    const stepN = g.interval > 0 ? g.interval : stepE;
    if ((maxE - minE) / stepE > 200 || (maxN - minN) / stepN > 200) return { lines, b };
    const SAMPLES = 24;
    for (let e = Math.ceil(minE / stepE) * stepE; e <= maxE; e += stepE) {
      const pts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const n = minN + ((maxN - minN) * i) / SAMPLES;
        const [lng, lat] = UTM.inverse(e, n, zone, south);
        pts.push(geom.project(lng, lat));
      }
      lines.push({ pts, axis: "x", value: e });
    }
    for (let n = Math.ceil(minN / stepN) * stepN; n <= maxN; n += stepN) {
      const pts = [];
      for (let i = 0; i <= SAMPLES; i++) {
        const e = minE + ((maxE - minE) * i) / SAMPLES;
        const [lng, lat] = UTM.inverse(e, n, zone, south);
        pts.push(geom.project(lng, lat));
      }
      lines.push({ pts, axis: "y", value: n });
    }
    return { lines, b, utm: { zone, south } };
  }
  // geographic graticule
  let step = g.interval > 0 ? g.interval : niceDegStep(Math.max(b.east - b.west, b.north - b.south) / target);
  if ((b.east - b.west) / step > 200) step = niceDegStep((b.east - b.west) / 10);
  const SAMPLES = 16;
  const padX = (b.east - b.west) * 0.05;
  const padY = (b.north - b.south) * 0.05;
  const s0 = clamp(b.south - padY, -85, 85);
  const s1 = clamp(b.north + padY, -85, 85);
  const w0 = b.west - padX;
  const w1 = b.east + padX;
  // snap to the step grid with an integer counter so values stay exact (no float drift)
  for (let k = Math.ceil(b.west / step - 1e-9); k * step <= b.east + 1e-9; k++) {
    const lng = k * step;
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) pts.push(geom.project(lng, s0 + ((s1 - s0) * i) / SAMPLES));
    lines.push({ pts, axis: "x", value: round(lng, 9) });
  }
  for (let k = Math.ceil(b.south / step - 1e-9); k * step <= b.north + 1e-9; k++) {
    const lat = k * step;
    const pts = [];
    for (let i = 0; i <= SAMPLES; i++) pts.push(geom.project(w0 + ((w1 - w0) * i) / SAMPLES, lat));
    lines.push({ pts, axis: "y", value: round(lat, 9) });
  }
  return { lines, b };
}
// Degree steps that read well in DMS: 1", 2", 5", 10", 15", 30", 1', 2' ...
function niceDegStep(raw) {
  const steps = [
    1 / 3600, 2 / 3600, 5 / 3600, 10 / 3600, 15 / 3600, 30 / 3600,
    1 / 60, 2 / 60, 5 / 60, 10 / 60, 15 / 60, 20 / 60, 30 / 60,
    1, 2, 5, 10, 15, 20, 30, 45, 90,
  ];
  return steps.find((s) => s >= raw) || 90;
}
// Where a polyline crosses the rectangle edges: [{edge, x, y}]
function edgeCrossings(pts, w, h) {
  const out = [];
  const edges = [
    ["top", (p) => p[1], 0],
    ["bottom", (p) => p[1], h],
    ["left", (p) => p[0], 0],
    ["right", (p) => p[0], w],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const c = pts[i + 1];
    for (const [edge, get, val] of edges) {
      const va = get(a) - val;
      const vc = get(c) - val;
      if ((va <= 0 && vc > 0) || (va > 0 && vc <= 0)) {
        const t = va / (va - vc);
        const x = a[0] + (c[0] - a[0]) * t;
        const y = a[1] + (c[1] - a[1]) * t;
        if (x >= -0.01 && x <= w + 0.01 && y >= -0.01 && y <= h + 0.01) out.push({ edge, x, y });
      }
    }
  }
  return out;
}
