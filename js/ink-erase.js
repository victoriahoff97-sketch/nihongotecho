/* Nihongo Techō – Punkt-Radierer: Striche unter der Radierspitze kürzen oder teilen. Browser: App.inkErase, Node: module.exports */
'use strict';
(function (root) {
  const EPS = 1e-9;
  const MIN_LEN = 0.0005; // kürzere Reste sind unsichtbare Krümel
  // Radius der Spitze als Anteil der Seitenbreite; beim Hineinzoomen feiner
  const radius = (zoom) => 0.004 / zoom + 0.0012;

  const lerp = (a, b, t) => [+(a[0] + (b[0] - a[0]) * t).toFixed(4), +(a[1] + (b[1] - a[1]) * t).toFixed(4), +(a[2] + (b[2] - a[2]) * t).toFixed(2)];
  const len = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; };

  // Abschnitt [u0, u1] der Strecke a→b (0..1), der im Kreis um c liegt; null, wenn keiner
  const inside = (a, b, c, R) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], fx = a[0] - c[0], fy = a[1] - c[1];
    const A = dx * dx + dy * dy;
    if (A < EPS * EPS) return fx * fx + fy * fy < R * R ? [0, 1] : null;
    const B = 2 * (fx * dx + fy * dy), C = fx * fx + fy * fy - R * R;
    const D = B * B - 4 * A * C;
    if (D <= 0) return null;
    const q = Math.sqrt(D);
    const u0 = Math.max(0, (-B - q) / (2 * A)), u1 = Math.min(1, (-B + q) / (2 * A));
    return u1 - u0 > EPS ? [u0, u1] : null;
  };

  // Ein Strich gegen die Spitze (Mitte c, Radius rad): null = unberührt, sonst die übrigen Teile (evtl. keiner).
  // Die halbe Strichbreite zählt mit, damit auch der Rand eines dicken Strichs greift.
  const cutStroke = (s, c, rad) => {
    const pts = s.pts, R = rad + s.w / 2;
    if (!pts.length) return null;
    if (pts.length === 1) return Math.hypot(pts[0][0] - c[0], pts[0][1] - c[1]) < R ? [] : null;
    const parts = [];
    let cur = null, changed = false;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const h = inside(a, b, c, R);
      if (!h) { if (!cur) cur = [a]; cur.push(b); continue; }
      changed = true;
      if (h[0] > EPS) { if (!cur) cur = [a]; cur.push(lerp(a, b, h[0])); }
      if (cur) { parts.push(cur); cur = null; }
      if (h[1] < 1 - EPS) cur = [lerp(a, b, h[1]), b];
    }
    if (cur) parts.push(cur);
    if (!changed) return null;
    return parts.filter((p) => len(p) >= MIN_LEN).map((p) => ({ ...s, pts: p }));
  };

  // Alle Striche einer Seite; Teile rücken an die Stelle ihres Strichs (Reihenfolge = Schreibfolge). null = nichts getroffen
  const cutAll = (strokes, c, rad) => {
    let out = null;
    for (let i = 0; i < strokes.length; i++) {
      const r = cutStroke(strokes[i], c, rad);
      if (r && !out) out = strokes.slice(0, i);
      if (out) { if (r) out.push(...r); else out.push(strokes[i]); }
    }
    return out;
  };

  // Punkte zwischen zwei Zeigerpositionen, damit eine schnelle Bewegung keinen Strich überspringt (ohne from: nur to)
  const sweep = (from, to, rad) => {
    if (!from) return [to];
    const n = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / rad));
    const out = [];
    for (let k = 1; k < n; k++) out.push([from[0] + (to[0] - from[0]) * k / n, from[1] + (to[1] - from[1]) * k / n]);
    out.push(to);
    return out;
  };

  const P = { radius, cutStroke, cutAll, sweep };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkErase = P;
})(this);
