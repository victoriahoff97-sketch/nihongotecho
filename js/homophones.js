/* Nihongo Techō – Gleichklang: Übersicht gleich gelesener Wörter und Hinweis an der Vokabel */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const H = App.homophones;
  const CLS = { u: 'u-Verb', ru: 'ru-Verb', irr: 'unregelmäßig' };
  const POS_FILTER = [['', 'Alle'], ['noun', 'Nomen'], ['verb', 'Verben'], ['adj', 'Adjektive']];
  const posGroup = (it) => (it.pos === 'i-adj' || it.pos === 'na-adj' ? 'adj' : it.pos || '');
  const word = (it) => it.kanji || it.kana;
  const learned = (it) => App.vocabStatus(it.id) !== 'unchecked';
  // von doppelt angelegten Wörtern zählt das, das du lernst
  const rank = (it) => ({ known: 2, learn: 1 }[App.vocabStatus(it.id)] || 0);
  // Wann das Wort ins Lernen kam: Einstufung, bei eigenen Wörtern das Anlegen
  const changedAt = (it) => {
    if (!learned(it)) return 0;
    const s = App.srsOf(it.id);
    return (s && s.checked) || (App.needsCheck(it) ? 0 : it.created || 0);
  };
  const link = (g) => '#/gleichklang?q=' + encodeURIComponent(g.kana.replace('～', ''));

  // von Hand auf- oder zugeklappte Gruppen behalten ihren Zustand über das Neuzeichnen hinweg
  const toggled = new Map();

  const tile = (it) => {
    const on = learned(it);
    const ex = (it.examples || [])[0];
    const verb = it.pos === 'verb' && it.v && it.v.cls;
    return `<div class="gk-tile sec-vocab ${on ? '' : 'off'}">
      <div class="gk-top"><a class="gk-word" href="${App.link(it)}" lang="ja" title="Vokabel öffnen">${esc(word(it))}</a>${App.accentHtml(it)}</div>
      <div class="gk-de">${App.meaningHtml(it)}</div>
      <div class="gk-meta">${it.pos ? `<span class="badge">${esc(App.POS[it.pos] || it.pos)}</span>` : ''}${verb ? `<span class="badge sec">${CLS[verb] || esc(verb)}</span><span class="gk-masu" lang="ja">${JP.ruby(JP.conj(it, 'masu'))}</span>` : ''}</div>
      ${ex ? `<div class="gk-ex"><span lang="ja">${JP.ruby(ex.jp)}</span><small>${esc(App.exMeaning(ex))}</small></div>` : ''}
      <div class="gk-foot">${on ? App.statusBadge(it.id) : `<button class="btn btn-sm" data-gk-learn="${esc(it.id)}">${icon('plus')} In die Lernschlange</button>`}</div>
    </div>`;
  };

  const groupHtml = (g, q) => {
    const pitch = H.pitch(g, App.accentOf);
    const notes = [`${g.items.length} Wörter`, pitch === 'diff' ? 'unterschiedlich betont' : pitch === 'same' ? 'gleich betont' : '', H.conjDiffers(g) ? 'unterschiedlich gebeugt' : ''].filter(Boolean);
    const open = toggled.has(g.key) ? toggled.get(g.key) : !!q;
    const pos = [...new Set(g.items.map(posGroup))].join(' ');
    return `<details class="card gk-group" data-gk="${esc(g.key)}" data-pos="${esc(pos)}" ${open ? 'open' : ''}>
      <summary><span class="gk-kana" lang="ja">${esc(g.kana)}</span>
        <span class="gk-chips">${g.items.map((it) => `<span class="gk-chip sec-vocab ${learned(it) ? '' : 'off'}"><b lang="ja">${esc(word(it))}</b>${esc(App.itemSub(it) || '')}</span>`).join('')}</span>
        ${g.fresh ? '<span class="badge sec">neu</span>' : ''}<span class="gk-caret" aria-hidden="true">▾</span></summary>
      <div class="gk-body"><div class="small muted">${notes.join(' · ')}</div>
        <div class="gk-tiles">${g.items.map(tile).join('')}</div></div>
    </details>`;
  };

  App.route('/gleichklang', (view, p, query) => {
    const sec = { cls: 'sec-homophone' };
    const all = H.groups(App.itemsOf('vocab'), rank);
    const groups = H.sort(H.visible(all, App.vocabStatus), changedAt, Date.now());
    const q = query.q || '';
    const words = groups.reduce((n, g) => n + g.items.length, 0);
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="page-head"><div class="titles"><h1>Gleichklang <span class="jp-title">同音</span></h1>
        <p>Wörter, die in der Grundform gleich gelesen werden, aber anders geschrieben sind und etwas anderes bedeuten. Die Übersicht wächst von selbst: Sobald ein Wort, das du lernst, einen Gleichklang hat, steht es hier.</p></div></div>
      <div class="tabs"><a class="tab" href="#/vokabeln" style="text-decoration:none">Einträge</a><a class="tab" href="#/vokabeln?tab=files" style="text-decoration:none">${icon('file')} Dateien</a>${App.GK_TAB(true)}</div>
      ${groups.length ? `<div class="toolbar"><input class="input" type="search" data-gk-q placeholder="はし, kami, Brücke …" value="${esc(q)}" style="max-width:280px">
          <div class="seg" data-gk-pos>${POS_FILTER.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-v="${k}">${l}</button>`).join('')}</div>
          <span class="grow"></span><span class="small muted" data-gk-count></span></div>
        <div class="gk-list">${groups.map((g) => groupHtml(g, q)).join('')}</div>
        <div class="empty-state" data-gk-none hidden><h3>Nichts gefunden</h3></div>
        <div class="gk-legend small muted"><span><span class="gk-chip sec-vocab"><b lang="ja">橋</b></span> lernst du schon</span><span><span class="gk-chip sec-vocab off"><b lang="ja">箸</b></span> klingt gleich, lernst du aber noch nicht</span></div>`
    : `<div class="empty-state"><div class="big" lang="ja">同音</div><h3>Noch kein Gleichklang</h3><p>Sobald ein Wort, das du lernst, genauso gelesen wird wie ein anderes, erscheint die Gruppe hier – ganz von selbst.</p><a class="btn" href="#/vokabeln">${icon('vocab')} Zu den Vokabeln</a></div>`}</div>`;
    if (!groups.length) return;

    const byKey = new Map(groups.map((g) => [g.key, g]));
    const els = [...view.querySelectorAll('[data-gk]')];
    const input = view.querySelector('[data-gk-q]');
    let pos = '';
    const apply = () => {
      let n = 0;
      els.forEach((el) => {
        const show = H.matches(byKey.get(el.dataset.gk), input.value) && (!pos || el.dataset.pos.split(' ').includes(pos));
        el.hidden = !show;
        if (show) n++;
      });
      view.querySelector('[data-gk-none]').hidden = n > 0;
      view.querySelector('[data-gk-count]').textContent = n === groups.length ? `${groups.length} Gruppen · ${words} Wörter` : `${n} von ${groups.length} Gruppen`;
    };
    input.addEventListener('input', apply);
    view.querySelector('[data-gk-pos]').onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      pos = b.dataset.v;
      view.querySelectorAll('[data-gk-pos] button').forEach((x) => x.classList.toggle('on', x === b));
      apply();
    };
    els.forEach((el) => el.addEventListener('toggle', () => toggled.set(el.dataset.gk, el.open)));
    view.querySelector('.gk-list').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-gk-learn]');
      if (!b) return;
      toggled.set(b.closest('[data-gk]').dataset.gk, true);
      await App.setCheck(b.dataset.gkLearn, 'learn');
      App.toast('Lernstand: Lernschlange');
      App.render(true);
    });
    apply();
  });

  // ---------- Kanji: Reiter „Gleiche Lesung“ auf der Kanji-Seite ----------
  const KIND_FILTER = [['', 'Alle'], ['kun', 'Kun'], ['on', 'On']];
  const ORDER = [['abc', 'あいうえお'], ['neu', 'Neu gelernt zuerst']];
  const kLearned = (k) => App.vocabStatus(k.id) !== 'unchecked';
  const kanjiGroups = () => H.sort(H.visible(H.kanjiGroups(App.itemsOf('kanji'), rank), App.vocabStatus), changedAt, Date.now());
  let kOrder = 'abc';
  const readText = (r) => (r.kind === 'kun' ? App.kanjiLogic.kunText(r.text) : r.text);
  const kToggled = new Map();

  const kCell = (k, r) => `<div class="kg-cell ${kLearned(k) ? '' : 'off'}">${App.kanjiTile(k)}
      <div class="kg-read"><span class="kg-kind">${r.kind === 'on' ? 'On' : 'Kun'}</span><span lang="ja">${esc(readText(r))}</span></div>
      ${kLearned(k) ? '' : `<button class="btn btn-sm" data-kg-learn="${esc(k.id)}" title="In den Lernstapel">${icon('plus')} Lernen</button>`}</div>`;

  const kGroupHtml = (g, q) => {
    // was du schon lernst, steht vorn
    const items = g.items.slice().sort((a, b) => rank(b) - rank(a));
    const kinds = [...new Set([...g.read.values()].map((r) => r.kind))].join(' ');
    const open = kToggled.has(g.key) ? kToggled.get(g.key) : !!q;
    return `<details class="card gk-group" data-kg="${esc(g.key)}" data-kind="${kinds}" ${open ? 'open' : ''}>
      <summary><span class="gk-kana" lang="ja">${H.kanjiLabels(g).map((t) => esc(App.kanjiLogic.kunText(t))).join(' · ')}</span>
        <span class="gk-chips">${items.map((k) => `<span class="gk-chip sec-kanji ${kLearned(k) ? '' : 'off'}"><b lang="ja">${esc(k.char)}</b>${esc(App.meaning(k).text.split(',')[0])}</span>`).join('')}</span>
        ${g.fresh ? '<span class="badge sec">neu</span>' : ''}<span class="gk-caret" aria-hidden="true">▾</span></summary>
      <div class="gk-body"><div class="small muted">${items.length} Kanji</div>
        <div class="kg-cells">${items.map((k) => kCell(k, g.read.get(k.char))).join('')}</div></div>
    </details>`;
  };

  App.kanjiHomophones = (body, q) => {
    const groups = H.kanjiOrder(kanjiGroups(), kOrder);
    const query = q.r || '';
    const n = groups.reduce((s, g) => s + g.items.length, 0);
    body.innerHTML = `<p class="muted">Kanji, die gleich gelesen werden – On- und Kun-Lesung zusammen. Ein Kanji mit mehreren Lesungen steht in mehreren Gruppen. Die Übersicht wächst von selbst: Sobald du ein Kanji lernst, erscheinen seine Lesungen hier.</p>
      ${groups.length ? `<div class="toolbar"><input class="input" type="search" data-kg-q placeholder="chi, セイ, あける, Blut …" value="${esc(query)}" style="max-width:280px">
          <div class="seg" data-kg-kind>${KIND_FILTER.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-v="${k}">${l}</button>`).join('')}</div>
          <select class="input" data-kg-order title="Reihenfolge" style="width:auto">${ORDER.map(([k, l]) => `<option value="${k}" ${kOrder === k ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <span class="grow"></span><span class="small muted" data-kg-count></span></div>
        <div class="gk-list">${groups.map((g) => kGroupHtml(g, query)).join('')}</div>
        <div class="empty-state" data-kg-none hidden><h3>Nichts gefunden</h3></div>
        <div class="gk-legend small muted"><span><span class="gk-chip sec-kanji"><b lang="ja">地</b></span> lernst du schon</span><span><span class="gk-chip sec-kanji off"><b lang="ja">池</b></span> gleich gelesen, lernst du aber noch nicht</span></div>`
    : '<div class="empty-state"><div class="big" lang="ja">同音</div><h3>Noch keine gleichen Lesungen</h3><p>Sobald du ein Kanji lernst, das genauso gelesen wird wie ein anderes, erscheint die Gruppe hier – ganz von selbst.</p></div>'}`;
    if (!groups.length) return;

    const byKey = new Map(groups.map((g) => [g.key, g]));
    const els = [...body.querySelectorAll('[data-kg]')];
    const input = body.querySelector('[data-kg-q]');
    let kind = '';
    const apply = () => {
      let shown = 0;
      els.forEach((el) => {
        const show = H.kanjiMatches(byKey.get(el.dataset.kg), input.value) && (!kind || el.dataset.kind.split(' ').includes(kind));
        el.hidden = !show;
        if (show) shown++;
      });
      body.querySelector('[data-kg-none]').hidden = shown > 0;
      body.querySelector('[data-kg-count]').textContent = shown === groups.length ? `${groups.length} Lesungen · ${n} Einträge` : `${shown} von ${groups.length} Lesungen`;
    };
    input.addEventListener('input', apply);
    body.querySelector('[data-kg-kind]').onclick = (e) => {
      const b = e.target.closest('[data-v]');
      if (!b) return;
      kind = b.dataset.v;
      body.querySelectorAll('[data-kg-kind] button').forEach((x) => x.classList.toggle('on', x === b));
      apply();
    };
    els.forEach((el) => el.addEventListener('toggle', () => kToggled.set(el.dataset.kg, el.open)));
    // umsortieren ohne Neuzeichnen: Suche, Filter und Aufgeklapptes bleiben
    body.querySelector('[data-kg-order]').onchange = (e) => {
      kOrder = e.target.value;
      const list = body.querySelector('.gk-list');
      H.kanjiOrder(groups, kOrder).forEach((g) => list.appendChild(els.find((el) => el.dataset.kg === g.key)));
    };
    body.querySelector('.gk-list').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-kg-learn]');
      if (!b) return;
      kToggled.set(b.closest('[data-kg]').dataset.kg, true);
      const snap = App.srsSnap([b.dataset.kgLearn]);
      await App.setCheck(b.dataset.kgLearn, 'learn');
      App.undoToast('Lernstand: ' + App.statusInfo({ type: 'kanji' }, 'learn').label, snap, () => App.render(true));
      App.render(true);
    });
    apply();
  };

  // Auf der Kanji-Seite: Lesung als Sprung in „Gleiche Lesung“, wenn es dort eine Gruppe dazu gibt
  App.kanjiReadingHref = (() => {
    let keys = null;
    App.onChange(() => { keys = null; });
    return (reading) => {
      if (!keys) keys = new Set(kanjiGroups().map((g) => g.key));
      const key = JP.toHira(String(reading || '').replace(/[-－\s.．]/g, ''));
      return keys.has(key) ? '#/kanji?tab=gleich&r=' + encodeURIComponent(key) : '';
    };
  })();

  // Zeile „Klingt gleich“ auf der Vokabel-Detailseite: die Partner als Chips, Sprung in die Übersicht
  App.homophoneHint = (it) => {
    const others = H.partners(it, App.itemsOf('vocab'), rank);
    if (!others.length) return '';
    const href = link({ kana: H.key(it) });
    return `<dt>Klingt gleich</dt><dd><div class="gk-hint">${others.map((o) => `<a class="gk-chip sec-vocab ${learned(o) ? '' : 'off'}" href="${href}" title="Im Gleichklang ansehen"><b lang="ja">${esc(word(o))}</b>${esc(App.itemSub(o) || '')}</a>`).join('')}</div></dd>`;
  };
})(window.App);
