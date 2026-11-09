/* Nihongo Techō – Partikel-Muster und Verbklasse für eigene Verben: aus dem Verb-Index der JLPT-Pakete (packs/verb-index.js),
 * sonst aus dem eigenen Beispielsatz. Browser: App.verbLogic, Node: module.exports */
'use strict';
(function (root) {
  const node = typeof module !== 'undefined' && module.exports;
  const E = node ? require('./example-logic.js') : root.App.exampleLogic;
  const A = node ? require('./autofill-logic.js') : root.App.autofillLogic;

  // Index: Schlüssel wie example-logic → [Klasse, Partikel-Muster, deutsche Bedeutung]
  const isVerb = (it) => !!it && it.type === 'vocab' && (!it.pos || it.pos === 'verb');
  const hasUse = (it) => Array.isArray(it.use) && it.use.some((u) => u && u.jp);
  const hasCls = (it) => !!(it.v && it.v.cls);
  const needs = (it) => isVerb(it) && (!hasUse(it) || !hasCls(it));

  // {cls, use} zum Wort oder null
  const find = (index, it) => {
    const k = E.findKey(index, it);
    return k ? { cls: index.v[k][0], use: index.v[k][1] } : null;
  };

  // ---------- Muster aus dem eigenen Beispielsatz ----------
  // „毎朝[まいあさ]公園[こうえん]を散歩[さんぽ]します“ + 散歩する → „公園[こうえん]|を|散歩[さんぽ]する“.
  // Vorsichtig: nur wenn direkt vor dem Verb eine Partikel steht und davor ein Nomen in Kanji oder Katakana –
  // Hiragana-Nomen lassen sich nicht sicher abgrenzen (ともだち enthält と), dann gibt es kein Muster.
  const KANJI = '㐀-鿿豈-﫿々〆ヵヶ';
  const reKanji = new RegExp('[' + KANJI + ']');
  // Einheiten des Satzes: „漢字[かな]“, „{…}[…]“ oder ein einzelnes Zeichen
  const UNIT = new RegExp('\\{[^}]+\\}\\[[^\\]]+\\]|[' + KANJI + ']+\\[[^\\]]+\\]|.', 'gu');
  const plainOf = (u) => (u.length > 1 && u.endsWith(']') ? u.replace(/^\{?([^}\[]+)\}?\[.*$/, '$1') : u);
  const PRT = ['から', 'まで', 'より', 'を', 'に', 'が', 'と', 'へ', 'で'];
  const SELF = /^(私|僕|俺|わたし|ぼく|あなた|彼|彼女)$/;
  const SURU = /(する|為る)$/;
  const SURU_FORMS = /^(し|す|さ|せ)/;

  // Stämme, an denen man das Verb im Satz erkennt (散歩 + し…, 着替 + え…, 書 + き…)
  const stems = (it) => {
    const out = [];
    for (const w of [it.kanji, it.kana].filter(Boolean).map((s) => String(s).replace(/[\s〜～~]/g, ''))) {
      if (SURU.test(w)) out.push({ s: w.replace(SURU, ''), suru: true });
      else out.push({ s: w.slice(0, -1) });
    }
    // zu kurze Kana-Stämme (い, み) finden alles Mögliche
    return out.filter((x) => x.s && (reKanji.test(x.s) || x.s.length >= 2));
  };

  // notate(kanji, kana) → Notation des Verbs (App.jp.notate); ohne: nur die Schreibung
  const fromSentence = (it, jp, notate) => {
    const units = String(jp || '').replace(/\s+/g, '').match(UNIT) || [];
    const plains = units.map(plainOf);
    const text = plains.join('');
    // Anfang jeder Einheit im Klartext
    const starts = []; let p = 0;
    for (const x of plains) { starts.push(p); p += x.length; }
    for (const st of stems(it)) {
      // Treffer mitten in einem anderen Wort überspringen (書 in 辞書, 散歩 in 散歩道)
      const inWord = (i) => (i > 0 && reKanji.test(st.s[0]) && reKanji.test(text[i - 1])) || (st.suru && !SURU_FORMS.test(text.slice(i + st.s.length)));
      let i = text.indexOf(st.s);
      while (i >= 0 && inWord(i)) i = text.indexOf(st.s, i + 1);
      if (i < 0) continue;
      const before = text.slice(0, i);
      const prt = PRT.find((x) => before.endsWith(x));
      if (!prt) return null;
      // Einheit direkt vor der Partikel
      const end = i - prt.length;
      let u = starts.findIndex((s, k) => s < end && s + plains[k].length === end);
      if (u < 0) return null;
      let noun;
      if (units[u].length > 1 && units[u].endsWith(']')) {
        noun = units[u];
        if (u > 0 && /^[おご]$/.test(units[u - 1])) noun = units[u - 1] + noun; // お茶, ご飯
      } else if (/[ァ-ヶー]/.test(units[u])) {
        let k = u; while (k > 0 && /^[ァ-ヶー]$/.test(units[k - 1])) k--;
        noun = units.slice(k, u + 1).join('');
      } else if (reKanji.test(units[u])) {
        // Kanji ohne Lesung: die ganze Kanji-Folge, aber höchstens 4 Zeichen (sonst hängt ein Zeitwort davor)
        let k = u; while (k > 0 && reKanji.test(units[k - 1]) && units[k - 1].length === 1) k--;
        noun = units.slice(k, u + 1).join('');
        if (noun.length > 4) return null;
      } else return null;
      if (SELF.test(plainOf(noun).replace(/^\{|\}$/g, '')) || SELF.test(noun)) return null;
      const verb = it.kanji && notate ? notate(it.kanji, it.kana) : (it.kanji || it.kana);
      return `${noun}|${prt}|${verb}`;
    }
    return null;
  };

  // Muster aus dem ersten Beispielsatz, der eins hergibt → {jp, de, src} oder null
  const fromExamples = (it, notate) => {
    for (const ex of Array.isArray(it.examples) ? it.examples : []) {
      const jp = ex && fromSentence(it, ex.jp, notate);
      if (jp) return { jp, de: '', src: 'satz' };
    }
    return null;
  };

  // Ergänzt, was fehlt – selbst eingetragene Muster bleiben. Die Klasse aus dem Index (geprüft mit JMdict) ersetzt eine
  // geratene: Klassen trägt man nirgends selbst ein, sie kommen nur aus Wörterbuch oder Raten. true = geändert.
  // opts.notate: App.jp.notate (für die Lesung im Muster aus dem Beispielsatz)
  const fill = (index, it, opts = {}) => {
    if (!isVerb(it)) return false;
    const hit = index ? find(index, it) : null;
    let changed = false;
    if (hit) {
      if (!hasUse(it) && hit.use && hit.use.length) { it.use = hit.use.map((u) => ({ jp: u.jp, de: u.de })); changed = true; }
      if (hit.cls && (!it.v || it.v.cls !== hit.cls)) { it.v = Object.assign({}, it.v, { cls: hit.cls }); changed = true; }
      return changed;
    }
    // nicht im Index: nur echte Verben (Wortart gesetzt), sonst wäre jedes Wort ohne Wortart ein Kandidat
    if (it.pos !== 'verb') return false;
    if (!hasCls(it) && (it.kana || it.kanji)) { it.v = Object.assign({}, it.v, { cls: A.guessClass(it.kana || it.kanji, it.kanji || '') }); changed = true; }
    if (!hasUse(it)) {
      const u = fromExamples(it, opts.notate);
      if (u) { it.use = [u]; changed = true; }
    }
    return changed;
  };

  const api = { needs, find, fill, fromSentence, fromExamples };
  if (node) module.exports = api;
  else root.App.verbLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
