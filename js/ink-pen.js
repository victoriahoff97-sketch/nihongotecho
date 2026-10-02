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

  const P = { FOUNTAIN_WIDTHS, DEFAULT_THINNING, clampThinning, fountainOutline };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkPen = P;
})(this);
