/* Nihongo Techō – Grammatik auffrischen: alle 7 Tage 5 Sätze Deutsch → Japanisch zu Grammatik auf „kann ich“ (Knopf auf der Startseite + Runde) */
'use strict';
(function (App) {
  const { icon, esc } = App;
  const S = App.store;
  const G = App.grammarRefreshLogic;
  const T = App.translateLogic;
  const known = (g) => App.vocabStatus(g.id) === 'known';
  const pool = () => G.pool(App.itemsOf('grammar'), known);
  const isDue = () => G.isDue(S.settings.grammarRefresh, Date.now());
  const save = (grammarRefresh) => App.saveSettings({ grammarRefresh });
  const dateDe = (t) => new Date(t).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
  const homeRow = `<a class="btn" href="#/">${icon('home')} Zur Startseite</a>`;

  // Startseite: nur wenn es wieder dran ist ein kleiner Knopf neben „Auffrischen“ – immer G.SIZE, es sammelt sich nichts an
  const button = () => {
    if (!isDue() || !pool().length) return '';
    return `<a class="btn" href="#/ueben/grammatik-auffrischen" title="Grammatik, die du schon kannst, in ${G.SIZE} Sätzen anwenden – ändert nichts an „kann ich“"><span lang="ja">文</span> Grammatik <span class="badge">${G.SIZE}</span></a>`;
  };
  App.grammarRefresh = { button };

  App.route('/ueben/grammatik-auffrischen', (view) => {
    const sec = App.SECTIONS.grammar;
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › Grammatik auffrischen</div>
      <div class="page-head"><div class="titles"><h1>Grammatik auffrischen <span class="jp-title">文法のおさらい</span></h1><p>${G.SIZE} Sätze Deutsch → Japanisch zu Grammatik, die bei dir auf „kann ich“ steht – damit sie nicht einrostet. „Kann ich“ bleibt, wie es ist.</p></div></div>
      <div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    const msg = (html) => { stage.innerHTML = `<div class="card">${html}<div class="row" style="margin-top:10px">${homeRow}</div></div>`; };
    const linksOf = (points) => points.map((g) => `<a class="badge sec ${App.SECTIONS.grammar.cls}" style="text-decoration:none" href="${App.link(g)}">文 ${esc(g.title)}</a>`).join(' ');
    // Noch nicht wieder dran (z. B. mit „←“ zurück nach der Runde): keine neue Runde, die den Termin weiter nach hinten schöbe.
    // Die Punkte der letzten Runde bleiben verlinkt – so kommt man nach einem Eintrag auch noch zum nächsten
    if (!isDue()) {
      const last = G.norm(S.settings.grammarRefresh).points.map(App.item).filter(Boolean);
      return msg(`Für diese Woche ist aufgefrischt. Nächstes Mal am ${dateDe(G.nextDue(S.settings.grammarRefresh))}.${last.length ? `<p class="muted" style="margin:10px 0 6px">Zuletzt dran – Buchaufgaben und Erklärung beim Eintrag:</p><div class="row" style="gap:6px">${linksOf(last)}</div>` : ''}`);
    }
    const list = pool();
    if (!list.length) return msg('Hier kommt Grammatik dran, die du auf „kann ich“ gesetzt hast. Im Moment steht noch kein Grammatikpunkt darauf.');
    // Wortvorrat wie bei Übersetzen: Wörter aus der Lernschlange und solche, die du schon lesen kannst
    const kit = App.translateKit;
    const words = T.queuePot(kit.words(), [], App.wordState, kit.canRead).pool;
    const make = (points) => T.build({ grammar: points, pool: words, n: G.SIZE }, kit.BUILD);
    const { points, exs } = G.choose(G.order(list, S.settings.grammarRefresh, App.shuffle), make);
    if (!exs.length) return msg('Für deine Grammatik ließen sich gerade keine Sätze bauen – es fehlen noch Wörter, die du schon kannst.');
    const links = linksOf(points);
    kit.run(stage, exs, 'de', {
      // Nur eine fertige Runde zählt: dann beginnen die 7 Tage neu, und was nicht saß, kommt nächstes Mal zuerst
      onDone: (wrong) => {
        const res = {};
        points.forEach((g) => { res[g.id] = !wrong.some((e) => e.g && e.g.id === g.id); });
        save(G.finished(S.settings.grammarRefresh, res, Date.now()));
      },
      endHtml: () => `<p class="muted" style="margin-top:14px">Nächstes Grammatik-Auffrischen in ${G.EVERY_DAYS} Tagen. Mehr dazu – Buchaufgaben, Erklärung – beim Eintrag:</p><div class="row" style="justify-content:center;gap:6px">${links}</div>`,
      endRow: homeRow,
    });
  });
})(window.App);
