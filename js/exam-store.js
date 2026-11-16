/* Nihongo Techō – Prüfungen: Stand speichern (IndexedDB, Speicherbereich meta, Schlüssel „exams“)
   { runs: { stufe: Durchgang }, best: { stufe: { pct, parts, date } }, seen: { stufe: [Frage-IDs] } }
   Jede Antwort wird sofort geschrieben – man kann mitten in der Prüfung aufhören und später weitermachen.
   Liegt in der Sicherung (backup-logic.js: META_KEYS) und im Backup von Hand. Gelesen wird immer frisch aus der
   Datenbank, damit ein Wiederherstellen sofort gilt. */
'use strict';
(function (App) {
  const KEY = 'exams', SEEN_MAX = 300;
  const empty = () => ({ runs: {}, best: {}, seen: {} });
  const E = App.exams = {};
  // Letzter gelesener Stand für Seiten, die sofort zeichnen müssen (Lernstand-Karten); jedes load/save frischt ihn auf
  E.cache = empty();

  E.load = async () => {
    const m = await App.db.get('meta', KEY);
    E.cache = Object.assign(empty(), m && m.value ? m.value : {});
    return E.cache;
  };
  const save = async (st) => {
    await App.db.put('meta', { key: KEY, value: st });
    E.cache = st;
    if (App.backup && App.backup.noteChange) App.backup.noteChange();
    App.emit && App.emit('exams');
    return st;
  };
  // Änderungen laufen streng nacheinander: schnelles Tippen (Antwort + Weiter) darf sich nicht gegenseitig überschreiben
  let chain = Promise.resolve();
  const serial = (fn) => (...args) => (chain = chain.then(() => fn(...args), () => fn(...args)));

  E.replace = serial(async (value) => save(Object.assign(empty(), value || {})));

  E.start = serial(async (stage, run) => { const st = await E.load(); st.runs[stage] = run; return save(st); });
  E.discard = serial(async (stage) => { const st = await E.load(); delete st.runs[stage]; return save(st); });
  // Antwort sofort merken; pos = nächste Frage
  E.answer = serial(async (stage, index, choice) => {
    const st = await E.load(), run = st.runs[stage];
    if (!run) return st;
    run.answers[index] = choice;
    run.pos = Math.min(index + 1, run.answers.length);
    return save(st);
  });
  E.goto = serial(async (stage, index) => {
    const st = await E.load(), run = st.runs[stage];
    if (!run) return st;
    run.pos = Math.max(0, Math.min(index, run.answers.length));
    return save(st);
  });
  // Abschluss: Durchgang raus, bestes Ergebnis merken, gestellte Fragen als „gesehen“ (für Abwechslung beim nächsten Mal)
  E.finish = serial(async (stage, score, now = Date.now()) => {
    const st = await E.load(), run = st.runs[stage];
    if (!run) return st;
    delete st.runs[stage];
    if (App.examLogic.betterBest(st.best[stage], score)) st.best[stage] = { pct: score.pct, passed: score.passed, parts: score.parts, date: now };
    st.seen[stage] = (st.seen[stage] || []).concat(App.examLogic.flat(run).map((q) => q.id)).slice(-SEEN_MAX);
    // letzte Auswertung, damit man die Lösungen auch später noch ansehen kann (nur die jüngste)
    st.last = { stage, run, score, date: now };
    return save(st);
  });
})(window.App);
