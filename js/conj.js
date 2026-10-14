/* Nihongo Techō – Üben: Konjugieren (Formen von Verben und Adjektiven bilden, aufdecken, selbst bewerten) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const S = App.store;
  const F = App.formMap;
  const C = App.conjLogic;
  const VERB_CLS = { u: 'う-Verb', ru: 'る-Verb', irr: 'unregelmäßig' };
  const lineColor = (f) => F.LINES[f.line].color;

  // Kartenseiten für die Kartenrunde (practice.js): vorne Grundform + gesuchte Form, hinten Lösung, Verbgruppe und Regel.
  // Die Verbgruppe steht bewusst erst hinten – sie zu erkennen gehört zur Aufgabe
  App.conjFaces = (it, formId) => {
    const f = F.form(formId);
    const sol = F.example(f, it).to;
    return {
      front: `<div class="front" lang="ja">${JP.wordRuby(it)}</div><div class="muted">${App.meaningHtml(it)}</div><div class="conj-ask" style="--c:${lineColor(f)}">→ ${esc(f.label)}</div>`,
      back: `<div class="ans jp" lang="ja">${JP.ruby(sol)}</div>${it.pos === 'verb' ? `<div><span class="badge">${VERB_CLS[it.v.cls]}</span></div>` : ''}<p class="small muted conj-rule">${esc(f.rule)}</p>`,
      speak: JP.plain(sol),
    };
  };

  // Von der Lernlandkarte („Diese Form üben“): Auswahl nur für diesen Besuch, die gemerkte bleibt unberührt
  let visit = null;

  App.route('/ueben/konjugieren', (view, p, q) => {
    const preset = C.preset(q.form);
    if (!preset) visit = null;
    else if (!visit || visit.form !== q.form) visit = { form: q.form, sel: preset };
    const sel = visit ? visit.sel : C.clean(App.lsGet('conjSel')) || C.defaults(S.settings.formsKnown);
    const save = () => { if (!visit) App.lsSet('conjSel', JSON.stringify(sel)); };

    const byChoice = q.w === 'wahl';
    const all = App.itemsOf('vocab').filter((it) => C.POS.some((x) => x.id === it.pos));
    let base = all;
    if (!byChoice) base = all.filter((it) => C.mine(App.wordState(it), App.vocabStatus(it.id)));
    else {
      if (q.src) base = base.filter((i) => App.srcMatch(i, q.src));
      if (q.l) base = base.filter((i) => String(i.lesson) === q.l);
      if (q.lvl) base = base.filter((i) => App.levelMatch(i, q.lvl));
    }
    const pool = () => C.pool(base, sel);

    const groupHtml = (g) => `<div class="conj-group" data-pos="${g.pos}" style="--c:${g.color}">
        <div class="conj-group-head"><b>${esc(g.label)}</b><button class="btn btn-sm btn-ghost" data-all>alle</button><button class="btn btn-sm btn-ghost" data-none>keine</button></div>
        <div class="conj-forms">${g.forms.map((f) => `<label class="picker-row"><input type="checkbox" data-form value="${f.id}" ${sel.forms.includes(f.id) ? 'checked' : ''}><span>${esc(f.label)}</span><span class="jp muted" lang="ja">${esc(JP.plain(F.example(f, F.sampleWord(f)).to))}</span></label>`).join('')}</div></div>`;
    view.innerHTML = `<div class="sec-grammar"><div class="crumbs">${App.backCrumb()} › Konjugieren</div>
      <div class="page-head"><div class="titles"><h1>Konjugieren <span class="jp-title">活用</span></h1><p>Du siehst ein Wort in der Grundform und bildest die gesuchte Form – im Kopf oder auf Papier. Dann deckst du auf. An deinem Lernstand ändert das nichts.</p></div></div>
      <div class="card" data-setup><div class="stack">
        <div><div class="small muted conj-label">Wortarten</div>
          <div class="row">${C.POS.map((x) => `<label class="picker-row"><input type="checkbox" data-pos-check value="${x.id}" ${sel.pos.includes(x.id) ? 'checked' : ''}><span>${esc(x.label)}</span></label>`).join('')}</div></div>
        <div><div class="small muted conj-label">Formen</div><div class="conj-groups">${C.groups().map(groupHtml).join('')}</div></div>
        <div><div class="small muted conj-label">Wörter</div>
          <div class="row"><div class="seg"><button class="${byChoice ? '' : 'on'}" data-q-w="">Meine Wörter</button><button class="${byChoice ? 'on' : ''}" data-q-w="wahl">Nach Lektion oder Niveau</button></div>
            ${byChoice ? `${App.sourceSelect(all, q.src)}${App.lessonSelect(all.filter((i) => App.srcMatch(i, q.src)), q.l)}${App.levelSelect(q.lvl)}` : '<span class="small muted">alles, was du gerade lernst oder schon kannst</span>'}</div></div>
        <div class="small muted" data-hint></div>
        <div class="row"><button class="btn btn-primary" data-go></button>${App.cards.chunkSelect()}</div></div></div>
      <div data-stage></div></div>`;
    const setup = view.querySelector('[data-setup]');
    App.cards.bindChunk(view);

    // Zahl, Sperren und Hinweise an Ort und Stelle nachziehen (ohne Neuzeichnen, damit Häkchen-Setzen flüssig bleibt)
    const refresh = () => {
      setup.querySelectorAll('.conj-group').forEach((el) => {
        const off = !sel.pos.includes(el.dataset.pos);
        el.classList.toggle('off', off);
        el.querySelectorAll('input, button').forEach((x) => { x.disabled = off; });
      });
      const nForms = sel.forms.filter((id) => sel.pos.includes(C.posOf(F.form(id)))).length;
      const pl = pool(), n = pl.words.length;
      const go = setup.querySelector('[data-go]');
      go.disabled = !n;
      go.innerHTML = `${icon('play')} Runde starten (${n} ${n === 1 ? 'Wort' : 'Wörter'})`;
      const hints = [];
      if (!nForms) hints.push('Wähle mindestens eine Form aus.');
      else if (!n && !byChoice) hints.push('Unter deinen Wörtern ist noch kein passendes Verb oder Adjektiv. Dorthin kommt alles, was du lernst oder schon kannst. <button class="btn btn-sm" data-q-w="wahl">Nach Lektion oder Niveau üben</button>');
      else if (!n) hints.push('Zu dieser Auswahl gibt es keine passenden Wörter.');
      if (pl.skipped) hints.push(`${pl.skipped} ${pl.skipped === 1 ? 'Verb' : 'Verben'} ohne Verbgruppe ausgelassen – die Verbgruppe trägst du im Vokabel-Eintrag ein.`);
      setup.querySelector('[data-hint]').innerHTML = hints.map((h) => `<div>${h}</div>`).join('');
    };
    const setList = (list, id, on) => { const i = list.indexOf(id); if (on && i < 0) list.push(id); if (!on && i >= 0) list.splice(i, 1); };
    setup.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-pos-check]')) setList(sel.pos, t.value, t.checked);
      else if (t.matches('[data-form]')) setList(sel.forms, t.value, t.checked);
      else return;
      save(); refresh();
    });
    setup.addEventListener('click', (e) => {
      const b = e.target.closest('[data-all], [data-none]');
      if (!b) return;
      b.closest('.conj-group').querySelectorAll('[data-form]').forEach((c) => { c.checked = b.hasAttribute('data-all'); setList(sel.forms, c.value, c.checked); });
      save(); refresh();
    });

    // Runde in Häppchen (wie „Meine Lernschlange üben“); die Auswertung je Form gilt für das gerade gespielte Häppchen.
    // Die Seite wird beim Zurückkommen aus einem Eintrag neu gezeichnet – deshalb Bühne und Auswahl erst beim Aufruf suchen
    const startRound = () => {
      const n = App.cards.chunkSize();
      const words = pool().words;
      const entries = C.tasks(words, sel, words.length < n ? n : 0).map((t) => ({ it: t.it, kind: 'conj', form: t.form, dir: 'jp' }));
      let stats = {};
      const opts = {
        cram: true,
        left: () => entries.length,
        onGrade: (ent, g) => { C.tally(stats, ent.form, g > 0, !ent.again); ent.again = true; },
        endHtml: () => { const rows = C.summary(stats); return rows.length ? `<div class="conj-summary">${rows.map((r) => { const f = F.form(r.form); return `<div style="--c:${lineColor(f)}"><b>${esc(f.label)}</b><span>${r.right}/${r.asked}</span></div>`; }).join('')}<a class="small" href="#/karte">${icon('map')} Zur Lernlandkarte</a></div>` : ''; },
      };
      opts.nextChunk = () => {
        stats = {};
        view.querySelector('[data-setup]').hidden = true;
        App.cards.run(view.querySelector('[data-stage]'), entries.splice(0, n || entries.length), opts);
      };
      opts.nextChunk();
    };
    setup.querySelector('[data-go]').onclick = startRound;
    refresh();

    // Zurück aus „Eintrag öffnen“: an derselben Karte weitermachen; inzwischen geänderte Wörter, die nicht mehr passen, fallen raus
    const r = App.cards.takeParked();
    if (r) {
      const open = r.entries[0];
      const entries = r.entries.filter((e) => { const f = F.form(e.form); return f && C.applies(f, e.it); });
      if (entries.length) {
        setup.hidden = true;
        App.cards.run(view.querySelector('[data-stage]'), entries, r.opts, Object.assign({}, r, { total: r.total - (r.entries.length - entries.length), open: r.open && entries[0] === open }));
      }
    }
  });
})(window.App);
