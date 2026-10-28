/* Nihongo Techō – Tagesliste „今日“ unten auf der Startseite: eigene Ziele, die sich (meist) selbst abhaken, und freiwillige */
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
  const appliedToday = () => App.itemsOf('journal').concat(App.itemsOf('answer')).some((it) => it.date === App.today() && App.applyHasContent(it));
  // Was heute erledigt ist – für jeden Punkt (eingebaut und eigene)
  const state = () => {
    const g = goals(), t = App.today(), st = {};
    L.list(cfg()).forEach(({ key }) => { st[key] = L.isDone(log(), t, key); });
    st.review = L.reviewDone(log(), t, App.todayParts().length, g.reviews); // gewählte Karten oder alles, was heute fällig war
    st.apply = appliedToday();
    st.listen = L.listenDone(log(), t, g.listenMin * 60);
    return st;
  };

  const openJournal = () => {
    const j = App.itemsOf('journal').filter((x) => x.date === App.today()).sort((a, b) => (b.created || 0) - (a.created || 0))[0];
    if (j) App.go(App.link(j)); else App.newJournal();
  };

  // Haken setzen (on = false: wieder entfernen) – gespeichert wird nur, wenn sich etwas ändert
  const mark = async (key, on = true) => {
    const next = L.mark(log(), App.today(), key, on);
    if (next) await App.saveSettings({ dayLog: next });
    check();
  };
  // Listening: abgespielte Sekunden dazuzählen (js/listening.js meldet sie beim Erreichen der Minuten und beim Schließen)
  const listened = async (sec) => {
    await App.saveSettings({ dayLog: L.addListen(log(), App.today(), sec) });
    check();
  };
  const listenNeed = () => L.listenNeed(log(), App.today(), goals().listenMin * 60);
  // Neue Vokabel gelernt: die Karte wurde vorher noch nie bewertet (Lesen oder Deutsch → Japanisch)
  const graded = async (id, wasNew) => {
    if (!wasNew) { // Wiederholung: mitzählen bis zum Ziel
      const next = L.addReview(log(), App.today(), goals().reviews);
      if (next) await App.saveSettings({ dayLog: next });
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
    nhk: `<a class="btn btn-sm" href="${NHK_URL}" target="_blank" rel="noopener">Öffnen</a>`,
  };
  // NHK und eigene Ziele hakt man selbst ab; alles andere prüft die App
  const manual = (x) => x.own || x.key === 'nhk';
  const box = (x, on) => (manual(x)
    ? `<button type="button" class="day-box" data-day-toggle="${esc(x.key)}" aria-pressed="${on}" title="${on ? 'Haken entfernen' : 'Abhaken'}">${icon('check')}</button>`
    : `<span class="day-box">${icon('check')}</span>`);

  const row = (x, on, g) => `<div class="day-row ${on ? 'on' : ''}">${box(x, on)}
    <span class="grow"><b>${title(x)}</b><small>${sub(x.key, g)}</small></span>${on ? '' : ACTION[x.key] || ''}</div>`;
  const opt = (x, on) => `<div class="day-row day-opt ${on ? 'on' : ''}">${box(x, on)}<span class="grow">${title(x)}</span>${x.key === 'nhk'
    ? `<a class="small" href="${NHK_URL}" target="_blank" rel="noopener">${esc('Öffnen →')}</a>` : ''}</div>`;
  const editBtn = (label) => `<button type="button" class="icon-btn sm day-edit-btn" data-day-edit title="${label}" aria-label="${label}">${icon('edit')}</button>`;

  const view = () => {
    const g = goals(), st = state(), list = L.list(cfg());
    const main = list.filter((x) => x.level === 'goal'), more = list.filter((x) => x.level === 'opt');
    const all = L.allMain(st, cfg());
    const status = all ? 'お疲れ様 · alles geschafft' : main.length ? 'prüft sich von selbst' : 'noch kein Ziel';
    return `<div class="card day-check" data-day-check>
      <div class="row between"><h3 lang="ja">今日 <span>· Heute</span></h3><span class="row day-head"><span class="small ${all ? 'day-all' : 'muted'}">${status}</span>${editBtn('Ziele anpassen')}</span></div>
      ${main.map((x) => row(x, st[x.key], g)).join('')}
      ${main.length ? '' : '<p class="small muted day-empty">Tippe auf den Stift und stell dir eigene Ziele zusammen.</p>'}
      ${more.length ? `<div class="day-more">Wenn du magst</div>${more.map((x) => opt(x, st[x.key])).join('')}` : ''}
    </div>`;
  };

  // Bearbeiten direkt in der Karte: pro Punkt Ziel / Mag / Aus, Zahlen mit − und +, eigene Ziele dazu oder weg
  const LEVEL_LABEL = { goal: 'Ziel', opt: 'Mag', off: 'Aus' };
  const LEVEL_TIP = { goal: 'Zählt fürs Feuerwerk', opt: 'Steht unter „Wenn du magst“', off: 'Wird nicht gezeigt' };
  const stepper = (k, text) => `<span class="day-num"><button type="button" class="icon-btn sm" data-day-bump="${k}:-1" aria-label="Weniger">−</button><b>${text}</b><button type="button" class="icon-btn sm" data-day-bump="${k}:1" aria-label="Mehr">+</button></span>`;
  const editSub = (x, g) => (x.key === 'review' ? stepper('reviews', `${g.reviews} Karten`)
    : x.key === 'listen' ? stepper('listenMin', mins(g.listenMin))
      : `<small>${sub(x.key, g)}</small>`);
  const editRow = (x, g) => `<div class="day-row day-set ${x.level === 'off' ? 'off' : ''}">
    <span class="grow"><b>${title(x)}${x.own ? ` <button type="button" class="day-del" data-day-del="${esc(x.key)}" title="Ziel löschen" aria-label="Ziel löschen">${icon('close')}</button>` : ''}</b>${editSub(x, g)}</span>
    <span class="seg">${L.LEVELS.map((l) => `<button type="button" class="${x.level === l ? 'on' : ''}" data-day-level="${esc(x.key)}:${l}" aria-pressed="${x.level === l}" title="${LEVEL_TIP[l]}">${LEVEL_LABEL[l]}</button>`).join('')}</span></div>`;
  const editView = () => {
    const g = goals();
    return `<div class="card day-check day-editing" data-day-check>
      <div class="row between"><h3>Meine Ziele</h3><button type="button" class="btn btn-sm btn-primary" data-day-edit>Fertig</button></div>
      ${L.list(cfg()).map((x) => editRow(x, g)).join('')}
      <div class="day-row"><button type="button" class="btn btn-sm btn-ghost" data-day-add>${icon('plus')} Eigenes Ziel</button></div>
      <p class="small muted day-note">Feuerwerk, sobald alle „Ziel“-Punkte geschafft sind.</p>
    </div>`;
  };

  const card = () => (editing ? editView() : view());
  const redraw = () => { const el = document.querySelector('[data-day-check]'); if (el) el.outerHTML = card(); };
  const saveGoals = (g) => App.saveSettings({ dayGoals: g }); // die Startseite zeichnet sich danach selbst neu (js/main.js)

  const addOwn = async () => {
    const r = await App.ask('Eigenes Ziel', [{ label: 'Was willst du dir vornehmen?', placeholder: 'z. B. Anki gemacht' }]);
    if (r && r[0]) saveGoals(L.addOwn(cfg(), r[0], App.uid('c')));
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
    if (e.target.closest('[data-day-add]')) { addOwn(); return; }
    const del = e.target.closest('[data-day-del]');
    if (del) { delOwn(del.dataset.dayDel); return; }
    const lv = e.target.closest('[data-day-level]');
    if (lv) { const [k, l] = lv.dataset.dayLevel.split(':'); saveGoals(L.setLevel(cfg(), k, l)); return; }
    const b = e.target.closest('[data-day-bump]');
    if (b) { const [k, d] = b.dataset.dayBump.split(':'); saveGoals(L.bump(cfg(), k, +d)); return; }
    const t = e.target.closest('[data-day-toggle]');
    if (t) mark(t.dataset.dayToggle, t.getAttribute('aria-pressed') !== 'true');
  });

  App.dayCheck = { card, mark, graded, listened, listenNeed, check };
})(window.App);
