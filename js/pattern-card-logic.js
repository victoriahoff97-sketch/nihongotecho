/* Nihongo Techō – Karten Deutsch → Japanisch mit Muster:
   1) Ausdruck mit Platzhalter: ein Wort im Ausdruck ist austauschbar (ペットの世話をする → 犬の世話をする), die Karte wechselt es jedes Mal.
   2) Verb-Muster (Einstellung): Verben fragen das Partikel-Muster ab (jemanden treffen → 人に会う) statt nur das Wort.
   Browser: App.patternCard, Node: module.exports */
'use strict';
(function (root) {
  const FURI = /\{([^}]+)\}\[([^\]]+)\]|([㐀-鿿豈-﫿々〆ヵヶ]+)\[([^\]]+)\]/g;
  const plain = (s) => String(s ?? '').replace(FURI, (m, g1, r1, k2) => g1 || k2);
  const kanaOf = (s) => String(s ?? '').replace(FURI, (m, g1, r1, k2, r2) => r1 || r2);

  // Notation in Stücke zerlegen: [{ n: 'Notation', p: 'Schreibung' }] – ein Furigana-Block bleibt ein Stück
  const pieces = (s) => {
    s = String(s ?? '');
    const out = [];
    let last = 0;
    s.replace(FURI, (m, g1, r1, k2, r2, idx) => {
      for (const c of s.slice(last, idx)) out.push({ n: c, p: c });
      out.push({ n: m, p: g1 || k2 });
      last = idx + m.length;
      return m;
    });
    for (const c of s.slice(last)) out.push({ n: c, p: c });
    return out;
  };

  // Wo steht das Wort (Schreibung) im Ausdruck? → { a, b } Stück-Grenzen oder null (auch wenn es mitten in einem Furigana-Block beginnt)
  const locate = (jp, word) => {
    const ps = pieces(jp);
    const w = String(word ?? '').trim();
    if (!w) return null;
    for (let a = 0; a < ps.length; a++) {
      let acc = '';
      for (let b = a; b < ps.length; b++) {
        acc += ps[b].p;
        if (acc === w) return { a, b: b + 1, ps };
        if (!w.startsWith(acc)) break;
      }
    }
    return null;
  };
  const hasSlot = (it) => !!(it && it.slot && it.slot.w && locate(it.jp, it.slot.w));

  // Ausdruck mit anderem Wort im Platzhalter: jp (Notation), de mit 〇〇 und Zeile „〇〇 = …“
  // alt: { jp (Notation oder Schreibung), de } oder null für das eigene Wort
  const withSlot = (it, alt) => {
    const loc = locate(it.jp, it.slot.w);
    if (!loc) return it;
    const sl = it.slot;
    const fill = alt || { jp: loc.ps.slice(loc.a, loc.b).map((x) => x.n).join(''), de: sl.de || '' };
    const jp = loc.ps.slice(0, loc.a).map((x) => x.n).join('') + fill.jp + loc.ps.slice(loc.b).map((x) => x.n).join('');
    const de = String(it.de || '');
    const slotDe = String(sl.de || '').trim();
    const inDe = slotDe && de.includes(slotDe);
    return Object.assign({}, it, {
      jp, also: [],
      de: inDe ? de.split(slotDe).join('〇〇') : de,
      slotLine: inDe ? `〇〇 = ${fill.de || plain(fill.jp)}` : `mit ${fill.de || plain(fill.jp)}${slotDe ? ` (statt ${slotDe})` : ''}`,
      slotJp: fill.jp,
    });
  };
  // Zufällig eins: das eigene Wort oder eine der Alternativen
  const slotVariant = (it, rnd = Math.random) => {
    if (!hasSlot(it)) return it;
    const alts = (it.slot.alts || []).filter((a) => a && a.jp);
    const i = Math.floor(rnd() * (alts.length + 1));
    return withSlot(it, i < alts.length ? alts[i] : null);
  };

  // ---------- Verb-Muster ----------
  const usesOf = (it) => (it && it.type === 'vocab' && Array.isArray(it.use) ? it.use.filter((u) => u && u.jp && u.jp.includes('|') && u.de) : []);
  // Karte zum Verb: { pat: { jp (mit |), de } } oder das Verb unverändert (kein Muster)
  const verbVariant = (it, rnd = Math.random) => {
    const us = usesOf(it);
    if (!us.length) return it;
    const u = us[Math.floor(rnd() * us.length)];
    return Object.assign({}, it, { pat: { jp: u.jp, de: u.de } });
  };
  // Schreibweisen zum Prüfen: ganzes Muster (人に会う) und ab der ersten Partikel (に会う) – das Nomen ist nur ein Beispiel
  const patForms = (pat) => {
    const parts = String(pat.jp).split('|');
    const full = parts.join('');
    const fromPrt = parts.slice(1).join('');
    return [[plain(full), kanaOf(full)], [plain(fromPrt), kanaOf(fromPrt)]];
  };

  const api = { plain, pieces, locate, hasSlot, withSlot, slotVariant, usesOf, verbVariant, patForms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.patternCard = api;
})(typeof window !== 'undefined' ? window : globalThis);
