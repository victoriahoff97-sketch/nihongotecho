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
  // Wann das Wort in den Lernstapel kam: Einstufung, bei eigenen Wörtern das Anlegen
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
      <div class="gk-foot">${on ? App.statusBadge(it.id) : `<button class="btn btn-sm" data-gk-learn="${esc(it.id)}">${icon('plus')} In den Lernstapel</button>`}</div>
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
    const all = H.groups(App.itemsOf('vocab'));
    const groups = H.sort(H.visible(all, App.vocabStatus), changedAt, Date.now());
    const q = query.q || '';
    const words = groups.reduce((n, g) => n + g.items.length, 0);
    view.innerHTML = `<div class="${sec.cls} ${App.furiClass()}"><div class="page-head"><div class="titles"><h1>Gleichklang <span class="jp-title">同音</span></h1>
        <p>Wörter, die in der Grundform gleich gelesen werden, aber anders geschrieben sind und etwas anderes bedeuten. Die Übersicht wächst von selbst: Sobald ein Wort in deinem Lernstapel einen Gleichklang hat, steht es hier.</p></div></div>
      ${groups.length ? `<div class="toolbar"><input class="input" type="search" data-gk-q placeholder="はし, kami, Brücke …" value="${esc(q)}" style="max-width:280px">
          <div class="seg" data-gk-pos>${POS_FILTER.map(([k, l], i) => `<button class="${i ? '' : 'on'}" data-v="${k}">${l}</button>`).join('')}</div>
          <span class="grow"></span><span class="small muted" data-gk-count></span></div>
        <div class="gk-list">${groups.map((g) => groupHtml(g, q)).join('')}</div>
        <div class="empty-state" data-gk-none hidden><h3>Nichts gefunden</h3></div>
        <div class="gk-legend small muted"><span><span class="gk-chip sec-vocab"><b lang="ja">橋</b></span> lernst du schon</span><span><span class="gk-chip sec-vocab off"><b lang="ja">箸</b></span> klingt gleich, ist aber noch nicht in deinem Lernstapel</span></div>`
    : `<div class="empty-state"><div class="big" lang="ja">同音</div><h3>Noch kein Gleichklang</h3><p>Sobald ein Wort in deinem Lernstapel genauso gelesen wird wie ein anderes, erscheint die Gruppe hier – ganz von selbst.</p><a class="btn" href="#/vokabeln">${icon('vocab')} Zu den Vokabeln</a></div>`}</div>`;
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
      App.toast('Lernstand: ' + App.STATUS.learn.label);
      App.render(true);
    });
    apply();
  });

  // Zeile „Klingt gleich“ auf der Vokabel-Detailseite: die Partner als Chips, Sprung in die Übersicht
  App.homophoneHint = (it) => {
    const others = H.partners(it, App.itemsOf('vocab'));
    if (!others.length) return '';
    const href = link({ kana: H.key(it) });
    return `<dt>Klingt gleich</dt><dd><div class="gk-hint">${others.map((o) => `<a class="gk-chip sec-vocab ${learned(o) ? '' : 'off'}" href="${href}" title="Im Gleichklang ansehen"><b lang="ja">${esc(word(o))}</b>${esc(App.itemSub(o) || '')}</a>`).join('')}</div></dd>`;
  };
})(window.App);
