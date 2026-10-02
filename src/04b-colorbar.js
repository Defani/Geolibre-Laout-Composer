// ---------------------------------------------------------------- color bar
// A matplotlib-style color bar: continuous or binned, horizontal or vertical,
// with optional pointed (triangle) or square extensions for out-of-range values.
const COLORMAPS = {
  viridis: ["#440154", "#482878", "#3e4989", "#31688e", "#26828e", "#1f9e89", "#35b779", "#6ece58", "#b5de2b", "#fde725"],
  plasma: ["#0d0887", "#46039f", "#7201a8", "#9c179e", "#bd3786", "#d8576b", "#ed7953", "#fb9f3a", "#fdca26", "#f0f921"],
  inferno: ["#000004", "#1b0c41", "#4a0c6b", "#781c6d", "#a52c60", "#cf4446", "#ed6925", "#fb9b06", "#f7d13d", "#fcffa4"],
  magma: ["#000004", "#180f3d", "#440f76", "#721f81", "#9e2f7f", "#cd4071", "#f1605d", "#fd9668", "#feca8d", "#fcfdbf"],
  cividis: ["#00224e", "#123570", "#3b496c", "#575d6d", "#707173", "#8a8678", "#a59c74", "#c3b369", "#e1cc55", "#fee838"],
  turbo: ["#30123b", "#4145ab", "#4675ed", "#39a2fc", "#1bcfd4", "#24eca6", "#61fc6c", "#a4fc3b", "#d1e834", "#f3c63a", "#fe9b2d", "#f36315", "#d93806", "#b11901", "#7a0403"],
  spectral: ["#9e0142", "#d53e4f", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#e6f598", "#abdda4", "#66c2a5", "#3288bd", "#5e4fa2"],
  rdylgn: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
  rdylbu: ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090", "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"],
  rdbu: ["#67001f", "#b2182b", "#d6604d", "#f4a582", "#fddbc7", "#f7f7f7", "#d1e5f0", "#92c5de", "#4393c3", "#2166ac", "#053061"],
  brbg: ["#543005", "#8c510a", "#bf812d", "#dfc27d", "#f6e8c3", "#f5f5f5", "#c7eae5", "#80cdc1", "#35978f", "#01665e", "#003c30"],
  coolwarm: ["#3b4cc0", "#6788ee", "#9abbff", "#c9d7f0", "#edd1c2", "#f7a889", "#e26952", "#b40426"],
  terrain: ["#333399", "#0294fa", "#01cc66", "#80e680", "#fffe99", "#ccbe7d", "#997c5d", "#996e66", "#ccb8b3", "#ffffff"],
  ylgn: ["#ffffe5", "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238443", "#006837", "#004529"],
  ylorrd: ["#ffffcc", "#ffeda0", "#fed976", "#feb24c", "#fd8d3c", "#fc4e2a", "#e31a1c", "#bd0026", "#800026"],
  blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
  oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  jet: ["#00007f", "#0000ff", "#007fff", "#00ffff", "#7fff7f", "#ffff00", "#ff7f00", "#ff0000", "#7f0000"],
  greys: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
  gray: ["#000000", "#ffffff"],
};
const COLORMAP_LABELS = {
  viridis: "Viridis", plasma: "Plasma", inferno: "Inferno", magma: "Magma", cividis: "Cividis", turbo: "Turbo",
  spectral: "Spectral", rdylgn: "RdYlGn", rdylbu: "RdYlBu", rdbu: "RdBu", brbg: "BrBG", coolwarm: "Coolwarm",
  terrain: "Terrain", ylgn: "YlGn", ylorrd: "YlOrRd", blues: "Blues", greens: "Greens", oranges: "Oranges",
  reds: "Reds", purples: "Purples", jet: "Jet", greys: "Greys", gray: "Gray",
};

function hexToRgb(h) {
  const c = normalizeHex(h);
  return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
}
function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}
// Colors of a color bar, low → high.
function colorbarColors(p) {
  let cols = null;
  if (p.colormap === "custom") {
    cols = String(p.customColors || "")
      .split(/[\s,;]+/)
      .map((c) => c.trim())
      .filter(Boolean);
  }
  if (!cols || cols.length < 2) cols = COLORMAPS[p.colormap] || COLORMAPS.viridis;
  return p.reverse ? [...cols].reverse() : cols;
}
function sampleColors(cols, t) {
  t = clamp(t, 0, 1);
  const x = t * (cols.length - 1);
  const i = Math.min(Math.floor(x), cols.length - 2);
  const f = x - i;
  const a = hexToRgb(cols[i]);
  const b = hexToRgb(cols[i + 1]);
  return rgbToHex([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
}
function colormapGradientCss(name, reverse) {
  const cols = colorbarColors({ colormap: name, reverse });
  return `linear-gradient(90deg, ${cols.join(", ")})`;
}

// Tick values for the bar.
function colorbarTicks(p) {
  const lo = Math.min(p.vmin, p.vmax);
  const hi = Math.max(p.vmin, p.vmax);
  if (!(hi > lo)) return [lo];
  if (p.tickMode === "custom") {
    return String(p.customTicks || "")
      .split(/[\s,;]+/)
      .map(Number)
      .filter((v) => Number.isFinite(v) && v >= lo - 1e-12 && v <= hi + 1e-12);
  }
  const n = Math.max(2, Math.round(p.tickCount || 5));
  if (p.tickMode === "nice") {
    const step = niceStep(hi - lo, n - 1);
    const out = [];
    for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + step * 1e-9; k++) out.push(round(k * step, 10));
    return out;
  }
  // linear: n ticks from min to max inclusive, like np.linspace
  return Array.from({ length: n }, (_, i) => lo + ((hi - lo) * i) / (n - 1));
}
function tickDecimals(p, ticks) {
  if (p.decimals >= 0) return p.decimals;
  if (ticks.length < 2) return Math.abs(ticks[0] || 0) < 10 ? 2 : 0;
  const step = Math.abs(ticks[1] - ticks[0]) || 1;
  // smallest decimal count that keeps every tick exact (max 4)
  for (let d = 0; d <= 4; d++) {
    if (ticks.every((t) => Math.abs(t - round(t, d)) < step * 1e-6)) return d;
  }
  return clamp(Math.ceil(-Math.log10(step)) + 1, 0, 4);
}
function fmtTick(v, d, p) {
  const s = p.thousands
    ? Number(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })
    : Number(v).toFixed(d);
  return `${p.prefix || ""}${s === "-0" ? "0" : s}${p.suffix || ""}`;
}

ITEM_TYPES.colorbar = {
  label: "Color Bar",
  icon: "colorbar",
  size: [70, 16],
  defaults: () => ({
    source: "",
    colormap: "viridis",
    reverse: false,
    customColors: "#2c7bb6, #abd9e9, #ffffbf, #fdae61, #d7191c",
    vmin: 0,
    vmax: 1,
    bins: 0,
    orientation: "horizontal",
    thickness: 3.5,
    extend: "neither",
    extendShape: "triangle",
    extendFrac: 0.05,
    tickMode: "linear",
    tickCount: 5,
    customTicks: "",
    decimals: -1,
    thousands: true,
    prefix: "",
    suffix: "",
    tickSide: "after",
    tickDir: "out",
    tickLen: 1.2,
    tickWidth: 0.2,
    tickColor: "#111111",
    tickFont: font({ size: 7 }),
    outline: true,
    outlineColor: "#111111",
    outlineWidth: 0.25,
    title: "Value",
    titlePos: "before",
    titleAlign: "center",
    titleFont: font({ size: 8, bold: true }),
    padding: 1.5,
    background: "",
    bgOpacity: 1,
    border: { show: false, color: "#333333", width: 0.3, radius: 0 },
  }),
};

RENDERERS.colorbar = function colorbar(item) {
  const p = item.props;
  const horiz = p.orientation !== "vertical";
  const cols = colorbarColors(p);
  const ticks = colorbarTicks(p);
  const dec = tickDecimals(p, ticks);
  const labels = ticks.map((t) => fmtTick(t, dec, p));
  const tf = p.tickFont;
  const tfh = tf.size * PT;
  const ttf = p.titleFont;
  const tth = ttf.size * PT;
  const pad = p.padding || 0;
  const tickLen = p.tickDir === "none" ? 0 : p.tickLen;
  const tickOut = p.tickDir === "out" || p.tickDir === "both" ? tickLen : 0;
  const lo = Math.min(p.vmin, p.vmax);
  const hi = Math.max(p.vmin, p.vmax);
  const span = hi - lo || 1;
  const extLo = p.extend === "min" || p.extend === "both";
  const extHi = p.extend === "max" || p.extend === "both";
  const labelW = labels.map((l) => textWidthMm(l, tf));
  const maxLabelW = Math.max(0, ...labelW);
  const P = (v) => round(v, 3);
  const uid8 = item.id.replace(/[^\w]/g, "").slice(-10);
  const after = p.tickSide !== "before";
  let out = "";
  if (p.background) out += `<rect width="${item.w}" height="${item.h}" rx="${p.border?.radius || 0}" fill="${esc(p.background)}" fill-opacity="${p.bgOpacity ?? 1}"/>`;

  // ---- geometry: bar rectangle (x0,y0,len along the axis, th across)
  let bx;
  let by;
  let len;
  let th;
  let titleSvg = "";
  const hasTitle = !!String(p.title || "").trim();
  if (horiz) {
    const titleH = hasTitle && p.titlePos !== "side" ? tth * 1.3 : 0;
    const sideTitleW = hasTitle && p.titlePos === "side" ? richLine(p.title, 0, 0, ttf).width + 2 : 0;
    const labelBand = tickOut + 0.8 + tfh;
    const marginL = Math.max(labelW[0] || 0, 0) / 2;
    const marginR = Math.max(labelW[labelW.length - 1] || 0, 0) / 2;
    th = Math.max(0.5, Math.min(p.thickness, item.h - pad * 2 - titleH - labelBand));
    // the extensions take a share of the total length
    const total = item.w - pad * 2 - sideTitleW - marginL - marginR;
    len = Math.max(2, total / (1 + (extLo + extHi) * p.extendFrac));
    const ext = len * p.extendFrac;
    bx = pad + sideTitleW + marginL + (extLo ? ext : 0);
    const titleBefore = hasTitle && p.titlePos === "before";
    const ticksBefore = !after;
    by = pad + (titleBefore ? titleH : 0) + (ticksBefore ? labelBand : 0);
    if (hasTitle) {
      const tx = p.titleAlign === "left" ? bx - (extLo ? ext : 0) : p.titleAlign === "right" ? bx + len + (extHi ? ext : 0) : bx + len / 2;
      const anchor = p.titleAlign === "left" ? "start" : p.titleAlign === "right" ? "end" : "middle";
      if (p.titlePos === "side") {
        titleSvg = richLine(p.title, pad, by + th / 2 + tth * 0.35, ttf, "start").svg;
      } else {
        const ty = p.titlePos === "before" ? pad + tth * 0.95 : by + th + (after ? labelBand : 0) + tth * 1.15;
        titleSvg = richLine(p.title, tx, ty, ttf, anchor).svg;
      }
    }
  } else {
    const titleH = hasTitle && p.titlePos !== "side" ? tth * 1.4 : 0;
    const sideTitleW = hasTitle && p.titlePos === "side" ? tth * 1.4 : 0;
    const labelBand = tickOut + 0.8 + maxLabelW;
    const marginT = tfh / 2;
    const marginB = tfh / 2;
    th = Math.max(0.5, Math.min(p.thickness, item.w - pad * 2 - sideTitleW - labelBand));
    const total = item.h - pad * 2 - titleH - marginT - marginB;
    len = Math.max(2, total / (1 + (extLo + extHi) * p.extendFrac));
    const ext = len * p.extendFrac;
    by = pad + (p.titlePos === "before" ? titleH : 0) + marginT + (extHi ? ext : 0);
    bx = pad + sideTitleW + (after ? 0 : labelBand);
    if (hasTitle) {
      if (p.titlePos === "side") {
        titleSvg = `<g transform="translate(${P(pad + tth * 0.95)} ${P(by + len / 2)}) rotate(-90)">${richLine(p.title, 0, 0, ttf, "middle").svg}</g>`;
      } else {
        const ty = p.titlePos === "before" ? pad + tth * 0.95 : by + len + (extLo ? ext : 0) + marginB + tth * 1.2;
        const tx = p.titleAlign === "left" ? pad : p.titleAlign === "right" ? item.w - pad : bx + th / 2;
        const anchor = p.titleAlign === "left" ? "start" : p.titleAlign === "right" ? "end" : "middle";
        titleSvg = richLine(p.title, tx, ty, ttf, anchor).svg;
      }
    }
  }
  const ext = len * p.extendFrac;

  // position along the bar for a data value (horizontal: left→right low→high; vertical: bottom→top)
  const pos = (v) => (horiz ? bx + ((v - lo) / span) * len : by + len - ((v - lo) / span) * len);

  // ---- fill
  const gid = `cbg-${uid8}`;
  const bins = Math.max(0, Math.round(p.bins || 0));
  if (bins >= 2) {
    for (let i = 0; i < bins; i++) {
      const c = sampleColors(cols, (i + 0.5) / bins);
      const a = (len * i) / bins;
      const b = (len * (i + 1)) / bins;
      out += horiz
        ? `<rect x="${P(bx + a)}" y="${P(by)}" width="${P(b - a + 0.02)}" height="${P(th)}" fill="${c}"/>`
        : `<rect x="${P(bx)}" y="${P(by + len - b)}" width="${P(th)}" height="${P(b - a + 0.02)}" fill="${c}"/>`;
    }
  } else {
    const stops = cols.map((c, i) => `<stop offset="${round(i / (cols.length - 1), 4)}" stop-color="${esc(c)}"/>`).join("");
    out += `<defs><linearGradient id="${gid}" ${horiz ? 'x1="0" y1="0" x2="1" y2="0"' : 'x1="0" y1="1" x2="0" y2="0"'}>${stops}</linearGradient></defs>`;
    out += `<rect x="${P(bx)}" y="${P(by)}" width="${P(horiz ? len : th)}" height="${P(horiz ? th : len)}" fill="url(#${gid})"/>`;
  }
  // ---- extensions (under / over colors = the colormap ends)
  const tri = p.extendShape !== "rect";
  let outline = "";
  if (horiz) {
    const y0 = by;
    const y1 = by + th;
    const ym = by + th / 2;
    const x0 = bx;
    const x1 = bx + len;
    if (extLo) out += tri ? `<polygon points="${P(x0)},${P(y0)} ${P(x0 - ext)},${P(ym)} ${P(x0)},${P(y1)}" fill="${cols[0]}"/>` : `<rect x="${P(x0 - ext)}" y="${P(y0)}" width="${P(ext + 0.02)}" height="${P(th)}" fill="${cols[0]}"/>`;
    if (extHi) out += tri ? `<polygon points="${P(x1)},${P(y0)} ${P(x1 + ext)},${P(ym)} ${P(x1)},${P(y1)}" fill="${cols[cols.length - 1]}"/>` : `<rect x="${P(x1 - 0.02)}" y="${P(y0)}" width="${P(ext + 0.02)}" height="${P(th)}" fill="${cols[cols.length - 1]}"/>`;
    const L = extLo ? (tri ? `L${P(x0 - ext)},${P(ym)}` : `L${P(x0 - ext)},${P(y1)}L${P(x0 - ext)},${P(y0)}`) : "";
    const R = extHi ? (tri ? `L${P(x1 + ext)},${P(ym)}` : `L${P(x1 + ext)},${P(y0)}L${P(x1 + ext)},${P(y1)}`) : "";
    outline = `M${P(x0)},${P(y0)}L${P(x1)},${P(y0)}${R}L${P(x1)},${P(y1)}L${P(x0)},${P(y1)}${L}Z`;
  } else {
    const x0 = bx;
    const x1 = bx + th;
    const xm = bx + th / 2;
    const yt = by;
    const yb = by + len;
    if (extHi) out += tri ? `<polygon points="${P(x0)},${P(yt)} ${P(xm)},${P(yt - ext)} ${P(x1)},${P(yt)}" fill="${cols[cols.length - 1]}"/>` : `<rect x="${P(x0)}" y="${P(yt - ext)}" width="${P(th)}" height="${P(ext + 0.02)}" fill="${cols[cols.length - 1]}"/>`;
    if (extLo) out += tri ? `<polygon points="${P(x0)},${P(yb)} ${P(xm)},${P(yb + ext)} ${P(x1)},${P(yb)}" fill="${cols[0]}"/>` : `<rect x="${P(x0)}" y="${P(yb - 0.02)}" width="${P(th)}" height="${P(ext + 0.02)}" fill="${cols[0]}"/>`;
    const T = extHi ? (tri ? `L${P(xm)},${P(yt - ext)}` : `L${P(x0)},${P(yt - ext)}L${P(x1)},${P(yt - ext)}`) : "";
    const B = extLo ? (tri ? `L${P(xm)},${P(yb + ext)}` : `L${P(x1)},${P(yb + ext)}L${P(x0)},${P(yb + ext)}`) : "";
    outline = `M${P(x0)},${P(yt)}${T}L${P(x1)},${P(yt)}L${P(x1)},${P(yb)}${B}L${P(x0)},${P(yb)}Z`;
  }
  if (p.outline) out += `<path d="${outline}" fill="none" stroke="${esc(p.outlineColor)}" stroke-width="${p.outlineWidth}" stroke-linejoin="miter"/>`;

  // ---- ticks + labels
  const tc = esc(p.tickColor);
  ticks.forEach((t, i) => {
    const q = pos(t);
    const inner = p.tickDir === "in" || p.tickDir === "both" ? tickLen : 0;
    if (horiz) {
      const edge = after ? by + th : by;
      const dirOut = after ? 1 : -1;
      if (tickLen) out += `<line x1="${P(q)}" y1="${P(edge - dirOut * inner)}" x2="${P(q)}" y2="${P(edge + dirOut * tickOut)}" stroke="${tc}" stroke-width="${p.tickWidth}"/>`;
      const ly = after ? edge + tickOut + 0.8 + tfh * 0.78 : edge - tickOut - 0.8;
      out += `<text x="${P(q)}" y="${P(ly)}" text-anchor="middle" ${fontAttrs(tf)}>${esc(labels[i])}</text>`;
    } else {
      const edge = after ? bx + th : bx;
      const dirOut = after ? 1 : -1;
      if (tickLen) out += `<line x1="${P(edge - dirOut * inner)}" y1="${P(q)}" x2="${P(edge + dirOut * tickOut)}" y2="${P(q)}" stroke="${tc}" stroke-width="${p.tickWidth}"/>`;
      const lx = edge + dirOut * (tickOut + 0.8);
      out += `<text x="${P(lx)}" y="${P(q)}" text-anchor="${after ? "start" : "end"}" dominant-baseline="central" ${fontAttrs(tf)}>${esc(labels[i])}</text>`;
    }
  });
  out += titleSvg;
  if (p.border?.show) out += `<rect width="${item.w}" height="${item.h}" rx="${p.border.radius || 0}" fill="none" stroke="${esc(p.border.color)}" stroke-width="${p.border.width}"/>`;
  return out;
};

// ---- read value range / colors from a GeoLibre layer
function projectLayers() {
  try {
    return S.app?.getProjectSnapshot?.()?.layers || [];
  } catch {
    return [];
  }
}
function colorbarSourceOptions() {
  const opts = [["", "Manual values"]];
  const snap = new Map(projectLayers().map((l) => [l.id, l]));
  for (const gl of glLayers()) {
    const l = snap.get(gl.id) || gl;
    const raster = l.metadata?.rasterState || /cog|raster|tif/i.test(String(l.type || ""));
    const graduated = l.style?.vectorStyleMode && l.style.vectorStyleMode !== "single";
    if (raster || graduated) opts.push([gl.id, `${gl.name || gl.id}${raster ? " (raster)" : " (graduated)"}`]);
  }
  return opts;
}
// Copy vmin/vmax/colormap from a layer into the color bar props. Returns a message.
function readColorbarFromLayer(p) {
  const l = projectLayers().find((x) => x.id === p.source);
  if (!l) return "Layer not found in the current GeoLibre project.";
  const rs = l.metadata?.rasterState;
  if (rs) {
    const r = Array.isArray(rs.rescale) && rs.rescale[0];
    if (r && r.length >= 2) {
      p.vmin = Number(r[0]);
      p.vmax = Number(r[1]);
    }
    const cm = String(rs.colormap || "").toLowerCase().replace(/_r$/, "");
    if (COLORMAPS[cm]) {
      p.colormap = cm;
      p.reverse = /_r$/i.test(String(rs.colormap || ""));
    }
    if (!p.title || p.title === "Value") p.title = l.name || p.title;
    return r ? `Range ${fmtNumber(p.vmin, 2)} – ${fmtNumber(p.vmax, 2)} read from “${l.name}”.` : `Colormap read from “${l.name}”; it has no stored value range, so set min/max manually.`;
  }
  const st = l.style || {};
  const stops = Array.isArray(st.vectorStyleStops) ? st.vectorStyleStops.filter((s) => s && s.color != null) : [];
  if (stops.length >= 2) {
    p.vmin = Number(stops[0].value);
    p.vmax = Number(stops[stops.length - 1].value);
    const ramp = String(st.vectorStyleColorRamp || "").toLowerCase();
    if (COLORMAPS[ramp] && st.vectorStyleMode !== "categorized") p.colormap = ramp;
    else {
      p.colormap = "custom";
      p.customColors = stops.map((s) => s.color).join(", ");
    }
    if (!p.title || p.title === "Value") p.title = st.vectorStyleProperty || l.name;
    return `Range ${fmtNumber(p.vmin, 2)} – ${fmtNumber(p.vmax, 2)} read from “${l.name}”.`;
  }
  return `“${l.name}” has no stored value range — set min/max manually.`;
}
