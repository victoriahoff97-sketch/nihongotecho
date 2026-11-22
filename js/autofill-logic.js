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

  // Verbklasse geraten, wenn das Wörterbuch nichts weiß. kanji (optional) entscheidet bei gleicher Lesung:
  // 帰る (u) / 変える (ru), 切る (u) / 着る (ru), 作る (u, endet nur auf „くる“) / 来る (irr).
  // Kanji, deren 〜る trotz i/e-Laut ein う-Verb ist (帰る, 入る, 要る, 切る, 知る, 走る, 減る …), wenn nur „る“ folgt
  const U_KANJI = '帰入要切知走蹴減滑握限散湿焦練照茂参陥翻罵遮捻嘲蘇甦喋覆交混';
  // dieselben Wörter in Kana (ganzes Wort bzw. Wortende): bei kurzen Lesungen das häufigere う-Verb
  const U_KANA = ['かえる', 'はいる', 'しる', 'はしる', 'ける', 'へる', 'ちる', 'しゃべる', 'すべる', 'にぎる', 'かぎる', 'まじる', 'まいる', 'あせる', 'いじる'];
  const U_KANA_END = ['しゃべる', 'すべる', 'にぎる', 'かぎる', 'まじる', 'はしる', 'はいる', 'まいる', 'うらぎる', 'よこぎる', 'きにいる'];
  const guessClass = (kana, kanji) => {
    const k = hira(String(kana || '').trim()), w = String(kanji || '').trim();
    if (w) {
      if (/(する|為る|ずる)$/.test(w)) return 'irr';
      if (/来る$/.test(w)) return 'irr';
    } else {
      if (k === 'くる' || /する$/.test(k)) return 'irr';
    }
    if (!/る$/.test(k)) return 'u';
    // lange, eindeutige Wortenden (しゃべる, 混じる …) gelten mit und ohne Schreibung
    if (U_KANA_END.some((x) => k.endsWith(x))) return 'u';
    if (w) {
      // Schreibung 〇る: Kanji direkt vor る → Lesung des Kanji entscheidet (U_KANJI), sonst der Laut vor る
      const before = w.slice(-2, -1);
      if (/る$/.test(w) && U_KANJI.includes(before)) return 'u';
    } else if (U_KANA.includes(k)) return 'u';
    const prev = k.slice(-2, -1);
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
      it.v = { cls: v.cls || opts.cls || guessClass(it.kana || '', it.kanji || ''), inf, ich: v.ich || inf.replace(/(e?n)$/, 'e'), pp: v.pp || ('ge' + inf.replace(/(e?n)$/, 't')), aux: v.aux || 'habe', sep: v.sep || '', obj: v.obj || [] };
      it.cat = cat;
      if (it.v.obj.length && !it.cat.includes('objekt')) it.cat.push('objekt');
    } else if (/adj/.test(it.pos || '')) {
      const a = o('a');
      it.cat = ['beschreibung'];
      // Nomen mit Artikel überspringen: ばか „der Dummkopf; dumm“ → „dumm“
      const adjFirst = String(it.de || '').split(/[,;]/).map((s) => s.replace(/\(.*?\)/g, '').trim())
        .find((s) => s && !/^(der|die|das|den|dem|ein|eine|einen)\s/i.test(s)) || first;
      it.a = { de: a.de || adjFirst, subj: a.subj && a.subj.length ? a.subj : ['ding', 'ort', 'person', 'essen'] };
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

  // ---------- Deutsch aus dem Wörterbuch wählen ----------
  // Bedeutungen einzeln: am „;“ außerhalb von Klammern getrennt, aufgeräumt („(als Präfix) öffentliche …“ →
  // „öffentliche“), ohne Doppelte. Kurze Klammern wie „(sich)“ und Wortanfänge wie „Handels…“ bleiben.
  const cleanGloss = (g) => String(g || '').trim()
    .replace(/^(\((?=[^)]*[\s.])[^)]*\)\s*)+/, '')
    .replace(/\s+(…|\.\.\.)+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const glossList = (s) => {
    const str = String(s || ''), parts = [];
    let depth = 0, from = 0;
    for (let i = 0; i <= str.length; i++) {
      const c = str[i];
      if (c === '(' || c === '（') depth++;
      else if ((c === ')' || c === '）') && depth > 0) depth--;
      else if (i === str.length || (c === ';' && depth === 0)) { parts.push(str.slice(from, i)); from = i + 1; }
    }
    const out = [];
    for (const p of parts) { const g = cleanGloss(p); if (g && !out.includes(g)) out.push(g); }
    return out;
  };
  // Kern einer Bedeutung: ohne Klammern und Artikel („der Lehrer“ → „Lehrer“, „ausfallen (Haare)“ → „ausfallen“)
  const core = (g) => g.replace(/\([^)]*\)/g, ' ').replace(/^(der|die|das|ein|eine)\s+/i, '').replace(/\s+/g, ' ').trim();
  // Nomen bzw. Nomengruppe („Stammgast“, „häufiger Besucher“): das letzte Wort ist groß geschrieben
  const lastWord = (g) => core(g).split(' ').pop() || '';
  const isNounish = (g) => /^[A-ZÄÖÜ]/.test(lastWord(g));
  // Verb bzw. Wendung („üben“, „Vorwürfe machen“, „jmdn. ärgern“): endet auf ein klein geschriebenes 〜(e)n
  const isVerbish = (g) => /^[a-zäöüß]+(e?n|ern|eln)$/.test(lastWord(g)) && !/^(ein|eine|kein|einen|keinen)$/.test(lastWord(g));
  const NOUNS = ['noun', 'time', 'counter', 'pronoun'];
  const ADJS = ['i-adj', 'na-adj', 'adverb'];
  // passt die Bedeutung zur Wortart? (null = Wortart ohne Vorliebe)
  const fitsPos = (g, pos) => {
    if (NOUNS.includes(pos)) return isNounish(g);
    if (pos === 'verb') return isVerbish(g);
    if (ADJS.includes(pos)) return !isNounish(g) && !isVerbish(g) && !/\bsein$/.test(core(g));
    return null;
  };
  // kurz = höchstens 4 Wörter ohne Klammern und 6 mit; „Handels…“ (nur ein Wortanfang) zählt nie als kurz
  const isShort = (g) => core(g).split(' ').filter(Boolean).length <= 4 && g.split(' ').length <= 6 && !/…$/.test(g);

  // Das Deutsch fürs Formular: zuerst eine kurze Bedeutung, die zur Wortart passt (Nomen → Übergang statt übergehen),
  // dann irgendeine kurze, dann eine passende, sonst die erste. alts = die übrigen Bedeutungen zum Antippen.
  const pickGerman = (de, pos) => {
    const list = glossList(de);
    if (!list.length) return { de: '', alts: [] };
    const fit = (g) => fitsPos(g, pos) !== false;
    const best = list.find((g) => fit(g) && isShort(g)) || list.find(isShort) || list.find(fit) || list[0];
    return { de: best, alts: list.filter((g) => g !== best) };
  };

  const P = { rank, sure, wordForms, fill, guessClass, sentenceData, dupes, glossList, pickGerman };
  if (typeof module !== 'undefined' && module.exports) module.exports = P; else root.App.autofillLogic = P;
})(typeof window !== 'undefined' ? window : globalThis);
