/* Nihongo Techō – Tutorial: geführte Tour (Abdunkelung, Rahmen ums Ziel, Sprechblase). Texte: tour-steps.js, Logik: tour-logic.js */
'use strict';
(function (App) {
  const { $, esc } = App;
  const L = App.tourLogic;
  const PAD = 6;            // Luft zwischen Ziel und Rahmen
  const MOBILE = 860;       // darunter liegt die Seitenleiste verborgen (css/app.css)
  const BACKUP = ['sicherungOrdner', 'sicherungIpad', 'sicherungAndroid', 'sicherungHand'];
  const NO_ROUND = ['start', 'rundgang', 'hinweis', 'erweiterung'].concat(BACKUP); // ohne „Ganzen Rundgang zeigen“ am Ende
  const HOME = { erweiterung: '/einstellungen' };          // Touren, die auf einer bestimmten Seite laufen
  BACKUP.forEach((k) => (HOME[k] = '/einstellungen'));

  // „sicherung“ heißt: die Sicherungs-Hilfe für dieses Gerät
  const resolve = (key) => {
    if (key !== 'sicherung') return key;
    const W = App.welcomeLogic;
    let os = 'other';
    try { if (W && W.env) os = W.env({ ua: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints }).os; } catch (e) { /* bleibt other */ }
    return L.backupTourKey({ os, folder: !!(App.backup && App.backup.supported && App.backup.supported()) });
  };

  let cur = null;      // laufende Tour
  let pending = null;  // Tour, die nach dem Seitenwechsel startet

  // erstes sichtbares Element; in der Seitenleiste zählt auch ein verborgenes (sie wird für den Schritt geöffnet)
  const find = (sel) => {
    let all;
    try { all = [...document.querySelectorAll(sel)]; } catch (e) { return null; }
    return all.find((el) => el.getClientRects().length || el.closest('#sidebar')) || null;
  };

  // Seitenleiste für einen Schritt öffnen. Am PC bleibt sie bis zum Ende der Tour offen (kein Hin und Her),
  // am Handy liegt sie über der Seite und geht für Schritte außerhalb wieder zu.
  const sidebar = (open) => {
    const b = document.body.classList;
    if (open) { b.remove('sidebar-collapsed'); if (window.innerWidth <= MOBILE) b.add('sidebar-open'); }
    else b.toggle('sidebar-open', cur.sb.open);
  };
  const restoreSidebar = (c) => {
    const b = document.body.classList;
    b.toggle('sidebar-collapsed', c.sb.collapsed);
    b.toggle('sidebar-open', c.sb.open);
  };

  const place = () => {
    if (!cur) return;
    const { ring, bubble, block } = cur.els;
    const step = cur.steps[cur.i];
    const el = step.target ? find(step.target) : null;
    let rect = null;
    if (el) {
      let r = el.getBoundingClientRect();
      // „until“: der Rahmen reicht vom Ziel bis zu einem zweiten Element (z. B. vier Menüpunkte, zwei Radierer)
      const end = step.until ? find(step.until) : null;
      if (end) {
        const e = end.getBoundingClientRect();
        const left = Math.min(r.left, e.left), top = Math.min(r.top, e.top);
        r = { left, top, width: Math.max(r.right, e.right) - left, height: Math.max(r.bottom, e.bottom) - top };
      }
      rect = { left: r.left - PAD, top: r.top - PAD, width: r.width + 2 * PAD, height: r.height + 2 * PAD };
      Object.assign(ring.style, { left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' });
    }
    ring.hidden = !el;
    block.classList.toggle('dim', !el);
    const pos = L.placeBubble(rect, { width: bubble.offsetWidth, height: bubble.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }, step.place);
    bubble.style.left = pos.left + 'px';
    bubble.style.top = pos.top + 'px';
  };

  // Schritt zeigen; ist sein Ziel inzwischen verschwunden, in Laufrichtung weitergehen
  const show = (i, dir = 1) => {
    while (i >= 0 && i < cur.steps.length && cur.steps[i].target && !find(cur.steps[i].target)) i += dir;
    if (i < 0) return show(0, 1);
    if (i >= cur.steps.length) return stop();
    cur.i = i;
    const step = cur.steps[i], n = cur.steps.length, last = i === n - 1;
    const choices = last && step.choices ? step.choices : null; // Auswahl statt „Weiter“ (Tour „start“)
    const link = choices ? null : last ? step.link || (NO_ROUND.includes(cur.key) ? null : { label: 'Ganzen Rundgang zeigen', tour: 'rundgang' }) : null;
    cur.link = link;
    cur.els.bubble.innerHTML = `<button class="tour-x" data-t="x" aria-label="Hilfe schließen">×</button>
      ${step.title ? `<b class="tour-title">${esc(step.title)}</b>` : ''}
      <p>${esc(step.text)}</p>
      ${link ? `<button class="tour-link" data-t="link">${esc(link.label)}</button>` : ''}
      ${choices ? `<div class="tour-foot tour-choices">${choices.map((c, k) => `<button class="btn btn-sm ${k === choices.length - 1 ? 'btn-primary' : 'btn-ghost'}" data-t="choice" data-i="${k}">${esc(c.label)}</button>`).join('')}</div>`
        : `<div class="tour-foot">${n > 1 ? `<span class="tour-count">${i + 1} von ${n}</span>` : ''}<span class="grow"></span>
        ${i > 0 ? '<button class="btn btn-sm btn-ghost" data-t="back">Zurück</button>' : ''}
        <button class="btn btn-sm btn-primary" data-t="next">${last ? 'Fertig' : 'Weiter'}</button></div>`}`;
    const el = step.target ? find(step.target) : null;
    const inSidebar = !!(el && el.closest('#sidebar'));
    sidebar(inSidebar);
    if (el && !inSidebar) {
      const r = el.getBoundingClientRect();
      // hohe Ziele (ganze Karten) an ihren Anfang rollen, sonst läge die Überschrift über dem Fensterrand
      if (r.height > window.innerHeight * 0.6) window.scrollBy(0, r.top - 90);
      else if (r.top < 70 || r.bottom > window.innerHeight - 20) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }
    place();
    // die Seitenleiste fährt mit einer kurzen Bewegung auf – danach noch einmal ausrichten
    clearTimeout(cur.timer);
    cur.timer = setTimeout(place, 260);
    const next = cur.els.bubble.querySelector('[data-t="next"]') || cur.els.bubble.querySelector('.btn-primary[data-t="choice"]');
    if (next) next.focus({ preventScroll: true });
  };

  const onKey = (e) => {
    if (!cur || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Tab' || /^F\d+$/.test(e.key)) return;
    // die Kürzel der App (n, /) dürfen während der Tour nichts öffnen
    e.stopPropagation();
    // Enter/Leertaste auf einem Knopf der Blase (Zurück, ✕, Link) drückt genau diesen Knopf
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('.tour-bubble button:not([data-t="next"])')) return;
    e.preventDefault();
    if (e.key === 'Escape') stop();
    else if (cur.steps[cur.i].choices) return; // eine Auswahl wird nicht mit Pfeil oder Enter übersprungen
    else if (e.key === 'ArrowRight' || e.key === 'Enter') show(cur.i + 1, 1);
    else if (e.key === 'ArrowLeft') show(cur.i - 1, -1);
  };
  let raf = 0;
  const onMove = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(place); };

  const onClick = (e) => {
    // Klicks bleiben in der Tour (sonst klappt main.js die Seitenleiste zu)
    e.stopPropagation();
    const b = e.target.closest('[data-t]');
    if (!b || !cur) return;
    const t = b.dataset.t;
    if (t === 'x') stop();
    else if (t === 'next') show(cur.i + 1, 1);
    else if (t === 'back') show(cur.i - 1, -1);
    else if (t === 'link') { const to = cur.link.tour; stop(); start(to); }
    else if (t === 'choice') {
      const c = cur.steps[cur.i].choices[+b.dataset.i];
      cur.opts = {}; // gewählt ist nicht abgebrochen: kein onEnd
      stop();
      start(c.tour, c.resume ? { onEnd: resumeBar } : {});
    }
  };

  const stop = () => {
    if (!cur) return;
    const c = cur;
    clearTimeout(c.timer);
    restoreSidebar(c);
    $('#sidebar').removeEventListener('transitionend', onMove);
    Object.values(c.els).forEach((el) => el.remove());
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', onMove);
    window.removeEventListener('scroll', onMove, true);
    cur = null;
    c.opts.onEnd && c.opts.onEnd();
  };

  const start = (key, opts = {}) => {
    key = resolve(key);
    const all = App.TOURS[key];
    if (cur || !all) return false;
    const path = App.parseHash().path;
    if (HOME[key] && path !== HOME[key]) { pending = { key, opts }; App.go('#' + HOME[key]); return true; }
    let steps = L.visibleSteps(all, (sel) => !!find(sel));
    if (!steps.length) steps = [{ text: 'Auf dieser Seite gibt es gerade nichts zu zeigen.' }];
    const mk = (cls) => { const d = document.createElement('div'); d.className = cls; $('#overlay-root').appendChild(d); return d; };
    const els = { block: mk('tour-block'), ring: mk('tour-ring'), bubble: mk('tour-bubble') };
    els.bubble.setAttribute('role', 'dialog');
    els.bubble.setAttribute('aria-live', 'polite');
    els.block.addEventListener('click', onClick);
    els.bubble.addEventListener('click', onClick);
    const b = document.body.classList;
    cur = { key, steps, i: 0, els, opts, path, sb: { collapsed: b.contains('sidebar-collapsed'), open: b.contains('sidebar-open') } };
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', onMove);
    window.addEventListener('scroll', onMove, true);
    $('#sidebar').addEventListener('transitionend', onMove);
    show(0);
    return true;
  };

  // Nach der Sicherungs-Hilfe beim ersten Start: Leiste unten, bis die Sicherung eingerichtet ist – dann weiter zum Rundgang
  const resumeBar = () => {
    if ($('.tour-resume')) return;
    const d = document.createElement('div');
    d.className = 'tour-resume';
    d.setAttribute('role', 'status');
    d.innerHTML = '<span>Sicherung eingerichtet?</span><button class="btn btn-sm btn-primary" data-go>Weiter mit dem Rundgang</button><button class="tour-x" data-x aria-label="Leiste schließen">×</button>';
    d.querySelector('[data-go]').onclick = (e) => { e.stopPropagation(); d.remove(); start('rundgang'); };
    d.querySelector('[data-x]').onclick = (e) => { e.stopPropagation(); d.remove(); };
    $('#overlay-root').appendChild(d);
  };

  // Erster Start, direkt nach dem Willkommensbrief (hallo.js): Tutorial beginnt mit der Sicherung.
  // Mit ✕ weggeklickt: nur der Hinweis, wo die Hilfe liegt. Nicht in In-App-Browsern (dort bleibt nichts gespeichert).
  const firstRun = () => {
    App.saveSettings({ tourAsked: true });
    if (inAppBrowser()) return;
    start('start', { onEnd: () => start('hinweis') });
  };

  // ---------- Frage beim ersten Start ----------
  let asking = false, askTimer = 0;
  const inAppBrowser = () => {
    // Erkennung kommt aus „Einfach verteilen“ (welcome-logic.js); ohne sie gilt: kein In-App-Browser
    const W = App.welcomeLogic;
    if (!W || !W.env) return false;
    try {
      return !!W.env({ ua: navigator.userAgent, standalone: window.matchMedia('(display-mode: standalone)').matches, hasPrompt: false, maxTouchPoints: navigator.maxTouchPoints }).inApp;
    } catch (e) { return false; }
  };
  const askOnce = () => {
    const busy = asking || !!cur || !!$('.modal-back') || !!$('.viewer');
    const setup = !!(App.welcome && App.welcome.card());
    if (!L.shouldAsk({ asked: !!App.store.settings.tourAsked, path: App.parseHash().path, busy, inApp: inAppBrowser(), setup })) return;
    asking = true;
    // sofort merken – auch wer jetzt neu lädt, wird nicht noch einmal gefragt
    App.saveSettings({ tourAsked: true });
    let go = false;
    const md = App.modal({
      title: 'Willkommen bei Nihongo Techō',
      body: '<p style="margin:0">Möchtest du einen kurzen Rundgang? Er dauert unter einer Minute.</p>',
      foot: '<button class="btn" data-no>Jetzt nicht</button><button class="btn btn-primary" data-ok autofocus>Rundgang starten</button>',
      onClose: () => { asking = false; start(go ? 'rundgang' : 'hinweis'); },
    });
    md.el.querySelector('[data-ok]').onclick = () => { go = true; md.close(); };
    md.el.querySelector('[data-no]').onclick = () => md.close();
  };

  const askSoon = () => { if (!App.store.settings.tourAsked) { clearTimeout(askTimer); askTimer = setTimeout(askOnce, 600); } };

  // Seite gewechselt: Tour beenden. Nur neu gezeichnet (z. B. Abgleich im Hintergrund): Schritt neu ausrichten.
  App.onChange((w) => {
    if (w !== 'route') return;
    const path = App.parseHash().path;
    if (cur) { if (path !== cur.path) stop(); else show(cur.i); }
    if (pending && !cur) {
      const p = pending; pending = null;
      // erst nach dem Zeichnen starten: render() rollt nach dem Melden des Seitenwechsels noch nach oben
      if (path === HOME[p.key]) setTimeout(() => { if (!cur) start(p.key, p.opts); }, 0);
    }
    // kurz nach dem Anzeigen der Startseite fragen (auch wenn man zuerst auf einer Unterseite gelandet ist)
    askSoon();
  });

  // Knöpfe auf den Seiten, die eine bestimmte Tour starten (z. B. „So geht's“ in der Erweiterungs-Karte)
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tour]');
    if (b) start(b.dataset.tour);
  });

  App.tour = {
    start, stop, askOnce, askSoon, firstRun,
    active: () => !!cur,
    startForPage: () => start(L.tourKeyFor(App.parseHash().path)),
  };
})(window.App);
