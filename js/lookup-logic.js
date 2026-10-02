/* Nihongo Techō – Nachschlagen: Bedeutungs-Treffer und Rangfolge. Browser: App.lookupLogic, Node: module.exports */
'use strict';
(function (root) {
  const isJp = (q) => /[぀-ヿ㐀-鿿豈-﫿々]/.test(q || '');

  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Klammerzusätze und führenden Artikel/„sich“/„to“ entfernen
  const clean = (p) => p.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(der|die|das|ein|eine|sich|to) /, '');

  // gloss: Bedeutungen, mit ; oder , getrennt. 100 genauer Teil · 80 ohne Artikel/Klammer · 50 Wortanfang · 30 ganzes Wort · 0 sonst
  const wordRe = (lc) => new RegExp('(^|[^\\p{L}])' + escRe(lc) + '($|[^\\p{L}])', 'u');
  const glossScore = (gloss, lc, word) => {
    if (!gloss || !lc) return 0;
    word = word || wordRe(lc);
    let best = 0;
    for (const raw of String(gloss).toLowerCase().split(/[;,]\s*/)) {
      const p = raw.trim();
      if (!p) continue;
      let s = 0;
      if (p === lc) s = 100;
      else if (clean(p) === lc) s = 80;
      else if (p.startsWith(lc) && word.test(p)) s = 50;
      else if (word.test(p)) s = 30;
      if (s > best) best = s;
    }
    return best;
  };

  // Wörterbuch-Zeilen { id, k, r, de, en, c } für eine lateinische Eingabe: Score, dann häufige Wörter, dann kürzere Bedeutung
  const rankDict = (rows, q, limit = 8) => {
    const lc = String(q || '').trim().toLowerCase();
    if (lc.length < 2) return [];
    const hits = [], word = wordRe(lc);
    // Vorfilter: die meisten Zeilen enthalten die Eingabe gar nicht (spart die Wortgrenzen-Prüfung)
    const has = (g) => !!g && g.toLowerCase().includes(lc);
    for (const row of rows) {
      const de = has(row.de), en = has(row.en);
      if (!de && !en) continue;
      const s = Math.max(de ? glossScore(row.de, lc, word) : 0, en ? glossScore(row.en, lc, word) - 5 : 0);
      if (s > 0) hits.push({ row, s });
    }
    hits.sort((a, b) => b.s - a.s || (b.row.c || 0) - (a.row.c || 0) || (a.row.de || '').length - (b.row.de || '').length);
    return hits.slice(0, limit).map((h) => h.row);
  };

  const dictResult = (row) => {
    const kana = (row.r || [])[0] || '';
    return { jp: (row.k || [])[0] || kana, kana, meaning: row.de || row.en || '', lang: row.de ? 'de' : 'en' };
  };

  const key = (r) => r.jp + '|' + r.kana;
  const dedupe = (own, dict) => { const seen = new Set(own.map(key)); return dict.filter((r) => !seen.has(key(r))); };

  const uniq = (list) => { const seen = new Set(); return list.filter((r) => !seen.has(key(r)) && seen.add(key(r))); };

  // Eigener Eintrag passt nur über Bedeutung, Lesung oder Schreibung (App.search findet auch Beispielsätze und Notizen)
  const hira = (s) => String(s || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const ownMatch = (r, q, kanaQ) => {
    q = String(q || '').trim();
    if (isJp(q)) return r.jp.includes(q) || hira(r.kana).includes(hira(q)) || hira(r.jp).includes(hira(q));
    return glossScore(r.meaning, q.toLowerCase()) > 0 || (!!kanaQ && hira(r.kana).includes(kanaQ));
  };

  const kata = (s) => String(s || '').replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
  // Formen für die Suche in Schreibung/Lesung: Eingabe plus Hiragana- und Katakana-Fassung
  const dictForms = (q) => { q = String(q || '').trim(); return q ? [...new Set([q, hira(q), kata(q)])] : []; };

  // Lesungs-Treffer (Romaji) und Bedeutungs-Treffer mischen: höchstens die Hälfte Lesungen, solange es Bedeutungs-Treffer gibt
  const mergeDict = (kanaRows, glossRows, max) => {
    const seen = new Set(), out = [];
    const add = (r) => { if (out.length < max && !seen.has(r.id)) { seen.add(r.id); out.push(r); } };
    kanaRows.slice(0, glossRows.length ? Math.floor(max / 2) : max).forEach(add);
    glossRows.forEach(add);
    kanaRows.forEach(add);
    return out;
  };

  const P = { isJp, glossScore, rankDict, dictResult, dedupe, uniq, ownMatch, dictForms, mergeDict };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.lookupLogic = P;
})(this);
