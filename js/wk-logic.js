/* Nihongo Techō – WaniKani: reine Regeln für „Kanji schreiben nach WaniKani-Level“ (ohne Speicher, ohne Netz) */
'use strict';
(function (App) {
  // Zustand: kanji = Zeichen → { id, level, pos, en, on, kun } · stage = Zeichen → WaniKani-Stufe (fehlt = noch nicht begonnen)
  const K = App.wkLogic = {};
  K.MASTER = 7; // zum Schreiben kommt ein Kanji ab Master (7), Enlightened (8), Burned (9) – Guru (5/6) reicht nicht
  const STAGES = ['in den Lektionen', 'Apprentice 1', 'Apprentice 2', 'Apprentice 3', 'Apprentice 4', 'Guru 1', 'Guru 2', 'Master', 'Enlightened', 'Burned'];
  K.stageName = (n) => STAGES[n] || 'noch nicht begonnen';
  K.empty = () => ({ kanji: {}, stage: {} });

  // Eine Seite von /v2/subjects?types=kanji einarbeiten (auch Nachträge über updated_after)
  K.mergeSubjects = (state, page) => {
    ((page && page.data) || []).forEach((d) => {
      const x = d && d.data;
      if (!x || d.object !== 'kanji' || !x.characters) return;
      const c = x.characters;
      if (x.hidden_at) { delete state.kanji[c]; delete state.stage[c]; return; }
      const read = (type) => (x.readings || []).filter((r) => r.type === type).map((r) => r.reading);
      state.kanji[c] = {
        id: d.id, level: x.level, pos: x.lesson_position || 0,
        en: (x.meanings || []).filter((m) => m.accepted_answer !== false).sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0)).map((m) => m.meaning),
        on: read('onyomi').map(App.jp.toKata), kun: read('kunyomi'),
      };
    });
    return state;
  };
  // Eine Seite von /v2/assignments?subject_types=kanji einarbeiten; Subjects müssen vorher da sein
  K.mergeAssignments = (state, page) => {
    const byId = new Map(Object.entries(state.kanji).map(([c, k]) => [k.id, c]));
    ((page && page.data) || []).forEach((d) => {
      const c = d && d.data && byId.get(d.data.subject_id);
      if (c) state.stage[c] = d.data.srs_stage;
    });
    return state;
  };

  // Level → Zeichen in WaniKani-Reihenfolge
  K.levels = (state) => {
    const m = new Map();
    Object.entries(state.kanji).sort(([, a], [, b]) => a.level - b.level || a.pos - b.pos || a.id - b.id)
      .forEach(([c, k]) => { if (!m.has(k.level)) m.set(k.level, []); m.get(k.level).push(c); });
    return m;
  };
  const on = (state, wkLevels, c) => { const k = state.kanji[c]; return !!k && (wkLevels || []).includes(k.level); };
  K.ready = (state, wkLevels, c) => on(state, wkLevels, c) && (state.stage[c] || 0) >= K.MASTER;

  // Quelle der Schreib-Runde: genki · n5 · wk · all. ctx = { state, wkLevels, isN5(it) }
  K.SOURCES = ['all', 'genki', 'n5', 'wk'];
  const isGenki = (it) => /^Genki/.test(it.source || '');
  K.inSource = (source, it, ctx) => (source === 'genki' ? isGenki(it) : source === 'n5' ? !!ctx.isN5(it) : source === 'wk' ? on(ctx.state, ctx.wkLevels, it.char) : true);
  // readUnlocked(it) = die bisherige Regel „kann ich in der App lesen“
  K.unlocked = (source, it, ctx, readUnlocked) => {
    const wk = K.ready(ctx.state, ctx.wkLevels, it.char);
    return source === 'wk' ? wk : source === 'all' ? wk || !!readUnlocked(it) : !!readUnlocked(it);
  };
  // Reihenfolge der neuen Kanji; base = bisherige Lernreihenfolge (Lektion, dann Listenplatz)
  K.compare = (source, ctx, base) => {
    const k = (it) => ctx.state.kanji[it.char];
    const wk = (a, b) => k(a).level - k(b).level || k(a).pos - k(b).pos || base(a, b);
    if (source === 'wk') return wk;
    if (source !== 'all') return base;
    const group = (it) => (isGenki(it) ? 0 : ctx.isN5(it) ? 1 : on(ctx.state, ctx.wkLevels, it.char) ? 2 : 3);
    return (a, b) => { const ga = group(a), gb = group(b); return ga - gb || (ga === 2 ? wk(a, b) : base(a, b)); };
  };

  // Kanji eines Levels, die es in der App noch nicht gibt – als fertige Einträge (Kennung wie überall: k-<hex>)
  K.missing = (state, level, hasChar) => (K.levels(state).get(level) || []).filter((c) => !hasChar(c)).map((c) => {
    const k = state.kanji[c];
    return { id: 'k-' + c.codePointAt(0).toString(16), type: 'kanji', char: c, source: 'WaniKani', de: '', en: k.en.join(', '), on: k.on, kun: k.kun, words: [], tags: [], _wk: true };
  });
  // Automatisch angelegte Einträge eines Levels (level null = alle), die niemand angefasst hat: kein Lernstand
  // (Lesen/Schreiben), nicht bearbeitet, nicht markiert, in keiner Stunde verwendet
  K.removable = (state, level, items, { srs, refs }) => items.filter((it) => {
    const k = it._wk && state.kanji[it.char];
    if (!k || (level != null && k.level !== level)) return false;
    if (it._edited || it.star || (Array.isArray(it.marks) && it.marks.length)) return false;
    return !srs.has(it.id) && !srs.has('w:' + it.id) && !(refs && refs.has(it.id));
  }).map((it) => it.id);

  // Zahlen einer Level-Zeile: ready = ab Master · fresh = noch nicht in der App · written = Schreib-Stand vorhanden
  K.levelStats = (state, level, hasChar, wrote) => {
    const cs = K.levels(state).get(level) || [];
    return {
      total: cs.length, ready: cs.filter((c) => (state.stage[c] || 0) >= K.MASTER).length,
      fresh: cs.filter((c) => !hasChar(c)).length, written: cs.filter((c) => wrote(c)).length,
    };
  };
})(window.App);
