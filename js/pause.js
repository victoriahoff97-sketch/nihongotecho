/* Nihongo Techō – Lernschlange pausieren: Symbol „verpasste Tage überspringen“ im Startkasten und Urlaubsmodus (Einstellungen) */
'use strict';
(function (App) {
  const S = App.store, P = App.pauseLogic, W = App.writeLogic;
  const esc = (s) => App.esc(s);
  const icon = (n) => App.icon(n);
  const WD = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dateLabel = (t) => new Date(t).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  const dayWord = (n) => (n === 1 ? '1 Tag' : `${n} Tage`);
  const cardWord = (n) => (n === 1 ? '1 Karte' : `${n} Karten`);

  const recs = () => Array.from(S.srs.values());
  const focus = () => W.focus(S.settings);
  const dueBy = (map) => (t) => W.dueCount(map, S.items, focus(), t);
  const vac = () => (S.settings || {}).vacation; // settings fehlt kurz vor dem Laden (visibilitychange beim Neuladen)

  const pause = App.pause = {};
  pause.vacation = () => (P.active(vac()) ? vac() : null);

  // Verpasste Tage (im Urlaub nie – da ruht die Lernschlange ohnehin)
  pause.missed = (now = Date.now()) => (pause.vacation() ? { n: 0, from: 0 } : P.missed(recs(), now, S.settings.srsAnchor || 0, dueBy(S.srs)));

  // Verschieben und speichern; liefert den Stand vorher (für „Rückgängig“)
  async function shift(n, now) {
    const changed = P.shift(recs(), n, now);
    const snap = App.srsSnap(changed.map((s) => s.id));
    changed.forEach((s) => S.srs.set(s.id, s));
    if (changed.length) await App.db.putMany('srs', changed);
    if (App.backup && App.backup.noteChange) App.backup.noteChange();
    return snap;
  }

  // ---------- Symbol im Startkasten ----------
  pause.button = () => {
    const m = pause.missed();
    if (!m.n) return '';
    const t = `${dayWord(m.n)} verpasst – überspringen, als wärst du dabei gewesen`;
    return `<button class="fc-btn skip-btn" data-skipdays title="${t}" aria-label="${t}">${icon('rewind')}<span class="skip-dot"></span></button>`;
  };

  // auto: von selbst beim Öffnen der App angeboten (pause.boot) – sonst über das Rückspul-Symbol
  pause.skipModal = ({ auto } = {}) => {
    const now = Date.now(), m = pause.missed(now);
    if (!m.n) { if (!auto) App.toast('Du hast keinen Tag verpasst.'); return; }
    const changed = P.shift(recs(), m.n, now);
    const after = new Map(S.srs); changed.forEach((s) => after.set(s.id, s));
    const end = P.dayEnd(now);
    const heroDue = App.todayParts().reduce((a, x) => a + x.n, 0);
    const less = W.dueCount(S.srs, S.items, focus(), end) - W.dueCount(after, S.items, focus(), end);
    const left = Math.max(0, heroDue - less);
    const since = m.n === 1 ? 'gestern' : `seit ${WD[new Date(m.from).getDay()]}`;
    const like = WD[new Date(m.from).getDay()];
    if (auto && left >= heroDue) return; // Überspringen brächte nichts – dann gar nicht erst fragen
    const md = App.modal({
      title: auto ? `Willkommen zurück – ${dayWord(m.n)} Pause` : 'Verpasste Tage überspringen?',
      body: `<p>Du hast ${since} nicht wiederholt (${dayWord(m.n)}). Gerade sind <b>${cardWord(heroDue)}</b> fällig.</p>
        <p>Überspringst du die verpassten Tage, rückt alles ${dayWord(m.n)} nach hinten – heute ist dann wie ${m.n === 1 ? 'gestern' : like} und es sind nur noch <b>${cardWord(left)}</b>.</p>
        <p class="muted small">Was du heute schon wiederholt hast, bleibt, wie es ist. Danach kannst du es 8 Sekunden lang rückgängig machen${auto ? ' – und später geht es jederzeit über das Rückspul-Symbol im blauen Kasten' : ''}.</p>`,
      foot: `<button class="btn" data-no>${auto ? `Nein, alle ${heroDue} machen` : 'Abbrechen'}</button><button class="btn btn-primary" data-ok>${dayWord(m.n)} überspringen</button>`,
    });
    md.el.querySelector('[data-no]').onclick = () => md.close();
    md.el.querySelector('[data-ok]').onclick = async () => {
      md.close();
      const prevAnchor = S.settings.srsAnchor || 0;
      const snap = await shift(m.n, now);
      await App.saveSettings({ srsAnchor: P.addDays(P.dayStart(now), -1) }, { silent: true });
      App.render(true);
      App.undoToast(`${dayWord(m.n)} übersprungen – weiter wie ${m.n === 1 ? 'gestern' : like}`, snap, async () => {
        await App.saveSettings({ srsAnchor: prevAnchor }, { silent: true });
        App.render(true);
      });
    };
  };
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-skipdays]')) pause.skipModal(); });

  // Beim Öffnen der App (und wenn sie über Nacht offen war): verpasste Tage von selbst anbieten – einmal am Tag,
  // nur auf der Startseite und erst, wenn kein anderes Fenster (Willkommensbrief, Neuigkeiten, Tour) offen ist.
  const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  let bootTimer = 0;
  pause.boot = (delay = 2500, tries = 15) => {
    clearTimeout(bootTimer);
    bootTimer = setTimeout(() => {
      if (!S.settings || App.lsGet('skipAsked') === dayKey()) return;
      if (!pause.missed().n) return;
      const home = !location.hash || location.hash === '#' || location.hash === '#/';
      const busy = document.querySelector('.modal-back, .viewer, .mh-show, .flash-stage') || (App.tour && App.tour.active && App.tour.active());
      if (!home || busy) { if (tries > 1) pause.boot(2000, tries - 1); return; }
      App.lsSet('skipAsked', dayKey());
      pause.skipModal({ auto: true });
    }, delay);
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pause.boot(); });

  // ---------- Urlaubsmodus ----------
  // Beim Öffnen (und wenn die App über Nacht offen war) die Urlaubstage nachholen; endet am Rückkehrtag von selbst
  let busy = false;
  pause.tick = async ({ quiet } = {}) => { // quiet: beim Start, vor dem ersten Zeichnen
    const v = pause.vacation();
    if (!v || busy) return;
    const now = Date.now(), r = P.catchUp(v, now);
    if (!r.n && r.vac) return;
    busy = true;
    try {
      if (r.n) await shift(r.n, now);
      // Ist der Urlaub vorbei, den Zeitraum für die Flammen merken (letzter Urlaubstag = Tag vor der Rückkehr)
      const patch = r.vac ? { vacation: r.vac } : { vacation: null, srsAnchor: r.anchor, vacationLog: P.appendLog(S.settings.vacationLog, P.closedRange(v, P.addDays(v.until, -1))) };
      await App.saveSettings(patch, { silent: true });
      if (!r.vac) App.toast('Willkommen zurück! Der Urlaubsmodus ist vorbei – die Lernschlange macht da weiter, wo du aufgehört hast.', { ms: 7000 });
      if (!quiet) App.render(true);
    } finally { busy = false; }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pause.tick().catch((e) => console.error(e)); });

  pause.start = async (until) => {
    await App.saveSettings({ vacation: P.start(Date.now(), until || 0) });
    App.render(true);
    App.toast('Urlaubsmodus an – ab jetzt wird nichts mehr neu fällig. Schönen Urlaub!');
  };
  pause.finish = async () => {
    const v = pause.vacation();
    if (!v) return;
    const now = Date.now(), r = P.finish(v, now);
    if (r.n) await shift(r.n, now);
    // Zeitraum für die Flammen merken (letzter Urlaubstag = r.anchor)
    await App.saveSettings({ vacation: null, srsAnchor: r.anchor, vacationLog: P.appendLog(S.settings.vacationLog, P.closedRange(v, r.anchor)) });
    App.render(true);
    App.toast('Urlaubsmodus aus – die Lernschlange macht da weiter, wo du aufgehört hast.');
  };

  const untilText = (v) => (v.until ? ` · wieder da am ${dateLabel(v.until)}` : '');

  // Startkasten im Urlaub: statt der Zahlen ein freundlicher Hinweis
  pause.heroText = () => {
    const v = pause.vacation();
    return `${icon('vacation')} Urlaubsmodus${untilText(v)} – die Lernschlange wartet auf dich. Üben kannst du trotzdem jederzeit.`;
  };
  pause.heroButton = () => `<button class="btn" data-vac-end>Urlaub beenden</button>`;
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-vac-end]')) pause.finish(); });

  // Feld in den Einstellungen (Karte „Lernen“)
  pause.settingsField = () => {
    const v = pause.vacation();
    if (v) {
      return `<div class="field vac-field"><label><span>${icon('vacation')} Urlaubsmodus ist an</span></label>
        <p class="muted small">Seit ${dateLabel(v.since)}${v.until ? `, wieder da am ${dateLabel(v.until)}` : ''}. Es wird nichts neu fällig – danach geht es genau da weiter, wo du aufgehört hast.</p>
        <div class="row"><button class="btn btn-sm" data-vac-end>Urlaub beenden</button></div></div>`;
    }
    const min = new Date(P.addDays(Date.now(), 1)), iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return `<div class="field vac-field"><label><span>${icon('vacation')} Urlaubsmodus</span></label>
      <p class="muted small">Für längere Pausen: ab heute wird nichts mehr neu fällig, danach geht es genau da weiter, wo du aufgehört hast. Für einzelne verpasste Tage gibt es das Rückspul-Symbol im blauen Kasten der Startseite.</p>
      <div class="row" style="align-items:flex-end;flex-wrap:wrap"><label class="small muted">Wieder da am (optional)<br><input class="input" type="date" data-vac-until min="${iso(min)}" style="width:auto"></label>
      <button class="btn btn-sm" data-vac-start>${icon('vacation')} Urlaubsmodus starten</button></div></div>`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-vac-start]');
    if (!b) return;
    const f = b.closest('.vac-field'), val = ((f && f.querySelector('[data-vac-until]')) || {}).value;
    pause.start(val ? new Date(val + 'T00:00').getTime() : 0);
  });
})(window.App);
