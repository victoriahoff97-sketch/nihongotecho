/* Nihongo Techō – Grammatik gezielt üben (Umformen): Aufgaben bauen, Antwort vergleichen (reine Logik) */
'use strict';
(function (App) {
  const JP = App.jp;
  const D = App.drillLogic = {};

  // ---------- Antwortvergleich (auch für Übersetzen) ----------
  // Ein Satzanfang 私は (auch verschrieben als わたしわ) darf fehlen oder dastehen; のです gilt wie んです
  const SELF = /^(?:私\[わたし\]|私|わたし)[はわ]/;
  const prep = (s) => String(s ?? '').trim().replace(SELF, '').replace(/のです/g, 'んです');

  // solutions: Lösungen in Notation mit Furigana oder als { kanji, kana }, die erste ist die Musterlösung.
  // null = nichts eingegeben · sonst Ergebnis wie App.answerLogic.check
  D.sameAnswer = (raw, solutions, readingsOf) => {
    const A = App.answerLogic;
    const ans = A.clean(raw);
    if (!ans) return null;
    const pairs = (solutions || []).filter(Boolean).map((s) => (typeof s === 'string' ? [JP.plain(s), JP.kana(s)] : [s.kanji || '', s.kana || '']));
    if (!pairs.length) return null;
    const formsOf = (f) => A.forms({ type: 'phrase', jp: '', also: pairs.map(([k, r]) => ({ kanji: f(k), kana: f(r) })) }, readingsOf);
    const r = A.check(prep(ans), formsOf(prep));
    if (r && r.ok) return r;
    // wie die alte Übersetzen-Prüfung: は/わ, へ/え, を/お und ー sind egal – hier auch, wenn Kanji in der Antwort stehen
    const loose = (s) => s.replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ー/g, '');
    const r2 = A.check(loose(prep(ans)), formsOf((s) => loose(prep(s))));
    return r2 && r2.ok ? { ok: true, exact: false, missing: [], answer: ans } : r;
  };

  // Lösungen einer Übersetzen-Aufgabe: Musterlösung, ihre getrennt gespeicherte Lesung (eigene Sätze), weitere richtige
  D.solutionsOf = (e) => [e.jp].concat(e.kana ? [{ kanji: JP.plain(e.jp), kana: e.kana }] : [], e.alt || []);

  // ---------- Umform-Aufgaben zu 〜んです ----------
  // Fall = Wortart (v Verb · i い-Adjektiv · n Nomen/な-Adjektiv) + Zeit; je Fall [Form der Aufgabe, Form vor んです]
  const TENSES = ['pres', 'neg', 'past', 'pastneg'];
  const FORMS = {
    v: [['masu', 'dict'], ['masen', 'nai'], ['mashita', 'ta'], ['masendeshita', 'nakatta']],
    i: [['desu', 'plain'], ['neg', 'negp'], ['past', 'pastp'], ['pastneg', 'pastnegp']],
    n: [['desu', 'attr'], ['neg', 'negp'], ['past', 'pastp'], ['pastneg', 'pastnegp']], // attr = 学生な → 学生なんです
  };
  D.CASES = Object.keys(FORMS).flatMap((k) => TENSES.map((t) => k + '-' + t));
  const kindOf = (w) => {
    // Affixe aus Paketen (～円, ～がる) lassen sich nicht als Satz beantworten
    if (!w || w.type !== 'vocab' || !(w.kana || w.kanji) || /[～〜~]/.test((w.kana || '') + (w.kanji || ''))) return null;
    return w.pos === 'verb' ? 'v' : w.pos === 'i-adj' ? 'i' : w.pos === 'na-adj' || w.pos === 'noun' ? 'n' : null;
  };
  // Nomen beugen sich wie な-Adjektive (学生です · 学生じゃないです · 学生でした)
  const formOf = (w, kind, f) => (kind === 'v' ? JP.conj(w, f) : JP.adj(kind === 'n' ? Object.assign({}, w, { pos: 'na-adj' }) : w, f));
  // Verb mit Partikel-Muster (友達|に|会う): der Teil vor dem Verb steht mit in der Aufgabe
  const prefixOf = (w) => {
    const u = w.use && w.use[0] && JP.useText(w.use[0].jp);
    const d = JP.conj(w, 'dict');
    return u && u.length > d.length && u.endsWith(d) ? u.slice(0, -d.length) : '';
  };

  D.task = (word, caseId, question = false) => {
    const [kind, tense] = caseId.split('-');
    const [pf, sf] = FORMS[kind][TENSES.indexOf(tense)];
    const pre = kind === 'v' ? prefixOf(word) : '';
    const end = question ? 'か。' : '。';
    return { case: caseId, q: !!question, word, prompt: pre + formOf(word, kind, pf) + end, solution: pre + formOf(word, kind, sf) + 'んです' + end };
  };

  // Eine Runde aus n Aufgaben, nur Wörter mit known(it). Wortarten wechseln sich ab; die なんです-Falle
  // (Nomen/な-Adjektiv) kommt mindestens zweimal, wenn es solche Wörter gibt. Leer, wenn kein Wort passt.
  D.round = ({ words, known, n = 10, rnd = Math.random }) => {
    const by = { v: [], i: [], n: [] };
    (words || []).forEach((w) => { const k = kindOf(w); if (k && known(w)) by[k].push(w); });
    const kinds = Object.keys(by).filter((k) => by[k].length);
    if (!kinds.length) return [];
    const pick = (a) => a[Math.floor(rnd() * a.length)];
    const seen = new Set();
    const used = new Set(); // ein Wort kommt erst wieder, wenn alle seiner Art dran waren
    const make = (kind) => {
      let fresh = by[kind].filter((x) => !used.has(x.id));
      if (!fresh.length) { by[kind].forEach((x) => used.delete(x.id)); fresh = by[kind]; }
      let w, tense, q;
      for (let t = 0; t < 30; t++) {
        w = pick(fresh); tense = pick(TENSES); q = rnd() < 0.25;
        if (!seen.has(w.id + kind + tense + q)) break;
      }
      seen.add(w.id + kind + tense + q);
      used.add(w.id);
      return D.task(w, kind + '-' + tense, q);
    };
    const out = [];
    if (by.n.length) out.push(make('n'), make('n'));
    const off = Math.floor(rnd() * kinds.length);
    while (out.length < n) out.push(make(kinds[(out.length + off) % kinds.length]));
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out.slice(0, n);
  };

  // Feld eines Seed-Eintrags, auch wenn der Nutzer den Eintrag bearbeitet hat (dann bringt der Seed-Abgleich keine neuen Felder)
  D.field = (it, key, seed = (typeof window !== 'undefined' ? window.SEED : undefined)) => {
    if (it && it[key] !== undefined) return it[key];
    const s = it && Array.isArray(seed) ? seed.find((x) => x && x.id === it.id) : null;
    return s ? s[key] : undefined;
  };
})(window.App);
