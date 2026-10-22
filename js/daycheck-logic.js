/* Nihongo Techō – Tagesliste „今日“ auf der Startseite: was heute schon erledigt ist (reine Logik) */
'use strict';
(function (App) {
  // Gespeichert in settings.dayLog = { date: 'JJJJ-MM-TT', done: { listen, new, kanji, conj, nhk }, listenSec, reviews, celebrated }.
  // Ein neuer Tag beginnt leer – es wird nur festgehalten, was gemacht wurde, nie was fehlt.
  // Wiederholen und Anwenden werden nicht gespeichert, sondern beim Anzeigen aus dem Lernstand und den Einträgen berechnet.
  const D = App.dayCheckLogic = {};
  D.MAIN = ['review', 'apply', 'listen'];
  D.OPTIONAL = ['new', 'kanji', 'conj', 'nhk'];

  D.today = (log, today) => (log && log.date === today ? log : { date: today, done: {} });
  D.isDone = (log, today, key) => !!D.today(log, today).done[key];

  // Neues Log mit gesetztem (oder entferntem) Haken – oder null, wenn sich nichts ändert (dann nicht speichern)
  D.mark = (log, today, key, on = true) => {
    const cur = D.today(log, today);
    if (!!cur.done[key] === !!on) return null;
    const done = Object.assign({}, cur.done);
    if (on) done[key] = true; else delete done[key];
    return Object.assign({}, cur, { done });
  };

  // Listening ist abgehakt, sobald heute insgesamt eine Minute wirklich abgespielt wurde (über mehrere Stücke zusammengezählt)
  D.LISTEN_SEC = 60;
  D.listenNeed = (log, today) => Math.max(0, D.LISTEN_SEC - (D.today(log, today).listenSec || 0));
  D.addListen = (log, today, sec) => {
    const cur = D.today(log, today);
    const listenSec = Math.round((cur.listenSec || 0) + Math.max(0, sec));
    const done = listenSec >= D.LISTEN_SEC ? Object.assign({}, cur.done, { listen: true }) : cur.done;
    return Object.assign({}, cur, { listenSec, done });
  };
  // Abspielzeit aus gemeldeten Zeitpunkten: nur kleine Schritte vorwärts zählen (Pause, Vorspulen und Zurückspringen nicht)
  D.MAX_STEP = 3;
  D.step = (last, t) => (last == null || !(t > last) || t - last > D.MAX_STEP ? 0 : t - last);

  // Wiederholen ist abgehakt nach 25 wiederholten Karten – oder, wenn es weniger gibt, sobald nichts mehr fällig ist
  D.REVIEWS = 25;
  D.addReview = (log, today) => {
    const cur = D.today(log, today);
    if ((cur.reviews || 0) >= D.REVIEWS) return null;
    return Object.assign({}, cur, { reviews: (cur.reviews || 0) + 1 });
  };
  D.reviewDone = (log, today, dueLeft) => !dueLeft || (D.today(log, today).reviews || 0) >= D.REVIEWS;

  // main: { review, apply, listen } als Wahrheitswerte
  D.allMain = (main) => D.MAIN.every((k) => !!main[k]);
  // Das Feuerwerk gibt es einmal am Tag – im Moment, in dem alle drei Pflichtpunkte stehen
  D.shouldCelebrate = (log, today, main) => D.allMain(main) && !D.today(log, today).celebrated;
  D.celebrated = (log, today) => Object.assign({}, D.today(log, today), { celebrated: true });
  // … aber nicht mitten im Schreiben: in Anwenden (Tagebuch, Smalltalk) und während einer Übergabe aus dem Browser wartet es,
  // bis man den Bereich verlässt
  D.quiet = (path) => /^\/anwenden(\/|$)/.test(path || '') || path === '/eingang';

  // Eine Karte ist neu, wenn sie noch nie bewertet wurde (zurückgefallene Karten haben Fehlversuche und zählen als Wiederholung)
  D.isNewCard = (s) => !s || (!s.reps && !s.lapses);
})(window.App);
