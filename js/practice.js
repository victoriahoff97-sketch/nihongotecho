/* Nihongo Techō – Üben: Karteikarten (SRS), Übersetzungsübungen, Kanji-Quiz */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  const W = App.writeLogic;
  const P = App.parkLogic;
  const kanjiFocus = () => W.focus(S.settings);
  App.dueCount = () => W.dueCount(S.srs, S.items, kanjiFocus(), W.dayEnd(Date.now()));
  const lessonNum = (it) => (it.lesson === '' || it.lesson == null || isNaN(+it.lesson)) ? null : +it.lesson;
  const maxLessonOptions = (cur) => Array.from({ length: 12 }, (_, i) => i + 1).map((l) => `<option value="${l}" ${+cur === l ? 'selected' : ''}>bis Lektion ${l}</option>`).join('');

  // ---------- Übersicht: Leiste „Extern üben“ (externe Seiten, brauchen Internet) ----------
  const VERB_SVG = `<svg viewBox="0 0 92 84" aria-hidden="true"><g transform="rotate(-5 46 42)">
    <rect x="8" y="12" width="40" height="26" rx="8" fill="#fff" stroke="#993C1D" stroke-width="2"/>
    <text x="28" y="31" text-anchor="middle" font-size="15" fill="#993C1D" style="font-family:var(--font-kanji)">聞く</text>
    <path d="M40 44q8 2 10 10" fill="none" stroke="#993C1D" stroke-width="2" stroke-linecap="round"/><path d="M46 53l4 2 2-5" fill="none" stroke="#993C1D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="36" y="48" width="48" height="26" rx="8" fill="#F0997B" stroke="#993C1D" stroke-width="2"/>
    <text x="60" y="67" text-anchor="middle" font-size="15" fill="#fff" style="font-family:var(--font-kanji)">聞いて</text></g>
    <circle cx="78" cy="16" r="3" fill="#FAC775"/><circle cx="10" cy="68" r="2.5" fill="#85B7EB"/></svg>`;
  const VOCAB_SVG = `<svg viewBox="0 0 92 84" aria-hidden="true">
    <rect x="22" y="16" width="52" height="56" rx="9" fill="#CECBF6" stroke="#534AB7" stroke-width="2" transform="rotate(-10 48 44)"/>
    <rect x="22" y="16" width="52" height="56" rx="9" fill="#AFA9EC" stroke="#534AB7" stroke-width="2" transform="rotate(-2 48 44)"/>
    <g transform="rotate(6 48 44)"><rect x="22" y="16" width="52" height="56" rx="9" fill="#fff" stroke="#534AB7" stroke-width="2"/>
    <text x="48" y="48" text-anchor="middle" font-size="20" fill="#534AB7" style="font-family:var(--font-kanji)">単語</text>
    <path d="M34 58h28" stroke="#CECBF6" stroke-width="3" stroke-linecap="round"/></g>
    <circle cx="10" cy="18" r="3" fill="#ED93B1"/><circle cx="84" cy="70" r="2.5" fill="#FAC775"/></svg>`;
  // Die beiden Kacheln lassen sich auch auf die Startseite holen (Leiste „Heute lesen und hören“)
  App.externTile = {
    verb: () => App.readTile('verb', 'https://ocamejp.com/Web-App/Verbformen/GENKI_ALL/index.html', VERB_SVG, '動詞の活用', 'Verbformen (Genki)', 'Alle Genki-Verben nach Lektion: ない-, ます-, て-, た-Form und mehr zum Aufdecken. Auf Englisch.', 'Zum Verbformen-Trainer'),
    vocab: () => App.readTile('vocab', 'https://ocamejp.com/Web-App/genki-vokabeln/index.html', VOCAB_SVG, '単語', 'Genki-Vokabeln', 'Vokabeltrainer zu den Genki-Lektionen, Japanisch ⇔ Englisch.', 'Zum Vokabeltrainer'),
  };
  const externStrip = () => `<div class="section-title">Extern üben</div><div class="read-strip" style="margin-top:0">
      ${App.externTile.verb()}
      ${App.externTile.vocab()}</div>`;

  // =========================================================
  // Übersicht
  // =========================================================
  App.route('/ueben', (view) => {
    const sec = App.SECTIONS.practice;
    const due = App.dueCount();
    const wDue = kanjiFocus() === 'read' ? 0 : App.writeQueue().due.length;
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Wiederholen, übersetzen, schreiben – alles passend zu deinem Niveau und aus deinen eigenen Inhalten.', `<a class="btn" href="#/lernweg">${icon('map')} So läuft das Lernen</a>`)}
      ${externStrip()}<div class="section-title">In der App</div><div class="practice-home">
        <a class="mode-card sec-practice" href="#/ueben/heute${due ? '?auto=1' : ''}"><span class="k">復</span><h3>Jetzt wiederholen</h3><span class="muted">Alles, was heute fällig ist, gemischt in einer Runde – Vokabeln, Kanji & Ausdrücke.</span>${due ? `<span class="badge count">${due} fällig</span>` : '<span class="badge">für heute alles wiederholt</span>'}</a>
        <a class="mode-card sec-practice" href="#/ueben/karten"><span class="k">札</span><h3>Karteikarten</h3><span class="muted">Einzeln nach Art, Lektion oder Quelle: wiederholen, Neues lernen oder frei üben.</span></a>
        ${!App.checkOn() ? '' : `<a class="mode-card sec-vocab" href="#/ueben/einstufen"><span class="k">確</span><h3>Einstufen</h3><span class="muted">Vokabeln, Kanji &amp; Ausdrücke: Kenne ich das? In Runden prüfen, was du schon kannst und was in die Lernschlange kommt.</span>${(() => { const n = App.vocabCounts().unchecked + App.vocabCounts(App.itemsOf('phrase')).unchecked + W.activeCounts(App.itemsOf('vocab'), S.srs, App.needsCheck).unchecked; return n ? `<span class="badge">${n} ungeprüft</span>` : ''; })()}</a>`}
        <a class="mode-card sec-grammar" href="#/ueben/konjugieren"><span class="k">活</span><h3>Konjugieren</h3><span class="muted">Formen von Verben und Adjektiven selbst bilden – welche, wählst du aus.</span></a>
      </div>
      <div class="section-title">Weitere Übungen</div><div class="practice-home">
        <a class="mode-card sec-grammar" href="#/ueben/saetze"><span class="k">訳</span><h3>Übersetzungsübungen</h3><span class="muted">Sätze aus deinen Grammatik- und Vokabelbausteinen – nur mit dem, was du schon kennst.</span></a>
        <a class="mode-card sec-kanji" href="#/ueben/kanji"><span class="k">書</span><h3>Kanji-Quiz</h3><span class="muted">Bedeutung sehen → mit dem Stift schreiben, oder Lesungen erkennen.</span>${wDue ? `<span class="badge count">${wDue} zu schreiben</span>` : ''}</a>
      </div></div>`;
  });

  // =========================================================
  // Karteikarten
  // =========================================================
  const cardFilter = (q) => {
    const type = q.type || 'vocab';
    let items = App.itemsOf(type);
    if (q.src) items = items.filter((i) => App.srcMatch(i, q.src));
    if (q.l) items = items.filter((i) => String(i.lesson) === q.l);
    if (q.g) items = items.filter((i) => i.group === q.g);
    if (q.star) items = items.filter((i) => i.star);
    if (q.mark) items = items.filter((i) => App.hasMark(i, q.mark));
    if (q.lvl) items = items.filter((i) => App.levelMatch(i, q.lvl));
    if (type === 'kanji') items = items.filter((i) => i.char !== '々');
    return items;
  };
  // Lernrunde einer Auswahl: fällige Karten (älteste zuerst) oder neue Karten in Lernreihenfolge – nie beides in einer Runde. Auch für die Kacheln der Startseite.
  const newMax = (q) => Math.min(q.fresh.length, S.settings.newPerDay);
  App.roundSize = (q) => W.round(q, S.settings.newPerDay).length;
  // Neues kommt nur auf ausdrücklichen Klick: eigener Knopf vor der Runde und auf dem Abschlussbildschirm
  let nextRound = null;
  // Geparkte Kartenrunde (nur im Speicher): über „Eintrag öffnen“ verlassen, die Leiste oben führt zurück (main.js)
  let parked = null;
  App.parkedRound = () => parked;
  App.dropParked = () => { parked = null; };
  // Auf der Seite der geparkten Runde: Herkunft wiederherstellen und den Stand zum Fortsetzen liefern
  const takeParked = () => {
    if (!P.same(parked, location.hash)) return null;
    const p = parked, r = P.revive(p, App.item);
    parked = null;
    nextRound = null;
    App.setOrigin(p.origin);
    return r.entries.length ? Object.assign(r, { opts: p.opts }) : null;
  };
  const resumeCards = (view, r) => { view.querySelector('[data-setup]').hidden = true; runCards(view.querySelector('[data-stage]'), r.entries, r.opts, r); };
  const roundStart = (q, dueLabel) => `<button class="btn ${q.due.length || !newMax(q) ? 'btn-primary' : ''}" data-round="due" ${q.due.length ? '' : 'disabled'}>${icon('play')} ${dueLabel} (${q.due.length} fällig)</button>
          <button class="btn ${q.due.length || !newMax(q) ? '' : 'btn-primary'}" data-round="new" ${newMax(q) ? '' : 'disabled'}>${icon('plus')} Neue lernen (${newMax(q)} neu)</button>`;
  const roundEnd = (q) => `${q.due.length ? `<button class="btn btn-primary" data-round="due">${icon('play')} Weiter wiederholen (${q.due.length})</button>` : ''}${newMax(q) ? `<button class="btn ${q.due.length ? '' : 'btn-primary'}" data-round="new">${icon('plus')} Jetzt ${newMax(q)} neue lernen</button>` : ''}`;
  const bindRoundEnd = (stage) => stage.querySelectorAll('[data-round]').forEach((b) => (b.onclick = () => { nextRound = b.dataset.round; App.render(); }));
  // Knöpfe der Auswahl verdrahten; Direktstart (Startseite) oder Wunsch vom Abschlussbildschirm löst gleich aus
  // auto: 'due' | 'new' = genau diese Runde (ist dafür nichts da, startet nichts) · sonst wahr = Fälliges, ohne Fälliges Neues
  const bindRoundStart = (view, q, auto, run) => {
    const kind = nextRound || (['due', 'new'].includes(auto) ? auto : auto ? (q.due.length ? 'due' : 'new') : '');
    nextRound = null;
    view.querySelectorAll('[data-setup] [data-round]').forEach((b) => (b.onclick = () => run(W.round(q, S.settings.newPerDay, b.dataset.round))));
    const b = kind && view.querySelector(`[data-setup] [data-round="${kind}"]`);
    if (b && !b.disabled) b.click();
  };
  const learnOrder = (a, b) => (lessonNum(a) ?? 99) - (lessonNum(b) ?? 99) || App.ord(a) - App.ord(b);
  // Kanji schreiben hat einen eigenen Lernstand: fällig nach dem Schreib-Plan, neu = freigeschaltet, geschrieben noch nie.
  // Woher die neuen kommen, steht in den Einstellungen (Genki · JLPT N5 · WaniKani · alles zusammen); ein ausdrücklicher
  // Filter der Ansicht (Quelle, Lektion, Niveau …) geht vor. Gilt nur für einzelne Kanji – Vokabeln sind nie betroffen.
  const WK = App.wkLogic;
  const wkCtx = () => ({ state: App.wk.state, wkLevels: S.settings.wkLevels || [], isN5: (it) => App.levelMatch(it, 'N5') });
  const readUnlocked = (it) => W.unlocked(S.srs, it.id);
  App.writeSource = () => (WK.SOURCES.includes(S.settings.writeSource) ? S.settings.writeSource : 'all');
  App.writeUnlocked = (it, source = 'all') => WK.unlocked(source, it, wkCtx(), readUnlocked);
  // Warum ein Kanji noch nicht zum Schreiben drankommt ('' = es kommt dran) – für die Kanji-Seite
  App.writeWhy = (it) => {
    const src = App.writeSource(), ctx = wkCtx(), wi = App.wk.info(it.char);
    if (!WK.inSource(src, it, ctx)) return src === 'wk' ? 'gehört zu keinem freigeschalteten WaniKani-Level' : 'gehört nicht zur Quelle, die in den Einstellungen fürs Schreiben gewählt ist';
    if (WK.unlocked(src, it, ctx, readUnlocked)) return '';
    const master = wi && wi.on ? `sobald es bei WaniKani Master ist (jetzt: ${wi.name})` : '';
    return 'kommt dran, ' + (src === 'wk' ? master : master ? 'sobald du es lesen kannst oder ' + master : 'sobald du es lesen kannst');
  };
  App.writeQueue = (q = {}) => {
    const filtered = ['src', 'l', 'g', 'star', 'mark', 'lvl'].some((k) => q[k]);
    const source = filtered ? 'all' : App.writeSource();
    const ctx = wkCtx();
    const all = cardFilter(Object.assign({}, q, { type: 'kanji' }));
    const items = all.filter((i) => WK.inSource(source, i, ctx)).sort(WK.compare(source, ctx, learnOrder));
    const unlocked = (i) => WK.unlocked(source, i, ctx, readUnlocked);
    return Object.assign({ items, unlocked }, W.queue(items, S.srs, W.dayEnd(Date.now()), unlocked, all));
  };
  // Vokabeln aktiv (Deutsch → Japanisch) haben ebenfalls einen eigenen Lernstand: neu ist, was lesbar, aber noch nicht in der Aktiv-Lernschlange ist
  App.activeQueue = (q = {}) => {
    const items = cardFilter(Object.assign({}, q, { type: 'vocab' })).sort(learnOrder);
    return Object.assign({ items }, W.activeQueue(items, S.srs, W.dayEnd(Date.now()), App.needsCheck));
  };
  App.activeStatus = (it) => W.activeStatus(S.srs, it, App.needsCheck);
  // Kartenrichtung: bei Kanji mit Schwerpunkt Schreiben ist „Bedeutung → schreiben“ der Standard
  const cardDir = (q) => q.dir || ((q.type === 'kanji' && kanjiFocus() === 'write') ? 'de' : 'jp');
  App.cardQueue = (q = {}) => {
    const type = q.type || 'vocab';
    if (type === 'kanji' && cardDir(q) === 'de') return App.writeQueue(q);
    if (type === 'vocab' && cardDir(q) === 'de') return App.activeQueue(q);
    const items = cardFilter(q);
    // Grammatik wird nicht abgefragt (nur der Haken von Hand): keine Runden, Karteikarten nur frei
    if (type === 'grammar') return { items, due: [], fresh: [] };
    const now = W.dayEnd(Date.now()); // fällig gilt für den ganzen Tag
    const due = W.readDue(items, S.srs, now);
    // Neu ist, was noch nicht in der Lernschlange ist. Vokabeln/Ausdrücke: alles Ungeprüfte – „neue lernen“ holt es auch ohne Einstufen.
    // Kanji: nur der Lernstapel (ungeprüfte erst einstufen; eigene liegen dort ohne Einstufung).
    const fresh = items.filter((i) => { const s = S.srs.get(i.id), st = App.vocabStatus(i.id); return !W.inQueue(s) && (st === 'learn' || (st === 'unchecked' && W.direct(i.type))); })
      .sort(learnOrder);
    return { items, due, fresh };
  };
  // „Jetzt wiederholen“ (Startseite): alles, was heute fällig ist, in einer gemischten Runde – Lesen, Aktiv, Ausdrücke und Kanji schreiben (Grammatik wird nicht abgefragt).
  // Der Kanji-Schwerpunkt aus den Einstellungen blendet wie überall die jeweils andere Seite aus. Neues kommt hier nie dazu.
  // pick(queue, kind): welche Einträge einer Art in die Runde kommen
  const mixParts = (pick) => {
    const focus = kanjiFocus();
    const part = (label, one, kind, q, extra) => { const list = pick(q, kind); return { label, one, n: list.length, entries: list.map((it) => Object.assign({ it, kind }, extra)) }; };
    return [
      part('Vokabeln', 'Vokabel', 'read', App.cardQueue({ dir: 'jp' }), { dir: 'jp' }),
      part('Vokabeln aktiv', 'Vokabel aktiv', 'active', App.activeQueue(), { dir: 'de' }),
      focus === 'write' ? null : part('Kanji', 'Kanji', 'read', App.cardQueue({ type: 'kanji', dir: 'jp' }), { dir: 'jp' }),
      focus === 'read' ? null : part('Kanji schreiben', 'Kanji schreiben', 'write', App.writeQueue(), { pad: true }),
      part('Ausdrücke', 'Ausdruck', 'read', App.cardQueue({ type: 'phrase', dir: 'jp' }), { dir: 'jp' }),
    ].filter((x) => x && x.n);
  };
  App.todayParts = () => mixParts((q) => q.due);
  App.todayQueue = () => W.mixRound(App.todayParts().flatMap((x) => x.entries), App.shuffle);
  // „Meine Lernschlange üben“: alles, was im Wiederholungsplan steckt – dieselben Arten wie „Jetzt wiederholen“, nur ohne „heute fällig“.
  // Frei geübt: Lernstand und Termine bleiben, wie sie sind. Kanji schreiben: der ganze Schreib-Stapel, unabhängig von der Quelle für Neues.
  App.learningParts = () => mixParts((q, kind) => W.learning(kind === 'write' ? cardFilter({ type: 'kanji' }) : q.items, S.srs, kind));
  App.learningQueue = () => W.mixRound(App.learningParts().flatMap((x) => x.entries), App.shuffle);
  const learningSum = (parts) => parts.map((x) => `${x.n} ${x.n === 1 ? x.one : x.label}`).join(' · ');
  // In Häppchen: eine gemischte Reihenfolge, Runde für Runde, bis alles einmal dran war. Größe wählbar (0 = alles in einer Runde).
  const CHUNKS = [10, 20, 30, 50, 0];
  const chunkSize = () => { const v = App.lsGet('learnChunk'); return v !== null && CHUNKS.includes(+v) ? +v : 20; };
  const chunkSelect = () => `<label class="small muted row" style="gap:6px">pro Runde <select class="input" data-chunk>${CHUNKS.map((n) => `<option value="${n}" ${n === chunkSize() ? 'selected' : ''}>${n || 'alle'}</option>`).join('')}</select></label>`;
  const bindChunk = (view) => { const sel = view.querySelector('[data-chunk]'); if (sel) sel.onchange = () => App.lsSet('learnChunk', sel.value); };
  const runLearning = (view, entries, opts) => {
    const stage = view.querySelector('[data-stage]');
    const go = () => {
      view.querySelector('[data-setup]').hidden = true;
      runCards(stage, entries.splice(0, chunkSize() || entries.length), Object.assign({}, opts, { cram: true, left: () => entries.length, nextChunk: go }));
    };
    go();
  };
  // Kartenrunde für andere Seiten (Konjugieren): opts.onGrade(ent, g) nach jeder Bewertung, opts.endHtml() im Abschlussbild
  App.cards = { run: (...a) => runCards(...a), takeParked: () => takeParked(), chunkSize, chunkSelect, bindChunk };
  const learningBtn = (n) => `<button class="btn" data-learning ${n ? '' : 'disabled'} title="Alles, was du gerade lernst – auch was heute nicht fällig ist. Dein Lernstand bleibt, wie er ist">${icon('practice')} Meine Lernschlange üben (${n})</button>`;
  // Was morgen dazukommt: fällig bis morgen Abend, abzüglich dessen, was heute schon dran ist
  App.dueTomorrow = () => { const end = W.dayEnd(Date.now()); return W.dueCount(S.srs, S.items, kanjiFocus(), end + 864e5) - W.dueCount(S.srs, S.items, kanjiFocus(), end); };
  App.route('/ueben/heute', (view, p, q) => {
    const sec = App.SECTIONS.practice;
    const resume = takeParked();
    const parts = App.todayParts(), n = parts.reduce((a, x) => a + x.n, 0), tomorrow = App.dueTomorrow();
    const lParts = App.learningParts(), ln = lParts.reduce((a, x) => a + x.n, 0);
    const title = q.lernen && ln ? 'Meine Lernschlange üben' : 'Jetzt wiederholen';
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › ${title}</div>
      <div class="page-head"><div class="titles"><h1>${title} <span class="jp-title">復習</span></h1><p>${q.lernen && ln ? `Alles, was du gerade lernst, gemischt – ${learningSum(lParts)}. Ändert nichts an Lernstand und Terminen.` : n ? `Heute ${n === 1 ? 'ist 1 Karte' : `sind ${n} Karten`} dran: ${parts.map((x) => `${x.n} ${x.n === 1 ? x.one : x.label}`).join(' · ')}` : 'Für heute ist alles wiederholt.'}</p></div></div>
      <div class="card" data-setup><div class="row between"><div class="small muted">${n ? 'Alles gemischt in einer Runde.' : 'お疲れ様！'}${tomorrow ? ` Morgen ${tomorrow === 1 ? 'kommt 1 Karte' : `kommen ${tomorrow} Karten`} dazu.` : ''}</div>
        <div class="row">${n ? `<button class="btn btn-primary" data-round="due">${icon('shuffle')} Jetzt wiederholen (${n})</button>` : `<a class="btn" href="#/">Zur Startseite</a><a class="btn" href="#/ueben/karten">${icon('practice')} Karteikarten</a>`}${learningBtn(ln)}${ln ? chunkSelect() : ''}</div></div>
        ${ln ? `<div class="small muted" style="margin-top:8px">Meine Lernschlange üben: alles, was du gerade lernst, gemischt – ${learningSum(lParts)}. Ändert nichts an Lernstand und Terminen.</div>` : ''}</div>
      <div data-stage></div></div>`;
    if (resume) return resumeCards(view, resume);
    const go = view.querySelector('[data-round]');
    const auto = nextRound || q.auto;
    nextRound = null;
    view.querySelector('[data-learning]').onclick = () => runLearning(view, App.learningQueue(), {});
    bindChunk(view);
    // Schnellaktion „Lernschlange üben“ (Startseite): gleich alles gemischt starten
    if (q.lernen && ln) return view.querySelector('[data-learning]').click();
    if (!go) return;
    go.onclick = () => { view.querySelector('[data-setup]').hidden = true; runCards(view.querySelector('[data-stage]'), App.todayQueue(), { more: () => ({ due: App.todayQueue(), fresh: [] }) }); };
    if (auto) go.click();
  });
  const CRAM_MAX = 100; // so viele Karten hat eine freie Runde höchstens – eine Genki-Lektion passt ganz hinein
  App.route('/ueben/karten', (view, p, q) => {
    const sec = App.SECTIONS.practice;
    const resume = takeParked();
    const type = q.type || 'vocab';
    const cq = App.cardQueue(q), { items, due, fresh } = cq;
    const dir = cardDir(q), defDir = cardDir(Object.assign({}, q, { dir: '' }));
    const write = type === 'kanji' && dir === 'de';
    const active = type === 'vocab' && dir === 'de';
    const isG = type === 'grammar'; // Grammatik: nur frei üben
    const unchecked = isG ? 0 : active ? items.filter((i) => App.activeStatus(i) === 'unchecked').length : items.filter((i) => i.char !== '々' && App.vocabStatus(i.id) === 'unchecked').length;
    const allOfType = App.itemsOf(type);
    // Lernschlange frei üben: nur die Auswahl oben (Art, Richtung, Filter) – oder alles gemischt
    // Kanji schreiben: der ganze Schreib-Stapel der Auswahl, unabhängig von der Quelle für Neues – so passt die Zahl zu „Alle gemischt“
    const learning = isG ? [] : W.learning(write ? cardFilter(Object.assign({}, q, { type: 'kanji' })) : items, S.srs, write ? 'write' : active ? 'active' : 'read');
    const lParts = App.learningParts(), ln = lParts.reduce((a, x) => a + x.n, 0);
    const typeLabel = { vocab: 'Vokabeln', kanji: 'Kanji', grammar: 'Grammatik', phrase: 'Ausdrücke' }[type];
    const groups = type === 'phrase' ? Array.from(new Set(allOfType.map((x) => x.group))) : [];
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › Karteikarten</div>
      <div class="page-head"><div class="titles"><h1>Karteikarten <span class="jp-title">札</span></h1><p>${isG ? 'Grammatik wird nicht abgefragt – hier kannst du sie frei üben.' : `${due.length} fällig · ${fresh.length} neu in dieser Auswahl`}</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row"><div class="seg">${[['vocab', 'Vokabeln'], ['kanji', 'Kanji'], ['grammar', 'Grammatik'], ['phrase', 'Ausdrücke']].map(([k, l]) => `<button class="${type === k ? 'on' : ''}" data-q-type="${k === 'vocab' ? '' : k}">${l}</button>`).join('')}</div>
          <div class="seg">${(type === 'kanji' ? [['jp', 'Kanji → Bedeutung (lesen)'], ['de', 'Bedeutung → Kanji (schreiben)']] : [['jp', 'Japanisch → Deutsch'], ['de', 'Deutsch → Japanisch']]).map(([k, l]) => `<button class="${dir === k ? 'on' : ''}" data-q-dir="${k === defDir ? '' : k}">${l}</button>`).join('')}</div>
          ${App.sourceSelect(allOfType, q.src)}${App.lessonSelect(allOfType.filter((i) => App.srcMatch(i, q.src)), q.l)}${App.levelSelect(q.lvl)}
          ${groups.length ? `<select class="input" data-q-select="g"><option value="">Alle Gruppen</option>${groups.map((g) => `<option ${q.g === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>` : ''}
          <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Nur gemerkte</button></div>
        <div class="row">${isG ? '' : roundStart(cq, 'Wiederholen')}
          <button class="btn ${isG ? 'btn-primary' : ''}" data-cram ${items.length ? '' : 'disabled'} title="Zählt nicht zur Lernschlange – dein Lernstand bleibt, wie er ist">${icon('shuffle')} Frei üben (${items.length > CRAM_MAX ? CRAM_MAX + ' von ' + items.length : items.length})</button></div>
        <div class="small muted">${isG ? 'Frei üben geht die Auswahl oben gemischt durch. Den Haken „Kann ich“ setzt du selbst auf der Seite des Grammatikpunkts – Üben ändert ihn nicht.' : 'Frei üben geht die Auswahl oben gemischt durch und zählt nicht zur Lernschlange: Lernstand und Termine bleiben, wie sie sind.'}</div>
        ${isG ? '' : `<div class="row"><b class="small">Meine Lernschlange üben:</b>
          <button class="btn" data-learning ${learning.length ? '' : 'disabled'} title="Was du aus der Auswahl oben gerade lernst – auch was heute nicht fällig ist. Dein Lernstand bleibt, wie er ist">${icon('practice')} ${typeLabel} (${learning.length})</button>
          <button class="btn" data-learning-all ${ln ? '' : 'disabled'} title="Alles, was du gerade lernst, gemischt – auch was heute nicht fällig ist. Dein Lernstand bleibt, wie er ist">${icon('shuffle')} Alle gemischt (${ln})</button>${chunkSelect()}</div>
        <div class="small muted">Alles, was du gerade lernst – auch wenn heute nichts fällig ist. „${typeLabel}“ richtet sich nach der Auswahl oben${ln ? `, „Alle gemischt“ nimmt alles zusammen: ${learningSum(lParts)}` : ''}. Ändert nichts an Lernstand und Terminen.</div>`}
        ${write ? `<div class="small muted">Schreiben hat einen eigenen Lernstand: Neu sind Kanji, die du lesen kannst, aber noch nie geschrieben hast. Hier schreibst du auf Papier und drehst die Karte um – <a href="#/ueben/kanji">mit dem Stift in der App schreiben</a>.</div>` : ''}
        ${active ? `<div class="small muted">Deutsch → Japanisch hat einen eigenen Lernstand, getrennt vom Lesen. Dazu kommen Wörter, sobald du sie lesen kannst – beim Einstufen kommt in die Lernschlange nur, was du aus dem Deutschen heraus noch nicht weißt.</div>` : ''}
        ${unchecked ? `<div class="card row between" style="background:var(--yamabuki-soft);border-color:transparent;box-shadow:none"><div><b>${unchecked} ${type === 'kanji' ? 'Kanji' : type === 'phrase' ? 'Ausdrücke' : 'Vokabeln'} sind ${active ? 'aktiv noch nicht eingestuft' : 'noch ungeprüft'}.</b><div class="small muted">${type === 'kanji' ? 'Neue Karten kommen nur aus deinem Lernstapel. Prüfe erst, was du schon kannst.' : active ? 'Du kannst sie lesen. „Neue lernen“ holt sie in die Lernschlange – oder sortiere erst aus, was du auch aus dem Deutschen heraus schon weißt.' : '„Neue lernen“ holt sie in die Lernschlange – oder sortiere erst aus, was du schon kannst.'}</div></div>
          ${!App.checkOn() ? '' : `<a class="btn btn-sm" href="#/ueben/einstufen?${new URLSearchParams(Object.fromEntries(Object.entries({ type: type === 'vocab' ? '' : type, dir: active ? 'de' : '', src: q.src, l: q.l, lvl: q.lvl, g: type === 'phrase' ? q.g : '' }).filter(([, v]) => v)))}">${icon('check')} Einstufen</a>`}</div>` : ''}</div></div>
      <div data-stage></div></div>`;
    if (resume) return resumeCards(view, resume);
    const stage = view.querySelector('[data-stage]');
    const start = (queue, cram) => { view.querySelector('[data-setup]').hidden = true; runCards(stage, queue, { type, dir, cram, write, active, more: () => App.cardQueue(q) }); };
    view.querySelector('[data-cram]').onclick = () => start(App.shuffle(items).slice(0, CRAM_MAX), true);
    if (!isG) {
      view.querySelector('[data-learning]').onclick = () => runLearning(view, App.shuffle(learning), { type, dir, write, active });
      view.querySelector('[data-learning-all]').onclick = () => runLearning(view, App.learningQueue(), {});
    }
    bindChunk(view);
    bindRoundStart(view, cq, q.round || q.auto, (queue) => start(queue, false));
  });

  function cardFaces(it, dir) {
    if (it.type === 'grammar') {
      // Deutsche Seite: Teil des Titels nach „ – “ (z. B. „X ist Y“), sonst die Kurzbeschreibung
      const de = it.title.includes(' – ') ? it.title.split(' – ').slice(1).join(' – ') : (it.summary || it.title);
      const ex = it.examples && it.examples[0];
      const struct = (it.structure || []).length ? `<div class="structure" style="text-align:left;margin-top:10px">${it.structure.map((x) => `<div>${JP.ruby(x)}</div>`).join('')}</div>` : '';
      const exHtml = ex ? `<div style="margin-top:6px">${App.exampleHtml(ex)}</div>` : '';
      if (dir === 'de') return { front: `<div class="front de-front">${esc(de)}</div><div class="muted">Welche Grammatik ist das?</div>`, back: `<div class="ans jp" lang="ja">${JP.ruby(it.jp || '')}</div><div>${esc(it.title)}</div>${App.levelBadge(it)}${struct}${exHtml}`, speak: '' };
      return { front: `<div class="front" lang="ja">${JP.ruby(it.jp || '')}</div><div class="muted">Was bedeutet das, wie benutzt man es?</div>`, back: `<div class="ans">${esc(it.title)}</div><div class="muted">${esc(it.summary || '')}</div>${App.levelBadge(it)}${struct}${exHtml}`, speak: '' };
    }
    if (it.type === 'kanji') {
      if (dir === 'de') return { front: `<div class="front de-front">${App.meaningHtml(it, true)}</div><div class="muted">Wie schreibt man das Kanji?</div>`, back: `<div class="ans" style="font-family:var(--font-kanji);font-size:80px;font-weight:400">${esc(it.char)}</div><div lang="ja">${esc((it.on || []).join('、'))} · ${esc((it.kun || []).map(App.kanjiLogic.kunText).join('、'))}</div>`, speak: '' };
      return { front: `<div class="front kanji-front">${esc(it.char)}</div>`, back: `<div class="ans">${App.meaningHtml(it)}${App.levelBadge(it)}</div><div lang="ja" style="font-size:18px">On: ${esc((it.on || []).join('、') || '–')} · Kun: ${esc((it.kun || []).map(App.kanjiLogic.kunText).join('、') || '–')}</div>${(it.words || []).slice(0, 3).map((w) => `<div lang="ja">${JP.ruby(w.jp)} – ${App.meaningHtml(w)}</div>`).join('')}`, speak: '' };
    }
    const jpHtml = it.type === 'vocab' ? JP.wordRuby(it) : JP.ruby(it.jp);
    const reading = it.type === 'vocab' ? it.kana : JP.kana(it.jp);
    const ex = it.examples && it.examples[0];
    const extra = (it.type === 'vocab' ? App.accentHtml(it) + App.useHtml(it, true) : '') + (ex ? `<div style="margin-top:6px">${App.exampleHtml(ex)}</div>` : '') + (it.note ? `<div class="small muted">${esc(it.note)}</div>` : '');
    const speakTxt = it.type === 'vocab' ? (it.kana || it.kanji) : it.jp;
    const badges = App.levelBadge(it) + (it.type === 'vocab' ? ' ' + App.verbClsBadge(it) : '');
    if (dir === 'de') return { front: `<div class="front de-front">${App.meaningHtml(it, true)}</div>`, back: `<div class="ans jp" lang="ja">${jpHtml}</div>${badges}${extra}`, speak: speakTxt };
    return { front: `<div class="front" lang="ja">${App.askHtml(it)}</div>`, back: `<div class="jp" lang="ja" style="font-size:20px;color:var(--muted)">${esc(reading)}</div><div class="ans">${App.meaningHtml(it)}</div>${badges}${extra}`, speak: speakTxt };
  }
  const ivlLabel = (id, g, write) => {
    const s = S.srs.get(write ? W.id(id) : id) || { ivl: 0, ease: 2.5, reps: 0 };
    let d;
    if (g === 0) return '10 Min';
    if (s.reps === 0) d = g === 1 ? 0.5 : g === 2 ? 1 : 4;
    else if (s.reps === 1) d = g === 1 ? 2 : g === 2 ? 3 : 6;
    else d = s.ivl * (g === 1 ? 1.2 : g === 2 ? s.ease : s.ease * 1.3);
    return d < 1 ? 'morgen' : d < 30 ? Math.round(d) + ' T' : Math.round(d / 30) + ' Mon';
  };
  // ---------- Antwort auf Japanisch (Deutsch → Japanisch): aus · mit dem Stift · getippt – pro Gerät gemerkt ----------
  const AL = App.answerLogic;
  const AMODES = [['off', 'eyeOff', 'Nur umdrehen, nichts schreiben'], ['pen', 'pen', 'Antwort mit dem Stift schreiben'], ['key', 'keyboard', 'Antwort tippen']];
  const answerMode = () => { const m = App.lsGet('answerMode'); return AMODES.some(([k]) => k === m) ? m : 'off'; };
  const answerable = (ent) => !ent.pad && ent.kind !== 'conj' && ent.dir === 'de' && (ent.it.type === 'vocab' || ent.it.type === 'phrase');
  // Kanji schreiben: „Auflösen“ (danach Falsch/Richtig) in die Knopfspalte neben dem Schreibfeld – so bleibt alles ohne Scrollen erreichbar
  const padButtons = (stage) => {
    const col = stage.querySelector('[data-pad] .stack'), b = stage.querySelector('[data-btns]');
    if (!col || !b) return;
    b.className = 'stack pad-btns'; b.style.marginTop = '';
    col.insertBefore(b, col.querySelector('[data-p="tpl"]')); // vor „Vorlage“/„Vergleichen“, die erst nach dem Auflösen erscheinen
  };
  // Lesungen der Kanji aus der Sammlung und dem Kanji-Index (wird beim ersten Antwortfeld geladen), um Mischungen wie 勉きょう zu erkennen
  let kIndex = null;
  const loadKanjiIndex = () => { if (!kIndex) App.kanjiIndex().then((x) => { kIndex = x; }); };
  const kanjiReadings = () => {
    const m = new Map();
    S.items.forEach((i) => { if (i.type === 'kanji' && i.char) m.set(i.char, i); });
    return (c) => {
      const own = m.get(c), ix = kIndex && App.kanjiLogic.entry(kIndex, c);
      return own || ix ? { on: [].concat(own ? own.on || [] : [], ix ? ix.on : []), kun: [].concat(own ? own.kun || [] : [], ix ? ix.kun : []) } : null;
    };
  };
  // auch für Umformen (js/drill.js): Lesungen-Nachschlag und Urteil mit Unterschied
  App.kanjiReadings = () => { loadKanjiIndex(); return kanjiReadings(); };
  const diffHtml = (d) => d.map((x) => (x.t === 'same' ? esc(x.s) : x.t === 'del' ? `<del>${esc(x.s)}</del>` : `<ins>${esc(x.s)}</ins>`)).join('');
  const verdictHtml = (r) => (r.ok
    ? `<div class="verdict ok">✓ Richtig${r.exact || !r.missing.length ? '' : ` – mit Kanji: <span lang="ja">${r.missing.map((c) => `<b>${esc(c)}</b>`).join(' ')}</span>`}</div>`
    : `<div class="verdict no">✗ Nicht ganz</div><div class="ans-diff" lang="ja">${diffHtml(r.diff)}</div>`);
  App.answerVerdictHtml = verdictHtml;

  // write/active: eigener Lernstand unter „w:<Id>“ (Kanji schreiben · Vokabeln Deutsch → Japanisch)
  // cram = freies Üben: nichts wird bewertet, der Lernstand bleibt unberührt – nicht Gewusstes kommt nur in dieser Runde noch einmal
  // Gemischte Runde: Einträge { it, kind: 'read' | 'active' | 'write', dir, pad } bringen Richtung und Lernstand selbst mit; pad = Kanji mit dem Stift schreiben
  // resume = geparkte Runde (park-logic.js): Stand übernehmen, die offene Karte liegt wieder aufgedeckt da
  // Für andere Seiten (Auffrischen): label statt „freies Üben“ oben, onEnd() beim Abschlussbild, noAgain = ohne „Weitere Runde“
  function runCards(stage, queue, opts, resume) {
    const { dir, cram, write, active, more, left, nextChunk } = opts;
    const home = location.hash, from = App.origin();
    parked = null;
    queue = queue.map((x) => (x.it ? x : { it: x, kind: write ? 'write' : active ? 'active' : 'read', dir }));
    let total = resume ? resume.total : queue.length; // wächst, wenn nicht Gewusstes in derselben Runde noch einmal kommt
    let done = resume ? resume.done : 0, right = resume ? resume.right : 0, flipped = false, cur = null, ent = null;
    let wantPark = false; // „Eintrag öffnen“ angetippt: beim Verlassen der Seite wird die Runde geparkt
    let ans = null, suggest = null, readingsOf = null; // Antwortfeld der Karte · vorgeschlagene Bewertung nach dem Prüfen
    let last = null; // zuletzt bewertete Karte – „Rückgängig“ holt sie mit ihrem alten Lernstand zurück
    const own = () => ent.kind !== 'read';
    const srsKey = () => (ent.kind === 'read' ? cur.id : W.id(cur.id));
    // „neue lernen“ bei Vokabeln und Ausdrücken: beim ersten Zeigen lässt sich Bekanntes gleich aussortieren – danach nicht mehr
    const canSkip = () => !cram && ent.kind !== 'write' && W.direct(cur.type) && W.firstShow(S.srs.get(srsKey()));
    const undoBtn = () => (last ? ` <button class="btn btn-sm btn-ghost" data-undo-card title="Letzte Bewertung zurücknehmen (Strg+Z)">${icon('undo')} Rückgängig</button>` : '');
    const head = () => `<div class="row between small muted" style="margin-bottom:8px"><span>${done + 1} / ${total}${opts.label ? ' · ' + esc(opts.label) : cram ? ' · freies Üben' : ''}${undoBtn()}</span><span>${App.srcBadge(cur)}</span></div>
        <div class="progress" style="margin-bottom:10px"><i style="width:${(done / Math.max(1, total)) * 100}%"></i></div>`;
    const next = () => {
      ent = queue.shift();
      cur = ent ? ent.it : null;
      flipped = false;
      wantPark = false;
      if (ans && ans.pad) ans.pad.stop();
      ans = null; suggest = null;
      if (!cur) {
        if (opts.onEnd) opts.onEnd();
        const rest = left ? left() : 0; // Lernschlange in Häppchen: so viel ist noch nicht dran gewesen
        stage.innerHTML = `<div class="flash-stage"><div class="flash" style="cursor:default"><div class="score-ring">お疲れ様！</div><h2>${done} Karten geschafft</h2><p class="muted">${right} davon gewusst. ${cram ? `Frei geübt – an deinem Lernstand hat sich nichts geändert.${left && !rest ? ' Damit war alles einmal dran.' : ''}` : App.dueCount() ? App.dueCount() + ' Karten sind insgesamt noch fällig.' : 'Für heute ist alles wiederholt.'}</p>${opts.endHtml ? opts.endHtml() : ''}
          <div class="row" style="justify-content:center">${undoBtn()}${App.backBtn('Zur Übersicht')}${cram ? (rest ? `<button class="btn" data-again>Zur Auswahl</button><button class="btn btn-primary" data-next-chunk>${icon('play')} Nächste Runde (noch ${rest})</button>` : opts.noAgain ? '' : '<button class="btn btn-primary" data-again>Weitere Runde</button>') : roundEnd(more())}</div></div></div>`;
        const again = stage.querySelector('[data-again]');
        if (cram && again) again.onclick = () => App.render();
        if (rest) stage.querySelector('[data-next-chunk]').onclick = () => nextChunk();
        bindRoundEnd(stage);
        App.backup.nudge();
        return;
      }
      if (ent.pad) return padCard();
      const f = ent.kind === 'conj' ? App.conjFaces(cur, ent.form) : cardFaces(cur, ent.dir); // Konjugieren (conj.js) bringt eigene Kartenseiten mit
      stage.innerHTML = `<div class="flash-stage ${App.furiClass()}">${head()}
        <div class="flash" data-flip>${f.front}<div class="back" hidden>${f.back}</div><span class="tap-hint">Tippen oder Leertaste zum Umdrehen</span></div>
        ${answerable(ent) ? '<div class="ans-box" data-answer></div>' : ''}
        <div class="grade-row"${cram ? ' style="grid-template-columns:repeat(2,1fr)"' : ''} hidden>${cram ? '<button class="g0" data-g="0">Nicht gewusst<small>kommt gleich noch einmal</small></button><button class="g2" data-g="2">Gewusst</button>' : [['g0', 'Nochmal', 0], ['g1', 'Schwer', 1], ['g2', 'Gut', 2], ['g3', 'Leicht', 3]].map(([c, l, g]) => `<button class="${c}" data-g="${g}">${l}<small>${ivlLabel(cur.id, g, own())}</small></button>`).join('')}</div>
        <div class="row" style="justify-content:center;margin-top:10px">${canSkip() ? `<button class="btn btn-sm check-known" data-known hidden title="Gilt als gelernt und wird in dieser Richtung nicht mehr abgefragt">${icon('check')} Kann ich schon</button>` : ''}<a class="btn btn-sm btn-ghost" href="${App.link(cur)}" data-park>${icon('info')} Eintrag öffnen</a>${f.speak ? App.speakBtn(f.speak) : ''}${answerable(ent) ? `<span class="seg ans-mode" title="Antwort aufschreiben?">${AMODES.map(([k, ic, t]) => `<button data-amode="${k}" title="${t}" aria-label="${t}">${icon(ic)}</button>`).join('')}</span>` : ''}</div></div>`;
      if (answerable(ent)) answerBox();
    };
    // Antwortfeld unter der Karte: Stift (Schreibfeld + Vorschläge) oder Tastatur (Romaji wird zu かな); Prüfen deckt die Karte auf
    const answerBox = () => {
      const box = stage.querySelector('[data-answer]'), mode = answerMode();
      if (ans && ans.pad) ans.pad.stop();
      if (ans) App.dictate.stopFor(ans.inp, { now: true });
      stage.querySelectorAll('[data-amode]').forEach((b) => b.classList.toggle('on', b.dataset.amode === mode));
      ans = null;
      box.hidden = mode === 'off';
      if (box.hidden) { box.innerHTML = ''; return; }
      loadKanjiIndex();
      box.innerHTML = `${mode === 'pen' ? '<div data-hwpad></div>' : ''}
        <div class="ans-line"><input class="input ans-in" lang="ja" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${mode === 'pen' ? 'Erkannt wird hier eingetragen' : 'Auf Japanisch (Romaji wird zu かな)'}">${App.dictate.supported() ? `<button class="btn btn-ghost mic" data-amic title="Antwort auf Japanisch sprechen – sie erscheint im Feld" aria-label="Antwort diktieren">${icon('mic')}</button>` : ''}<button class="btn btn-primary" data-acheck>${icon('check')} Prüfen</button></div>
        ${mode === 'pen' ? '<div class="ans-cands" hidden></div>' : ''}<div data-averdict></div>`;
      const inp = box.querySelector('.ans-in'), cands = box.querySelector('.ans-cands');
      ans = { mode, inp, cands, list: [], checked: false };
      if (mode === 'key') { App.bindRomaji(inp); setTimeout(() => { if (inp.isConnected && !flipped) inp.focus(); }, 50); }
      else {
        const msg = (t) => { cands.innerHTML = `<span class="muted small">${esc(t)}</span>`; cands.hidden = false; };
        ans.pad = App.hwPad(box.querySelector('[data-hwpad]'), {
          onMsg: msg,
          onClear: () => { ans.list = []; inp.value = ''; cands.innerHTML = ''; cands.hidden = true; },
          onResult: (ja) => {
            ans.list = ja; inp.value = ja[0];
            cands.innerHTML = ja.map((t, i) => `<button class="chip${i ? '' : ' on'}" data-acand="${esc(t)}" lang="ja">${esc(t)}</button>`).join('');
            cands.hidden = false;
          },
        });
      }
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); if (!checkAnswer()) flip(); } });
    };
    // true = geprüft (die Karte ist damit aufgedeckt) oder Stift-Erkennung wird noch abgewartet; false = nichts geschrieben
    const checkAnswer = () => {
      if (!ans || ans.checked || flipped) return false;
      App.dictate.stopFor(ans.inp, { now: true }); // Prüfen beendet ein laufendes Diktat, das bisher Erkannte steht schon im Feld
      // Stift: Schreibpause bzw. Erkennung noch nicht vorbei – erst abwarten, sonst wäre das Feld noch leer
      if (ans.waiting) return true;
      if (ans.pad && !ans.waited && ans.pad.pending()) {
        const a = ans;
        a.waiting = true;
        a.pad.flush().then(() => {
          a.waiting = false; a.waited = true; // nur einmal warten: klappt die Erkennung nicht, wird einfach aufgedeckt
          if (ans !== a || a.checked || flipped || checkAnswer()) return;
          flip();
          const box = stage.querySelector('[data-answer]');
          box.hidden = false; box.querySelectorAll('[data-hwpad], .ans-line, .ans-cands').forEach((x) => { x.hidden = true; });
          box.querySelector('[data-averdict]').innerHTML = '<div class="verdict no">Schrift nicht erkannt – vergleiche selbst</div>';
        });
        return true;
      }
      const val = ans.inp.value;
      if (!val.trim()) return false;
      if (!readingsOf) readingsOf = kanjiReadings();
      const forms = AL.forms(cur, readingsOf);
      // Stift: unverändert übernommen = auch die nächsten Vorschläge der Erkennung zählen
      const r = ans.mode === 'pen' && ans.list.length && val === ans.list[0] ? AL.checkAny(ans.list, forms) : AL.check(val, forms);
      if (!r) return false;
      ans.checked = true;
      if (r.ok && r.answer !== AL.clean(val)) ans.inp.value = r.answer;
      ans.inp.readOnly = true; ans.inp.blur();
      if (ans.pad) { ans.pad.stop(); stage.querySelector('[data-hwpad]').hidden = true; ans.cands.hidden = true; } // nach dem Prüfen zählt nur noch das Ergebnis
      stage.querySelector('[data-averdict]').innerHTML = verdictHtml(r);
      stage.querySelector('[data-acheck]').hidden = true;
      stage.querySelector('[data-answer]').classList.add('done');
      suggest = r.ok ? 2 : 0;
      flip();
      const sb = stage.querySelector(`.grade-row [data-g="${suggest}"]`); if (sb) sb.classList.add('suggest');
      return true;
    };
    // Kanji schreiben in der gemischten Runde: mit dem Stift schreiben, auflösen, selbst bewerten – wie im Kanji-Quiz
    const padCard = () => {
      stage.innerHTML = `<div class="sec-kanji">${head()}<div class="card pad-lg"><div class="small muted">Schreibe das Kanji:${W.isFirst(S.srs, cur.id) ? ' <span class="badge">erster Versuch</span>' : ''}</div><div class="ex-prompt">${App.meaningHtml(cur, true)}</div>
          <div class="muted" lang="ja">${esc((cur.kun || []).map(App.kanjiLogic.kunText).concat(cur.on || []).slice(0, 4).join('、'))}</div>
          <div class="kanji-stage quiz-stage" style="margin-top:14px"><div data-sol class="stroke-box" style="display:grid;place-items:center;min-height:240px;color:var(--muted)">?</div><div data-pad></div></div>
          <div class="row" style="margin-top:14px" data-btns><button class="btn btn-primary" data-show>${icon('eye')} Auflösen</button></div></div></div>`;
      const pad = App.stroke.pad(stage.querySelector('[data-pad]'), cur.char, { template: false, quiz: true });
      padButtons(stage);
      stage.querySelector('[data-show]').onclick = () => {
        flipped = true;
        pad.then((p) => p.reveal());
        App.stroke.animator(stage.querySelector('[data-sol]'), cur.char);
        stage.querySelector('[data-btns]').innerHTML = `<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch · ${cram ? 'kommt gleich noch einmal' : 'wieder in ' + ivlLabel(cur.id, 0, true)}</button><button class="btn" style="background:var(--matcha-soft)" data-r="2">✓ Richtig${cram ? '' : ' · wieder in ' + ivlLabel(cur.id, 2, true)}</button><a class="btn btn-ghost" href="${App.link(cur)}" data-park>Kanji öffnen</a>`;
      };
    };
    let busy = false;
    const gradePad = async (g) => {
      if (busy) return;
      busy = true;
      remember([W.id(cur.id)], g === 0);
      if (!cram) await App.gradeWrite(cur.id, g);
      busy = false;
      done++; if (g > 0) right++;
      if (g === 0) { queue.splice(Math.min(3, queue.length), 0, ent); total++; }
      next();
    };
    const flip = () => {
      if (!cur || flipped || ent.pad) return;
      if (ans && !ans.checked && checkAnswer()) return; // etwas geschrieben: Umdrehen prüft gleich mit
      flipped = true;
      stage.querySelector('.back').hidden = false;
      stage.querySelector('.tap-hint').hidden = true;
      stage.querySelector('.grade-row').hidden = false;
      const kb = stage.querySelector('[data-known]'); if (kb) kb.hidden = false;
      // ohne Antwort aufgedeckt: kein leeres Schreibfeld unter der Karte
      if (ans && !ans.checked) { stage.querySelector('[data-answer]').hidden = true; if (ans.pad) ans.pad.stop(); }
    };
    // Konjugieren zählt eigene Treffer mit (onGrade) – dort gibt es kein Zurück
    const remember = (keys, again) => { last = opts.onGrade ? null : { ent, snap: cram ? null : App.srsSnap(keys), done, right, total, again }; };
    const undo = async () => {
      if (!last || busy) return;
      busy = true;
      const l = last;
      last = null;
      if (l.snap) await App.srsRestore(l.snap);
      if (l.again) { const i = queue.indexOf(l.ent); if (i >= 0) queue.splice(i, 1); }
      if (ent && ent !== l.ent) queue.unshift(ent);
      queue.unshift(l.ent);
      ({ done, right, total } = l);
      busy = false;
      next();
    };
    const markKnown = async () => {
      if (!flipped || busy) return;
      busy = true;
      remember([srsKey()], false);
      await App.setCheck(srsKey(), 'known');
      busy = false;
      done++; right++;
      next();
    };
    const grade = async (g) => {
      if (!flipped || busy) return; // Doppeltipp: nicht dieselbe Karte zweimal bewerten und die nächste überspringen
      busy = true;
      remember([ent.kind === 'read' || ent.kind === 'conj' ? cur.id : W.id(cur.id)], g === 0);
      if (!cram) await (ent.kind === 'write' ? App.gradeWrite(cur.id, g) : App.grade(ent.kind === 'active' ? W.id(cur.id) : cur.id, g));
      busy = false;
      done++; if (g > 0) right++;
      if (opts.onGrade) opts.onGrade(ent, g);
      if (g === 0) { queue.splice(Math.min(3, queue.length), 0, ent); total++; }
      next();
    };
    stage.addEventListener('click', (e) => {
      if (e.target.closest('a[data-park]')) wantPark = true;
      if (e.target.closest('[data-speak]') || e.target.closest('a')) return;
      if (e.target.closest('[data-undo-card]')) return undo();
      if (e.target.closest('[data-flip]')) flip();
      const am = e.target.closest('[data-amode]');
      if (am) { App.lsSet('answerMode', am.dataset.amode); if (!flipped) answerBox(); else stage.querySelectorAll('[data-amode]').forEach((b) => b.classList.toggle('on', b === am)); return; }
      if (e.target.closest('[data-acheck]')) { if (!checkAnswer()) flip(); return; }
      const mic = e.target.closest('[data-amic]');
      if (mic) { if (ans && !ans.checked && !flipped) App.dictate.toggle(ans.inp, mic, 'ja-JP'); return; }
      const ac = e.target.closest('[data-acand]');
      if (ac && ans && !ans.checked) { ans.cands.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === ac)); ans.inp.value = ac.dataset.acand; return; }
      if (e.target.closest('[data-known]')) return markKnown();
      const r = e.target.closest('[data-r]'); if (r && ent && ent.pad) return gradePad(+r.dataset.r);
      const b = e.target.closest('[data-g]'); if (b) grade(+b.dataset.g);
    });
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
      // nach dem Prüfen: Enter nimmt die vorgeschlagene Bewertung
      if (e.key === 'Enter' && flipped && suggest !== null && ent && !ent.pad) { e.preventDefault(); grade(suggest); return; }
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      if (['1', '2', '3', '4'].includes(e.key) && ent && !ent.pad) grade(+e.key - 1);
    };
    document.addEventListener('keydown', onKey);
    App.onLeave(() => {
      document.removeEventListener('keydown', onKey);
      if (ans && ans.pad) ans.pad.stop();
      if (wantPark && cur) parked = { hash: home, origin: from, opts, entries: [ent].concat(queue), done, right, total, open: flipped };
    });
    next();
    if (resume && resume.open && cur) { if (ent.pad) stage.querySelector('[data-show]').click(); else flip(); }
  }

  // =========================================================
  // Übersetzungsübungen
  // =========================================================
  const T = App.translateLogic;
  // Wortvorrat des Satzgenerators: Vokabeln plus Ausdrücke. Zeitwörter und Farben stehen nur bei den Ausdrücken;
  // ihre Angaben für den Satzgenerator liegen in gen
  const genWords = () => App.itemsOf('vocab').concat(App.itemsOf('phrase').map((p) => (p.gen ? Object.assign({}, p, p.gen) : p)));
  // Füllwort neben der Lernschlange: was du schon lesen kannst
  const canRead = (it) => App.vocabStatus(it.id) === 'known';
  const BUILD = { fill: JP.fill, plain: JP.plain, pick: App.pick, shuffle: App.shuffle, meaning: App.exMeaning, situations: (g) => App.drillLogic.field(g, 'situations') || [] };
  // Für „Grammatik auffrischen“ (js/grammar-refresh.js): derselbe Wortvorrat, dieselben Bausteine, dieselbe Runde
  App.translateKit = { words: () => genWords(), canRead, BUILD, run: (...a) => runExercises(...a) };

  App.route('/ueben/saetze', (view, p, q) => {
    const sec = App.SECTIONS.grammar;
    const session = q.s ? App.item(q.s) : null;
    let maxL = +(q.max || (session && +session.bookLesson) || S.settings.level || 12);
    if (!maxL || isNaN(maxL)) maxL = 12;
    const byLesson = (a, b) => (lessonNum(a) || 0) - (lessonNum(b) || 0);
    const allG = App.itemsOf('grammar').sort(byLesson);
    let preset = q.g ? [q.g] : session ? (session.grammarIds || []) : null;
    // Ohne Thema und ohne Stunde kommt die Übung aus der Lernschlange; „Niveau“ = alles bis zur gewählten Lektion
    const fixed = !!(q.g || session);
    const byQueue = !fixed && q.src !== 'niveau';
    const words = genWords();
    const pot = byQueue ? T.queuePot(words, allG, App.wordState, canRead) : null;
    const listG = byQueue ? pot.grammar.concat(pot.grammarKnown).sort(byLesson) : allG.filter((g) => g.source !== 'Genki I' || (lessonNum(g) || 0) <= maxL);
    const selected = new Set(byQueue ? (pot.grammar.length ? pot.grammar : pot.grammarKnown).map((g) => g.id) : preset && preset.length ? preset : listG.map((g) => g.id));
    const dir = q.dir || 'de';
    const srcSeg = fixed ? '' : `<div class="seg">${[['', 'Lernschlange'], ['niveau', 'Niveau']].map(([k, l]) => `<button class="${(byQueue ? '' : 'niveau') === k ? 'on' : ''}" data-q-src="${k}">${l}</button>`).join('')}</div>`;
    const head = `<div class="crumbs">${App.backCrumb()} › Übersetzungsübungen</div>
      <div class="page-head"><div class="titles"><h1>Übersetzen <span class="jp-title">翻訳</span></h1><p>${session ? `Zur Stunde „${esc(session.title || session.number)}“ – ` : ''}${byQueue ? 'Sätze aus dem, was gerade in deiner Lernschlange ist.' : 'Sätze nur aus Grammatik & Vokabeln bis zu deinem Niveau.'}</p></div></div>`;
    if (byQueue && !pot.queue.size) {
      view.innerHTML = `<div class="${sec.cls}">${head}
        <div class="card" data-setup><div class="stack"><div class="row">${srcSeg}</div>
          <p data-queue-empty>In deiner Lernschlange ist noch nichts. Dorthin kommt alles, was du beim Einstufen auf „Lernen“ setzt oder bei den Karteikarten schon einmal gewusst hast – es bleibt dort, bis es sitzt.</p>
          <div class="row"><a class="btn btn-primary" href="#/ueben/karten">${icon('practice')} Zu den Karteikarten</a><button class="btn" data-q-src="niveau">Nach Niveau üben</button></div></div></div></div>`;
      return;
    }
    const nQ = byQueue ? { g: pot.grammar.length, w: pot.queue.size - pot.grammar.length } : null;
    view.innerHTML = `<div class="${sec.cls}">${head}
      <div class="card" data-setup><div class="stack">
        <div class="row">${srcSeg}${byQueue ? '' : `<label class="small"><b>Niveau</b></label><select class="input" data-max>${maxLessonOptions(maxL)}</select>`}
          <div class="seg">${[['de', 'Deutsch → Japanisch'], ['jp', 'Japanisch → Deutsch'], ['mix', 'Gemischt']].map(([k, l]) => `<button class="${dir === k ? 'on' : ''}" data-q-dir="${k === 'de' ? '' : k}">${l}</button>`).join('')}</div>
          <select class="input" data-n>${[5, 10, 15, 20].map((n) => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="small muted">Sätze</span></div>
        ${byQueue ? `<div class="small muted" data-queue-info>In der Lernschlange: ${nQ.w} ${nQ.w === 1 ? 'Wort' : 'Wörter'} und ${nQ.g} ${nQ.g === 1 ? 'Grammatikpunkt' : 'Grammatikpunkte'}. Fehlt für einen Satz ein passendes Wort, füllt eines auf, das du schon kannst.</div>` : ''}
        <details class="adv" ${preset ? 'open' : ''}><summary>Grammatik auswählen (${selected.size} gewählt)</summary>
          <div class="row" style="margin-bottom:8px"><button class="btn btn-sm" data-all>${byQueue ? 'Alle' : `Alle bis Lektion ${maxL}`}</button><button class="btn btn-sm" data-none>Keine</button></div>
          <div class="grid cols-2" style="gap:4px">${listG.map((g) => `<label class="picker-row"><input type="checkbox" value="${g.id}" ${selected.has(g.id) ? 'checked' : ''}><span class="badge src" style="--c:${App.sourceColor(g.source)}">L${esc(g.lesson)}</span><span>${esc(g.title)}</span><span class="muted small">${(g.patterns || []).length ? '✦' : ''}${byQueue && !pot.queue.has(g.id) ? ' ● kann ich' : ''}</span></label>`).join('')}</div>
          <div class="small muted" style="margin-top:6px">✦ = mit Satzmustern (erzeugt immer neue Sätze). Ohne ✦ werden die Beispielsätze genutzt.${byQueue ? ' Zur Auswahl steht die Grammatik aus der Lernschlange und die, die du schon kannst.' : ''}</div></details>
        <div class="row"><button class="btn btn-primary" data-go>${icon('sparkle')} Übung starten</button></div></div></div>
      <div data-stage></div></div>`;
    const setup = view.querySelector('[data-setup]');
    if (!byQueue) setup.querySelector('[data-max]').onchange = (e) => App.setQuery({ max: e.target.value });
    setup.querySelector('[data-all]').onclick = () => $$('input[type=checkbox]', setup).forEach((c) => (c.checked = true));
    setup.querySelector('[data-none]').onclick = () => $$('input[type=checkbox]', setup).forEach((c) => (c.checked = false));
    const chosen = () => $$('details input[type=checkbox]:checked', setup).map((c) => c.value);
    setup.querySelector('[data-go]').onclick = () => {
      const gids = chosen();
      // Wörter der Lernschlange mit eigenem Satz ergeben auch ohne Grammatik eine Runde
      if (!gids.length && !(byQueue && pot.sentences.length)) return App.toast('Bitte mindestens einen Grammatikpunkt wählen');
      const n = +setup.querySelector('[data-n]').value;
      const grammar = gids.map(App.item).filter(Boolean);
      let exs;
      if (byQueue) exs = T.build({ grammar, pool: pot.pool, sentences: pot.sentences, queue: pot.queue, n }, BUILD);
      else {
        const pool = words.filter((v) => {
          if (!T.patternWord(v)) return false;
          if (session && (session.vocabIds || []).includes(v.id)) return true;
          const l = lessonNum(v);
          if (v.source === 'Genki I') return l !== null && l <= maxL;
          return true; // eigene Wörter (NHK, VHS …) sind immer erlaubt
        });
        exs = T.build({ grammar, pool, n }, BUILD);
      }
      if (!exs.length) return App.toast(byQueue ? 'Aus der Lernschlange ließen sich dazu keine Sätze bauen – wähle mehr Grammatik aus oder übe nach Niveau.' : 'Dazu konnten keine Sätze erzeugt werden – wähle mehr Grammatik aus.');
      setup.hidden = true;
      runExercises(view.querySelector('[data-stage]'), exs, dir);
    };
  });

  // Woher ein Satz kommt: ein Grammatikpunkt oder ein Wort der Lernschlange (dann mit dessen eigenem Beispielsatz).
  // Vor der Lösung verrät die Marke das Wort nicht; hinterher steht es bei der Lösung.
  // Diktieren ins Antwortfeld (js/dictate.js): Japanisch bei De → Jp, Deutsch bei Jp → De
  const micBtn = (lang, title) => (App.dictate.supported() ? `<button class="btn btn-sm btn-ghost mic" data-mic="${lang}" title="${title}">${icon('mic')} Diktieren</button>` : '');
  const wordOf = (it) => it.kanji || it.kana || JP.plain(it.jp || '');
  const exBadge = (it) => `<a class="badge sec ${App.SECTIONS[it.type].cls}" href="${App.link(it)}" target="_blank" style="text-decoration:none">${it.type === 'grammar' ? '文 ' + esc(it.title) : it.type === 'phrase' ? '表 Ausdruck aus der Lernschlange' : '単 Wort aus der Lernschlange'}</a>`;

  // o.onDone(wrong): einmal am Ende der Runde · o.endHtml(): Zeile unter der Wertung · o.endRow: eigene Knöpfe statt „Neue Runde“
  function runExercises(stage, exs, dirMode, o = {}) {
    let i = 0, score = 0;
    const wrong = [];
    const show = () => {
      if (i >= exs.length) {
        if (o.onDone) o.onDone(wrong);
        stage.innerHTML = `<div class="ex-card"><div class="card pad-lg" style="text-align:center"><div class="score-ring">${score} / ${exs.length}</div><h2>${score === exs.length ? '完璧！ Perfekt!' : score > exs.length / 2 ? 'よくできました！' : 'がんばって！ Dranbleiben!'}</h2>
          ${wrong.length ? `<div class="section-title">Zum Wiederholen</div><div class="stack" style="text-align:left">${wrong.map((e) => `<div class="example"><div class="grow"><div class="jp-s" lang="ja">${JP.ruby(e.jp)}</div><div class="de-s">${esc(e.de)}</div><a class="small" href="${App.link(e.g)}">${esc(e.g.title || wordOf(e.g))}</a></div></div>`).join('')}</div>` : ''}
          ${o.endHtml ? o.endHtml() : ''}
          <div class="row" style="justify-content:center;margin-top:16px">${o.endRow || `${App.backBtn('Übersicht')}<button class="btn btn-primary" data-again>Neue Runde</button>`}</div></div></div>`;
        const again = stage.querySelector('[data-again]');
        if (again) again.onclick = () => App.render();
        return;
      }
      const e = exs[i];
      const dir = e.sit ? 'de' : dirMode === 'mix' ? (Math.random() < 0.5 ? 'de' : 'jp') : dirMode;
      const kanaSol = e.kana || JP.kana(e.jp);
      stage.innerHTML = `<div class="ex-card ${App.furiClass()}"><div class="row between small muted" style="margin-bottom:8px"><span>Satz ${i + 1} / ${exs.length}</span>${exBadge(e.g)}</div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(i / exs.length) * 100}%"></i></div>
        <div class="card pad-lg">
          ${e.sit ? `<div class="small muted">Antworte auf Japanisch:</div>
          <div class="ex-prompt jp" lang="ja">${JP.ruby(e.q)} ${App.speakBtn(e.q)}</div><div class="muted" style="margin:-4px 0 8px">Hinweis: ${esc(e.de)}</div>`
          : `<div class="small muted">${dir === 'de' ? 'Übersetze ins Japanische:' : 'Übersetze ins Deutsche:'}</div>
          <div class="ex-prompt ${dir === 'jp' ? 'jp' : ''}" ${dir === 'jp' ? 'lang="ja"' : ''}>${dir === 'de' ? esc(e.de) : JP.ruby(e.jp)} ${dir === 'jp' ? App.speakBtn(e.jp) : ''}</div>`}
          ${dir === 'de' ? '<div data-ansfield></div>'
          : `<textarea class="input" style="width:100%;font-size:19px" rows="2" placeholder="Deine Übersetzung …"></textarea>${App.dictate.supported() ? `<div class="row" style="margin-top:8px">${micBtn('de-DE', 'Auf Deutsch sprechen – der Text erscheint im Antwortfeld')}</div>` : ''}`}
          <div class="row" style="margin-top:14px"><button class="btn btn-primary" data-check>${icon('check')} ${dir === 'de' ? 'Prüfen' : 'Lösung zeigen'}</button><button class="btn btn-ghost" data-skip>Überspringen</button></div>
          <div data-sol></div></div></div>`;
      // Deutsch → Japanisch: Antwortfeld wie auf den Karteikarten (Stift oder Tastatur, App.answerField), Mikrofon daneben
      let checked = false, waiting = false;
      const enter = () => { if (!checked) check(); else { const b = stage.querySelector('[data-res="1"]'); if (b && stage.querySelector('.verdict.ok')) b.click(); } };
      const field = dir === 'de' ? App.answerField(stage.querySelector('[data-ansfield]'), { onEnter: enter, extra: micBtn('ja-JP', 'Auf Japanisch sprechen – der Text erscheint im Antwortfeld') }) : null;
      const ta = stage.querySelector('textarea');
      const inp = () => (field ? field.inp() : ta);
      const mic = stage.querySelector('[data-mic]');
      const micOn = () => mic && mic.classList.contains('active');
      if (mic) mic.onclick = () => App.dictate.toggle(inp(), mic, mic.dataset.mic);
      if (ta) setTimeout(() => ta.focus(), 50);
      const check = async () => {
        if (checked || waiting) return;
        if (micOn()) App.dictate.toggle(inp(), mic, mic.dataset.mic); // Prüfen beendet ein laufendes Diktat
        waiting = true;
        const ans = (field ? await field.value() : ta.value).trim();
        waiting = false;
        if (checked) return;
        checked = true;
        if (field) field.lock();
        let auto = null;
        if (dir === 'de' && ans) {
          // Stift: unverändert übernommen = auch die nächsten Vorschläge der Erkennung zählen
          const rs = field.cands().map((s) => App.drillLogic.sameAnswer(s, App.drillLogic.solutionsOf(e), App.kanjiReadings()));
          const r = rs.find((x) => x && x.ok) || rs[0];
          auto = r ? r.ok : null;
        }
        const words = (e.words || []).filter(Boolean);
        stage.querySelector('[data-sol]').innerHTML = `<div class="solution">
          ${auto === true ? '<div class="verdict ok">✓ Richtig!</div>' : auto === false ? '<div class="verdict no">Nicht ganz – vergleiche:</div>' : ''}
          <div class="small muted" style="margin-top:8px">Lösung</div>
          ${dir === 'de' ? `<div class="sol-jp" lang="ja">${JP.ruby(e.jp)} ${App.speakBtn(e.jp)}</div><div class="small muted" lang="ja">${esc(kanaSol)}</div>${(e.alt || []).length ? `<div class="small muted" style="margin-top:6px">Auch richtig: <span lang="ja">${e.alt.map((a) => JP.ruby(a)).join(' · ')}</span></div>` : ''}` : `<div style="font-size:21px;font-weight:800">${esc(e.de)}</div><div class="small muted" lang="ja">${esc(kanaSol)}</div>`}
          ${words.length ? `<div class="row" style="margin-top:10px;gap:6px">${words.map((w) => `<a class="badge" style="background:var(--fuji-soft);color:var(--fuji);text-decoration:none" href="${App.link(w)}" target="_blank" lang="ja">${esc(wordOf(w))} = ${esc(w.de)}</a>`).join('')}</div>` : ''}
          <div class="row" style="margin-top:14px">${auto === true ? `<button class="btn btn-primary" data-res="1">Weiter ${icon('next')}</button>` : `<button class="btn" style="background:var(--shu-soft)" data-res="0">✗ Hatte ich falsch</button><button class="btn" style="background:var(--matcha-soft)" data-res="1">✓ Hatte ich richtig</button>`}</div></div>`;
        stage.querySelector('[data-check]').hidden = true;
      };
      stage.querySelector('[data-check]').onclick = check;
      stage.querySelector('[data-skip]').onclick = () => { if (micOn()) App.dictate.toggle(inp(), mic, mic.dataset.mic); if (field) field.lock(); wrong.push(e); i++; show(); };
      if (ta) ta.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); enter(); } });
      stage.querySelector('[data-sol]').addEventListener('click', (ev) => {
        const b = ev.target.closest('[data-res]'); if (!b) return;
        if (b.dataset.res === '1') score++; else wrong.push(e);
        i++; show();
      });
    };
    show();
  }

  // =========================================================
  // Kanji-Quiz
  // =========================================================
  App.route('/ueben/kanji', (view, p, q) => {
    const sec = App.SECTIONS.kanji;
    const all = App.itemsOf('kanji').filter((k) => k.char !== '々');
    const maxL = +(q.max || S.settings.level || 12);
    const pool = all.filter((k) => k.source !== 'Genki I' || (lessonNum(k) || 0) <= maxL).filter((k) => !q.l || String(k.lesson) === q.l);
    const defMode = kanjiFocus() === 'read' ? 'read' : 'write';
    const mode = q.mode || defMode;
    // Schreiben mit Lernstand: unabhängig vom Niveau-Filter, denn neu sind nur Kanji, die du schon lesen kannst
    const wq = App.writeQueue({ l: q.l });
    const wc = W.counts(wq.items, S.srs, wq.unlocked);
    // „Meinen Stapel üben“: alles, was gerade im Schreib-Übungsstapel liegt – unabhängig von Fälligkeit und gewählter Quelle
    const stack = all.filter((k) => (!q.l || String(k.lesson) === q.l) && W.status(S.srs, k.id) === 'learn');
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › Kanji-Quiz</div>
      <div class="page-head"><div class="titles"><h1>Kanji-Quiz <span class="jp-title">書</span></h1><p>${pool.length} Kanji in der Auswahl</p></div></div>
      <div class="card" data-setup><div class="row">
        <div class="seg">${[['write', 'Bedeutung → schreiben'], ['read', 'Kanji → Bedeutung'], ['reading', 'Wort → Lesung']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-q-mode="${k === defMode ? '' : k}">${l}</button>`).join('')}</div>
        <select class="input" data-q-select="max">${maxLessonOptions(maxL)}</select>${App.lessonSelect(all, q.l)}
        ${mode === 'write' ? `${roundStart(wq, 'Schreiben wiederholen')}
        <button class="btn" data-stack ${stack.length ? '' : 'disabled'} title="Alles, was du gerade schreiben übst – auch was heute nicht fällig ist. Zählt nicht zur Lernschlange">${icon('pen')} Meinen Stapel üben (${stack.length})</button>
        <button class="btn" data-go ${pool.length >= 4 ? '' : 'disabled'} title="Zählt nicht zur Lernschlange – dein Lernstand bleibt, wie er ist">${icon('shuffle')} Zufällig üben (10)</button>`
        : `<button class="btn btn-primary" data-go ${pool.length >= 4 ? '' : 'disabled'} title="Zählt nicht zur Lernschlange – dein Lernstand bleibt, wie er ist">${icon('play')} Start (10)</button>`}</div>
        ${mode === 'write' ? '' : '<div class="small muted" style="margin-top:8px">Freie Runde mit zufälligen Kanji aus der Auswahl: zählt nicht zur Lernschlange, Lernstand und Termine bleiben, wie sie sind.</div>'}
        ${mode === 'write' ? `<div class="row" style="gap:18px;margin-top:12px">
          <span><b style="font-size:22px;color:var(--matcha)">${wc.known}</b> kann ich schreiben</span>
          <span><b style="font-size:22px;color:var(--ai)">${wc.learn}</b> übe ich</span>
          <span><b style="font-size:22px;color:var(--muted)">${wc.new}</b> noch nie geschrieben</span></div>
        <div class="small muted" style="margin-top:8px">Schreiben hat einen eigenen Lernstand, getrennt vom Lesen. Neu dazu kommen Kanji, die du lesen kannst („Kann ich“ oder mit Karten gelernt). Der erste Versuch ist die Einstufung: Erst schreiben und auflösen, dann „Falsch“, „Richtig“ (kommt in den Übungsstapel) oder „Kann ich schon“ (gilt als gelernt und wird beim Schreiben nicht mehr abgefragt). „Meinen Stapel üben“ geht alles durch, was du gerade übst – auch was heute nicht fällig ist; „Zufällig üben“ zieht 10 aus allen Kanji der Auswahl. Beides zählt nicht zur Lernschlange.${wc.locked ? ` ${wc.locked} Kanji sind noch nicht freigeschaltet${App.checkOn() ? ' – <a href="#/ueben/einstufen?type=kanji">Kanji einstufen</a>' : ''}.` : ''}</div>` : ''}</div>
      <div data-stage style="margin-top:16px"></div></div>`;
    const run = (queue, free) => { view.querySelector('[data-setup]').hidden = true; runKanjiQuiz(view.querySelector('[data-stage]'), pool, mode, queue, () => App.writeQueue({ l: q.l }), free); };
    view.querySelector('[data-go]').onclick = () => run();
    if (mode === 'write') view.querySelector('[data-stack]').onclick = () => run(null, stack);
    if (mode === 'write') bindRoundStart(view, wq, q.round || q.auto, run); else nextRound = null;
  });

  // queue (nur „schreiben“): Lernrunde nach Schreib-Plan – falsch Geschriebenes kommt in derselben Runde noch einmal
  // ohne queue = freie Zufallsrunde (alle drei Arten): nichts wird bewertet, der Lernstand bleibt unberührt – wie „Frei üben“ bei den Karteikarten
  // free (nur „schreiben“): feste Liste statt 10 zufälliger – „Meinen Stapel üben“; ebenfalls ohne Bewertung, Falsches kommt noch einmal
  function runKanjiQuiz(stage, pool, mode, queue, more, free) {
    // für „Wort → Lesung“ die Beispielwörter sammeln
    const words = [];
    pool.forEach((k) => (k.words || []).forEach((w) => words.push({ k, w })));
    const qs = queue ? queue.slice() : free ? App.shuffle(free) : mode === 'reading' ? App.shuffle(words).slice(0, 10) : App.shuffle(pool).slice(0, 10);
    let i = 0, score = 0;
    let pending = null; // Bewertungs-Klick des offenen Kanji
    let last = null; // { i, score, snap, again } – „Rückgängig“ holt das zuletzt bewertete Kanji zurück
    const undoBtn = () => (last ? `<button class="btn btn-sm btn-ghost" data-kundo title="Letzte Bewertung zurücknehmen">${icon('undo')} Rückgängig</button>` : '');
    const undo = async () => {
      const l = last;
      last = null;
      if (l.snap) await App.srsRestore(l.snap);
      if (l.again) qs.splice(l.again, 1);
      ({ i, score } = l);
      next();
    };
    stage.addEventListener('click', (e) => { if (e.target.closest('[data-kundo]') && last) undo(); });
    const next = () => {
      if (i >= qs.length) {
        stage.innerHTML = `<div class="card pad-lg" style="text-align:center;max-width:640px;margin:0 auto"><div class="score-ring">${score} / ${qs.length}</div><h2>${score >= qs.length * 0.8 ? 'すごい！' : 'がんばって！'}</h2>${queue || free ? `<p class="muted">${qs.length > (queue || free).length ? 'Falsch Geschriebenes kam in dieser Runde gleich noch einmal dran.' : 'Alles auf Anhieb richtig geschrieben.'}</p>` : ''}<div class="row" style="justify-content:center">${undoBtn()}${App.backBtn('Zur Übersicht')}${queue ? roundEnd(more()) : '<button class="btn btn-primary" data-again>Nochmal</button>'}</div></div>`;
        if (!queue) stage.querySelector('[data-again]').onclick = () => App.render();
        bindRoundEnd(stage);
        return;
      }
      const cur = qs[i];
      if (mode === 'write') {
        stage.innerHTML = `<div class="card pad-lg"><div class="row between"><div><div class="small muted">${undoBtn()} Kanji ${i + 1} / ${qs.length}${queue ? '' : ' · freies Üben'} – schreibe:${queue && W.isFirst(S.srs, cur.id) ?' <span class="badge">erster Versuch</span>' : ''}</div><div class="ex-prompt">${App.meaningHtml(cur, true)}</div>
          <div class="muted" lang="ja">${esc((cur.kun || []).map(App.kanjiLogic.kunText).concat(cur.on || []).slice(0, 4).join('、'))}</div></div></div>
          <div class="kanji-stage quiz-stage" style="margin-top:14px"><div data-sol class="stroke-box" style="display:grid;place-items:center;min-height:240px;color:var(--muted)">?</div><div data-pad></div></div>
          <div class="row" style="margin-top:14px" data-btns><button class="btn btn-primary" data-show>${icon('eye')} Auflösen</button></div></div>`;
        const pad = App.stroke.pad(stage.querySelector('[data-pad]'), cur.char, { template: false, quiz: true });
        padButtons(stage);
        stage.querySelector('[data-show]').onclick = () => {
          pad.then((p) => p.reveal());
          App.stroke.animator(stage.querySelector('[data-sol]'), cur.char);
          if (!queue) { stage.querySelector('[data-btns]').innerHTML = `<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch</button><button class="btn" style="background:var(--matcha-soft)" data-r="2">✓ Richtig</button><a class="btn btn-ghost" href="${App.link(cur)}" target="_blank">Kanji öffnen</a>`; return; }
          stage.querySelector('[data-btns]').innerHTML = `<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch · wieder in ${ivlLabel(cur.id, 0, true)}</button><button class="btn" style="background:var(--${W.isFirst(S.srs, cur.id) ? 'ai' : 'matcha'}-soft)" data-r="2">✓ Richtig${W.isMarkedKnown(S.srs, cur.id) ? '' : ` · wieder in ${ivlLabel(cur.id, 2, true)}`}</button>${W.isFirst(S.srs, cur.id) ? `<button class="btn" style="background:var(--matcha-soft)" data-r="known" title="Als gelernt einstufen – wird beim Schreiben nicht mehr abgefragt">${icon('check')} Kann ich schon</button>` : ''}<a class="btn btn-ghost" href="${App.link(cur)}" target="_blank">Kanji öffnen</a>`;
        };
      } else {
        const correct = mode === 'reading' ? JP.kana(cur.w.jp) : App.meaning(cur).text;
        const distract = App.shuffle(mode === 'reading' ? words.filter((x) => JP.kana(x.w.jp) !== correct).map((x) => JP.kana(x.w.jp)) : pool.filter((x) => x !== cur).map((x) => App.meaning(x).text).filter(Boolean));
        const opts = App.shuffle([correct].concat(Array.from(new Set(distract)).slice(0, 3)));
        stage.innerHTML = `<div class="card pad-lg" style="max-width:720px;margin:0 auto;text-align:center"><div class="small muted">${i + 1} / ${qs.length}</div>
          <div style="font-family:${mode === 'reading' ? 'var(--font-jp)' : 'var(--font-kanji)'};font-size:${mode === 'reading' ? 54 : 110}px;line-height:1.3" lang="ja">${esc(mode === 'reading' ? JP.plain(cur.w.jp) : cur.char)}</div>
          <div class="grid cols-2" style="margin-top:14px">${opts.map((o) => `<button class="btn" style="min-height:64px;font-size:18px" data-o="${esc(o)}" ${mode === 'reading' ? 'lang="ja"' : ''}>${esc(o)}</button>`).join('')}</div><div data-fb style="margin-top:12px"></div></div>`;
        stage.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => {
          const ok = b.dataset.o === correct;
          stage.querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; if (x.dataset.o === correct) x.style.background = 'var(--matcha-soft)'; });
          if (!ok) b.style.background = 'var(--shu-soft)';
          if (ok) score++;
          stage.querySelector('[data-fb]').innerHTML = `${mode === 'reading' ? `<div lang="ja" style="font-size:20px">${JP.ruby(cur.w.jp)} – ${App.meaningHtml(cur.w)}</div>` : `<div lang="ja">${esc((cur.on || []).join('、'))} · ${esc((cur.kun || []).map(App.kanjiLogic.kunText).join('、'))}</div>`}<button class="btn btn-primary" style="margin-top:10px" data-n>Weiter ${icon('next')}</button>`;
          stage.querySelector('[data-n]').onclick = () => { i++; next(); };
        }));
        return;
      }
      if (pending) stage.removeEventListener('click', pending);
      stage.addEventListener('click', pending = async function h(e) {
        const b = e.target.closest('[data-r]'); if (!b) return;
        stage.removeEventListener('click', h);
        pending = null;
        const known = b.dataset.r === 'known'; // Einstufung beim ersten Versuch: gilt als gelernt
        const g = known ? 2 : +b.dataset.r;
        last = { i, score, snap: queue ? App.srsSnap([W.id(cur.id)]) : null, again: 0 };
        if (g) score++;
        if (queue) await (known ? App.markWriteKnown(cur.id) : App.gradeWrite(cur.id, g));
        if ((queue || free) && !g) { last.again = Math.min(i + 4, qs.length); qs.splice(last.again, 0, cur); }
        i++; next();
      });
    };
    next();
  }
})(window.App);
