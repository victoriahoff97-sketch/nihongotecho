/* Nihongo Techō – Stifte: druckempfindliche Strichformen (perfect-freehand), eigene Stifte. Browser: App.inkPen, Node: module.exports */
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

  // alte Einstellung inkPen: { tool, wIdx, widths, color, mcolor } – nur noch Vorlage für die ersten eigenen Stifte (legacyPens)
  const PEN_TOOLS = ['pen', 'fountain', 'marker'];
  const isColor = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);
  const isW = (i) => [0, 1, 2].includes(i);
  // Dicke je Stift { pen, fountain, marker }; fehlt eine, gilt die gemeinsame alte Dicke wIdx, sonst „mittel“
  const penWidths = (widths, wIdx) => Object.fromEntries(PEN_TOOLS.map((t) => [t, isW(widths && widths[t]) ? widths[t] : isW(wIdx) ? wIdx : 1]));

  // ---------- Meine Stifte (Einstellung inkPens: { list, def, last }) ----------
  // Stift: { id, t: Stiftart, mm: Dicke, o: Deckkraft 0,1–1, c: Farbe, pr: Druckempfindlichkeit 0–1 }
  // Dicke in mm, gemessen an einer A4-Seitenbreite – im Strich steht sie als Anteil der Seitenbreite (w)
  const PAGE_MM = 210;
  const MAX_PENS = 8;
  const TYPES = [
    { t: 'pen', label: 'Stift', icon: 'ballpen', min: 0.1, max: 5, press: false },
    { t: 'fountain', label: 'Füller', icon: 'fountain', min: 0.1, max: 5, press: true },
    { t: 'brush', label: 'Pinsel', icon: 'brush', min: 0.3, max: 12, press: true },
    { t: 'nib', label: 'Feder', icon: 'nib', min: 0.3, max: 8, press: true },
    { t: 'marker', label: 'Marker', icon: 'highlighter', min: 1, max: 15, press: false },
  ];
  const TYPE = Object.fromEntries(TYPES.map((x) => [x.t, x]));
  const PALETTE = {
    pen: ['#1f2430', '#1c4fd8', '#c8402a', '#2f7d32', '#9c36b5', '#e8590c', '#0b7285', '#868e96'],
    marker: ['#ffe066', '#8ce99a', '#fcc2d7', '#a5d8ff', '#ffc078', '#d0bfff'],
  };
  const palette = (t) => (t === 'marker' ? PALETTE.marker : PALETTE.pen);
  // alte feste Stufen fein/mittel/breit als Strichbreite – daraus entstehen beim ersten Start die drei Stifte
  const LEGACY_W = { pen: [0.0022, 0.0038, 0.006], fountain: FOUNTAIN_WIDTHS, marker: [0.012, 0.02, 0.03] };
  const DEF_PR = 0.6;
  const defO = (t) => (t === 'marker' ? 0.4 : 1);
  const num = (v, d) => (typeof v === 'number' && isFinite(v) ? v : d);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const roundMm = (mm) => +mm.toFixed(mm < 1 ? 2 : 1);
  const clampMm = (t, mm) => roundMm(clamp(num(mm, (TYPE[t].min + TYPE[t].max) / 4), TYPE[t].min, TYPE[t].max));
  const mmToW = (mm) => +(mm / PAGE_MM).toFixed(5);
  const mmLabel = (mm) => mm.toFixed(mm < 1 ? 2 : 1).replace('.', ',') + ' mm';

  // Dicken-Regler: 0–1000, logarithmisch – unten (feine Spitzen) liegen die Stufen dichter
  const SLIDER = 1000;
  const toSlider = (t, mm) => { const T = TYPE[t]; return Math.round((SLIDER * Math.log(clamp(mm, T.min, T.max) / T.min)) / Math.log(T.max / T.min)); };
  const fromSlider = (t, v) => { const T = TYPE[t]; return clampMm(t, T.min * Math.pow(T.max / T.min, clamp(+v || 0, 0, SLIDER) / SLIDER)); };

  const normPen = (p, i) => {
    if (!p || typeof p !== 'object' || !TYPE[p.t]) return null;
    return {
      id: typeof p.id === 'string' && /^[a-z0-9]{1,12}$/.test(p.id) ? p.id : 'p' + i,
      t: p.t, mm: clampMm(p.t, p.mm), o: +clamp(num(p.o, defO(p.t)), 0.1, 1).toFixed(2),
      c: isColor(p.c) ? p.c.toLowerCase() : palette(p.t)[0], pr: +clamp(num(p.pr, DEF_PR), 0, 1).toFixed(2),
    };
  };
  // Stiftart wechseln: Dicke in den Bereich der neuen Art holen, Marker-Deckkraft und Farbe passend tauschen
  const retype = (p, t) => {
    if (!TYPE[t] || p.t === t) return { ...p };
    const toMk = t === 'marker', fromMk = p.t === 'marker';
    return normPen({ ...p, t, mm: p.mm, o: toMk !== fromMk ? defO(t) : p.o, c: toMk !== fromMk ? palette(t)[0] : p.c }, 0);
  };
  // neuer Stift: Kopie des gerade gewählten mit eigener Kennung
  const newId = (list) => { let i = list.length + 1; while (list.some((p) => p.id === 'p' + i)) i++; return 'p' + i; };
  const copyPen = (list, p) => ({ ...p, id: newId(list) });

  // aus der alten Einstellung inkPen ({ tool, wIdx, widths, color, mcolor }) und inkThinning: Stift, Füller, Marker wie bisher
  const legacyPens = (old, thinning) => {
    const o = old && typeof old === 'object' ? old : {};
    const wd = penWidths(o.widths, o.wIdx);
    const c = isColor(o.color) ? o.color : PALETTE.pen[0], mc = isColor(o.mcolor) ? o.mcolor : PALETTE.marker[0];
    const list = [
      normPen({ id: 'stift', t: 'pen', mm: LEGACY_W.pen[wd.pen] * PAGE_MM, c }, 0),
      normPen({ id: 'fueller', t: 'fountain', mm: LEGACY_W.fountain[wd.fountain] * PAGE_MM, c, pr: (clampThinning(thinning) - 0.3) / 0.6 }, 1),
      normPen({ id: 'marker', t: 'marker', mm: LEGACY_W.marker[wd.marker] * PAGE_MM, c: mc }, 2),
    ];
    return { list, def: null, last: { pen: 'stift', fountain: 'fueller', marker: 'marker' }[o.tool] || null };
  };
  // gespeicherte Stifte prüfen; fehlen sie (noch), entstehen sie aus der alten Einstellung
  const normPens = (v, old, thinning) => {
    const seen = new Set();
    const list = (v && Array.isArray(v.list) ? v.list : []).map(normPen).filter((p) => p && !seen.has(p.id) && seen.add(p.id)).slice(0, MAX_PENS);
    if (!list.length) return legacyPens(old, thinning);
    const ok = (id) => (list.some((p) => p.id === id) ? id : null);
    return { list, def: ok(v.def), last: ok(v.last) };
  };
  // beim Öffnen eines Blatts: der Standard-Stift, sonst der zuletzt benutzte
  const startPen = (cfg) => cfg.def || cfg.last || cfg.list[0].id;

  // Stift → neuer Strich; sim: Druck vortäuschen (Maus, Finger, Lineal)
  const stroke = (p, pt, sim) => {
    const s = { t: p.t === 'fountain' ? 'fp' : p.t, c: p.c, w: mmToW(p.mm), pts: [pt] };
    if (p.t === 'fountain') { s.th = +(0.3 + 0.6 * p.pr).toFixed(3); s.sim = sim; }
    if (p.t === 'brush') { s.th = +(0.5 + 0.45 * p.pr).toFixed(3); s.sim = sim; }
    if (p.t === 'nib') s.th = p.pr;
    if (p.t === 'marker' || p.o < 1) s.o = p.o;
    return s;
  };
  // Deckkraft eines gespeicherten Strichs (alte Marker ohne o: 0,38)
  const alpha = (s) => (typeof s.o === 'number' ? s.o : s.t === 'marker' ? 0.38 : 1);

  // Pinsel: sehr druckempfindlich, setzt rund auf und läuft lang aus
  const brushOutline = (pts, W, s) => {
    if (!pts || !pts.length) return [];
    const size = s.w * W;
    return PF.getStroke(pts.map((q) => [q[0] * W, q[1] * W, q[2]]), {
      size, thinning: s.th, smoothing: 0.6, streamline: 0.45, simulatePressure: !!s.sim, last: true,
      start: { taper: size * 0.4 }, end: { taper: size * 3 },
    });
  };
  // Kalligrafie-Feder: schräge Spitze (40°) – Striche quer zur Spitze breit, längs dazu haarfein.
  // Je Abschnitt ein Viereck, alle gleich herum orientiert, damit sie sich beim Füllen nicht gegenseitig auslöschen
  const NIB_DEG = 40;
  const nibQuads = (pts, W, s) => {
    const a = (NIB_DEG * Math.PI) / 180, dx = Math.cos(a), dy = -Math.sin(a), out = [];
    const h = (q) => ((s.w * W) / 2) * Math.max(0.2, 1 + (s.th || 0) * ((q[2] ?? 0.5) * 2 - 1) * 0.5);
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], hp = h(p), hq = h(q);
      const P0 = [p[0] * W, p[1] * W], Q0 = [q[0] * W, q[1] * W];
      const quad = [[P0[0] + dx * hp, P0[1] + dy * hp], [Q0[0] + dx * hq, Q0[1] + dy * hq], [Q0[0] - dx * hq, Q0[1] - dy * hq], [P0[0] - dx * hp, P0[1] - dy * hp]];
      let area = 0;
      for (let k = 0; k < 4; k++) { const u = quad[k], v = quad[(k + 1) % 4]; area += u[0] * v[1] - v[0] * u[1]; }
      out.push(area < 0 ? quad.reverse() : quad);
    }
    return out;
  };

  const P = {
    FOUNTAIN_WIDTHS, DEFAULT_THINNING, PEN_TOOLS, clampThinning, fountainOutline, isDot, dot, straight, linePts, penWidths,
    PAGE_MM, MAX_PENS, TYPES, TYPE, PALETTE, SLIDER, palette, mmToW, mmLabel, toSlider, fromSlider, normPen, retype, copyPen, legacyPens, normPens, startPen, stroke, alpha, brushOutline, nibQuads,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkPen = P;
})(this);
