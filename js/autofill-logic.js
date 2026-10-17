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

  const guessClass = (kana) => {
    if (/(する|くる)$/.test(kana)) return 'irr';
    if (!/る$/.test(kana)) return 'u';
    const EXC = ['かえる', 'はいる', 'しる', 'はしる', 'しゃべる', 'すべる', 'にぎる', 'へる', 'まいる', 'ける', 'かぎる', 'まじる'];
    if (EXC.some((x) => kana.endsWith(x))) return 'u';
    const prev = kana.slice(-2, -1);
    return /[いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ]/.test(prev) ? 'ru' : 'u';
  };

  // Satzbau-Angaben für die Übersetzungsübungen (cat, n, v, a, t) – ohne Eingabefelder, beim Speichern bestimmt.
  // old = Stand vor dem Bearbeiten: bei gleicher Wortart und gleichem Deutsch bleiben seine (gepflegten) Angaben stehen.
  // opts: nounDe (JP.nounDe), cls (Verbklasse aus dem Wörterbuch, sonst geraten)
  const sentenceData = (it, old, opts = {}) => {
    const keep = !!old && old.pos === it.pos && old.de === it.de;
    const o = (k) => (keep && old[k]) || {};
    const cat = keep ? (old.cat || []).slice() : [];
    const first = String(it.de || '').split(/[,;(]/)[0].trim();
    delete it.n; delete it.v; delete it.a; delete it.t;
    if (it.pos === 'noun') {
      const auto = opts.nounDe({ de: it.de }), n = o('n');
      it.cat = cat;
      it.n = { ...n, w: n.w || auto.w, g: n.g || auto.g, mass: !!n.mass };
    } else if (it.pos === 'verb') {
      const v = o('v');
      const inf = v.inf || first;
      it.v = { cls: v.cls || opts.cls || guessClass(it.kana || ''), inf, ich: v.ich || inf.replace(/(e?n)$/, 'e'), pp: v.pp || ('ge' + inf.replace(/(e?n)$/, 't')), aux: v.aux || 'habe', sep: v.sep || '', obj: v.obj || [] };
      it.cat = cat;
      if (it.v.obj.length && !it.cat.includes('objekt')) it.cat.push('objekt');
    } else if (/adj/.test(it.pos || '')) {
      const a = o('a');
      it.cat = ['beschreibung'];
      it.a = { de: a.de || first, subj: a.subj && a.subj.length ? a.subj : ['ding', 'ort', 'person', 'essen'] };
    } else if (it.pos === 'time') {
      it.cat = ['zeitpunkt'];
      it.t = { adv: o('t').adv || first };
    }
    return it;
  };

  // Vokabeln, die es schon gibt (Warnung im Formular). typed = { kana, kanji } wie oben, selfId = der Eintrag selbst.
  // 'same': gleiche Schreibung (Kanji, auch im Lesungs-Feld getippt) oder gleiche Lesung bei Wörtern ohne Kanji;
  // 'reading': nur Kana getippt, das vorhandene Wort hat Kanji (おそい → 遅い, aber auch はし → 箸 und 橋).
  // Sind Kanji getippt, zählt ein Wort mit anderen Kanji und gleicher Lesung nicht (Homophon: 橋 ≠ 箸).
  const hasKanji = (s) => /[㐀-鿿々]/.test(s);
  const dupes = (items, typed, selfId) => {
    const kana = String((typed && typed.kana) || '').trim(), kanji = String((typed && typed.kanji) || '').trim();
    const spell = kanji || (hasKanji(kana) ? kana : '');
    const reading = hasKanji(kana) ? '' : hira(kana);
    if (!spell && !reading) return [];
    const out = [];
    for (const v of items || []) {
      if (!v || v.type !== 'vocab' || (selfId && v.id === selfId)) continue;
      if (spell && (v.kanji === spell || (!v.kanji && v.kana === spell))) out.push({ it: v, kind: 'same' });
      else if (reading && hira(v.kana) === reading && (!v.kanji || !spell)) out.push({ it: v, kind: v.kanji ? 'reading' : 'same' });
    }
    return out.sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'same' ? -1 : 1));
  };

  const P = { rank, sure, wordForms, fill, guessClass, sentenceData, dupes };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.autofillLogic = P;
})(typeof window !== 'undefined' ? window : globalThis);
