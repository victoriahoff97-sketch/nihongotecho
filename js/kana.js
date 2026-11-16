/* Nihongo Techō – Kana schreiben (#/ueben/kana): Hiragana und Katakana mit dem Stift lernen und abfragen */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const S = App.store;
  const K = App.kanaLogic, W = App.writeLogic, JP = App.jp;
  let nextRound = null; // Wunsch vom Abschlussbild: gleich die nächste Runde starten ('due' | 'new')
  const picked = { h: new Set(), k: new Set() }; // für „Frei üben“ angetippte Zeilen, je Schrift (bleibt beim Neuzeichnen)

  const kQueue = (script) => K.queue(S.srs, W.dayEnd(Date.now()), script);
  App.kanaQueue = () => Object.assign(kQueue(), { kana: true }); // für „Jetzt wiederholen“ (alle fälligen Kana)
  const newOf = (q) => q.fresh.slice(0, K.NEW_MAX);
  const DOT = { new: '', learn: 'learn', known: 'known' };

  // Aufgabe einer Karte: Lesung groß, darüber welche Schrift – auch für die gemischte Runde (practice.js)
  App.kanaPromptHtml = (it) => `<div class="kana-ask"><span class="kana-script ${it.script}">${K.SCRIPTS[it.script]}</span>
    <div class="ex-prompt kana-romaji">${esc(it.romaji)}</div>${JP.canSpeak() ? `<button type="button" class="btn btn-sm btn-ghost" data-kana-say="${esc(it.char)}" title="Vorlesen">${icon('speak')} anhören</button>` : ''}</div>`;
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-kana-say]'); if (b) JP.speak(b.dataset.kanaSay); });

  App.route('/ueben/kana', (view, p, q) => {
    const sec = App.SECTIONS.kanji;
    const script = q.s === 'k' ? 'k' : 'h';
    const kq = kQueue(script), fresh = newOf(kq);
    const c = K.counts(kq.items, S.srs);
    const sel = picked[script];
    const selItems = K.rows(script).filter((r) => sel.has(r.label)).flatMap((r) => r.items);
    const rowHtml = (r) => `<button type="button" class="kana-row ${sel.has(r.label) ? 'on' : ''} ${r.daku ? 'daku' : ''}" data-row="${esc(r.label)}" aria-pressed="${sel.has(r.label)}">
      ${r.items.map((it) => `<span class="kana-cell ${DOT[K.status(S.srs, it)]}" lang="ja" title="${esc(it.romaji)}">${esc(it.char)}<small>${esc(it.romaji.split(' ')[0])}</small></span>`).join('')}</button>`;
    const rows = K.rows(script);
    view.innerHTML = `<div class="${sec.cls}"><div class="crumbs">${App.backCrumb()} › Kana schreiben</div>
      <div class="page-head"><div class="titles"><h1>Kana schreiben <span class="jp-title">${script === 'k' ? 'ア' : 'あ'}</span></h1><p>${kq.due.length} fällig · ${c.known} kann ich · ${c.learn} in der Lernschlange · ${c.new} noch nie geschrieben</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div class="row between"><div class="seg">${Object.entries(K.SCRIPTS).map(([k, l]) => `<button type="button" class="${k === script ? 'on' : ''}" data-script="${k}">${l}</button>`).join('')}</div>
          <div class="kana-legend small muted"><span class="kana-cell known"></span> kann ich <span class="kana-cell learn"></span> Lernschlange <span class="kana-cell"></span> neu</div></div>
        <div class="kana-table">${rows.filter((r) => !r.daku).map(rowHtml).join('')}</div>
        <div class="small muted">Mit ゛ und ゜</div>
        <div class="kana-table">${rows.filter((r) => r.daku).map(rowHtml).join('')}</div>
        <div class="row between karten-go"><div class="row">
          <button class="btn ${kq.due.length ? 'btn-primary' : ''}" data-round="due" ${kq.due.length ? '' : 'disabled'}>${icon('play')} Wiederholen (${kq.due.length} fällig)</button>
          <button class="btn ${kq.due.length ? '' : 'btn-primary'}" data-round="new" ${fresh.length ? '' : 'disabled'}>${icon('plus')} Neue lernen${fresh.length ? ` <span lang="ja">${fresh.map((x) => esc(x.char)).join('')}</span>` : ''}</button>
          <button class="btn" data-free ${selItems.length ? '' : 'disabled'} title="Zählt nicht zur Lernschlange – dein Lernstand bleibt, wie er ist">${icon('shuffle')} Frei üben (${selItems.length})</button></div></div>
        <div class="small muted">Neue lernen: Strichfolge ansehen, nachspuren, dann ohne Vorlage schreiben. Zeilen antippen wählt sie fürs freie Üben aus.</div></div></div>
      <div data-stage style="margin-top:16px"></div></div>`;
    view.querySelectorAll('[data-script]').forEach((b) => (b.onclick = () => { location.hash = '#/ueben/kana' + (b.dataset.script === 'k' ? '?s=k' : ''); }));
    view.querySelectorAll('[data-row]').forEach((b) => (b.onclick = () => { const l = b.dataset.row; if (sel.has(l)) sel.delete(l); else sel.add(l); App.render(true); }));
    const stage = view.querySelector('[data-stage]');
    const start = (list, mode) => { view.querySelector('[data-setup]').hidden = true; runKana(stage, list, mode, script); };
    view.querySelector('[data-round="due"]').onclick = () => start(kq.due, 'due');
    view.querySelector('[data-round="new"]').onclick = () => start(fresh, 'new');
    view.querySelector('[data-free]').onclick = () => start(App.shuffle(selItems), 'free');
    const kind = nextRound || (['due', 'new'].includes(q.round) ? q.round : '');
    nextRound = null;
    const auto = kind && view.querySelector(`[data-round="${kind}"]`);
    if (auto && !auto.disabled) auto.click();
  });

  // mode: 'new' = erst nachspuren, dann schreiben und einstufen · 'due' = abfragen und bewerten · 'free' = abfragen ohne Bewertung
  // Falsch Geschriebenes kommt in derselben Runde noch einmal (dann ohne Nachspuren)
  function runKana(stage, list, mode, script) {
    const kit = App.writeKit;
    const graded = mode !== 'free';
    const qs = list.map((it) => ({ it, learn: mode === 'new' }));
    let i = 0, score = 0, last = null, pending = null;
    // Gullideckel: neue Deckel (z. B. Uhrzeit-Deckel bei der ersten Bewertung) warten bis zum Rundenende oder Verlassen
    const hold = (on) => { try { if (App.manhole) App.manhole.hold(on); } catch (e) { console.error('Gullideckel:', e); } };
    hold(true);
    App.onLeave(() => hold(false));
    const undoBtn = () => (last ? `<button class="btn btn-sm btn-ghost" data-kundo title="Letzte Bewertung zurücknehmen">${icon('undo')} Rückgängig</button>` : '');
    stage.addEventListener('click', async (e) => {
      if (!e.target.closest('[data-kundo]') || !last) return;
      const l = last; last = null;
      if (l.snap) await App.srsRestore(l.snap);
      if (l.again) qs.splice(l.again, 1);
      ({ i, score } = l);
      hold(true); // Rückgängig auf dem Endbildschirm: die Karte ist wieder da
      next();
    });
    const head = (cur) => `<div class="small muted">${undoBtn()} ${K.SCRIPTS[cur.it.script]} ${i + 1} / ${qs.length}${graded ? '' : ' · freies Üben'}${graded && W.isFirst(S.srs, cur.it.id) ? ' <span class="badge">erster Versuch</span>' : ''}</div>`;
    const next = () => {
      if (pending) { stage.removeEventListener('click', pending); pending = null; }
      if (i >= qs.length) return end();
      const cur = qs[i];
      if (cur.learn) return learnStep(cur);
      quizStep(cur);
    };
    // Schritt 1 (nur bei Neuem): Strichfolge links, Schreibfeld mit Vorlage zum Nachspuren rechts
    const learnStep = (cur) => {
      const it = cur.it;
      stage.innerHTML = `<div class="card pad-lg">${head(cur)}<div class="row" style="gap:14px;align-items:baseline"><div class="ex-prompt kana-romaji">${esc(it.romaji)}</div><span class="muted">so schreibt man <b lang="ja">${esc(it.char)}</b> – fahre die Vorlage nach</span></div>
        <div class="kanji-stage quiz-stage" style="margin-top:14px"><div data-anim></div><div data-pad></div></div>
        <div class="row" style="margin-top:14px" data-btns><button class="btn btn-primary" data-go>${icon('next')} Jetzt ohne Vorlage</button></div></div>`;
      App.stroke.animator(stage.querySelector('[data-anim]'), it.char);
      App.stroke.pad(stage.querySelector('[data-pad]'), it.char, { template: true }).then(() => kit.padButtons(stage));
      stage.querySelector('[data-go]').onclick = () => { cur.learn = false; next(); };
    };
    // Schritt 2: Lesung sehen, frei schreiben, auflösen, selbst bewerten
    const quizStep = (cur) => {
      const it = cur.it;
      stage.innerHTML = `<div class="card pad-lg">${head(cur)}${App.kanaPromptHtml(it)}
        <div class="kanji-stage quiz-stage" style="margin-top:14px"><div data-sol class="stroke-box" style="display:grid;place-items:center;min-height:240px;color:var(--muted)">?</div><div data-pad></div></div>
        <div class="row" style="margin-top:14px" data-btns><button class="btn btn-primary" data-show>${icon('eye')} Auflösen</button></div></div>`;
      const pad = App.stroke.pad(stage.querySelector('[data-pad]'), it.char, { template: false, quiz: true });
      pad.then(() => kit.padButtons(stage));
      stage.querySelector('[data-show]').onclick = () => {
        pad.then((p) => p.reveal());
        App.stroke.animator(stage.querySelector('[data-sol]'), it.char);
        const first = graded && W.isFirst(S.srs, it.id);
        stage.querySelector('[data-btns]').innerHTML = graded
          ? `<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch · ${kit.againTxt(it.id, 0)}</button><button class="btn" style="background:var(--${first ? 'ai' : 'matcha'}-soft)" data-r="2">✓ Richtig${W.isMarkedKnown(S.srs, it.id) ? '' : ` · ${kit.againTxt(it.id, 2)}`}</button>${first ? `<button class="btn" style="background:var(--matcha-soft)" data-r="known" title="Als gelernt einstufen – wird nicht mehr abgefragt">${icon('check')} Kann ich schon</button>` : ''}`
          : '<button class="btn" style="background:var(--shu-soft)" data-r="0">✗ Falsch</button><button class="btn" style="background:var(--matcha-soft)" data-r="2">✓ Richtig</button>';
      };
      stage.addEventListener('click', pending = async function h(e) {
        const b = e.target.closest('[data-r]'); if (!b) return;
        stage.removeEventListener('click', h); pending = null;
        const known = b.dataset.r === 'known', g = known ? 2 : +b.dataset.r;
        last = { i, score, snap: graded ? App.srsSnap([W.id(it.id)]) : null, again: 0 };
        if (g) score++;
        if (graded) await (known ? App.markWriteKnown(it.id) : App.gradeWrite(it.id, g));
        if (!g) { last.again = Math.min(i + 4, qs.length); qs.splice(last.again, 0, { it, learn: false }); }
        i++; next();
      });
    };
    const end = () => {
      hold(false);
      const q = kQueue(script), fresh = newOf(q);
      stage.innerHTML = `<div class="card pad-lg" style="text-align:center;max-width:640px;margin:0 auto"><div class="score-ring">${score} / ${qs.length}</div><h2>${score >= qs.length * 0.8 ? 'すごい！' : 'がんばって！'}</h2>
        <p class="muted">${qs.length > list.length ? 'Falsch Geschriebenes kam in dieser Runde gleich noch einmal dran.' : 'Alles auf Anhieb richtig geschrieben.'}${graded ? '' : ' Frei geübt – dein Lernstand bleibt, wie er ist.'}</p>
        <div class="row" style="justify-content:center">${undoBtn()}<button class="btn" data-home>Zur Übersicht</button>
        ${q.due.length ? `<button class="btn btn-primary" data-again="due">${icon('play')} Weiter wiederholen (${q.due.length})</button>` : ''}
        ${fresh.length ? `<button class="btn ${q.due.length ? '' : 'btn-primary'}" data-again="new">${icon('plus')} Nächste lernen <span lang="ja">${fresh.map((x) => esc(x.char)).join('')}</span></button>` : ''}</div></div>`;
      stage.querySelector('[data-home]').onclick = () => App.render();
      stage.querySelectorAll('[data-again]').forEach((b) => (b.onclick = () => { nextRound = b.dataset.again; App.render(); }));
      if (App.backup && App.backup.nudge) App.backup.nudge();
    };
    next();
  }
})(window.App);
