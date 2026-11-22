/* Nihongo Techō – Vorlesen prüfen: Was die Spracherkennung gehört hat, Silbe für Silbe mit dem Satz vergleichen */
'use strict';
(function (App) {
  const JP = App.jp;
  const R = App.readAloudLogic = {};
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reKanji = new RegExp('[' + KANJI + ']');
  const reFuri = new RegExp('\\{([^}]+)\\}\\[([^\\]]+)\\]|([' + KANJI + ']+)\\[([^\\]]+)\\]', 'g');
  const PUNCT = /[\s　。、．，,.!！?？「」『』・〜～…ー―\-（）()]/;
  const hira = (s) => JP.toHira(String(s || ''));
  // Romaji/ASCII-Ziffern lassen wir stehen; Satzzeichen und Leerzeichen zählen nicht
  const clean = (s) => hira(String(s || '').replace(/[\s　。、．，,.!！?？「」『』・〜～…（）()]/g, ''));

  // Satz mit Furigana-Notation → Blöcke { k: Schreibung, r: Lesung (Hiragana), p: Satzzeichen }
  // Kanji ohne Lesung bleiben ein Block mit r = k (werden dann nur als genau diese Kanji erkannt)
  R.blocks = (s) => {
    s = String(s ?? '');
    const out = [];
    const plain = (t) => { for (const c of t) out.push(PUNCT.test(c) && c !== 'ー' ? { k: c, r: '', p: true } : { k: c, r: hira(c) }); };
    let last = 0;
    s.replace(reFuri, (m, g1, r1, k2, r2, idx) => {
      plain(s.slice(last, idx));
      out.push({ k: g1 || k2, r: hira(r1 || r2) });
      last = idx + m.length;
      return m;
    });
    plain(s.slice(last));
    // „ー“ hängt am Vorgänger (コーヒー), zählt aber als eigene Silbe
    return out;
  };

  // Gehörtes in Lesung umschreiben: Kanji-Wörter des Satzes durch ihre Lesung ersetzen (längste zuerst)
  R.toReading = (heard, blocks) => {
    let h = clean(heard);
    const words = blocks.filter((b) => !b.p && b.k !== b.r && reKanji.test(b.k)).sort((a, b) => b.k.length - a.k.length);
    for (const b of words) h = h.split(b.k).join(b.r);
    return h;
  };

  // Längste gemeinsame Teilfolge: welche Zeichen von b in a vorkommen (in Reihenfolge)
  const matched = (a, b) => {
    a = Array.from(a); b = Array.from(b);
    const L = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
    for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const hit = new Array(b.length).fill(false);
    let i = 0, j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { hit[j] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++;
    }
    return hit;
  };

  // Ein gehörter Text gegen den Satz: Blöcke mit st = ok | part | miss (Satzzeichen: p), Anteil verstandener Silben
  R.compareOne = (target, heard) => {
    const blocks = R.blocks(target);
    const T = [], owner = [];
    blocks.forEach((b, i) => { if (!b.p) Array.from(b.r).forEach((c) => { T.push(c); owner.push(i); }); });
    const hit = matched(R.toReading(heard, blocks), T.join(''));
    const per = blocks.map(() => [0, 0]);
    T.forEach((c, n) => { per[owner[n]][1]++; if (hit[n]) per[owner[n]][0]++; });
    const out = blocks.map((b, i) => {
      if (b.p) return { k: b.k, r: b.r, st: 'p' };
      const [h, all] = per[i];
      return { k: b.k, r: b.r, st: h === all ? 'ok' : h * 2 >= all ? 'part' : 'miss' };
    });
    const got = hit.filter(Boolean).length;
    return { blocks: out, got, total: T.length, score: T.length ? got / T.length : 0, heard: String(heard || '') };
  };

  // Alle Lesarten der Erkennung: die beste zählt. null = nichts gehört
  R.compare = (target, alts) => {
    const list = (alts || []).filter((a) => clean(a));
    if (!list.length) return null;
    return list.map((a) => R.compareOne(target, a)).reduce((best, r) => (r.score > best.score ? r : best));
  };

  // Urteil in Worten
  R.verdict = (r) => (r.score >= 0.95 ? { cls: 'ok', t: 'Sehr gut verstanden' } : r.score >= 0.75 ? { cls: 'half', t: 'Fast alles verstanden' } : { cls: 'no', t: 'Noch schwer zu verstehen' });
})(window.App);
