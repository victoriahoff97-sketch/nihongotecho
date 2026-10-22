/* Nihongo Techō – Tagesliste „今日“ auf der Startseite: was heute schon erledigt ist (reine Logik) */
'use strict';
(function (App) {
  // Gespeichert in settings.dayLog = { date: 'JJJJ-MM-TT', done: { listen, new, kanji, conj, nhk, <eigene> }, listenSec, reviews, celebrated }.
  // Ein neuer Tag beginnt leer – es wird nur festgehalten, was gemacht wurde, nie was fehlt.
  // Wiederholen und Anwenden werden nicht gespeichert, sondern beim Anzeigen aus dem Lernstand und den Einträgen berechnet.
  const D = App.dayCheckLogic = {};
  D.KEYS = ['review', 'apply', 'listen', 'new', 'kanji', 'conj', 'nhk'];

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

  // ---------- Eigene Ziele (settings.dayGoals) ----------
  // { level: { <key>: 'goal' | 'opt' | 'off' }, reviews, listenMin, own: [{ id, title }] } – null = alles wie am Anfang.
  // goal = zählt fürs Feuerwerk, opt = „Wenn du magst“, off = wird nicht gezeigt. Gilt auf allen Geräten (steckt im Backup).
  D.LEVELS = ['goal', 'opt', 'off'];
  D.DEFAULT_LEVEL = { review: 'goal', apply: 'goal', listen: 'goal', new: 'opt', kanji: 'opt', conj: 'opt', nhk: 'opt' };
  D.REVIEWS = 25;
  D.LISTEN_MIN = 1;
  D.NUM = { reviews: { min: 5, max: 200, by: 5, def: D.REVIEWS }, listenMin: { min: 1, max: 60, by: 1, def: D.LISTEN_MIN } };
  const clampNum = (k, v) => { const n = D.NUM[k]; return Number.isFinite(v) ? Math.min(n.max, Math.max(n.min, Math.round(v))) : n.def; };

  D.goals = (cfg) => {
    const c = cfg || {}, lv = c.level || {};
    const own = (Array.isArray(c.own) ? c.own : []).filter((o) => o && o.id && o.title && !D.DEFAULT_LEVEL[o.id]);
    const level = {};
    D.KEYS.forEach((k) => { level[k] = D.LEVELS.includes(lv[k]) ? lv[k] : D.DEFAULT_LEVEL[k]; });
    own.forEach((o) => { level[o.id] = D.LEVELS.includes(lv[o.id]) ? lv[o.id] : 'goal'; });
    return { level, reviews: clampNum('reviews', c.reviews), listenMin: clampNum('listenMin', c.listenMin), own: own.map((o) => ({ id: o.id, title: o.title })) };
  };
  // Alle Punkte in Anzeige-Reihenfolge: erst die eingebauten, dann die eigenen
  D.list = (cfg) => {
    const g = D.goals(cfg);
    return D.KEYS.map((key) => ({ key, level: g.level[key] })).concat(g.own.map((o) => ({ key: o.id, level: g.level[o.id], title: o.title, own: true })));
  };
  D.goalKeys = (cfg) => D.list(cfg).filter((x) => x.level === 'goal').map((x) => x.key);

  D.setLevel = (cfg, key, lvl) => {
    const g = D.goals(cfg);
    if (!(key in g.level) || !D.LEVELS.includes(lvl)) return g;
    g.level[key] = lvl;
    return g;
  };
  // Wiederholungen in 5er-, Minuten in 1er-Schritten
  D.bump = (cfg, k, dir) => {
    const g = D.goals(cfg);
    if (D.NUM[k]) g[k] = clampNum(k, g[k] + dir * D.NUM[k].by);
    return g;
  };
  D.addOwn = (cfg, title, id) => {
    const g = D.goals(cfg), t = String(title || '').trim().slice(0, 60);
    if (!t || !id) return g;
    g.own.push({ id, title: t });
    g.level[id] = 'goal';
    return g;
  };
  D.removeOwn = (cfg, id) => {
    const g = D.goals(cfg);
    g.own = g.own.filter((o) => o.id !== id);
    delete g.level[id];
    return g;
  };

  // Listening ist abgehakt, sobald heute insgesamt die gewählten Minuten wirklich abgespielt wurden (über mehrere Stücke
  // zusammengezählt) – oder mit „Gehört“ (done.listen). Beim Anzeigen gerechnet, damit ein geändertes Ziel sofort gilt
  D.LISTEN_SEC = D.LISTEN_MIN * 60;
  D.listenNeed = (log, today, need = D.LISTEN_SEC) => Math.max(0, need - (D.today(log, today).listenSec || 0));
  D.listenDone = (log, today, need = D.LISTEN_SEC) => D.isDone(log, today, 'listen') || D.listenNeed(log, today, need) === 0;
  D.addListen = (log, today, sec) => {
    const cur = D.today(log, today);
    return Object.assign({}, cur, { listenSec: Math.round((cur.listenSec || 0) + Math.max(0, sec)) });
  };
  // Abspielzeit aus gemeldeten Zeitpunkten: nur kleine Schritte vorwärts zählen (Pause, Vorspulen und Zurückspringen nicht)
  D.MAX_STEP = 3;
  D.step = (last, t) => (last == null || !(t > last) || t - last > D.MAX_STEP ? 0 : t - last);

  // Wiederholen ist abgehakt nach den gewählten Karten (anfangs 25) – oder, wenn es weniger gibt, sobald nichts mehr fällig ist
  D.addReview = (log, today, need = D.REVIEWS) => {
    const cur = D.today(log, today);
    if ((cur.reviews || 0) >= need) return null;
    return Object.assign({}, cur, { reviews: (cur.reviews || 0) + 1 });
  };
  D.reviewDone = (log, today, dueLeft, need = D.REVIEWS) => !dueLeft || (D.today(log, today).reviews || 0) >= need;

  // state: { <key>: erledigt? } – fürs Feuerwerk zählen nur die Punkte auf „Ziel“; ohne ein einziges Ziel gibt es keins
  D.allMain = (state, cfg) => { const ks = D.goalKeys(cfg); return ks.length > 0 && ks.every((k) => !!state[k]); };
  // Das Feuerwerk gibt es einmal am Tag – im Moment, in dem alle Ziele stehen
  D.shouldCelebrate = (log, today, state, cfg) => D.allMain(state, cfg) && !D.today(log, today).celebrated;
  D.celebrated = (log, today) => Object.assign({}, D.today(log, today), { celebrated: true });
  // … aber nicht mitten im Schreiben: in Anwenden (Tagebuch, Smalltalk) und während einer Übergabe aus dem Browser wartet es,
  // bis man den Bereich verlässt
  D.quiet = (path) => /^\/anwenden(\/|$)/.test(path || '') || path === '/eingang';

  // Eine Karte ist neu, wenn sie noch nie bewertet wurde (zurückgefallene Karten haben Fehlversuche und zählen als Wiederholung)
  D.isNewCard = (s) => !s || (!s.reps && !s.lapses);
})(window.App);
