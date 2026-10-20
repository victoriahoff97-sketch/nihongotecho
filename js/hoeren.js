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
    return `<section class="hr-sec"><h2>Hör-Kette</h2>
      <p class="muted small">Jeden Tag ein Stück von etwa 5 Minuten: erst Chienowa Japanese, dann Nihongo con Teppei. „Ab hier“ setzt die Kette auf ein anderes Stück.</p>
      <div class="hr-now">${L.tile()}</div>${blocks}</section>`;
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
    return `<section class="hr-sec" id="shun"><h2>Japanese with Shun</h2>
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
  window.addEventListener('hashchange', () => { fresh = true; });
  App.route('/hoeren', (view, p, q) => {
    const first = fresh;
    fresh = false;
    const anchors = first ? [] : visibleAnchors(view);
    view.innerHTML =`<div class="${SEC.cls} hoeren">${App.pageHead(SEC, 'Deine Hör-Kette für jeden Tag und Shuns Podcast zur Genki-Grammatik.')}${chain()}${shun()}</div>`;
    view.querySelectorAll('details[data-fold]').forEach((d) => d.addEventListener('toggle', () => {
      const key = d.dataset.fold;
      // „toggle“ kommt auch für Blöcke, die schon offen gezeichnet wurden – nur echtes Auf-/Zuklappen merken
      if (d.open === d.hasAttribute('data-drawn-open')) return;
      d.toggleAttribute('data-drawn-open', d.open);
      fold[key] = d.open;
      const box = d.querySelector('.hr-rows');
      if (d.open && !box.innerHTML && lazy[key]) box.innerHTML = lazy[key]();
    }));
    const zu = (q && q.zu) || App.parseHash().query.zu;
    if (first && zu === 'shun') requestAnimationFrame(() => view.querySelector('#shun').scrollIntoView({ block: 'start' }));
    // erst nach App.render, das danach noch die alte Scrollhöhe setzt
    if (anchors.length) requestAnimationFrame(() => restore(view, anchors));
  });
})(window.App);
