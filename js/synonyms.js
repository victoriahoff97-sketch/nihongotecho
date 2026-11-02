/* Nihongo Techō – Gleiche Bedeutung (同義): Wörter, die dasselbe heißen, und Hinweis an der Vokabel */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const S = App.synonyms;
  const POS_FILTER = [['', 'Alle'], ['noun', 'Nomen'], ['verb', 'Verben'], ['adj', 'Adjektive']];
  const posGroup = (it) => (it.pos === 'i-adj' || it.pos === 'na-adj' ? 'adj' : it.pos || '');
  const word = (it) => it.kanji || it.kana;
  const learned = (it) => App.vocabStatus(it.id) !== 'unchecked';
  const rank = (it) => ({ known: 2, learn: 1 }[App.vocabStatus(it.id)] || 0);
  const changedAt = (it) => {
    if (!learned(it)) return 0;
    const s = App.srsOf(it.id);
    return (s && s.checked) || (App.needsCheck(it) ? 0 : it.created || 0);
  };
  const link = (g) => '#/bedeutung?q=' + encodeURIComponent(S.label(g));
  const toggled = new Map();
  // Suche, die das Neuzeichnen nach „In die Lernschlange“ überlebt
  let keepQ = '';

  // Kachel: Wort mit Lesung, die ganze Bedeutung (die Klammern zeigen den Unterschied), Beispielsatz
  const tile = (it) => {
    const on = learned(it);
    const ex = (it.examples || [])[0];
    return `<div class="gk-tile sec-vocab ${on ? '' : 'off'}">
      <div class="gk-top"><a class="gk-word" href="${App.link(it)}" lang="ja" title="Vokabel öffnen">${esc(word(it))}</a>${it.kanji ? `<span class="small muted" lang="ja">${esc(it.kana)}</span>` : ''}</div>
      <div class="gk-de">${App.meaningHtml(it)}</div>
      <div class="gk-meta">${it.pos ? `<span class="badge">${esc(App.POS[it.pos] || it.pos)}</span>` : ''}${App.levelBadge ? App.levelBadge(it) : ''}</div>
      ${ex ? `<div class="gk-ex"><span lang="ja">${JP.ruby(ex.jp)}</span><small>${esc(App.exMeaning(ex))}</small></div>` : ''}
      <div class="gk-foot">${on ? App.statusBadge(it.id) : `<button class="btn btn-sm" data-gb-learn="${esc(it.id)}">${icon('plus')} In die Lernschlange</button>`}</div>
    </div>`;
  };

  const groupHtml = (g, q) => {
    const items = g.items.slice().sort((a, b) => rank(b) - rank(a));
    const open = toggled.has(g.key) ? toggled.get(g.key) : !!q;
    const pos = [...new Set(items.map(posGroup))].join(' ');
    return `<details class="card gk-group" data-gb="${esc(g.key)}" data-pos="${esc(pos)}" ${open ? 'open' : ''}>
      <summary><span class="gb-label">${esc(S.label(g))}</span>
        <span class="gk-chips">${items.map((it) => `<span class="gk-chip sec-vocab ${learned(it) ? '' : 'off'}"><b lang="ja">${esc(word(it))}</b>${esc(App.itemSub(it) || '')}</span>`).join('')}</span>
        ${g.fresh ? '<span class="badge sec">neu</span>' : ''}<span class="gk-caret" aria-hidden="true">▾</span></summary>
      <div class="gk-body"><div class="small muted">${items.length === 1 ? '1 Wort – dasselbe deutsche Wort gibt es auch als Nomen bzw. Verb' : items.length + ' Wörter'}</div>
        <div class="gk-tiles">${items.map(tile).join('')}</div></div>
    </details>`;
  };

  const allGroups = () => S.groups(App.itemsOf('vocab'), rank);
  const SEARCH_MAX = 40;

  App.route('/bedeutung', (view, p, query) => {
    const all = S.sort(allGroups(), changedAt, Date.now());
    // ohne Suche nur Gruppen mit einem Wort, das du lernst; die Suche findet alle
    const shown = S.visible(all, App.vocabStatus);
    const words = shown.reduce((n, g) => n + g.items.length, 0);
    view.innerHTML = `<div class="sec-homophone ${App.furiClass()}"><div class="page-head"><div class="titles"><h1>Gleiche Bedeutung <span class="jp-title">同義</span></h1>
        <p>Wörter, die auf Deutsch dasselbe heißen – zum Beispiel 着る und はく für „anziehen“. Die Klammern in der Bedeutung zeigen den Unterschied. Die Übersicht wächst von selbst, sobald du eines der Wörter lernst; die Suche findet auch die übrigen.</p></div></div>
      <div class="tabs"><a class="tab" href="#/vokabeln" style="text-decoration:none">Einträge</a><a class="tab" href="#/vokabeln?tab=files" style="text-decoration:none">${icon('file')} Dateien</a>${App.GK_TAB(false)}${App.GB_TAB(true)}</div>
      <div class="toolbar"><input class="input" type="search" data-gb-q placeholder="anziehen, Schüler, kiru …" value="${esc(query.q || keepQ)}" style="max-width:280px">
          <div class="seg" data-gb-pos>${POS_FILTER.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-v="${k}">${l}</button>`).join('')}</div>
          <span class="grow"></span><span class="small muted" data-gb-count></span></div>
      <div class="gk-list"></div>
      <div data-gb-none hidden></div>
      <div class="gk-legend small muted"><span><span class="gk-chip sec-vocab"><b lang="ja">着る</b></span> lernst du schon</span><span><span class="gk-chip sec-vocab off"><b lang="ja">はく</b></span> bedeutet ähnlich, lernst du aber noch nicht</span></div></div>`;

    const list = view.querySelector('.gk-list');
    const none = view.querySelector('[data-gb-none]');
    const input = view.querySelector('[data-gb-q]');
    let pos = '';
    const posOk = (g) => !pos || g.items.some((it) => posGroup(it) === pos);
    // Wörter zur Suche, die (noch) keine Gruppe haben: zeigen, dass es sie gibt
    const lonely = (q) => {
      const inGroup = new Set(all.flatMap((g) => g.items.map((it) => it.id)));
      return App.itemsOf('vocab').filter((it) => !inGroup.has(it.id) && (!pos || posGroup(it) === pos) && S.matches({ labels: [], items: [it] }, q)).slice(0, 6);
    };
    const apply = () => {
      const q = input.value.trim();
      const hits = (q ? all : shown).filter((g) => posOk(g) && S.matches(g, q));
      list.innerHTML = hits.slice(0, q ? SEARCH_MAX : hits.length).map((g) => groupHtml(g, q)).join('');
      list.querySelectorAll('[data-gb]').forEach((el) => el.addEventListener('toggle', () => toggled.set(el.dataset.gb, el.open)));
      const alone = q ? lonely(q) : [];
      none.hidden = hits.length > 0 && !alone.length;
      none.innerHTML = !q && !hits.length
        ? `<div class="empty-state"><div class="big" lang="ja">同義</div><h3>Noch keine gleichen Bedeutungen</h3><p>Sobald du ein Wort lernst, für das es ein anderes mit derselben Bedeutung gibt, erscheint die Gruppe hier – ganz von selbst. Über die Suche findest du schon jetzt alle.</p></div>`
        : alone.length ? `<div class="section-title">${hits.length ? 'Weitere Treffer ohne Gruppe' : 'Keine Gruppe gefunden'}</div><div class="gk-hint">${alone.map((it) => `<a class="gk-chip sec-vocab ${learned(it) ? '' : 'off'}" href="${App.link(it)}"><b lang="ja">${esc(word(it))}</b>${esc(App.itemSub(it) || '')}</a>`).join('')}</div><p class="small muted">Zu diesen Wörtern gibt es in deinen Vokabeln noch kein anderes mit gleicher Bedeutung.</p>`
        : '<div class="empty-state"><h3>Nichts gefunden</h3></div>';
      const n = shown.reduce((s, g) => s + (posOk(g) ? 1 : 0), 0);
      view.querySelector('[data-gb-count]').textContent = q ? `${hits.length} Gruppen gefunden${hits.length > SEARCH_MAX ? ` · die ersten ${SEARCH_MAX}` : ''}` : pos ? `${n} von ${shown.length} Gruppen` : `${shown.length} Gruppen · ${words} Wörter`;
    };
    input.addEventListener('input', apply);
    view.querySelector('[data-gb-pos]').onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      pos = b.dataset.v;
      view.querySelectorAll('[data-gb-pos] button').forEach((x) => x.classList.toggle('on', x === b));
      apply();
    };
    list.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-gb-learn]');
      if (!b) return;
      toggled.set(b.closest('[data-gb]').dataset.gb, true);
      keepQ = input.value;
      const snap = App.srsSnap([b.dataset.gbLearn]);
      await App.setCheck(b.dataset.gbLearn, 'learn');
      App.undoToast('Lernstand: Lernschlange', snap, () => App.render(true));
      App.render(true);
    });
    keepQ = '';
    apply();
  });

  // Zeile „Bedeutet ähnlich“ auf der Vokabel-Detailseite: je Gruppe die anderen Wörter, Sprung in die Übersicht
  App.synonymHint = (it) => {
    const gs = S.groupsOf(it, allGroups()).slice(0, 3);
    if (!gs.length) return '';
    return `<dt>Bedeutet ähnlich</dt><dd>${gs.map((g) => `<div class="gk-hint"><a class="small muted" href="${link(g)}" title="In „Gleiche Bedeutung“ ansehen">${esc(S.label(g))}:</a>${g.items.filter((o) => word(o) !== word(it)).map((o) => `<a class="gk-chip sec-vocab ${learned(o) ? '' : 'off'}" href="${App.link(o)}" title="${esc(o.de || '')}"><b lang="ja">${esc(word(o))}</b>${esc(App.itemSub(o) || '')}</a>`).join('')}</div>`).join('')}</dd>`;
  };
})(window.App);
