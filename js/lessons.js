/* Nihongo Techō – Unterricht (VHS-Kurs): Stunden, Mitschrift, Material, Hausaufgaben, Zusammenfassung */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;
  const KEYS = { grammar: 'grammarIds', vocab: 'vocabIds', kanji: 'kanjiIds', phrase: 'phraseIds' };

  const UL = App.uLogic;
  const sessions = () => App.itemsOf('session').sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.number || 0) - (a.number || 0));
  const sessionTitle = (s) => s.title || UL.jpDate(s.date) || 'Ohne Datum';
  const bookRef = (s) => s.bookSource ? `${s.bookSource}${s.bookLesson !== '' && s.bookLesson != null ? ' L' + s.bookLesson : ''}` : '';

  // ---------- Stunde anlegen / bearbeiten ----------
  App.editSession = (s) => {
    const isNew = !s;
    const all = App.itemsOf('session');
    let it;
    if (s) it = Object.assign({}, s);
    else {
      const course = UL.suggestCourse(all), date = App.today();
      it = { type: 'session', course, date, title: UL.jpDate(date), titleAuto: true, topic: '', number: UL.nextNumber(all, course), bookSource: 'Genki I', bookLesson: '', grammarIds: [], vocabIds: [], kanjiIds: [], phraseIds: [], notesHtml: '' };
    }
    const courses = Array.from(new Set(all.map((x) => String(x.course || '').trim()).filter(Boolean)));
    const body = `<div class="form sec-session">
      <div class="field"><label>Kurs</label><input class="input" name="course" list="course-list" value="${esc(it.course || '')}"><datalist id="course-list">${courses.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></div>
      <div class="two"><div class="field"><label>Datum</label><input class="input" type="date" name="date" value="${esc(it.date || '')}"></div>
      <div class="field"><label>Titel</label><input class="input" name="title" lang="ja" value="${esc(it.title || '')}"></div></div>
      <div class="field"><label>Thema</label><input class="input" name="topic" value="${esc(it.topic || '')}" placeholder="optional, z. B. Uhrzeit & Tagesablauf"></div>
      <div class="three"><div class="field"><label>Nr.</label><input class="input" type="number" name="number" value="${esc(it.number || '')}" style="max-width:90px"></div>
      <div class="field"><label>Lehrbuch</label><select class="input" name="bookSource">${App.sourceOptions(it.bookSource)}</select></div>
      <div class="field"><label>Lektion im Lehrbuch</label><input class="input" name="bookLesson" value="${esc(it.bookLesson ?? '')}" placeholder="z. B. 3"></div></div></div>`;
    const md = App.modal({ title: isNew ? 'Neue Unterrichtsstunde' : 'Stunde bearbeiten', body, foot: `${!isNew ? `<button class="btn btn-ghost btn-danger" data-del>${icon('trash')} Löschen</button>` : ''}<span class="grow"></span><button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>${icon('check')} Speichern</button>` });
    const el = (n) => md.el.querySelector(`[name=${n}]`);
    // Titel folgt dem Datum, solange er nicht von Hand geändert wurde
    let lastDate = el('date').value;
    el('date').addEventListener('input', () => {
      if (UL.isAutoTitle(el('title').value, lastDate)) el('title').value = UL.jpDate(el('date').value);
      lastDate = el('date').value;
    });
    if (isNew) el('course').addEventListener('change', () => { el('number').value = UL.nextNumber(all, el('course').value); });
    md.el.querySelector('[data-no]').onclick = md.close;
    md.el.querySelector('[data-ok]').onclick = async () => {
      const g = (n) => el(n).value.trim();
      const date = g('date');
      Object.assign(it, { number: +g('number') || '', date, course: g('course'), title: g('title') || UL.jpDate(date), titleAuto: UL.isAutoTitle(g('title'), date), topic: g('topic'), bookSource: g('bookSource'), bookLesson: g('bookLesson') === '' ? '' : (isNaN(+g('bookLesson')) ? g('bookLesson') : +g('bookLesson')) });
      it.textbook = bookRef(it);
      const saved = await App.saveItem(it);
      md.close();
      if (isNew) App.go(App.link(saved)); else App.render(true);
    };
    const d = md.el.querySelector('[data-del]');
    if (d) d.onclick = async () => { if (await App.confirm(`„${sessionTitle(s)}“ löschen? Verknüpfte Vokabeln & Grammatik bleiben erhalten.`)) { await App.deleteItem(s.id); md.close(); App.go('#/unterricht'); } };
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-action="new-session"]')) App.editSession(); });

  // ---------- Übersicht ----------
  const sessionCard = (s) => {
    const n = (k) => (s[k] || []).length;
    const g = (s.grammarIds || []).map(App.item).filter(Boolean);
    const hw = App.filesFor({ sessionId: s.id }).filter((f) => f.role === 'homework');
    const open = hw.filter((f) => !f.done).length;
    return `<a class="card session-card no-num" href="${App.link(s)}">
      <div><h3 lang="ja">${esc(sessionTitle(s))}</h3>${s.topic ? `<div class="muted" style="margin:-2px 0 4px">${esc(s.topic)}</div>` : ''}<div class="row small muted" style="gap:8px">${s.number ? `Nr. ${esc(s.number)} · ` : ''}${icon('calendar')} ${App.fmtDate(s.date)} ${bookRef(s) ? `· <span class="badge src" style="--c:${App.sourceColor(s.bookSource)}">${esc(bookRef(s))}</span>` : ''}</div>
      <div class="row" style="margin-top:8px;gap:6px">${g.slice(0, 4).map((x) => `<span class="badge sec sec-grammar" lang="ja">${esc(x.title)}</span>`).join('')}${g.length > 4 ? `<span class="badge">+${g.length - 4}</span>` : ''}</div></div>
      <div class="stack small muted" style="gap:2px;text-align:right"><span>${n('vocabIds')} Vokabeln</span><span>${n('grammarIds')} Grammatik</span>${hw.length ? `<span style="color:${open ? 'var(--shu)' : 'var(--matcha)'}"><b>${open ? open + ' HA offen' : 'HA erledigt ✓'}</b></span>` : ''}</div></a>`;
  };
  App.route('/unterricht', (view) => {
    const sec = App.SECTIONS.session;
    const groups = UL.groupByCourse(sessions());
    const folded = (c) => (S.settings.coursesFolded || []).includes(c);
    view.innerHTML = `<div class="${sec.cls}">${App.pageHead(sec, 'Deine Kursstunden: mit dem Stift mitschreiben, Präsentationen ablegen, Hausaufgaben lösen – und nach jeder Stunde eine Zusammenfassung.',
      `<a class="btn" href="#/karte">${icon('map')} Lernlandkarte</a><button class="btn btn-sec" data-action="new-session">${icon('plus')} Neue Stunde</button>`)}
      ${groups.length ? groups.map((gr) => `<div class="course-group"><div class="section-title"><button type="button" class="fold-btn" data-fold-course="${esc(gr.course)}" aria-expanded="${!folded(gr.course)}" title="Kurs ein- oder ausklappen"><span class="chev"></span>${esc(gr.course)}<span class="fold-sum">· ${esc(UL.courseSummary(gr.sessions, App.fmtDate))}</span></button> <span class="badge">${gr.sessions.length}</span></div>
        <div class="timeline${folded(gr.course) ? ' is-folded' : ''}">${gr.sessions.map(sessionCard).join('')}</div></div>`).join('')
      : `<div class="empty-state"><div class="big">授</div><h3>Noch keine Stunde angelegt</h3><p>Lege zu jeder VHS-Stunde einen Eintrag an. Dort schreibst du mit dem Stift mit, legst die PowerPoint ab und erledigst Hausaufgaben.</p><button class="btn btn-primary" data-action="new-session">${icon('plus')} Erste Stunde anlegen</button></div>`}</div>`;
    // Kurs über die Überschrift ein-/ausklappen; gemerkt in den Einstellungen (coursesFolded: Namen der eingeklappten Kurse)
    view.querySelectorAll('[data-fold-course]').forEach((b) => {
      b.onclick = () => {
        const list = UL.toggleFolded(S.settings.coursesFolded, b.dataset.foldCourse), on = list.includes(b.dataset.foldCourse);
        b.setAttribute('aria-expanded', String(!on));
        b.closest('.course-group').querySelector('.timeline').classList.toggle('is-folded', on);
        App.saveSettings({ coursesFolded: list });
      };
    });
  });

  // ---------- Detail ----------
  App.route('/unterricht/:id', (view, p, q) => {
    const s = App.item(p.id);
    if (!s) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3></div>'; return; }
    const sec = App.SECTIONS.session;
    const tab = q.tab || 'hand';
    const files = App.filesFor({ sessionId: s.id });
    const mat = files.filter((f) => f.role === 'material');
    const hw = files.filter((f) => f.role === 'homework');
    const learnedN = Object.values(KEYS).reduce((a, k) => a + (s[k] || []).length, 0);
    const nb = UL.courseNeighbors(sessions(), s);
    const typedDot = (s.notesHtml || '').replace(/<[^>]+>/g, '').trim() ? '<span class="dot-mark" title="enthält Notizen"></span>' : '';
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="row between"><div class="crumbs"><a href="#/unterricht">Unterricht</a> › ${esc(s.course || '')}</div>
      <div class="row">${nb.prev ? `<a class="btn btn-sm" href="${App.link(nb.prev)}">${icon('back')} Vorherige</a>` : ''}${nb.next ? `<a class="btn btn-sm" href="${App.link(nb.next)}">Nächste ${icon('next')}</a>` : ''}</div></div>
      <div class="card session-head"><div><h1 lang="ja">${esc(sessionTitle(s))}</h1>${s.topic ? `<div class="topic">${esc(s.topic)}</div>` : ''}
        <div class="row small muted" style="margin-top:4px;gap:8px">${esc(s.course || 'Ohne Kurs')}${s.number ? ` · Nr. ${esc(s.number)}` : ''}${bookRef(s) ? ` · <a class="badge src" style="--c:${App.sourceColor(s.bookSource)};text-decoration:none" href="#/grammatik?src=${encodeURIComponent(s.bookSource)}${s.bookLesson !== '' ? '&l=' + s.bookLesson : ''}">${esc(bookRef(s))}</a>` : ''}</div></div>
        <button class="btn btn-sm" data-edit-session>${icon('edit')} Bearbeiten</button></div>
      <div class="tabs">${[['hand', `${icon('pen')} Handschrift`], ['typed', `${icon('edit')} Getippt${typedDot}`], ['material', `${icon('library')} Material <span class="badge">${mat.length}</span>`], ['homework', `${icon('notebook')} Hausaufgaben <span class="badge">${hw.length}</span>`], ['learned', `${icon('grammar')} Gelernt <span class="badge">${learnedN}</span>`], ['summary', `${icon('sparkle')} Zusammenfassung`]].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-q-tab="${k === 'hand' ? '' : k}">${l}</button>`).join('')}</div>
      <div data-body></div></div>`;
    view.querySelector('[data-edit-session]').onclick = () => App.editSession(s);
    const body = view.querySelector('[data-body]');
    const save = async (patch) => { Object.assign(s, patch); await App.saveItem(s, { silent: true }); };
    // Neu angelegte/verknüpfte Einträge landen in der passenden Liste der Stunde. „Lektion“ bleibt leer:
    // die laufende Nummer der Stunde ist keine Lehrbuch-Lektion.
    const newDefaults = { source: UL.CLASS_SOURCE, tags: ['vhs'] };
    const onLinked = (it) => { const k = KEYS[it.type]; s[k] = Array.from(new Set((s[k] || []).concat(it.id))); return save({}); };
    const newLinked = (type, defaults, after) => App.newLinked(type, Object.assign({}, newDefaults, defaults), async (it) => { after && after(it); await onLinked(it); });

    if (tab === 'hand') {
      App.inkArea(body, {
        sheets: files.filter((f) => f.role === 'notes').sort((a, b) => a.created - b.created),
        activeId: q.nb,
        sheetMeta: (paper, n) => ({ sessionId: s.id, role: 'notes', section: 'session', source: UL.CLASS_SOURCE, paper, name: 'Mitschrift ' + sessionTitle(s) + (n > 1 ? ` (${n})` : '') }),
        multiSheet: true,
        onSelect: (id) => App.setQuery({ nb: id }),
        newDefaults, onLinked, newPhrase: true,
      });
    }
    if (tab === 'typed') {
      App.typedArea(body, {
        html: s.notesHtml, onSave: (html) => save({ notesHtml: html }), newDefaults, onLinked,
        contextInfo: () => ({ sessionId: s.id, label: sessionTitle(s) + (s.topic ? ' · ' + s.topic : ''), date: s.date || App.today() }),
        placeholder: 'Hier tippen … (Überschriften, Listen, Furigana, Markierungen) – neues Wort markieren → „＋ Vokabel“',
        hint: 'Tipp: Wichtiges <mark>markieren</mark> – es erscheint automatisch in der Zusammenfassung. Mit „+ Vokabel“ wird markierter Text direkt als Vokabel gespeichert und mit dieser Stunde verknüpft.',
      });
    }
    if (tab === 'material') {
      body.innerHTML = `<div class="row" style="margin-bottom:14px"><button class="btn btn-sec" data-up>${icon('upload')} Präsentation / Material hochladen</button>
        <span class="small muted">PowerPoint wird mit PowerPoint geöffnet. Als PDF gespeichert kannst du hier direkt auf den Folien mitschreiben.</span></div>
        ${mat.length ? `<div class="file-grid">${mat.map(App.fileCard).join('')}</div>` : '<div class="empty-state"><div class="big">資</div><h3>Noch kein Material</h3><p>Lade die PowerPoint-Präsentation oder Arbeitsblätter dieser Stunde hoch.</p></div>'}`;
      body.querySelector('[data-up]').onclick = () => App.uploadDialog({ sessionId: s.id, role: 'material', section: 'session', source: UL.CLASS_SOURCE });
    }
    if (tab === 'homework') {
      body.innerHTML = `<div class="row" style="margin-bottom:14px"><button class="btn btn-sec" data-up>${icon('upload')} Hausaufgabe (PDF/Foto) hochladen</button><button class="btn" data-blank>${icon('notebook')} Leeres Blatt</button></div>
        ${hw.length ? `<div class="stack">${hw.map((f) => `<div class="card row between"><div class="row"><label class="chip ${f.done ? 'on' : ''}" style="--sec:var(--matcha)"><input type="checkbox" data-done="${f.id}" ${f.done ? 'checked' : ''} hidden>${f.done ? '✓ Erledigt' : 'Offen'}</label>
          <div><b>${esc(f.name)}</b><div class="small muted">${App.store.inkCount.get(f.id) ? `✎ ${App.store.inkCount.get(f.id)} Seite(n) beschrieben` : 'noch nicht bearbeitet'}</div></div></div>
          <div class="row"><button class="btn btn-sec btn-sm" data-open-file="${f.id}">${icon('pen')} Mit Stift bearbeiten</button></div></div>`).join('')}</div>`
        : '<div class="empty-state"><div class="big">宿</div><h3>Keine Hausaufgaben</h3><p>Lade das Aufgabenblatt als PDF hoch – dann kannst du es mit dem Surface-Stift direkt ausfüllen und als PDF wieder ausdrucken/abgeben.</p></div>'}`;
      body.querySelector('[data-up]').onclick = () => App.uploadDialog({ sessionId: s.id, role: 'homework', section: 'session', source: UL.CLASS_SOURCE, accept: 'application/pdf,image/*' });
      body.querySelector('[data-blank]').onclick = () => App.newNotebook({ sessionId: s.id, role: 'homework', section: 'session', source: UL.CLASS_SOURCE, name: `Hausaufgabe Stunde ${s.number || ''}` });
      body.addEventListener('change', async (e) => { const c = e.target.closest('[data-done]'); if (c) { const f = S.files.get(c.dataset.done); f.done = c.checked; await App.updateFile(f); App.render(true); } });
    }
    if (tab === 'learned') {
      const hasBook = s.bookSource && s.bookLesson !== '' && s.bookLesson != null;
      body.innerHTML = `${hasBook ? `<div class="card row between" style="margin-bottom:16px;background:var(--sec-soft);border-color:transparent"><div><b>${esc(bookRef(s))}</b> übernehmen?<div class="small muted">Verknüpft alle Grammatikpunkte, Vokabeln und Kanji dieser Lehrbuch-Lektion mit der Stunde.</div></div><button class="btn btn-sec" data-take-book>${icon('link')} Lektion übernehmen</button></div>` : ''}
        <div class="grid cols-2">${['grammar', 'vocab', 'kanji', 'phrase'].map((t) => {
          const sc = App.SECTIONS[t];
          const items = (s[KEYS[t]] || []).map(App.item).filter(Boolean);
          return `<div class="card ${sc.cls}"><div class="row between"><h3 style="margin:0">${sc.label} <span class="badge">${items.length}</span></h3>
            <div class="row"><button class="btn btn-sm" data-pick="${t}">${icon('link')} Auswählen</button><button class="btn btn-sm btn-sec" data-quick="${t}">${icon('plus')} Neu</button></div></div>
            <div class="rel-list" style="margin-top:10px;max-height:360px;overflow:auto">${items.map(App.relItem).join('') || '<span class="small muted">Noch nichts verknüpft.</span>'}</div></div>`;
        }).join('')}</div>`;
      body.addEventListener('click', async (e) => {
        const pk = e.target.closest('[data-pick]');
        if (pk) { const t = pk.dataset.pick; const ids = await App.pickItems({ title: `${App.SECTIONS[t].label} dieser Stunde`, types: [t], selected: s[KEYS[t]] || [], kanjiDefaults: newDefaults }); if (ids) { await save({ [KEYS[t]]: ids }); App.emit('items'); App.render(true); } }
        const qk = e.target.closest('[data-quick]');
        if (qk) newLinked(qk.dataset.quick, {}, () => App.render(true));
        if (e.target.closest('[data-take-book]')) {
          const match = (x) => x.source === s.bookSource && String(x.lesson) === String(s.bookLesson);
          ['grammar', 'vocab', 'kanji'].forEach((t) => { s[KEYS[t]] = Array.from(new Set((s[KEYS[t]] || []).concat(App.itemsOf(t).filter(match).map((x) => x.id)))); });
          await save({}); App.emit('items'); App.toast('Lektion verknüpft'); App.render(true);
        }
      });
    }
    if (tab === 'summary') {
      body.innerHTML = `<div class="split"><div><div class="card pad-lg summary-doc" data-sum>${App.sessionSummary(s)}</div></div>
        <aside><div class="card"><h3>Eigenes Fazit</h3><textarea class="input" style="width:100%" rows="6" data-note placeholder="Was war schwierig? Was will ich wiederholen?">${esc(s.summaryNote || '')}</textarea></div>
        <div class="card stack"><button class="btn" data-print>${icon('print')} Drucken / PDF</button><button class="btn" data-ai>${icon('copy')} KI-Prompt kopieren</button>
        <span class="small muted">Die Zusammenfassung entsteht automatisch aus den verknüpften Einträgen, deinen Überschriften und <mark>Markierungen</mark> in der Mitschrift.</span>
        <a class="btn btn-sec" href="#/ueben/saetze?s=${encodeURIComponent(s.id)}">${icon('sparkle')} Übungen zu dieser Stunde</a></div></aside></div>`;
      const ta = body.querySelector('[data-note]');
      ta.addEventListener('input', App.debounce(async () => { await save({ summaryNote: ta.value }); body.querySelector('[data-sum]').innerHTML = App.sessionSummary(s); }, 600));
      body.querySelector('[data-print]').onclick = () => {
        let pr = $('#print-root'); if (!pr) { pr = document.createElement('div'); pr.id = 'print-root'; document.body.appendChild(pr); }
        pr.innerHTML = `<div class="print-doc summary-doc" style="padding:20px">${App.sessionSummary(s)}</div>`;
        window.print();
      };
      body.querySelector('[data-ai]').onclick = () => {
        const txt = App.sessionPrompt(s);
        navigator.clipboard.writeText(txt).then(() => App.toast('Prompt kopiert – in Claude oder einer anderen KI einfügen'), () => App.modal({ title: 'KI-Prompt', body: `<div class="prompt-box">${esc(txt)}</div>` }));
      };
    }
    App.hydrateThumbs(body);
  });

  // ---------- Zusammenfassung ----------
  const notesExtract = (html) => {
    const d = document.createElement('div'); d.innerHTML = html || '';
    const out = [];
    d.querySelectorAll('h2, h3, mark, .box, b, strong').forEach((el) => { const t = el.textContent.trim(); if (t && !out.includes(t) && t.length < 240) out.push({ t, k: el.tagName }); });
    return out;
  };
  App.sessionSummary = (s) => {
    const g = (s.grammarIds || []).map(App.item).filter(Boolean);
    const v = (s.vocabIds || []).map(App.item).filter(Boolean);
    const k = (s.kanjiIds || []).map(App.item).filter(Boolean);
    const ph = (s.phraseIds || []).map(App.item).filter(Boolean);
    const files = App.filesFor({ sessionId: s.id });
    const ex = notesExtract(s.notesHtml);
    return `<h2>${esc(sessionTitle(s))}</h2><div class="muted">${App.fmtDate(s.date)} · ${esc(s.course || '')}${bookRef(s) ? ' · Lehrbuch: ' + esc(bookRef(s)) : ''}</div>
      ${g.length ? `<h3>Grammatik</h3><ul>${g.map((x) => `<li><a href="${App.link(x)}"><b>${esc(x.title)}</b></a> <span lang="ja" style="color:var(--daidai)">${JP.ruby(x.jp || '')}</span>${x.summary ? ' – ' + esc(x.summary) : ''}</li>`).join('')}</ul>` : ''}
      ${ex.length ? `<h3>Wichtiges aus der Mitschrift</h3><ul>${ex.map((x) => `<li>${x.k === 'MARK' ? `<mark>${esc(x.t)}</mark>` : x.k.startsWith('H') ? `<b>${esc(x.t)}</b>` : esc(x.t)}</li>`).join('')}</ul>` : ''}
      ${v.length ? `<h3>Vokabeln (${v.length})</h3><div style="columns:2 220px;column-gap:24px">${v.map((x) => `<div style="break-inside:avoid;margin-bottom:4px"><a href="${App.link(x)}" lang="ja" style="text-decoration:none">${JP.wordRuby(x)}</a> – ${App.meaningHtml(x)}</div>`).join('')}</div>` : ''}
      ${k.length ? `<h3>Kanji</h3><div class="row">${k.map((x) => `<a href="${App.link(x)}" style="text-decoration:none;text-align:center"><div style="font-family:var(--font-kanji);font-size:34px">${esc(x.char)}</div><div class="small muted">${esc(App.meaning(x).text.split(',')[0])}</div></a>`).join('')}</div>` : ''}
      ${ph.length ? `<h3>Ausdrücke</h3><ul>${ph.map((x) => `<li><span lang="ja">${JP.ruby(x.jp)}</span> – ${esc(x.de)}</li>`).join('')}</ul>` : ''}
      ${files.length ? `<h3>Material & Hausaufgaben</h3><ul>${files.map((f) => `<li>${esc(f.name)}${f.role === 'homework' ? (f.done ? ' – <b style="color:var(--matcha)">erledigt ✓</b>' : ' – <b style="color:var(--shu)">offen</b>') : ''}</li>`).join('')}</ul>` : ''}
      ${s.summaryNote ? `<h3>Mein Fazit</h3><div class="prose">${JP.md(s.summaryNote)}</div>` : ''}
      ${!g.length && !v.length && !ex.length ? '<p class="muted" style="margin-top:14px">Noch leer: Verknüpfe unter „Gelernt“ die Grammatik und Vokabeln dieser Stunde oder markiere Wichtiges in der Mitschrift.</p>' : ''}`;
  };
  App.sessionPrompt = (s) => {
    const g = (s.grammarIds || []).map(App.item).filter(Boolean);
    const v = (s.vocabIds || []).map(App.item).filter(Boolean);
    const d = document.createElement('div'); d.innerHTML = s.notesHtml || '';
    return `Ich lerne Japanisch (Niveau JLPT N5, Lehrbuch ${bookRef(s) || 'Genki I'}). Erstelle mir bitte eine übersichtliche Zusammenfassung meiner Unterrichtsstunde auf Deutsch mit: 1) den Grammatikthemen und je einer kurzen Erklärung + 2 Beispielsätzen, 2) den wichtigsten Vokabeln als Tabelle (Kanji, Kana, Deutsch), 3) fünf kurzen Übersetzungsübungen (Deutsch → Japanisch) NUR mit dieser Grammatik und diesen Vokabeln, Lösungen am Ende.

Stunde: ${sessionTitle(s)} (${App.fmtDate(s.date)})
Grammatik: ${g.map((x) => `${x.title} (${JP.plain(x.jp || '')})`).join('; ') || '–'}
Vokabeln: ${v.map((x) => `${x.kanji || x.kana} (${x.kana}) = ${App.meaning(x).text}`).join('; ') || '–'}
Meine Mitschrift:
${d.innerText.trim() || '–'}`;
  };
})(window.App);
