/* Nihongo Techō – Sticker: kleine Kritzel-Symbole, die als echte Striche aufs Blatt kommen (Stiftfarbe + Marker-Tupfer). Browser: App.inkStickers, Node: module.exports */
'use strict';
(function (root) {
  const BOX = 48;      // Zeichenfeld der Vorlagen
  const SIZE = 0.055;  // Kantenlänge auf dem Blatt (Anteil der Seitenbreite)
  const PEN_W = 2, MK_W = 11, STEP = 2;
  const r4 = (v) => +v.toFixed(4);

  // Vorlagen: ink = Stiftlinien (M/L/C, absolut), circ = Kreise [cx, cy, r], dots = gefüllte Punkte [cx, cy, r],
  // mk = Marker-Tupfer, rot = Teilpfad n-mal um die Mitte gedreht
  const DEFS = [
    { id: 'idee', label: 'Idee', mk: 'M19 18 L29 18', ink: 'M18 31 C12 26 10 20 13 14 C16 7 30 6 35 13 C39 20 36 26 30 31 M18.5 31.5 L30 31 M19.5 35 L29 34.5 M21.5 38.5 L27 38 M21 30 L22 22 L24.5 25 L27 21.5 L27.5 30 M24 4 L24 0 M9 9 L6 6 M39 9 L42 6 M6 20 L2 20 M42 19.5 L46 19.5' },
    { id: 'buch', label: 'Lehrbuch', mk: 'M13 21 L16 21.5', ink: 'M24 13 C19 9 11 9 5 11 L5 37 C11 35 19 35 24 39 C29 35 37 35 43 37 L43 11 C37 9 29 9 24 13 M24 13 L24 38.5 M9 17 C13 16 17 16.5 20 18 M9 23 C13 22 17 22.5 20 24 M28 18 C31 16.5 35 16 39 17 M28 24 C31 22.5 35 22 39 23' },
    { id: 'stern', label: 'Wichtig', mk: 'M19 24 L29 24', ink: 'M24 5 L29 18 L43 19 L32.5 28 L36 42 L24 34.5 L12 42 L15.5 28 L5 19 L19 18 L24.5 5.5' },
    { id: 'achtung', label: 'Achtung', mk: 'M24 15 L24 31', ink: 'M24 6 C22 6 21 8 21.5 11 L23 29 L25.5 29 L27 10 C27.5 7.5 26 6 24 6', dots: [[24, 37.5, 2.6]] },
    { id: 'frage', label: 'Frage', mk: 'M21 12 L27 12', ink: 'M15 15 C15 7 31 5 32 14 C32.5 20 24 21 24 29', dots: [[24, 37.5, 2.5]] },
    { id: 'haken', label: 'Verstanden', mk: 'M14 29 L20 34 L34 18', mkW: 8, ink: 'M8 25 L19 36 L41 10' },
    { id: 'herz', label: 'Liebling', mk: 'M18 19 L30 19', ink: 'M24 40 C10 30 5 22 8 14 C11 7 21 8 24 16 C27 8 37 7 40 14 C43 22 38 30 24.5 40.5' },
    { id: 'pfeil', label: 'Siehe', ink: 'M5 26 C15 22 28 22 41 24 M32 15 L42 24 L33 33' },
    { id: 'sprechen', label: 'Sprechen', mk: 'M14 20.5 L34 20.5', ink: 'M8 9 L40 9 C43 9 44 11 44 13 L44 28 C44 31 42 32 40 32 L22 32 L13 41 L14 32 L8 32 C5 32 4 30 4 28 L4 13 C4 10 6 9 8.5 9 M12 17 L36 17 M12 24 L28 24' },
    { id: 'hoeren', label: 'Hören', ink: 'M17 40 C13 40 12 36 15 32 C18 28 13 24 13 17 C13 9 19 5 25 5 C32 5 36 10 36 17 C36 24 30 26 29 32 C28 38 22 41 17 40 M19 19 C18 13 23 10 27 12 C31 14 30 20 26 21 C23 22 24 26 22 28 M40 11 C42.5 14 42.5 20 40 23 M44 8 C47.5 13 47.5 21 44 26' },
    { id: 'lesen', label: 'Lesen', ink: 'M4 24 C12 12 36 12 44 24 C36 36 12 36 4 24 M12 13 L10 9 M24 11 L24 6.5 M36 13 L38 9', circ: [[24, 24, 6]], dots: [[24, 24, 2.3]] },
    { id: 'schreiben', label: 'Schreiben', mk: 'M29 19 L17 31', mkW: 8, ink: 'M33 6 L42 15 L17 40 L6 42 L8 31 L33 6 M8 31 L17 40 M28 11 L37 20', dots: [[7.6, 40.4, 1.6]] },
    { id: 'zeit', label: 'Zeit', ink: 'M24 13 L24 24 L32 29 M24 7.5 L24 11 M40.5 24 L37 24 M24 40.5 L24 37 M7.5 24 L11 24', circ: [[24, 24, 17]] },
    { id: 'aufgabe', label: 'Aufgabe', mk: 'M18 25 L30 25', ink: 'M6 23 L24 7 L42 23 M11 20 L11 40 L37 40 L37 20 M21 40 L21 29 L28 29 L28 40' },
    { id: 'wiederholen', label: 'Nochmal', ink: 'M38 18 C34 9 20 7 13 15 C11 17 10 19 9.5 21 M38 9 L38.5 18.5 L29 18 M10 30 C14 39 28 41 35 33 C37 31 38 29 38.5 27 M10 39 L9.5 29.5 L19 30' },
    { id: 'schluessel', label: 'Schlüssel', mk: 'M28 24 L38 24', mkW: 9, ink: 'M22 24 L43 24 M36 24 L36 31 M41 24 L41 30', circ: [[14, 24, 8], [14, 24, 2.6]] },
    { id: 'merken', label: 'Merken', mk: 'M21 22 L27 22', ink: 'M17 6 L31 6 M19 6 L18 19 C13 21 11 25 11 28 L37 28 C37 25 35 21 30 19 L29 6 M24 28 L24 43' },
    { id: 'leicht', label: 'Leicht', ink: 'M15 28 C19 35 29 35 33 28', circ: [[24, 24, 17]], dots: [[18, 20, 2], [30, 20, 2]] },
    { id: 'ausnahme', label: 'Ausnahme', mk: 'M19 33 L29 33', ink: 'M24 6 L44 40 L4 40 L24.5 6.5 M24 18 L24 29', dots: [[24, 34.5, 1.9]] },
    { id: 'schwer', label: 'Schwer', mk: 'M24.5 16 L21.5 31', mkW: 8, ink: 'M27 4 L11 26 L22 26 L18 44 L37 19 L26 19 L27 4.5' },
    { id: 'termin', label: 'Termin', mk: 'M11.5 15 L36.5 15', mkW: 7, ink: 'M7 11 L41 11 L41 41 L7 41 L7 11 M7 19 L41 19 M15 7 L15 14 M33 7 L33 14 M17 30 L22 35 L31 25' },
    { id: 'ueben', label: 'Üben', ink: 'M15 33 C19 27 29 27 33 33', circ: [[24, 24, 17]], dots: [[18, 20, 2], [30, 20, 2]] },
    { id: 'ziel', label: 'Ziel', mk: 'M18 17 L32 17', ink: 'M11 5 L11 44 M11 8 C18 5 24 12 38 8 L38 26 C24 30 18 23 11 26' },
    { id: 'denken', label: 'Gedanke', ink: 'M14 30 C7 30 5 22 11 19 C10 12 19 8 24 12 C29 7 39 10 38 18 C44 20 43 30 35 30 L14 30', circ: [[13, 37, 2.8]], dots: [[7.5, 43, 1.5]] },
    // Japan
    { id: 'torii', label: 'Torii', mk: 'M15 21 L33 21', mkW: 7, ink: 'M5 8 C15 11.5 33 11.5 43 8 M4 12.5 C14 15.5 34 15.5 44 12.5 M5 8 L4 12.5 M43 8 L44 12.5 M9 21 L39 21 M14 14.5 L12.5 43 M34 14.5 L35.5 43 M24 15 L24 21' },
    { id: 'fuji', label: 'Fuji', mk: 'M21 15 L27 15', mkW: 8, ink: 'M3 40 L18 12 C20 9 22 11 24 10 C26 9 28 9 30 12 L45 40 L3 40 M14.5 19 L18 23 L21.5 19 L24 23.5 L27 19 L30 23 L33.5 19' },
    { id: 'sakura', label: 'Sakura', mk: 'M21 24 L27 24', mkW: 14, rot: { d: 'M24 21 C18 16 19 8 22 5 L24 8 L26 5 C29 8 30 16 24 21', n: 5 }, dots: [[24, 24, 1.8]] },
    { id: 'onigiri', label: 'Onigiri', mk: 'M21.5 35.5 L26.5 35.5', mkW: 9, ink: 'M24 6 C28 6 30 9 32 13 L41 30 C44 36 41 41 35 41 L13 41 C7 41 4 36 7 30 L16 13 C18 9 20 6 24 6 M17 41 L17 30 L31 30 L31 41', dots: [[20, 20, 1], [27, 23, 1], [23, 14, 1]] },
    { id: 'daruma', label: 'Daruma', mk: 'M17 38 L31 38', mkW: 7, ink: 'M24 5 C35 5 42 14 42 25 C42 36 35 43 24 43 C13 43 6 36 6 25 C6 14 13 5 24.5 5 M24 13 C31 13 35 17 35 23 C35 29 31 32 24 32 C17 32 13 29 13 23 C13 17 17 13 24 13 M20 27.5 C22 29 26 29 28 27.5 M16.5 17 L22 16.5 M26 16.5 L31.5 17', circ: [[19.5, 21.5, 2.7], [28.5, 21.5, 2.7]], dots: [[19.5, 21.5, 1.3]] },
    { id: 'faecher', label: 'Fächer', mk: 'M16 17 C20 14 28 14 32 17', mkW: 8, ink: 'M5 20 C12 6 36 6 43 20 L24 42 L5 20 M14.5 31 C19 25 29 25 33.5 31 M24 42 L15 11.5 M24 42 L24 9.5 M24 42 L33 11.5' },
    { id: 'laterne', label: 'Laterne', mk: 'M18 24 L30 24', ink: 'M18 7 L30 7 L30 10 L18 10 L18 7 M18 10 C8 14 8 34 18 38 M30 10 C40 14 40 34 30 38 M18 38 L30 38 L30 41 L18 41 L18 38 M11.5 18 L36.5 18 M10.5 24 L37.5 24 M11.5 30 L36.5 30 M24 7 L24 2.5 M24 41 L24 46.5' },
    { id: 'tee', label: 'Tee', mk: 'M19 31 L29 31', ink: 'M11 20 L13 38 C13.5 41 16 42 19 42 L29 42 C32 42 34.5 41 35 38 L37 20 M11 20 C11 16.5 37 16.5 37 20 C37 23.5 11 23.5 11 20 M19 12 C17 9 21 7 19 4 M27 12 C25 9 29 7 27 4' },
    { id: 'welle', label: 'Welle', mk: 'M11 39 L37 39', mkW: 6, ink: 'M3 34 C8 22 18 14 28 14 C35 14 40 19 39 25 C38 30 32 31 30 27 C29 24 31 22 33.5 22.5 M3 34 C10 30 14 38 21 34 C28 30 32 38 45 33', dots: [[40, 12, 1.1], [44, 17, 1.1], [35, 8.5, 1.1]] },
    { id: 'hinomaru', label: 'Japan', mk: 'M21 21 L27 21', mkW: 13, ink: 'M5 9 L43 9 L43 33 L5 33 L5 9', circ: [[24, 21, 7]] },
  ];

  // ---------- Pfad → Punktfolgen ----------
  const line = (out, a, b) => {
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / STEP));
    for (let i = 1; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
  };
  const bezier = (out, a, c1, c2, b) => {
    const len = Math.hypot(c1[0] - a[0], c1[1] - a[1]) + Math.hypot(c2[0] - c1[0], c2[1] - c1[1]) + Math.hypot(b[0] - c2[0], b[1] - c2[1]);
    const n = Math.max(4, Math.ceil(len / STEP));
    for (let i = 1; i <= n; i++) {
      const t = i / n, u = 1 - t;
      out.push([0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * c1[k] + 3 * u * t * t * c2[k] + t * t * t * b[k]));
    }
  };
  const parse = (d) => {
    const tk = (d || '').match(/[MLC]|-?[\d.]+/g) || [], out = [];
    let i = 0, cmd = null, pos = null, cur = null;
    const pt = () => [+tk[i++], +tk[i++]];
    while (i < tk.length) {
      if (/[MLC]/.test(tk[i])) cmd = tk[i++];
      if (cmd === 'M') { pos = pt(); cur = [pos]; out.push(cur); cmd = 'L'; }
      else if (cmd === 'L') { const b = pt(); line(cur, pos, b); pos = b; }
      else { const c1 = pt(), c2 = pt(), b = pt(); bezier(cur, pos, c1, c2, b); pos = b; }
    }
    return out;
  };
  // von Hand schließt ein Kreis nie genau: etwas über den Anfang hinaus
  const circle = (cx, cy, r) => {
    const n = Math.max(10, Math.ceil(2 * Math.PI * r / STEP)), pts = [];
    for (let i = 0; i <= n + 1; i++) { const a = -1.9 + (i / n) * 2 * Math.PI; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return pts;
  };
  const turn = (pts, a) => pts.map((q) => { const x = q[0] - BOX / 2, y = q[1] - BOX / 2; return [BOX / 2 + x * Math.cos(a) - y * Math.sin(a), BOX / 2 + x * Math.sin(a) + y * Math.cos(a)]; });
  // leichtes Zittern, vom Ort abhängig – so bleiben Linien, die sich treffen, verbunden
  const wob = (q, seed) => [q[0] + 0.35 * Math.sin(q[0] * 0.47 + q[1] * 0.29 + seed), q[1] + 0.35 * Math.sin(q[0] * 0.31 - q[1] * 0.43 + seed * 1.7)];

  const LIST = DEFS.map((d, n) => {
    let ink = parse(d.ink).concat((d.circ || []).map((c) => circle(c[0], c[1], c[2])));
    if (d.rot) for (let k = 0; k < d.rot.n; k++) ink = ink.concat(parse(d.rot.d).map((pts) => turn(pts, (k * 2 * Math.PI) / d.rot.n)));
    return { id: d.id, label: d.label, ink: ink.map((pts) => pts.map((q) => wob(q, n))), dots: d.dots || [], mk: parse(d.mk), mkW: d.mkW || MK_W };
  });
  const byId = new Map(LIST.map((s) => [s.id, s]));

  // Striche fürs Blatt: Mitte bei (x, y), ganz auf der Seite; Marker zuerst, damit die Linien obenauf liegen
  const strokes = (id, { x, y, pageH, color, mcolor, size = SIZE }) => {
    const d = byId.get(id);
    if (!d) return [];
    const k = size / BOX, h = size / 2, lim = (v, hi) => Math.max(h, Math.min(Math.max(h, hi - h), v));
    const cx = lim(x, 1), cy = lim(y, pageH);
    const at = (q, p) => [r4(cx + (q[0] - BOX / 2) * k), r4(cy + (q[1] - BOX / 2) * k), p];
    const out = d.mk.map((pts) => ({ t: 'marker', c: mcolor, w: +(d.mkW * k).toFixed(5), pts: pts.map((q) => at(q, 0.5)) }));
    // Druck schwankt leicht und lässt an den Enden nach, wie beim Schreiben
    d.ink.forEach((pts, j) => out.push({ t: 'pen', c: color, w: +(PEN_W * k).toFixed(5), pts: pts.map((q, i) => at(q, i === 0 || i === pts.length - 1 ? 0.38 : +(0.5 + 0.08 * Math.sin(i * 0.6 + j)).toFixed(2))) }));
    // gefüllter Punkt = Tipper; dessen Radius ist 0,6 × Strichstärke (inkPen.dot)
    d.dots.forEach((q) => out.push({ t: 'pen', c: color, w: +((q[2] * k) / 0.6).toFixed(5), pts: [at(q, 0.5)] }));
    return out;
  };

  // Vorschaubild für die Auswahl – aus denselben Punkten wie der Stempel
  const svg = (id, mcolor) => {
    const d = byId.get(id);
    if (!d) return '';
    const pl = (pts) => pts.map((q) => q[0].toFixed(1) + ',' + q[1].toFixed(1)).join(' ');
    return `<svg viewBox="0 0 ${BOX} ${BOX}" fill="none" stroke="currentColor" stroke-width="${PEN_W}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">`
      + d.mk.map((pts) => `<polyline points="${pl(pts)}" stroke="${mcolor}" stroke-width="${d.mkW}" stroke-linecap="square" opacity=".7"/>`).join('')
      + d.ink.map((pts) => `<polyline points="${pl(pts)}"/>`).join('')
      + d.dots.map((q) => `<circle cx="${q[0]}" cy="${q[1]}" r="${q[2]}" fill="currentColor" stroke="none"/>`).join('')
      + '</svg>';
  };

  const P = { BOX, SIZE, LIST, strokes, svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.inkStickers = P;
})(this);
