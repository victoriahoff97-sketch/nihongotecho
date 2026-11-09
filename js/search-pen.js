/* Nihongo Techō – Stift in allen Suchfeldern: kleiner Stift rechts im Feld klappt darunter ein Schreibfeld auf.
   Nach einer Schreibpause erkennt Google (App.hwPad), der beste Vorschlag steht sofort im Feld und die Suche läuft mit;
   die anderen Vorschläge zum Antippen. Neue Suchfelder bekommen den Stift von selbst (MutationObserver). */
'use strict';
(function (App) {
  const { icon, esc } = App;
  // Suchfelder: type="search", Listenfilter, oder per data-pen-search markiert. Das Nachschlagen-Fenster hat seinen eigenen Stift.
  const SEL = 'input[type="search"], input[data-filter], input[data-pen-search]';
  const SKIP = '.lookup-pop, [data-nopen]';
  let panel = null, target = null, pad = null;

  const isField = (el) => el && el.matches && el.matches(SEL) && !el.closest(SKIP);
  const btnFor = (inp) => { const b = inp.nextElementSibling; return b && b.classList.contains('sp-btn') ? b : null; };

  const decorate = (inp) => {
    if (btnFor(inp)) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'icon-btn sm sp-btn' + (inp === target ? ' active' : '');
    b.title = 'Mit dem Stift schreiben';
    b.setAttribute('aria-label', 'Mit dem Stift schreiben');
    b.innerHTML = icon('pen');
    inp.classList.add('sp-has');
    inp.after(b);
  };
  const scan = (root) => {
    if (!root || root.nodeType !== 1) return;
    if (isField(root)) decorate(root);
    root.querySelectorAll && root.querySelectorAll(SEL).forEach((el) => { if (isField(el)) decorate(el); });
  };

  // Text ins Feld setzen und die Suche des Felds anstoßen (alle Suchen hören auf „input“)
  const put = (v) => {
    if (!target || !target.isConnected) return;
    target.value = v;
    target.dispatchEvent(new Event('input', { bubbles: true }));
  };

  const place = () => {
    if (!panel || !target) return;
    if (!target.isConnected) { close(); return; }
    const r = target.getBoundingClientRect(), vw = window.innerWidth;
    const w = Math.min(Math.max(r.width, 300), vw - 16);
    panel.style.width = w + 'px';
    panel.style.left = Math.max(8, Math.min(r.left, vw - w - 8)) + 'px';
    panel.style.top = (r.bottom + 6) + 'px';
    // Hauptsuche oben: die Trefferliste rutscht unter das Schreibfeld
    const wrap = target.id === 'global-search' && target.closest('.search-wrap');
    if (wrap) { wrap.classList.add('sp-open'); wrap.style.setProperty('--sp-h', (panel.offsetHeight + 8) + 'px'); }
  };

  const close = () => {
    if (pad) pad.stop();
    if (panel) panel.remove();
    if (target) {
      const b = btnFor(target); if (b) b.classList.remove('active');
      const wrap = target.closest('.search-wrap'); if (wrap) wrap.classList.remove('sp-open');
    }
    panel = target = pad = null;
  };

  const open = (inp) => {
    close();
    target = inp;
    const b = btnFor(inp); if (b) b.classList.add('active');
    panel = document.createElement('div');
    panel.className = 'sp-panel';
    panel.innerHTML = '<div data-sppad></div><div class="ans-cands sp-cands" hidden></div>';
    document.body.appendChild(panel);
    const cands = panel.querySelector('.sp-cands');
    const msg = (t) => { cands.innerHTML = `<span class="muted small">${esc(t)}</span>`; cands.hidden = false; place(); };
    pad = App.hwPad(panel.querySelector('[data-sppad]'), {
      onMsg: msg,
      onClear: () => { cands.innerHTML = ''; cands.hidden = true; place(); put(''); },
      onResult: (ja) => {
        cands.innerHTML = ja.map((t, i) => `<button type="button" class="chip${i ? '' : ' on'}" data-spcand="${esc(t)}" lang="ja">${esc(t)}</button>`).join('');
        cands.hidden = false;
        place();
        put(ja[0]);
      },
    });
    cands.addEventListener('click', (e) => {
      const c = e.target.closest('[data-spcand]'); if (!c) return;
      cands.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === c));
      put(c.dataset.spcand);
    });
    place();
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest('.sp-btn');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const inp = b.previousElementSibling;
    if (!isField(inp)) return;
    if (target === inp) close(); else open(inp);
  }, true);
  // Tippen daneben schließt; das Feld selbst, sein Stift und das Schreibfeld nicht
  document.addEventListener('pointerdown', (e) => {
    if (!panel) return;
    if (panel.contains(e.target) || e.target === target || e.target.closest('.sp-btn')) return;
    close();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (panel && e.target === target && (e.key === 'Enter' || e.key === 'Escape')) close();
  }, true);
  window.addEventListener('resize', place);
  window.addEventListener('scroll', place, true);
  window.addEventListener('hashchange', close);

  new MutationObserver((muts) => {
    muts.forEach((m) => m.addedNodes.forEach(scan));
    if (target && !target.isConnected) close();
  }).observe(document.body, { childList: true, subtree: true });
  scan(document.body);
})(window.App);
