/* Nihongo Techō – Zähler-Übersicht in den Ausdrücken: aufklappbar je Zähler, Zahlen 1–10 zum Antippen + passende Lernkarten,
   „Kann ich“ je Zähler (daraus kommt das Auffrischen) und freies Üben der ganzen Tabelle */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const C = App.counters;
  const S = App.store;

  // offen gelassene Zähler pro Gerät merken, damit „←“ aus einer Karte nicht alles zuklappt
  const openSet = () => new Set(String(App.lsGet('ctrOpen') || '').split(',').filter(Boolean));
  const saveOpen = (s) => App.lsSet('ctrOpen', Array.from(s).join(','));

  // „Kann ich“ je Zähler – gemessen an allen Zähler-Karten, nicht nur an den gerade gefilterten
  const knownMap = () => {
    const { by } = C.assign(App.itemsOf('phrase').filter((i) => i.group === 'Zähler'), JP.plain);
    return new Map(C.ALL.map((c) => [c.id, C.known(c, S.settings.counters, by.get(c.id).map((it) => App.vocabStatus(it.id)))]));
  };
  // Auffrischen: alle Zellen der Zähler, die man kann
  App.counterRefreshCards = () => { const k = knownMap(); return C.ALL.filter((c) => k.get(c.id)).flatMap(C.cards); };

  const cell = (r) => {
    const title = r.alt.length ? ` title="auch: ${esc(r.alt.join(', '))}"` : '';
    const wide = Math.max(r.kana.length, r.jp.length) >= 6; // lange Lesungen bekommen zwei Spalten statt Umbruch
    return `<button type="button" class="ctr-cell${wide ? ' wide' : ''}${r.odd ? ' odd' : ''}${r.ask ? ' ask' : ''}${r.extra ? ' extra' : ''}"${JP.canSpeak() ? ` data-speak="${esc(r.kana)}"` : ''}${title}>
      <span class="ctr-n">${esc(r.label)}</span><span class="ctr-jp" lang="ja">${esc(r.jp)}</span><span class="ctr-kana" lang="ja">${esc(r.kana)}</span>${r.alt.length ? `<span class="ctr-alt" lang="ja">${esc(r.alt.join(' / '))}</span>` : ''}</button>`;
  };

  const panel = (c, cards, rows, open, known) => `<details class="ctr${known ? ' known' : ''}" data-ctr="${c.id}"${open ? ' open' : ''}>
      <summary><span class="ctr-k" lang="ja">〜${esc(c.k)}</span><span class="ctr-r" lang="ja">${esc(c.kana)}</span>
        <span class="ctr-de"><b>${esc(c.de)}</b><span class="small muted">${esc(c.ex)}</span></span>${known ? '<span class="ctr-known-pill">● Kann ich</span>' : ''}<span class="ctr-chev" aria-hidden="true">›</span></summary>
      <div class="ctr-body">
        <div class="ctr-grid">${C.rows(c).map(cell).join('')}</div>
        <p class="ctr-rule">${esc(c.rule)}</p>
        <p class="ctr-sent"><span lang="ja">${JP.ruby(c.sent[0])}</span>${App.speakBtn(JP.kana(c.sent[0]))}<span class="small muted">${esc(c.sent[1])}</span></p>
        <div class="row ctr-acts"><a class="btn btn-sm" href="#/ueben/zaehler?c=${c.id}">${icon('practice')} Üben</a>
          <button class="btn btn-sm ctr-known-btn${known ? ' on' : ''}" data-ctr-known="${c.id}" title="${known ? 'Wieder auf offen stellen' : 'Kommt dann alle 14 Tage beim Auffrischen dran'}">${icon('check')} Kann ich</button>
          ${c.g ? `<a class="small" href="#/ausdruecke?g=${encodeURIComponent(c.g)}">Mehr dazu in „${esc(c.g)}“ ›</a>` : ''}</div>
        ${cards.length ? `<details class="ctr-cards"><summary>Lernkarten dazu (${cards.length})</summary>${rows(cards)}</details>` : ''}
      </div></details>`;

  App.counterBody = (list, rows) => {
    const { by, rest } = C.assign(list, JP.plain);
    const open = openSet(), known = knownMap();
    return `<p class="small muted ctr-hint">Zähler antippen zum Aufklappen. <b class="ctr-odd-word">Rot</b> = weicht von „Zahl + Zähler“ ab. Eine Zahl antippen liest sie vor.
        Sitzt ein Zähler, stell ihn auf <b>Kann ich</b> – daraus kommen beim Auffrischen alle 14 Tage zufällige Zahlen.</p>
      ${C.SECTIONS.map((s) => `<div class="ctr-sec">${esc(s.title)}</div>${s.items.map((c) => panel(c, by.get(c.id), rows, open.has(c.id), known.get(c.id))).join('')}`).join('')}
      ${rest.length ? `<div class="ctr-sec">Weitere</div>${rows(rest)}` : ''}`;
  };

  App.counterBind = (root) => {
    root.querySelectorAll('details.ctr').forEach((d) => d.addEventListener('toggle', () => {
      const s = openSet();
      if (d.open) s.add(d.dataset.ctr); else s.delete(d.dataset.ctr);
      saveOpen(s);
    }));
    root.querySelectorAll('[data-ctr-known]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.ctrKnown, to = !knownMap().get(id);
        App.saveSettings({ counters: Object.assign({}, S.settings.counters, { [id]: to }) });
        App.toast(`〜${C.byId(id).k}: ${to ? 'Kann ich – kommt beim Auffrischen dran' : 'wieder offen'}`);
      };
    });
    const all = root.querySelector('[data-ctr-all]');
    if (!all) return;
    const ds = () => Array.from(root.querySelectorAll('details.ctr'));
    const label = () => { all.textContent = ds().every((d) => d.open) ? 'Alle zuklappen' : 'Alle aufklappen'; };
    label();
    root.addEventListener('toggle', label, true);
    all.onclick = () => {
      const to = !ds().every((d) => d.open);
      ds().forEach((d) => { d.open = to; });
      saveOpen(new Set(to ? ds().map((d) => d.dataset.ctr) : []));
    };
  };

  // Freies Üben eines Zählers: die ganze Tabelle gemischt, Deutsch → Japanisch – ändert nichts an Lernstand und Auffrischen
  App.route('/ueben/zaehler', (view, p, q) => {
    const sec = App.SECTIONS.phrase;
    const c = C.byId(q.c);
    if (!c) { view.innerHTML = '<div class="empty-state"><h3>Zähler nicht gefunden</h3></div>'; return; }
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › 〜${esc(c.k)} üben</div>
      <div class="page-head"><div class="titles"><h1>〜${esc(c.k)} üben <span class="jp-title" lang="ja">${esc(c.kana)}</span></h1><p>${esc(c.de)}: alle Zahlen gemischt, Deutsch → Japanisch. Freies Üben – ändert nichts an deinem Lernstand.</p></div></div>
      <div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    const r = App.cards.takeParked();
    if (r) return App.cards.run(stage, r.entries, r.opts, r);
    App.cards.run(stage, App.shuffle(C.cards(c)).map((it) => ({ it, kind: 'read', dir: 'de' })), { cram: true, dir: 'de', label: `〜${c.k} üben` });
  });
})(window.App);
