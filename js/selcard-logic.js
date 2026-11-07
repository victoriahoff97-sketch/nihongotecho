/* Nihongo Techō – Markieren in der App: Logik ohne DOM (Markierung → Furigana-Schreibweise der App, Satz zum Wort).
   Gleiche Regeln wie extension/selection-logic.js – die Erweiterung braucht ihre eigene Kopie, weil sie als Ordner geladen wird. */
'use strict';
(function (App) {
  const KANJI = '\\u3400-\\u9fff\\uf900-\\ufaff々〆ヵヶ';
  const reOnlyKanji = new RegExp('^[' + KANJI + ']+$');
  const reKanjiEnd = new RegExp('[' + KANJI + ']$');
  const isJp = (s) => /[぀-ヿ㐀-鿿豈-﫿々]/.test(s || '');
  const VOCAB_MAX = 14;   // längere Markierungen sind kein einzelnes Wort mehr

  // Klammern aus dem Seitentext dürfen nicht als Schreibweise gelesen werden → Vollbreite
  const WIDE = { '[': '［', ']': '］', '{': '｛', '}': '｝' };
  const safe = (s) => String(s || '').replace(/[[\]{}]/g, (c) => WIDE[c]);

  // tokens: {s} Text · {s:'\n'} Absatzgrenze · {base, rt} Ruby
  const toNotation = (tokens) => {
    let out = '';
    for (const t of tokens || []) {
      if (t.base !== undefined || t.rt !== undefined) {
        const base = safe(t.base).replace(/\s+/g, ''), rt = safe(t.rt).replace(/\s+/g, '');
        if (!base) out += rt;
        else if (!rt) out += base;
        // Steht direkt davor ein Kanji ohne eigene Lesung, würde 大地震[じしん] die Lesung dem ganzen Wort zuschlagen → Klammerform
        else out += (reOnlyKanji.test(base) && !reKanjiEnd.test(out) ? base : '{' + base + '}') + '[' + rt + ']';
      } else if (t.s === '\n') out += '\n';
      else out += safe(t.s).replace(/\s+/g, '');
    }
    return out.replace(/\n{2,}/g, '\n').replace(/^\n+|\n+$/g, '');
  };

  // Ein <ruby> bekommt seine Lesung nur, wenn die ganze Basis markiert ist (震 aus 地震 hat keine eigene).
  // Furigana allein zählt nur, wenn die Markierung darin beginnt oder endet (inRt).
  const rubyToken = ({ base, rt, selBase, selRt, inRt }) => {
    if (selBase && selBase === base) return { base, rt };
    if (selBase) return { s: selBase };
    return { s: inRt ? selRt : '' };
  };

  const splitSentences = (notated) => {
    const out = [];
    for (const line of String(notated || '').split('\n')) {
      for (const part of line.match(/[^。！？!?]+[。！？!?]*[」』）)]*/g) || []) if (part.trim()) out.push(part.trim());
    }
    return out;
  };

  // Der Satz des Absatzes, in dem die Markierung steht; sonst die Markierung selbst
  const sentenceContaining = (paragraph, selection) => {
    const plain = App.jp.plain;
    const needle = plain(selection).trim();
    if (!needle) return selection;
    return splitSentences(paragraph).find((s) => plain(s).includes(needle)) || selection;
  };

  // „Vokabel speichern“ nur für etwas, das wie ein einzelnes Wort aussieht
  const wordLike = (notated) => { const w = App.jp.plain(notated).trim(); return w.length > 0 && w.length <= VOCAB_MAX && !/[\n。！？!?]/.test(w); };

  App.selcardLogic = { isJp, toNotation, rubyToken, splitSentences, sentenceContaining, wordLike, VOCAB_MAX };
})(window.App);
