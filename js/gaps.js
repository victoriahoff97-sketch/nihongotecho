/* Nihongo Techō – Üben › Lückensätze: mehrere Sätze auf einer Seite, die Partikeln fehlen.
   Wortbank oben: Partikel antippen, dann Lücke antippen – oder hinziehen (Maus, Finger, Stift). Ändert nichts am Lernstand. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const JP = App.jp;
  const G = App.gapLogic;
  const N = 6;

  const opts = () => {
    let o = {};
    try { o = JSON.parse(App.lsGet('gapOpts') || '{}') || {}; } catch (e) { o = {}; }
    return { lesson: o.lesson || '', all: !!o.all, long: !!o.long };
  };
  const words = () => App.itemsOf('vocab');
  const poolOf = (o) => G.pool(words(), { lesson: o.lesson, all: o.all, long: o.long, status: (it) => App.vocabStatus(it.id) });
  const sayOf = (t) => JP.plain(t.jp.replace(/\|/g, ''));

  App.route('/ueben/luecken', (view) => {
    const o = opts();
    const lessons = G.lessons(G.pool(words(), { all: true, long: true }), words());
    if (o.lesson && !lessons.includes(+o.lesson)) o.lesson = '';
    view.innerHTML = `<div class="sec-grammar ${App.furiClass()}"><div class="crumbs">${App.backCrumb()} › Lückensätze</div>
      <div class="page-head"><div class="titles"><h1>Lückensätze <span class="jp-title">助詞</span></h1><p>Welche Partikel gehört in die Lücke? Sätze und Muster aus deinen Vokabeln. An deinem Lernstand ändert das nichts.</p></div></div>
      <div class="card gap-setup"><div class="row">
        <select class="input" style="width:auto" data-o="lesson"><option value="">Alle Lektionen gemischt</option>${lessons.map((l) => `<option value="${l}" ${String(o.lesson) === String(l) ? 'selected' : ''}>Lektion ${l}</option>`).join('')}</select>
        <select class="input" style="width:auto" data-o="all"><option value="">Meine Wörter (Lernschlange + kann ich)</option><option value="1" ${o.all ? 'selected' : ''}>Alle Wörter</option></select>
        <label class="picker-row small"><input type="checkbox" data-o="long" ${o.long ? 'checked' : ''}> Auch lange Sätze (z. B. aus Artikeln)</label>
      </div></div>
      <div data-stage></div></div>`;
    const stage = view.querySelector('[data-stage]');
    view.querySelectorAll('[data-o]').forEach((el) => {
      el.onchange = () => {
        o[el.dataset.o] = el.type === 'checkbox' ? el.checked : el.value;
        if (el.dataset.o === 'all') o.all = !!el.value;
        App.lsSet('gapOpts', JSON.stringify(o));
        render(stage, o);
      };
    });
    render(stage, o);
  });

  function render(stage, o) {
    const all = poolOf(o);
    if (!all.length) {
      stage.innerHTML = `<div class="card"><div class="stack"><div>Für diese Auswahl gibt es noch keine Sätze mit Partikel-Lücken.</div>
        <div class="small muted">${o.all ? 'Wähle eine andere Lektion oder erlaube lange Sätze.' : 'Probier „Alle Wörter“ – oder stufe Vokabeln ein, dann landen sie in der Lernschlange.'}</div></div></div>`;
      return;
    }
    const tasks = G.sheet(all, N, App.shuffle);
    const chips = G.bank(tasks, App.shuffle);
    let gi = 0;
    let ri = 0;
    const rowOf = [];
    const segHtml = (x) => (x.g ? (rowOf.push(ri), '') + `<span class="gap-slot" data-gap="${gi++}" role="button" tabindex="0" aria-label="Lücke"></span>` : JP.ruby(x.t.replace(/\|/g, '')));
    stage.innerHTML = `<div class="card gap-sheet">
      <div class="gap-top"><div class="gap-bank" data-bank>${chips.map((c, i) => `<button class="gap-chip" data-chip="${i}" lang="ja">${esc(c)}</button>`).join('')}</div>
      <div class="small muted gap-how">Partikel antippen, dann Lücke antippen – oder hinziehen. Lücke antippen leert sie wieder.</div></div>
      ${tasks.map((t) => `<div class="gap-row"><div class="gap-jp" lang="ja">${t.segs.map(segHtml).join('')} ${App.speakBtn(sayOf(t))}</div>
        <div class="small muted">${esc(t.de)}${t.kind === 'muster' ? ' · <span class="gap-kind">Muster</span>' : ''} · <a href="${App.link(App.item(t.id))}">${esc((App.item(t.id) || {}).kanji || (App.item(t.id) || {}).kana || '')}</a></div><div class="gap-note small" data-note="${ri++}" hidden></div></div>`).join('')}
      <div class="row gap-foot"><button class="btn btn-primary" data-check>${icon('check')} Prüfen</button><button class="btn btn-ghost" data-show>Lösung zeigen</button><button class="btn" data-new>Neue Sätze</button><span class="small" data-msg></span></div>
    </div>`;
    const gaps = tasks.flatMap((t) => t.segs.filter((x) => x.g));
    const slots = [...stage.querySelectorAll('[data-gap]')];
    const chipEls = [...stage.querySelectorAll('[data-chip]')];
    const msg = stage.querySelector('[data-msg]');
    const fill = new Array(gaps.length).fill(null); // Lücke → Index des Chips
    let sel = null, shown = false;

    const draw = () => {
      slots.forEach((s, i) => { s.textContent = fill[i] == null ? '' : chips[fill[i]]; s.classList.toggle('f', fill[i] != null); });
      chipEls.forEach((c, i) => { c.classList.toggle('used', fill.includes(i)); c.classList.toggle('sel', sel === i); });
    };
    const notes = [...stage.querySelectorAll('[data-note]')];
    const clearMarks = () => { slots.forEach((s) => s.classList.remove('ok', 'bad', 'soft')); notes.forEach((n) => { n.hidden = true; n.innerHTML = ''; }); msg.textContent = ''; };
    // は ⇔ が: nicht falsch, nur andere Nuance – Hinweis unter dem Satz
    const NUANCE = '<b>は</b>: „was … angeht“ – Thema, oft im Kontrast zu anderem. <b>が</b>: hebt hervor, <i>wer</i> oder <i>was</i> – oft neue Information.';
    const softNote = (i, mine) => { const n = notes[rowOf[i]]; n.hidden = false; n.innerHTML = `<span lang="ja">${esc(mine)}</span> geht hier auch – im Satz stand <span lang="ja">${esc(gaps[i].g)}</span>. ${NUANCE}`; };
    const put = (gapIdx, chipIdx) => {
      if (shown || chipIdx == null || fill.includes(chipIdx)) return;
      fill[gapIdx] = chipIdx; sel = null; clearMarks(); draw();
    };
    const pickChip = (i) => { if (shown || fill.includes(i)) return; sel = sel === i ? null : i; draw(); };
    const tapGap = (i) => { if (shown) return; if (sel != null) put(i, sel); else { fill[i] = null; clearMarks(); draw(); } };

    slots.forEach((s, i) => {
      s.onclick = () => tapGap(i);
      s.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tapGap(i); } };
    });

    // Ziehen mit Maus, Finger oder Stift; kurzes Antippen ohne Bewegung = auswählen
    chipEls.forEach((c, i) => {
      c.onpointerdown = (e) => {
        if (shown || fill.includes(i)) return;
        e.preventDefault();
        const x0 = e.clientX, y0 = e.clientY;
        let ghost = null;
        const move = (ev) => {
          if (!ghost && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 8) return;
          if (!ghost) { ghost = c.cloneNode(true); ghost.classList.add('gap-ghost'); document.body.appendChild(ghost); }
          ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px';
          slots.forEach((s) => s.classList.remove('hover'));
          const over = document.elementFromPoint(ev.clientX, ev.clientY);
          const s = over && over.closest('[data-gap]');
          if (s) s.classList.add('hover');
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          slots.forEach((s) => s.classList.remove('hover'));
          if (!ghost) { pickChip(i); return; }
          ghost.remove();
          const over = document.elementFromPoint(ev.clientX, ev.clientY);
          const s = over && over.closest('[data-gap]');
          if (s && stage.contains(s)) put(+s.dataset.gap, i);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      };
      c.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickChip(i); } };
    });

    stage.querySelector('[data-check]').onclick = () => {
      if (shown) return;
      if (fill.every((x) => x == null)) { msg.textContent = 'Zieh erst Partikeln in die Lücken.'; return; }
      // Leere Lücken bleiben unmarkiert – man kann auch Satz für Satz prüfen
      let ok = 0, bad = 0, soft = 0;
      notes.forEach((n) => { n.hidden = true; n.innerHTML = ''; });
      slots.forEach((s, i) => {
        const mine = fill[i] == null ? '' : chips[fill[i]];
        const r = G.grade(gaps[i], mine);
        if (r === 'ok') ok++; else if (r === 'bad') bad++; else if (r === 'soft') { soft++; softNote(i, mine); }
        s.classList.toggle('ok', r === 'ok'); s.classList.toggle('bad', r === 'bad'); s.classList.toggle('soft', r === 'soft');
      });
      const open = gaps.length - ok - bad - soft;
      msg.textContent = ok === gaps.length ? `完璧！ Alle ${ok} richtig.`
        : `${ok} richtig${soft ? `, ${soft} geht auch (gelb)` : ''}${bad ? `, ${bad} falsch – rote Lücke antippen und neu füllen` : ''}${open ? ` · ${open} noch leer` : ''}.`;
    };
    stage.querySelector('[data-show]').onclick = () => {
      shown = true; sel = null;
      slots.forEach((s, i) => {
        const mine = fill[i] == null ? '' : chips[fill[i]];
        const g = G.grade(gaps[i], mine);
        const r = g === 'ok';
        s.textContent = r || g === 'soft' ? mine : gaps[i].g;
        s.classList.add('f');
        s.classList.toggle('ok', r); s.classList.toggle('soft', g === 'soft'); s.classList.toggle('sol', !r && g !== 'soft'); s.classList.toggle('miss', g === 'bad'); s.classList.remove('bad');
        if (g === 'soft') softNote(i, mine);
        if (gaps[i].ok.length > 1) s.title = 'Hier geht ' + gaps[i].ok.join(' oder ');
      });
      chipEls.forEach((c) => c.classList.add('used'));
      msg.textContent = 'Lösung steht in den Lücken – hast du es im Kopf gewusst?';
    };
    stage.querySelector('[data-new]').onclick = () => render(stage, o);
    draw();
  }
})(window.App);
