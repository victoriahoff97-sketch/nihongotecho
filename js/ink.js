/* Nihongo Techō – Dokument-Viewer mit Stiftnotizen (PDF, Bilder, Notizblätter) */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const INK = App.ink = {};
  const UL = App.uLogic;

  // ---------- pdf.js bei Bedarf laden ----------
  let pdfP = null;
  const loadScript = (src) => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Konnte ' + src + ' nicht laden')); document.head.appendChild(s); });
  INK.pdfjs = () => {
    if (pdfP) return pdfP;
    pdfP = (async () => {
      await loadScript('vendor/pdfjs/pdf.min.js');
      // Bei file:// sind Web-Worker gesperrt → Worker-Code im Hauptthread laden
      if (location.protocol === 'file:') await loadScript('vendor/pdfjs/pdf.worker.min.js');
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdfjs/pdf.worker.min.js';
      return window.pdfjsLib;
    })();
    return pdfP;
  };

  const PEN_COLORS = ['#1f2430', '#1c4fd8', '#c8402a', '#2f7d32', '#9c36b5'];
  const MARK_COLORS = ['#ffe066', '#8ce99a', '#fcc2d7', '#a5d8ff'];
  const A4 = 842 / 595;
  const BOOK_PAPER = INK.BOOK_PAPER = '#fbf8f0'; // cremefarbenes Papier im Buchlayout

  // ---------- Papier-Hintergründe ----------
  const drawPaper = INK.drawPaper = function (ctx, W, H, paper, bg) {
    ctx.fillStyle = bg || '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (paper === 'lines') {
      ctx.strokeStyle = '#c9d6ea'; ctx.lineWidth = Math.max(1, W * 0.0015);
      for (let y = W * 0.12; y < H - W * 0.04; y += W * 0.045) { ctx.beginPath(); ctx.moveTo(W * 0.06, y); ctx.lineTo(W * 0.94, y); ctx.stroke(); }
      ctx.strokeStyle = '#f1b8ae'; ctx.beginPath(); ctx.moveTo(W * 0.12, 0); ctx.lineTo(W * 0.12, H); ctx.stroke();
    } else if (paper === 'grid') {
      ctx.strokeStyle = '#dde3ec'; ctx.lineWidth = Math.max(1, W * 0.001);
      const s = W * 0.035;
      for (let x = s; x < W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = s; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    } else if (paper === 'kanji') {
      const cols = 8, m = W * 0.06, s = (W - 2 * m) / cols;
      const rows = Math.floor((H - 2 * m) / s);
      ctx.strokeStyle = '#e8a598'; ctx.lineWidth = Math.max(1, W * 0.0016);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) ctx.strokeRect(m + c * s, m + r * s, s, s);
      ctx.setLineDash([W * 0.004, W * 0.004]); ctx.strokeStyle = '#f3cdc5'; ctx.lineWidth = Math.max(1, W * 0.001);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = m + c * s, y = m + r * s;
        ctx.beginPath(); ctx.moveTo(x + s / 2, y); ctx.lineTo(x + s / 2, y + s); ctx.moveTo(x, y + s / 2); ctx.lineTo(x + s, y + s / 2); ctx.stroke();
      }
    } else if (paper === 'dots') {
      ctx.fillStyle = '#c3cad6'; const s = W * 0.035;
      for (let x = s; x < W; x += s) for (let y = s; y < H; y += s) { ctx.beginPath(); ctx.arc(x, y, Math.max(1, W * 0.0015), 0, 7); ctx.fill(); }
    }
    ctx.restore();
  };

  // ---------- Papierwahl ----------
  // Kacheln mit Papier-Vorschau – überall dieselben (neues Blatt in Mitschrift/Anwenden, Popup für Notizblatt, Seite anhängen, Papier ändern)
  INK.paperTiles = (current) => `<div class="paper-pick">${UL.PAPERS.map(([k, l]) => `<button class="paper-tile ${k === current ? 'on' : ''}" data-paper="${k}"><canvas width="120" height="170"></canvas><span>${l}</span></button>`).join('')}</div>`;
  INK.drawPaperTiles = (root) => root.querySelectorAll('.paper-tile canvas').forEach((cv) => INK.drawPaper(cv.getContext('2d'), cv.width, cv.height, cv.parentElement.dataset.paper));
  INK.pickPaper = ({ title, current } = {}) => new Promise((res) => {
    let done = false;
    const md = App.modal({ title, cls: 'paper-modal', body: `<p class="muted">Welches Papier?</p>${INK.paperTiles(current)}`, foot: false, onClose: () => { if (!done) res(null); } });
    INK.drawPaperTiles(md.el);
    md.el.addEventListener('click', (ev) => { const b = ev.target.closest('[data-paper]'); if (b) { done = true; res(b.dataset.paper); md.close(); } });
  });

  // ---------- Striche zeichnen ----------
  // halb durchsichtige Stift-/Feder-Striche bestehen aus vielen überlappenden Stücken: erst deckend auf ein Hilfsblatt, dann als Ganzes durchsichtig
  let scratch = null;
  function drawStroke(ctx, s, W) {
    const pts = s.pts;
    if (!pts.length) return;
    const a = App.inkPen.alpha(s);
    if (a < 1 && (s.t === 'pen' || s.t === 'nib') && !App.inkPen.isDot(pts, s.w)) {
      const m = s.w * W * 1.6 + 2;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      pts.forEach((q) => { x0 = Math.min(x0, q[0] * W); y0 = Math.min(y0, q[1] * W); x1 = Math.max(x1, q[0] * W); y1 = Math.max(y1, q[1] * W); });
      x0 = Math.floor(x0 - m); y0 = Math.floor(y0 - m);
      const w = Math.ceil(x1 + m) - x0, h = Math.ceil(y1 + m) - y0;
      if (!scratch) scratch = document.createElement('canvas');
      if (scratch.width < w) scratch.width = w;
      if (scratch.height < h) scratch.height = h;
      const sc = scratch.getContext('2d');
      sc.clearRect(0, 0, w, h);
      sc.save(); sc.translate(-x0, -y0); drawStroke(sc, { ...s, o: 1 }, W); sc.restore();
      ctx.save(); ctx.globalAlpha = a; ctx.drawImage(scratch, 0, 0, w, h, x0, y0, w, h); ctx.restore();
      return;
    }
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (s.t !== 'marker') ctx.globalAlpha = a;
    const fillOutline = (o) => { if (o.length) { ctx.beginPath(); ctx.moveTo(o[0][0], o[0][1]); for (let i = 1; i < o.length; i++) ctx.lineTo(o[i][0], o[i][1]); ctx.closePath(); ctx.fill(); } };
    // Tipper (Punkt, kurzes Strichlein): voller Punkt statt eines Strichs, der fast nur aus Auslauf besteht
    if (s.t !== 'marker' && App.inkPen.isDot(pts, s.w)) {
      const d = App.inkPen.dot(pts, s.w);
      ctx.fillStyle = s.c; ctx.beginPath(); ctx.arc(d.x * W, d.y * W, d.r * W, 0, 7); ctx.fill();
    } else if (s.t === 'fp') {
      ctx.fillStyle = s.c;
      fillOutline(App.inkPen.fountainOutline(pts, W, s));
    } else if (s.t === 'brush') {
      ctx.fillStyle = s.c;
      fillOutline(App.inkPen.brushOutline(pts, W, s));
    } else if (s.t === 'nib') {
      // Vierecke je Abschnitt in einem Pfad (gleich orientiert → keine Löcher) + haarfeine Mittellinie für Striche längs zur Spitze
      ctx.fillStyle = s.c; ctx.strokeStyle = s.c;
      ctx.beginPath();
      App.inkPen.nibQuads(pts, W, s).forEach((q) => { ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); });
      ctx.fill('nonzero');
      ctx.lineWidth = Math.max(1, s.w * W * 0.14);
      ctx.beginPath(); ctx.moveTo(pts[0][0] * W, pts[0][1] * W);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * W, pts[i][1] * W);
      ctx.stroke();
    } else if (s.t === 'marker') {
      ctx.globalAlpha = a; ctx.globalCompositeOperation = 'multiply';
      ctx.strokeStyle = s.c; ctx.lineWidth = s.w * W; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(pts[0][0] * W, pts[0][1] * W);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0] * W, pts[i][1] * W);
      if (pts.length === 1) ctx.lineTo(pts[0][0] * W, pts[0][1] * W);
      ctx.stroke();
    } else {
      ctx.strokeStyle = s.c; ctx.fillStyle = s.c;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const p = (a[2] + b[2]) / 2;
        ctx.lineWidth = s.w * W * (0.45 + p * 1.1);
        ctx.beginPath();
        if (i > 1) { const z = pts[i - 2]; ctx.moveTo(((z[0] + a[0]) / 2) * W, ((z[1] + a[1]) / 2) * W); ctx.quadraticCurveTo(a[0] * W, a[1] * W, ((a[0] + b[0]) / 2) * W, ((a[1] + b[1]) / 2) * W); }
        else { ctx.moveTo(a[0] * W, a[1] * W); ctx.lineTo(((a[0] + b[0]) / 2) * W, ((a[1] + b[1]) / 2) * W); }
        ctx.stroke();
      }
      const l = pts[pts.length - 1], k = pts[pts.length - 2];
      if (k) { ctx.lineWidth = s.w * W * (0.45 + l[2] * 1.1); ctx.beginPath(); ctx.moveTo(((k[0] + l[0]) / 2) * W, ((k[1] + l[1]) / 2) * W); ctx.lineTo(l[0] * W, l[1] * W); ctx.stroke(); }
    }
    ctx.restore();
  }
  INK.drawStroke = drawStroke; // auch fürs kleine Schreibfeld der Abfrage (hw-pad.js)

  // Bilder: einmal dekodieren, pro id zwischenspeichern (modulweit, damit auch INK.preview darauf zugreifen kann)
  const imgCache = new Map();
  const imgEl = (im, onload) => {
    // Kawaii-Sticker und Merkzettel (im.k) haben kein gespeichertes Bild, sie werden aus ihrer Vorlage gezeichnet
    const KW = App.inkKawaii, key = im.k ? KW.key(im) : '';
    let el = imgCache.get(im.id);
    if (!el) {
      el = new Image(); el._key = key;
      if (onload) el.onload = onload;
      el.src = im.k ? KW.src(im) : im.src;
      imgCache.set(im.id, el);
    } else if (el._key !== key && !el._next) {
      // Zettel hat eine neue Form: neu zeichnen, bis dahin bleibt das alte Bild stehen
      const cur = el, nx = cur._next = new Image();
      nx._key = key;
      nx.onload = () => { if (imgCache.get(im.id) === cur) imgCache.set(im.id, nx); if (onload) onload(); };
      nx.onerror = () => { cur._key = key; cur._next = null; };
      nx.src = KW.src(im);
    }
    return el.complete && el.naturalWidth ? el : null;
  };
  const drawImg = (ctx, el, im, W) => {
    if (!im.r) { ctx.drawImage(el, im.x * W, im.y * W, im.w * W, im.h * W); return; }
    ctx.save(); ctx.translate((im.x + im.w / 2) * W, (im.y + im.h / 2) * W); ctx.rotate((im.r * Math.PI) / 180);
    ctx.drawImage(el, (-im.w / 2) * W, (-im.h / 2) * W, im.w * W, im.h * W);
    ctx.restore();
  };
  // skip: Bilder, die gerade verschoben/skaliert werden (stehen auf der Live-Ebene)
  const drawImages = (ctx, p, W, skip) => p.images.forEach((im) => { if (skip && skip.includes(im)) return; const el = imgEl(im); if (el) drawImg(ctx, el, im, W); });

  // ---------- Vorschau: eine Seite verkleinert, schreibgeschützt ----------
  // opts: { page = 0, maxH = 220, crop = true, bg, always } – zeichnet Papier + Bilder + Striche in Canvas-Breite (canvas.clientWidth).
  // bg: Papierfarbe (Kurs-Notizbuch: cremefarben); always: auch eine leere Seite als Papier zeichnen.
  // Liefert false (Canvas bleibt leer) ohne Striche/Bilder, sonst true.
  INK.preview = App.ink.preview = async function (canvas, fileId, { page = 0, maxH = 220, crop = true, bg = null, always = false } = {}) {
    const f = App.store.files.get(fileId);
    if (!f) return false;
    const row = await App.db.get('ink', fileId + ':' + page);
    const strokes = (row && row.strokes) || [];
    const images = (row && row.images) || [];
    if (!strokes.length && !images.length && !always) { canvas.width = canvas.width; return false; }
    // Bilder vor dem Zeichnen dekodieren (wie beim Drucken), sonst fehlen sie in der ersten Vorschau
    for (const im of images) { imgEl(im); try { await imgCache.get(im.id).decode(); } catch (e) { /* kaputtes Bild auslassen */ } }
    const kind = App.fileKind(f);
    // Nur Notizblatt-Seiten haben ein Papiermuster; PDF-/Bildseiten bekommen nur weißen Grund (kein pdf.js-Rendern in Vorschauen)
    const paper = kind === 'notebook' ? ((f.pagePapers || [])[page] ?? f.paper ?? 'lines') : null;
    const cssW = canvas.clientWidth || canvas.width || 300;
    const fullH = cssW * A4;
    let cssH;
    if (crop) {
      let maxY = 0;
      strokes.forEach((s) => s.pts.forEach((pt) => { if (pt[1] > maxY) maxY = pt[1]; }));
      images.forEach((im) => { const b = im.y + im.h; if (b > maxY) maxY = b; });
      cssH = Math.min(maxH, maxY * cssW + 24);
    } else {
      cssH = Math.min(maxH, fullH);
    }
    cssH = Math.max(cssH, 1);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.round(cssW * dpr), H = Math.round(cssH * dpr);
    canvas.width = W; canvas.height = H;
    canvas.style.height = cssH + 'px';
    const ctx = canvas.getContext('2d');
    drawPaper(ctx, W, H, paper, bg);
    drawImages(ctx, { images }, W);
    strokes.forEach((s) => drawStroke(ctx, s, W));
    return true;
  };

  // ---------- Schreibfläche (eingebettet oder Vollbild) ----------
  // opts.typed: Buchaufgabe mit dem Antwortfeld (true) oder dem Schreibblatt (false) öffnen; ohne Angabe wie zuletzt
  // opts: { embedded, extraTools: [{ id, label, menuLabel, icon, onClick }], extraInMenu (extraTools ins „⋯“-Menü statt in die Leiste), onFullscreen, onClose, onLinkWord, onUnlinkWord }
  // onLinkWord(r) → Eintrag: Treffer aus dem Nachschlagen-Fenster mit dem eingekreisten Wort verknüpfen (ohne: kein „Verknüpfen“)
  // onUnlinkWord(itemId): die letzte Markierung eines Wortes wurde auf diesem Blatt gelöst
  INK.mount = async (root, fileId, opts = {}) => {
    const f = App.store.files.get(fileId);
    if (!f) return null;
    const embedded = !!opts.embedded;
    const kind = App.fileKind(f);
    const S = App.store.settings;
    const II = App.inkImages;
    const IE = App.inkErase;
    const BK = App.inkBook;
    const SEL = App.inkSelect;
    const PEN = App.inkPen;
    const STK = App.inkStickers;
    const KW = App.inkKawaii;
    // Buchlayout: nur im Vollbild und nur für Notizblätter (PDF-/Bildseiten haben beliebige Formate)
    const bookable = !embedded && kind === 'notebook';
    // Buchaufgabe: Aufgabe (Seite 1) und Schreibblatt nebeneinander, die Aufgabe bleibt beim Scrollen stehen
    const XL = App.exercisesLogic;
    const splittable = !embedded && !!f.exerciseId;
    // 'ink' = einer der eigenen Stifte (st.penId); alte Werkzeugnamen Stift/Füller/Marker zählen als 'ink'
    const TOOLS = ['hand', 'select', 'lasso', 'ink', 'eraser', 'cut'];
    // Meine Stifte (Einstellung inkPens); beim ersten Start entstehen sie aus der alten Einstellung inkPen
    const pens = PEN.normPens(S.inkPens, S.inkPen, S.inkThinning);
    // Standard-Stift (sonst der zuletzt benutzte) – außer der Aufrufer reicht den Zustand eines gerade offenen Blatts weiter (der hat penId)
    const handed = opts.penId !== undefined;
    const tool0 = PEN.PEN_TOOLS.includes(opts.defaultTool) ? 'ink' : opts.defaultTool;
    const st = { tool: handed && TOOLS.includes(tool0) ? tool0 : 'ink', penId: handed && pens.list.some((p) => p.id === opts.penId) ? opts.penId : PEN.startPen(pens), color: PEN_COLORS[0], mcolor: MARK_COLORS[0], zoom: 1, penOnly: S.penOnly !== false, pages: [], undo: [], redo: [], sel: null, ssel: null, moving: null, ruler: false, stamp: null, book: bookable && !!S.inkBook, spread: 0, split: splittable && S.exSplit !== false, side: S.exSide === 'r' ? 'r' : 'l', cols: null, exOff: 0, marksOnly: !!opts.marksOnly };
    // Radier-Ende des Stifts: nimmt den zuletzt gewählten Radierer
    // Blättern gibt es nur ohne „Nur Stift“ – sonst scrollt ohnehin der Finger
    if (st.tool === 'hand' && st.penOnly) st.tool = 'ink';
    st.eraser = st.tool === 'cut' || (st.tool !== 'eraser' && opts.eraser === 'cut') ? 'cut' : 'eraser';
    const curPen = () => pens.list.find((p) => p.id === st.penId) || pens.list[0];
    // Sticker nehmen Stift- und Markerfarbe: die des gewählten Stifts, sonst die des ersten passenden
    const syncColors = () => {
      const c = curPen(), pen = c.t !== 'marker' ? c : pens.list.find((p) => p.t !== 'marker'), mk = c.t === 'marker' ? c : pens.list.find((p) => p.t === 'marker');
      st.color = pen ? pen.c : PEN_COLORS[0]; st.mcolor = mk ? mk.c : MARK_COLORS[0];
    };
    syncColors();
    root.classList.add(embedded ? 'ink-embed' : 'viewer');
    root.innerHTML = `<div class="viewer-bar">
      ${embedded ? '' : `<button class="icon-btn" data-v="close" title="Schließen">${icon('back')}</button>`}
      <div class="grp"><button class="icon-btn" data-v="undo" title="Rückgängig">${icon('undo')}</button><button class="icon-btn" data-v="redo" title="Wiederholen">${icon('redo')}</button></div>
      <div class="grp">
        ${[['hand', 'hand', 'Blättern', 'Blättern/Scrollen'], ['select', 'pointer', 'Auswahl', 'Auswahl: Schrift und Sticker einkreisen, dann zusammen verschieben oder an den Ecken skalieren; einzelne Sticker antippen'], ['lasso', 'lasso', 'Erkennen', 'Erkennen: Wort einkreisen, nachschlagen und verknüpfen'],
        ].map(([t, ic, lbl, title]) => `<button class="icon-btn tool-btn ${st.tool === t ? 'active' : ''}" data-tool="${t}" title="${title}"${t === 'hand' && st.penOnly ? ' hidden' : ''}>${icon(ic)}<span class="tool-swatch"></span><span class="tool-lbl">${lbl}</span></button>`).join('')}
      </div>
      <div class="grp pen-slots" data-pens></div>
      <div class="grp">
        ${[['eraser', 'eraser', 'Strich-Radierer', 'Strich-Radierer: löscht ganze Striche'], ['cut', 'eraserDot', 'Punkt-Radierer', 'Punkt-Radierer: kürzt oder teilt Striche genau an der Spitze']].map(([t, ic, lbl, title]) => `<button class="icon-btn tool-btn ${st.tool === t ? 'active' : ''}${st.marksOnly ? ' marks-only' : ''}" data-tool="${t}" title="${title}">${icon(ic)}<span class="tool-swatch"></span><span class="tool-lbl">${lbl}</span></button>`).join('')}
        <button class="icon-btn tool-btn" data-v="ruler" title="Lineal: alle Stifte ziehen gerade Linien">${icon('ruler')}<span class="tool-swatch"></span><span class="tool-lbl">Lineal</span></button>
        <button class="icon-btn tool-btn" data-v="image" title="Bild einfügen (Strg+V)">${icon('imagePlus')}<span class="tool-swatch"></span><span class="tool-lbl">Bild</span></button>
        <button class="icon-btn tool-btn" data-v="sticker" title="Sticker: Symbol wählen, dann auf die Stelle im Blatt tippen">${icon('sticker')}<span class="tool-swatch"></span><span class="tool-lbl">Sticker</span></button>
        <button class="icon-btn tool-btn" data-v="lookup" title="Nachschlagen (Wörterbuch)">${icon('search')}<span class="tool-swatch"></span><span class="tool-lbl">Nachschlagen</span></button>
      </div>
      <div class="grp grp-end">
        ${bookable ? `<button class="btn btn-sm ${st.book ? 'btn-sec' : ''}" data-v="book" title="Buchlayout: zwei Seiten nebeneinander wie in einem Notizbuch">📖 Buch</button>` : ''}
        ${splittable ? `<button class="btn btn-sm ${st.split ? 'btn-sec' : ''}" data-v="split" title="Aufgabe und Schreibblatt nebeneinander (im Querformat)">◫ Nebeneinander</button>` : ''}
        <button class="btn btn-sm" data-v="paper" title="Papier dieser Seite ändern (liniert, kariert, Kanji-Raster …)">Papier</button>
        <button class="icon-btn" data-v="addpage" title="Leere Seite anhängen">${icon('filePlus')}</button>
        ${kind === 'pdf' ? `<button class="btn btn-sm" data-v="vocab" title="Vokabeln aus dieser PDF importieren">${icon('vocab')} Vokabeln auslesen</button>` : ''}
        ${embedded && opts.onFullscreen ? `<button class="icon-btn" data-v="full" title="Vollbild">⛶</button>` : ''}
      </div>
      ${(opts.extraTools || []).length && !opts.extraInMenu ? `<div class="grp">${opts.extraTools.map((t) => `<button class="btn btn-sm" data-x="${esc(t.id)}">${t.icon ? icon(t.icon) : ''} ${esc(t.label)}</button>`).join('')}</div>` : ''}
      <div class="grp"><button class="icon-btn" data-v="more" title="Mehr: Zoom, Nur Stift, Drucken …">${icon('more')}</button></div>
      <div class="more-pop card" hidden>
        <div class="more-title" data-title>${esc(f.name)}</div>
        ${opts.extraInMenu ? (opts.extraTools || []).map((t) => `<button class="more-item" data-x="${esc(t.id)}">${t.icon ? icon(t.icon) : ''}<span>${esc(t.menuLabel || t.label)}</span></button>`).join('') : ''}
        ${embedded ? '' : `<button class="more-item" data-v="details">${icon('edit')}<span>Umbenennen / Details</span></button>`}
        <button class="more-item" data-v="penonly" title="Wenn an: Nur der Stift schreibt, mit dem Finger wird gescrollt/gezoomt">${icon('ballpen')}<span>Nur Stift schreibt</span><b data-state>${st.penOnly ? 'an' : 'aus'}</b></button>
        <button class="more-item" data-v="marksonly" title="Wenn an: Die Radierer lösen nur Verknüpfungen (Vokabel, Kanji …) und nehmen Textmarker weg – die Schrift bleibt">${icon('highlighter')}<span>Radierer: nur Markierungen</span><b data-state>${st.marksOnly ? 'an' : 'aus'}</b></button>
        ${splittable ? `<button class="more-item" data-v="typed" title="Antwort tippen statt mit dem Stift schreiben – beides bleibt am Versuch">${icon('edit')}<span>Mit der Tastatur antworten</span><b data-state>aus</b></button>` : ''}
        ${splittable ? `<button class="more-item" data-v="swap" title="Aufgabe links oder rechts (z. B. für Linkshänder)"${st.split ? '' : ' hidden'}>${icon('shuffle')}<span>Seiten tauschen</span></button>` : ''}
        <div class="more-item more-zoom">${icon('zoomIn')}<span>Zoom</span><button class="icon-btn sm" data-v="zout" title="Verkleinern">${icon('zoomOut')}</button><button class="btn btn-sm btn-ghost" data-v="fit" title="Einpassen">100%</button><button class="icon-btn sm" data-v="zin" title="Vergrößern">${icon('zoomIn')}</button></div>
        <button class="more-item" data-v="print">${icon('print')}<span>Drucken / als PDF</span></button>
        <button class="more-item" data-v="help">${icon('help')}<span>Hilfe</span></button>
        ${embedded || f.bookId ? '' : `<button class="more-item danger" data-v="delete">${icon('trash')}<span>${kind === 'notebook' ? 'Blatt' : 'Datei'} löschen</span></button>`}
      </div></div>
      <div class="viewer-scroll">${embedded ? '' : `<div class="viewer-name" data-title>${esc(f.name)}</div>`}<div class="viewer-pages"></div></div>`;
    root.style.setProperty('--sec', 'var(--budo)'); // Datei-Betrachter gehört zur Bibliothek
    if (!embedded) document.body.style.overflow = 'hidden';
    const scroller = root.querySelector('.viewer-scroll');
    const pagesEl = root.querySelector('.viewer-pages');
    const note = (t, ms = 2200) => { const n = document.createElement('div'); n.className = 'viewer-note'; n.textContent = t; scroller.appendChild(n); setTimeout(() => n.remove(), ms); };

    // ---------- Meine Stifte: Leiste + Einstellfenster ----------
    // Probestrich im Knopf: Dicke grob sichtbar, Farbe und Deckkraft echt
    const sample = (p) => {
      const sw = Math.min(9, Math.max(1.3, 1 + p.mm * (p.t === 'marker' ? 0.6 : 1.5)));
      return `<svg class="pen-sample" width="30" height="14" viewBox="0 0 30 14" aria-hidden="true"><path d="M3 9.5C9 2.5 15 13 27 4.5" fill="none" stroke="${p.c}" stroke-width="${sw.toFixed(1)}" stroke-linecap="${p.t === 'marker' ? 'butt' : 'round'}" opacity="${p.t === 'marker' ? Math.max(0.35, p.o) : p.o}"/></svg>`;
    };
    const drawPens = () => {
      root.querySelector('[data-pens]').innerHTML = pens.list.map((p) => {
        const T = PEN.TYPE[p.t], on = st.tool === 'ink' && p.id === st.penId;
        return `<button class="pen-slot ${on ? 'active' : ''}" data-pen="${p.id}" title="${T.label}, ${PEN.mmLabel(p.mm)}${on ? ' – nochmal tippen zum Einstellen' : ''}">${sample(p)}<span class="tool-lbl">${T.label}${pens.def === p.id ? ' ★' : ''}</span></button>`;
      }).join('') + (pens.list.length < PEN.MAX_PENS ? `<button class="pen-slot pen-new" data-pen-new title="Neuen Stift anlegen (Kopie des gewählten)">${icon('plus')}<span class="tool-lbl">Neu</span></button>` : '');
    };
    drawPens();
    const savePens = () => { pens.last = st.penId; App.saveSettings({ inkPens: { list: pens.list.map((p) => ({ ...p })), def: pens.def, last: pens.last } }); };
    const closePenPop = () => { const o = root.querySelector('.pen-pop'); if (o) o.remove(); };
    const togglePenPop = () => {
      if (root.querySelector('.pen-pop')) { closePenPop(); return; }
      const pop = document.createElement('div');
      pop.className = 'pen-pop card';
      const pctx = () => pop.querySelector('canvas').getContext('2d');
      // Probestrich wie auf dem Blatt (Ausschnitt von 70 mm Seitenbreite), Druck steigt an und fällt wieder ab
      const preview = () => {
        const cv = pop.querySelector('canvas'), dpr = window.devicePixelRatio || 1;
        cv.width = Math.round(cv.clientWidth * dpr); cv.height = Math.round(cv.clientHeight * dpr);
        const W = (cv.width * PEN.PAGE_MM) / 70, wN = cv.width / W, hN = cv.height / W, c = pctx();
        c.clearRect(0, 0, cv.width, cv.height);
        const pts = [];
        for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([wN * (0.07 + 0.86 * t), hN * (0.5 - 0.28 * Math.sin(t * Math.PI * 2)), 0.2 + 0.7 * Math.sin(t * Math.PI)]); }
        drawStroke(c, { ...PEN.stroke(curPen(), pts[0], false), pts }, W);
      };
      const fill = () => {
        const p = curPen(), T = PEN.TYPE[p.t], pal = PEN.palette(p.t);
        pop.innerHTML = `<canvas class="pen-preview"></canvas>
          <div class="pp-lbl"><span>Stiftart</span></div>
          <div class="chips">${PEN.TYPES.map((x) => `<button class="chip ${x.t === p.t ? 'on' : ''}" data-ptype="${x.t}">${icon(x.icon)} ${x.label}</button>`).join('')}</div>
          <div class="pp-lbl"><span>Dicke</span><b data-ppv="mm">${PEN.mmLabel(p.mm)}</b></div>
          <input type="range" min="0" max="${PEN.SLIDER}" step="1" value="${PEN.toSlider(p.t, p.mm)}" data-pp="mm">
          <div class="pp-lbl"><span>Deckkraft</span><b data-ppv="o">${Math.round(p.o * 100)} %</b></div>
          <input type="range" min="10" max="100" step="5" value="${Math.round(p.o * 100)}" data-pp="o">
          ${T.press ? `<div class="pp-lbl"><span>Druckempfindlichkeit</span><b data-ppv="pr">${Math.round(p.pr * 100)} %</b></div>
          <input type="range" min="0" max="100" step="5" value="${Math.round(p.pr * 100)}" data-pp="pr">
          <div class="row between small muted"><span>gleichmäßig</span><span>stark</span></div>` : ''}
          <div class="pp-lbl"><span>Farbe</span></div>
          <div class="pp-colors">${pal.concat(pal.includes(p.c) ? [] : [p.c]).map((c) => `<button class="color ${c === p.c ? 'on' : ''}" style="background:${c}" data-pcolor="${c}" title="${c}"></button>`).join('')}
            <label class="color pp-own" title="Eigene Farbe wählen"><input type="color" value="${p.c}" data-pp-own></label></div>
          <div class="pp-foot">
            <button class="btn btn-sm" data-ppa="del">${icon('trash')} Löschen</button>
            <button class="btn btn-sm ${pens.def === p.id ? 'btn-sec' : ''}" data-ppa="def" title="Mit diesem Stift startet jedes Blatt">${icon(pens.def === p.id ? 'starFill' : 'star')} ${pens.def === p.id ? 'Standard' : 'Als Standard'}</button>
            <button class="btn btn-sm btn-primary" data-ppa="done">Fertig</button>
          </div>`;
        preview();
      };
      // Änderung am gewählten Stift: Leiste und Probestrich sofort, gespeichert wird beim Loslassen (save)
      const change = (patch, save) => {
        const i = pens.list.findIndex((p) => p.id === st.penId);
        pens.list[i] = PEN.normPen({ ...pens.list[i], ...patch }, i);
        syncColors(); drawPens(); preview();
        if (save) savePens();
      };
      fill();
      const btn = root.querySelector(`[data-pen="${st.penId}"]`) || root.querySelector('[data-pens]');
      const r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect();
      root.appendChild(pop);
      pop.style.left = Math.max(8, Math.min(r.left - rr.left - 40, rr.width - pop.offsetWidth - 8)) + 'px';
      pop.style.top = r.bottom - rr.top + 6 + 'px';
      preview();
      pop.addEventListener('input', (e) => {
        const k = e.target.dataset.pp, p = curPen();
        if (e.target.dataset.ppOwn !== undefined) { change({ c: e.target.value }, false); return; }
        if (!k) return;
        const v = k === 'mm' ? PEN.fromSlider(p.t, e.target.value) : +e.target.value / 100;
        pop.querySelector(`[data-ppv="${k}"]`).textContent = k === 'mm' ? PEN.mmLabel(v) : Math.round(v * 100) + ' %';
        change({ [k]: v }, false);
      });
      pop.addEventListener('change', (e) => {
        // eigene Farbe: erst nach der Wahl in die Farbreihe übernehmen (während des Ziehens bleibt das Fenster stehen)
        if (e.target.dataset.ppOwn !== undefined) { change({ c: e.target.value }, true); fill(); return; }
        if (e.target.dataset.pp) savePens();
      });
      pop.addEventListener('click', async (e) => {
        const ty = e.target.closest('[data-ptype]');
        if (ty) { const i = pens.list.findIndex((p) => p.id === st.penId); pens.list[i] = PEN.retype(pens.list[i], ty.dataset.ptype); syncColors(); drawPens(); savePens(); fill(); return; }
        const c = e.target.closest('[data-pcolor]');
        if (c) { change({ c: c.dataset.pcolor }, true); fill(); return; }
        const a = e.target.closest('[data-ppa]');
        if (!a) return;
        if (a.dataset.ppa === 'done') closePenPop();
        if (a.dataset.ppa === 'def') { pens.def = pens.def === st.penId ? null : st.penId; drawPens(); savePens(); fill(); }
        if (a.dataset.ppa === 'del') {
          if (pens.list.length < 2) { note('Ein Stift muss bleiben'); return; }
          const p = curPen();
          if (!(await App.confirm(`Den Stift „${PEN.TYPE[p.t].label}“ (${PEN.mmLabel(p.mm)}) löschen? Was du damit geschrieben hast, bleibt.`, { title: 'Stift löschen?' }))) return;
          const i = pens.list.indexOf(p);
          pens.list.splice(i, 1);
          if (pens.def === p.id) pens.def = null;
          closePenPop();
          setPen(pens.list[Math.max(0, i - 1)].id);
        }
      });
    };
    root.addEventListener('pointerdown', (e) => { if (!e.target.closest('.pen-pop, [data-pen], .modal-back')) closePenPop(); }, true);

    // ---------- Seiten vorbereiten ----------
    let pdf = null, img = null;
    const pageDefs = [];
    try {
      if (kind === 'pdf') {
        note('PDF wird geladen …');
        const lib = await INK.pdfjs();
        const buf = await (await App.fileBlob(f.id)).arrayBuffer();
        pdf = await lib.getDocument({
          data: buf,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
        }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const p = await pdf.getPage(i);
          const vp = p.getViewport({ scale: 1 });
          pageDefs.push({ kind: 'pdf', n: i, ratio: vp.height / vp.width, page: p });
        }
      } else if (kind === 'image') {
        // Buchaufgabe: der Hintergrund kommt aus dem Buchaufgaben-Paket, die Datei selbst hat keinen Blob
        const blob = f.exerciseId ? await App.exercises.blobOf(f.exerciseId) : await App.fileBlob(f.id);
        if (!blob && f.exerciseId) pageDefs.push({ kind: 'paper', ratio: f.exW && f.exH ? f.exH / f.exW : 0.5, paper: 'blank', missing: 'Buchaufgaben-Paket nicht geladen' });
        else {
          const url = URL.createObjectURL(blob);
          img = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
          pageDefs.push({ kind: 'image', ratio: img.naturalHeight / img.naturalWidth });
        }
      } else {
        for (let i = 0; i < (f.pages || 1); i++) pageDefs.push({ kind: 'paper', ratio: A4, paper: UL.pagePaper(f, i) });
      }
    } catch (e) {
      console.error(e);
      pagesEl.innerHTML = `<div class="card" style="max-width:520px"><h3>Datei konnte nicht geöffnet werden</h3><p class="muted">${esc(e.message || e)}</p></div>`;
    }
    const extra = kind === 'notebook' ? 0 : (f.extraPages || 0);
    for (let j = 0; j < extra; j++) pageDefs.push({ kind: 'paper', ratio: A4, paper: UL.extraPaper(f, j), extra: true });

    // Tinte laden
    const inkRows = await App.db.all('ink');
    const inkMap = new Map(inkRows.filter((r) => r.fileId === f.id).map((r) => [r.page, { strokes: r.strokes || [], images: r.images || [], links: r.links || [] }]));
    // Alle geänderten Seiten speichern (nicht nur die zuletzt beschriebene)
    const dirty = new Set();
    const flushAll = () => {
      if (!dirty.size) return;
      dirty.forEach((pi) => {
        const p = st.pages[pi];
        App.db.put('ink', { key: f.id + ':' + pi, fileId: f.id, page: pi, strokes: p.strokes, images: p.images, links: p.links })
          .catch((e) => { console.error(e); if (p.images.length) App.toast('Bild konnte nicht gespeichert werden'); });
      });
      dirty.clear();
      let n = 0; st.pages.forEach((p) => { if (App.inkImages.hasInk(p)) n++; });
      App.store.inkCount.set(f.id, n);
    };
    const saveInk = App.debounce(flushAll, 500);
    // Fenster/Tab wird geschlossen oder in den Hintergrund geschickt → sofort sichern
    const onHide = () => { if (document.visibilityState !== 'visible') { flushAll(); if (ty.flush) ty.flush(); } };
    window.addEventListener('pagehide', flushAll);
    document.addEventListener('visibilitychange', onHide);

    // Wort-Verknüpfungen: feine Markierung unter dem Wort (nur für Einträge, die es noch gibt)
    const renderLinks = (p) => {
      p.el.querySelectorAll('.ink-link').forEach((x) => x.remove());
      const r = p.def.ratio;
      p.links.forEach((l) => {
        if (!App.item(l.itemId)) return;
        const el = document.createElement('div');
        el.className = 'ink-link ' + App.SECTIONS[App.item(l.itemId).type].cls;
        Object.assign(el.style, { left: l.x * 100 + '%', top: (l.y / r) * 100 + '%', width: l.w * 100 + '%', height: (l.h / r) * 100 + '%' });
        p.el.appendChild(el);
      });
    };

    const baseWidth = () => (st.book ? BK.fitWidth(scroller.clientWidth, scroller.clientHeight, A4) : Math.min(scroller.clientWidth - 44, 1100));
    const buildPage = (def, i) => {
      const el = document.createElement('div');
      el.className = 'vpage';
      el.innerHTML = `<canvas class="bgc"></canvas><canvas class="inkc"></canvas><canvas class="livec"></canvas><div class="loading">…</div><span class="pno">${i + 1}${def.extra ? ' · Zusatzseite' : ''}</span>`;
      pagesEl.appendChild(el);
      const pg = { def, el, bg: el.querySelector('.bgc'), ink: el.querySelector('.inkc'), live: el.querySelector('.livec'), strokes: (inkMap.get(i) || {}).strokes || [], images: (inkMap.get(i) || {}).images || [], links: (inkMap.get(i) || {}).links || [], renderedW: 0, visible: false, i };
      st.pages.push(pg);
      renderLinks(pg);
      return pg;
    };
    pageDefs.forEach(buildPage);
    if (splittable && st.pages[0]) st.pages[0].el.classList.add('ex-page');
    // ---------- Buchaufgabe mit der Tastatur: ein Antwortfeld steht an der Stelle der Schreibblätter ----------
    // Der Text liegt am Versuch (f.typed); die Stiftschrift auf den Blättern bleibt, sie ist nur ausgeblendet
    const ty = {};
    if (splittable && st.pages.length > 1) {
      ty.el = document.createElement('div');
      ty.el.className = 'ex-typed'; ty.el.hidden = true;
      ty.el.innerHTML = '<div class="row between"><label for="ex-typed-ta">Deine Antwort</label><button class="btn btn-sm btn-ghost" data-ty-pen title="Zurück zum Schreibblatt – der Text bleibt am Versuch">✎ Mit dem Stift schreiben</button></div><textarea id="ex-typed-ta" lang="ja" spellcheck="false" autocapitalize="off" placeholder="Hier tippen …"></textarea>';
      pagesEl.appendChild(ty.el);
      ty.ta = ty.el.querySelector('textarea');
      ty.ta.value = f.typed || '';
      ty.flush = () => { if (!ty.dirty) return; ty.dirty = false; App.db.put('files', f).catch((e) => { console.error(e); App.toast('Antwort konnte nicht gespeichert werden'); }); };
      ty.save = App.debounce(ty.flush, 600);
      // das Feld wächst mit dem Text, gescrollt wird das ganze Blatt
      ty.grow = () => { ty.ta.style.height = 'auto'; ty.ta.style.height = ty.ta.scrollHeight + 'px'; };
      ty.ta.addEventListener('input', () => { f.typed = ty.ta.value; ty.dirty = true; ty.save(); ty.grow(); });
      st.typed = typeof opts.typed === 'boolean' ? opts.typed : XL.startTyped(f, Array.from(inkMap.values()).some((r) => App.inkImages.hasInk(r)), S.exTyped);
      ty.el.querySelector('[data-ty-pen]').addEventListener('click', () => setTyped(false));
    }
    const applyTyped = () => {
      if (!ty.el) { const b = root.querySelector('[data-v=typed]'); if (b) b.hidden = true; return; }
      st.pages.forEach((p) => { if (p.i) { p.el.hidden = st.typed; if (st.typed) p.visible = false; } });
      ty.el.hidden = !st.typed;
      root.querySelector('[data-v=typed] [data-state]').textContent = st.typed ? 'an' : 'aus';
      // Papier und neue Seiten gehören zu den Schreibblättern
      $$('[data-v=paper], [data-v=addpage]', root).forEach((b) => { b.hidden = st.typed; });
    };
    applyTyped();
    if (st.typed && opts.typed) ty.ta.focus(); // „Tippen“ gewählt: gleich losschreiben
    // ---------- Buchlayout: immer eine Doppelseite, blättern statt scrollen ----------
    let ready = false; // erst nach dem Aufbau gibt es Schildchen/Auswahl zum Aufräumen
    const bk = {};
    if (bookable) {
      bk.ghost = document.createElement('button');
      bk.ghost.className = 'vpage bk-ghost'; bk.ghost.hidden = true;
      bk.ghost.innerHTML = `${icon('filePlus')}<span>Seite hinzufügen</span>`;
      bk.prev = document.createElement('button'); bk.prev.className = 'bk-turn prev'; bk.prev.title = 'Zurückblättern'; bk.prev.textContent = '‹';
      bk.next = document.createElement('button'); bk.next.className = 'bk-turn next';
      pagesEl.append(bk.ghost, bk.prev, bk.next);
      bk.ghost.addEventListener('click', () => addPage());
      bk.prev.addEventListener('click', () => turn(-1));
      bk.next.addEventListener('click', () => turn(1));
    }
    const showSpread = (dir) => {
      const n = st.pages.length;
      st.spread = BK.clampSpread(st.spread, n);
      const { l, r } = BK.pagesOf(st.spread, n);
      st.pages.forEach((p) => {
        p.el.hidden = p.i !== l && p.i !== r;
        p.el.classList.toggle('bk-l', p.i === l); p.el.classList.toggle('bk-r', p.i === r);
        p.el.classList.remove('flip-next', 'flip-prev');
        if (dir && !p.el.hidden) { void p.el.offsetWidth; p.el.classList.add(dir > 0 ? 'flip-next' : 'flip-prev'); }
      });
      bk.ghost.hidden = r != null;
      bk.prev.hidden = st.spread === 0;
      const last = st.spread === BK.spreadCount(n) - 1;
      bk.next.textContent = last ? '+' : '›';
      bk.next.title = last ? (r == null ? 'Rechte Seite hinzufügen' : 'Leere Doppelseite anhängen') : 'Weiterblättern';
      if (ready) { closeHw(); hideTip(); if (st.sel && st.sel.p.el.hidden) clearSel(); if (st.ssel && st.ssel.p.el.hidden) clearSSel(); }
    };
    const turn = (d) => {
      if (!st.book) return;
      const s = st.spread + d;
      if (s < 0) return;
      if (s > BK.spreadCount(st.pages.length) - 1) { addPage(); return; }
      st.spread = s; showSpread(d);
    };
    // Seite, die in der Blatt-Ansicht gerade oben zu sehen ist
    const topPage = () => { const t = scroller.getBoundingClientRect().top + 40; return st.pages.find((p) => p.el.getBoundingClientRect().bottom > t) || st.pages[0]; };
    const applyMode = (page) => {
      root.classList.toggle('viewer-book', st.book);
      pagesEl.classList.toggle('book', st.book);
      st.zoom = 1;
      st.pages.forEach((p) => { p.renderedW = 0; });
      if (st.book) { st.spread = BK.spreadOf(page ? page.i : 0); showSpread(); }
      else if (bookable) {
        st.pages.forEach((p) => { p.el.hidden = false; p.el.classList.remove('bk-l', 'bk-r', 'flip-next', 'flip-prev'); });
        bk.ghost.hidden = true;
      }
    };
    // Stehende Aufgabe: Abstand nach oben (eine zu hohe Aufgabe ist um exOff nach oben geschoben)
    const placeEx = () => {
      const ex = st.pages[0];
      if (!splittable || !ex) return;
      if (st.cols) st.exOff = XL.splitOffset(st.exOff, ex.el.offsetHeight, scroller.clientHeight);
      ex.el.style.gridRow = st.cols ? `1 / span ${st.typed ? 1 : st.pages.length - 1}` : '';
      ex.el.style.top = st.cols ? XL.SPLIT.PAD + st.exOff + 'px' : '';
      ex.el.style.marginTop = st.cols ? st.exOff + 'px' : '';
      // die Aufgabe zählt nicht zur Höhe: wie weit gescrollt wird, bestimmen allein die Schreibblätter
      ex.el.style.marginBottom = st.cols ? -(ex.el.offsetHeight + st.exOff) + 'px' : '';
    };
    const exTall = () => !!st.cols && st.pages[0].el.offsetHeight > scroller.clientHeight - 2 * XL.SPLIT.PAD;
    const moveEx = (dy) => { st.exOff += dy; placeEx(); };
    const layout = () => {
      st.cols = splittable && st.split && st.pages.length > 1 ? XL.splitLayout(scroller.clientWidth, scroller.clientHeight) : null;
      pagesEl.classList.toggle('split', !!st.cols); pagesEl.classList.toggle('split-r', !!st.cols && st.side === 'r');
      const W = baseWidth() * st.zoom;
      if (W > 0) {
        st.pages.forEach((p) => { const w = st.cols ? (p.i ? st.cols.sheetW : st.cols.exW) * st.zoom : W; p.el.style.width = w + 'px'; p.el.style.height = w * p.def.ratio + 'px'; });
        if (ty.el) {
          // die Schrift im Feld zoomt nicht mit; nebeneinander füllt es die Höhe neben der Aufgabe
          ty.el.style.width = (st.cols ? st.cols.sheetW : baseWidth()) + 'px';
          ty.el.style.minHeight = st.cols ? scroller.clientHeight - 2 * XL.SPLIT.PAD + 'px' : '';
          if (st.typed) ty.grow();
        }
        placeEx();
        // Einband, Falz und Ecken sind in em bemessen: 1em = 1/30 Seitenbreite
        if (st.book) { pagesEl.style.fontSize = W / 30 + 'px'; bk.ghost.style.width = W + 'px'; bk.ghost.style.height = W * A4 + 'px'; }
        else pagesEl.style.fontSize = '';
      }
      root.querySelector('[data-v=fit]').textContent = Math.round(st.zoom * 100) + '%';
    };
    if (st.book) applyMode(st.pages[(opts.page || 1) - 1]);
    layout();

    const renderPage = async (p) => {
      const W = p.el.clientWidth, H = p.el.clientHeight;
      if (!W || !H) return; // ausgeblendet (Buch, Antwortfeld): nichts zu zeichnen
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const tw = Math.round(W * dpr);
      if (p.renderedW === tw || p.busy) { drawInk(p); return; }
      p.busy = true;
      const th = Math.round(H * dpr);
      const off = document.createElement('canvas'); off.width = tw; off.height = th;
      const ctx = off.getContext('2d');
      try {
        if (p.def.kind === 'pdf') {
          const vp = p.def.page.getViewport({ scale: tw / p.def.page.getViewport({ scale: 1 }).width });
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tw, th);
          await p.def.page.render({ canvasContext: ctx, viewport: vp }).promise;
        } else if (p.def.kind === 'image') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, tw, th); ctx.drawImage(img, 0, 0, tw, th); }
        else drawPaper(ctx, tw, th, p.def.paper, st.book ? BOOK_PAPER : null);
        if (p.def.missing) { ctx.fillStyle = '#8a8d96'; ctx.font = `700 ${Math.round(tw / 40)}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText(p.def.missing, tw / 2, th / 2); }
        p.bg.width = tw; p.bg.height = th; p.bg.getContext('2d').drawImage(off, 0, 0);
        p.renderedW = tw;
        p.el.querySelector('.loading').hidden = true;
      } catch (e) { console.error(e); }
      p.busy = false;
      p.ink.width = tw; p.ink.height = th; p.live.width = tw; p.live.height = th;
      drawInk(p);
      if (p.renderedW !== Math.round(p.el.clientWidth * dpr)) renderPage(p);
    };
    // Bilder: nach dem Laden sichtbare Seiten neu zeichnen (Dekodieren/Cache übernimmt das modulweite imgEl)
    const drawInk = (p) => {
      const c = p.ink.getContext('2d');
      c.clearRect(0, 0, p.ink.width, p.ink.height);
      p.images.forEach((im) => imgEl(im, () => { if (p.visible) drawInk(p); }));
      drawImages(c, p, p.ink.width, st.moving);
      // Striche und Sticker, die gerade verschoben werden, zeichnet drawMove auf die Live-Ebene
      p.strokes.forEach((s) => { if (!st.moving || !st.moving.includes(s)) drawStroke(c, s, p.ink.width); });
    };
    const io = new IntersectionObserver((ents) => ents.forEach((en) => {
      const p = st.pages.find((x) => x.el === en.target);
      if (!p) return;
      p.visible = en.isIntersecting;
      if (en.isIntersecting) renderPage(p);
    }), { root: scroller, rootMargin: '600px 0px' });
    st.pages.forEach((p) => io.observe(p.el));
    // Sprung zu einer Seite (z. B. Treffer aus der Suche)
    if (!st.book && opts.page > 1 && st.pages[opts.page - 1]) scroller.scrollTop += st.pages[opts.page - 1].el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
    const rerender = App.debounce(() => st.pages.forEach((p) => { if (p.visible) renderPage(p); }), 250);
    // Breite ändert sich (Tablet gedreht, Sidebar, Pane war versteckt) → Seiten neu einpassen
    let lastW = scroller.clientWidth, lastH = scroller.clientHeight;
    const ro = new ResizeObserver(() => { const w = scroller.clientWidth, h = scroller.clientHeight; if (w && (w !== lastW || ((st.book || splittable) && h !== lastH))) { lastW = w; lastH = h; layout(); st.pages.forEach((p) => { if (p.visible) drawInk(p); }); rerender(); } });
    ro.observe(scroller);
    const setZoom = (z, cx, cy) => {
      z = App.clamp(z, 0.4, 4);
      const r = scroller.getBoundingClientRect();
      cx = cx ?? r.width / 2; cy = cy ?? r.height / 2;
      const fx = (scroller.scrollLeft + cx) / pagesEl.scrollWidth, fy = (scroller.scrollTop + cy) / pagesEl.scrollHeight;
      st.zoom = z; layout();
      scroller.scrollLeft = fx * pagesEl.scrollWidth - cx; scroller.scrollTop = fy * pagesEl.scrollHeight - cy;
      st.pages.forEach((p) => { if (p.visible) drawInk(p); });
      rerender();
    };

    // ---------- Eingabe ----------
    const touches = new Map();
    let pinch = null, drawing = null, exDrag = false;
    const pageAt = (x, y) => st.pages.find((p) => { const r = p.el.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
    const norm = (p, e) => { const r = p.el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.width, e.pointerType === 'pen' ? (e.pressure || 0.5) : 0.5]; };
    const eraseAt = (p, pt, act) => {
      const rad = 0.012 / st.zoom + 0.004;
      const keep = [];
      p.strokes.forEach((s) => {
        const hit = IE.erasable(s, st.marksOnly) && s.pts.some((q) => Math.hypot(q[0] - pt[0], q[1] - pt[1]) < rad + s.w / 2);
        if (hit) act.removed.push(s); else keep.push(s);
      });
      if (keep.length !== p.strokes.length) { p.strokes = keep; drawInk(p); }
      if (st.marksOnly) dropLinksAt(p, pt, rad);
    };
    // „Nur Markierungen“: über ein verknüpftes Wort wischen löst die Verknüpfung, die Schrift bleibt
    const dropLinksAt = (p, pt, rad) => {
      for (let l = HW.linkAt(p.links, pt, rad); l; l = HW.linkAt(p.links, pt, rad)) {
        const it = App.item(l.itemId);
        removeLink(p, l);
        if (it) note('Verknüpfung gelöst: ' + App.itemPlain(it));
      }
    };
    // Punkt-Radierer: nur das Stück unter der Spitze; der Kreis zeigt, wo er wirkt
    const cutAt = (p, pt) => {
      const rad = IE.radius(st.zoom);
      let changed = false;
      IE.sweep(drawing.last, pt, rad).forEach((q) => { const r = IE.cutAll(p.strokes, q, rad, st.marksOnly); if (r) { p.strokes = r; changed = true; } });
      drawing.last = pt;
      if (changed) drawInk(p);
      if (st.marksOnly) dropLinksAt(p, pt, rad);
      const c = p.live.getContext('2d'), W = p.live.width;
      c.clearRect(0, 0, W, p.live.height);
      c.save(); c.lineWidth = Math.max(1, W / p.el.clientWidth); c.strokeStyle = '#1f2430'; c.fillStyle = 'rgba(255,255,255,.6)';
      c.beginPath(); c.arc(pt[0] * W, pt[1] * W, Math.max(rad * W, 2 * c.lineWidth), 0, 7); c.fill(); c.stroke(); c.restore();
    };
    scroller.addEventListener('pointerdown', (e) => {
      if (e.target.closest && e.target.closest('[data-del]')) { e.preventDefault(); deleteSel(); return; }
      if (e.target.closest && e.target.closest('.bk-turn, .bk-ghost')) return;
      // Antwortfeld: Maus und Stift setzen die Schreibmarke und markieren Text; der Finger scrollt weiter das Blatt
      if (e.target.closest && e.target.closest('.ex-typed') && (e.pointerType !== 'touch' || e.target.closest('button'))) return;
      // laufende Blätter-Animation beenden: sie verzerrt die Seite und damit die Stiftposition
      if (st.book) $$('.flip-next, .flip-prev', pagesEl).forEach((el) => el.classList.remove('flip-next', 'flip-prev'));
      hideTip();
      const useTouchNav = e.pointerType === 'touch' && (st.penOnly || st.tool === 'hand');
      tap = useTouchNav ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp } : null;
      if (useTouchNav || st.tool === 'hand' || e.button === 1) {
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        // eine Aufgabe, die höher ist als die Fläche, wird für sich verschoben – das Blatt bleibt, wo es ist
        exDrag = touches.size === 1 && exTall() && pageAt(e.clientX, e.clientY) === st.pages[0];
        scroller.setPointerCapture(e.pointerId);
        if (touches.size === 2) {
          const [a, b] = Array.from(touches.values());
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: st.zoom };
          tap = null;
        }
        return;
      }
      if (e.button > 0 && e.pointerType === 'mouse') return;
      const p = pageAt(e.clientX, e.clientY);
      if (!p) return;
      e.preventDefault();
      scroller.setPointerCapture(e.pointerId);
      if (st.stamp) { placeSticker(p, norm(p, e)); return; }
      if (st.tool === 'select') {
        const pt = norm(p, e), cur = selImg();
        // markierte Schrift greifen: Ecke = skalieren, im Rahmen ziehen = verschieben (kleine Auswahl: kleinere Ecken, damit die Mitte greifbar bleibt)
        const sb = st.ssel && st.ssel.p === p ? st.ssel.box : null;
        const sh = sb && SEL.handleAt(sb, pt, Math.max(0.006, Math.min(0.02, Math.min(sb.w, sb.h) / 3)) / st.zoom);
        if (sh) { startScale(p, sh, pt); return; }
        if (st.ssel && st.ssel.p === p && SEL.inBox(st.ssel.box, pt, 0.01 / st.zoom)) { startMove(p, e); return; }
        const h = cur && st.sel.p === p ? II.handleAt(cur, pt, 0.02 / st.zoom, ROT_PX / p.el.clientWidth) : null;
        const im = h ? cur : II.hit(p.images, pt);
        // freie Stelle: Schrift einkreisen
        if (!im) { clearSel(); drawing = { p, lasso: [pt], pick: true }; return; }
        // Schrift auf einem Sticker/Zettel: einkreisen wie auf freiem Papier – Antippen wählt den Sticker, ein gewählter lässt sich gleich ziehen
        if (!h && im !== cur && II.inkOn(im, p.strokes)) { clearSel(); drawing = { p, lasso: [pt], pick: true, tapImg: im }; return; }
        select(p, im.id);
        drawing = { p, img: im, handle: h, start: pt, before: { x: im.x, y: im.y, w: im.w, h: im.h, r: im.r || 0 } };
        return;
      }
      if (st.tool === 'lasso') { closeHw(); drawing = { p, lasso: [norm(p, e)] }; return; }
      const erasing = st.tool === 'eraser' || st.tool === 'cut' || (e.pointerType === 'pen' && (e.buttons & 32));
      if (erasing && (st.tool === 'cut' || (st.tool !== 'eraser' && st.eraser === 'cut'))) { drawing = { p, cut: true, last: null, before: p.strokes }; cutAt(p, norm(p, e)); return; }
      if (erasing) { drawing = { p, erase: true, act: { type: 'erase', pi: p.i, removed: [] } }; eraseAt(p, norm(p, e), drawing.act); return; }
      const pt = norm(p, e);
      // Lineal: gleichmäßiger Druck, auch bei Füller und Pinsel
      const s = PEN.stroke(curPen(), pt, !st.ruler && e.pointerType !== 'pen');
      // dot: solange der Strich ein Tipper ist, steht er als Punkt auf der Live-Ebene – sofort beim Aufsetzen sichtbar
      drawing = { p, s, pid: e.pointerId, line: st.ruler ? pt : null, dot: s.t !== 'marker' };
      if (drawing.dot) drawStroke(p.live.getContext('2d'), s, p.live.width);
    });
    scroller.addEventListener('pointermove', (e) => {
      if (touches.has(e.pointerId)) {
        const prev = touches.get(e.pointerId);
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (touches.size === 1) { scroller.scrollLeft -= e.clientX - prev.x; if (exDrag) moveEx(e.clientY - prev.y); else scroller.scrollTop -= e.clientY - prev.y; }
        else if (pinch && touches.size === 2) {
          const [a, b] = Array.from(touches.values());
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          const r = scroller.getBoundingClientRect();
          setZoom(pinch.z * d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
        }
        return;
      }
      if (!drawing) { if (st.stamp) ghost(e); else if (e.pointerType !== 'touch' && !e.buttons) hoverLinks(e); return; }
      const p = drawing.p;
      if (drawing.img) {
        const pt = norm(p, e), b = drawing.before;
        if (drawing.handle === 'rot') drawing.img.r = II.angle(b, pt);
        else Object.assign(drawing.img, drawing.handle ? II.resizeTurned(b, drawing.handle, pt, KW.free(drawing.img.k) ? (o, h, q) => II.resizeFree(o, h, q, KW.min(drawing.img.k)) : II.resize) : II.move(b, pt[0] - drawing.start[0], pt[1] - drawing.start[1], p.def.ratio));
        drawInk(p); updateSel();
        return;
      }
      if (drawing.mv) {
        drawing.d = SEL.clampDelta(drawing.mv.box, (e.clientX - drawing.x) / drawing.W, (e.clientY - drawing.y) / drawing.W, drawing.area);
        drawMove();
        return;
      }
      if (drawing.sc) {
        const pt = norm(p, e);
        drawing.r = SEL.scaleAt(drawing.inner, drawing.handle, [pt[0] - drawing.off[0], pt[1] - drawing.off[1]], drawing.area);
        drawScale();
        return;
      }
      if (drawing.lasso) { drawing.lasso.push(norm(p, e)); drawLasso(p, drawing.lasso); return; }
      if (drawing.cut) { cutAt(p, norm(p, e)); return; }
      if (drawing.erase) { eraseAt(p, norm(p, e), drawing.act); return; }
      const lc = p.live.getContext('2d');
      if (drawing.line) {
        drawing.s.pts = PEN.linePts(drawing.line, PEN.straight(drawing.line, norm(p, e)));
        clearLive(p); drawStroke(lc, drawing.s, p.live.width);
        return;
      }
      const ce = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      const evs = ce.length ? ce : [e];
      const c = p.ink.getContext('2d');
      evs.forEach((ev) => drawing.s.pts.push(norm(p, ev)));
      // deckender Stift: Stück für Stück direkt aufs Blatt; alle anderen jedes Mal ganz auf der Live-Ebene
      const piecewise = drawing.s.t === 'pen' && PEN.alpha(drawing.s) >= 1;
      if (drawing.dot) {
        clearLive(p);
        if (PEN.isDot(drawing.s.pts, drawing.s.w)) { drawStroke(lc, drawing.s, p.live.width); return; }
        drawing.dot = false;
        // aus dem Tipper wird ein Strich: das bisherige Stück nachholen
        if (piecewise) { drawStroke(c, drawing.s, p.ink.width); return; }
      }
      // live zeichnen (beim deckenden Stift nur die letzten Abschnitte)
      if (drawing.s.t === 'marker') { drawInk(p); drawStroke(c, drawing.s, p.ink.width); }
      else if (piecewise) { const n = drawing.s.pts.length; drawStroke(c, { ...drawing.s, pts: drawing.s.pts.slice(Math.max(0, n - evs.length - 2)) }, p.ink.width); }
      else { clearLive(p); drawStroke(lc, drawing.s, p.live.width); }
    });
    const up = (e) => {
      if (touches.has(e.pointerId)) {
        touches.delete(e.pointerId); if (touches.size < 2) pinch = null;
        // kurzer Fingertipp auf ein verknüpftes Wort zeigt das Schildchen
        if (tap && tap.id === e.pointerId && e.type === 'pointerup' && e.timeStamp - tap.t < 500 && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10) {
          const p = pageAt(e.clientX, e.clientY), l = p && liveLinkAt(p, e, 0.006);
          if (l) showTip(p, l);
          // der Finger scrollt das Blatt (Zeiger ist eingefangen) – ein Tipp ins Antwortfeld soll trotzdem die Tastatur öffnen
          if (ty.ta && e.target.closest && document.elementFromPoint(e.clientX, e.clientY) === ty.ta) ty.ta.focus();
        }
        // Buch: mit dem Finger wischen blättert (nur uneingezoomt, sonst verschiebt der Finger den Ausschnitt)
        else if (tap && tap.id === e.pointerId && e.type === 'pointerup' && st.book && st.zoom <= 1.02) {
          const d = BK.swipeDir(e.clientX - tap.x, e.clientY - tap.y, e.timeStamp - tap.t);
          if (d) turn(d);
        }
        tap = null;
        return;
      }
      if (!drawing) return;
      const p = drawing.p;
      if (drawing.img) {
        const im = drawing.img, b = drawing.before;
        // Kanji-Feld: auf ganze Kästchen einrasten, die feste Ecke bleibt stehen
        if (drawing.handle && drawing.handle !== 'rot' && im.k) {
          const r = im.x + im.w, bt = im.y + im.h;
          Object.assign(im, KW.snap(im.k, im.w, im.h));
          if (drawing.handle[1] === 'w') im.x = r - im.w;
          if (drawing.handle[0] === 'n') im.y = bt - im.h;
        }
        ['x', 'y', 'w', 'h'].forEach((k) => { im[k] = +im[k].toFixed(4); });
        if (!im.r) delete im.r;
        if (['x', 'y', 'w', 'h'].some((k) => im[k] !== b[k]) || (im.r || 0) !== b.r) {
          st.undo.push({ type: 'img-edit', pi: p.i, id: im.id, before: b, after: { x: im.x, y: im.y, w: im.w, h: im.h, r: im.r || 0 } }); st.redo = [];
          markDirty(p);
        }
        drawInk(p); updateSel();
        drawing = null;
        return;
      }
      if (drawing.lasso) {
        const poly = drawing.lasso;
        p.live.getContext('2d').clearRect(0, 0, p.live.width, p.live.height);
        const { pick, tapImg } = drawing;
        drawing = null;
        if (tapImg && SEL.isTap(poly, 0.01 / st.zoom)) select(p, tapImg.id);
        else if (pick) pickStrokes(p, poly); else recognize(p, poly);
        return;
      }
      if (drawing.mv) { dropMove(); return; }
      if (drawing.sc) { dropScale(); return; }
      if (drawing.cut) {
        p.live.getContext('2d').clearRect(0, 0, p.live.width, p.live.height);
        // Kopie: spätere Striche hängen sich an p.strokes an und dürfen den Undo-Stand nicht verändern
        if (p.strokes !== drawing.before) { st.undo.push({ type: 'cut', pi: p.i, before: drawing.before, after: p.strokes.slice() }); st.redo = []; dirty.add(p.i); saveInk(p.i); }
      }
      else if (drawing.erase) { if (drawing.act.removed.length) { st.undo.push(drawing.act); st.redo = []; dirty.add(p.i); saveInk(p.i); } }
      else {
        const s = drawing.s;
        s.pts = s.pts.map((q) => [+q[0].toFixed(4), +q[1].toFixed(4), +q[2].toFixed(2)]);
        clearLive(p);
        p.strokes.push(s); st.undo.push({ type: 'add', pi: p.i, s }); st.redo = [];
        drawInk(p); dirty.add(p.i); saveInk(p.i);
      }
      drawing = null;
    };
    scroller.addEventListener('pointerleave', () => { clearTimeout(tipWait); tipNext = null; leaveTip(); ghost(null); });
    scroller.addEventListener('pointerup', up);
    scroller.addEventListener('pointercancel', up);
    scroller.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); const r = scroller.getBoundingClientRect(); setZoom(st.zoom * (e.deltaY < 0 ? 1.1 : 0.9), e.clientX - r.left, e.clientY - r.top); } else if (exTall() && pageAt(e.clientX, e.clientY) === st.pages[0]) { e.preventDefault(); moveEx(-e.deltaY); } }, { passive: false });

    // ---------- Bilder: Auswahl, Löschen, Einfügen ----------
    const ROT_PX = 30; // Abstand des Dreh-Griffs über dem Bild (wie in der CSS)
    const selImg = () => st.sel && st.sel.p.images.find((x) => x.id === st.sel.id);
    const updateSel = () => {
      const old = root.querySelector('.ink-sel');
      const im = selImg();
      if (!im) { st.sel = null; if (old) old.remove(); return; }
      let el = old;
      if (!el || el.parentNode !== st.sel.p.el) {
        if (old) old.remove();
        el = document.createElement('div');
        el.className = 'ink-sel';
        el.innerHTML = ['nw', 'ne', 'sw', 'se'].map((h) => `<span class="h" data-h="${h}"></span>`).join('') + `<span class="h rot" title="Drehen"></span><button class="ink-sel-del" data-del title="Bild löschen">${icon('trash')}</button>`;
        st.sel.p.el.appendChild(el);
      }
      const r = st.sel.p.def.ratio;
      Object.assign(el.style, { left: im.x * 100 + '%', top: (im.y / r) * 100 + '%', width: im.w * 100 + '%', height: (im.h / r) * 100 + '%', transform: im.r ? `rotate(${im.r}deg)` : '' });
    };
    const select = (p, id) => { clearSSel(); st.sel = { p, id }; updateSel(); };
    const clearSel = () => { st.sel = null; updateSel(); clearSSel(); };
    // ---------- Schrift: mit dem Auswahl-Werkzeug einkreisen, im Rahmen ziehen = verschieben ----------
    // st.ssel = { p, strokes, imgs, links, box }; imgs = ganz eingekreiste Sticker/Bilder, sie gehen mit. Im Buch darf die Auswahl auf die Nachbarseite der Doppelseite
    const showSSel = (pg, b) => {
      let el = root.querySelector('.ink-ssel');
      if (!el || el.parentNode !== pg.el) {
        if (el) el.remove();
        el = document.createElement('div');
        el.className = 'ink-ssel';
        el.innerHTML = ['nw', 'ne', 'sw', 'se'].map((h) => `<span class="h" data-h="${h}"></span>`).join('') + `<button class="ink-sel-del" data-del title="Auswahl löschen">${icon('trash')}</button>`;
        pg.el.appendChild(el);
      }
      const r = pg.def.ratio;
      Object.assign(el.style, { left: b.x * 100 + '%', top: (b.y / r) * 100 + '%', width: b.w * 100 + '%', height: (b.h / r) * 100 + '%' });
    };
    const clearSSel = () => { st.ssel = null; const el = root.querySelector('.ink-ssel'); if (el) el.remove(); };
    const selBox = (s, pad) => SEL.bounds(s.strokes, pad, s.imgs);
    const pickStrokes = (p, poly) => {
      const strokes = SEL.pick(p.strokes, poly), imgs = SEL.pickImages(p.images, poly);
      if (!strokes.length && !imgs.length) return;
      // nur ein Sticker eingekreist: wie Antippen, mit Drehen und eigenen Ecken
      if (!strokes.length && imgs.length === 1) { select(p, imgs[0].id); return; }
      st.ssel = { p, strokes, imgs, links: SEL.pickLinks(p.links, poly) };
      st.ssel.box = selBox(st.ssel);
      showSSel(p, st.ssel.box);
    };
    const clearLive = (pg) => pg.live.getContext('2d').clearRect(0, 0, pg.live.width, pg.live.height);
    const startMove = (p, e) => {
      const r = p.el.getBoundingClientRect();
      let other = null, off = null;
      if (st.book) {
        const sp = BK.pagesOf(st.spread, st.pages.length);
        other = st.pages[p.i === sp.l ? sp.r : sp.l] || null;
        if (other) { const o = other.el.getBoundingClientRect(); off = [(o.left - r.left) / r.width, (o.top - r.top) / r.width]; }
      }
      const area = { x0: Math.min(0, off ? off[0] : 0), x1: Math.max(1, off ? off[0] + 1 : 1), y0: 0, y1: p.def.ratio };
      drawing = { p, mv: st.ssel, x: e.clientX, y: e.clientY, W: r.width, other, off, area, d: [0, 0], host: p };
      st.moving = st.ssel.strokes.concat(st.ssel.imgs);
      drawInk(p); drawMove();
    };
    // Sticker unter der Schrift, wie auf dem Blatt
    const drawSel = (c, s, W) => {
      s.imgs.forEach((im) => { const el = imgEl(im); if (el) drawImg(c, el, im, W); });
      s.strokes.forEach((x) => drawStroke(c, x, W));
    };
    // Auswahl am Zeiger zeichnen – auf beiden Seiten der Doppelseite, damit sie über den Falz wandern kann
    const drawMove = () => {
      const { p, mv, other, off, d } = drawing;
      [[p, d[0], d[1]], other && [other, d[0] - off[0], d[1] - off[1]]].forEach((x) => {
        if (!x) return;
        const [pg, dx, dy] = x, c = pg.live.getContext('2d'), W = pg.live.width;
        clearLive(pg);
        c.save(); c.translate(dx * W, dy * W);
        drawSel(c, mv, W);
        c.restore();
      });
      const over = !!other && SEL.overOther(mv.box, d[0], off[0]);
      drawing.host = over ? other : p;
      showSSel(drawing.host, { ...mv.box, x: mv.box.x + d[0] - (over ? off[0] : 0), y: mv.box.y + d[1] - (over ? off[1] : 0) });
    };
    // Loslassen: die Auswahl landet als Ganzes auf der Seite, über der ihre Mitte liegt
    const dropMove = () => {
      const { p, mv, other, off, host } = drawing;
      let d = drawing.d;
      clearLive(p); if (other) clearLive(other);
      drawing = null; st.moving = null;
      if (host !== p) d = [d[0] - off[0], d[1] - off[1]];
      d = SEL.clampDelta(mv.box, d[0], d[1], { x0: 0, x1: 1, y0: 0, y1: host.def.ratio });
      if (host !== p || d[0] || d[1]) {
        const a = { type: 'sel-move', pi: p.i, to: host.i, strokes: mv.strokes, imgs: mv.imgs, links: mv.links, dx: d[0], dy: d[1] };
        applySelMove(a, false);
        st.undo.push(a); st.redo = [];
        st.ssel = { p: host, strokes: mv.strokes, imgs: mv.imgs, links: mv.links };
        st.ssel.box = selBox(st.ssel);
      } else drawInk(p);
      showSSel(st.ssel.p, st.ssel.box);
    };
    // Verschieben anwenden oder zurücknehmen; Verknüpfungen und Sticker, die es noch gibt, wandern mit
    const applySelMove = (a, back) => {
      const from = st.pages[back ? a.to : a.pi], to = st.pages[back ? a.pi : a.to], k = back ? -1 : 1;
      const links = a.links.filter((l) => from.links.includes(l)), imgs = (a.imgs || []).filter((im) => from.images.includes(im));
      SEL.shift(a.strokes, k * a.dx, k * a.dy); SEL.shiftBoxes(links, k * a.dx, k * a.dy); SEL.shiftBoxes(imgs, k * a.dx, k * a.dy);
      if (from !== to) {
        from.strokes = from.strokes.filter((s) => !a.strokes.includes(s)); to.strokes = to.strokes.concat(a.strokes);
        from.links = from.links.filter((l) => !links.includes(l)); to.links = to.links.concat(links);
        from.images = from.images.filter((im) => !imgs.includes(im)); to.images = to.images.concat(imgs);
      }
      new Set([from, to]).forEach((pg) => { drawInk(pg); renderLinks(pg); markDirty(pg); });
    };
    // ---------- Schrift skalieren: an einer Ecke des Rahmens ziehen; bleibt auf der eigenen Seite ----------
    const startScale = (p, handle, pt) => {
      // gerechnet wird mit dem Rahmen ohne Rand, so bleibt die Gegenecke genau stehen; off = Abstand Zeiger–Ecke beim Greifen
      const b = selBox(st.ssel, 0), off = [pt[0] - (b.x + (handle[1] === 'e' ? b.w : 0)), pt[1] - (b.y + (handle[0] === 's' ? b.h : 0))];
      drawing = { p, sc: st.ssel, handle, off, inner: b, area: { x0: 0, x1: 1, y0: 0, y1: p.def.ratio }, r: { k: 1, fx: 0, fy: 0 } };
      st.moving = st.ssel.strokes.concat(st.ssel.imgs);
      drawInk(p); drawScale();
    };
    const drawScale = () => {
      const { p, sc, inner, r } = drawing, c = p.live.getContext('2d'), W = p.live.width;
      clearLive(p);
      c.save(); c.translate(r.fx * W, r.fy * W); c.scale(r.k, r.k); c.translate(-r.fx * W, -r.fy * W);
      drawSel(c, sc, W);
      c.restore();
      // Rahmen wie nach dem Loslassen: skalierte Schrift plus fester Rand
      const g = [{ ...inner }]; SEL.scaleBoxes(g, r.k, r.fx, r.fy);
      showSSel(p, { x: g[0].x - SEL.PAD, y: g[0].y - SEL.PAD, w: g[0].w + 2 * SEL.PAD, h: g[0].h + 2 * SEL.PAD });
    };
    const dropScale = () => {
      const { p, sc, r } = drawing;
      clearLive(p); drawing = null; st.moving = null;
      if (r.k !== 1) {
        // Verknüpfungen und Sticker sind beides Rahmen { x, y, w, h } – sie skalieren gleich
        const links = sc.links.filter((l) => p.links.includes(l)), boxes = links.concat(sc.imgs.filter((im) => p.images.includes(im)));
        const a = { type: 'sel-scale', pi: p.i, strokes: sc.strokes, links, boxes, before: SEL.snap(sc.strokes, boxes) };
        SEL.scale(sc.strokes, r.k, r.fx, r.fy); SEL.scaleBoxes(boxes, r.k, r.fx, r.fy);
        a.after = SEL.snap(sc.strokes, boxes);
        st.undo.push(a); st.redo = [];
        st.ssel = { ...sc, box: selBox(sc) };
        renderLinks(p); markDirty(p);
      }
      drawInk(p); showSSel(p, st.ssel.box);
    };
    const deleteSel = () => {
      if (st.ssel) {
        const { p, strokes, imgs } = st.ssel;
        // Sticker mit ihrem Platz in der Reihenfolge merken, damit Rückgängig sie wieder an dieselbe Stelle legt
        const gone = imgs.map((im) => ({ im, idx: p.images.indexOf(im) })).filter((x) => x.idx >= 0);
        p.strokes = p.strokes.filter((s) => !strokes.includes(s));
        p.images = p.images.filter((im) => !imgs.includes(im));
        st.undo.push(gone.length ? { type: 'sel-del', pi: p.i, removed: strokes, imgs: gone } : { type: 'erase', pi: p.i, removed: strokes }); st.redo = [];
        clearSSel(); drawInk(p); markDirty(p);
        return;
      }
      const im = selImg(); if (!im) return;
      const p = st.sel.p, idx = p.images.indexOf(im);
      p.images.splice(idx, 1);
      st.undo.push({ type: 'img-del', pi: p.i, im, idx }); st.redo = [];
      clearSel(); drawInk(p); markDirty(p);
    };
    // ---------- Wort-Verknüpfungen: Schildchen mit Lesung und Bedeutung (Stift/Maus darüber halten, Finger antippen) ----------
    const HW = App.hwLogic;
    let tap = null, tip = null, tipFor = null, tipWait = 0, tipHide = 0, tipNext = null;
    const liveLinkAt = (p, e, pad = 0) => HW.linkAt(p.links.filter((l) => App.item(l.itemId)), norm(p, e), pad);
    const hideTip = () => {
      clearTimeout(tipWait); clearTimeout(tipHide); tipHide = 0; tipNext = null; tipFor = null;
      if (tip) { tip.remove(); tip = null; }
    };
    const leaveTip = () => { if (tip && !tipHide) tipHide = setTimeout(hideTip, 350); };
    const showTip = (p, l) => {
      const it = App.item(l.itemId);
      hideTip();
      if (!it) return;
      tipFor = l;
      tip = document.createElement('div');
      tip.className = 'ink-tip card ' + App.SECTIONS[it.type].cls;
      tip.innerHTML = `${App.wordTipHtml(it)}<span class="ink-tip-acts"><button class="btn btn-sm btn-ghost" data-tip="open">Öffnen</button><button class="btn btn-sm btn-ghost" data-tip="del">Lösen</button></span>`;
      Object.assign(tip.style, { left: App.clamp(l.x, 0.01, 0.6) * 100 + '%', top: ((l.y + l.h) / p.def.ratio) * 100 + '%' });
      tip.addEventListener('pointerdown', (e) => e.stopPropagation());
      tip.addEventListener('pointerenter', () => { clearTimeout(tipHide); tipHide = 0; });
      tip.addEventListener('pointerleave', leaveTip);
      tip.addEventListener('click', (e) => {
        const b = e.target.closest('[data-tip]'); if (!b) return;
        if (b.dataset.tip === 'del') { removeLink(p, l); return; }
        hideTip();
        if (!embedded) close();
        App.go(App.link(it));
      });
      p.el.appendChild(tip);
    };
    const hoverLinks = (e) => {
      if (e.target.closest && e.target.closest('.ink-tip')) return;
      const p = pageAt(e.clientX, e.clientY);
      const l = p && p.links.length ? liveLinkAt(p, e) : null;
      if (!l) { clearTimeout(tipWait); tipNext = null; leaveTip(); return; }
      if (l === tipFor) { clearTimeout(tipHide); tipHide = 0; return; }
      if (l === tipNext) return;
      // kurz warten: beim Schreiben über ein Wort hinweg soll nichts aufspringen
      clearTimeout(tipWait); tipNext = l;
      tipWait = setTimeout(() => { tipNext = null; showTip(p, l); }, 300);
    };
    const itemLinked = (itemId) => st.pages.some((p) => p.links.some((l) => l.itemId === itemId));
    const removeLink = (p, l) => {
      p.links = p.links.filter((x) => x !== l);
      hideTip(); renderLinks(p); markDirty(p);
      // letzte Stelle dieses Wortes auf dem Blatt gelöst → auch aus dem Eintrag/der Stunde nehmen
      if (opts.onUnlinkWord && !itemLinked(l.itemId)) opts.onUnlinkWord(l.itemId);
    };
    // Verknüpfung in der Seitenleiste entfernt → Markierungen dieses Wortes vom Blatt nehmen
    const dropLinks = (itemId) => {
      hideTip();
      st.pages.forEach((p) => { if (p.links.some((l) => l.itemId === itemId)) { p.links = p.links.filter((l) => l.itemId !== itemId); renderLinks(p); markDirty(p); } });
    };
    // Zuletzt eingekreistes Wort (Seite + Rahmen) – Ziel für „Verknüpfen“ im Nachschlagen-Fenster
    let hwSel = null;
    const linkWord = async (r) => {
      const sel = hwSel;
      if (!sel) return;
      const it = await opts.onLinkWord(r);
      if (!it || destroyed) return;
      sel.p.links = HW.addLink(sel.p.links, { id: II.newId(), itemId: it.id, ...sel.box });
      renderLinks(sel.p); markDirty(sel.p);
      closeHw();
      if (root._lookup) root._lookup.close();
      note('Verknüpft: ' + App.itemPlain(it));
    };
    const lookupOpts = () => ({ onLink: opts.onLinkWord && hwSel ? linkWord : null });

    // ---------- Erkennen: eingekreiste Striche an den Handschrift-Dienst, Vorschlag antippen = nachschlagen ----------
    let hwRun = 0;
    const closeHw = () => { hwRun++; hwSel = null; const el = root.querySelector('.hw-pop'); if (el) el.remove(); if (root._lookup) root._lookup.setLink(null); };
    const drawLasso = (p, pts) => {
      const c = p.live.getContext('2d'), W = p.live.width, k = W / p.el.clientWidth;
      c.clearRect(0, 0, W, p.live.height);
      c.save();
      c.strokeStyle = '#2b8a8f'; c.lineWidth = 2 * k; c.setLineDash([6 * k, 5 * k]); c.lineJoin = 'round';
      c.beginPath();
      pts.forEach((q, i) => (i ? c.lineTo(q[0] * W, q[1] * W) : c.moveTo(q[0] * W, q[1] * W)));
      c.closePath(); c.stroke();
      c.restore();
    };
    const recognize = async (p, poly) => {
      const sel = HW.strokesInLasso(p.strokes, poly);
      if (!sel.length) { note('Nichts eingekreist'); return; }
      if (sel.length > HW.MAX_STROKES) { note('Zu viel eingekreist – bitte ein Wort'); return; }
      if (!(await App.hw.consent('Zum Erkennen werden die eingekreisten Striche an Google gesendet (nur die Linien dieses Wortes, nicht die Seite). Einverstanden?'))) return;
      closeHw();
      const run = hwRun;
      hwSel = { p, box: HW.wordBox(sel) };
      let x0 = Infinity, y1 = -Infinity;
      sel.forEach((s) => s.pts.forEach((q) => { x0 = Math.min(x0, q[0]); y1 = Math.max(y1, q[1]); }));
      const pop = document.createElement('div');
      pop.className = 'hw-pop card';
      pop.innerHTML = '<span class="muted">…</span>';
      Object.assign(pop.style, { left: App.clamp(x0, 0.01, 0.55) * 100 + '%', top: (y1 / p.def.ratio) * 100 + '%' });
      pop.addEventListener('pointerdown', (e) => e.stopPropagation());
      pop.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-hw]');
        if (chip) App.lookup.open(root, chip.dataset.hw, lookupOpts());
        else if (e.target.closest('[data-hwclose]')) closeHw();
      });
      p.el.appendChild(pop);
      const { ja, de } = await App.hw.recognize(sel);
      if (run !== hwRun || !pop.isConnected) return; // inzwischen geschlossen oder neues Lasso
      const chips = (list, cls) => (list.length ? `<div class="hw-row ${cls}">${list.map((t) => `<button class="chip" data-hw="${esc(t)}">${esc(t)}</button>`).join('')}</div>` : '');
      // nichts erkannt oder kein Netz: trotzdem markieren können – Wort/Grammatik im Nachschlagen-Fenster selbst eintippen
      const none = !ja.length && !de.length ? '<div class="small muted">Nicht erkannt</div>' : '';
      pop.innerHTML = `<div class="hw-list">${none}${chips(ja, 'hw-ja')}${chips(de, 'hw-de')}<div class="hw-row hw-self"><button class="chip" data-hw="">${icon('edit')} Selbst eingeben</button></div></div><button class="icon-btn sm" data-hwclose title="Schließen">${icon('close')}</button>`;
    };
    const setTool = (t) => {
      closeHw();
      if (t !== 'select') clearSel();
      st.tool = t;
      if (t === 'eraser' || t === 'cut') st.eraser = t;
      $$('[data-tool]', root).forEach((b) => b.classList.toggle('active', b.dataset.tool === t));
      drawPens(); closePenPop();
      setStamp(null);
    };
    // eigenen Stift wählen und als zuletzt benutzten merken (auch nach Neustart, Einstellung inkPens.last)
    const setPen = (id) => {
      st.penId = id; syncColors(); setTool('ink'); savePens();
    };
    // neuer Stift = Kopie des gewählten, gleich daneben, und sofort zum Einstellen offen
    const newPen = () => {
      if (pens.list.length >= PEN.MAX_PENS) return;
      const p = PEN.copyPen(pens.list, curPen());
      pens.list.splice(pens.list.indexOf(curPen()) + 1, 0, p);
      setPen(p.id); togglePenPop();
    };
    // ---------- Sticker: wählen, dann aufs Blatt tippen ----------
    // „Normal“ landet als Striche in Stift- und Markerfarbe, „Kawaii“ (st.stamp = 'k:…') als buntes Bild, das sich wie ein eingefügtes Bild verschieben und skalieren lässt
    let ghostP = null;
    const kawaii = () => (st.stamp && st.stamp.startsWith('k:') ? st.stamp.slice(2) : null);
    const stickerAt = (p, pt) => STK.strokes(st.stamp, { x: pt[0], y: pt[1], pageH: p.def.ratio, color: st.color, mcolor: st.mcolor });
    // Vorschau unter Stift/Maus, solange ein Sticker gewählt ist
    const ghost = (e) => {
      const p = e && st.stamp && e.pointerType !== 'touch' ? pageAt(e.clientX, e.clientY) : null;
      if (ghostP && ghostP !== p) clearLive(ghostP);
      ghostP = p;
      if (!p) return;
      const c = p.live.getContext('2d');
      clearLive(p);
      c.save(); c.globalAlpha = 0.45;
      if (kawaii()) {
        const b = KW.place(kawaii(), norm(p, e), p.def.ratio), W = p.live.width;
        const el = imgEl({ id: 'ghost:' + st.stamp, ...b });
        if (el) c.drawImage(el, b.x * W, b.y * W, b.w * W, b.h * W);
      } else stickerAt(p, norm(p, e)).forEach((s) => drawStroke(c, s, p.live.width));
      c.restore();
    };
    const setStamp = (id) => {
      st.stamp = id || null;
      root.querySelector('[data-v=sticker]').classList.toggle('active', !!st.stamp);
      const pop = root.querySelector('.stk-pop'); if (pop) pop.remove();
      if (!st.stamp) ghost(null);
    };
    const placeSticker = (p, pt) => {
      if (kawaii()) {
        const im = { id: II.newId(), ...KW.place(kawaii(), pt, p.def.ratio) };
        p.images.push(im);
        st.undo.push({ type: 'img-add', pi: p.i, im }); st.redo = [];
        drawInk(p); markDirty(p);
        setTool('select'); select(p, im.id);
        return;
      }
      const strokes = stickerAt(p, pt);
      setStamp(null);
      p.strokes = p.strokes.concat(strokes);
      st.undo.push({ type: 'add-many', pi: p.i, strokes }); st.redo = [];
      drawInk(p); markDirty(p);
    };
    const toggleStickers = (btn) => {
      if (root.querySelector('.stk-pop') || st.stamp) { setStamp(null); return; }
      const pop = document.createElement('div');
      pop.className = 'stk-pop card';
      // Reiter: Zettel (Merkzettel, Kanji-Feld, Banner) und drei Sticker-Stufen: Kawaii (mit Gesichtern), Süß (bunt, ohne Gesichter), Normal (Kritzel in Stiftfarbe)
      const kw = (t) => KW.tab(t).map((s) => `<button class="stk" data-stk="k:${s.id}" title="${esc(s.label)}"><img src="${KW.src({ k: s.id, w: s.w, h: s.h })}" alt="" loading="lazy"><span>${esc(s.label)}</span></button>`).join('');
      const fill = () => {
        const tab = ['zettel', 'kawaii', 'suess', 'normal'].includes(App.lsGet('stkTab')) ? App.lsGet('stkTab') : 'kawaii';
        pop.innerHTML = `<div class="stk-tabs">${[['zettel', 'Zettel'], ['kawaii', 'Kawaii'], ['suess', 'Süß'], ['normal', 'Normal']].map(([t, l]) => `<button class="chip ${tab === t ? 'on' : ''}" data-stk-tab="${t}">${l}</button>`).join('')}</div>`
          + (tab !== 'normal' ? kw(tab)
            : STK.LIST.map((s) => `<button class="stk" data-stk="${s.id}" title="${esc(s.label)}">${STK.svg(s.id, st.mcolor)}<span>${esc(s.label)}</span></button>`).join(''));
      };
      fill();
      root.appendChild(pop);
      const r = btn.getBoundingClientRect(), rr = root.getBoundingClientRect();
      pop.style.left = Math.max(8, Math.min(r.left - rr.left - 80, rr.width - pop.offsetWidth - 8)) + 'px';
      pop.style.top = r.bottom - rr.top + 6 + 'px';
      pop.addEventListener('click', (e) => { const t = e.target.closest('[data-stk-tab]'); if (t) { App.lsSet('stkTab', t.dataset.stkTab); fill(); return; } const b = e.target.closest('[data-stk]'); if (b) { setStamp(b.dataset.stk); note('Jetzt auf die Stelle im Blatt tippen'); } });
    };
    // Zielseite = größte sichtbare Fläche; Bild mittig im sichtbaren Ausschnitt
    const insertImage = async (blob) => {
      let bmp;
      try { bmp = await createImageBitmap(blob); } catch (e) { note('Bild konnte nicht gelesen werden'); return; }
      const sz = II.fitSize(bmp.width, bmp.height, II.MAX_PX);
      const cv = document.createElement('canvas'); cv.width = sz.w; cv.height = sz.h;
      cv.getContext('2d').drawImage(bmp, 0, 0, sz.w, sz.h);
      if (bmp.close) bmp.close();
      const src = cv.toDataURL('image/webp', 0.9);
      const sr = scroller.getBoundingClientRect();
      let best = null;
      st.pages.forEach((p) => {
        const r = p.el.getBoundingClientRect();
        const vx = Math.max(r.left, sr.left), vy = Math.max(r.top, sr.top);
        const w = Math.min(r.right, sr.right) - vx, h = Math.min(r.bottom, sr.bottom) - vy;
        if (w > 0 && h > 0 && (!best || w * h > best.w * best.h)) best = { p, r, vx, vy, w, h };
      });
      if (!best) return;
      const { p, r } = best, W = r.width;
      const view = { x: (best.vx - r.left) / W, y: (best.vy - r.top) / W, w: best.w / W, h: best.h / W, pageH: p.def.ratio };
      const im = { id: II.newId(), src, ...II.place(sz.w, sz.h, view) };
      p.images.push(im);
      st.undo.push({ type: 'img-add', pi: p.i, im }); st.redo = [];
      drawInk(p); markDirty(p);
      setTool('select'); select(p, im.id);
    };
    // Knopf: Zwischenablage lesen, sonst Datei wählen
    const pickImage = async () => {
      try {
        for (const it of await navigator.clipboard.read()) {
          const t = it.types.find((x) => x.startsWith('image/'));
          if (t) { insertImage(await it.getType(t)); return; }
        }
        note('Kein Bild in der Zwischenablage');
      } catch (e) { /* keine Berechtigung → Dateiauswahl */ }
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => { if (inp.files[0]) insertImage(inp.files[0]); };
      inp.click();
    };
    const markDirty = (p) => { dirty.add(p.i); saveInk(); };
    const doUndo = (from, to) => {
      const a = from.pop(); if (!a) return;
      const p = st.pages[a.pi];
      const back = from === st.undo;
      clearSSel();
      if (a.type === 'add') { if (back) p.strokes = p.strokes.filter((x) => x !== a.s); else p.strokes.push(a.s); }
      else if (a.type === 'add-many') { if (back) p.strokes = p.strokes.filter((x) => !a.strokes.includes(x)); else p.strokes = p.strokes.concat(a.strokes); }
      else if (a.type === 'erase') { if (back) p.strokes = p.strokes.concat(a.removed); else p.strokes = p.strokes.filter((x) => !a.removed.includes(x)); }
      else if (a.type === 'cut') p.strokes = (back ? a.before : a.after).slice();
      else if (a.type === 'img-add') { if (back) p.images = p.images.filter((x) => x !== a.im); else p.images.push(a.im); }
      else if (a.type === 'img-del') { if (back) p.images.splice(Math.min(a.idx, p.images.length), 0, a.im); else p.images = p.images.filter((x) => x !== a.im); }
      else if (a.type === 'sel-move') applySelMove(a, back);
      else if (a.type === 'sel-del') {
        const ims = a.imgs.map((x) => x.im);
        if (back) { p.strokes = p.strokes.concat(a.removed); a.imgs.forEach((x) => p.images.splice(Math.min(x.idx, p.images.length), 0, x.im)); }
        else { p.strokes = p.strokes.filter((x) => !a.removed.includes(x)); p.images = p.images.filter((x) => !ims.includes(x)); }
      }
      else if (a.type === 'sel-scale') { SEL.restore(a.strokes, a.boxes || a.links, back ? a.before : a.after); renderLinks(p); }
      else if (a.type === 'img-edit') { const im = p.images.find((x) => x.id === a.id); if (im) Object.assign(im, back ? a.before : a.after); }
      to.push(a); drawInk(p); markDirty(p); updateSel();
    };

    // ---------- Toolbar ----------
    let destroyed = false;
    const destroy = () => {
      if (destroyed) return;
      destroyed = true;
      INK.lastState = { fileId: f.id, defaultTool: st.tool, eraser: st.eraser, penId: st.penId, marksOnly: st.marksOnly };
      flushAll(); if (ty.flush) ty.flush(); io.disconnect(); ro.disconnect();
      // Bild-Cache dieser Datei freigeben (sonst wächst er mit jedem geöffneten Blatt)
      st.pages.forEach((p) => (p.images || []).forEach((im) => imgCache.delete(im.id)));
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('paste', onPaste);
      if (root._lookup) root._lookup.close();
      closeHw(); hideTip();
      window.removeEventListener('pagehide', flushAll);
      document.removeEventListener('visibilitychange', onHide);
      root.innerHTML = '';
      root.classList.remove('ink-embed');
      if (!embedded) { document.body.style.overflow = ''; App.emit('files'); }
    };
    const close = () => { if (opts.onClose) opts.onClose(); else destroy(); };
    // Tasten/Einfügen nur, wenn diese Schreibfläche gemeint ist (kein Modal, kein Eingabefeld, nicht unter dem Vollbild, sichtbar)
    const inactive = (e) => $('.modal-back') || (e.target.matches && e.target.matches('input, textarea, select, [contenteditable="true"]'))
      || (e.target.closest && e.target.closest('.lookup-pop')) || (embedded && $('.viewer')) || !root.getClientRects().length;
    const onPaste = (e) => {
      if (inactive(e)) return;
      const it = Array.from((e.clipboardData && e.clipboardData.items) || []).find((x) => x.type.startsWith('image/'));
      if (!it) return;
      e.preventDefault();
      insertImage(it.getAsFile());
    };
    document.addEventListener('paste', onPaste);
    const onKey = (e) => {
      // Escape schließt zuerst das Nachschlagen-Fenster (auch wenn der Fokus auf einem seiner Knöpfe oder auf der Seite liegt)
      if (e.key === 'Escape' && root._lookup && !$('.modal-back') && !(embedded && $('.viewer'))) { root._lookup.close(); return; }
      if (inactive(e)) return;
      if (e.key === 'Escape' && (st.stamp || root.querySelector('.stk-pop'))) { setStamp(null); return; }
      if ((st.sel || st.ssel) && e.key === 'Escape') { clearSel(); return; }
      if (e.key === 'Escape' && root.querySelector('.hw-pop')) { closeHw(); return; }
      if ((st.sel || st.ssel) && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); deleteSel(); return; }
      if (e.key === 'Escape' && !embedded) close();
      if (st.book && (e.key === 'ArrowRight' || e.key === 'PageDown')) { e.preventDefault(); turn(1); }
      if (st.book && (e.key === 'ArrowLeft' || e.key === 'PageUp')) { e.preventDefault(); turn(-1); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); doUndo(st.undo, st.redo); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); doUndo(st.redo, st.undo); }
    };
    document.addEventListener('keydown', onKey);
    const setTyped = (on) => {
      st.typed = on; App.saveSettings({ exTyped: on });
      clearSel(); closeHw(); hideTip();
      applyTyped(); st.exOff = 0; scroller.scrollTop = 0; layout();
      // die Blätter waren ausgeblendet und sind vielleicht noch nie gezeichnet worden
      st.pages.forEach((p) => { if (!p.el.hidden) renderPage(p); });
      if (on) ty.ta.focus();
    };
    const morePop = root.querySelector('.more-pop');
    root.addEventListener('pointerdown', (e) => { if (!morePop.hidden && !e.target.closest('.more-pop, [data-v=more]')) morePop.hidden = true; }, true);
    root.querySelector('.viewer-bar').addEventListener('click', async (e) => {
      const t = e.target.closest('[data-tool]');
      if (t) { setTool(t.dataset.tool); return; }
      // eigener Stift: antippen wählt ihn, nochmal antippen öffnet das Einstellfenster
      const pn = e.target.closest('[data-pen]');
      if (pn) { if (st.tool === 'ink' && st.penId === pn.dataset.pen) togglePenPop(); else { closePenPop(); setPen(pn.dataset.pen); } return; }
      if (e.target.closest('[data-pen-new]')) { closePenPop(); newPen(); return; }
      const x = e.target.closest('[data-x]');
      if (x) { const t = (opts.extraTools || []).find((y) => y.id === x.dataset.x); morePop.hidden = true; if (t) t.onClick(); return; }
      const v = e.target.closest('[data-v]'); if (!v) return;
      const a = v.dataset.v;
      // „Mehr“-Menü: klappt auf den Knopf auf und nach jeder Wahl wieder zu – nur beim Zoomen bleibt es offen
      if (a === 'more') morePop.hidden = !morePop.hidden;
      else if (!['zin', 'zout', 'fit'].includes(a)) morePop.hidden = true;
      if (a === 'close') close();
      if (a === 'details') App.editFileMeta(f, { onSave: () => { $$('[data-title]', root).forEach((el) => { el.textContent = f.name; }); } });
      if (a === 'full') { flushAll(); opts.onFullscreen(); }
      if (a === 'undo') doUndo(st.undo, st.redo);
      if (a === 'redo') doUndo(st.redo, st.undo);
      if (a === 'zin') setZoom(st.zoom * 1.2);
      if (a === 'zout') setZoom(st.zoom / 1.2);
      if (a === 'fit') setZoom(1);
      if (a === 'penonly') {
        st.penOnly = !st.penOnly; v.querySelector('[data-state]').textContent = st.penOnly ? 'an' : 'aus'; App.saveSettings({ penOnly: st.penOnly });
        root.querySelector('[data-tool=hand]').hidden = st.penOnly;
        if (st.penOnly && st.tool === 'hand') setTool('ink');
        note(st.penOnly ? 'Nur der Stift schreibt – mit dem Finger scrollen & zoomen' : 'Finger schreibt jetzt auch');
      }
      if (a === 'marksonly') {
        st.marksOnly = !st.marksOnly; v.querySelector('[data-state]').textContent = st.marksOnly ? 'an' : 'aus';
        $$('[data-tool=eraser], [data-tool=cut]', root).forEach((b) => b.classList.toggle('marks-only', st.marksOnly));
        // gleich zum Radierer greifen, damit man direkt loslegen kann
        if (st.marksOnly && st.tool !== 'eraser' && st.tool !== 'cut') setTool(st.eraser);
        note(st.marksOnly ? 'Radierer löst nur Verknüpfungen und Textmarker – die Schrift bleibt' : 'Radierer nimmt wieder alles weg');
      }
      if (a === 'addpage') addPage();
      if (a === 'paper') changePaper();
      if (a === 'book') {
        const page = st.book ? st.pages[BK.pagesOf(st.spread, st.pages.length).l] : topPage();
        st.book = !st.book; v.classList.toggle('btn-sec', st.book); App.saveSettings({ inkBook: st.book });
        clearSel(); closeHw(); hideTip();
        applyMode(page); layout(); fillSpread();
        if (!st.book && page) scroller.scrollTop += page.el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 12;
        st.pages.forEach((p) => { if (p.visible) renderPage(p); });
        if (st.book) note('Blättern: Ecken unten, Pfeiltasten oder mit dem Finger wischen', 3200);
      }
      if (a === 'split' || a === 'swap') {
        if (a === 'split') st.split = !st.split; else st.side = st.side === 'r' ? 'l' : 'r';
        App.saveSettings({ exSplit: st.split, exSide: st.side });
        root.querySelector('[data-v=split]').classList.toggle('btn-sec', st.split);
        root.querySelector('[data-v=swap]').hidden = !st.split;
        closeHw(); hideTip();
        st.exOff = 0; layout();
        st.pages.forEach((p) => { if (p.visible) renderPage(p); });
        if (st.split && !st.cols) note('Nebeneinander gibt es im Querformat – hochkant bleibt die Aufgabe über dem Blatt', 3200);
      }
      if (a === 'typed') setTyped(!st.typed);
      if (a === 'print') printAll();
      if (a === 'help') { morePop.hidden = true; App.tour.start('blatt'); }
      if (a === 'delete' && await App.confirm(`„${f.name}“ endgültig löschen? Auch alles, was du darauf geschrieben hast.`)) {
        dirty.clear(); ty.dirty = false; // beim Schließen nichts mehr zurückschreiben
        close();
        await App.deleteFile(f.id);
        App.toast('Gelöscht');
      }
      if (a === 'image') pickImage();
      if (a === 'sticker') toggleStickers(v);
      if (a === 'ruler') {
        st.ruler = !st.ruler; v.classList.toggle('active', st.ruler);
        if (st.ruler && st.tool !== 'ink') setTool('ink');
        if (st.ruler) note('Lineal an: alle Stifte ziehen gerade Linien');
      }
      if (a === 'lookup') App.lookup.open(root, '', lookupOpts());
      if (a === 'vocab') App.importVocab({ fileId: f.id });
    });

    // fill: Plan zum Auffüllen einer halben Doppelseite – die aufgeschlagene Doppelseite bleibt stehen
    const addPage = async (fill) => {
      const last = st.pages[st.pages.length - 1];
      // Im Buch: eine Doppelseite hat immer ein Papier – ganze Doppelseite anhängen oder die rechte Seite passend auffüllen
      const plan = fill || (st.book ? BK.addPlan(st.pages.length) : { count: 1, like: null });
      const paper = plan.like != null ? st.pages[plan.like].def.paper
        : await INK.pickPaper({ title: st.book ? 'Leere Doppelseite anhängen' : 'Leere Seite anhängen', current: (last && last.def.paper) || f.paper || 'lines' });
      if (!paper || destroyed) return;
      const added = [];
      for (let k = 0; k < plan.count; k++) {
        UL.appendPaper(f, paper, kind === 'notebook');
        added.push(buildPage({ kind: 'paper', ratio: A4, paper, extra: kind !== 'notebook' }, st.pages.length));
      }
      await App.updateFile(f);
      const pg = added[0];
      if (st.book) { const d = fill ? 0 : BK.spreadOf(pg.i) - st.spread; st.spread += d; showSpread(d); }
      layout(); added.forEach((p) => io.observe(p.el));
      if (!st.book) pg.el.scrollIntoView({ behavior: 'smooth' });
    };
    // Im Buch gibt es keine halbe Doppelseite: die fehlende rechte Seite bekommt gleich das Papier der linken
    const fillSpread = () => { const plan = st.book && BK.fillPlan(st.pages.length); if (plan) addPage(plan); };

    // Drucken / als PDF speichern
    const printAll = async () => {
      note('Seiten werden vorbereitet …', 4000);
      let pr = $('#print-root');
      if (!pr) { pr = document.createElement('div'); pr.id = 'print-root'; document.body.appendChild(pr); }
      pr.innerHTML = '';
      const W = 1240;
      for (const p of st.pages) {
        const H = Math.round(W * p.def.ratio);
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
        if (p.def.kind === 'pdf') await p.def.page.render({ canvasContext: ctx, viewport: p.def.page.getViewport({ scale: W / p.def.page.getViewport({ scale: 1 }).width }) }).promise;
        else if (p.def.kind === 'image') ctx.drawImage(img, 0, 0, W, H);
        else drawPaper(ctx, W, H, p.def.paper);
        for (const im of p.images) { imgEl(im); try { await imgCache.get(im.id).decode(); } catch (e) { /* kaputtes Bild auslassen */ } }
        drawImages(ctx, p, W);
        p.strokes.forEach((s) => drawStroke(ctx, s, W));
        const im = document.createElement('img'); im.src = cv.toDataURL('image/jpeg', 0.9); pr.appendChild(im);
      }
      setTimeout(() => { window.print(); }, 300);
      App.toast('Tipp: Drucker „Microsoft Print to PDF“ wählen, um die Hausaufgabe als PDF zu speichern.');
    };

    // Papier einer vorhandenen Seite wechseln. Gemeint ist das Schreibblatt, das gerade oben zu sehen ist; steht dort
    // die Buchaufgabe/PDF-Seite, das nächste (sichtbare) Schreibblatt dahinter – der Dialog nennt die Seite. Im Buch die ganze Doppelseite.
    const changePaper = async () => {
      const isPaper = (p) => p && p.def.kind === 'paper' && (kind === 'notebook' || p.def.extra);
      let targets;
      if (st.book) { const { l, r } = BK.pagesOf(st.spread, st.pages.length); targets = [st.pages[l], st.pages[r]].filter(isPaper); }
      else {
        const top = topPage(); const sheets = st.pages.filter(isPaper);
        const after = sheets.filter((p) => top && p.i >= top.i);
        targets = [isPaper(top) ? top : after.find((p) => p.visible) || after[0] || sheets[sheets.length - 1]].filter(Boolean);
      }
      if (!targets.length) { note('Hier gibt es noch kein Schreibblatt – mit „Leere Seite anhängen“ kommt eines dazu', 3200); return; }
      const paper = await INK.pickPaper({ title: st.book ? 'Papier dieser Doppelseite' : `Papier von Seite ${targets[0].i + 1}`, current: targets[0].def.paper });
      if (!paper || destroyed) return;
      const firstExtra = st.pages.findIndex((p) => p.def.extra);
      targets.forEach((p) => {
        UL.setPaper(f, kind === 'notebook' ? p.i : p.i - firstExtra, paper, kind === 'notebook');
        p.def.paper = paper; p.renderedW = 0;
        if (p.visible) renderPage(p);
      });
      if (!st.book && !targets[0].visible) targets[0].el.scrollIntoView({ behavior: 'smooth' });
      await App.updateFile(f);
      // Buchaufgaben: der nächste Versuch beginnt mit dem zuletzt gewählten Papier
      if (f.exerciseId) App.saveSettings({ exercisePaper: paper });
    };

    if (!st.pages.length && !pagesEl.children.length) pagesEl.innerHTML = '<div class="card">Keine Seiten.</div>';
    ready = true;
    fillSpread();
    if (st.penOnly && !embedded) note('✍ Stift schreibt · Finger scrollt & zoomt');
    return { flush: flushAll, destroy, dropLinks, state: () => ({ defaultTool: st.tool, eraser: st.eraser, penId: st.penId, marksOnly: st.marksOnly }) };
  };

  // Markierungen eines Wortes von einem Blatt nehmen, das gerade nicht geöffnet ist (direkt im Speicher)
  INK.dropLinks = async (fileId, itemId) => {
    for (const row of (await App.db.all('ink')).filter((r) => r.fileId === fileId && (r.links || []).some((l) => l.itemId === itemId))) {
      row.links = row.links.filter((l) => l.itemId !== itemId);
      await App.db.put('ink', row);
    }
  };

  // ---------- Vollbild-Viewer ----------
  // opts: Werkzeug-Zustand übernehmen (defaultTool, eraser, penId, marksOnly)
  // Gehört das Blatt zu einer Stunde, einer Antwort/einem Tagebucheintrag oder einer Buchaufgabe, kommen „Neue Vokabel …“ und
  // „Erkennen → verknüpfen“ von selbst mit (App.sheetLinkOpts, writearea.js) – außer der Aufrufer bringt sie schon mit
  INK.open = async (fileId, opts = {}) => {
    const root = document.createElement('div');
    $('#overlay-root').appendChild(root);
    const home = (!opts.onLinkWord && App.sheetLinkOpts && App.sheetLinkOpts(App.store.files.get(fileId))) || {};
    const ctrl = await INK.mount(root, fileId, { ...home, ...opts, embedded: false, onClose: () => { ctrl.destroy(); root.remove(); App.backup.nudge(); if (opts.afterClose) opts.afterClose(); } });
    if (!ctrl) root.remove();
  };
})(window.App);
