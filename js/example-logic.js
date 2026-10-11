/* Nihongo Techō – Beispielsatz für eigene Vokabeln aus dem Satz-Index der JLPT-Pakete (packs/example-index.js). Browser: App.exampleLogic, Node: module.exports */
'use strict';
(function (root) {
  const norm = (s) => String(s ?? '').replace(/[\s〜～~]/g, '');
  const hira = (s) => String(s ?? '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const KANJI = /[㐀-鿿豈-﫿々]/;

  // Schlüssel wie App.vocabKey: Schreibung + Hiragana-Lesung
  const key = (it) => norm(it.kanji || it.kana || '') + '|' + hira(norm(it.kana || ''));

  // Wörter einer deutschen Bedeutung ohne Artikel und Füllwörter
  const STOP = new Set(['der', 'die', 'das', 'ein', 'eine', 'einen', 'sich', 'etw', 'etwas', 'jmd', 'jdn', 'jdm', 'und', 'oder', 'von', 'mit']);
  const words = (de) => String(de ?? '').toLowerCase().split(/[^a-zäöüß]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const shares = (a, b) => { const wa = words(a), wb = words(b); return wa.some((x) => wb.some((y) => x === y || (x.length > 4 && y.includes(x)) || (y.length > 4 && x.includes(y)))); };

  // Nachschlagetabellen je Index (nur einmal aufgebaut): Schreibung → Schlüssel, Lesung → Schlüssel
  const tables = new WeakMap();
  const tablesOf = (index) => {
    let t = tables.get(index);
    if (!t) {
      t = { w: new Map(), k: new Map() };
      for (const k of Object.keys(index.v)) {
        const [writing, kana] = k.split('|');
        for (const [m, x] of [[t.w, writing], [t.k, kana]]) { if (!m.has(x)) m.set(x, []); m.get(x).push(k); }
      }
      tables.set(index, t);
    }
    return t;
  };

  // Satz {jp, de} zum Wort oder null. Passt der Schlüssel nicht genau:
  //  - nur die Schreibung eingetragen (Lesung fehlt) → das eine Wort mit dieser Schreibung
  //  - nur in Kana eingetragen → das eine Wort mit dieser Lesung; bei mehreren (橋/箸) das eine, dessen deutsche
  //    Bedeutung zur eingetragenen passt
  const find = (index, it) => {
    if (!index || !index.v || !it) return null;
    const out = (k) => (k && index.v[k] ? { jp: index.v[k][0], de: index.v[k][1] } : null);
    const exact = key(it);
    if (index.v[exact]) return out(exact);
    const t = tablesOf(index);
    const writing = norm(it.kanji || it.kana || '');
    const kana = hira(norm(it.kana || ''));
    if (!writing) return null;
    if (KANJI.test(writing)) {
      if (kana && kana !== hira(writing)) return null; // andere Lesung = anderes Wort
      const c = t.w.get(writing) || [];
      return c.length === 1 ? out(c[0]) : null;
    }
    const c = (t.k.get(hira(writing)) || []).filter((k) => KANJI.test(k.split('|')[0]));
    if (c.length === 1) return out(c[0]);
    const byDe = c.filter((k) => shares(it.de, index.v[k][2]));
    return byDe.length === 1 ? out(byDe[0]) : null;
  };

  const needs = (it) => !!it && it.type === 'vocab' && !(Array.isArray(it.examples) && it.examples.some((e) => e && String(e.jp ?? '').trim()));

  // Trägt den Satz ein, wenn der Eintrag noch keinen hat; true = geändert
  const fill = (index, it) => {
    if (!needs(it)) return false;
    const ex = find(index, it);
    if (!ex) return false;
    it.examples = [ex];
    return true;
  };

  const api = { key, find, needs, fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.exampleLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
