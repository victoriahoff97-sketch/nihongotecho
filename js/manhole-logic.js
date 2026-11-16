/* Nihongo Techō – Gullideckel: Zähler, Freischalten, Fortschritt, Startwerte (reine Logik, ohne DOM). Daten als 'JJJJ-MM-TT' (Ortszeit) */
'use strict';
(function (App) {
  const L = App.manholeLogic = {};
  const STAT_KEYS = ['reviews', 'kanjiWritten', 'translations', 'openDays', 'forumPosts', 'dailySentences',
    'nightOwl', 'earlyBird', 'newYear', 'comeback', 'bestRun'];

  // Anzahl Sätze: getrennt an 。！？!? und Zeilenumbruch, leere Teile zählen nicht
  L.sentences = (text) => String(text || '').split(/[。！？!?\n]+/).filter((s) => s.trim()).length;

  // Längste Reihe der Gesamt-Flamme (Tage mit '*'), Joker und Urlaub wie bei den Flammen
  L.longestFlame = (history, off, today) => {
    const done = new Set();
    for (const d in history || {}) if (String(history[d]).includes('*')) done.add(d);
    let best = 0;
    for (const d of new Set([...done, today])) best = Math.max(best, App.streakLogic.streak(done, off, d).n);
    return best;
  };

  L.metrics = (snap) => {
    const st = snap.stats || {};
    const done = Object.keys(snap.history || {}).filter((d) => String(snap.history[d]).includes('*'));
    const m = {
      words: snap.words || 0, kanji: snap.kanji || 0, grammar: snap.grammar || 0,
      phrases: snap.phrases || 0, counters: snap.counters || 0,
      diary: (snap.diaryTexts || []).reduce((n, t) => n + L.sentences(t), 0),
      ownVocab: snap.ownVocab || 0, nhk: snap.nhk || 0,
      dayAll: done.length,
      flame: L.longestFlame(snap.history, snap.off || new Set(), snap.today),
      examsPassed: snap.examsPassed || 0, exams100: snap.exams100 || 0, lessons: snap.lessons || 0,
      listenMin: Math.floor((st.listenSec || 0) / 60),
      collected: snap.collected || 0
    };
    for (const k of STAT_KEYS) m[k] = st[k] || 0;
    return m;
  };

  // IDs, deren Meilenstein erreicht ist und die noch nicht gesammelt sind. 'today' wird vom Aufrufer als Datum gespeichert.
  L.check = (defs, m, have, today) => {
    const got = have || {};
    const fresh = [];
    let prefs = 0;
    for (const d of defs) {
      if (d.pref === null) continue;
      if (got[d.id]) prefs++;
      else if ((m[d.metric] || 0) >= d.n) { fresh.push(d.id); prefs++; }
    }
    for (const d of defs) {
      if (d.pref !== null || got[d.id]) continue;
      if (prefs >= d.n) fresh.push(d.id);
    }
    return fresh;
  };

  // Schwellen geändert (Rev. 2: Kanji ab 100 lesen / 500 schreiben): gesammelte Deckel dieser Metriken, die nach den
  // neuen Schwellen noch nicht erreicht sind, fallen kommentarlos weg – ebenso der Bonus, wenn dann keine 47 mehr da sind.
  // Tage mit der App: verschiedene Kalendertage aus allen Spuren (Tagesliste, Bewertungen, angelegte Einträge) + heute.
  // Untere Grenze – die Tagesliste gibt es erst seit Oktober, also zählen auch Lern- und Speicher-Tage.
  L.activeDays = (dates, today) => { const s = new Set((dates || []).filter((d) => /^\d{4}-\d\d-\d\d$/.test(d))); if (today) s.add(today); return s.size; };

  // Rev. 3: Wörter ab 100, Grammatik 25/100, NHK 50
  L.REV = 3;
  L.REV_METRICS = ['kanji', 'kanjiWritten', 'words', 'grammar', 'nhk'];
  L.prune = (defs, m, have) => {
    const out = Object.assign({}, have || {});
    defs.forEach((d) => { if (out[d.id] && L.REV_METRICS.includes(d.metric) && (m[d.metric] || 0) < d.n) delete out[d.id]; });
    const prefs = defs.filter((d) => d.pref !== null && out[d.id]).length;
    defs.forEach((d) => { if (d.pref === null && out[d.id] && prefs < d.n) delete out[d.id]; });
    return out;
  };

  L.progress = (def, m) => {
    const have = m[def.metric] || 0;
    return { have, need: def.n, left: Math.max(0, def.n - have) };
  };

  // Nächster Deckel (nicht geheim, nicht gesammelt, nicht der Bonus) mit dem kleinsten Rest-Anteil
  L.nearest = (defs, m, have) => {
    const got = have || {};
    let best = null, bestRatio = Infinity;
    for (const d of defs) {
      if (d.secret || d.pref === null || got[d.id]) continue;
      const p = L.progress(d, m);
      const r = p.left / p.need;
      if (r < bestRatio) { best = d; bestRatio = r; }
    }
    return best;
  };

  // Startwerte aus den vorhandenen Daten, nur einmal
  L.seedStats = (stats, seed) => {
    const s = { ...(stats || {}) };
    if (s.seeded) return s;
    for (const k of ['reviews', 'kanjiWritten', 'openDays']) s[k] = (seed && seed[k]) || 0;
    s.seeded = 1;
    return s;
  };

  L.bump = (stats, key, by = 1) => ({ ...(stats || {}), [key]: ((stats && stats[key]) || 0) + by });
  L.max = (stats, key, value) => ({ ...(stats || {}), [key]: Math.max((stats && stats[key]) || 0, value) });

  L.timeFlags = (date) => {
    const h = date.getHours();
    return {
      nightOwl: h >= 23 || h < 4,
      earlyBird: h >= 4 && h < 7,
      newYear: date.getMonth() === 0 && date.getDate() <= 3
    };
  };

  // Mindestens 7 Tage Pause, und kein Urlaubstag dazwischen
  L.comebackDue = (lastOpen, today, off) => {
    if (!lastOpen || lastOpen >= today) return false;
    let d = App.streakLogic.addDays(lastOpen, 1), gap = 1;
    for (; d < today; d = App.streakLogic.addDays(d, 1), gap++) if (off.has(d)) return false;
    return gap >= 7;
  };
})(window.App = window.App || {});
