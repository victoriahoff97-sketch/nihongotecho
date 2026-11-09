/* Nihongo Techō – Vergleichen: kleines Fenster unter dem ⇄-Knopf in der oberen Leiste (auf jeder Seite, Taste V).
   Links steht, was gerade zu sehen ist (Karte der Lernrunde oder offene Detailseite), rechts, was man sucht –
   getippt oder mit dem Stift geschrieben (Suche und Schreibfeld wie beim Nachschlagen, js/lookup.js).
   Was die beiden unterscheidet, ist markiert (渡る / 渡す). Ändert nichts am Lernstand. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const CL = App.compareLogic;
  const LK = App.lookup;
  const C = App.compare = {};
  let pop = null, slots = [null, null], active = 1, pinned = false, run = 0, last = null;

  // Feld: { it } eigener Eintrag · { r } Treffer aus dem Wörterbuch (nicht in der Sammlung)
  const fromResult = (r) => { const it = r.id && App.item(r.id); return it ? { it } : { r }; };
  const words = (s) => {
    if (!s || s.hidden) return { jp: '', kana: '' };
    if (s.r) return { jp: s.r.jp || '', kana: s.r.kana && s.r.kana !== s.r.jp ? s.r.kana : '' };
    const it = s.it;
    if (it.type === 'kanji') return { jp: it.char || '', kana: '' };
    if (it.type === 'grammar') return { jp: JP.plain(it.jp || '') || it.title || '', kana: '' };
    if (it.type === 'phrase') return { jp: JP.plain(it.jp || ''), kana: JP.kana(it.jp || '') };
    const jp = it.kanji || it.kana || '';
    return { jp, kana: it.kana && it.kana !== jp ? it.kana : '' };
  };
  const diffHtml = (a, b) => CL.diffParts(a, b).map((p) => (p.diff ? `<mark class="cmp-diff">${esc(p.t)}</mark>` : esc(p.t))).join('');

  const colHtml = (i) => {
    const s = slots[i], other = words(slots[1 - i]), on = active === i ? ' on' : '';
    if (!s) return `<div class="cmp-col empty${on}" data-slot="${i}"><span class="muted small">${i === 0 ? 'Erstes Wort: unten suchen' : 'Womit vergleichen? Unten suchen oder schreiben'}</span></div>`;
    const w = words(s);
    // Karte einer Lernrunde: zugedeckt, sonst stünde hier die Lösung (Kanji schreiben, Deutsch → Japanisch)
    if (s.hidden) {
      const sec = App.SECTIONS[s.it.type];
      return `<div class="cmp-col cmp-hidden ${sec ? sec.cls : ''}${on}" data-slot="${i}" data-cmpreveal="${i}"><div class="cmp-top"><span class="badge sec ${sec ? sec.cls : ''}">Aktuelle Karte</span></div>
        <div class="cmp-big">？</div><span class="muted small">Zugedeckt, damit du die Lösung nicht siehst – antippen zum Aufdecken</span></div>`;
    }
    const clear = `<button class="icon-btn sm" data-cmpclear="${i}" title="Feld leeren">${icon('close')}</button>`;
    if (s.r) {
      return `<div class="cmp-col${on}" data-slot="${i}"><div class="cmp-top"><span class="badge">Wörterbuch</span>${clear}</div>
        <div class="cmp-big" lang="ja">${diffHtml(w.jp, other.jp)}</div>${w.kana ? `<div class="cmp-kana" lang="ja">${diffHtml(w.kana, other.kana)}</div>` : ''}
        <div class="cmp-de">${esc(s.r.meaning || '')}</div></div>`;
    }
    const it = s.it, sec = App.SECTIONS[it.type];
    const badges = [App.verbClsBadge(it), App.levelBadge(it), it.type === 'kanji' && it.strokes ? `<span class="badge">${esc(it.strokes)} Striche</span>` : ''].filter(Boolean).join(' ');
    let extra = '';
    if (it.type === 'kanji') {
      const kun = (it.kun || []).map(App.kanjiLogic.kunText).join('、'), on2 = (it.on || []).join('、');
      extra = `${on2 ? `<div class="small"><span class="muted">On</span> <span lang="ja">${esc(on2)}</span></div>` : ''}${kun ? `<div class="small"><span class="muted">Kun</span> <span lang="ja">${esc(kun)}</span></div>` : ''}
        ${(it.words || []).slice(0, 2).map((x) => `<div class="cmp-ex"><span lang="ja">${JP.ruby(x.jp)}</span> <span class="muted">${esc(x.de || '')}</span></div>`).join('')}
        <button class="btn btn-sm btn-ghost" data-cmpstroke="${i}">${icon('pen')} Strichfolge</button>`;
    } else if (it.type === 'grammar') {
      extra = `<div class="small">${esc(it.summary || '')}</div>`;
    } else {
      const use = (Array.isArray(it.use) ? it.use : []).filter((u) => u && u.jp).slice(0, 2);
      const ex = (it.examples || []).find((x) => x && x.jp);
      extra = use.map((u) => `<div class="cmp-use"><span lang="ja">${JP.useRuby(u.jp)}</span> <span class="muted">${esc(u.de || '')}</span></div>`).join('')
        + (ex ? `<div class="cmp-ex"><div lang="ja">${JP.ruby(ex.jp)}</div><div class="muted">${esc(App.exMeaning(ex))}</div></div>` : '');
    }
    return `<div class="cmp-col ${sec ? sec.cls : ''}${on}" data-slot="${i}"><div class="cmp-top"><span class="badge sec ${sec ? sec.cls : ''}">${esc(sec ? sec.one : '')}</span>${clear}</div>
      <div class="cmp-big" lang="ja">${it.type === 'grammar' ? esc(it.title || w.jp) : diffHtml(w.jp, other.jp)}</div>${w.kana ? `<div class="cmp-kana" lang="ja">${diffHtml(w.kana, other.kana)}</div>` : ''}
      <div class="cmp-de">${it.type === 'grammar' ? '' : App.meaningHtml(it)}</div>${badges ? `<div class="cmp-badges">${badges}</div>` : ''}
      ${extra}<a class="small cmp-open" href="${App.link(it)}" data-park>Eintrag öffnen ›</a></div>`;
  };
  const renderCols = () => { if (pop) pop.querySelector('.cmp-cols').innerHTML = colHtml(0) + colHtml(1); };

  const list = (res) => {
    last = res;
    const body = pop.querySelector('.cmp-results');
    if (!res.q) { body.innerHTML = ''; return; }
    const sec = (title, arr, grp) => (arr.length ? `<div class="lk-sec">${title}</div>${arr.map((r, i) => LK.rowHtml(r, i, grp)).join('')}` : '');
    const any = res.own.length || res.grammar.length || res.dict.length;
    body.innerHTML = any ? sec('Deine Wörter', res.own, 'own') + sec('Grammatik', res.grammar, 'grammar') + sec('Wörterbuch', res.dict, 'dict') : '<p class="muted small">Nichts gefunden</p>';
  };
  const search = async () => {
    const n = ++run, q = pop.querySelector('.cmp-search input').value.trim();
    const res = await LK.search(q);
    if (n === run && pop) list({ q, ...res });
  };
  const pick = (s) => {
    slots[active] = s;
    if (active === 0 && !slots[1]) active = 1;
    run++;
    const input = pop.querySelector('.cmp-search input');
    input.value = '';
    pop.querySelector('.cmp-results').innerHTML = '';
    padClear();
    renderCols();
  };
  let padClear = () => {};

  C.isOpen = () => !!pop;
  C.close = () => { if (!pop) return; run++; padClear(); pop.remove(); pop = null; pinned = false; document.querySelectorAll('[data-action="compare"]').forEach((b) => b.classList.remove('active')); };
  C.toggle = () => (pop ? C.close() : C.open());
  C.open = () => {
    if (pop) { pop.querySelector('.cmp-search input').focus(); return; }
    const cur = CL.entryOf(App.pageItem()), inRound = !!(App.screenItem && App.screenItem());
    slots = [cur && App.SECTIONS[cur.type] ? { it: cur, hidden: inRound } : null, null];
    active = slots[0] ? 1 : 0;
    pinned = false;
    pop = document.createElement('div');
    pop.className = 'cmp-pop lookup-pop card';
    pop.innerHTML = `<div class="cmp-head"><b>${icon('compare')} Vergleichen</b><span class="grow"></span>
        <button class="icon-btn sm" data-cmppin title="Anheften: bleibt offen, wenn du die Seite wechselst">${icon('pin')}</button>
        <button class="icon-btn sm" data-cmpclose title="Schließen (Esc)">${icon('close')}</button></div>
      <div class="cmp-cols"></div>
      <div class="lk-head cmp-search"><input class="input" type="search" autocomplete="off" placeholder="Womit vergleichen? Deutsch, かな, 漢字 oder Romaji"><button class="icon-btn sm" data-lkpad title="Mit dem Stift schreiben">${icon('pen')}</button></div>
      ${LK.padHtml()}<div class="lk-body cmp-results"></div>`;
    document.body.appendChild(pop);
    document.querySelectorAll('[data-action="compare"]').forEach((b) => b.classList.add('active'));
    const input = pop.querySelector('.cmp-search input'), pad = pop.querySelector('.lk-pad'), padBtn = pop.querySelector('[data-lkpad]');
    padClear = LK.pad(pop, (t) => { input.value = t; search(); }).clear;
    const setPad = (on) => { pad.hidden = !on; padBtn.classList.toggle('active', on); padClear(); };
    setPad(App.store.settings.lkPad !== false);
    input.addEventListener('input', App.debounce(search, 200));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); C.close(); }
      if (e.key === 'Enter') { const first = pop.querySelector('.cmp-results [data-lk]'); if (first) first.click(); }
    });
    // Eingaben im Fenster gehören nicht der Seite darunter (Schreibflächen, Karten-Tasten)
    pop.addEventListener('pointerdown', (e) => e.stopPropagation());
    pop.addEventListener('keydown', (e) => e.stopPropagation());
    pop.addEventListener('click', (e) => {
      if (e.target.closest('[data-cmpclose]')) { C.close(); return; }
      const pinBtn = e.target.closest('[data-cmppin]');
      if (pinBtn) { pinned = !pinned; pinBtn.classList.toggle('active', pinned); return; }
      if (e.target.closest('[data-lkpad]')) { setPad(pad.hidden); App.saveSettings({ lkPad: !pad.hidden }); return; }
      const clr = e.target.closest('[data-cmpclear]');
      if (clr) { const i = +clr.dataset.cmpclear; slots[i] = null; active = i; renderCols(); input.focus(); return; }
      const st = e.target.closest('[data-cmpstroke]');
      if (st) { const s = slots[+st.dataset.cmpstroke], host = st.closest('.cmp-col').querySelector('.cmp-big'); host.innerHTML = ''; host.classList.add('cmp-anim'); st.remove(); App.stroke.animator(host, s.it.char, { compact: true }); return; }
      const rev = e.target.closest('[data-cmpreveal]');
      if (rev) { const s = slots[+rev.dataset.cmpreveal]; if (s) s.hidden = false; renderCols(); return; }
      const row = e.target.closest('[data-lk]');
      if (row && last) { const [grp, i] = row.dataset.lk.split(':'); const r = last[grp][+i]; if (r) pick(fromResult(r)); return; }
      if (e.target.closest('a')) { if (e.target.closest('.cmp-open') && App.parkHere) App.parkHere(); return; } // aus einer Lernrunde: Runde parken
      const col = e.target.closest('[data-slot]');
      if (col) { active = +col.dataset.slot; renderCols(); }
    });
    renderCols();
    if (pad.hidden) input.focus();
  };

  // Seite gewechselt: Fenster schließt, außer es ist angeheftet
  App.onChange((w) => { if (w === 'route' && pop && !pinned) C.close(); });
})(window.App);
