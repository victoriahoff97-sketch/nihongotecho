/* Nihongo Techō – Üben: Konjugieren (Formen von Verben und Adjektiven bilden, aufdecken, selbst bewerten) */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const F = App.formMap;
  const C = App.conjLogic;
  const VERB_CLS = App.VERB_CLS;
  const lineColor = (f) => F.LINES[f.line].color;

  // Kartenseiten für die Kartenrunde (practice.js): vorne Grundform + gesuchte Form, hinten Lösung, Verbgruppe und Regel.
  // Die Verbgruppe steht bewusst erst hinten – sie zu erkennen gehört zur Aufgabe
  App.conjFaces = (it, formId) => {
    const f = F.form(formId);
    const sol = F.example(f, it).to;
    return {
      front: `<div class="front" lang="ja">${JP.wordRuby(it)}</div><div class="muted">${App.meaningHtml(it)}</div><div class="conj-ask" style="--c:${lineColor(f)}">→ ${esc(f.ask || f.label)}</div>`,
      back: `<div class="ans jp" lang="ja">${JP.ruby(sol)}</div>${it.pos === 'verb' ? `<div><span class="badge">${VERB_CLS[it.v.cls]}</span></div>` : ''}<p class="small muted conj-rule">${esc(f.rule)}</p>`,
      speak: sol,
    };
  };

  // Beispiel einer Form am Beispielwort, z. B. 書く → 書いて (Grundform aus der Startstation derselben Wortart)
  const exampleOf = (f) => {
    const w = F.sampleWord(f);
    const start = F.FORMS.find((x) => !x.from.length && C.posOf(x) === C.posOf(f));
    return `${JP.plain(F.example(start, w).to)} → ${JP.plain(F.example(f, w).to)}`;
  };
  // Kachel einer Mischung: Name, kurze Beschreibung, ein Beispiel (der ます-Stamm allein taugt nicht als Beispiel)
  const mixHtml = (m) => {
    const fs = m.custom ? [] : C.mixForms(m);
    const show = fs.find((f) => f.id !== 'v-stem');
    const sub = m.custom ? 'Formen einzeln ankreuzen'
      : m.note || (m.forms ? fs.map((f) => f.label).join(', ') : m.pos ? `${fs.length} Formen von い- und な-Adjektiven` : `alle ${fs.length} Formen`);
    return `<button type="button" class="conj-mix${m.custom ? ' custom' : ''}" data-mix="${m.id}" aria-pressed="false" style="--c:${show ? lineColor(show) : 'var(--sec)'}">
      <b>${esc(m.label)}</b><span class="small muted">${esc(sub)}</span>${show ? `<span class="jp conj-mix-ex" lang="ja">${esc(exampleOf(show))}</span>` : ''}</button>`;
  };

  App.route('/ueben/konjugieren', (view, p, q) => {
    // Gewählte Mischung und eigene Zusammenstellung werden getrennt gemerkt – wer kurz „Nur die て-Form“ übt, verliert seine Auswahl nicht
    let mixId = C.cleanMix(App.lsGet('conjMix'));
    const custom = C.clean(App.lsGet('conjSel2')) || C.defaults();
    let sel = C.mixSel(mixId, custom);

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

    // Selbst zusammenstellen: je Formenfamilie ein Häkchen für alle ihre Formen, darunter die Formen einzeln
    const groupHtml = (g) => `<div class="conj-group" style="--c:${g.color}">
        <label class="picker-row conj-group-head"><input type="checkbox" data-line-check><b>${esc(g.label)}</b><span class="small muted" data-count></span></label>
        <div class="conj-forms" ${g.forms.length > 1 ? '' : 'hidden'}>${g.forms.map((f) => `<label class="picker-row"><input type="checkbox" data-form value="${f.id}" ${custom.forms.includes(f.id) ? 'checked' : ''}><span>${esc(f.label)}</span><span class="jp muted" lang="ja">${esc(JP.plain(F.example(f, F.sampleWord(f)).to))}</span></label>`).join('')}</div></div>`;
    view.innerHTML = `<div class="sec-grammar"><div class="crumbs">${App.backCrumb()} › Konjugieren</div>
      <div class="page-head"><div class="titles"><h1>Konjugieren <span class="jp-title">活用</span></h1><p>Du siehst ein Wort in der Grundform und bildest die gesuchte Form – im Kopf oder auf Papier. Dann deckst du auf. An deinem Lernstand ändert das nichts.</p></div></div>
      <div class="card" data-setup><div class="stack">
        <h3>Was möchtest du üben?</h3>
        <div class="conj-mixes">${C.MIXES.map(mixHtml).join('')}</div>
        <div class="conj-custom" data-custom><div class="conj-groups">${C.groups().map(groupHtml).join('')}</div></div>
        <div class="row conj-words"><span class="small muted">Mit welchen Wörtern?</span><div class="seg"><button class="${byChoice ? '' : 'on'}" data-q-w="">Meine Wörter</button><button class="${byChoice ? 'on' : ''}" data-q-w="wahl">Nach Lektion oder Niveau</button></div>
          ${byChoice ? `${App.sourceSelect(all, q.src)}${App.lessonSelect(all.filter((i) => App.srcMatch(i, q.src)), q.l)}${App.levelSelect(q.lvl)}` : '<span class="small muted">alles, was du gerade lernst oder schon kannst</span>'}</div>
        <div class="small muted" data-hint></div>
        <div class="row"><button class="btn btn-primary" data-go></button>${App.cards.chunkSelect()}</div>
      </div></div>
      <div data-stage></div></div>`;
    const setup = view.querySelector('[data-setup]');
    App.cards.bindChunk(view);

    // Zahl, Häkchen und Hinweise an Ort und Stelle nachziehen (ohne Neuzeichnen, damit Antippen flüssig bleibt)
    const refresh = () => {
      setup.querySelectorAll('[data-mix]').forEach((b) => {
        const on = b.dataset.mix === mixId;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', on);
      });
      setup.querySelector('[data-custom]').hidden = mixId !== 'custom';
      setup.querySelectorAll('.conj-group').forEach((el) => {
        const boxes = [...el.querySelectorAll('[data-form]')], on = boxes.filter((c) => c.checked).length;
        const head = el.querySelector('[data-line-check]');
        head.checked = on === boxes.length;
        head.indeterminate = on > 0 && on < boxes.length;
        el.querySelector('[data-count]').textContent = boxes.length > 1 ? `${on} von ${boxes.length}` : '';
      });
      const pl = pool(), n = pl.words.length;
      const go = setup.querySelector('[data-go]');
      go.disabled = !n;
      go.innerHTML = `${icon('play')} Runde starten (${n} ${n === 1 ? 'Wort' : 'Wörter'})`;
      // Die Wortarten ergeben sich aus den Formen – ohne Form gibt es auch keine Wortart
      const hints = [{
        pos: 'Kreuz mindestens eine Form an.',
        forms: 'Kreuz mindestens eine Form an.',
        mine: 'Unter deinen Wörtern ist noch kein passendes Verb oder Adjektiv. Dorthin kommt alles, was du lernst oder schon kannst. <button class="btn btn-sm" data-q-w="wahl">Nach Lektion oder Niveau üben</button>',
        choice: 'Zu dieser Auswahl gibt es keine passenden Wörter.',
      }[C.reason(sel, n, byChoice)]].filter(Boolean);
      if (pl.skipped) hints.push(`${pl.skipped} ${pl.skipped === 1 ? 'Verb' : 'Verben'} ohne passende Verbgruppe ausgelassen – prüfe die Verbgruppe im Vokabel-Eintrag.`);
      setup.querySelector('[data-hint]').innerHTML = hints.map((h) => `<div>${h}</div>`).join('');
    };
    setup.addEventListener('click', (e) => {
      const b = e.target.closest('[data-mix]');
      if (!b) return;
      mixId = b.dataset.mix;
      App.lsSet('conjMix', mixId);
      sel = C.mixSel(mixId, custom);
      refresh();
    });
    const setList = (list, id, on) => { const i = list.indexOf(id); if (on && i < 0) list.push(id); if (!on && i >= 0) list.splice(i, 1); };
    setup.addEventListener('change', (e) => {
      const t = e.target;
      if (t.matches('[data-form]')) setList(custom.forms, t.value, t.checked);
      else if (t.matches('[data-line-check]')) t.closest('.conj-group').querySelectorAll('[data-form]').forEach((c) => { c.checked = t.checked; setList(custom.forms, c.value, c.checked); });
      else return;
      App.lsSet('conjSel2', JSON.stringify(C.selOf(custom.forms)));
      sel = C.mixSel(mixId, custom);
      refresh();
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
        onGrade: (ent, g) => { C.tally(stats, ent.form, g > 0, !ent.again); ent.again = true; App.dayCheck.mark('conj'); },
        endHtml: () => { const rows = C.summary(stats); return rows.length ? `<div class="conj-summary">${rows.map((r) => { const f = F.form(r.form); return `<div style="--c:${lineColor(f)}"><b>${esc(f.label)}</b><span>${r.right}/${r.asked}</span></div>`; }).join('')}</div>` : ''; },
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
