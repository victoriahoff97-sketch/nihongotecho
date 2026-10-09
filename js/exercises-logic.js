/* Nihongo Techō – Buchaufgaben: Paket-Format, Zuordnung und Schnittliste. Nur Logik, kein DOM. */
'use strict';
(function (App) {
  const MAGIC = 'NTPK1';
  const PACK = 'genki1-aufgaben';
  const fail = (code, msg) => Object.assign(new Error(msg), { code });

  // Behälter: Kennung (5 Bytes) · Länge des Verzeichnisses (4 Bytes, Little Endian) · Verzeichnis (JSON, UTF-8) · Bilder hintereinander.
  // offset zählt ab dem Ende des Verzeichnisses.
  // Buchseiten als PDF (dir.pages, Inhalte in files) stehen hinter allen Bildern: eine ältere App-Version liest das Paket weiter und übergeht sie.
  const buildPack = (dir, images, files = []) => {
    let off = 0;
    const place = (list, blobs) => list.map((x, i) => { const e = Object.assign({}, x, { offset: off, size: blobs[i].length }); off += blobs[i].length; return e; });
    const exercises = place(dir.exercises, images);
    const pages = dir.pages ? place(dir.pages, files) : undefined;
    const head = new TextEncoder().encode(JSON.stringify(Object.assign({}, dir, { exercises }, pages ? { pages } : {})));
    const out = new Uint8Array(MAGIC.length + 4 + head.length + off);
    for (let i = 0; i < MAGIC.length; i++) out[i] = MAGIC.charCodeAt(i);
    new DataView(out.buffer).setUint32(MAGIC.length, head.length, true);
    out.set(head, MAGIC.length + 4);
    let pos = MAGIC.length + 4 + head.length;
    images.concat(pages ? files : []).forEach((im) => { out.set(im, pos); pos += im.length; });
    return out;
  };

  const parsePack = (bytes) => {
    const start = MAGIC.length + 4;
    if (bytes.length < start || Array.from(bytes.subarray(0, MAGIC.length)).some((b, i) => b !== MAGIC.charCodeAt(i))) throw fail('magic', 'Das ist keine Buchaufgaben-Datei.');
    const len = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(MAGIC.length, true);
    if (bytes.length < start + len) throw fail('short', 'Die Datei ist unvollständig.');
    let dir;
    try { dir = JSON.parse(new TextDecoder().decode(bytes.subarray(start, start + len))); } catch (e) { throw fail('magic', 'Das ist keine Buchaufgaben-Datei.'); }
    if (!dir || dir.pack !== PACK || !Array.isArray(dir.exercises)) throw fail('pack', 'Diese Datei gehört zu einem anderen Paket.');
    const base = start + len;
    if (dir.pages !== undefined && !Array.isArray(dir.pages)) throw fail('magic', 'Das ist keine Buchaufgaben-Datei.');
    if (dir.exercises.concat(dir.pages || []).some((e) => !(e.size > 0) || !(e.offset >= 0) || base + e.offset + e.size > bytes.length)) throw fail('short', 'Die Datei ist unvollständig.');
    const part = (e) => bytes.subarray(base + e.offset, base + e.offset + e.size);
    return { dir, image: (i) => part(dir.exercises[i]), file: (i) => part(dir.pages[i]) };
  };

  const byPage = (a, b) => a.lesson - b.lesson || a.page - b.page || String(a.label).localeCompare(String(b.label));
  const forGrammar = (exercises, grammarId) => exercises.filter((e) => (e.grammar || []).includes(grammarId)).sort(byPage);
  const forLesson = (exercises, lesson) => exercises.filter((e) => String(e.lesson) === String(lesson)).sort(byPage);

  const title = (ex) => `L${ex.lesson} · ${ex.label}`;
  const attemptName = (ex, n) => `Genki I L${ex.lesson} · ${ex.label} · Versuch ${n}`;

  // Eine Aufgabe über einen Seitenumbruch hat parts; sonst ist sie selbst ihr einziger Teil
  const cutParts = (cut) => (cut.parts && cut.parts.length ? cut.parts : [{ page: cut.page, box: cut.box }]);

  // Zuordnung: Eine Aufgabe gehört zu dem Grammatikpunkt, auf den ihr Abschnitt im Buch verweist (ref, z. B. „Grammar 2“) –
  // nicht zu jedem Punkt, der zufällig in ihren Sätzen vorkommt. Deshalb muss jede Zuordnung ihren Verweis nennen,
  // und der Grammatik-Eintrag muss aus derselben Lektion stammen (lessonOf(id) → Lektion; Ausnahme nur mit crossLesson: true).
  const checkCuts = (cuts, grammarIds, lessonOf) => {
    const errs = [];
    const seen = new Set();
    cuts.forEach((c, i) => {
      const who = c.id || 'Eintrag ' + (i + 1);
      if (!c.id) errs.push(`${who}: id fehlt`);
      else if (seen.has(c.id)) errs.push(`${who}: id doppelt`);
      seen.add(c.id);
      if (!(c.lesson >= 0) || !c.label) errs.push(`${who}: lesson oder label fehlt`);
      cutParts(c).forEach((p) => {
        const b = p.box;
        if (!(p.page >= 1)) errs.push(`${who}: Seite fehlt`);
        if (!Array.isArray(b) || b.length !== 4 || b.some((v) => !(v >= 0 && v <= 1)) || b[0] >= b[2] || b[1] >= b[3]) errs.push(`${who}: Kasten ungültig`);
      });
      if ((c.grammar || []).length && !c.ref) errs.push(`${who}: Zuordnung ohne Verweis (ref)`);
      (c.grammar || []).forEach((g) => {
        if (!grammarIds.has(g)) errs.push(`${who}: unbekannte Grammatik ${g}`);
        else if (lessonOf && !c.crossLesson && String(lessonOf(g)) !== String(c.lesson)) errs.push(`${who}: Grammatik ${g} gehört zu Lektion ${lessonOf(g)}, die Aufgabe zu Lektion ${c.lesson}`);
      });
    });
    return errs;
  };

  // ---------- Buchseiten als PDF (Vokabelseiten, Useful Expressions) ----------
  // Sie erscheinen als Dateien bei den Vokabeln (Quelle Genki I, ihre Lektion). Der Inhalt bleibt im Paket-Speicher:
  // der Datei-Eintrag trägt nur packFile und kommt so in keine Sicherung und keinen Export.
  const SOURCE = 'Genki I';
  const packOutdated = (dir) => !!dir && !(Array.isArray(dir.pages) && dir.pages.length);
  const pageFileId = (pageId) => 'pk-' + pageId;
  // i = Platz im Paket, base = Zeitstempel des Pakets: frühere Seiten gelten als „neuer“ und stehen in der Dateiliste vorn
  const pageFile = (p, i, base) => ({
    id: pageFileId(p.id), name: p.name + '.pdf', mime: 'application/pdf', size: p.size || 0,
    source: SOURCE, lesson: p.lesson, section: 'vocab', tags: [], sessionId: '', itemId: '', role: '', note: '',
    created: base - 1 - i, pages: p.pages || 0, paper: '', packFile: p.id,
  });
  // Gleicht die Datei-Einträge mit dem geladenen Paket ab: put = anlegen oder auffrischen, del = Einträge ohne Seite im Paket.
  // Was das Paket vorgibt (Name, Lektion, Größe …), gilt; alles andere am Eintrag (Notiz, Tags, eigene Reihenfolge) bleibt.
  const planPages = (pages, files, base) => {
    const have = new Map(files.filter((f) => f.packFile).map((f) => [f.id, f]));
    const put = [];
    pages.forEach((p, i) => {
      const want = pageFile(p, i, base);
      const old = have.get(want.id);
      have.delete(want.id);
      if (!old) { put.push(want); return; }
      const keys = ['name', 'mime', 'size', 'source', 'lesson', 'section', 'pages', 'packFile', 'created'];
      if (keys.some((k) => old[k] !== want[k])) put.push(Object.assign({}, old, Object.fromEntries(keys.map((k) => [k, want[k]]))));
    });
    return { put, del: Array.from(have.keys()) };
  };
  // Seitenliste des Bau-Werkzeugs: welche Buchseiten (PDF-Seiten from–to) als eine Datei ins Paket kommen
  const checkPages = (list) => {
    const errs = [];
    const seen = new Set();
    list.forEach((p, i) => {
      const who = p.id || 'Eintrag ' + (i + 1);
      if (!p.id) errs.push(`${who}: id fehlt`);
      else if (seen.has(p.id)) errs.push(`${who}: id doppelt`);
      seen.add(p.id);
      if (!(p.lesson >= 0) || !['vocab', 'expr'].includes(p.kind)) errs.push(`${who}: lesson oder kind fehlt`);
      if (!p.name || /[\\/:*?"<>|]/.test(p.name)) errs.push(`${who}: Name fehlt oder enthält Zeichen, die in Dateinamen nicht gehen`);
      if (!(p.from >= 1) || !(p.to >= p.from)) errs.push(`${who}: Seiten ungültig`);
    });
    return errs;
  };

  // ---------- Nebeneinander: Aufgabe und Schreibblatt als zwei Spalten ----------
  // PAD/GAP wie in .viewer-pages; unter MIN_W und im Hochformat wären beide Spalten zu schmal
  const SPLIT = { PAD: 22, GAP: 18, MIN_W: 800, EX: 0.45, MAX_SHEET: 1100 };
  // Spaltenbreiten für die Fläche cw × ch; null = untereinander wie bisher
  const splitLayout = (cw, ch) => {
    if (!(cw >= SPLIT.MIN_W) || cw <= ch) return null;
    const avail = cw - 2 * SPLIT.PAD - SPLIT.GAP;
    const exW = Math.round(avail * SPLIT.EX);
    return { exW, sheetW: Math.min(avail - exW, SPLIT.MAX_SHEET) };
  };
  // Die Aufgabe bleibt beim Scrollen stehen. Ist sie höher als die Fläche, lässt sie sich für sich verschieben:
  // off ≤ 0 = so weit ist sie nach oben geschoben, höchstens bis ihr unteres Ende zu sehen ist
  const splitOffset = (off, exH, ch) => Math.min(0, Math.max(ch - 2 * SPLIT.PAD - exH, off || 0));

  App.exercisesLogic = { MAGIC, PACK, buildPack, parsePack, forGrammar, forLesson, title, attemptName, cutParts, checkCuts, packOutdated, pageFileId, pageFile, planPages, checkPages, SPLIT, splitLayout, splitOffset };
})(window.App);
