/* Nihongo Techō – Start, Navigation, Design, Tastenkürzel */
'use strict';
(function (App) {
  const { $, $$, esc, icon } = App;

  const NAV = [
    ['home', 'Start', '#/', 'sec-home', '家'],
    null,
    ['grammar', 'Grammatik', '#/grammatik', 'sec-grammar', '文法'],
    ['vocab', 'Vokabeln', '#/vokabeln', 'sec-vocab', '単語'],
    ['kanji', 'Kanji', '#/kanji', 'sec-kanji', '漢字'],
    null,
    ['phrase', 'Ausdrücke', '#/ausdruecke', 'sec-phrase', '表現'],
    ['copy', 'Gleichklang', '#/gleichklang', 'sec-homophone', '同音'],
    null,
    ['practice', 'Üben', '#/ueben', 'sec-practice', '練習'],
    ['edit', 'Anwenden', '#/anwenden', 'sec-apply', '使'],
    ['session', 'Unterricht', '#/unterricht', 'sec-session', '授業'],
    ['library', 'Bibliothek', '#/bibliothek', 'sec-library', '資料'],
  ];
  // Die Lernlandkarte hängt an der Grammatik (Knopf dort); Pakete und Einstellungen stehen als Symbole in der Fußzeile
  const ALSO = { '/grammatik': ['/karte'] };
  const renderNav = () => {
    const path = App.parseHash().path;
    const due = App.dueCount();
    $('#nav').innerHTML = NAV.map((n) => {
      if (!n) return '<div class="nav-sep"></div>';
      const [ic, label, href, cls, jp] = n;
      const base = href.slice(1);
      const active = base === '/' ? path === '/' : path === base || path.startsWith(base + '/') || (ALSO[base] || []).includes(path);
      const extra = ic === 'practice' && due ? `<span class="badge count">${due}</span>` : `<span class="jp-mini">${jp}</span>`;
      return `<a class="nav-link ${cls} ${active ? 'active' : ''}" href="${href}" title="${label}"><span class="dot">${icon(ic)}</span><span class="lbl">${label}</span>${extra}</a>`;
    }).join('');
    $$('.foot-btn[href]').forEach((a) => a.classList.toggle('active', path === a.getAttribute('href').slice(1)));
  };
  // Geparkte Kartenrunde (practice.js): Leiste unter der Kopfzeile führt von jeder anderen Seite zurück zur offenen Karte
  const renderPark = () => {
    const p = App.parkedRound(), bar = $('#park-bar');
    const show = !!p && !App.parkLogic.same(p, location.hash);
    bar.hidden = !show;
    bar.innerHTML = show ? `<a class="btn btn-sm btn-primary" href="${esc(p.hash)}">${icon('back')} Weiter wiederholen · ${App.parkLogic.label(p)}</a><button class="icon-btn" data-park-drop title="Runde nicht fortsetzen" aria-label="Runde nicht fortsetzen">×</button>` : '';
  };
  App.afterRender = () => { renderNav(); renderPark(); document.body.classList.remove('sidebar-open'); App.emit('route'); };

  App.applyTheme = () => {
    const t = App.store.settings.theme;
    const dark = t === 'dark' || (t === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const b = $('[data-action="toggle-theme"]');
    if (b) b.innerHTML = icon(dark ? 'sun' : 'moon');
  };

  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-park-drop]')) { App.dropParked(); renderPark(); return; }
    const a = e.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    if (act === 'quick-add') App.quickAdd();
    if (act === 'toggle-theme') { const dark = document.documentElement.dataset.theme === 'dark'; App.saveSettings({ theme: dark ? 'light' : 'dark' }).then(App.applyTheme); }
    if (act === 'toggle-sidebar') { document.body.classList.toggle('sidebar-collapsed'); App.saveSettings({ sidebarCollapsed: document.body.classList.contains('sidebar-collapsed') }); }
    if (act === 'open-sidebar') document.body.classList.toggle('sidebar-open');
    if (act === 'help') App.tour.startForPage();
    if (act === 'back') history.back();
  });
  document.addEventListener('keydown', (e) => {
    const typing = e.target.matches('input, textarea, select, [contenteditable="true"]');
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#global-search').focus(); $('#global-search').select(); }
    if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && !$('.modal-back') && !$('.viewer') && !$('.ink-embed')) {
      if (e.key === '/') { e.preventDefault(); $('#global-search').focus(); }
      if (e.key === 'n') { e.preventDefault(); App.quickAdd(); }
    }
  });
  document.addEventListener('click', (e) => { if (document.body.classList.contains('sidebar-open') && !App.tour.active() && !e.target.closest('#sidebar') && !e.target.closest('[data-action="open-sidebar"]')) document.body.classList.remove('sidebar-open'); });

  // Bei Datenänderungen die aktuelle Ansicht neu zeichnen (außer während man tippt)
  let pending = false;
  App.onChange((w) => {
    if (w === 'route' || w === 'backup') return; // Sicherungs-Status frischt sich selbst auf (backup.js)
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      if ($('.modal-back') || $('.viewer') || $('.ink-embed')) { renderNav(); return; }
      const ae = document.activeElement;
      if (ae && ae.closest && ae.closest('.rte, [data-setup], .ex-card, .flash-stage')) { renderNav(); return; }
      // laufende Übungs- oder Einstufungsrunde nicht von vorn beginnen (z. B. WaniKani-Abgleich im Hintergrund)
      if ($('#view [data-stage]:not(:empty)')) { renderNav(); return; }
      App.render(true);
    }, 60);
  });
  // Zurück-Taste oben: jede Seite trägt ihre Schrittnummer im Verlaufseintrag, auf der ersten Seite ist der Knopf grau
  let navIdx = App.navLogic.boot(history.state);
  const markNav = () => {
    try { if (App.navLogic.read(history.state) !== navIdx) history.replaceState(App.navLogic.stamp(history.state, navIdx), ''); } catch (e) { /* egal */ }
    const b = $('[data-action="back"]');
    if (b) b.disabled = !App.navLogic.canBack(navIdx);
  };
  markNav();
  window.addEventListener('hashchange', () => { navIdx = App.navLogic.step(history.state, navIdx); markNav(); });
  // Einladungslink in eine schon offene Seite eingefügt: erst verarbeiten (Code aus der Adresse nehmen), dann zeichnen
  window.addEventListener('hashchange', async (ev) => {
    // Herkunft einer Lernrunde merken (vor dem Zeichnen: die Scroll-Position der alten Seite steht noch)
    const old = ev.oldURL && ev.oldURL.includes('#') ? ev.oldURL.slice(ev.oldURL.indexOf('#')) : '';
    const { origin, restore } = App.originLogic.step(App.origin(), old, location.hash, window.scrollY);
    App.setOrigin(origin);
    try { if (App.invite && App.inviteLogic && App.inviteLogic.read(location.hash)) await App.invite.boot(); } catch (e) { /* boot wirft nie */ }
    App.render();
    // zurück von der Lernrunde: wieder an dieselbe Stelle der Seite
    if (restore != null) { window.scrollTo(0, restore); requestAnimationFrame(() => window.scrollTo(0, restore)); }
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => App.applyTheme());

  (async () => {
    App.hydrateIcons();
    try {
      await App.load();
    } catch (e) {
      console.error(e);
      if (App.invite) App.invite.clean(); // den Code auch hier nicht in der Adresse stehen lassen
      $('#view').innerHTML = `<div class="card"><h3>Speicher nicht verfügbar</h3><p>Dein Browser erlaubt keinen lokalen Speicher (IndexedDB). Bitte öffne die App in Microsoft Edge oder Chrome und nicht im privaten Modus.</p><pre class="small">${esc(e.message || e)}</pre></div>`;
      return;
    }
    try { await App.lernwegMigrate(); } catch (e) { console.error(e); } // einmaliger Umzug auf den gemeinsamen Lernweg (js/vocabcheck.js)
    try { await App.wkKanjiMigrate(); } catch (e) { console.error(e); } // einmalig: WaniKani-Kanji nicht mehr zum Lesen (js/vocabcheck.js)
    if (App.store.settings.sidebarCollapsed) document.body.classList.add('sidebar-collapsed');
    App.applyTheme();
    App.initSearch();
    // Einladungslink (#freischalten=…) verarbeiten und Adresse bereinigen – vor dem ersten Zeichnen, wirft nie
    if (App.invite) await App.invite.boot();
    // Teilen-Menü (?text=…&url=…) in die Eingangs-Adresse umsetzen – synchron, wirft nie
    if (App.inbox) App.inbox.bootShare();
    App.render();
    // eigene Vokabeln ohne Beispielsatz aus dem Satz-Index der Pakete auffüllen (einmal je Index-Version)
    if (App.exampleBackfill) App.exampleBackfill().catch((e) => console.error(e));
    // Kleines Wörterbuch beim ersten Web-Start von selbst laden (nicht abgewartet)
    if (App.welcome) App.welcome.autoDict();
    // Ordner-Sicherung anschließen – ein Fehler hier darf den Start nie verhindern
    App.backup.init().catch((e) => console.error('Sicherung: Start fehlgeschlagen', e));
    // PDF-Texte für die Suche im Hintergrund einlesen (nach dem ersten Anzeigen)
    setTimeout(() => App.pdfText.backfill(), 1500);
    setTimeout(() => App.wk.autoSync(), 2500);
  })();
})(window.App);
