/* Nihongo Techō – Buchaufgaben: Paket einlesen, Aufgaben an der Grammatik zeigen, Versuche mit dem Stift */
'use strict';
(function (App) {
  const { $, esc, icon } = App;
  const L = App.exercisesLogic;
  const X = App.exercises = {};
  // Das Verzeichnis liegt mit im Store 'exblobs' (nicht in meta): so bleibt es beim Wiederherstellen einer Sicherung bei seinen Bildern.
  const DIR_KEY = '__dir';
  const TITLE = 'Genki I – Buchaufgaben';

  let dir = null;
  const urls = new Map();
  const dropUrls = () => { urls.forEach((u) => URL.revokeObjectURL(u)); urls.clear(); };

  // ---------- Paket ----------
  X.init = async () => { const r = await App.db.get('exblobs', DIR_KEY); dir = (r && r.dir) || null; };
  X.dir = () => dir;
  X.all = () => (dir ? dir.exercises : []);
  X.get = (id) => X.all().find((e) => e.id === id);

  // Paket-Datei einlesen. Alles oder nichts: bei einem Fehler bleibt der bisherige Stand.
  X.load = async (file) => {
    const p = L.parsePack(new Uint8Array(await file.arrayBuffer()));
    const rows = p.dir.exercises.map((e, i) => ({ id: e.id, blob: new Blob([p.image(i)], { type: 'image/webp' }) }));
    const d = Object.assign({}, p.dir, { exercises: p.dir.exercises.map((e) => { const c = Object.assign({}, e); delete c.offset; delete c.size; return c; }) });
    await App.db.replace([{ store: 'exblobs', clear: true, put: rows.concat({ id: DIR_KEY, dir: d }) }]);
    dir = d;
    dropUrls();
    return d.exercises.length;
  };
  // Entfernt nur die Buchbilder – die eigenen Versuche bleiben
  X.remove = async () => { await App.db.clear('exblobs'); dir = null; dropUrls(); };

  X.blobOf = async (id) => (id === DIR_KEY ? undefined : ((await App.db.get('exblobs', id)) || {}).blob);
  X.url = async (id) => {
    if (urls.has(id)) return urls.get(id);
    const b = await X.blobOf(id);
    if (!b) return '';
    if (!urls.has(id)) urls.set(id, URL.createObjectURL(b));
    return urls.get(id);
  };

  // ---------- Versuche ----------
  // Ein Versuch ist ein Datei-Eintrag ohne eigenen Blob: Seite 1 = Ausschnitt aus dem Paket (ink.js), dahinter liniertes Papier.
  X.attempts = (exId) => Array.from(App.store.files.values()).filter((f) => f.exerciseId === exId).sort((a, b) => b.created - a.created);
  X.newAttempt = async (exId) => {
    const ex = X.get(exId);
    if (!ex) return null;
    const f = {
      id: App.uid('f'), name: L.attemptName(ex, X.attempts(exId).length + 1), mime: 'image/webp', size: 0,
      source: 'Genki I', lesson: ex.lesson, section: 'exercise', tags: [], sessionId: '', itemId: '', role: 'exercise', note: '',
      created: Date.now(), pages: 0, paper: '', exerciseId: exId, exW: ex.w, exH: ex.h, extraPages: 1,
    };
    await App.updateFile(f);
    return f;
  };
  const openAttempt = async (fileId) => {
    const root = document.createElement('div');
    $('#overlay-root').appendChild(root);
    const ctrl = await App.ink.mount(root, fileId, { embedded: false, onClose: () => { ctrl.destroy(); root.remove(); App.render(true); } });
    if (!ctrl) root.remove();
  };

  // ---------- Paket-Karte (Seite „Pakete“) ----------
  X.card = () => {
    const n = X.all().length;
    return `<div class="card" data-ex-pack>
      <div class="row between"><h3>${esc(TITLE)}</h3>${dir ? '<span class="pack-status ok">Geladen</span>' : ''}</div>
      <p class="small muted">${dir
    ? `${n} Aufgaben · Stand ${esc(App.fmtDate(dir.stand))}. Die Aufgaben stehen bei den Grammatik-Einträgen unter „Üben“.`
    : 'Übungsaufgaben aus dem Lehrbuch als Bildausschnitte, zum Lösen mit dem Stift. Die Paket-Datei (.ntpaket) wird einmal pro Gerät eingelesen und bleibt dann in diesem Browser.'}</p>
      <div class="row"><button class="btn ${dir ? '' : 'btn-primary'}" data-ex-pick>${icon('upload')} ${dir ? 'Neu einlesen' : 'Paket-Datei wählen'}</button>
      ${dir ? `<button class="btn" data-ex-remove>${icon('trash')} Entfernen</button>` : ''}</div>
      <p class="small" role="alert" data-ex-err hidden style="color:var(--shu)"></p></div>`;
  };
  const pickPack = (card) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.onchange = async () => {
      const file = inp.files && inp.files[0];
      if (!file) return;
      const err = card.querySelector('[data-ex-err]');
      err.hidden = true;
      try {
        const n = await X.load(file);
        App.toast(`${TITLE}: ${n} Aufgaben geladen`);
        App.render(true);
      } catch (e) {
        if (!e.code) console.error(e);
        err.textContent = e.code ? e.message : 'Die Datei konnte nicht eingelesen werden.';
        err.hidden = false;
      }
    };
    inp.click();
  };

  // ---------- Anzeige ----------
  const thumb = (ex) => `<a class="ex-thumb" href="#/aufgabe/${encodeURIComponent(ex.id)}"><span class="ex-img"><img data-ex-img="${esc(ex.id)}" alt="" loading="lazy"></span>
    <span class="ex-cap"><span>${esc(L.title(ex))}</span>${X.attempts(ex.id).length ? `<span class="muted" title="Schon Versuche vorhanden">${icon('edit')}</span>` : ''}</span></a>`;

  // Block im Abschnitt „Üben“ eines Grammatik-Eintrags
  X.grammarBlock = (it) => {
    if (it.source !== 'Genki I') return '';
    if (!dir) return '<p class="small muted" style="margin-top:10px">Buchaufgaben zu diesem Punkt gibt es im Paket „Genki I – Buchaufgaben“ (<a href="#/pakete">Pakete</a>).</p>';
    const list = L.forGrammar(X.all(), it.id);
    const inLesson = L.forLesson(X.all(), it.lesson).length;
    if (!list.length && !inLesson) return '';
    return `<div class="ex-block"><div class="row between"><b>Buchaufgaben</b>${inLesson ? `<a class="small" href="${X.libHref(it.lesson)}">Alle Aufgaben der Lektion ${esc(it.lesson)}</a>` : ''}</div>
      ${list.length ? `<div class="ex-grid">${list.map(thumb).join('')}</div>` : ''}</div>`;
  };
  X.hydrate = (root) => root.querySelectorAll('img[data-ex-img]').forEach(async (im) => { const u = await X.url(im.dataset.exImg); if (u) im.src = u; });

  const when = (t) => new Date(t).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  App.route('/aufgabe/:id', (view, p) => {
    const ex = X.get(p.id);
    const atts = X.attempts(p.id);
    if (!ex && !atts.length) { view.innerHTML = '<div class="empty-state"><h3>Aufgabe nicht gefunden</h3><p class="muted">Ist das Buchaufgaben-Paket geladen? <a href="#/pakete">Zu den Paketen</a></p></div>'; return; }
    const lesson = ex ? ex.lesson : atts[0].lesson;
    const gram = ex ? (ex.grammar || []).map((g) => App.item(g)).filter(Boolean) : [];
    view.innerHTML = `<div class="sec-grammar"><div class="crumbs"><a href="#/bibliothek">Bibliothek</a> › <a href="${X.libHref()}">Buchaufgaben</a> › <a href="${X.libHref(lesson)}">Genki I · Lektion ${esc(lesson)}</a></div>
      <div class="card pad-lg"><div class="row between" style="align-items:flex-start"><div><h1 style="font-size:24px">Buchaufgabe ${esc(ex ? L.title(ex) : '')}</h1>
        ${gram.length ? `<div class="row small" style="margin-top:6px">${gram.map((g) => `<a class="badge" style="text-decoration:none" href="${App.link(g)}">${esc(g.title)}</a>`).join('')}</div>` : ''}</div>
        ${ex ? `<button class="btn btn-primary" data-ex-new="${esc(ex.id)}">${icon('plus')} Neuer Versuch</button>` : ''}</div>
        ${ex ? `<img class="ex-full" data-ex-img="${esc(ex.id)}" alt="Aufgabe aus dem Lehrbuch">` : `<p class="muted">${dir ? 'Diese Aufgabe ist im geladenen Paket nicht enthalten.' : 'Das Buchaufgaben-Paket ist auf diesem Gerät nicht geladen (<a href="#/pakete">Pakete</a>).'} Deine Versuche bleiben erhalten.</p>`}</div>
      <div class="section-title">Deine Versuche</div>
      ${atts.length ? `<div class="ex-grid wide">${atts.map((f, i) => `<div class="card ex-attempt" data-ex-open="${esc(f.id)}"><div class="row between"><b>Versuch ${atts.length - i}</b><span class="row" style="gap:4px"><span class="small muted">${esc(when(f.created))}</span>
        <button class="icon-btn" data-ex-del="${esc(f.id)}" title="Versuch löschen">${icon('trash')}</button></span></div><canvas data-ex-prev="${esc(f.id)}"></canvas><div class="small muted" data-ex-empty hidden>noch leer</div></div>`).join('')}</div>`
    : '<p class="muted">Noch kein Versuch. „Neuer Versuch“ öffnet ein Blatt mit der Aufgabe und liniertem Papier zum Schreiben.</p>'}</div>`;
    X.hydrate(view);
    view.querySelectorAll('canvas[data-ex-prev]').forEach(async (cv) => {
      const id = cv.dataset.exPrev;
      // Geschrieben wird meist auf dem linierten Blatt (Seite 2); sonst die Notizen direkt an der Aufgabe zeigen
      if (await App.ink.preview(cv, id, { page: 1, maxH: 180 }) || await App.ink.preview(cv, id, { page: 0, maxH: 180 })) return;
      cv.hidden = true;
      cv.parentElement.querySelector('[data-ex-empty]').hidden = false;
    });
  });

  // Kategorie „Buchaufgaben“ in der Bibliothek: alle Aufgaben nach Lektion (q.l = nur diese Lektion)
  X.libHref = (lesson) => '#/bibliothek?sec=exercise' + (lesson !== undefined && lesson !== '' ? '&l=' + encodeURIComponent(lesson) : '');
  X.inLibrary = () => !!dir || Array.from(App.store.files.values()).some((f) => f.exerciseId);
  X.libraryHtml = (q) => {
    if (!dir) return '<div class="empty-state"><div class="big">練</div><h3>Buchaufgaben-Paket nicht geladen</h3><p class="muted">Die Aufgaben kommen aus dem Paket „Genki I – Buchaufgaben“. <a href="#/pakete">Zu den Paketen</a></p></div>';
    const all = X.all();
    const lessons = Array.from(new Set(all.map((e) => e.lesson))).sort((a, b) => a - b);
    const one = q.l !== undefined && q.l !== '';
    const shown = one ? lessons.filter((l) => String(l) === String(q.l)) : lessons;
    return `<div class="chips" style="margin-bottom:6px"><a class="chip ${one ? '' : 'on'}" href="${X.libHref()}">Alle Lektionen</a>${lessons.map((l) => `<a class="chip ${one && String(q.l) === String(l) ? 'on' : ''}" href="${X.libHref(l)}">Lektion ${esc(l)}</a>`).join('')}</div>
      ${shown.length ? shown.map((l) => { const list = L.forLesson(all, l); return `<div class="group-head"><h2>Genki I · Lektion ${esc(l)}</h2><span class="badge">${list.length}</span><span class="line"></span></div><div class="ex-grid">${list.map(thumb).join('')}</div>`; }).join('')
    : '<p class="muted">Für diese Lektion sind noch keine Aufgaben im Paket.</p>'}`;
  };

  document.addEventListener('click', async (e) => {
    const pick = e.target.closest('[data-ex-pick]');
    if (pick) { pickPack(pick.closest('[data-ex-pack]')); return; }
    if (e.target.closest('[data-ex-remove]')) {
      if (await App.confirm('Buchaufgaben-Paket von diesem Gerät entfernen? Deine Versuche bleiben erhalten; die Aufgabenbilder kommen zurück, sobald du die Paket-Datei wieder einliest.', { ok: 'Entfernen' })) { await X.remove(); App.toast('Buchaufgaben-Paket entfernt'); App.render(true); }
      return;
    }
    const nw = e.target.closest('[data-ex-new]');
    if (nw) { const f = await X.newAttempt(nw.dataset.exNew); if (f) openAttempt(f.id); return; }
    const del = e.target.closest('[data-ex-del]');
    if (del) {
      if (await App.confirm('Diesen Versuch mit allem, was du darauf geschrieben hast, löschen?')) await App.deleteFile(del.dataset.exDel);
      return;
    }
    const open = e.target.closest('[data-ex-open]');
    if (open) openAttempt(open.dataset.exOpen);
  });
})(window.App);
