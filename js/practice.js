/* Nihongo Techō – Üben: Karteikarten (SRS), Übersetzungsübungen, Kanji-Quiz */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  const W = App.writeLogic;
  const kanjiFocus = () => W.focus(S.settings);
  App.dueCount = () => W.dueCount(S.srs, S.items, kanjiFocus(), Date.now());
  const lessonNum = (it) => (it.lesson === '' || it.lesson == null || isNaN(+it.lesson)) ? null : +it.lesson;
  const maxLessonOptions = (cur) => Array.from({ length: 12 }, (_, i) => i + 1).map((l) => `<option value="${l}" ${+cur === l ? 'selected' : ''}>bis Lektion ${l}</option>`).join('');

  // =========================================================
  // Übersicht
  // =========================================================
  App.route('/ueben', (view) => {
    const sec = App.SECTIONS.practice;
    const due = App.dueCount();
    const wDue = kanjiFocus() === 'read' ? 0 : App.writeQueue().due.length;
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Wiederholen, übersetzen, schreiben – alles passend zu deinem Niveau und aus deinen eigenen Inhalten.')}
      <div class="practice-home">
        <a class="mode-card sec-practice" href="#/ueben/karten"><span class="k">札</span><h3>Karteikarten</h3><span class="muted">Vokabeln, Kanji, Grammatik & Ausdrücke mit Wiederholungsplan (wie Anki).</span>${due ? `<span class="badge count">${due} fällig</span>` : ''}</a>
        <a class="mode-card sec-vocab" href="#/ueben/einstufen"><span class="k">確</span><h3>Einstufen</h3><span class="muted">Vokabeln &amp; Kanji: Kenne ich das? In Runden prüfen, was in den Lernstapel kommt.</span>${(() => { const n = App.vocabCounts().unchecked + W.activeCounts(App.itemsOf('vocab'), S.srs, App.needsCheck).unchecked; return n ? `<span class="badge">${n} ungeprüft</span>` : ''; })()}</a>
        <a class="mode-card sec-apply" href="#/anwenden"><span class="k">使</span><h3>Anwenden</h3><span class="muted">Tagebuch schreiben und Smalltalk-Fragen beantworten – mit Stift oder Tastatur.</span></a>
        <a class="mode-card sec-grammar" href="#/ueben/saetze"><span class="k">訳</span><h3>Übersetzungsübungen</h3><span class="muted">Sätze aus deinen Grammatik- und Vokabelbausteinen – nur mit dem, was du schon kennst.</span></a>
        <a class="mode-card sec-kanji" href="#/ueben/kanji"><span class="k">書</span><h3>Kanji-Quiz</h3><span class="muted">Bedeutung sehen → mit dem Stift schreiben, oder Lesungen erkennen.</span>${wDue ? `<span class="badge count">${wDue} zu schreiben</span>` : ''}</a>
        <a class="mode-card sec-phrase" href="#/ueben/karten?type=phrase"><span class="k">表</span><h3>Auswendig-Lernen</h3><span class="muted">Wochentage, Zahlen, Zähler, Uhrzeiten, Floskeln …</span></a>
        <button class="mode-card sec-library" data-ai-prompt><span class="k">AI</span><h3>KI-Prompt</h3><span class="muted">Fertigen Prompt mit deinem Wortschatz & deiner Grammatik kopieren – für Claude & Co.</span></button>
      </div></div>`;
    view.querySelector('[data-ai-prompt]').onclick = () => aiPromptDialog(S.settings.level || 12);
  });

  const aiPrompt = (maxL, grammarIds) => {
    const gs = grammarIds ? grammarIds.map(App.item).filter(Boolean) : App.itemsOf('grammar').filter((g) => (lessonNum(g) || 0) <= maxL);
    const vs = App.itemsOf('vocab').filter((v) => { if (!v.de) return false; const l = lessonNum(v); return v.source !== 'Genki I' || (l !== null && l <= maxL); }); // nur Wörter mit deutscher Bedeutung
    const vlist = App.shuffle(vs).slice(0, 220);
    return `Ich lerne Japanisch auf Niveau JLPT N5 (Genki I bis Lektion ${maxL}). Erstelle mir 10 Übersetzungsübungen Deutsch → Japanisch.
Regeln: Verwende AUSSCHLIESSLICH die unten stehende Grammatik und möglichst nur diese Vokabeln (höchstens 1 unbekanntes Wort pro Satz, dann mit Übersetzung in Klammern). Höfliche です/ます-Form, außer die Grammatik verlangt Kurzform. Kurze, alltagsnahe Sätze. Gib zuerst nur die deutschen Sätze aus; Lösungen (Kanji mit Furigana in Klammern + Kana + kurzer Grammatikhinweis) erst am Ende unter „Lösungen“.

Grammatik:
${gs.map((g) => `- ${g.title}${g.jp ? ' (' + JP.plain(g.jp) + ')' : ''}`).join('\n')}

Vokabeln:
${vlist.map((v) => `${v.kanji || v.kana}${v.kanji ? '（' + v.kana + '）' : ''} = ${v.de}`).join('; ')}`;
  };
  const aiPromptDialog = (maxL, grammarIds) => {
    const txt = aiPrompt(maxL, grammarIds);
    const md = App.modal({ title: 'KI-Prompt für Übungen', body: `<p class="muted small">Kopiere den Text in Claude (oder eine andere KI). Er enthält nur Grammatik & Wörter bis zu deinem Niveau.</p><div class="prompt-box">${esc(txt)}</div>`, foot: `<button class="btn btn-primary" data-copy>${icon('copy')} Kopieren</button>` });
    md.el.querySelector('[data-copy]').onclick = () => navigator.clipboard.writeText(txt).then(() => { App.toast('Kopiert!'); md.close(); });
  };

  // =========================================================
  // Karteikarten
  // =========================================================
  const cardFilter = (q) => {
    const type = q.type || 'vocab';
    let items = App.itemsOf(type);
    if (q.src) items = items.filter((i) => i.source === q.src);
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
  const roundStart = (q, dueLabel) => `<button class="btn ${q.due.length || !newMax(q) ? 'btn-primary' : ''}" data-round="due" ${q.due.length ? '' : 'disabled'}>${icon('play')} ${dueLabel} (${q.due.length} fällig)</button>
          <button class="btn ${q.due.length || !newMax(q) ? '' : 'btn-primary'}" data-round="new" ${newMax(q) ? '' : 'disabled'}>${icon('plus')} Neue lernen (${newMax(q)} neu)</button>`;
  const roundEnd = (q) => `${q.due.length ? `<button class="btn btn-primary" data-round="due">${icon('play')} Weiter wiederholen (${q.due.length})</button>` : ''}${newMax(q) ? `<button class="btn ${q.due.length ? '' : 'btn-primary'}" data-round="new">${icon('plus')} Jetzt ${newMax(q)} neue lernen</button>` : ''}`;
  const bindRoundEnd = (stage) => stage.querySelectorAll('[data-round]').forEach((b) => (b.onclick = () => { nextRound = b.dataset.round; App.render(); }));
  // Knöpfe der Auswahl verdrahten; Direktstart (Startseite) oder Wunsch vom Abschlussbildschirm löst gleich aus
  const bindRoundStart = (view, q, auto, run) => {
    const kind = nextRound || (auto ? (q.due.length ? 'due' : 'new') : '');
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
    return Object.assign({ items, unlocked }, W.queue(items, S.srs, Date.now(), unlocked, all));
  };
  // Vokabeln aktiv (Deutsch → Japanisch) haben ebenfalls einen eigenen Lernstand: neu ist, was im Aktiv-Lernstapel liegt
  App.activeQueue = (q = {}) => {
    const items = cardFilter(Object.assign({}, q, { type: 'vocab' })).sort(learnOrder);
    return Object.assign({ items }, W.activeQueue(items, S.srs, Date.now(), App.needsCheck));
  };
  App.activeStatus = (it) => W.activeStatus(S.srs, it, App.needsCheck);
  // Kartenrichtung: bei Kanji mit Schwerpunkt Schreiben ist „Bedeutung → schreiben“ der Standard
  const cardDir = (q) => q.dir || ((q.type === 'kanji' && kanjiFocus() === 'write') ? 'de' : 'jp');
  App.cardQueue = (q = {}) => {
    const type = q.type || 'vocab';
    if (type === 'kanji' && cardDir(q) === 'de') return App.writeQueue(q);
    if (type === 'vocab' && cardDir(q) === 'de') return App.activeQueue(q);
    const items = cardFilter(q);
    const now = Date.now();
    const due = W.readDue(items, S.srs, now);
    // Vokabeln/Kanji: neu sind nur Einträge aus dem Lernstapel (ungeprüfte erst einstufen; eigene Einträge sind es ohne Einstufung). Grammatik: Lernstapel inkl. „im Unterricht behandelt“. Ausdrücke: alles Ungeübte.
    const fresh = items.filter((i) => { const s = S.srs.get(i.id); return type === 'phrase' ? (!s || !s.reps) : (App.vocabStatus(i.id) === 'learn' && (!s || !s.reps)); })
      .sort(learnOrder);
    return { items, due, fresh };
  };
  App.route('/ueben/karten', (view, p, q) => {
    const sec = App.SECTIONS.practice;
    const type = q.type || 'vocab';
    const cq = App.cardQueue(q), { items, due, fresh } = cq;
    const dir = cardDir(q), defDir = cardDir(Object.assign({}, q, { dir: '' }));
    const write = type === 'kanji' && dir === 'de';
    const active = type === 'vocab' && dir === 'de';
    const unchecked = type === 'phrase' ? 0 : active ? items.filter((i) => App.activeStatus(i) === 'unchecked').length : items.filter((i) => i.char !== '々' && App.vocabStatus(i.id) === 'unchecked').length;
    const allOfType = App.itemsOf(type);
    const groups = type === 'phrase' ? Array.from(new Set(allOfType.map((x) => x.group))) : [];
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/ueben">Üben</a> › Karteikarten</div>
      <div class="page-head"><div class="titles"><h1>Karteikarten <span class="jp-title">札</span></h1><p>${due.length} fällig · ${fresh.length} neu in dieser Auswahl</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row"><div class="seg">${[['vocab', 'Vokabeln'], ['kanji', 'Kanji'], ['grammar', 'Grammatik'], ['phrase', 'Ausdrücke']].map(([k, l]) => `<button class="${type === k ? 'on' : ''}" data-q-type="${k === 'vocab' ? '' : k}">${l}</button>`).join('')}</div>
          <div class="seg">${(type === 'kanji' ? [['jp', 'Kanji → Bedeutung (lesen)'], ['de', 'Bedeutung → Kanji (schreiben)']] : [['jp', 'Japanisch → Deutsch'], ['de', 'Deutsch → Japanisch']]).map(([k, l]) => `<button class="${dir === k ? 'on' : ''}" data-q-dir="${k === defDir ? '' : k}">${l}</button>`).join('')}</div>
          ${App.lessonSelect(allOfType.filter((i) => !q.src || i.source === q.src), q.l)}
          ${groups.length ? `<select class="input" data-q-select="g"><option value="">Alle Gruppen</option>${groups.map((g) => `<option ${q.g === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>` : ''}
          <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Nur gemerkte</button></div>
        ${App.sourceChips(allOfType, q.src)}
        ${App.levelChips(q.lvl)}
        <div class="row">${roundStart(cq, 'Wiederholen')}
          <button class="btn" data-cram ${items.length ? '' : 'disabled'}>${icon('shuffle')} Zufällig üben (aus allen ${items.length})</button></div>
        ${write ? `<div class="small muted">Schreiben hat einen eigenen Lernstand: Neu sind Kanji, die du lesen kannst, aber noch nie geschrieben hast. Hier schreibst du auf Papier und drehst die Karte um – <a href="#/ueben/kanji">mit dem Stift in der App schreiben</a>.</div>` : ''}
        ${active ? `<div class="small muted">Deutsch → Japanisch hat einen eigenen Lernstand, getrennt vom Lesen. Dazu kommen Wörter, sobald du sie lesen kannst – nach der Aktiv-Einstufung landet im Stapel nur, was du aus dem Deutschen heraus noch nicht weißt.</div>` : ''}
        ${unchecked ? `<div class="card row between" style="background:var(--yamabuki-soft);border-color:transparent;box-shadow:none"><div><b>${unchecked} ${type === 'kanji' ? 'Kanji' : type === 'grammar' ? 'Grammatikpunkte' : 'Vokabeln'} sind ${active ? 'aktiv noch nicht eingestuft' : 'noch ungeprüft'}.</b><div class="small muted">${type === 'grammar' ? 'Neue Karten kommen nur aus deinem Lernstapel. Setze Grammatik auf „Lernstapel“ – im Unterricht behandelte landen dort automatisch.' : active ? 'Du kannst sie lesen – prüfe, welche du auch aus dem Deutschen heraus weißt. Neue Karten kommen nur aus dem Aktiv-Lernstapel.' : 'Neue Karten kommen nur aus deinem Lernstapel. Prüfe erst, was du schon kannst.'}</div></div>
          ${type === 'grammar' ? `<a class="btn btn-sm" href="#/grammatik?${new URLSearchParams(Object.fromEntries(Object.entries({ st: 'unchecked', src: q.src, l: q.l, lvl: q.lvl }).filter(([, v]) => v)))}">${icon('check')} Einstufen</a>` : `<a class="btn btn-sm" href="#/ueben/einstufen?${new URLSearchParams(Object.fromEntries(Object.entries({ type: type === 'kanji' ? 'kanji' : '', dir: active ? 'de' : '', src: q.src, l: q.l, lvl: q.lvl }).filter(([, v]) => v)))}">${icon('check')} Einstufen</a>`}</div>` : ''}</div></div>
      <div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    const start = (queue, cram) => { view.querySelector('[data-setup]').hidden = true; runCards(stage, queue, { type, dir, cram, write, active, more: () => App.cardQueue(q) }); };
    view.querySelector('[data-cram]').onclick = () => start(App.shuffle(items).slice(0, 60), true);
    bindRoundStart(view, cq, q.auto, (queue) => start(queue, false));
  });

  function cardFaces(it, dir) {
    if (it.type === 'grammar') {
      // Deutsche Seite: Teil des Titels nach „ – “ (z. B. „X ist Y“), sonst die Kurzbeschreibung
      const de = it.title.includes(' – ') ? it.title.split(' – ').slice(1).join(' – ') : (it.summary || it.title);
      const ex = it.examples && it.examples[0];
      const struct = (it.structure || []).length ? `<div class="structure" style="text-align:left;margin-top:10px">${it.structure.map((x) => `<div>${JP.ruby(x)}</div>`).join('')}</div>` : '';
      const exHtml = ex ? `<div style="margin-top:10px">${App.exampleHtml(ex)}</div>` : '';
      if (dir === 'de') return { front: `<div class="front de-front">${esc(de)}</div><div class="muted">Welche Grammatik ist das?</div>`, back: `<div class="ans jp" lang="ja">${JP.ruby(it.jp || '')}</div><div>${esc(it.title)}</div>${App.levelBadge(it)}${struct}${exHtml}`, speak: '' };
      return { front: `<div class="front" lang="ja">${JP.ruby(it.jp || '')}</div><div class="muted">Was bedeutet das, wie benutzt man es?</div>`, back: `<div class="ans">${esc(it.title)}</div><div class="muted">${esc(it.summary || '')}</div>${App.levelBadge(it)}${struct}${exHtml}`, speak: '' };
    }
    if (it.type === 'kanji') {
      if (dir === 'de') return { front: `<div class="front de-front">${App.meaningHtml(it)}</div><div class="muted">Wie schreibt man das Kanji?</div>`, back: `<div class="ans" style="font-family:var(--font-kanji);font-size:80px;font-weight:400">${esc(it.char)}</div><div lang="ja">${esc((it.on || []).join('、'))} · ${esc((it.kun || []).join('、'))}</div>`, speak: '' };
      return { front: `<div class="front kanji-front">${esc(it.char)}</div>`, back: `<div class="ans">${App.meaningHtml(it)}${App.levelBadge(it)}</div><div lang="ja" style="font-size:18px">On: ${esc((it.on || []).join('、') || '–')} · Kun: ${esc((it.kun || []).join('、') || '–')}</div>${(it.words || []).slice(0, 3).map((w) => `<div lang="ja">${JP.ruby(w.jp)} – ${App.meaningHtml(w)}</div>`).join('')}`, speak: '' };
    }
    const jpHtml = it.type === 'vocab' ? JP.wordRuby(it) : JP.ruby(it.jp);
    const reading = it.type === 'vocab' ? it.kana : JP.kana(it.jp);
    const ex = it.examples && it.examples[0];
    const extra = (it.type === 'vocab' ? App.accentHtml(it) : '') + (ex ? `<div style="margin-top:10px">${App.exampleHtml(ex)}</div>` : '') + (it.note ? `<div class="small muted">${esc(it.note)}</div>` : '');
    const speakTxt = it.type === 'vocab' ? (it.kanji || it.kana) : it.jp;
    if (dir === 'de') return { front: `<div class="front de-front">${App.meaningHtml(it)}</div>`, back: `<div class="ans jp" lang="ja">${jpHtml}</div>${App.levelBadge(it)}${extra}`, speak: speakTxt };
    return { front: `<div class="front" lang="ja">${App.askHtml(it)}</div>`, back: `<div class="jp" lang="ja" style="font-size:20px;color:var(--muted)">${esc(reading)}</div><div class="ans">${App.meaningHtml(it)}</div>${App.levelBadge(it)}${extra}`, speak: speakTxt };
  }
  const ivlLabel = (id, g, write) => {
    const s = S.srs.get(write ? W.id(id) : id) || { ivl: 0, ease: 2.5, reps: 0 };
    let d;
    if (g === 0) return '10 Min';
    if (s.reps === 0) d = g === 1 ? 0.5 : g === 2 ? 1 : 4;
    else if (s.reps === 1) d = g === 1 ? 2 : g === 2 ? 3 : 6;
    else d = s.ivl * (g === 1 ? 1.2 : g === 2 ? s.ease : s.ease * 1.3);
    return d < 1 ? '12 Std' : d < 30 ? Math.round(d) + ' T' : Math.round(d / 30) + ' Mon';
  };
  // write/active: eigener Lernstand unter „w:<Id>“ (Kanji schreiben · Vokabeln Deutsch → Japanisch)
  function runCards(stage, queue, { dir, cram, write, active, more }) {
    queue = queue.slice();
    const total = queue.length;
    let done = 0, right = 0, flipped = false, cur = null;
    const next = () => {
      cur = queue.shift();
      flipped = false;
      if (!cur) {
        stage.innerHTML = `<div class="flash-stage"><div class="flash" style="cursor:default"><div class="score-ring">お疲れ様！</div><h2>${done} Karten geschafft</h2><p class="muted">${right} davon gewusst. ${App.dueCount() ? App.dueCount() + ' Karten sind insgesamt noch fällig.' : 'Alles erledigt für jetzt.'}</p>
          <div class="row" style="justify-content:center"><a class="btn" href="#/ueben">Zur Übersicht</a>${cram ? '<button class="btn btn-primary" data-again>Weitere Runde</button>' : roundEnd(more())}</div></div></div>`;
        if (cram) stage.querySelector('[data-again]').onclick = () => App.render();
        bindRoundEnd(stage);
        return;
      }
      const f = cardFaces(cur, dir);
      stage.innerHTML = `<div class="flash-stage ${App.furiClass()}"><div class="row between small muted" style="margin-bottom:8px"><span>${done + 1} / ${total}${cram ? ' · freies Üben' : ''}</span><span>${App.srcBadge(cur)}</span></div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(done / Math.max(1, total)) * 100}%"></i></div>
        <div class="flash" data-flip>${f.front}<div class="back" hidden>${f.back}</div><span class="tap-hint">Tippen oder Leertaste zum Umdrehen</span></div>
        <div class="grade-row" hidden>${[['g0', 'Nochmal', 0], ['g1', 'Schwer', 1], ['g2', 'Gut', 2], ['g3', 'Leicht', 3]].map(([c, l, g]) => `<button class="${c}" data-g="${g}">${l}<small>${ivlLabel(cur.id, g, write || active)}</small></button>`).join('')}</div>
        <div class="row" style="justify-content:center;margin-top:10px"><a class="btn btn-sm btn-ghost" href="${App.link(cur)}" target="_blank">${icon('info')} Eintrag öffnen</a>${f.speak ? App.speakBtn(f.speak) : ''}</div></div>`;
    };
    const flip = () => {
      if (!cur || flipped) return;
      flipped = true;
      stage.querySelector('.back').hidden = false;
      stage.querySelector('.tap-hint').hidden = true;
      stage.querySelector('.grade-row').hidden = false;
    };
    const grade = async (g) => {
      if (!flipped) return;
      await (write ? App.gradeWrite(cur.id, g) : App.grade(active ? W.id(cur.id) : cur.id, g));
      done++; if (g > 0) right++;
      if (g === 0) queue.splice(Math.min(3, queue.length), 0, cur);
      next();
    };
    stage.addEventListener('click', (e) => {
      if (e.target.closest('[data-speak]') || e.target.closest('a')) return;
      if (e.target.closest('[data-flip]')) flip();
      const b = e.target.closest('[data-g]'); if (b) grade(+b.dataset.g);
    });
    const onKey = (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); }
      if (['1', '2', '3', '4'].includes(e.key)) grade(+e.key - 1);
    };
    document.addEventListener('keydown', onKey);
    App.onLeave(() => document.removeEventListener('keydown', onKey));
    next();
  }

  // =========================================================
  // Übersetzungsübungen
  // =========================================================
  App.route('/ueben/saetze', (view, p, q) => {
    const sec = App.SECTIONS.grammar;
    const session = q.s ? App.item(q.s) : null;
    let maxL = +(q.max || (session && +session.bookLesson) || S.settings.level || 12);
    if (!maxL || isNaN(maxL)) maxL = 12;
    const allG = App.itemsOf('grammar').sort((a, b) => (lessonNum(a) || 0) - (lessonNum(b) || 0));
    let preset = q.g ? [q.g] : session ? (session.grammarIds || []) : null;
    const inLevel = allG.filter((g) => g.source !== 'Genki I' || (lessonNum(g) || 0) <= maxL);
    const selected = new Set(preset && preset.length ? preset : inLevel.map((g) => g.id));
    const dir = q.dir || 'de';
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/ueben">Üben</a> › Übersetzungsübungen</div>
      <div class="page-head"><div class="titles"><h1>Übersetzen <span class="jp-title">翻訳</span></h1><p>${session ? `Zur Stunde „${esc(session.title || session.number)}“ – ` : ''}Sätze nur aus Grammatik & Vokabeln bis zu deinem Niveau.</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row"><label class="small"><b>Niveau</b></label><select class="input" data-max>${maxLessonOptions(maxL)}</select>
          <div class="seg">${[['de', 'Deutsch → Japanisch'], ['jp', 'Japanisch → Deutsch'], ['mix', 'Gemischt']].map(([k, l]) => `<button class="${dir === k ? 'on' : ''}" data-q-dir="${k === 'de' ? '' : k}">${l}</button>`).join('')}</div>
          <select class="input" data-n>${[5, 10, 15, 20].map((n) => `<option ${n === 10 ? 'selected' : ''}>${n}</option>`).join('')}</select><span class="small muted">Sätze</span></div>
        <details class="adv" ${preset ? 'open' : ''}><summary>Grammatik auswählen (${selected.size} gewählt)</summary>
          <div class="row" style="margin-bottom:8px"><button class="btn btn-sm" data-all>Alle bis Lektion ${maxL}</button><button class="btn btn-sm" data-none>Keine</button></div>
          <div class="grid cols-2" style="gap:4px">${inLevel.map((g) => `<label class="picker-row"><input type="checkbox" value="${g.id}" ${selected.has(g.id) ? 'checked' : ''}><span class="badge src" style="--c:${App.sourceColor(g.source)}">L${esc(g.lesson)}</span><span>${esc(g.title)}</span><span class="muted small">${(g.patterns || []).length ? '✦' : ''}</span></label>`).join('')}</div>
          <div class="small muted" style="margin-top:6px">✦ = mit Satzmustern (erzeugt immer neue Sätze). Ohne ✦ werden die Beispielsätze genutzt.</div></details>
        <div class="row"><button class="btn btn-primary" data-go>${icon('sparkle')} Übung starten</button><button class="btn" data-ai>${icon('copy')} Als KI-Prompt kopieren</button></div></div></div>
      <div data-stage></div></div>`;
    const setup = view.querySelector('[data-setup]');
    setup.querySelector('[data-max]').onchange = (e) => App.setQuery({ max: e.target.value });
    setup.querySelector('[data-all]').onclick = () => $$('input[type=checkbox]', setup).forEach((c) => (c.checked = true));
    setup.querySelector('[data-none]').onclick = () => $$('input[type=checkbox]', setup).forEach((c) => (c.checked = false));
    const chosen = () => $$('details input[type=checkbox]:checked', setup).map((c) => c.value);
    setup.querySelector('[data-ai]').onclick = () => aiPromptDialog(maxL, chosen());
    setup.querySelector('[data-go]').onclick = () => {
      const gids = chosen();
      if (!gids.length) return App.toast('Bitte mindestens einen Grammatikpunkt wählen');
      const n = +setup.querySelector('[data-n]').value;
      const pool = App.itemsOf('vocab').filter((v) => {
        if (!v.de) return false; // Satzgenerator braucht deutsche Daten – Paket-Wörter nur mit Englisch fallen heraus
        if (session && (session.vocabIds || []).includes(v.id)) return true;
        const l = lessonNum(v);
        if (v.source === 'Genki I') return l !== null && l <= maxL;
        return true; // eigene Wörter (NHK, VHS …) sind immer erlaubt
      });
      const exs = buildExercises(gids.map(App.item).filter(Boolean), pool, n, maxL);
      if (!exs.length) return App.toast('Dazu konnten keine Sätze erzeugt werden – wähle mehr Grammatik aus.');
      setup.hidden = true;
      runExercises(view.querySelector('[data-stage]'), exs, dir);
    };
  });

  function buildExercises(grammar, pool, n, maxL) {
    const out = [];
    const seen = new Set();
    const exPool = [];
    grammar.forEach((g) => (g.examples || []).forEach((e) => exPool.push({ g, jp: e.jp, de: App.exMeaning(e), kana: e.kana })));
    const withPat = grammar.filter((g) => (g.patterns || []).length);
    let guard = 0;
    while (out.length < n && guard++ < n * 30) {
      const useGen = withPat.length && (Math.random() < 0.72 || !exPool.length);
      if (useGen) {
        const g = App.pick(withPat);
        const r = JP.fill(App.pick(g.patterns), pool);
        if (!r) continue;
        const key = JP.plain(r.jp);
        if (seen.has(key)) continue;
        seen.add(key); out.push({ g, jp: r.jp, de: r.de, words: r.words, gen: true });
      } else if (exPool.length) {
        const e = App.pick(exPool);
        const key = JP.plain(e.jp);
        if (seen.has(key)) { if (seen.size >= exPool.length + 50) break; continue; }
        seen.add(key); out.push({ g: e.g, jp: e.jp, de: e.de, kana: e.kana, words: [] });
      } else break;
    }
    return App.shuffle(out);
  }

  function runExercises(stage, exs, dirMode) {
    let i = 0, score = 0;
    const wrong = [];
    const show = () => {
      if (i >= exs.length) {
        stage.innerHTML = `<div class="ex-card"><div class="card pad-lg" style="text-align:center"><div class="score-ring">${score} / ${exs.length}</div><h2>${score === exs.length ? '完璧！ Perfekt!' : score > exs.length / 2 ? 'よくできました！' : 'がんばって！ Dranbleiben!'}</h2>
          ${wrong.length ? `<div class="section-title">Zum Wiederholen</div><div class="stack" style="text-align:left">${wrong.map((e) => `<div class="example"><div class="grow"><div class="jp-s" lang="ja">${JP.ruby(e.jp)}</div><div class="de-s">${esc(e.de)}</div><a class="small" href="${App.link(e.g)}">${esc(e.g.title)}</a></div></div>`).join('')}</div>` : ''}
          <div class="row" style="justify-content:center;margin-top:16px"><a class="btn" href="#/ueben">Übersicht</a><button class="btn btn-primary" data-again>Neue Runde</button></div></div></div>`;
        stage.querySelector('[data-again]').onclick = () => App.render();
        return;
      }
      const e = exs[i];
      const dir = dirMode === 'mix' ? (Math.random() < 0.5 ? 'de' : 'jp') : dirMode;
      const kanaSol = e.kana || JP.kana(e.jp);
      stage.innerHTML = `<div class="ex-card ${App.furiClass()}"><div class="row between small muted" style="margin-bottom:8px"><span>Satz ${i + 1} / ${exs.length}</span><a class="badge sec sec-grammar" href="${App.link(e.g)}" target="_blank" style="text-decoration:none">文 ${esc(e.g.title)}</a></div>
        <div class="progress" style="margin-bottom:14px"><i style="width:${(i / exs.length) * 100}%"></i></div>
        <div class="card pad-lg">
          <div class="small muted">${dir === 'de' ? 'Übersetze ins Japanische:' : 'Übersetze ins Deutsche:'}</div>
          <div class="ex-prompt ${dir === 'jp' ? 'jp' : ''}" ${dir === 'jp' ? 'lang="ja"' : ''}>${dir === 'de' ? esc(e.de) : JP.ruby(e.jp)} ${dir === 'jp' ? App.speakBtn(e.jp) : ''}</div>
          ${dir === 'de' ? `<input class="input answer-in" placeholder="Antwort (Romaji wird zu かな)" autocomplete="off" autocapitalize="off" spellcheck="false">
            <div class="row" style="margin-top:8px"><label class="small row" style="gap:6px"><input type="checkbox" data-rj checked> Romaji → かな</label><button class="btn btn-sm btn-ghost" data-hand>${icon('pen')} Mit Stift schreiben</button></div><div data-handpad hidden style="margin-top:10px"></div>`
          : `<textarea class="input" style="width:100%;font-size:19px" rows="2" placeholder="Deine Übersetzung …"></textarea>`}
          <div class="row" style="margin-top:14px"><button class="btn btn-primary" data-check>${icon('check')} ${dir === 'de' ? 'Prüfen' : 'Lösung zeigen'}</button><button class="btn btn-ghost" data-skip>Überspringen</button></div>
          <div data-sol></div></div></div>`;
      const inp = stage.querySelector('.answer-in, textarea');
      if (dir === 'de') {
        const rj = stage.querySelector('[data-rj]');
        App.bindRomaji(inp, () => rj.checked);
        stage.querySelector('[data-hand]').onclick = () => { const h = stage.querySelector('[data-handpad]'); h.hidden = !h.hidden; if (!h.hidden && !h.dataset.init) { h.dataset.init = 1; App.stroke.pad(h, null, { template: false }); } };
      }
      setTimeout(() => inp.focus(), 50);
      let checked = false;
      const check = () => {
        if (checked) return;
        checked = true;
        const ans = inp.value.trim();
        let auto = null;
        if (dir === 'de' && ans) {
          const a = JP.lenient(JP.romaji(ans));
          auto = [JP.lenient(e.jp), JP.lenient(kanaSol), JP.lenient(JP.plain(e.jp))].includes(a);
        }
        const words = (e.words || []).filter(Boolean);
        stage.querySelector('[data-sol]').innerHTML = `<div class="solution">
          ${auto === true ? '<div class="verdict ok">✓ Richtig!</div>' : auto === false ? '<div class="verdict no">Nicht ganz – vergleiche:</div>' : ''}
          <div class="small muted" style="margin-top:8px">Lösung</div>
          ${dir === 'de' ? `<div class="sol-jp" lang="ja">${JP.ruby(e.jp)} ${App.speakBtn(e.jp)}</div><div class="small muted" lang="ja">${esc(kanaSol)}</div>` : `<div style="font-size:21px;font-weight:800">${esc(e.de)}</div><div class="small muted" lang="ja">${esc(kanaSol)}</div>`}
          ${words.length ? `<div class="row" style="margin-top:10px;gap:6px">${words.map((w) => `<a class="badge" style="background:var(--fuji-soft);color:var(--fuji);text-decoration:none" href="${App.link(w)}" target="_blank" lang="ja">${esc(w.kanji || w.kana)} = ${esc(w.de)}</a>`).join('')}</div>` : ''}
          <div class="row" style="margin-top:14px">${auto === true ? `<button class="btn btn-primary" data-res="1">Weiter ${icon('next')}</button>` : `<button class="btn" style="background:var(--shu-soft)" data-res="0">✗ Hatte ich falsch</button><button class="btn" style="background:var(--matcha-soft)" data-res="1">✓ Hatte ich richtig</button>`}</div></div>`;
        stage.querySelector('[data-check]').hidden = true;
      };
      stage.querySelector('[data-check]').onclick = check;
      stage.querySelector('[data-skip]').onclick = () => { wrong.push(e); i++; show(); };
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && !ev.shiftKey && !ev.isComposing) { ev.preventDefault(); if (!checked) check(); else { const b = stage.querySelector('[data-res="1"]'); if (b && stage.querySelector('.verdict.ok')) b.click(); } } });
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
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/ueben">Üben</a> › Kanji-Quiz</div>
      <div class="page-head"><div class="titles"><h1>Kanji-Quiz <span class="jp-title">書</span></h1><p>${pool.length} Kanji in der Auswahl</p></div></div>
      <div class="card" data-setup><div class="row">
        <div class="seg">${[['write', 'Bedeutung → schreiben'], ['read', 'Kanji → Bedeutung'], ['reading', 'Wort → Lesung']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-q-mode="${k === defMode ? '' : k}">${l}</button>`).join('')}</div>
        <select class="input" data-q-select="max">${maxLessonOptions(maxL)}</select>${App.lessonSelect(all, q.l)}
        ${mode === 'write' ? `${roundStart(wq, 'Schreiben wiederholen')}
        <button class="btn" data-go ${pool.length >= 4 ? '' : 'disabled'}>${icon('shuffle')} Zufällig üben (10)</button>`
        : `<button class="btn btn-primary" data-go ${pool.length >= 4 ? '' : 'disabled'}>${icon('play')} Start (10)</button>`}</div>
        ${mode === 'write' ? `<div class="row" style="gap:18px;margin-top:12px">
          <span><b style="font-size:22px;color:var(--matcha)">${wc.known}</b> kann ich schreiben</span>
          <span><b style="font-size:22px;color:var(--ai)">${wc.learn}</b> übe ich</span>
          <span><b style="font-size:22px;color:var(--muted)">${wc.new}</b> noch nie geschrieben</span></div>
        <div class="small muted" style="margin-top:8px">Schreiben hat einen eigenen Lernstand, getrennt vom Lesen. Neu dazu kommen Kanji, die du lesen kannst („Kann ich“ oder mit Karten gelernt). Der erste Versuch ist die Einstufung: Erst schreiben und auflösen, dann „Falsch“, „Richtig“ (kommt in den Übungsstapel) oder „Kann ich schon“ (gilt als gelernt und wird beim Schreiben nicht mehr abgefragt).${wc.locked ? ` ${wc.locked} Kanji sind noch nicht freigeschaltet – <a href="#/ueben/einstufen?type=kanji">Kanji einstufen</a>.` : ''}</div>` : ''}</div>
      <div data-stage style="margin-top:16px"></div></div>`;
    const run = (queue) => { view.querySelector('[data-setup]').hidden = true; runKanjiQuiz(view.querySelector('[data-stage]'), pool, mode, queue, () => App.writeQueue({ l: q.l })); };
    view.querySelector('[data-go]').onclick = () => run();
    if (mode === 'write') bindRoundStart(view, wq, q.auto, run); else nextRound = null;
  });

  // queue (nur „schreiben“): Lernrunde nach Schreib-Plan – falsch Geschriebenes kommt in derselben Runde noch einmal
  function runKanjiQuiz(stage, pool, mode, queue, more) {
    // für „Wort → Lesung“ die Beispielwörter sammeln
    const words = [];
    pool.forEach((k) => (k.words || []).forEach((w) => words.push({ k, w })));
    const qs = queue ? queue.slice() : mode === 'reading' ? App.shuffle(words).slice(0, 10) : App.shuffle(pool).slice(0, 10);
    let i = 0, score = 0;
    const next = () => {
      if (i >= qs.length) {
        stage.innerHTML = `<div class="card pad-lg" style="text-align:center;max-width:640px;margin:0 auto"><div class="score-ring">${score} / ${qs.length}</div><h2>${score >= qs.length * 0.8 ? 'すごい！' : 'がんばって！'}</h2>${queue ? `<p class="muted">${qs.length > queue.length ? 'Falsch Geschriebenes kam in dieser Runde gleich noch einmal dran.' : 'Alles auf Anhieb richtig geschrieben.'}</p>` : ''}<div class="row" style="justify-content:center"><a class="btn" href="#/ueben">Zur Übersicht</a>${queue ? roundEnd(more()) : '<button class="btn btn-primary" data-again>Nochmal</button>'}</div></div>`;
        if (!queue) stage.querySelector('[data-again]').onclick = () => App.render();
        bindRoundEnd(stage);
        return;
      }
      const cur = qs[i];
      if (mode === 'write') {
        stage.innerHTML = `<div class="card pad-lg"><div class="row between"><div><div class="small muted">Kanji ${i + 1} / ${qs.length} – schreibe:${W.isFirst(S.srs, cur.id) ? ' <span class="badge">erster Versuch</span>' : ''}</div><div class="ex-prompt">${App.meaningHtml(cur)}</div>
          <div class="muted" lang="ja">${esc((cur.kun || []).concat(cur.on || []).slice(0, 4).join('、'))}</div></div></div>
          <div class="kanji-stage" style="margin-top:14px"><div data-sol class="stroke-box" style="display:grid;place-items:center;min-height:240px;color:var(--muted)">?</div><div data-pad></div></div>
          <div class="row" style="margin-top:14px" data-btns><button class="btn btn-primary" data-show>${icon('eye')} Auflösen</button></div></div>`;
        const pad = App.stroke.pad(stage.querySelector('[data-pad]'), cur.char, { template: false, quiz: true });
        stage.querySelector('[data-show]').onclick = () => {
          pad.then((p) => p.reveal());
          App.stroke.animator(stage.querySelector('[data-sol]'), cur.char);
          stage.querySelector('[data-btns]').innerHTML = `<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch · wieder in ${ivlLabel(cur.id, 0, true)}</button><button class="btn" style="background:var(--${W.isFirst(S.srs, cur.id) ? 'ai' : 'matcha'}-soft)" data-r="2">✓ Richtig${W.isMarkedKnown(S.srs, cur.id) ? '' : ` · wieder in ${ivlLabel(cur.id, 2, true)}`}</button>${W.isFirst(S.srs, cur.id) ? `<button class="btn" style="background:var(--matcha-soft)" data-r="known" title="Als gelernt einstufen – wird beim Schreiben nicht mehr abgefragt">${icon('check')} Kann ich schon</button>` : ''}<a class="btn btn-ghost" href="${App.link(cur)}" target="_blank">Kanji öffnen</a>`;
        };
      } else {
        const correct = mode === 'reading' ? JP.kana(cur.w.jp) : App.meaning(cur).text;
        const distract = App.shuffle(mode === 'reading' ? words.filter((x) => JP.kana(x.w.jp) !== correct).map((x) => JP.kana(x.w.jp)) : pool.filter((x) => x !== cur).map((x) => App.meaning(x).text).filter(Boolean));
        const opts = App.shuffle([correct].concat(Array.from(new Set(distract)).slice(0, 3)));
        stage.innerHTML = `<div class="card pad-lg" style="max-width:720px;margin:0 auto;text-align:center"><div class="small muted">${i + 1} / ${qs.length}</div>
          <div style="font-family:${mode === 'reading' ? 'var(--font-jp)' : 'var(--font-kanji)'};font-size:${mode === 'reading' ? 54 : 110}px;line-height:1.3" lang="ja">${esc(mode === 'reading' ? JP.plain(cur.w.jp) : cur.char)}</div>
          <div class="grid cols-2" style="margin-top:14px">${opts.map((o) => `<button class="btn" style="min-height:64px;font-size:18px" data-o="${esc(o)}" ${mode === 'reading' ? 'lang="ja"' : ''}>${esc(o)}</button>`).join('')}</div><div data-fb style="margin-top:12px"></div></div>`;
        stage.querySelectorAll('[data-o]').forEach((b) => (b.onclick = async () => {
          const ok = b.dataset.o === correct;
          stage.querySelectorAll('[data-o]').forEach((x) => { x.disabled = true; if (x.dataset.o === correct) x.style.background = 'var(--matcha-soft)'; });
          if (!ok) b.style.background = 'var(--shu-soft)';
          const k = mode === 'reading' ? cur.k : cur;
          await App.grade(k.id, ok ? 2 : 0);
          if (ok) score++;
          stage.querySelector('[data-fb]').innerHTML = `${mode === 'reading' ? `<div lang="ja" style="font-size:20px">${JP.ruby(cur.w.jp)} – ${App.meaningHtml(cur.w)}</div>` : `<div lang="ja">${esc((cur.on || []).join('、'))} · ${esc((cur.kun || []).join('、'))}</div>`}<button class="btn btn-primary" style="margin-top:10px" data-n>Weiter ${icon('next')}</button>`;
          stage.querySelector('[data-n]').onclick = () => { i++; next(); };
        }));
        return;
      }
      stage.addEventListener('click', async function h(e) {
        const b = e.target.closest('[data-r]'); if (!b) return;
        stage.removeEventListener('click', h);
        const known = b.dataset.r === 'known'; // Einstufung beim ersten Versuch: gilt als gelernt
        const g = known ? 2 : +b.dataset.r; if (g) score++;
        await (known ? App.markWriteKnown(cur.id) : App.gradeWrite(cur.id, g));
        if (queue && !g) qs.splice(Math.min(i + 4, qs.length), 0, cur);
        i++; next();
      });
    };
    next();
  }
})(window.App);
