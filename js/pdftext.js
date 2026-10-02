/* Nihongo Techō – Volltextsuche in PDFs (liest die Textebene per pdf.js; eingescannte Seiten ohne Text bleiben leer, keine Texterkennung) */
(function (App) {
  'use strict';
  const JP = App.jp;
  const PT = App.pdfText = {};
  // Version des gespeicherten Textes (f.text = { v, pages: [Text je Seite] }); höher setzen = alles neu einlesen
  PT.VERSION = 1;

  // ---------- Reine Helfer ----------
  // Seitentext aus den pdf.js-Textteilen: NFKC (⾷ → 食, Halbbreiten-Kana → normale Kana), Leerraum zusammengefasst
  PT.pageString = (items) => (items || []).map((i) => (i.str || '') + (i.hasEOL ? ' ' : '')).join('')
    .normalize('NFKC').replace(/\s+/g, ' ').trim();

  // Suchform: klein, Katakana → Hiragana, ohne Leerraum (Furigana stehen oft als „病気びょう き“ im Text);
  // map[j] = Position im Originaltext, damit Treffer im Original markiert werden können
  PT.fold = (s) => {
    s = String(s || '');
    let out = '';
    const map = [];
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (/\s/.test(c)) continue;
      const f = JP.toHira(c.toLowerCase());
      for (let k = 0; k < f.length; k++) map.push(i);
      out += f;
    }
    return { s: out, map };
  };

  // Suchbegriffe in Suchform; Romaji zusätzlich als Kana (byouki → びょうき). #schlagwort sucht nur Schlagwörter.
  PT.needles = (q) => {
    q = String(q || '').normalize('NFKC').trim();
    if (!q || q.startsWith('#')) return [];
    const out = [PT.fold(q).s];
    if (JP.looksRomaji(q)) {
      const k = PT.fold(JP.romaji(q.toLowerCase())).s;
      if (k && !out.includes(k)) out.push(k);
    }
    return out.filter(Boolean);
  };

  const folded = new WeakMap(); // pages-Array -> gefaltete Seiten (Suche tippt oft mehrfach hintereinander)
  const foldPages = (pages) => {
    let f = folded.get(pages);
    if (!f) { f = pages.map((t) => (t ? PT.fold(t) : null)); folded.set(pages, f); }
    return f;
  };

  // Seiten mit Treffer: count = Anzahl Seiten, hits = die ersten max Seiten mit Textausschnitt
  PT.find = (pages, needles, max = 3, ctx = 40) => {
    const res = { count: 0, hits: [] };
    if (!Array.isArray(pages) || !needles.length) return res;
    const fp = foldPages(pages);
    fp.forEach((f, i) => {
      if (!f) return;
      for (const nd of needles) {
        const at = f.s.indexOf(nd);
        if (at < 0) continue;
        res.count++;
        if (res.hits.length < max) {
          const txt = pages[i];
          const a = f.map[at], b = f.map[at + nd.length - 1] + 1;
          const from = Math.max(0, a - ctx), to = Math.min(txt.length, b + ctx);
          res.hits.push({ page: i + 1, before: (from > 0 ? '… ' : '') + txt.slice(from, a), match: txt.slice(a, b), after: txt.slice(b, to) + (to < txt.length ? ' …' : '') });
        }
        break;
      }
    });
    return res;
  };

  // Alle Dateien mit Text-Treffern, meiste Trefferseiten zuerst
  PT.search = (files, q, max = 3) => {
    const needles = PT.needles(q);
    if (!needles.length) return [];
    const out = [];
    for (const f of files) {
      if (!f.text || !f.text.pages) continue;
      const r = PT.find(f.text.pages, needles, max);
      if (r.count) out.push({ file: f, ...r });
    }
    return out.sort((a, b) => b.count - a.count || (b.file.created || 0) - (a.file.created || 0));
  };

  // ---------- Einlesen (Browser) ----------
  PT.extract = async (blob) => {
    const lib = await App.ink.pdfjs();
    const pdf = await lib.getDocument({
      data: await blob.arrayBuffer(),
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true,
      standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
    }).promise;
    const pages = [];
    try {
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        pages.push(PT.pageString((await page.getTextContent()).items));
        page.cleanup();
      }
    } finally { pdf.destroy(); }
    return pages;
  };

  // Warteschlange: eine PDF nach der anderen im Hintergrund; defekte PDFs werden in dieser Sitzung nicht nochmal versucht
  const queue = [];
  const failed = new Set();
  let running = false;
  PT.needsText = (f) => !!f && App.fileKind(f) === 'pdf' && !(f.text && f.text.v === PT.VERSION) && !failed.has(f.id);
  PT.pending = () => queue.length + (running ? 1 : 0);
  const pause = () => new Promise((r) => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 500 }) : setTimeout(r, 30)));
  async function run() {
    if (running) return;
    running = true;
    let done = 0;
    while (queue.length) {
      const id = queue.shift();
      const f = App.store.files.get(id);
      if (!PT.needsText(f)) continue;
      try {
        const blob = await App.fileBlob(id);
        if (!blob) continue;
        const pages = await PT.extract(blob);
        const cur = App.store.files.get(id);
        if (!cur) continue; // inzwischen gelöscht
        cur.text = { v: PT.VERSION, pages };
        await App.db.put('files', cur);
        done++;
      } catch (e) {
        console.warn('PDF-Text konnte nicht gelesen werden:', f.name, e);
        failed.add(id);
      }
      await pause();
    }
    running = false;
    if (done) App.emit('files');
  }
  PT.enqueue = (id) => { if (!queue.includes(id)) queue.push(id); run(); };
  // Beim Start: alle PDFs ohne (aktuellen) Text nachträglich einlesen, neue Dateien automatisch
  PT.backfill = () => { App.store.files.forEach((f) => { if (PT.needsText(f) && !queue.includes(f.id)) queue.push(f.id); }); run(); };
})(window.App);
