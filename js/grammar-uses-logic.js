/* Nihongo Techō – „Schon selbst benutzt“: eigene Sätze aus Tagebuch und Smalltalk zu einem Grammatikpunkt (reine Logik) */
'use strict';
(function (App) {
  // Gefunden wird ein Satz, wenn der Eintrag den Punkt verknüpft hat (grammarIds) oder ein Erkennungswort darin steht.
  // Erkennungswörter kommen aus Kurzform (jp) und Titel: „〜たいです“ → たい, „Xが好[す]きです“ → 好き.
  // Zu allgemeine Wörter (です, ます) und mehrdeutige Partikeln (から = „weil“ und „von“) zählen nicht – lieber nichts als Falsches.
  const U = App.grammarUsesLogic = {};
  const STOP = ['です', 'ます', 'から', 'まで'];
  const hira = (s) => String(s || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  U.terms = (it) => {
    const out = [];
    for (const src of [it && it.jp, it && it.title]) {
      for (const m of String(src || '').replace(/\[[^\]]*\]/g, '').match(/[ぁ-ゖァ-ヺー一-鿿々]+/g) || []) {
        let t = hira(m);
        if (t.length > 3 && t.endsWith('です')) t = t.slice(0, -2);
        if (t.length >= 2 && !STOP.includes(t) && !out.includes(t)) out.push(t);
      }
    }
    return out.sort((a, b) => b.length - a.length); // längstes zuerst markieren
  };

  // Sätze samt Satzzeichen, getrennt an 。！？!? oder Zeilenumbruch
  U.sentences = (text) => (String(text || '').match(/[^。！？!?\n]+[。！？!?]*/g) || []).map((s) => s.trim()).filter(Boolean);

  // Erste Stelle eines Erkennungsworts im Satz: { start, end } oder null (Katakana zählt wie Hiragana)
  U.find = (sentence, terms) => {
    const h = hira(sentence);
    for (const t of terms) { const i = h.indexOf(t); if (i >= 0) return { start: i, end: i + t.length }; }
    return null;
  };

  // docs: [{ item, text }] – item = Tagebucheintrag/Antwort (id, date, grammarIds), text = reiner Text.
  // Je Eintrag ein Satz, neueste zuerst: { item, sentence, hit, linked }. Verknüpft ohne Treffer → erster Satz, ohne Markierung.
  U.uses = (it, docs, { limit = 3 } = {}) => {
    const terms = U.terms(it);
    const list = [];
    for (const d of docs || []) {
      if (!d || !d.item) continue;
      const linked = (d.item.grammarIds || []).includes(it.id);
      const sents = U.sentences(d.text);
      let found = null;
      for (const s of sents) { const hit = U.find(s, terms); if (hit) { found = { sentence: s, hit }; break; } }
      if (!found && linked && sents.length) found = { sentence: sents[0], hit: null };
      if (found) list.push(Object.assign({ item: d.item, linked }, found));
    }
    list.sort((a, b) => String(b.item.date || '').localeCompare(String(a.item.date || '')));
    return { items: list.slice(0, limit), more: Math.max(0, list.length - limit) };
  };
})(window.App = window.App || {});
