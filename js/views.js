/* Nihongo Techō – Ansichten: Start, Vokabeln, Grammatik, Ausdrücke, Suche */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  const srcOrder = (name) => { const i = App.sources().findIndex((s) => s.name === name); return i < 0 ? 99 : i; };
  const byLesson = (a, b) => srcOrder(a.source) - srcOrder(b.source) || (+a.lesson || 0) - (+b.lesson || 0) || App.ord(a) - App.ord(b);
  const groupBy = (items, keyFn) => { const m = new Map(); items.forEach((it) => { const k = keyFn(it); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }); return m; };
  const lessonKey = (it) => (it.source || 'Eigene Einträge') + (it.lesson !== '' && it.lesson != null ? ' · Lektion ' + it.lesson : '');
  App.furiClass = () => (S.settings.furigana === 'hover' ? 'hide-furigana' : '');
  const pageHead = (sec, sub, actions = '') => `<div class="page-head"><div class="titles"><h1>${esc(sec.label)} <span class="jp-title">${sec.jp}</span></h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
  App.pageHead = pageHead;
  const filterItems = (items, q) => {
    let out = items;
    if (q.src) out = out.filter((i) => i.source === q.src);
    if (q.l) out = out.filter((i) => String(i.lesson) === q.l);
    if (q.star) out = out.filter((i) => i.star);
    if (q.lvl) out = out.filter((i) => App.levelMatch(i, q.lvl));
    if (q.f) { const ids = new Set(App.search(q.f, { types: [out[0] ? out[0].type : 'vocab'], limit: 5000 }).map((x) => x.id)); out = out.filter((i) => ids.has(i.id)); }
    return out;
  };
  const filterInput = (q, ph) => `<div class="search-wrap" style="max-width:340px">${icon('search')}<input class="input" style="padding-left:44px;width:100%" data-filter placeholder="${esc(ph)}" value="${esc(q.f || '')}"></div>`;
  const bindFilter = (view) => {
    const f = view.querySelector('[data-filter]');
    if (!f) return;
    f.addEventListener('input', App.debounce(() => { App.setQuery({ f: f.value }); const g = App.$('[data-filter]'); if (g) { g.focus(); g.setSelectionRange(g.value.length, g.value.length); } }, 350));
  };
  const filesTab = (section, q) => {
    const files = App.filesFor({ section, source: q.src || undefined, lesson: q.l || undefined });
    return `<div class="row" style="margin-bottom:14px"><button class="btn btn-sec" data-upload="${section}">${icon('upload')} Dateien hinzufügen</button>
      <span class="muted small">Z. B. Fotos/PDFs der ${esc(App.SECTIONS[section].label)}-Seiten aus Genki, Marugoto & Co. – mit Quelle und Lektion markiert findest du sie immer wieder.</span></div>
      ${files.length ? `<div class="file-grid">${files.map(App.fileCard).join('')}</div>` : `<div class="empty-state"><div class="big">資</div><h3>Noch keine Dateien${q.src ? ' für ' + esc(q.src) : ''}</h3><p>Lade z. B. die Vokabelseite aus deinem Buch als Bild oder PDF hoch.</p></div>`}`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-upload]');
    if (!b) return;
    const q = App.parseHash().query;
    App.uploadDialog({ section: b.dataset.upload, source: q.src || '', lesson: q.l || '' });
  });
  const tabsHtml = (q, entries, filesN) => `<div class="tabs"><button class="tab ${q.tab !== 'files' ? 'on' : ''}" data-q-tab="">Einträge <span class="badge">${entries}</span></button><button class="tab ${q.tab === 'files' ? 'on' : ''}" data-q-tab="files">${icon('file')} Dateien <span class="badge">${filesN}</span></button></div>`;

  // ---------- Startseite: Leiste „Heute lesen“ (externe Seiten, brauchen Internet) ----------
  const NEWS_SVG = `<svg viewBox="0 0 92 84" aria-hidden="true"><g transform="rotate(-6 46 42)">
    <rect x="10" y="12" width="64" height="58" rx="6" fill="#fff" stroke="#854F0B" stroke-width="2"/>
    <path d="M74 26h8v36a6 6 0 01-6 6h-2" fill="#F1EFE8" stroke="#854F0B" stroke-width="2"/>
    <rect x="16" y="18" width="52" height="10" rx="3" fill="#E24B4A"/>
    <text x="42" y="26.5" text-anchor="middle" font-size="8" fill="#fff" font-weight="700" font-family="sans-serif">ニュース</text>
    <rect x="16" y="33" width="22" height="18" rx="3" fill="#B5D4F4"/><circle cx="23" cy="40" r="3" fill="#FAC775"/>
    <path d="M16 49l7-5 5 3 6-5 4 4v5H16z" fill="#639922"/>
    <path d="M43 35h24M43 40h24M43 45h18M16 57h52M16 62h40" stroke="#B4B2A9" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 66s-5-3-5-6a2.5 2.5 0 015-1 2.5 2.5 0 015 1c0 3-5 6-5 6z" fill="#ED93B1"/></g>
    <circle cx="80" cy="12" r="3" fill="#ED93B1"/><circle cx="6" cy="70" r="2.5" fill="#FAC775"/></svg>`;
  const KANJI_SVG = `<svg viewBox="0 0 92 84" aria-hidden="true"><g transform="rotate(5 46 42)">
    <rect x="14" y="10" width="56" height="64" rx="10" fill="#D4537E" stroke="#72243E" stroke-width="2"/>
    <rect x="20" y="16" width="44" height="52" rx="7" fill="#fff"/>
    <text x="42" y="54" text-anchor="middle" font-size="34" fill="#72243E" style="font-family:var(--font-kanji)">漢</text></g>
    <path d="M70 60c4-6 12-6 16 0" fill="#9FE1CB" stroke="#085041" stroke-width="2"/>
    <circle cx="75" cy="55" r="2.5" fill="#fff" stroke="#085041" stroke-width="1.5"/><circle cx="82" cy="55" r="2.5" fill="#fff" stroke="#085041" stroke-width="1.5"/>
    <circle cx="75" cy="55" r="1" fill="#085041"/><circle cx="82" cy="55" r="1" fill="#085041"/>
    <path d="M77 63q1.5 1 3 0" fill="none" stroke="#085041" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="8" cy="16" r="3" fill="#85B7EB"/><circle cx="84" cy="14" r="2.5" fill="#FAC775"/></svg>`;
  const readTile = (cls, href, art, kicker, title, text, go) => `<a class="read-tile ${cls}" href="${href}" target="_blank" rel="noopener">
      <span class="art">${art}</span><span class="txt"><span class="kicker" lang="ja">${kicker}</span><b>${title}</b><span class="desc">${text}</span><span class="go">${go} →</span></span></a>`;
  const readStrip = () => `<div class="read-strip">
      ${readTile('news', 'https://news.web.nhk/news/easy/', NEWS_SVG, '今日のニュース', 'NHK Easy lesen', 'Eine kurze Nachricht in einfachem Japanisch – mit Furigana.', 'Zur heutigen Nachricht')}
      ${readTile('wani', 'https://www.wanikani.com/', KANJI_SVG, '今日の漢字', 'WaniKani', 'Deine Kanji- und Vokabel-Reviews von heute erledigen.', 'Zu den Reviews')}</div>`;

  // ---------- Startseite: JLPT-Lernstand ----------
  // Nur das aktuelle Niveau: das niedrigste freigeschaltete Level-Paket, das noch nicht komplett „kann ich“ ist.
  // Ist keins freigeschaltet, erscheint das erste verfügbare als „freischalten“.
  const jlptCard = () => {
    const levels = (window.PACKS || []).filter((p) => p.kind === 'level');
    const active = levels.filter((p) => ['installed', 'update'].includes(App.packs.status(p)));
    const countsFor = (lvl) => ({
      vocab: App.vocabCounts(App.itemsOf('vocab').filter((v) => v.level === lvl)),
      kanji: App.vocabCounts(App.itemsOf('kanji').filter((k) => k.level === lvl && k.char !== '々')),
      grammar: App.vocabCounts(App.itemsOf('grammar').filter((g) => g.level === lvl)),
    });
    const done = (c) => Object.values(c).every((x) => x.known >= x.total);
    let cur = null, c = null;
    for (const p of active) { c = countsFor(p.level); cur = p; if (!done(c)) break; }
    if (!cur) {
      const p = levels.find((x) => App.packs.status(x) === 'locked');
      if (!p) return '';
      const already = App.itemsOf('vocab').filter((v) => v.level === p.level).length;
      return `<div class="section-title">JLPT ${p.level} – Lernstand</div>
      <div class="card row between"><div><b>${esc(p.title)} ist noch nicht freigeschaltet.</b><div class="small muted">${already ? `${already} Wörter kennt die App schon aus anderen Quellen. ` : ''}Mit dem Paket kommen alle Vokabeln, Kanji und Grammatikpunkte des Niveaus dazu.</div></div>
        <a class="btn btn-primary" href="#/pakete">${icon('plus')} ${p.level} freischalten</a></div>`;
    }
    const lvl = cur.level;
    const tot = { known: 0, learn: 0, total: 0 };
    Object.values(c).forEach((x) => { tot.known += x.known; tot.learn += x.learn; tot.total += x.total; });
    const pc = (n) => (tot.total ? (n / tot.total) * 100 : 0);
    const next = levels[levels.indexOf(cur) + 1];
    const nextTxt = next ? ` · als Nächstes: ${next.level}${App.packs.status(next) === 'unavailable' ? ' (kommt später)' : ''}` : '';
    const num = (x, label, href) => `<a href="${href}" style="text-decoration:none"><b style="font-size:26px;color:var(--matcha)">${x.known}</b> <span class="muted">/ ${x.total} ${label}</span></a>`;
    // Ohne Einstufen gibt es keine neuen Karteikarten – deshalb zuerst dorthin, solange etwas ungeprüft ist
    const cta = c.vocab.unchecked ? `<a class="btn btn-sec" href="#/ueben/einstufen?lvl=${lvl}&auto=1">${icon('check')} ${lvl} einstufen</a>`
      : c.kanji.unchecked ? `<a class="btn btn-sec" href="#/ueben/einstufen?type=kanji&lvl=${lvl}&auto=1">${icon('check')} ${lvl}-Kanji einstufen</a>`
      : `<a class="btn btn-sec" href="#/ueben/karten?lvl=${lvl}">${icon('practice')} ${lvl} üben</a>`;
    return `<div class="section-title">JLPT ${lvl} – Lernstand</div>
      <div class="card"><div class="row between"><div class="row" style="gap:22px">
        ${num(c.vocab, 'Vokabeln', `#/vokabeln?lvl=${lvl}`)}${num(c.kanji, 'Kanji', `#/kanji?lvl=${lvl}`)}${num(c.grammar, 'Grammatik', `#/grammatik?lvl=${lvl}`)}</div>
        ${cta}</div>
        <div class="progress" style="display:flex;height:10px;margin-top:12px"><i style="width:${pc(tot.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pc(tot.learn)}%;background:var(--ai);border-radius:0"></i></div>
        <div class="small muted" style="margin-top:8px">${Math.round(pc(tot.known))} % kann ich · ${tot.learn} im Lernstapel${nextTxt}</div></div>`;
  };

  // =========================================================
  // Start
  // =========================================================
  App.route('/', (view) => {
    const name = S.settings.name;
    const h = new Date().getHours();
    const greet = h < 11 ? 'おはようございます' : h < 18 ? 'こんにちは' : 'こんばんは';
    const count = (t) => App.itemsOf(t).length;
    // Wiederholen: der Knopf startet direkt die Lernrunde des ersten Kartentyps mit fälligen (sonst neuen) Karten
    // Kanji-Schwerpunkt (Einstellungen): „Schreiben“ blendet die Lese-Karten der Kanji aus und stellt das Schreiben nach vorn, „Lesen“ umgekehrt
    const focus = App.writeLogic.focus(S.settings);
    const queues = [['vocab', 'Vokabeln', 'Vokabel'], ['kanji', 'Kanji', 'Kanji'], ['grammar', 'Grammatik', 'Grammatik'], ['phrase', 'Ausdrücke', 'Ausdruck']].filter(([type]) => type !== 'kanji' || focus !== 'write').map(([type, label, one]) => {
      const { due, fresh } = App.cardQueue({ type, dir: 'jp' });
      return { label: due.length === 1 ? one : label, due: due.length, fresh: fresh.length, href: `#/ueben/karten?${type === 'vocab' ? '' : `type=${type}&`}${type === 'kanji' ? 'dir=jp&' : ''}auto=1` };
    });
    const wq = App.writeQueue();
    if (focus !== 'read') queues.splice(focus === 'write' ? 0 : 2, 0, { label: 'Kanji schreiben', due: wq.due.length, fresh: wq.fresh.length, href: '#/ueben/kanji?auto=1' });
    const dueQ = queues.filter((x) => x.due), due = dueQ.reduce((n, x) => n + x.due, 0);
    const next = dueQ[0] || queues.find((x) => x.fresh);
    const action = (cls, attrs, ico, title, sub) => `<${attrs.startsWith('href') ? 'a' : 'button'} class="home-act ${cls}" ${attrs}><span class="i">${icon(ico)}</span><span><b>${title}</b><small>${sub}</small></span></${attrs.startsWith('href') ? 'a' : 'button'}>`;
    const vocab = App.itemsOf('vocab');
    const sessions = App.itemsOf('session').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const recent = Array.from(S.items.values()).filter((i) => i.created && i.type !== 'session' && !App.APPLY_TYPES.includes(i.type)).sort((a, b) => b.created - a.created).slice(0, 8);
    const lessons = Array.from({ length: 12 }, (_, i) => i + 1).map((l) => {
      const vs = vocab.filter((v) => v.source === 'Genki I' && +v.lesson === l);
      const learned = vs.filter((v) => App.srsStage(v.id) > 0).length;
      return { l, pct: vs.length ? Math.round((learned / vs.length) * 100) : 0, n: vs.length };
    });
    const stat = (t, n, sub) => { const s = App.SECTIONS[t]; return `<a class="stat ${s.cls}" href="${s.route}"><span class="bg">${s.jp}</span><span class="n">${n}</span><span class="l">${s.label}</span><span class="s">${sub}</span></a>`; };
    view.innerHTML = `<div class="sec-home">
      <div class="hero"><div class="big-jp">日本語</div>
        <h1 lang="ja">${greet}${name ? '、' + esc(name) + 'さん' : ''}！</h1>
        <p>${due ? `Heute ${due === 1 ? 'wartet <b>1 Karte</b>' : `warten <b>${due} Karten</b>`} auf dich: ${dueQ.map((x) => `<a href="${x.href}">${x.due} ${x.label}</a>`).join(' · ')}` : `Heute ist nichts fällig${next ? ' – Zeit für neue Karten aus dem Lernstapel.' : '.'}`}</p>
        <div class="row"><a class="btn solid" href="${next ? next.href : '#/ueben/karten'}">${icon(next ? 'play' : 'practice')} ${due ? 'Weiter wiederholen' : next ? 'Neue Karten lernen' : 'Karteikarten'}</a></div></div>
      <div class="home-actions">
        ${action('sec-vocab', 'href="#/saetze"', 'sparkle', 'Sätze erkennen', 'Text einfügen, Vokabeln finden')}
        ${action('sec-vocab', 'data-new-vocab', 'plus', 'Neue Vokabel', 'Ein Wort schnell speichern')}
        ${action('sec-session', 'data-action="new-session"', 'session', 'Neue Unterrichtsstunde', 'Mitschrift für heute anlegen')}
      </div>
      ${readStrip()}
      <div class="section-title" style="margin-top:20px">Deine Sammlung <span style="text-transform:none;letter-spacing:0;font-weight:600">· alles, was in der App steht</span></div>
      <div class="stat-grid" style="margin-top:0">
        ${stat('grammar', count('grammar'), 'Grammatikpunkte')}
        ${stat('vocab', count('vocab'), 'Wörter')}
        ${stat('session', count('session'), 'Stunden mitgeschrieben')}
        ${stat('kanji', count('kanji'), 'Kanji')}
        ${stat('phrase', count('phrase'), 'Ausdrücke & Bausteine')}
      </div>
      ${jlptCard()}
      ${(() => { const c = App.vocabCounts(); const pc = (n) => (c.total ? (n / c.total) * 100 : 0); return `<div class="section-title">Vokabel-Lernstand</div>
      <div class="card sec-vocab"><div class="row between"><div class="row" style="gap:22px">
        <a href="#/vokabeln?st=unchecked" style="text-decoration:none"><b style="font-size:26px;color:var(--muted)">${c.unchecked}</b> ungeprüft</a>
        <a href="#/vokabeln?st=learn" style="text-decoration:none"><b style="font-size:26px;color:var(--ai)">${c.learn}</b> im Lernstapel</a>
        <a href="#/vokabeln?st=known" style="text-decoration:none"><b style="font-size:26px;color:var(--matcha)">${c.known}</b> kann ich</a></div>
        <div class="row">${c.unchecked ? `<a class="btn btn-sec" href="#/ueben/einstufen?auto=1">${icon('check')} Nächste ${Math.min(c.unchecked, S.settings.checkBatch || 15)} einstufen</a>` : ''}<button class="btn" data-action="import-vocab">${icon('upload')} Importieren</button></div></div>
        <div class="progress" style="display:flex;height:10px;margin-top:12px"><i style="width:${pc(c.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pc(c.learn)}%;background:var(--ai);border-radius:0"></i></div></div>`; })()}
      ${(() => { const c = App.vocabCounts(App.itemsOf('kanji').filter((k) => k.char !== '々')); const pc = (n) => (c.total ? (n / c.total) * 100 : 0); const inClass = App.itemsOf('kanji').filter((k) => App.hasMark(k, App.MARK_CLASS)).length; return `<div class="section-title">Kanji-Lernstand</div>
      <div class="card sec-kanji"><div class="row between"><div class="row" style="gap:22px">
        <a href="#/kanji?st=unchecked" style="text-decoration:none"><b style="font-size:26px;color:var(--muted)">${c.unchecked}</b> ungeprüft</a>
        <a href="#/kanji?st=learn" style="text-decoration:none"><b style="font-size:26px;color:var(--ai)">${c.learn}</b> im Lernstapel</a>
        <a href="#/kanji?st=known" style="text-decoration:none"><b style="font-size:26px;color:var(--matcha)">${c.known}</b> kann ich</a>
        <a href="#/kanji?mark=${encodeURIComponent(App.MARK_CLASS)}" style="text-decoration:none"><b style="font-size:26px;color:var(--shu)">${inClass}</b> im Unterricht</a></div>
        ${c.unchecked ? `<a class="btn btn-sec" href="#/ueben/einstufen?type=kanji&auto=1">${icon('check')} Nächste ${Math.min(c.unchecked, S.settings.checkBatch || 15)} einstufen</a>` : ''}</div>
        <div class="progress" style="display:flex;height:10px;margin-top:12px"><i style="width:${pc(c.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pc(c.learn)}%;background:var(--ai);border-radius:0"></i></div>
        ${(() => { if (focus === 'read') return ''; const w = App.writeLogic.counts(wq.items, S.srs); const todo = wq.due.length + wq.fresh.length; return `<div class="row between" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><div class="row" style="gap:22px"><b>Schreiben</b>
          <span><b style="font-size:20px;color:var(--matcha)">${w.known}</b> kann ich</span>
          <span><b style="font-size:20px;color:var(--ai)">${w.learn}</b> übe ich</span>
          <span><b style="font-size:20px;color:var(--muted)">${w.new}</b> noch nie geschrieben</span></div>
          <a class="btn ${todo ? 'btn-sec' : ''}" href="#/ueben/kanji${todo ? '?auto=1' : ''}">${icon('pen')} ${wq.due.length ? `${wq.due.length} schreiben` : 'Schreiben üben'}</a></div>`; })()}</div>`; })()}
      <div class="section-title">Genki I – Vokabel-Fortschritt je Lektion</div>
      <div class="card"><div class="lesson-strip">${lessons.map((x) => `<a href="#/vokabeln?src=Genki%20I&l=${x.l}" title="${x.pct}% von ${x.n} Wörtern gelernt">L${x.l}<i style="width:${x.pct}%"></i></a>`).join('')}</div>
        <div class="small muted" style="margin-top:8px">Der grüne Balken zeigt, wie viele Wörter der Lektion du schon mit Karteikarten gelernt hast.</div></div>
      <div class="grid cols-2" style="margin-top:22px">
        <div class="card sec-session"><div class="row between"><h3>授業 Letzte Unterrichtsstunden</h3><a class="btn btn-sm" href="#/unterricht">Alle</a></div>
          <div class="rel-list">${sessions.slice(0, 4).map(App.relItem).join('') || '<p class="muted">Noch keine Stunde angelegt.</p>'}</div></div>
        <div class="card"><div class="row between"><h3>Zuletzt gespeichert</h3></div>
          <div class="rel-list">${recent.map(App.relItem).join('') || '<p class="muted">Hier erscheinen deine eigenen Einträge – z. B. neue Wörter aus NHK Easy. Tippe oben auf <b>Speichern</b>.</p>'}</div></div>
      </div></div>`;
    view.querySelector('[data-new-vocab]').onclick = () => App.editItem({ type: 'vocab' });
  });

  // =========================================================
  // Vokabeln
  // =========================================================
  App.route('/vokabeln', (view, p, q) => {
    const sec = App.SECTIONS.vocab;
    const all = App.itemsOf('vocab');
    let items = filterItems(all, q);
    if (q.pos) items = items.filter((i) => i.pos === q.pos);
    if (q.st) items = items.filter((i) => App.vocabStatus(i.id) === q.st);
    items.sort(byLesson);
    const mode = q.view || (App.lsGet('vocabView') || 'cards');
    const files = App.filesFor({ section: 'vocab', source: q.src || undefined, lesson: q.l || undefined });
    const cardsQs = new URLSearchParams(Object.fromEntries(Object.entries({ type: 'vocab', src: q.src, l: q.l, lvl: q.lvl }).filter(([, v]) => v))).toString();
    const unchecked = App.vocabCounts(filterItems(all, { src: q.src, l: q.l, lvl: q.lvl })).unchecked;
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${pageHead(sec, 'Alle Wörter mit Lesung, Kanji, Übersetzung und Beispielsätzen – nach Quelle und Lektion sortiert.',
      `<button class="btn" data-action="import-vocab">${icon('upload')} Importieren</button><a class="btn" href="#/saetze">${icon('sparkle')} Sätze zuordnen</a><a class="btn" href="#/ueben/einstufen?${cardsQs.replace(/type=vocab&?/, '')}">${icon('check')} Einstufen${unchecked ? ` <span class="badge">${unchecked}</span>` : ''}</a><a class="btn" href="#/ueben/karten?${cardsQs}">${icon('practice')} Karteikarten</a><button class="btn btn-sec" data-new="vocab">${icon('plus')} Vokabel</button>`)}
      ${tabsHtml(q, items.length, files.length)}
      <div class="toolbar">${filterInput(q, 'In Vokabeln suchen …')}${App.lessonSelect(all.filter((i) => !q.src || i.source === q.src), q.l)}
        <select class="input" data-q-select="pos"><option value="">Alle Wortarten</option>${Object.entries(App.POS).map(([k, l]) => `<option value="${k}" ${q.pos === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Gemerkt</button>
        <select class="input" data-q-select="st"><option value="">Jeder Lernstand</option>${Object.entries(App.STATUS).map(([k, s]) => `<option value="${k}" ${q.st === k ? 'selected' : ''}>${s.dot} ${s.label}</option>`).join('')}</select>
        <span class="grow"></span>
        <div class="seg"><button class="${mode === 'cards' ? 'on' : ''}" data-mode="cards">${icon('cards')}</button><button class="${mode === 'list' ? 'on' : ''}" data-mode="list">${icon('list')}</button></div></div>
      ${App.sourceChips(all, q.src)}
      ${App.levelChips(q.lvl)}
      <div data-body style="margin-top:14px"></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('vocab', q);
    else if (!items.length) body.innerHTML = `<div class="empty-state"><div class="big">単</div><h3>Keine Vokabeln gefunden</h3><p>Passe die Filter an oder lege ein neues Wort an.</p></div>`;
    else {
      const groups = groupBy(items, lessonKey);
      let html = '';
      groups.forEach((list, key) => {
        html += `<div class="group-head"><h2>${esc(key)}</h2><span class="badge">${list.length}</span><span class="line"></span></div>`;
        if (mode === 'list') html += `<div class="list">${list.map((it) => `<a class="list-row" href="${App.link(it)}"><span class="k" lang="ja">${esc(it.kanji || it.kana)}</span><span class="r" lang="ja">${esc(it.kanji ? it.kana : '')}</span><span>${App.meaningHtml(it)}</span><span class="row" style="gap:4px">${App.levelBadge(it)}${App.statusBadge(it.id)}${it.star ? icon('starFill') : ''}<span class="badge">${esc(App.POS[it.pos] || '')}</span></span></a>`).join('')}</div>`;
        else html += `<div class="grid cols-4">${list.map(App.vocabCard).join('')}</div>`;
      });
      body.innerHTML = html;
    }
    App.hydrateThumbs(body);
    bindFilter(view);
    view.querySelector('.seg').addEventListener('click', (e) => { const b = e.target.closest('[data-mode]'); if (b) { App.lsSet('vocabView', b.dataset.mode); App.setQuery({ view: b.dataset.mode }); } });
  });

  const conjTable = (it) => {
    if (it.pos === 'verb' && it.v && it.v.cls) {
      const forms = [['masu', 'höflich'], ['masen', 'höflich, verneint'], ['mashita', 'höflich, Vergangenheit'], ['masendeshita', 'höfl. Verg. verneint'], ['te', 'て-Form'], ['nai', 'Kurzform verneint'], ['ta', 'Kurzform Vergangenheit'], ['nakatta', 'Kurzform Verg. verneint'], ['tai', 'möchte …'], ['mashou', 'lass uns …']];
      const cls = { u: 'う-Verb (Godan)', ru: 'る-Verb (Ichidan)', irr: 'unregelmäßig' }[it.v.cls];
      return `<div class="section-title">Konjugation · ${cls}</div><div class="grid cols-3" style="gap:8px">${forms.map(([f, l]) => `<div class="card" style="padding:10px 14px"><div class="small muted">${l}</div><div lang="ja" style="font-size:19px">${JP.ruby(JP.conj(it, f))}</div></div>`).join('')}</div>`;
    }
    if ((it.pos === 'i-adj' || it.pos === 'na-adj') && it.kana) {
      const forms = [['desu', 'Gegenwart'], ['neg', 'verneint'], ['past', 'Vergangenheit'], ['pastneg', 'Verg. verneint'], ['attr', 'vor Nomen'], ['te', 'て-Form']];
      return `<div class="section-title">Formen · ${it.pos === 'i-adj' ? 'い-Adjektiv' : 'な-Adjektiv'}</div><div class="grid cols-3" style="gap:8px">${forms.map(([f, l]) => `<div class="card" style="padding:10px 14px"><div class="small muted">${l}</div><div lang="ja" style="font-size:19px">${JP.ruby(JP.adj(it, f))}</div></div>`).join('')}</div>`;
    }
    return '';
  };
  App.attachmentsHtml = (it) => {
    const fs = App.filesFor({ itemId: it.id });
    return `<div class="section-title">Anhänge</div><div class="row" style="margin-bottom:10px"><button class="btn btn-sm" data-attach="${it.id}">${icon('upload')} Datei anhängen</button><span class="small muted">z. B. Foto der Buchseite, Audio, Screenshot aus einem Anime</span></div>
      ${fs.length ? `<div class="file-grid">${fs.map(App.fileCard).join('')}</div>` : ''}`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-attach]');
    if (!b) return;
    const it = App.item(b.dataset.attach);
    App.uploadDialog({ itemId: it.id, source: it.source, lesson: it.lesson, section: it.type });
  });
  const detailActions = (it) => `<button class="icon-btn ${it.star ? 'active' : ''}" data-star="${it.id}" title="Merken">${icon(it.star ? 'starFill' : 'star')}</button>
      <button class="btn btn-sm" data-link-item="${it.id}">${icon('link')} Verknüpfen</button>
      <button class="btn btn-sm" data-edit="${it.id}">${icon('edit')} Bearbeiten</button>`;
  document.addEventListener('click', async (e) => {
    const s = e.target.closest('[data-star]');
    if (s) { const it = App.item(s.dataset.star); it.star = !it.star; await App.saveItem(it); App.render(true); return; }
    const ed = e.target.closest('[data-edit]');
    if (ed) { const it = App.item(ed.dataset.edit); App.editItem({ item: it, onSaved: () => App.render(true) }); return; }
    const nw = e.target.closest('[data-new]');
    if (nw) { const q = App.parseHash().query; App.editItem({ type: nw.dataset.new, defaults: { source: q.src || undefined, lesson: q.l || undefined, group: q.g || undefined } }); return; }
    const ln = e.target.closest('[data-link-item]');
    if (ln) {
      const it = App.item(ln.dataset.linkItem);
      const ids = await App.pickItems({ title: 'Mit anderen Einträgen verknüpfen', selected: it.links || [] });
      if (ids) { it.links = ids.filter((x) => x !== it.id); await App.saveItem(it); App.render(true); App.toast('Verknüpfungen gespeichert'); }
    }
  });
  const crumbs = (sec, it) => `<div class="crumbs"><a href="${sec.route}">${esc(sec.label)}</a>${it.source ? ` › <a href="${sec.route}?src=${encodeURIComponent(it.source)}">${esc(it.source)}</a>` : ''}${it.lesson !== '' && it.lesson != null && it.source ? ` › <a href="${sec.route}?src=${encodeURIComponent(it.source)}&l=${encodeURIComponent(it.lesson)}">Lektion ${esc(it.lesson)}</a>` : ''}</div>`;
  App.crumbs = crumbs;
  App.highlightWord = (text, it) => {
    const w = [it.kanji, it.kana].find((x) => x && text.includes(x));
    return w ? text.split(w).map(esc).join(`<mark>${esc(w)}</mark>`) : esc(text);
  };
  const refLink = (r) => /^https?:\/\//.test(r) ? `<a href="${esc(r)}" target="_blank" rel="noopener">${esc(r.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60))}</a>` : esc(r);

  App.route('/vokabeln/:id', (view, p) => {
    const it = App.item(p.id);
    if (!it) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3></div>'; return; }
    const sec = App.SECTIONS.vocab;
    const srs = App.srsOf(it.id);
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${crumbs(sec, it)}
      <div class="split"><div>
        <div class="card pad-lg"><div class="row between" style="align-items:flex-start">
          <div class="detail-hero"><div class="big" lang="ja">${JP.wordRuby(it)}</div>${App.speakBtn(it.kanji || it.kana, '')}</div>
          <div class="row">${detailActions(it)}</div></div>
          <div class="de-big" style="margin:4px 0 14px">${App.meaningHtml(it)}</div>
          <dl class="kv">${it.level ? `<dt>JLPT</dt><dd>${App.levelBadge(it)}</dd>` : ''}<dt>Lesung</dt><dd lang="ja" style="font-size:18px">${esc(it.kana)}</dd>
          ${it.kanji ? `<dt>Kanji</dt><dd lang="ja" style="font-size:18px">${Array.from(it.kanji).map((c) => App.kanjiByChar(c) ? `<a href="#/kanji/${encodeURIComponent(c)}" style="text-decoration:none;border-bottom:2px solid var(--murasaki)">${esc(c)}</a>` : esc(c)).join('')}</dd>` : ''}
          ${it.pos ? `<dt>Wortart</dt><dd>${esc(App.POS[it.pos] || it.pos)}</dd>` : ''}
          <dt>Quelle</dt><dd>${App.srcBadge(it) || '–'} ${it.sourceRef ? refLink(it.sourceRef) : ''}</dd>
          ${it.tags && it.tags.length ? `<dt>Schlagwörter</dt><dd>${App.tagsHtml(it.tags)}</dd>` : ''}
          <dt>Lernstand</dt><dd><div class="seg" data-vst>${Object.entries(App.STATUS).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <div class="small muted" style="margin-top:4px">${srs && srs.reps ? `${srs.check === 'known' ? 'als gelernt markiert' : srs.reps + '× gewusst'} · nächste Wiederholung ${App.fmtDate(srs.due)}` : srs ? 'wartet im Lernstapel auf die Karteikarten' : 'noch nicht eingestuft'}</div></dd></dl></div>
        ${(it.contexts || []).length ? `<div class="section-title">Kontext – wo du das Wort gefunden hast</div>${it.contexts.map((c) => { const s = c.sessionId && App.item(c.sessionId); const o = !s && c.itemId && App.item(c.itemId); return `<div class="ctx"><div class="small"><b>${s ? `<a href="${App.link(s)}">授業 ${esc(s.number ? 'Stunde ' + s.number : s.title || 'Unterricht')}</a>` : o ? `<a href="${App.link(o)}">${esc(c.label || 'Anwenden')}</a>` : esc(c.label || 'Notiz')}</b> · ${App.fmtDate(c.date)}</div>${c.text ? `<div class="jp-s" lang="ja">${App.highlightWord(c.text, it)}</div>` : ''}</div>`; }).join('')}` : ''}
        ${it.examples && it.examples.length ? `<div class="section-title">Beispielsätze</div>${it.examples.map(App.exampleHtml).join('')}` : ''}
        ${conjTable(it)}
        ${it.notes ? `<div class="section-title">Notizen</div><div class="card prose">${JP.md(it.notes)}</div>` : ''}
        ${App.attachmentsHtml(it)}
      </div><aside>${App.relatedHtml(it) || '<div class="card muted small">Noch keine verwandten Einträge. Mit „Verknüpfen“ kannst du selbst Verbindungen herstellen.</div>'}</aside></div></div>`;
    App.hydrateThumbs(view);
    view.querySelector('[data-vst]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { await App.setCheck(it.id, b.dataset.v); App.toast('Lernstand: ' + App.STATUS[b.dataset.v].label); App.render(true); } };
  });

  // =========================================================
  // Grammatik
  // =========================================================
  App.route('/grammatik', (view, p, q) => {
    const sec = App.SECTIONS.grammar;
    const all = App.itemsOf('grammar');
    let items = filterItems(all, q);
    if (q.st) items = items.filter((i) => App.vocabStatus(i.id) === q.st);
    items.sort(byLesson);
    const files = App.filesFor({ section: 'grammar', source: q.src || undefined, lesson: q.l || undefined });
    const cardQs = new URLSearchParams(Object.fromEntries(Object.entries({ type: 'grammar', src: q.src, l: q.l, lvl: q.lvl }).filter(([, v]) => v)));
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${pageHead(sec, 'Jeder Grammatikpunkt mit Aufbau, Erklärung, Beispielen – und wo du ihn gelernt hast.',
      `<a class="btn" href="#/ueben/karten?${cardQs}">${icon('practice')} Karteikarten</a><a class="btn" href="#/karte">${icon('map')} Lernlandkarte</a><button class="btn btn-sec" data-new="grammar">${icon('plus')} Grammatik</button>`)}
      ${tabsHtml(q, items.length, files.length)}
      <div class="toolbar">${filterInput(q, 'Grammatik suchen, z. B. て-Form, Vergleich …')}${App.lessonSelect(all.filter((i) => !q.src || i.source === q.src), q.l)}
      <select class="input" data-q-select="st"><option value="">Jeder Lernstand</option>${Object.entries(App.STATUS).map(([k, s]) => `<option value="${k}" ${q.st === k ? 'selected' : ''}>${s.dot} ${s.label}</option>`).join('')}</select>
      <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Gemerkt</button></div>
      ${App.sourceChips(all, q.src)}${App.levelChips(q.lvl)}<div data-body style="margin-top:14px"></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('grammar', q);
    else if (!items.length) body.innerHTML = '<div class="empty-state"><div class="big">文</div><h3>Keine Grammatik gefunden</h3></div>';
    else {
      let html = '';
      groupBy(items, lessonKey).forEach((list, key) => {
        html += `<div class="group-head"><h2>${esc(key)}</h2><span class="badge">${list.length}</span><span class="line"></span></div><div class="grid cols-3">${list.map(App.grammarCard).join('')}</div>`;
      });
      body.innerHTML = html;
    }
    App.hydrateThumbs(body);
    bindFilter(view);
  });
  App.route('/grammatik/:id', (view, p) => {
    const it = App.item(p.id);
    if (!it) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3></div>'; return; }
    const sec = App.SECTIONS.grammar;
    const sessions = App.sessionsFor(it.id);
    const srs = App.srsOf(it.id);
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${crumbs(sec, it)}
      <div class="split"><div>
        <div class="card pad-lg"><div class="row between" style="align-items:flex-start"><div>
          <div lang="ja" style="font-size:30px;color:var(--sec);line-height:1.6">${JP.ruby(it.jp || '')}</div>
          <h1 style="font-size:26px;margin-top:4px">${esc(it.title)}</h1></div><div class="row">${detailActions(it)}</div></div>
          <p style="font-size:17px;color:var(--ink-2);margin:10px 0 12px">${esc(it.summary || '')}</p>
          <div class="row">${App.srcBadge(it)} ${App.tagsHtml(it.tags)}
          ${sessions.map((s) => `<a class="badge src" style="--c:var(--shu);text-decoration:none" href="${App.link(s)}">授業 ${esc(s.number ? 'Stunde ' + s.number : s.title)} · ${App.fmtDate(s.date)}</a>`).join('')}</div>
          <div class="row" style="margin-top:14px;align-items:center"><span class="small muted">Lernstand</span><div class="seg" data-vst>${Object.entries(App.STATUS).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <span class="small muted">${srs && srs.reps ? `${srs.check === 'known' ? 'als gelernt markiert' : srs.reps + '× gewusst'} · nächste Wiederholung ${App.fmtDate(srs.due)}` : App.vocabStatus(it.id) === 'learn' ? `wartet im Lernstapel auf die Karteikarten${!srs ? ' (weil im Unterricht behandelt)' : ''}` : 'noch nicht eingestuft'}</span></div></div>
        ${it.structure && it.structure.length ? `<div class="section-title">Aufbau</div><div class="structure">${it.structure.map((s) => `<div>${JP.ruby(s)}</div>`).join('')}</div>` : ''}
        ${it.explanation ? `<div class="section-title">Erklärung</div><div class="card prose">${JP.md(it.explanation)}</div>` : ''}
        ${it.examples && it.examples.length ? `<div class="section-title">Beispiele</div>${it.examples.map(App.exampleHtml).join('')}` : ''}
        ${it.pitfalls && it.pitfalls.length ? `<div class="section-title">Stolperfallen</div>${it.pitfalls.map((x) => `<div class="pitfall">${JP.ruby(x)}</div>`).join('')}` : ''}
        ${it.notes ? `<div class="section-title">Notizen</div><div class="card prose">${JP.md(it.notes)}</div>` : ''}
        <div class="section-title">Üben</div>
        <div class="row"><a class="btn btn-sec" href="#/ueben/saetze?g=${encodeURIComponent(it.id)}">${icon('sparkle')} Übersetzungsübung zu diesem Thema</a>
        <span class="small muted">${(it.patterns || []).length ? `${it.patterns.length} Satzmuster + Beispielsätze` : 'Nutzt die Beispielsätze dieses Punktes'}</span></div>
        ${App.attachmentsHtml(it)}
      </div><aside>${App.relatedHtml(it)}</aside></div></div>`;
    App.hydrateThumbs(view);
    view.querySelector('[data-vst]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { await App.setCheck(it.id, b.dataset.v); App.toast('Lernstand: ' + App.STATUS[b.dataset.v].label); App.render(true); } };
  });

  // =========================================================
  // Ausdrücke & Bausteine
  // =========================================================
  // Gruppen der Ausdrücke: aus Einträgen + selbst angelegte (auch leere) Gruppen
  App.phraseGroups = () => {
    const out = [];
    App.itemsOf('phrase').slice().sort((a, b) => (a._seed ? 0 : 1) - (b._seed ? 0 : 1) || App.ord(a) - App.ord(b)).forEach((x) => { if (x.group && !out.includes(x.group)) out.push(x.group); });
    (S.settings.phraseGroups || []).forEach((g) => { if (!out.includes(g)) out.push(g); });
    return out;
  };
  App.newPhraseGroup = async () => {
    const r = await App.ask('Neue Gruppe für Ausdrücke', [{ label: 'Name der Gruppe', placeholder: 'z. B. Im Restaurant, Anime-Sprüche, Einkaufen …' }]);
    const name = r && r[0] && r[0].trim();
    if (!name) return null;
    if (App.phraseGroups().includes(name)) { App.toast('Diese Gruppe gibt es schon'); return name; }
    await App.saveSettings({ phraseGroups: (S.settings.phraseGroups || []).concat(name) });
    App.toast(`Gruppe „${name}“ angelegt`);
    return name;
  };
  const editPhraseGroup = async (g) => {
    const items = App.itemsOf('phrase').filter((x) => x.group === g);
    const md = App.modal({
      title: `Gruppe „${esc(g)}“`, body: `<div class="field"><label>Name</label><input class="input" data-name value="${esc(g)}" autofocus></div><p class="small muted">${items.length} Einträge in dieser Gruppe.</p>`,
      foot: `<button class="btn btn-ghost btn-danger" data-del>${icon('trash')} Gruppe löschen</button><span class="grow"></span><button class="btn" data-no>Abbrechen</button><button class="btn btn-primary" data-ok>Umbenennen</button>`,
    });
    md.el.querySelector('[data-no]').onclick = md.close;
    md.el.querySelector('[data-ok]').onclick = async () => {
      const nn = md.el.querySelector('[data-name]').value.trim();
      if (!nn || nn === g) return md.close();
      for (const it of items) { it.group = nn; await App.saveItem(it, { silent: true }); }
      await App.saveSettings({ phraseGroups: (S.settings.phraseGroups || []).filter((x) => x !== g).concat(nn) });
      md.close(); App.toast('Gruppe umbenannt'); App.setQuery({ g: App.parseHash().query.g ? nn : '' });
    };
    md.el.querySelector('[data-del]').onclick = async () => {
      let delItems = false;
      if (items.length) {
        const ch = await new Promise((res) => {
          const m2 = App.modal({ title: 'Was passiert mit den Einträgen?', body: `<p>Die Gruppe enthält ${items.length} Einträge.</p>`, foot: '<button class="btn" data-mv>In „Sonstiges“ verschieben</button><button class="btn btn-primary" data-rm>Einträge mitlöschen</button>', onClose: () => res(null) });
          m2.el.querySelector('[data-mv]').onclick = () => { res('move'); m2.close(); };
          m2.el.querySelector('[data-rm]').onclick = () => { res('delete'); m2.close(); };
        });
        if (!ch) return;
        delItems = ch === 'delete';
      } else if (!(await App.confirm(`Gruppe „${g}“ löschen?`))) return;
      for (const it of items) { if (delItems) await App.deleteItem(it.id); else { it.group = 'Sonstiges'; await App.saveItem(it, { silent: true }); } }
      await App.saveSettings({ phraseGroups: (S.settings.phraseGroups || []).filter((x) => x !== g) });
      md.close(); App.toast('Gruppe gelöscht'); App.setQuery({ g: '' });
    };
  };
  App.route('/ausdruecke', (view, p, q) => {
    const sec = App.SECTIONS.phrase;
    const all = App.itemsOf('phrase');
    const groupsOrder = App.phraseGroups();
    const custom = S.settings.phraseGroups || [];
    let items = filterItems(all, q);
    if (q.g) items = items.filter((i) => i.group === q.g);
    const files = App.filesFor({ section: 'phrase', source: q.src || undefined });
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${pageHead(sec, 'Floskeln, Zeitangaben, Zahlen, Zähler & Satzbausteine – alles, was man einfach auswendig lernen muss.',
      `<a class="btn" href="#/ueben/karten?type=phrase${q.g ? '&g=' + encodeURIComponent(q.g) : ''}">${icon('practice')} Karteikarten</a><button class="btn" data-new-group>${icon('plus')} Neue Gruppe</button><button class="btn btn-sec" data-new="phrase">${icon('plus')} Ausdruck</button>`)}
      ${tabsHtml(q, items.length, files.length)}
      <div class="toolbar">${filterInput(q, 'Suchen, z. B. Montag, 3 Uhr, ひとつ …')}</div>
      <div class="chips scroll" style="margin-bottom:16px"><button class="chip ${!q.g ? 'on' : ''}" data-q-g="">Alle Gruppen</button>${groupsOrder.map((g) => `<button class="chip ${q.g === g ? 'on' : ''}" data-q-g="${esc(g)}">${esc(g)}</button>`).join('')}<button class="chip" data-new-group>${icon('plus')} Gruppe</button></div>
      <div data-body></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('phrase', q);
    else {
      const gm = groupBy(items, (i) => i.group);
      const showEmpty = !q.f && !q.src && !q.l && !q.star;
      const gs = groupsOrder.filter((g) => gm.has(g) || (showEmpty && custom.includes(g) && (!q.g || q.g === g)));
      body.innerHTML = gs.map((g) => {
        const list = (gm.get(g) || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        return `<div class="card" style="margin-bottom:16px"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">${esc(g)} <span class="badge">${list.length}</span></h3>
          <div class="row">${list.length ? `<a class="btn btn-sm" href="#/ueben/karten?type=phrase&g=${encodeURIComponent(g)}">${icon('practice')} Lernen</a>` : ''}<button class="btn btn-sm btn-ghost" data-group="${esc(g)}" title="Ausdruck hinzufügen">${icon('plus')}</button><button class="btn btn-sm btn-ghost" data-edit-group="${esc(g)}" title="Gruppe umbenennen oder löschen">${icon('edit')}</button></div></div>
          ${list.length ? `<div class="list" style="box-shadow:none">${list.map((it) => `<a class="list-row" href="${App.link(it)}" style="grid-template-columns:minmax(160px,1.2fr) minmax(140px,1fr) minmax(120px,1.2fr) auto"><span class="k" lang="ja">${JP.ruby(it.jp)}</span><span><b>${esc(it.de)}</b></span><span class="small muted">${esc(it.note || '')}</span><span>${App.speakBtn(it.jp)}</span></a>`).join('')}</div>`
          : `<div class="empty-state" style="padding:18px"><p style="margin:0 0 10px">Noch leer.</p><button class="btn btn-sec btn-sm" data-group="${esc(g)}">${icon('plus')} Ersten Ausdruck hinzufügen</button></div>`}</div>`;
      }).join('') || '<div class="empty-state"><div class="big">表</div><h3>Nichts gefunden</h3></div>';
    }
    App.hydrateThumbs(body);
    bindFilter(view);
    view.firstElementChild.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-group]');
      if (b) { e.stopPropagation(); App.editItem({ type: 'phrase', defaults: { group: b.dataset.group } }); return; }
      const eg = e.target.closest('[data-edit-group]');
      if (eg) { e.stopPropagation(); editPhraseGroup(eg.dataset.editGroup); return; }
      if (e.target.closest('[data-new-group]')) { e.stopPropagation(); const g = await App.newPhraseGroup(); if (g) App.setQuery({ g }); }
    }, true);
  });
  App.route('/ausdruecke/:id', (view, p) => {
    const it = App.item(p.id);
    if (!it) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3></div>'; return; }
    const sec = App.SECTIONS.phrase;
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/ausdruecke">Ausdrücke</a> › <a href="#/ausdruecke?g=${encodeURIComponent(it.group)}">${esc(it.group)}</a></div>
      <div class="split"><div><div class="card pad-lg"><div class="row between" style="align-items:flex-start">
        <div class="detail-hero"><div class="big" lang="ja">${JP.ruby(it.jp)}</div>${App.speakBtn(it.jp, '')}</div><div class="row">${detailActions(it)}</div></div>
        <div class="de-big" style="margin:4px 0 12px">${esc(it.de)}</div>
        ${it.note ? `<div class="pitfall" style="background:var(--yamabuki-soft);border-color:var(--yamabuki)">${JP.ruby(it.note)}</div>` : ''}
        <dl class="kv" style="margin-top:14px"><dt>Lesung</dt><dd lang="ja">${esc(JP.kana(it.jp))}</dd><dt>Gruppe</dt><dd>${esc(it.group)}</dd><dt>Quelle</dt><dd>${App.srcBadge(it) || '–'}</dd>
        ${it.tags && it.tags.length ? `<dt>Schlagwörter</dt><dd>${App.tagsHtml(it.tags)}</dd>` : ''}</dl></div>
        ${App.attachmentsHtml(it)}</div><aside>${App.relatedHtml(it)}</aside></div></div>`;
    App.hydrateThumbs(view);
  });

  // =========================================================
  // Suche
  // =========================================================
  // Treffer im PDF-Text: Kopf öffnet die erste Trefferseite, jede Zeile ihre Seite
  const pdfHitCard = (r) => `<div class="card pdf-hit">
      <button class="pdf-hit-head" data-open-file="${r.file.id}" data-open-page="${r.hits[0].page}">${icon('file')}<b>${esc(r.file.name)}</b>${App.srcBadge(r.file)}<span class="badge">${r.count} ${r.count === 1 ? 'Seite' : 'Seiten'}</span></button>
      ${r.hits.map((h) => `<button class="pdf-hit-row" data-open-file="${r.file.id}" data-open-page="${h.page}"><span class="pno">S. ${h.page}</span><span class="snip">${esc(h.before)}<mark>${esc(h.match)}</mark>${esc(h.after)}</span></button>`).join('')}
      ${r.count > r.hits.length ? `<div class="small muted">… und ${r.count - r.hits.length} weitere Seiten</div>` : ''}</div>`;
  App.route('/suche', (view, p, q) => {
    const res = App.search(q.q || '', { limit: 300 });
    const groups = groupBy(res, (i) => i.type);
    // PDF-Inhalt (Textebene); diese Dateien erscheinen nur dort, nicht nochmal bei den Datei-Namen
    const textRes = q.q ? App.pdfText.search(Array.from(S.files.values()), q.q) : [];
    const inText = new Set(textRes.map((r) => r.file.id));
    const fileRes = q.q ? Array.from(S.files.values()).filter((f) => !inText.has(f.id)).filter((f) => (f.name + ' ' + (f.tags || []).join(' ') + ' ' + (f.note || '')).toLowerCase().includes(q.q.toLowerCase().replace(/^#/, ''))) : [];
    view.innerHTML = `<div class="page-head"><div class="titles"><h1>Suche <span class="jp-title">検索</span></h1><p>${res.length + fileRes.length + textRes.length} Treffer für „${esc(q.q || '')}“${JP.looksRomaji(q.q) ? ` · auch als <span lang="ja">${esc(JP.romaji(q.q))}</span>` : ''}</p></div></div>
      ${['vocab', 'grammar', 'kanji', 'phrase', 'session', 'prompt', 'answer', 'journal'].filter((t) => groups.has(t)).map((t) => {
        const s = App.SECTIONS[t];
        const list = groups.get(t);
        const inner = t === 'kanji' ? `<div class="kanji-grid">${list.map(App.kanjiTile).join('')}</div>`
          : t === 'vocab' ? `<div class="grid cols-4">${list.map(App.vocabCard).join('')}</div>`
          : t === 'grammar' ? `<div class="grid cols-3">${list.map(App.grammarCard).join('')}</div>`
          : `<div class="card"><div class="rel-list">${list.map(App.relItem).join('')}</div></div>`;
        return `<div class="${s.cls}"><div class="group-head"><h2>${s.label}</h2><span class="badge">${list.length}</span><span class="line"></span></div>${inner}</div>`;
      }).join('')}
      ${fileRes.length ? `<div class="sec-library"><div class="group-head"><h2>Dateien</h2><span class="line"></span></div><div class="file-grid">${fileRes.map(App.fileCard).join('')}</div></div>` : ''}
      ${textRes.length ? `<div class="sec-library"><div class="group-head"><h2>In PDFs gefunden</h2><span class="badge">${textRes.length}</span><span class="line"></span></div><div class="stack">${textRes.map(pdfHitCard).join('')}</div></div>` : ''}
      ${q.q && App.pdfText.pending() ? '<p class="small muted">PDF-Texte werden gerade eingelesen – weitere Treffer erscheinen gleich.</p>' : ''}
      ${!res.length && !fileRes.length && !textRes.length ? `<div class="empty-state"><div class="big">探</div><h3>Nichts gefunden</h3><p>Tipp: Du kannst auf Deutsch, in Kana, Kanji oder Romaji suchen. Mit #schlagwort findest du alles zu einem Thema.</p>
        <button class="btn btn-primary" data-new="vocab">${icon('plus')} „${esc(q.q || '')}“ als Vokabel anlegen</button></div>` : ''}
      <div class="sec-vocab card" data-dict-box style="margin-top:16px" hidden></div>`;
    App.hydrateThumbs(view);
    const dbox = view.querySelector('[data-dict-box]');
    fillDictBox(dbox, q.q || '').then(() => { dbox.hidden = !dbox.innerHTML; });
  });

  // ---------- Suche im Wörterbuch (nur mit Kana/Kanji und installiertem Wörterbuch) ----------
  // Liefert höchstens limit Treffer {entry, surface, base}; Einträge, die es schon als Vokabel gibt, fehlen
  App.dictSearch = async (q, limit = 5) => {
    q = String(q || '').trim();
    if (!/[぀-ヿ㐀-鿿々]/.test(q) || !App.dict.installed()) return [];
    const forms = [q, ...App.deinflect(q).map((b) => b.base)];
    const map = await App.dict.lookup(forms);
    const have = new Set(App.itemsOf('vocab').map(App.vocabKey));
    const seen = new Set(), res = [];
    forms.forEach((f) => (map.get(f) || []).forEach((e) => {
      if (seen.has(e.id)) return;
      seen.add(e.id);
      if (App.dictEntryKeys(e).some((k) => have.has(k))) return;
      res.push({ entry: e, surface: q, base: f });
    }));
    res.sort((a, b) => (b.entry.c || 0) - (a.entry.c || 0)); // stabil: häufige Wörter zuerst
    return res.slice(0, limit);
  };
  // Füllt box mit dem Abschnitt „Aus dem Wörterbuch“ (leer, wenn es nichts gibt); isCurrent verhindert veraltete Antworten
  const fillDictBox = async (box, q, isCurrent = () => true, onAdopt) => {
    let hits = [];
    try { hits = await App.dictSearch(q); } catch (e) { console.error(e); }
    if (!isCurrent() || !box.isConnected) return;
    box.innerHTML = hits.length ? `<div class="small muted" style="margin:10px 0 2px"><b>Aus dem Wörterbuch</b></div>${hits.map((h, i) => App.dictHitHtml(h, i)).join('')}` : '';
    box.onclick = (e) => {
      const b = e.target.closest('[data-adopt]');
      if (!b) return;
      onAdopt && onAdopt();
      App.adoptDictEntry(hits[+b.dataset.adopt]);
    };
  };

  // Mini-Suche in der Kopfzeile
  App.initSearch = () => {
    const inp = $('#global-search'), pop = $('#search-pop');
    let gen = 0;
    const draw = () => {
      const q = inp.value.trim();
      const my = ++gen;
      if (!q) { pop.hidden = true; return; }
      const res = App.search(q, { limit: 12 });
      pop.innerHTML = (res.length ? `<div class="rel-list">${res.map(App.relItem).join('')}</div>` : '<div class="muted" style="padding:10px">Keine Treffer</div>') +
        '<div data-dict-box></div>' +
        `<a class="btn btn-sm btn-ghost" style="width:100%;margin-top:6px" href="#/suche?q=${encodeURIComponent(q)}">Alle Ergebnisse anzeigen ↵</a>`;
      pop.hidden = false;
      fillDictBox(pop.querySelector('[data-dict-box]'), q, () => my === gen, () => { pop.hidden = true; });
    };
    inp.addEventListener('input', App.debounce(draw, 120));
    inp.addEventListener('focus', draw);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { pop.hidden = true; App.go('#/suche?q=' + encodeURIComponent(inp.value.trim())); inp.blur(); } if (e.key === 'Escape') { inp.blur(); pop.hidden = true; } });
    document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.search-wrap')) pop.hidden = true; });
    pop.addEventListener('click', (e) => { if (e.target.closest('a')) { pop.hidden = true; inp.value = ''; } });
  };

  App.lsGet = (k) => { try { return localStorage.getItem('nt-' + k); } catch (e) { return null; } };
  App.lsSet = (k, v) => { try { localStorage.setItem('nt-' + k, v); } catch (e) { /* egal */ } };
})(window.App);
