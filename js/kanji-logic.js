/* Nihongo Techō – Kanji automatisch ausfüllen: Kanji-Index lesen, Beispielwörter wählen. Browser: App.kanjiLogic, Node: module.exports */
'use strict';
(function (root) {
  const KANJI_RE = /[㐀-䶿一-鿿豈-﫿]/u;
  const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const list = (s) => String(s || '').split(',').filter(Boolean);

  // Zeile aus packs/kanji-index.js ([On, Kun, Striche, Englisch, Deutsch?]) → Felder; unbekanntes Zeichen → null
  const entry = (index, ch) => {
    const r = index && ch && index[ch];
    return r ? { char: ch, on: list(r[0]), kun: list(r[1]), strokes: r[2], en: r[3] || '', de: r[4] || '' } : null;
  };

  const firstKanji = (s) => Array.from(String(s || '')).find((c) => KANJI_RE.test(c)) || '';

  // Wörter mit dem Zeichen aus dem JLPT-Index (v: „Schreibung|Lesung“ → Niveau): leichtes Niveau zuerst,
  // dann kurze Wörter; jede Schreibung nur einmal (一日 nicht als いちにち und ついたち)
  const exampleWords = (ch, v, max = 4) => {
    const seen = new Set(), out = [];
    Object.keys(v || {}).forEach((key, i) => {
      const [kanji, kana] = key.split('|');
      if (!kanji.includes(ch) || seen.has(kanji)) return;
      seen.add(kanji);
      out.push({ kanji, kana, level: v[key], i });
    });
    const lv = (w) => { const n = LEVELS.indexOf(w.level); return n < 0 ? LEVELS.length : n; };
    return out.sort((a, b) => lv(a) - lv(b) || Array.from(a.kanji).length - Array.from(b.kanji).length || a.i - b.i)
      .slice(0, max).map(({ kanji, kana, level }) => ({ kanji, kana, level }));
  };

  // Beispielwörter als Zeilen fürs Formular: 日本[にほん] = Japan
  const wordLines = (words) => (words || []).filter((w) => w.jp && (w.de || w.en)).map((w) => `${w.jp} = ${w.de || w.en}`).join('\n');

  // Kanji der Suche, die der Index kennt und die noch nicht in der Sammlung stehen (has(ch))
  const newChars = (q, index, has) => [...new Set(Array.from(String(q || '')).filter((c) => KANJI_RE.test(c)))]
    .filter((c) => index && index[c] && !has(c));

  const P = { entry, firstKanji, exampleWords, wordLines, newChars };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.kanjiLogic = P;
})(typeof window !== 'undefined' ? window : globalThis);
