/* Nihongo Techō – Seite „Hören“ (#/hoeren): die ganze Hör-Kette (Chienowa → Teppei) und Japanese with Shun */
'use strict';
(function (App) {
  const { esc, icon } = App;
  const L = App.listening;
  const S = App.shun;
  const SEC = { label: 'Hören', jp: '聞く', cls: 'sec-listen' };
  const SHOW_URL = 'https://redcircle.com/shows/japanese-with-shun';
  const EP_BLOCK = 50;

  // Auf- und zugeklappte Blöcke merken: Jede Änderung (Gehört, Ab hier) zeichnet die Seite neu
  const fold = {};
  const isOpen = (key, def) => (key in fold ? fold[key] : def);
  const block = (key, def, head, rows) => {
    const open = isOpen(key, def);
    return `<details class="hr-block" data-fold="${key}" ${open ? 'open data-drawn-open' : ''}><summary>${head}</summary><div class="hr-rows">${open ? rows() : ''}</div></details>`;
  };
  const lazy = {}; // key → Zeilen, für Blöcke, die erst beim Aufklappen gefüllt werden

  // ---------- Oben zwei Hälften: links die Hör-Kette, rechts Shun – je Ringe, was als Nächstes dran ist, und der Weg ----------
  const ring = (pct, label, sub, zu) => `<button type="button" class="hr-ring" data-q-zu="${zu}" title="${zu ? 'Zu Japanese with Shun' : 'Zur Hör-Kette'}">
      <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" class="bg"/>${pct ? `<circle cx="32" cy="32" r="26" class="fg" pathLength="100" stroke-dasharray="${pct} 100"/>` : ''}
      <text x="32" y="37" text-anchor="middle">${pct} %</text></svg>
      <span class="hr-ring-txt"><b>${label}</b><span class="muted small">${sub}</span></span></button>`;
  const head = (ico, name, sub) => `<div class="hr-half-head">${icon(ico)}<h2>${name}</h2><span class="muted small">${sub}</span></div>`;

  // Etappen der Kette: Tippen klappt die Etappe in der Liste unten auf
  const stages = (pos) => {
    const list = L.stages(L.groups(L.all()), pos);
    return `<div class="hr-stages" style="--n:${list.length}">${list.map((s) => {
      const now = pos >= s.from && pos < s.to;
      return `<button type="button" class="hr-stage ${now ? 'now' : ''} ${s.done >= s.total ? 'full' : ''}" data-hr-stage="${s.open}" title="${esc(s.label)}: ${s.done} von ${s.total} ${s.total === 1 ? 'Stück' : 'Stücken'} gehört">
        <span class="bar"><span style="width:${L.pct(s.done, s.total)}%"></span></span><span class="lbl">${esc(s.short)}</span></button>`;
    }).join('')}</div>`;
  };
  const chainHalf = () => {
    const pos = App.store.settings.listenPos || 0;
    const c = L.progress(L.all(), pos);
    const hours = (o) => L.durOf(o.done, o.total);
    return `<section class="hr-half hr-half-chain">${head('listen', 'Hör-Kette', 'Chienowa → Teppei')}
      <div class="hr-rings">${ring(L.pct(c.chienowa.done, c.chienowa.total), 'Chienowa', hours(c.chienowa), '')}${ring(L.pct(c.teppei.done, c.teppei.total), 'Teppei', hours(c.teppei), '')}</div>
      <div class="hr-now">${L.tile()}</div>
      <div class="hr-foot"><span class="muted small">Deine Etappen</span>${stages(pos)}</div></section>`;
  };

  const MIC = `<svg viewBox="0 0 92 84" aria-hidden="true"><g transform="rotate(5 46 42)">
    <path d="M26 38a20 20 0 0040 0" fill="none" stroke="#1e6b6f" stroke-width="4" stroke-linecap="round"/>
    <path d="M46 58v12M34 72h24" stroke="#1e6b6f" stroke-width="4" stroke-linecap="round"/>
    <rect x="33" y="8" width="26" height="42" rx="13" fill="#2b8a8f" stroke="#1e6b6f" stroke-width="2"/>
    <circle cx="40" cy="30" r="2.5" fill="#1e6b6f"/><circle cx="52" cy="30" r="2.5" fill="#1e6b6f"/>
    <path d="M43 37q3 3 6 0" fill="none" stroke="#1e6b6f" stroke-width="2" stroke-linecap="round"/>
    <circle cx="37" cy="36" r="2.6" fill="#ED93B1" opacity=".7"/><circle cx="55" cy="36" r="2.6" fill="#ED93B1" opacity=".7"/></g>
    <text x="74" y="20" font-size="14" fill="#c98a14">♪</text><text x="8" y="26" font-size="11" fill="#d0567a">♫</text></svg>`;
  // Kachel „Nächste Folge“ im selben Stil wie 今日のリスニング
  const shunTile = (heard) => {
    const e = S.nextUp(heard);
    if (!e) {
      return `<div class="read-tile listen"><span class="art">${MIC}</span><span class="txt"><span class="kicker">Japanese with Shun</span>
        <b>Alles durchgehört</b><span class="desc">Du hast alle Folgen abgehakt.</span></span></div>`;
    }
    const where = e.lesson != null ? `${S.source(e.lesson)} · Lektion ${e.lesson}` : `Folge ${e.n}`;
    return `<div class="read-tile listen"><span class="art">${MIC}</span><span class="txt">
      <span class="kicker">Nächste Folge · ca. ${S.minutes(e)} Min.</span>
      <b>${e.ja ? `<span lang="ja">${esc(e.ja)}</span> · ` : ''}${esc(e.title)}</b>
      <span class="desc">${where}</span>
      <span class="listen-row"><button type="button" class="go" data-shun-play="${esc(e.id)}">${icon('play')} Anhören</button><button type="button" class="go ghost" data-shun-heard="${esc(e.id)}">${icon('check')} Gehört</button></span></span></div>`;
  };
  // Kästchen je Lektion: voll = alle Folgen gehört, hell = angefangen; Tippen klappt die Lektion im Reiter Shun auf
  const lessonGrid = (heard) => {
    const lessons = [...new Set(S.all().genki.map((e) => e.lesson))];
    const box = (n) => {
      const d = S.lessonDone(heard, n);
      const st = d.done >= d.total ? 'full' : d.done ? 'part' : '';
      return `<button type="button" class="hr-lesson ${st}" data-hr-lesson="${n}" title="Lektion ${n}: ${d.done} von ${d.total} ${d.total === 1 ? 'Folge' : 'Folgen'} gehört">${n}</button>`;
    };
    const row = (name, from, to) => {
      const ls = lessons.filter((n) => n >= from && n <= to);
      return ls.length ? `<div class="hr-grid-row"><span class="muted small">${name}</span><div class="hr-grid">${ls.map(box).join('')}</div></div>` : '';
    };
    return `<div class="hr-lessons">${row('Genki I', 1, 12)}${row('Genki II', 13, 99)}</div>`;
  };
  const shunHalf = () => {
    const heard = App.store.settings.shunHeard || [];
    const s = S.progress(heard);
    const eps = (o) => `${o.done} von ${o.total} Folgen`;
    return `<section class="hr-half hr-half-shun">${head('mic', 'Japanese with Shun', 'Podcast zur Genki-Grammatik')}
      <div class="hr-rings">${ring(L.pct(s.genki.done, s.genki.total), 'Genki-Folgen', eps(s.genki), 'shun')}${ring(L.pct(s.eps.done, s.eps.total), 'Alle Folgen', eps(s.eps), 'shun')}</div>
      <div class="hr-now">${shunTile(heard)}</div>
      <div class="hr-foot"><span class="muted small">Genki-Lektionen</span>${lessonGrid(heard)}</div></section>`;
  };
  const halves = () => `<div class="hr-halves">${chainHalf()}${shunHalf()}</div>`;
  const tabs = (tab) => `<div class="tabs hr-tabs">${[['', `${icon('listen')} Hör-Kette`], ['shun', 'Japanese with Shun']].map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-q-zu="${k}">${l}</button>`).join('')}</div>`;

  // ---------- Hör-Kette ----------
  const chainRow = (p, i, pos) => `<div class="shun-row hr-row ${i < pos ? 'heard' : ''} ${i === pos ? 'now' : ''}">
      <button type="button" class="shun-play" data-listen-play data-pos="${i}" title="Anhören">${icon('play')}</button>
      <span class="grow"><span class="muted small">${i + 1}</span> ${esc(L.head(p))}${p.kind === 'audio' && p.sub ? ` <span class="muted small" lang="ja">${esc(p.sub)}</span>` : ''}</span>
      <span class="muted small">${L.minutes(p)} Min.</span>
      ${i === pos ? '<span class="badge hr-here">Hier bist du</span>' : i < pos ? `<span class="hr-done" title="Gehört">${icon('check')}</span>` : ''}
      ${i === pos ? '' : `<button type="button" class="linklike small" data-listen-jump="${i}" title="Die Hör-Kette ab diesem Stück weiterführen">Ab hier</button>`}
    </div>`;

  const chain = () => {
    const all = L.all(), pos = App.store.settings.listenPos || 0;
    const groups = L.groups(all);
    const at = L.groupIndexOf(groups, pos);
    const blocks = groups.map((g, gi) => {
      const key = 'c' + gi;
      const rows = () => all.slice(g.from, g.to).map((p, k) => chainRow(p, g.from + k, pos)).join('');
      lazy[key] = rows;
      const done = g.to <= pos;
      return block(key, gi === at, `<b>${esc(g.label)}</b> <span class="muted small">${g.to - g.from} ${g.to - g.from === 1 ? 'Stück' : 'Stücke'}${done ? ' · gehört' : ''}</span>`, rows);
    }).join('');
    return `<section class="hr-sec">
      <p class="muted small">Jeden Tag ein Stück von etwa 5 Minuten: erst Chienowa Japanese, dann Nihongo con Teppei. Die Chienowa-Videos sind gut fürs Shadowing: laut nachsprechen. „Ab hier“ setzt die Kette auf ein anderes Stück.</p>
      ${blocks}</section>`;
  };

  // ---------- Japanese with Shun ----------
  const shun = () => {
    const { genki, eps } = S.all();
    const heard = App.store.settings.shunHeard || [];
    const lessons = [...new Set(genki.map((e) => e.lesson))];
    const lessonBlock = (n) => {
      const list = S.forLesson(n);
      const done = list.filter((e) => heard.includes(e.id)).length;
      const key = 'g' + n;
      const rows = () => list.map(App.shunUi.row).join('');
      lazy[key] = rows;
      return block(key, false, `<b>Lektion ${n}</b> <span class="muted small">${list.length} ${list.length === 1 ? 'Folge' : 'Folgen'}${done ? ` · ${done} gehört` : ''}</span>`, rows);
    };
    const book = (name, from, to) => {
      const ls = lessons.filter((n) => n >= from && n <= to);
      return ls.length ? `<h3>${name}</h3>${ls.map(lessonBlock).join('')}` : '';
    };
    const next = S.next(heard);
    const chunks = [];
    for (const e of eps) {
      const b = Math.floor((e.n - 1) / EP_BLOCK);
      if (!chunks[b]) chunks[b] = [];
      chunks[b].push(e);
    }
    const nextB = next ? Math.floor((next.n - 1) / EP_BLOCK) : -1;
    const epBlocks = chunks.map((list, b) => {
      if (!list) return '';
      const key = 'e' + b;
      const rows = () => list.map(App.shunUi.row).join('');
      lazy[key] = rows;
      const done = list.filter((e) => heard.includes(e.id)).length;
      return block(key, b === nextB, `<b>Ep ${b * EP_BLOCK + 1}–${b * EP_BLOCK + EP_BLOCK}</b> <span class="muted small">${list.length} ${list.length === 1 ? 'Folge' : 'Folgen'}${done ? ` · ${done} gehört` : ''}</span>`, rows);
    }).join('');
    return `<section class="hr-sec" id="shun">
      <p class="muted small">Shun spricht langsam und benutzt nur Grammatik aus Genki. Die Genki-Folgen passen zu je einer Lektion.
        <a href="${SHOW_URL}" target="_blank" rel="noopener">Zur Podcast-Seite ${icon('link')}</a></p>
      ${book('Genki I', 1, 12)}${book('Genki II', 13, 99)}
      <h3>Alle Folgen</h3>
      ${next ? `<div class="hr-next"><span class="muted small">Nächste</span>${App.shunUi.row(next)}</div>` : '<p class="muted small">Alle Folgen gehört.</p>'}
      ${epBlocks}</section>`;
  };

  // Beim Neuzeichnen (z. B. „Ab hier“, Haken) klappen Blöcke zu oder auf – damit nichts unter dem Finger wegrutscht,
  // bleibt die oberste sichtbare Zeile bzw. Block-Überschrift an derselben Stelle im Fenster
  const ANCHORS = '[data-pos], [data-shun-heard], details[data-fold] > summary';
  const selOf = (el) => (el.matches('summary') ? `details[data-fold="${el.parentElement.dataset.fold}"] > summary`
    : el.dataset.pos != null ? `[data-pos="${el.dataset.pos}"]` : `[data-shun-heard="${el.dataset.shunHeard}"]`);
  const visibleAnchors = (view) => {
    const out = [];
    for (const el of view.querySelectorAll(ANCHORS)) {
      const top = el.getBoundingClientRect().top;
      if (top >= 0 && top < innerHeight) out.push({ sel: selOf(el), top });
      if (out.length >= 12) break;
    }
    return out;
  };
  const restore = (view, anchors) => {
    for (const a of anchors) {
      const el = view.querySelector(a.sel);
      if (el && el.getClientRects().length) { scrollBy(0, el.getBoundingClientRect().top - a.top); return; }
    }
  };

  // Erstes Zeichnen nach einem Seitenwechsel (nicht beim Neuzeichnen nach „Gehört“ usw.) – auch bei gleicher Adresse wie beim letzten Mal
  let fresh = true;
  let scrollTo = null; // Block, zu dem nach dem nächsten Zeichnen gescrollt wird
  window.addEventListener('hashchange', () => { fresh = true; });
  App.route('/hoeren', (view, p, q) => {
    const first = fresh;
    fresh = false;
    const anchors = first ? [] : visibleAnchors(view);
    const tab = ((q && q.zu) || App.parseHash().query.zu) === 'shun' ? 'shun' : '';
    view.innerHTML = `<div class="${SEC.cls} hoeren">${App.pageHead(SEC, 'Deine Hör-Kette für jeden Tag und Shuns Podcast zur Genki-Grammatik.')}${halves()}${tabs(tab)}${tab ? shun() : chain()}</div>`;
    view.querySelectorAll('details[data-fold]').forEach((d) => d.addEventListener('toggle', () => {
      const key = d.dataset.fold;
      // „toggle“ kommt auch für Blöcke, die schon offen gezeichnet wurden – nur echtes Auf-/Zuklappen merken
      if (d.open === d.hasAttribute('data-drawn-open')) return;
      d.toggleAttribute('data-drawn-open', d.open);
      fold[key] = d.open;
      const box = d.querySelector('.hr-rows');
      if (d.open && !box.innerHTML && lazy[key]) box.innerHTML = lazy[key]();
    }));
    // Lektions-Kästchen und Etappen: Block aufklappen, falls nötig den Reiter wechseln, und hinscrollen
    const openBlock = (key, zu) => {
      fold[key] = true;
      scrollTo = key;
      if (zu !== tab) App.setQuery({ zu }); else App.render(true);
    };
    view.querySelectorAll('[data-hr-lesson]').forEach((b) => b.addEventListener('click', () => openBlock('g' + b.dataset.hrLesson, 'shun')));
    view.querySelectorAll('[data-hr-stage]').forEach((b) => b.addEventListener('click', () => openBlock('c' + b.dataset.hrStage, '')));
    // erst nach App.render, das danach noch die alte Scrollhöhe setzt
    if (scrollTo) {
      const key = scrollTo;
      scrollTo = null;
      requestAnimationFrame(() => { const d = document.querySelector(`details[data-fold="${key}"]`); if (d) d.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    } else if (anchors.length) requestAnimationFrame(() => restore(view, anchors));
  });
})(window.App);
