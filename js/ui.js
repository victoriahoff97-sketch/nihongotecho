/* Nihongo Techō – UI-Bausteine */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;

  // ---------- Sektionen ----------
  App.SECTIONS = {
    grammar: { one: 'Grammatikpunkt', label: 'Grammatik', jp: '文法', icon: 'grammar', cls: 'sec-grammar', route: '#/grammatik' },
    vocab: { one: 'Vokabel', label: 'Vokabeln', jp: '単語', icon: 'vocab', cls: 'sec-vocab', route: '#/vokabeln' },
    session: { one: 'Stunde', label: 'Unterricht', jp: '授業', icon: 'session', cls: 'sec-session', route: '#/unterricht' },
    kanji: { one: 'Kanji', label: 'Kanji', jp: '漢字', icon: 'kanji', cls: 'sec-kanji', route: '#/kanji' },
    phrase: { one: 'Ausdruck', label: 'Ausdrücke', jp: '表現', icon: 'phrase', cls: 'sec-phrase', route: '#/ausdruecke' },
    library: { label: 'Bibliothek', jp: '資料', icon: 'library', cls: 'sec-library', route: '#/bibliothek' },
    practice: { label: 'Üben', jp: '練習', icon: 'practice', cls: 'sec-practice', route: '#/ueben' },
    apply: { label: 'Anwenden', jp: '使う', icon: 'edit', cls: 'sec-apply', route: '#/anwenden' },
    prompt: { one: 'Frage', label: 'Smalltalk', jp: '会話', icon: 'edit', cls: 'sec-apply', route: '#/anwenden/frage' },
    answer: { one: 'Antwort', label: 'Antworten', jp: '答', icon: 'edit', cls: 'sec-apply', route: '#/anwenden/antwort' },
    journal: { one: 'Tagebucheintrag', label: 'Tagebuch', jp: '日記', icon: 'edit', cls: 'sec-apply', route: '#/anwenden/eintrag' },
  };
  // Anwenden-Typen: für Startseite/Suche/Teilen/Löschen gemeinsam behandelt
  App.APPLY_TYPES = ['prompt', 'answer', 'journal'];
  App.POS = {
    noun: 'Nomen', verb: 'Verb', 'i-adj': 'い-Adjektiv', 'na-adj': 'な-Adjektiv', adverb: 'Adverb', time: 'Zeitwort',
    expression: 'Ausdruck', question: 'Fragewort', pronoun: 'Pronomen', particle: 'Partikel', counter: 'Zähler',
    'prefix-suffix': 'Prä-/Suffix', conjunction: 'Konjunktion',
  };
  App.link = (it) => {
    if (!it) return '#/';
    if (it.type === 'kanji') return '#/kanji/' + encodeURIComponent(it.char || it.id);
    return App.SECTIONS[it.type].route + '/' + encodeURIComponent(it.id);
  };
  App.kanjiByChar = (c) => { for (const it of App.store.items.values()) if (it.type === 'kanji' && it.char === c) return it; return null; };

  // ---------- Toast / Modal ----------
  App.toast = (msg, action) => {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action.label)}</button>` : '');
    if (action) t.querySelector('button').onclick = () => { action.fn(); t.remove(); };
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), action ? 6000 : 3200);
  };
  App.modal = ({ title, body, foot, wide, cls = '', onClose }) => {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = `<div class="modal ${wide ? 'wide' : ''} ${cls}" role="dialog" aria-modal="true">
      <div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-x>${icon('close')}</button></div>
      <div class="modal-body"></div>${foot !== false ? '<div class="modal-foot"></div>' : ''}</div>`;
    const m = back.querySelector('.modal');
    const bodyEl = m.querySelector('.modal-body');
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    if (foot) m.querySelector('.modal-foot').innerHTML = foot;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    back.addEventListener('pointerdown', (e) => { if (e.target === back) back._downOnBack = true; });
    back.addEventListener('click', (e) => { if (e.target === back && back._downOnBack) close(); back._downOnBack = false; });
    m.querySelector('[data-x]').onclick = close;
    $('#overlay-root').appendChild(back);
    App.hydrateIcons(m);
    setTimeout(() => { const f = m.querySelector('[autofocus]'); if (f) f.focus(); }, 30);
    return { el: m, body: bodyEl, close };
  };
  App.confirm = (msg, { ok = 'Löschen', danger = true, title = 'Bist du sicher?' } = {}) => new Promise((res) => {
    const md = App.modal({
      title, body: `<p>${esc(msg)}</p>`,
      foot: `<button class="btn" data-no>Abbrechen</button><button class="btn ${danger ? 'btn-primary' : 'btn-primary'}" data-ok>${esc(ok)}</button>`,
      onClose: () => res(false),
    });
    md.el.querySelector('[data-no]').onclick = () => { md.close(); };
    md.el.querySelector('[data-ok]').onclick = () => { res(true); md.close(); };
  });
  App.ask = (title, fields) => new Promise((res) => {
    const body = `<div class="form">${fields.map((f, i) => `<div class="field"><label>${esc(f.label)}</label>
      <input class="input ${f.jp ? 'jp-in' : ''}" data-i="${i}" value="${esc(f.value || '')}" placeholder="${esc(f.placeholder || '')}" ${i === 0 ? 'autofocus' : ''}></div>`).join('')}</div>`;
    let done = false;
    const md = App.modal({ title, body, foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>OK</button>', onClose: () => { if (!done) res(null); } });
    const ok = () => { done = true; res($$('[data-i]', md.el).map((x) => x.value.trim())); md.close(); };
    md.el.querySelector('[data-ok]').onclick = ok;
    md.el.querySelector('[data-no]').onclick = () => md.close();
    $$('input', md.el).forEach((x) => x.addEventListener('keydown', (e) => { if (e.key === 'Enter') ok(); }));
  });

  // ---------- Kleine Renderer ----------
  // Bedeutung als HTML: deutsch bevorzugt, englische Bedeutung mit „EN“-Marke
  App.meaningHtml = (it) => {
    const m = App.meaning(it);
    return esc(m.text) + (m.lang === 'en' ? ' <span class="en-tag" title="Englische Bedeutung – noch keine deutsche Übersetzung">EN</span>' : '');
  };
  // JLPT-Niveau als Badge (leer, wenn kein Niveau)
  App.levelBadge = (it) => {
    const l = it && it.level;
    if (!l || !/^N[1-5]$/.test(l)) return '';
    return `<span class="badge lvl lvl-${l.toLowerCase()}" title="JLPT-Niveau ${l}">${l}</span>`;
  };
  App.srcBadge = (it) => {
    if (!it.source) return '';
    const l = it.lesson !== '' && it.lesson != null ? ` · L${esc(it.lesson)}` : '';
    return `<span class="badge src" style="--c:${App.sourceColor(it.source)}">${esc(it.source)}${l}</span>`;
  };
  App.tagsHtml = (tags) => (tags || []).map((t) => `<a class="tag" href="#/suche?q=%23${encodeURIComponent(t)}">${esc(t)}</a>`).join(' ');
  App.speakBtn = (text, cls = 'sm') => JP.canSpeak() ? `<button class="icon-btn ${cls}" data-speak="${esc(text)}" title="Vorlesen">${icon('speak')}</button>` : '';
  App.exampleHtml = (ex) => {
    const hasN = JP.hasNotation(ex.jp);
    const kana = ex.kana || (hasN ? JP.kana(ex.jp) : '');
    return `<div class="example"><div class="grow"><div class="jp-s" lang="ja">${JP.ruby(ex.jp)}</div>
      ${kana && kana !== ex.jp && !hasN ? `<div class="kana-s">${esc(kana)}</div>` : ''}
      <div class="de-s">${esc(App.exMeaning(ex))}</div>${ex.src ? `<div class="small muted">Quelle: ${esc(ex.src)}</div>` : ''}</div>${App.speakBtn(ex.jp)}</div>`;
  };
  App.itemMain = (it) => {
    switch (it.type) {
      case 'vocab': return JP.wordRuby(it);
      case 'kanji': return esc(it.char);
      case 'phrase': return JP.ruby(it.jp);
      case 'grammar': return JP.ruby(it.jp || it.title);
      case 'session': return esc((it.number ? 'Stunde ' + it.number + ': ' : '') + (it.title || 'Unterricht') + (it.topic ? ' · ' + it.topic : ''));
      case 'prompt': return JP.ruby(it.jp || '');
      case 'answer': { const q = typeof App.item === 'function' && App.item(it.promptId); return q ? JP.ruby(q.jp || '') : esc('Antwort'); }
      case 'journal': return esc(it.title || (App.uLogic ? App.uLogic.jpDate(it.date) : it.date) || '');
      default: return esc(it.title || it.id);
    }
  };
  App.itemPlain = (it) => {
    switch (it.type) {
      case 'vocab': return it.kanji || it.kana;
      case 'kanji': return it.char;
      case 'phrase': return JP.plain(it.jp);
      case 'grammar': return it.title;
      case 'session': return (it.number ? 'Stunde ' + it.number + ': ' : '') + (it.title || '') + (it.topic ? ' · ' + it.topic : '');
      default: return it.id;
    }
  };
  App.itemSub = (it) => {
    switch (it.type) {
      case 'vocab': return App.meaning(it).text;
      case 'kanji': return App.meaning(it).text;
      case 'phrase': return it.de;
      case 'grammar': return it.jp ? JP.plain(it.jp) + ' · ' + (it.summary || '') : it.summary;
      case 'session': return App.fmtDate(it.date) + (it.textbook ? ' · ' + it.textbook : '');
      case 'prompt': return it.de;
      case 'answer': case 'journal': return App.fmtDate ? App.fmtDate(it.date) : it.date;
      default: return '';
    }
  };
  App.relItem = (it) => {
    const sec = App.SECTIONS[it.type];
    const t = it.type === 'kanji' ? it.char : sec.jp[0];
    const main = it.type === 'grammar' ? esc(it.title) : App.itemMain(it);
    return `<a class="rel-item ${sec.cls}" href="${App.link(it)}"><span class="t">${esc(t)}</span><span class="x"><b>${main}${App.levelBadge(it)}</b><small>${esc(it.type === 'grammar' ? JP.plain(it.jp || '') : App.itemSub(it) || '')}</small></span></a>`;
  };

  App.vocabCard = (it) => `<a class="item-card sec-vocab" href="${App.link(it)}">
      ${it.star ? `<span class="star">${icon('starFill')}</span>` : ''}
      <div class="jp-big" lang="ja">${JP.wordRuby(it)}</div>
      ${it.kanji ? '' : ''}
      <div class="de">${App.meaningHtml(it)}</div>
      <div class="meta">${App.levelBadge(it)}${App.srcBadge(it)}${it.pos ? `<span class="badge">${esc(App.POS[it.pos] || it.pos)}</span>` : ''}<span class="grow"></span>${App.statusBadge ? App.statusBadge(it.id) : ''}</div>
    </a>`;
  App.grammarCard = (it) => `<a class="item-card g-card sec-grammar" href="${App.link(it)}">
      ${it.star ? `<span class="star">${icon('starFill')}</span>` : ''}
      <div class="gjp" lang="ja">${JP.ruby(it.jp || '')}</div>
      <div class="gtitle">${esc(it.title)}</div>
      <div class="muted small">${esc(it.summary || '')}</div>
      <div class="meta">${App.levelBadge(it)}${App.srcBadge(it)}<span class="grow"></span>${App.statusBadge ? App.statusBadge(it.id) : ''}</div>
    </a>`;
  App.kanjiTile = (it) => {
    const st = App.vocabStatus ? App.vocabStatus(it.id) : 'unchecked';
    const cls = App.hasMark && App.hasMark(it, App.MARK_CLASS);
    const marks = App.marksOf ? App.marksOf(it) : [];
    return `<a class="kanji-tile st-${st}" href="${App.link(it)}" title="${esc(App.meaning(it).text)}${marks.length ? ' · ' + esc(marks.join(', ')) : ''}"><span class="lvl"></span>${cls ? '<span class="kmark">授</span>' : ''}<span class="c">${esc(it.char)}</span><span class="m">${esc(App.meaning(it).text.split(',')[0])}</span></a>`;
  };

  // ---------- Suche ----------
  App.searchText = (it) => {
    if (it._st) return it._st;
    const parts = [];
    const push = (x) => { if (x) parts.push(String(x)); };
    push(it.de); push(it.en); push(it.title); push(it.summary); push(it.kana); push(it.kanji); push(it.char); push(it.group);
    push(it.jp && JP.plain(it.jp)); push(it.jp && JP.kana(it.jp)); push(it.notes); push(it.mnemonic);
    (it.on || []).forEach(push); (it.kun || []).forEach(push); (it.tags || []).forEach((t) => push('#' + t));
    (it.examples || []).forEach((e) => { push(JP.plain(e.jp)); push(e.de); push(e.en); });
    (it.words || []).forEach((w) => { push(JP.plain(w.jp)); push(JP.kana(w.jp)); push(w.de); push(w.en); });
    if (it.type === 'session') { push(it.number && 'stunde ' + it.number); push(it.textbook); push(it.topic); push(it.course); push((it.notesHtml || '').replace(/<[^>]+>/g, ' ')); }
    if (it.type === 'answer' || it.type === 'journal') push((it.html || '').replace(/<[^>]+>/g, ' '));
    const s = parts.join(' \u0001 ');
    const st = { lc: s.toLowerCase(), hira: JP.toHira(s) };
    Object.defineProperty(it, '_st', { value: st, enumerable: false, configurable: true, writable: true });
    return st;
  };
  App.onChange(() => App.store.items.forEach((it) => { if (it._st) delete it._st; }));
  App.search = (q, { types, limit = 60 } = {}) => {
    q = (q || '').trim();
    if (!q) return [];
    const res = [];
    const tag = q.startsWith('#') ? q.slice(1).toLowerCase() : null;
    const lc = q.toLowerCase();
    const kanaQ = JP.looksRomaji(q) ? JP.romaji(lc) : JP.toHira(q);
    for (const it of App.store.items.values()) {
      if (types && !types.includes(it.type)) continue;
      let score = 0;
      if (tag) { if ((it.tags || []).some((t) => t.toLowerCase() === tag)) score = 10; }
      else {
        const st = App.searchText(it);
        const mean = [it.de, it.en].filter(Boolean).map((x) => String(x).toLowerCase()); // deutsche und englische Bedeutung
        const exact = [it.kana, it.kanji, it.char, it.jp && JP.plain(it.jp), ...mean, (it.title || '').toLowerCase()].filter(Boolean);
        if (exact.includes(q) || exact.includes(lc) || exact.map(JP.toHira).includes(kanaQ)) score = 100;
        else if (mean.some((m) => m.split(/[,;]\s*/).some((d) => d === lc || d.replace(/^(der|die|das|sich|to) /, '') === lc))) score = 80;
        else if (st.lc.includes(lc)) score = 30 + ((mean.length ? mean : [(it.title || '').toLowerCase()]).some((m) => m.startsWith(lc)) ? 20 : 0);
        else if (kanaQ && st.hira.includes(kanaQ)) score = 25;
      }
      if (score) res.push({ it, score });
    }
    const order = { vocab: 0, grammar: 1, kanji: 2, phrase: 3, session: 4, prompt: 5, answer: 6, journal: 7 };
    res.sort((a, b) => b.score - a.score || order[a.it.type] - order[b.it.type]);
    return res.slice(0, limit).map((r) => r.it);
  };

  // ---------- Verwandtes ----------
  App.sessionsFor = (id) => App.itemsOf('session').filter((s) => ['grammarIds', 'vocabIds', 'kanjiIds', 'phraseIds'].some((k) => (s[k] || []).includes(id)));
  App.filesFor = ({ section, source, lesson, itemId, sessionId }) => {
    const out = [];
    App.store.files.forEach((f) => {
      if (itemId) { if (f.itemId === itemId) out.push(f); return; }
      if (sessionId) { if (f.sessionId === sessionId) out.push(f); return; }
      if (section && f.section !== section) return;
      if (source && f.source !== source) return;
      if (lesson !== undefined && lesson !== '' && String(f.lesson) !== String(lesson)) return;
      out.push(f);
    });
    return out.sort((a, b) => b.created - a.created);
  };
  const kanjiChars = (s) => Array.from(String(s || '')).filter((c) => JP.hasKanji(c) && c !== '々');
  App.related = (it) => {
    const groups = [];
    const all = Array.from(App.store.items.values());
    const add = (title, list, max = 8) => { const l = list.filter((x) => x && x.id !== it.id); if (l.length) groups.push({ title, items: l.slice(0, max), more: l.length - max }); };
    const manual = (it.links || []).map(App.item).filter(Boolean).concat(all.filter((x) => (x.links || []).includes(it.id)));
    add('Verknüpft', manual, 20);
    const sameLesson = (x) => it.source && x.source === it.source && String(x.lesson) === String(it.lesson);
    if (it.type === 'vocab') {
      const chars = kanjiChars(it.kanji);
      add('Kanji in diesem Wort', chars.map(App.kanjiByChar));
      add('Wörter mit gleichem Kanji', all.filter((x) => x.type === 'vocab' && chars.some((c) => (x.kanji || '').includes(c))));
      add('Grammatik derselben Lektion', all.filter((x) => x.type === 'grammar' && sameLesson(x)), 6);
      const ex = (it.examples || []).map((e) => e.jp).join('');
      add('Ausdrücke', all.filter((x) => x.type === 'phrase' && it.kanji && JP.plain(x.jp).includes(it.kanji)), 5);
      if (!ex) { /* nichts */ }
    }
    if (it.type === 'grammar') {
      add('Verwandte Grammatik', (it.related || []).map(App.item).concat(all.filter((x) => x.type === 'grammar' && (x.related || []).includes(it.id))).filter((x, i, a) => x && a.indexOf(x) === i));
      add('Gleiche Themen', all.filter((x) => x.type === 'grammar' && !(it.related || []).includes(x.id) && (x.tags || []).some((t) => (it.tags || []).includes(t))), 6);
      add('Vokabeln dieser Lektion', all.filter((x) => x.type === 'vocab' && sameLesson(x)), 10);
    }
    if (it.type === 'kanji') {
      add('Vokabeln mit diesem Kanji', all.filter((x) => x.type === 'vocab' && (x.kanji || '').includes(it.char)), 16);
      add('Ausdrücke mit diesem Kanji', all.filter((x) => x.type === 'phrase' && JP.plain(x.jp).includes(it.char)), 10);
      add('Kanji derselben Lektion', all.filter((x) => x.type === 'kanji' && sameLesson(x)), 16);
    }
    if (it.type === 'phrase') {
      add('Gleiche Gruppe', all.filter((x) => x.type === 'phrase' && x.group === it.group).sort((a, b) => (a.order || 0) - (b.order || 0)), 12);
      add('Kanji darin', kanjiChars(JP.plain(it.jp)).map(App.kanjiByChar));
    }
    if (it.type !== 'session') add('Im Unterricht behandelt', App.sessionsFor(it.id));
    return groups;
  };
  App.relatedHtml = (it) => {
    const gs = App.related(it);
    if (!gs.length) return '';
    return gs.map((g) => `<div class="card rel-box"><h4>${esc(g.title)}</h4><div class="rel-list">${g.items.map(App.relItem).join('')}</div>${g.more > 0 ? `<div class="small muted" style="margin-top:6px">… und ${g.more} weitere</div>` : ''}</div>`).join('');
  };

  // ---------- Filter-Leiste (Quelle / Lektion) ----------
  App.sourceChips = (items, active, param = 'src') => {
    const counts = {};
    items.forEach((it) => { if (it.source) counts[it.source] = (counts[it.source] || 0) + 1; });
    const names = App.sources().map((s) => s.name).filter((n) => counts[n]);
    Object.keys(counts).forEach((n) => { if (!names.includes(n)) names.push(n); });
    if (names.length < 1) return '';
    return `<div class="chips scroll">
      <button class="chip ${!active ? 'on' : ''}" data-q-${param}="">Alle Quellen</button>
      ${names.map((n) => `<button class="chip ${active === n ? 'on' : ''}" data-q-${param}="${esc(n)}"><span class="sw" style="--c:${App.sourceColor(n)}"></span>${esc(n)} <span class="muted small">${counts[n]}</span></button>`).join('')}
    </div>`;
  };
  // JLPT-Niveau-Chips: N5…N1 + „ohne“ (Einträge ohne Niveau). Setzt q.lvl ('N5'…'N1' oder 'none').
  App.levelChips = (active, param = 'lvl') => `<div class="chips scroll">
      <button class="chip ${!active ? 'on' : ''}" data-q-${param}="">Alle Niveaus</button>
      ${App.JLPT_LEVELS.map((l) => `<button class="chip ${active === l ? 'on' : ''}" data-q-${param}="${l}"><span class="badge lvl lvl-${l.toLowerCase()}">${l}</span></button>`).join('')}
      <button class="chip ${active === 'none' ? 'on' : ''}" data-q-${param}="none">ohne Niveau</button>
    </div>`;
  App.lessonSelect = (items, active, param = 'l') => {
    const ls = Array.from(new Set(items.map((i) => i.lesson).filter((l) => l !== '' && l != null))).sort((a, b) => (+a) - (+b) || String(a).localeCompare(String(b)));
    if (!ls.length) return '';
    return `<select class="input" data-q-select="${param}"><option value="">Alle Lektionen</option>${ls.map((l) => `<option value="${esc(l)}" ${String(active) === String(l) ? 'selected' : ''}>Lektion ${esc(l)}</option>`).join('')}</select>`;
  };
  // Filter-Buttons (data-q-xxx) setzen Query-Parameter
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button, a');
    if (!b) return;
    for (const a of b.attributes) {
      if (a.name.startsWith('data-q-') && a.name !== 'data-q-select') { e.preventDefault(); App.setQuery({ [a.name.slice(7)]: a.value }); return; }
    }
  });
  document.addEventListener('change', (e) => {
    const s = e.target.closest('[data-q-select]');
    if (s) App.setQuery({ [s.dataset.qSelect]: s.value });
  });

  // ---------- Dateien ----------
  const EXT_COLOR = { pdf: '#c8402a', image: '#2b8a8f', slides: '#d9730d', notebook: '#7a4b93', video: '#3f7fbf', audio: '#3f7fbf', doc: '#2f4f86', deck: '#4c6ef5', other: '#7d7f89' };
  const EXT_LABEL = { pdf: 'PDF', image: 'Bild', slides: 'Folien', notebook: 'Notiz', video: 'Video', audio: 'Audio', doc: 'Text', deck: 'Deck', other: 'Datei' };
  App.fileCard = (f) => {
    const k = App.fileKind(f);
    const ink = App.store.inkCount.get(f.id);
    const ext = (f.name.split('.').pop() || '').toUpperCase().slice(0, 5);
    return `<div class="file-card" data-open-file="${f.id}">
      <div class="thumb">${k === 'image' ? `<img data-thumb="${f.id}" alt="">` : `<span class="ext" style="--c:${EXT_COLOR[k]}">${esc(k === 'notebook' ? '✎' : ext || EXT_LABEL[k])}</span>`}
      ${ink ? `<span class="ink-dot">✎ ${ink}</span>` : ''}</div>
      <div class="info"><b title="${esc(f.name)}">${esc(f.name)}</b>
      <div class="row" style="gap:4px">${App.srcBadge(f)}<span class="badge">${EXT_LABEL[k]}</span></div></div></div>`;
  };
  const urls = [];
  App.hydrateThumbs = async (root) => {
    for (const img of $$('img[data-thumb]', root)) {
      const b = await App.fileBlob(img.dataset.thumb);
      if (b) { const u = URL.createObjectURL(b); urls.push(u); img.src = u; }
    }
  };
  App.onChange((w) => { if (w === 'route') { urls.splice(0).forEach((u) => URL.revokeObjectURL(u)); } });
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-open-file]');
    if (c) App.openFile(c.dataset.openFile, { page: +c.dataset.openPage || 0 });
  });

  App.downloadBlob = (blob, name) => {
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 4000);
  };
  // opts.page: PDF auf dieser Seite öffnen
  App.openFile = async (id, opts = {}) => {
    const f = App.store.files.get(id);
    if (!f) return;
    const k = App.fileKind(f);
    if (k === 'pdf' || k === 'image' || k === 'notebook') return App.ink.open(id, k === 'pdf' && opts.page ? { page: opts.page } : {});
    const blob = await App.fileBlob(id);
    const url = URL.createObjectURL(blob);
    let body = '';
    if (k === 'video') body = `<video src="${url}" controls style="width:100%;border-radius:12px"></video>`;
    else if (k === 'audio') body = `<audio src="${url}" controls style="width:100%"></audio>`;
    else if (k === 'slides') body = `<p><b>PowerPoint-Präsentation</b> (${App.fmtSize(f.size)}). Browser können PowerPoint-Dateien nicht direkt anzeigen – mit „Öffnen“ startet PowerPoint.</p>
      <div class="card" style="background:var(--sora-soft);border-color:transparent"><b>Tipp zum Mitschreiben:</b> In PowerPoint <i>Datei › Speichern unter › PDF</i> wählen und das PDF hier hochladen. Dann kannst du direkt mit dem Stift auf die Folien schreiben.
      <div style="margin-top:10px"><button class="btn btn-sm" data-add-pdf>${icon('upload')} PDF-Version hinzufügen</button></div></div>`;
    else body = `<p>${esc(f.name)} (${App.fmtSize(f.size)})</p><p class="muted">Diese Datei wird mit dem passenden Programm geöffnet.</p>`;
    body += `<div class="small muted" style="margin-top:12px">${f.note ? esc(f.note) : ''}</div>`;
    const md = App.modal({
      title: esc(f.name), body, wide: k === 'video',
      foot: `<button class="btn btn-danger btn-ghost" data-del>${icon('trash')} Löschen</button><span class="grow"></span><button class="btn" data-edit>${icon('edit')} Details</button><button class="btn btn-primary" data-dl>${icon('download')} Öffnen / Herunterladen</button>`,
      onClose: () => URL.revokeObjectURL(url),
    });
    md.el.querySelector('[data-dl]').onclick = () => App.downloadBlob(blob, f.name);
    md.el.querySelector('[data-edit]').onclick = () => { md.close(); App.editFileMeta(f); };
    md.el.querySelector('[data-del]').onclick = async () => { if (await App.confirm(`„${f.name}“ endgültig löschen?`)) { await App.deleteFile(f.id); md.close(); App.toast('Datei gelöscht'); } };
    const ap = md.el.querySelector('[data-add-pdf]');
    if (ap) ap.onclick = () => { md.close(); App.uploadDialog({ source: f.source, lesson: f.lesson, section: f.section, sessionId: f.sessionId, role: f.role, accept: 'application/pdf' }); };
  };

  const sectionOptions = (cur) => [['library', 'Allgemein / Bibliothek'], ['grammar', 'Grammatik'], ['vocab', 'Vokabeln'], ['kanji', 'Kanji'], ['phrase', 'Ausdrücke'], ['session', 'Unterricht']]
    .map(([v, l]) => `<option value="${v}" ${cur === v ? 'selected' : ''}>${l}</option>`).join('');
  // Eine aktuelle Quelle, die nicht in den Einstellungen steht (z. B. „JLPT N5“ aus einem Paket), bleibt als gewählte Option erhalten
  App.sourceOptions = (cur, empty = true) => {
    const list = App.sources();
    const extra = cur && !list.some((s) => s.name === cur) ? `<option selected>${esc(cur)}</option>` : '';
    return (empty ? '<option value="">– keine –</option>' : '') + list.map((s) => `<option ${cur === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('') + extra;
  };
  App.fileMetaForm = (f) => `<div class="form">
      <div class="two"><div class="field"><label>Quelle</label><select class="input" name="source">${App.sourceOptions(f.source)}</select></div>
      <div class="field"><label>Lektion / Kapitel</label><input class="input" name="lesson" value="${esc(f.lesson ?? '')}" placeholder="z. B. 3"></div></div>
      <div class="two"><div class="field"><label>Bereich</label><select class="input" name="section">${sectionOptions(f.section)}</select></div>
      <div class="field"><label>Schlagwörter <small>mit Komma trennen</small></label><input class="input" name="tags" value="${esc((f.tags || []).join(', '))}"></div></div>
      <div class="field"><label>Notiz</label><input class="input" name="note" value="${esc(f.note || '')}"></div></div>`;
  const readMeta = (root) => {
    const g = (n) => root.querySelector(`[name="${n}"]`);
    return { source: g('source').value, lesson: g('lesson').value.trim(), section: g('section').value, tags: g('tags').value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), note: g('note').value.trim() };
  };
  App.editFileMeta = (f) => {
    const md = App.modal({
      title: 'Datei-Details', body: `<div class="field" style="margin-bottom:14px"><label>Name</label><input class="input" name="fname" value="${esc(f.name)}"></div>` + App.fileMetaForm(f),
      foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>Speichern</button>',
    });
    md.el.querySelector('[data-no]').onclick = md.close;
    md.el.querySelector('[data-ok]').onclick = async () => {
      Object.assign(f, readMeta(md.el), { name: md.el.querySelector('[name=fname]').value.trim() || f.name });
      await App.updateFile(f); md.close(); App.toast('Gespeichert');
    };
  };
  // Upload-Dialog. defaults: {source, lesson, section, sessionId, itemId, role, accept}
  App.uploadDialog = (d = {}) => new Promise((resolve) => {
    let picked = [];
    const body = `<div class="dropzone" data-drop>${icon('upload')}<div style="margin-top:6px"><b>Dateien hier ablegen</b> oder tippen zum Auswählen</div>
        <div class="small">PDF, Bilder (Fotos von Buchseiten), PowerPoint, Videos, Anki-Decks …</div>
        <input type="file" multiple hidden ${d.accept ? `accept="${d.accept}"` : ''}></div>
      <div data-list class="small" style="margin:10px 0"></div>` + App.fileMetaForm({ source: d.source || '', lesson: d.lesson ?? '', section: d.section || 'library', tags: d.tags || [] });
    let done = false;
    const md = App.modal({ title: d.title || 'Dateien hinzufügen', body, foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok disabled>Hochladen</button>', onClose: () => { if (!done) resolve([]); } });
    const inp = md.el.querySelector('input[type=file]');
    const dz = md.el.querySelector('[data-drop]');
    const okB = md.el.querySelector('[data-ok]');
    const show = () => { md.el.querySelector('[data-list]').innerHTML = picked.map((f) => `• ${esc(f.name)} <span class="muted">(${App.fmtSize(f.size)})</span>`).join('<br>'); okB.disabled = !picked.length; };
    dz.onclick = () => inp.click();
    inp.onchange = () => { picked = picked.concat(Array.from(inp.files)); show(); };
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('over'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('over'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); dz.classList.remove('over'); picked = picked.concat(Array.from(e.dataTransfer.files)); show(); });
    if (d.files) { picked = d.files; setTimeout(show); }
    md.el.querySelector('[data-no]').onclick = md.close;
    okB.onclick = async () => {
      const meta = readMeta(md.el);
      okB.disabled = true; okB.textContent = 'Speichere …';
      const out = [];
      for (const file of picked) out.push(await App.addFile(file, Object.assign({}, meta, { sessionId: d.sessionId, itemId: d.itemId, role: d.role })));
      done = true; md.close();
      App.toast(out.length === 1 ? 'Datei gespeichert' : `${out.length} Dateien gespeichert`);
      resolve(out);
    };
  });
  // Neues handschriftliches Notizbuch
  // d.askName === false → ohne Titel-Abfrage (d.name); { open: false } → Viewer nicht öffnen
  App.newNotebook = async (d = {}, { open = true } = {}) => {
    const paper = await App.ink.pickPaper({ title: 'Neues Notizblatt', current: d.paper });
    if (!paper) return null;
    let name = d.name;
    if (d.askName !== false) {
      const r = await App.ask('Neues Notizblatt', [{ label: 'Titel', value: d.name || 'Notizen ' + App.fmtDate(new Date()) }]);
      if (!r) return null;
      name = r[0];
    }
    const blob = new Blob(['{}'], { type: 'application/x-notebook' });
    const meta = Object.assign({}, d, { name: name || 'Notizen', mime: 'application/x-notebook', pages: 1, paper });
    delete meta.askName;
    const f = await App.addFile(blob, meta);
    f.mime = 'application/x-notebook'; f.pagePapers = [paper]; await App.updateFile(f);
    if (open) App.ink.open(f.id);
    return f;
  };

  // ---------- Eintrags-Auswahl (für Verknüpfungen) ----------
  App.pickItems = ({ title = 'Einträge auswählen', types = ['vocab', 'grammar', 'kanji', 'phrase'], selected = [], single = false } = {}) => new Promise((resolve) => {
    const sel = new Set(selected);
    const body = document.createElement('div');
    body.innerHTML = `<div class="row"><input class="input grow" placeholder="Suchen (Deutsch, かな, 漢字, Romaji) …" autofocus>
      <select class="input" data-t><option value="">Alle Bereiche</option>${types.map((t) => `<option value="${t}">${App.SECTIONS[t].label}</option>`).join('')}</select></div>
      <div class="picker-list"></div>`;
    const inp = body.querySelector('input'), list = body.querySelector('.picker-list'), tsel = body.querySelector('[data-t]');
    const draw = () => {
      const q = inp.value.trim();
      const ts = tsel.value ? [tsel.value] : types;
      let res = q ? App.search(q, { types: ts, limit: 80 }) : Array.from(App.store.items.values()).filter((x) => ts.includes(x.type)).sort((a, b) => (b.updated || 0) - (a.updated || 0)).slice(0, 40);
      const selectedItems = Array.from(sel).map(App.item).filter(Boolean).filter((x) => !res.includes(x));
      if (!q) res = selectedItems.concat(res);
      list.innerHTML = res.map((it) => `<label class="picker-row ${App.SECTIONS[it.type].cls}"><input type="${single ? 'radio' : 'checkbox'}" name="pk" value="${it.id}" ${sel.has(it.id) ? 'checked' : ''}>
        <span class="badge sec">${App.SECTIONS[it.type].label}</span><span class="jp">${it.type === 'grammar' ? esc(it.title) : App.itemMain(it)}</span><span class="muted small grow">${esc(App.itemSub(it) || '')}</span>${App.srcBadge(it)}</label>`).join('') || '<div class="muted" style="padding:14px">Nichts gefunden.</div>';
    };
    list.addEventListener('change', (e) => { const c = e.target; if (single) { sel.clear(); } if (c.checked) sel.add(c.value); else sel.delete(c.value); });
    inp.addEventListener('input', App.debounce(draw, 150));
    tsel.onchange = draw;
    draw();
    let done = false;
    const md = App.modal({ title, body, wide: true, foot: '<button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>Übernehmen</button>', onClose: () => { if (!done) resolve(null); } });
    md.el.querySelector('[data-no]').onclick = md.close;
    md.el.querySelector('[data-ok]').onclick = () => { done = true; resolve(Array.from(sel)); md.close(); };
  });

  // ---------- globale Klick-Aktionen ----------
  document.addEventListener('click', (e) => {
    const sp = e.target.closest('[data-speak]');
    if (sp) { e.preventDefault(); e.stopPropagation(); JP.speak(sp.dataset.speak); }
  }, true);
})(window.App);
