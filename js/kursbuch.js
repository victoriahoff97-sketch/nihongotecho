/* Nihongo Techō – Kurs-Notizbuch: alle Handschrift-Mitschriften eines Kurses als ein Buch zum Blättern (nur ansehen).
   Erste Doppelseite = Inhaltsverzeichnis: links die Stunden, rechts die Grammatikpunkte des Kurses. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const UL = App.uLogic, KL = App.kursbuchLogic, BK = App.inkBook;
  const A4 = 842 / 595;
  const TAB_H = 30; // Platz über dem Buch für die Reiter mit dem Namen der Stunde
  const title = (s) => s.title || UL.jpDate(s.date) || 'Ohne Datum';

  App.kursbuchLink = (course) => '#/unterricht/buch?c=' + encodeURIComponent(course === UL.NO_COURSE ? '' : course);

  // Muss vor „/unterricht/:id“ (lessons.js) angemeldet sein
  App.route('/unterricht/buch', async (view, p, q) => {
    const course = String(q.c || '').trim();
    const sessions = KL.courseSessions(App.itemsOf('session'), course);
    const sec = App.SECTIONS.session;
    const crumbs = `<div class="crumbs" style="margin:0"><a href="#/unterricht">Unterricht</a> › ${esc(course || UL.NO_COURSE)} › Notizbuch</div>`;
    if (!sessions.length) {
      view.innerHTML = `<div class="${sec.cls}">${crumbs}<div class="empty-state"><div class="big">帳</div><h3>Kein Kurs mit diesem Namen</h3><a class="btn" href="#/unterricht">Zum Unterricht</a></div></div>`;
      return;
    }
    let left = false;
    App.onLeave(() => { left = true; });

    // Seiten aller Mitschrift-Blätter: beschrieben? welche Einträge sind dort markiert?
    const rows = new Map((await App.db.all('ink')).map((r) => [r.fileId + ':' + r.page, r]));
    if (left) return;
    const byId = new Map(sessions.map((s) => [s.id, s]));
    const pages = KL.pages(sessions.map((s) => ({
      id: s.id,
      sheets: App.filesFor({ sessionId: s.id }).filter((f) => f.role === 'notes' && App.fileKind(f) === 'notebook').sort((a, b) => a.created - b.created)
        .map((f) => ({ id: f.id, pages: Array.from({ length: f.pages || 1 }, (_, i) => { const r = rows.get(f.id + ':' + i) || {}; return { inked: App.inkImages.hasInk(r), linkIds: (r.links || []).map((l) => l.itemId) }; }) })),
    })));
    const topics = KL.topics(sessions).filter((t) => App.item(t.itemId));
    const toc = KL.tocSpreads(sessions.length, topics.length);
    const nSpreads = KL.spreadCount(pages.length, toc);
    const sessionHref = (pg) => `${App.link(byId.get(pg.sessionId))}?nb=${encodeURIComponent(pg.fileId)}`;

    view.innerHTML = `<div class="${sec.cls} kursbuch"><div class="row between kb-bar">${crumbs}
        <div class="row"><span class="small muted" data-kb-pos></span><span class="kb-zoom"><button class="btn btn-sm" data-kb-zoom="-1" title="Verkleinern">−</button><button class="btn btn-sm" data-kb-zoom="0" title="Ganze Doppelseite zeigen">100 %</button><button class="btn btn-sm" data-kb-zoom="1" title="Vergrößern">+</button></span><button class="btn btn-sm" data-kb-toc>${icon('list')} Inhalt</button>
        <select class="input" data-kb-jump title="Zu einer Stunde blättern"><option value="">Zur Stunde …</option>${sessions.map((s, i) => KL.sessionPage(pages, s.id) >= 0 ? `<option value="${esc(s.id)}">${i + 1} · ${esc(title(s))}${s.topic ? ' – ' + esc(s.topic) : ''}</option>` : '').join('')}</select></div></div>
      <div class="kb-stage viewer-book"><div class="viewer-scroll"><div class="viewer-pages book" data-kb-book></div></div></div></div>`;
    const stage = view.querySelector('.kb-stage'), scroller = stage.firstElementChild, book = view.querySelector('[data-kb-book]');
    const pos = view.querySelector('[data-kb-pos]'), jump = view.querySelector('[data-kb-jump]'), zoomBtn = view.querySelector('[data-kb-zoom="0"]');

    let spread = Math.min(Math.max(0, +q.p || 0), nSpreads - 1);
    let hl = null; // { page, itemId }: Markierung eines Grammatikpunkts hervorheben, zu dem geblättert wurde

    // ---------- Seiten ----------
    const tocRow = (attr, no, name, sub, page, hint) => `<button type="button" class="kb-row" ${attr}${hint ? ` title="${esc(hint)}"` : ''}><span class="kb-no">${no}</span><span class="kb-name" lang="ja">${esc(name)}</span>${sub ? `<span class="kb-sub">${esc(sub)}</span>` : ''}<span class="kb-dots"></span><span class="kb-pg">${page >= 0 ? page + 1 : '–'}</span></button>`;
    const tocPage = (leaf) => {
      const n = leaf >> 1, more = n ? ' · Fortsetzung' : '';
      if (leaf % 2 === 0) {
        return `<div class="kb-toc-in"><div class="kb-kicker">目次 · Inhalt${more}</div><h2>${esc(course || UL.NO_COURSE)}</h2>
          ${KL.chunk(sessions, n).map((s, i) => { const pg = KL.sessionPage(pages, s.id); return tocRow(`data-kb-session="${esc(s.id)}"`, n * KL.TOC_ROWS + i + 1, title(s), s.topic, pg, pg < 0 ? 'Noch keine Handschrift – öffnet die Stunde' : ''); }).join('')}</div>`;
      }
      const list = KL.chunk(topics, n);
      return `<div class="kb-toc-in sec-grammar"><div class="kb-kicker">文法 · Grammatik${more}</div><h2>Themen in diesem Kurs</h2>
        ${list.map((t) => { const it = App.item(t.itemId); return tocRow(`data-kb-topic="${esc(t.itemId)}"`, '●', it.title, it.summary, KL.topicPage(pages, t.itemId, t.sessionId), ''); }).join('')}
        ${!topics.length ? '<p class="kb-none">Noch keine Grammatik verknüpft. In der Stunde unter „Gelernt“ auswählen oder ein Wort auf dem Blatt einkreisen und verknüpfen – dann steht sie hier.</p>' : ''}</div>`;
    };
    const leafHtml = (leaf, side) => {
      const cls = `vpage bk-${side}`;
      if (leaf < 2 * toc) return `<div class="${cls} kb-toc">${tocPage(leaf)}</div>`;
      const i = leaf - 2 * toc, pg = pages[i];
      if (!pg) return `<div class="${cls}"></div>`;
      const marks = hl && hl.page === i ? (rows.get(pg.fileId + ':' + pg.page).links || []).filter((l) => l.itemId === hl.itemId) : [];
      return `<div class="${cls} kb-page"><canvas data-kb-ink="${i}"></canvas>
        ${marks.map((l) => `<span class="kb-hl" style="left:${l.x * 100}%;top:${l.y / A4 * 100}%;width:${l.w * 100}%;height:${l.h / A4 * 100}%"></span>`).join('')}<span class="pno">${i + 1}</span></div>`;
    };
    const tabHtml = (leaf, side, other) => {
      const pg = pages[leaf - 2 * toc], o = pages[other - 2 * toc];
      if (leaf < 2 * toc || !pg || (side === 'r' && o && other >= 2 * toc && o.sessionId === pg.sessionId)) return '';
      const s = byId.get(pg.sessionId);
      return `<a class="kb-tab ${side}" href="${sessionHref(pg)}" title="Stunde zum Schreiben öffnen"><span class="kb-tab-t"><span lang="ja">${esc(title(s))}</span>${s.topic ? ' · ' + esc(s.topic) : ''}</span><b>${icon('pen')} öffnen</b></a>`;
    };
    let zoom = 1, inkTimer = 0;
    const drawInk = () => book.querySelectorAll('[data-kb-ink]').forEach((cv) => {
      const pg = pages[+cv.dataset.kbInk];
      App.ink.preview(cv, pg.fileId, { page: pg.page, crop: false, maxH: 1e5, bg: App.ink.BOOK_PAPER, always: true });
    });
    // Seitengröße: die Doppelseite passt bei 100 % genau in die Fläche; Einband, Reiter und Schrift sind in em bemessen
    const size = () => {
      const W = BK.fitWidth(scroller.clientWidth, scroller.clientHeight - TAB_H, A4) * zoom;
      book.style.fontSize = W / 30 + 'px';
      book.querySelectorAll('.vpage').forEach((el) => { el.style.width = W + 'px'; el.style.height = W * A4 + 'px'; });
      book.querySelectorAll('[data-kb-ink]').forEach((cv) => { cv.style.height = ''; });
      stage.classList.toggle('kb-zoomed', zoom > 1);
      zoomBtn.textContent = Math.round(zoom * 100) + ' %';
    };
    // Zoomen um einen Punkt (Bildschirm-Koordinaten; ohne Angabe die Mitte): er bleibt unter dem Finger/Zeiger stehen
    const setZoom = (z, cx, cy) => {
      z = KL.clampZoom(z);
      if (z === zoom) return;
      const sr = scroller.getBoundingClientRect();
      if (cx == null) { cx = sr.left + sr.width / 2; cy = sr.top + sr.height / 2; }
      const a = book.getBoundingClientRect(), fx = (cx - a.left) / a.width, fy = (cy - a.top) / a.height;
      zoom = z; size();
      const b = book.getBoundingClientRect();
      scroller.scrollLeft += b.left + fx * b.width - cx; scroller.scrollTop += b.top + fy * b.height - cy;
      clearTimeout(inkTimer); inkTimer = setTimeout(drawInk, 140); // scharf nachzeichnen, sobald die Größe steht
    };
    const show = (dir) => {
      const l = 2 * spread, r = l + 1;
      book.innerHTML = leafHtml(l, 'l') + leafHtml(r, 'r') + tabHtml(l, 'l', r) + tabHtml(r, 'r', l)
        + `<button class="bk-turn prev" data-kb-turn="-1" title="Zurückblättern"${spread ? '' : ' hidden'}>‹</button><button class="bk-turn next" data-kb-turn="1" title="Weiterblättern"${spread < nSpreads - 1 ? '' : ' hidden'}>›</button>`;
      size();
      if (dir) book.querySelectorAll('.vpage').forEach((el) => el.classList.add(dir > 0 ? 'flip-next' : 'flip-prev'));
      scroller.scrollLeft = 0; scroller.scrollTop = 0;
      drawInk();
      pos.textContent = spread < toc ? 'Inhaltsverzeichnis' : `Doppelseite ${spread - toc + 1} von ${nSpreads - toc}`;
      const first = pages[Math.max(0, l - 2 * toc)];
      jump.value = spread >= toc && first ? first.sessionId : '';
      // gemerkt in der Adresse: nach dem Abstecher in eine Stunde landet „Zurück“ wieder auf dieser Doppelseite
      history.replaceState(null, '', `#/unterricht/buch?c=${encodeURIComponent(course)}${spread ? '&p=' + spread : ''}`);
    };
    const goTo = (s, mark = null) => { const d = Math.sign(s - spread); hl = mark; spread = Math.min(Math.max(0, s), nSpreads - 1); show(d); };
    const turn = (d) => { const s = spread + d; if (s >= 0 && s < nSpreads) goTo(s); };
    const toPage = (i, mark) => goTo(KL.spreadOfPage(i, toc), mark);

    // ---------- Bedienung: wischen blättert; vergrößert verschiebt der Finger das Blatt; zwei Finger / Strg+Mausrad zoomen ----------
    // Geschrieben wird hier nie. Zur Stunde geht es nur über den Reiter über dem Buch (ein Link), nicht per Tipp auf die Seite.
    const ptrs = new Map();
    let down = null, pinch = null, movedAt = 0;
    const dist = () => { const [p, q2] = Array.from(ptrs.values()); return Math.hypot(p.x - q2.x, p.y - q2.y) || 1; };
    scroller.addEventListener('pointerdown', (e) => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) down = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
      else if (ptrs.size === 2) { down = null; pinch = { d: dist(), z: zoom }; }
    });
    scroller.addEventListener('pointermove', (e) => {
      const p = ptrs.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pinch && ptrs.size === 2) {
        const [m, n] = Array.from(ptrs.values());
        setZoom(pinch.z * dist() / pinch.d, (m.x + n.x) / 2, (m.y + n.y) / 2);
        movedAt = e.timeStamp;
      } else if (down) {
        if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) down.moved = true;
        if (zoom > 1 && down.moved) { scroller.scrollLeft -= dx; scroller.scrollTop -= dy; }
      }
    });
    const up = (e) => {
      if (!ptrs.delete(e.pointerId)) return;
      if (ptrs.size < 2) pinch = null;
      if (down && e.type === 'pointerup') {
        if (down.moved) movedAt = e.timeStamp;
        const d = zoom <= 1.02 ? BK.swipeDir(e.clientX - down.x, e.clientY - down.y, e.timeStamp - down.t) : 0;
        if (d) turn(d);
      }
      if (!ptrs.size) down = null;
    };
    scroller.addEventListener('pointerup', up);
    scroller.addEventListener('pointercancel', up);
    scroller.addEventListener('wheel', (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom(zoom * Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY); } }, { passive: false });
    scroller.addEventListener('dblclick', (e) => { if (!e.target.closest('button, a')) setZoom(zoom > 1 ? 1 : 2, e.clientX, e.clientY); });
    view.querySelectorAll('[data-kb-zoom]').forEach((bt) => { bt.onclick = () => setZoom(+bt.dataset.kbZoom ? KL.stepZoom(zoom, +bt.dataset.kbZoom) : 1); });
    book.addEventListener('click', (e) => {
      // nach dem Verschieben oder Zoomen ist das Loslassen kein Tipp
      if (e.timeStamp - movedAt < 400) { e.preventDefault(); return; }
      const t = e.target.closest('[data-kb-turn], [data-kb-session], [data-kb-topic]');
      if (!t) return;
      if (t.dataset.kbTurn) turn(+t.dataset.kbTurn);
      else if (t.dataset.kbSession) {
        const i = KL.sessionPage(pages, t.dataset.kbSession);
        if (i >= 0) toPage(i); else App.go(App.link(byId.get(t.dataset.kbSession)));
      } else {
        const tp = topics.find((x) => x.itemId === t.dataset.kbTopic);
        const i = KL.topicPage(pages, tp.itemId, tp.sessionId);
        if (i >= 0) toPage(i, { page: i, itemId: tp.itemId }); else App.go(App.link(byId.get(tp.sessionId)) + '?tab=learned');
      }
    });
    view.querySelector('[data-kb-toc]').onclick = () => goTo(0);
    jump.onchange = () => { const i = KL.sessionPage(pages, jump.value); if (i >= 0) toPage(i); else goTo(0); };
    const onKey = (e) => {
      if (e.target.closest('input, select, textarea, [contenteditable]') || document.querySelector('.modal')) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); turn(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); turn(-1); }
      if (e.key === 'Home') { e.preventDefault(); goTo(0); }
      if (e.key === '+' || e.key === '-') { e.preventDefault(); setZoom(KL.stepZoom(zoom, e.key === '+' ? 1 : -1)); }
    };
    document.addEventListener('keydown', onKey);

    // Das Buch füllt genau den restlichen Bildschirm
    const fit = () => { stage.style.height = Math.max(360, window.innerHeight - (stage.getBoundingClientRect().top + window.scrollY) - 16) + 'px'; };
    fit();
    show();
    let lastW = scroller.clientWidth, lastH = scroller.clientHeight;
    const ro = new ResizeObserver(() => { const w = scroller.clientWidth, h = scroller.clientHeight; if (w && (w !== lastW || h !== lastH)) { lastW = w; lastH = h; show(); } });
    window.addEventListener('resize', fit);
    App.onLeave(() => { document.removeEventListener('keydown', onKey); window.removeEventListener('resize', fit); ro.disconnect(); clearTimeout(inkTimer); });
    ro.observe(scroller);
  });
})(window.App);
