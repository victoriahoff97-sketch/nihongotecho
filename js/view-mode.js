/* Nihongo Techō – Handy-Ansicht: Modus pro Gerät, Schalter „Ansicht: Handy | Standard“ im ☰-Menü
   Gemerkt in localStorage „nt-viewMode“ (nicht in den Einstellungen: Backup/Übertragung stellt das Tablet nicht um).
   body.view-narrow = schmaler Bildschirm (Schalter sichtbar), body.view-handy = Handy-Ansicht aktiv. */
'use strict';
(function (App) {
  const V = App.viewModeLogic;
  const body = document.body;
  const saved = () => App.lsGet('viewMode');
  let cur = null;
  // matchMedia statt innerWidth: gleiche Grenze wie das CSS, und beim Laden im Hintergrund ist innerWidth manchmal 0
  const mq = window.matchMedia('(max-width: ' + V.NARROW + 'px)');
  const width = () => (mq.matches ? V.NARROW : V.NARROW + 1);

  const apply = () => {
    const narrow = mq.matches;
    const m = V.mode(width(), saved());
    body.classList.toggle('view-narrow', narrow);
    body.classList.toggle('view-handy', m === 'handy');
    document.querySelectorAll('[data-view-switch] [data-view]').forEach((b) => {
      const on = b.dataset.view === (saved() === 'standard' ? 'standard' : 'handy');
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
    });
    const changed = cur !== null && cur !== m;
    cur = m;
    return changed;
  };

  App.viewMode = {
    current: () => cur || V.mode(width(), saved()),
    set: (m) => {
      App.lsSet('viewMode', m === 'standard' ? 'standard' : 'handy');
      const open = body.classList.contains('sidebar-open');
      if (apply() && V.rerenderOnSwitch(App.parseHash().path)) App.render(false);
      if (open) body.classList.add('sidebar-open'); // Menü bleibt offen, man sieht den Wechsel dahinter
      renderBar();
    },
  };

  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-view-switch] [data-view]');
    if (b) App.viewMode.set(b.dataset.view);
  });
  // Leiste unten: die ersten fünf Bereiche aus dem Menü (Start, Grammatik, Vokabeln, Kanji, Ausdrücke) mit deren Symbol und Farbe
  const bar = document.getElementById('handy-bar');
  const renderBar = () => {
    if (!bar) return;
    const path = App.parseHash().path;
    const show = cur === 'handy' && !V.barHidden(path);
    bar.hidden = !show;
    body.classList.toggle('has-handy-bar', show);
    if (!show || !App.NAV) return;
    bar.innerHTML = App.NAV.filter(Boolean).slice(0, 5).map(([ic, label, href, cls]) => {
      const on = V.barActive(path, href.slice(1));
      return `<a class="hb-item ${cls}${on ? ' on' : ''}" href="${href}"${on ? ' aria-current="page"' : ''}><span class="hb-dot">${App.icon(ic)}</span><span class="hb-lbl">${App.esc(label)}</span></a>`;
    }).join('');
  };
  App.onChange((what) => { if (what === 'route') renderBar(); }); // kein eigenes Ereignis: App.emit mit anderem Namen zeichnet die Seite neu und gilt als Datenänderung (main.js, backup.js)

  const onWidth = () => { if (!apply()) return; if (V.rerenderOnSwitch(App.parseHash().path)) App.render(true); renderBar(); };
  if (mq.addEventListener) mq.addEventListener('change', onWidth); else mq.addListener(onWidth);
  apply();
})(window.App);
