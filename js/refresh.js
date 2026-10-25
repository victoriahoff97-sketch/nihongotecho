/* Nihongo Techō – Auffrischen: alle 14 Tage 10 Zahlen-Ausdrücke Deutsch → Japanisch (Knopf auf der Startseite + Runde) */
'use strict';
(function (App) {
  const { icon } = App;
  const S = App.store;
  const R = App.refreshLogic;
  const pool = () => R.pool(App.itemsOf('phrase'), App.counterRefreshCards());
  const save = (refresh) => App.saveSettings({ refresh });

  // Startseite: nur an Auffrisch-Tagen ein kleiner Knopf neben „Jetzt wiederholen“ – sonst nichts
  const button = () => {
    const n = Math.min(R.SIZE, pool().length);
    if (!n || !R.isDue(S.settings.refresh, Date.now())) return '';
    return `<a class="btn" href="#/ueben/auffrischen" title="Zahlen, Zähler, Uhrzeiten … – ändert nichts an Lernstand und Lernschlange"><span lang="ja">表</span> Auffrischen <span class="badge">${n}</span></a>`;
  };
  App.refresh = { button };

  // Die vorhandene Kartenrunde im freien Modus: nicht Gewusstes kommt gleich noch einmal, der Lernstand bleibt unberührt.
  // Gemerkt wird nur die erste Antwort je Begriff (ent.again), damit „nicht gewusst“ nächstes Mal vorn steht.
  const opts = {
    cram: true,
    dir: 'de',
    label: 'Auffrischen',
    noAgain: true,
    onGrade: (ent, g) => { if (ent.again) return; ent.again = true; save(R.graded(S.settings.refresh, ent.it.id, g > 0, Date.now())); },
    onEnd: () => save(R.finished(S.settings.refresh, Date.now())),
    endHtml: () => `<p class="muted">Nächstes Auffrischen in ${R.EVERY_DAYS} Tagen.</p>`,
  };

  App.route('/ueben/auffrischen', (view) => {
    const sec = App.SECTIONS.practice;
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › Auffrischen</div>
      <div class="page-head"><div class="titles"><h1>Auffrischen <span class="jp-title">おさらい</span></h1><p>${R.SIZE} Zahlen-Ausdrücke, Deutsch → Japanisch – damit Zähler, Uhrzeiten &amp; Co. nicht aus dem Blick geraten. Ändert nichts an Lernstand und Lernschlange.</p></div></div>
      <div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    // Zurück aus „Eintrag öffnen“: an derselben Karte weitermachen
    const r = App.cards.takeParked();
    if (r) return App.cards.run(stage, r.entries, r.opts, r);
    // Noch nicht wieder dran (z. B. mit „←“ zurück nach der Runde): keine neue Runde, die den Termin weiter nach hinten schöbe
    if (!R.isDue(S.settings.refresh, Date.now())) {
      stage.innerHTML = `<div class="card">Für heute ist aufgefrischt. Nächstes Auffrischen am ${new Date(R.nextDue(S.settings.refresh)).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}.<div class="row" style="margin-top:10px"><a class="btn" href="#/">${icon('home')} Zur Startseite</a></div></div>`;
      return;
    }
    const list = R.pick(pool(), S.settings.refresh, R.SIZE, App.shuffle);
    if (!list.length) {
      stage.innerHTML = `<div class="card">Für das Auffrischen gibt es noch keine Zahlen-Ausdrücke in deiner Sammlung.<div class="row" style="margin-top:10px"><a class="btn" href="#/">${icon('home')} Zur Startseite</a></div></div>`;
      return;
    }
    App.cards.run(stage, list.map((it) => ({ it, kind: 'read', dir: 'de' })), opts);
  });
})(window.App);
