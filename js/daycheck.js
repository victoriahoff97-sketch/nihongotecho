/* Nihongo Techō – Tagesliste „今日“ unten auf der Startseite: drei Pflichtpunkte, die sich selbst abhaken, und freiwillige */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.store;
  const L = App.dayCheckLogic;
  const NHK_URL = 'https://news.web.nhk/news/easy/';

  const log = () => S.settings.dayLog;

  // Japanisch angewendet: ein Tagebucheintrag oder eine Smalltalk-Antwort von heute, in der etwas steht
  const appliedToday = () => App.itemsOf('journal').concat(App.itemsOf('answer')).some((it) => it.date === App.today() && App.applyHasContent(it));
  const main = () => ({
    review: L.reviewDone(log(), App.today(), App.todayParts().length), // 25 Karten oder alles, was heute fällig war
    apply: appliedToday(),
    listen: L.isDone(log(), App.today(), 'listen'),
  });

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
  // Listening: abgespielte Sekunden dazuzählen (js/listening.js meldet sie beim Erreichen der Minute und beim Schließen)
  const listened = async (sec) => {
    await App.saveSettings({ dayLog: L.addListen(log(), App.today(), sec) });
    check();
  };
  // Neue Vokabel gelernt: die Karte wurde vorher noch nie bewertet (Lesen oder Deutsch → Japanisch)
  const graded = async (id, wasNew) => {
    if (!wasNew) { // Wiederholung: mitzählen bis 25
      const next = L.addReview(log(), App.today());
      if (next) await App.saveSettings({ dayLog: next });
      return;
    }
    const it = S.items.get(App.writeLogic.isId(id) ? App.writeLogic.itemId(id) : id);
    if (it && it.type === 'vocab') mark('new');
  };

  // Feuerwerk einmal am Tag, sobald alle drei Pflichtpunkte stehen
  let checking = false;
  const check = async () => {
    if (checking || !S.settings) return;
    const m = main();
    if (!L.shouldCelebrate(log(), App.today(), m)) return;
    checking = true;
    try { await App.saveSettings({ dayLog: L.celebrated(log(), App.today()) }); App.matsuri(); } finally { checking = false; }
  };
  App.onChange((w) => { if (w === 'route') check(); });

  const row = (on, title, sub, action) => `<div class="day-row ${on ? 'on' : ''}"><span class="day-box">${icon('check')}</span>
    <span class="grow"><b>${title}</b><small>${sub}</small></span>${on ? '' : action}</div>`;
  const opt = (key, title, extra = '') => {
    const on = L.isDone(log(), App.today(), key);
    return `<div class="day-row day-opt ${on ? 'on' : ''}">${key === 'nhk'
      ? `<button type="button" class="day-box" data-day-toggle="nhk" aria-pressed="${on}" title="${on ? 'Haken entfernen' : 'Abhaken'}">${icon('check')}</button>`
      : `<span class="day-box">${icon('check')}</span>`}<span class="grow">${title}</span>${extra}</div>`;
  };

  const card = () => {
    const m = main(), all = L.allMain(m);
    return `<div class="card day-check" data-day-check>
      <div class="row between"><h3 lang="ja">今日 <span>· Heute</span></h3><span class="small ${all ? 'day-all' : 'muted'}">${all ? 'お疲れ様 · alles geschafft' : 'prüft sich von selbst'}</span></div>
      ${row(m.review, 'Wiederholungen gemacht', '25 Karten – oder alle, wenn es weniger sind', `<a class="btn btn-sm" href="#/ueben/heute?auto=1">Wiederholen</a>`)}
      ${row(m.apply, 'Japanisch angewendet', 'Tagebuch oder Smalltalk', `<button type="button" class="btn btn-sm" data-day-journal>Schreiben</button>`)}
      ${row(m.listen, 'Listening', '1 Minute <span lang="ja">今日のリスニング</span> gehört', `<button type="button" class="btn btn-sm" data-listen-play>Anhören</button>`)}
      <div class="day-more">Wenn du magst</div>
      ${opt('new', 'Neue Wörter gelernt')}
      ${opt('kanji', 'Kanji geschrieben')}
      ${opt('conj', 'Konjugieren geübt')}
      ${opt('nhk', 'NHK Easy gelesen', `<a class="small" href="${NHK_URL}" target="_blank" rel="noopener">${esc('Öffnen →')}</a>`)}
    </div>`;
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    if (e.target.closest('[data-day-journal]')) { openJournal(); return; }
    const t = e.target.closest('[data-day-toggle]');
    if (t) mark(t.dataset.dayToggle, t.getAttribute('aria-pressed') !== 'true');
  });

  App.dayCheck = { card, mark, graded, listened, check };
})(window.App);
