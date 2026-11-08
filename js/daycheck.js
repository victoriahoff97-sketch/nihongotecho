/* Nihongo Techō – Tagesliste „今日“ unten auf der Startseite: feste To-dos, die sich (meist) selbst abhaken, plus eigene */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.store;
  const L = App.dayCheckLogic;
  const NHK_URL = 'https://news.web.nhk/news/easy/';

  const log = () => S.settings.dayLog;
  const cfg = () => S.settings.dayGoals; // eigene Ziele (js/daycheck-logic.js D.goals), null = wie am Anfang
  const goals = () => L.goals(cfg());

  // Japanisch angewendet: ein Tagebucheintrag oder eine Smalltalk-Antwort von heute, in der etwas steht
  const appliedOn = (date) => App.itemsOf('journal').concat(App.itemsOf('answer')).some((it) => it.date === date && App.applyHasContent(it));
  const appliedToday = () => appliedOn(App.today()) || L.isDone(log(), App.today(), 'forum'); // oder der Forum-Satz des Tages (js/forum.js)
  // Tagesabschluss: steht im dayLog noch ein vergangener Tag, dessen Ziele in dayHistory übernehmen (vereinigt), bevor
  // irgendetwas das Log für heute neu anlegt. Läuft beim Start (js/main.js), vor jedem Schreiben ins dayLog und in state()
  let closed = '';
  const closeDay = async () => {
    const lg = S.settings && log();
    if (!lg || !lg.date || closed === lg.date || !(lg.date < App.today())) return;
    closed = lg.date;
    const next = L.closeHistory(S.settings.dayHistory, lg, cfg(), appliedOn(lg.date), App.today());
    if (next) await App.saveSettings({ dayHistory: next }, { silent: true });
  };
  // Was heute erledigt ist – für jeden Punkt (eingebaut und eigene)
  // Achtung: state() schreibt nebenbei den Tagesstand in settings.dayHistory (snapshot), auch wenn check() es aufruft
  const state = () => {
    closeDay();
    const g = goals(), t = App.today(), st = {};
    L.list(cfg()).forEach(({ key }) => { st[key] = L.isDone(log(), t, key); });
    st.review = L.reviewDone(log(), t, App.todayParts().length, g.reviews); // gewählte Karten oder alles, was heute fällig war
    st.apply = appliedToday();
    st.listen = L.listenDone(log(), t, g.listenMin * 60);
    snapshot(st);
    return st;
  };
  // Für die Flammen: den berechneten Stand von heute festhalten (Wiederholen, Anwenden, Listening stehen nicht im dayLog).
  // Gespeichert wird nur bei Änderung; das Speichern löst keine Neuberechnung aus, die wieder speichert.
  const snapshot = (st) => {
    if (!S.settings) return;
    const keys = L.withAll(L.goalKeys(cfg()).filter((k) => st[k]), cfg()); // „*“ = alle geschafft (Gesamt-Flamme)
    const next = L.recordDay(S.settings.dayHistory, App.today(), keys);
    if (next) App.saveSettings({ dayHistory: next });
  };
  const flameInfo = () => {
    const keys = L.goalKeys(cfg()), t = App.today();
    const off = App.streakLogic.offDays(S.settings.vacationLog, App.pause && App.pause.vacation ? App.pause.vacation() : S.settings.vacation, t);
    return L.flameInfo(S.settings.dayHistory, keys, off, t);
  };
  const ddmm = (d) => d.slice(8) + '.' + d.slice(5, 7) + '.';
  const flame = (info) => {
    if (!info || info.n < 2) return '';
    const tip = [info.n + ' Tage in Folge'].concat(info.jokers.map((d) => '❄️ Joker am ' + ddmm(d))).join(String.fromCharCode(10));
    return ` <span class="day-flame" title="${esc(tip)}">${App.streakLogic.MARK}${info.n}</span>`;
  };
  // Gesamt-Flamme (Tage in Folge mit allen To-dos) und Wochenzeile Mo–So darunter
  const offDays = () => App.streakLogic.offDays(S.settings.vacationLog, App.pause && App.pause.vacation ? App.pause.vacation() : S.settings.vacation, App.today());
  const DAY_ICON = { done: App.streakLogic.MARK, joker: '❄️', off: '❄️' };
  const DAY_TIP = { done: 'alles geschafft', joker: 'Joker – die Reihe bleibt', off: 'Urlaub – die Reihe bleibt', open: 'heute noch offen', future: '', missed: '' };
  const totalFlame = (wk) => (wk.n ? ` <span class="day-total" title="${wk.n} ${wk.n === 1 ? 'Tag' : 'Tage'} in Folge alle To-dos geschafft">${App.streakLogic.MARK}${wk.n}</span>` : '');
  const weekRow = (wk) => `<div class="day-week" aria-label="Diese Woche">${wk.days.map((d) => `<span class="day-wd is-${d.state}${d.today ? ' is-today' : ''}" title="${esc(ddmm(d.date) + (DAY_TIP[d.state] ? ' · ' + DAY_TIP[d.state] : ''))}"><small>${d.label}</small><i>${DAY_ICON[d.state] || ''}</i></span>`).join('')}</div>`;
  const forumHintShown =() => L.forumHint(cfg()) && !!(App.forum && App.forum.inGroup && App.forum.inGroup()) && !L.isDone(log(), App.today(), 'forum');

  const openJournal = () => {
    const j = App.itemsOf('journal').filter((x) => x.date === App.today()).sort((a, b) => (b.created || 0) - (a.created || 0))[0];
    if (j) App.go(App.link(j)); else App.newJournal();
  };

  // Haken setzen (on = false: wieder entfernen) – gespeichert wird nur, wenn sich etwas ändert
  // Nach jedem Schreiben ins dayLog den Tagesstand festhalten – auch dort, wo check() nichts tut (Anwenden, Listening-
  // Fenster offen, Bearbeiten-Modus) und in Lernrunden, die die Startseite nicht neu zeichnen
  const remember = () => { if (S.settings) state(); };
  const mark = async (key, on = true) => {
    await closeDay();
    const next = L.mark(log(), App.today(), key, on);
    if (next) await App.saveSettings({ dayLog: next });
    remember();
    check();
  };
  // Listening: abgespielte Sekunden dazuzählen (js/listening.js meldet sie beim Erreichen der Minuten und beim Schließen)
  const listened = async (sec) => {
    await closeDay();
    await App.saveSettings({ dayLog: L.addListen(log(), App.today(), sec) });
    remember();
    check();
  };
  const listenNeed = () => L.listenNeed(log(), App.today(), goals().listenMin * 60);
  // Neue Vokabel gelernt: die Karte wurde vorher noch nie bewertet (Lesen oder Deutsch → Japanisch)
  const graded = async (id, wasNew) => {
    if (!wasNew) { // Wiederholung: mitzählen bis zum Ziel
      await closeDay();
      const next = L.addReview(log(), App.today(), goals().reviews);
      if (next) { await App.saveSettings({ dayLog: next }); remember(); }
      return;
    }
    const it = S.items.get(App.writeLogic.isId(id) ? App.writeLogic.itemId(id) : id);
    if (it && it.type === 'vocab') mark('new');
  };

  // Feuerwerk einmal am Tag, sobald alle Ziele stehen – nie mitten im Hörstück:
  // solange das Listening-Fenster offen ist, wartet es (js/listening.js prüft beim Schließen erneut).
  // Ebenso nicht beim Schreiben in Anwenden: erst auf der nächsten Seite außerhalb – und nicht, solange man die Ziele einstellt
  let checking = false, editing = false;
  const check = async () => {
    if (checking || editing || !S.settings || document.querySelector('.listen-modal') || L.quiet(App.parseHash().path)) return;
    if (!L.shouldCelebrate(log(), App.today(), state(), cfg())) return;
    checking = true;
    try { await App.saveSettings({ dayLog: L.celebrated(log(), App.today()) }); App.matsuri(); } finally { checking = false; }
  };
  // (jedes Neuzeichnen meldet 'route' – die Bearbeiten-Ansicht schließt sich erst, wenn man die Startseite verlässt)
  App.onChange((w) => { if (w === 'route') { if (App.parseHash().path !== '/') editing = false; check(); } });

  // ---------- Anzeige ----------
  const mins = (n) => `${n} ${n === 1 ? 'Minute' : 'Minuten'}`;
  const TITLE = { review: 'Wiederholungen gemacht', apply: 'Japanisch angewendet', listen: 'Listening', new: 'Neue Wörter gelernt', kanji: 'Kanji geschrieben', conj: 'Konjugieren geübt', nhk: 'NHK Easy gelesen' };
  const title = (x) => (x.own ? esc(x.title) : TITLE[x.key]);
  const sub = (key, g) => ({
    review: `${g.reviews} Karten – oder alle, wenn es weniger sind`,
    apply: 'Tagebuch oder Smalltalk',
    listen: `${mins(g.listenMin)} <span lang="ja">今日のリスニング</span> gehört`,
    new: 'Ein neues Wort ins Lernen genommen',
    kanji: 'Mit dem Stift geübt',
    conj: 'Eine Runde Verbformen',
    nhk: 'Selbst abhaken',
  }[key] || 'Selbst abhaken');
  const ACTION = {
    review: '<a class="btn btn-sm" href="#/ueben/heute?auto=1">Wiederholen</a>',
    apply: '<button type="button" class="btn btn-sm" data-day-journal>Schreiben</button>',
    listen: '<button type="button" class="btn btn-sm" data-listen-play>Anhören</button>',
    new: '<a class="btn btn-sm" href="#/ueben/einstufen">Einstufen</a>',
    kanji: '<a class="btn btn-sm" href="#/ueben/kanji">Schreiben</a>',
    conj: '<a class="btn btn-sm" href="#/ueben/konjugieren">Üben</a>',
    nhk: `<a class="btn btn-sm" href="${NHK_URL}" target="_blank" rel="noopener" data-read-out>Öffnen</a>`,
  };
  // NHK und eigene Ziele hakt man selbst ab; alles andere prüft die App
  const manual = (x) => x.own || x.key === 'nhk';
  const box = (x, on) => (manual(x)
    ? `<button type="button" class="day-box" data-day-toggle="${esc(x.key)}" aria-pressed="${on}" title="${on ? 'Haken entfernen' : 'Abhaken'}">${icon('check')}</button>`
    : `<span class="day-box">${icon('check')}</span>`);

  const row = (x, on, g, fl) => `<div class="day-row ${on ? 'on' : ''}">${box(x, on)}
    <span class="grow"><b>${title(x)}${flame(fl[x.key])}</b><small>${sub(x.key, g)}</small></span>${on ? '' : ACTION[x.key] || ''}</div>`;
  const editBtn = (label) => `<button type="button" class="icon-btn sm day-edit-btn" data-day-edit title="${label}" aria-label="${label}">${icon('edit')}</button>`;

  const view = () => {
    const g = goals(), st = state(), list = L.list(cfg()), fl = flameInfo();
    const main = list.filter((x) => x.level === 'goal');
    const all = L.allMain(st, cfg());
    const status = all ? 'お疲れ様 · alles geschafft' : main.length ? 'prüft sich von selbst' : 'noch keine To-dos';
    const wk = main.length ? L.week(S.settings.dayHistory, offDays(), App.today()) : null;
    return `<div class="card day-check" data-day-check>
      <div class="row between"><h3 lang="ja">今日 <span>· Heute</span>${wk ? totalFlame(wk) : ''}</h3><span class="row day-head"><span class="small ${all ? 'day-all' : 'muted'}">${status}</span>${editBtn('To-dos bearbeiten')}</span></div>
      ${wk ? weekRow(wk) : ''}
      ${main.map((x) => row(x, st[x.key], g, fl)).join('')}
      ${main.length ? '' : '<p class="small muted day-empty">Tippe auf den Stift und stell dir deine To-dos zusammen.</p>'}
      ${forumHintShown() ? '<div class="day-hint"><button type="button" class="day-hint-btn" data-day-forum>✎ Satz des Tages im Forum noch offen</button></div>' : ''}
    </div>`;
  };

  // Bearbeiten direkt in der Karte: pro Punkt An / Aus, Zahlen mit − und +, eigene To-dos dazu, umbenennen oder weg
  const LEVEL_LABEL = { goal: 'An', off: 'Aus' };
  const LEVEL_TIP = { goal: 'Steht in der Liste und zählt fürs Feuerwerk', off: 'Wird nicht gezeigt' };
  const stepper = (k, text) => `<span class="day-num"><button type="button" class="icon-btn sm" data-day-bump="${k}:-1" aria-label="Weniger">−</button><b>${text}</b><button type="button" class="icon-btn sm" data-day-bump="${k}:1" aria-label="Mehr">+</button></span>`;
  const editSub = (x, g) => (x.key === 'review' ? stepper('reviews', `${g.reviews} Karten`)
    : x.key === 'listen' ? stepper('listenMin', mins(g.listenMin))
      : `<small>${sub(x.key, g)}</small>`);
  const editRow = (x, g) => `<div class="day-row day-set ${x.level === 'off' ? 'off' : ''}">
    <span class="grow"><b>${x.own ? `<button type="button" class="day-rename" data-day-rename="${esc(x.key)}" title="Umbenennen">${title(x)}</button> <button type="button" class="day-del" data-day-del="${esc(x.key)}" title="To-do löschen" aria-label="To-do löschen">${icon('close')}</button>` : title(x)}</b>${editSub(x, g)}</span>
    <span class="seg">${L.LEVELS.map((l) => `<button type="button" class="${x.level === l ? 'on' : ''}" data-day-level="${esc(x.key)}:${l}" aria-pressed="${x.level === l}" title="${LEVEL_TIP[l]}">${LEVEL_LABEL[l]}</button>`).join('')}</span></div>`;
  const editView = () => {
    const g = goals();
    return `<div class="card day-check day-editing" data-day-check>
      <div class="row between"><h3>Meine To-dos</h3><button type="button" class="btn btn-sm btn-primary" data-day-edit>Fertig</button></div>
      ${L.list(cfg()).map((x) => editRow(x, g)).join('')}
      <div class="day-row"><button type="button" class="btn btn-sm btn-ghost" data-day-add>${icon('plus')} Eigenes To-do</button></div>
      <div class="day-row day-set"><span class="grow"><b>Hinweis auf den Forum-Satz</b><small>Zeigt sich nur, wenn du in einer Gruppe bist</small></span>
        <span class="seg">${[true, false].map((v) => `<button type="button" class="${g.forumHint === v ? 'on' : ''}" data-day-forumhint="${v}" aria-pressed="${g.forumHint === v}">${v ? 'An' : 'Aus'}</button>`).join('')}</span></div>
      <p class="small muted day-note">Feuerwerk, sobald alle To-dos auf „An“ geschafft sind. Eigene antippen zum Umbenennen.</p>
    </div>`;
  };

  const card = () => (editing ? editView() : view());
  const redraw = () => { const el = document.querySelector('[data-day-check]'); if (el) el.outerHTML = card(); };
  const saveGoals = (g) => App.saveSettings({ dayGoals: g }); // die Startseite zeichnet sich danach selbst neu (js/main.js)

  const addOwn = async () => {
    const r = await App.ask('Eigenes To-do', [{ label: 'Was willst du dir jeden Tag vornehmen?', placeholder: 'z. B. Anki gemacht' }]);
    if (r && r[0]) saveGoals(L.addOwn(cfg(), r[0], App.uid('c')));
  };
  const renameOwn = async (id) => {
    const t = (goals().own.find((o) => o.id === id) || {}).title || '';
    const r = await App.ask('To-do umbenennen', [{ label: 'Neuer Name', value: t }]);
    if (r && r[0] && r[0] !== t) saveGoals(L.renameOwn(cfg(), id, r[0]));
  };
  const delOwn = async (id) => {
    const before = cfg();
    const t = (goals().own.find((o) => o.id === id) || {}).title || '';
    await saveGoals(L.removeOwn(before, id));
    App.toast(`„${t}“ gelöscht`, { label: 'Rückgängig', fn: () => saveGoals(before) });
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    if (e.target.closest('[data-day-journal]')) { openJournal(); return; }
    if (e.target.closest('[data-day-edit]')) { editing = !editing; redraw(); if (!editing) check(); return; }
    if (e.target.closest('[data-day-forum]')) { App.forum.open({ daily: true }); return; }
    const fh = e.target.closest('[data-day-forumhint]');
    if (fh) { saveGoals(Object.assign(goals(), { forumHint: fh.dataset.dayForumhint === 'true' })); return; }
    if (e.target.closest('[data-day-add]')) { addOwn(); return; }
    const rn = e.target.closest('[data-day-rename]');
    if (rn) { renameOwn(rn.dataset.dayRename); return; }
    const del = e.target.closest('[data-day-del]');
    if (del) { delOwn(del.dataset.dayDel); return; }
    const lv = e.target.closest('[data-day-level]');
    if (lv) { const [k, l] = lv.dataset.dayLevel.split(':'); saveGoals(L.setLevel(cfg(), k, l)); return; }
    const b = e.target.closest('[data-day-bump]');
    if (b) { const [k, d] = b.dataset.dayBump.split(':'); saveGoals(L.bump(cfg(), k, +d)); return; }
    const t = e.target.closest('[data-day-toggle]');
    if (t) mark(t.dataset.dayToggle, t.getAttribute('aria-pressed') !== 'true');
  });

  App.dayCheck = { card, mark, graded, listened, listenNeed, check, closeDay };
})(window.App);
