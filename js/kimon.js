/* Nihongo Techō – 鬼門 Kimon: die Wörter, an denen du immer wieder scheiterst (Üben › Kimon, #/ueben/kimon)
   Logik in js/kimon-logic.js. Üben läuft als freie Runde: Lernstand und Termine bleiben unberührt. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.store;
  const K = App.kimonLogic;

  // Das Dämonentor: Tor mit Oni-Hörnern, Augen und Zähnen im Durchgang (Farbe = currentColor)
  App.KIMON_ICON = `<svg class="kimon-ico" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14 13C12 9 11 5 12.5 1.5C15.5 4.5 18 8 19.5 12Z" fill="currentColor" stroke-width="1.5"/><path d="M34 13C36 9 37 5 35.5 1.5C32.5 4.5 30 8 28.5 12Z" fill="currentColor" stroke-width="1.5"/>
    <path d="M3.5 16.5Q24 10.5 44.5 16.5" stroke-width="4"/><path d="M9 23H39"/><path d="M13 15.5V45M35 15.5V45"/>
    <circle cx="20.5" cy="31" r="2.2" fill="currentColor" stroke="none"/><circle cx="27.5" cy="31" r="2.2" fill="currentColor" stroke="none"/>
    <path d="M19 37.5L21.25 40L24 37.5L26.75 40L29 37.5" stroke-width="2"/></svg>`;

  const ITEMS = () => K.TYPES.flatMap((t) => App.itemsOf(t));
  const rows = () => K.rows(ITEMS(), S.srs);
  App.kimon = { rows, count: () => rows().filter((r) => !r.beaten).length };

  const TYPE_FILTER = [['', 'Alle'], ['vocab', 'Vokabeln'], ['phrase', 'Ausdrücke'], ['kanji', 'Kanji']];
  const word = (it) => it.char || it.kanji || it.kana || it.jp || '';
  const sub = (it) => (it.type === 'vocab' && it.kanji ? it.kana : '');
  const split = (r) => {
    const [a, b] = r.it.type === 'kanji' ? ['Lesen', 'Schreiben'] : ['JP→DE', 'DE→JP'];
    return [r.read ? `${a} ${r.read}` : '', r.active ? `${b} ${r.active}` : ''].filter(Boolean).join(' · ');
  };
  const stageBadge = (r) => {
    if (r.beaten) return `<span class="kimon-stage beaten">${K.BEATEN.jp} besiegt ✓</span>`;
    const st = App.wordStage(r.it), info = App.stufenLogic.INFO[st === 'queue' ? 'neu' : st] || App.stufenLogic.INFO.neu;
    return `<span class="kimon-stage">${esc(info.label)}</span>`;
  };
  const rowHtml = (r, i, max) => `<a class="kimon-row sec-${r.it.type === 'phrase' ? 'phrase' : r.it.type} ${r.beaten ? 'beaten' : 'tier-' + r.tier.k}" href="${App.link(r.it)}">
      <span class="kimon-rank">${r.beaten ? '✓' : i + 1}</span>
      <span class="kimon-word"><b lang="ja">${esc(word(r.it))}</b>${sub(r.it) ? `<span class="small muted" lang="ja">${esc(sub(r.it))}</span>` : ''}<span class="kimon-de">${App.meaningHtml(r.it)}</span></span>
      <span class="kimon-bar" title="${r.total} Fehler"><i style="width:${Math.max(6, Math.round((r.total / max) * 100))}%"></i></span>
      <span class="kimon-n"><b>${r.total}×</b><small>${esc(split(r))}</small></span>
      ${stageBadge(r)}</a>`;

  App.route('/ueben/kimon', (view, p, q) => {
    const sec = App.SECTIONS.practice;
    const resume = App.cards.takeParked();
    const all = rows();
    let type = '', tier = '';
    const tierChip = (t, n) => `<button class="chip kimon-chip ${t.k}" data-tier="${t.k}"><b lang="ja">${t.jp}</b> ${esc(t.label)}${t.min ? ` · ${t.min}+` : ''} <span class="small">${n}</span></button>`;
    const nOf = (k) => all.filter((r) => (k === 'beaten' ? r.beaten : !r.beaten && r.tier.k === k)).length;
    view.innerHTML = `<div class="${sec.cls} kimon"><div class="crumbs">${App.backCrumb()} › Kimon</div>
      <div class="page-head"><div class="titles"><h1><span class="kimon-head-ico">${App.KIMON_ICON}</span>Kimon <span class="jp-title">鬼門</span></h1>
        <p>Das Dämonentor: Wörter, an denen du immer wieder scheiterst – ab ${K.MIN} Fehlern. Fehler beider Richtungen zählen zusammen. Kannst du ein Wort inzwischen, bleibt es als besiegt (退治) unten stehen.</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row">${K.TIERS.map((t) => tierChip(t, nOf(t.k))).join('')}${tierChip(Object.assign({ min: 0 }, K.BEATEN), nOf('beaten'))}</div>
        <div class="row between"><div class="seg" data-kimon-type>${TYPE_FILTER.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-v="${k}">${l}</button>`).join('')}</div>
          <div class="row"><button class="btn btn-primary" data-kimon-go title="Freie Runde – dein Lernstand bleibt, wie er ist">${icon('play')} <span data-go-label></span></button>${App.cards.chunkSelect()}</div></div>
        <div class="kimon-list"></div></div></div>
      <div data-stage></div></div>`;
    if (resume) { view.querySelector('[data-setup]').hidden = true; return App.cards.run(view.querySelector('[data-stage]'), resume.entries, resume.opts, resume); }

    const list = view.querySelector('.kimon-list'), go = view.querySelector('[data-kimon-go]');
    const shown = () => all.filter((r) => (!type || r.it.type === type) && (!tier || (tier === 'beaten' ? r.beaten : !r.beaten && r.tier.k === tier)));
    const apply = () => {
      const rs = shown(), ents = K.entries(rs), max = Math.max(1, ...rs.map((r) => r.total));
      let rank = 0;
      list.innerHTML = rs.length ? rs.map((r) => rowHtml(r, r.beaten ? 0 : rank++, max)).join('')
        : `<div class="empty-state"><div class="big kimon-empty-ico">${App.KIMON_ICON}</div><h3>${all.length ? 'Hier ist gerade niemand' : 'Kein Dämon in Sicht'}</h3><p>${all.length ? 'In dieser Auswahl steht kein Wort.' : `Sobald du ein Wort ${K.MIN}-mal nicht gewusst hast, taucht es hier auf.`}</p></div>`;
      go.querySelector('[data-go-label]').textContent = `Diese üben (${ents.length})`;
      go.disabled = !ents.length;
      view.querySelectorAll('[data-tier]').forEach((b) => b.classList.toggle('on', b.dataset.tier === tier));
    };
    view.querySelectorAll('[data-tier]').forEach((b) => (b.onclick = () => { tier = tier === b.dataset.tier ? '' : b.dataset.tier; apply(); }));
    view.querySelector('[data-kimon-type]').onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      type = b.dataset.v;
      view.querySelectorAll('[data-kimon-type] button').forEach((x) => x.classList.toggle('on', x === b));
      apply();
    };
    App.cards.bindChunk(view);
    // Freie Runde in Häppchen wie „Lernschlange üben“; nicht Gewusstes kommt in derselben Runde noch einmal
    go.onclick = () => {
      const entries = App.shuffle(K.entries(shown())), stage = view.querySelector('[data-stage]');
      const next = () => {
        view.querySelector('[data-setup]').hidden = true;
        App.cards.run(stage, entries.splice(0, App.cards.chunkSize() || entries.length), { cram: true, left: () => entries.length, nextChunk: next });
      };
      next();
    };
    apply();
  });
})(window.App);
