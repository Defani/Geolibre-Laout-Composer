// ---------------------------------------------------------------- dual-unit scale bar
// One bar, two unit axes: ground distance below, a second unit above (paper
// centimetres by default, as on topographic sheets). The first segment of each
// axis is split in two: 0 · ½ · 1 · 2 · 3 …
SCALEBAR_STYLES.splice(SCALEBAR_STYLES.findIndex((s) => s.id === "numeric"), 0, { id: "dual", name: "Dual units" });

const SCALE_UNITS = {
  km: { label: "km", perMeter: 1 / 1000 },
  m: { label: "m", perMeter: 1 },
  mi: { label: "mi", perMeter: 1 / 1609.344 },
  nmi: { label: "nmi", perMeter: 1 / 1852 },
  papercm: { label: "cm", paper: true },
};

function renderDualScalebar(item, p, map) {
  const f = p.font;
  const fh = f.size * PT;
  const mPerMm = metersPerMm(map);
  const bh = p.barHeight;
  const lw = p.lineWidth;
  const c1 = esc(p.color1);
  const c2 = esc(p.color2);
  const segs = Math.max(1, Math.round(p.segments));
  // primary (bottom) unit
  const prim = p.units === "auto" ? (mPerMm * item.w > 3000 ? "km" : "m") : p.units;
  const pu = SCALE_UNITS[prim] || SCALE_UNITS.km;
  const perMmP = pu.paper ? 0.1 : mPerMm * pu.perMeter;
  const reserve = textWidthMm("0000 km", f) * 0.7;
  const avail = Math.max(5, item.w - reserve);
  const segVal = p.segmentValue > 0 ? p.segmentValue : niceFloor((avail * perMmP) / segs);
  const L = (segVal * segs) / perMmP; // bar length in mm
  // secondary (top) unit
  const su = SCALE_UNITS[p.dualUnit] || SCALE_UNITS.papercm;
  const perMmS = su.paper ? 0.1 : mPerMm * su.perMeter;
  const totalS = L * perMmS;
  const stepS = niceFloor(totalS / Math.max(2, segs));
  const topY = fh + 1.4; // bar top
  const tickUp = 1;
  const fmt = (v) => fmtNumber(v, Math.abs(v % 1) > 1e-9 ? ((v * 10) % 1 ? 2 : 1) : 0);
  let out = "";

  // bottom axis ticks: 0, ½, 1, 2 … segments
  const bottom = [0, segVal / 2];
  for (let i = 1; i <= segs; i++) bottom.push(segVal * i);
  for (let i = 0; i < bottom.length - 1; i++) {
    const a = bottom[i] / perMmP;
    const b = bottom[i + 1] / perMmP;
    out += `<rect x="${round(a, 3)}" y="${round(topY, 3)}" width="${round(b - a, 3)}" height="${bh}" fill="${i % 2 === 0 ? c1 : c2}" stroke="${c1}" stroke-width="${lw}"/>`;
  }
  const by = topY + bh + 0.9 + fh * 0.8;
  bottom.forEach((v) => {
    out += `<text x="${round(v / perMmP, 3)}" y="${round(by, 3)}" text-anchor="middle" ${fontAttrs(f)}>${esc(fmt(v))}</text>`;
  });
  const lastW = textWidthMm(fmt(bottom[bottom.length - 1]), f);
  out += `<text x="${round(L + lastW / 2 + 1, 3)}" y="${round(by, 3)}" ${fontAttrs(f)}>${esc(p.unitLabel || pu.label)}</text>`;

  // top axis ticks: 0, ½, 1, 2 … within the bar length
  const top = [0, stepS / 2];
  for (let v = stepS; v <= totalS + stepS * 1e-6; v += stepS) top.push(round(v, 9));
  const ty = topY - tickUp - 0.5;
  top.forEach((v) => {
    const x = v / perMmS;
    out += `<line x1="${round(x, 3)}" y1="${round(topY, 3)}" x2="${round(x, 3)}" y2="${round(topY - tickUp, 3)}" stroke="${c1}" stroke-width="${lw}"/>`;
    out += `<text x="${round(x, 3)}" y="${round(ty, 3)}" text-anchor="middle" ${fontAttrs(f)}>${esc(fmt(v))}</text>`;
  });
  const lastTop = top[top.length - 1];
  out += `<text x="${round(lastTop / perMmS + textWidthMm(fmt(lastTop), f) / 2 + 1, 3)}" y="${round(ty, 3)}" ${fontAttrs(f)}>${esc(p.dualLabel || su.label)}</text>`;
  return out;
}
