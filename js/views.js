/* Nihongo Techō – Ansichten: Start, Vokabeln, Grammatik, Ausdrücke, Suche */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;
  const JP = App.jp;
  const S = App.store;

  const srcOrder = (name) => { const i = App.sources().findIndex((s) => s.name === name); return i < 0 ? 99 : i; };
  const byLesson = (a, b) => srcOrder(a.source) - srcOrder(b.source) || (+a.lesson || 0) - (+b.lesson || 0) || App.ord(a) - App.ord(b);
  const groupBy = (items, keyFn) => { const m = new Map(); items.forEach((it) => { const k = keyFn(it); if (!m.has(k)) m.set(k, []); m.get(k).push(it); }); return m; };
  const lessonKey = (it) => (it.source && it.source !== 'Eigene' ? it.source : 'Eigene Einträge') + (it.lesson !== '' && it.lesson != null ? ' · Lektion ' + it.lesson : '');
  // Gruppen nach Quelle + Lektion; ein Eintrag mit weiteren Quellen (moreSources) steht zusätzlich in deren Gruppe.
  // Mit Quellen-Filter (src) nur die Gruppen der gewählten Quellen.
  const groupBySource = (items, src) => {
    const m = new Map();
    const on = App.qList(src);
    const put = (k, it) => { if (!m.has(k)) m.set(k, []); m.get(k).push(it); };
    items.forEach((it) => { if (!on.length || on.includes(it.source || 'Eigene')) put(lessonKey(it), it); });
    items.forEach((it) => (it.moreSources || []).forEach((s) => { if (!on.length || on.includes(s)) put(s === 'Eigene' ? 'Eigene Einträge' : s, it); }));
    return m;
  };
  App.furiClass = () => (S.settings.furigana === 'hover' ? 'hide-furigana' : '');
  const pageHead = (sec, sub, actions = '') => `<div class="page-head"><div class="titles"><h1>${esc(sec.label)} <span class="jp-title">${sec.jp}</span></h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row">${actions}</div></div>`;
  App.pageHead = pageHead;
  const filterItems = (items, q) => {
    let out = items;
    if (q.src) out = out.filter((i) => App.srcMatch(i, q.src));
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
    App.bindLiveFilter(f, '[data-filter]');
  };
  const filesTab = (section, q) => {
    const files = App.filesFor({ section, source: q.src || undefined, lesson: q.l || undefined });
    return `<div class="row" style="margin-bottom:14px"><button class="btn btn-sec" data-upload="${section}">${icon('upload')} Dateien hinzufügen</button>
      <span class="muted small">Z. B. Fotos/PDFs der ${esc(App.SECTIONS[section].label)}-Seiten aus Genki, Marugoto & Co. – mit Quelle und Lektion markiert findest du sie immer wieder.</span></div>
      ${files.length ? `<div class="file-grid">${files.map(App.fileCard).join('')}</div>` : `<div class="empty-state"><div class="big">資</div><h3>Noch keine Dateien${q.src ? ' für ' + esc(App.qList(q.src).join(', ')) : ''}</h3><p>Lade z. B. die Vokabelseite aus deinem Buch als Bild oder PDF hoch.</p></div>`}`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-upload]');
    if (!b) return;
    const q = App.parseHash().query;
    App.uploadDialog({ section: b.dataset.upload, source: App.oneSrc(q.src), lesson: q.l || '' });
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
  App.readTile = readTile;
  // Welche Kacheln dastehen, wählt man unter „Startseite anpassen“ (✕ / ＋), gemerkt pro Gerät (localStorage „homeRead“).
  // Die Kacheln teilen sich die Zeile: zwei nehmen je die Hälfte, eine die ganze Breite.
  const READ = {
    news: ['NHK Easy', () => readTile('news', 'https://news.web.nhk/news/easy/', NEWS_SVG, '今日のニュース', 'NHK Easy lesen', 'Eine kurze Nachricht in einfachem Japanisch – mit Furigana.', 'Zur heutigen Nachricht')],
    wani: ['WaniKani', () => readTile('wani', 'https://www.wanikani.com/', KANJI_SVG, '今日の漢字', 'WaniKani', 'Deine Kanji- und Vokabel-Reviews von heute erledigen.', 'Zu den Reviews')],
    listen: ['Listening (Chienowa · Teppei)', () => App.listening.tile()],
    shun: ['Listening (Shun)', () => (App.shunTile ? App.shunTile() : '')],
    verb: ['Verbformen (Genki)', () => (App.externTile ? App.externTile.verb() : '')],
    gvocab: ['Genki-Vokabeln', () => (App.externTile ? App.externTile.vocab() : '')],
  };
  const READ_DEFAULT = ['news', 'wani', 'listen'];
  const readList = () => { const s = App.homeOrderLogic.parse(App.lsGet('homeRead')); return (s || READ_DEFAULT).filter((k) => READ[k]); };
  const readStrip = () => {
    const list = readList();
    if (!homeEdit) return list.length ? `<div class="read-strip">${list.map((k) => READ[k][1]()).join('')}</div>` : '';
    const rest = Object.keys(READ).filter((k) => !list.includes(k));
    return `<div class="home-live"><div class="read-strip">${list.map((k) => `<div class="read-pick">${READ[k][1]()}<button type="button" class="icon-btn read-off" data-read-off="${k}" title="Von der Startseite nehmen" aria-label="${READ[k][0]} entfernen">${icon('close')}</button></div>`).join('') || '<p class="small muted">Keine Kachel gewählt – such dir unten welche aus.</p>'}</div>
      ${rest.length ? `<div class="quick-more"><span class="small muted">Weitere Kacheln:</span>${rest.map((k) => `<button type="button" class="chip" data-read-on="${k}">${icon('plus')} ${READ[k][0]}</button>`).join('')}</div>` : ''}</div>`;
  };

  // ---------- Startseite: Lernstand-Karten einklappen ----------
  // Ein Klick auf die Überschrift klappt die Karte darunter ein; eingeklappt steht die Kurzfassung neben dem Titel.
  // Gemerkt in den Einstellungen (homeFolded: Liste der eingeklappten Karten).
  const isFolded = (key) => (S.settings.homeFolded || []).includes(key);
  const foldHead = (key, title, sum) => `<div class="section-title"><button type="button" class="fold-btn" data-fold="${key}" aria-expanded="${!isFolded(key)}" title="Ein- oder ausklappen"><span class="chev"></span>${title}<span class="fold-sum">· ${sum}</span></button></div>`;
  const foldCls = (key) => (isFolded(key) ? ' is-folded' : '');
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-fold]');
    if (!b) return;
    const key = b.dataset.fold, on = !isFolded(key);
    b.setAttribute('aria-expanded', String(!on));
    const card = b.parentElement.nextElementSibling;
    if (card) card.classList.toggle('is-folded', on);
    App.saveSettings({ homeFolded: (S.settings.homeFolded || []).filter((k) => k !== key).concat(on ? [key] : []) });
  });

  // ---------- Startseite: Lernstand-Karten ----------
  // Überall dieselben Farben: grün = kann ich · blau = in der Lernschlange (schon gewusst, kommt von selbst wieder) · leer = wartet noch.
  // Zahlen stehen nur bei den Vokabeln; JLPT und Genki zeigen, wie weit man ist – als Balken mit Prozent.
  // Vokabeln zählen erst als „kann ich“, wenn beide Richtungen sitzen (App.wordState); Kanji und Grammatik nach dem Lese-Stand.
  const TYPE_INFO = { vocab: ['Vokabeln', '#/vokabeln'], kanji: ['Kanji', '#/kanji'], grammar: ['Grammatik', '#/grammatik'] };
  const progOf = (sets) => {
    const types = Object.keys(sets).filter((t) => sets[t].length);
    const pc = {}; types.forEach((t) => { pc[t] = App.progressCounts(sets[t]); });
    const sum = (k) => types.reduce((n, t) => n + pc[t][k], 0);
    const tot = { known: sum('known'), queue: sum('queue'), open: sum('open'), total: sum('total') };
    return { types, pc, tot, pct: tot.total ? Math.floor((tot.known / tot.total) * 100) : 0 };
  };
  const progBar = (c, cls = '') => { const w = (n) => (c.total ? (n / c.total) * 100 : 0); return `<div class="progress prog-bar ${cls}"><i style="width:${w(c.known)}%;background:var(--matcha)"></i><i style="width:${w(c.queue)}%;background:var(--ai)"></i></div>`; };
  // schmale Balken je Bereich (Vokabeln · Kanji · Grammatik) – ohne Zahlen, die stehen im Tooltip
  const miniBars = (p, qs) => `<div class="mini-bars">${p.types.map((t) => { const c = p.pc[t]; return `<a href="${TYPE_INFO[t][1]}?${qs}" title="${c.known} von ${c.total} kann ich · ${c.queue} in der Lernschlange · ${c.open} warten noch">${TYPE_INFO[t][0]}</a>${progBar(c, 'thin')}`; }).join('')}</div>`;
  // Die zwei Knöpfe je Karte – alles, was nicht von selbst kommt:
  // „neue lernen“ holt Neues in die Lernschlange – bei Vokabeln aus dem Ungeprüften, bei Kanji aus dem Lernstapel (erst Lesen: Vokabeln, Kanji – dann Deutsch → Japanisch),
  // „einstufen“ geht durch, was noch nicht eingestuft ist (Vokabeln lesen, Kanji, Deutsch → Japanisch). Grammatik hat nur den Haken von Hand.
  const qsObj = (qs) => Object.fromEntries(new URLSearchParams(qs));
  const cardBtns = (sets, qs) => {
    const and = qs ? qs + '&' : '', batch = S.settings.checkBatch || 15, many = Object.keys(sets).length > 1;
    const deTip = 'Deutsch → Japanisch';
    const btn = (cls, href, label, title = '') => `<a class="btn ${cls}" href="${href}"${title ? ` title="${title}"` : ''}>${label}</a>`;
    // Neues lernen
    const fq = (type) => (sets[type] && (type !== 'kanji' || App.writeLogic.focus(S.settings) !== 'write') ? App.cardQueue(Object.assign({ type, dir: 'jp' }, qsObj(qs))).fresh.length : 0);
    // Der Knopf sagt, wie viele die Runde hat und wie viele insgesamt noch warten („5 von 19 neuen“)
    const newN = (n) => `${icon('plus')} ${n > S.settings.newPerDay ? `${S.settings.newPerDay} von ${n} neuen` : `${n} neue`}`;
    const aFresh = sets.vocab ? App.activeQueue(qsObj(qs)).fresh.length : 0;
    const fresh = fq('vocab') ? btn('btn-sec', `#/ueben/karten?${and}round=new`, `${newN(fq('vocab'))}${many ? ' Vokabeln' : ''} lernen`)
      : fq('kanji') ? btn('btn-sec', `#/ueben/karten?type=kanji&dir=jp&${and}round=new`, `${newN(fq('kanji'))} Kanji lernen`)
      : aFresh ? btn('btn-sec', `#/ueben/karten?dir=de&${and}round=new`, `${newN(aFresh)} lernen`, deTip) : '';
    // Einstufen
    const cls = fresh ? '' : 'btn-sec';
    const next = (n) => `${icon('check')} Nächste ${Math.min(n, batch)}`;
    const unch = (t) => (sets[t] ? App.vocabCounts(sets[t]).unchecked : 0);
    const act = (sets.vocab || []).filter((x) => App.activeStatus(x) === 'unchecked').length;
    const check = unch('vocab') ? btn(cls, `#/ueben/einstufen${qs ? '?' + qs : ''}`, `${icon('check')} ${unch('vocab')}${many ? ' Vokabeln' : ''} einstufen`)
      : unch('kanji') ? btn(cls, `#/ueben/einstufen?type=kanji&${and}auto=1`, `${next(unch('kanji'))} Kanji einstufen`)
      : act ? btn(cls, `#/ueben/einstufen?dir=de${qs ? '&' + qs : ''}`, `${icon('check')} ${act} einstufen`, deTip + ': Welche Wörter weißt du auch aus dem Deutschen heraus?') : '';
    return fresh + check;
  };
  const pctHead = (p, right, btn = '') => `<div class="row between"><span><b style="font-size:26px;color:var(--matcha)">${p.pct} %</b> <span class="muted">kann ich</span></span><span class="row"><span class="small muted">${right}</span>${btn}</span></div>`;

  // ---------- Startseite: JLPT-Lernstand ----------
  // Nur das aktuelle Niveau: das niedrigste freigeschaltete Level-Paket, das noch nicht komplett „kann ich“ ist.
  // Ist keins freigeschaltet, erscheint das erste verfügbare als „freischalten“.
  const jlptCard = () => {
    const levels = (window.PACKS || []).filter((p) => p.kind === 'level');
    const active = levels.filter((p) => ['installed', 'update'].includes(App.packs.status(p)));
    const countsFor = (lvl) => ({
      vocab: App.progressCounts(App.itemsOf('vocab').filter((v) => v.level === lvl)),
      kanji: App.progressCounts(App.itemsOf('kanji').filter((k) => k.level === lvl && k.char !== '々')),
      grammar: App.progressCounts(App.itemsOf('grammar').filter((g) => g.level === lvl)),
    });
    const done = (c) => Object.values(c).every((x) => x.known >= x.total);
    let cur = null, c = null;
    for (const p of active) { c = countsFor(p.level); cur = p; if (!done(c)) break; }
    if (!cur) {
      const p = levels.find((x) => App.packs.status(x) === 'locked');
      if (!p) return '';
      const already = App.itemsOf('vocab').filter((v) => v.level === p.level).length;
      return `${foldHead('jlpt', `JLPT ${p.level} – Lernstand`, 'noch nicht freigeschaltet')}
      <div class="card row between${foldCls('jlpt')}"><div><b>${esc(p.title)} ist noch nicht freigeschaltet.</b><div class="small muted">${already ? `${already} Wörter kennt die App schon aus anderen Quellen. ` : ''}Mit dem Paket kommen alle Vokabeln, Kanji und Grammatikpunkte des Niveaus dazu.</div></div>
        <a class="btn btn-primary" href="#/pakete">${icon('plus')} ${p.level} freischalten</a></div>`;
    }
    const lvl = cur.level;
    const next = levels[levels.indexOf(cur) + 1];
    const nextTxt = next ? `als Nächstes: ${next.level}${App.packs.status(next) === 'unavailable' ? ' (kommt später)' : ''}` : '';
    const sets = {
      vocab: App.itemsOf('vocab').filter((v) => v.level === lvl),
      kanji: App.itemsOf('kanji').filter((k) => k.level === lvl && k.char !== '々'),
      grammar: App.itemsOf('grammar').filter((g) => g.level === lvl),
    };
    const p = progOf(sets);
    return `${foldHead('jlpt', `JLPT ${lvl} – Lernstand`, `${p.pct} % kann ich`)}
      <div class="card${foldCls('jlpt')}">${pctHead(p, nextTxt, cardBtns(sets, `lvl=${lvl}`))}
        ${progBar(p.tot)}${miniBars(p, `lvl=${lvl}`)}</div>`;
  };

  // ---------- Startseite: Genki-Lernstand ----------
  // Wie der JLPT-Lernstand, aber für alles aus Genki I. Die Lektionsleiste darunter zählt genauso („kann ich“),
  // ihre Summe ergibt die Zahlen oben. Abgeschlossene Lektionen sind ganz grün.
  const GENKI = 'Genki I';
  const genkiLevelCard = () => {
    const p = App.genkiProgress(GENKI);
    if (!p.total) return '';
    const src = encodeURIComponent(GENKI);
    const set = (t) => App.itemsOf(t).filter((i) => i.source === GENKI && i.char !== '々' && +i.lesson >= 1 && +i.lesson <= p.lessons.length);
    const sets = { vocab: set('vocab'), kanji: set('kanji'), grammar: set('grammar') };
    const g = progOf(sets);
    const part = (x, label) => (x.total ? `${x.known}/${x.total} ${label}` : '');
    const tile = (x) => {
      const tip = x.total ? [part(x.vocab, 'Wörter'), part(x.kanji, 'Kanji'), part(x.grammar, 'Grammatik')].filter(Boolean).join(' · ') : 'Noch keine Einträge';
      return `<a href="#/vokabeln?src=${src}&l=${x.l}"${x.done ? ' class="done"' : ''} title="Lektion ${x.l}${x.done ? ' abgeschlossen' : ''} – kann ich: ${tip}">L${x.l}${x.done ? ` ${icon('check')}` : `<i style="width:${x.pct}%"></i>`}</a>`;
    };
    return `${foldHead('genki', `${GENKI} – Lernstand`, `${g.pct} % kann ich · ${p.doneLessons} von ${p.lessons.length} Lektionen`)}
      <div class="card${foldCls('genki')}">${pctHead(g, `${p.doneLessons} von ${p.lessons.length} Lektionen abgeschlossen`, cardBtns(sets, `src=${src}`))}
        ${progBar(g.tot)}
        <div class="lesson-strip" style="margin-top:14px">${p.lessons.map(tile).join('')}</div></div>`;
  };

  // ---------- Startseite: Leisten anordnen und Schnellaktionen wählen ----------
  // Gemerkt pro Gerät (localStorage), nicht in den Einstellungen: auf Surface und iPad darf es verschieden aussehen.
  // Nur im Bearbeiten-Modus („Startseite anpassen“ unten) gibt es Griffe; gezogen wird mit Maus, Stift oder Finger.
  const HO = App.homeOrderLogic;
  let homeEdit = false;
  window.addEventListener('hashchange', () => { homeEdit = false; });
  const BLOCK_LABEL = { hero: 'Begrüßung · Wiederholen', actions: 'Schnellaktionen', read: 'Heute lesen und hören', sammlung: 'Deine Sammlung', vocab: 'Vokabel-Lernstand', jlpt: 'JLPT-Lernstand', genki: 'Genki-Lernstand', kanji: 'Kanji-Lernstand', bottom: 'Unterricht · Zuletzt gespeichert · 今日' };
  // Schnellaktionen: [Farbe, Attribute, Symbol, Titel, Untertitel] – die ersten drei stehen von Anfang an da
  const QUICK = {
    saetze: ['sec-vocab', 'href="#/saetze"', 'sparkle', 'Sätze erkennen', 'Text einfügen, Vokabeln finden'],
    vokabel: ['sec-vocab', 'data-new-vocab', 'plus', 'Neue Vokabel', 'Ein Wort schnell speichern'],
    stunde: ['sec-session', 'data-action="new-session"', 'session', 'Neue Unterrichts­stunde', 'Mitschrift für heute anlegen'],
    kanji: ['sec-kanji', 'data-new="kanji"', 'plus', 'Neues Kanji', 'Ein Zeichen speichern'],
    grammatik: ['sec-grammar', 'data-new="grammar"', 'plus', 'Neue Grammatik', 'Eine Regel aus dem Unterricht'],
    ausdruck: ['sec-phrase', 'data-new="phrase"', 'plus', 'Neuer Ausdruck', 'Redewendung oder Baustein'],
    karten: ['sec-practice', 'href="#/ueben/karten"', 'cards', 'Karteikarten', 'Frei üben nach Kartentyp'],
    schlange: ['sec-practice', 'href="#/ueben/heute?lernen=1"', 'practice', 'Lernschlange üben', 'Alles, was du lernst – ohne Termin'],
    einstufen: ['sec-practice', 'href="#/ueben/einstufen"', 'check', 'Einstufen', 'Ungeprüftes durchgehen'],
    uebersetzen: ['sec-practice', 'href="#/ueben/saetze"', 'edit', 'Übersetzen', 'Sätze selbst übersetzen'],
    konjugieren: ['sec-practice', 'href="#/ueben/konjugieren"', 'shuffle', 'Konjugieren', 'Verbformen üben'],
    schreiben: ['sec-kanji', 'href="#/ueben/kanji"', 'pen', 'Kanji schreiben', 'Mit dem Stift üben'],
    lernweg: ['sec-practice', 'href="#/lernweg"', 'list', 'Lernweg', 'Wie deine Wörter wandern'],
    karte: ['sec-grammar', 'href="#/karte"', 'map', 'Lernlandkarte', 'Grammatik Station für Station'],
    eingang: ['sec-vocab', 'href="#/eingang"', 'download', 'Eingang', 'Aus dem Browser übernommen'],
    suche: ['sec-home', 'href="#/suche"', 'search', 'Suche', 'Alles in der App durchsuchen'],
  };
  const QUICK_DEFAULT = ['saetze', 'vokabel', 'stunde'];
  const quickList = () => { const s = HO.parse(App.lsGet('homeActions')); return (s || QUICK_DEFAULT).filter((k) => QUICK[k]); };
  const GRIP = '<svg viewBox="0 0 12 18" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="1.6"/><circle cx="9" cy="3" r="1.6"/><circle cx="3" cy="9" r="1.6"/><circle cx="9" cy="9" r="1.6"/><circle cx="3" cy="15" r="1.6"/><circle cx="9" cy="15" r="1.6"/></g></svg>';
  const grip = (label) => `<button type="button" class="home-grip" data-grip aria-label="${esc(label)} verschieben" title="Am Griff ziehen – oder mit den Pfeiltasten verschieben">${GRIP}</button>`;
  const quickAct = (k) => { const [cls, attrs, ico, title, sub] = QUICK[k]; const tag = attrs.startsWith('href') ? 'a' : 'button'; return `<${tag} class="home-act ${cls}" ${attrs}><span class="i">${icon(ico)}</span><span><b>${title}</b><small>${sub}</small></span></${tag}>`; };
  const quickHtml = () => {
    const list = quickList();
    if (!homeEdit) return list.length ? `<div class="home-actions">${list.map(quickAct).join('')}</div>` : '';
    const rest = Object.keys(QUICK).filter((k) => !list.includes(k));
    return `<div class="home-live"><div class="home-actions" data-quick-list>${list.map((k) => { const [cls, , ico, title, sub] = QUICK[k]; return `<div class="home-act ${cls}" data-quick="${k}">${grip(title)}<span class="i">${icon(ico)}</span><span class="grow"><b>${title}</b><small>${sub}</small></span><button type="button" class="icon-btn" data-quick-off="${k}" title="Von der Startseite nehmen" aria-label="${title} entfernen">${icon('close')}</button></div>`; }).join('') || '<p class="small muted">Keine Schnellaktion gewählt – such dir unten welche aus.</p>'}</div>
      ${rest.length ? `<div class="quick-more"><span class="small muted">Weitere Schnellaktionen:</span>${rest.map((k) => `<button type="button" class="chip" data-quick-on="${k}">${icon('plus')} ${QUICK[k][3]}</button>`).join('')}</div>` : ''}</div>`;
  };
  // Leisten in gemerkter Reihenfolge; im Bearbeiten-Modus auch leere (z. B. JLPT ohne Paket), damit sie sich platzieren lassen
  const homeBlocks = (blocks) => HO.order(Object.keys(blocks), HO.parse(App.lsGet('homeOrder'))).map((k) => (blocks[k] || homeEdit
    ? `<section class="home-block" data-block="${k}">${homeEdit ? grip(BLOCK_LABEL[k]) : ''}${blocks[k] || `<div class="home-empty small muted">${BLOCK_LABEL[k]} – zurzeit nichts zu zeigen</div>`}</section>` : '')).join('');
  const saveList = (list) => {
    if (list.matches('[data-home-blocks]')) App.lsSet('homeOrder', JSON.stringify(Array.from(list.children).map((c) => c.dataset.block).filter(Boolean)));
    else if (list.matches('[data-quick-list]')) App.lsSet('homeActions', JSON.stringify(Array.from(list.children).map((c) => c.dataset.quick).filter(Boolean)));
  };

  // Ziehen am Griff: das Element schwebt mit, eine Lücke zeigt, wo es landet; am Bildschirmrand scrollt die Seite mit
  document.addEventListener('pointerdown', (e) => {
    const g = e.target.closest && e.target.closest('[data-grip]');
    if (!g || e.button > 0) return;
    const item = g.parentElement, list = item.parentElement;
    const attr = item.hasAttribute('data-block') ? 'data-block' : 'data-quick';
    e.preventDefault();
    const r = item.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top;
    let x = e.clientX, y = e.clientY, raf = 0, moved = false;
    const ph = document.createElement('div');
    ph.className = 'drag-ph';
    ph.style.height = r.height + 'px';
    const lift = () => {
      list.insertBefore(ph, item);
      Object.assign(item.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', zIndex: 60 });
      item.classList.add('dragging');
      document.body.classList.add('is-dragging');
      raf = requestAnimationFrame(tick);
    };
    const place = () => {
      item.style.left = (x - dx) + 'px'; item.style.top = (y - dy) + 'px';
      const others = Array.from(list.children).filter((c) => c !== item && c.hasAttribute(attr));
      if (!others.length) return;
      let target = null, before = true;
      for (const c of others) {
        const b = c.getBoundingClientRect();
        if (y >= b.top && y <= b.bottom && x >= b.left && x <= b.right) { target = c; before = b.width > list.clientWidth * 0.75 ? y < b.top + b.height / 2 : x < b.left + b.width / 2; break; }
      }
      if (!target) {
        const f = others[0].getBoundingClientRect(), l = others[others.length - 1].getBoundingClientRect();
        if (y < f.top) target = others[0];
        else if (y > l.bottom) { target = others[others.length - 1]; before = false; }
      }
      if (target) list.insertBefore(ph, before ? target : target.nextSibling);
    };
    const tick = () => {
      const edge = 80, v = y < edge ? -(edge - y) / 3 : y > innerHeight - edge ? (y - innerHeight + edge) / 3 : 0;
      if (v) { window.scrollBy(0, v); place(); }
      raf = requestAnimationFrame(tick);
    };
    const move = (ev) => {
      x = ev.clientX; y = ev.clientY;
      if (!moved) { if (Math.abs(x - e.clientX) + Math.abs(y - e.clientY) < 4) return; moved = true; lift(); }
      place();
    };
    const end = () => {
      g.removeEventListener('pointermove', move); g.removeEventListener('pointerup', end); g.removeEventListener('pointercancel', end);
      if (!moved) return;
      cancelAnimationFrame(raf);
      list.insertBefore(item, ph); ph.remove();
      ['position', 'left', 'top', 'width', 'zIndex'].forEach((p) => { item.style[p] = ''; });
      item.classList.remove('dragging');
      document.body.classList.remove('is-dragging');
      saveList(list);
    };
    try { g.setPointerCapture(e.pointerId); } catch (err) { /* egal */ }
    g.addEventListener('pointermove', move); g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  });
  // Ohne Ziehen: Pfeiltasten am Griff verschieben um einen Platz
  document.addEventListener('keydown', (e) => {
    const g = e.target.closest && e.target.closest('[data-grip]');
    const dir = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 }[e.key];
    if (!g || !dir) return;
    e.preventDefault();
    const item = g.parentElement, list = item.parentElement;
    const sib = dir < 0 ? item.previousElementSibling : item.nextElementSibling;
    if (!sib || !sib.querySelector(':scope > [data-grip]')) return;
    list.insertBefore(item, dir < 0 ? sib : sib.nextSibling);
    g.focus();
    saveList(list);
  });
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('[data-home-edit], [data-home-done], [data-home-reset], [data-quick-on], [data-quick-off], [data-read-on], [data-read-off]');
    if (!t) return;
    if (t.matches('[data-home-edit]')) { homeEdit = true; App.render(); return; }
    if (t.matches('[data-home-done]')) { homeEdit = false; App.render(); return; }
    if (t.matches('[data-home-reset]')) { App.lsSet('homeOrder', ''); App.lsSet('homeActions', ''); App.lsSet('homeRead', ''); App.render(true); App.toast && App.toast('Startseite wie am Anfang'); return; }
    if (t.dataset.readOn || t.dataset.readOff) {
      const rl = readList();
      App.lsSet('homeRead', JSON.stringify(t.dataset.readOn ? rl.concat(t.dataset.readOn) : rl.filter((k) => k !== t.dataset.readOff)));
      App.render(true);
      return;
    }
    const list = quickList();
    if (t.dataset.quickOn) App.lsSet('homeActions', JSON.stringify(list.concat(t.dataset.quickOn)));
    else App.lsSet('homeActions', JSON.stringify(list.filter((k) => k !== t.dataset.quickOff)));
    App.render(true);
  });

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
    const queues = [['vocab', 'Vokabeln', 'Vokabel'], ['kanji', 'Kanji', 'Kanji'], ['phrase', 'Ausdrücke', 'Ausdruck']].filter(([type]) => type !== 'kanji' || focus !== 'write').map(([type, label, one]) => {
      const { due, fresh } = App.cardQueue({ type, dir: 'jp' });
      return { label: due.length === 1 ? one : label, due: due.length, fresh: fresh.length, href: `#/ueben/karten?${type === 'vocab' ? '' : `type=${type}&`}${type === 'kanji' ? 'dir=jp&' : ''}auto=1` };
    });
    // Vokabeln aktiv (Deutsch → Japanisch): eigener Lernstand, direkt hinter den Vokabeln
    const aq = App.activeQueue();
    queues.splice(1, 0, { label: 'Vokabeln aktiv', due: aq.due.length, fresh: aq.fresh.length, href: '#/ueben/karten?dir=de&auto=1' });
    const wq = App.writeQueue();
    if (focus !== 'read') queues.splice(focus === 'write' ? 0 : 3, 0, { label: 'Kanji schreiben', due: wq.due.length, fresh: wq.fresh.length, href: '#/ueben/kanji?auto=1' });
    // Fälliges läuft über einen Knopf: eine gemischte Runde quer durch alles (auch Kanji schreiben). Fällig gilt für den ganzen Tag.
    const dueQ = App.todayParts(), due = dueQ.reduce((n, x) => n + x.n, 0), tomorrow = App.dueTomorrow();
    const next = queues.find((x) => x.fresh);
    // „Wiederholen“ startet nur Fälliges – ohne Fälliges ist der Knopf aus, Neues kommt nie von selbst dazu
    const repeatBtn = (ico, n, href) => (n ? `<a class="btn btn-sec" href="${href}">${icon(ico)} Wiederholen <span class="badge">${n}</span></a>` : `<button class="btn" disabled title="Gerade ist nichts fällig">${icon(ico)} Wiederholen</button>`);
    const vocab = App.itemsOf('vocab');
    const sessions = App.itemsOf('session').sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    const recent = Array.from(S.items.values()).filter((i) => i.created && i.type !== 'session' && i.type !== 'notebook' && !App.APPLY_TYPES.includes(i.type)).sort((a, b) => b.created - a.created).slice(0, 8);
    const stat = (t, n, sub) => { const s = App.SECTIONS[t]; return `<a class="stat ${s.cls}" href="${s.route}"><span class="bg">${s.jp}</span><span class="n">${n}</span><span class="l">${s.label}</span><span class="s">${sub}</span></a>`; };
    // Genki-Freischaltung: auf der Startseite nur, solange sie noch aussteht (nicht bei none/open)
    const genkiCard = App.genki && ['locked', 'stale'].includes(App.genki.state()) ? `<div style="margin-bottom:18px">${App.genki.card()}</div>` : '';
    const blocks = {
      hero: `<div class="hero"><div class="big-jp">日本語</div>
        <h1 lang="ja">${greet}${name ? '、' + esc(name) + 'さん' : ''}！</h1>
        <p>${due ? `Heute: <b>${due} ${due === 1 ? 'Karte' : 'Karten'}</b> – ${dueQ.map((x) => `${x.n} ${x.n === 1 ? x.one : x.label}`).join(' · ')}` : `Für heute ist alles wiederholt${next ? ' – wenn du magst, ist Zeit für neue Karten.' : '.'}`}</p>
        <div class="row">${due ? `<a class="btn solid" href="#/ueben/heute?auto=1">${icon('shuffle')} Jetzt wiederholen <span class="badge">${due}</span></a>` : `<a class="btn solid" href="${next ? next.href : '#/ueben/karten'}">${icon(next ? 'play' : 'practice')} ${next ? 'Neue Karten lernen' : 'Karteikarten'}</a>`}${App.refresh.button()}</div>
        <p class="small" style="margin-top:10px">${due ? 'Alles gemischt in einer Runde' : ''}${due && tomorrow ? ' · ' : ''}${tomorrow ? `morgen ${tomorrow === 1 ? 'kommt 1 Karte' : `kommen ${tomorrow} Karten`} dazu` : ''}</p></div>`,
      actions: quickHtml(),
      read: readStrip(),
      sammlung: `<div class="section-title">Deine Sammlung <span style="text-transform:none;letter-spacing:0;font-weight:600">· alles, was in der App steht</span></div>
      <div class="stat-grid" style="margin-top:0">
        ${stat('grammar', count('grammar'), 'Grammatikpunkte')}
        ${stat('vocab', count('vocab'), 'Wörter')}
        ${stat('session', count('session'), 'Stunden mitgeschrieben')}
        ${stat('kanji', count('kanji'), 'Kanji')}
        ${stat('phrase', count('phrase'), 'Ausdrücke & Bausteine')}
      </div>`,
      vocab: (() => { // Jedes Wort zählt einmal: „kann ich“ erst, wenn Lesen und Deutsch → Japanisch sitzen – wie beim JLPT- und Genki-Lernstand
        const c = progOf({ vocab }).tot;
        const num = (n, color, label, st, title) => `<a href="#/vokabeln?st=${st}" style="text-decoration:none" title="${title}"><b style="font-size:26px;color:${color}">${n}</b> ${label}</a>`;
        return `${foldHead('vocab', 'Vokabel-Lernstand', `${c.known} / ${c.total} kann ich`)}
      <div class="card sec-vocab${foldCls('vocab')}"><div class="row between"><div class="row" style="gap:28px">
        ${num(c.known, 'var(--matcha)', 'kann ich', 'known', 'Lesen und Deutsch → Japanisch sitzen – wird nicht mehr abgefragt')}
        ${num(c.queue, 'var(--ai)', 'in der Lernschlange', 'queue', 'Schon gewusst oder beim Einstufen auf „Lernen“ gesetzt – kommt von selbst über „Jetzt wiederholen“, bis es sitzt')}
        ${num(c.open, 'var(--muted)', 'warten noch auf dich', 'open', 'Noch ungeprüft – beim Lesen oder bei Deutsch → Japanisch. Einstufen oder neue lernen holt sie in die Lernschlange')}</div>
        <span class="row">${cardBtns({ vocab }, '')}</span></div>
        ${progBar(c)}</div>`; })(),
      jlpt: jlptCard(),
      genki: genkiLevelCard(),
      kanji: (() => { const c = App.vocabCounts(App.itemsOf('kanji').filter((k) => k.char !== '々')); const pc = (n) => (c.total ? (n / c.total) * 100 : 0); const inClass = App.itemsOf('kanji').filter((k) => App.hasMark(k, App.MARK_CLASS)).length; return `${foldHead('kanji', 'Kanji-Lernstand', `${c.known} / ${c.total} kann ich`)}
      <div class="card sec-kanji${foldCls('kanji')}"><div class="row between"><div class="row" style="gap:22px">
        <a href="#/kanji?st=learn" style="text-decoration:none"><b style="font-size:26px;color:var(--ai)">${c.learn}</b> im Lernstapel</a>
        <a href="#/kanji?st=known" style="text-decoration:none"><b style="font-size:26px;color:var(--matcha)">${c.known}</b> kann ich</a>
        <a href="#/kanji?mark=${encodeURIComponent(App.MARK_CLASS)}" style="text-decoration:none"><b style="font-size:26px;color:var(--shu)">${inClass}</b> im Unterricht</a>
        ${App.checkOn() ? `<a class="small muted" href="#/kanji?st=unchecked" style="text-decoration:none"><b style="font-size:16px">${c.unchecked}</b> ungeprüft</a>` : ''}</div>
        <div class="row">${focus === 'write' ? '' : repeatBtn('play', App.cardQueue({ type: 'kanji', dir: 'jp' }).due.length, '#/ueben/karten?type=kanji&dir=jp&round=due')}${c.unchecked ? `<a class="btn" href="#/ueben/einstufen?type=kanji&auto=1">${icon('check')} Nächste ${Math.min(c.unchecked, S.settings.checkBatch || 15)} einstufen</a>` : ''}</div></div>
        <div class="progress" style="display:flex;height:10px;margin-top:12px"><i style="width:${pc(c.known)}%;background:var(--matcha);border-radius:0"></i><i style="width:${pc(c.learn)}%;background:var(--ai);border-radius:0"></i></div>
        ${(() => { if (focus === 'read') return ''; const w = App.writeLogic.counts(wq.items, S.srs, wq.unlocked); const newN = Math.min(wq.fresh.length, S.settings.newPerDay); return `<div class="row between" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--line)"><div class="row" style="gap:22px"><b>Schreiben</b>
          <span><b style="font-size:20px;color:var(--matcha)">${w.known}</b> kann ich</span>
          <span><b style="font-size:20px;color:var(--ai)">${w.learn}</b> übe ich</span>
          <span><b style="font-size:20px;color:var(--muted)">${w.new}</b> noch nie geschrieben</span></div>
          <div class="row">${repeatBtn('pen', wq.due.length, '#/ueben/kanji?round=due')}${newN ? `<a class="btn ${wq.due.length ? '' : 'btn-sec'}" href="#/ueben/kanji?round=new">${icon('plus')} Neue schreiben <span class="badge">${newN}</span></a>` : ''}</div></div>`; })()}</div>`; })(),
      bottom: `<div class="home-bottom">
        <div class="card sec-session"><div class="row between"><h3>授業 Letzte Unterrichtsstunden</h3><a class="btn btn-sm" href="#/unterricht">Alle</a></div>
          <div class="rel-list">${sessions.slice(0, 4).map(App.relItem).join('') || '<p class="muted">Noch keine Stunde angelegt.</p>'}</div></div>
        <div class="card"><div class="row between"><h3>Zuletzt gespeichert</h3></div>
          <div class="rel-list">${recent.map(App.relItem).join('') || '<p class="muted">Hier erscheinen deine eigenen Einträge – z. B. neue Wörter aus NHK Easy. Tippe oben auf <b>Speichern</b>.</p>'}</div></div>
        ${App.dayCheck.card()}
      </div>`,
    };
    view.innerHTML = `<div class="sec-home${homeEdit ? ' home-editing' : ''}">
      ${App.welcome.card()}
      <div data-backup-home>${App.backup.homeCard({ noRestoreHint: !!App.welcome.card() })}</div>
      ${genkiCard}
      ${homeEdit ? `<div class="home-editbar"><span><b>Startseite anpassen</b><span class="hint"> · Leisten und Schnellaktionen am Griff ziehen. Gilt nur für dieses Gerät.</span></span><span class="row"><button class="btn btn-sm" data-home-reset>Zurücksetzen</button><button class="btn btn-sm btn-primary" data-home-done>${icon('check')} Fertig</button></span></div>` : ''}
      <div data-home-blocks>${homeBlocks(blocks)}</div>
      ${homeEdit ? '' : `<div class="home-edit-foot"><button class="btn btn-sm" data-home-edit>${icon('edit')} Startseite anpassen</button></div>`}
      </div>`;
    const nv = view.querySelector('[data-new-vocab]');
    if (nv) nv.onclick = () => App.editItem({ type: 'vocab' });
  });

  // =========================================================
  // Vokabeln
  // =========================================================
  App.route('/vokabeln', (view, p, q) => {
    const sec = App.SECTIONS.vocab;
    const all = App.itemsOf('vocab');
    let items = filterItems(all, q);
    if (q.pos) items = items.filter((i) => i.pos === q.pos);
    // Lernstand wie auf der Startseite (beide Richtungen); alte Links mit dem Lese-Stand (unchecked/learn) gehen weiter
    if (q.st) items = items.filter((i) => (App.WORD_STATE[q.st] ? App.wordState(i) : App.vocabStatus(i.id)) === q.st);
    items.sort(byLesson);
    const mode = q.view || (App.lsGet('vocabView') || 'cards');
    const files = App.filesFor({ section: 'vocab', source: q.src || undefined, lesson: q.l || undefined });
    const cardsQs = new URLSearchParams(Object.fromEntries(Object.entries({ type: 'vocab', src: q.src, l: q.l, lvl: q.lvl }).filter(([, v]) => v))).toString();
    const unchecked = App.vocabCounts(filterItems(all, { src: q.src, l: q.l, lvl: q.lvl })).unchecked;
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${pageHead(sec, 'Alle Wörter mit Lesung, Kanji, Übersetzung und Beispielsätzen – nach Quelle und Lektion sortiert.',
      `<button class="btn" data-action="import-vocab">${icon('upload')} Importieren</button><a class="btn" href="#/saetze">${icon('sparkle')} Sätze zuordnen</a>${App.checkOn() ? `<a class="btn" href="#/ueben/einstufen?${cardsQs.replace(/type=vocab&?/, '')}">${icon('check')} Einstufen${unchecked ? ` <span class="badge">${unchecked}</span>` : ''}</a>` : ''}<a class="btn" href="#/ueben/karten?${cardsQs}">${icon('practice')} Karteikarten</a><button class="btn btn-sec" data-new="vocab">${icon('plus')} Vokabel</button>`)}
      ${tabsHtml(q, items.length, files.length)}
      <div class="toolbar">${filterInput(q, 'In Vokabeln suchen …')}<span class="grow"></span><div class="seg"><button class="${mode === 'cards' ? 'on' : ''}" data-mode="cards">${icon('cards')}</button><button class="${mode === 'list' ? 'on' : ''}" data-mode="list">${icon('list')}</button></div>
        <div class="filter-row">${App.sourceSelect(all, q.src)}${App.lessonSelect(all.filter((i) => App.srcMatch(i, q.src)), q.l)}
        <select class="input" data-q-select="pos"><option value="">Wortart</option>${Object.entries(App.POS).map(([k, l]) => `<option value="${k}" ${q.pos === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
        ${App.levelSelect(q.lvl)}
        <select class="input" data-q-select="st"><option value="">Lernstand</option>${Object.entries(App.WORD_STATE).map(([k, x]) => `<option value="${k}" ${q.st === k ? 'selected' : ''}>${x.dot} ${x.label}</option>`).join('')}</select>
        <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Gemerkt</button></div></div>
      <div data-body style="margin-top:14px"></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('vocab', q);
    else if (!items.length) body.innerHTML = `<div class="empty-state"><div class="big">単</div><h3>Keine Vokabeln gefunden</h3><p>Passe die Filter an oder lege ein neues Wort an.</p></div>`;
    else {
      const groups = groupBySource(items, q.src);
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
      const forms = [['masu', 'höflich'], ['masen', 'höflich, verneint'], ['mashita', 'höflich, Vergangenheit'], ['masendeshita', 'höfl. Verg. verneint'], ['te', 'て-Form'], ['nai', 'Kurzform verneint'], ['ta', 'Kurzform Vergangenheit'], ['nakatta', 'Kurzform Verg. verneint'], ['tai', 'möchte …'], ['mashou', 'lass uns …'], ['potential', 'Potential (können)'], ['volitional', 'Volitional (lass uns …)']].filter(([f]) => f !== 'potential' || !JP.noPotential(it));
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
    if (nw) { const q = App.parseHash().query; App.editItem({ type: nw.dataset.new, defaults: { source: App.oneSrc(q.src) || undefined, lesson: q.l || undefined, group: q.g || undefined } }); return; }
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
          <dl class="kv">${it.level ? `<dt>JLPT</dt><dd>${App.levelBadge(it)}</dd>` : ''}<dt>Lesung</dt><dd lang="ja" style="font-size:18px">${esc(it.kana)}</dd>${App.accentHtml(it) ? `<dt>Pitch Accent</dt><dd>${App.accentHtml(it)}</dd>` : ''}
          ${it.kanji ? `<dt>Kanji</dt><dd lang="ja" style="font-size:18px">${Array.from(it.kanji).map((c) => App.kanjiByChar(c) ? `<a href="#/kanji/${encodeURIComponent(c)}" style="text-decoration:none;border-bottom:2px solid var(--murasaki)">${esc(c)}</a>` : esc(c)).join('')}</dd>` : ''}
          ${it.pos ? `<dt>Wortart</dt><dd>${esc(App.POS[it.pos] || it.pos)} ${App.verbClsBadge(it)}</dd>` : ''}
          ${App.homophoneHint(it)}
          <dt>Quelle</dt><dd>${App.srcBadge(it) || '–'} ${it.sourceRef ? refLink(it.sourceRef) : ''}</dd>
          ${it.tags && it.tags.length ? `<dt>Schlagwörter</dt><dd>${App.tagsHtml(it.tags)}</dd>` : ''}
          <dt>Lesen <small class="muted" style="font-weight:400">Japanisch → Deutsch</small></dt><dd><div class="seg" data-vst>${App.statusChoices(it).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <div class="small muted" style="margin-top:4px">${App.writeLogic.inQueue(srs) ? App.srsNote(srs) : App.vocabStatus(it.id) === 'learn' ? 'kommt mit „neue lernen“ in die Lernschlange' : it._wk ? `bei WaniKani gelernt${(() => { const w = App.wk.vInfo(it); return w ? ` (Level ${w.level} · ${w.name})` : ''; })()} – wird hier nur Deutsch → Japanisch gefragt` : 'noch ungeprüft – einstufen oder „neue lernen“ holt es in die Lernschlange'}</div></dd>
          <dt>Aktiv <small class="muted" style="font-weight:400">Deutsch → Japanisch</small></dt><dd>${(() => { const ast = App.activeStatus(it), as = App.srsOf(App.writeLogic.id(it.id)); return `<div class="seg" data-ast>${App.statusChoices(it).map(([k, s]) => `<button class="${ast === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <div class="small muted" style="margin-top:4px">${ast === 'locked' ? 'kommt dran, sobald du das Wort lesen kannst' : App.writeLogic.activeAsked(S.srs, it) ? App.srsNote(as) : ast === 'learn' ? 'kommt mit „neue lernen“ in die Lernschlange' : 'noch ungeprüft – einstufen oder „neue lernen“ holt es in die Lernschlange'}</div>`; })()}</dd></dl></div>
        ${(it.contexts || []).length ? `<div class="section-title">Kontext – wo du das Wort gefunden hast</div>${it.contexts.map((c) => { const s = c.sessionId && App.item(c.sessionId); const o = !s && c.itemId && App.item(c.itemId); const x = !s && !o && c.exerciseId; return `<div class="ctx"><div class="small"><b>${s ? `<a href="${App.link(s)}">授業 ${esc(s.number ? 'Stunde ' + s.number : s.title || 'Unterricht')}</a>` : o ? `<a href="${App.link(o)}">${esc(c.label || 'Anwenden')}</a>` : x ? `<a href="#/aufgabe/${encodeURIComponent(x)}">${esc(c.label || 'Buchaufgabe')}</a>` : esc(c.label || 'Notiz')}</b> · ${App.fmtDate(c.date)}</div>${c.text ? `<div class="jp-s" lang="ja">${App.highlightWord(c.text, it)}</div>` : ''}</div>`; }).join('')}` : ''}
        ${App.useHtml(it)}
        ${it.examples && it.examples.length ? `<div class="section-title">Beispielsätze</div>${it.examples.map(App.exampleHtml).join('')}` : ''}
        ${conjTable(it)}
        ${it.notes ? `<div class="section-title">Notizen</div><div class="card prose">${JP.md(it.notes)}</div>` : ''}
        ${App.attachmentsHtml(it)}
      </div><aside>${App.relatedHtml(it) || '<div class="card muted small">Noch keine verwandten Einträge. Mit „Verknüpfen“ kannst du selbst Verbindungen herstellen.</div>'}</aside></div></div>`;
    App.hydrateThumbs(view);
    view.querySelector('[data-vst]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { const snap = App.srsSnap([it.id]); await App.setCheck(it.id, b.dataset.v); App.undoToast('Lernstand: ' + App.statusInfo(it, b.dataset.v).label, snap, () => App.render(true)); App.render(true); } };
    view.querySelector('[data-ast]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { const snap = App.srsSnap([App.writeLogic.id(it.id)]); await App.setCheck(App.writeLogic.id(it.id), b.dataset.v); App.undoToast('Aktiv-Lernstand: ' + App.statusInfo(it, b.dataset.v).label, snap, () => App.render(true)); App.render(true); } };
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
      <div class="toolbar">${filterInput(q, 'Grammatik suchen, z. B. て-Form, Vergleich …')}<div class="filter-row">${App.sourceSelect(all, q.src)}${App.lessonSelect(all.filter((i) => App.srcMatch(i, q.src)), q.l)}
      ${App.levelSelect(q.lvl)}<select class="input" data-q-select="st"><option value="">Lernstand</option>${App.statusChoices({ type: 'grammar' }).map(([k, s]) => `<option value="${k}" ${q.st === k ? 'selected' : ''}>${s.dot} ${s.label}</option>`).join('')}</select>
      <button class="chip ${q.star ? 'on' : ''}" data-q-star="${q.star ? '' : '1'}">${icon('star')} Gemerkt</button></div></div>
      <div data-body style="margin-top:14px"></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('grammar', q);
    else if (!items.length) body.innerHTML = '<div class="empty-state"><div class="big">文</div><h3>Keine Grammatik gefunden</h3></div>';
    else {
      let html = '';
      groupBySource(items, q.src).forEach((list, key) => {
        // Genki-Lektion: passende Folgen von Japanese with Shun (js/shun.js) unter der Überschrift
        const shun = App.shunUi && key === lessonKey(list[0]) ? App.shunUi.lessonBox(list[0].source, +list[0].lesson) : '';
        html += `<div class="group-head"><h2>${esc(key)}</h2><span class="badge">${list.length}</span><span class="line"></span></div>${shun}<div class="grid cols-3">${list.map(App.grammarCard).join('')}</div>`;
      });
      body.innerHTML = html;
    }
    App.hydrateThumbs(body);
    bindFilter(view);
  });
  // Formen-Tabelle(n) eines Grammatikpunkts (Feld table, eine oder eine Liste mit title): Zelle = „Japanisch|Deutsch“, leer = gibt es so nicht
  const grammarTable = (t) => (Array.isArray(t) ? t.map(grammarTable).join('') : t && (t.rows || []).length ? `<div class="section-title">${esc(t.title || 'Übersicht')}</div><div class="gtable-wrap"><table class="gtable${(t.cols || []).length <= 3 ? ' gtable-small' : ''}">
    <thead><tr>${(t.cols || []).map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${t.rows.map(([head, ...cells]) => `<tr><th>${esc(head)}</th>${cells.map((c) => {
      const [jp, de] = String(c || '').split('|');
      return jp ? `<td><span class="jp" lang="ja">${JP.ruby(jp)}</span>${de ? `<span class="small muted">${esc(de)}</span>` : ''}</td>` : '<td class="muted">–</td>';
    }).join('')}</tr>`).join('')}</tbody></table></div>` : '');
  App.route('/grammatik/:id', (view, p) => {
    const it = App.item(p.id);
    if (!it) { view.innerHTML = '<div class="empty-state"><h3>Nicht gefunden</h3></div>'; return; }
    const sec = App.SECTIONS.grammar;
    const sessions = App.sessionsFor(it.id);
    const srs = App.srsOf(it.id);
    // vor/zurück in der Reihenfolge der Grammatikliste (Quelle, Lektion, Buchreihenfolge)
    const order = App.itemsOf('grammar').slice().sort(byLesson);
    const at = order.findIndex((g) => g.id === it.id);
    const prev = order[at - 1], next = order[at + 1];
    const hop = (g, fwd) => `<a class="btn btn-sm" href="${App.link(g)}" title="${fwd ? 'Nächster' : 'Vorheriger'} Grammatikpunkt: ${esc(g.title)}">${fwd ? '' : icon('back')}<span style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(g.title)}</span>${fwd ? icon('next') : ''}</a>`;
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="row between">${crumbs(sec, it)}<div class="row">${prev ? hop(prev) : ''}${next ? hop(next, true) : ''}</div></div>
      <div class="split"><div>
        <div class="card pad-lg"><div class="row between" style="align-items:flex-start"><div>
          <div lang="ja" style="font-size:30px;color:var(--sec);line-height:1.6">${JP.ruby(it.jp || '')}</div>
          <h1 style="font-size:26px;margin-top:4px">${esc(it.title)}</h1></div><div class="row">${detailActions(it)}</div></div>
          <p style="font-size:17px;color:var(--ink-2);margin:10px 0 12px">${esc(it.summary || '')}</p>
          <div class="row">${App.srcBadge(it)} ${App.tagsHtml(it.tags)}
          ${sessions.map((s) => `<a class="badge src" style="--c:var(--shu);text-decoration:none" href="${App.link(s)}">授業 ${esc(s.number ? 'Stunde ' + s.number : s.title)} · ${App.fmtDate(s.date)}</a>`).join('')}</div>
          <div class="row" style="margin-top:14px;align-items:center"><span class="small muted">Lernstand</span><div class="seg" data-vst>${App.statusChoices(it).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <span class="small muted">${App.vocabStatus(it.id) === 'known' ? 'zählt für deinen Lernstand bei Genki und JLPT' : 'Setz den Haken selbst, wenn du den Punkt kannst – Grammatik wird nicht abgefragt'}</span></div></div>
        ${it.structure && it.structure.length ? `<div class="section-title">Aufbau</div><div class="structure">${it.structure.map((s) => `<div>${JP.ruby(s)}</div>`).join('')}</div>` : ''}
        ${grammarTable(App.drillLogic.field(it, 'table'))}
        ${it.explanation ? `<div class="section-title">Erklärung</div><div class="card prose">${JP.md(it.explanation)}</div>` : ''}
        ${it.examples && it.examples.length ? `<div class="section-title">Beispiele</div>${it.examples.map(App.exampleHtml).join('')}` : ''}
        ${it.pitfalls && it.pitfalls.length ? `<div class="section-title">Stolperfallen</div>${it.pitfalls.map((x) => `<div class="pitfall">${JP.ruby(x)}</div>`).join('')}` : ''}
        ${it.notes ? `<div class="section-title">Notizen</div><div class="card prose">${JP.md(it.notes)}</div>` : ''}
        <div class="section-title">Üben</div>
        <div class="row"><a class="btn btn-sec" href="#/ueben/saetze?g=${encodeURIComponent(it.id)}">${icon('sparkle')} Übersetzungsübung zu diesem Thema</a>
        ${App.drillLogic.field(it, 'drill') ? `<a class="btn btn-sec" href="#/ueben/umformen?g=${encodeURIComponent(it.id)}">${icon('edit')} ${App.drillLogic.field(it, 'drill') === 'zeit' ? 'Welche Form? üben' : 'Umformen üben'}</a>` : ''}
        <span class="small muted">${(it.patterns || []).length ? `${it.patterns.length} Satzmuster + Beispielsätze` : 'Nutzt die Beispielsätze dieses Punktes'}</span></div>
        ${App.exercises.grammarBlock(it)}
        ${App.attachmentsHtml(it)}
      </div><aside>${App.relatedHtml(it)}</aside></div></div>`;
    App.hydrateThumbs(view);
    App.exercises.hydrate(view);
    view.querySelector('[data-vst]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { const snap = App.srsSnap([it.id]); await App.setCheck(it.id, b.dataset.v); App.undoToast('Lernstand: ' + App.statusInfo(it, b.dataset.v).label, snap, () => App.render(true)); App.render(true); } };
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
    if (q.st) items = items.filter((i) => App.vocabStatus(i.id) === q.st);
    const unchecked = App.vocabCounts(q.g ? all.filter((i) => i.group === q.g) : all).unchecked;
    const files = App.filesFor({ section: 'phrase', source: q.src || undefined });
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}">${pageHead(sec, 'Floskeln, Zeitangaben, Zahlen, Zähler & Satzbausteine – alles, was man einfach auswendig lernen muss.',
      `${App.checkOn() ? `<a class="btn" href="#/ueben/einstufen?type=phrase${q.g ? '&g=' + encodeURIComponent(q.g) : ''}">${icon('check')} Einstufen${unchecked ? ` <span class="badge">${unchecked}</span>` : ''}</a>` : ''}<a class="btn" href="#/ueben/karten?type=phrase${q.g ? '&g=' + encodeURIComponent(q.g) : ''}">${icon('practice')} Karteikarten</a><button class="btn" data-new-group>${icon('plus')} Neue Gruppe</button><button class="btn btn-sec" data-new="phrase">${icon('plus')} Ausdruck</button>`)}
      ${tabsHtml(q, items.length, files.length)}
      <div class="toolbar">${filterInput(q, 'Suchen, z. B. Montag, 3 Uhr, ひとつ …')}<select class="input" data-q-select="st"><option value="">Lernstand</option>${App.statusFilter(q.st)}</select></div>
      <div class="chips scroll" style="margin-bottom:16px"><button class="chip ${!q.g ? 'on' : ''}" data-q-g="">Alle Gruppen</button>${groupsOrder.map((g) => `<button class="chip ${q.g === g ? 'on' : ''}" data-q-g="${esc(g)}">${esc(g)}</button>`).join('')}<button class="chip" data-new-group>${icon('plus')} Gruppe</button></div>
      <div data-body></div></div>`;
    const body = view.querySelector('[data-body]');
    if (q.tab === 'files') body.innerHTML = filesTab('phrase', q);
    else {
      const gm = groupBy(items, (i) => i.group);
      const showEmpty = !q.f && !q.src && !q.l && !q.star && !q.st;
      const gs = groupsOrder.filter((g) => gm.has(g) || (showEmpty && custom.includes(g) && (!q.g || q.g === g)));
      body.innerHTML = gs.map((g) => {
        const list = (gm.get(g) || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        return `<div class="card" style="margin-bottom:16px"><div class="row between" style="margin-bottom:8px"><h3 style="margin:0">${esc(g)} <span class="badge">${list.length}</span></h3>
          <div class="row">${list.length ? `<a class="btn btn-sm" href="#/ueben/karten?type=phrase&g=${encodeURIComponent(g)}">${icon('practice')} Lernen</a>` : ''}<button class="btn btn-sm btn-ghost" data-group="${esc(g)}" title="Ausdruck hinzufügen">${icon('plus')}</button><button class="btn btn-sm btn-ghost" data-edit-group="${esc(g)}" title="Gruppe umbenennen oder löschen">${icon('edit')}</button></div></div>
          ${list.length ? `<div class="list" style="box-shadow:none">${list.map((it) => `<a class="list-row" href="${App.link(it)}" style="grid-template-columns:minmax(160px,1.2fr) minmax(140px,1fr) minmax(120px,1.2fr) auto"><span class="k" lang="ja">${JP.ruby(it.jp)}</span><span><b>${esc(it.de)}</b></span><span class="small muted">${esc(JP.plain(it.note || ''))}</span><span class="row" style="gap:8px;flex-wrap:nowrap">${App.statusBadge(it.id)}${App.speakBtn(it.jp)}</span></a>`).join('')}</div>`
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
    const srs = S.srs.get(it.id);
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs"><a href="#/ausdruecke">Ausdrücke</a> › <a href="#/ausdruecke?g=${encodeURIComponent(it.group)}">${esc(it.group)}</a></div>
      <div class="split"><div><div class="card pad-lg"><div class="row between" style="align-items:flex-start">
        <div class="detail-hero"><div class="big" lang="ja">${JP.ruby(it.jp)}</div>${App.speakBtn(it.jp, '')}</div><div class="row">${detailActions(it)}</div></div>
        <div class="de-big" style="margin:4px 0 12px">${esc(it.de)}</div>
        ${it.note ? `<div class="pitfall" style="background:var(--yamabuki-soft);border-color:var(--yamabuki)">${JP.ruby(it.note)}</div>` : ''}
        <dl class="kv" style="margin-top:14px"><dt>Lesung</dt><dd lang="ja">${esc(JP.kana(it.jp))}</dd><dt>Gruppe</dt><dd>${esc(it.group)}</dd><dt>Quelle</dt><dd>${App.srcBadge(it) || '–'}</dd>
        ${it.tags && it.tags.length ? `<dt>Schlagwörter</dt><dd>${App.tagsHtml(it.tags)}</dd>` : ''}
          <dt>Lernstand</dt><dd><div class="seg" data-vst>${App.statusChoices(it).map(([k, s]) => `<button class="${App.vocabStatus(it.id) === k ? 'on' : ''}" data-v="${k}" style="color:${s.color}">${s.dot} ${s.label}</button>`).join('')}</div>
            <div class="small muted" style="margin-top:4px">${App.writeLogic.inQueue(srs) ? App.srsNote(srs) : App.vocabStatus(it.id) === 'learn' ? 'kommt mit „neue lernen“ in die Lernschlange' : 'noch ungeprüft – einstufen oder „neue lernen“ holt es in die Lernschlange'}</div></dd></dl></div>
        ${App.attachmentsHtml(it)}</div><aside>${App.relatedHtml(it)}</aside></div></div>`;
    App.hydrateThumbs(view);
    view.querySelector('[data-vst]').onclick = async (e) => { const b = e.target.closest('[data-v]'); if (b) { const snap = App.srsSnap([it.id]); await App.setCheck(it.id, b.dataset.v); App.undoToast('Lernstand: ' + App.statusInfo(it, b.dataset.v).label, snap, () => App.render(true)); App.render(true); } };
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
    const fileRes = q.q ? Array.from(S.files.values()).filter((f) => !inText.has(f.id) && !f.exerciseId).filter((f) => (f.name + ' ' + (f.tags || []).join(' ') + ' ' + (f.note || '')).toLowerCase().includes(q.q.toLowerCase().replace(/^#/, ''))) : [];
    view.innerHTML = `<div class="page-head"><div class="titles"><h1>Suche <span class="jp-title">検索</span></h1><p>${res.length + fileRes.length + textRes.length} Treffer für „${esc(q.q || '')}“${JP.looksRomaji(q.q) ? ` · auch als <span lang="ja">${esc(JP.romaji(q.q))}</span>` : ''}</p></div></div>
      ${['vocab', 'grammar', 'kanji', 'phrase', 'session', 'prompt', 'answer', 'journal', 'notebook'].filter((t) => groups.has(t)).map((t) => {
        const s = App.SECTIONS[t];
        const list = groups.get(t);
        const inner = t === 'kanji' ? `<div class="kanji-grid">${list.map(App.kanjiTile).join('')}</div>`
          : t === 'vocab' ? `<div class="grid cols-4">${list.map(App.vocabCard).join('')}</div>`
          : t === 'grammar' ? `<div class="grid cols-3">${list.map(App.grammarCard).join('')}</div>`
          : `<div class="card"><div class="rel-list">${list.map(App.relItem).join('')}</div></div>`;
        return `<div class="${s.cls}"><div class="group-head"><h2>${s.label}</h2><span class="badge">${list.length}</span><span class="line"></span></div>${inner}</div>`;
      }).join('')}
      ${fileRes.length ? `<div class="sec-library"><div class="group-head"><h2>Dateien</h2><span class="line"></span></div><div class="file-grid" data-fixed>${fileRes.map(App.fileCard).join('')}</div></div>` : ''}
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
