/* Nihongo Techō – Notizbuch zum Blättern (nur ansehen): Kurs-Notizbuch (alle Mitschriften eines Kurses) und eigene Hefte (heft.js).
   Erste Doppelseite = Inhaltsverzeichnis: links die Abschnitte (Stunden bzw. Kapitel), rechts die Grammatikpunkte. */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const UL = App.uLogic, KL = App.kursbuchLogic, BK = App.inkBook;
  const A4 = 842 / 595;
  const TAB_H = 30; // Platz über dem Buch für die Reiter mit dem Namen der Stunde
  const title = (s) => s.title || UL.jpDate(s.date) || 'Ohne Datum';

  App.kursbuchLink = (course) => '#/unterricht/buch?c=' + encodeURIComponent(course === UL.NO_COURSE ? '' : course);

  // Blätterbuch in view aufbauen. cfg: { cls, crumbs, bookTitle, sections: [{ id, title, sub, sheets: [Notizblatt-Datei] }],
  //   topics: [{ itemId, sessionId }] oder (pages) => [...], spread, href(spread), texts, tabHref?(sectionId, fileId, page),
  //   openSection(sectionId, fileId, page?) – page: Seite im Blatt (ab 0), die gerade aufgeschlagen ist, openTopic?(topic), extraButtons?, emptyHtml?,
  //   look?: { stored() → { color, tabColors, layout }, save(obj), fallback: Familie ohne eigene Wahl } – Farben und Ansicht (layout 'pages' = normale Seiten)
  // Die Seiten-Objekte heißen weiter „sessionId“ – bei Heften ist das die Kapitel-ID.
  const mount = async (view, cfg) => {
    const { sections, texts } = cfg;
    let left = false;
    App.onLeave(() => { left = true; });

    // Seiten aller Blätter: beschrieben? welche Einträge sind dort markiert?
    const rows = new Map((await App.db.all('ink')).map((r) => [r.fileId + ':' + r.page, r]));
    if (left) return;
    const byId = new Map(sections.map((s) => [s.id, s]));
    const pages = KL.pages(sections.map((s) => ({
      id: s.id,
      sheets: s.sheets.map((f) => ({ id: f.id, pages: Array.from({ length: f.pages || 1 }, (_, i) => { const r = rows.get(f.id + ':' + i) || {}; return { inked: App.inkImages.hasInk(r), linkIds: (r.links || []).map((l) => l.itemId) }; }) })),
    })));
    const topics = (typeof cfg.topics === 'function' ? cfg.topics(pages) : cfg.topics).filter((t) => App.item(t.itemId));
    const toc = KL.tocSpreads(sections.length, topics.length);
    const nSpreads = KL.spreadCount(pages.length, toc);
    // Farben: Einband und Reiter aus einer Familie, einzeln wählbar über „Farben“
    const col = cfg.look || { stored: () => null, fallback: 'salbei' };
    let stored = col.stored() || {};
    let pal = KL.bookColors(stored, sections.map((s) => s.id), col.fallback);
    // ---------- Normale Seiten: Abschnitte als Überschrift, die Seiten untereinander zum Scrollen ----------
    function flatView() {
      const of = new Map();
      pages.forEach((pg, i) => { if (!of.has(pg.sessionId)) of.set(pg.sessionId, []); of.get(pg.sessionId).push(i); });
      const openLink = (id, fileId, page, cls, label, title) => {
        const href = cfg.tabHref && fileId ? cfg.tabHref(id, fileId, page) : '#';
        return `<a class="${cls}" href="${esc(href)}" data-kb-open="${esc(id)}" data-kb-file="${esc(fileId || '')}" data-kb-page="${page}" title="${esc(title)}">${icon('pen')} ${label}</a>`;
      };
      view.innerHTML = `<div class="${cfg.cls} kursbuch kb-flat"><div class="row between kb-bar">${cfg.crumbs}<div class="row">${layoutSwitch}${jumpSelect}${cfg.extraButtons || ''}</div></div>
        ${topics.length ? `<div class="kb-flat-topics sec-grammar"><span class="kb-col-lab">${esc(texts.topicsHead)}</span>${topics.map((t) => `<button type="button" class="chip" data-kb-topic="${esc(t.itemId)}">${esc(App.item(t.itemId).title)}</button>`).join('')}</div>` : ''}
        ${sections.length ? sections.map((s, n) => `<section class="kb-flat-sec" data-kb-sec="${esc(s.id)}"><div class="row between kb-flat-head">
            <h3><span class="kb-dot" style="background:${pal.tabs[s.id]}"></span><span class="kb-no">${n + 1}</span><span lang="ja">${esc(s.title)}</span>${s.sub ? `<span class="kb-sub">${esc(s.sub)}</span>` : ''}</h3>
            ${openLink(s.id, (firstSheet(s.id) || {}).id, 0, 'btn btn-sm', 'Öffnen', texts.tabTitle)}</div>
            ${(of.get(s.id) || []).map((i) => { const pg = pages[i]; return `<div class="kb-flat-page"><canvas data-kb-ink="${i}"></canvas>${openLink(s.id, pg.fileId, pg.page, 'kb-flat-open', 'Seite ' + (i + 1), 'Diese Seite zum Schreiben öffnen')}</div>`; }).join('')}
          </section>`).join('') : cfg.emptyHtml || ''}</div>`;
      bindLayout();
      // Seiten erst zeichnen, wenn sie in die Nähe kommen; bei neuer Breite scharf nachzeichnen
      const draw = (cv) => { const pg = pages[+cv.dataset.kbInk]; App.ink.preview(cv, pg.fileId, { page: pg.page, crop: false, maxH: 1e5, always: true }); };
      const seen = new Set();
      const io = new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting && !seen.has(en.target)) { seen.add(en.target); draw(en.target); } }), { rootMargin: '800px 0px' });
      view.querySelectorAll('[data-kb-ink]').forEach((cv) => io.observe(cv));
      const root = view.querySelector('.kb-flat');
      let lastW = root.clientWidth, redrawTimer = 0;
      const ro = new ResizeObserver(() => { if (root.clientWidth === lastW) return; lastW = root.clientWidth; clearTimeout(redrawTimer); redrawTimer = setTimeout(() => seen.forEach(draw), 200); });
      ro.observe(root);
      App.onLeave(() => { io.disconnect(); ro.disconnect(); clearTimeout(redrawTimer); });
      const scrollTo = (el) => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      view.querySelector('[data-kb-jump]').onchange = (e) => { scrollTo(view.querySelector(`[data-kb-sec="${CSS.escape(e.target.value)}"]`)); e.target.value = ''; };
      root.addEventListener('click', (e) => {
        const t = e.target.closest('[data-kb-open], [data-kb-topic]');
        if (!t) return;
        if (t.dataset.kbTopic) {
          const tp = topics.find((x) => x.itemId === t.dataset.kbTopic), i = KL.topicPage(pages, tp.itemId, tp.sessionId);
          if (i >= 0) scrollTo(view.querySelector(`[data-kb-ink="${i}"]`).parentNode); else if (cfg.openTopic) cfg.openTopic(tp);
        } else if (t.getAttribute('href') === '#') { e.preventDefault(); cfg.openSection(t.dataset.kbOpen, t.dataset.kbFile || undefined, +t.dataset.kbPage); }
      });
    }
    const firstSheet = (id) => ((byId.get(id) || {}).sheets || [])[0];
    const swatch = (attr, hex, label) => `<button type="button" class="kb-sw" ${attr} style="background:${hex}" title="${esc(label)}" aria-label="${esc(label)}"></button>`;
    const colorsPanel = () => `<div class="kb-colors" data-kb-colors hidden>
        <div class="kb-col-grp"><span class="kb-col-lab">Buch</span><span class="kb-sws">${KL.FAMILIES.map((f) => swatch(`data-kb-fam="${f.key}"`, f.cover, f.name)).join('')}</span></div>
        <div class="kb-col-grp"><span class="kb-col-lab">Reiter</span><select class="input" data-kb-tabsel title="Welcher Reiter?">${sections.map((s, i) => `<option value="${esc(s.id)}">${i + 1} · ${esc(s.title)}</option>`).join('')}</select>
          <span class="kb-sws" data-kb-tones></span><button type="button" class="btn btn-sm" data-kb-alltones aria-expanded="false">Alle Farben</button><button type="button" class="btn btn-sm" data-kb-auto title="Reiter wieder passend zum Buch">↺ Passend</button></div>
        <button type="button" class="btn btn-sm btn-primary" data-kb-colors-done>Fertig</button>
        <div class="kb-all" data-kb-all hidden>${KL.FAMILIES.map((f) => `<span class="kb-sws">${f.tabs.map((t) => swatch(`data-kb-tone="${t}"`, t, f.name)).join('')}</span>`).join('')}</div></div>`;

    // Ansicht pro Notizbuch: Buch (Standard) oder normale Seiten untereinander
    const flat = stored.layout === 'pages';
    const layoutSwitch = cfg.look ? `<span class="kb-mode" role="group" aria-label="Ansicht"><button class="btn btn-sm${flat ? '' : ' btn-sec'}" data-kb-layout="" title="Als Buch zum Blättern">📖 Buch</button><button class="btn btn-sm${flat ? ' btn-sec' : ''}" data-kb-layout="pages" title="Als normale Seiten untereinander">${icon('list')} Seiten</button></span>` : '';
    const jumpSelect = `<select class="input" data-kb-jump title="${esc(texts.jumpTitle)}"><option value="">${esc(texts.jump)}</option>${sections.map((s, i) => KL.sessionPage(pages, s.id) >= 0 ? `<option value="${esc(s.id)}">${i + 1} · ${esc(s.title)}${s.sub ? ' – ' + esc(s.sub) : ''}</option>` : '').join('')}</select>`;
    const bindLayout = () => view.querySelectorAll('[data-kb-layout]').forEach((b) => {
      b.onclick = async () => {
        if ((b.dataset.kbLayout || '') === (stored.layout || '')) return;
        stored = Object.assign({}, stored, { layout: b.dataset.kbLayout || undefined });
        await col.save(stored);
        App.render(true);
      };
    });
    if (flat) { flatView(); return; }

    view.innerHTML = `<div class="${cfg.cls} kursbuch"><div class="row between kb-bar">${cfg.crumbs}
        <div class="row">${layoutSwitch}<span class="small muted" data-kb-pos></span><span class="kb-zoom"><button class="btn btn-sm" data-kb-zoom="-1" title="Verkleinern">−</button><button class="btn btn-sm" data-kb-zoom="0" title="Ganze Doppelseite zeigen">100 %</button><button class="btn btn-sm" data-kb-zoom="1" title="Vergrößern">+</button></span><button class="btn btn-sm" data-kb-toc>${icon('list')} Inhalt</button>
        ${jumpSelect}${cfg.look ? `<button class="btn btn-sm" data-kb-colors-on title="Farbe von Buch und Reitern wählen">${icon('brush')} Farben</button>` : ''}${cfg.extraButtons || ''}</div></div>
      ${cfg.look ? colorsPanel() : ''}
      <div class="kb-stage viewer-book"><div class="viewer-scroll"><div class="viewer-pages book" data-kb-book></div></div></div></div>`;
    bindLayout();
    const stage = view.querySelector('.kb-stage'), scroller = stage.firstElementChild, book = view.querySelector('[data-kb-book]');
    const pos = view.querySelector('[data-kb-pos]'), jump = view.querySelector('[data-kb-jump]'), zoomBtn = view.querySelector('[data-kb-zoom="0"]');

    let spread = Math.min(Math.max(0, +cfg.spread || 0), nSpreads - 1);
    let hl = null; // { page, itemId }: Markierung eines Grammatikpunkts hervorheben, zu dem geblättert wurde

    // ---------- Farben: „Farben“ klappt eine Leiste auf, das Buch färbt sich sofort mit ----------
    const panel = view.querySelector('[data-kb-colors]');
    let picking = false, selSec = (sections[0] || {}).id;
    const paint = () => {
      book.style.setProperty('--kb-cover', pal.cover);
      book.querySelectorAll('.kb-tab').forEach((a) => {
        const t = pal.tabs[a.dataset.kbOpen];
        a.style.background = t; a.style.color = KL.tabInk(t);
        a.classList.toggle('kb-tab-sel', picking && a.dataset.kbOpen === selSec);
      });
      book.querySelectorAll('[data-kb-dot]').forEach((d) => { d.style.background = pal.tabs[d.dataset.kbDot]; });
      if (!panel) return;
      panel.querySelectorAll('[data-kb-fam]').forEach((b) => b.classList.toggle('on', b.dataset.kbFam === pal.family.key));
      panel.querySelector('[data-kb-tones]').innerHTML = pal.family.tabs.map((t) => swatch(`data-kb-tone="${t}"`, t, pal.family.name)).join('');
      panel.querySelectorAll('[data-kb-tone]').forEach((b) => b.classList.toggle('on', b.dataset.kbTone === pal.tabs[selSec]));
      panel.querySelector('[data-kb-tabsel]').value = selSec || '';
      panel.querySelector('[data-kb-auto]').hidden = !(stored.tabColors || {})[selSec];
    };
    const setColors = (next) => {
      stored = next;
      pal = KL.bookColors(stored, sections.map((s) => s.id), col.fallback);
      paint();
      Promise.resolve(col.save(stored)).catch((er) => { console.error(er); App.toast('Farbe nicht gespeichert'); });
    };
    const setPicking = (on) => {
      picking = on;
      panel.hidden = !on;
      view.querySelector('[data-kb-colors-on]').classList.toggle('btn-sec', on);
      fit();
      paint();
    };
    if (panel) {
      view.querySelector('[data-kb-colors-on]').onclick = () => setPicking(!picking);
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        if (b.dataset.kbFam) setColors(KL.recolor(stored, b.dataset.kbFam, col.fallback));
        else if (b.dataset.kbTone) setColors(KL.setTab(stored, selSec, b.dataset.kbTone));
        else if (b.hasAttribute('data-kb-auto')) setColors(KL.setTab(stored, selSec, null));
        else if (b.hasAttribute('data-kb-alltones')) {
          const all = panel.querySelector('[data-kb-all]');
          all.hidden = !all.hidden;
          b.setAttribute('aria-expanded', String(!all.hidden));
          fit();
        } else if (b.hasAttribute('data-kb-colors-done')) setPicking(false);
      });
      // Reiter aus der Liste wählen: dorthin blättern, damit man ihn gleich sieht
      panel.querySelector('[data-kb-tabsel]').onchange = (e) => {
        selSec = e.target.value;
        const i = KL.sessionPage(pages, selSec);
        if (i >= 0 && KL.spreadOfPage(i, toc) !== spread) toPage(i); else paint();
      };
    }

    // ---------- Seiten ----------
    const tocRow = (attr, no, name, sub, page, hint, dotId) => `<button type="button" class="kb-row" ${attr}${hint ? ` title="${esc(hint)}"` : ''}><span class="kb-no">${no}</span>${dotId ? `<span class="kb-dot" data-kb-dot="${esc(dotId)}" style="background:${pal.tabs[dotId]}"></span>` : ''}<span class="kb-name" lang="ja">${esc(name)}</span>${sub ? `<span class="kb-sub">${esc(sub)}</span>` : ''}<span class="kb-dots"></span><span class="kb-pg">${page >= 0 ? page + 1 : '–'}</span></button>`;
    const tocPage = (leaf) => {
      const n = leaf >> 1, more = n ? ' · Fortsetzung' : '';
      if (leaf % 2 === 0) {
        return `<div class="kb-toc-in"><div class="kb-kicker">目次 · Inhalt${more}</div><h2>${esc(cfg.bookTitle)}</h2>
          ${KL.chunk(sections, n).map((s, i) => { const pg = KL.sessionPage(pages, s.id); return tocRow(`data-kb-session="${esc(s.id)}"`, n * KL.TOC_ROWS + i + 1, s.title, s.sub, pg, pg < 0 ? texts.emptySection : '', s.id); }).join('')}
          ${!sections.length && cfg.emptyHtml ? cfg.emptyHtml : ''}</div>`;
      }
      const list = KL.chunk(topics, n);
      return `<div class="kb-toc-in sec-grammar"><div class="kb-kicker">文法 · Grammatik${more}</div><h2>${esc(texts.topicsHead)}</h2>
        ${list.map((t) => { const it = App.item(t.itemId); return tocRow(`data-kb-topic="${esc(t.itemId)}"`, '●', it.title, it.summary, KL.topicPage(pages, t.itemId, t.sessionId), ''); }).join('')}</div>`; // ohne verknüpfte Grammatik bleibt die Seite leer, ohne Hinweis
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
      const s = byId.get(pg.sessionId), href = cfg.tabHref ? cfg.tabHref(pg.sessionId, pg.fileId, pg.page) : '#';
      const t = pal.tabs[pg.sessionId];
      return `<a class="kb-tab ${side}" style="background:${t};color:${KL.tabInk(t)}" href="${esc(href)}" data-kb-open="${esc(pg.sessionId)}" data-kb-file="${esc(pg.fileId)}" data-kb-page="${pg.page}" title="${esc(texts.tabTitle)}"><span class="kb-tab-t"><span lang="ja">${esc(s.title)}</span>${s.sub ? ' · ' + esc(s.sub) : ''}</span><b>${icon('pen')} öffnen</b></a>`;
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
      // beim Farbenwählen ist immer ein Reiter auf der Doppelseite ausgewählt
      const shown = Array.from(book.querySelectorAll('.kb-tab'), (a) => a.dataset.kbOpen);
      if (picking && shown.length && !shown.includes(selSec)) selSec = shown[0];
      paint();
      pos.textContent = spread < toc ? 'Inhaltsverzeichnis' : `Doppelseite ${spread - toc + 1} von ${nSpreads - toc}`;
      const first = pages[Math.max(0, l - 2 * toc)];
      jump.value = spread >= toc && first ? first.sessionId : '';
      // gemerkt in der Adresse: nach dem Abstecher in eine Stunde landet „Zurück“ wieder auf dieser Doppelseite
      history.replaceState(history.state, '', cfg.href(spread));
    };
    const goTo = (s, mark = null) => { const d = Math.sign(s - spread); hl = mark; spread = Math.min(Math.max(0, s), nSpreads - 1); show(d); };
    const turn = (d) => { const s = spread + d; if (s >= 0 && s < nSpreads) goTo(s); };
    const toPage = (i, mark) => goTo(KL.spreadOfPage(i, toc), mark);

    // ---------- Bedienung: wischen blättert; vergrößert verschiebt der Finger das Blatt; zwei Finger / Strg+Mausrad zoomen ----------
    // Geschrieben wird hier nie. Zum Blatt geht es nur über den Reiter über dem Buch, nicht per Tipp auf die Seite.
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
      const t = e.target.closest('[data-kb-turn], [data-kb-session], [data-kb-topic], [data-kb-open]');
      if (!t) return;
      if (t.dataset.kbTurn) turn(+t.dataset.kbTurn);
      else if (t.dataset.kbOpen && picking) { e.preventDefault(); selSec = t.dataset.kbOpen; paint(); } // beim Farbenwählen wählt der Reiter aus statt zu öffnen
      else if (t.dataset.kbOpen) {
        // Reiter: der Kurs hat einen echten Link (tabHref), Hefte öffnen das Blatt direkt
        // und öffnen das Blatt auf der Seite, die gerade aufgeschlagen ist
        if (!cfg.tabHref) { e.preventDefault(); cfg.openSection(t.dataset.kbOpen, t.dataset.kbFile, +t.dataset.kbPage); }
      } else if (t.dataset.kbSession) {
        const i = KL.sessionPage(pages, t.dataset.kbSession);
        if (i >= 0) toPage(i); else cfg.openSection(t.dataset.kbSession, (firstSheet(t.dataset.kbSession) || {}).id);
      } else {
        const tp = topics.find((x) => x.itemId === t.dataset.kbTopic);
        const i = KL.topicPage(pages, tp.itemId, tp.sessionId);
        if (i >= 0) toPage(i, { page: i, itemId: tp.itemId }); else if (cfg.openTopic) cfg.openTopic(tp);
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
  };
  App.kursbuch = { mount };

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
    const byId = new Map(sessions.map((s) => [s.id, s]));
    await mount(view, {
      cls: sec.cls, crumbs, bookTitle: course || UL.NO_COURSE, spread: q.p,
      sections: sessions.map((s) => ({
        id: s.id, title: title(s), sub: s.topic || '',
        sheets: App.filesFor({ sessionId: s.id }).filter((f) => f.role === 'notes' && App.fileKind(f) === 'notebook').sort((a, b) => a.created - b.created),
      })),
      topics: KL.topics(sessions),
      href: (spread) => `#/unterricht/buch?c=${encodeURIComponent(course)}${spread ? '&p=' + spread : ''}`,
      texts: {
        jump: 'Zur Stunde …', jumpTitle: 'Zu einer Stunde blättern', topicsHead: 'Themen in diesem Kurs', tabTitle: 'Stunde zum Schreiben öffnen',
        emptySection: 'Noch keine Handschrift – öffnet die Stunde',
      },
      tabHref: (id, fileId, page) => `${App.link(byId.get(id))}?nb=${encodeURIComponent(fileId)}${page ? '&pg=' + (page + 1) : ''}`,
      openSection: (id) => App.go(App.link(byId.get(id))),
      openTopic: (tp) => App.go(App.link(byId.get(tp.sessionId)) + '?tab=learned'),
      // Farben pro Kurs in den Einstellungen (gehen mit ins Backup); ohne Wahl grün wie bisher
      look: {
        fallback: 'salbei',
        stored: () => (App.store.settings.courseBooks || {})[course],
        save: (c) => App.saveSettings({ courseBooks: Object.assign({}, App.store.settings.courseBooks, { [course]: c }) }, { silent: true }),
      },
    });
  });
})(window.App);
