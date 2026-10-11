/* Nihongo Techō – Übersetzungsübungen: wer in den Topf kommt (Lernschlange) und wie eine Runde entsteht. Nur Logik, kein DOM. Browser: App.translateLogic, Node: module.exports */
'use strict';
(function (root) {
  // Der Satzgenerator braucht die deutschen Satzbau-Angaben (n, v, a, t) – unbearbeitete Paket-Wörter haben sie nicht,
  // Ausdrücke nur mit gen (Zeitwörter, Farben)
  const patternWord = (v) => !!v.de && !(v._pack && !v._edited) && (v.type !== 'phrase' || !!v.gen);

  // Erster Beispielsatz mit deutscher Übersetzung (eine englische taugt nicht als deutsche Aufgabe)
  const ownSentence = (it) => (it.examples || []).find((e) => e && String(e.jp ?? '').trim() && String(e.de ?? '').trim());

  // Topf aus der Lernschlange. state(it): 'queue' = in der Lernschlange; filler(it): als Füllwort erlaubt (kann ich schon).
  //   queue     Ids aus der Lernschlange (Wörter, Ausdrücke, Grammatik)
  //   pool      Wörter für die Satzmuster: Lernschlange + Füllwörter
  //   sentences Wörter der Schlange, die in kein Muster passen (Paket-Wörter, Ausdrücke) – sie kommen mit ihrem eigenen Beispielsatz dran
  //   grammar   Grammatik in der Lernschlange · grammarKnown: Grammatik, die schon sitzt (zum Dazuwählen)
  const queuePot = (words, grammar, state, filler) => {
    const queue = new Set(), pool = [], sentences = [];
    words.forEach((w) => {
      const inQ = state(w) === 'queue';
      if (inQ) queue.add(w.id);
      const pat = patternWord(w);
      if (pat && (inQ || filler(w))) pool.push(w);
      if (inQ && (!pat || w.type === 'phrase')) {
        const e = ownSentence(w);
        if (e) sentences.push({ g: w, jp: e.jp, de: e.de, kana: e.kana, words: [w] });
      }
    });
    const inQueue = grammar.filter((g) => state(g) === 'queue');
    inQueue.forEach((g) => queue.add(g.id));
    return { queue, pool, sentences, grammar: inQueue, grammarKnown: grammar.filter((g) => filler(g) && state(g) !== 'queue') };
  };

  // Eine Runde aus höchstens n Sätzen. Quellen: Satzmuster der Grammatik (immer neue Sätze), ihre Beispielsätze,
  // eigene Sätze von Wörtern (sentences).
  // Mit queue (Set von Ids) haben Wörter daraus in den Lücken Vorrang, und jeder Satz enthält etwas aus der Schlange:
  // den Grammatikpunkt oder mindestens ein Wort.
  // d: fill (JP.fill), plain (JP.plain), pick, shuffle, meaning (App.exMeaning), rnd
  const build = ({ grammar, pool, n, sentences = [], queue = null }, d) => {
    const rnd = d.rnd || Math.random;
    const prefer = queue ? (it) => queue.has(it.id) : null;
    const out = [];
    const seen = new Set();
    const add = (e) => { const key = d.plain(e.jp); if (!seen.has(key)) { seen.add(key); out.push(e); } };
    const fixed = sentences.map((s) => Object.assign({ words: [] }, s));
    grammar.filter((g) => !queue || queue.has(g.id)).forEach((g) => (g.examples || []).forEach((e) => fixed.push({ g, jp: e.jp, de: d.meaning(e), kana: e.kana, words: [] })));
    const rest = d.shuffle(fixed);
    const withPat = grammar.filter((g) => (g.patterns || []).length);
    let guard = 0;
    while (out.length < n && guard++ < n * 30) {
      if (withPat.length && (rnd() < 0.72 || !rest.length)) {
        const g = d.pick(withPat);
        const r = d.fill(d.pick(g.patterns), pool, prefer);
        if (!r || (queue && !queue.has(g.id) && !r.words.some((w) => w && queue.has(w.id)))) continue;
        add({ g, jp: r.jp, de: r.de, words: r.words, gen: true });
      } else if (rest.length) add(rest.pop());
      else break;
    }
    return d.shuffle(out);
  };

  const api = { patternWord, ownSentence, queuePot, build };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.App.translateLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
