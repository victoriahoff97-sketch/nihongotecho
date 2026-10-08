/* Nihongo Techō – Vokabel automatisch ausfüllen: Wörterbuch-Treffer ordnen, Felder bestimmen. Browser: App.autofillLogic, Node: module.exports */
'use strict';
(function (root) {
  const hira = (s) => String(s || '').replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

  // typed = { kana, kanji }: was in den beiden Wortfeldern steht (im Lesungs-Feld kann auch eine Kanji-Schreibung stehen)
  const kanjiHit = (e, typed) => (e.k || []).some((k) => k === typed.kanji || k === typed.kana);
  const kanaHit = (e, typed) => !!typed.kana && (e.r || []).some((r) => hira(r) === hira(typed.kana));

  // Treffer ohne Doppelte; zuerst die, die zur getippten Schreibung passen, dann zur Lesung, dann häufige Wörter;
  // bonus(e) (0–9, z. B. nach JLPT-Niveau) ordnet innerhalb dieser Gruppen
  const rank = (entries, typed, bonus = () => 0) => {
    const seen = new Set(), out = [];
    for (const e of entries || []) if (e && !seen.has(e.id)) { seen.add(e.id); out.push(e); }
    const score = (e) => (kanjiHit(e, typed) ? 400 : 0) + (kanaHit(e, typed) ? 200 : 0) + (e.c ? 100 : 0) + bonus(e);
    return out.map((e, i) => ({ e, i, s: score(e) })).sort((a, b) => b.s - a.s || a.i - b.i).map((x) => x.e);
  };

  // Der eine eindeutige Treffer (sonst null): ein einziger Eintrag, oder genau einer mit der getippten Schreibung
  // (sind Schreibung und Lesung getippt, müssen beide passen)
  const sure = (list, typed) => {
    if (list.length === 1) return list[0];
    const both = !!typed.kanji && !!typed.kana;
    const exact = list.filter((e) => kanjiHit(e, typed) && (!both || kanaHit(e, typed)));
    return exact.length === 1 ? exact[0] : null;
  };

  // Lesung und Schreibung fürs Formular. Getippte Formen bleiben, wenn der Eintrag sie kennt; eine eigene
  // Schreibung bleibt auch, wenn nur die Lesung gefunden wurde. uk = wird üblicherweise in Kana geschrieben
  // (する statt 為る): dann keine Kanji-Schreibung, außer sie wurde selbst getippt.
  const wordForms = (entry, typed, uk) => {
    const k = entry.k || [], r = entry.r || [];
    const tk = typed.kanji || '', tr = typed.kana || '';
    const kana = r.find((x) => x === tr) || r.find((x) => hira(x) === hira(tr)) || r[0] || '';
    let kanji = k.find((x) => x === tk) || k.find((x) => x === tr);
    if (kanji === undefined) kanji = tk && kanaHit(entry, typed) ? tk : uk ? '' : k[0] || '';
    return { kana, kanji };
  };

  // Nur leere Felder füllen: cur = aktuelle Werte, found = Werte aus dem Wörterbuch → { feld: wert }
  const fill = (cur, found) => {
    const out = {};
    for (const [name, v] of Object.entries(found || {})) if (v && !String((cur || {})[name] ?? '').trim()) out[name] = v;
    return out;
  };

  const P = { rank, sure, wordForms, fill };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.autofillLogic = P;
})(typeof window !== 'undefined' ? window : globalThis);
