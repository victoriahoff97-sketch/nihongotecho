/* Nihongo Techō – Anwenden: Tagebuch & Smalltalk (Übersicht, Fragen, Zeitstrahl der Antworten) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const AL = App.aLogic;
  const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const MONTH_KANJI = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const MONTH_DE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const WEEKDAY_ABBR = ['So.', 'Mo.', 'Di.', 'Mi.', 'Do.', 'Fr.', 'Sa.']; // Index = getUTCDay()

  const isOwn = (p) => !p._seed && !p._pack;
  const answersOf = (promptId) => App.itemsOf('answer').filter((a) => a.promptId === promptId)
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
  const lvlBadge = (p) => (isOwn(p) && !p.level ? '<span class="badge">eigene</span>' : App.levelBadge(p));
  // Kurzname für Abzeichen: Grammatik-Titel nur bis zur Erklärung („〜たり〜たりする – …“)
  const itemName = (it) => (it.title ? it.title.split(' – ')[0] : '') || it.kanji || it.kana || it.jp || '';
  const notebookOf = (it) => App.filesFor({ itemId: it.id }).find((f) => App.fileKind(f) === 'notebook');

  // ---------- Zufallsfrage ----------
  App.randomPrompt = ({ level = '', lastId = '' } = {}) => AL.pickRandom(App.itemsOf('prompt'), App.itemsOf('answer'), { level, lastId, today: App.today() });

  // ---------- Neue Antwort ----------
  App.newAnswer = async (promptId) => {
    const a = await App.saveItem({ type: 'answer', promptId, date: App.today(), html: '', vocabIds: [], grammarIds: [], newIds: [] });
    App.go(App.link(a));
    return a;
  };

  // ---------- Frage anlegen / bearbeiten ----------
  App.editPrompt = (prompt) => {
    const isNew = !prompt;
    const it = prompt ? Object.assign({}, prompt) : { type: 'prompt', jp: '', de: '', level: '', hint: '' };
    const body = `<div class="form sec-apply">
      <div class="field"><label>Frage auf Japanisch</label><input class="input jp-in" name="jp" lang="ja" value="${esc(it.jp || '')}" placeholder="z. B. 好きなアニメは何ですか。" autofocus></div>
      <div class="field"><label>Deutsch</label><input class="input" name="de" value="${esc(it.de || '')}" placeholder="optional"></div>
      <div class="two"><div class="field"><label>Level</label><select class="input" name="level"><option value="">ohne Level</option>${LEVELS.map((l) => `<option ${it.level === l ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      <div class="field"><label>Grammatik-Tipp</label><input class="input jp-in" name="hint" lang="ja" value="${esc(it.hint || '')}" placeholder="optional, z. B. 〜たり〜たりする"></div></div></div>`;
    const md = App.modal({ title: isNew ? 'Eigene Frage' : 'Frage bearbeiten', body, foot: `<span class="grow"></span><button class="btn" data-no>Abbrechen</button><button class="btn btn-sec" data-ok>${icon('check')} Speichern</button>` });
    const el = (n) => md.el.querySelector(`[name=${n}]`);
    md.el.querySelector('[data-no]').onclick = md.close;
    md.el.querySelector('[data-ok]').onclick = async () => {
      const g = (n) => el(n).value.trim();
      if (!g('jp')) { App.toast('Bitte die Frage auf Japanisch eingeben'); el('jp').focus(); return; }
      Object.assign(it, { jp: g('jp'), de: g('de'), level: g('level'), hint: g('hint') });
      md.close();
      const saved = await App.saveItem(it);
      if (isNew) App.go(App.link(saved));
    };
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-action="new-prompt"]')) App.editPrompt(); });

  // ---------- Antwort-Karte (Zeitstrahl) ----------
  const answerCard = (a, { checkable = false, checked = false } = {}) => {
    const text = AL.plainText(a.html);
    const nb = notebookOf(a);
    const hasInk = !!(nb && App.store.inkCount.get(nb.id));
    const news = (a.newIds || []).map(App.item).filter(Boolean);
    const sentences = AL.countSentences(text);
    const badges = [
      news.length ? `<span class="badge ans-new" lang="ja">★ neu: ${esc(news.slice(0, 2).map(itemName).join(', '))}${news.length > 2 ? ` +${news.length - 2}` : ''}</span>` : '',
      sentences ? `<span class="badge">${sentences} ${sentences === 1 ? 'Satz' : 'Sätze'}</span>` : '',
      hasInk && !text ? `<span class="badge">${icon('pen')} Handschrift</span>` : '',
    ].join('');
    const inner = `<span class="tl-dot"></span>
      <div class="row between ans-head"><div class="row" style="gap:8px">${checkable ? `<input type="checkbox" data-check="${esc(a.id)}" ${checked ? 'checked' : ''}>` : ''}<b>${esc(App.fmtDate(a.date))}</b></div><div class="row" style="gap:4px">${badges}</div></div>
      ${text ? `<div class="ans-text" lang="ja">${text.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('')}</div>` : ''}
      ${hasInk ? `<canvas class="ans-preview" data-preview="${esc(nb.id)}"></canvas>` : ''}
      ${!text && !hasInk ? '<div class="muted small">noch leer</div>' : ''}`;
    return checkable
      ? `<label class="card ans-card checkable ${checked ? 'on' : ''}">${inner}</label>`
      : `<a class="card ans-card" href="${App.link(a)}">${inner}</a>`;
  };

  // Vorschauen erst zeichnen, wenn die Karte sichtbar wird; leere Blätter blenden die Canvas aus.
  const hydratePreviews = (root) => {
    const canvases = root.querySelectorAll('canvas[data-preview]');
    if (!canvases.length) return null;
    const draw = async (c) => { const ok = await App.ink.preview(c, c.dataset.preview); if (!ok) c.hidden = true; };
    if (!('IntersectionObserver' in window)) { canvases.forEach(draw); return null; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { io.unobserve(en.target); draw(en.target); } });
    }, { rootMargin: '200px' });
    canvases.forEach((c) => io.observe(c));
    App.onLeave(() => io.disconnect());
    return io;
  };
  App.hydrateAnswerPreviews = hydratePreviews;

  // Wochentags-Kürzel aus ISO-Datum per UTC-Split (keine Zeitzonen-Verschiebung).
  const weekdayAbbr = (iso) => {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso || '');
    return m ? WEEKDAY_ABBR[new Date(Date.UTC(+m[1], m[2] - 1, +m[3])).getUTCDay()] : '';
  };

  // ---------- Tagebuch: Kalenderblatt + Monatsliste ----------
  const diaryTab = (q) => {
    const validM = /^\d{4}-(0[1-9]|1[0-2])$/.test(q.m || '') ? q.m : App.today().slice(0, 7);
    const [y, mo] = validM.split('-').map(Number);
    const journals = App.itemsOf('journal');
    const answers = App.itemsOf('answer');
    const grid = AL.monthGrid(validM);
    const marks = AL.monthMarks(validM, journals, answers);
    const monthJournals = journals.filter((j) => (j.date || '').slice(0, 7) === validM)
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.created || 0) - (a.created || 0));
    const today = App.today();

    const dayCell = (cell) => {
      const mark = marks.days[cell.date];
      const cls = [
        'cal-day',
        cell.inMonth ? '' : 'out',
        mark && mark.journal ? 'journal' : '',
        mark && mark.answer ? 'answer' : '',
        cell.date === today ? 'today' : '',
      ].filter(Boolean).join(' ');
      return `<button type="button" class="${cls}" data-cal-day="${esc(cell.date)}" title="${esc(App.fmtDate(cell.date))}">${cell.day}</button>`;
    };

    const calendar = `<div class="card cal-sheet">
      <div class="cal-head"><button type="button" class="cal-arrow" data-q-m="${AL.shiftMonth(validM, -1)}" aria-label="Vorheriger Monat">‹</button>
        <div class="cal-title"><div class="cal-kanji">${MONTH_KANJI[mo - 1]}</div><div class="cal-sub">${MONTH_DE[mo - 1]} ${y}</div></div>
        <button type="button" class="cal-arrow" data-q-m="${AL.shiftMonth(validM, 1)}" aria-label="Nächster Monat">›</button></div>
      <div class="cal-perf"></div>
      <div class="cal-body">
        <div class="cal-grid cal-weekdays"><span class="cal-h">Mo</span><span class="cal-h">Di</span><span class="cal-h">Mi</span><span class="cal-h">Do</span><span class="cal-h">Fr</span><span class="cal-h">Sa</span><span class="cal-h cal-h-sun">So</span></div>
        <div class="cal-grid" data-cal-days>${grid.map((week) => week.map(dayCell).join('')).join('')}</div>
        <div class="cal-legend">■ Tagebuch · • Smalltalk · □ Heute</div>
        <div class="cal-foot"><b>${marks.journalCount}</b> Tagebuch · <b>${marks.answerCount}</b> Antworten diesen Monat</div>
      </div></div>`;

    const entryCard = (j) => {
      const text = AL.plainText(j.html);
      const nb = notebookOf(j);
      const hasInk = !!(nb && App.store.inkCount.get(nb.id));
      const news = (j.newIds || []).map(App.item).filter(Boolean);
      const grammars = (j.grammarIds || []).map(App.item).filter(Boolean);
      const badges = [
        news.length ? `<span class="badge ans-new" lang="ja">★ ${news.length} neu</span>` : '',
        grammars.length ? `<span class="badge sec ${App.SECTIONS.grammar.cls}" lang="ja">${esc(itemName(grammars[0]))}</span>` : '',
      ].join('');
      const day = +(j.date || '').split('-')[2];
      return `<a class="card cal-entry" href="${App.link(j)}" data-cal-entry="${esc(j.date || '')}">
        <div class="cal-entry-date"><div class="cal-entry-day">${day || ''}</div><div class="small muted">${weekdayAbbr(j.date)}</div></div>
        <div class="cal-entry-body">
          ${j.title ? `<div class="cal-entry-title" lang="ja">${esc(j.title)}</div>` : ''}
          ${text ? `<div class="cal-entry-text" lang="ja">${text.split(/\n+/).map((l) => l.trim()).filter(Boolean).slice(0, 2).map((l) => `<p>${esc(l)}</p>`).join('')}</div>`
            : hasInk ? `<canvas class="ans-preview cal-entry-preview" data-preview="${esc(nb.id)}"></canvas>` : '<div class="muted small">noch leer</div>'}
          ${badges ? `<div class="row" style="gap:4px;margin-top:6px">${badges}</div>` : ''}
        </div></a>`;
    };

    const list = monthJournals.length
      ? `<div class="cal-entries">${monthJournals.map(entryCard).join('')}</div>`
      : `<div class="empty-state"><div class="big">日記</div><h3>Noch kein Eintrag in diesem Monat</h3><p>Schreib deinen ersten Eintrag – mit Stift oder getippt.</p></div>`;

    return `<div class="cal-layout">${calendar}
      <div><div class="row between" style="margin-bottom:10px"><b>Einträge im ${MONTH_DE[mo - 1]}</b><button type="button" class="btn btn-sec" data-cal-today>${icon('plus')} Heute schreiben</button></div>${list}</div></div>`;
  };

  // Kalender/Liste verdrahten. Tagesklick: ein Eintrag → öffnen; mehrere → Liste zum Tag scrollen und kurz hervorheben;
  // keiner (auch wenn nur Smalltalk-Antworten) → neuen Eintrag anlegen. „Heute schreiben“ öffnet den neuesten von heute.
  const mountDiary = (view, q) => {
    const journals = App.itemsOf('journal');
    const byDate = {};
    journals.forEach((j) => { if (!j.date) return; (byDate[j.date] = byDate[j.date] || []).push(j); });
    const latestOf = (date) => (byDate[date] || []).slice().sort((a, b) => (b.created || 0) - (a.created || 0))[0];
    const openOrNew = (date) => { const j = latestOf(date); if (j) App.go(App.link(j)); else App.newJournal(date); };
    const showDay = (date) => {
      const cards = view.querySelectorAll(`[data-cal-entry="${date}"]`);
      if (!cards.length) return false;
      cards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      cards.forEach((c) => { c.classList.remove('cal-hl'); void c.offsetWidth; c.classList.add('cal-hl'); });
      return true;
    };
    const days = view.querySelector('[data-cal-days]');
    if (days) days.addEventListener('click', (e) => {
      const d = e.target.closest('[data-cal-day]');
      if (!d) return;
      const date = d.dataset.calDay, n = (byDate[date] || []).length;
      if (n === 1) App.go(App.link(byDate[date][0]));
      else if (!n) App.newJournal(date);
      // Tag aus dem Nachbarmonat: erst dorthin blättern, dann hervorheben
      else if (!showDay(date)) App.setQuery({ m: date.slice(0, 7), day: date });
    });
    const todayBtn = view.querySelector('[data-cal-today]');
    if (todayBtn) todayBtn.onclick = () => openOrNew(App.today());
    hydratePreviews(view);
    if (q.day) requestAnimationFrame(() => showDay(q.day));
  };

  // ---------- Übersicht ----------
  const smalltalkTab = (q) => {
    const all = App.itemsOf('prompt');
    const visible = all.filter((p) => !p.hidden);
    const hiddenN = all.length - visible.length;
    const lvl = q.lvl || '';
    const list = AL.filterPrompts(all, lvl);
    const stats = AL.answerStats(App.itemsOf('answer'));
    const levels = LEVELS.filter((l) => visible.some((p) => p.level === l));
    const ownN = visible.filter(isOwn).length;
    const chip = (val, label, n) => `<button class="chip ${lvl === val ? 'on' : ''}" data-q-lvl="${val}">${label} <span class="small" style="opacity:.75">${n}</span></button>`;
    const card = (p) => {
      const st = stats[p.id];
      return `<a class="card prompt-card ${isOwn(p) ? 'own' : ''}" href="${App.link(p)}">
        <div class="row between">${lvlBadge(p) || '<span></span>'}${st ? `<span class="small prompt-count">✓ ${st.count}×</span>` : '<span class="small muted">neu</span>'}</div>
        <div class="prompt-jp" lang="ja">${esc(p.jp)}</div>
        <div class="small muted">${st ? 'zuletzt ' + esc(App.fmtDate(st.last)) : 'noch keine Antwort'}</div></a>`;
    };
    const emptyGrid = lvl === 'own'
      ? `<div class="empty-state"><div class="big">問</div><h3>Noch keine eigenen Fragen</h3><p>Leg eigene Fragen an – zu Themen, über die du gern sprichst.</p><button class="btn btn-sec" data-action="new-prompt">${icon('plus')} Eigene Frage</button></div>`
      : '<div class="empty-state"><div class="big">問</div><h3>Keine Fragen in diesem Filter</h3></div>';
    return `<div class="random-card" data-random></div>
      <div class="row between" style="margin:22px 0 10px"><b>Alle Fragen</b>
        <div class="chips">${chip('', 'Alle', visible.length)}${levels.map((l) => chip(l, l, visible.filter((p) => p.level === l).length)).join('')}${chip('own', 'Eigene', ownN)}</div></div>
      ${list.length ? `<div class="prompt-grid">${list.map(card).join('')}</div>` : emptyGrid}
      ${hiddenN ? `<div style="margin-top:14px"><button class="btn btn-ghost btn-sm" data-hidden-list>${icon('eye')} Ausgeblendete (${hiddenN})</button></div>` : ''}`;
  };

  // Zufallskarte in-place: „Andere Frage“ würfelt mit lastId neu, ohne Navigation.
  const mountRandom = (host, level) => {
    let cur = App.randomPrompt({ level });
    const stats = AL.answerStats(App.itemsOf('answer'));
    const draw = () => {
      if (!cur) {
        host.innerHTML = `<div class="card random-card-in"><div class="random-label">🎲 ZUFÄLLIGE FRAGE</div>
          <div class="random-jp muted" style="font-size:18px">Keine Frage in diesem Filter</div>
          <a class="btn btn-sm" href="#/anwenden?tab=smalltalk">Alle anzeigen</a></div>`;
        return;
      }
      const st = stats[cur.id];
      host.innerHTML = `<div class="card random-card-in"><div class="row between"><span class="random-label">🎲 ZUFÄLLIGE FRAGE</span>${lvlBadge(cur)}</div>
        <a class="random-jp" lang="ja" href="${App.link(cur)}">${esc(cur.jp)}</a>
        <div class="small muted" style="margin-bottom:14px">${st ? `${st.count}× beantwortet · zuletzt ${esc(App.fmtDate(st.last))}` : 'noch nie beantwortet'}</div>
        <div class="row"><button class="btn btn-sec" data-answer="${esc(cur.id)}">${icon('pen')} Jetzt beantworten</button><button class="btn" data-reroll>${icon('shuffle')} Andere Frage</button></div></div>`;
    };
    host.addEventListener('click', (e) => {
      if (e.target.closest('[data-reroll]')) { cur = App.randomPrompt({ level, lastId: cur && cur.id }); draw(); }
      const an = e.target.closest('[data-answer]');
      if (an) App.newAnswer(an.dataset.answer);
    });
    draw();
  };

  const hiddenDialog = () => {
    const rows = () => App.itemsOf('prompt').filter((p) => p.hidden);
    const md = App.modal({ title: 'Ausgeblendete Fragen', body: '<div class="stack" data-rows></div>', foot: '<span class="grow"></span><button class="btn" data-no>Schließen</button>', onClose: () => App.render(true) });
    const box = md.el.querySelector('[data-rows]');
    const draw = () => {
      const hs = rows();
      box.innerHTML = hs.map((p) => `<div class="row between" style="gap:10px"><div class="row" style="gap:8px">${lvlBadge(p)}<span lang="ja">${esc(p.jp)}</span></div>
        <button class="btn btn-sm" data-show="${esc(p.id)}">${icon('eye')} Einblenden</button></div>`).join('') || '<div class="muted">Keine ausgeblendeten Fragen.</div>';
    };
    box.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-show]');
      if (!b) return;
      const p = App.item(b.dataset.show);
      if (p) { p.hidden = false; await App.saveItem(p, { silent: true }); }
      draw();
    });
    md.el.querySelector('[data-no]').onclick = md.close;
    draw();
  };

  App.route('/anwenden', (view, p, q) => {
    const sec = App.SECTIONS.apply;
    const tab = q.tab === 'smalltalk' ? 'smalltalk' : 'diary';
    const actions = tab === 'smalltalk' ? `<button class="btn" data-action="new-prompt">${icon('plus')} Eigene Frage</button>` : '';
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Schreib, sprich, wiederhol – mit dem, was du schon kannst.', actions)}
      <div class="tabs">${[['diary', '<span class="tab-kanji">日記</span> Tagebuch'], ['smalltalk', '<span class="tab-kanji">会話</span> Smalltalk']].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-q-tab="${k === 'diary' ? '' : k}">${l}</button>`).join('')}</div>
      <div data-body>${tab === 'smalltalk' ? smalltalkTab(q) : diaryTab(q)}</div></div>`;
    if (tab !== 'smalltalk') { mountDiary(view, q); return; }
    mountRandom(view.querySelector('[data-random]'), q.lvl || '');
    const hl = view.querySelector('[data-hidden-list]');
    if (hl) hl.onclick = hiddenDialog;
  });

  // ---------- Vergleich zweier Antworten ----------
  // Begriffe längster zuerst, nicht überlappend im Rohtext markieren, dann escapte Segmente zusammensetzen.
  const markTerms = (line, terms) => {
    const ranges = [];
    terms.forEach((t) => {
      if (!t) return;
      let idx = 0;
      for (;;) {
        const i = line.indexOf(t, idx);
        if (i === -1) break;
        const e = i + t.length;
        if (ranges.every((r) => e <= r.start || i >= r.end)) ranges.push({ start: i, end: e });
        idx = i + 1;
      }
    });
    ranges.sort((a, b) => a.start - b.start);
    let out = '', pos = 0;
    ranges.forEach((r) => { out += esc(line.slice(pos, r.start)); out += `<mark>${esc(line.slice(r.start, r.end))}</mark>`; pos = r.end; });
    return out + esc(line.slice(pos));
  };
  const linesOf = (text) => text.split(/\n+/).map((l) => l.trim()).filter(Boolean);

  const renderCompare = (older, newer) => {
    const oldText = AL.plainText(older.html);
    const newText = AL.plainText(newer.html);
    const diff = AL.diffAnswers(older, newer);
    const newG = diff.newGrammar.map(App.item).filter(Boolean);
    const newV = diff.newVocab.map(App.item).filter(Boolean);
    const terms = Array.from(new Set(newG.concat(newV).reduce((acc, it) => acc.concat(AL.highlightTerms(it)), [])))
      .sort((a, b) => b.length - a.length);
    const col = (a, isNewer) => {
      const lines = linesOf(isNewer ? newText : oldText);
      const nb = notebookOf(a);
      const hasInk = !!(nb && App.store.inkCount.get(nb.id));
      return `<div class="card cmp-col ${isNewer ? 'cmp-newer' : ''}">
        <div class="cmp-date">${esc(App.fmtDate(a.date))}</div>
        ${lines.length ? `<div class="ans-text cmp-text" lang="ja">${lines.map((l) => `<p>${isNewer ? markTerms(l, terms) : esc(l)}</p>`).join('')}</div>` : ''}
        ${hasInk ? `<canvas class="ans-preview" data-preview="${esc(nb.id)}"></canvas>` : ''}
        ${!lines.length && !hasInk ? '<div class="muted small">noch leer</div>' : ''}</div>`;
    };
    const sOld = AL.countSentences(oldText), sNew = AL.countSentences(newText);
    const chip = (it) => `<a class="badge sec ${App.SECTIONS[it.type].cls}" href="${App.link(it)}" lang="ja">${esc(itemName(it))}</a>`;
    const hasNew = newG.length || newV.length;
    return `<div data-cmp>
      <div class="row between" style="margin-bottom:10px"><div class="section-title" style="margin:0">Vergleich</div>
        <button type="button" class="btn btn-ghost btn-sm" data-cmp-back>${icon('list')} Zurück zum Verlauf</button></div>
      <div class="cmp-grid">${col(older, false)}<div class="cmp-arrow">→</div>${col(newer, true)}</div>
      <div class="card cmp-stats">
        <div class="cmp-stat"><div class="cmp-num">${sOld} → ${sNew}</div><div class="small muted">Sätze</div></div>
        ${hasNew ? `<div class="cmp-stat"><b class="small">Neue Grammatik</b><div class="row" style="gap:6px;flex-wrap:wrap">${newG.length ? newG.map(chip).join('') : '<span class="small muted">–</span>'}</div></div>
        <div class="cmp-stat"><b class="small">Neue Wörter</b><div class="row" style="gap:6px;flex-wrap:wrap">${newV.length ? newV.map(chip).join('') : '<span class="small muted">–</span>'}</div></div>`
        : '<div class="cmp-stat small muted">Keine neuen Verknüpfungen – vergleiche den Text</div>'}
      </div></div>`;
  };

  // ---------- Frage-Seite mit Zeitstrahl / Vergleich ----------
  App.route('/anwenden/frage/:id', (view, params, q) => {
    const p = App.item(params.id);
    if (!p || p.type !== 'prompt') { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3><a class="btn" href="#/anwenden?tab=smalltalk">Zum Smalltalk</a></div>'; return; }
    const sec = App.SECTIONS.prompt;
    const answers = answersOf(p.id);
    let checking = false;
    const picked = new Set();

    // ?cmp=a,b prüfen: genau zwei verschiedene, existierende Antworten dieser Frage – sonst zurück zum Verlauf.
    const cmpIds = (q.cmp || '').split(',').map((s) => s.trim()).filter(Boolean);
    let cmpPair = null;
    if (cmpIds.length) {
      if (cmpIds.length === 2 && cmpIds[0] !== cmpIds[1]) {
        const found = cmpIds.map((id) => answers.find((a) => a.id === id));
        if (found[0] && found[1]) cmpPair = found;
      }
      if (!cmpPair) { App.setQuery({ cmp: '' }); return; }
    }
    const ordered = cmpPair && cmpPair.slice().sort((x, y) => (x.date || '').localeCompare(y.date || '') || (x.created || 0) - (y.created || 0));

    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="crumbs"><a href="#/anwenden">Anwenden</a> › <a href="#/anwenden?tab=smalltalk">Smalltalk</a></div>
      <div class="card prompt-head"><div class="row between" style="align-items:flex-start;flex-wrap:nowrap">
        <div><div class="row" style="gap:8px;margin-bottom:4px">${lvlBadge(p)}${p.hidden ? '<span class="badge">ausgeblendet</span>' : ''}</div><h1 lang="ja">${JP.ruby(p.jp || '')}</h1></div>
        <details class="apply-menu"><summary class="icon-btn" title="Menü">${icon('menu')}</summary><div class="apply-menu-pop card">
          <button class="btn btn-ghost btn-sm" data-p-edit>${icon('edit')} Bearbeiten</button>
          <button class="btn btn-ghost btn-sm" data-p-hide>${icon('eye')} ${p.hidden ? 'Einblenden' : 'Ausblenden'}</button>
          ${!p._seed ? `<button class="btn btn-ghost btn-sm btn-danger" data-p-del>${icon('trash')} Löschen</button>` : ''}</div></details></div>
        ${p.de ? `<details class="prompt-more"><summary>Deutsch</summary><div>${esc(p.de)}</div></details>` : ''}
        ${p.hint ? `<details class="prompt-more"><summary>Grammatik-Tipp</summary><div lang="ja">${esc(p.hint)}</div></details>` : ''}
        <div class="row" style="margin-top:14px"><button class="btn btn-sec" data-p-new>${icon('plus')} Neue Antwort</button><button class="btn" data-p-cmp>${icon('list')} Vergleichen</button><button class="btn" data-p-next>${icon('shuffle')} Nächste zufällig</button></div></div>
      ${ordered ? renderCompare(ordered[0], ordered[1]) : `<div class="section-title">Verlauf <span class="badge">${answers.length}</span></div><div data-tl></div>`}</div>`;

    let drawTl = null;
    if (ordered) {
      hydratePreviews(view.querySelector('[data-cmp]'));
      view.querySelector('[data-cmp-back]').onclick = () => App.setQuery({ cmp: '' });
    } else {
      const tl = view.querySelector('[data-tl]');
      let io = null; // Beobachter der aktuellen Vorschauen; beim Neuzeichnen ersetzt
      drawTl = () => {
        if (io) io.disconnect();
        tl.innerHTML = answers.length
          ? `${checking ? '<div class="small muted" style="margin-bottom:10px">Zwei Antworten zum Vergleichen auswählen.</div>' : ''}<div class="answer-tl">${answers.map((a) => answerCard(a, { checkable: checking, checked: picked.has(a.id) })).join('')}</div>`
          : `<div class="empty-state"><div class="big">答</div><h3>Noch keine Antwort</h3><p>Beantworte die Frage – mit dem Stift oder getippt. Später siehst du hier, wie deine Antworten wachsen.</p></div>`;
        io = hydratePreviews(tl);
      };
      drawTl();
      tl.addEventListener('change', (e) => {
        const c = e.target.closest('[data-check]');
        if (!c) return;
        if (c.checked) picked.add(c.dataset.check); else picked.delete(c.dataset.check);
        if (picked.size === 2) { App.setQuery({ cmp: Array.from(picked).join(',') }); return; }
        drawTl();
      });
    }

    const menu = view.querySelector('.apply-menu');
    const closeMenu = (e) => { if (menu.open && !menu.contains(e.target)) menu.open = false; };
    document.addEventListener('click', closeMenu);
    App.onLeave(() => document.removeEventListener('click', closeMenu));

    view.querySelector('[data-p-new]').onclick = () => App.newAnswer(p.id);
    view.querySelector('[data-p-next]').onclick = () => {
      const n = App.randomPrompt({ lastId: p.id });
      if (n && n.id !== p.id) App.go(App.link(n)); else App.toast('Keine weitere Frage vorhanden');
    };
    view.querySelector('[data-p-cmp]').onclick = () => {
      if (ordered) { App.setQuery({ cmp: '' }); return; }
      if (answers.length < 2) { App.toast('Für einen Vergleich brauchst du zwei Antworten'); return; }
      if (answers.length === 2) { App.setQuery({ cmp: answers.map((a) => a.id).join(',') }); return; }
      checking = !checking; picked.clear(); drawTl();
    };
    view.querySelector('[data-p-edit]').onclick = () => { menu.open = false; App.editPrompt(p); };
    view.querySelector('[data-p-hide]').onclick = async () => {
      menu.open = false;
      const hide = !p.hidden;
      p.hidden = hide;
      await App.saveItem(p);
      App.toast(hide ? 'Frage ausgeblendet' : 'Frage wieder eingeblendet');
    };
    const del = view.querySelector('[data-p-del]');
    if (del) del.onclick = async () => {
      menu.open = false;
      const msg = answers.length ? `Frage und ${answers.length} ${answers.length === 1 ? 'Antwort' : 'Antworten'} löschen?` : `„${p.jp}“ löschen?`;
      if (!(await App.confirm(msg))) return;
      for (const a of answers) await App.deleteItem(a.id);
      await App.deleteItem(p.id);
      App.go('#/anwenden?tab=smalltalk');
    };
  });

  // ---------- Neuer Tagebucheintrag ----------
  App.newJournal = async (date) => {
    const j = await App.saveItem({ type: 'journal', date: date || App.today(), title: '', html: '', vocabIds: [], grammarIds: [], newIds: [] });
    App.go(App.link(j));
    return j;
  };

  // ---------- Schreibbereich: Antwort / Tagebucheintrag ----------
  const LINK_KEYS = { vocab: 'vocabIds', grammar: 'grammarIds' };
  const linkedIds = (item) => (item.grammarIds || []).concat(item.vocabIds || []);
  const uniq = (a) => Array.from(new Set(a));
  // Wochentag aus ISO-Datum per Split (keine Zeitzonen-Verschiebung)
  const weekday = (iso) => {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(iso || '');
    return m ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3])).toLocaleDateString('de-DE', { weekday: 'long', timeZone: 'UTC' }) : '';
  };

  // Vokabel/Grammatik mit Antwort/Eintrag verknüpfen; isNew = hier neu angelegt → zusätzlich unter „Neu“
  const linkInto = async (item, it, isNew) => {
    const k = LINK_KEYS[it.type];
    if (!k) return;
    item[k] = uniq((item[k] || []).concat(it.id));
    if (isNew) item.newIds = uniq((item.newIds || []).concat(it.id));
    await App.saveItem(item, { silent: true });
  };

  const renderWrite = (view, item, q) => {
    const isAnswer = item.type === 'answer';
    const prompt = isAnswer ? App.item(item.promptId) : null;
    const sec = App.SECTIONS[item.type];
    const tab = q.tab === 'typed' ? 'typed' : 'hand';
    const nb = notebookOf(item);
    const hasInk = !!(nb && App.store.inkCount.get(nb.id));
    const hasText = !!AL.plainText(item.html);
    const back = isAnswer ? (prompt ? App.link(prompt) : '#/anwenden?tab=smalltalk') : '#/anwenden?m=' + String(item.date || App.today()).slice(0, 7);
    const dateField = `<label class="row small muted write-date-l">${isAnswer ? 'Antwort vom' : 'Datum'} <input class="input write-date" type="date" data-w-date value="${esc(item.date || '')}"></label>`;
    const menu = `<details class="apply-menu"><summary class="icon-btn" title="Menü">${icon('menu')}</summary><div class="apply-menu-pop card">
      <button class="btn btn-ghost btn-sm btn-danger" data-w-del>${icon('trash')} Löschen</button></div></details>`;
    let head;
    if (isAnswer) {
      const earlier = prompt ? answersOf(prompt.id).filter((a) => a.id !== item.id).length : 0;
      head = `<div class="crumbs"><a href="#/anwenden">Anwenden</a> › <a href="#/anwenden?tab=smalltalk">Smalltalk</a>${prompt ? ` › <a href="${App.link(prompt)}">Frage</a>` : ''}</div>
        <div class="card write-head"><div class="row between" style="align-items:flex-start;flex-wrap:nowrap">
          <div class="grow"><div class="row" style="gap:8px">${prompt ? lvlBadge(prompt) : ''}${dateField}</div>
            <h1 lang="ja">${prompt ? JP.ruby(prompt.jp || '') : '<span class="muted">Frage nicht mehr vorhanden</span>'}</h1></div>${menu}</div>
          ${prompt && prompt.de ? `<details class="prompt-more"><summary>Deutsch</summary><div>${esc(prompt.de)}</div></details>` : ''}
          ${prompt && prompt.hint ? `<details class="prompt-more"><summary>Grammatik-Tipp</summary><div lang="ja">${esc(prompt.hint)}</div></details>` : ''}
          ${prompt ? `<a class="small write-earlier" href="${App.link(prompt)}">${earlier ? `${earlier} frühere ${earlier === 1 ? 'Antwort' : 'Antworten'}` : 'Zur Frage'} →</a>` : ''}</div>`;
    } else {
      head = `<div class="crumbs"><a href="#/anwenden">Anwenden</a> › <a href="${back}">Tagebuch</a></div>
        <div class="card write-head"><div class="row between" style="align-items:flex-start;flex-wrap:nowrap">
          <div class="grow"><div class="write-day" lang="ja">${esc(App.uLogic.jpDate(item.date))}</div><div class="small muted">${esc(weekday(item.date))}</div></div>${menu}</div>
          <div class="row write-meta">${dateField}<input class="input grow" data-w-title value="${esc(item.title || '')}" placeholder="Titel (optional)" lang="ja"></div></div>`;
    }
    const dot = (on, t) => (on ? `<span class="dot-mark" title="${t}"></span>` : '');
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${head}
      <div class="write-split"><div>
        <div class="tabs">${[['hand', `${icon('pen')} Handschrift${dot(hasInk, 'enthält Handschrift')}`], ['typed', `${icon('edit')} Getippt${dot(hasText, 'enthält Text')}`]].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-q-tab="${k === 'hand' ? '' : k}">${l}</button>`).join('')}</div>
        <div data-body></div></div>
        <aside class="card write-side" data-side></aside></div></div>`;

    // Seitenleiste „In dieser Antwort / In diesem Eintrag“: Neu und Angewendet, je Grammatik vor Vokabeln
    const side = view.querySelector('[data-side]');
    const drawSide = () => {
      const news = new Set(item.newIds || []);
      const all = linkedIds(item).map(App.item).filter(Boolean)
        .sort((a, b) => (a.type === b.type ? 0 : a.type === 'grammar' ? -1 : 1));
      const chip = (it) => `<div class="badge sec w-chip ${App.SECTIONS[it.type].cls}"><a href="${App.link(it)}" lang="ja">${esc(itemName(it))}</a>${it.type === 'vocab' ? `<span class="w-de">${esc(App.itemSub(it) || '')}</span>` : ''}<button class="w-x" data-w-unlink="${esc(it.id)}" title="Verknüpfung entfernen">×</button></div>`;
      const group = (label, list, cls) => (list.length ? `<div class="w-sec ${cls}">${label}</div><div class="w-chips">${list.map(chip).join('')}</div>` : '');
      const nNew = all.filter((it) => news.has(it.id)), nUsed = all.filter((it) => !news.has(it.id));
      side.innerHTML = `<h3>${isAnswer ? 'In dieser Antwort' : 'In diesem Eintrag'}</h3>
        ${all.length ? group('NEU', nNew, 'new') + group('ANGEWENDET', nUsed, '') : '<div class="small muted" style="margin:6px 0">Noch nichts verknüpft. Neue Wörter mit „+ Vokabel“ / „+ Grammatik“ anlegen – oder ein geschriebenes Wort mit „Erkennen“ einkreisen und verknüpfen.</div>'}
        <button class="btn btn-ghost btn-sm w-pick" data-w-pick>${icon('link')} Vorhandenes verknüpfen</button>`;
    };
    drawSide();
    // Verknüpfung lösen: aus dem Eintrag nehmen; fromSheet = die Markierung auf dem Blatt ist schon weg
    let inkApi = null;
    const sheetIds = () => App.filesFor({ itemId: item.id }).filter((f) => App.fileKind(f) === 'notebook').map((f) => f.id);
    const dropMarks = (id) => (inkApi ? inkApi.dropLinks(id) : Promise.all(sheetIds().map((fid) => App.ink.dropLinks(fid, id))));
    const unlink = async (id, fromSheet) => {
      ['vocabIds', 'grammarIds', 'newIds'].forEach((k) => { item[k] = (item[k] || []).filter((v) => v !== id); });
      await App.saveItem(item, { silent: true });
      if (!fromSheet) await dropMarks(id);
      drawSide();
    };
    side.addEventListener('click', async (e) => {
      const x = e.target.closest('[data-w-unlink]');
      if (x) { await unlink(x.dataset.wUnlink); return; }
      if (!e.target.closest('[data-w-pick]')) return;
      const before = new Set(linkedIds(item));
      const ids = await App.pickItems({ title: 'Vorhandenes verknüpfen', types: ['grammar', 'vocab'], selected: Array.from(before) });
      if (!ids) return;
      const keep = new Set(ids);
      // Abgewählte entfernen, neu gewählte als „angewendet“ übernehmen
      ['vocabIds', 'grammarIds', 'newIds'].forEach((k) => { item[k] = (item[k] || []).filter((v) => keep.has(v)); });
      for (const id of before) if (!keep.has(id)) await dropMarks(id);
      ids.filter((id) => !before.has(id)).forEach((id) => {
        const it = App.item(id), k = it && LINK_KEYS[it.type];
        if (k) item[k] = uniq(item[k].concat(id));
      });
      await App.saveItem(item, { silent: true });
      drawSide();
    });

    // Kopf: Menü, Datum, Titel
    const menuEl = view.querySelector('.apply-menu');
    const closeMenu = (e) => { if (menuEl.open && !menuEl.contains(e.target)) menuEl.open = false; };
    document.addEventListener('click', closeMenu);
    App.onLeave(() => document.removeEventListener('click', closeMenu));
    // Löschen: erst wegnavigieren (Schreibfläche sichert und baut ab), dann im Aufräumen unten löschen –
    // so schreibt kein späteres Speichern verwaiste Tinte zurück.
    let deleteOnLeave = false;
    view.querySelector('[data-w-del]').onclick = async () => {
      menuEl.open = false;
      if (!(await App.confirm(isAnswer ? 'Diese Antwort löschen (mit Handschrift)?' : 'Diesen Tagebucheintrag löschen (mit Handschrift)?'))) return;
      deleteOnLeave = true;
      App.go(back);
    };
    // Beim Verlassen: leere Antwort/leeren Eintrag (kein Text, kein Titel, nichts verknüpft, keine Tinte) samt Blatt entfernen.
    // Verzögert, damit destroy()/flushAll der Schreibfläche inkCount vorher aktualisiert; Neuzeichnen derselben Seite zählt nicht.
    let typedEd = null, titleInput = null;
    App.onLeave(() => setTimeout(async () => {
      if (App.parseHash().path === App.link(item).slice(1)) return;
      const cur = App.item(item.id);
      if (!cur) return;
      const sheet = notebookOf(cur);
      const empty = !AL.plainText(cur.html) && !(typedEd && typedEd.textContent.trim())
        && !linkedIds(cur).length && !(cur.title || '').trim() && !(titleInput && titleInput.value.trim())
        && !(sheet && App.store.inkCount.get(sheet.id));
      if (deleteOnLeave || empty) await App.deleteItem(cur.id);
    }, 0));
    view.querySelector('[data-w-date]').onchange = async (e) => {
      // Leeres/ungültiges Datum: alten Wert wiederherstellen
      if (!/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) { e.target.value = item.date || ''; return; }
      item.date = e.target.value;
      await App.saveItem(item, { silent: true });
      // Blattname folgt dem Datum
      const sheet = notebookOf(item);
      if (sheet) { sheet.name = (isAnswer ? 'Antwort ' : 'Tagebuch ') + App.uLogic.jpDate(item.date); await App.updateFile(sheet); }
      App.render(true);
    };
    const titleEl = titleInput = view.querySelector('[data-w-title]');
    if (titleEl) titleEl.onchange = async () => { if (!App.item(item.id)) return; item.title = titleEl.value.trim(); await App.saveItem(item, { silent: true }); };

    // Schreibfläche
    const body = view.querySelector('[data-body]');
    const source = isAnswer ? 'Smalltalk' : 'Tagebuch';
    const newDefaults = { source, tags: ['anwenden'] };
    // Lernstand neuer Vokabeln kommt aus dem Vokabel-Dialog (Standard „In den Lernstapel“, wie im Unterricht)
    const onLinked = async (it, isNew) => {
      await linkInto(item, it, isNew);
      drawSide();
    };
    const linkLabel = isAnswer ? 'mit dieser Antwort' : 'mit diesem Eintrag';
    if (tab === 'hand') {
      inkApi = App.inkArea(body, {
        sheets: App.filesFor({ itemId: item.id }).filter((f) => App.fileKind(f) === 'notebook'),
        activeId: nb && nb.id, // dasselbe Blatt, das Karten/Vorschau zeigen
        multiSheet: false,
        sheetMeta: (paper) => ({ itemId: item.id, role: item.type, section: 'apply', paper, name: (isAnswer ? 'Antwort ' : 'Tagebuch ') + App.uLogic.jpDate(item.date) }),
        onSelect: () => App.render(true),
        // Handschriftliche Vokabel: Fundort als Kontext (ohne Satz – der steht nur auf dem Blatt)
        newDefaults: (type) => (type === 'vocab'
          ? Object.assign({}, newDefaults, { contexts: [{ itemId: item.id, label: source + ' · ' + App.fmtDate(item.date), date: item.date, text: '' }] })
          : newDefaults),
        onLinked, onUnlinked: (id) => unlink(id, true),
      });
    } else {
      typedEd = App.typedArea(body, {
        html: item.html, onSave: async (h) => { if (!App.item(item.id)) return; /* inzwischen gelöscht: nicht wiederbeleben */ item.html = h; await App.saveItem(item, { silent: true }); },
        newDefaults, onLinked, linkLabel, linkRefs: true,
        contextInfo: () => ({ itemId: item.id, label: source + ' · ' + App.fmtDate(item.date), date: item.date }),
        placeholder: 'Auf Japanisch antworten … neues Wort markieren → „＋ Vokabel“',
      });
    }
  };

  const writeRoute = (type) => (view, params, q) => {
    const it = App.item(params.id);
    if (!it || it.type !== type) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3><a class="btn" href="#/anwenden">Zu Anwenden</a></div>'; return; }
    renderWrite(view, it, q);
  };
  App.route('/anwenden/antwort/:id', writeRoute('answer'));
  App.route('/anwenden/eintrag/:id', writeRoute('journal'));
})(window.App);
