/* Nihongo Techō – Füller: druckempfindliche Strichform (perfect-freehand). Browser: App.inkPen, Node: module.exports */
'use strict';
(function (root) {
  const PF = typeof module !== 'undefined' && module.exports ? require('../vendor/perfect-freehand/perfect-freehand.js') : root.PerfectFreehand;
  const FOUNTAIN_WIDTHS = [0.0016, 0.0028, 0.0045];
  const DEFAULT_THINNING = 0.65;
  const clampThinning = (v) => { const n = parseFloat(v); return isNaN(n) ? DEFAULT_THINNING : Math.min(0.9, Math.max(0.3, n)); };

  // pts: [x, y, Druck] als Anteil der Seitenbreite → Umriss in Pixeln
  const fountainOutline = (pts, W, s) => {
    if (!pts || !pts.length) return [];
    const size = s.w * W;
    // kurzes Auslaufen an Anfang/Ende (true hieße: über die ganze Strichlänge)
    return PF.getStroke(pts.map((q) => [q[0] * W, q[1] * W, q[2]]), {
      size, thinning: s.th, smoothing: 0.5, streamline: 0.4, simulatePressure: !!s.sim, last: true,
      start: { taper: size * 1.5 }, end: { taper: size * 2.5 },
    });
  };

  // Tipper: kein Punkt entfernt sich weiter als gut eine Strichbreite vom Aufsetzpunkt
  const isDot = (pts, w) => {
    const a = pts[0], lim = Math.max(w * 1.2, 0.0025);
    for (let i = 1; i < pts.length; i++) if (Math.hypot(pts[i][0] - a[0], pts[i][1] - a[1]) > lim) return false;
    return true;
  };
  // Tipper als voller runder Punkt: mindestens so dick wie der Strich, fester Druck macht ihn größer
  const dot = (pts, w) => {
    let x = 0, y = 0, p = 0;
    pts.forEach((q) => { x += q[0]; y += q[1]; p = Math.max(p, q[2] || 0); });
    return { x: x / pts.length, y: y / pts.length, r: w * Math.max(0.6, 0.3 + 0.6 * p) };
  };

  // Lineal: Endpunkt rastet ein, wenn die Linie fast waagrecht oder senkrecht ist
  const straight = (a, b, deg = 3) => {
    const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]), t = Math.tan((deg * Math.PI) / 180);
    if (dy <= dx * t) return [b[0], a[1]];
    if (dx <= dy * t) return [a[0], b[1]];
    return [b[0], b[1]];
  };
  // gerade Linie als dichte Punktfolge mit gleichmäßigem Druck (Radierer und Auswahl prüfen Punkte)
  const linePts = (a, b, step = 0.004) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)), pts = [];
    for (let i = 0; i <= n; i++) pts.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, 0.5]);
    return pts;
  };

  const P = { FOUNTAIN_WIDTHS, DEFAULT_THINNING, clampThinning, fountainOutline, isDot, dot, straight, linePts };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkPen = P;
})(this);
