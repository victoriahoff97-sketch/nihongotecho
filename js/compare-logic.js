/* Nihongo Techō – Vergleichen (reine Logik, ohne DOM): was zwei Wörter unterscheidet.
   Anzeige: js/compare.js */
'use strict';
(function (App) {
  const CL = App.compareLogic = {};

  // Zeichen von a, die in b nicht vorkommen, als Teile [{ t, diff }] (渡る gegen 渡す → 渡 · る*).
  // Haben die beiden gar nichts gemeinsam (待 gegen 持, 渡る gegen 橋), wird nichts markiert – dann wäre alles gelb.
  CL.diffParts = (a, b) => {
    const A = Array.from(String(a || '')), B = new Set(Array.from(String(b || '')));
    if (!A.length) return [];
    const shared = A.some((c) => B.has(c));
    const parts = [];
    for (const c of A) {
      const diff = shared && !B.has(c);
      const last = parts[parts.length - 1];
      if (last && last.diff === diff) last.t += c; else parts.push({ t: c, diff });
    }
    return parts;
  };

  // Karte einer Lernrunde → Eintrag: Kanji-Quiz „Wort → Lesung“ meldet { k: Kanji, w: Wort }
  CL.entryOf = (x) => (x && x.type ? x : x && x.k && x.k.type ? x.k : null);
})(window.App);
