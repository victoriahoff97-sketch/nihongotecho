/* Nihongo Techō – „Was ist neu“: kurzes Fenster nach einem Update (Inhalte: js/news-data.js, Logik: js/news-logic.js) */
'use strict';
(function (App) {
  const { $, esc } = App;
  const KEY = 'newsSeen'; // pro Gerät (localStorage „nt-newsSeen“): jedes Gerät bekommt sein Update einzeln

  const open = (list) => {
    if (!list.length) return;
    const body = list.map((n) => `<section class="news-entry"><h3>${esc(n.date)}</h3>
      <ul>${n.items.map((x) => `<li><b>${esc(x.t)}</b><span>${esc(x.d)}</span></li>`).join('')}</ul></section>`).join('');
    const md = App.modal({
      title: '<span class="jp">新</span> Was ist neu', cls: 'news-modal', body,
      foot: '<button class="btn btn-primary" data-ok autofocus>Alles klar</button>',
    });
    md.el.querySelector('[data-ok]').onclick = md.close;
  };

  App.news = {
    // Beim Start: ungesehene Updates zeigen. Liegt schon ein Fenster oder die Tour offen, beim nächsten Start.
    boot: () => setTimeout(() => {
      if ($('.modal-back') || (App.tour && App.tour.active())) return;
      const L = App.newsLogic;
      const { show, seen } = L.pick({ news: App.NEWS || [], seen: L.parse(App.lsGet(KEY)), fresh: App.backup.isEmptyLocal() });
      App.lsSet(KEY, JSON.stringify(seen));
      open(show);
    }, 900),
    open: () => open((App.NEWS || []).slice(0, App.newsLogic.MAX)),
  };

  document.addEventListener('click', (e) => { if (e.target.closest('[data-news-open]')) App.news.open(); });
})(window.App);
