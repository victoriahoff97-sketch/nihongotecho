/* Nihongo Techō – WaniKani: reine Regeln für „Kanji schreiben nach WaniKani-Level“ (ohne Speicher, ohne Netz) */
'use strict';
(function (App) {
  // Zustand: kanji = Zeichen → { id, level, pos, en, on, kun } · stage = Zeichen → WaniKani-Stufe (fehlt = noch nicht begonnen)
  const K = App.wkLogic = {};
  K.MASTER = 7; // zum Schreiben kommt ein Kanji ab Master (7), Enlightened (8), Burned (9) – Guru (5/6) reicht nicht
  const STAGES = ['in den Lektionen', 'Apprentice 1', 'Apprentice 2', 'Apprentice 3', 'Apprentice 4', 'Guru 1', 'Guru 2', 'Master', 'Enlightened', 'Burned'];
  K.stageName = (n) => STAGES[n] || 'noch nicht begonnen';
  K.empty = () => ({ kanji: {}, stage: {}, vocab: {}, vstage: {} });

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

  // ---------- Vokabeln Deutsch → Japanisch ----------
  // Zustand: vocab = WaniKani-Nummer → { c, level, pos, en, kana, p, s } · vstage = WaniKani-Nummer → Stufe.
  // Eine Vokabel kommt in die App, sobald ihr Level eingeschaltet und sie bei WaniKani Master (7) oder höher ist –
  // lesen lernt man sie dort, hier wird sie nur aus dem Deutschen heraus abgefragt (Aktiv-Lernstand, js/write-logic.js).
  // s = kürzester Beispielsatz von WaniKani { ja, en } – Ersatz, wenn weder Paket noch Tatoeba einen haben
  K.V_SCHEMA = 2; // ab 2 mit Beispielsatz – ältere Stände holen die Vokabeln einmal vollständig neu
  const VOCAB = ['vocabulary', 'kana_vocabulary'];
  // Eine Seite von /v2/subjects?types=vocabulary,kana_vocabulary einarbeiten
  K.mergeVocab = (state, page) => {
    ((page && page.data) || []).forEach((d) => {
      const x = d && d.data;
      if (!x || !VOCAB.includes(d.object) || !x.characters) return;
      if (x.hidden_at) { delete state.vocab[d.id]; delete state.vstage[d.id]; return; }
      const first = (list) => list.slice().sort((a, b) => (b.primary ? 1 : 0) - (a.primary ? 1 : 0));
      state.vocab[d.id] = {
        c: x.characters, level: x.level, pos: x.lesson_position || 0,
        en: first((x.meanings || []).filter((m) => m.accepted_answer !== false)).map((m) => m.meaning),
        kana: first((x.readings || []).filter((r) => r.accepted_answer !== false)).map((r) => r.reading),
        p: x.parts_of_speech || [],
      };
      const s = K.shortest(x.context_sentences);
      if (s) state.vocab[d.id].s = s;
    });
    return state;
  };
  // Eine Seite von /v2/assignments?subject_types=vocabulary,kana_vocabulary einarbeiten; Subjects müssen vorher da sein
  K.mergeVocabAssignments = (state, page) => {
    ((page && page.data) || []).forEach((d) => {
      const id = d && d.data && d.data.subject_id;
      if (state.vocab[id]) state.vstage[id] = d.data.srs_stage;
    });
    return state;
  };
  // Level → WaniKani-Nummern in WaniKani-Reihenfolge
  K.vLevels = (state) => {
    const m = new Map();
    Object.entries(state.vocab).sort(([ia, a], [ib, b]) => a.level - b.level || a.pos - b.pos || ia - ib)
      .forEach(([id, v]) => { if (!m.has(v.level)) m.set(v.level, []); m.get(v.level).push(id); });
    return m;
  };
  K.vReady = (state, id) => !!state.vocab[id] && (state.vstage[id] || 0) >= K.MASTER;
  // Kürzester Beispielsatz (nach der Länge des Japanischen) → { ja, en } oder null
  K.shortest = (list) => {
    const ok = (list || []).filter((x) => x && String(x.ja || '').trim());
    if (!ok.length) return null;
    const b = ok.reduce((a, x) => (x.ja.trim().length < a.ja.trim().length ? x : a));
    return { ja: b.ja.trim(), en: String(b.en || '').trim() };
  };

  // WaniKani-Wortarten → Wortart der App (wie App.mapPos); „する verb“ ist nur als „…する“ ein Verb
  K.vPos = (parts, chars) => {
    const t = parts || [], has = (x) => t.includes(x);
    if (has('godan verb')) return { pos: 'verb', cls: 'u' };
    if (has('ichidan verb')) return { pos: 'verb', cls: 'ru' };
    if (has('する verb') && /する$/.test(chars || '')) return { pos: 'verb', cls: 'irr' };
    if (has('い adjective')) return { pos: 'i-adj' };
    if (has('な adjective')) return { pos: 'na-adj' };
    if (has('pronoun')) return { pos: 'pronoun' };
    if (has('counter')) return { pos: 'counter' };
    if (has('conjunction')) return { pos: 'conjunction' };
    if (has('adverb') && !has('noun')) return { pos: 'adverb' };
    if (has('noun') || has('numeral')) return { pos: 'noun' };
    if (has('expression') || has('interjection')) return { pos: 'expression' };
    if (has('prefix') || has('suffix')) return { pos: 'prefix-suffix' };
    return { pos: 'noun' };
  };
  const vId = (id) => 'v-wk' + id;
  const vEntry = (id, v) => {
    const kana = v.kana[0] || v.c, mp = K.vPos(v.p, v.c);
    const it = { id: vId(id), type: 'vocab', source: 'WaniKani', lesson: v.level, kanji: v.kana.length ? v.c : '', kana, de: '', en: v.en.join('; '), pos: mp.pos };
    if (mp.cls) it.v = { cls: mp.cls };
    return Object.assign(it, { examples: [], tags: [], _wk: true });
  };
  // Vokabeln eines Levels ab Master, die es in der App noch nicht gibt. Steht das Wort schon da (gleiche Schreibung und
  // Lesung, z. B. aus Genki oder JLPT – als Vokabel oder Ausdruck), wird es übersprungen – es bleibt dann ganz bei seiner Quelle.
  // hasKey(App.vocabKey) = Wort vorhanden · hasId(Kennung) = schon aus WaniKani angelegt · alts(Eintrag) = weitere Schlüssel (K.altKeys)
  const vFresh = (state, level, { hasKey, hasId, alts }) => {
    const seen = new Set();
    return (K.vLevels(state).get(level) || []).filter((id) => K.vReady(state, id)).map((id) => vEntry(id, state.vocab[id])).filter((it) => {
      const key = App.vocabKey(it);
      if (hasId(it.id) || hasKey(key) || seen.has(key) || (alts ? alts(it) : []).some(hasKey)) return false;
      seen.add(key);
      return true;
    });
  };
  K.vMissing = vFresh;
  // Automatisch angelegte Vokabeln eines Levels (level null = alle), die niemand angefasst hat – wie K.removable
  const untouched = (it, { srs, refs }) => !it._edited && !it.star && !(Array.isArray(it.marks) && it.marks.length)
    && !srs.has(it.id) && !srs.has('w:' + it.id) && !(refs && refs.has(it.id));
  const wkVocab = (it) => !!it._wk && it.type === 'vocab';
  K.vRemovable = (level, items, ctx) => items.filter((it) => wkVocab(it) && (level == null || +it.lesson === level) && untouched(it, ctx)).map((it) => it.id);
  // Unberührte Vokabeln, die bei WaniKani (noch oder wieder) unter Master stehen – z. B. aus der Zeit, als Guru reichte
  K.vBelow = (state, items, ctx) => items.filter((it) => {
    const id = wkVocab(it) && String(it.id).replace(/^v-wk/, '');
    return !!id && !!state.vocab[id] && !K.vReady(state, id) && untouched(it, ctx);
  }).map((it) => it.id);
  // Zahlen einer Level-Zeile: ready = ab Master · fresh = käme beim Einschalten neu dazu · known = kann ich aktiv
  K.vLevelStats = (state, level, ctx) => {
    const ids = K.vLevels(state).get(level) || [];
    return {
      total: ids.length, ready: ids.filter((id) => K.vReady(state, id)).length,
      fresh: vFresh(state, level, ctx).length, known: ids.filter((id) => ctx.known(vId(id))).length,
    };
  };

  // Unberührte WaniKani-Vokabeln, die es schon anderswo gibt (has = Schlüssel ohne WaniKani-Einträge, alts wie bei vFresh)
  K.vDupes = (items, has, alts, ctx) => items.filter((it) => wkVocab(it) && untouched(it, ctx)
    && [App.vocabKey(it), ...alts(it)].some(has)).map((it) => it.id);

  // ---------- Gibt es das Wort schon? ----------
  const norm = (s) => String(s || '').replace(/[\s〜～~]/g, '');
  const hira = (s) => App.jp.toHira(norm(s));
  const KANJI = /[㐀-鿿豈-﫿々]/;
  K.form = (it) => norm(it.kanji || it.kana); // Suchform fürs Wörterbuch
  // Weitere Schlüssel desselben Wortes: andere Schreibweisen laut Wörterbuch (入り口 = 入口, gleiche Lesung) und die
  // reine Kana-Schreibung. Die Schreibweisen im Wörterbuch sind verlässlich – anders als sein Deutsch.
  K.altKeys = (it, entries) => {
    const w = norm(it.kanji), r = hira(it.kana);
    if (!w || !r || !KANJI.test(w)) return [];
    const out = new Set();
    (entries || []).filter((e) => e && (e.k || []).includes(w) && (e.r || []).some((x) => App.jp.toHira(x) === r))
      .forEach((e) => e.k.forEach((k) => out.add(App.vocabKey({ kanji: k, kana: r }))));
    out.add(App.vocabKey({ kanji: '', kana: r }));
    out.delete(App.vocabKey(it));
    return [...out];
  };

  // ---------- Deutsche Bedeutung ----------
  // Nie aus dem Wörterbuch: dessen Deutsch hängt bei vielen Wörtern am falschen Eintrag (一 „f-Rauschen“, 三つ „Mawashi“).
  // Zuerst die geprüfte Bedeutung aus dem Satz-Index der Pakete (gleiches Wort, auch in anderer Schreibweise mit Kanji),
  // sonst die übersetzte englische Bedeutung von WaniKani (js/wanikani.js). _de = 'pack' | 'mt' merkt die Herkunft.
  K.needsGerman = (it) => wkVocab(it) && !it._edited && (!it.de || !it._de);
  K.packGerman = (index, it, alts) => {
    if (!index || !index.v) return '';
    const key = App.vocabKey(it);
    for (const k of [key, ...(alts || []).filter((x) => KANJI.test(x.split('|')[0]))]) if (index.v[k] && index.v[k][2]) return index.v[k][2];
    return '';
  };
  // Was zum Übersetzen geht: die ersten zwei englischen Bedeutungen
  K.enQuery = (it) => String(it.en || '').split(/;\s*/).filter(Boolean).slice(0, 2).join('; ');

  // ---------- Beispielsätze der WaniKani-Vokabeln ----------
  // Reihenfolge: Satz-Index der Pakete → kürzester Tatoeba-Satz → kürzester Satz von WaniKani (js/wanikani.js)
  // Lesung des Wortes ohne Okurigana (食べる → たべ, 勉強する → べんきょう), damit auch gebeugte Formen im Satz passen
  K.stem = (it) => {
    const w = norm(it.kanji), r = hira(it.kana);
    if (!w || !KANJI.test(w)) return r;
    let k = 0;
    while (k < w.length - 1 && k < r.length && /[ぁ-ゖ]/.test(w[w.length - 1 - k]) && w[w.length - 1 - k] === r[r.length - 1 - k]) k++;
    if (k >= 2 && /する$/.test(w)) return r.slice(0, r.length - 2); // 勉強する: nur する fällt weg
    return r.slice(0, r.length - Math.min(k, 1));
  };
  // Tatoeba-Vorschläge (kürzeste zuerst) → der erste, in dem das Wort mit seiner Lesung steht (人 ≠ じん in 日本人)
  K.pickTatoeba = (list, it) => {
    const st = K.stem(it);
    return (list || []).find((ex) => ex && (!st || hira(ex.kana).includes(st))) || null;
  };
  // Zeilen fürs Feld examples: Tatoeba { jp mit Furigana, de | en, src } · WaniKani { jp, de | en, src: 'WaniKani' }
  K.tatoebaRow = (ex) => Object.assign({ jp: ex.furi || ex.jp, src: ex.src }, ex.de ? { de: ex.de } : { en: ex.en });
  K.wkRow = (s, furi, de) => Object.assign({ jp: furi || s.ja, src: 'WaniKani' }, de ? { de } : { en: s.en });
})(window.App);
